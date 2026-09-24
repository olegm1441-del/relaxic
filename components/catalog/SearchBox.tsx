"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

export function SearchBox({ hints }: { hints: string[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [value, setValue] = useState(sp.get("q") ?? "");

  useEffect(() => { setValue(sp.get("q") ?? ""); }, [sp]);

  function submit(q: string) {
    router.replace(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : "/search", { scroll: false });
  }

  return (
    <div>
      <form
        role="search"
        onSubmit={(e) => { e.preventDefault(); submit(value); }}
        className="flex gap-2"
      >
        <label htmlFor="q" className="sr-only">Поиск по каталогу</label>
        <div className="relative flex-1">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            id="q"
            type="search"
            className="field pl-12"
            placeholder="Вселенная, сюжет или техника"
            value={value}
            autoFocus
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary">Найти</button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="py-2 text-[0.8125rem] text-[var(--text-muted)]">Часто ищут:</span>
        {hints.map((h) => (
          <button key={h} type="button" className="chip" onClick={() => { setValue(h); submit(h); }}>
            {h}
          </button>
        ))}
      </div>
    </div>
  );
}
