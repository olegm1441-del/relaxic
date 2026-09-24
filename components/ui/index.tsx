import Link from "next/link";
import type { ReactNode } from "react";
import { price as fmtPrice } from "@/lib/format";

/* ── Контейнер и секции ─────────────────────────────────────── */

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`container-x ${className}`}>{children}</div>;
}

export function SectionHead({
  no, title, lead, href, hrefLabel,
}: {
  no?: string;
  title: string;
  lead?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 lg:mb-12">
      <div>
        {no && <span className="paint-no block text-[var(--accent)]">№ {no}</span>}
        <h2 className="h2 mt-2">{title}</h2>
        {lead && <p className="measure mt-3 text-[var(--text-muted)]">{lead}</p>}
      </div>
      {href && (
        <Link href={href} className="nav-link shrink-0 text-sm font-semibold">
          {hrefLabel ?? "Смотреть все"} →
        </Link>
      )}
    </div>
  );
}

/* ── Бейджи ─────────────────────────────────────────────────── */

type BadgeTone = "hit" | "new" | "sale" | "plain";

const BADGE_TONE: Record<BadgeTone, string> = {
  // Охра на Угле — 10,29:1
  hit: "bg-[var(--color-ochre)] text-[var(--color-ink)]",
  new: "bg-[var(--color-turquoise)] text-[var(--color-ink)]",
  // Затемнённый сурик: белый на нём 5,15:1, а на обычном — 3,89:1 и провал AA
  sale: "bg-[var(--color-surik-deep)] text-white",
  plain: "bg-[var(--surface-2)] text-[var(--text-muted)]",
};

export function Badge({ tone = "plain", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-[4px] px-2 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.04em] ${BADGE_TONE[tone]}`}>
      {children}
    </span>
  );
}

/* ── Сложность: пять точек ──────────────────────────────────── */

export function Difficulty({ value, size = 7 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1" title={`Сложность ${value} из 5`}>
      <span className="sr-only">Сложность {value} из 5</span>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          aria-hidden
          style={{ width: size, height: size }}
          className={`rounded-full ${i <= value ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`}
        />
      ))}
    </span>
  );
}

/* ── Рейтинг звёздами ───────────────────────────────────────── */

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" fill="none">
          <path
            d="M10 1.6l2.47 5.2 5.53.74-4.05 3.94.99 5.62L10 14.4l-4.94 2.7.99-5.62L2 7.54l5.53-.74L10 1.6z"
            fill={i <= Math.round(value) ? "var(--color-ochre)" : "var(--border)"}
          />
        </svg>
      ))}
    </span>
  );
}

export function Rating({ value, count, href }: { value: number; count: number; href?: string }) {
  const body = (
    <span className="inline-flex items-center gap-2 text-sm">
      <Stars value={value} />
      <span className="tnum font-semibold">{value.toFixed(1)}</span>
      <span className="text-[var(--text-muted)]">· {count}</span>
    </span>
  );
  return href ? (
    <a href={href} className="nav-link">
      {body}
    </a>
  ) : (
    body
  );
}

/* ── Цена ───────────────────────────────────────────────────── */

export function Price({ value, old, size = "md" }: { value: number; old?: number | null; size?: "md" | "lg" }) {
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className={`tnum font-bold ${size === "lg" ? "text-[1.75rem]" : "text-[1.25rem]"}`}>
        {fmtPrice(value)}
      </span>
      {old && old > value && (
        <span className="tnum text-sm text-[var(--text-muted)] line-through">{fmtPrice(old)}</span>
      )}
    </span>
  );
}

/* ── Хлебные крошки ─────────────────────────────────────────── */

export interface Crumb { href?: string; title: string }

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Вы здесь" className="py-4">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-[var(--text-muted)]">
        <li>
          <Link href="/" className="nav-link">Главная</Link>
        </li>
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-2">
            <span aria-hidden className="opacity-50">/</span>
            {c.href && i < items.length - 1 ? (
              <Link href={c.href} className="nav-link">{c.title}</Link>
            ) : (
              <span className="text-[var(--text)]" aria-current="page">{c.title}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ── Пустое состояние ───────────────────────────────────────── */

export function Empty({ title, lead, children }: { title: string; lead?: string; children?: ReactNode }) {
  return (
    <div className="card mx-auto max-w-lg px-6 py-12 text-center">
      <h3 className="h3">{title}</h3>
      {lead && <p className="mt-3 text-[var(--text-muted)]">{lead}</p>}
      {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}

/* ── Разделитель-«мазок» ────────────────────────────────────── */

export function Brush({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`block h-[3px] w-14 rounded-full bg-[var(--accent)] ${className}`} />
  );
}
