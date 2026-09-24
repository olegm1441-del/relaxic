"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertCircle, Info } from "lucide-react";
import { useCart, useCartReady, itemsTotal, itemsCount, deliveryFor, toFreeDelivery } from "./store";
import { createOrder } from "@/lib/actions/order";
import { price } from "@/lib/format";
import { COMPANY } from "@/lib/company";

const DELIVERY = [
  { key: "cdek", title: "СДЭК, пункт выдачи", note: "2–5 дней" },
  { key: "yandex", title: "Яндекс Доставка, курьер", note: "1–3 дня, по крупным городам" },
  { key: "post", title: "Почта России", note: "5–14 дней, везде" },
  { key: "pickup", title: "Самовывоз, Казань", note: "бесплатно, на следующий день" },
];

export function CheckoutForm() {
  const router = useRouter();
  const { lines, clear } = useCart();
  const ready = useCartReady();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [delivery, setDelivery] = useState("cdek");
  const [pending, start] = useTransition();

  const total = itemsTotal(lines);
  const count = itemsCount(lines);
  const deliveryCost = delivery === "pickup" ? 0 : deliveryFor(total);
  const left = toFreeDelivery(total);

  if (!ready) return <div className="min-h-[50vh]" />;

  if (lines.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 text-center">
        <h1 className="h2">Корзина пуста</h1>
        <p className="text-[var(--text-muted)]">Нечего оформлять — сначала выберите набор.</p>
        <Link href="/catalog" className="btn btn-primary">В каталог</Link>
      </div>
    );
  }

  /**
   * Через onSubmit, а не через <form action={fn}>: React 19 после завершения
   * экшена сбрасывает неуправляемые поля. При ошибке валидации человек терял
   * всё, что ввёл, и должен был заполнять форму заново.
   */
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setErrors({});
    setFormError(null);
    start(async () => {
      const res = await createOrder({
        customerName: String(formData.get("customerName") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        email: String(formData.get("email") ?? ""),
        deliveryType: String(formData.get("deliveryType") ?? "cdek") as "cdek",
        address: String(formData.get("address") ?? ""),
        comment: String(formData.get("comment") ?? ""),
        consent: formData.get("consent") === "on",
        lines: lines.map((l) => ({ slug: l.slug, size: l.size, qty: l.qty })),
      });

      if (res.ok) {
        clear();
        router.push(`/order/${res.number}`);
      } else {
        setErrors(res.errors);
        setFormError(res.message ?? null);
        const first = document.querySelector<HTMLElement>('[aria-invalid="true"]');
        first?.focus();
        first?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-12">
      <div>
        <div className="mb-6 flex gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <Info size={18} className="mt-0.5 shrink-0 text-[var(--accent)]" />
          <p className="text-[0.875rem] leading-relaxed">
            <span className="font-semibold">Демонстрационный режим.</span> Оплата на сайте не проводится:
            заказ сохраняется, менеджер связывается по телефону и подтверждает состав и доставку.
          </p>
        </div>

        <h1 className="h1 text-[clamp(1.75rem,3.6vw,2.25rem)]">Оформление заказа</h1>

        <fieldset className="mt-8">
          <legend className="h3 text-[1.125rem]">Как с вами связаться</legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field name="customerName" label="Имя и фамилия" autoComplete="name" required error={errors.customerName} />
            <Field name="phone" label="Телефон" type="tel" autoComplete="tel" placeholder="+7 900 000-00-00" required error={errors.phone} />
            <div className="sm:col-span-2">
              <Field name="email" label="Почта, чтобы прислать трек-номер" type="email" autoComplete="email" hint="Необязательно" error={errors.email} />
            </div>
          </div>
        </fieldset>

        <fieldset className="mt-8">
          <legend className="h3 text-[1.125rem]">Доставка</legend>
          <div className="mt-4 space-y-2">
            {DELIVERY.map((d) => (
              <label
                key={d.key}
                className={`flex cursor-pointer items-start gap-3 rounded-[var(--radius-card)] border p-4 transition-colors ${
                  delivery === d.key ? "border-[var(--accent)] bg-[var(--surface-2)]" : "border-[var(--border)]"
                }`}
              >
                <input
                  type="radio"
                  name="deliveryType"
                  value={d.key}
                  checked={delivery === d.key}
                  onChange={() => setDelivery(d.key)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--accent)]"
                />
                <span className="flex-1">
                  <span className="block font-semibold">{d.title}</span>
                  <span className="block text-[0.8125rem] text-[var(--text-muted)]">{d.note}</span>
                </span>
                <span className="tnum shrink-0 text-sm font-semibold">
                  {d.key === "pickup" || total >= COMPANY.freeDeliveryFrom ? "бесплатно" : price(35000)}
                </span>
              </label>
            ))}
          </div>

          {delivery !== "pickup" && (
            <div className="mt-4">
              <Field
                name="address"
                label="Город, адрес или пункт выдачи"
                autoComplete="street-address"
                placeholder="Казань, ул. Баумана, 1"
                error={errors.address}
              />
            </div>
          )}
        </fieldset>

        <fieldset className="mt-8">
          <legend className="h3 text-[1.125rem]">Комментарий</legend>
          <div className="mt-4">
            <textarea
              name="comment"
              rows={3}
              className="field resize-y"
              placeholder="Например: позвоните после 18:00"
            />
          </div>
        </fieldset>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card p-5">
          <h2 className="h3 text-[1.125rem]">Ваш заказ</h2>

          <ul className="mt-4 space-y-3">
            {lines.map((l) => (
              <li key={l.key} className="flex gap-3">
                <Image src={l.image} alt="" width={48} height={60} className="h-[60px] w-12 shrink-0 rounded object-cover" sizes="48px" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.8125rem] font-semibold">{l.title}</p>
                  <p className="text-[0.75rem] text-[var(--text-muted)]">{l.size} см · {l.qty} шт.</p>
                </div>
                <span className="tnum shrink-0 text-[0.8125rem] font-semibold">{price(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2.5 border-t border-[var(--border)] pt-4 text-[0.9375rem]">
            <div className="flex justify-between">
              <dt className="text-[var(--text-muted)]">Товары, {count} шт.</dt>
              <dd className="tnum font-semibold">{price(total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--text-muted)]">Доставка</dt>
              <dd className="tnum font-semibold">
                {deliveryCost === 0 ? <span className="text-[var(--color-turquoise)]">бесплатно</span> : price(deliveryCost)}
              </dd>
            </div>
            {left > 0 && delivery !== "pickup" && (
              <p className="text-[0.75rem] text-[var(--text-muted)]">
                До бесплатной доставки не хватает {price(left)}
              </p>
            )}
          </dl>

          <div className="mt-4 flex items-baseline justify-between border-t border-[var(--border)] pt-4">
            <span className="font-semibold">Итого</span>
            <span className="tnum text-[1.5rem] font-bold">{price(total + deliveryCost)}</span>
          </div>

          {/* Чекбокс снят по умолчанию — иначе это не согласие */}
          <label className="mt-5 flex cursor-pointer gap-3">
            <input
              type="checkbox"
              name="consent"
              className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--accent)]"
              aria-invalid={errors.consent ? "true" : undefined}
            />
            <span className="text-[0.8125rem] leading-relaxed text-[var(--text-muted)]">
              Согласен на{" "}
              <Link href="/legal/privacy" className="underline underline-offset-2">обработку персональных данных</Link>{" "}
              и принимаю условия{" "}
              <Link href="/legal/offer" className="underline underline-offset-2">публичной оферты</Link>
            </span>
          </label>
          {errors.consent && <FieldError id="consent-error">{errors.consent}</FieldError>}

          {formError && (
            <p className="mt-4 flex gap-2 rounded-[var(--radius-ui)] border border-[var(--color-danger)] p-3 text-[0.8125rem] text-[var(--color-danger)]">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {formError}
            </p>
          )}

          <button type="submit" className="btn btn-primary mt-5 w-full" disabled={pending}>
            {pending ? "Оформляем…" : `Оформить на ${price(total + deliveryCost)}`}
          </button>

          <p className="mt-3 text-[0.75rem] leading-relaxed text-[var(--text-muted)]">
            Регистрация не нужна. Нажимая кнопку, вы отправляете заявку — деньги не списываются.
          </p>
        </div>
      </aside>
    </form>
  );
}

function Field({
  name, label, type = "text", hint, error, required, ...rest
}: {
  name: string;
  label: string;
  type?: string;
  hint?: string;
  error?: string;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-[0.8125rem] font-medium">
        {label}
        {required && <span className="ml-1 text-[var(--accent)]">*</span>}
        {hint && <span className="ml-2 font-normal text-[var(--text-muted)]">{hint}</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        className="field"
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        {...rest}
      />
      {error && <FieldError id={`${name}-error`}>{error}</FieldError>}
    </div>
  );
}

/** Ошибка текстом, а не только красной рамкой: цвет виден не всем */
function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-center gap-1.5 text-[0.8125rem] text-[var(--color-danger)]">
      <AlertCircle size={14} className="shrink-0" />
      {children}
    </p>
  );
}
