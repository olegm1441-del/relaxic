import Image from "next/image";
import Link from "next/link";
import { AddToCart } from "@/components/cart/AddToCart";
import { price } from "@/lib/format";
import { techniqueByKey, type Bundle } from "@/lib/catalog";

/** Комплект — главный инструмент добора до бесплатной доставки (ТЗ, раздел 6) */
export function BundleCard({ bundle }: { bundle: Bundle }) {
  const save = bundle.full - bundle.price;

  return (
    <div className="card overflow-hidden lg:flex">
      <div className="grid shrink-0 grid-cols-3 gap-px bg-[var(--border)] lg:w-[420px]">
        {bundle.items.map((p) => (
          <Link key={p.slug} href={`/product/${p.slug}`} className="relative aspect-[4/5] bg-[var(--color-canvas-2)]">
            <Image src={p.images[0].url} alt={p.title} fill sizes="(max-width: 1024px) 33vw, 140px" className="object-cover" />
          </Link>
        ))}
      </div>

      <div className="flex flex-1 flex-col justify-center p-5 lg:p-7">
        <h3 className="h3">{bundle.title}</h3>
        <ul className="mt-3 space-y-1 text-sm text-[var(--text-muted)]">
          {bundle.items.map((p) => (
            <li key={p.slug}>
              <Link href={`/product/${p.slug}`} className="no-underline hover:text-[var(--text)]">
                {p.title}
              </Link>{" "}
              <span className="opacity-60">· {techniqueByKey(p.technique).short}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap items-baseline gap-3">
          <span className="tnum text-[1.75rem] font-bold">{price(bundle.price)}</span>
          <span className="tnum text-[var(--text-muted)] line-through">{price(bundle.full)}</span>
          <span className="rounded-[4px] bg-[var(--color-turquoise)] px-2 py-1 text-[0.6875rem] font-bold uppercase text-[var(--color-ink)]">
            выгода {price(save)}
          </span>
        </div>

        <div className="mt-5 max-w-sm">
          <AddToCart
            label="Взять комплект"
            line={{
              slug: bundle.items[0].slug,
              title: bundle.title,
              techniqueTitle: `Комплект из ${bundle.items.length} наборов`,
              fandomTitle: "",
              size: "30×40",
              price: bundle.price,
              image: bundle.items[0].images[0].url,
            }}
          />
        </div>
        <p className="mt-2 text-[0.75rem] text-[var(--text-muted)]">
          Комплект закрывает бесплатную доставку от {price(500000)}.
        </p>
      </div>
    </div>
  );
}
