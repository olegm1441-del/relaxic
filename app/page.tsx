import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Clock, Gift, Package, Sparkles, Truck } from "lucide-react";
import { Brush, Container, SectionHead } from "@/components/ui";
import { ProductGrid } from "@/components/catalog/ProductCard";
import {
  ARTICLES, FANDOMS, PRODUCTS, TECHNIQUES, fandomCover, galleryItems, hits,
} from "@/lib/catalog";
import { COMPANY } from "@/lib/company";
import { price, productsWord } from "@/lib/format";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  const top = hits(8);
  const works = galleryItems(18).slice(0, 8);
  const articles = ARTICLES.slice(0, 3);

  return (
    <>
      {/* ── Hero ──
           Не растянутое фото на весь экран, а композиция: слева слово,
           справа три обложки в родном разрешении. Так кадры остаются
           резкими на любом экране и сразу показывают, что мы продаём. */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 opacity-[0.10]">
          <Image src="/img/texture/canvas-grain.jpg" alt="" fill sizes="100vw" className="object-cover" />
        </div>
        <div
          aria-hidden
          className="absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full opacity-25 blur-[120px]"
          style={{ background: "radial-gradient(circle, var(--color-surik), transparent 70%)" }}
        />

        <Container className="relative grid items-center gap-12 py-14 lg:grid-cols-[1fr_minmax(0,52%)] lg:gap-16 lg:py-24">
          <div>
            <p className="caption text-[var(--accent)]">Наборы для сборки · {COMPANY.geo}</p>
            <h1 className="display mt-5 max-w-[14ch]">
              Соберите свою вселенную
            </h1>
            <p className="measure mt-6 text-[1.0625rem] leading-relaxed text-[var(--text-muted)] lg:text-[1.1875rem]">
              Картины по номерам, алмазные мозаики и вышивка по кадрам из кино, сериалов и игр.
              У каждого набора честно указаны сложность и время сборки — в часах, а не «за вечер».
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/catalog" className="btn btn-primary">Смотреть каталог</Link>
              <Link href="/quiz" className="btn btn-secondary">Подобрать за 3 вопроса</Link>
            </div>
            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4 text-sm">
              {[
                [String(PRODUCTS.length), "наборов в трёх техниках"],
                [String(FANDOMS.length), "вселенных"],
                [price(COMPANY.freeDeliveryFrom), "и доставка бесплатна"],
              ].map(([n, t]) => (
                <div key={t}>
                  <dt className="tnum text-[1.5rem] font-bold leading-none">{n}</dt>
                  <dd className="mt-1.5 text-[var(--text-muted)]">{t}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Одна крупная обложка и две поменьше. «Раскрашивание» — со сдвигом,
              как требует бренд-бук: приём работает, пока он дозирован. */}
          <div className="grid grid-cols-2 grid-rows-2 gap-3 lg:gap-4">
            {[
              { slug: "harry-potter", pad: "row-span-2" },
              { slug: "cyberpunk", pad: "" },
              { slug: "studio-ghibli", pad: "" },
            ].map(({ slug, pad }, i) => {
              const f = FANDOMS.find((x) => x.slug === slug)!;
              return (
                <Link
                  key={slug}
                  href={`/fandom/${slug}`}
                  className={`paint-in card card-lift group relative overflow-hidden no-underline ${pad} ${i === 0 ? "aspect-[3/5]" : "aspect-[4/3]"}`}
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <Image
                    src={fandomCover(slug)}
                    alt={f.title}
                    fill
                    priority={i === 0}
                    quality={85}
                    sizes="(max-width: 1024px) 46vw, 26vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-[rgb(20_17_16/0.9)] via-transparent to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 p-3 text-[0.75rem] font-semibold leading-tight text-[var(--color-canvas)] sm:text-[0.8125rem]">
                    {f.title}
                  </span>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── Три техники ── */}
      <section className="section">
        <Container>
          <SectionHead
            no="01"
            title="Три техники — три разных вечера"
            lead="Сначала выберите процесс: кисть, стразы или нить. Вселенная — следующим шагом."
            href="/how-it-works"
            hrefLabel="Чем отличаются"
          />
          <div className="grid gap-5 lg:grid-cols-3">
            {TECHNIQUES.map((t) => (
              <Link
                key={t.slug}
                href={`/catalog/${t.slug}`}
                className="card card-lift group overflow-hidden no-underline"
              >
                <div className="relative aspect-[3/2] bg-[var(--color-canvas-2)]">
                  <Image
                    src={t.cover}
                    alt={t.title}
                    fill
                    sizes="(max-width: 1024px) 90vw, 30vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="p-5">
                  <h3 className="h3 text-[var(--text)]">{t.title}</h3>
                  <p className="measure mt-2.5 text-[0.9375rem] leading-relaxed text-[var(--text-muted)]">
                    {t.tagline}
                  </p>
                  <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] text-[var(--text-muted)]">
                    <span className="tnum">{productsWord(PRODUCTS.filter((p) => p.technique === t.key).length)}</span>
                    <span>·</span>
                    <span>освоить за {t.learnMinutes} мин</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Вселенные ── */}
      <section className="section pt-0">
        <Container>
          <SectionHead
            no="02"
            title="Вселенные"
            lead="Люди выбирают не технику, а героя. Начните отсюда, если точно знаете, что любите."
            href="/fandom"
            hrefLabel="Все вселенные"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
            {FANDOMS.slice(0, 9).map((f) => (
              <Link
                key={f.slug}
                href={`/fandom/${f.slug}`}
                className="card card-lift group relative aspect-[3/4] overflow-hidden no-underline"
              >
                <Image
                  src={fandomCover(f.slug)}
                  alt={f.title}
                  fill
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 19vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgb(20_17_16/0.92)] via-[rgb(20_17_16/0.2)] to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3.5">
                  <h3 className="text-[0.9375rem] font-semibold leading-tight text-[var(--color-canvas)]">
                    {f.title}
                  </h3>
                </div>
              </Link>
            ))}
            <Link
              href="/fandom"
              className="card card-lift flex aspect-[3/4] flex-col items-center justify-center gap-2 p-4 text-center no-underline"
            >
              <Sparkles size={22} className="text-[var(--accent)]" />
              <span className="text-[0.9375rem] font-semibold text-[var(--text)]">Все вселенные</span>
              <span className="text-[0.75rem] text-[var(--text-muted)]">и наборы на заказ</span>
            </Link>
          </div>
        </Container>
      </section>

      {/* ── Квиз ── */}
      <section className="section pt-0">
        <Container>
          <div className="card overflow-hidden lg:flex lg:items-stretch">
            <div className="relative aspect-[16/10] bg-[var(--color-canvas-2)] lg:aspect-auto lg:w-[42%]">
              <Image src="/img/mood/evening-hands.jpg" alt="" fill sizes="(max-width: 1024px) 100vw, 42vw" className="object-cover" />
            </div>
            <div className="flex-1 p-6 lg:p-10">
              <p className="caption text-[var(--accent)]">№ 03 · 40 секунд</p>
              <h2 className="h2 mt-3">Не знаете, с чего начать?</h2>
              <p className="measure mt-4 text-[var(--text-muted)]">
                Три вопроса: кому, на сколько вечеров и какая вселенная.
                Покажем 4–6 наборов, которые точно доведут до конца, — а не «всё подряд».
              </p>
              <Link href="/quiz" className="btn btn-primary mt-7">Подобрать набор</Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Хиты ── */}
      <section className="section pt-0">
        <Container>
          <SectionHead
            no="04"
            title="Берут чаще всего"
            lead="Наборы, которые заканчивают, а не убирают в шкаф на втором вечере."
            href="/catalog"
            hrefLabel="Весь каталог"
          />
          <ProductGrid products={top} />
        </Container>
      </section>

      {/* ── Доверие ── */}
      <section className="section pt-0">
        <Container>
          <SectionHead no="05" title="Почему у нас" lead="Четыре вещи, которых обычно не хватает, когда выбираешь набор." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [Clock, "Честное время", "Не «за вечер», а в часах. 18 часов — это неделя по два вечера, и мы так и пишем."],
              [Package, "Видно, что в коробке", "Состав с фотографией комплектации, плотность холста и тип страз — до покупки."],
              [Truck, "Доставка по всей России", `СДЭК, Яндекс и Почта. От ${price(COMPANY.freeDeliveryFrom)} — бесплатно.`],
              [Gift, "Подарок, который закончат", "Подбираем по человеку, а не по картинке: незаконченный набор работает против вас."],
            ].map(([Icon, title, text]) => {
              const I = Icon as typeof Clock;
              return (
                <div key={title as string} className="card p-5">
                  <I size={22} className="text-[var(--accent)]" />
                  <h3 className="mt-4 font-semibold">{title as string}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-[var(--text-muted)]">{text as string}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── Галерея ── */}
      <section className="section pt-0">
        <Container>
          <SectionHead
            no="06"
            title="Как это выглядит дома"
            lead="Работы покупателей. Без студийного света, как есть."
            href="/gallery"
            hrefLabel="Вся галерея"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {works.map((w, i) => (
              <Link
                key={i}
                href={w.productSlug ? `/product/${w.productSlug}` : "/gallery"}
                className="group relative aspect-square overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-canvas-2)] no-underline"
              >
                <Image
                  src={w.url}
                  alt={`Работа покупателя: ${w.caption}`}
                  fill
                  sizes="(max-width: 640px) 45vw, 23vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgb(20_17_16/0.85)] to-transparent p-3 text-[0.75rem] text-[var(--color-canvas)] opacity-0 transition-opacity group-hover:opacity-100">
                  {w.author}
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Блог ── */}
      <section className="section pt-0">
        <Container>
          <SectionHead
            no="07"
            title="Читать перед покупкой"
            lead="Разборы техник, истории покупателей и изнанка производства."
            href="/blog"
            hrefLabel="Весь блог"
          />
          <div className="grid gap-5 lg:grid-cols-3">
            {articles.map((a) => (
              <Link key={a.slug} href={`/blog/${a.slug}`} className="card card-lift group overflow-hidden no-underline">
                <div className="relative aspect-[16/10] bg-[var(--color-canvas-2)]">
                  <Image src={a.cover} alt="" fill sizes="(max-width: 1024px) 90vw, 30vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                </div>
                <div className="p-5">
                  <h3 className="text-[1.0625rem] font-semibold leading-snug text-[var(--text)]">{a.title}</h3>
                  <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-[var(--text-muted)]">{a.excerpt}</p>
                  <p className="mt-4 text-[0.75rem] text-[var(--text-muted)]">{a.readMinutes} мин чтения</p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Финальный призыв ── */}
      <section className="section pt-0">
        <Container>
          <div className="card relative overflow-hidden p-8 text-center lg:p-14">
            <div className="absolute inset-0 opacity-[0.14]">
              <Image src="/img/texture/canvas-grain.jpg" alt="" fill sizes="100vw" className="object-cover" />
            </div>
            <div className="relative">
              <Brush className="mx-auto" />
              <h2 className="h2 mx-auto mt-6 max-w-[20ch]">Вечер, в котором вы делаете историю, а не смотрите её</h2>
              <p className="mx-auto measure-narrow mt-5 text-[var(--text-muted)]">
                Начните с небольшого набора на три часа. Если не пойдёт — потеряете вечер,
                а не месяц.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/catalog?hours=0-5" className="btn btn-primary">Наборы на один вечер</Link>
                <Link href="/gifts" className="btn btn-secondary">Выбрать в подарок</Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
