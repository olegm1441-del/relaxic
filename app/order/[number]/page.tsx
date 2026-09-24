import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";
import { Container } from "@/components/ui";
import { prisma } from "@/lib/db";
import { COMPANY } from "@/lib/company";
import { PRODUCTS } from "@/lib/catalog";
import { price } from "@/lib/format";

export const metadata: Metadata = {
  title: "Заказ принят",
  robots: { index: false, follow: false },
};

export default async function OrderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;

  const order = prisma
    ? await prisma.order
        .findUnique({ where: { number }, include: { items: true } })
        .catch(() => null)
    : null;

  // Что почитать, пока ждёте — и заодно исходящие ссылки со страницы-тупика
  const next = PRODUCTS.filter((p) => p.isHit).slice(0, 3);

  return (
    <Container className="py-12 lg:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <div className="paint-in mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-turquoise)]">
          <Check size={40} className="text-[var(--color-ink)]" strokeWidth={3} />
        </div>

        <h1 className="h1 mt-8">Заказ принят</h1>
        <p className="mt-4 text-[1.0625rem] text-[var(--text-muted)]">
          Номер <span className="tnum font-bold text-[var(--text)]">{number}</span>. Запишите или
          сфотографируйте — по нему мы найдём заказ быстрее всего.
        </p>

        <div className="card mt-8 p-6 text-left">
          <h2 className="h3 text-[1.125rem]">Что дальше</h2>
          <ol className="mt-4 space-y-4">
            {[
              ["Звонок", "Менеджер свяжется в течение рабочего дня: подтвердит состав, адрес и срок."],
              ["Оплата", "Обсудим при подтверждении. На сайте деньги не списываются."],
              ["Отправка", "Соберём и отдадим в службу доставки, трек-номер пришлём."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="tnum flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-[var(--accent-contrast)]">
                  {i + 1}
                </span>
                <span>
                  <span className="block font-semibold">{t}</span>
                  <span className="block text-[0.9375rem] text-[var(--text-muted)]">{d}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        {order && (
          <div className="card mt-4 p-6 text-left">
            <h2 className="h3 text-[1.125rem]">Состав заказа</h2>
            <ul className="mt-4 divide-y divide-[var(--border)]">
              {order.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4 py-2.5 text-[0.9375rem]">
                  <span>
                    {i.title}
                    <span className="text-[var(--text-muted)]"> · {i.size} см · {i.qty} шт.</span>
                  </span>
                  <span className="tnum shrink-0 font-semibold">{price(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-[var(--border)] pt-4 text-[0.9375rem]">
              <div className="flex justify-between">
                <dt className="text-[var(--text-muted)]">Доставка</dt>
                <dd className="tnum">{order.deliveryCost === 0 ? "бесплатно" : price(order.deliveryCost)}</dd>
              </div>
              <div className="flex justify-between text-[1.0625rem] font-bold">
                <dt>Итого</dt>
                <dd className="tnum">{price(order.total)}</dd>
              </div>
            </dl>
          </div>
        )}

        <p className="mt-8 text-[0.9375rem] text-[var(--text-muted)]">
          Что-то срочное — звоните:{" "}
          <a href={COMPANY.phoneHref} className="font-semibold text-[var(--text)] no-underline">
            {COMPANY.phone}
          </a>
        </p>
      </div>

      <section className="mt-16">
        <h2 className="h2 text-center">Пока ждёте</h2>
        <p className="mx-auto mt-3 max-w-[48ch] text-center text-[var(--text-muted)]">
          Эти наборы берут чаще всего вторыми. И{" "}
          <Link href="/blog/pochemu-ruki-uspokaivayut" className="underline underline-offset-2">
            статья о том, почему это работает
          </Link>.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {next.map((p) => (
            <Link key={p.slug} href={`/product/${p.slug}`} className="card card-lift overflow-hidden no-underline">
              <div className="relative aspect-[4/5] bg-[var(--color-canvas-2)]">
                <Image src={p.images[0].url} alt={p.title} fill sizes="(max-width: 640px) 90vw, 30vw" className="object-cover" />
              </div>
              <div className="p-4">
                <p className="font-semibold text-[var(--text)]">{p.title}</p>
                <p className="tnum mt-1 text-sm text-[var(--text-muted)]">{price(p.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Container>
  );
}
