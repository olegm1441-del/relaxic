import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
const metrikaId = String(process.env.YANDEX_METRIKA_ID || "113818310").replace(/\D/g, "");
const commit = (process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_COMMIT || "local").slice(0, 7);

const files = new Map([
  ["/app", ["app.html", "text/html; charset=utf-8"]],
  ["/app/", ["app.html", "text/html; charset=utf-8"]],
  ["/app.css", ["app.css", "text/css; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/manifest.webmanifest", ["manifest.webmanifest", "application/manifest+json"]],
  ["/app-sw.js", ["app-sw.js", "text/javascript; charset=utf-8"]],
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
    "img-src 'self' data: blob: https://mc.yandex.ru https://mc.yandex.com",
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

// Read-only gallery and capability-protected artwork management are served
// by the existing Relaxic bot, with a fixed upstream (no arbitrary proxy URLs).
const artworkOrigin = "https://relaxic-bot-production.up.railway.app";
const artworkRoute = /^\/artwork\/(?:manage|private)\/[a-f0-9]{64}$|^\/artwork\/public\/[a-f0-9]{24}$/;
async function proxyArtwork(req, res, pathname, head) {
  const isManage = /^\/artwork\/manage\/[a-f0-9]{64}$/.test(pathname);
  if (req.method !== "GET" && !head && !(isManage && req.method === "POST")) {
    return send(res, 405, "Method Not Allowed\n", "text/plain; charset=utf-8");
  }
  let body;
  if (req.method === "POST") {
    if (!(req.headers["content-type"] || "").startsWith("application/x-www-form-urlencoded")) {
      return send(res, 415, "Unsupported content type\n", "text/plain; charset=utf-8");
    }
    let length = 0;
    const chunks = [];
    for await (const chunk of req) {
      length += chunk.length;
      if (length > 1024) return send(res, 413, "Request too large\n", "text/plain; charset=utf-8");
      chunks.push(chunk);
    }
    body = Buffer.concat(chunks);
  }
  try {
    const remote = await fetch(artworkOrigin + pathname, {
      method: head ? "GET" : req.method,
      ...(body ? {body, headers: {"content-type": "application/x-www-form-urlencoded"}} : {}),
      redirect: "manual",
      signal: AbortSignal.timeout(12000),
    });
    const location = remote.headers.get("location");
    if (location && [302,303].includes(remote.status)) {
      if (pathname === "/bot" && /^https:\/\/t\.me\/[a-zA-Z0-9_]+$/.test(location) ||
          isManage && location === pathname) {
        res.writeHead(remote.status, {location, "cache-control":"no-store","referrer-policy":"no-referrer"});
        return res.end();
      }
      return send(res, 502, "Invalid redirect\n", "text/plain; charset=utf-8");
    }
    const type = remote.headers.get("content-type") || "text/plain; charset=utf-8";
    if (!/^(text\/html|text\/plain|image\/jpeg)(?:;|$)/.test(type)) {
      return send(res, 502, "Invalid response\n", "text/plain; charset=utf-8");
    }
    const data = Buffer.from(await remote.arrayBuffer());
    res.writeHead(remote.status, {
      "content-type": type, "content-length": data.length,
      "cache-control": "no-store", "referrer-policy": "no-referrer",
      "x-content-type-options":"nosniff","x-frame-options":"DENY","x-robots-tag":"noindex, nofollow",
      "content-security-policy":"default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    });
    return res.end(head ? undefined : data);
  } catch {
    return send(res, 503, "Галерея или бот временно недоступны. Попробуйте позже.\n", "text/plain; charset=utf-8","no-store",head);
  }
}


async function proxyReviews(req,res,head) {
 const reply=(status,data)=>send(res,status,JSON.stringify(data),"application/json; charset=utf-8","no-store",head);
 if(!["GET","HEAD","POST"].includes(req.method))return reply(405,{error:"Метод не поддерживается."});
 try{
  let body;
  if(req.method==="POST"){
   const origin=req.headers.origin;
   if(origin&&origin!=="https://relaxic-production.up.railway.app"&&origin!=="https://"+req.headers.host&&origin!=="http://"+req.headers.host)return reply(403,{error:"Недопустимый источник."});
   if(!String(req.headers["content-type"]||"").startsWith("application/json"))return reply(415,{error:"Неверный формат."});
   const chunks=[];let bytes=0;
   for await(const chunk of req){bytes+=chunk.length;if(bytes>4096)return reply(413,{error:"Слишком длинный запрос."});chunks.push(chunk);}
   body=Buffer.concat(chunks);
   try{const x=JSON.parse(body.toString("utf8"));if(!x||typeof x!=="object"||Array.isArray(x))throw Error();}catch{return reply(400,{error:"Неверный формат."});}
  }
  const response=await fetch(artworkOrigin+"/api/reviews",{method:head?"GET":req.method,...(body?{body,headers:{"content-type":"application/json"}}:{}),signal:AbortSignal.timeout(15000),redirect:"error"});
  if(!String(response.headers.get("content-type")).startsWith("application/json"))return reply(502,{error:"Сервис отзывов недоступен."});
  return reply(response.status,await response.json());
 }catch{return reply(503,{error:"Не удалось связаться с сервисом отзывов. Попробуйте позже."});}
}

export function createApp() {
  return createServer(async (req, res) => {
    const head = req.method === "HEAD";
    let pathname;
    try {
      pathname = new URL(req.url || "/", "http://localhost").pathname;
    } catch {
      send(res, 400, "Bad Request\n", "text/plain; charset=utf-8", "no-store", head);
      return;
    }

    if (pathname === "/api/reviews") return proxyReviews(req,res,head);
    if (pathname === "/gallery" || pathname === "/bot" || artworkRoute.test(pathname)) {
      return proxyArtwork(req, res, pathname, head);
    }
    if (req.method !== "GET" && !head) {
      return send(res, 405, "Method Not Allowed\n", "text/plain; charset=utf-8", "no-store", head);
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
        send(res, 200, body, file[1], pathname.startsWith("/app") || pathname === "/manifest.webmanifest" ? "no-cache" : "public, max-age=31536000, immutable", head);
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
