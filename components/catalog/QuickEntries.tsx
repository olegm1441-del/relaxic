import Link from "next/link";
import { ArrowRight, Baby, Clock, Gift, Mountain, Sparkles, Wand2 } from "lucide-react";
import { QUICK_ENTRIES, type QuickEntry } from "@/lib/catalog";
import { productsWord } from "@/lib/format";

/**
 * Быстрые входы: из задачи человека сразу в готовую выборку.
 *
 * Два вида. В каталоге это узкая полоса чипсов над фильтрами — там рядом уже
 * стоит панель фасетов, и крупные плитки спорили бы с ней за внимание.
 * На главной — плитки: у секции есть свой номер и заголовок, а ряд мелких
 * чипсов под ними читался как служебная строка, а не как вход в каталог.
 * На плитке видно, сколько наборов за ней стоит, — это решение до клика.
 */
const ICONS: Record<QuickEntry["icon"], typeof Clock> = {
  clock: Clock,
  sparkles: Sparkles,
  child: Baby,
  gift: Gift,
  mountain: Mountain,
  wand: Wand2,
};

export function QuickEntries({
  className = "", withHeading = true, variant = "chips",
}: {
  className?: string;
  /** На главной заголовок уже даёт SectionHead — второй был бы дублем */
  withHeading?: boolean;
  variant?: "chips" | "tiles";
}) {
  return (
    <nav aria-label="Быстрый подбор" className={className}>
      {withHeading && <h2 className="caption mb-3 text-[var(--text-muted)]">С чего начать</h2>}
      {variant === "tiles" ? <Tiles /> : <Chips />}
    </nav>
  );
}

function Chips() {
  return (
    <ul className="flex flex-wrap gap-2">
      {QUICK_ENTRIES.map((e) => (
        <li key={e.href}>
          <Link
            href={e.href}
            className={`group inline-flex items-baseline gap-2 rounded-[var(--radius-ui)] border px-3.5 py-2.5 text-sm no-underline transition-colors ${
              e.accent
                ? "border-[color-mix(in_oklab,var(--accent-2)_55%,transparent)] bg-[color-mix(in_oklab,var(--accent-2)_12%,transparent)] hover:bg-[color-mix(in_oklab,var(--accent-2)_22%,transparent)]"
                : "border-[var(--border)] hover:border-[var(--accent)] hover:bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]"
            }`}
          >
            <span className={`font-semibold ${e.accent ? "text-[var(--accent-2)]" : "text-[var(--text)]"}`}>
              {e.title}
            </span>
            <span className="text-[0.75rem] text-[var(--text-muted)]">{e.note}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Tiles() {
  return (
    <ul className="grid gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3">
      {QUICK_ENTRIES.map((e) => {
        const Icon = ICONS[e.icon];
        return (
          <li key={e.href}>
            <Link
              href={e.href}
              className={`card card-lift group flex h-full items-start gap-4 p-5 no-underline ${
                e.accent
                  ? "border-[color-mix(in_oklab,var(--accent-2)_55%,transparent)] bg-[color-mix(in_oklab,var(--accent-2)_10%,transparent)]"
                  : ""
              }`}
            >
              <span
                aria-hidden
                className={`grid size-10 shrink-0 place-items-center rounded-full ${
                  e.accent
                    ? "bg-[color-mix(in_oklab,var(--accent-2)_24%,transparent)] text-[var(--accent-2)]"
                    : "bg-[var(--surface-2)] text-[var(--text-muted)] group-hover:text-[var(--accent)]"
                }`}
              >
                <Icon size={19} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block font-semibold leading-snug ${e.accent ? "text-[var(--accent-2)]" : "text-[var(--text)]"}`}>
                  {e.title}
                </span>
                <span className="mt-1 block text-[0.8125rem] leading-snug text-[var(--text-muted)]">
                  {e.note}
                </span>
                {/* Цифра честная: она посчитана теми же фасетами, что уедут в ссылку */}
                <span className="mt-3.5 flex items-center gap-1.5 text-[0.8125rem] font-medium text-[var(--text)]">
                  {e.count === null ? "Открыть" : productsWord(e.count)}
                  <ArrowRight
                    size={14}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
