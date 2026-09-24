import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, Brush, Container } from "@/components/ui";
import { CatalogView, type SearchParams } from "@/components/catalog/CatalogView";
import { PRODUCTS, TECHNIQUES, techniqueBySlug } from "@/lib/catalog";
import { COMPANY } from "@/lib/company";

export function generateStaticParams() {
  return TECHNIQUES.map((t) => ({ technique: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ technique: string }>;
}): Promise<Metadata> {
  const { technique } = await params;
  const t = techniqueBySlug(technique);
  if (!t) return {};
  const n = PRODUCTS.filter((p) => p.technique === t.key).length;
  return {
    title: `${t.title} по вселенным кино, сериалов и игр`,
    description: `${t.tagline}. ${n} наборов, сложность и время сборки указаны честно. ${COMPANY.deliveryZone}.`,
    alternates: { canonical: `/catalog/${t.slug}` },
    openGraph: { title: t.title, description: t.tagline, images: [t.cover] },
  };
}

export default async function TechniquePage({
  params, searchParams,
}: {
  params: Promise<{ technique: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { technique } = await params;
  const sp = await searchParams;
  const t = techniqueBySlug(technique);
  if (!t) notFound();

  const pool = PRODUCTS.filter((p) => p.technique === t.key);
  const others = TECHNIQUES.filter((x) => x.slug !== t.slug);

  return (
    <>
      <Container>
        <Breadcrumbs items={[{ href: "/catalog", title: "Каталог" }, { title: t.title }]} />
      </Container>

      <Container className="pb-16">
        <header className="mb-10 grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-12">
          <div>
            <h1 className="h1">{t.title}</h1>
            <Brush className="mt-5" />
            <p className="measure mt-5 text-[1.0625rem] leading-relaxed text-[var(--text-muted)]">
              {t.lead}
            </p>
            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <div>
                <dt className="text-[var(--text-muted)]">Наборов</dt>
                <dd className="tnum mt-0.5 text-[1.125rem] font-bold">{pool.length}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)]">Освоить технику</dt>
                <dd className="tnum mt-0.5 text-[1.125rem] font-bold">{t.learnMinutes} мин</dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)]">Кому подходит</dt>
                <dd className="mt-0.5 font-semibold">{t.forWhom}</dd>
              </div>
            </dl>
            <p className="mt-6 text-sm text-[var(--text-muted)]">
              <Link href={`/how-it-works/${t.slug === "kartiny-po-nomeram" ? "paint-by-numbers" : t.slug === "almaznaya-mozaika" ? "diamond-mosaic" : "cross-stitch"}`} className="underline underline-offset-2">
                Разбор техники: что внутри и как собирать
              </Link>
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-blk)] bg-[var(--color-canvas-2)]">
            <Image src={t.cover} alt={t.title} fill priority sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" />
          </div>
        </header>

        <CatalogView
          pool={pool}
          searchParams={sp}
          hideParams={["technique"]}
        />

        <nav className="mt-16 border-t border-[var(--border)] pt-8">
          <h2 className="caption text-[var(--text-muted)]">Другие техники</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {others.map((o) => (
              <Link key={o.slug} href={`/catalog/${o.slug}`} className="card card-lift flex items-center gap-4 p-4 no-underline">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-ui)] bg-[var(--color-canvas-2)]">
                  <Image src={o.cover} alt="" fill sizes="64px" className="object-cover" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--text)]">{o.title}</p>
                  <p className="mt-0.5 text-[0.8125rem] text-[var(--text-muted)]">{o.forWhom}</p>
                </div>
              </Link>
            ))}
          </div>
        </nav>
      </Container>
    </>
  );
}
