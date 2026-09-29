import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, Container } from "@/components/ui";
import { Quiz, QuizIntro } from "@/components/content/Quiz";
import { PRODUCTS } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Подбор набора за три вопроса",
  description:
    "Кому, на сколько вечеров и какая вселенная. Покажем 4–6 наборов, которые доведут до конца, — " +
    "вместо каталога из сотни позиций.",
  alternates: { canonical: "/quiz" },
};

export default function QuizPage() {
  return (
    <Container className="pb-16">
      <Breadcrumbs items={[{ title: "Подбор набора" }]} />
      <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,38%)] lg:gap-16">
        <Quiz products={PRODUCTS} />
        <div className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
          <QuizIntro />
        </div>
      </div>

      {/* Выходы из подбора. Стоят на странице всегда, а не только в результате:
          человек, которому вопросы не подошли, должен уйти вглубь сайта,
          а не в закрытую вкладку. */}
      <p className="measure mt-14 text-[0.9375rem] leading-relaxed text-[var(--text-muted)]">
        Не хочется отвечать на вопросы — откройте{" "}
        <Link href="/catalog" className="underline underline-offset-2">весь каталог</Link>,{" "}
        выберите{" "}
        <Link href="/fandom" className="underline underline-offset-2">по вселенной</Link>{" "}
        или сначала{" "}
        <Link href="/how-it-works" className="underline underline-offset-2">сравните три техники</Link>.{" "}
        Выбираете не себе — загляните в{" "}
        <Link href="/gifts" className="underline underline-offset-2">подарки</Link>.
      </p>
    </Container>
  );
}
