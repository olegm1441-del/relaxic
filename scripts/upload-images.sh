#!/usr/bin/env bash
# Relaxic — выгрузка паков с картинками в репозиторий.
# macOS и Linux. Windows — upload-images.ps1
set -uo pipefail

REPO_URL="https://github.com/olegm1441-del/relaxic.git"
BRANCH="main"
DEST="public/img/incoming"
MAXPX=2200          # длинная сторона
QUALITY=82

say(){ printf "\033[38;2;232;72;43m%s\033[0m\n" "$1"; }
dim(){ printf "\033[2m%s\033[0m\n" "$1"; }
warn(){ printf "\033[33m%s\033[0m\n" "$1"; }
die(){ printf "\033[31m✕ %s\033[0m\n" "$1" >&2; exit 1; }

say ""; say "  RELAXIC ✕  выгрузка картинок"; say ""

command -v git >/dev/null || die "Git не установлен. Поставьте GitHub Desktop — git идёт вместе с ним."

# ── 1. Папка с паками ────────────────────────────────────────
SRC=""
if [ -n "${1:-}" ] && [ -d "${1:-}" ]; then SRC="$1"; else
  for d in "$HOME/Desktop/картинки" "$HOME/Downloads/картинки" \
           "$HOME/Рабочий стол/картинки" "$HOME/Загрузки/картинки" \
           "$HOME/Desktop/kartinki" "$HOME/Downloads/kartinki"; do
    [ -d "$d" ] && { SRC="$d"; break; }
  done
fi
[ -n "$SRC" ] || die "Не нашёл папку «картинки» на Рабочем столе и в Загрузках.
   Или укажите путь:  bash $0 /путь/к/папке"
dim "  папка:       $SRC"

# ── 2. Репозиторий ───────────────────────────────────────────
REPO=""
for d in "$HOME/Documents/GitHub/relaxic" "$HOME/GitHub/relaxic" \
         "$HOME/Documents/relaxic" "$HOME/relaxic"; do
  [ -d "$d/.git" ] && { REPO="$d"; break; }
done
if [ -z "$REPO" ]; then
  REPO="$HOME/Documents/GitHub/relaxic"
  dim "  репозиторий не найден — клонирую"
  mkdir -p "$(dirname "$REPO")"
  git clone --branch "$BRANCH" "$REPO_URL" "$REPO" \
    || die "Не смог клонировать. Войдите в GitHub Desktop под своим аккаунтом."
fi
dim "  репозиторий: $REPO"

# ── 3. Распаковка ────────────────────────────────────────────
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
PACKS=0
while IFS= read -r -d '' z; do
  unzip -q -o "$z" -d "$TMP/$(basename "${z%.zip}")" 2>/dev/null && PACKS=$((PACKS+1))
done < <(find "$SRC" -maxdepth 1 -type f -iname '*.zip' -print0)

# Картинки могут лежать и просто так, без архива
find "$SRC" -maxdepth 2 -type f \
  \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.webp' \) \
  -exec cp {} "$TMP/" \; 2>/dev/null

[ "$PACKS" -gt 0 ] && dim "  распаковано паков: $PACKS"

# ── 4. Отбор без дублей ──────────────────────────────────────
# В паках одни и те же файлы лежат и в public/img/, и в raw_generations/.
# Отбираем по содержимому: одинаковые картинки берём один раз.
mkdir -p "$DEST" 2>/dev/null
cd "$REPO" || die "Не смог перейти в репозиторий"
mkdir -p "$DEST"

HASHES="$TMP/.seen"; : > "$HASHES"
sha(){ if command -v shasum >/dev/null; then shasum -a1 "$1" | cut -d' ' -f1
       else sha1sum "$1" | cut -d' ' -f1; fi; }

