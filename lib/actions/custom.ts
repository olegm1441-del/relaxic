"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { broadcast } from "@/lib/telegram";

const Schema = z.object({
  name: z.string().trim().min(2, "Как к вам обращаться?").max(120),
  contact: z.string().trim().min(5, "Оставьте телефон или почту").max(200),
  technique: z.enum(["PAINT_BY_NUMBERS", "DIAMOND_MOSAIC", "CROSS_STITCH", ""]).optional(),
  size: z.string().trim().max(40).optional(),
  comment: z.string().trim().max(2000).optional(),
});

export type CustomInput = z.input<typeof Schema>;
export type CustomResult =
  | { ok: true }
  | { ok: false; errors: Record<string, string>; message?: string };

export async function submitCustom(input: CustomInput): Promise<CustomResult> {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0] ?? "form")] ??= i.message;
    return { ok: false, errors };
  }
  const d = parsed.data;

  if (prisma) {
    try {
      await prisma.customRequest.create({
        data: {
          name: d.name,
          contact: d.contact,
          technique: d.technique ? d.technique : null,
          size: d.size || null,
          comment: d.comment || null,
        },
      });
    } catch {
      return { ok: false, errors: {}, message: "Не удалось сохранить заявку. Позвоните нам, пожалуйста." };
    }
  }

  // Заявка уже сохранена: сбой мессенджера её не отменяет
  await broadcast(
    [
      "🖼 <b>Заявка на свою картину</b>",
      "",
      `👤 ${d.name}`,
      `📞 ${d.contact}`,
      d.technique ? `🎨 ${d.technique}` : null,
      d.size ? `📐 ${d.size}` : null,
      d.comment ? `💬 ${d.comment}` : null,
    ].filter(Boolean).join("\n"),
  ).catch(() => undefined);

  return { ok: true };
}
