import { syncChats } from "@/lib/telegram";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Ручное обновление реестра чатов.
 *
 *   curl -X POST https://САЙТ/api/telegram/sync -H "x-admin-token: ..."
 *
 * Нужен после добавления бота в новый чат, если апдейт не успели
 * вычитать: Telegram хранит апдейты около суток.
 */
export async function POST(req: Request) {
  const expected = process.env.ADMIN_TOKEN;
  if (expected && req.headers.get("x-admin-token") !== expected) {
    return Response.json({ error: "Неверный токен" }, { status: 401 });
  }

  const result = await syncChats();
  const chats = prisma
    ? await prisma.telegramChat.findMany({
        select: { chatId: true, title: true, type: true,
                  isAdmin: true, canPost: true, muted: true, lastError: true },
        orderBy: { discoveredAt: "asc" },
      })
    : [];

  return Response.json({ ...result, total: chats.length, chats });
}

export async function GET(req: Request) {
  return POST(req);
}
