#!/usr/bin/env bash
# Relaxic — развернуть и сразу показать, что получилось.
#   bash scripts/deploy.sh
set -uo pipefail

SERVICE="relaxic"
URL="https://relaxic-production.up.railway.app"
LOG="/tmp/relaxic-deploy.log"

b(){ printf "\033[38;2;232;72;43m%s\033[0m\n" "$1"; }
d(){ printf "\033[2m%s\033[0m\n" "$1"; }
ok(){ printf "\033[32m  ✓ %s\033[0m\n" "$1"; }
no(){ printf "\033[31m  ✕ %s\033[0m\n" "$1"; }
wa(){ printf "\033[33m  ! %s\033[0m\n" "$1"; }

b ""; b "  RELAXIC ✕  развёртывание"; b ""

# ── 1. Код ───────────────────────────────────────────────────
git pull --rebase --quiet 2>/dev/null && ok "код обновлён ($(git rev-parse --short HEAD))" \
  || wa "git pull не прошёл — работаю с тем, что есть"

# ── 2. CLI и вход ────────────────────────────────────────────
command -v railway >/dev/null 2>&1 || { no "Railway CLI не установлен: npm i -g @railway/cli"; exit 1; }
railway whoami >/dev/null 2>&1 || { no "не выполнен вход"; d "  railway login --browserless"; exit 1; }
ok "вход: $(railway whoami 2>/dev/null | tail -1)"

railway status >/dev/null 2>&1 || { no "папка не привязана к проекту"; d "  railway link  (выберите relaxic → production → relaxic)"; exit 1; }
ok "проект привязан"

# ── 3. Переменные ────────────────────────────────────────────
b ""; d "  переменные сервиса:"
VARS="$(railway variables -s "$SERVICE" --kv 2>/dev/null || railway variables -s "$SERVICE" 2>/dev/null)"
for v in DATABASE_URL TELEGRAM_BOT_TOKEN NEXT_PUBLIC_SITE_URL; do
  if grep -q "^$v=" <<<"$VARS" 2>/dev/null || grep -q "$v" <<<"$VARS" 2>/dev/null; then
    ok "$v задана"
  else
    [ "$v" = "DATABASE_URL" ] && no "$v НЕ ЗАДАНА — база не подключится" || wa "$v не задана"
  fi
done
grep -q "DATABASE_URL" <<<"$VARS" || {
  wa "пробую подключить базу автоматически"
  railway variables --set 'DATABASE_URL=${{Postgres.DATABASE_URL}}' -s "$SERVICE" --skip-deploys >/dev/null 2>&1 \
    && ok "DATABASE_URL проставлена" || no "не вышло — задайте в панели: DATABASE_URL = \${{Postgres.DATABASE_URL}}"
}

# ── 4. Сборка ────────────────────────────────────────────────
b ""; b "  собираю (3–6 минут, логи ниже)"; b ""
railway up -s "$SERVICE" -c 2>&1 | tee "$LOG"
BUILD=${PIPESTATUS[0]}

# ── 5. Итог ──────────────────────────────────────────────────
b ""
if [ "$BUILD" -ne 0 ]; then
  no "сборка не прошла"
  b ""; d "  последние 40 строк — пришлите их в чат:"; d "  ──────────────────────────────────────────"
  tail -40 "$LOG"
  d "  ──────────────────────────────────────────"
  d "  полный лог: $LOG"
  exit 1
fi
ok "сборка прошла"

d "  жду, пока поднимется…"
for i in $(seq 1 30); do
  CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 "$URL/api/health" 2>/dev/null)"
  [ "$CODE" = "200" ] && break
  sleep 6
done

b ""
if [ "${CODE:-000}" = "200" ]; then
  ok "сайт отвечает"
  b ""; b "  $URL"; b ""
  d "  здоровье:  $(curl -s --max-time 8 "$URL/api/health")"
else
  no "сборка прошла, но сайт не отвечает (код ${CODE:-нет ответа})"
  b ""; d "  логи запуска — пришлите их в чат:"; d "  ──────────────────────────────────────────"
  railway logs -s "$SERVICE" 2>/dev/null | tail -40
  d "  ──────────────────────────────────────────"
  exit 1
fi
