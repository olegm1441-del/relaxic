import Link from "next/link";
import { Suspense } from "react";
import { Filters, type FilterGroup } from "./Filters";
import { ProductGrid } from "./ProductCard";
import { Empty } from "@/components/ui";
import {
  AGE_BUCKETS, FANDOMS, HOURS_BUCKETS, PRODUCTS, SIZES, SORTS, TECHNIQUES,
  applyFacets, parseFacets, type Facets, type Product,
} from "@/lib/catalog";

export type SearchParams = Record<string, string | string[] | undefined>;

function buildGroups(pool: Product[]): FilterGroup[] {
  const countBy = <T,>(items: T[], pick: (p: Product) => T) =>
    pool.filter((p) => items.some((i) => i === pick(p))).length;

  return [
    {
      param: "fandom",
      title: "Вселенная",
      searchable: true,
      options: FANDOMS
        .map((f) => ({ value: f.slug, title: f.title, count: pool.filter((p) => p.fandom === f.slug).length }))
        .filter((o) => o.count > 0),
    },
    {
      param: "technique",
      title: "Техника",
      options: TECHNIQUES
        .map((t) => ({ value: t.slug, title: t.title, count: pool.filter((p) => p.technique === t.key).length }))
        .filter((o) => o.count > 0),
    },
    {
      param: "difficulty",
      title: "Сложность",
      options: [1, 2, 3, 4, 5]
        .map((d) => ({ value: String(d), title: "●".repeat(d), count: pool.filter((p) => p.difficulty === d).length }))
        .filter((o) => o.count > 0),
    },
    {
      param: "hours",
      title: "Время сборки",
      options: HOURS_BUCKETS
        .map((b) => ({ value: b.key, title: b.title, count: pool.filter((p) => b.test(p.hours)).length }))
        .filter((o) => o.count > 0),
    },
    {
      param: "size",
      title: "Размер, см",
      options: SIZES.map((s) => ({ value: s.label, title: s.label })),
    },
    {
      param: "age",
      title: "Возраст",
      options: AGE_BUCKETS.map((a) => ({
        value: a.key, title: a.title, count: pool.filter((p) => p.minAge <= a.min).length,
      })),
    },
  ].filter((g) => g.options.length > 1) as FilterGroup[];
}

export function CatalogView({
  pool, searchParams, hideParams = [], forced = {},
}: {
  pool?: Product[];
  searchParams: SearchParams;
  hideParams?: string[];
  /** Жёстко заданные фасеты страницы: на /catalog/almaznaya-mozaika техника фиксирована */
  forced?: Partial<Facets>;
}) {
  const base = pool ?? PRODUCTS;
  const facets = { ...parseFacets(searchParams), ...forced };
  const list = applyFacets(base, facets);
  const groups = buildGroups(base);

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:gap-10">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Suspense fallback={<div className="h-10" />}>
          <Filters groups={groups} sorts={SORTS} total={list.length} hideParams={hideParams} />
        </Suspense>
      </aside>

      <div>
        {list.length > 0 ? (
          <ProductGrid products={list} priorityCount={4} />
        ) : (
          <Empty
            title="Под эти фильтры ничего нет"
            lead="Снимите пару условий или подберите набор по трём вопросам — это быстрее."
          >
            <Link href="/quiz" className="btn btn-primary btn-sm">Подобрать за 3 шага</Link>
            <Link href="/catalog" className="btn btn-secondary btn-sm">Весь каталог</Link>
          </Empty>
        )}
      </div>
    </div>
  );
}
