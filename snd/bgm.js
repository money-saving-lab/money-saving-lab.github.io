/* 🎵 배경음악 단추 (11/28 사장님 「전 페이지 잔잔한 음악 깔아」 · 11/28 저녁 「음악 단추 문구를 강조」 → 최종 문구 「기분 좋은 음악 들으시면서 고르세요」)
   · 모든 페이지가 <script src="/snd/bgm.js" defer></script> 한 줄로 씀 · 곡 = /snd/bgm.mp3 (우리 수노 유료 곡)
   · 기본 꺼짐 · 단추를 눌러야 켜짐(브라우저가 소리 자동 재생을 막음) · 켠 사람은 다음 쪽에서도 이어 켜려 시도(막히면 단추만 보임)
   · 꼴 = 꺼짐: 금색 테두리 알약 「🎵 기분 좋은 음악 들으시면서 고르세요」 + 움직이는 막대 3개 + 살짝 빛나는 고리 → 11초 뒤 또는 300px 넘게 내리면 작은 동그라미로 접힘
          켬: 「🎵 음악 끄기」 + 막대 → 3초 뒤 막대만 움직이는 작은 동그라미 · 말 = <html lang> (ko·ja·en)
   · 자리 = 오른쪽 아래(bottom 18) — 즐겨찾기 단추(/snd/fav.js · bottom 72)·말풍선(bottom 160) 바로 아래 칸 · 인쇄·헤드리스(PDF)에는 안 보임 */
