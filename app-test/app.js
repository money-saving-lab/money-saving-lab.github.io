/* 📱 돈 아끼는 연구소 — data.json(링크페이지.py 가 만듦)을 읽어 화면을 그린다
   ★가격 비교 ✗ · 상품 나열 ✗★ 우리 영상·글 중심 카드만 · 지어낸 숫자 ✗ (기록표 글 그대로)
   저장함(찜)은 이 폰 브라우저에만 (서버 없음) */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var D = null;

  // ── 브라우저 저장 (막혀 있어도 앱은 돈다) ──
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  // ── 어디서 왔나 (?from=) → 클룩 매체 번호 · 한 번 들어온 곳을 기억 ──
  var q = new URLSearchParams(location.search);
  var from = (q.get("from") || "").toLowerCase();
  if (from) save("dal_from", from); else from = load("dal_from", "app");

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function ok(u) { return /^https?:\/\//i.test(String(u || "")); }
  function fix(u) {                                 // 클룩 링크 번호를 들어온 곳 것으로 (없으면 유튜브 번호)
    if (!D || !/klook\.com/i.test(u)) return u;
    var aid = D.클룩번호[D.매체[from]] || D.클룩번호["유튜브"];
    return aid ? u.replace(/([?&]aid=)\d+/, "$1" + aid) : u;
  }
  function link(u, cls, label, ad) {
    var a = el("a", cls); a.href = fix(u); a.target = "_blank"; a.rel = (ad === false ? "" : "sponsored ") + "noopener";
    if (typeof label === "string") a.textContent = label; else a.appendChild(label);
    return a;
  }
  function frag(parts) { var f = document.createDocumentFragment(); parts.forEach(function (p) { if (p) f.appendChild(typeof p === "string" ? document.createTextNode(p) : p); }); return f; }
  function color(c) { return /^#[0-9a-f]{3,8}$/i.test(String(c || "")) ? c : "#8f93a0"; }   // 설정에서 온 색은 # 숫자만
  function via(v) {                                   // 여행사 표시 (이름·색 = data.json · 모르는 곳은 기본 모양)
    var s = el("span", "via"); if (!v || !v.이름) return null;
    var dot = el("i"); dot.style.background = color(v.색); s.appendChild(dot); s.appendChild(document.createTextNode(v.이름)); return s;
  }
  function toast(t) { var x = $("#toast"); x.textContent = t; x.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(function () { x.classList.remove("on"); }, 1800); }
  function day(s) { var m = /^(\d{4})-(\d\d)-(\d\d)/.exec(s || ""); return m ? (+m[2]) + "." + (+m[3]) : ""; }

  var SVG_SAVE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4.6L5 21V4.5a1 1 0 0 1 1-1z"/></svg>';
  var SVG_SHARE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3.5M7.5 8 12 3.5 16.5 8"/><path d="M5 12.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-6.5"/></svg>';

  // ── 저장함 ──
  var saved = load("dal_saved", []);
  function isSaved(id) { return saved.indexOf(id) >= 0; }
  function toggleSave(id, btn) {
    var i = saved.indexOf(id);
    if (i >= 0) saved.splice(i, 1); else saved.unshift(id);
    save("dal_saved", saved);
    document.querySelectorAll('[data-save="' + id + '"]').forEach(function (b) { b.setAttribute("aria-pressed", isSaved(id)); });
    toast(isSaved(id) ? "🔖 저장함에 담았어요" : "저장함에서 뺐어요");
    badge(); if (document.body.dataset.tab === "saved") renderSaved();
  }
  function badge() { var n = saved.filter(function (id) { return byId[id]; }).length, b = $("#savedN"); b.hidden = !n; b.textContent = n; }

  function tools(id, title, url) {
    var w = el("div", "tools");
    var s = el("button"); s.type = "button"; s.dataset.save = id; s.setAttribute("aria-pressed", isSaved(id)); s.setAttribute("aria-label", "저장");
    s.innerHTML = SVG_SAVE;                           // 고정 그림(데이터 아님)
    s.onclick = function () { toggleSave(id, s); };
    var sh = el("button"); sh.type = "button"; sh.setAttribute("aria-label", "공유"); sh.innerHTML = SVG_SHARE;
    sh.onclick = function () { share(title, url); };
    w.appendChild(sh); w.appendChild(s); return w;
  }
  function share(title, url) {
    var u = ok(url) ? url : location.origin + location.pathname;
    if (navigator.share) { navigator.share({ title: title, url: u }).catch(function () {}); return; }
    (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { toast("✓ 복사됨"); }, function () { toast("복사를 못 했어요"); });
  }

  // ── 카드: 여행 영상 ──
  function travelCard(v) {
    var c = el("article", "card"); c.dataset.k = (v.찾기 + " " + v.제목).toLowerCase();
    var top = el("div", "top");
    top.appendChild(el("span", "tag", v.국기 + " " + v.보임));
    if (day(v.날짜)) top.appendChild(el("span", "date", day(v.날짜)));
    c.appendChild(top); c.appendChild(tools(v.id, v.제목, v.영상));
    c.appendChild(el("p", "t", v.제목));
    var r1 = el("div", "row");
    if (ok(v.영상)) r1.appendChild(link(v.영상, "chip yt", "▶ 영상 보기", false));
    if (ok(v.블로그)) r1.appendChild(link(v.블로그, "chip", "📝 정리 글", false));
    if (r1.children.length) c.appendChild(r1);
    if (v.주 && ok(v.주.주소)) {
      var r2 = el("div", "row"); r2.appendChild(link(v.주.주소, "go", frag([el("span", "", v.주.이름), el("span", "go-r", (v.주.여행사 && v.주.여행사.이름 ? v.주.여행사.이름 + " " : "") + "›")]))); c.appendChild(r2);
    }
    var sub = (v.보조 || []).filter(function (b) { return ok(b.주소); });
    if (sub.length) { var r3 = el("div", "row"); sub.forEach(function (b) { r3.appendChild(link(b.주소, "chip", b.이름)); }); c.appendChild(r3); }
    return c;
  }
  // ── 카드: 꿀템 (영상 한 편 = 카드 한 장 · 쇼핑몰식 나열 ✗) ──
  function kkulCard(x) {
    var c = el("article", "card"); c.dataset.k = (x.이름 + " " + x.한마디 + " " + x.제목).toLowerCase();
    var top = el("div", "kk"), ic = el("span", "ic", x.아이콘 || "🧺"), tx = el("div");
    tx.appendChild(el("b", "", x.이름));
    if (x.한마디) tx.appendChild(el("span", "hook", "“" + x.한마디 + "”"));
    if (x.제목 && x.제목 !== x.한마디) tx.appendChild(el("small", "", x.제목));
    top.appendChild(ic); top.appendChild(tx); c.appendChild(top);
    c.appendChild(tools(x.id, x.이름, x.영상));
    var r = el("div", "row");
    if (ok(x.영상)) r.appendChild(link(x.영상, "chip yt", "▶ 영상 보기", false)); else r.appendChild(el("span", "chip dim", "🎬 영상 곧 공개"));
    if (ok(x.블로그)) r.appendChild(link(x.블로그, "chip", "📝 정리 글", false));
    c.appendChild(r);
    if (ok(x.쿠팡)) { var r2 = el("div", "row"); r2.appendChild(link(x.쿠팡, "go", frag([el("span", "", "🛒 쿠팡에서 " + x.이름 + " 보기"), el("span", "", "›")]))); c.appendChild(r2); }
    return c;
  }

  var byId = {};
  function renderTravel() {
    var box = $("#travelCards"); box.textContent = "";
    D.영상.forEach(function (v) { box.appendChild(travelCard(v)); });
    if (!D.영상.length) box.appendChild(frag([emptyBox("영상이 올라오면 여기에 쌓여요", "영상에 나온 여행지의 최저가 링크가 저절로 생겨요")]));
    $("#cntTravel").textContent = D.영상.length ? D.영상.length + "편" : "";
    var ds = $("#dests"); ds.textContent = "";
    var groups = {};
    D.여행지.forEach(function (d) { (groups[d.묶음] = groups[d.묶음] || []).push(d); });
    Object.keys(groups).forEach(function (g) {
      var w = el("div", "group"); w.dataset.g = "1"; w.appendChild(el("h3", "", g));
      var l = el("div", "dests");
      groups[g].forEach(function (d) {
        var a = link(d.주소, "dest", frag([el("span", "fl", d.국기), d.보임])); a.dataset.k = d.찾기.toLowerCase(); l.appendChild(a);
      });
      w.appendChild(l); ds.appendChild(w);
    });
    var none = el("p", "none", "찾는 여행지가 아직 없어요. 곧 더할게요!"); none.id = "noneTravel"; none.hidden = true; ds.appendChild(none);
    var qk = $("#quick"); qk.textContent = "";
    D.바로가기.forEach(function (b) {
      qk.appendChild(link(b.주소, "q", frag([el("span", "ic", b.아이콘 || "🔗"), el("b", "", b.이름), el("small", "", b.말), via(b.여행사)])));
    });
    var pr = $("#prep"); pr.textContent = "";
    if (D.준비물 && (ok(D.준비물.쿠팡) || ok(D.준비물.네이버))) {
      pr.appendChild(el("h2", "", "여행 준비물"));
      var p = el("div", "prep"), h = el("div", "prep-h"), t = el("span");
      h.appendChild(el("span", "ic", "🧳")); t.appendChild(el("b", "", "여행 준비물 모음")); t.appendChild(el("small", "", "캐리어 · 멀티 어댑터 · 목베개 · 파우치")); h.appendChild(t);
      var duo = el("div", "duo");
      if (ok(D.준비물.쿠팡)) duo.appendChild(link(D.준비물.쿠팡, "shop cp", "🟠 쿠팡에서 보기 ›"));
      if (ok(D.준비물.네이버)) duo.appendChild(link(D.준비물.네이버, "shop nv", "🟢 네이버에서 보기 ›"));
      p.appendChild(h); p.appendChild(duo); pr.appendChild(p);
    }
  }
  function renderKkul() {
    var box = $("#kkulCards"); box.textContent = "";
    D.꿀템.forEach(function (x) { box.appendChild(kkulCard(x)); });
    if (!D.꿀템.length) box.appendChild(emptyBox("절약 꿀템, 곧 여기에 쌓여요", "전기요금·물값·장보기 돈을 아껴 주는 생활 꿀템을 근거 있는 숫자로만 골라 소개할게요"));
    $("#cntKkul").textContent = D.꿀템.length ? D.꿀템.length + "편" : "";
  }
  function renderSaved() {
    var box = $("#savedCards"); box.textContent = "";
    var list = saved.map(function (id) { return byId[id]; }).filter(Boolean);
    list.forEach(function (it) { box.appendChild(it.kind === "t" ? travelCard(it.v) : kkulCard(it.v)); });
    if (!list.length) box.appendChild(emptyBox("아직 저장한 게 없어요", "카드 오른쪽 위 🔖 를 누르면 여기에 모여요"));
  }
  function emptyBox(b, s) { var e = el("div", "empty"); e.appendChild(el("b", "", b)); e.appendChild(document.createTextNode(s)); return e; }

  function filter(input, box, extra) {
    var w = input.value.trim().toLowerCase(), n = 0;
    box.querySelectorAll(".card").forEach(function (c) { var hit = !w || c.dataset.k.indexOf(w) >= 0; c.hidden = !hit; if (hit) n++; });
    if (extra) extra(w);
    return n;
  }

  function render() {
    byId = {};
    D.영상.forEach(function (v) { byId[v.id] = { kind: "t", v: v }; });
    D.꿀템.forEach(function (x) { byId[x.id] = { kind: "k", v: x }; });
    var nt = $("#notice"); nt.textContent = "";
    (D.안내 || []).forEach(function (t) { nt.appendChild(el("p", "", t)); });
    renderTravel(); renderKkul(); renderSaved(); badge();
    var chs = $("#chs"); chs.textContent = "";
    (D.채널 || []).forEach(function (c) { if (ok(c.주소)) chs.appendChild(link(c.주소, "ch", frag([el("span", "", c.아이콘), c.이름]), false)); });
    $("#foot").textContent = "💰 돈 아끼는 연구소 · " + (D.갱신 || "") + " 갱신";
  }

  // ── 탭 ──
  var subs = { travel: "여행 최저가", kkul: "절약 꿀템", saved: "저장함" };
  function show(t, push) {
    if (!subs[t]) t = "travel";
    document.body.dataset.tab = t;
    document.querySelectorAll(".tabs button").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.t === t); });
    $("#sub").textContent = "돈 아끼는 " + subs[t];
    if (t === "saved" && D) renderSaved();
    if (push) { history.replaceState(null, "", location.pathname + location.search + "#" + t); scrollTo(0, 0); }
  }
  document.querySelectorAll(".tabs button").forEach(function (b) { b.onclick = function () { show(b.dataset.t, true); }; });
  var first = location.hash.slice(1) || (from.indexOf("kkul") === 0 ? "kkul" : "travel");
  show(first, false);
  addEventListener("hashchange", function () { show(location.hash.slice(1), false); });   // 앱 바로가기(#kkul·#saved)로 열릴 때

  $("#findTravel").addEventListener("input", function () {
    var inp = this;
    filter(inp, $("#travelCards"), function (w) {
      var n = 0;
      document.querySelectorAll(".dest").forEach(function (d) { var hit = !w || d.dataset.k.indexOf(w) >= 0; d.hidden = !hit; if (hit) n++; });
      document.querySelectorAll("[data-g]").forEach(function (g) { g.hidden = !g.querySelector(".dest:not([hidden])"); });
      var none = $("#noneTravel"); if (none) none.hidden = n > 0;
    });
  });
  $("#findKkul").addEventListener("input", function () { filter(this, $("#kkulCards")); });

  // ── 데이터 (서비스 워커가 새 것 먼저 · 끊기면 저장본) ──
  function start() {
    fetch("data.json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) { D = d; render(); })
      .catch(function () {
        var nt = $("#notice"); nt.textContent = "";
        nt.appendChild(el("p", "", "목록을 불러오지 못했어요. 인터넷에 연결되면 다시 열어 주세요."));
      });
  }
  start();

  // ── 오프라인 표시 ──
  function net() { $("#offline").hidden = navigator.onLine !== false; }
  addEventListener("online", net); addEventListener("offline", net); net();

  // ── 앱 설치 (안드로이드 크롬 = beforeinstallprompt) ──
  var standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  var deferred = null, btn = $("#install");
  if (!standalone) btn.hidden = false;
  addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferred = e; btn.hidden = false; });
  addEventListener("appinstalled", function () { btn.hidden = true; deferred = null; toast("✓ 홈 화면에 설치됐어요"); });
  btn.onclick = function () {
    if (deferred) { deferred.prompt(); deferred.userChoice.then(function () { deferred = null; }); return; }
    $("#sheet").hidden = false;
  };
  $("#sheetClose").onclick = function () { $("#sheet").hidden = true; };
  $("#sheet").onclick = function (e) { if (e.target === this) this.hidden = true; };

  // ── 서비스 워커 ──
  if ("serviceWorker" in navigator) {
    addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }
})();
