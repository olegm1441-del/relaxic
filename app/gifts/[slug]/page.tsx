import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, Brush, Container, Empty } from "@/components/ui";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { GIFT_COLLECTIONS, giftBySlug, giftProducts } from "@/lib/gifts";
import { COMPANY } from "@/lib/company";
import { price } from "@/lib/format";

export function generateStaticParams() {
  return GIFT_COLLECTIONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = giftBySlug(slug);
  if (!c) return {};
  return {
    title: `${c.title} — подарки Relaxic`,
    description: `${c.lead}. ${COMPANY.deliveryZone}, от ${price(COMPANY.freeDeliveryFrom)} бесплатно.`,
    alternates: { canonical: `/gifts/${c.slug}` },
    openGraph: { title: c.title, description: c.lead, images: [c.cover] },
  };
}

export default async function GiftCollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = giftBySlug(slug);
  if (!c) notFound();

  const products = giftProducts(c);
  const others = GIFT_COLLECTIONS.filter((x) => x.slug !== slug);

  return (
    <Container className="pb-16">
      <Breadcrumbs items={[{ href: "/gifts", title: "Подарки" }, { title: c.title }]} />

      <header className="mb-10 grid gap-8 lg:mb-14 lg:grid-cols-[1fr_minmax(0,42%)] lg:items-center lg:gap-12">
        <div>
          <p className="caption text-[var(--text-muted)]">Подарки</p>
          <h1 className="h1 mt-3">{c.title}</h1>
          <Brush className="mt-5" />
          <p className="measure mt-5 text-[1.0625rem] leading-relaxed text-[var(--text-muted)]">{c.body}</p>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-blk)] bg-[var(--color-canvas-2)]">
          <Image src={c.cover} alt="" fill priority sizes="(max-width: 1024px) 100vw, 42vw" className="object-cover" />
        </div>
      </header>

      {c.filter ? (
        products.length > 0 ? (
          <ProductGrid products={products} priorityCount={4} />
        ) : (
          <Empty title="Подборка пополняется" lead="Пока посмотрите весь каталог или пройдите подбор.">
            <Link href="/catalog" className="btn btn-primary btn-sm">В каталог</Link>
            <Link href="/quiz" className="btn btn-secondary btn-sm">Подобрать за 3 шага</Link>
          </Empty>
        )
      ) : (
        <div className="card p-6 lg:p-10">
          <h2 className="h2">Как это работает</h2>
          <ol className="mt-6 space-y-4">
            {(c.slug === "certificate"
              ? [
                  "Скажите номинал — любой, ограничений нет.",
                  "Пришлём сертификат письмом или привезём на плотной карточке.",
                  "Получатель выбирает набор сам, срок действия — год.",
                ]
              : [
                  "Отметьте «подарочная упаковка» в комментарии к заказу.",
                  "Соберём в фирменную коробку, перевяжем лентой.",
                  "Открытку напишем от вашего имени — текст пришлите в комментарии.",
                ]
            ).map((t, i) => (
              <li key={t} className="flex gap-4">
                <span className="tnum flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-[var(--accent-contrast)]">
                  {i + 1}
                </span>
                <span className="pt-1.5">{t}</span>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={COMPANY.phoneHref} className="btn btn-primary">Позвонить и оформить</a>
            <Link href="/contacts" className="btn btn-secondary">Написать нам</Link>
          </div>
        </div>
      )}

      <nav className="mt-16 border-t border-[var(--border)] pt-8">
        <h2 className="caption text-[var(--text-muted)]">Другие подборки</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {others.map((o) => (
            <Link key={o.slug} href={`/gifts/${o.slug}`} className="chip no-underline">{o.title}</Link>
          ))}
          <Link href="/gifts" className="chip no-underline">Все подарки</Link>
        </div>
      </nav>
    </Container>
  );
}
