import type { Metadata } from "next";
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
    </Container>
  );
}
