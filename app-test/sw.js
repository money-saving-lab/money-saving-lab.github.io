/* 📱 돈 아끼는 연구소 — 서비스 워커
   · 화면(껍데기): 한 번 연 화면은 오프라인에서도 보이게 (미리 담기 + 쓰면서 새로 고침)
   · data.json · 첫 화면: ★새 것 먼저★ (4초 안에 안 오면 저장본)
   · 밖 링크(쿠팡·클룩·마이리얼트립·유튜브)는 건드리지 않는다
   화면 파일을 크게 고치면 V 숫자를 올린다 → 옛 저장본이 지워진다 */
var V = "dal-v1";
var SHELL = ["./", "./index.html", "./app.css", "./app.js", "./manifest.webmanifest", "./data.json",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/favicon-64.png", "./img/travel.png", "./img/kkul.png"];
var FONT = "cdn.jsdelivr.net";

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(V).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function timeout(ms) { return new Promise(function (_, no) { setTimeout(no, ms); }); }
function put(req, res) { if (res && (res.ok || res.type === "opaque")) { var c = res.clone(); caches.open(V).then(function (x) { x.put(req, c); }); } return res; }

function networkFirst(req, key, page) {
  return Promise.race([fetch(req).then(function (r) { return put(key || req, r); }), timeout(4000)])
    .catch(function () {
      return caches.match(key || req, { ignoreSearch: true }).then(function (m) {
        if (m || !page) return m || Response.error();
        return caches.match("./index.html").then(function (i) { return i || Response.error(); });
      });
    });
}
function staleWhileRevalidate(req) {
  return caches.match(req).then(function (m) {
    var net = fetch(req).then(function (r) { return put(req, r); }).catch(function () { return m; });
    return m || net;
  });
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var u = new URL(req.url);
  if (u.origin === location.origin) {
    if (req.mode === "navigate") { e.respondWith(networkFirst(req, "./index.html", true)); return; }
    if (/\/data\.json$/.test(u.pathname)) { e.respondWith(networkFirst(req, "./data.json")); return; }
    if (/\.(png|jpe?g|webp|svg)$/i.test(u.pathname)) { e.respondWith(staleWhileRevalidate(req)); return; }   // 그림은 저장본 먼저
    e.respondWith(networkFirst(req));                   // css·js·manifest 도 새 것 먼저 (새 화면 + 옛 css 섞임 방지)
    return;
  }
  if (u.host === FONT) e.respondWith(staleWhileRevalidate(req));   // 프리텐다드 글꼴
});
