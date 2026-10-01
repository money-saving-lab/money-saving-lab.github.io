/* HW 숏츠 메이커 📱 폰 단독 — 서비스 워커 (앱 파일만 담아 두고 「서버 먼저, 안 되면 담아 둔 것」 · 만든 영상은 IndexedDB 에 따로)
   ★파일 이름은 영문★ (안드로이드 앱 묶음에서 한글 이름이 깨질 수 있어서 · 10/2) */
const 판 = "hw-maker-solo-v3";
const 뼈대 = ["./", "index.html", "style.css", "app.js", "engine.js", "plan.js", "edge.js", "draw.js", "board.js", "mux.js", "fields.json", "manifest.webmanifest",
  "fonts/Pretendard-Black.otf", "fonts/Pretendard-ExtraBold.otf", "fonts/Pretendard-SemiBold.otf", "icons/icon-192.png",
  ...["impact", "stamp", "whoosh_airy", "pop_soft", "pop", "ding", "sparkle", "scroll", "bloom", "coin", "blip"].map((n) => "sfx/" + n + ".wav")];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(판).then((c) => c.addAll(뼈대)).catch(() => {}).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== 판).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const c = r.clone(); caches.open(판).then((x) => x.put(e.request, c)); } return r; })
    .catch(() => caches.match(e.request).then((m) => m || caches.match("index.html"))));
});
