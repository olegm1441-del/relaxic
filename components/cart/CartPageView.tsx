"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart, useCartReady, itemsTotal, itemsCount, toFreeDelivery, deliveryFor } from "./store";
import { FreeDeliveryBar } from "./CartDrawer";
import { AddToCart } from "./AddToCart";
import { price } from "@/lib/format";
import { fandomBySlug, techniqueByKey, type Product } from "@/lib/catalog";

export function CartPageView({ topUp }: { topUp: Product[] }) {
  const { lines, setQty, remove } = useCart();
  const ready = useCartReady();

  const total = itemsTotal(lines);
  const count = itemsCount(lines);
  const left = toFreeDelivery(total);
  const delivery = deliveryFor(total);
  const progress = Math.min(100, Math.round((total / (total + left || 1)) * 100));

  // До гидратации корзина всегда пуста: иначе сервер и клиент разойдутся
  if (!ready) return <div className="min-h-[50vh]" />;

  if (lines.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 text-center">
        <div className="relative h-40 w-40 overflow-hidden rounded-full bg-[var(--surface-2)]">
          <Image src="/img/system/empty-cart.jpg" alt="" fill sizes="160px" className="object-cover opacity-80" />
        </div>
        <h1 className="h2">В корзине пусто</h1>
        <p className="measure-narrow text-[var(--text-muted)]">
          Начните с техники или ответьте на три вопроса — подберём сами.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/catalog" className="btn btn-primary">В каталог</Link>
          <Link href="/quiz" className="btn btn-secondary">Подобрать за 3 шага</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 className="h1">Корзина</h1>
      <p className="mt-2 text-[var(--text-muted)]">{count} шт.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-12">
        <div>
          <ul className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
            {lines.map((l) => (
              <li key={l.key} className="flex gap-4 py-5">
                <Link href={`/product/${l.slug}`} className="shrink-0">
                  <Image
                    src={l.image}
                    alt={l.title}
                    width={96}
                    height={120}
                    className="h-[120px] w-24 rounded-[var(--radius-ui)] object-cover"
                    sizes="96px"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/product/${l.slug}`} className="font-semibold text-[var(--text)] no-underline">
                    {l.title}
                  </Link>
                  <p className="mt-1 text-[0.8125rem] text-[var(--text-muted)]">
                    {l.techniqueTitle}
                    {l.fandomTitle && ` · ${l.fandomTitle}`} · {l.size} см
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <div className="inline-flex items-center rounded-[var(--radius-ui)] border border-[var(--border)]">
                      <button type="button" className="flex h-11 w-11 items-center justify-center" aria-label="Меньше" onClick={() => setQty(l.key, l.qty - 1)}>
                        <Minus size={15} />
                      </button>
                      <span className="tnum w-8 text-center font-semibold">{l.qty}</span>
                      <button type="button" className="flex h-11 w-11 items-center justify-center" aria-label="Больше" onClick={() => setQty(l.key, l.qty + 1)}>
                        <Plus size={15} />
                      </button>
                    </div>
                    <span className="tnum text-[1.125rem] font-bold">{price(l.price * l.qty)}</span>
                    <button
                      type="button"
                      className="ml-auto inline-flex items-center gap-1.5 text-[0.8125rem] text-[var(--text-muted)] transition-colors hover:text-[var(--color-danger)]"
                      onClick={() => remove(l.key)}
                    >
                      <Trash2 size={15} />
                      Убрать
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {left > 0 && (
            <section className="mt-10">
              <h2 className="h3">Добрать до бесплатной доставки</h2>
              <p className="mt-1.5 text-sm text-[var(--text-muted)]">
                Не хватает <span className="tnum font-semibold text-[var(--text)]">{price(left)}</span> — вот что подойдёт.
              </p>
              <div className="mt-5 grid gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3">
                {topUp
                  .filter((p) => !lines.some((l) => l.slug === p.slug))
                  .slice(0, 3)
                  .map((p) => {
                    const tech = techniqueByKey(p.technique);
                    return (
                      <div key={p.slug} className="card p-3">
                        <Link href={`/product/${p.slug}`} className="block no-underline">
                          <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-ui)] bg-[var(--surface-2)]">
                            <Image src={p.images[0].url} alt={p.title} fill sizes="(max-width: 480px) 45vw, 22vw" className="object-cover" />
                          </div>
                          <p className="mt-2.5 text-sm font-semibold text-[var(--text)]">{p.title}</p>
                          <p className="mt-0.5 text-[0.75rem] text-[var(--text-muted)]">{tech.short}</p>
                        </Link>
                        <p className="tnum mt-2 font-bold">{price(p.price)}</p>
                        <div className="mt-2">
                          <AddToCart
                            className="btn btn-secondary btn-sm w-full"
                            label="Добавить"
                            line={{
                              slug: p.slug, title: p.title, techniqueTitle: tech.one,
                              fandomTitle: fandomBySlug(p.fandom)?.title ?? "",
                              size: "30×40", price: p.price, image: p.images[0].url,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <FreeDeliveryBar left={left} progress={progress} />
            <dl className="mt-5 space-y-2.5 text-[0.9375rem]">
              <div className="flex justify-between">
                <dt className="text-[var(--text-muted)]">Товары, {count} шт.</dt>
                <dd className="tnum font-semibold">{price(total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-muted)]">Доставка</dt>
                <dd className="tnum font-semibold">
                  {delivery === 0 ? <span className="text-[var(--color-turquoise)]">бесплатно</span> : price(delivery)}
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex items-baseline justify-between border-t border-[var(--border)] pt-4">
              <span className="font-semibold">Итого</span>
              <span className="tnum text-[1.5rem] font-bold">{price(total + delivery)}</span>
            </div>
            <Link href="/checkout" className="btn btn-primary mt-5 w-full">
              <ShoppingBag size={18} />
              Оформить заказ
            </Link>
            <p className="mt-3 text-[0.75rem] leading-relaxed text-[var(--text-muted)]">
              Оплата не проводится: менеджер свяжется и подтвердит заказ.{" "}
              <Link href="/delivery" className="underline underline-offset-2">Как мы доставляем</Link>.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
