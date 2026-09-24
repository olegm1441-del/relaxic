import Link from "next/link";
import { Logo } from "./Logo";
import { COMPANY, LEGAL_LINE } from "@/lib/company";
import { TECHNIQUES, FANDOMS, ARTICLE_CATEGORIES } from "@/lib/catalog";
import { CookieSettingsButton } from "./CookieBar";

/**
 * Подвал-карта — четвёртый слой перелинковки (06-SITEMAP.md).
 * Ссылки в тексте дают смысл, подвал даёт полноту: с любой страницы
 * достижим любой раздел, и поисковик видит весь граф.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--color-ink)] text-[var(--color-canvas)]">
      <div className="container-x py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_repeat(4,1fr)] lg:gap-8">
          <div>
            <Logo withTagline />
            <p className="measure-narrow mt-5 text-sm leading-relaxed text-[var(--color-fog)]">
              Наборы для сборки по вселенным кино, сериалов и игр. Картины по номерам,
              алмазные мозаики и вышивка — {COMPANY.deliveryZone.toLowerCase()}.
            </p>
            <a href={COMPANY.phoneHref} className="mt-5 inline-block text-lg font-semibold no-underline">
              {COMPANY.phone}
            </a>
            <p className="mt-1 text-sm text-[var(--color-fog)]">Ежедневно с 9:00 до 21:00 МСК</p>
          </div>

          <FooterCol title="Техники">
            {TECHNIQUES.map((t) => (
              <FooterLink key={t.slug} href={`/catalog/${t.slug}`}>{t.title}</FooterLink>
            ))}
            <FooterLink href="/catalog">Весь каталог</FooterLink>
            <FooterLink href="/quiz">Подобрать за 3 шага</FooterLink>
            <FooterLink href="/custom">Своя картина</FooterLink>
          </FooterCol>

          <FooterCol title="Вселенные">
            {FANDOMS.slice(0, 7).map((f) => (
              <FooterLink key={f.slug} href={`/fandom/${f.slug}`}>{f.title}</FooterLink>
            ))}
            <FooterLink href="/fandom">Все вселенные</FooterLink>
          </FooterCol>

          <FooterCol title="Блог и помощь">
            {ARTICLE_CATEGORIES.slice(0, 4).map((c) => (
              <FooterLink key={c.slug} href={`/blog/${c.slug}`}>{c.title}</FooterLink>
            ))}
            <FooterLink href="/how-it-works">Как это работает</FooterLink>
            <FooterLink href="/gallery">Работы покупателей</FooterLink>
            <FooterLink href="/reviews">Отзывы</FooterLink>
            <FooterLink href="/faq">Вопросы и ответы</FooterLink>
          </FooterCol>

          <FooterCol title="Компания">
            <FooterLink href="/about">О нас</FooterLink>
            <FooterLink href="/delivery">Доставка и оплата</FooterLink>
            <FooterLink href="/gifts">Подарки и сертификаты</FooterLink>
            <FooterLink href="/contacts">Контакты</FooterLink>
            <FooterLink href="/legal/offer">Публичная оферта</FooterLink>
            <FooterLink href="/legal/privacy">Политика конфиденциальности</FooterLink>
            <FooterLink href="/legal/cookies">Файлы cookie</FooterLink>
          </FooterCol>
        </div>

        <div className="mt-12 border-t border-[var(--color-ink-3)] pt-6">
          <div className="flex flex-col gap-3 text-[0.8125rem] text-[var(--color-fog)] lg:flex-row lg:items-center lg:justify-between">
            <p>
              © {year} Relaxic. Работаем с {COMPANY.foundedYear} года, {COMPANY.city}.
            </p>
            <CookieSettingsButton />
          </div>
          <p className="mt-3 text-[0.8125rem] leading-relaxed text-[var(--color-fog)]">
            {LEGAL_LINE}
          </p>
          <p className="mt-3 max-w-[90ch] text-[0.75rem] leading-relaxed text-[color-mix(in_oklab,var(--color-fog)_75%,transparent)]">
            Названия фильмов, сериалов и игр, а также имена персонажей принадлежат их
            правообладателям и используются для описания сюжета изображения.
            Сайт работает в демонстрационном режиме: оплата не проводится,
            менеджер связывается по каждому заказу.{" "}
            <Link href="/legal/offer" className="underline underline-offset-2">Условия</Link>.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="caption text-[var(--color-fog)]">{title}</h3>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-[var(--color-canvas)] no-underline opacity-75 transition-opacity hover:opacity-100"
      >
        {children}
      </Link>
    </li>
  );
}
