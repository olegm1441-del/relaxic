#!/usr/bin/env node
/**
 * Завести цели в Яндекс Метрике одной командой.
 *
 * Зачем скриптом, а не руками в интерфейсе: имя цели в коде и
 * идентификатор в Метрике должны совпадать буква в букву. Разошлись на
 * один символ — отчёт по конверсии пустой, и это никак не проявляется:
 * сайт работает, цель уходит, Метрика её молча выбрасывает.
 *
 * Поэтому список берём не отсюда, а из lib/track.ts — из того самого
 * места, откуда сайт их отправляет. Разойтись физически нечему.
 *
 * Токен скрипт получает сам: поднимает страничку на localhost, она
 * ловит ответ Яндекса и отдаёт токен обратно. Руками остаётся один шаг —
 * одноразово создать приложение в Яндекс OAuth и дать его ClientID.
 *
 *   node scripts/metrika-goals.mjs              — проведёт за руку
 *   node scripts/metrika-goals.mjs --token ...  — если токен уже есть
 *   node scripts/metrika-goals.mjs --save       — запомнить токен в .env
 *
 * Повторный запуск безопасен: уже заведённые цели пропускаются.
 */
import { createServer } from "node:http";
import { readFileSync, appendFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const has = (name) => process.argv.includes(`--${name}`);

const API = arg("api") || "https://api-metrika.yandex.net";
const COUNTER = arg("counter") || process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || "113157679";
const PORT = Number(arg("port") || 8765);
const REDIRECT = `http://localhost:${PORT}/`;

const b = (s) => `\x1b[38;2;232;72;43m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const ok = (s) => console.log(`\x1b[32m  ✓ ${s}\x1b[0m`);
const no = (s) => console.log(`\x1b[31m  ✕ ${s}\x1b[0m`);
const wa = (s) => console.log(`\x1b[33m  ! ${s}\x1b[0m`);

/** Токен из аргумента, из окружения или из .env рядом с проектом. */
function storedToken() {
  const direct = arg("token") || process.env.YANDEX_METRIKA_TOKEN;
  if (direct) return direct.trim();
  for (const f of [".env", ".env.local"]) {
    try {
      const m = readFileSync(path.join(ROOT, f), "utf8")
        .match(/^\s*YANDEX_METRIKA_TOKEN\s*=\s*"?([^"\n]+)"?/m);
      if (m?.[1] && m[1] !== "сюда") return m[1].trim();
    } catch { /* файла нет — идём дальше */ }
  }
  return null;
}

/**
 * Страница, на которую Яндекс возвращает человека после согласия.
 *
 * Токен Яндекс кладёт в якорь адреса (после #), а якорь на сервер
 * не отправляется вообще — его видит только браузер. Поэтому страница
 * читает якорь сама и отсылает токен нам обычным запросом.
 */
const PAGE = `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Relaxic ✕ Метрика</title>
<style>
  :root{color-scheme:light dark}
  body{margin:0;min-height:100dvh;display:grid;place-items:center;font:16px/1.5 system-ui,sans-serif;
       background:#faf7f2;color:#1c1917;padding:24px}
  @media (prefers-color-scheme:dark){body{background:#1c1917;color:#faf7f2}}
  .card{max-width:420px;text-align:center}
  h1{font-size:1.25rem;margin:0 0 8px}
  p{margin:0;opacity:.75}
  .mark{font-size:2.5rem;line-height:1;color:#e8482b;margin-bottom:16px}
</style></head><body><div class="card">
<div class="mark">✕</div><h1 id="t">Забираю токен…</h1><p id="s">Секунду.</p>
</div><script>
  var h = new URLSearchParams(location.hash.slice(1));
  var q = new URLSearchParams(location.search);
  var token = h.get("access_token");
  var err = h.get("error") || q.get("error");
  function say(t, s){ document.getElementById("t").textContent = t; document.getElementById("s").textContent = s; }
  if (token) {
    fetch("/token", { method:"POST", headers:{"Content-Type":"text/plain"}, body:token })
      .then(function(){ say("Готово", "Вкладку можно закрыть — дальше всё делает терминал."); })
      .catch(function(){ say("Не получилось передать токен", "Скопируйте его из адресной строки и вставьте в терминал."); });
  } else if (err) {
    say("Яндекс отказал: " + err, q.get("error_description") || h.get("error_description") || "Попробуйте ещё раз.");
  } else {
    say("Токена в адресе нет", "Откройте ссылку из терминала целиком, вместе с частью после #.");
  }
</script></body></html>`;

/** Провести человека через OAuth: один вопрос, одна ссылка. */
async function obtainToken() {
  if (!process.stdin.isTTY) {
    no("нет токена");
    console.log(dim("  Запустите вживую в терминале — скрипт проведёт по шагам,"));
    console.log(dim("  либо передайте готовый: --token ВАШ_ТОКЕН\n"));
    return null;
  }

  console.log(dim("  Токена нет. Это одноразовая настройка, около двух минут.\n"));
  console.log(`  ${bold("1")}  Откройте ${b("https://oauth.yandex.ru/client/new/")}`);
  console.log(dim("      Название — любое, например «Relaxic».\n"));
  console.log(`  ${bold("2")}  Платформа — ${bold("«Веб-сервисы»")}. В поле Redirect URI вставьте ровно:`);
  console.log(`      ${b(REDIRECT)}\n`);
  console.log(`  ${bold("3")}  В доступах найдите ${bold("«Яндекс Метрика»")} и отметьте два права:`);
  console.log(dim("      metrika:read  и  metrika:write.  Нажмите «Создать приложение».\n"));

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const clientId = (await rl.question(`  ${bold("4")}  Вставьте сюда ClientID приложения и нажмите Enter:\n      `)).trim();
  if (!clientId) { rl.close(); no("ClientID не введён"); return null; }

  const url = `https://oauth.yandex.ru/authorize?response_type=token&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(REDIRECT)}`;
  console.log(`\n  ${bold("5")}  Откройте в браузере эту ссылку и нажмите «Разрешить»:\n`);
  console.log(`      ${b(url)}\n`);
  console.log(dim(`      Жду токен на ${REDIRECT} — вернётесь сюда сами.`));
  console.log(dim("      Если что-то пошло не так, вставьте токен руками и нажмите Enter."));

  let srv;
  const fromBrowser = new Promise((resolve, reject) => {
    srv = createServer((req, res) => {
      if (req.method === "POST" && req.url === "/token") {
        let body = "";
        req.on("data", (c) => (body += c)).on("end", () => {
          res.writeHead(200).end("ok");
          if (body.trim()) resolve(body.trim());
        });
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(PAGE);
    });
    srv.on("error", (e) => reject(new Error(
      e.code === "EADDRINUSE"
        ? `порт ${PORT} занят — перезапустите с --port 8766 и тот же адрес укажите в приложении`
        : e.message)));
    srv.listen(PORT, "127.0.0.1");
  });
  const fromHands = rl.question("\n      токен: ").then((t) => t.trim()).catch(() => "");

  let token = null;
  try {
    token = await Promise.race([fromBrowser, fromHands]);
  } catch (e) {
    no(e.message);
  }
  srv?.close();
  rl.close();
  return token || null;
}

/**
 * Цели читаем из lib/track.ts: имя из комментария над строкой,
 * идентификатор — из неё самой. Один источник правды на код и Метрику.
 */
function goalsFromCode() {
  const src = readFileSync(path.join(ROOT, "lib/track.ts"), "utf8");
  const block = src.slice(src.indexOf("export const GOALS"), src.indexOf("} as const;"));
  const out = [];
  const re = /\/\*\*\s*(.+?)\s*\*\/\s*\n\s*[A-Z_]+:\s*"([a-z_]+)"/g;
  let m;
  while ((m = re.exec(block))) out.push({ name: m[1], key: m[2] });
  return out;
}

let TOKEN = null;
async function api(method, pathname, body) {
  const res = await fetch(API + pathname, {
    method,
    headers: {
      Authorization: `OAuth ${TOKEN}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* не json — покажем как есть */ }
  if (!res.ok) {
    const msg = json?.message || json?.errors?.[0]?.message || text.slice(0, 200);
    const err = new Error(`${res.status} ${msg}`);
    err.status = res.status;
    throw err;
  }
  return json;
}

console.log("");
console.log(b("  RELAXIC ✕  цели в Метрике"));
console.log(dim(`  счётчик ${COUNTER}`));
console.log("");

TOKEN = storedToken() ?? await obtainToken();
if (!TOKEN) { console.log(""); process.exit(1); }

const want = goalsFromCode();
if (want.length !== 6) {
  no(`в lib/track.ts найдено целей: ${want.length}, ожидалось 6 — разберитесь, прежде чем заводить`);
  process.exit(1);
}

let existing;
try {
  const r = await api("GET", `/management/v1/counter/${COUNTER}/goals`);
  existing = r.goals ?? [];
} catch (e) {
  console.log("");
  no(`не получилось прочитать цели: ${e.message}`);
  if (e.status === 401) console.log(dim("     токен не принят — истёк или скопирован не целиком"));
  if (e.status === 403) console.log(dim("     у токена нет права metrika:write к этому счётчику"));
  if (e.status === 404) console.log(dim(`     счётчика ${COUNTER} не видно под этим аккаунтом`));
  process.exit(1);
}
console.log("");
ok(`целей сейчас в счётчике: ${existing.length}`);

/** Идентификатор цели-события лежит в условии, в поле url. */
const keyOf = (g) => g.conditions?.find((c) => c.type === "exact")?.url ?? null;
const have = new Map(existing.map((g) => [keyOf(g), g]));

/** Пометка корзины и заказа: с ней Метрика выделяет эти две цели в отчётах. */
const FLAGS = { add_to_cart: "basket", order_done: "order" };

let made = 0, skipped = 0, failed = 0;
for (const g of want) {
  if (have.has(g.key)) {
    ok(`${g.key} — уже есть ${dim(`(«${have.get(g.key).name}», id ${have.get(g.key).id})`)}`);
    skipped++;
    continue;
  }
  if (has("dry")) { wa(`${g.key} — завёл бы «${g.name}»`); continue; }
  const base = {
    name: g.name,
    type: "action",
    is_retargeting: 0,
    conditions: [{ type: "exact", url: g.key }],
  };
  const flag = FLAGS[g.key];
  try {
    let r;
    try {
      r = await api("POST", `/management/v1/counter/${COUNTER}/goals`, { goal: flag ? { ...base, flag } : base });
    } catch (e) {
      // Версия API пометку не приняла — цель без украшения лучше, чем её отсутствие.
      if (!flag || e.status !== 400) throw e;
      wa(`${g.key} — пометка «${flag}» не принята, завожу без неё`);
      r = await api("POST", `/management/v1/counter/${COUNTER}/goals`, { goal: base });
    }
    ok(`${g.key} — завёл «${g.name}» ${dim(`(id ${r.goal?.id ?? "?"})`)}`);
    made++;
  } catch (e) {
    no(`${g.key} — не завёл: ${e.message}`);
    failed++;
  }
}

/** Настройки счётчика: без них вебвизор и корзина в отчётах не появятся. */
try {
  const { counter } = await api("GET", `/management/v1/counter/${COUNTER}`);
  console.log("");
  counter?.code_options?.ecommerce
    ? ok("электронная коммерция включена")
    : wa("электронная коммерция выключена — Метрика → Настройки → Счётчик → «Электронная коммерция», объект dataLayer");
  counter?.webvisor?.arch_enabled
    ? ok("вебвизор включён")
    : wa("вебвизор выключен — Метрика → Настройки → Счётчик → «Вебвизор, карта скроллинга, аналитика форм»");
} catch { /* настройки не критичны: цели уже заведены */ }

if (has("save") && TOKEN && !storedToken()) {
  try {
    appendFileSync(path.join(ROOT, ".env"), `\nYANDEX_METRIKA_TOKEN="${TOKEN}"\n`);
    ok("токен записан в .env (файл в .gitignore, в репозиторий не уедет)");
  } catch (e) { wa(`не смог записать .env: ${e.message}`); }
}

/**
 * Тот же токен нужен сайту, чтобы сводка в /admin показывала визиты.
 * Отдаём его Railway через stdin, а не аргументом команды: аргумент
 * видно в списке процессов и он остаётся в истории оболочки.
 */
async function toRailway() {
  if (!process.stdin.isTTY) return;
  const { spawnSync } = await import("node:child_process");
  if (spawnSync("railway", ["--version"], { stdio: "ignore" }).status !== 0) {
    console.log("");
    console.log(dim("  Положите этот же токен на Railway в переменную YANDEX_METRIKA_TOKEN —"));
    console.log(dim("  тогда сводка в /admin начнёт показывать визиты, а не просьбу добавить токен."));
    return;
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const a = (await rl.question("\n  Положить токен на Railway, чтобы сводка в /admin ожила? [Y/n] ")).trim().toLowerCase();
  rl.close();
  if (a && !["y", "д", "да", "yes"].includes(a)) {
    console.log(dim("  Хорошо. Переменная называется YANDEX_METRIKA_TOKEN."));
    return;
  }
  const r = spawnSync("railway", [
    "variables", "set", "--stdin", "YANDEX_METRIKA_TOKEN",
    "--service", arg("service") || process.env.RELAXIC_SERVICE || "relaxic",
    "--skip-deploys",
  ], { input: TOKEN, encoding: "utf8" });
  if (r.status === 0) {
    ok("токен записан в переменные Railway");
    console.log(dim("     применится при следующем выкате: bash scripts/deploy.sh"));
  } else {
    no(`Railway не принял переменную: ${(r.stderr || r.stdout || "").trim().split("\n")[0] || "неизвестно"}`);
    console.log(dim("     добавьте руками: Railway → сервис → Variables → YANDEX_METRIKA_TOKEN"));
  }
}

console.log("");
if (failed) { no(`не заведено целей: ${failed}`); process.exit(1); }
console.log(b(`  ГОТОВО — завёл ${made}, уже было ${skipped}`));
console.log(dim("  Цифры в отчёте появятся после первых переходов, не задним числом."));
await toRailway();
console.log("");
