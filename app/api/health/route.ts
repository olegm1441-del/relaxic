import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Проверка живости — и заодно диагностика.
 *
 * Возвращает не только «жив», но и состояние базы: снаружи это
 * единственный надёжный способ понять, доехала ли DATABASE_URL,
 * не имея доступа к панели Railway.
 */
export async function GET() {
  // Railway подставляет SHA коммита при сборке из GitHub.
  // По нему снаружи видно, доехала ли новая версия, — без этого
  // «сайт отвечает» ничего не говорит о том, какая там сборка.
  const sha = process.env.RAILWAY_GIT_COMMIT_SHA ?? "";

  const out: Record<string, unknown> = {
    ok: true,
    at: new Date().toISOString(),
    commit: sha ? sha.slice(0, 7) : "локальная заливка",
  };

  if (!process.env.DATABASE_URL) {
    out.db = "DATABASE_URL не задана";
    out.hint = "Railway → сервис → Variables → DATABASE_URL = ${{Postgres.DATABASE_URL}}";
    return Response.json(out, { status: 200 });
  }

  if (!prisma) {
    out.db = "клиент не создан";
    return Response.json(out, { status: 200 });
  }

  try {
    const [fandoms, products, reviews] = await Promise.all([
      prisma.fandom.count(),
      prisma.product.count(),
      prisma.review.count(),
    ]);
    out.db = "подключена";
    out.data = { фандомов: fandoms, товаров: products, отзывов: reviews };
    if (products === 0) out.hint = "база пуста — сид не отработал, смотрите логи запуска";
  } catch (e) {
    out.db = "ошибка подключения";
    // Prisma начинает сообщение с пустых строк, поэтому берём первую непустую
    const msg = e instanceof Error ? e.message : String(e);
    out.error = msg.split("\n").map((l) => l.trim()).find(Boolean) ?? msg.slice(0, 200);
  }

  return Response.json(out, { status: 200 });
}
