import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge, Difficulty, Price } from "@/components/ui";
import { difficultyLabel, fandomBySlug, techniqueByKey, type Product } from "@/lib/catalog";
import { hours as fmtHours } from "@/lib/format";

/**
 * Порядок сверху вниз = порядок принятия решения (бренд-бук, раздел 6).
 * Сложность и время сборки — то, чего нет ни у одного конкурента,
 * и то, что закрывает возражение всех трёх персон сразу.
 */
export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const fandom = fandomBySlug(product.fandom);
  const tech = techniqueByKey(product.technique);
  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  return (
    <article className="card card-lift group flex flex-col overflow-hidden">
      <Link href={`/product/${product.slug}`} className="relative block no-underline">
        {/* Светлая подложка: товар «светится» на тёмной витрине */}
        <div className="relative aspect-[4/5] overflow-hidden bg-[var(--color-canvas-2)]">
          <Image
            src={product.images[0].url}
            alt={product.images[0].alt}
            fill
            priority={priority}
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {product.isHit && <Badge tone="hit">Хит</Badge>}
          {product.isNew && <Badge tone="new">Новинка</Badge>}
          {discount > 0 && <Badge tone="sale">−{discount}%</Badge>}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[0.9375rem] font-semibold leading-snug">
          <Link href={`/product/${product.slug}`} className="text-[var(--text)] no-underline">
            {product.title}
          </Link>
        </h3>

        <p className="mt-1.5 text-[0.75rem] text-[var(--text-muted)]">
          {fandom?.title} · {tech.short}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.75rem] text-[var(--text-muted)]">
          <Difficulty value={product.difficulty} />
          <span>{difficultyLabel(product.difficulty)}</span>
          <span aria-hidden className="opacity-40">·</span>
          <span className="tnum">~{fmtHours(product.hours)}</span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <Price value={product.price} old={product.oldPrice} />
        </div>

        {/* Ведём на карточку, а не кладём в корзину одним кликом: размер
            меняет цену, и молча подставлять 30×40 — обманывать покупателя. */}
        <div className="mt-3">
          <Link href={`/product/${product.slug}`} className="btn btn-card btn-sm w-full no-underline">
            Выбрать набор
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: Product[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.slug} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
