import { readFile } from "node:fs/promises";
import path from "node:path";
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
  // Какая сборка на самом деле живёт на сайте.
  //
  // RAILWAY_GIT_COMMIT_SHA заполняется только при сборке из GitHub.
  // Мы заливаем код напрямую через railway up, и эта переменная пустая —
  // поэтому «сайт отвечает» само по себе ничего не говорило о версии.
  // Отсюда приходилось гадать, доехали правки или нет.
  //
  // scripts/deploy.sh перед заливкой штампует сюда SHA, файл едет
  // в образ вместе с public и читается на каждый запрос.
  let commit = process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ?? "";
  let builtAt = "";
  if (!commit) {
    try {
      const raw = await readFile(path.join(process.cwd(), "public", "build.json"), "utf8");
      const stamp = JSON.parse(raw) as { commit?: string; at?: string };
      commit = stamp.commit ?? "";
      builtAt = stamp.at ?? "";
    } catch {
      // Штампа нет — значит заливали руками, мимо deploy.sh
    }
  }

  const out: Record<string, unknown> = {
    ok: true,
    at: new Date().toISOString(),
    commit: commit && commit !== "—" ? commit : "без штампа",
    builtAt: builtAt && builtAt !== "—" ? builtAt : undefined,
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
