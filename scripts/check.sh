#!/usr/bin/env bash
# Relaxic — одной командой проверить живой сайт.
#
# Главное, что здесь проверяется, — счётчик Метрики. Его нельзя увидеть
# в HTML: до согласия на аналитику тег не выводится вовсе, это требование
# закона. Поэтому смотрим не разметку, а код, который уехал в браузер:
# если в нём есть адрес tag.js, идентификатор счётчика и имена целей —
# счётчик на сайте есть и считает, как только человек нажмёт «Принять все».
set -uo pipefail

URL="${1:-${RELAXIC_URL:-https://relaxic-production.up.railway.app}}"
URL="${URL%/}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
ID="113157679"
BAD=0

b(){ printf "\033[38;2;232;72;43m%s\033[0m\n" "$1"; }
d(){ printf "\033[2m%s\033[0m\n" "$1"; }
ok(){ printf "\033[32m  ✓ %s\033[0m\n" "$1"; }
no(){ printf "\033[31m  ✕ %s\033[0m\n" "$1"; BAD=$((BAD+1)); }
wa(){ printf "\033[33m  ! %s\033[0m\n" "$1"; }
get(){ curl -sS -m 25 "$@"; }
code(){ get -o /dev/null -w "%{http_code}" "$1"; }

b ""; b "  RELAXIC ✕  проверка  $URL"; b ""

# ── 1. Версия на сайте ───────────────────────────────────────
d "  версия"
H="$(get "$URL/api/health")" || { no "сайт не отвечает"; echo; exit 1; }
LIVE="$(printf '%s' "$H" | sed -n 's/.*"commit":"\([^"]*\)".*/\1/p')"
DB="$(printf '%s' "$H" | sed -n 's/.*"db":"\([^"]*\)".*/\1/p')"
case "$LIVE" in
  "") no "сайт не сообщил версию";;
  "без штампа") wa "сайт собран мимо scripts/deploy.sh — версия неизвестна";;
  *) ok "на сайте коммит $LIVE";;
esac
WANT=""
[ -d "$ROOT/.git" ] && WANT="$(git -C "$ROOT" rev-parse --short=7 HEAD 2>/dev/null)"
if [ -n "$WANT" ]; then
  if [ "$LIVE" = "$WANT" ]; then ok "это и есть последняя версия"
  else no "последняя версия — $WANT, а на сайте $LIVE: выкат не доехал"; d "     лечится: bash scripts/deploy.sh"; fi
fi
case "$DB" in
  "подключена") ok "база подключена";;
  "") wa "состояние базы не сообщено";;
  *) no "база: $DB";;
esac

# ── 2. Счётчик в коде, который уехал в браузер ───────────────
echo; d "  счётчик Метрики $ID"
# Код счётчика лежит в одном куске, а имена целей — в кусках тех страниц,
# где цели срабатывают. Поэтому собираем скрипты с нескольких страниц.
PROD="$(get "$URL/sitemap.xml" | grep -o '<loc>[^<]*</loc>' | sed 's|</*loc>||g' | sed 's|https\?://[^/]*||' | grep '^/product/' | head -1)"
: > "$TMP/bundle.js"; : > "$TMP/js.txt"
: > "$TMP/html.txt"
for p in / /quiz /cart "${PROD:-/catalog}"; do
  get -o "$TMP/page.html" -w "" "$URL$p" || { no "$p не открылась"; continue; }
  cat "$TMP/page.html" >> "$TMP/html.txt"
  grep -o '/_next/static/[^"]*\.js' "$TMP/page.html" >> "$TMP/js.txt"
done
sort -u "$TMP/js.txt" -o "$TMP/js.txt"
JS="$(wc -l < "$TMP/js.txt" | tr -d ' ')"
[ "$JS" -gt 0 ] && d "     скриптов на 4 страницах: $JS" || no "на страницах нет ни одного скрипта"
while read -r f; do get "$URL$f" >> "$TMP/bundle.js"; done < "$TMP/js.txt"
d "     скачано кода: $(( $(wc -c < "$TMP/bundle.js") / 1024 )) КБ"

