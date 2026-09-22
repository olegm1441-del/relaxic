/**
 * Демо-данные Relaxic.
 *
 * Обычный .mjs, а не .ts под tsx: на Railway NODE_ENV=production,
 * npm ci пропускает devDependencies, и tsx там просто не окажется.
 * @prisma/client — обычная зависимость, поэтому node справится сам.
 *
 * Скрипт идемпотентен: гоняется при каждом деплое и ничего не дублирует.
 * Всё созданное помечается isSeeded, чтобы потом одним запросом
 * отделить демо от настоящего.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("  seed: DATABASE_URL не задан — пропускаю");
  process.exit(0);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const FANDOMS = [
  ["harry-potter",    "Гарри Поттер",    "FILM",    "Магия, которую можно собрать руками"],
  ["marvel",          "Марвел",          "FILM",    "Герои, на которых выросли"],
  ["game-of-thrones", "Игра престолов",  "SERIES",  "Север помнит"],
  ["star-wars",       "Звёздные войны",  "FILM",    "Давным-давно в далёкой галактике"],
  ["cyberpunk",       "Киберпанк",       "GAME",    "Неон, дождь и провода"],
  ["anime",           "Аниме",           "ANIME",   "Кадры, которые хочется на стену"],
  ["studio-ghibli",   "Аниме-классика",  "ANIME",   "Тёплое детство на холсте"],
  ["retro-games",     "Ретро-игры",      "CARTOON", "Пиксели, на которых мы выросли"],
  ["cult-cinema",     "Культовое кино",  "FILM",    "Нуар, дождь и один фонарь"],
];

// [slug, название, фандом, техника, цена(коп), сложность, часы, цветов]
const PRODUCTS = [
  ["great-hall",   "Большой зал",          "harry-potter",    "DIAMOND_MOSAIC",   149000, 4, 18, 32],
  ["owl-mini",     "Сова на ветке",        "harry-potter",    "PAINT_BY_NUMBERS",  80000, 1,  3, 12],
  ["snow-rider",   "Всадник в метели",     "game-of-thrones", "PAINT_BY_NUMBERS", 129000, 3, 12, 24],
  ["dragon-peak",  "Дракон над вершиной",  "game-of-thrones", "DIAMOND_MOSAIC",   150000, 5, 28, 38],
  ["spider-city",  "Полёт над городом",    "marvel",          "PAINT_BY_NUMBERS", 135000, 3, 14, 28],
  ["nebula",       "Сияющая галактика",    "star-wars",       "DIAMOND_MOSAIC",   142000, 4, 19, 26],
  ["neon-alley",   "Неоновый переулок",    "cyberpunk",       "DIAMOND_MOSAIC",   148000, 5, 24, 34],
  ["anime-rooftop","Закат над крышей",     "anime",           "PAINT_BY_NUMBERS", 119000, 2,  8, 20],
  ["samurai-rain", "Самурай под дождём",   "anime",           "DIAMOND_MOSAIC",   145000, 5, 26, 36],
  ["cozy-village", "Деревня у моря",       "studio-ghibli",   "PAINT_BY_NUMBERS", 125000, 3, 10, 22],
  ["arcade-night", "Ночь у автомата",      "retro-games",     "PAINT_BY_NUMBERS",  99000, 2,  7, 16],
  ["noir-street",  "Нуарная улица",        "cult-cinema",     "CROSS_STITCH",     128000, 4, 22, 18],
];

const SIZES = [["20×20", 20, 20, -30000], ["30×40", 30, 40, 0], ["40×50", 40, 50, 20000]];

const REVIEW_TEXTS = [
  ["Марина К.", 5, "Собирала три вечера, оторваться не могла. Стразы плотные, ничего не осыпалось."],
  ["Дмитрий Р.", 5, "Брал для себя после работы. Холст плотный, схема чёткая — как раз то, что искал."],
  ["Аня", 4, "Красиво вышло, но на мелкие детали ушло больше времени, чем думала. Результатом довольна."],
  ["Екатерина С.", 5, "Сыну семь, собрал почти сам. Детали крупные, краски без запаха."],
  ["Игорь", 5, "Второй набор беру. Качество то же, что в первый раз."],
];

const ARTICLES = [
  ["chem-zanyat-rebenka", "Чем занять ребёнка без экрана", "WORKSHOP",
   "Десять занятий, которые держат внимание дольше мультика."],
  ["mozaika-vs-nomera", "Мозаика или картина по номерам", "WORKSHOP",
   "Чем техники отличаются на самом деле и что выбрать новичку."],
  ["relaks-rukami", "Почему монотонная работа руками снимает тревогу", "RELAX",
   "Что происходит с вниманием, когда руки заняты простым делом."],
];

async function main() {
  console.log("  seed: наполняю базу…");

  for (const [i, [slug, title, category, tagline]] of FANDOMS.entries()) {
    await prisma.fandom.upsert({
      where: { slug },
      create: { slug, title, category, tagline, sort: i, coverUrl: `/img/fandom/${slug}.jpg` },
      update: { title, category, tagline, sort: i },
    });
  }
  console.log(`  seed: фандомов — ${FANDOMS.length}`);

  let nProducts = 0, nReviews = 0;
  for (const [slug, title, fandomSlug, technique, price, difficulty, hours, colors] of PRODUCTS) {
    const fandom = await prisma.fandom.findUnique({ where: { slug: fandomSlug } });
    if (!fandom) continue;

    const product = await prisma.product.upsert({
      where: { slug },
      create: {
        slug, title, fandomId: fandom.id, technique, price, difficulty, hours,
        colorsCount: colors, minAge: difficulty <= 2 ? 6 : 12, isSeeded: true,
        isHit: difficulty >= 4, isNew: difficulty <= 2,
        description: `${title} — набор по вселенной «${fandom.title}». ` +
          `Сложность ${difficulty} из 5, примерно ${hours} часов работы.`,
        story: `Кадр, который узнают с первого взгляда. Собирается ${hours} часов — ` +
          `это несколько спокойных вечеров.`,
        boxContents: [
          { title: "Холст с нанесённой схемой", note: "плотность 280 г/м²" },
          { title: `Набор из ${colors} цветов`, note: "запас с избытком" },
          { title: "Инструмент и подставка", note: "всё, что нужно" },
          { title: "Крепления для стены", note: "вешается сразу" },
        ],
        specs: { canvas: "280 г/м²", colors, hours, difficulty },
      },
      update: { title, price, difficulty, hours, isSeeded: true },
    });
    nProducts++;

    const haveSizes = await prisma.productSize.count({ where: { productId: product.id } });
    if (haveSizes === 0) {
      for (const [label, w, h, diff] of SIZES) {
        await prisma.productSize.create({
          data: { productId: product.id, label, width: w, height: h, priceDiff: diff },
        });
      }
    }

    const haveImages = await prisma.productImage.count({ where: { productId: product.id } });
    if (haveImages === 0) {
      for (let k = 1; k <= 3; k++) {
        await prisma.productImage.create({
          data: { productId: product.id, url: `/img/product/${slug}-${k}.jpg`,
                  alt: `${title} — ракурс ${k}`, sort: k },
        });
      }
    }

    const haveReviews = await prisma.review.count({ where: { productId: product.id } });
    if (haveReviews === 0) {
      const picked = REVIEW_TEXTS.slice(0, 2 + (nProducts % 3));
      for (const [authorName, rating, text] of picked) {
        await prisma.review.create({
          data: { productId: product.id, authorName, rating, text,
                  isApproved: true, isSeeded: true },
        });
        nReviews++;
      }
    }
  }
  console.log(`  seed: товаров — ${nProducts}, отзывов — ${nReviews}`);

  for (const [slug, title, category, excerpt] of ARTICLES) {
    await prisma.article.upsert({
      where: { slug },
      create: { slug, title, category, excerpt, readMinutes: 5,
                publishedAt: new Date(), coverUrl: `/img/blog/workshop.jpg`,
                content: `# ${title}\n\n${excerpt}\n\nТекст статьи появится позже.` },
      update: { title, excerpt },
    });
  }
  console.log(`  seed: статей — ${ARTICLES.length}`);
  console.log("  seed: готово");
}

main()
  .catch((e) => { console.error("  seed: ошибка —", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
