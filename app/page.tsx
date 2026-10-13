import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Gift, Package, Sparkles, Truck } from "lucide-react";
import { Brush, Container, SectionHead } from "@/components/ui";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { QuickEntries } from "@/components/catalog/QuickEntries";
import {
  ARTICLES, FANDOMS, PRODUCTS, TECHNIQUES, fandomCover, galleryItems, hits,
} from "@/lib/catalog";
import { COMPANY } from "@/lib/company";
import { price, productsWord } from "@/lib/format";

/**
 * Заголовок и описание главной названы товаром, а не образом.
 *
 * Спрос в поиске лежит на трёх словосочетаниях: «картины по номерам»
 * (160 тыс. показов в месяц), «алмазные мозаики» (146 тыс.) и «вышивка
 * крестиком» (56 тыс.). Под «соберите свою вселенную» не ищет никто.
 * Отдельная строка про «по фото» — это ещё 34 тыс. запросов, и у нас
 * под них есть страница.
 */
export const metadata: Metadata = {
  title: { absolute: "Картины по номерам, алмазные мозаики и вышивка крестиком — Relaxic" },
  description:
    "Наборы для творчества: картины по номерам на холсте и подрамнике, алмазные мозаики и " +
    "вышивка крестиком по кадрам из кино, сериалов, игр и аниме. Или своя картина по фото. " +
    "Доставка по России, от 5 000 ₽ бесплатно.",
  alternates: { canonical: "/" },
};

