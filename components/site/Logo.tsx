import Link from "next/link";

/**
 * Вордмарк Relaxic. X — два мазка кисти крест-накрест: тёплый поверх холодного,
 * как в логотипе (бренд-бук, раздел 2).
 *
 * Почему не картинка: исходник пришёл растром с пастельной подложкой, а шапка
 * тёмная. Вырезать фон из растра — терять фактуру мазка, а она здесь и есть знак.
 * Поэтому мазки нарисованы вектором, а буквы набраны фирменным Unbounded.
 */
export function Logo({ withTagline = false, className = "" }: { withTagline?: boolean; className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Relaxic — на главную"
      className={`group inline-flex flex-col leading-none no-underline ${className}`}
    >
      <span
        className="flex items-center text-[1.0625rem] font-extrabold tracking-[-0.04em] text-[var(--text)] min-[380px]:text-[1.25rem] sm:text-[1.5rem]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        RELA
        <BrushX />
        IC
      </span>
      {withTagline && (
        <span className="caption mt-1.5 text-[0.5625rem] text-[var(--text-muted)]">
          Соберите свою вселенную.
        </span>
      )}
    </Link>
  );
}

function BrushX() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="mx-[0.02em] inline-block h-[0.82em] w-[0.82em] translate-y-[0.02em]"
    >
      {/* Холодный мазок — лавандовый аметист, лежит снизу */}
      <path
        d="M4.6 4.2c1.1-.5 2.3-.2 3 .7l11.4 13.6c.8 1 .6 2.3-.4 3-.9.6-2.1.4-2.8-.5L4.3 7.3c-.7-.9-.6-2.2.3-3.1z"
        fill="#9D86D7"
      />
      {/* Тёплый мазок поверх — цвет из логотипа, живой оранжевый */}
      <path
        d="M19.3 4.3c-1.1-.6-2.4-.3-3.1.7L4.7 18.6c-.8 1-.6 2.3.4 3 1 .6 2.2.4 2.9-.6L19.6 7.4c.7-.9.6-2.3-.3-3.1z"
        fill="#CD542B"
      />
      {/* Светлый центр — там, где мазки пересекаются, краска сходится */}
      <circle cx="12" cy="12.4" r="1.5" fill="#FCF8F5" opacity=".9" />
    </svg>
  );
}
