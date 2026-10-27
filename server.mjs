import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
const metrikaId = String(process.env.YANDEX_METRIKA_ID || "113818310").replace(/\D/g, "");
const commit = (process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_COMMIT || "local").slice(0, 7);

const files = new Map([
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/landing.js", ["landing.js", "text/javascript; charset=utf-8"]],
  ["/robots.txt", ["robots.txt", "text/plain; charset=utf-8"]],
  ["/apple-icon.png", ["apple-icon.png", "image/png"]],
  ["/icon-192.png", ["icon-192.png", "image/png"]],
  ["/icon-512.png", ["icon-512.png", "image/png"]],
  ["/img/brand/wordmark-dark.png", ["img/brand/wordmark-dark.png", "image/png"]],
  ["/img/hero/hero-main.jpg", ["img/hero/hero-main.jpg", "image/jpeg"]],
  ["/img/hero/hero-main-mobile.jpg", ["img/hero/hero-main-mobile.jpg", "image/jpeg"]],
  ["/img/mood/workshop.jpg", ["img/mood/workshop.jpg", "image/jpeg"]],
  ["/img/product/great-hall-1.jpg", ["img/product/great-hall-1.jpg", "image/jpeg"]],
  ["/img/product/dragon-peak-1.jpg", ["img/product/dragon-peak-1.jpg", "image/jpeg"]],
  ["/img/product/anime-rooftop-1.jpg", ["img/product/anime-rooftop-1.jpg", "image/jpeg"]],
]);

const securityHeaders = {
  "content-security-policy": [
    "default-src 'self'",
    "script-src 'self' https://mc.yandex.ru",
    "connect-src 'self' https://mc.yandex.ru https://mc.yandex.com",
    "img-src 'self' data: https://mc.yandex.ru https://mc.yandex.com",
    "style-src 'self'",
    "font-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join("; "),
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
};

function send(res, status, body, type, cache = "no-store", head = false) {
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(body);
  res.writeHead(status, {
    ...securityHeaders,
    "content-type": type,
    "content-length": payload.length,
    "cache-control": cache,
  });
  res.end(head ? undefined : payload);
}

export function createApp() {
  return createServer(async (req, res) => {
    const head = req.method === "HEAD";
    if (req.method !== "GET" && !head) {
      send(res, 405, "Method Not Allowed\n", "text/plain; charset=utf-8", "no-store", head);
      return;
    }

    let pathname;
    try {
      pathname = new URL(req.url || "/", "http://localhost").pathname;
    } catch {
      send(res, 400, "Bad Request\n", "text/plain; charset=utf-8", "no-store", head);
      return;
    }

    try {
      if (pathname === "/api/health") {
        const body = JSON.stringify({ ok: true, landing: true, commit, at: new Date().toISOString() });
        send(res, 200, body, "application/json; charset=utf-8", "no-store", head);
        return;
      }

      if (pathname === "/" || pathname === "/index.html") {
        const template = await readFile(path.join(root, "index.html"), "utf8");
        const html = template
          .replaceAll("__METRIKA_ID__", metrikaId)
          .replaceAll("__COMMIT__", commit);
        send(res, 200, html, "text/html; charset=utf-8", "no-cache", head);
        return;
      }

      const file = files.get(pathname);
      if (file) {
        const body = await readFile(path.join(root, file[0]));
        send(res, 200, body, file[1], "public, max-age=31536000, immutable", head);
        return;
      }

      send(res, 404, "Этот раздел Relaxic пока на паузе.\n", "text/plain; charset=utf-8", "no-store", head);
    } catch (error) {
      console.error(error);
      send(res, 500, "Internal Server Error\n", "text/plain; charset=utf-8", "no-store", head);
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOSTNAME || "0.0.0.0";
  const server = createApp();
  server.listen(port, host, () => console.log(`Relaxic landing: http://${host}:${port}`));
  const stop = () => server.close(() => process.exit(0));
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}
