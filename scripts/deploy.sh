#!/usr/bin/env bash
# Relaxic — развернуть и сразу показать, что получилось.
#   bash scripts/deploy.sh            имя сервиса определяется само
#   bash scripts/deploy.sh my-service указать вручную
set -uo pipefail

URL_DEFAULT="https://relaxic-production.up.railway.app"
LOG="/tmp/relaxic-deploy.log"

b(){ printf "\033[38;2;232;72;43m%s\033[0m\n" "$1"; }
d(){ printf "\033[2m%s\033[0m\n" "$1"; }
ok(){ printf "\033[32m  ✓ %s\033[0m\n" "$1"; }
no(){ printf "\033[31m  ✕ %s\033[0m\n" "$1"; }
wa(){ printf "\033[33m  ! %s\033[0m\n" "$1"; }

b ""; b "  RELAXIC ✕  развёртывание"; b ""

git pull --rebase --quiet 2>/dev/null && ok "код обновлён ($(git rev-parse --short HEAD))" \
  || wa "git pull не прошёл — работаю с тем, что есть"

command -v railway >/dev/null 2>&1 || { no "Railway CLI не установлен: npm i -g @railway/cli"; exit 1; }
railway whoami >/dev/null 2>&1 || { no "не выполнен вход"; d "  railway login --browserless"; exit 1; }
ok "вход выполнен"
railway status >/dev/null 2>&1 || { no "папка не привязана"; d "  railway link"; exit 1; }

# ── Ищем сервис, а не угадываем ──────────────────────────────
SERVICE="${1:-}"
STATUS_JSON="$(railway status --json 2>/dev/null)"

if [ -z "$SERVICE" ]; then
  PAIR="$(node -e '
    let raw=""; process.stdin.on("data",c=>raw+=c).on("end",()=>{
      let list=[];
      const walk=(o)=>{ if(!o||typeof o!=="object")return;
        if(Array.isArray(o))return o.forEach(walk);
        const id=o.id||o.serviceId;
        if(typeof o.name==="string" && id) list.push(o.name+"\t"+id);
        Object.values(o).forEach(walk); };
      try{ walk(JSON.parse(raw)); }catch(e){}
      const bad=/postgres|mysql|redis|mongo|volume/i;
      const app=[...new Set(list)].filter(x=>!bad.test(x.split("\t")[0]));
      console.log(app[0]||"");
    });' <<<"$STATUS_JSON" 2>/dev/null)"
  SERVICE="${PAIR%%$'\t'*}"
  SERVICE_ID="${PAIR##*$'\t'}"
fi
SERVICE_ID="${SERVICE_ID:-}"

if [ -z "$SERVICE" ]; then
  no "не смог определить имя сервиса"
  b ""; d "  что вернул railway status:"; d "  ──────────────────────────────"
  railway status 2>&1 | head -30
  d "  ──────────────────────────────"
  d "  Запустите:  railway link"
  d "  и на шаге «Select a service» ВЫБЕРИТЕ сервис, не пропускайте через Esc."
  d "  Либо укажите имя вручную:  bash scripts/deploy.sh ИМЯ-СЕРВИСА"
  exit 1
fi
ok "сервис: $SERVICE${SERVICE_ID:+  (id $SERVICE_ID)}"

# Привязываем сервис к папке. Без этого -s по имени не резолвится
# и всё падает на «Service not found».
if railway service link "$SERVICE" >/dev/null 2>&1 \
   || railway service "$SERVICE" >/dev/null 2>&1 \
   || { [ -n "$SERVICE_ID" ] && railway service link "$SERVICE_ID" >/dev/null 2>&1; }; then
  ok "сервис привязан"
  BOUND=1
else
  wa "привязать не вышло — попробую через -s"
  BOUND=0
fi

# Команда с учётом привязки: привязан — без флага, иначе перебираем
rw(){
  local sub="$1"; shift
  if [ "$BOUND" = "1" ]; then railway "$sub" "$@" && return 0; fi
  railway "$sub" -s "$SERVICE" "$@" 2>/dev/null && return 0
  [ -n "$SERVICE_ID" ] && railway "$sub" -s "$SERVICE_ID" "$@" 2>/dev/null && return 0
  railway "$sub" "$@" 2>/dev/null
}

# ── Переменные ───────────────────────────────────────────────
b ""; d "  переменные:"
VARS="$(rw variables --kv 2>/dev/null)"
[ -z "$VARS" ] && VARS="$(rw variables 2>/dev/null)"

has(){ grep -qi "$1" <<<"$VARS" 2>/dev/null; }
# Разные версии CLI понимают разный синтаксис, поэтому перебираем
setv(){
  rw variables --set "$1" >/dev/null 2>&1 && return 0
  rw "variable" set "$1"  >/dev/null 2>&1 && return 0
  return 1
}

