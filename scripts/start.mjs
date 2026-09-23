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
  const push = await run("npx", ["prisma", "db", "push"]);
  if (push === 0) {
    console.log("→ наполняю демо-данными");
    await run("node", ["prisma/seed.mjs"]);
  } else {
    console.warn("! схему накатить не удалось — поднимаюсь без базы");
  }
} else {
  console.warn("! DATABASE_URL не задан — поднимаюсь без базы");
}

const port = process.env.PORT || "3000";
console.log(`→ старт на 0.0.0.0:${port}`);
const code = await run("npx", ["next", "start", "-H", "0.0.0.0", "-p", port]);
process.exit(code);
