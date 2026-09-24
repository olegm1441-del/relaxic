#!/usr/bin/env bash
# Relaxic — залить код напрямую в Railway и дождаться сайта.
#
# Почему напрямую, а не через GitHub: связь Railway с репозиторием
# застряла — сборщик раз за разом тянет один и тот же снимок кода
# (одинаковый sha, npm install из кеша). railway up обходит это,
# загружая содержимое папки.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

SERVICE="${RELAXIC_SERVICE:-relaxic}"
ENVIRON="${RELAXIC_ENV:-production}"
URL="${RELAXIC_URL:-https://relaxic-production.up.railway.app}"
LOG="/tmp/relaxic-deploy.log"
STORE="$ROOT/.deploy.local"

b(){ printf "\033[38;2;232;72;43m%s\033[0m\n" "$1"; }
d(){ printf "\033[2m%s\033[0m\n" "$1"; }
ok(){ printf "\033[32m  ✓ %s\033[0m\n" "$1"; }
no(){ printf "\033[31m  ✕ %s\033[0m\n" "$1"; }
wa(){ printf "\033[33m  ! %s\033[0m\n" "$1"; }

b ""; b "  RELAXIC ✕  развёртывание"; b ""

command -v railway >/dev/null 2>&1 || { no "нет Railway CLI: npm i -g @railway/cli"; exit 1; }
railway whoami >/dev/null 2>&1 || { no "не выполнен вход"; d "  railway login --browserless"; exit 1; }
ok "вход выполнен"

# ── Код ──────────────────────────────────────────────────────
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

# ── Привязка: проект + окружение + сервис ────────────────────
# Проект в Railway переименовали (был charismatic-courtesy, стал relaxic),
# и проектов с именем relaxic в аккаунте теперь два — по имени не выбрать.
# Поэтому ищем по id и проверяем себя доменом: тот ли сервис под рукой.
HOST="${URL#https://}"; HOST="${HOST%%/*}"
[ -f "$STORE" ] && . "$STORE"

# </dev/null — чтобы CLI не ушёл в интерактивный вопрос и не завис
rail(){ railway "$@" </dev/null 2>/dev/null; }

# Домен сервиса, к которому мы сейчас привязаны.
linked_host(){
  rail variables --json | node -e 'let r="";process.stdin.on("data",c=>r+=c).on("end",()=>{
    try{ const j=JSON.parse(r);
      const v = j.RAILWAY_PUBLIC_DOMAIN || j.RAILWAY_STATIC_URL || "";
      process.stdout.write(String(v).replace(/^https?:\/\//,"").replace(/\/.*$/,""));
    }catch(e){} })'
}

# ok — это наш сервис, bad — чужой, unknown — CLI не дал проверить.
check(){
  local h; h="$(linked_host)"
  if [ -z "$h" ]; then echo unknown
  elif [ "$h" = "$HOST" ]; then echo ok
  else echo bad; fi
}

# Проекты, похожие на наш: "id<TAB>имя". Форма JSON у railway list
# менялась от версии к версии, поэтому обходим дерево целиком.
candidates(){
  rail list --json | node -e 'let r="";process.stdin.on("data",c=>r+=c).on("end",()=>{
    const seen={}, out=[];
    // Внутри проекта тоже есть сервис с именем relaxic — его id нам не нужен,
    // поэтому во вложенные services/environments не спускаемся.
    const inner = /^(services|environments|deployments|serviceInstances|volumes)$/;
    try{
      (function walk(v, blocked){
        if(Array.isArray(v)) return v.forEach(function(x){ walk(x, blocked); });
        if(v && typeof v === "object"){
          if(!blocked && typeof v.id === "string" && /^[0-9a-f-]{32,36}$/i.test(v.id)
             && typeof v.name === "string" && /relaxic|charismatic/i.test(v.name)
             && !seen[v.id]){ seen[v.id] = 1; out.push(v.id + "\t" + v.name); }
          Object.keys(v).forEach(function(k){ walk(v[k], blocked || inner.test(k)); });
        }
      })(JSON.parse(r), false);
    }catch(e){ /* CLI не умеет --json или ответил пусто — ищем по именам */ }
    process.stdout.write(out.join("\n"));
  })'
}

