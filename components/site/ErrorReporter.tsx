"use client";

import { useEffect } from "react";

/**
 * Две задачи: пережить обновление сборки и рассказать о прочих ошибках.
 *
 * ── Почему это нужно ──
 * Вкладка, открытая до выката, держит в памяти код старой сборки. Куски
 * кода Next грузит по требованию, в момент перехода по ссылке, и после
 * выката нужного куска на сервере уже нет: имена файлов содержат хеш
 * содержимого и меняются с каждой сборкой. Переход обрывается, и браузер
 * показывает свою страницу ошибки — при том что сервер совершенно здоров,
 * а перезагрузка той же страницы работает.
 *
 * Чинится единственным разумным способом: поймать такую ошибку и
 * перезагрузить страницу, забрав свежий код. Человек видит моргание
 * вместо тупика.
 */

const STALE = /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i;
/** Защита от петли: если свежая сборка тоже не грузится, перезагружать бесконечно нельзя */
const GUARD = "relaxic-reloaded-at";
const COOLDOWN = 60_000;

export function ErrorReporter() {
  useEffect(() => {
    const report = (kind: "error" | "rejection" | "chunk", message: string, stack?: string) => {
      try {
        const body = JSON.stringify({ kind, message, stack, url: location.href });
        // sendBeacon переживает уход со страницы, обычный запрос — нет,
        // а ошибка случается ровно в момент ухода.
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/client-error", new Blob([body], { type: "application/json" }));
        } else {
          void fetch("/api/client-error", { method: "POST", body, keepalive: true,
                                            headers: { "content-type": "application/json" } });
        }
      } catch { /* молчим: отчёт об ошибке не должен порождать вторую */ }
    };

    const recoverIfStale = (message: string) => {
      if (!STALE.test(message)) return false;
      let last = 0;
      try { last = Number(sessionStorage.getItem(GUARD) ?? 0); } catch { /* приватный режим */ }
      if (Date.now() - last < COOLDOWN) return true;   // уже пробовали, второй раз не поможет
      try { sessionStorage.setItem(GUARD, String(Date.now())); } catch { /* ничего */ }
      location.reload();
      return true;
    };

    const onError = (e: ErrorEvent) => {
      const msg = e.message ?? "";
      const stale = STALE.test(msg);
      report(stale ? "chunk" : "error", msg, e.error?.stack);
      recoverIfStale(msg);
    };

    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason as { message?: string; stack?: string } | undefined;
      const msg = String(r?.message ?? r ?? "").slice(0, 500);
      report(STALE.test(msg) ? "chunk" : "rejection", msg, r?.stack);
      recoverIfStale(msg);
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
