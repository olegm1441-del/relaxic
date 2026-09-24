import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui";
import { PRODUCTS, TECHNIQUES } from "@/lib/catalog";
import { price } from "@/lib/format";

export default function NotFound() {
  const suggestions = PRODUCTS.filter((p) => p.isHit).slice(0, 3);

  return (
    <Container className="py-12 lg:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <div className="relative mx-auto aspect-[4/3] max-w-md overflow-hidden rounded-[var(--radius-blk)] bg-[var(--color-canvas-2)]">
          <Image src="/img/system/404.jpg" alt="" fill priority sizes="(max-width: 640px) 90vw, 448px" className="object-cover" />
        </div>

        <h1 className="h1 mt-10">Такой страницы нет</h1>
        <p className="measure-narrow mx-auto mt-4 text-[var(--text-muted)]">
          Возможно, адрес набран с опечаткой или набор уехал в архив.
          Вот куда можно пойти отсюда.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {TECHNIQUES.map((t) => (
            <Link key={t.slug} href={`/catalog/${t.slug}`} className="chip no-underline">{t.title}</Link>
          ))}
          <Link href="/fandom" className="chip no-underline">Вселенные</Link>
          <Link href="/quiz" className="chip no-underline">Подбор за 3 вопроса</Link>
          <Link href="/search" className="chip no-underline">Поиск</Link>
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-4xl">
        <h2 className="h3 text-center">Берут чаще всего</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {suggestions.map((p) => (
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
      </div>
    </Container>
  );
}
