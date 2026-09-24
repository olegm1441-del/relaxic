"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Check } from "lucide-react";
import { submitCustom } from "@/lib/actions/custom";

const TECHNIQUES = [
  ["PAINT_BY_NUMBERS", "Картина по номерам"],
  ["DIAMOND_MOSAIC", "Алмазная мозаика"],
  ["CROSS_STITCH", "Вышивка крестиком"],
  ["", "Подскажите, что лучше"],
];

export function CustomForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  if (sent) {
    return (
      <div className="card p-6 text-center lg:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-turquoise)]">
          <Check size={32} className="text-[var(--color-ink)]" strokeWidth={3} />
        </div>
        <h2 className="h3 mt-5">Заявка у нас</h2>
        <p className="measure-narrow mx-auto mt-3 text-[var(--text-muted)]">
          Посмотрим кадр и вернёмся с ответом: получится ли из него набор, в какой технике
          и сколько будет стоить. Обычно это один рабочий день.
        </p>
      </div>
    );
  }

  /** onSubmit, а не action: иначе React 19 чистит поля после каждого ответа */
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErrors({}); setFormError(null);
    start(async () => {
      const res = await submitCustom({
        name: String(fd.get("name") ?? ""),
        contact: String(fd.get("contact") ?? ""),
        technique: String(fd.get("technique") ?? "") as "",
        size: String(fd.get("size") ?? ""),
        comment: String(fd.get("comment") ?? ""),
      });
      if (res.ok) setSent(true);
      else { setErrors(res.errors); setFormError(res.message ?? null); }
    });
  }

  return (
    <form onSubmit={onSubmit} className="card p-5 lg:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label="Имя" required error={errors.name} autoComplete="name" />
        <Field name="contact" label="Телефон или почта" required error={errors.contact} placeholder="+7 900 000-00-00" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="technique" className="mb-1.5 block text-[0.8125rem] font-medium">Техника</label>
          <select id="technique" name="technique" className="field" defaultValue="">
            {TECHNIQUES.map(([v, t]) => <option key={t} value={v}>{t}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="size" className="mb-1.5 block text-[0.8125rem] font-medium">
            Размер <span className="font-normal text-[var(--text-muted)]">если знаете</span>
          </label>
          <input id="size" name="size" className="field" placeholder="40×50" />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="comment" className="mb-1.5 block text-[0.8125rem] font-medium">
          Что за кадр
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={4}
          className="field resize-y"
          placeholder="Ссылка на кадр, скриншот из игры или описание. Если фото — пришлём почту, куда его отправить."
        />
      </div>

      {formError && (
        <p className="mt-4 flex gap-2 rounded-[var(--radius-ui)] border border-[var(--color-danger)] p-3 text-[0.8125rem] text-[var(--color-danger)]">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {formError}
        </p>
      )}

      <button type="submit" className="btn btn-primary mt-6 w-full sm:w-auto" disabled={pending}>
        {pending ? "Отправляем…" : "Отправить заявку"}
      </button>
      <p className="mt-3 text-[0.75rem] text-[var(--text-muted)]">
        Отправляя форму, вы соглашаетесь на обработку персональных данных.
      </p>
    </form>
  );
}

function Field({
  name, label, error, required, ...rest
}: { name: string; label: string; error?: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-[0.8125rem] font-medium">
        {label}{required && <span className="ml-1 text-[var(--accent)]">*</span>}
      </label>
      <input
        id={name}
        name={name}
        className="field"
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${name}-err` : undefined}
        {...rest}
      />
      {error && (
        <p id={`${name}-err`} role="alert" className="mt-1.5 flex items-center gap-1.5 text-[0.8125rem] text-[var(--color-danger)]">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
