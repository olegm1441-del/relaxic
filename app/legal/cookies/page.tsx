import type { Metadata } from "next";
import Link from "next/link";
import { H2, LegalPage } from "@/components/content/Legal";
import { CookieSettingsButton } from "@/components/site/CookieBar";
import { POLICY_DATE, POLICY_VERSION } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Файлы cookie",
  description: "Какие cookie использует сайт, зачем они нужны и как отказаться.",
  alternates: { canonical: "/legal/cookies" },
};

const TABLE: [string, string, string, string][] = [
  ["relaxic-cart", "Необходимые", "Хранит корзину, чтобы она пережила перезагрузку", "Бессрочно, до очистки браузера"],
  ["relaxic-consent", "Необходимые", "Запоминает ваш выбор по cookie, чтобы не спрашивать снова", "6 месяцев"],
  ["_ym_*", "Аналитические", "Яндекс Метрика: обезличенная статистика посещений", "До 2 лет"],
];

export default function CookiesPage() {
  return (
    <LegalPage title="Файлы cookie" version={POLICY_VERSION} date={POLICY_DATE}>
      <p>
        Cookie — небольшие записи, которые сайт кладёт в браузер. Часть из них
        нужна, чтобы сайт работал; часть — чтобы мы понимали, что на нём происходит.
      </p>

      <H2>Что мы используем</H2>
      <div className="not-prose -mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[620px] border-collapse text-[0.875rem]">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th scope="col" className="py-3 text-left font-semibold text-[var(--text)]">Имя</th>
              <th scope="col" className="py-3 text-left font-semibold text-[var(--text)]">Категория</th>
              <th scope="col" className="py-3 text-left font-semibold text-[var(--text)]">Зачем</th>
              <th scope="col" className="py-3 text-left font-semibold text-[var(--text)]">Срок</th>
            </tr>
          </thead>
          <tbody>
            {TABLE.map(([n, c, p, t]) => (
              <tr key={n} className="border-b border-[var(--border)]">
                <th scope="row" className="py-3 pr-4 text-left font-medium text-[var(--text)]">{n}</th>
                <td className="py-3 pr-4">{c}</td>
                <td className="py-3 pr-4">{p}</td>
                <td className="py-3">{t}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2>Как это работает у нас</H2>
      <p>
        Необходимые записи ставятся всегда — без них не работает корзина.
        Аналитические и маркетинговые скрипты <strong>не загружаются вообще</strong>,
        пока вы не нажали «Принять все» или не включили соответствующую категорию
        в настройках. Это не «счётчик стоит, но не считает» — скрипта на странице
        физически нет.
      </p>

      <H2>Как отказаться</H2>
      <p>
        Нажмите «Только необходимые» в панели внизу или откройте настройки в любой момент:
      </p>
      <p className="not-prose mt-4">
        <span className="inline-block rounded-[var(--radius-ui)] border border-[var(--border)] px-4 py-2">
          <CookieSettingsButton />
        </span>
      </p>
      <p className="mt-6">
        Cookie также чистятся средствами браузера. Если удалить relaxic-cart, корзина опустеет —
        это единственное неудобство отказа.
      </p>

      <H2>Связанные документы</H2>
      <p>
        <Link href="/legal/privacy">Политика конфиденциальности</Link> — что мы делаем
        с персональными данными. <Link href="/legal/offer">Публичная оферта</Link> — условия покупки.
      </p>
    </LegalPage>
  );
}
