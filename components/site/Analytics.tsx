"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const KEY = "relaxic-consent";

/**
 * Яндекс Метрика.
 *
 * Два отличия от стандартного сниппета, и оба обязательны.
 *
 * 1. Скрипт грузится ТОЛЬКО после согласия на аналитику. С сентября 2025
 *    загрузка счётчика до согласия — обработка данных без основания,
 *    штраф от 300 000 ₽. Поэтому счётчик не «молчит», а физически
 *    не подключается: ни запроса к mc.yandex.ru, ни куки.
 *    Тег <noscript> с пикселем по той же причине не ставим — он сработал бы
 *    в обход согласия.
 *
 * 2. Сайт — одностраничное приложение: при переходе по ссылке страница
 *    не перезагружается, и счётчик сам про переход не узнает. Без ручной
 *    отправки Метрика засчитала бы один просмотр на весь визит, а глубина
 *    просмотра и воронка развалились бы. Поэтому на каждую смену адреса
 *    шлём hit с предыдущим адресом как источником.
 */
export function Analytics({ id }: { id?: string }) {
  const [allowed, setAllowed] = useState(false);
  const pathname = usePathname();
  const prev = useRef<string | null>(null);

  useEffect(() => {
    const check = () => {
      try {
        const raw = localStorage.getItem(KEY);
        setAllowed(raw ? Boolean(JSON.parse(raw)?.analytics) : false);
      } catch {
        setAllowed(false);
      }
    };
    check();
    window.addEventListener("relaxic:analytics-allowed", check);
    return () => window.removeEventListener("relaxic:analytics-allowed", check);
  }, []);

  useEffect(() => {
    if (!id || !allowed) return;
    const url = window.location.href;
    // Первый просмотр уже отправлен при инициализации счётчика — повторять нельзя.
    if (prev.current === null) { prev.current = url; return; }
    const from = prev.current;
    prev.current = url;
    const ym = (window as unknown as { ym?: (...a: unknown[]) => void }).ym;
    ym?.(Number(id), "hit", url, { referer: from });
  }, [pathname, id, allowed]);

  if (!id || !allowed) return null;

  return (
    <Script id="ym" strategy="afterInteractive">{`
      window.dataLayer = window.dataLayer || [];
      window.__ymId = ${JSON.stringify(Number(id))};
      (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
      k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
      (window,document,"script","https://mc.yandex.ru/metrika/tag.js?id=${id}","ym");
      ym(${JSON.stringify(id)}, "init", {
        ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer",
        accurateTrackBounce:true, trackLinks:true,
        referrer: document.referrer, url: location.href
      });
    `}</Script>
  );
}
