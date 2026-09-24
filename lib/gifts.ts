import { PRODUCTS, type Product } from "./catalog";

export interface GiftCollection {
  slug: string;
  title: string;
  lead: string;
  body: string;
  cover: string;
  /** null — подборка без товаров (сертификат, упаковка) */
  filter: ((p: Product) => boolean) | null;
}

/**
 * Подарочные подборки.
 *
 * Правило одно: подарок должен быть закончен. Незаконченный набор лежит
 * в шкафу и напоминает о неудаче, поэтому во всех подборках отсечены
 * сложность 5 и наборы длиннее 20 часов — кроме «для себя».
 */
export const GIFT_COLLECTIONS: GiftCollection[] = [
  {
    slug: "for-kids",
    title: "Детям",
    lead: "Крупные детали, мало цветов, краски без запаха",
    body:
      "Шестилетка бросает набор не от скуки, а когда путается в цветах. " +
      "Двенадцать оттенков — предел, после которого начинается злость, поэтому " +
      "в детской подборке только простые наборы с крупными полями.",
    cover: "/img/mood/mother-child.jpg",
    filter: (p) => p.minAge <= 6 && p.difficulty <= 2,
  },
  {
    slug: "for-her",
    title: "Ей",
    lead: "Тёплые палитры и работы, которые вешают на кухню",
    body:
      "Самый частый подарок маме по нашим заказам — «Деревня у моря». " +
      "Не потому что красивее остальных, а потому что в ней нет тёмных участков: " +
      "такую работу вешают на видное место, а не в кабинет.",
    cover: "/img/mood/evening-hands.jpg",
    filter: (p) => ["studio-ghibli", "harry-potter", "anime"].includes(p.fandom) && p.difficulty <= 4,
  },
  {
    slug: "for-him",
    title: "Ему",
    lead: "Тёмные палитры, техника и вызов",
    body:
      "Мужчины чаще выбирают не сюжет, а уровень. Здесь собрано то, где есть " +
      "с чем повозиться: много цветов, длинная работа, заметный результат.",
    cover: "/img/mood/man-evening.jpg",
    filter: (p) => ["cyberpunk", "game-of-thrones", "star-wars", "cult-cinema", "retro-games"].includes(p.fandom),
  },
  {
    slug: "under-2000",
    title: "До 2 000 ₽",
    lead: "Когда нужен хороший подарок без разговора о бюджете",
    body:
      "Весь наш коридор цен укладывается в эту сумму, и это осознанно: " +
      "набор — это подарок «на вечер», а не на годовщину. Здесь просто " +
      "всё, что точно не выйдет за две тысячи с доставкой.",
    cover: "/img/gifts/gift-packaging.jpg",
    filter: (p) => p.price <= 160000,
  },
  {
    slug: "certificate",
    title: "Подарочный сертификат",
    lead: "Когда точно не угадать — пусть выберет сам",
    body:
      "Сертификат — это не «не придумал, что подарить». Это способ подарить повод, " +
      "оставив выбор сюжета человеку: вселенная — вещь личная, и промахнуться в ней легко. " +
      "Номинал любой, срок — год, оформляется письмом или на плотной карточке.",
    cover: "/img/gifts/certificate.jpg",
    filter: null,
  },
  {
    slug: "packaging",
    title: "Подарочная упаковка",
    lead: "Плотная коробка, лента и открытка от руки",
    body:
      "Набор приезжает в фирменной коробке, перевязанной лентой, с открыткой — " +
      "текст напишем от вашего имени. Упаковка бесплатная: подарок не должен " +
      "выглядеть как посылка из пункта выдачи.",
    cover: "/img/gifts/gift-packaging.jpg",
    filter: null,
  },
];

export function giftBySlug(slug: string): GiftCollection | undefined {
  return GIFT_COLLECTIONS.find((c) => c.slug === slug);
}

export function giftProducts(c: GiftCollection): Product[] {
  if (!c.filter) return [];
  // Подарок должен быть закончен: пятёрки по сложности сюда не попадают
  return PRODUCTS.filter((p) => c.filter!(p) && p.difficulty <= 4).slice(0, 12);
}
