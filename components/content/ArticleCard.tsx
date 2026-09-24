import Image from "next/image";
import Link from "next/link";
import { ARTICLE_CATEGORIES, type Article } from "@/lib/catalog";

export function ArticleCard({ article }: { article: Article }) {
  const cat = ARTICLE_CATEGORIES.find((c) => c.key === article.category);
  return (
    <Link href={`/blog/${article.slug}`} className="card card-lift group flex flex-col overflow-hidden no-underline">
      <div className="relative aspect-[16/10] bg-[var(--color-canvas-2)]">
        <Image
          src={article.cover}
          alt=""
          fill
          sizes="(max-width: 768px) 90vw, 30vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="caption text-[var(--text-muted)]">{cat?.title}</p>
        <h3 className="mt-2 text-[1.0625rem] font-semibold leading-snug text-[var(--text)]">{article.title}</h3>
        <p className="mt-2.5 flex-1 text-[0.9375rem] leading-relaxed text-[var(--text-muted)]">{article.excerpt}</p>
        <p className="mt-4 text-[0.75rem] text-[var(--text-muted)]">{article.readMinutes} мин чтения</p>
      </div>
    </Link>
  );
}
