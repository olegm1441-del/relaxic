"use client";

import Image from "next/image";
import { useState } from "react";
import { Check, ShoppingBag, Truck } from "lucide-react";
import { useCart, useCartReady, itemsTotal, toFreeDelivery } from "@/components/cart/store";
import { price } from "@/lib/format";
import type { Product, Size } from "@/lib/catalog";

export function ProductBuy({
  product, sizes, techniqueTitle, fandomTitle,
}: {
  product: Product;
  sizes: Size[];
  techniqueTitle: string;
  fandomTitle: string;
}) {
  const [size, setSize] = useState(sizes.find((s) => s.priceDiff === 0)?.label ?? sizes[0].label);
  const [done, setDone] = useState(false);

  const add = useCart((s) => s.add);
  const lines = useCart((s) => s.lines);
  const ready = useCartReady();

  const chosen = sizes.find((s) => s.label === size) ?? sizes[0];
  const current = product.price + chosen.priceDiff;
  const currentOld = product.oldPrice ? product.oldPrice + chosen.priceDiff : null;

  // «Не хватает N ₽» считаем с учётом этого набора — иначе цифра врёт
  const cartTotal = ready ? itemsTotal(lines) : 0;
  const left = toFreeDelivery(cartTotal + current);

  function handleAdd() {
    add({
      slug: product.slug,
      title: product.title,
      techniqueTitle,
      fandomTitle,
      size,
      price: current,
      image: product.images[0].url,
    });
    setDone(true);
    setTimeout(() => setDone(false), 1400);
  }

  return (
    <>
      <div className="mt-7">
        <div className="flex items-baseline justify-between gap-3">
          <span className="caption text-[var(--text-muted)]">Размер, см</span>
          <span className="text-[0.75rem] text-[var(--text-muted)]">Влияет на цену</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Размер">
          {sizes.map((s) => (
            <button
              key={s.label}
              type="button"
              role="radio"
              aria-checked={s.label === size}
              className="chip min-h-[44px] px-4"
              data-on={s.label === size}
              onClick={() => setSize(s.label)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-baseline gap-3">
        <span className="tnum text-[2rem] font-bold leading-none">{price(current)}</span>
        {currentOld && currentOld > current && (
          <span className="tnum text-[var(--text-muted)] line-through">{price(currentOld)}</span>
        )}
      </div>

      <div className="mt-5 hidden lg:block">
        <button type="button" className="btn btn-primary w-full" onClick={handleAdd}>
          {done ? <Check size={18} /> : <ShoppingBag size={18} />}
          {done ? "Добавлено в корзину" : "В корзину"}
        </button>
      </div>

      {/* Срок и стоимость доставки прямо у кнопки — пункт 9 ТЗ */}
      <div className="mt-5 rounded-[var(--radius-card)] border border-[var(--border)] p-4">
        <p className="flex items-start gap-2.5 text-sm">
          <Truck size={18} className="mt-0.5 shrink-0 text-[var(--color-turquoise)]" />
          <span>
            <span className="font-semibold">Доставка 2–5 дней</span> по всей России, СДЭК или Яндекс.
            <br />
            {left === 0 ? (
              <span className="text-[var(--color-turquoise)]">С этим набором доставка бесплатная.</span>
            ) : (
              <span className="text-[var(--text-muted)]">
                До бесплатной не хватает <span className="tnum font-semibold text-[var(--text)]">{price(left)}</span>.
              </span>
            )}
          </span>
        </p>
      </div>

      {/* Мобильная липкая панель: кнопка всегда под большим пальцем */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[color-mix(in_oklab,var(--bg)_94%,transparent)] px-4 py-3 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="tnum text-[1.125rem] font-bold leading-none">{price(current)}</p>
            <p className="mt-1 truncate text-[0.75rem] text-[var(--text-muted)]">{size} см</p>
          </div>
          <button type="button" className="btn btn-primary flex-1" onClick={handleAdd}>
            {done ? <Check size={18} /> : <ShoppingBag size={18} />}
            {done ? "В корзине" : "В корзину"}
          </button>
        </div>
      </div>
      {/* Подпорка, чтобы липкая панель не перекрывала конец страницы */}
      <div aria-hidden className="h-20 lg:hidden" />
    </>
  );
}

/** Галерея карточки: крупный кадр + миниатюры. Зум — по клику, нативным full-screen. */
export function ProductGallery({ product }: { product: Product }) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-blk)] bg-[var(--color-canvas-2)]">
        <Image
          src={product.images[active].url}
          alt={product.images[active].alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 46vw"
          className="object-cover"
        />
      </div>
      {product.images.length > 1 && (
        <div className="mt-3 flex gap-3">
          {product.images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              aria-label={`Фото ${i + 1}`}
              aria-current={i === active}
              onClick={() => setActive(i)}
              className={`relative aspect-[4/5] w-20 overflow-hidden rounded-[var(--radius-ui)] border-2 bg-[var(--color-canvas-2)] transition-colors ${
                i === active ? "border-[var(--accent)]" : "border-transparent"
              }`}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
