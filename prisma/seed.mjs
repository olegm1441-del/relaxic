/**
 * Демо-данные Relaxic.
 *
 * Читает тот же lib/data/catalog.mjs, что и сайт, — иначе база и страницы
 * разойдутся, и отличие вылезет уже на проде.
 *
 * Обычный .mjs, а не .ts под tsx: на Railway NODE_ENV=production,
 * npm ci пропускает devDependencies, и tsx там просто не окажется.
 *
 * Скрипт идемпотентен: гоняется при каждом деплое и ничего не дублирует.
 * Всё созданное помечается isSeeded, чтобы потом одним запросом
 * отделить демо от настоящего.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  FANDOMS,
  PRODUCTS,
  SIZES,
  ARTICLES,
  REVIEW_POOL,
} from "../lib/data/catalog.mjs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("  seed: DATABASE_URL не задан — пропускаю");
  process.exit(0);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

/** Тот же хеш, что в lib/catalog.ts: отзывы в базе и на сайте должны совпасть */
function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

async function main() {
  console.log("  seed: наполняю базу…");

  for (const [i, f] of FANDOMS.entries()) {
    await prisma.fandom.upsert({
      where: { slug: f.slug },
      create: {
        slug: f.slug, title: f.title, brand: f.brand, category: f.category,
        tagline: f.tagline, description: f.description, tags: f.tags,
        sort: i, coverUrl: `/img/fandom/${f.slug}.jpg`,
      },
      update: {
        title: f.title, brand: f.brand, category: f.category, tagline: f.tagline,
        description: f.description, tags: f.tags, sort: i,
      },
    });
  }
  console.log(`  seed: фандомов — ${FANDOMS.length}`);

  let nReviews = 0;
  for (const p of PRODUCTS) {
    const fandom = await prisma.fandom.findUnique({ where: { slug: p.fandom } });
    if (!fandom) continue;

    const data = {
      title: p.title, fandomId: fandom.id, technique: p.technique,
      price: p.price, oldPrice: p.oldPrice, difficulty: p.difficulty,
      hours: p.hours, colorsCount: p.colorsCount, minAge: p.minAge,
      description: p.lead, story: p.story,
      boxContents: p.boxContents, specs: p.specs,
      isHit: p.isHit, isNew: p.isNew, isSeeded: true,
      seoTitle: p.seoTitle, seoDescription: p.seoDescription,
    };
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      create: { slug: p.slug, ...data },
      update: data,
    });

    // Размеры и картинки переписываем целиком: так проще держать их в синхроне,
    // чем сверять по одному, а строк тут десятки, не тысячи.
    await prisma.productSize.deleteMany({ where: { productId: product.id } });
    await prisma.productSize.createMany({
      data: SIZES
        .filter((s) => !(s.label === "20×20" && p.difficulty >= 4))
        .map((s) => ({
          productId: product.id, label: s.label,
          width: s.width, height: s.height, priceDiff: s.priceDiff,
        })),
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: p.images.map((img, i) => ({
        productId: product.id, url: img.url, alt: img.alt, sort: i,
      })),
    });

    const existing = await prisma.review.count({ where: { productId: product.id } });
    if (existing === 0) {
      const h = hash(p.slug);
      const count = 3 + (h % 3);
      const rows = [];
      for (let i = 0; i < count; i++) {
        const [authorName, rating, text] = REVIEW_POOL[(h + i * 7) % REVIEW_POOL.length];
        rows.push({
          productId: product.id, authorName, rating, text,
          photoUrl: (h + i) % 3 === 0
            ? `/img/gallery/work-${String(((h + i) % 10) + 1).padStart(2, "0")}.jpg`
            : null,
          isApproved: true, isSeeded: true,
          createdAt: new Date(Date.now() - (3 + ((h + i * 13) % 120)) * 86400000),
        });
      }
      await prisma.review.createMany({ data: rows });
      nReviews += rows.length;
    }
  }
  console.log(`  seed: товаров — ${PRODUCTS.length}, новых отзывов — ${nReviews}`);

  for (const a of ARTICLES) {
    const data = {
      title: a.title, excerpt: a.excerpt, category: a.category,
      content: JSON.stringify(a.body), coverUrl: a.cover,
      readMinutes: a.readMinutes, relatedProductIds: a.related,
      publishedAt: new Date(),
    };
    await prisma.article.upsert({
      where: { slug: a.slug },
      create: { slug: a.slug, ...data },
      update: data,
    });
  }
  console.log(`  seed: статей — ${ARTICLES.length}`);

  // ── Уборка за прежними версиями каталога ──────────────────
  //
  // После деплоя /api/health показывал 37 товаров вместо 25: в базе
  // остались строки от первой версии сида, со старыми слагами. На витрину
  // они не попадали (страницы читают файл каталога), но цифра врала,
  // и любая будущая админка увидела бы призрачные SKU.
  //
  // Удалять безопасно: создать товар в этой базе может только сид —
  // ни админки, ни API записи в каталог нет. Заказы при этом целы:
  // позиция хранит слаг, название и цену снимком, а productId
  // обнуляется сам, связь необязательная.
  const liveProducts = PRODUCTS.map((p) => p.slug);
  const stale = await prisma.product.findMany({
    where: { slug: { notIn: liveProducts } },
    select: { id: true, slug: true },
  });
  if (stale.length) {
    await prisma.product.deleteMany({ where: { id: { in: stale.map((p) => p.id) } } });
    console.log(`  seed: убрано товаров от прежних версий — ${stale.length}`);
  }

  const liveArticles = ARTICLES.map((a) => a.slug);
  const staleArticles = await prisma.article.deleteMany({
    where: { slug: { notIn: liveArticles } },
  });
  if (staleArticles.count) {
    console.log(`  seed: убрано статей от прежних версий — ${staleArticles.count}`);
  }

  const galleryCount = await prisma.galleryItem.count();
  if (galleryCount === 0) {
    await prisma.galleryItem.createMany({
      data: Array.from({ length: 10 }, (_, i) => ({
        imageUrl: `/img/gallery/work-${String(i + 1).padStart(2, "0")}.jpg`,
        authorName: ["Марина, Казань", "Дмитрий, Пермь", "Аня, Москва", "Екатерина, Уфа",
          "Игорь, Новосибирск", "Ольга, Самара", "Тимур, Казань", "Настя, Тверь",
          "Сергей, Ростов", "Вера, Иркутск"][i],
        caption: PRODUCTS[hash(`work${i + 1}`) % PRODUCTS.length].title,
        isApproved: true, isSeeded: true,
      })),
    });
    console.log("  seed: галерея — 10 работ");
  }

  console.log("  seed: готово");
}

main()
  .catch((e) => {
    console.error("  seed: ошибка —", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
