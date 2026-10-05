"use client";

import { useEffect } from "react";

/**
 * Отправка ошибок браузера на сервер.
 *
 * Ловим и обычные исключения, и необработанные обещания, и отдельно —
 * ошибку загрузки куска кода: она возникает, когда страница открыта
 * со старой сборки, а на сервере уже новая. При переходе по ссылке
 * нужный кусок не находится, и браузер показывает свою страницу ошибки.
 */
export function ErrorReporter() {
  useEffect(() => {
    const send = (kind: "error" | "rejection" | "chunk", message: string, stack?: string) => {
      try {
        const body = JSON.stringify({ kind, message, stack, url: location.href });
        // sendBeacon переживает уход со страницы — обычный fetch нет.
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/client-error", new Blob([body], { type: "application/json" }));
        } else {
          void fetch("/api/client-error", { method: "POST", body, keepalive: true,
                                            headers: { "content-type": "application/json" } });
        }
      } catch { /* молчим */ }
    };

    const onError = (e: ErrorEvent) => {
      const msg = e.message ?? "";
      send(/ChunkLoadError|Loading chunk|dynamically imported module/i.test(msg) ? "chunk" : "error",
           msg, e.error?.stack);
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason;
      send("rejection", String(r?.message ?? r ?? "").slice(0, 500), r?.stack);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
