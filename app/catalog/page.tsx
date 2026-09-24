import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Breadcrumbs, Container } from "@/components/ui";
import { CatalogView, type SearchParams } from "@/components/catalog/CatalogView";
import { QuickEntries } from "@/components/catalog/QuickEntries";
import { PRODUCTS, TECHNIQUES } from "@/lib/catalog";

/** Комбинации фасетов — noindex, follow: карточки индексируются, миллион комбинаций нет */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const filtered = Object.keys(sp).some((k) => k !== "sort");
  return {
    title: "Каталог наборов — все техники и вселенные",
    description:
      "Все наборы Relaxic: картины по номерам, алмазные мозаики и вышивка. " +
      "Фильтры по вселенной, сложности и времени сборки. Доставка по всей России.",
    alternates: { canonical: "/catalog" },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  return (
    <Container className="pb-16">
      <Breadcrumbs items={[{ title: "Каталог" }]} />

      <header className="mb-8 lg:mb-12">
        <h1 className="h1">Каталог</h1>
        <p className="measure mt-4 text-[var(--text-muted)]">
          {PRODUCTS.length} наборов в трёх техниках. У каждого указаны честная сложность
          и время сборки — не «за вечер», а в часах.{" "}
          <Link href="/how-it-works" className="underline underline-offset-2">Чем техники отличаются</Link>.
        </p>
      </header>

      {/* Техники первым уровнем — вход в каталог начинается с процесса, а не с героя */}
      <div className="mb-10 grid gap-3 sm:grid-cols-3">
        {TECHNIQUES.map((t) => (
          <Link
            key={t.slug}
            href={`/catalog/${t.slug}`}
            className="card card-lift group relative overflow-hidden no-underline"
          >
            <div className="relative aspect-[16/9] bg-[var(--color-canvas-2)]">
              <Image src={t.cover} alt={t.title} fill sizes="(max-width: 640px) 90vw, 30vw" className="object-cover opacity-90 transition-opacity group-hover:opacity-100" />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgb(20_17_16/0.85)] to-transparent" />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-4">
              <h2 className="text-[0.9375rem] font-semibold text-[var(--color-canvas)]">{t.title}</h2>
              <p className="mt-0.5 text-[0.75rem] text-[color-mix(in_oklab,var(--color-canvas)_70%,transparent)]">
                {PRODUCTS.filter((p) => p.technique === t.key).length} наборов
              </p>
            </div>
          </Link>
        ))}
      </div>

      <QuickEntries className="mb-10" />

      <CatalogView searchParams={sp} />
    </Container>
  );
}
