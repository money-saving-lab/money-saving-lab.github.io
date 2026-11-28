/* ★ 즐겨찾기 단추 + 「다시 올 이유」 칸 (11/28 사장님 「즐겨찾기해서 볼 정도의 급 · 즐겨찾기 버튼 눈에 띄게」)
   · 원본 = C:\HW여행부업엔진\링크페이지_부품\즐겨찾기\fav.js → 스위치가 켜졌을 때만 링크페이지_즐겨찾기.py 가 /snd/fav.js 로 놓는다
   · 쪽마다 <script>window.HWFAV={…}</script><script src="/snd/fav.js" defer></script> · 자료(코드·날짜·도시)는 전부 HWFAV 안(파이썬이 장부에서 읽어 넣음)
   · 환율 = open.er-api.com · 날씨 = open-meteo.com (열쇠 없음 · 못 불러오면 그 칸은 안 보임) · 제휴 링크는 여기서 하나도 만들지 않는다 */
(function () {
  if (window.__hwFav) return; window.__hwFav = 1;
  var C = window.HWFAV || {}, L = C.lang || "ko", D = document;
  var TX = {
    ko: { ey: "TODAY", h: "오늘 확인하고 가세요", upd: "마지막 업데이트 ", live: "환율은 열 때마다 새로 불러와요", fav: "즐겨찾기", favLong: "즐겨찾기 해 두기",
      codes: "지금 쓸 수 있는 할인 코드", n: "개", copy: "복사", copied: "복사됨 ✓", until: "까지", today: "오늘까지", noend: "끝나는 날 미정", more: "코드 더 보기", morefx: "다른 나라 돈 더 보기", where: "쓰는 곳 보기",
      cnote: "조건·기간은 여행사 사정으로 바뀌거나 일찍 끝날 수 있어요. 쓰기 전에 여행사 화면에서 한 번 더 확인하세요.",
      fx: "오늘 환율", fxn: "참고용 기준 환율이에요. 실제 환전·카드 결제 값과는 달라요.", asof: "기준 ", src: "출처 ",
      wx: "여행지 지금 날씨", wxn: "현지 지금 기온 · 오늘 최저/최고", now: "지금", news: "새로 올라온 것",
      sT: "즐겨찾기 해 두기", sP: "할인 코드·환율·새 영상이 바뀔 때마다 바로 열어 볼 수 있어요.",
      inst: "홈 화면에 추가", pc1: "키보드에서", pc2: "를 누르면 즐겨찾기에 들어가요.", pcApp: "앱처럼 설치하기",
      i1: "아래(또는 위) 가운데 <b>공유</b> 단추를 눌러요", i2: "목록을 내려 <b>홈 화면에 추가</b>를 눌러요", i3: "오른쪽 위 <b>추가</b>를 누르면 끝",
      a1: "오른쪽 위 <b>⋮</b> (삼성 인터넷은 아래 <b>≡</b>) 를 눌러요", a2: "<b>홈 화면에 추가</b>를 눌러요", a3: "<b>추가</b>를 누르면 끝",
      app: "지금은 앱 안 창이에요. 먼저 오른쪽 위 <b>⋯</b> 에서 <b>다른 브라우저로 열기</b>(Safari·Chrome)를 누른 뒤 따라 해 주세요.",
      url: "주소 복사", done: "해 뒀어요", close: "닫기", x: "작게 접기",
      w: ["맑음", "대체로 맑음", "구름 조금", "흐림", "안개", "이슬비", "비", "눈", "소나기", "뇌우"], cur: "원",
      ref: "참고 환율", load: "환율을 불러오는 중…", fail: "환율을 불러오지 못했어요.", retry: "다시 불러오기", old: "지난번에 받은 값" },
    ja: { ey: "TODAY", h: "今日の旅メモ", upd: "最終更新 ", live: "為替は開くたびに更新されます", fav: "お気に入り", favLong: "お気に入りに追加",
      codes: "今使えるクーポンコード", n: "件", copy: "コピー", copied: "コピー済み ✓", until: "まで", today: "本日まで", noend: "終了日は未定", more: "もっと見る", morefx: "ほかの通貨", where: "使えるページを見る",
      cnote: "対象商品のみ。予告なく変更・終了する場合があります。ご利用前に公式ページでご確認ください。",
      fx: "今日の為替", fxn: "参考レートです。実際の両替・カード決済のレートとは異なります。", asof: "基準 ", src: "出典 ",
      wx: "いまの韓国の天気", wxn: "現在 · 最低/最高", now: "いま", news: "新着・更新",
      sT: "お気に入りに追加", sP: "クーポン・為替・新しい動画を、次からすぐ開けます。",
      inst: "ホーム画面に追加", pc1: "キーボードの", pc2: "でブックマークに追加できます。", pcApp: "アプリとしてインストール",
      i1: "下（または上）の<b>共有</b>ボタンをタップ", i2: "<b>ホーム画面に追加</b>をタップ", i3: "右上の<b>追加</b>で完了",
      a1: "右上の<b>⋮</b>をタップ", a2: "<b>ホーム画面に追加</b>をタップ", a3: "<b>追加</b>で完了",
      app: "アプリ内ブラウザで開いています。右上の<b>⋯</b>から<b>ブラウザで開く</b>（Safari・Chrome）を選んでからお試しください。",
      url: "URLをコピー", done: "追加しました", close: "閉じる", x: "小さくする",
      w: ["晴れ", "おおむね晴れ", "晴れ時々くもり", "くもり", "霧", "霧雨", "雨", "雪", "にわか雨", "雷雨"], cur: "ウォン",
      ref: "参考レート", load: "為替レートを読み込み中…", fail: "為替レートを読み込めませんでした。", retry: "もう一度読み込む", old: "前回取得したレート" },
    en: { ey: "TODAY", h: "Today at a glance", upd: "Last updated ", live: "Updated regularly", fav: "Save", favLong: "Save this page",
      codes: "Codes you can use now", n: "", copy: "Copy", copied: "Copied ✓", until: "", today: "Ends today", noend: "No end date listed", more: "More codes", morefx: "More currencies", where: "See where to use",
      cnote: "Terms can change or end early. Please check the retailer's page before use.",
      fx: "Today's rates", fxn: "Reference rates only. Actual exchange and card rates differ.", asof: "As of ", src: "Source ",
      wx: "Weather now", wxn: "Current temperature · today's low/high", now: "Now", news: "What's new",
      sT: "Save this page", sP: "Come back in one tap whenever the list is updated.",
      inst: "Add to Home Screen", pc1: "Press", pc2: "to bookmark this page.", pcApp: "Install as an app",
      i1: "Tap the <b>Share</b> button at the bottom (or top)", i2: "Scroll and tap <b>Add to Home Screen</b>", i3: "Tap <b>Add</b> at the top right",
      a1: "Tap <b>⋮</b> at the top right", a2: "Tap <b>Add to Home screen</b>", a3: "Tap <b>Add</b>",
      app: "You're in an in-app browser. Tap <b>⋯</b> at the top right and choose <b>Open in browser</b> (Safari or Chrome) first.",
      url: "Copy link", done: "Done", close: "Close", x: "Minimize",
      w: ["Clear", "Mostly clear", "Partly cloudy", "Cloudy", "Fog", "Drizzle", "Rain", "Snow", "Showers", "Thunderstorm"], cur: "KRW",
      ref: "Reference rate", load: "Loading rates…", fail: "Could not load rates.", retry: "Try again", old: "last saved rate" }
  };
  var T = TX[L] || TX.ko;
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function el(tag, cls, html) { var x = D.createElement(tag); if (cls) x.className = cls; if (html != null) x.innerHTML = html; return x; }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function copy(t, ok) {
    function old() { var a = D.createElement("textarea"); a.value = t; a.style.position = "fixed"; a.style.opacity = "0"; D.body.appendChild(a); a.select(); try { D.execCommand("copy"); ok(); } catch (x) {} D.body.removeChild(a); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, old); else old();
  }
  function num(v) { var d = v >= 100 ? 0 : (v >= 10 ? 1 : (v >= 1 ? 2 : 3)); return Number(v.toFixed(d)).toLocaleString(L === "en" ? "en-US" : (L === "ja" ? "ja-JP" : "ko-KR"), { maximumFractionDigits: d }); }
  function getJSON(url, key, ttl, okf) {
    var c = null;
    try { c = JSON.parse(get(key) || "null"); } catch (e) {}
    if (c && c.t && Date.now() - c.t < ttl && c.d) { try { okf(c.d); } catch (e) {} return; }
    if (!window.fetch) return;
    var ac = window.AbortController ? new AbortController() : null, tm = setTimeout(function () { if (ac) ac.abort(); }, 8000);
    fetch(url, ac ? { signal: ac.signal } : {}).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
      clearTimeout(tm); okf(d); set(key, JSON.stringify({ t: Date.now(), d: d }));
    }).catch(function () { clearTimeout(tm); });
  }

  var css = "" +
    ".hwf-c{background:var(--card,#141416);border:1px solid var(--line,rgba(255,255,255,.09));border-radius:14px;padding:18px 18px 16px;min-width:0;margin-top:12px}" +
    ".hwf-c:first-of-type{margin-top:0}" +
    ".hwf-t{display:flex;align-items:baseline;justify-content:space-between;gap:10px;font-size:15px;font-weight:700;line-height:1.4}" +
    ".hwf-t small{font-size:12px;font-weight:400;color:var(--dim,#9c968a);white-space:nowrap}" +
    ".hwf-n{font-size:11.5px;line-height:1.6;color:var(--dim,#9c968a);margin-top:12px}.hwf-n a{color:var(--gold2,#e3c88f);text-decoration:underline}" +
    ".hwf-cd{padding:14px 0;border-top:1px solid var(--line,rgba(255,255,255,.09))}.hwf-cds>.hwf-cd:first-child{border-top:0;padding-top:12px}" +
    ".hwf-cdh{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;font-size:14px;line-height:1.45}.hwf-cdh b{font-weight:500;min-width:0;overflow-wrap:anywhere}" +
    ".hwf-d{flex:none;font-size:11.5px;font-weight:700;line-height:1;padding:5px 8px;border-radius:999px;border:1px solid var(--gold,#c8a45c);color:var(--gold2,#e3c88f);letter-spacing:.02em;white-space:nowrap}" +
    ".hwf-d.hot{background:linear-gradient(135deg,#f3d77a,#d4af37);color:#111;border-color:#d4af37}" +
    ".hwf-cdb{display:flex;align-items:center;gap:8px;margin-top:10px;flex-wrap:wrap}" +
    ".hwf-code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:14.5px;letter-spacing:.03em;color:#111;background:linear-gradient(135deg,#f3d77a,#d4af37);padding:7px 12px;border-radius:8px;border:1px dashed #7a5d12;word-break:break-all;min-width:0}" +
    ".hwf-cp{font:inherit;font-size:13px;font-weight:700;color:#d4af37;background:#111;border:1px solid #d4af37;border-radius:8px;padding:0 14px;min-height:36px;cursor:pointer}.hwf-cp.ok{color:#111;background:#d4af37}" +
    ".hwf-cd p{font-size:12px;line-height:1.55;color:var(--dim,#9c968a);margin-top:8px}" +
    ".hwf-lnk{font:inherit;font-size:13px;color:var(--gold2,#e3c88f);background:none;border:0;padding:10px 0 0;cursor:pointer;text-align:left}" +
    ".hwf-fx{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}" +
    ".hwf-fx div{background:var(--card2,#1b1b1f);border-radius:10px;padding:11px 12px;min-width:0}" +
    ".hwf-fx em{display:block;font-style:normal;font-size:11.5px;color:var(--dim,#9c968a);line-height:1.4}" +
    ".hwf-fx b{display:block;font-size:17px;font-weight:700;line-height:1.35;color:var(--gold2,#e3c88f);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}" +
    ".hwf-fx i{display:block;font-style:normal;font-size:11.5px;color:var(--dim,#9c968a);line-height:1.4;font-variant-numeric:tabular-nums}" +
    /* 📷 11/28 계산기 꼴(HWFAV.fx.calc 일 때만 쓰임) */
    ".hwf-big{margin-top:12px;background:var(--card2,#1b1b1f);border-radius:12px;padding:14px}" +
    ".hwf-big b{display:block;font-size:21px;font-weight:700;line-height:1.35;color:var(--gold2,#e3c88f);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}" +
    ".hwf-big i{display:block;font-style:normal;font-size:12.5px;line-height:1.5;color:var(--dim,#9c968a);font-variant-numeric:tabular-nums}" +
    ".hwf-cal{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center;margin-top:12px}" +
    ".hwf-cal label{display:flex;align-items:center;gap:6px;min-width:0;min-height:48px;padding:0 10px;border:1px solid var(--line,rgba(255,255,255,.09));border-radius:10px;background:var(--card,#141416)}" +
    ".hwf-cal label:focus-within{border-color:var(--gold,#c8a45c)}" +
    ".hwf-cal input{flex:1;min-width:0;width:100%;border:0;background:none;color:inherit;font:inherit;font-size:16px;font-weight:700;text-align:right;outline:none;font-variant-numeric:tabular-nums}" +
    ".hwf-cal span{flex:none;font-size:12px;color:var(--dim,#9c968a)}.hwf-cal em{font-style:normal;color:var(--gold2,#e3c88f)}" +
    ".hwf-q{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}" +
    ".hwf-qb{font:inherit;font-size:12.5px;color:var(--gold2,#e3c88f);background:none;border:1px solid var(--line,rgba(255,255,255,.09));border-radius:999px;padding:0 12px;min-height:34px;cursor:pointer}" +
    ".hwf-wx{display:flex;gap:8px;overflow-x:auto;margin:14px -18px 0;padding:0 18px 4px;scrollbar-width:none;-webkit-overflow-scrolling:touch}.hwf-wx::-webkit-scrollbar{display:none}" +
    ".hwf-wx div{flex:none;min-width:86px;background:var(--card2,#1b1b1f);border-radius:10px;padding:10px 12px;text-align:center}" +
    ".hwf-wx em{display:block;font-style:normal;font-size:12px;line-height:1.4;white-space:nowrap}" +
    ".hwf-wx b{display:block;font-size:18px;font-weight:700;line-height:1.4;font-variant-numeric:tabular-nums}.hwf-wx b span{font-size:17px;margin-right:3px}" +
    ".hwf-wx i{display:block;font-style:normal;font-size:11px;color:var(--dim,#9c968a);line-height:1.4;white-space:nowrap}" +
    ".hwf-cw{font-size:12.5px;line-height:1.5;color:var(--dim,#9c968a);margin-top:4px}.hwf-cw b{color:var(--gold2,#e3c88f);font-weight:500}" +
    ".hwf-nw{display:flex;gap:12px;align-items:baseline;width:100%;padding:11px 0;border-top:1px solid var(--line,rgba(255,255,255,.09));font:inherit;font-size:13.5px;line-height:1.5;text-align:left;color:inherit;background:none;border-left:0;border-right:0;border-bottom:0;cursor:default}" +
    ".hwf-nws>.hwf-nw:first-child{border-top:0;margin-top:4px}button.hwf-nw{cursor:pointer}" +
    ".hwf-nw em{flex:none;font-style:normal;font-size:11.5px;color:var(--gold2,#e3c88f);font-variant-numeric:tabular-nums;min-width:42px}.hwf-nw span{min-width:0;overflow-wrap:anywhere;flex:1}.hwf-nw i{font-style:normal;color:var(--gold2,#e3c88f);flex:none}" +
    ".hwf-strip{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:20px;padding:12px 0;border-top:1px solid var(--line,rgba(255,255,255,.09));border-bottom:1px solid var(--line,rgba(255,255,255,.09));font-size:12.5px;color:var(--dim,#9c968a)}" +
    ".hwf-in{font:inherit;font-size:13px;font-weight:700;color:var(--gold2,#e3c88f);background:none;border:1px solid var(--gold,#c8a45c);border-radius:999px;padding:0 14px;min-height:36px;cursor:pointer;white-space:nowrap}" +
    ".hwf-hd{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:-8px 0 14px;font-size:12.5px;color:var(--dim,#9c968a)}" +
    /* 떠 있는 단추 · 안내 판 = 늘 검정+금 (밝은 쪽에서도 눈에 띄게) */
    "#hwfav{position:fixed;right:14px;bottom:72px;z-index:9998;display:flex;align-items:center;font-family:inherit;border-radius:999px;background:linear-gradient(135deg,#f3d77a,#d4af37 55%,#b98f2a);color:#111;box-shadow:0 6px 22px rgba(0,0,0,.42),0 0 0 1px rgba(0,0,0,.25) inset;overflow:hidden}" +
    "#hwfav button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;-webkit-tap-highlight-color:transparent}" +
    "#hwfav .go{display:flex;align-items:center;gap:6px;min-height:46px;padding:0 6px 0 16px;font-size:14.5px;font-weight:700;letter-spacing:.01em;white-space:nowrap}" +
    "#hwfav .go s{text-decoration:none;font-size:17px;line-height:1}" +
    "#hwfav .xx{min-width:34px;min-height:46px;font-size:15px;line-height:1;opacity:.6;padding:0 10px 0 4px}" +
    "#hwfav.min{background:rgba(15,15,18,.86);color:#d4af37;border:1px solid rgba(212,175,55,.6);box-shadow:0 4px 16px rgba(0,0,0,.35);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}" +
    "#hwfav.min .go{padding:0;width:44px;min-height:44px;justify-content:center}#hwfav.min .go b,#hwfav.min .xx{display:none}" +
    "#hwfav::after{content:'';position:absolute;inset:0;background:linear-gradient(100deg,transparent 35%,rgba(255,255,255,.6) 50%,transparent 65%);transform:translateX(-120%);animation:hwfsh 4.2s ease-in-out 1.2s 3;pointer-events:none}#hwfav.min::after{display:none}" +
    "@keyframes hwfsh{0%{transform:translateX(-120%)}35%,100%{transform:translateX(120%)}}" +
    "@media (prefers-reduced-motion:reduce){#hwfav::after{animation:none}}" +
    "#hwfsh{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.62);display:flex;align-items:flex-end;justify-content:center}" +
    "#hwfsh .bx{width:100%;max-width:520px;background:#141416;color:#f3efe6;border:1px solid rgba(212,175,55,.45);border-bottom:0;border-radius:18px 18px 0 0;padding:24px 22px calc(22px + env(safe-area-inset-bottom,0px));font-size:15px;line-height:1.6;max-height:88vh;overflow:auto}" +
    "#hwfsh h4{font-size:19px;line-height:1.35;font-weight:700;color:#e3c88f;margin:0}#hwfsh .bx>p{color:#9c968a;font-size:13.5px;margin-top:6px}" +
    "#hwfsh ol{list-style:none;margin:18px 0 0;padding:0;display:grid;gap:10px}#hwfsh li{display:flex;gap:12px;align-items:center;background:#1b1b1f;border-radius:12px;padding:12px 14px;font-size:14.5px;line-height:1.5}" +
    "#hwfsh li>i{flex:none;font-style:normal;width:26px;height:26px;border-radius:50%;border:1px solid #c8a45c;color:#e3c88f;font-size:13px;display:grid;place-items:center}" +
    "#hwfsh li>span{flex:1;min-width:0}#hwfsh li b{color:#e3c88f;font-weight:700}#hwfsh li svg{flex:none;width:28px;height:28px;color:#e3c88f}" +
    "#hwfsh .app{margin-top:16px;border:1px solid rgba(212,175,55,.45);border-radius:12px;padding:12px 14px;font-size:13.5px;color:#f3efe6}#hwfsh .app b{color:#e3c88f}" +
    "#hwfsh kbd{display:inline-block;font:700 15px/1 ui-monospace,Menlo,Consolas,monospace;color:#111;background:linear-gradient(135deg,#f3d77a,#d4af37);border-radius:7px;padding:7px 10px;margin:0 3px}" +
    "#hwfsh .pc{margin-top:18px;background:#1b1b1f;border-radius:12px;padding:16px 14px;font-size:14.5px;line-height:2}" +
    "#hwfsh .bt{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:18px}#hwfsh .bt button{font:inherit;font-size:14px;font-weight:700;min-height:48px;border-radius:10px;cursor:pointer;border:1px solid #c8a45c;background:none;color:#e3c88f}" +
    "#hwfsh .bt .p{grid-column:1/-1;background:linear-gradient(135deg,#f3d77a,#d4af37);color:#111;border-color:#d4af37}" +
    "@media print{#hwfav,#hwfsh{display:none!important}}";
  var st = D.createElement("style"); st.textContent = css; D.head.appendChild(st);

  /* ───────── ★ 즐겨찾기 ───────── */
  var ua = navigator.userAgent || "", standalone = false, bip = null, pill = null, inl = [];
  try { standalone = (window.matchMedia && (matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: minimal-ui)").matches)) || navigator.standalone === true; } catch (e) {}
  var iOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1), AND = /Android/.test(ua);
  var inApp = /Instagram|FBAN|FBAV|FB_IAB|KAKAOTALK|NAVER\(inapp|Line\/|Barcelona|Threads|DaumApps|everytimeApp|; wv\)/i.test(ua);
  var favOn = !!C.btn && !standalone && get("hw_fav_done") !== "1";
  var SH = '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v14M9.5 7.5 14 3l4.5 4.5M8 12H6.5A1.5 1.5 0 0 0 5 13.5v9A1.5 1.5 0 0 0 6.5 24h15a1.5 1.5 0 0 0 1.5-1.5v-9a1.5 1.5 0 0 0-1.5-1.5H20"/></svg>';
  var PL = '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="4.5" width="19" height="19" rx="4.5"/><path d="M14 9.5v9M9.5 14h9"/></svg>';
  function hideAll() { if (pill) pill.style.display = "none"; inl.forEach(function (b) { b.style.display = "none"; }); }
  function sheet() {
    var old = D.getElementById("hwfsh"); if (old) old.parentNode.removeChild(old);
    var s = el("div"); s.id = "hwfsh"; s.setAttribute("role", "dialog"); s.setAttribute("aria-modal", "true"); s.setAttribute("aria-label", T.sT);
    var h = '<div class="bx"><h4>★ ' + T.sT + '</h4><p>' + T.sP + '</p>';
    if (iOS || AND) {
      if (inApp) h += '<div class="app">' + T.app + '</div>';
      h += '<ol><li><i>1</i><span>' + (iOS ? T.i1 : T.a1) + '</span>' + (iOS ? SH : "") + '</li><li><i>2</i><span>' + (iOS ? T.i2 : T.a2) + '</span>' + PL + '</li><li><i>3</i><span>' + (iOS ? T.i3 : T.a3) + '</span></li></ol>';
    } else {
      h += '<div class="pc">' + T.pc1 + ' <kbd>' + (/Mac/.test(navigator.platform || ua) ? "⌘ + D" : "Ctrl + D") + '</kbd> ' + T.pc2 + '</div>';
    }
    h += '<div class="bt">' + (bip ? '<button type="button" class="p" data-a="inst">' + (iOS || AND ? T.inst : T.pcApp) + '</button>' : "") +
      '<button type="button" data-a="url">' + T.url + '</button><button type="button" data-a="done">' + T.done + '</button><button type="button" class="' + (bip ? "" : "p") + '" data-a="close"' + (bip ? ' style="grid-column:1/-1"' : "") + '>' + T.close + '</button></div></div>';
    s.innerHTML = h;
    function shut() { if (s.parentNode) s.parentNode.removeChild(s); D.removeEventListener("keydown", key); }
    function key(e) { if (e.key === "Escape") shut(); }
    s.addEventListener("click", function (e) {
      if (e.target === s) return shut();
      var b = e.target.closest ? e.target.closest("button[data-a]") : null; if (!b) return;
      var a = b.getAttribute("data-a");
      if (a === "close") shut();
      else if (a === "done") { set("hw_fav_done", "1"); hideAll(); shut(); }
      else if (a === "url") { var u = location.origin + location.pathname; copy(u, function () { b.textContent = T.copied; }); }
      else if (a === "inst" && bip) { shut(); ask(); }
    });
    D.addEventListener("keydown", key);
    D.body.appendChild(s);
  }
  function ask() {
    var p = bip; bip = null;
    try { p.prompt(); if (p.userChoice) p.userChoice.then(function (r) { if (r && r.outcome === "accepted") { set("hw_fav_done", "1"); hideAll(); } }); } catch (e) { sheet(); }
  }
  function favGo() { if (bip && (AND || iOS)) ask(); else sheet(); }
  function mkPill() {
    pill = el("div"); pill.id = "hwfav";
    var go = el("button", "go", "<s>★</s><b>" + T.fav + "</b>"); go.type = "button"; go.setAttribute("aria-label", T.favLong); go.onclick = favGo;
    var xx = el("button", "xx", "✕"); xx.type = "button"; xx.setAttribute("aria-label", T.x);
    xx.onclick = function () { pill.className = "min"; set("hw_fav_min", "1"); };
    pill.appendChild(go); pill.appendChild(xx);
    if (get("hw_fav_min") === "1") pill.className = "min";
    D.body.appendChild(pill);
  }
  function inBtn() { var b = el("button", "hwf-in", "★ " + T.favLong); b.type = "button"; b.onclick = favGo; if (!favOn) b.style.display = "none"; inl.push(b); return b; }
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); bip = e; });
  window.addEventListener("appinstalled", function () { set("hw_fav_done", "1"); hideAll(); });

  /* ───────── 「다시 올 이유」 칸 ───────── */
  function dleft(end) {                     /* 끝나는 날(그날 포함)까지 남은 날 · 지났으면 -1 */
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(end || ""); if (!m) return null;
    var e = new Date(+m[1], +m[2] - 1, +m[3]), n = new Date(); n = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    return Math.round((e - n) / 864e5);
  }
  function codesCard() {
    var live = [];
    (C.codes || []).forEach(function (c) { var n = dleft(c.end); if (c.c && (n === null || n >= 0)) live.push([c, n]); });
    if (!live.length) return null;
    var card = el("div", "hwf-c"), box = el("div", "hwf-cds"), rest = el("div", "hwf-cds");
    card.appendChild(el("div", "hwf-t", esc(T.codes) + "<small>" + live.length + T.n + (C.codes_chk ? " · " + esc(C.codes_chk) : "") + "</small>"));
    live.forEach(function (x, i) {
      var c = x[0], n = x[1], m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(c.end || "");
      var day = m ? (L === "en" ? "until " + (+m[2]) + "/" + (+m[3]) : (+m[2]) + "/" + (+m[3]) + T.until) : T.noend;
      var badge = n === null ? "" : '<span class="hwf-d' + (n <= 7 ? " hot" : "") + '">' + (n === 0 ? T.today : "D-" + n) + "</span>";
      var r = el("div", "hwf-cd", '<div class="hwf-cdh"><b>' + esc(c.t) + "</b>" + badge + '</div><div class="hwf-cdb"><span class="hwf-code">' + esc(c.c) + '</span><button type="button" class="hwf-cp">' + T.copy + "</button></div><p>" + esc((c.cond ? c.cond + " · " : "") + day) + "</p>");
      var b = r.querySelector(".hwf-cp"); b.onclick = function () { copy(c.c, function () { b.textContent = T.copied; b.classList.add("ok"); setTimeout(function () { b.textContent = T.copy; b.classList.remove("ok"); }, 1800); }); };
      (i < 2 ? box : rest).appendChild(r);
    });
    card.appendChild(box);
    if (rest.childNodes.length) {
      rest.style.display = "none"; rest.firstChild.style.borderTop = ""; card.appendChild(rest);
      var mb = el("button", "hwf-lnk", T.more + " (" + rest.childNodes.length + ")  +"); mb.type = "button";
      mb.onclick = function () { rest.style.display = ""; rest.firstChild.style.cssText = "border-top:1px solid var(--line,rgba(255,255,255,.09));padding-top:14px"; mb.style.display = "none"; };
      card.appendChild(mb);
    }
    if (C.codes_go && D.querySelector(C.codes_go)) {
      var g = el("button", "hwf-lnk", T.where + "  ↓"); g.type = "button"; g.style.display = "block";
      g.onclick = function () { var t = D.querySelector(C.codes_go); if (!t) return; if (t.tagName === "DETAILS") t.open = true; try { t.scrollIntoView({ block: "start", behavior: "smooth" }); } catch (e) { t.scrollIntoView(); } };
      card.appendChild(g);
    }
    card.appendChild(el("p", "hwf-n", esc(T.cnote)));
    return card;
  }
  /* 📷 11/28 환율 + 계산기 (HWFAV.fx.calc 일 때만 · 일본 「사진판」) — 칸을 바로 보이고(불러오는 중) · 첫 출처가 안 되면 예비 출처(Frankfurter · 유럽중앙은행 기준값) ·
     둘 다 안 되면 지난번에 받은 값(그렇게 적음) · 그것도 없으면 「못 불러왔다」 + 다시 단추 — 값은 전부 공개 API 에서 온 것만(여기서 숫자를 짓지 않는다) */
  function fxCalc(F) {
    var card = el("div", "hwf-c"), to = F.to || F.list[0][0], tu = F.tounit || F.list[0][5], key = "hw_fx_" + F.base, rate = 0, per = F.list[0][4] || 1;
    var loc = L === "en" ? "en-US" : (L === "ja" ? "ja-JP" : "ko-KR");
    var S1 = '<a href="https://www.exchangerate-api.com" target="_blank" rel="noopener nofollow">Rates By Exchange Rate API</a>';
    var S2 = '<a href="https://frankfurter.dev" target="_blank" rel="noopener nofollow">Frankfurter (ECB)</a>';
    var head = '<div class="hwf-t">' + esc(T.fx) + "<small>" + esc(T.ref) + "</small></div>";
    function fmt(v) { return Math.round(v).toLocaleString(loc); }
    function parse(s) { var v = parseFloat(String(s).replace(/[^0-9.]/g, "")); return isFinite(v) && v > 0 ? v : 0; }
    function when(u) { try { var t = new Date(u * 1000); if (isNaN(t)) return ""; return t.getFullYear() + "." + ("0" + (t.getMonth() + 1)).slice(-2) + "." + ("0" + t.getDate()).slice(-2) + " " + ("0" + t.getHours()).slice(-2) + ":" + ("0" + t.getMinutes()).slice(-2); } catch (e) { return ""; } }
    function fetchJ(url, ok, bad) {
      if (!window.fetch) return bad();
      var ac = window.AbortController ? new AbortController() : null, done = 0, tm = setTimeout(function () { if (ac) ac.abort(); }, 8000);
      fetch(url, ac ? { signal: ac.signal } : {}).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) { clearTimeout(tm); done = 1; ok(d); }).catch(function () { clearTimeout(tm); if (!done) bad(); });
    }
    function draw(r, at, src, old) {
      rate = r;
      var q = "";
      (F.quick || []).forEach(function (a) { q += '<button type="button" class="hwf-qb" data-a="' + (+a) + '">' + fmt(+a) + esc(F.unit) + "</button>"; });
      card.innerHTML = head +
        '<div class="hwf-big"><b>' + fmt(F.amt) + esc(F.unit) + " ≒ " + fmt(F.amt * r) + esc(tu) + "</b><i>" + fmt(per) + esc(tu) + " ≒ " + fmt(per / r) + esc(F.unit) + "</i></div>" +
        '<div class="hwf-cal"><label><input type="text" inputmode="decimal" autocomplete="off" data-s="a" aria-label="' + esc(F.unit) + '"><span>' + esc(F.unit) + "</span></label><em>⇄</em>" +
        '<label><input type="text" inputmode="decimal" autocomplete="off" data-s="b" aria-label="' + esc(tu) + '"><span>' + esc(tu) + "</span></label></div>" +
        (q ? '<div class="hwf-q">' + q + "</div>" : "") +
        '<p class="hwf-n">' + esc(T.fxn) + (at ? " " + T.asof + esc(at) + " ·" : "") + " " + T.src + src + (old ? " · " + esc(T.old) : "") + "</p>";
      var a = card.querySelector('[data-s="a"]'), b = card.querySelector('[data-s="b"]');
      function setA(v) { a.value = v ? fmt(v) : ""; b.value = v ? fmt(v * rate) : ""; }
      a.oninput = function () { var v = parse(a.value); b.value = v ? fmt(v * rate) : ""; };
      b.oninput = function () { var v = parse(b.value); a.value = v ? fmt(v / rate) : ""; };
      a.onblur = function () { var v = parse(a.value); if (v) a.value = fmt(v); };
      b.onblur = function () { var v = parse(b.value); if (v) b.value = fmt(v); };
      [].forEach.call(card.querySelectorAll(".hwf-qb"), function (x) { x.onclick = function () { setA(+x.getAttribute("data-a")); }; });
      setA(+((F.quick || [])[2] || F.amt * 10));
    }
    var c = null;
    try { c = JSON.parse(get(key) || "null"); } catch (e) {}
    var has = c && c.d && c.d.rates && c.d.rates[to] > 0;
    if (has && c.t && Date.now() - c.t < 6 * 36e5) { draw(c.d.rates[to], when(c.d.time_last_update_unix), S1); return card; }
    function fail() {
      if (has) return draw(c.d.rates[to], when(c.d.time_last_update_unix), S1, 1);
      card.innerHTML = head + '<p class="hwf-n">' + esc(T.fail) + "</p>";
      var rb = el("button", "hwf-lnk", esc(T.retry)); rb.type = "button"; rb.onclick = load; card.appendChild(rb);
    }
    function second() {
      fetchJ("https://api.frankfurter.dev/v1/latest?base=" + encodeURIComponent(F.base) + "&symbols=" + encodeURIComponent(to), function (d) {
        if (d && d.rates && d.rates[to] > 0) draw(d.rates[to], String(d.date || "").replace(/-/g, "."), S2); else fail();
      }, fail);
    }
    function load() {
      card.innerHTML = head + '<p class="hwf-n">' + esc(T.load) + "</p>";
      fetchJ("https://open.er-api.com/v6/latest/" + encodeURIComponent(F.base), function (d) {
        if (d && d.result === "success" && d.rates && d.rates[to] > 0) { set(key, JSON.stringify({ t: Date.now(), d: d })); draw(d.rates[to], when(d.time_last_update_unix), S1); } else second();
      }, second);
    }
    load();
    return card;
  }
  function fxCard() {
    var F = C.fx; if (!F || !F.list || !F.list.length) return null;
    if (F.calc) return fxCalc(F);
    var card = el("div", "hwf-c"); card.style.display = "none";
    getJSON("https://open.er-api.com/v6/latest/" + F.base, "hw_fx_" + F.base, 6 * 36e5, function (d) {
      if (!d || d.result !== "success" || !d.rates) return;
      var g = "", k = 0;
      F.list.forEach(function (x) {                /* x = [돈, 이름, 깃발, 큰 쪽 단위(기준 돈), 작은 쪽 단위(그 나라 돈), 그 나라 돈 글자] */
        var r = d.rates[x[0]]; if (!r || !(r > 0)) return;
        g += "<div" + (k++ >= 4 ? ' class="hwf-x" style="display:none"' : "") + "><em>" + esc(x[2] + " " + x[1]) + "</em><b>" + num(F.amt * r) + esc(x[5]) + "</b><i>" + num(x[4]) + esc(x[5]) + " = " + num(x[4] / r) + esc(F.unit) + "</i></div>";
      });
      if (!g) return;
      var when = "";
      try { var t = new Date(d.time_last_update_unix * 1000); when = t.getFullYear() + "." + ("0" + (t.getMonth() + 1)).slice(-2) + "." + ("0" + t.getDate()).slice(-2) + " " + ("0" + t.getHours()).slice(-2) + ":" + ("0" + t.getMinutes()).slice(-2); } catch (e) {}
      card.innerHTML = '<div class="hwf-t">' + esc(T.fx) + "<small>" + esc(F.label) + '</small></div><div class="hwf-fx">' + g + '</div><p class="hwf-n">' + esc(T.fxn) + (when ? " " + T.asof + when + " ·" : "") + " " + T.src + '<a href="https://www.exchangerate-api.com" target="_blank" rel="noopener nofollow">Rates By Exchange Rate API</a></p>';
      if (k > 4) {
        var mb = el("button", "hwf-lnk", T.morefx + " (" + (k - 4) + ")  +"); mb.type = "button";
        mb.onclick = function () { [].forEach.call(card.querySelectorAll(".hwf-x"), function (x) { x.style.display = ""; }); mb.style.display = "none"; };
        card.insertBefore(mb, card.querySelector(".hwf-n"));
      }
      card.style.display = "";
    });
    return card;
  }
  function wtxt(code) {
    var i = code === 0 ? 0 : code === 1 ? 1 : code === 2 ? 2 : code === 3 ? 3 : code <= 48 ? 4 : code <= 57 ? 5 : code <= 67 ? 6 : code <= 77 ? 7 : code <= 82 ? 8 : code <= 86 ? 7 : 9;
    return [["☀️", "🌤", "⛅", "☁️", "🌫", "🌦", "🌧", "❄️", "🌦", "⛈"][i], T.w[i]];
  }
  function wxCard() {
    var W = C.wx; if (!W || !W.length) return null;
    var card = el("div", "hwf-c"); card.style.display = "none";
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + W.map(function (x) { return x.la; }).join(",") + "&longitude=" + W.map(function (x) { return x.lo; }).join(",") +
      "&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto";
    getJSON(url, "hw_wx_" + L + "_" + W.length, 36e5, function (d) {
      var a = Array.isArray(d) ? d : [d], g = "", shown = 0;
      W.forEach(function (x, i) {
        var o = a[i]; if (!o || !o.current || typeof o.current.temperature_2m !== "number") return;
        var w = wtxt(o.current.weather_code), t = Math.round(o.current.temperature_2m), lo = null, hi = null;
        try { lo = Math.round(o.daily.temperature_2m_min[0]); hi = Math.round(o.daily.temperature_2m_max[0]); } catch (e) {}
        if (!x.only) { g += "<div><em>" + esc(x.n) + "</em><b><span>" + w[0] + "</span>" + t + "°</b><i>" + esc(w[1]) + (lo !== null ? " · " + lo + "°/" + hi + "°" : "") + "</i></div>"; shown++; }
        if (x.sel) { try { var h3 = D.querySelector(x.sel); if (h3 && !h3.parentNode.querySelector(".hwf-cw")) { var p = el("p", "hwf-cw", T.now + " " + w[0] + " " + esc(w[1]) + " <b>" + t + "°</b>" + (lo !== null ? " · " + lo + "°/" + hi + "°" : "")); h3.parentNode.insertBefore(p, h3.nextSibling); } } catch (e) {} }
      });
      if (!shown) return;
      card.innerHTML = '<div class="hwf-t">' + esc(T.wx) + "<small>" + esc(T.wxn) + '</small></div><div class="hwf-wx">' + g + '</div><p class="hwf-n">' + T.src + '<a href="https://open-meteo.com/" target="_blank" rel="noopener nofollow">Open-Meteo.com</a> (CC BY 4.0)</p>';
      card.style.display = "";
    });
    return card;
  }
  function newsCard(tag) {
    var N = (C.news || []).filter(function (x) { return !tag || !x.tag || x.tag === tag; }); if (!N.length) return null;
    var card = el("div", "hwf-c"), box = el("div", "hwf-nws");
    card.appendChild(el("div", "hwf-t", esc(T.news)));
    N.forEach(function (x) {
      var can = (x.tab && D.querySelector('.tab[data-t="' + x.tab + '"]')) || (x.go && D.querySelector(x.go));
      var r = el(can ? "button" : "div", "hwf-nw", "<em>" + esc(x.d || "") + "</em><span>" + esc(x.t) + "</span>" + (can ? "<i>→</i>" : ""));
      if (can) { r.type = "button"; r.onclick = function () {
        if (x.tab) { var tb = D.querySelector('.tab[data-t="' + x.tab + '"]'); if (tb) tb.click(); }
        if (x.go) { var t = D.querySelector(x.go); if (t) { if (t.tagName === "DETAILS") t.open = true; try { t.scrollIntoView({ block: "start", behavior: "smooth" }); } catch (e) { t.scrollIntoView(); } } }
      }; }
      box.appendChild(r);
    });
    card.appendChild(box); return card;
  }
  function slot(S) {
    var at = D.querySelector(S.at); if (!at) return;
    var cards = [];
    (S.items || []).forEach(function (k) { var c = k === "codes" ? codesCard() : k === "fx" ? fxCard() : k === "wx" ? wxCard() : k === "news" ? newsCard(S.tag) : null; if (c) cards.push(c); });
    var box;
    if (!cards.length) {                                         /* 자료가 없는 쪽 = 얇은 한 줄(업데이트 날짜 + 즐겨찾기) */
      if (!C.upd && !favOn) return;
      box = el("div", "hwf-strip hwf"); box.appendChild(el("span", "", C.upd ? esc(T.upd + C.upd) : "")); box.appendChild(inBtn());
    } else {
      var lx = C.skin === "lx";
      box = el(lx ? "section" : "div", (lx ? "lx-sec" : "sec") + " hwf");
      box.innerHTML = (lx ? '<span class="lx-eb">' + T.ey + "</span>" : '<p class="ey">' + T.ey + "</p>") + "<h2>" + esc(S.h || T.h) + "<small>" + (C.upd ? esc(T.upd + C.upd) + " · " : "") + esc(C.live || T.live) + "</small></h2>";
      var body = el("div", lx ? "lx-body" : ""); if (lx) body.style.display = "block";
      var hd = el("div", "hwf-hd"); hd.appendChild(el("span", "", "")); hd.appendChild(inBtn()); if (favOn) body.appendChild(hd);
      cards.forEach(function (c) { body.appendChild(c); });
      box.appendChild(body);
    }
    at.parentNode.insertBefore(box, S.pos === "before" ? at : at.nextSibling);
  }
  function start() {
    try { (C.slots || []).forEach(slot); } catch (e) {}
    if (favOn) mkPill();
  }
  if (D.body) start(); else D.addEventListener("DOMContentLoaded", start);
})();
