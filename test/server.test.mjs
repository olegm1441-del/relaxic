import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createApp } from "../server.mjs";

let server;
let base;

before(async () => {
  server = createApp();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test("landing is served with the metric counter", async () => {
  const response = await fetch(`${base}/`);
  const body = await response.text();
  assert.equal(response.status, 200);
  assert.match(body, /data-metrika-id="113818310"/);
  assert.match(body, /Соберите картину/);
  assert.match(response.headers.get("content-security-policy"), /mc\.yandex\.ru/);
});

test("navigation and bot links are tracked; unavailable store links remain paused", async () => {
  const html = await (await fetch(`${base}/`)).text();
  const anchors = [...html.matchAll(/<a\b([^>]*)>/g)].map((match) => match[1]);
  assert.ok(anchors.length >= 10);
  for (const attributes of anchors) {
    assert.match(attributes, /href="(?:#|#collections|#about|\/bot|\/gallery|\/app)"/);
    assert.match(attributes, /tracked-link/);
    assert.match(attributes, /data-link-name=/);
  }

  assert.match(html, /href="\/gallery"/);
  assert.match(html, /href="\/bot"/);
  const script = await (await fetch(`${base}/landing.js`)).text();
  assert.match(script, /landing_link_click/);
  assert.match(script, /"reachGoal"/);
});

test("health endpoint reports the landing", async () => {
  const response = await fetch(`${base}/api/health`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.landing, true);
});

test("old routes are unavailable", async () => {
  const response = await fetch(`${base}/catalog`);
  assert.equal(response.status, 404);
  assert.match(await response.text(), /на паузе/);
});

test("only known static files are served", async () => {
  const response = await fetch(`${base}/package.json`);
  assert.equal(response.status, 404);
});

test("installable Relaxic app and manifest are available", async () => {
 const a=await fetch(base+"/app"); assert.equal(a.status,200);
 assert.match(await a.text(), /manifest.webmanifest/);
 const m=await (await fetch(base+"/manifest.webmanifest")).json();
 assert.equal(m.display,"standalone"); assert.equal(m.start_url,"/app");
 for (const p of ["/app.css","/app.js","/app-sw.js","/icon-192.png","/icon-512.png"]) {
  assert.equal((await fetch(base+p)).status,200);
 }
});
