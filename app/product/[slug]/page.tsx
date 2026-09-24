import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, Badge, Container, Difficulty, Rating, SectionHead, Stars } from "@/components/ui";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { BundleCard } from "@/components/product/BundleCard";
import { ProductBuy, ProductGallery } from "@/components/product/ProductBuy";
import {
  PRODUCTS, articleForProduct, bundleForFandom, fandomBySlug, fromSameFandom,
  productBySlug, ratingFor, reviewsFor, sameArtwork, similarDifficulty, sizesFor,
  techniqueByKey,
} from "@/lib/catalog";
import { COMPANY } from "@/lib/company";
import { hours as fmtHours, evenings, price, reviewsWord } from "@/lib/format";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = productBySlug(slug);
  if (!p) return {};
  return {
    title: p.seoTitle.replace(" · Relaxic", ""),
    description: p.seoDescription,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title: p.title, description: p.lead, images: [p.images[0].url] },
  };
}

/** Порядок блоков = порядок снятия возражений (ТЗ, раздел 5) */
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) notFound();

  const fandom = fandomBySlug(product.fandom);
  const tech = techniqueByKey(product.technique);
  const sizes = sizesFor(product);
  const reviews = reviewsFor(product.slug);
  const rating = ratingFor(product.slug);
  const others = sameArtwork(product);
  const universe = fromSameFandom(product);
  const similar = similarDifficulty(product);
  const article = articleForProduct(product);
  const bundle = bundleForFandom(product.fandom);

  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.title} — ${tech.one.toLowerCase()}`,
    description: product.lead,
    image: product.images.map((i) => `${COMPANY.siteUrl}${i.url}`),
    brand: { "@type": "Brand", name: COMPANY.brand },
    offers: {
      "@type": "Offer",
      price: (product.price / 100).toFixed(0),
      priceCurrency: "RUB",
      availability: "https://schema.org/InStock",
      url: `${COMPANY.siteUrl}/product/${product.slug}`,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: rating.value,
      reviewCount: rating.count,
    },
  };

  return (
    <>
      <Container>
        <Breadcrumbs
          items={[
            { href: `/catalog/${tech.slug}`, title: tech.title },
            { href: `/fandom/${product.fandom}`, title: fandom?.title ?? "" },
            { title: product.title },
          ]}
        />
      </Container>

      <Container className="pb-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,46%)_1fr] lg:gap-12">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductGallery product={product} />
          </div>

          <div>
            <div className="flex flex-wrap gap-1.5">
              {product.isHit && <Badge tone="hit">Хит</Badge>}
              {product.isNew && <Badge tone="new">Новинка</Badge>}
              {product.difficulty <= 2 && <Badge tone="plain">Для начала</Badge>}
            </div>

            <h1 className="h1 mt-3 text-[clamp(1.75rem,3.6vw,2.5rem)]">{product.title}</h1>

            <p className="mt-3 text-sm text-[var(--text-muted)]">
              <Link href={`/fandom/${product.fandom}`} className="underline underline-offset-2">
                {fandom?.title}
              </Link>
              {" · "}
              <Link href={`/catalog/${tech.slug}`} className="underline underline-offset-2">
                {tech.one}
              </Link>
            </p>

            <div className="mt-4">
              <Rating value={rating.value} count={rating.count} href="#otzyvy" />
            </div>

            <p className="measure mt-5 text-[1.0625rem] leading-relaxed">{product.lead}</p>

            {/* Сложность, время и цвета — то, чего нет у конкурентов */}
            <dl className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-[var(--radius-card)] border border-[var(--border)] p-3.5">
                <dt className="text-[0.75rem] text-[var(--text-muted)]">Сложность</dt>
                <dd className="mt-2"><Difficulty value={product.difficulty} size={8} /></dd>
                <dd className="mt-1.5 text-[0.75rem] text-[var(--text-muted)]">{product.difficulty} из 5</dd>
              </div>
              <div className="rounded-[var(--radius-card)] border border-[var(--border)] p-3.5">
                <dt className="text-[0.75rem] text-[var(--text-muted)]">Время сборки</dt>
                <dd className="tnum mt-2 text-[1.0625rem] font-bold">~{fmtHours(product.hours)}</dd>
                <dd className="mt-1 text-[0.75rem] text-[var(--text-muted)]">{evenings(product.hours)}</dd>
              </div>
              <div className="rounded-[var(--radius-card)] border border-[var(--border)] p-3.5">
                <dt className="text-[0.75rem] text-[var(--text-muted)]">
                  {product.technique === "CROSS_STITCH" ? "Цветов мулине" : "Цветов"}
                </dt>
                <dd className="tnum mt-2 text-[1.0625rem] font-bold">{product.colorsCount}</dd>
                <dd className="mt-1 text-[0.75rem] text-[var(--text-muted)]">от {product.minAge} лет</dd>
              </div>
            </dl>

            <ProductBuy
              product={product}
              sizes={sizes}
              techniqueTitle={tech.one}
              fandomTitle={fandom?.title ?? ""}
            />

            {others.length > 0 && (
              <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--border)] p-4">
                <p className="caption text-[var(--text-muted)]">Тот же кадр в другой технике</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {others.map((o) => (
                    <Link key={o.slug} href={`/product/${o.slug}`} className="chip no-underline">
                      {techniqueByKey(o.technique).one} · {price(o.price)}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Что в коробке ── */}
        <section className="mt-16 grid gap-8 lg:grid-cols-[1fr_minmax(0,42%)] lg:gap-12">
          <div>
            <h2 className="h2">Что в коробке</h2>
            <ul className="mt-5 space-y-2.5">
              {product.boxContents.map((item) => (
                <li key={item} className="flex gap-3 text-[0.9375rem]">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                  {item}
                </li>
              ))}
            </ul>

            <h3 className="h3 mt-8 text-[1.125rem]">Характеристики</h3>
            <dl className="mt-4 divide-y divide-[var(--border)] border-y border-[var(--border)]">
              {Object.entries(product.specs).map(([k, v]) => (
                <div key={k} className="flex flex-wrap gap-x-6 gap-y-1 py-3 text-[0.9375rem]">
                  <dt className="w-40 shrink-0 text-[var(--text-muted)]">{k}</dt>
                  <dd className="flex-1">{v}</dd>
                </div>
              ))}
              <div className="flex flex-wrap gap-x-6 gap-y-1 py-3 text-[0.9375rem]">
                <dt className="w-40 shrink-0 text-[var(--text-muted)]">Размеры</dt>
                <dd className="flex-1">{sizes.map((s) => s.label).join(" · ")} см</dd>
              </div>
            </dl>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-blk)] bg-[var(--color-canvas-2)] lg:aspect-auto lg:min-h-[320px]">
            <Image src={tech.box} alt={`Комплектация: ${tech.one.toLowerCase()}`} fill sizes="(max-width: 1024px) 100vw, 42vw" className="object-cover" />
          </div>
        </section>

        {/* ── История кадра ── */}
        <section className="mt-16">
          <h2 className="h2">Что это за кадр</h2>
          <div className="prose measure mt-5 text-[1.0625rem] text-[var(--text-muted)]">
            <p>{product.story}</p>
            <p>
              Вселенная{" "}
              <Link href={`/fandom/${product.fandom}`}>{fandom?.title}</Link> —{" "}
              {fandom?.tagline.toLowerCase()}. Если хотите тот же сюжет медленнее или быстрее,
              посмотрите <Link href={`/catalog/${tech.slug}`}>другие {tech.short}</Link> или{" "}
              <Link href="/how-it-works">сравните три техники</Link>.
            </p>
          </div>
        </section>

        {/* ── Отзывы ── */}
        <section id="otzyvy" className="mt-16 scroll-mt-24">
          <SectionHead
            title="Отзывы"
            lead={`${reviewsWord(reviews.length)} · средняя оценка ${rating.value.toFixed(1)}`}
            href="/reviews"
            hrefLabel="Все отзывы"
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r, i) => (
              <article key={i} className="card p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{r.authorName}</p>
                  <Stars value={r.rating} />
                </div>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-[var(--text-muted)]">{r.text}</p>
                {r.photoUrl && (
                  <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-[var(--radius-ui)] bg-[var(--color-canvas-2)]">
                    <Image src={r.photoUrl} alt="Фото из отзыва" fill sizes="(max-width: 768px) 90vw, 30vw" className="object-cover" />
                  </div>
                )}
                <p className="mt-3 text-[0.75rem] text-[var(--text-muted)]">{r.daysAgo} дней назад</p>
              </article>
            ))}
          </div>
          <p className="mt-4 text-[0.75rem] text-[var(--text-muted)]">
            Демонстрационные отзывы. В базе они помечены флагом и отделяются от настоящих одним запросом.
          </p>
        </section>

        {universe.length > 0 && (
          <section className="mt-16">
            <SectionHead
              title="Из этой вселенной"
              href={`/fandom/${product.fandom}`}
              hrefLabel={`Вся вселенная «${fandom?.title}»`}
            />
            <ProductGrid products={universe} />
          </section>
        )}

        {similar.length > 0 && (
          <section className="mt-16">
            <SectionHead
              title="Похожие по сложности"
              lead={`Те же ${product.difficulty} из 5 и примерно столько же времени — но другая вселенная.`}
              href={`/catalog?difficulty=${product.difficulty}`}
              hrefLabel="Все такой же сложности"
            />
            <ProductGrid products={similar} />
          </section>
        )}

        {bundle && (
          <section className="mt-16">
            <SectionHead title="Взять комплектом" lead="Дешевле, чем по отдельности, и сразу бесплатная доставка." />
            <BundleCard bundle={bundle} />
          </section>
        )}

        <section className="mt-16">
          <Link href={`/blog/${article.slug}`} className="card card-lift flex flex-col gap-4 p-5 no-underline sm:flex-row sm:items-center">
            <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-[var(--radius-ui)] bg-[var(--color-canvas-2)] sm:aspect-[4/3] sm:w-44">
              <Image src={article.cover} alt="" fill sizes="(max-width: 640px) 90vw, 176px" className="object-cover" />
            </div>
            <div>
              <p className="caption text-[var(--text-muted)]">Статья по теме</p>
              <p className="h3 mt-2 text-[1.125rem] text-[var(--text)]">{article.title}</p>
              <p className="measure mt-2 text-[0.9375rem] text-[var(--text-muted)]">{article.excerpt}</p>
              <p className="mt-2 text-[0.75rem] text-[var(--text-muted)]">{article.readMinutes} мин чтения</p>
            </div>
          </Link>
        </section>
      </Container>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </>
  );
}
