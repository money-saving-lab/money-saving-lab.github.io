// 🎬 HW 작업실 첫 화면 = 숏츠 (11/22 사장님 「첫 페이지에 바로 숏츠 · 채널마다 구글 드라이브 폴더 · 메인폰은 다 · 채널 폰은 그 담당만」)
//  ./?k=<모두비밀>  = 메인폰: 채널 넷 전부 (all.json)
//  ./?k=<채널 비밀> = 채널 폰: 그 채널만 (list.json)
//  열쇠는 이 폰에 기억(홈 화면 앱으로 열어도 그대로) · 글은 깃허브 cp 가지 · 영상은 그 채널 구글 드라이브 폴더
//  올릴 곳 = 유튜브 · 클립 · 인스타 · 틱톡 (곳마다 복사 글 · 커버 ✗)
(function () {
  var REPO = "money-saving-lab/money-saving-lab.github.io", BR = "cp";
  var 곳들 = ["유튜브", "클립", "인스타", "틱톡"];
  var 아이폰 = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  function 기억(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function raw(p) { return "https://raw.githubusercontent.com/" + REPO + "/" + BR + "/" + p + "?t=" + Date.now(); }
  function el(태그, 반, 글) { var e = document.createElement(태그); if (반) e.className = 반; if (글 != null) e.textContent = 글; return e; }

  // 11/22 사장님 「메인폰은 어디를 열든 상관없게」 → 메인(모두) 링크를 한 번 연 폰은 「메인」 으로 굳음 →
  //   그 뒤 채널 링크를 열어도 늘 네 채널 전부 (열쇠 값은 이 파일에 안 박음 · 그 폰 기억에만)
  function 열쇠() {
    var m = location.search.match(/[?&]k=([a-f0-9]{8,64})/);
    // 11/22 아이폰 = 홈 화면 앱이 사파리와 기억을 따로 씀 → 주소에 열쇠를 남기고 manifest 를 떼어 「홈 화면에 추가」 가 지금 주소(열쇠 든)로 깔리게
    if (m && 아이폰 && 기억("hw_os_main") == null) {
      var 링 = document.querySelector('link[rel="manifest"]'); if (링) 링.remove();
      var 메 = document.createElement("meta"); 메.name = "apple-mobile-web-app-capable"; 메.content = "yes"; document.head.appendChild(메);
      try { history.replaceState(null, "", "./?app=hwwork2&k=" + m[1]); } catch (e) {}
    } else if (m) try { history.replaceState(null, "", "./?app=hwwork2"); } catch (e) {}
    var 메인 = 기억("hw_os_main");
    if (메인) return 메인;
    if (m) 기억("hw_os_key", m[1]);
    return (m && m[1]) || 기억("hw_os_key") || "";
  }
  // 11/22 사장님 「아이콘은 각각의 채널명이 들어가게」 → 채널 폰은 그 채널 아이콘·이름으로 깔림(메인폰은 기존 HW 작업실 그대로)
  function 채널얼굴(코드, 이름) {
    if (!/^[a-z0-9_]+$/.test(코드)) return;
    document.title = 이름;
    var t = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (!t) { t = document.createElement("meta"); t.name = "apple-mobile-web-app-title"; document.head.appendChild(t); }
    t.content = 이름;
    var a = document.querySelector('link[rel="apple-touch-icon"]'); if (a) a.href = "icons/ch/" + 코드 + "-180.png";
    var f = document.querySelector('link[rel="icon"]'); if (f) f.href = "icons/ch/" + 코드 + "-192.png";
    var m = document.querySelector('link[rel="manifest"]'); if (m) m.href = "m/" + 코드 + ".webmanifest";
  }
  function 메인으로(k) { 기억("hw_os_main", k); }

  function 복사(글, m) {
    function 됨() { m.textContent = "복사했어요 ✓"; m.className = "os-msg ok"; }
    function 옛() {
      var t = document.createElement("textarea"); t.value = 글; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select(); t.setSelectionRange(0, 글.length);
      var ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
      t.remove(); if (ok) 됨(); else { m.textContent = "길게 눌러 복사해 주세요"; m.className = "os-msg"; }
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(글).then(됨, 옛); else 옛();
  }

  // ── 곳마다 글 (해시태그는 설명 끝 한 줄 · 유튜브 태그 칸은 쉼표 · #shorts 는 태그 칸에서 뺌) ──
  function 태그들(p) {
    var 본 = {};
    return (p.해시태그 || []).map(function (t) { return "#" + String(t).replace(/^#+/, "").trim(); })
      .filter(function (t) { if (t.length < 2 || 본[t]) return false; 본[t] = 1; return true; });
  }
  function 본문(p) {
    return String(p.설명 || "").split("\n").filter(function (줄) {
      var s = 줄.trim(); return !(s && /^(#\S+\s*)+$/.test(s));          // 해시태그만 있는 줄은 빼고 끝에 한 번만
    }).join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  function 제목들(p) { var a = (p.제목후보 && p.제목후보.length ? p.제목후보 : [p.제목]).filter(Boolean); return a.length ? a : [""]; }
  function 글들(p, 곳) {
    var t = 태그들(p), 해 = t.join(" "), 본 = 본문(p), 제 = 제목들(p);
    var 붙 = function (a) { return a.filter(Boolean).join("\n\n"); };
    if (곳 === "유튜브") {
      var r = 제.map(function (x, i) { return [제.length > 1 ? "제목 " + (i + 1) : "제목", x]; });
      r.push(["설명 (해시태그 포함)", 붙([본, 해])]);
      r.push(["태그 (쉼표)", t.map(function (x) { return x.slice(1); }).filter(function (x) { return !/^(shorts|쇼츠)$/i.test(x); }).join(", ")]);
      r.push(["고정 댓글", p.고정댓글]);
      return r;
    }
    // 유튜브 말고는 #shorts 가 쓸모없음 → 제목·해시태그에서 뺌
    var 쇼 = /^#(shorts|쇼츠|숏츠)$/i;
    t = t.filter(function (x) { return !쇼.test(x); }); 해 = t.join(" ");
    제 = 제.map(function (x) { return String(x).replace(/\s*#(shorts|쇼츠|숏츠)/gi, "").trim(); });
    if (곳 === "클립") return [["제목", 제[0]], ["설명 (해시태그 포함)", 붙([본, 해])], ["해시태그만", 해]];
    if (곳 === "인스타") return [["캡션 (제목 + 설명 + 해시태그)", 붙([제[0], 본, 해])], ["첫 댓글", p.고정댓글]];
    return [["설명 (제목 + 설명 + 해시태그)", 붙([제[0], 본, 해])], ["고정 댓글", p.고정댓글]];   // 틱톡
  }

  function 올렸나(id, 곳, v) { var k = "hw_os_done_" + id + "_" + 곳; if (v === undefined) return 기억(k) === "1"; 기억(k, v ? "1" : "0"); }
  var 고른곳 = {};

  function 편카드(p, 채널) {
    var c = el("div", "os-card");
    var 위 = el("div", "os-meta");
    위.appendChild(el("span", "os-pill", p.올릴날 ? "올릴 날 " + p.올릴날.slice(5).replace("-", "/") : "새 편"));
    var 된 = 곳들.filter(function (g) { return 올렸나(p.id, g); }).length;
    위.appendChild(el("span", "os-pill" + (된 === 곳들.length ? " ok" : ""), "올림 " + 된 + "/" + 곳들.length));
    c.appendChild(위);
    c.appendChild(el("div", "os-title", 제목들(p)[0]));
    var 받 = el("a", "os-big", "📂 드라이브에서 영상 받기");
    받.href = 채널.폴더링크 || "#"; 받.target = "_blank"; 받.rel = "noopener";
    c.appendChild(받);
    c.appendChild(el("div", "os-sub", "파일 이름: " + (p.파일 || "") + (아이폰 ? " · 다운로드 → 파일 앱 → 공유 → 비디오 저장" : " · 다운로드 → 갤러리")));
    var 지금 = 고른곳[p.id] || 곳들.filter(function (g) { return !올렸나(p.id, g); })[0] || 곳들[0];
    var 탭 = el("div", "os-tabs");
    곳들.forEach(function (g) {
      var b = el("button", "os-tab" + (g === 지금 ? " on" : ""), g + (올렸나(p.id, g) ? " ✓" : ""));
      b.type = "button"; b.onclick = function () { 고른곳[p.id] = g; 다시(); };
      탭.appendChild(b);
    });
    c.appendChild(탭);
    글들(p, 지금).forEach(function (x) {
      if (!x[1]) return;
      var b = el("button", "os-copy"); b.type = "button";
      b.appendChild(el("b", null, "복사")); b.appendChild(document.createTextNode(x[0]));
      var 보기 = el("div", "os-txt", x[1]), m = el("div", "os-msg");
      b.onclick = function () { 복사(x[1], m); };
      c.appendChild(b); c.appendChild(보기); c.appendChild(m);
    });
    if (지금 === "유튜브" && p.사운드검색어) c.appendChild(el("div", "os-sub", "🎵 유튜브 앱 사운드 검색어: " + p.사운드검색어));
    var 끝 = el("button", "os-done", 올렸나(p.id, 지금) ? "↩ " + 지금 + " 「올림」 지우기" : "✅ " + 지금 + "에 올렸어요");
    끝.type = "button"; 끝.onclick = function () { 올렸나(p.id, 지금, !올렸나(p.id, 지금)); 다시(); };
    c.appendChild(끝);
    return c;
  }

  function 채널칸(ch, 하나만) {
    var s = el("section", "os-ch");
    var h = el("div", "os-chhead");
    var 이름 = el("div", "os-chname", ch.채널 || ch.코드 || "채널");
    var 곁 = el("div", "os-sub", [ch.결, ch.폰, "영상 " + (ch.편 || []).length + "편"].filter(Boolean).join(" · "));
    var 왼 = el("div"); 왼.appendChild(이름); 왼.appendChild(곁);
    h.appendChild(왼);
    if (ch.폴더링크) { var f = el("a", "os-folder", "📂 폴더"); f.href = ch.폴더링크; f.target = "_blank"; f.rel = "noopener"; h.appendChild(f); }
    s.appendChild(h);
    var 편들 = ch.편 || [];
    if (!편들.length) s.appendChild(el("div", "os-empty", "지금 올릴 영상이 없어요"));
    편들.forEach(function (p) { s.appendChild(편카드(p, ch)); });
    return s;
  }

  var 자료 = null, 판 = null, 하나 = false;
  function 다시() {
    var y = window.scrollY;
    판.innerHTML = "";
    var 채널들 = 하나 ? [자료] : (자료.채널들 || []);
    if (!하나) {
      var 줄 = el("div", "os-jump");
      채널들.forEach(function (ch, i) {
        var a = el("a", "os-chip", (ch.채널 || ch.코드) + " " + (ch.편 || []).length); a.href = "#os-ch-" + i; 줄.appendChild(a);
      });
      판.appendChild(줄);
    }
    채널들.forEach(function (ch, i) { var s = 채널칸(ch, 하나); s.id = "os-ch-" + i; 판.appendChild(s); });
    window.scrollTo(0, y);
  }

  window.HW숏츠 = {
    열쇠: 열쇠,
    열기: function (k, 판칸, 머리) {
      판 = 판칸;
      판.innerHTML = '<div class="os-empty">불러오는 중…</div>';
      // 메인폰 열쇠면 all.json · 아니면 그 채널 list.json
      fetch(raw(k + "/all.json")).then(function (r) {
        if (r.ok) return r.json().then(function (d) { 하나 = false; 메인으로(k); return d; });   // 모두 열쇠 = 이 폰은 메인으로 굳힘
        return fetch(raw(k + "/list.json")).then(function (r2) { if (!r2.ok) throw new Error(r2.status); 하나 = true; return r2.json(); });
      }).then(function (d) {
        자료 = d;
        if (하나 && d.코드) 채널얼굴(d.코드, d.채널 || "채널");
        if (머리) 머리(하나 ? (d.채널 || "채널") : "숏츠 · 채널 " + (d.채널들 || []).length + "개", 하나);
        다시();
      }).catch(function () { 판.innerHTML = '<div class="os-empty">목록을 못 불러왔어요 — 잠시 뒤 다시 열어 주세요</div>'; });
    }
  };
})();