(function () {
  if (window.__hwBgm) return; window.__hwBgm = 1;
  var D = document, 켬 = false, 기억 = "hw_bgm_on", 자리 = "hw_bgm_t", 접기표 = 0;
  try { 켬 = localStorage.getItem(기억) === "1"; } catch (e) {}
  var 말 = String(D.documentElement.lang || "ko").slice(0, 2).toLowerCase();
  var 글 = ({
    ko: { 켜: "기분 좋은 음악 들으시면서 고르세요", 꺼: "음악 끄기", 이름: "배경음악 켜기·끄기" },   // 문구 = 11/28 저녁 사장님 최종(「흥겨운」 ✗)
    ja: { 켜: "心地よい音楽を聴きながら選んでね", 꺼: "音楽を止める", 이름: "BGM オン・オフ" },
    en: { 켜: "Feel-good music while you browse", 꺼: "Music off", 이름: "Background music on/off" }
  })[말] || null;
  if (!글) 글 = { 켜: "기분 좋은 음악 들으시면서 고르세요", 꺼: "음악 끄기", 이름: "배경음악 켜기·끄기" };
  var a = new Audio("/snd/bgm.mp3"); a.loop = true; a.volume = 0.32; a.preload = "none";
  try { var t = parseFloat(sessionStorage.getItem(자리) || "0"); if (t > 0) a.currentTime = t; } catch (e) {}
  var st = D.createElement("style");
  st.textContent = "" +
    "#hwbgm{position:fixed;right:14px;bottom:18px;z-index:9999;box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:8px;height:44px;min-width:44px;max-width:calc(100vw - 28px);padding:0 16px;margin:0;" +
    "border-radius:999px;border:1.5px solid #d4af37;background:rgba(15,15,18,.9);color:#f3d77a;font-family:inherit;font-size:13.5px;font-weight:700;line-height:1;letter-spacing:.01em;white-space:nowrap;overflow:hidden;" +
    "-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);box-shadow:0 4px 16px rgba(0,0,0,.4);cursor:pointer;-webkit-tap-highlight-color:transparent;transition:padding .35s ease,gap .35s ease,opacity .35s ease}" +
    "#hwbgm .nt{flex:none;font-size:16px;line-height:1}" +
    "#hwbgm .tx{min-width:0;max-width:300px;overflow:hidden;text-overflow:ellipsis;transition:max-width .35s ease,opacity .25s ease}" +
    "#hwbgm .eq{flex:none;display:flex;align-items:flex-end;gap:2.5px;height:16px}" +
    "#hwbgm .eq i{display:block;width:3px;height:16px;border-radius:2px;background:linear-gradient(#f3d77a,#d4af37);transform-origin:50% 100%;animation:hwbeq .9s ease-in-out infinite}" +
    "#hwbgm .eq i:nth-child(2){animation-duration:.7s;animation-delay:-.25s}#hwbgm .eq i:nth-child(3){animation-duration:1.1s;animation-delay:-.5s}" +
    "@keyframes hwbeq{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}" +
    "#hwbgm.open.off{animation:hwbring 2.6s ease-out infinite}" +
    "@keyframes hwbring{0%{box-shadow:0 4px 16px rgba(0,0,0,.4),0 0 0 0 rgba(243,215,122,.55)}70%{box-shadow:0 4px 16px rgba(0,0,0,.4),0 0 0 9px rgba(243,215,122,0)}100%{box-shadow:0 4px 16px rgba(0,0,0,.4),0 0 0 0 rgba(243,215,122,0)}}" +
    /* 접힌 꼴 = 지름 44 동그라미 · 꺼짐 = 🎵 만(살짝 흐리게) · 켬 = 움직이는 막대만 */
    "#hwbgm:not(.open){padding:0;gap:0;width:44px}#hwbgm:not(.open) .tx{max-width:0;opacity:0}" +
    "#hwbgm:not(.open).off{opacity:.78;border-color:rgba(212,175,55,.6)}#hwbgm:not(.open).off .eq{display:none}" +
    "#hwbgm:not(.open).on .nt{display:none}" +
    "@media (max-width:359px){#hwbgm{font-size:12.5px;padding:0 12px;gap:6px}}" +
    "@media (prefers-reduced-motion:reduce){#hwbgm,#hwbgm .eq i{animation:none!important}#hwbgm .eq i:nth-child(1){transform:scaleY(.55)}#hwbgm .eq i:nth-child(3){transform:scaleY(.75)}}" +
    "@media print{#hwbgm{display:none!important}}";
  D.head.appendChild(st);
  if (/HeadlessChrome/.test(navigator.userAgent)) return;   // PDF 만들 때(헤드리스 크롬)는 단추 안 붙임
  var b = D.createElement("button");
  b.type = "button"; b.id = "hwbgm"; b.setAttribute("aria-label", 글.이름);
  b.innerHTML = '<span class="nt" aria-hidden="true">🎵</span><span class="tx"></span><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>';
  var tx = b.querySelector(".tx"), 펼침 = true;
  function 그림() {
    tx.textContent = 켬 ? 글.꺼 : 글.켜;
    b.className = (켬 ? "on" : "off") + (펼침 ? " open" : "");
    b.title = 켬 ? 글.꺼 : 글.켜; b.setAttribute("aria-pressed", 켬 ? "true" : "false");
  }
  /* 300px 넘게 내린 뒤에는 늘 접힌 동그라미(쪽 아래 메뉴 띠 .px-dock·.kx-dock 이 360px 부터 뜨므로 긴 알약이 그 위를 덮지 않게) */
  function 내림() { return (window.pageYOffset || D.documentElement.scrollTop || 0) > 300; }
  function 접기(뒤) { clearTimeout(접기표); 접기표 = setTimeout(function () { 펼침 = false; 그림(); }, 뒤); }
  function 틀기() { var p = a.play(); if (p && p.catch) p.catch(function () { 켬 = false; 펼침 = !내림(); 그림(); 접기(11000); }); }
  b.onclick = function () {
    켬 = !켬; try { localStorage.setItem(기억, 켬 ? "1" : "0"); } catch (e) {}
    if (켬) 틀기(); else a.pause();
    펼침 = !내림(); 그림(); 접기(켬 ? 3000 : 5000);
  };
  window.addEventListener("scroll", function () {
    if (펼침 && 내림()) { clearTimeout(접기표); 펼침 = false; 그림(); }
  }, { passive: true });
  window.addEventListener("pagehide", function () { try { sessionStorage.setItem(자리, String(a.currentTime || 0)); } catch (e) {} });
  function 붙이기() {
    D.body.appendChild(b);
    if (켬) { 펼침 = false; 그림(); 틀기(); } else { 펼침 = !내림(); 그림(); 접기(11000); }
  }
  if (D.body) 붙이기(); else D.addEventListener("DOMContentLoaded", 붙이기);
})();