LINKED=""; LINKID=""; PROV=""; PROVNAME=""; PROVN=0
try_link(){  # $1 — id или имя проекта, $2 — как назвать в логе
  rail link -p "$1" -e "$ENVIRON" -s "$SERVICE" || return 1
  case "$(check)" in
    ok) LINKED="$2"; LINKID="$1"; return 0 ;;
    unknown)
      PROVN=$((PROVN + 1))
      [ -n "$PROV" ] || { PROV="$1"; PROVNAME="$2"; }
      return 1 ;;
    *)  return 1 ;;
  esac
}

b ""
# 1. Привязка уже сохранена CLI и ведёт куда надо — не трогаем.
[ "$(check)" = ok ] && LINKED="сохранённая привязка"

# 2. id, записанный в .deploy.local или переданный в окружении.
if [ -z "$LINKED" ] && [ -n "${RELAXIC_PROJECT_ID:-}" ]; then
  try_link "$RELAXIC_PROJECT_ID" "id из .deploy.local"
fi

# 3. Перебираем проекты по id: тот, внутри которого наш домен, и есть наш.
CANDS=""
if [ -z "$LINKED" ]; then
  CANDS="$(candidates)"
  while IFS="$(printf '\t')" read -r cid cname; do
    [ -n "$cid" ] || continue
    try_link "$cid" "проект «$cname»" && break
  done <<EOC
$CANDS
EOC
fi

# 4. По имени — как раньше. Только если список проектов получить не вышло:
#    иначе один и тот же проект посчитается дважды, под id и под именем.
if [ -z "$LINKED" ] && [ -z "$CANDS" ]; then
  for p in "${RELAXIC_PROJECT:-relaxic}" relaxic charismatic-courtesy; do
    try_link "$p" "проект «$p»" && break
  done
fi

# 5. Привязались, но домен проверить нечем. Берём — только если подошёл
#    ровно один проект: ткнуть наугад в чужой хуже, чем переспросить.
if [ -z "$LINKED" ] && [ "$PROVN" = 1 ]; then
  rail link -p "$PROV" -e "$ENVIRON" -s "$SERVICE"
  LINKED="$PROVNAME"; LINKID="$PROV"
  wa "домен сервиса проверить не удалось — сверимся после заливки"
fi

if [ -n "$LINKED" ]; then
  ok "привязка: $LINKED / $ENVIRON / $SERVICE"
  # Запомним id, чтобы в следующий раз не перебирать.
  case "$LINKID" in
    [0-9a-fA-F]*-*-*-*-*) printf 'RELAXIC_PROJECT_ID=%s\n' "$LINKID" > "$STORE" ;;
  esac
else
  if [ "$PROVN" -gt 1 ]; then
    no "к сервису $SERVICE подошло несколько проектов — какой из них ваш, не угадать"
  else
    no "не удалось привязаться к сервису $SERVICE"
  fi
  b ""
  if [ -n "$CANDS" ]; then
    d "  подходящие проекты (id — имя):"; d "  ──────────────────────────────"
    printf '%s\n' "$CANDS" | while IFS="$(printf '\t')" read -r cid cname; do
      [ -n "$cid" ] && d "  $cid  —  $cname"
    done
  else
    d "  проекты в вашем аккаунте:"; d "  ──────────────────────────────"
    railway list 2>&1 | head -25
  fi
  d "  ──────────────────────────────"
  d "  Откройте панель Railway на сервисе relaxic. В адресной строке"
  d "  будет railway.com/project/ID/service/…  — скопируйте первый ID и:"
  d "     echo 'RELAXIC_PROJECT_ID=ID' > $STORE"
  d "  затем запустите скрипт заново. Или разово: railway link"
  d "  (проект — тот, где лежит сервис relaxic; окружение — production;"
  d "  сервис — relaxic; Esc не жать)."
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
