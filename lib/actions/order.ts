"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { notifyOrder } from "@/lib/telegram";
import { priceForSize, productBySlug, techniqueByKey } from "@/lib/catalog";
import { COMPANY } from "@/lib/company";
import { POLICY_VERSION } from "@/lib/legal";
import { headers } from "next/headers";
import { DELIVERY_COST } from "@/lib/delivery";

const LineSchema = z.object({
  slug: z.string().min(1).max(120),
  size: z.string().min(1).max(20),
  qty: z.number().int().min(1).max(20),
});

const OrderSchema = z.object({
  customerName: z.string().trim().min(2, "Как к вам обращаться?").max(120),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{10,20}$/, "Проверьте номер телефона"),
  email: z.union([z.literal(""), z.email("Проверьте адрес почты")]).optional(),
  deliveryType: z.enum(["cdek", "yandex", "post", "pickup"]),
  address: z.string().trim().max(500).optional(),
  comment: z.string().trim().max(1000).optional(),
  // Не z.literal(true): с ним тип входа становится строго true, и клиент,
  // у которого чекбокс — обычный boolean, перестаёт компилироваться.
  consent: z.boolean().refine((v) => v === true, {
    message: "Без согласия мы не можем оформить заказ",
  }),
  lines: z.array(LineSchema).min(1, "Корзина пуста").max(50),
});

export type OrderInput = z.input<typeof OrderSchema>;

export type OrderResult =
  | { ok: true; number: string }
  | { ok: false; errors: Record<string, string>; message?: string };

const DELIVERY_TITLE: Record<string, string> = {
  cdek: "СДЭК, пункт выдачи",
  yandex: "Яндекс Доставка, курьер",
  post: "Почта России",
  pickup: "Самовывоз, Казань",
};

/** R-2309-0042: дата плюс счётчик дня. Человеку легко продиктовать по телефону. */
function orderNumber(seq: number): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `R-${dd}${mm}-${String(seq).padStart(4, "0")}`;
}

export async function createOrder(input: OrderInput): Promise<OrderResult> {
  const parsed = OrderSchema.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      errors[key] ??= issue.message;
    }
    return { ok: false, errors };
  }
  const data = parsed.data;

  // Цены берём из каталога, а не из корзины: присланной клиентом сумме верить нельзя
  const items = data.lines.map((l) => {
    const product = productBySlug(l.slug);
    if (!product) return null;
    return {
      productSlug: product.slug,
      title: `${product.title} — ${techniqueByKey(product.technique).one.toLowerCase()}`,
      size: l.size,
      price: priceForSize(product, l.size),
      qty: l.qty,
    };
  });
  if (items.some((i) => i === null)) {
    return { ok: false, errors: {}, message: "Часть наборов больше не продаётся. Обновите корзину." };
  }
  const lines = items as NonNullable<(typeof items)[number]>[];

  const itemsTotal = lines.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryCost =
    data.deliveryType === "pickup" || itemsTotal >= COMPANY.freeDeliveryFrom ? 0 : DELIVERY_COST;
  const total = itemsTotal + deliveryCost;

  const payload = {
    customerName: data.customerName,
    phone: data.phone,
    email: data.email || null,
    deliveryType: DELIVERY_TITLE[data.deliveryType],
    address: data.address || null,
    comment: data.comment || null,
    itemsTotal,
    deliveryCost,
    total,
  };

  let number = orderNumber(1);

  // Заказ пишется в базу ДО отправки в Telegram: если мессенджер лежит,
  // заказ всё равно не теряется — ошибка уходит в notifyError.
  if (prisma) {
    try {
      const since = new Date();
      since.setHours(0, 0, 0, 0);
      const todayCount = await prisma.order.count({ where: { createdAt: { gte: since } } });
      number = orderNumber(todayCount + 1);

      await prisma.order.create({
        data: {
          ...payload,
          number,
          items: {
            create: lines.map((l) => ({
              productSlug: l.productSlug,
              title: l.title,
              size: l.size,
              price: l.price,
              qty: l.qty,
            })),
          },
        },
      });

      const h = await headers();
      await prisma.consent.create({
        data: {
          kind: "order",
          analytics: false,
          marketing: false,
          policyVersion: POLICY_VERSION,
          ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
          userAgent: h.get("user-agent")?.slice(0, 500) ?? null,
        },
      });
    } catch (e) {
      return {
        ok: false,
        errors: {},
        message:
          "Не удалось сохранить заказ. Позвоните нам: " +
          COMPANY.phone +
          (e instanceof Error ? ` (${e.message})` : ""),
      };
    }
  }

  // Общий предел на уведомление. Каждый вызов Telegram и так ограничен таймаутом,
  // но их в цепочке несколько (getMe, getUpdates, по сообщению на чат), и когда
  // мессенджер недоступен, человек на чекауте ждёт полминуты. Заказ уже в базе,
  // поэтому ждать дольше нескольких секунд незачем: не дошло — пишем в notifyError.
  const report = await Promise.race([
    notifyOrder({ ...payload, number, items: lines }),
    new Promise<{ sent: number; failed: number; skipped: number; details: { error?: string }[] }>(
      (resolve) =>
        setTimeout(
          () => resolve({ sent: 0, failed: 1, skipped: 0, details: [{ error: "Telegram не ответил за 6 с" }] }),
          6000,
        ),
    ),
  ]);

  if (prisma) {
    try {
      await prisma.order.update({
        where: { number },
        data:
          report.sent > 0
            ? { notifiedAt: new Date() }
            : { notifyError: report.details.map((d) => d.error).filter(Boolean).join("; ").slice(0, 500) || "нет чатов" },
      });
    } catch {
      // Заказ уже создан — неудачная отметка об отправке не повод его терять
    }
  }

  return { ok: true, number };
}
