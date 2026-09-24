import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs, Container, Stars } from "@/components/ui";
import { PRODUCTS, ratingFor, reviewsFor, techniqueByKey } from "@/lib/catalog";
import { reviewsWord } from "@/lib/format";

export const metadata: Metadata = {
  title: "Отзывы покупателей",
  description: "Что пишут о наборах Relaxic: качество холста, плотность страз, сроки доставки.",
  alternates: { canonical: "/reviews" },
};

export default function ReviewsPage() {
  const all = PRODUCTS.flatMap((p) =>
    reviewsFor(p.slug).map((r) => ({ ...r, product: p })),
  ).sort((a, b) => a.daysAgo - b.daysAgo);

  const avg =
    Math.round((all.reduce((s, r) => s + r.rating, 0) / all.length) * 10) / 10;

  return (
    <Container className="pb-16">
      <Breadcrumbs items={[{ title: "Отзывы" }]} />

      <header className="mb-10 lg:mb-14">
        <h1 className="h1">Отзывы</h1>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Stars value={avg} size={20} />
          <span className="tnum text-[1.5rem] font-bold">{avg.toFixed(1)}</span>
          <span className="text-[var(--text-muted)]">{reviewsWord(all.length)}</span>
        </div>
        <p className="measure mt-4 text-[var(--text-muted)]">
          Собраны по всем наборам. Фотографии — из{" "}
          <Link href="/gallery" className="underline underline-offset-2">галереи работ</Link>.
        </p>
      </header>

      <div className="columns-1 gap-4 md:columns-2 lg:columns-3 [&>*]:mb-4">
        {all.slice(0, 48).map((r, i) => (
          <article key={i} className="card break-inside-avoid p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{r.authorName}</p>
              <Stars value={r.rating} />
            </div>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-[var(--text-muted)]">{r.text}</p>
            {r.photoUrl && (
              <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-[var(--radius-ui)] bg-[var(--color-canvas-2)]">
                <Image src={r.photoUrl} alt="" fill sizes="(max-width: 768px) 90vw, 30vw" className="object-cover" />
              </div>
            )}
            <Link
              href={`/product/${r.product.slug}`}
              className="mt-4 block text-[0.8125rem] text-[var(--text-muted)] no-underline hover:text-[var(--text)]"
            >
              {r.product.title} · {techniqueByKey(r.product.technique).short} →
            </Link>
          </article>
        ))}
      </div>

      <p className="mt-10 text-[0.75rem] text-[var(--text-muted)]">
        Демонстрационные отзывы: в базе помечены флагом isSeeded и отделяются от настоящих одним запросом.
        Перед реальным запуском включается модерация и приём отзывов от покупателей.
      </p>
    </Container>
  );
}
