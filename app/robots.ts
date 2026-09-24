import type { MetadataRoute } from "next";
import { COMPANY } from "@/lib/company";

export default function robots(): MetadataRoute.Robots {
  const base = COMPANY.siteUrl.replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Служебное и транзакционное индексировать нечего.
        // Страницы с фасетами закрыты через generateMetadata: noindex, follow —
        // так ссылки на карточки всё равно обходятся.
        disallow: ["/cart", "/checkout", "/order/", "/account", "/search", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
