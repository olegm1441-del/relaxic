const { body, add, K } = require("./part4.js");
const fs = require("fs"), path = require("path");
const {
  Document, Packer, Paragraph, TextRun, ImageRun, PageBreak, BorderStyle, AlignmentType,
  Header, Footer, PageNumber, LevelFormat, Table, TableRow, TableCell, WidthType, ST,
  INK, SURIK_D, AMETH, TURQ, FOG, RULE, CANVAS, FONT, W,
  run, P, H1, H2, H3, bullets, T, Callout, code, spacer,
} = K;

const REPO = path.resolve(__dirname, "..", "..");

/* ══ 21 ПРИЁМКА ════════════════════════════════════════════ */
add(H1("Приёмка"));
add(H2("Критерии готовности"));
add(P("Работа принята, когда каждый пункт ниже воспроизведён: в настоящем браузере, на настоящей базе, с замером. «Выглядит работающим» приёмкой не считается."));
add(spacer(140));
add(T(["Что должно работать", "Чем подтверждается"], [
  ["Меню: техники первым уровнем, вселенные вторым, на всех разрешениях", "Прогон 320–1920, десктопное меню с 1280"],
  ["Каталог с фасетами, состояние фильтров живёт в адресе страницы", "Ссылка на отфильтрованную выдачу открывается в том же виде"],
  ["Корзина переживает перезагрузку страницы", "Проверено в браузере"],
  ["Полоса до 5 000 ₽ и подборка на недостающую сумму", "Проверено в браузере"],
  ["Заказ пишется в базу и уходит в Telegram; при недоступности Telegram не теряется", "Проверено на настоящей базе, с отключённым Telegram"],
  ["Цены пересчитываются на сервере", "То, что приходит с клиента, ценой не считается"],
  ["Всё демо-содержимое помечено в базе", "Отделяется одним запросом"],
  ["Журнал: видео в статье, отложенная загрузка, фасад для встраивания", "Проверено в браузере"],
  ["Панель cookie с настоящим отказом, аналитика не грузится без согласия", "Проверено в браузере"],
  ["Ни одного горизонтального вылета от 320 до 2560", "70 сочетаний страниц и ширин, ни одной ошибки консоли"],
  ["Первый экран: заголовок и главная кнопка видны без прокрутки", "Замеры на 390, 768, 900, 1440"],
  ["Контраст текста на фотографии не ниже нормы", "Посчитан по реальным пикселям, худший результат 6,24:1"],
  ["Развёртывание сообщает, какая сборка живёт на сайте", "Скрипт сверяет номер сборки и кричит при несовпадении"],
  ["Сайт развёрнут, отвечает и сообщает номер своей сборки", "Маршрут проверки живости отдаёт коммит, скрипт сверяет его с залитым"],
], [52, 48]));
add(spacer(220));
add(H2("Что требуется от заказчика"));
add(P("Эти пункты кодом не закрываются — без них часть функций работать не будет."));
add(spacer(140));
add(T(["Что", "Зачем", "Что будет без этого"], [
  ["Добавить бота в рабочий чат", "Заказы должны куда-то приходить", "Заказ сохраняется в базе, но уведомление уходить некуда"],
  ["Настоящий адрес почты", "Сейчас в подвале и в оферте стоит заглушка", "Письма клиентов уходят в никуда"],
  ["Договор эквайринга", "Приём оплаты на сайте", "Оплата только по счёту через менеджера"],
  ["Решение по /account", "Связать или убрать страницу-сироту", "Страница существует, но недостижима"],
  ["Ссылки на соцсети", "Подвал и карточки товара", "Блоки соцсетей не выводятся"],
], [26, 34, 40]));
add(spacer(180));
add(H3("Что требуется к началу реальных продаж"));
add(T(["Что", "Срок", "Комментарий"], [
  ["Перенос базы в РФ", "До приёма первых заказов с оплатой", "152-ФЗ. Меняется одна строка подключения, код не трогается"],
  ["Наращивание каталога", "Постоянно", "Сейчас 15 сюжетов и 31 позиция. Это данные, не разработка"],
  ["Короткие наборы", "Ближайший релиз", "До 5 часов в каталоге ровно один набор. «Занять вечер» — самый частый запрос новичка, а предложить почти нечего"],
  ["Замер Lighthouse на боевом адресе", "После подключения домена", "Цель ≥ 90 mobile. Пока не измерялся: замер на временном адресе Railway не показателен"],
  ["Перевод настройки Railway на новый формат", "До 1 декабря 2026", "Текущий формат объявлен устаревшим, работает до этой даты"],
], [26, 24, 50]));
add(spacer(200));
add(Callout("Граница ответственности", [
  "Со стороны разработки сайт готов, когда магазин работает целиком: каталог, подбор, карточка, корзина, оформление, уведомление. Заказ оформляется и доходит.",
  "Приём денег, рабочая почта и чат для уведомлений зависят не от кода. Это подключается за часы, но подключается заказчиком.",
]));

/* ══ СБОРКА ДОКУМЕНТА ══════════════════════════════════════ */
const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

const doc = new Document({
  creator: "Relaxic",
  title: "Relaxic — техническое задание на разработку сайта",
  description: "Интернет-магазин наборов для творчества по вселенным",
  styles: {
    default: {
      document: { run: { font: FONT, size: 28, color: INK }, paragraph: { spacing: { line: 300 } } },
    },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 36, bold: true, color: INK } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 32, bold: true, color: INK } },
    ],
  },
  numbering: {
    config: [
      { reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "—", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 340, hanging: 220 } }, run: { color: SURIK_D, font: FONT } } }] },
      { reference: "num", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 360, hanging: 240 } }, run: { color: SURIK_D, bold: true, font: FONT } } }] },
    ],
  },
  sections: [{
    properties: {
      titlePage: true,
      page: { margin: { top: 1134, right: 1134, bottom: 1134, left: 1134, header: 620, footer: 560 } },
    },
    headers: {
      first: new Header({ children: [new Paragraph({ children: [] })] }),
      default: new Header({ children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 0 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 6 } },
        children: [
          run("RELAXIC", { size: 16, bold: true, color: INK, characterSpacing: 30 }),
          run("   ·   Техническое задание на сайт", { size: 16, color: FOG }),
        ],
      })] }),
    },
    footers: {
      first: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [run("ИП Рыбаков О. Д.  ·  ИНН 166030217450  ·  Казань, 2026", { size: 16, color: FOG })],
      })] }),
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ font: FONT, size: 16, color: FOG, children: [PageNumber.CURRENT] })],
      })] }),
    },
    children: body,
  }],
});

const out = path.join(REPO, "docs", "Relaxic-TZ-sait.docx");
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log("готово:", out, Math.round(buf.length / 1024) + " КБ,", body.length, "элементов");
});
