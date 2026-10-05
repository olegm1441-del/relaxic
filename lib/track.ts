/**
 * Целевые действия.
 *
 * Метрика сама считает только просмотры страниц. Конверсия в действие —
 * это цель, и отправить её нужно руками в момент клика. Названия целей
 * здесь должны совпадать с теми, что заведены в интерфейсе Метрики:
 * расхождение в одну букву — и отчёт по конверсии пустой.
 *
 * Если согласия на аналитику нет, счётчик на странице не подключён,
 * window.ym не существует и вызов тихо ничего не делает. Это не сбой,
 * а то же правило, по которому не грузится и сам счётчик.
 */
export const GOALS = {
  /** Начал подбор: ответил на первый вопрос */
  QUIZ_START: "quiz_start",
  /** Дошёл до результата подбора */
  QUIZ_DONE: "quiz_done",
  /** Положил набор в корзину */
  ADD_TO_CART: "add_to_cart",
  /** Перешёл к оформлению */
  CHECKOUT_OPEN: "checkout_open",
  /** Заказ оформлен */
  ORDER_DONE: "order_done",
  /** Отправил заявку на свою картину */
  CUSTOM_SENT: "custom_sent",
} as const;

/**
 * Здесь только цели-события. Посещение каталога, карточки товара и
 * страницы заказа заводится в Метрике как цель по адресу страницы —
 * дублировать их кодом незачем, просмотр уже отправлен счётчиком.
 */

export type Goal = (typeof GOALS)[keyof typeof GOALS];

type Ym = (id: number, action: string, ...rest: unknown[]) => void;
interface W { ym?: Ym; __ymId?: number; dataLayer?: unknown[] }

function w(): W | null {
  return typeof window === "undefined" ? null : (window as unknown as W);
}

/**
 * Отправить цель. Без согласия — ничего не делает.
 *
 * Проверяем именно тип: window.ym может оказаться не функцией, а чем
 * угодно — например, DOM-элементом, если на странице есть тег с таким id.
 * И оборачиваем в try: сбой аналитики не повод ломать сайт.
 */
export function track(goal: Goal, params?: Record<string, unknown>) {
  const g = w();
  if (typeof g?.ym !== "function" || !g.__ymId) return;
  try { g.ym(g.__ymId, "reachGoal", goal, params); } catch { /* не мешаем работе */ }
}

export interface EcomItem { id: string; name: string; price: number; quantity: number; brand?: string }

/**
 * Электронная коммерция.
 *
 * Метрика читает её не из целей, а из dataLayer — отдельным каналом.
 * Цена в рублях: в базе мы храним копейки, но Метрика ждёт рубли,
 * иначе средний чек вырастет в сто раз.
 */
export function pushPurchase(orderNumber: string, items: EcomItem[], revenue: number) {
  const g = w();
  if (!Array.isArray(g?.dataLayer)) return;
  g.dataLayer.push({
    ecommerce: {
      currencyCode: "RUB",
      purchase: { actionField: { id: orderNumber, revenue }, products: items },
    },
  });
}

export function pushAddToCart(item: EcomItem) {
  const g = w();
  if (!Array.isArray(g?.dataLayer)) return;
  g.dataLayer.push({ ecommerce: { currencyCode: "RUB", add: { products: [item] } } });
}
