/** Форматирование, общее для всего сайта. Цены везде хранятся в копейках. */

/** 129000 → «1 290 ₽». Пробел неразрывный — иначе ₽ уезжает на другую строку. */
export function price(kopecks: number): string {
  return `${Math.round(kopecks / 100).toLocaleString("ru-RU")} ₽`;
}

/** 129000 → «1 290» без знака валюты */
export function priceNumber(kopecks: number): string {
  return Math.round(kopecks / 100).toLocaleString("ru-RU");
}

/** Склонение по числу: plural(5, "час", "часа", "часов") → «часов» */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

/** 18 → «18 часов», 2 → «2 часа» */
export function hours(n: number): string {
  return `${n} ${plural(n, "час", "часа", "часов")}`;
}

/** Сколько вечеров по два часа. Честнее, чем «за вечер». */
export function evenings(h: number): string {
  const n = Math.max(1, Math.round(h / 2));
  if (n === 1) return "один вечер";
  if (n <= 7) return `${n} ${plural(n, "вечер", "вечера", "вечеров")}`;
  const weeks = Math.round(n / 7);
  return `около ${weeks} ${plural(weeks, "недели", "недель", "недель")}`;
}

export function reviewsWord(n: number): string {
  return `${n} ${plural(n, "отзыв", "отзыва", "отзывов")}`;
}

export function productsWord(n: number): string {
  return `${n} ${plural(n, "набор", "набора", "наборов")}`;
}

export function articlesWord(n: number): string {
  return `${n} ${plural(n, "статья", "статьи", "статей")}`;
}

/** Для дат в отзывах и статьях */
export function ruDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}
