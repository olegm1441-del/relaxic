/**
 * Доступ к каталогу.
 *
 * Каталог — это статический контент: ассортимент меняется релизом, а не из админки.
 * Поэтому страницы читают его из lib/data/catalog.mjs напрямую, без обращения к базе.
 * Так сайт не падает, когда база недоступна, и отдаётся мгновенно.
 *
 * В базу пишется то, что действительно транзакционно: заказы, согласия,
 * заявки на свою картину, результаты квиза, реестр чатов Telegram.
 * Сид кладёт туда же копию каталога — из этого же файла, чтобы не разошлись.
 */
import * as raw from "./data/catalog.mjs";
import type {
  Article,
  ArticleCategory,
  ArticleCategoryKey,
  Artwork,
  Fandom,
  Product,
  Size,
  Technique,
  TechniqueKey,
} from "./data/catalog";

export type { Article, ArticleCategory, Artwork, Fandom, Product, Size, Technique, TechniqueKey };

/**
 * Данные лежат в .mjs — его читает и сид, где нет TypeScript. Типы описаны
 * в соседнем catalog.d.ts, но импорт с расширением .mjs ведёт прямо в исходник,
 * мимо деклараций. Поэтому типы навешиваются здесь, в одном месте на границе.
 */
export const TECHNIQUES = raw.TECHNIQUES as Technique[];
export const FANDOMS = raw.FANDOMS as Fandom[];
export const ARTWORKS = raw.ARTWORKS as Artwork[];
export const PRODUCTS = raw.PRODUCTS as Product[];
export const SIZES = raw.SIZES as Size[];
export const ARTICLES = raw.ARTICLES as Article[];
export const ARTICLE_CATEGORIES = raw.ARTICLE_CATEGORIES as ArticleCategory[];
const REVIEW_POOL = raw.REVIEW_POOL as [string, number, string][];

// ── Техники ──────────────────────────────────────────────────
export function techniqueBySlug(slug: string): Technique | undefined {
  return TECHNIQUES.find((t) => t.slug === slug);
}
export function techniqueByKey(key: TechniqueKey): Technique {
  const t = TECHNIQUES.find((x) => x.key === key);
  if (!t) throw new Error(`Неизвестная техника: ${key}`);
  return t;
}

// ── Фандомы ──────────────────────────────────────────────────
export function fandomBySlug(slug: string): Fandom | undefined {
  return FANDOMS.find((f) => f.slug === slug);
}
export function fandomCover(slug: string): string {
  return `/img/fandom/${slug}.jpg`;
}
/** Фандомы, у которых есть наборы этой техники — для выпадающего меню */
export function fandomsForTechnique(key: TechniqueKey): Fandom[] {
  const slugs = new Set(PRODUCTS.filter((p) => p.technique === key).map((p) => p.fandom));
  return FANDOMS.filter((f) => slugs.has(f.slug));
}

// ── Товары ───────────────────────────────────────────────────
export function productBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
export function productsOfFandom(slug: string): Product[] {
  return PRODUCTS.filter((p) => p.fandom === slug);
}
export function productsOfTechnique(key: TechniqueKey): Product[] {
  return PRODUCTS.filter((p) => p.technique === key);
}
export function hits(limit = 8): Product[] {
  return PRODUCTS.filter((p) => p.isHit).slice(0, limit);
}
export function freshest(limit = 8): Product[] {
  return PRODUCTS.filter((p) => p.isNew).slice(0, limit);
}

/** Тот же сюжет в других техниках — самый честный «похожий товар» */
export function sameArtwork(p: Product): Product[] {
  return PRODUCTS.filter((x) => x.artwork === p.artwork && x.slug !== p.slug);
}
/** Один SKU на сюжет: иначе в подборке рядом стоят две одинаковые картинки,
 *  отличающиеся только техникой, и блок выглядит сломанным. */
