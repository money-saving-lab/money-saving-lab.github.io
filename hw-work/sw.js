/* HW 작업실 껍데기 — 이 화면만 저장해 두어 인터넷이 없어도 앱이 열리고 「작업실 열기」 단추가 보이게.
   작업실(Apps Script) 쪽 요청은 건드리지 않는다. 화면을 고치면 V 숫자를 올린다. */
var V = "hwwork-v1";
var SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(V).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(fetch(req).then(function (r) {             // 새 것 먼저 · 끊기면 저장본
    if (r.ok) { var c = r.clone(); caches.open(V).then(function (x) { x.put(req, c); }); }
    return r;
  }).catch(function () {
    return caches.match(req, { ignoreSearch: true }).then(function (m) {
      return m || (req.mode === "navigate" ? caches.match("./index.html") : Response.error());
    });
  }));
});
