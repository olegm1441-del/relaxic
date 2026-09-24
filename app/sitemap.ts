import type { MetadataRoute } from "next";
import { ARTICLES, ARTICLE_CATEGORIES, FANDOMS, PRODUCTS, TECHNIQUES } from "@/lib/catalog";
import { GIFT_COLLECTIONS } from "@/lib/gifts";
import { HOWTO_SLUG } from "@/lib/howto";
import { COMPANY } from "@/lib/company";

/**
 * Приоритеты и частота — по docs/06-SITEMAP.md.
 * Корзина, чекаут, заказ, кабинет и поиск сюда не попадают: индексировать нечего.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = COMPANY.siteUrl.replace(/\/$/, "");
  const now = new Date();
  const u = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]) =>
    ({ url: `${base}${path}`, lastModified: now, changeFrequency, priority });

  return [
    u("/", 1.0, "daily"),
    u("/catalog", 0.9, "daily"),
    ...TECHNIQUES.map((t) => u(`/catalog/${t.slug}`, 0.9, "daily")),
    u("/fandom", 0.9, "weekly"),
    ...FANDOMS.map((f) => u(`/fandom/${f.slug}`, 0.9, "weekly")),
    ...PRODUCTS.map((p) => u(`/product/${p.slug}`, 0.8, "weekly")),
    u("/gifts", 0.7, "monthly"),
    ...GIFT_COLLECTIONS.map((c) => u(`/gifts/${c.slug}`, 0.7, "monthly")),
    u("/quiz", 0.7, "monthly"),
    u("/custom", 0.7, "monthly"),
    u("/how-it-works", 0.7, "monthly"),
    ...TECHNIQUES.map((t) => u(`/how-it-works/${HOWTO_SLUG[t.key]}`, 0.7, "monthly")),
    u("/blog", 0.6, "weekly"),
    ...ARTICLE_CATEGORIES.map((c) => u(`/blog/${c.slug}`, 0.6, "weekly")),
    ...ARTICLES.map((a) => u(`/blog/${a.slug}`, 0.6, "weekly")),
    u("/gallery", 0.6, "weekly"),
    u("/reviews", 0.6, "weekly"),
    u("/about", 0.3, "yearly"),
    u("/delivery", 0.3, "yearly"),
    u("/contacts", 0.3, "yearly"),
    u("/faq", 0.3, "yearly"),
    u("/legal/offer", 0.3, "yearly"),
    u("/legal/privacy", 0.3, "yearly"),
    u("/legal/cookies", 0.3, "yearly"),
  ];
}
