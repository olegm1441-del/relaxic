#!/usr/bin/env bash
# Relaxic — залить код напрямую в Railway и дождаться сайта.
#
# Почему напрямую, а не через GitHub: связь Railway с репозиторием
# застряла — сборщик раз за разом тянет один и тот же снимок кода
# (одинаковый sha, npm install из кеша). railway up обходит это,
# загружая содержимое папки.
set -uo pipefail

PROJECT="${RELAXIC_PROJECT:-charismatic-courtesy}"
SERVICE="${RELAXIC_SERVICE:-relaxic}"
ENVIRON="${RELAXIC_ENV:-production}"
URL="${RELAXIC_URL:-https://relaxic-production.up.railway.app}"
LOG="/tmp/relaxic-deploy.log"

b(){ printf "\033[38;2;232;72;43m%s\033[0m\n" "$1"; }
d(){ printf "\033[2m%s\033[0m\n" "$1"; }
ok(){ printf "\033[32m  ✓ %s\033[0m\n" "$1"; }
no(){ printf "\033[31m  ✕ %s\033[0m\n" "$1"; }
wa(){ printf "\033[33m  ! %s\033[0m\n" "$1"; }

b ""; b "  RELAXIC ✕  развёртывание"; b ""

command -v railway >/dev/null 2>&1 || { no "нет Railway CLI: npm i -g @railway/cli"; exit 1; }
railway whoami >/dev/null 2>&1 || { no "не выполнен вход"; d "  railway login --browserless"; exit 1; }
ok "вход выполнен"

# Раньше здесь стояло 2>/dev/null, и неудачный pull проходил молча —
# заливался старый код, а скрипт бодро рапортовал об успехе.
if ! git pull --rebase --quiet; then
  no "git pull не прошёл — на сервер уедет НЕ последняя версия"
  d "  разберитесь с этим и запустите скрипт заново"
  exit 1
fi
[ -n "$(git status --porcelain)" ] && { git add -A; git commit -q -m "Правки с машины"; }
if ! git push --quiet origin HEAD; then
  wa "git push не прошёл — на GitHub старая версия, но зальём то, что есть локально"
fi
WANT="$(git rev-parse --short=7 HEAD)"
ok "код готов, коммит $WANT"

# ── Привязка: проект + окружение + СЕРВИС ────────────────────
# Раньше сервис пропускали, а проектом выбирали relaxic — но relaxic
# это сервис внутри проекта charismatic-courtesy. Отсюда Service not found.
b ""
if railway link -p "$PROJECT" -e "$ENVIRON" -s "$SERVICE" >/dev/null 2>&1; then
  ok "привязка: $PROJECT / $ENVIRON / $SERVICE"
else
  wa "привязать автоматически не вышло"
  b ""; d "  проекты в вашем аккаунте:"; d "  ──────────────────────────────"
  railway list 2>&1 | head -25
  d "  ──────────────────────────────"
  d "  Запустите вручную и выберите ВСЕ ТРИ пункта:"
  d "     railway link"
  d "  проект — тот, внутри которого лежит сервис relaxic"
  d "  (в панели его имя слева вверху, рядом с production),"
  d "  окружение — production, сервис — relaxic. Esc не жать."
  exit 1
fi

# ── Штамп сборки ─────────────────────────────────────────────
# railway up заливает папку напрямую, и RAILWAY_GIT_COMMIT_SHA при этом
# пустая — снаружи было не понять, какая версия на сайте. Пишем SHA сами,
# файл едет в образ вместе с public и читается в /api/health.
printf '{"commit":"%s","at":"%s"}\n' "$WANT" "$(date '+%d.%m.%Y %H:%M')" > public/build.json
trap 'git checkout -- public/build.json 2>/dev/null || true' EXIT

# ── Заливка ──────────────────────────────────────────────────
b ""; b "  заливаю код напрямую (3–6 минут)"; b ""
railway up -c 2>&1 | tee "$LOG"
BUILD=${PIPESTATUS[0]}

b ""
if [ "$BUILD" -ne 0 ]; then
  no "сборка не прошла"
  b ""; d "  последние 40 строк — пришлите их в чат:"; d "  ──────────────────────────────"
  tail -40 "$LOG"; d "  ──────────────────────────────"
  exit 1
fi
ok "сборка прошла"

# ── Проверка ─────────────────────────────────────────────────
health(){ curl -s --max-time 10 "$URL/api/health" 2>/dev/null; }
field(){ node -e 'let r="";process.stdin.on("data",c=>r+=c).on("end",()=>{
  try{const j=JSON.parse(r);const v=j[process.argv[1]];
  console.log(typeof v==="object"?JSON.stringify(v):(v??""))}catch(e){console.log("")}})' "$1"; }

d "  жду, пока поднимется…"
H=""; for i in $(seq 1 40); do
  H="$(health)"; [ -n "$(field ok <<<"$H")" ] && break
  printf "."; sleep 8
done; echo

b ""
if [ -n "$(field ok <<<"$H")" ]; then
  ok "сайт отвечает"
  b ""; b "  $URL"; b ""
  GOT="$(field commit <<<"$H")"
  if [ "$GOT" = "$WANT" ]; then
    ok "на сайте ваш коммит: $GOT"
  else
    no "НА САЙТЕ СТАРАЯ СБОРКА: там $GOT, а залить пытались $WANT"
    d "  сборка прошла, но Railway отдаёт прежний образ."
    d "  Откройте панель Railway → сервис relaxic → Deployments"
    d "  и посмотрите, какой деплой помечен Active."
  fi
  echo
  DB="$(field db <<<"$H")"; DATA="$(field data <<<"$H")"; HINT="$(field hint <<<"$H")"
  d "  база: $DB${DATA:+  $DATA}"
  [ -n "$HINT" ] && wa "$HINT"
  echo
  for p in / /api/health /img/fandom/harry-potter.jpg; do
    printf "  %-34s %s\n" "$p" "$(curl -so /dev/null -w '%{http_code}' --max-time 10 "$URL$p")"
  done
else
  no "сборка прошла, но сайт не отвечает"
  b ""; d "  логи запуска:"; d "  ──────────────────────────────"
  railway logs 2>/dev/null | tail -40
  d "  ──────────────────────────────"
  exit 1
fi
