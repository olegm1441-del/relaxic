import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { CheckoutForm } from "@/components/cart/CheckoutForm";

export const metadata: Metadata = {
  title: "Оформление заказа",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div data-surface="light" className="bg-[var(--bg)] text-[var(--text)]">
      <Container className="py-8 lg:py-12">
        <CheckoutForm />
      </Container>
    </div>
  );
}