if [ -z "$VARS" ]; then
  wa "не смог прочитать переменные через CLI — не страшно,"
  d  "    после сборки сайт сам доложит, видит ли он базу"
  setv 'DATABASE_URL=${{Postgres.DATABASE_URL}}' && ok "DATABASE_URL проставил на всякий случай" || true
  setv "NEXT_PUBLIC_SITE_URL=$URL_DEFAULT" >/dev/null 2>&1 || true
else
  has "DATABASE_URL" && ok "DATABASE_URL задана" \
    || { setv 'DATABASE_URL=${{Postgres.DATABASE_URL}}' && ok "DATABASE_URL проставлена" \
         || wa "задайте в панели: Variables → DATABASE_URL = \${{Postgres.DATABASE_URL}}"; }
  has "NEXT_PUBLIC_SITE_URL" && ok "NEXT_PUBLIC_SITE_URL задана" \
    || { setv "NEXT_PUBLIC_SITE_URL=$URL_DEFAULT" >/dev/null 2>&1 && ok "NEXT_PUBLIC_SITE_URL проставлена"; }
  has "TELEGRAM_BOT_TOKEN" && ok "TELEGRAM_BOT_TOKEN задана" \
    || wa "TELEGRAM_BOT_TOKEN нет — заказы в Telegram не уйдут"
fi

# ── Домен ────────────────────────────────────────────────────
URL="$(rw domain --json 2>/dev/null | grep -oE '[a-z0-9.-]+\.up\.railway\.app' | head -1)"
URL="${URL:+https://$URL}"; URL="${URL:-$URL_DEFAULT}"
ok "адрес: $URL"

# ── Сборка ───────────────────────────────────────────────────
b ""; b "  собираю (3–6 минут)"; b ""
rw up -c 2>&1 | tee "$LOG"
BUILD=${PIPESTATUS[0]}

b ""
# CLI не смог залить — не беда: автосборка с GitHub работает,
# мой push её уже запустил. Просто дожидаемся результата.
if [ "$BUILD" -ne 0 ] && grep -qi "service not found" "$LOG"; then
  wa "CLI не смог залить напрямую"
  d  "  но автосборка с GitHub работает — мой push её уже запустил"
  b ""; d "  жду сборку на стороне Railway (до 8 минут)…"
  CODE=000
  for i in $(seq 1 48); do
    CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 "$URL/api/health" 2>/dev/null)"
    [ "$CODE" = "200" ] && break
    printf "."; sleep 10
  done
  echo
  if [ "$CODE" = "200" ]; then
    BUILD=0
  else
    no "сайт так и не ответил"
    b ""; d "  откройте Railway → relaxic → Deployments → Build Logs"
    d "  и пришлите последние 40 строк"
    exit 1
  fi
fi

if [ "$BUILD" -ne 0 ]; then
  no "сборка не прошла"
  if grep -qi "service not found" "$LOG"; then
    b ""; d "  CLI не видит сервис. Что он показывает:"; d "  ──────────────────────────────"
    railway service list 2>&1 | head -20
    railway status 2>&1 | head -20
    d "  ──────────────────────────────"
    d "  Запустите:  railway link"
    d "  и на шаге «Select a service» ВЫБЕРИТЕ relaxic, не жмите Esc."
  fi
  b ""; d "  последние 40 строк — пришлите их в чат:"; d "  ──────────────────────────────"
  tail -40 "$LOG"; d "  ──────────────────────────────"
  exit 1
fi
ok "сборка прошла"

d "  жду, пока поднимется…"
CODE=000
for i in $(seq 1 30); do
  CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 "$URL/api/health" 2>/dev/null)"
  [ "$CODE" = "200" ] && break; sleep 6
done

b ""
if [ "$CODE" = "200" ]; then
  ok "сайт отвечает"; b ""; b "  $URL"; b ""
  H="$(curl -s --max-time 10 "$URL/api/health")"
  DB="$(node -e 'let r="";process.stdin.on("data",c=>r+=c).on("end",()=>{try{const j=JSON.parse(r);
        console.log(j.db+(j.data?" — "+JSON.stringify(j.data):"")+(j.hint?"\n  подсказка: "+j.hint:""))}
        catch(e){console.log(r)}})' <<<"$H" 2>/dev/null)"
  d "  база: $DB"
else
  no "сборка прошла, но сайт не отвечает (код $CODE)"
  b ""; d "  логи запуска — пришлите их в чат:"; d "  ──────────────────────────────"
  rw logs 2>/dev/null | tail -40
  d "  ──────────────────────────────"
  exit 1
fi
