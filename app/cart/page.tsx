import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { CartPageView } from "@/components/cart/CartPageView";
import { PRODUCTS } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Корзина",
  robots: { index: false, follow: true },
};

export default function CartPage() {
  // Подборка «что добрать» — самые дешёвые наборы, чтобы дотянуть до бесплатной доставки
  const cheap = [...PRODUCTS].sort((a, b) => a.price - b.price).slice(0, 8);
  return (
    <div data-surface="light" className="bg-[var(--bg)] text-[var(--text)]">
      <Container className="py-8 lg:py-12">
        <CartPageView topUp={cheap} />
      </Container>
    </div>
  );
}
