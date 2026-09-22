#!/usr/bin/env bash
# Relaxic — разворачивание на Railway одной командой.
#
#   TELEGRAM_BOT_TOKEN="123:ABC" bash scripts/railway-setup.sh
#
# Единственное место, где нужен человек — вход в Railway через браузер.
# Всё остальное делается само.
set -uo pipefail

PROJECT="relaxic"
SERVICE="relaxic"
REPO="olegm1441-del/relaxic"
BRANCH="main"

say(){ printf "\033[38;2;232;72;43m%s\033[0m\n" "$1"; }
dim(){ printf "\033[2m%s\033[0m\n" "$1"; }
ok(){  printf "\033[32m  ✓ %s\033[0m\n" "$1"; }
warn(){ printf "\033[33m  ! %s\033[0m\n" "$1"; }
die(){ printf "\033[31m  ✕ %s\033[0m\n" "$1" >&2; exit 1; }

say ""; say "  RELAXIC ✕  разворачиваю на Railway"; say ""

# ── 1. CLI ───────────────────────────────────────────────────
install_cli(){
  if command -v brew >/dev/null 2>&1; then brew install railway >/dev/null 2>&1 && return 0; fi
  npm i -g @railway/cli >/dev/null 2>&1
}
command -v railway >/dev/null 2>&1 || { dim "  ставлю Railway CLI…"; install_cli; }
command -v railway >/dev/null 2>&1 || die "Не смог поставить Railway CLI. Нужен Homebrew или Node.js."

# Скрипт написан под CLI 5.x: в 4.x нет ни railway variable set,
# ни --json у domain. Старую версию молча обновляем.
CLI_MAJOR="$(railway --version 2>/dev/null | grep -oE '[0-9]+' | head -1)"
if [ "${CLI_MAJOR:-0}" -lt 5 ]; then
  dim "  Railway CLI ${CLI_MAJOR}.x устарел — обновляю…"
  if command -v brew >/dev/null 2>&1 && brew list railway >/dev/null 2>&1; then
    brew upgrade railway >/dev/null 2>&1 || true
  fi
  CLI_MAJOR="$(railway --version 2>/dev/null | grep -oE '[0-9]+' | head -1)"
  if [ "${CLI_MAJOR:-0}" -lt 5 ]; then
    npm i -g @railway/cli >/dev/null 2>&1 || true
    hash -r 2>/dev/null || true
  fi
fi
ok "Railway CLI $(railway --version 2>/dev/null | head -1)"

# ── 2. Вход ──────────────────────────────────────────────────
if ! railway whoami >/dev/null 2>&1; then
  say ""
  say "  Вход в Railway — единственный ручной шаг."
  dim "  Сейчас появится код и ссылка: откройте ссылку, введите код."
  say ""
  # Браузерный вход у Railway регулярно отваливается с
  # «Error logging in to CLI, try again with --browserless»,
  # поэтому сразу идём по коду.
  railway login --browserless || railway login \
    || die "Вход не удался. Попробуйте вручную: railway login --browserless"
fi
ok "вошли как $(railway whoami 2>/dev/null | tail -1)"

# ── 3. Проект ────────────────────────────────────────────────
if railway status >/dev/null 2>&1; then
  ok "папка уже привязана к проекту"
else
  dim "  создаю проект «$PROJECT»…"
  railway init --name "$PROJECT" >/dev/null 2>&1 \
    || die "Не смог создать проект. Возможно, имя занято — переименуйте PROJECT в скрипте."
  ok "проект создан"
fi

# ── 4. База ──────────────────────────────────────────────────
DB_NAME="Postgres"
if railway status --json 2>/dev/null | grep -qi '"name"[[:space:]]*:[[:space:]]*"Postgres"'; then
  ok "Postgres уже есть"
else
  dim "  добавляю Postgres…"
  railway add -d postgres >/dev/null 2>&1 && ok "Postgres добавлен" || warn "Postgres добавить не вышло — добавьте кнопкой в панели"
fi

# ── 5. Сервис сайта ──────────────────────────────────────────
TOKEN="${TELEGRAM_BOT_TOKEN:-}"
ADMIN="$(head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n')"

if railway status --json 2>/dev/null | grep -q "\"name\"[[:space:]]*:[[:space:]]*\"$SERVICE\""; then
  ok "сервис «$SERVICE» уже есть"
else
  dim "  создаю сервис и привязываю к GitHub…"
  if railway add -s "$SERVICE" -r "$REPO" --branch "$BRANCH" >/dev/null 2>&1; then
    ok "сервис создан и привязан к $REPO ($BRANCH) — деплой при каждом пуше"
  else
    warn "GitHub к Railway не подключён — создаю сервис без привязки"
    railway add -s "$SERVICE" >/dev/null 2>&1 || die "Не смог создать сервис."
    NEEDS_UP=1
  fi
fi

# ── 6. Переменные ────────────────────────────────────────────
dim "  прописываю переменные…"
set_var(){ railway variable set "$1" -s "$SERVICE" --skip-deploys >/dev/null 2>&1 \
        || railway variables --set "$1" -s "$SERVICE" --skip-deploys >/dev/null 2>&1; }

set_var 'DATABASE_URL=${{Postgres.DATABASE_URL}}'
set_var "ADMIN_TOKEN=$ADMIN"
[ -n "$TOKEN" ] && set_var "TELEGRAM_BOT_TOKEN=$TOKEN"
ok "переменные заданы"
[ -z "$TOKEN" ] && warn "TELEGRAM_BOT_TOKEN не передан — заказы в Telegram не уйдут"

# ── 7. Домен ─────────────────────────────────────────────────
dim "  включаю домен…"
DOMAIN="$(railway domain -s "$SERVICE" --json 2>/dev/null \
  | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{const j=JSON.parse(d);
      const s=JSON.stringify(j);const m=s.match(/[a-z0-9-]+\.up\.railway\.app/i);
      console.log(m?m[0]:"")}catch(e){console.log("")}})' 2>/dev/null)"

if [ -z "$DOMAIN" ]; then
  DOMAIN="$(railway domain list -s "$SERVICE" --json 2>/dev/null \
    | grep -oE '[a-z0-9-]+\.up\.railway\.app' | head -1)"
fi

if [ -n "$DOMAIN" ]; then
  set_var "NEXT_PUBLIC_SITE_URL=https://$DOMAIN"
  ok "домен: https://$DOMAIN"
else
  warn "домен не определился — включите кнопкой Generate Domain и впишите NEXT_PUBLIC_SITE_URL"
fi

# ── 8. Деплой ────────────────────────────────────────────────
say ""
if [ "${NEEDS_UP:-0}" = "1" ]; then
  dim "  заливаю код напрямую (GitHub не привязан)…"
  railway up -y -d -s "$SERVICE" || warn "Деплой не стартовал — запустите: railway up"
else
  dim "  запускаю первый деплой…"
  railway redeploy -s "$SERVICE" -y >/dev/null 2>&1 \
    || railway up -y -d -s "$SERVICE" >/dev/null 2>&1 || true
fi

say ""
say "  ✓ Готово"
[ -n "$DOMAIN" ] && say "    https://$DOMAIN"
dim ""
dim "  Сборка идёт 3–5 минут. Логи:  railway logs"
dim "  Панель:                       railway open"
