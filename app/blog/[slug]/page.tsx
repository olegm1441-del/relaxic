import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, Brush, Container, SectionHead } from "@/components/ui";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { VideoEmbed } from "@/components/content/VideoEmbed";
import { ArticleCard } from "@/components/content/ArticleCard";
import {
  ARTICLES, ARTICLE_CATEGORIES, articleBySlug, articleCategoryBySlug,
  articlesOfCategory, productsForArticle, relatedArticles,
} from "@/lib/catalog";
import { COMPANY } from "@/lib/company";
import { articlesWord } from "@/lib/format";

/** Один маршрут на рубрику и на статью: адреса из карты сайта — /blog/workshop и /blog/[slug] */
export function generateStaticParams() {
  return [
    ...ARTICLE_CATEGORIES.map((c) => ({ slug: c.slug })),
    ...ARTICLES.map((a) => ({ slug: a.slug })),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = articleCategoryBySlug(slug);
  if (cat) {
    return {
      title: `${cat.title} — блог Relaxic`,
      description: cat.lead,
      alternates: { canonical: `/blog/${cat.slug}` },
    };
  }
  const a = articleBySlug(slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.excerpt,
    alternates: { canonical: `/blog/${a.slug}` },
    openGraph: { type: "article", title: a.title, description: a.excerpt, images: [a.cover] },
  };
}

export default async function BlogEntry({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const cat = articleCategoryBySlug(slug);
  if (cat) return <CategoryPage slug={slug} />;

  const article = articleBySlug(slug);
  if (!article) notFound();

  const category = ARTICLE_CATEGORIES.find((c) => c.key === article.category);
  const products = productsForArticle(article);
  const related = relatedArticles(article);

  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: `${COMPANY.siteUrl}${article.cover}`,
    author: { "@type": "Organization", name: COMPANY.brand },
    publisher: { "@type": "Organization", name: COMPANY.brand },
  };

  return (
    <>
      <Container>
        <Breadcrumbs
          items={[
            { href: "/blog", title: "Блог" },
            { href: `/blog/${category?.slug}`, title: category?.title ?? "" },
            { title: article.title },
          ]}
        />
      </Container>

      <Container className="pb-16">
        <article className="mx-auto max-w-[760px]">
          <p className="caption text-[var(--accent)]">{category?.title}</p>
          <h1 className="h1 mt-4">{article.title}</h1>
          <p className="mt-4 text-sm text-[var(--text-muted)]">{article.readMinutes} мин чтения</p>
          <Brush className="mt-6" />

          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-[var(--radius-blk)] bg-[var(--color-canvas-2)]">
            <Image src={article.cover} alt="" fill priority sizes="(max-width: 860px) 100vw, 760px" className="object-cover" />
          </div>

          <p className="measure mt-8 text-[1.125rem] leading-relaxed">{article.excerpt}</p>

          <div className="prose measure mt-8 text-[1.0625rem] text-[var(--text-muted)]">
            {article.body.map(([tag, text], i) =>
              tag === "h2" ? (
                <h2 key={i} className="text-[var(--text)]">{text}</h2>
              ) : (
                <p key={i}>{text}</p>
              ),
            )}
          </div>

          {/* Видео подключается, когда у статьи есть ролик. Фасад — чтобы не тянуть
              пол-мегабайта скриптов до того, как человек нажал «играть». */}
          {"video" in article && (article as { video?: { src: string; poster: string; title: string } }).video && (
            <VideoEmbed {...(article as unknown as { video: { src: string; poster: string; title: string } }).video} />
          )}

          <p className="prose measure mt-10 text-[var(--text-muted)]">
            Ещё по теме: <Link href="/how-it-works">сравнение трёх техник</Link>,{" "}
            <Link href="/quiz">подбор набора за три вопроса</Link> и{" "}
            <Link href="/gallery">работы покупателей</Link>.
          </p>
        </article>

        {products.length > 0 && (
          <section className="mt-16">
            <SectionHead title="Наборы из статьи" href="/catalog" hrefLabel="Весь каталог" />
            <ProductGrid products={products} />
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-16">
            <SectionHead title="Читать дальше" href="/blog" hrefLabel="Весь блог" />
            <div className="grid gap-5 md:grid-cols-2">
              {related.map((a) => <ArticleCard key={a.slug} article={a} />)}
            </div>
          </section>
        )}
      </Container>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </>
  );
}

function CategoryPage({ slug }: { slug: string }) {
  const cat = articleCategoryBySlug(slug)!;
  const list = articlesOfCategory(cat.key);
  const others = ARTICLE_CATEGORIES.filter((c) => c.slug !== slug);

  return (
    <Container className="pb-16">
      <Breadcrumbs items={[{ href: "/blog", title: "Блог" }, { title: cat.title }]} />

      <header className="mb-10 grid gap-6 lg:grid-cols-[1fr_minmax(0,40%)] lg:items-center lg:gap-12">
        <div>
          <p className="caption text-[var(--accent)]">Рубрика</p>
          <h1 className="h1 mt-3">{cat.title}</h1>
          <p className="measure mt-4 text-[1.0625rem] text-[var(--text-muted)]">{cat.lead}</p>
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            {list.length ? articlesWord(list.length) : "Скоро здесь появятся материалы"}
          </p>
        </div>
        <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-blk)] bg-[var(--color-canvas-2)]">
          <Image src={cat.cover} alt="" fill priority sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" />
        </div>
      </header>

      {list.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => <ArticleCard key={a.slug} article={a} />)}
        </div>
      ) : (
        <p className="card p-6 text-[var(--text-muted)]">
          Пока пусто. Загляните в{" "}
          <Link href="/blog" className="underline underline-offset-2">другие рубрики</Link> или{" "}
          <Link href="/catalog" className="underline underline-offset-2">в каталог</Link>.
        </p>
      )}

      <nav className="mt-14 border-t border-[var(--border)] pt-8">
        <h2 className="caption text-[var(--text-muted)]">Другие рубрики</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {others.map((c) => (
            <Link key={c.slug} href={`/blog/${c.slug}`} className="chip no-underline">{c.title}</Link>
          ))}
        </div>
      </nav>
    </Container>
  );
}
