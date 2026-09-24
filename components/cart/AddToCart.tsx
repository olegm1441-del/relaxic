"use client";

import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { useCart, type CartLine } from "./store";

type Line = Omit<CartLine, "key" | "qty">;

/** Кнопка «В корзину». Подтверждение — сменой подписи на 1,4 с, без всплывашек. */
export function AddToCart({
  line, qty = 1, className = "btn btn-primary w-full", label = "В корзину",
}: {
  line: Line;
  qty?: number;
  className?: string;
  label?: string;
}) {
  const add = useCart((s) => s.add);
  const [done, setDone] = useState(false);

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        add(line, qty);
        setDone(true);
        setTimeout(() => setDone(false), 1400);
      }}
    >
      {done ? <Check size={18} /> : <ShoppingBag size={18} />}
      {done ? "В корзине" : label}
    </button>
  );
}
