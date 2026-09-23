#!/usr/bin/env bash
# Relaxic — отправить код и дождаться, пока новая версия поднимется.
#
# Сборкой занимается Railway: она запускается сама при пуше в GitHub.
# Скрипт отправляет код и ждёт, пока сайт начнёт отвечать этим коммитом.
set -uo pipefail

URL="${RELAXIC_URL:-https://relaxic-production.up.railway.app}"

b(){ printf "\033[38;2;232;72;43m%s\033[0m\n" "$1"; }
d(){ printf "\033[2m%s\033[0m\n" "$1"; }
ok(){ printf "\033[32m  ✓ %s\033[0m\n" "$1"; }
no(){ printf "\033[31m  ✕ %s\033[0m\n" "$1"; }
wa(){ printf "\033[33m  ! %s\033[0m\n" "$1"; }

b ""; b "  RELAXIC ✕  развёртывание"; b ""

# ── 1. Отправляем код ────────────────────────────────────────
git pull --rebase --quiet 2>/dev/null
if [ -n "$(git status --porcelain)" ]; then
  git add -A && git commit -q -m "Правки с машины" && ok "локальные правки закоммичены"
fi
git push --quiet origin HEAD 2>/dev/null && ok "код отправлен" || d "  нечего отправлять"
WANT="$(git rev-parse --short=7 HEAD)"
ok "ожидаю коммит: $WANT"

# ── 2. Что на сайте сейчас ───────────────────────────────────
health(){ curl -s --max-time 10 "$URL/api/health" 2>/dev/null; }
field(){ node -e 'let r="";process.stdin.on("data",c=>r+=c).on("end",()=>{
  try{const j=JSON.parse(r);const v=j[process.argv[1]];
  console.log(typeof v==="object"?JSON.stringify(v):(v??""))}catch(e){console.log("")}})' "$1"; }

NOW="$(health | field commit)"
[ -n "$NOW" ] && d "  сейчас на сайте: $NOW" || d "  сайт сейчас не отвечает"

# ── 3. Ждём новую сборку ─────────────────────────────────────
b ""; d "  жду сборку на Railway (до 10 минут)"
d "  логи: https://railway.com → relaxic → Deployments"
b ""

GOT=""
for i in $(seq 1 60); do
  H="$(health)"
  GOT="$(field commit <<<"$H")"
  if [ "$GOT" = "$WANT" ]; then break; fi
  printf "."
  sleep 10
done
echo

# ── 4. Итог ──────────────────────────────────────────────────
b ""
if [ "$GOT" = "$WANT" ]; then
  ok "новая версия поднялась"
  b ""; b "  $URL"; b ""
  DB="$(field db <<<"$H")"; DATA="$(field data <<<"$H")"; HINT="$(field hint <<<"$H")"
  d "  база: $DB${DATA:+  $DATA}"
  [ -n "$HINT" ] && wa "$HINT"
  echo
  for p in / /api/health /img/fandom/harry-potter.jpg; do
    printf "  %-34s %s\n" "$p" "$(curl -so /dev/null -w '%{http_code}' --max-time 10 "$URL$p")"
  done
elif [ -n "$GOT" ]; then
  no "сайт отвечает, но старой версией ($GOT вместо $WANT)"
  d "  значит новая сборка упала"
  b ""; d "  Railway → relaxic → Deployments → Build Logs"
  d "  пришлите последние 40 строк"
  exit 1
else
  no "сайт не отвечает"
  b ""; d "  Railway → relaxic → Deployments"
  d "  посмотрите статус последней сборки и пришлите лог"
  exit 1
fi
