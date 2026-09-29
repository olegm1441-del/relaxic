"use client";

import { useEffect, useRef } from "react";
import { GOALS, track, pushPurchase, type EcomItem } from "@/lib/track";

/**
 * Отправка покупки в Метрику со страницы «Заказ принят».
 *
 * Страница серверная, а цель и электронная коммерция уходят из браузера,
 * поэтому нужен отдельный клиентский кусочек. Отправляем ровно один раз:
 * человек может обновить страницу заказа или вернуться на неё из письма,
 * и тогда покупка посчиталась бы дважды.
 */
export function OrderTracked({
  number, revenue, items,
}: { number: string; revenue: number; items: EcomItem[] }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    const key = `relaxic-order-tracked-${number}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch { /* приватный режим — посчитаем один раз за загрузку страницы */ }
    sent.current = true;
    track(GOALS.ORDER_DONE, { заказ: number, сумма: revenue });
    pushPurchase(number, items, revenue);
  }, [number, revenue, items]);

  return null;
}
