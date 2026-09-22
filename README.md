# Relaxic ✕

Интернет-магазин наборов для творчества по вселенным кино, сериалов, игр,
мультфильмов и аниме: картины по номерам, алмазные мозаики, вышивка крестиком.

**Соберите свою вселенную.**

150+ наборов · 800–1 500 ₽ · доставка по РФ бесплатно от 5 000 ₽

---

## Статус

Подготовка завершена: вводные собраны, документация перезаполнена, скелет проекта
собирается. **Сайт собирается на следующем шаге — после получения картинок.**

---

## Три команды

**Развернуть на Railway** (нужен один вход через браузер):
```bash
TELEGRAM_BOT_TOKEN="ваш_токен" bash scripts/railway-setup.sh
```

**Залить картинки** — паки `relaxic_pack_NN.zip` из папки «картинки»:
```bash
bash scripts/upload-images.sh
```

**Поднять локально:**
```bash
npm run pzm
```
Без `DATABASE_URL` тоже работает — на демо-данных.

---

## Документы

| Файл | Что внутри |
|---|---|
| [`docs/00-ANSWERS.md`](docs/00-ANSWERS.md) | Вводные от команды и что осталось уточнить |
| [`docs/01-BRIEF.md`](docs/01-BRIEF.md) | Аудитория, боли, пути клиента, блог, семантика |
| [`docs/02-TZ.md`](docs/02-TZ.md) | Техзадание: стек, страницы, корзина, Telegram, cookie, данные |
| [`docs/03-BRANDBOOK.md`](docs/03-BRANDBOOK.md) | Логотип, палитра, типографика, компоненты, движение |
| [`docs/04-IMAGE-PROMPTS.md`](docs/04-IMAGE-PROMPTS.md) | 85 промтов для генерации изображений |
| [`docs/05-BENCHMARKS.md`](docs/05-BENCHMARKS.md) | Разбор конкурентов и обоснование решений |
| [`docs/06-SITEMAP.md`](docs/06-SITEMAP.md) | 52 страницы, матрица перелинковки |
| [`docs/07-RAILWAY.md`](docs/07-RAILWAY.md) | Что нажать в Railway |
| [`docs/08-TRAFFIC-MAP.pptx`](docs/08-TRAFFIC-MAP.pptx) | Воронка: Охват → … → Лояльность |

### Визуальные материалы

| Файл | Что это |
|---|---|
| [`docs/assets/brandbook-1page.pdf`](docs/assets/brandbook-1page.pdf) | Бренд-бук на одной странице, A4 альбомная |
| [`docs/assets/mindmap.pdf`](docs/assets/mindmap.pdf) | Карта сайта как путь клиента, A3 альбомная |
| [`docs/assets/logo.png`](docs/assets/logo.png) | Логотип |

---

## Стек

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Prisma 7 + PostgreSQL ·
Zustand · Zod 4 · motion · Lenis · Embla · Lucide

Шрифты: **Unbounded** (заголовки) и **Onest** (текст), оба с полной кириллицей.

---

## Переменные окружения

```bash
cp .env.example .env
```

| Переменная | Обязательна | Зачем |
|---|---|---|
| `DATABASE_URL` | нет* | Postgres. Railway подставляет сам |
| `TELEGRAM_BOT_TOKEN` | для заказов | Бот `@relaxicccc_adminbot` |
| `TELEGRAM_CHAT_ID` | для заказов | **Ещё не получен** |
| `NEXT_PUBLIC_SITE_URL` | для прода | Канонические URL, OG, sitemap |
| `NEXT_PUBLIC_YANDEX_METRIKA_ID` | нет | Грузится только после согласия на аналитику |
| `ADMIN_TOKEN` | для `/admin` | Доступ в админку |

\* без неё сайт работает на демо-данных.

Как получить `chat_id` — в [`docs/07-RAILWAY.md`](docs/07-RAILWAY.md).

---

## Команды

| Команда | Что делает |
|---|---|
| `npm run pzm` | Поднять всё одной командой |
| `npm run dev` | Dev-сервер |
| `npm run build` | Продакшн-сборка |
| `npm run typecheck` | Проверка типов |
| `npm run db:push` | Применить схему к базе |
| `npm run db:seed` | Наполнить демо-данными |

---

## Деплой

Railway — [`docs/07-RAILWAY.md`](docs/07-RAILWAY.md).
Коротко: New Project → Deploy from GitHub → добавить Postgres → вписать переменные → Generate Domain.