function uniqueByArtwork(list: Product[], limit: number): Product[] {
  const seen = new Set<string>();
  const out: Product[] = [];
  for (const p of list) {
    if (seen.has(p.artwork)) continue;
    seen.add(p.artwork);
    out.push(p);
    if (out.length === limit) break;
  }
  return out;
}

/** «Из этой вселенной» */
export function fromSameFandom(p: Product, limit = 4): Product[] {
  return uniqueByArtwork(
    PRODUCTS.filter((x) => x.fandom === p.fandom && x.artwork !== p.artwork),
    limit,
  );
}
/** «Похожие по сложности» — из других вселенных, иначе дублирует блок выше */
export function similarDifficulty(p: Product, limit = 4): Product[] {
  const sorted = PRODUCTS.filter((x) => x.slug !== p.slug && x.fandom !== p.fandom).sort(
    (a, b) =>
      Math.abs(a.difficulty - p.difficulty) - Math.abs(b.difficulty - p.difficulty) ||
      Math.abs(a.hours - p.hours) - Math.abs(b.hours - p.hours),
  );
  return uniqueByArtwork(sorted, limit);
}

/**
 * Подпись к сложности словами.
 *
 * Пять точек отвечают «насколько», но не отвечают «справлюсь ли я» —
 * а это и есть настоящий вопрос человека перед покупкой. Слово снимает
 * возражение там, где шкала его только обозначает.
 */
export function difficultyLabel(n: number): string {
  if (n <= 2) return "новичку";
  if (n === 3) return "если уже собирали";
  if (n === 4) return "нужен опыт";
  return "для опытных";
}

/** Быстрые входы в каталог — по задаче, а не по свойству товара.
 *  Люди приходят с «чем занять вечер» и «что подарить», а не с «сложность 2». */
export const QUICK_ENTRIES: { title: string; note: string; href: string }[] = [
  { title: "На один вечер", note: "до 5 часов", href: "/catalog?hours=0-5" },
  { title: "Первый набор", note: "сложность 1–2", href: "/catalog?difficulty=1,2" },
  { title: "Детям", note: "от 6 лет", href: "/catalog?age=6" },
  { title: "В подарок", note: "то, что закончат", href: "/gifts" },
  { title: "Вызов на месяц", note: "от 30 часов", href: "/catalog?hours=30%2B" },
  { title: "Подобрать за 3 вопроса", note: "40 секунд", href: "/quiz" },
];

// ── Цена и размеры ───────────────────────────────────────────
export function sizesFor(p: Product): Size[] {
  // Самый маленький формат не выпускаем для сложных: 38 цветов на 20×20 не лягут
  return SIZES.filter((s) => !(s.label === "20×20" && p.difficulty >= 4));
}
export function priceForSize(p: Product, sizeLabel: string): number {
  const s = SIZES.find((x) => x.label === sizeLabel);
  return p.price + (s?.priceDiff ?? 0);
}

// ── Отзывы ───────────────────────────────────────────────────
export interface Review {
  authorName: string;
  rating: number;
  text: string;
  photoUrl: string | null;
  daysAgo: number;
}

/** Детерминированный хеш: один и тот же товар всегда получает одни и те же отзывы.
 *  Math.random здесь нельзя — сервер и клиент разошлись бы при гидратации. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function reviewsFor(slug: string): Review[] {
  const h = hash(slug);
  const count = 3 + (h % 3);
  const out: Review[] = [];
  for (let i = 0; i < count; i++) {
    const [authorName, rating, text] = REVIEW_POOL[(h + i * 7) % REVIEW_POOL.length];
    out.push({
      authorName,
      rating,
      text,
      photoUrl: (h + i) % 3 === 0 ? `/img/gallery/work-${String(((h + i) % 10) + 1).padStart(2, "0")}.jpg` : null,
      daysAgo: 3 + ((h + i * 13) % 120),
    });
  }
  return out;
}

export function ratingFor(slug: string): { value: number; count: number } {
  const rs = reviewsFor(slug);
  const sum = rs.reduce((a, r) => a + r.rating, 0);
  return { value: Math.round((sum / rs.length) * 10) / 10, count: rs.length };
}

// ── Комплекты ────────────────────────────────────────────────
export interface Bundle {
  slug: string;
  title: string;
  items: Product[];
  full: number;
  price: number;
}

/** Три набора одной вселенной дешевле, чем по отдельности.
 *  Главный инструмент добора до бесплатной доставки. */
