"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const KEY = "relaxic-consent";

/**
 * Метрика грузится ТОЛЬКО после согласия.
 * С сентября 2025 загрузка счётчика до согласия — это обработка данных
 * без основания, штраф юрлицу от 300 000 ₽. Поэтому скрипт не просто
 * «не считает», а физически не подключается.
 */
export function Analytics({ id }: { id?: string }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = () => {
      try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return setAllowed(false);
        setAllowed(Boolean(JSON.parse(raw)?.analytics));
      } catch {
        setAllowed(false);
      }
    };
    check();
    window.addEventListener("relaxic:analytics-allowed", check);
    return () => window.removeEventListener("relaxic:analytics-allowed", check);
  }, []);

  if (!id || !allowed) return null;

  return (
    <Script id="ym" strategy="lazyOnload">{`
      (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
      k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
      (window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
      ym(${JSON.stringify(id)}, "init", {clickmap:true,trackLinks:true,accurateTrackBounce:true});
    `}</Script>
  );
}
