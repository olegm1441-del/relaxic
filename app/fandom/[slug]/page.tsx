import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, Brush, Container, SectionHead } from "@/components/ui";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { BundleCard } from "@/components/product/BundleCard";
import {
  ARTICLES, FANDOMS, TECHNIQUES, bundleForFandom, fandomBySlug, fandomCover,
  galleryItems, productsOfFandom,
} from "@/lib/catalog";
import { COMPANY } from "@/lib/company";
import { productsWord } from "@/lib/format";

export function generateStaticParams() {
  return FANDOMS.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const f = fandomBySlug(slug);
  if (!f) return {};
  const n = productsOfFandom(slug).length;
  return {
    title: `${f.title} — наборы для сборки`,
    description: `${f.tagline}. ${productsWord(n)} по вселенной «${f.title}»: картины по номерам, алмазные мозаики, вышивка. ${COMPANY.deliveryZone}.`,
    alternates: { canonical: `/fandom/${f.slug}` },
    openGraph: { title: f.title, description: f.tagline, images: [fandomCover(f.slug)] },
  };
}

/** Лендинг вселенной — посадочная для рекламы и соцсетей (ТЗ, раздел 3) */
export default async function FandomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fandom = fandomBySlug(slug);
  if (!fandom) notFound();

  const products = productsOfFandom(slug);
  const bundle = bundleForFandom(slug);
  const neighbours = FANDOMS.filter((f) => f.slug !== slug && f.category === fandom.category).slice(0, 3);
  const others = FANDOMS.filter((f) => f.slug !== slug).slice(0, 6);
  const article = ARTICLES[0];
  const works = galleryItems(24).slice(6, 12);

  const byTechnique = TECHNIQUES
    .map((t) => ({ tech: t, items: products.filter((p) => p.technique === t.key) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      {/* Обложка вселенной — одно из трёх мест, где живёт «Раскрашивание» */}
      <section className="relative">
        <div className="relative h-[46vh] min-h-[320px] w-full overflow-hidden bg-[var(--color-ink-2)] lg:h-[56vh]">
          <Image
            src={fandomCover(slug)}
            alt={fandom.title}
            fill
            priority
            sizes="100vw"
            className="paint-in object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[rgb(20_17_16/0.55)] to-[rgb(20_17_16/0.25)]" />
        </div>
        <Container className="relative -mt-28 pb-2 lg:-mt-36">
          <div className="max-w-[46rem]">
            <p className="caption text-[var(--accent)]">Вселенная</p>
            <h1 className="h1 mt-3">{fandom.title}</h1>
            <Brush className="mt-5" />
            <p className="measure mt-5 text-[1.0625rem] leading-relaxed text-[var(--text)]">
              {fandom.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {fandom.tags.map((t) => (
                <span key={t} className="chip cursor-default">{t}</span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <Container>
        <Breadcrumbs items={[{ href: "/fandom", title: "Вселенные" }, { title: fandom.title }]} />
      </Container>

      <Container className="pb-16">
        {byTechnique.map(({ tech, items }) => (
          <section key={tech.slug} className="mb-14">
            <SectionHead
              title={`${fandom.title} — ${tech.title.toLowerCase()}`}
              lead={tech.tagline}
              href={`/catalog/${tech.slug}?fandom=${slug}`}
              hrefLabel={`Все ${tech.short}`}
            />
            <ProductGrid products={items} />
          </section>
        ))}

        {bundle && (
          <section className="mb-14">
            <SectionHead
              no="05"
              title="Собрать всю вселенную"
              lead="Несколько наборов одной вселенной дешевле, чем по отдельности, — и сразу закрывают бесплатную доставку."
            />
            <BundleCard bundle={bundle} />
          </section>
        )}

        <section className="mb-14">
          <SectionHead
            title="Как это выглядит дома"
            lead="Работы покупателей: без студийного света и обработки."
            href="/gallery"
            hrefLabel="Вся галерея"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {works.map((w, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-[var(--radius-ui)] bg-[var(--color-canvas-2)]">
                <Image src={w.url} alt={`Работа: ${w.caption}`} fill sizes="(max-width: 640px) 45vw, 16vw" className="object-cover" />
              </div>
            ))}
          </div>
        </section>

        <section className="mb-14 grid gap-6 lg:grid-cols-2">
          <Link href={`/blog/${article.slug}`} className="card card-lift flex gap-4 p-4 no-underline">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[var(--radius-ui)] bg-[var(--color-canvas-2)]">
              <Image src={article.cover} alt="" fill sizes="96px" className="object-cover" />
            </div>
            <div>
              <p className="caption text-[var(--text-muted)]">Статья по теме</p>
              <p className="mt-1.5 font-semibold text-[var(--text)]">{article.title}</p>
              <p className="mt-1 text-[0.8125rem] text-[var(--text-muted)]">{article.readMinutes} мин чтения</p>
            </div>
          </Link>
          <Link href="/quiz" className="card card-lift flex gap-4 p-4 no-underline">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[var(--radius-ui)] bg-[var(--accent)] text-[2rem] font-extrabold text-[var(--accent-contrast)]">
              3
            </div>
            <div>
              <p className="caption text-[var(--text-muted)]">Не знаете, что выбрать</p>
              <p className="mt-1.5 font-semibold text-[var(--text)]">Подберём за три вопроса</p>
              <p className="mt-1 text-[0.8125rem] text-[var(--text-muted)]">Кому, на сколько вечеров, какая вселенная</p>
            </div>
          </Link>
        </section>

        <nav className="border-t border-[var(--border)] pt-8">
          <h2 className="caption text-[var(--text-muted)]">
            {neighbours.length ? "Соседние вселенные" : "Другие вселенные"}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {(neighbours.length ? neighbours : others).map((f) => (
              <Link key={f.slug} href={`/fandom/${f.slug}`} className="chip no-underline">
                {f.title}
              </Link>
            ))}
            <Link href="/fandom" className="chip no-underline">Все вселенные</Link>
          </div>
        </nav>
      </Container>
    </>
  );
}
