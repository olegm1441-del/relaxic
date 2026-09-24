import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs, Brush, Container } from "@/components/ui";
import { CustomForm } from "@/components/content/CustomForm";
import { price } from "@/lib/format";

export const metadata: Metadata = {
  title: "Своя картина — набор по вашему кадру",
  description:
    "Сделаем набор по вашему кадру: постер, скриншот из игры, фотография. " +
    "Подберём технику, посчитаем палитру и соберём коробку.",
  alternates: { canonical: "/custom" },
};

export default function CustomPage() {
  return (
    <Container className="pb-16">
      <Breadcrumbs items={[{ title: "Своя картина" }]} />

      <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,46%)] lg:gap-16">
        <div>
          <h1 className="h1">Своя картина</h1>
          <Brush className="mt-5" />
          <p className="measure mt-5 text-[1.0625rem] leading-relaxed text-[var(--text-muted)]">
            Не нашли свою вселенную в каталоге — пришлите кадр. Подойдёт постер, скриншот
            из игры, кадр из сериала или ваша фотография.
          </p>

          <h2 className="h3 mt-10">Как это устроено</h2>
          <ol className="mt-5 space-y-5">
            {[
              ["Смотрим кадр", "Не из любого получается набор: нужен читаемый силуэт и различимые цветовые пятна. Скажем честно, если не выйдет."],
              ["Считаем палитру", "Сколько цветов нужно, чтобы кадр не развалился. От этого зависит сложность и цена."],
              ["Согласуем макет", "Пришлём превью с разметкой — как будет выглядеть холст с номерами."],
              ["Собираем коробку", "7–10 дней на производство, потом обычная доставка."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="tnum flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-[var(--accent-contrast)]">
                  {i + 1}
                </span>
                <span>
                  <span className="block font-semibold">{t}</span>
                  <span className="mt-1 block text-[0.9375rem] leading-relaxed text-[var(--text-muted)]">{d}</span>
                </span>
              </li>
            ))}
          </ol>

          <div className="card mt-8 p-5">
            <p className="text-[0.9375rem]">
              <span className="font-semibold">Сколько стоит.</span> От {price(180000)} — дороже каталожных,
              потому что палитру считаем под один кадр. Точную цену назовём после того, как посмотрим.
            </p>
          </div>

          <p className="prose measure mt-6 text-[var(--text-muted)]">
            Если просто хочется чего-то своего, но кадра нет — загляните в{" "}
            <Link href="/fandom">вселенные</Link> или{" "}
            <Link href="/quiz">пройдите подбор</Link>: часто нужное уже есть.
          </p>

          <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-[var(--radius-blk)] bg-[var(--color-canvas-2)]">
            <Image src="/img/mood/workshop.jpg" alt="" fill sizes="(max-width: 1024px) 100vw, 52vw" className="object-cover" />
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <CustomForm />
        </div>
      </div>
    </Container>
  );
}
