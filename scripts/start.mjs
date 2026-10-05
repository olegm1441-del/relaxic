#!/usr/bin/env node
/**
 * Запуск в продакшене.
 *
 * Схему и демо-данные накатываем здесь, а не в preDeployCommand:
 * Railway собирает проект через Railpack и railway.toml игнорирует,
 * поэтому preDeployCommand может вообще не выполниться.
 *
 * Обе операции идемпотентны, так что повтор при каждом старте безвреден.
 * Флага --accept-data-loss здесь намеренно нет: db push без него
 * применяет только безопасные изменения и отказывается от тех, что
 * удаляют данные. Иначе однажды рестарт молча снёс бы таблицу заказов.
 * База недоступна — сервер всё равно поднимается: уронить сайт целиком
 * из-за проблем с базой хуже, чем отдать страницы без неё.
 */
import { spawn } from "node:child_process";

const run = (cmd, args) =>
  new Promise((resolve) => {
    const p = spawn(cmd, args, { stdio: "inherit", env: process.env });
    p.on("close", (code) => resolve(code ?? 1));
    p.on("error", () => resolve(1));
  });

if (process.env.DATABASE_URL) {
  console.log("→ синхронизирую схему");
  const prismaBin = new URL("../node_modules/prisma/build/index.js", import.meta.url).pathname;
  const push = await run(process.execPath, [prismaBin, "db", "push"]);
  if (push === 0) {
    console.log("→ наполняю демо-данными");
    await run("node", ["prisma/seed.mjs"]);
  } else {
    console.warn("! схему накатить не удалось — поднимаюсь без базы");
  }
} else {
  console.warn("! DATABASE_URL не задан — поднимаюсь без базы");
}

/**
 * Память — это счёт за Railway: 99% суммы. Замеры на реальной сборке,
 * 81 страница и 180 пересборок картинок подряд:
 *
 *   как было                                     пик 504 МБ, осело 497 МБ
 *   + MALLOC_ARENA_MAX=2                         пик 377 МБ, осело 342 МБ
 *   + VIPS_CONCURRENCY=1, UV_THREADPOOL_SIZE=2   пик 287 МБ, осело 287 МБ
 *
 * Откуда бралась разница. Картинки пересобирает libvips, и он работает
 * пулом потоков по числу ядер. Каждый поток получает собственную арену
 * glibc, арены не возвращают память системе, и процесс навсегда остаётся
 * раздутым — на графике Railway это ровная лестница вверх без единого
 * спуска при нулевом процессоре.
 *
 * Чем платим: первая пересборка картинки занимает 0,9 с вместо 0,5 с.
 * Это разовая работа — результат лежит в кеше год, и качество кадра
 * не меняется ни на пиксель.
 */
for (const [k, v] of Object.entries({
  MALLOC_ARENA_MAX: "2",
  VIPS_CONCURRENCY: "1",
  UV_THREADPOOL_SIZE: "2",
})) {
  process.env[k] ??= v;
}

/**
 * Потолок кучи. Без него V8 растит процесс, пока есть свободная память
 * машины, и не отдаёт её обратно. С потолком сборщик мусора включается
 * раньше. На RSS влияет слабо (замеры выше), но страхует от редкого
 * всплеска, когда память уходит в своп и сервер встаёт.
 */
if (!process.env.NODE_OPTIONS?.includes("max-old-space-size")) {
  process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS ?? ""} --max-old-space-size=640`.trim();
}

const port = process.env.PORT || "3000";
console.log(`→ старт на 0.0.0.0:${port}`);

/**
 * Запускаем next напрямую, а не через npx: обёртка npm остаётся висеть
 * рядом с сервером на всё время работы и держит под 90 МБ впустую.
 */
const bin = new URL("../node_modules/next/dist/bin/next", import.meta.url).pathname;
const code = await run(process.execPath, [bin, "start", "-H", "0.0.0.0", "-p", port]);
process.exit(code);
