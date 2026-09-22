import { prisma } from "./db";

/**
 * Рассылка заказов в Telegram.
 *
 * ВАЖНОЕ ОГРАНИЧЕНИЕ API, которое определяет всю конструкцию:
 * у Bot API нет метода «перечислить чаты, где состоит бот». Совсем.
 * Единственный способ узнать о чате — поймать апдейт. Когда бота
 * добавляют в группу, прилетает `my_chat_member` — его и ловим.
 *
 * Отсюда две части:
 *   1) syncChats()  — вычитывает апдейты и копит реестр чатов в базе;
 *   2) broadcast()  — шлёт во все чаты реестра, где есть право писать.
 *
 * Реестр живёт в базе, поэтому переживает перезапуски: апдейты
 * Telegram хранит около суток, а нам чат нужен навсегда.
 */

const API = "https://api.telegram.org";
const TIMEOUT_MS = 8000;

function token(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN || null;
}

type TgResult<T> = { ok: true; result: T } | { ok: false; error: string };

async function call<T>(method: string, body?: unknown): Promise<TgResult<T>> {
  const t = token();
  if (!t) return { ok: false, error: "TELEGRAM_BOT_TOKEN не задан" };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API}/bot${t}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
      signal: ctrl.signal,
    });
    const json = (await res.json()) as {
      ok: boolean; result?: T; description?: string;
    };
    if (!json.ok) return { ok: false, error: json.description || `HTTP ${res.status}` };
    return { ok: true, result: json.result as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  } finally {
    clearTimeout(timer);
  }
}

// ── Кто мы ───────────────────────────────────────────────────
let botIdCache: number | null = null;

async function botId(): Promise<number | null> {
  if (botIdCache !== null) return botIdCache;
  const me = await call<{ id: number }>("getMe");
  if (!me.ok) return null;
  botIdCache = me.result.id;
  return botIdCache;
}

// ── 1. Обнаружение чатов ─────────────────────────────────────

type TgChat = { id: number; type: string; title?: string; username?: string };

/**
 * Вычитывает свежие апдейты и обновляет реестр чатов.
 *
 * Курсор offset хранится в базе: Telegram отдаёт апдейт один раз,
 * поэтому пропустить его нельзя — иначе чат потеряется навсегда.
 */
export async function syncChats(): Promise<{
  discovered: number; checked: number; error?: string;
}> {
  if (!prisma) return { discovered: 0, checked: 0, error: "нет базы" };
  if (!token()) return { discovered: 0, checked: 0, error: "нет токена" };

  const state = await prisma.telegramState.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });

  const updates = await call<Array<Record<string, any>>>("getUpdates", {
    offset: state.lastOffset,
    timeout: 0,
    limit: 100,
    allowed_updates: ["message", "channel_post", "my_chat_member"],
  });

  let discovered = 0;
  let maxUpdateId = state.lastOffset;

  if (updates.ok) {
    const seen = new Map<string, TgChat>();
    for (const u of updates.result) {
      if (typeof u.update_id === "number" && u.update_id >= maxUpdateId) {
        maxUpdateId = u.update_id + 1;
      }
      const chat: TgChat | undefined =
        u.message?.chat ?? u.channel_post?.chat ?? u.my_chat_member?.chat;
      if (chat?.id) seen.set(String(chat.id), chat);
    }

    for (const [chatId, chat] of seen) {
      await prisma.telegramChat.upsert({
        where: { chatId },
        create: {
          chatId,
          type: chat.type,
          title: chat.title ?? null,
          username: chat.username ?? null,
        },
        update: {
          type: chat.type,
          title: chat.title ?? null,
          username: chat.username ?? null,
        },
      });
      discovered++;
    }

    if (maxUpdateId !== state.lastOffset) {
      await prisma.telegramState.update({
        where: { id: "singleton" },
        data: { lastOffset: maxUpdateId, syncedAt: new Date() },
      });
    }
  }

  const checked = await refreshPermissions();
  return {
    discovered,
    checked,
    error: updates.ok ? undefined : updates.error,
  };
}

/**
 * Перепроверяет права бота в каждом известном чате.
 * «Есть админка» на практике означает «имеет право писать»,
 * поэтому проверяем именно это, а не сам факт админства.
 */
export async function refreshPermissions(): Promise<number> {
  if (!prisma) return 0;
  const me = await botId();
  if (!me) return 0;

  const chats = await prisma.telegramChat.findMany();
  let checked = 0;

  for (const c of chats) {
    const member = await call<{
      status: string;
      can_post_messages?: boolean;
      can_send_messages?: boolean;
    }>("getChatMember", { chat_id: c.chatId, user_id: me });

    if (!member.ok) {
      await prisma.telegramChat.update({
        where: { chatId: c.chatId },
        data: {
          canPost: false, isAdmin: false,
          lastError: member.error, lastErrorAt: new Date(), checkedAt: new Date(),
        },
      });
      continue;
    }

    const st = member.result.status;
    const isAdmin = st === "administrator" || st === "creator";

    // В канале админу нужен явный can_post_messages.
    // В группе обычный участник пишет по умолчанию, если не ограничен.
    let canPost: boolean;
    if (c.type === "channel") {
      canPost = isAdmin && member.result.can_post_messages !== false;
    } else if (isAdmin) {
      canPost = true;
    } else if (st === "member") {
      canPost = member.result.can_send_messages !== false;
    } else {
      canPost = st === "private" ? true : false;
    }
    if (c.type === "private") canPost = st !== "kicked";

    await prisma.telegramChat.update({
      where: { chatId: c.chatId },
      data: { isAdmin, canPost, checkedAt: new Date(), lastError: null },
    });
    checked++;
  }
  return checked;
}

