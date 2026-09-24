import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, Brush, Container, SectionHead } from "@/components/ui";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { PRODUCTS, TECHNIQUES } from "@/lib/catalog";
import { HOWTO, HOWTO_SLUG, techniqueByHowto } from "@/lib/howto";
import { COMPANY } from "@/lib/company";

export function generateStaticParams() {
  return TECHNIQUES.map((t) => ({ slug: HOWTO_SLUG[t.key] }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = techniqueByHowto(slug);
  if (!t) return {};
  return {
    title: `${t.one}: как собирать, ошибки новичков и ответы`,
    description: `${t.lead} Пошаговый разбор, три частые ошибки и ответы на вопросы.`,
    alternates: { canonical: `/how-it-works/${slug}` },
    openGraph: { title: t.one, description: t.tagline, images: [t.cover] },
  };
}

export default async function HowtoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tech = techniqueByHowto(slug);
  if (!tech) notFound();

  const content = HOWTO[tech.key];
  const products = PRODUCTS.filter((p) => p.technique === tech.key && p.difficulty <= 3).slice(0, 4);
  const others = TECHNIQUES.filter((t) => t.key !== tech.key);

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faq.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <>
      <Container>
        <Breadcrumbs
          items={[{ href: "/how-it-works", title: "Как это работает" }, { title: tech.one }]}
        />
      </Container>

      <Container className="pb-16">
        <header className="mb-12 grid gap-8 lg:grid-cols-[1fr_minmax(0,44%)] lg:items-center lg:gap-12">
          <div>
            <p className="caption text-[var(--accent)]">Разбор техники</p>
            <h1 className="h1 mt-3">{tech.one}</h1>
            <Brush className="mt-5" />
            <p className="measure mt-5 text-[1.0625rem] leading-relaxed text-[var(--text-muted)]">{tech.lead}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={`/catalog/${tech.slug}`} className="btn btn-primary">
                Наборы: {tech.title.toLowerCase()}
              </Link>
              <Link href="/quiz" className="btn btn-accent-2">Подобрать за 3 вопроса</Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-blk)] bg-[var(--color-canvas-2)]">
            <Image src={tech.cover} alt={tech.one} fill priority sizes="(max-width: 1024px) 100vw, 44vw" className="object-cover" />
          </div>
        </header>

        <section className="mb-14">
          <SectionHead no="01" title="Как собирать" lead="Пять шагов в том порядке, в котором они экономят время." />
          <ol className="grid gap-4 lg:grid-cols-2">
            {content.steps.map(([t, d], i) => (
              <li key={t} className="card flex gap-4 p-5">
                <span className="tnum flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-[var(--accent-contrast)]">
                  {i + 1}
                </span>
                <span>
                  <span className="block font-semibold">{t}</span>
                  <span className="mt-1.5 block text-[0.9375rem] leading-relaxed text-[var(--text-muted)]">{d}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-14">
          <SectionHead no="02" title="Три ошибки новичка" lead="Каждая стоит либо времени, либо набора." />
          <div className="grid gap-4 lg:grid-cols-3">
            {content.mistakes.map(([t, d]) => (
              <div key={t} className="card border-l-2 border-l-[var(--color-danger)] p-5">
                <p className="font-semibold">{t}</p>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-[var(--text-muted)]">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-14">
          <SectionHead no="03" title="Что в коробке" lead="Полный состав — на карточке каждого набора." />
          <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,42%)] lg:gap-12">
            <ul className="space-y-2.5">
              {(
                {
                  PAINT_BY_NUMBERS: ["Холст на подрамнике с контурами и номерами", "Акриловые краски по номерам", "Три кисти: 1, 3 и 6 мм", "Контрольная схема в натуральную величину", "Крепёж и инструкция"],
                  DIAMOND_MOSAIC: ["Клеевой холст с защитной плёнкой", "Стразы по цветам в пакетах", "Аппликатор, клей-гель и лоток", "Пинцет и салфетка", "Крепёж и инструкция"],
                  CROSS_STITCH: ["Канва Aida 14 с разметкой", "Мулине на картах по номерам", "Две иглы с тупым концом", "Схема на листах А3", "Пяльцы и инструкция"],
                } as Record<string, string[]>
              )[tech.key].map((item) => (
                <li key={item} className="flex gap-3 text-[0.9375rem]">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-blk)] bg-[var(--color-canvas-2)]">
              <Image src={tech.box} alt={`Комплектация: ${tech.one.toLowerCase()}`} fill sizes="(max-width: 1024px) 100vw, 42vw" className="object-cover" />
            </div>
          </div>
        </section>

        <section className="mb-14">
          <SectionHead no="04" title="Вопросы, которые задают чаще всего" />
          <dl className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
            {content.faq.map(([q, a]) => (
              <div key={q} className="py-5">
                <dt className="font-semibold">{q}</dt>
                <dd className="measure mt-2 text-[0.9375rem] leading-relaxed text-[var(--text-muted)]">{a}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-sm text-[var(--text-muted)]">
            Остальное — в <Link href="/faq" className="underline underline-offset-2">общих вопросах</Link> или по телефону{" "}
            <a href={COMPANY.phoneHref} className="underline underline-offset-2">{COMPANY.phone}</a>.
          </p>
        </section>

        {products.length > 0 && (
          <section className="mb-14">
            <SectionHead
              title="С чего начать в этой технике"
              lead="Сложность до трёх — то, что доводят до конца с первого раза."
              href={`/catalog/${tech.slug}`}
              hrefLabel="Все наборы"
            />
            <ProductGrid products={products} />
          </section>
        )}

        <nav className="border-t border-[var(--border)] pt-8">
          <h2 className="caption text-[var(--text-muted)]">Другие техники</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {others.map((o) => (
              <Link key={o.slug} href={`/how-it-works/${HOWTO_SLUG[o.key]}`} className="card card-lift flex items-center gap-4 p-4 no-underline">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-ui)] bg-[var(--color-canvas-2)]">
                  <Image src={o.cover} alt="" fill sizes="64px" className="object-cover" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--text)]">{o.one}</p>
                  <p className="mt-0.5 text-[0.8125rem] text-[var(--text-muted)]">{o.forWhom}</p>
                </div>
              </Link>
            ))}
          </div>
        </nav>
      </Container>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    </>
  );
}
