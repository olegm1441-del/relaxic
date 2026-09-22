/**
 * Реквизиты и контакты. Всё в одном месте: подвал, контакты,
 * оферта и политика конфиденциальности читают отсюда.
 *
 * ЗАГЛУШКИ помечены TODO — заменить перед реальными продажами.
 * До замены юридические страницы недействительны.
 */

export const COMPANY = {
  brand: "Relaxic",
  slogan: "Соберите свою вселенную.",

  // TODO: заглушка — подставить настоящие реквизиты ООО
  legalName: 'ООО «РЕЛАКСИК»',
  inn: "0000000000",
  ogrn: "0000000000000",
  kpp: "000000000",
  legalAddress: "000000, Россия, г. ______, ул. ______, д. __, оф. __",
  director: "—",
  bankAccount: "00000000000000000000",
  bankName: "—",
  bik: "000000000",

  siteUrl: "https://relaxic-production.up.railway.app",

  // Настоящие данные
  phone: "+7 965 595-99-97",
  phoneHref: "tel:+79655959997",
  email: "hello@relaxic.ru",          // TODO: подтвердить почту

  // География
  geo: "Вся Россия",
  deliveryZone: "Доставка по всей России",
  freeDeliveryFrom: 500000,            // 5 000 ₽ в копейках

  social: {
    vk: null as string | null,
    telegram: null as string | null,
  },
} as const;

/** true, пока в реквизитах стоят заглушки */
export const HAS_PLACEHOLDER_LEGAL =
  COMPANY.inn === "0000000000" || COMPANY.ogrn === "0000000000000";
