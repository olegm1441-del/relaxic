"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, Search, ShoppingBag, X, ChevronDown } from "lucide-react";
import { Logo } from "./Logo";
import { useCart, useCartReady, itemsCount } from "@/components/cart/store";

export interface MenuTechnique {
  slug: string;
  title: string;
  fandoms: { slug: string; title: string }[];
}

export function Header({ techniques }: { techniques: MenuTechnique[] }) {
  const pathname = usePathname();
  const [openTech, setOpenTech] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [mobileTech, setMobileTech] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const lines = useCart((s) => s.lines);
  const ready = useCartReady();
  const setCartOpen = useCart((s) => s.setOpen);
  const count = ready ? itemsCount(lines) : 0;

  // Меню закрывается при переходе — иначе висит поверх новой страницы
  useEffect(() => {
    setOpenTech(null);
    setMobile(false);
  }, [pathname]);

  // Esc закрывает всё открытое, клик мимо — выпадающее меню
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpenTech(null); setMobile(false); }
    };
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenTech(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  // Пока открыт мобильный экран меню, страница под ним не прокручивается
  useEffect(() => {
    document.body.style.overflow = mobile ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobile]);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] backdrop-blur-md">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-[var(--accent-contrast)]">
        К содержанию
      </a>

      <div className="container-x flex h-16 items-center gap-1.5 sm:gap-3 xl:h-[72px] xl:gap-6">
        <button
          type="button"
          className="btn-icon -ml-2 xl:hidden"
          aria-label="Меню"
          aria-expanded={mobile}
          onClick={() => setMobile((v) => !v)}
        >
          {mobile ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Logo className="shrink-0" priority />

        {/* ── Десктопное меню: техники первым уровнем ── */}
        <nav ref={navRef} className="hidden flex-1 items-center gap-1 xl:flex" aria-label="Основное меню">
          {techniques.map((t) => (
            <div key={t.slug} className="relative">
              <button
                type="button"
                className="nav-link inline-flex h-11 items-center gap-1 rounded-[var(--radius-ui)] px-3 text-[0.9375rem] font-medium"
                aria-expanded={openTech === t.slug}
                aria-current={pathname.startsWith(`/catalog/${t.slug}`) ? "page" : undefined}
                onClick={() => setOpenTech((v) => (v === t.slug ? null : t.slug))}
                onMouseEnter={() => setOpenTech(t.slug)}
              >
                {t.title}
                <ChevronDown size={14} className={openTech === t.slug ? "rotate-180 transition-transform" : "transition-transform"} />
              </button>

              {openTech === t.slug && (
                <div
                  className="rise absolute left-0 top-full w-[min(92vw,420px)] rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[var(--shadow-card)]"
                  onMouseLeave={() => setOpenTech(null)}
                >
                  <Link
                    href={`/catalog/${t.slug}`}
                    className="block rounded-[var(--radius-ui)] px-3 py-2.5 text-[0.9375rem] font-semibold text-[var(--text)] no-underline hover:bg-[var(--surface-2)]"
                  >
                    Все {t.title.toLowerCase()} →
                  </Link>
                  <div className="my-2 h-px bg-[var(--border)]" />
                  <ul className="grid grid-cols-2 gap-0.5">
                    {t.fandoms.map((f) => (
                      <li key={f.slug}>
                        <Link
                          href={`/catalog/${t.slug}?fandom=${f.slug}`}
                          className="block rounded-[var(--radius-ui)] px-3 py-2 text-sm text-[var(--text-muted)] no-underline transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                        >
                          {f.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="my-2 h-px bg-[var(--border)]" />
                  <Link
                    href="/fandom"
                    className="block rounded-[var(--radius-ui)] px-3 py-2 text-sm text-[var(--accent)] no-underline hover:bg-[var(--surface-2)]"
                  >
                    Все вселенные
                  </Link>
                </div>
              )}
            </div>
          ))}

          {[
            ["/fandom", "Вселенные"],
            ["/blog", "Блог"],
            ["/gifts", "Подарки"],
          ].map(([href, title]) => (
            <Link
              key={href}
              href={href}
              className="nav-link inline-flex h-11 items-center rounded-[var(--radius-ui)] px-3 text-[0.9375rem] font-medium"
              aria-current={pathname.startsWith(href) ? "page" : undefined}
            >
              {title}
            </Link>
          ))}
        </nav>

        <div className="-mr-2 ml-auto flex items-center gap-0 sm:mr-0 sm:gap-1">
          <Link href="/search" className="btn-icon" aria-label="Поиск">
            <Search size={20} />
          </Link>
          <button
            type="button"
            className="btn-icon relative"
            aria-label={count > 0 ? `Корзина, ${count} шт.` : "Корзина"}
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag size={20} />
            {count > 0 && (
              <span className="tnum absolute right-1 top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[0.625rem] font-bold text-[var(--accent-contrast)]">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Мобильное меню ── */}
      {mobile && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-50 overflow-y-auto overscroll-contain border-t border-[var(--border)] bg-[var(--bg)] xl:hidden">
          <nav className="container-x py-4" aria-label="Мобильное меню">
            <ul className="space-y-1">
              {techniques.map((t) => (
                <li key={t.slug} className="border-b border-[var(--border)] pb-1">
                  <div className="flex items-center">
                    <Link
                      href={`/catalog/${t.slug}`}
                      className="flex-1 py-3.5 text-[1.0625rem] font-semibold text-[var(--text)] no-underline"
                    >
                      {t.title}
                    </Link>
                    <button
                      type="button"
                      className="btn-icon"
                      aria-label={`Вселенные: ${t.title}`}
                      aria-expanded={mobileTech === t.slug}
                      onClick={() => setMobileTech((v) => (v === t.slug ? null : t.slug))}
                    >
                      <ChevronDown size={18} className={mobileTech === t.slug ? "rotate-180 transition-transform" : "transition-transform"} />
                    </button>
                  </div>
                  {mobileTech === t.slug && (
                    <ul className="grid grid-cols-2 gap-1 pb-3">
                      {t.fandoms.map((f) => (
                        <li key={f.slug}>
                          <Link
                            href={`/catalog/${t.slug}?fandom=${f.slug}`}
                            className="block rounded-[var(--radius-ui)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-muted)] no-underline"
                          >
                            {f.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
              {[
                ["/fandom", "Все вселенные"],
                ["/gifts", "Подарки"],
                ["/blog", "Блог"],
                ["/quiz", "Подобрать за 3 шага"],
                ["/how-it-works", "Как это работает"],
                ["/gallery", "Работы покупателей"],
                ["/delivery", "Доставка и оплата"],
                ["/contacts", "Контакты"],
              ].map(([href, title]) => (
                <li key={href} className="border-b border-[var(--border)]">
                  <Link href={href} className="block py-3.5 text-[1.0625rem] font-semibold text-[var(--text)] no-underline">
                    {title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
