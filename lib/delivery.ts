/**
 * Стоимость и пороги доставки.
 *
 * Отдельным файлом, потому что цифру используют и клиент (корзина),
 * и серверный экшен заказа, а файл с "use server" не может экспортировать
 * ничего, кроме асинхронных функций.
 */
import { COMPANY } from "./company";

/** Фиксированная стоимость доставки, копейки */
export const DELIVERY_COST = 35000;

/** Порог бесплатной доставки, копейки */
export const FREE_FROM = COMPANY.freeDeliveryFrom;

export function deliveryFor(itemsTotal: number, pickup = false): number {
  if (pickup || itemsTotal === 0 || itemsTotal >= FREE_FROM) return 0;
  return DELIVERY_COST;
}

/** Сколько не хватает до бесплатной доставки. 0 — уже бесплатно. */
export function toFreeDelivery(itemsTotal: number): number {
  return Math.max(0, FREE_FROM - itemsTotal);
}
