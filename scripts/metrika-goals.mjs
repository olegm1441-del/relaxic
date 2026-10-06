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
 * Запуск:
 *   node scripts/metrika-goals.mjs --token ВАШ_ТОКЕН
 *   YANDEX_METRIKA_TOKEN=... node scripts/metrika-goals.mjs
 *
 * Повторный запуск безопасен: уже заведённые цели пропускаются.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};

const API = arg("api") || "https://api-metrika.yandex.net";
const COUNTER = arg("counter") || process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || "113157679";
const DRY = process.argv.includes("--dry");

const b = (s) => `\x1b[38;2;232;72;43m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const ok = (s) => console.log(`\x1b[32m  ✓ ${s}\x1b[0m`);
const no = (s) => console.log(`\x1b[31m  ✕ ${s}\x1b[0m`);
const wa = (s) => console.log(`\x1b[33m  ! ${s}\x1b[0m`);

/** Токен: из аргумента, из окружения или из .env рядом с проектом. */
function token() {
  const direct = arg("token") || process.env.YANDEX_METRIKA_TOKEN;
  if (direct) return direct.trim();
  for (const f of [".env", ".env.local"]) {
    try {
      const m = readFileSync(path.join(ROOT, f), "utf8")
        .match(/^\s*YANDEX_METRIKA_TOKEN\s*=\s*"?([^"\n]+)"?/m);
      if (m) return m[1].trim();
    } catch { /* файла нет — идём дальше */ }
  }
  return null;
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

const TOKEN = token();

console.log("");
console.log(b("  RELAXIC ✕  цели в Метрике"));
console.log(dim(`  счётчик ${COUNTER}`));
console.log("");

if (!TOKEN) {
  no("нет токена");
  console.log(dim("\n  Где взять, две минуты:"));
  console.log(dim("  1. https://oauth.yandex.ru/client/new/ → имя любое,"));
  console.log(dim("     платформа «Веб-сервисы», Redirect URI — кнопка"));
  console.log(dim("     «Подставить URL для разработки»."));
  console.log(dim("     В доступах найдите «Яндекс Метрика» и отметьте"));
  console.log(dim("     metrika:read и metrika:write. Создать."));
  console.log(dim("  2. Откройте в браузере, подставив ClientID приложения:"));
  console.log(dim("     https://oauth.yandex.ru/authorize?response_type=token&client_id=ВАШ_CLIENT_ID"));
  console.log(dim("     Токен будет в адресной строке после access_token=\n"));
  console.log(dim("  Потом: node scripts/metrika-goals.mjs --token ТОКЕН"));
  console.log(dim("  Этот же токен нужен переменной YANDEX_METRIKA_TOKEN на"));
  console.log(dim("  Railway — тогда сводка в /admin начнёт показывать визиты.\n"));
  process.exit(1);
}

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
  no(`не получилось прочитать цели: ${e.message}`);
  if (e.status === 401) console.log(dim("     токен не принят — истёк или скопирован не целиком"));
  if (e.status === 403) console.log(dim("     у токена нет доступа metrika:write к этому счётчику"));
  if (e.status === 404) console.log(dim(`     счётчика ${COUNTER} не видно под этим аккаунтом`));
  process.exit(1);
}
ok(`целей сейчас в счётчике: ${existing.length}`);

/** Идентификатор цели-события лежит в условии, в поле url. */
const keyOf = (g) => g.conditions?.find((c) => c.type === "exact")?.url ?? null;
const have = new Map(existing.map((g) => [keyOf(g), g]));

const FLAGS = { add_to_cart: "basket", order_done: "order" };

let made = 0, skipped = 0, failed = 0;
for (const g of want) {
  if (have.has(g.key)) {
    ok(`${g.key} — уже есть ${dim(`(«${have.get(g.key).name}», id ${have.get(g.key).id})`)}`);
    skipped++;
    continue;
  }
  if (DRY) { wa(`${g.key} — завёл бы «${g.name}»`); continue; }
  const base = {
    name: g.name,
    type: "action",
    is_retargeting: 0,
    conditions: [{ type: "exact", url: g.key }],
  };
  // Пометка корзины и заказа — из-за неё Метрика показывает эти две цели
  // в отчётах по электронной коммерции отдельно, а не в общем списке.
  // Если версия API пометку не примет — заводим цель без неё: лучше
  // цель без украшения, чем отсутствие цели.
  const flag = FLAGS[g.key];
  try {
    let r;
    try {
      r = await api("POST", `/management/v1/counter/${COUNTER}/goals`, { goal: flag ? { ...base, flag } : base });
    } catch (e) {
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
  const ecom = counter?.code_options?.ecommerce;
  const vis = counter?.webvisor?.arch_enabled;
  console.log("");
  ecom ? ok("электронная коммерция включена") : wa("электронная коммерция выключена — Метрика → Настройки → Счётчик → «Электронная коммерция», объект dataLayer");
  vis ? ok("вебвизор включён") : wa("вебвизор выключен — Метрика → Настройки → Счётчик → «Вебвизор, карта скроллинга, аналитика форм»");
} catch { /* настройки не критичны: цели уже заведены */ }

console.log("");
if (failed) { no(`не заведено целей: ${failed}`); process.exit(1); }
console.log(b(`  ГОТОВО — завёл ${made}, уже было ${skipped}`));
console.log(dim("  Цифры в отчёте появятся после первых переходов, не задним числом.\n"));
