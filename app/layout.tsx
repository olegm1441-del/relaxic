import type { Metadata, Viewport } from "next";
import { Rubik, Onest } from "next/font/google";
import "./globals.css";

import { Header, type MenuTechnique } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CookieBar } from "@/components/site/CookieBar";
import { Analytics } from "@/components/site/Analytics";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { TECHNIQUES, fandomsForTechnique } from "@/lib/catalog";
import { COMPANY } from "@/lib/company";

/**
 * Rubik вместо Unbounded.
 *
 * Unbounded — широкий техно-гротеск, и с логотипом он не в родстве:
 * в знаке округлый геометрический шрифт со скруглёнными окончаниями штрихов.
 * Заголовки спорили с собственным логотипом в шапке. Rubik — та же порода:
 * геометрия со скруглёнными углами, рисованная кириллица.
 */
const display = Rubik({
  subsets: ["cyrillic", "cyrillic-ext", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display-src",
  display: "swap",
});

const onest = Onest({
  subsets: ["cyrillic", "cyrillic-ext", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-onest",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(COMPANY.siteUrl),
  title: {
    default: "Relaxic — наборы для сборки по вселенным кино, сериалов и игр",
    template: "%s · Relaxic",
  },
  description:
    "Картины по номерам, алмазные мозаики и вышивка крестиком по вселенным кино, сериалов и игр. " +
    "Сложность и время сборки указаны честно. Доставка по РФ, от 5 000 ₽ бесплатно.",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Relaxic",
    title: "Relaxic — соберите свою вселенную",
    description: "Наборы для сборки по вселенным кино, сериалов и игр.",
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#141110",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** В выпадающем меню — только вселенные, у которых есть наборы этой техники */
function buildMenu(): MenuTechnique[] {
  return TECHNIQUES.map((t) => ({
    slug: t.slug,
    title: t.title,
    fandoms: fandomsForTechnique(t.key)
      .slice(0, 8)
      .map((f) => ({ slug: f.slug, title: f.title })),
  }));
}

const organizationLd = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  name: COMPANY.brand,
  url: COMPANY.siteUrl,
  slogan: COMPANY.slogan,
  telephone: COMPANY.phone,
  email: COMPANY.email,
  foundingDate: String(COMPANY.foundedYear),
  areaServed: { "@type": "Country", name: "Россия" },
  address: { "@type": "PostalAddress", addressCountry: "RU", addressLocality: COMPANY.city },
  taxID: COMPANY.inn,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${display.variable} ${onest.variable}`}>
      <body className="flex min-h-[100dvh] flex-col">
        <Header techniques={buildMenu()} />
        <main id="main" className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
        <CookieBar />
        <Analytics id={process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
      </body>
    </html>
  );
}
