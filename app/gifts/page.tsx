import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs, Container, SectionHead } from "@/components/ui";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { GIFT_COLLECTIONS, giftProducts } from "@/lib/gifts";
import { PRODUCTS } from "@/lib/catalog";
import { price } from "@/lib/format";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Подарки — наборы, сертификаты и упаковка",
  description:
    "Подарок, который человек точно закончит: подборки по получателю и бюджету, " +
    "подарочный сертификат и фирменная упаковка с открыткой.",
  alternates: { canonical: "/gifts" },
};

export default function GiftsPage() {
  const safe = PRODUCTS.filter((p) => p.difficulty <= 3 && p.hours <= 15).slice(0, 8);

  return (
    <>
      <section className="relative">
        <div className="relative h-[38vh] min-h-[260px] overflow-hidden bg-[var(--color-ink-2)]">
          <Image src="/img/gifts/gifts-hero.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[rgb(20_17_16/0.6)] to-[rgb(20_17_16/0.3)]" />
        </div>
        <Container className="relative -mt-24 lg:-mt-28">
          <div className="max-w-[44rem]">
            <p className="caption text-[var(--accent)]">Подарки</p>
            <h1 className="h1 mt-3">Подарок, который закончат</h1>
            <p className="measure mt-5 text-[1.0625rem] leading-relaxed">
              Незаконченный набор работает против дарителя: он лежит в шкафу и напоминает
              о неудаче. Поэтому мы подбираем подарок не по картинке, а по человеку —
              и не ставим в подборки самое сложное.
            </p>
          </div>
        </Container>
      </section>

      <Container>
        <Breadcrumbs items={[{ title: "Подарки" }]} />
      </Container>

      <Container className="pb-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GIFT_COLLECTIONS.map((c) => {
            const n = giftProducts(c).length;
            return (
              <Link key={c.slug} href={`/gifts/${c.slug}`} className="card card-lift group overflow-hidden no-underline">
                <div className="relative aspect-[3/2] bg-[var(--color-canvas-2)]">
                  <Image src={c.cover} alt="" fill sizes="(max-width: 640px) 90vw, 30vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                </div>
                <div className="p-5">
                  <h2 className="h3 text-[1.0625rem] text-[var(--text)]">{c.title}</h2>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-[var(--text-muted)]">{c.lead}</p>
                  {n > 0 && <p className="mt-3 text-[0.75rem] text-[var(--text-muted)]">{n} наборов</p>}
                </div>
              </Link>
            );
          })}
        </div>

        <section className="mt-16">
          <SectionHead
            title="Беспроигрышные"
            lead="Сложность до трёх и не больше пятнадцати часов — такие доводят до конца почти все."
            href="/catalog?difficulty=1,2,3&hours=0-5,5-15"
            hrefLabel="Все подходящие"
          />
          <ProductGrid products={safe} />
        </section>

        <section className="mt-16 card p-6 lg:p-10">
          <h2 className="h2">Как выбрать, если сомневаетесь</h2>
          <ol className="mt-6 grid gap-6 lg:grid-cols-3">
            {[
              ["Вспомните, что он пересматривает", "А не что хвалит. Это разные списки, и дарить надо по первому."],
              ["Берите на ступень проще", "Подарок должен быть закончен. Сложность 2–3 и до 12 часов — безопасный коридор."],
              ["Сомневаетесь — сертификат", "Человек выберет сюжет сам, а повод останется вашим."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="tnum flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-[var(--accent-contrast)]">
                  {i + 1}
                </span>
                <span>
                  <span className="block font-semibold">{t}</span>
                  <span className="mt-1 block text-[0.9375rem] text-[var(--text-muted)]">{d}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="prose mt-8 text-[var(--text-muted)]">
            Подробнее — в статье{" "}
            <Link href="/blog/chto-darit-na-novyy-god">что дарить, если человек «всё себе покупает сам»</Link>.
            Доставка от {price(COMPANY.freeDeliveryFrom)} бесплатная,{" "}
            <Link href="/delivery">сроки и службы здесь</Link>.
          </p>
        </section>
      </Container>
    </>
  );
}
