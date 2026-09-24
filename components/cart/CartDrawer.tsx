"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart, useCartReady, itemsTotal, itemsCount, toFreeDelivery } from "./store";
import { price } from "@/lib/format";

export function CartDrawer() {
  const { lines, open, setOpen, setQty, remove } = useCart();
  const ready = useCartReady();
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  const total = itemsTotal(lines);
  const count = itemsCount(lines);
  const left = toFreeDelivery(total);
  const progress = Math.min(100, Math.round((total / (total + left || 1)) * 100));

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();

    // Ловушка фокуса: Tab не должен уводить на страницу под шторкой
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); return; }
      if (e.key !== "Tab" || !panel.current) return;
      const items = panel.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  if (!open || !ready) return null;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Корзина">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <div
        ref={panel}
        data-surface="light"
        className="absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col bg-[var(--bg)] text-[var(--text)] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 sm:px-5">
          <h2 className="h3 text-[1.125rem]">
            Корзина{count > 0 && <span className="ml-2 tnum text-[var(--text-muted)]">{count}</span>}
          </h2>
          <button ref={closeBtn} type="button" className="btn-icon -mr-2" aria-label="Закрыть корзину" onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag size={40} className="text-[var(--text-muted)]" />
            <p className="text-[var(--text-muted)]">Пока пусто. Начните с техники или вселенной.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/catalog" className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>В каталог</Link>
              <Link href="/quiz" className="btn btn-secondary btn-sm" onClick={() => setOpen(false)}>Подобрать за 3 шага</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
              <ul className="space-y-4">
                {lines.map((l) => (
                  <li key={l.key} className="flex gap-3">
                    <Link href={`/product/${l.slug}`} onClick={() => setOpen(false)} className="shrink-0">
                      <Image
                        src={l.image}
                        alt={l.title}
                        width={72}
                        height={90}
                        className="h-[90px] w-[72px] rounded-[var(--radius-ui)] object-cover"
                        sizes="72px"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/product/${l.slug}`}
                        onClick={() => setOpen(false)}
                        className="block text-sm font-semibold leading-snug text-[var(--text)] no-underline"
                      >
                        {l.title}
                      </Link>
                      <p className="mt-0.5 text-[0.75rem] text-[var(--text-muted)]">
                        {l.techniqueTitle} · {l.size} см
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="inline-flex items-center rounded-[var(--radius-ui)] border border-[var(--border)]">
                          <button type="button" className="flex h-9 w-9 items-center justify-center" aria-label="Меньше" onClick={() => setQty(l.key, l.qty - 1)}>
                            <Minus size={14} />
                          </button>
                          <span className="tnum w-7 text-center text-sm font-semibold">{l.qty}</span>
                          <button type="button" className="flex h-9 w-9 items-center justify-center" aria-label="Больше" onClick={() => setQty(l.key, l.qty + 1)}>
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="tnum text-sm font-bold">{price(l.price * l.qty)}</span>
                        <button type="button" className="btn-icon h-9 w-9 text-[var(--text-muted)]" aria-label={`Убрать ${l.title}`} onClick={() => remove(l.key)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-[var(--border)] px-4 py-4 sm:px-5" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
              <FreeDeliveryBar left={left} progress={progress} onGo={() => setOpen(false)} />
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-sm text-[var(--text-muted)]">Товары</span>
                <span className="tnum text-[1.25rem] font-bold">{price(total)}</span>
              </div>
              <Link href="/checkout" className="btn btn-primary mt-3 w-full" onClick={() => setOpen(false)}>
                Оформить заказ
              </Link>
              <Link href="/cart" className="btn btn-ghost mt-1 w-full" onClick={() => setOpen(false)}>
                Перейти в корзину
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function FreeDeliveryBar({ left, progress, onGo }: { left: number; progress: number; onGo?: () => void }) {
  return (
    <div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div
          className="h-full rounded-full bg-[var(--color-turquoise)] transition-[width] duration-500"
          style={{ width: `${left === 0 ? 100 : progress}%` }}
        />
      </div>
      <p className="mt-2 text-[0.8125rem] text-[var(--text-muted)]">
        {left === 0 ? (
          <span className="font-semibold text-[var(--color-turquoise)]">Доставка бесплатная</span>
        ) : (
          <>
            До бесплатной доставки не хватает <span className="tnum font-semibold text-[var(--text)]">{price(left)}</span>.{" "}
            <Link href="/catalog?sort=price-asc" className="underline underline-offset-2" onClick={onGo}>
              Что добрать
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