export function bundleForFandom(fandomSlug: string): Bundle | null {
  const seen = new Set<string>();
  const items: Product[] = [];
  for (const p of productsOfFandom(fandomSlug)) {
    if (seen.has(p.artwork)) continue;
    seen.add(p.artwork);
    items.push(p);
    if (items.length === 3) break;
  }
  if (items.length < 2) return null;
  const full = items.reduce((a, p) => a + p.price, 0);
  const fandom = fandomBySlug(fandomSlug);
  const word = items.length === 2 ? "Два набора" : `${items.length} набора`;
  return {
    slug: `bundle-${fandomSlug}`,
    title: `${word} вселенной «${fandom?.title ?? ""}»`,
    items,
    full,
    price: Math.round((full * 0.85) / 1000) * 1000,
  };
}

// ── Статьи ───────────────────────────────────────────────────
export function articleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
export function articleCategoryBySlug(slug: string): ArticleCategory | undefined {
  return ARTICLE_CATEGORIES.find((c) => c.slug === slug);
}
export function articlesOfCategory(key: ArticleCategoryKey): Article[] {
  return ARTICLES.filter((a) => a.category === key);
}
/** Статья по теме для карточки товара — детерминированно, но не одна и та же на всех */
export function articleForProduct(p: Product): Article {
  const direct = ARTICLES.find((a) => a.related.includes(p.slug));
  return direct ?? ARTICLES[hash(p.slug) % ARTICLES.length];
}
export function relatedArticles(a: Article, limit = 2): Article[] {
  const sameCat = ARTICLES.filter((x) => x.slug !== a.slug && x.category === a.category);
  const rest = ARTICLES.filter((x) => x.slug !== a.slug && x.category !== a.category);
  return [...sameCat, ...rest].slice(0, limit);
}
export function productsForArticle(a: Article): Product[] {
  return a.related.map((s) => productBySlug(s)).filter((p): p is Product => Boolean(p));
}

// ── Галерея ──────────────────────────────────────────────────
export interface GalleryItem {
  url: string;
  author: string;
  caption: string;
  productSlug: string | null;
}

const GALLERY_AUTHORS = [
  "Марина, Казань", "Дмитрий, Пермь", "Аня, Москва", "Екатерина, Уфа",
  "Игорь, Новосибирск", "Ольга, Самара", "Тимур, Казань", "Настя, Тверь",
  "Сергей, Ростов", "Вера, Иркутск",
];

/** Десять «крупных» работ + панели из наборов — на страницу галереи и в ленты */
export function galleryItems(limit = 40): GalleryItem[] {
  const out: GalleryItem[] = [];
  for (let i = 1; i <= 10; i++) {
    const p = PRODUCTS[(hash(`work${i}`) % PRODUCTS.length)];
    out.push({
      url: `/img/gallery/work-${String(i).padStart(2, "0")}.jpg`,
      author: GALLERY_AUTHORS[(i - 1) % GALLERY_AUTHORS.length],
      caption: p.title,
      productSlug: p.slug,
    });
  }
  for (let i = 1; i <= limit - 10; i++) {
    const p = PRODUCTS[(hash(`extra${i}`) % PRODUCTS.length)];
    out.push({
      url: `/img/extra/extra-${String(i).padStart(3, "0")}.jpg`,
      author: GALLERY_AUTHORS[i % GALLERY_AUTHORS.length],
      caption: p.title,
      productSlug: p.slug,
    });
  }
  return out;
}

// ── Фасеты ───────────────────────────────────────────────────
export interface Facets {
  fandom?: string[];
  technique?: string[];
  difficulty?: number[];
  hours?: string[];
  size?: string[];
  age?: string[];
  sort?: string;
  q?: string;
}

