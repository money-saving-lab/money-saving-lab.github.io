/* 🎵 잔잔한 배경음악 단추 (11/28 사장님 「전 페이지 잔잔한 음악 깔아」)
   · 모든 페이지가 <script src="/snd/bgm.js" defer></script> 한 줄로 씀 · 곡 = /snd/bgm.mp3 (우리 수노 유료 곡)
   · 기본 꺼짐 · 단추를 눌러야 켜짐(브라우저가 소리 자동 재생을 막음) · 켠 사람은 다음 쪽에서도 이어 켜려 시도(막히면 단추만 보임) */
(function () {
  if (window.__hwBgm) return; window.__hwBgm = 1;
  var 켬 = false, 기억 = "hw_bgm_on", 자리 = "hw_bgm_t";
  try { 켬 = localStorage.getItem(기억) === "1"; } catch (e) {}
  var a = new Audio("/snd/bgm.mp3"); a.loop = true; a.volume = 0.32; a.preload = "none";
  try { var t = parseFloat(sessionStorage.getItem(자리) || "0"); if (t > 0) a.currentTime = t; } catch (e) {}
  var b = document.createElement("button");
  b.type = "button"; b.id = "hwbgm"; b.setAttribute("aria-label", "배경음악 켜기·끄기");
  var st = document.createElement("style"); st.textContent = "@media print{#hwbgm{display:none!important}}"; document.head.appendChild(st);
  if (/HeadlessChrome/.test(navigator.userAgent)) return;   // PDF 만들 때(헤드리스 크롬)는 단추 안 붙임
  b.style.cssText = "position:fixed;right:14px;bottom:18px;z-index:9999;width:44px;height:44px;border-radius:50%;" +
    "border:1px solid rgba(212,175,55,.55);background:rgba(15,15,18,.82);color:#d4af37;font-size:18px;line-height:1;" +
    "backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);box-shadow:0 4px 16px rgba(0,0,0,.35);cursor:pointer;padding:0";
  function 그림() { b.textContent = 켬 ? "♪" : "♪"; b.style.opacity = 켬 ? "1" : ".55"; b.title = 켬 ? "음악 끄기" : "잔잔한 음악 켜기"; }
  function 틀기() { var p = a.play(); if (p && p.catch) p.catch(function () { 켬 = false; 그림(); }); }
  b.onclick = function () {
    켬 = !켬; try { localStorage.setItem(기억, 켬 ? "1" : "0"); } catch (e) {}
    if (켬) 틀기(); else a.pause(); 그림();
  };
  window.addEventListener("pagehide", function () { try { sessionStorage.setItem(자리, String(a.currentTime || 0)); } catch (e) {} });
  function 붙이기() { document.body.appendChild(b); 그림(); if (켬) 틀기(); }
  if (document.body) 붙이기(); else document.addEventListener("DOMContentLoaded", 붙이기);
})();
