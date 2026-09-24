import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, Container, SectionHead } from "@/components/ui";
import { COMPANY } from "@/lib/company";
import { DELIVERY_COST } from "@/lib/delivery";
import { price } from "@/lib/format";

export const metadata: Metadata = {
  title: "Доставка и оплата",
  description:
    "СДЭК, Яндекс Доставка и Почта России по всей стране. " +
    `От ${price(COMPANY.freeDeliveryFrom)} — бесплатно. Оплата при подтверждении заказа.`,
  alternates: { canonical: "/delivery" },
};

const WAYS = [
  ["СДЭК, пункт выдачи", "2–5 дней", "По всей России, больше 3 000 пунктов"],
  ["Яндекс Доставка, курьер", "1–3 дня", "Крупные города, до двери"],
  ["Почта России", "5–14 дней", "Везде, включая небольшие посёлки"],
  ["Самовывоз", "на следующий день", `${COMPANY.city}, бесплатно`],
];

export default function DeliveryPage() {
  return (
    <Container className="pb-16">
      <Breadcrumbs items={[{ title: "Доставка и оплата" }]} />

      <header className="mb-10 lg:mb-14">
        <h1 className="h1">Доставка и оплата</h1>
        <p className="measure mt-4 text-[1.0625rem] text-[var(--text-muted)]">
          {COMPANY.deliveryZone}. Доставка {price(DELIVERY_COST)}, от{" "}
          {price(COMPANY.freeDeliveryFrom)} — бесплатно.
        </p>
      </header>

      <section className="mb-14">
        <SectionHead title="Как доставляем" />
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[560px] border-collapse text-[0.9375rem]">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th scope="col" className="py-3 text-left font-semibold">Способ</th>
                <th scope="col" className="py-3 text-left font-semibold">Срок</th>
                <th scope="col" className="py-3 text-left font-semibold">Где</th>
              </tr>
            </thead>
            <tbody>
              {WAYS.map(([w, d, g]) => (
                <tr key={w} className="border-b border-[var(--border)]">
                  <th scope="row" className="py-3 pr-4 text-left font-medium">{w}</th>
                  <td className="py-3 pr-4 text-[var(--text-muted)]">{d}</td>
                  <td className="py-3 text-[var(--text-muted)]">{g}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[0.8125rem] text-[var(--text-muted)]">
          Срок считается от подтверждения заказа, а не от оформления: мы сначала звоним.
        </p>
      </section>

      <section className="mb-14 grid gap-4 md:grid-cols-2">
        {[
          ["Упаковка", "Набор едет в жёсткой коробке: холст на подрамнике не гнётся, стразы не высыпаются. Подарочная упаковка с лентой и открыткой — бесплатно, отметьте в комментарии к заказу."],
          ["Оплата", "Сейчас сайт работает в демонстрационном режиме: деньги на сайте не списываются. Менеджер звонит, подтверждает состав и присылает ссылку на оплату либо принимает наличными при получении."],
          ["Если повредили в пути", "Вскрывайте посылку при курьере или в пункте выдачи. Повреждение фиксируется актом — мы отправляем замену за свой счёт, без разбирательств."],
          ["Возврат", "14 дней на возврат набора без объяснения причин, если не вскрыты пакеты с красками или стразами. Деньги возвращаем на карту в течение 10 дней."],
        ].map(([t, d]) => (
          <div key={t} className="card p-5">
            <h2 className="h3 text-[1.0625rem]">{t}</h2>
            <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-[var(--text-muted)]">{d}</p>
          </div>
        ))}
      </section>

      <section className="card p-6 lg:p-8">
        <h2 className="h3">Как добрать до бесплатной</h2>
        <p className="measure mt-3 text-[var(--text-muted)]">
          Порог {price(COMPANY.freeDeliveryFrom)} — это примерно три набора. Комплект одной вселенной
          выходит дешевле, чем те же три позиции по отдельности, и сразу закрывает доставку.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/fandom" className="btn btn-primary btn-sm">Посмотреть комплекты</Link>
          <Link href="/gifts" className="btn btn-secondary btn-sm">Подарочные подборки</Link>
        </div>
      </section>

      <p className="prose measure mt-10 text-[var(--text-muted)]">
        Остальное — в <Link href="/faq">вопросах и ответах</Link>, условия целиком — в{" "}
        <Link href="/legal/offer">публичной оферте</Link>. Не нашли ответ — звоните:{" "}
        <a href={COMPANY.phoneHref}>{COMPANY.phone}</a>.
      </p>
    </Container>
  );
}
