"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Сводка должна быть живой, но перезагружать страницу целиком незачем:
 * router.refresh() тянет только новые данные с сервера и не сбрасывает
 * прокрутку. Обновление ставим на паузу, когда вкладка скрыта, —
 * иначе открытая на весь день сводка дёргает базу впустую.
 */
export function AutoRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    const t = setInterval(() => {
      if (document.hidden) return;
      setLeft((n) => {
        if (n > 1) return n - 1;
        router.refresh();
        return seconds;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [router, seconds]);

  return (
    <span className="tnum text-[0.8125rem] text-[var(--text-muted)]">
      обновление через {left} с
    </span>
  );
}
