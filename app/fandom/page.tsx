import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs, Container, SectionHead } from "@/components/ui";
import { FANDOMS, PRODUCTS, fandomCover } from "@/lib/catalog";
import { productsWord } from "@/lib/format";

export const metadata: Metadata = {
  title: "Вселенные — фильмы, сериалы, игры и аниме",
  description:
    "Все вселенные Relaxic: Гарри Поттер, Марвел, Игра престолов, Звёздные войны, " +
    "Киберпанк, аниме и ретро-игры. Выберите героя — техника уже неважна.",
  alternates: { canonical: "/fandom" },
};

const CATEGORY_TITLE: Record<string, string> = {
  FILM: "Кино", SERIES: "Сериалы", GAME: "Игры", CARTOON: "Мультфильмы", ANIME: "Аниме",
};

export default function FandomHub() {
  const byCategory = FANDOMS.reduce<Record<string, typeof FANDOMS>>((acc, f) => {
    (acc[f.category] ??= []).push(f);
    return acc;
  }, {});

  return (
    <Container className="pb-16">
      <Breadcrumbs items={[{ title: "Вселенные" }]} />

      <header className="mb-10 lg:mb-14">
        <h1 className="h1">Вселенные</h1>
        <p className="measure mt-4 text-[1.0625rem] text-[var(--text-muted)]">
          Обычно выбирают не технику, а героя. Здесь — от героя: откройте вселенную
          и посмотрите, в каком исполнении её можно собрать.{" "}
          <Link href="/catalog" className="underline underline-offset-2">Или начните с техники</Link>.
        </p>
      </header>

      {Object.entries(byCategory).map(([cat, list]) => (
        <section key={cat} className="mb-12 last:mb-0">
          <h2 className="caption mb-4 text-[var(--text-muted)]">{CATEGORY_TITLE[cat] ?? cat}</h2>
          <div className="grid gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3">
            {list.map((f) => {
              const n = PRODUCTS.filter((p) => p.fandom === f.slug).length;
              return (
                <Link
                  key={f.slug}
                  href={`/fandom/${f.slug}`}
                  className="card card-lift group relative overflow-hidden no-underline"
                >
                  <div className="relative aspect-[3/2] bg-[var(--color-canvas-2)]">
                    <Image
                      src={fandomCover(f.slug)}
                      alt={f.title}
                      fill
                      sizes="(max-width: 480px) 90vw, (max-width: 1024px) 45vw, 30vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgb(20_17_16/0.9)] via-[rgb(20_17_16/0.25)] to-transparent" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <h3 className="h3 text-[1.0625rem] text-[var(--color-canvas)]">{f.title}</h3>
                    <p className="mt-1 text-[0.8125rem] text-[color-mix(in_oklab,var(--color-canvas)_72%,transparent)]">
                      {f.tagline} · {productsWord(n)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      <section className="mt-16 border-t border-[var(--border)] pt-10">
        <SectionHead
          title="Не нашли свою вселенную?"
          lead="Мы делаем наборы на заказ по вашему кадру — от постера до скриншота из игры."
          href="/custom"
          hrefLabel="Заказать свою картину"
        />
      </section>
    </Container>
  );
}
