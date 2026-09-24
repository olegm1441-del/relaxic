import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs, Container, SectionHead } from "@/components/ui";
import { galleryItems } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Работы покупателей",
  description:
    "Собранные наборы в реальных квартирах: на стене, на полке, в руках. " +
    "Без студийного света и обработки.",
  alternates: { canonical: "/gallery" },
};

export default function GalleryPage() {
  const items = galleryItems(46);

  return (
    <Container className="pb-16">
      <Breadcrumbs items={[{ title: "Работы покупателей" }]} />

      <header className="mb-10 lg:mb-14">
        <h1 className="h1">Как это выглядит дома</h1>
        <p className="measure mt-4 text-[1.0625rem] text-[var(--text-muted)]">
          Главный вопрос перед покупкой — «а нормально ли это будет смотреться». Вот ответ:
          работы в обычных квартирах, снятые на телефон.{" "}
          <Link href="/reviews" className="underline underline-offset-2">Отзывы к ним</Link>.
        </p>
      </header>

      {/* Плитка кладкой: разная высота не даёт сетке выглядеть каталогом обоев */}
      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
        {items.map((w, i) => (
          <Link
            key={i}
            href={w.productSlug ? `/product/${w.productSlug}` : "/catalog"}
            className="group relative block break-inside-avoid overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-canvas-2)] no-underline"
          >
            <Image
              src={w.url}
              alt={`Работа покупателя: ${w.caption}`}
              width={800}
              height={i % 3 === 0 ? 1000 : 600}
              sizes="(max-width: 640px) 48vw, (max-width: 1024px) 32vw, 24vw"
              className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgb(20_17_16/0.9)] to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="block text-[0.8125rem] font-semibold text-[var(--color-canvas)]">{w.caption}</span>
              <span className="block text-[0.75rem] text-[color-mix(in_oklab,var(--color-canvas)_70%,transparent)]">{w.author}</span>
            </span>
          </Link>
        ))}
      </div>

      <section className="mt-16 border-t border-[var(--border)] pt-10">
        <SectionHead
          title="Хотите так же?"
          lead="Начните с набора на один вечер — если не пойдёт, потеряете вечер, а не месяц."
          href="/catalog?hours=0-5"
          hrefLabel="Наборы на один вечер"
        />
      </section>

      <p className="mt-8 text-[0.75rem] text-[var(--text-muted)]">
        Демонстрационная галерея: работы сгенерированы для витрины и помечены в базе флагом.
      </p>
    </Container>
  );
}
