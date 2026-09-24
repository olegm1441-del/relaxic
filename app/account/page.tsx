import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, Container } from "@/components/ui";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Личный кабинет",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <Container className="pb-16">
      <Breadcrumbs items={[{ title: "Личный кабинет" }]} />

      <div className="mx-auto max-w-2xl">
        <h1 className="h1">Личный кабинет</h1>
        <p className="measure mt-4 text-[1.0625rem] text-[var(--text-muted)]">
          Пока его нет — и это осознанно.
        </p>

        <div className="prose measure mt-8 text-[var(--text-muted)]">
          <p>
            Заказ оформляется без регистрации: имя, телефон, адрес. Кабинет нужен,
            когда у магазина есть повторяющиеся покупки, бонусы и история — у нас
            этого ещё нет, а форма регистрации на входе снижает конверсию
            и ничего не даёт взамен.
          </p>
          <p>
            Статус заказа быстрее узнать по номеру: позвоните{" "}
            <a href={COMPANY.phoneHref}>{COMPANY.phone}</a> или напишите на{" "}
            <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>. Трек-номер приходит
            на почту, если вы её указали.
          </p>
          <p>
            Кабинет появится вместе с приёмом оплаты на сайте — тогда в нём будет
            что показывать: история, повторный заказ в один клик и сохранённые адреса.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/catalog" className="btn btn-primary">В каталог</Link>
          <Link href="/contacts" className="btn btn-secondary">Контакты</Link>
        </div>
      </div>
    </Container>
  );
}
