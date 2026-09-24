import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs, Container, SectionHead } from "@/components/ui";
import { PRODUCTS, TECHNIQUES } from "@/lib/catalog";
import { HOWTO_SLUG } from "@/lib/howto";
import { price } from "@/lib/format";

export const metadata: Metadata = {
  title: "Как это работает — сравнение трёх техник",
  description:
    "Чем картины по номерам, алмазная мозаика и вышивка отличаются на самом деле: " +
    "что требуется от рук, от головы и от времени. Честное сравнение без «просто и сложно».",
  alternates: { canonical: "/how-it-works" },
};

const COMPARE: [string, string, string, string][] = [
  ["Что требуется", "Аккуратность руки", "Усидчивость", "Внимание и счёт"],
  ["Думать надо?", "Нет, номера совпадают", "Нет, страз садится сам", "Да, считать клетки"],
  ["Ошибка исправима", "Да, закрасить сверху", "Да, поддеть пинцетом", "Только распустить"],
  ["Результат", "Картина как живопись", "Светится гранями", "Вещь на десятилетия"],
  ["Первый набор", "Лучший выбор", "Тоже хорошо", "Если любите точность"],
  ["Освоить", "5 минут", "10 минут", "20 минут"],
];

export default function HowItWorksPage() {
  return (
    <Container className="pb-16">
      <Breadcrumbs items={[{ title: "Как это работает" }]} />

      <header className="mb-10 lg:mb-14">
        <h1 className="h1">Три техники — и чем они правда отличаются</h1>
        <p className="measure mt-5 text-[1.0625rem] leading-relaxed text-[var(--text-muted)]">
          Принято считать: по номерам — просто, мозаика — средне, вышивка — сложно.
          Это неверно. Требования у них разные по природе, и «сложность» тут ни при чём.
        </p>
      </header>

      <div className="mb-14 grid gap-5 lg:grid-cols-3">
        {TECHNIQUES.map((t) => (
          <Link key={t.slug} href={`/how-it-works/${HOWTO_SLUG[t.key]}`} className="card card-lift group overflow-hidden no-underline">
            <div className="relative aspect-[3/2] bg-[var(--color-canvas-2)]">
              <Image src={t.cover} alt={t.title} fill sizes="(max-width: 1024px) 90vw, 30vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
            </div>
            <div className="p-5">
              <h2 className="h3 text-[var(--text)]">{t.title}</h2>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-[var(--text-muted)]">{t.lead}</p>
              <p className="mt-4 text-[0.8125rem] text-[var(--text-muted)]">Разбор техники →</p>
            </div>
          </Link>
        ))}
      </div>

      <section>
        <SectionHead title="Сравнение в лоб" lead="Одна таблица вместо трёх статей." />
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[640px] border-collapse text-[0.9375rem]">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th scope="col" className="w-[24%] py-3 text-left font-semibold text-[var(--text-muted)]" />
                {TECHNIQUES.map((t) => (
                  <th key={t.slug} scope="col" className="py-3 text-left font-semibold">
                    <Link href={`/catalog/${t.slug}`} className="no-underline">{t.title}</Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([label, a, b, c]) => (
                <tr key={label} className="border-b border-[var(--border)]">
                  <th scope="row" className="py-3 pr-4 text-left font-medium text-[var(--text-muted)]">{label}</th>
                  <td className="py-3 pr-4">{a}</td>
                  <td className="py-3 pr-4">{b}</td>
                  <td className="py-3">{c}</td>
                </tr>
              ))}
              <tr>
                <th scope="row" className="py-3 pr-4 text-left font-medium text-[var(--text-muted)]">Наборов</th>
                {TECHNIQUES.map((t) => (
                  <td key={t.slug} className="tnum py-3 pr-4">
                    {PRODUCTS.filter((p) => p.technique === t.key).length}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="prose measure mt-14 text-[var(--text-muted)]">
        <h2 className="text-[var(--text)]">Что выбрать, если набор первый</h2>
        <p>
          Картину по номерам на три часа. Не потому что она «лучшая», а потому что риск
          минимальный: если не пойдёт — потеряете вечер и {price(80000)}, а не месяц и полторы тысячи.
        </p>
        <p>
          Дальше можно идти в любую сторону. Подробный разбор с ошибками новичков —{" "}
          <Link href="/blog/mozaika-ili-nomera">в статье</Link>, а если хочется просто получить
          ответ — <Link href="/quiz">пройдите подбор за три вопроса</Link>.
        </p>
      </section>
    </Container>
  );
}