has(){ grep -qF "$1" "$TMP/bundle.js"; }
has "mc.yandex.ru/metrika/tag.js" && ok "адрес счётчика tag.js на месте" || no "в коде сайта нет tag.js — счётчика нет"
# Идентификатор не попадает в скрипты: сервер передаёт его разметкой,
# как свойство компонента. Поэтому ищем его именно в разметке.
grep -qF "$ID" "$TMP/html.txt" && ok "идентификатор счётчика $ID уехал на страницу" \
  || no "страница не передаёт идентификатор $ID — счётчику некуда отправлять"
has "metrika-counter" && ok "тег счётчика с безопасным id — window.ym не затирается элементом" \
  || no "старая сборка: тег с id=\"ym\" затирает функцию ym, ни один визит не считается"
has '"hit"' && ok "просмотры при переходах по ссылкам отправляются" || wa "вызова hit в коде не нашлось"
MISS=""
for g in quiz_start quiz_done add_to_cart checkout_open order_done custom_sent; do
  has "$g" || MISS="$MISS $g"
done
[ -z "$MISS" ] && ok "все 6 целей в коде: quiz_start, quiz_done, add_to_cart, checkout_open, order_done, custom_sent" \
  || no "целей нет в коде:$MISS"
has "relaxic-consent" && ok "счётчик включается после согласия — так требует закон" || wa "согласие на аналитику в коде не найдено"

# ── 3. Поисковики ────────────────────────────────────────────
echo; d "  поиск"
for f in /robots.txt /sitemap.xml; do
  c="$(code "$URL$f")"; [ "$c" = "200" ] && ok "$f отвечает" || no "$f → $c"
done
YA="$(ls "$ROOT/public" 2>/dev/null | grep -i '^yandex_.*\.html$' | head -1)"
if [ -n "$YA" ]; then
  c="$(code "$URL/$YA")"; [ "$c" = "200" ] && ok "файл подтверждения прав $YA отвечает" || no "$YA → $c"
fi
N="$(get "$URL/sitemap.xml" | grep -c '<loc>')"
[ "$N" -gt 50 ] && ok "в карте сайта $N адресов" || wa "в карте сайта всего $N адресов"

# ── 4. Страницы ──────────────────────────────────────────────
echo; d "  страницы"
# Адреса берём из самой карты сайта, а не списком в скрипте:
# иначе проверка начинает врать, как только появляется новый раздел.
get "$URL/sitemap.xml" | grep -o '<loc>[^<]*</loc>' | sed 's|</*loc>||g' > "$TMP/locs.txt"
BASE_IN_MAP="$(head -1 "$TMP/locs.txt" | sed 's|\(https\?://[^/]*\).*|\1|')"
if [ -n "$BASE_IN_MAP" ]; then
  if [ "$BASE_IN_MAP" = "$URL" ]; then ok "адреса в карте сайта ведут на $URL"
  else no "в карте сайта чужой адрес: $BASE_IN_MAP вместо $URL — Яндекс такую карту не примет"
       d "     лечится: Railway → Variables → NEXT_PUBLIC_SITE_URL = $URL"; fi
fi
sed 's|https\?://[^/]*||' "$TMP/locs.txt" | awk 'NR==1||NR%6==0' > "$TMP/pages.txt"
echo "/cart" >> "$TMP/pages.txt"
FAIL=0; TOTAL=0
while read -r p; do
  [ -n "$p" ] || continue
  TOTAL=$((TOTAL+1)); c="$(code "$URL$p")"
  [ "$c" = "200" ] || { no "$p → $c"; FAIL=$((FAIL+1)); }
done < "$TMP/pages.txt"
[ "$FAIL" = 0 ] && ok "все $TOTAL проверенных страниц отвечают 200"

# ── Итог ─────────────────────────────────────────────────────
echo
if [ "$BAD" = 0 ]; then b "  ВСЁ РАБОТАЕТ"; else printf "\033[31m  ПРОБЛЕМ: %s\033[0m\n" "$BAD"; fi
echo
exit $([ "$BAD" = 0 ] && echo 0 || echo 1)
