export type TechniqueKey = "PAINT_BY_NUMBERS" | "DIAMOND_MOSAIC" | "CROSS_STITCH";
export type FandomCategoryKey = "FILM" | "SERIES" | "GAME" | "CARTOON" | "ANIME";
export type ArticleCategoryKey =
  | "FANDOM_GUIDE" | "WORKSHOP" | "STORIES" | "GIFT_GUIDE" | "RELAX" | "BACKSTAGE";

export interface Technique {
  key: TechniqueKey;
  slug: string;
  title: string;
  one: string;
  short: string;
  suffix: string;
  cover: string;
  box: string;
  tagline: string;
  lead: string;
  forWhom: string;
  learnMinutes: number;
}

export interface Fandom {
  slug: string;
  title: string;
  brand: string | null;
  category: FandomCategoryKey;
  tagline: string;
  description: string;
  tags: string[];
}

export interface Artwork {
  slug: string;
  title: string;
  fandom: string;
  techniques: TechniqueKey[];
  base: { difficulty: number; hours: number; colors: number; minAge: number };
  /** Сколько кадров у сюжета в public/img/product. По умолчанию три. */
  shots?: number;
  hit?: boolean;
  lead: string;
  story: string;
}

export interface ProductImage { url: string; alt: string }

export interface Product {
  slug: string;
  artwork: string;
  title: string;
  fullTitle: string;
  fandom: string;
  technique: TechniqueKey;
  price: number;
  oldPrice: number | null;
  difficulty: number;
  hours: number;
  colorsCount: number;
  minAge: number;
  isHit: boolean;
  isNew: boolean;
  lead: string;
  story: string;
  images: ProductImage[];
  boxContents: string[];
  specs: Record<string, string>;
  seoTitle: string;
  seoDescription: string;
}

export interface Size { label: string; width: number; height: number; priceDiff: number }

export type ArticleBlock = [string, string];

export interface Article {
  slug: string;
  title: string;
  category: ArticleCategoryKey;
  excerpt: string;
  cover: string;
  readMinutes: number;
  related: string[];
  body: ArticleBlock[];
}

export interface ArticleCategory {
  key: ArticleCategoryKey;
  slug: string;
  title: string;
  cover: string;
  lead: string;
}

export const TECHNIQUES: Technique[];
export const FANDOMS: Fandom[];
export const ARTWORKS: Artwork[];
export const PRODUCTS: Product[];
export const SIZES: Size[];
export const BOX_CONTENTS: Record<TechniqueKey, string[]>;
export const SPECS: Record<TechniqueKey, Record<string, string>>;
export const REVIEW_POOL: [string, number, string][];
export const ARTICLES: Article[];
export const ARTICLE_CATEGORIES: ArticleCategory[];
export function buildProducts(): Product[];
