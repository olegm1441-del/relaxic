"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartLine {
  /** slug товара + размер: один набор в двух размерах — две строки */
  key: string;
  slug: string;
  title: string;
  techniqueTitle: string;
  fandomTitle: string;
  size: string;
  price: number;
  image: string;
  qty: number;
}

interface CartState {
  lines: CartLine[];
  open: boolean;
  add: (line: Omit<CartLine, "key" | "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      open: false,

      add: (line, qty = 1) =>
        set((s) => {
          const key = `${line.slug}__${line.size}`;
          const found = s.lines.find((l) => l.key === key);
          const lines = found
            ? s.lines.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l))
            : [...s.lines, { ...line, key, qty }];
          return { lines, open: true };
        }),

      setQty: (key, qty) =>
        set((s) => ({
          lines:
            qty <= 0
              ? s.lines.filter((l) => l.key !== key)
              : s.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(qty, 20) } : l)),
        })),

      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
      setOpen: (open) => set({ open }),
    }),
    {
      name: "relaxic-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Сохраняем только позиции. Открытую шторку восстанавливать не надо:
      // человек вернулся на сайт, а не продолжил тот же клик.
      partialize: (s) => ({ lines: s.lines }) as unknown as CartState,
    },
  ),
);

/**
 * Корзина живёт в localStorage, а сервер о ней не знает. Пока не прошёл
 * первый эффект на клиенте, показываем пустую корзину — иначе разметка
 * сервера и клиента разойдутся при гидратации.
 *
 * Раньше флаг ставился из onRehydrateStorage, и это молча не работало:
 * localStorage синхронный, колбэк выполняется прямо внутри create(),
 * где useCart ещё в мёртвой зоне — обращение к нему бросало ReferenceError,
 * zustand его проглатывал, и шторка корзины не открывалась никогда.
 */
export function useCartReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}

/* ── Производные значения ───────────────────────────────────── */

export function itemsTotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.price * l.qty, 0);
}

export function itemsCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.qty, 0);
}

export { FREE_FROM, DELIVERY_COST, deliveryFor, toFreeDelivery } from "@/lib/delivery";
