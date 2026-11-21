// HW 편집 알림 (11/21 밤) — 편집이 끝나면 PC 가 웹 푸시로 알림 → 누르면 그 화면으로
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { 글: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.제목 || 'HW 편집', {
    body: d.글 || '영상 편집이 끝났어요 · 눌러서 받으세요',
    data: { url: d.주소 || '/mk/' },
    tag: d.편 || 'hw-mk'
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var u = (e.notification.data && e.notification.data.url) || '/mk/';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
    for (var i = 0; i < cs.length; i++) { if (cs[i].url.indexOf('/mk/') >= 0 && 'focus' in cs[i]) { cs[i].navigate(u); return cs[i].focus(); } }
    return self.clients.openWindow(u);
  }));
});
