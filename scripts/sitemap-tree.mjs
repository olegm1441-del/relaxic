/**
 * Карта сайта: SVG → PNG и PDF.
 *
 * Схему рисует scripts/sitemap-tree.py, здесь только отрисовка: шрифты
 * бренда живут в Google Fonts, а SVG сам по себе их не подтянет —
 * нужен браузер, который дождётся загрузки и отрисует текст правильно.
 *
 *   python3 scripts/sitemap-tree.py && node scripts/sitemap-tree.mjs
 */
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const { chromium } = await import("playwright").catch(() =>
  import("/opt/node22/lib/node_modules/playwright/index.mjs"));

const OUT = new URL("../docs/assets/", import.meta.url).pathname;
const svg = readFileSync(OUT + "sitemap-tree.svg", "utf8");
const tmp = join(mkdtempSync(join(tmpdir(), "relaxic-map-")), "map.html");
writeFileSync(tmp,
  '<!doctype html><meta charset="utf-8">' +
  '<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700;800' +
  '&family=Onest:wght@400;500;600&display=swap" rel="stylesheet">' +
  '<style>html,body{margin:0;background:#141110}</style>' + svg);

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });
await p.goto("file://" + tmp, { waitUntil: "networkidle" });

// Без явной загрузки SVG рисует засечками: document.fonts.ready
// сам по себе не активирует шрифт, которым ещё ничего не отрисовано.
const ok = await p.evaluate(async () => {
  await Promise.all([
    document.fonts.load("800 52px Rubik"), document.fonts.load("700 15px Rubik"),
    document.fonts.load("500 15px Rubik"), document.fonts.load("400 14px Onest"),
    document.fonts.load("500 14px Onest"),
  ]);
  await document.fonts.ready;
  return document.fonts.check("800 52px Rubik") && document.fonts.check("400 14px Onest");
});
if (!ok) console.warn("ВНИМАНИЕ: шрифты бренда не активировались, будет системный");

const el = await p.$("svg");
const box = await el.boundingBox();
await p.setViewportSize({ width: Math.ceil(box.width), height: Math.ceil(box.height) });
await p.waitForTimeout(200);
await el.screenshot({ path: OUT + "sitemap-tree.png" });
await p.pdf({ path: OUT + "sitemap-tree.pdf", width: box.width + "px",
              height: box.height + "px", printBackground: true, pageRanges: "1" });
console.log(`PNG и PDF готовы, ${Math.round(box.width)}×${Math.round(box.height)}`);
await b.close();