# Транслит кириллических имён: в URL сайта кириллица требует
# экранирования и читается плохо.
#
# Через sed s///g, а не y/// и не посимвольно в bash: y/// требует
# одинаковой длины строк и на многобайтной кириллице падает, а разбор
# ${s:i:1} зависит от локали и в не-UTF-8 окружении режет байты.
# s///g заменяет байтовую последовательность и работает везде.
translit(){
  printf '%s' "$1" | LC_ALL=C sed '
s/ё/e/g
s/Ё/e/g
s/ж/zh/g
s/Ж/zh/g
s/ч/ch/g
s/Ч/ch/g
s/ш/sh/g
s/Ш/sh/g
s/щ/sch/g
s/Щ/sch/g
s/ю/yu/g
s/Ю/yu/g
s/я/ya/g
s/Я/ya/g
s/ъ//g
s/Ъ//g
s/ь//g
s/Ь//g
s/а/a/g
s/А/a/g
s/б/b/g
s/Б/b/g
s/в/v/g
s/В/v/g
s/г/g/g
s/Г/g/g
s/д/d/g
s/Д/d/g
s/е/e/g
s/Е/e/g
s/з/z/g
s/З/z/g
s/и/i/g
s/И/i/g
s/й/j/g
s/Й/j/g
s/к/k/g
s/К/k/g
s/л/l/g
s/Л/l/g
s/м/m/g
s/М/m/g
s/н/n/g
s/Н/n/g
s/о/o/g
s/О/o/g
s/п/p/g
s/П/p/g
s/р/r/g
s/Р/r/g
s/с/s/g
s/С/s/g
s/т/t/g
s/Т/t/g
s/у/u/g
s/У/u/g
s/ф/f/g
s/Ф/f/g
s/х/h/g
s/Х/h/g
s/ц/c/g
s/Ц/c/g
s/ы/y/g
s/Ы/y/g
s/э/e/g
s/Э/e/g
s/[^a-zA-Z0-9._-]/-/g
s/--*/-/g
s/^-//
s/-$//' | tr 'A-Z' 'a-z'
}

HAVE_SIPS=0; command -v sips >/dev/null && HAVE_SIPS=1
KEPT=0; DUPES=0; SHRUNK=0

while IFS= read -r -d '' f; do
  case "$f" in *__MACOSX*|*.DS_Store) continue;; esac
  h="$(sha "$f")"
  if grep -q "^$h$" "$HASHES" 2>/dev/null; then DUPES=$((DUPES+1)); continue; fi
  echo "$h" >> "$HASHES"

  base="$(basename "$f")"; ext="${base##*.}"; stem="${base%.*}"
  name="$(translit "$stem")"
  # Если имя целиком из символов, которые не переводятся — берём хеш,
  # иначе файлы затрут друг друга
  [ -n "$name" ] || name="img-${h:0:10}"
  # Разные картинки с одинаковым именем разводим суффиксом
  cand="$name"; k=2
  while [ -e "$DEST/$cand.jpg" ] || [ -e "$DEST/$cand.$ext" ]; do
    cand="${name}-${k}"; k=$((k+1))
  done
  name="$cand"
  out="$DEST/$name.${ext}"

  if [ "$HAVE_SIPS" = "1" ]; then
    # 3 МБ PNG превращается примерно в 400 КБ JPEG без заметной потери
    out="$DEST/$name.jpg"
    if sips -Z "$MAXPX" -s format jpeg -s formatOptions "$QUALITY" \
            "$f" --out "$out" >/dev/null 2>&1; then
      SHRUNK=$((SHRUNK+1))
    else
      cp "$f" "$DEST/$name.${ext}"
    fi
  else
    cp "$f" "$out"
  fi
  KEPT=$((KEPT+1))
done < <(find "$TMP" -type f \
          \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' \
             -o -iname '*.webp' -o -iname '*.avif' \) -print0)

[ "$KEPT" -gt 0 ] || die "Картинок не нашлось. Проверьте, что в папке лежат relaxic_pack_*.zip"

SIZE=$(du -sh "$DEST" 2>/dev/null | cut -f1)
say ""
say "  картинок:    $KEPT"
[ "$DUPES" -gt 0 ]  && dim "  дублей пропущено: $DUPES"
[ "$SHRUNK" -gt 0 ] && dim "  сжато:       $SHRUNK (до ${MAXPX}px, JPEG ${QUALITY})"
[ "$HAVE_SIPS" = "0" ] && warn "  sips недоступен — картинки уйдут как есть, сожму на сервере"
dim "  объём:       $SIZE"

# ── 5. Отправка ──────────────────────────────────────────────
git fetch origin "$BRANCH" --quiet 2>/dev/null
git checkout "$BRANCH" --quiet 2>/dev/null || git checkout -b "$BRANCH" --quiet
git pull --rebase origin "$BRANCH" --quiet 2>/dev/null

git add "$DEST"
if git diff --cached --quiet; then
  say ""; say "  Новых картинок нет — всё уже залито."; exit 0
fi

git commit -q -m "Картинки: $KEPT файлов"
say "  отправляю на GitHub…"
for i in 1 2 4 8 16; do
  if git push origin "$BRANCH" 2>/dev/null; then
    say ""; say "  ✓ Готово — $KEPT картинок в репозитории."
    dim "  Напишите в чат: «картинки залил»."
    exit 0
  fi
  dim "  сеть подвела, повтор через ${i}с"; sleep "$i"
done
die "Не смог отправить. Проверьте вход в GitHub Desktop и интернет."
