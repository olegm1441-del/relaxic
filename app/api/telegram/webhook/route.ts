import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Необязательный вебхук — надёжная альтернатива опросу getUpdates.
 *
 * Включается один раз:
 *   curl "https://api.telegram.org/bot<ТОКЕН>/setWebhook?url=https://САЙТ/api/telegram/webhook&secret_token=<ADMIN_TOKEN>"
 *
 * С ним чат попадает в реестр в момент добавления бота, и суточное
 * окно хранения апдейтов перестаёт что-либо значить.
 *
 * Вебхук и getUpdates взаимоисключающи: включив вебхук, getUpdates
 * начнёт отвечать ошибкой — это ожидаемо, syncChats её проглотит.
 */
export async function POST(req: Request) {
  const secret = process.env.ADMIN_TOKEN;
  if (secret && req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return new Response("forbidden", { status: 403 });
  }
  if (!prisma) return Response.json({ ok: true });

  try {
    const u = (await req.json()) as Record<string, any>;
    const chat = u.message?.chat ?? u.channel_post?.chat ?? u.my_chat_member?.chat;
    if (chat?.id) {
      const chatId = String(chat.id);
      const status: string | undefined = u.my_chat_member?.new_chat_member?.status;
      const kicked = status === "kicked" || status === "left";
      await prisma.telegramChat.upsert({
        where: { chatId },
        create: {
          chatId, type: chat.type,
          title: chat.title ?? null, username: chat.username ?? null,
          isAdmin: status === "administrator" || status === "creator",
          canPost: !kicked,
        },
        update: {
          type: chat.type,
          title: chat.title ?? null, username: chat.username ?? null,
          ...(status ? {
            isAdmin: status === "administrator" || status === "creator",
            canPost: !kicked,
          } : {}),
        },
      });
    }
  } catch {
    // Telegram повторяет доставку при не-200; молча подтверждаем,
    // чтобы кривой апдейт не встал в очередь навсегда.
  }
  return Response.json({ ok: true });
}
