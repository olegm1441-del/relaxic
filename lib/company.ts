/**
 * Реквизиты и контакты. Всё в одном месте: подвал, контакты,
 * оферта и политика конфиденциальности читают отсюда.
 *
 * Данные настоящие — выписка из ЕГРН от 23.09.2026.
 * Персональные данные предпринимателя (дата и место рождения) на сайт
 * намеренно не выносятся: для оферты и 152-ФЗ достаточно ФИО, ИНН и ОГРНИП.
 */

export const COMPANY = {
  brand: "Relaxic",
  slogan: "Соберите свою вселенную.",

  legalName: "ИП Рыбаков Олег Дмитриевич",
  legalNameShort: "ИП Рыбаков О. Д.",
  inn: "166030217450",
  ogrnip: "326169000227070",
  taxOffice: "Межрайонная ИФНС России № 6 по Республике Татарстан",
  registeredAt: "23.09.2026",
  city: "Казань",
  foundedYear: 2026,

  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://relaxic-production.up.railway.app",

  phone: "+7 965 595-99-97",
  phoneHref: "tel:+79655959997",
  email: "hello@relaxic.ru",

  geo: "Вся Россия",
  deliveryZone: "Доставка по всей России",
  /** Порог бесплатной доставки, в копейках */
  freeDeliveryFrom: 500_000,

  social: {
    vk: null as string | null,
    telegram: null as string | null,
  },
} as const;

/** Строка для подвала и юридических страниц */
export const LEGAL_LINE =
  `${COMPANY.legalName} · ИНН ${COMPANY.inn} · ОГРНИП ${COMPANY.ogrnip}`;
