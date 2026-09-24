import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Breadcrumbs, Container, Empty } from "@/components/ui";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { SearchBox } from "@/components/catalog/SearchBox";
import { PRODUCTS, applyFacets } from "@/lib/catalog";
import { productsWord } from "@/lib/format";

export const metadata: Metadata = {
  title: "Поиск по каталогу",
  robots: { index: false, follow: true },
};

const HINTS = ["Гарри Поттер", "мозаика", "киберпанк", "вышивка", "аниме", "дракон"];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = sp.q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  const found = q ? applyFacets(PRODUCTS, { q }) : [];

  return (
    <Container className="pb-16">
      <Breadcrumbs items={[{ title: "Поиск" }]} />

      <header className="mb-8">
        <h1 className="h1">Поиск</h1>
        <div className="mt-6 max-w-2xl">
          <Suspense fallback={<div className="h-14" />}>
            <SearchBox hints={HINTS} />
          </Suspense>
        </div>
      </header>

      {q && (
        <p className="mb-6 text-[var(--text-muted)]">
          {found.length > 0
            ? <>По запросу «{q}» — {productsWord(found.length)}</>
            : <>По запросу «{q}» ничего не нашлось</>}
        </p>
      )}

      {found.length > 0 ? (
        <ProductGrid products={found} priorityCount={4} />
      ) : q ? (
        <Empty
          title="Попробуем иначе"
          lead="Поиск ищет по названию, вселенной и технике. Если не помогло — подберём по трём вопросам."
        >
          <Link href="/quiz" className="btn btn-primary btn-sm">Подобрать за 3 шага</Link>
          <Link href="/catalog" className="btn btn-secondary btn-sm">Весь каталог</Link>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["/catalog", "Весь каталог", "Все наборы с фильтрами"],
            ["/fandom", "Вселенные", "Если знаете, что любите"],
            ["/quiz", "Подбор за 3 вопроса", "Если не знаете, с чего начать"],
          ].map(([href, t, d]) => (
            <Link key={href} href={href} className="card card-lift p-5 no-underline">
              <p className="font-semibold text-[var(--text)]">{t}</p>
              <p className="mt-1.5 text-[0.9375rem] text-[var(--text-muted)]">{d}</p>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
