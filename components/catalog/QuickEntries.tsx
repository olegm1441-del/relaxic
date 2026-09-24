import Link from "next/link";
import { QUICK_ENTRIES } from "@/lib/catalog";

/**
 * Полоса быстрых входов над фильтрами.
 *
 * Фасеты отвечают на вопрос «какой товар», но человек приходит с вопросом
 * «какая у меня задача»: занять вечер, подарить, дать ребёнку. Между этими
 * формулировками — лишний шаг, на котором часть людей уходит.
 * Полоса убирает этот шаг: один клик из задачи сразу в готовую выборку.
 */
export function QuickEntries({
  className = "", withHeading = true,
}: {
  className?: string;
  /** На главной заголовок уже даёт SectionHead — второй был бы дублем */
  withHeading?: boolean;
}) {
  return (
    <nav aria-label="Быстрый подбор" className={className}>
      {withHeading && <h2 className="caption mb-3 text-[var(--text-muted)]">С чего начать</h2>}
      <ul className="flex flex-wrap gap-2">
        {QUICK_ENTRIES.map((e) => (
          <li key={e.href}>
            <Link
              href={e.href}
              className="group inline-flex items-baseline gap-2 rounded-[var(--radius-ui)] border border-[var(--border)] px-3.5 py-2.5 text-sm no-underline transition-colors hover:border-[var(--accent)] hover:bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]"
            >
              <span className="font-semibold text-[var(--text)]">{e.title}</span>
              <span className="text-[0.75rem] text-[var(--text-muted)]">{e.note}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