// ── 2. Рассылка ──────────────────────────────────────────────

export type BroadcastReport = {
  sent: number;
  failed: number;
  skipped: number;
  details: Array<{ chatId: string; title: string | null; ok: boolean; error?: string }>;
};

/** Шлёт текст во все чаты реестра, где есть право писать. */
export async function broadcast(html: string): Promise<BroadcastReport> {
  const report: BroadcastReport = { sent: 0, failed: 0, skipped: 0, details: [] };
  if (!prisma || !token()) {
    report.skipped = 1;
    return report;
  }

  // Явный TELEGRAM_CHAT_ID всегда в списке, даже если ещё не обнаружен
  const pinned = process.env.TELEGRAM_CHAT_ID?.trim();
  if (pinned) {
    await prisma.telegramChat.upsert({
      where: { chatId: pinned },
      create: { chatId: pinned, type: "group", canPost: true, isAdmin: true },
      update: { muted: false },
    });
  }

  const targets = await prisma.telegramChat.findMany({
    where: { canPost: true, muted: false },
  });

  if (targets.length === 0) {
    report.skipped = 1;
    return report;
  }

  for (const c of targets) {
    const res = await call<unknown>("sendMessage", {
      chat_id: c.chatId,
      text: html,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });

    if (res.ok) {
      report.sent++;
      report.details.push({ chatId: c.chatId, title: c.title, ok: true });
      await prisma.telegramChat.update({
        where: { chatId: c.chatId },
        data: { lastOkAt: new Date(), lastError: null },
      });
    } else {
      report.failed++;
      report.details.push({ chatId: c.chatId, title: c.title, ok: false, error: res.error });

      // Бота выгнали или чат удалён — больше не пытаемся
      const dead = /kicked|blocked|not found|deactivated|no rights|not a member/i
        .test(res.error);
      await prisma.telegramChat.update({
        where: { chatId: c.chatId },
        data: {
          lastError: res.error, lastErrorAt: new Date(),
          ...(dead ? { canPost: false } : {}),
        },
      });
    }

    // Telegram ограничивает ~20 сообщений в минуту на группу;
    // пауза в 120 мс держит нас далеко от лимита при любом числе чатов.
    await new Promise((r) => setTimeout(r, 120));
  }

  return report;
}

// ── 3. Заказ ─────────────────────────────────────────────────

export type OrderForTelegram = {
  number: string;
  customerName: string;
  phone: string;
  email?: string | null;
  deliveryType: string;
  address?: string | null;
  comment?: string | null;
  items: Array<{ title: string; size: string; qty: number; price: number }>;
  itemsTotal: number;
  deliveryCost: number;
  total: number;
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const rub = (kop: number) =>
  (kop / 100).toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " ₽";

export function formatOrder(o: OrderForTelegram): string {
  const lines = [
    `🎨 <b>Заказ №${esc(o.number)}</b>`,
    "",
    `👤 ${esc(o.customerName)}`,
    `📱 ${esc(o.phone)}`,
    o.email ? `✉️ ${esc(o.email)}` : null,
    "",
    "📦 <b>Состав:</b>",
    ...o.items.map((i, n) =>
      `${n + 1}. ${esc(i.title)} — ${esc(i.size)}` +
      `${i.qty > 1 ? ` × ${i.qty}` : ""} — ${rub(i.price * i.qty)}`),
    "",
    `🚚 ${esc(o.deliveryType)}${o.address ? `, ${esc(o.address)}` : ""}`,
    o.comment ? `💬 «${esc(o.comment)}»` : null,
    "",
    `💰 Товары: ${rub(o.itemsTotal)}`,
    `🚚 Доставка: ${o.deliveryCost === 0 ? "бесплатно" : rub(o.deliveryCost)}`,
    `<b>Итого: ${rub(o.total)}</b>`,
    "",
    `🕒 ${new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })} МСК`,
  ];
  return lines.filter((l) => l !== null).join("\n");
}

/**
 * Главная точка входа при оформлении заказа.
 * Никогда не бросает исключение: потерять заказ из-за недоступности
 * мессенджера нельзя, поэтому все ошибки возвращаются в отчёте.
 */
export async function notifyOrder(o: OrderForTelegram): Promise<BroadcastReport> {
  try {
    // Дешёвый способ подхватить чаты, куда бота добавили недавно
    await syncChats().catch(() => undefined);
    return await broadcast(formatOrder(o));
  } catch (e) {
    return {
      sent: 0, failed: 1, skipped: 0,
      details: [{
        chatId: "-", title: null, ok: false,
        error: e instanceof Error ? e.message : String(e),
      }],
    };
  }
}