export const HOURS_BUCKETS = [
  { key: "0-5", title: "До 5 часов", test: (h: number) => h < 5 },
  { key: "5-15", title: "5–15 часов", test: (h: number) => h >= 5 && h < 15 },
  { key: "15-30", title: "15–30 часов", test: (h: number) => h >= 15 && h < 30 },
  { key: "30+", title: "От 30 часов", test: (h: number) => h >= 30 },
];

export const AGE_BUCKETS = [
  { key: "6", title: "6+", min: 6 },
  { key: "12", title: "12+", min: 12 },
  { key: "16", title: "16+", min: 16 },
];

export const SORTS = [
  { key: "popular", title: "Сначала популярные" },
  { key: "new", title: "Сначала новинки" },
  { key: "price-asc", title: "Сначала дешевле" },
  { key: "price-desc", title: "Сначала дороже" },
  { key: "easy", title: "Сначала простые" },
  { key: "hard", title: "Сначала сложные" },
];

export function applyFacets(list: Product[], f: Facets): Product[] {
  let out = list;
  if (f.fandom?.length) out = out.filter((p) => f.fandom!.includes(p.fandom));
  if (f.technique?.length) {
    const keys = f.technique
      .map((s) => techniqueBySlug(s)?.key)
      .filter((k): k is TechniqueKey => Boolean(k));
    out = out.filter((p) => keys.includes(p.technique));
  }
  if (f.difficulty?.length) out = out.filter((p) => f.difficulty!.includes(p.difficulty));
  if (f.hours?.length) {
    const tests = HOURS_BUCKETS.filter((b) => f.hours!.includes(b.key));
    out = out.filter((p) => tests.some((b) => b.test(p.hours)));
  }
  if (f.size?.length) out = out.filter((p) => sizesFor(p).some((s) => f.size!.includes(s.label)));
  if (f.age?.length) {
    const mins = f.age.map(Number);
    out = out.filter((p) => mins.some((m) => p.minAge <= m));
  }
  if (f.q) {
    const q = f.q.trim().toLowerCase();
    out = out.filter((p) => {
      const fandom = fandomBySlug(p.fandom)?.title.toLowerCase() ?? "";
      const tech = techniqueByKey(p.technique).title.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.lead.toLowerCase().includes(q) ||
        fandom.includes(q) ||
        tech.includes(q)
      );
    });
  }
  const sorted = [...out];
  switch (f.sort) {
    case "new": sorted.sort((a, b) => Number(b.isNew) - Number(a.isNew)); break;
    case "price-asc": sorted.sort((a, b) => a.price - b.price); break;
    case "price-desc": sorted.sort((a, b) => b.price - a.price); break;
    case "easy": sorted.sort((a, b) => a.difficulty - b.difficulty || a.hours - b.hours); break;
    case "hard": sorted.sort((a, b) => b.difficulty - a.difficulty || b.hours - a.hours); break;
    default: sorted.sort((a, b) => Number(b.isHit) - Number(a.isHit));
  }
  return sorted;
}

/** Разбор query-параметров. Мультивыбор приходит как «a,b,c». */
export function parseFacets(sp: Record<string, string | string[] | undefined>): Facets {
  const one = (k: string): string | undefined => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const many = (k: string): string[] | undefined => {
    const v = one(k);
    return v ? v.split(",").filter(Boolean) : undefined;
  };
  return {
    fandom: many("fandom"),
    technique: many("technique"),
    difficulty: many("difficulty")?.map(Number).filter((n) => n >= 1 && n <= 5),
    hours: many("hours"),
    size: many("size"),
    age: many("age"),
    sort: one("sort"),
    q: one("q"),
  };
}

export function facetsActive(f: Facets): number {
  return (
    (f.fandom?.length ?? 0) + (f.technique?.length ?? 0) + (f.difficulty?.length ?? 0) +
    (f.hours?.length ?? 0) + (f.size?.length ?? 0) + (f.age?.length ?? 0)
  );
}