export default function Home() {
  const top = hits(8);
  const works = galleryItems(18).slice(0, 8);
  const articles = ARTICLES.slice(0, 3);

  return (
    <>
      {/* ── Первый экран ──
           Кадр — фон всей секции, а не отдельная плитка сверху. Раньше до
           1024px картинка занимала экран целиком, а оффер с кнопками уезжал
           под сгиб: человек открывал сайт и видел фотографию, больше ничего.
           Теперь текст лежит на кадре при любой ширине; от 1024px фотография
           отступает на правую половину и освобождает колонку под текст.
           Колонка живёт внутри container-x — заголовок встаёт на ту же
           вертикаль, что и заголовки секций ниже, а середина контейнера
           всегда совпадает с серединой экрана, поэтому шов с кадром ровный. */}
      <section className="relative isolate overflow-hidden border-b border-[var(--border)]">
        <div aria-hidden className="absolute inset-0 -z-10 lg:left-1/2">
          {/* Единственный файл первого экрана: заменить фон — положить сюда
              новый кадр под тем же именем, править код не нужно. */}
          <Image
            src="/img/hero/hero-main.jpg"
            alt=""
            fill
            priority
            quality={85}
            sizes="100vw"
            className="object-cover object-[56%_44%] lg:object-center"
          />
          {/* До 1024px текст лежит на кадре, поэтому гасим по диагонали:
              густо в левом верхнем углу, где текст, и почти прозрачно справа
              внизу — иначе фотография превращается в чёрное поле. Отдельным
              слоем гасим низ, чтобы секция без шва переходила в следующую. */}
          <div className="absolute inset-0 bg-[linear-gradient(104deg,rgb(20_17_16/0.95)_0%,rgb(20_17_16/0.90)_34%,rgb(20_17_16/0.62)_66%,rgb(20_17_16/0.36)_100%)] lg:hidden" />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,var(--bg)_0%,rgb(20_17_16/0)_32%)] lg:hidden" />
          <div className="absolute inset-0 hidden lg:block bg-[linear-gradient(to_right,var(--bg)_0%,rgb(20_17_16/0.62)_17%,rgb(20_17_16/0.14)_45%,transparent_66%)]" />
        </div>

        <Container>
          <div className="grid lg:grid-cols-2">
            {/* До 1024px колонка уже контейнера: длинная строка плохо читается,
                а правая треть остаётся под открытый кадр. */}
            <div className="relative flex min-h-[min(78svh,35rem)] max-w-[34rem] flex-col justify-center py-12 lg:min-h-[34rem] lg:max-w-none lg:py-24 lg:pr-12">
              {/* Надзаголовок держит обещание бренда, заголовок — называет товар.
                  Раньше первое, что видел человек, было «Соберите свою вселенную»:
                  красиво, но из него не понять, что здесь продают, и в поиске
                  по такой строке никто ничего не набирает. */}
              <p className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-[rgb(246_241_232/0.58)] lg:text-[0.8125rem]">
                Соберите свою вселенную
              </p>
              <h1 className="display mt-3 max-w-[17ch] text-[clamp(2.125rem,4.4vw,3.375rem)]">
                Картины по номерам, алмазные мозаики и вышивка крестиком
              </h1>
              <p className="measure mt-5 text-[1.0625rem] leading-relaxed text-[rgb(246_241_232/0.80)] lg:mt-6 lg:text-[1.1875rem]">
                Наборы на холсте и на подрамнике — по кадрам из кино, сериалов, игр
                и аниме. Или своя картина по фото: присылаете кадр, собираем набор
                с нуля. У каждого указаны сложность и время сборки в часах.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/catalog" className="btn btn-primary">Смотреть каталог</Link>
                <Link href="/quiz" className="btn btn-accent-2">Подобрать за 3 вопроса</Link>
              </div>
              {/* Развилка названа словами: две кнопки без подписи читаются
                  как два разных действия, а не как выбор одного из двух путей. */}
              <p className="mt-3.5 text-[0.8125rem] text-[rgb(246_241_232/0.64)]">
                Знаете вселенную — в каталог. Не знаете — три вопроса и 40 секунд.
              </p>
              <dl className="mt-8 grid grid-cols-3 gap-4 text-sm lg:mt-10">
                {[
                  [String(PRODUCTS.length), "наборов в трёх техниках"],
                  [String(FANDOMS.length), "вселенных"],
                  [price(COMPANY.freeDeliveryFrom), "и доставка по РФ бесплатна"],
                ].map(([n, t]) => (
                  <div key={t}>
                    <dt className="tnum text-[1.375rem] font-bold leading-none lg:text-[1.5rem]">{n}</dt>
                    <dd className="mt-1.5 text-[0.8125rem] leading-snug text-[rgb(246_241_232/0.64)] lg:text-sm">{t}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Хиты ── */}
      <section className="section">
        <Container>
          <SectionHead
            no="01"
            title="Берут чаще всего"
            lead="Наборы, которые заканчивают, а не убирают в шкаф на втором вечере."
            href="/catalog"
            hrefLabel="Весь каталог"
          />
          <ProductGrid products={top} />
        </Container>
      </section>

      {/* ── С чего начать ──
           Ориентация по задаче, а не по свойству товара. Стоит сразу после
           витрины: человек увидел наборы и спрашивает «а мне какой». */}
      <section className="section pt-0">
        <Container>
          <SectionHead
            no="02"
            title="С чего начать"
            lead="Люди приходят с задачей — занять вечер, подарить, дать ребёнку. Вот готовые выборки под каждую."
            href="/catalog"
            hrefLabel="Весь каталог"
          />
          <QuickEntries withHeading={false} variant="tiles" />
        </Container>
      </section>

      {/* ── Три техники ── */}
      <section className="section pt-0">
        <Container>
          <SectionHead
            no="03"
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
                    <span aria-hidden className="opacity-40">·</span>
                    <span>{t.forWhom.toLowerCase()}</span>
                  </p>
                  {/* Явное действие в каждой карточке: путь по технике должен
                      заканчиваться кнопкой, а не догадкой, что плитка кликабельна. */}
                  <span className="btn btn-card btn-sm mt-5 w-full">
                    Смотреть {t.many}
                    <ArrowRight size={15} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Своя картина по фото ──
           Третий по величине спрос в нише после самих техник: «картина
           по номерам по фото» — 10 тыс. показов в месяц, «алмазная мозаика
           по фото» — 9 тыс., и дальше по мелочи ещё столько же. Страница
           под это у нас есть, а с главной на неё не вело ничего. */}
      <section className="section pt-0">
        <Container>
          <div className="card grid items-center gap-8 overflow-hidden p-6 lg:grid-cols-[1fr_minmax(0,42%)] lg:gap-12 lg:p-10">
            <div>
              <p className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                04 · На заказ
              </p>
              <h2 className="h2 mt-3 max-w-[18ch]">Своя картина по фото</h2>
              <p className="measure mt-4 text-[1.0625rem] leading-relaxed text-[var(--text-muted)]">
                Нужного кадра нет в каталоге — пришлите свой. Сделаем из него картину
                по номерам, алмазную мозаику или вышивку крестиком: подойдёт постер,
                скриншот из игры, кадр из сериала или ваша фотография.
              </p>
              <p className="measure mt-3 text-[0.9375rem] leading-relaxed text-[var(--text-muted)]">
                Посмотрим кадр и честно скажем, выйдет ли из него набор. Посчитаем
                палитру, пришлём превью с разметкой, соберём коробку за 7–10 дней.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/custom" className="btn btn-primary">Прислать кадр</Link>
                <Link href="/how-it-works" className="btn btn-secondary">Чем отличаются техники</Link>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-blk)] bg-[var(--color-canvas-2)] lg:aspect-[4/5]">
              <Image
                src="/img/mood/workshop.jpg"
                alt="Мастерская Relaxic: по присланному кадру собирают набор"
                fill
                sizes="(max-width: 1024px) 90vw, 42vw"
                className="object-cover"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* ── Вселенные ── */}
      <section className="section pt-0">
        <Container>
          <SectionHead
            no="05"
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
              <Sparkles size={22} className="text-[var(--text-muted)]" />
              <span className="text-[0.9375rem] font-semibold text-[var(--text)]">Все вселенные</span>
              <span className="text-[0.75rem] text-[var(--text-muted)]">и наборы на заказ</span>
            </Link>
          </div>
        </Container>
      </section>

      {/* ── Доверие ── */}
      <section className="section pt-0">
        <Container>
          <SectionHead no="06" title="Почему у нас" lead="Четыре вещи, которых обычно не хватает, когда выбираешь набор." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [Clock, "Честное время", "Время сборки указано в часах. 18 часов — это неделя по два вечера, и мы так и пишем."],
              [Package, "Видно, что в коробке", "Состав с фотографией комплектации, плотность холста и тип страз — до покупки."],
              [Truck, "Доставка по РФ", `СДЭК, Яндекс и Почта. От ${price(COMPANY.freeDeliveryFrom)} — бесплатно.`],
              [Gift, "Подарок, который закончат", "Подбираем по человеку, а не по картинке: незаконченный набор работает против вас."],
            ].map(([Icon, title, text]) => {
              const I = Icon as typeof Clock;
              return (
                <div key={title as string} className="card p-5">
                  <I size={22} className="text-[var(--text-muted)]" />
                  <h3 className="mt-4 font-semibold">{title as string}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-[var(--text-muted)]">{text as string}</p>
                </div>
              );
            })}
          </div>
          {/* Блок обещаний должен вести туда, где видно, кто их даёт */}
          <p className="measure mt-6 text-[0.9375rem] text-[var(--text-muted)]">
            Как мы рисуем схемы и почему считаем время в часах —{" "}
            <Link href="/about" className="underline underline-offset-2">о компании</Link>.
          </p>
        </Container>
      </section>

      {/* ── Галерея ── */}
      <section className="section pt-0">
        <Container>
          <SectionHead
            no="07"
            title="Как это выглядит дома"
            lead="Работы покупателей. Без студийного света, как есть."
            href="/gallery"
            hrefLabel="Вся галерея"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {works.map((w, i) => (
              <Link
                key={i}
                href="/gallery"
                className="group relative aspect-square overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-canvas-2)] no-underline"
              >
                <Image
                  src={w.url}
                  alt={`Готовая работа покупателя дома, снято на телефон: ${w.author}`}
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
            no="08"
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

      {/* ── Частые запросы ──
           Перелинковка с текстом ссылки, который совпадает с тем, как люди
           ищут. Каждая ведёт на свою страницу — двух ссылок на один адрес
           здесь нет, иначе вес размазывается, а человек ходит по кругу.
           Фильтров, которые возвращают весь каталог целиком (размер лежит
           в карточке товара, а не в фасете), здесь тоже нет: такая страница
           была бы копией каталога. */}
      <section className="section pt-0">
        <Container>
          <SectionHead
            no="09"
            title="Короткие дороги"
            lead="То, за чем приходят чаще всего — без блужданий по фильтрам."
          />
          <ul className="flex flex-wrap gap-2.5">
            {[
              ["Картины по номерам на холсте", "/catalog/kartiny-po-nomeram"],
              ["Алмазные мозаики на холсте", "/catalog/almaznaya-mozaika"],
              ["Наборы для вышивки крестиком", "/catalog/vyshivka-krestikom"],
              ["Картина по номерам по фото", "/custom"],
              ["Картины по фильмам и сериалам", "/fandom"],
              ["Наборы для начинающих", "/catalog?difficulty=1,2"],
              ["Наборы на один-два вечера", "/catalog?hours=0-5,5-15"],
              ["Детям от 6 лет", "/catalog?age=6"],
              ["Набор в подарок", "/gifts"],
              ["Чем отличаются три техники", "/how-it-works"],
              ["Мозаика или картина по номерам", "/blog/mozaika-ili-nomera"],
            ].map(([title, href]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[0.9375rem] text-[var(--text)] no-underline transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  {title}
                </Link>
              </li>
            ))}
          </ul>
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
