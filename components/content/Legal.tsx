import Link from "next/link";
import type { ReactNode } from "react";
import { Breadcrumbs, Container } from "@/components/ui";
import { COMPANY, LEGAL_LINE } from "@/lib/company";

export function LegalPage({
  title, version, date, children,
}: {
  title: string;
  version: string;
  date: string;
  children: ReactNode;
}) {
  return (
    <Container className="pb-16">
      <Breadcrumbs items={[{ title }]} />

      <article className="mx-auto max-w-[760px]">
        <h1 className="h1">{title}</h1>
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          Редакция {version} · действует с {date}
        </p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">{LEGAL_LINE}</p>

        <div className="prose measure mt-10 text-[var(--text-muted)]">{children}</div>

        <nav className="mt-12 flex flex-wrap gap-2 border-t border-[var(--border)] pt-6">
          {[
            ["/legal/offer", "Публичная оферта"],
            ["/legal/privacy", "Политика конфиденциальности"],
            ["/legal/cookies", "Файлы cookie"],
            ["/contacts", "Контакты"],
          ].map(([href, t]) => (
            <Link key={href} href={href} className="chip no-underline">{t}</Link>
          ))}
        </nav>

        <p className="mt-8 text-[0.8125rem] text-[var(--text-muted)]">
          Вопросы по документам:{" "}
          <a href={`mailto:${COMPANY.email}`} className="underline underline-offset-2">{COMPANY.email}</a>,{" "}
          <a href={COMPANY.phoneHref} className="underline underline-offset-2">{COMPANY.phone}</a>.
        </p>
      </article>
    </Container>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="text-[var(--text)]">{children}</h2>;
}
