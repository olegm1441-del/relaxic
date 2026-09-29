/** Оформление документа Relaxic: палитра бренд-бука на белой бумаге. */
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType: ST,
  PageBreak, Header, Footer, PageNumber, LevelFormat,
} = require("docx");

const INK = "141110", SURIK_D = "CE3114", AMETH = "6B46C4", TURQ = "0E7A6A",
      FOG = "6E655D", RULE = "DDD4C6", CANVAS = "F6F1E8";
const FONT = "Arial", W = 9638;

const run = (t, o = {}) => new TextRun({ text: t, font: FONT, ...o });

function P(text, o = {}) {
  const { size = 20, color = INK, bold = false, italics = false, align,
          before = 0, after = 130, line = 300, indent } = o;
  return new Paragraph({
    alignment: align, spacing: { before, after, line }, indent,
    children: Array.isArray(text) ? text : [run(text, { size, color, bold, italics })],
  });
}

const state = { no: 0 };
function H1(title, o = {}) {
  state.no += 1;
  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      keepNext: true, keepLines: true,
      spacing: { before: o.first ? 0 : 540, after: 30 },
      children: [
        run(String(state.no).padStart(2, "0") + "   ", { size: 28, bold: true, color: SURIK_D }),
        run(title.toUpperCase(), { size: 28, bold: true, color: INK, characterSpacing: 12 }),
      ],
    }),
    new Paragraph({
      keepNext: true,
      spacing: { before: 0, after: 220 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: SURIK_D, space: 1 } },
      children: [run("", { size: 2 })],
    }),
  ];
}
const H2 = (t) => new Paragraph({
  heading: HeadingLevel.HEADING_2, keepNext: true, keepLines: true,
  spacing: { before: 320, after: 120 },
  children: [run(t, { size: 23, bold: true, color: INK })],
});
const H3 = (t) => new Paragraph({
  keepNext: true, keepLines: true,
  spacing: { before: 240, after: 90 },
  children: [run(t, { size: 20, bold: true, color: SURIK_D })],
});

const bullets = (items, o = {}) => items.map((t) => new Paragraph({
  numbering: { reference: o.numbered ? "num" : "bul", level: 0 },
  spacing: { after: 70, line: 290 },
  children: Array.isArray(t) ? t : [run(t, { size: 20, color: INK })],
}));

function T(head, rows, weights, o = {}) {
  const tot = weights.reduce((a, b) => a + b, 0);
  const cols = weights.map((w) => Math.round(w / tot * W));
  cols[cols.length - 1] = W - cols.slice(0, -1).reduce((a, b) => a + b, 0);
  const cell = (val, i, isHead, ri) => new TableCell({
    width: { size: cols[i], type: WidthType.DXA },
    margins: { top: 95, bottom: 95, left: 130, right: 130 },
    shading: { type: ST.CLEAR, fill: isHead ? INK : (ri % 2 ? CANVAS : "FFFFFF"), color: "auto" },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: RULE },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: RULE },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    children: (Array.isArray(val) ? val : [val]).map((t) => new Paragraph({
      spacing: { before: 0, after: 0, line: 268 },
      children: typeof t === "string"
        ? [run(t, { size: 18, bold: isHead, color: isHead ? CANVAS : INK })]
        : t,
    })),
  });
  return new Table({
    columnWidths: cols, width: { size: W, type: WidthType.DXA },
    rows: [
      ...(o.noHead ? [] : [new TableRow({ tableHeader: true, children: head.map((h, i) => cell(h, i, true, 0)) })]),
      ...rows.map((r, ri) => new TableRow({ children: r.map((c, i) => cell(c, i, false, o.noHead ? ri : ri + 1)) })),
    ],
  });
}

function Callout(title, body, tone = SURIK_D) {
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return new Table({
    columnWidths: [W], width: { size: W, type: WidthType.DXA },
    rows: [new TableRow({ children: [new TableCell({
      width: { size: W, type: WidthType.DXA },
      margins: { top: 180, bottom: 180, left: 230, right: 200 },
      shading: { type: ST.CLEAR, fill: CANVAS, color: "auto" },
      borders: { left: { style: BorderStyle.SINGLE, size: 26, color: tone }, top: none, bottom: none, right: none },
      children: [
        ...(title ? [new Paragraph({ spacing: { after: 80 }, children: [run(title, { size: 20, bold: true, color: tone })] })] : []),
        ...(Array.isArray(body) ? body : [body]).map((b) => new Paragraph({
          spacing: { after: 70, line: 292 }, children: [run(b, { size: 19, color: INK })],
        })),
      ],
    })] })],
  });
}

function code(lines) {
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return new Table({
    columnWidths: [W], width: { size: W, type: WidthType.DXA },
    rows: [new TableRow({ children: [new TableCell({
      width: { size: W, type: WidthType.DXA },
      margins: { top: 160, bottom: 160, left: 190, right: 160 },
      shading: { type: ST.CLEAR, fill: "17120F", color: "auto" },
      borders: { top: none, bottom: none, left: none, right: none },
      children: lines.map((l) => new Paragraph({
        spacing: { after: 0, line: 255 },
        children: [new TextRun({ text: l || " ", font: "Consolas", size: 17, color: "E7DFD3" })],
      })),
    })] })],
  });
}

const spacer = (h = 200) => new Paragraph({ spacing: { after: h }, children: [run("", { size: 2 })] });

module.exports = { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle, ST, PageBreak, Header,
  Footer, PageNumber, LevelFormat, INK, SURIK_D, AMETH, TURQ, FOG, RULE, CANVAS, FONT, W,
  run, P, H1, H2, H3, bullets, T, Callout, code, spacer, state };
