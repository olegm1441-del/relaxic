"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

export interface FilterOption { value: string; title: string; count?: number }
export interface FilterGroup {
  param: string;
  title: string;
  options: FilterOption[];
  /** Показать поле поиска внутри группы — для вселенных, их много */
  searchable?: boolean;
}

/**
 * Два места на странице: панель со счётчиком и сортировкой — над сеткой,
 * сами фильтры — в колонке слева. Раньше и то и другое жило в колонке,
 * и выпадающий список сортировки не помещался в её 260 пикселей:
 * «Сначала популярные» обрезалось до «Сначала попул…».
 */
export function Filters({
  groups, sorts, total, hideParams = [], slot = "panel",
}: {
  groups: FilterGroup[];
  sorts: { key: string; title: string }[];
  total: number;
  /** Параметры, которые не показываем: на странице техники фильтр «техника» лишний */
  hideParams?: string[];
  slot?: "toolbar" | "panel";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);

  const visible = groups.filter((g) => !hideParams.includes(g.param));

  const selected = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const g of visible) m[g.param] = sp.get(g.param)?.split(",").filter(Boolean) ?? [];
    return m;
  }, [sp, visible]);

  const activeCount = Object.values(selected).reduce((a, v) => a + v.length, 0);

  function apply(next: URLSearchParams) {
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function toggle(param: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    const cur = selected[param] ?? [];
    const after = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    if (after.length) next.set(param, after.join(","));
    else next.delete(param);
    apply(next);
  }

  function setSort(key: string) {
    const next = new URLSearchParams(sp.toString());
    if (key === "popular") next.delete("sort");
    else next.set("sort", key);
    apply(next);
  }

  function reset() {
    const next = new URLSearchParams(sp.toString());
    for (const g of visible) next.delete(g.param);
    apply(next);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const body = (
    <div className="space-y-6">
      {visible.map((g) => (
        <Group key={g.param} group={g} selected={selected[g.param] ?? []} onToggle={(v) => toggle(g.param, v)} />
      ))}
      {activeCount > 0 && (
        <button type="button" className="btn btn-ghost btn-sm w-full" onClick={reset}>
          Сбросить фильтры
        </button>
      )}
    </div>
  );

  // Колонка с фильтрами: только группы, на десктопе
  if (slot === "panel") {
    return <div className="hidden lg:block">{body}</div>;
  }

  return (
    <>
      {/* Панель над сеткой: счётчик, сортировка и вход в мобильные фильтры */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p className="text-sm text-[var(--text-muted)]">
          <span className="tnum font-semibold text-[var(--text)]">{total}</span>{" "}
          {total === 1 ? "набор" : total % 10 >= 2 && total % 10 <= 4 && (total % 100 < 10 || total % 100 >= 20) ? "набора" : "наборов"}
        </p>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <label className="sr-only" htmlFor="sort">Сортировка</label>
          <select
            id="sort"
            className="field h-11 min-h-11 min-w-0 flex-1 py-0 pr-8 sm:max-w-[230px] sm:flex-none"
            value={sp.get("sort") ?? "popular"}
            onChange={(e) => setSort(e.target.value)}
          >
            {sorts.map((s) => (
              <option key={s.key} value={s.key}>{s.title}</option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-secondary btn-sm shrink-0 lg:hidden"
            onClick={() => setOpen(true)}
          >
            <SlidersHorizontal size={16} />
            Фильтры
            {activeCount > 0 && (
              <span className="tnum ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[0.6875rem] font-bold text-[var(--accent-contrast)]">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Мобильный — шторка снизу */}
      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Фильтры">
          <div className="absolute inset-0 bg-black/55" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-[var(--radius-blk)] border-t border-[var(--border)] bg-[var(--bg)] p-5"
               style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="h3 text-[1.125rem]">Фильтры</h2>
              <button type="button" className="btn-icon -mr-2" aria-label="Закрыть" onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
            </div>
            {body}
            <button type="button" className="btn btn-primary mt-6 w-full" onClick={() => setOpen(false)}>
              Показать {total}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Group({
  group, selected, onToggle,
}: {
  group: FilterGroup;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [q, setQ] = useState("");
  const options = group.searchable && q
    ? group.options.filter((o) => o.title.toLowerCase().includes(q.toLowerCase()))
    : group.options;

  return (
    <fieldset>
      <legend className="caption mb-3 text-[var(--text-muted)]">{group.title}</legend>
      {group.searchable && group.options.length > 6 && (
        <input
          type="search"
          className="field mb-3 h-11 min-h-11 py-0"
          placeholder="Найти вселенную"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label={`Поиск: ${group.title}`}
        />
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              className="chip"
              data-on={on}
              aria-pressed={on}
              onClick={() => onToggle(o.value)}
            >
              {o.title}
              {typeof o.count === "number" && (
                <span className="tnum opacity-60">{o.count}</span>
              )}
            </button>
          );
        })}
        {options.length === 0 && (
          <p className="text-sm text-[var(--text-muted)]">Ничего не нашлось</p>
        )}
      </div>
    </fieldset>
  );
}
