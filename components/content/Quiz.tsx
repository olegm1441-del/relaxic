"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { ProductGrid } from "@/components/catalog/ProductCard";
import type { Product } from "@/lib/catalog";

type Answers = { who?: string; time?: string; world?: string };

const STEPS = [
  {
    key: "who" as const,
    title: "Кому набор?",
    lead: "От этого зависит сложность и возрастная отметка — а не картинка.",
    options: [
      { value: "self", title: "Себе", note: "чтобы выключить голову вечером" },
      { value: "kid", title: "Ребёнку", note: "крупные детали, краски без запаха" },
      { value: "teen", title: "Подростку", note: "важнее вселенная, чем техника" },
      { value: "gift", title: "В подарок взрослому", note: "то, что точно закончат" },
    ],
  },
  {
    key: "time" as const,
    title: "Сколько вечеров готовы потратить?",
    lead: "Мы считаем в часах. Один вечер — это около двух часов работы.",
    options: [
      { value: "0-5", title: "Один вечер", note: "до 5 часов" },
      { value: "5-15", title: "Неделя по вечерам", note: "5–15 часов" },
      { value: "15-30", title: "Пару недель", note: "15–30 часов" },
      { value: "30+", title: "Хочу надолго", note: "от 30 часов" },
    ],
  },
  {
    key: "world" as const,
    title: "Какая вселенная ближе?",
    lead: "Если ничего не подходит — пропустите, подберём по остальным ответам.",
    options: [
      { value: "harry-potter", title: "Магия и замки" },
      { value: "game-of-thrones", title: "Тёмное фэнтези" },
      { value: "cyberpunk", title: "Неон и город" },
      { value: "anime", title: "Аниме" },
      { value: "studio-ghibli", title: "Тёплое и уютное" },
      { value: "star-wars", title: "Космос" },
      { value: "marvel", title: "Супергерои" },
      { value: "", title: "Не важно" },
    ],
  },
];

/** Правила подбора. Держим их здесь, а не в фильтрах: логика «кому» шире, чем один фасет. */
function pick(all: Product[], a: Answers): Product[] {
  let list = all;
  if (a.who === "kid") list = list.filter((p) => p.minAge <= 6 || p.difficulty <= 2);
  if (a.who === "teen") list = list.filter((p) => p.minAge <= 12);
  if (a.who === "gift") list = list.filter((p) => p.difficulty <= 3 && p.hours <= 15);
  if (a.time) {
    const [lo, hi] = a.time === "30+" ? [30, 999] : a.time.split("-").map(Number);
    list = list.filter((p) => p.hours >= lo && p.hours < hi);
  }
  const inWorld = a.world ? list.filter((p) => p.fandom === a.world) : [];
  // Если по вселенной пусто — не показываем пустоту, а достраиваем похожими
  const rest = list.filter((p) => !inWorld.includes(p));
  return [...inWorld, ...rest].slice(0, 6);
}

export function Quiz({ products }: { products: Product[] }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const done = step >= STEPS.length;
  const result = done ? pick(products, answers) : [];

  if (done) {
    const params = new URLSearchParams();
    if (answers.time) params.set("hours", answers.time);
    if (answers.world) params.set("fandom", answers.world);

    return (
      <div>
        <p className="caption text-[var(--text-muted)]">Готово</p>
        <h1 className="h1 mt-3">
          {result.length > 0 ? "Вот что подойдёт" : "Под такие условия пока ничего нет"}
        </h1>
        <p className="measure mt-4 text-[var(--text-muted)]">
          {result.length > 0
            ? "Отобрали по возрасту, сложности и времени — в этом порядке. Вселенная влияет на порядок, но не отсекает остальное."
            : "Снимем одно условие и попробуем ещё раз — или загляните в каталог целиком."}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setStep(0); setAnswers({}); }}>
            <ArrowLeft size={16} />
            Пройти заново
          </button>
          <Link href={`/catalog${params.toString() ? `?${params}` : ""}`} className="btn btn-secondary btn-sm">
            Открыть в каталоге с этими фильтрами
          </Link>
        </div>

        {result.length > 0 && (
          <div className="mt-10">
            <ProductGrid products={result} priorityCount={2} />
          </div>
        )}
      </div>
    );
  }

  const s = STEPS[step];

  return (
    <div>
      <div className="flex items-center gap-3">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`}
          />
        ))}
      </div>
      <p className="caption mt-5 text-[var(--text-muted)]">Шаг {step + 1} из {STEPS.length}</p>

      <h1 className="h1 mt-3">{s.title}</h1>
      <p className="measure mt-3 text-[var(--text-muted)]">{s.lead}</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {s.options.map((o) => (
          <button
            key={o.value + o.title}
            type="button"
            className="card card-lift p-5 text-left"
            onClick={() => {
              setAnswers((v) => ({ ...v, [s.key]: o.value }));
              setStep((n) => n + 1);
            }}
          >
            <span className="block font-semibold">{o.title}</span>
            {"note" in o && o.note && (
              <span className="mt-1 block text-[0.8125rem] text-[var(--text-muted)]">{o.note}</span>
            )}
          </button>
        ))}
      </div>

      {step > 0 && (
        <button type="button" className="btn btn-ghost btn-sm mt-6" onClick={() => setStep((n) => n - 1)}>
          <ArrowLeft size={16} />
          Назад
        </button>
      )}
    </div>
  );
}

export function QuizIntro() {
  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-blk)] bg-[var(--color-canvas-2)]">
      <Image src="/img/mood/mother-child.jpg" alt="" fill sizes="(max-width: 1024px) 100vw, 38vw" className="object-cover" />
    </div>
  );
}
