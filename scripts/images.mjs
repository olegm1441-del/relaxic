#!/usr/bin/env node
/**
 * Пережим картинок: вес вниз, качество на глаз то же.
 *
 * Оригиналы лежат в assets/img-source и в образ не уезжают — их исключает
 * .dockerignore. На сервер попадает только public/img, собранный этим
 * скриптом. Поэтому вернуть полное качество можно одной командой, ничего
 * не восстанавливая из истории:
 *
 *   node scripts/images.mjs --preset full     полное качество
 *   node scripts/images.mjs --preset light    облегчённое (по умолчанию)
 *
 * Зачем вообще: next/image пересжимает каждую картинку под размер экрана,
 * и делает это в памяти. Исходник 1760×2200 разворачивается в сыром виде
 * в 11 МБ — отсюда и росла память сервера на Railway, за которую идёт счёт.
 * Уменьшая сторону вдвое, мы вчетверо снижаем пик на каждую пересборку.
 */
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const PRESETS = {
  // maxSide — длинная сторона. Больше всё равно не показывается:
  // контейнер сайта 1280 px, и даже на ретине 1400 хватает с запасом.
  light: { maxSide: 1400, jpeg: 78, png: 78, label: "облегчённый" },
  full:  { maxSide: 2200, jpeg: 92, png: 92, label: "полный" },
};

const arg = process.argv.indexOf("--preset");
const name = (arg > -1 ? process.argv[arg + 1] : "light");
const preset = PRESETS[name];
if (!preset) {
  console.error(`Неизвестный пресет «${name}». Есть: ${Object.keys(PRESETS).join(", ")}`);
  process.exit(1);
}

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "assets", "img-source");
const OUT = path.join(ROOT, "public", "img");

async function walk(dir, base = "") {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const rel = path.join(base, e.name);
    if (e.isDirectory()) out.push(...await walk(path.join(dir, e.name), rel));
    else out.push(rel);
  }
  return out;
}

const RASTER = /\.(jpe?g|png|webp)$/i;
let from = 0, to = 0, done = 0, copied = 0;

const files = await walk(SRC).catch(() => {
  console.error(`Нет папки с оригиналами: ${SRC}`);
  console.error("Первый запуск: перенесите в неё public/img целиком.");
  process.exit(1);
});

for (const rel of files) {
  const src = path.join(SRC, rel);
  const dst = path.join(OUT, rel);
  await mkdir(path.dirname(dst), { recursive: true });
  const size = (await stat(src)).size;
  from += size;

  if (!RASTER.test(rel)) {
    // Векторы и всё прочее переносим как есть: сжимать нечего.
    await writeFile(dst, await sharp(src).toBuffer().catch(async () =>
      (await import("node:fs/promises")).readFile(src)));
    copied += 1; to += size;
    continue;
  }

  const img = sharp(src, { failOn: "none" });
  const meta = await img.metadata();
  const long = Math.max(meta.width ?? 0, meta.height ?? 0);
  const pipe = long > preset.maxSide
    ? img.resize({ width: meta.width >= meta.height ? preset.maxSide : null,
                   height: meta.height > meta.width ? preset.maxSide : null,
                   withoutEnlargement: true, fit: "inside" })
    : img;

  const isPng = /\.png$/i.test(rel);
  const buf = isPng
    // Палитра вместо полного цвета: у плоских картинок разницы не видно,
    // а вес падает в разы. Для фотографий это было бы заметно.
    ? await pipe.png({ quality: preset.png, compressionLevel: 9, palette: true }).toBuffer()
    : await pipe.jpeg({ quality: preset.jpeg, mozjpeg: true, chromaSubsampling: "4:4:4" }).toBuffer();

  await writeFile(dst, buf);
  to += buf.length;
  done += 1;
}

await writeFile(path.join(ROOT, "image-preset.json"),
  JSON.stringify({ preset: name, maxSide: preset.maxSide, at: new Date().toISOString() }, null, 2) + "\n");

const mb = (n) => (n / 1048576).toFixed(1);
console.log(`пресет: ${preset.label} (сторона до ${preset.maxSide} px, качество ${preset.jpeg})`);
console.log(`пережато ${done}, перенесено как есть ${copied}`);
console.log(`было ${mb(from)} МБ → стало ${mb(to)} МБ  (${Math.round((1 - to / from) * 100)}% долой)`);
