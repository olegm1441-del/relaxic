import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs, Brush, Container, SectionHead } from "@/components/ui";
import { COMPANY, LEGAL_LINE } from "@/lib/company";
import { FANDOMS, PRODUCTS } from "@/lib/catalog";
import { price } from "@/lib/format";

export const metadata: Metadata = {
  title: "О нас",
  description:
    "Relaxic — наборы для сборки по вселенным кино, сериалов и игр. " +
    "Почему мы пишем честное время сборки и не говорим слово «рукоделие».",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <Container className="pb-16">
      <Breadcrumbs items={[{ title: "О нас" }]} />

      <header className="mb-12 grid gap-8 lg:grid-cols-[1fr_minmax(0,44%)] lg:items-center lg:gap-12">
        <div>
          <h1 className="h1">Мы продаём не холст, а вечер</h1>
          <Brush className="mt-5" />
          <p className="measure mt-5 text-[1.0625rem] leading-relaxed text-[var(--text-muted)]">
            Relaxic делает наборы по кадрам из кино, сериалов и игр. Идея простая:
            человек перестаёт потреблять историю и начинает делать её руками.
          </p>
        </div>
        <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-blk)] bg-[var(--color-canvas-2)]">
          <Image src="/img/system/about-team.jpg" alt="" fill priority sizes="(max-width: 1024px) 100vw, 44vw" className="object-cover" />
        </div>
      </header>

      <section className="mb-14 grid gap-4 sm:grid-cols-3">
        {[
          [String(PRODUCTS.length), "наборов в каталоге"],
          [String(FANDOMS.length), "вселенных"],
          [String(COMPANY.foundedYear), "год начала работы"],
        ].map(([n, t]) => (
          <div key={t} className="card p-5">
            <p className="tnum text-[2rem] font-bold leading-none">{n}</p>
            <p className="mt-2 text-[var(--text-muted)]">{t}</p>
          </div>
        ))}
      </section>

      <section className="prose measure mb-14 text-[var(--text-muted)]">
        <h2 className="text-[var(--text)]">Почему мы пишем часы, а не «за вечер»</h2>
        <p>
          «Соберётся за вечер» — самая частая фраза в этой нише и самая бесполезная.
          Набор на восемнадцать часов «за вечер» не собирается ни у кого, а человек,
          который в это поверил, бросает на третий день и больше не возвращается.
        </p>
        <p>
          Поэтому у нас в карточке стоит время работы в часах и рядом перевод в вечера
          по два часа. Это отпугивает часть покупателей на входе — и мы считаем,
          что так правильно: незаконченный набор в шкафу дороже одной несостоявшейся покупки.
        </p>

        <h2 className="text-[var(--text)]">Почему не говорим «рукоделие»</h2>
        <p>
          Потому что это язык конкурентов, и он звучит как кружок при ДК. Мы говорим:
          вселенная, кадр, вечер, руки, свет. Человек покупает не хобби — он покупает
          способ побыть внутри истории дольше, чем длится серия.
        </p>

        <h2 className="text-[var(--text)]">Что мы обещаем</h2>
        <p>
          Честную сложность и время. Полный состав коробки с фотографией до покупки.
          Доставку по всей России и{" "}
          <Link href="/delivery">бесплатную от {price(COMPANY.freeDeliveryFrom)}</Link>. И живого человека
          на телефоне, а не форму обратной связи.
        </p>
      </section>

      <section className="mb-14">
        <SectionHead
          title="Как это выглядит у покупателей"
          href="/gallery"
          hrefLabel="Вся галерея"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {["work-01", "work-03", "work-06", "work-07"].map((w) => (
            <div key={w} className="relative aspect-square overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-canvas-2)]">
              <Image src={`/img/gallery/${w}.jpg`} alt="" fill sizes="(max-width: 640px) 45vw, 23vw" className="object-cover" />
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6 lg:p-8">
        <h2 className="h3">Реквизиты</h2>
        <dl className="mt-4 grid gap-x-8 gap-y-3 text-[0.9375rem] sm:grid-cols-2">
          {[
            ["Продавец", COMPANY.legalName],
            ["ИНН", COMPANY.inn],
            ["ОГРНИП", COMPANY.ogrnip],
            ["Регистрация", `${COMPANY.taxOffice}, ${COMPANY.registeredAt}`],
            ["Телефон", COMPANY.phone],
            ["Почта", COMPANY.email],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[var(--text-muted)]">{k}</dt>
              <dd className="mt-0.5 font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-[0.75rem] text-[var(--text-muted)]">{LEGAL_LINE}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/contacts" className="btn btn-secondary btn-sm">Контакты</Link>
          <Link href="/legal/offer" className="btn btn-secondary btn-sm">Публичная оферта</Link>
        </div>
      </section>
    </Container>
  );
}
