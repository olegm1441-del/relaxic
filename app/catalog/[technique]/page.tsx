import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, Brush, Container } from "@/components/ui";
import { CatalogView, type SearchParams } from "@/components/catalog/CatalogView";
import { QuickEntries } from "@/components/catalog/QuickEntries";
import { PRODUCTS, TECHNIQUES, techniqueBySlug } from "@/lib/catalog";
import { COMPANY } from "@/lib/company";
import { HOWTO_SLUG } from "@/lib/howto";
import { price } from "@/lib/format";

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
  const minPrice = Math.min(...pool.map((p) => p.price));
  const minHours = Math.min(...pool.map((p) => p.hours));
  const maxHours = Math.max(...pool.map((p) => p.hours));
  const howtoSlug = HOWTO_SLUG[t.key];

  return (
    <>
      <Container>
        <Breadcrumbs items={[{ href: "/catalog", title: "Каталог" }, { title: t.title }]} />
      </Container>

      {/* Полоса-кадр вместо большого блока: раньше герой занимал весь первый
          экран, и до первого товара нужно было прокрутить страницу целиком. */}
      <div className="relative mb-8 aspect-[2/1] w-full overflow-hidden bg-[var(--color-ink-2)] sm:aspect-[3/1] lg:aspect-[4/1]">
        <Image src={t.cover} alt="" fill priority sizes="100vw" className="object-cover" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[rgb(20_17_16/0.45)] to-[rgb(20_17_16/0.25)]" />
      </div>

      <Container className="pb-16">
        <header className="mb-8">
          <h1 className="h1">{t.title}</h1>
          <p className="measure mt-4 text-[1.0625rem] leading-relaxed text-[var(--text-muted)]">
            {t.lead}
          </p>
          <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--text-muted)]">
            <li><span className="tnum font-semibold text-[var(--text)]">{pool.length}</span> наборов</li>
            <li aria-hidden className="opacity-40">·</li>
            <li>от <span className="tnum font-semibold text-[var(--text)]">{price(minPrice)}</span></li>
            <li aria-hidden className="opacity-40">·</li>
            <li>от <span className="tnum font-semibold text-[var(--text)]">{minHours} ч</span> до <span className="tnum font-semibold text-[var(--text)]">{maxHours} ч</span> сборки</li>
            <li aria-hidden className="opacity-40">·</li>
            <li>{t.forWhom.toLowerCase()}</li>
          </ul>
        </header>

        <QuickEntries className="mb-9" />

        <CatalogView
          pool={pool}
          searchParams={sp}
          hideParams={["technique"]}
        />

        <section className="mt-16 border-t border-[var(--border)] pt-8">
          <Link href={`/how-it-works/${howtoSlug}`} className="card card-lift flex items-center gap-5 p-5 no-underline">
            <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-[var(--radius-ui)] bg-[var(--color-canvas-2)]">
              <Image src={t.box} alt="" fill sizes="112px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <p className="caption text-[var(--text-muted)]">Перед покупкой</p>
              <p className="mt-1.5 font-semibold text-[var(--text)]">
                {t.one}: что внутри коробки, как собирать и три ошибки новичка
              </p>
              <p className="mt-1 text-[0.8125rem] text-[var(--text-muted)]">
                Разбор техники · освоить за {t.learnMinutes} минут
              </p>
            </div>
          </Link>
        </section>

        <nav className="mt-10 border-t border-[var(--border)] pt-8">
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
