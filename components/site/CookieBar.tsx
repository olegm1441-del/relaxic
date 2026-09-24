"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { recordConsent } from "@/lib/actions/consent";

const KEY = "relaxic-consent";
/** Полгода: спрашивать чаще — раздражать, реже — нарушать */
const TTL_DAYS = 180;

interface Saved { analytics: boolean; marketing: boolean; at: number; v: string }

const VERSION = "2026-09-1";

function read(): Saved | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Saved;
    if (s.v !== VERSION) return null;
    if (Date.now() - s.at > TTL_DAYS * 86400_000) return null;
    return s;
  } catch {
    // Приватный режим или заблокированные куки — ведём себя как без согласия
    return null;
  }
}

/** Событие, которым подвал просит показать панель снова */
const REOPEN = "relaxic:cookie-settings";

export function CookieBar() {
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [liftBy, setLiftBy] = useState(0);

  useEffect(() => {
    // 1,2 с: панель не должна встречать человека на входе
    const t = setTimeout(() => { if (!read()) setShow(true); }, 1200);
    const onReopen = () => { setShow(true); setExpanded(true); };
    window.addEventListener(REOPEN, onReopen);
    return () => { clearTimeout(t); window.removeEventListener(REOPEN, onReopen); };
  }, []);

  /**
   * На карточке товара снизу висит кнопка «В корзину», и панель cookie
   * ложилась прямо на неё: на первом визите главное действие страницы
   * было недоступно. Поднимаемся на высоту этой панели.
   */
  useEffect(() => {
    if (!show) return;
    const measure = () => {
      const bar = document.querySelector<HTMLElement>("[data-bottom-bar]");
      setLiftBy(bar && getComputedStyle(bar).display !== "none" ? bar.offsetHeight : 0);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [show]);

  function save(a: boolean, m: boolean) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ analytics: a, marketing: m, at: Date.now(), v: VERSION }));
    } catch { /* приватный режим — переживём */ }
    setShow(false);
    setExpanded(false);
    // Запись в базу не блокирует закрытие панели
    void recordConsent(a, m);
    if (a) window.dispatchEvent(new CustomEvent("relaxic:analytics-allowed"));
  }

  if (!show) return null;

  return (
    <div
      role="region"
      aria-label="Файлы cookie"
      // Обёртка растянута на всю ширину, и её прозрачные поля перехватывали
      // нажатия по липкой кнопке «В корзину». Клики ловит только сама карточка.
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4"
      style={{ paddingBottom: `calc(max(12px, env(safe-area-inset-bottom)) + ${liftBy}px)` }}
    >
      <div className="rise container-x">
        <div className="card pointer-events-auto mx-auto max-w-[1000px] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:p-5">
          <p className="measure text-sm leading-relaxed text-[var(--text)]">
            Мы используем cookie, чтобы сайт помнил корзину и мы понимали, что вам интересно.
            Подробнее — в{" "}
            <Link href="/legal/cookies" className="underline underline-offset-2">политике использования cookie</Link>.
          </p>

          {expanded && (
            <fieldset className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
              <legend className="sr-only">Категории cookie</legend>
              <Row
                title="Необходимые"
                lead="Корзина, выбранный размер, безопасность. Без них сайт не работает."
                checked
                disabled
              />
              <Row
                title="Аналитические"
                lead="Обезличенная статистика: какие страницы смотрят и где теряются."
                checked={analytics}
                onChange={setAnalytics}
              />
              <Row
                title="Маркетинговые"
                lead="Показ наших объявлений на других площадках."
                checked={marketing}
                onChange={setMarketing}
              />
            </fieldset>
          )}

          {/* Три кнопки визуально равнозначны: выделять «Принять все» — тёмный паттерн */}
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => save(false, false)}>
              Только необходимые
            </button>
            {expanded ? (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => save(analytics, marketing)}>
                Сохранить выбор
              </button>
            ) : (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setExpanded(true)}>
                Настроить
              </button>
            )}
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => save(true, true)}>
              Принять все
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  title, lead, checked, disabled, onChange,
}: {
  title: string;
  lead: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label className={`flex gap-3 ${disabled ? "opacity-60" : "cursor-pointer"}`}>
      <input
        type="checkbox"
        className="mt-1 h-5 w-5 shrink-0 accent-[var(--accent)]"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-[0.8125rem] text-[var(--text-muted)]">{lead}</span>
      </span>
    </label>
  );
}

/** Ссылка в подвале: изменить решение в любой момент */
export function CookieSettingsButton() {
  return (
    <button
      type="button"
      className="text-left text-[0.8125rem] text-[var(--color-fog)] underline underline-offset-2 transition-colors hover:text-[var(--color-canvas)]"
      onClick={() => window.dispatchEvent(new CustomEvent("relaxic:cookie-settings"))}
    >
      Настройки cookie
    </button>
  );
}
