import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, Container } from "@/components/ui";
import { COMPANY, LEGAL_LINE } from "@/lib/company";

export const metadata: Metadata = {
  title: "Контакты",
  description: `Связаться с Relaxic: ${COMPANY.phone}, ${COMPANY.email}. Ежедневно с 9:00 до 21:00 МСК.`,
  alternates: { canonical: "/contacts" },
};

export default function ContactsPage() {
  return (
    <Container className="pb-16">
      <Breadcrumbs items={[{ title: "Контакты" }]} />

      <header className="mb-10">
        <h1 className="h1">Контакты</h1>
        <p className="measure mt-4 text-[var(--text-muted)]">
          На звонки и письма отвечает человек, а не бот. Ежедневно с 9:00 до 21:00 МСК.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <a href={COMPANY.phoneHref} className="card card-lift p-6 no-underline">
          <p className="caption text-[var(--text-muted)]">Телефон</p>
          <p className="mt-2 text-[1.375rem] font-bold text-[var(--text)]">{COMPANY.phone}</p>
          <p className="mt-2 text-[0.8125rem] text-[var(--text-muted)]">Заказ, статус доставки, замена</p>
        </a>
        <a href={`mailto:${COMPANY.email}`} className="card card-lift p-6 no-underline">
          <p className="caption text-[var(--text-muted)]">Почта</p>
          <p className="mt-2 text-[1.125rem] font-bold text-[var(--text)]">{COMPANY.email}</p>
          <p className="mt-2 text-[0.8125rem] text-[var(--text-muted)]">Сотрудничество, опт, вопросы по документам</p>
        </a>
        <Link href="/custom" className="card card-lift p-6 no-underline">
          <p className="caption text-[var(--text-muted)]">Свой набор</p>
          <p className="mt-2 text-[1.125rem] font-bold text-[var(--text)]">Заявка на свою картину</p>
          <p className="mt-2 text-[0.8125rem] text-[var(--text-muted)]">Пришлите кадр — посчитаем палитру</p>
        </Link>
      </div>

      <section className="card mt-10 p-6 lg:p-8">
        <h2 className="h3">Реквизиты продавца</h2>
        <dl className="mt-4 grid gap-x-8 gap-y-3 text-[0.9375rem] sm:grid-cols-2">
          {[
            ["Продавец", COMPANY.legalName],
            ["ИНН", COMPANY.inn],
            ["ОГРНИП", COMPANY.ogrnip],
            ["Налоговый орган", COMPANY.taxOffice],
            ["Дата регистрации", COMPANY.registeredAt],
            ["Город", COMPANY.city],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[var(--text-muted)]">{k}</dt>
              <dd className="mt-0.5 font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-[0.75rem] text-[var(--text-muted)]">{LEGAL_LINE}</p>
      </section>

      <p className="prose measure mt-10 text-[var(--text-muted)]">
        Частые вопросы разобраны <Link href="/faq">здесь</Link>, условия покупки — в{" "}
        <Link href="/legal/offer">оферте</Link>, что мы делаем с данными — в{" "}
        <Link href="/legal/privacy">политике конфиденциальности</Link>.
      </p>
    </Container>
  );
}
