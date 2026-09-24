import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs, Container, SectionHead } from "@/components/ui";
import { ArticleCard } from "@/components/content/ArticleCard";
import { ARTICLES, ARTICLE_CATEGORIES, articlesOfCategory } from "@/lib/catalog";
import { articlesWord } from "@/lib/format";

export const metadata: Metadata = {
  title: "Блог — разборы техник, истории и изнанка производства",
  description:
    "Как выбрать технику, что подарить, почему монотонная работа руками снимает тревогу " +
    "и как мы собираем палитры. Без воды и без «творчества для души».",
  alternates: { canonical: "/blog" },
};

export default function BlogHub() {
  const [lead, ...rest] = ARTICLES;

  return (
    <Container className="pb-16">
      <Breadcrumbs items={[{ title: "Блог" }]} />

      <header className="mb-10 lg:mb-14">
        <h1 className="h1">Блог</h1>
        <p className="measure mt-4 text-[1.0625rem] text-[var(--text-muted)]">
          Пишем о том, что помогает выбрать и довести набор до конца. Шесть рубрик,{" "}
          {articlesWord(ARTICLES.length)}.
        </p>
      </header>

      {/* Рубрики первым экраном: человек чаще ищет тему, а не конкретную статью */}
      <nav aria-label="Рубрики" className="mb-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ARTICLE_CATEGORIES.map((c) => {
          const n = articlesOfCategory(c.key).length;
          return (
            <Link key={c.slug} href={`/blog/${c.slug}`} className="card card-lift group flex gap-4 p-4 no-underline">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-ui)] bg-[var(--color-canvas-2)]">
                <Image src={c.cover} alt="" fill sizes="80px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-[var(--text)]">{c.title}</h2>
                <p className="mt-1 text-[0.8125rem] leading-snug text-[var(--text-muted)]">{c.lead}</p>
                <p className="mt-1.5 text-[0.75rem] text-[var(--text-muted)]">{n ? articlesWord(n) : "скоро"}</p>
              </div>
            </Link>
          );
        })}
      </nav>

      <SectionHead title="Свежее" />

      <Link href={`/blog/${lead.slug}`} className="card card-lift group mb-6 block overflow-hidden no-underline lg:flex">
        <div className="relative aspect-[16/9] bg-[var(--color-canvas-2)] lg:aspect-auto lg:w-[52%]">
          <Image src={lead.cover} alt="" fill priority sizes="(max-width: 1024px) 100vw, 52vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        </div>
        <div className="flex flex-1 flex-col justify-center p-6 lg:p-10">
          <p className="caption text-[var(--text-muted)]">
            {ARTICLE_CATEGORIES.find((c) => c.key === lead.category)?.title}
          </p>
          <h3 className="h2 mt-3 text-[var(--text)]">{lead.title}</h3>
          <p className="measure mt-4 text-[var(--text-muted)]">{lead.excerpt}</p>
          <p className="mt-5 text-[0.8125rem] text-[var(--text-muted)]">{lead.readMinutes} мин чтения</p>
        </div>
      </Link>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {rest.map((a) => (
          <ArticleCard key={a.slug} article={a} />
        ))}
      </div>
    </Container>
  );
}
