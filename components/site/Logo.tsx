import Image from "next/image";
import Link from "next/link";

/**
 * Вордмарк Relaxic.
 *
 * Раньше X рисовался вектором — и выглядел двумя пластырями. В настоящем
 * знаке это сухие мазки кистью с видимой щетиной, повторить их кривыми нельзя.
 * Поэтому вордмарк вырезан из исходника: буквы перекрашены в Холст, мазки
 * сохранили свой цвет и фактуру, фон вычтен по насыщенности и темноте —
 * с полупрозрачными краями, иначе щетина превратилась бы в рваный контур.
 *
 * Два файла: выворот для тёмных поверхностей и Уголь для светлых
 * (корзина, чекаут) — Аметист на Холсте даёт 2,73:1 и не проходит AA.
 */
export function Logo({
  withTagline = false,
  surface = "dark",
  className = "",
  priority = false,
}: {
  withTagline?: boolean;
  surface?: "dark" | "light";
  className?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="Relaxic — на главную"
      className={`group inline-flex flex-col no-underline ${className}`}
    >
      <Image
        src={surface === "light" ? "/img/brand/wordmark-light.png" : "/img/brand/wordmark-dark.png"}
        alt="Relaxic"
        width={1053}
        height={250}
        priority={priority}
        sizes="(max-width: 380px) 118px, (max-width: 1024px) 140px, 168px"
        className="h-7 w-auto min-[380px]:h-8 lg:h-10"
      />
      {withTagline && (
        <span className="caption mt-2 text-[0.5625rem] text-[var(--color-fog)]">
          Соберите свою вселенную.
        </span>
      )}
    </Link>
  );
}
