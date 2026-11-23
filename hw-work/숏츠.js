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

  function 눌림(b, 글) {                                // 11/23 사장님 「복사 누를 때 누르는 느낌 · 밋밋해」 = 떨림 + 초록 번쩍 + 단추 글자
    try { if (navigator.vibrate) navigator.vibrate(35); } catch (e) {}
    if (!b) return;
    var 옛 = b.getAttribute("data-old");
    if (옛 == null) { 옛 = b.innerHTML; b.setAttribute("data-old", 옛); }
    b.classList.remove("hw-hit"); void b.offsetWidth; b.classList.add("hw-hit");
    b.innerHTML = 글 || "✓ 복사됨!";
    clearTimeout(b._hwT);
    b._hwT = setTimeout(function () { b.classList.remove("hw-hit"); b.innerHTML = b.getAttribute("data-old"); b.removeAttribute("data-old"); }, 1100);
  }
  function 복사(글, m, 단추) {
    function 됨() { m.textContent = "복사했어요 ✓ 붙여 넣으세요"; m.className = (m.className.indexOf("mu-ok") >= 0 ? "mu-ok" : "os-msg ok"); 눌림(단추); }
    function 옛() {
      var t = document.createElement("textarea"); t.value = 글; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select(); t.setSelectionRange(0, 글.length);
      var ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
      t.remove(); if (ok) 됨(); else { m.textContent = "길게 눌러 복사해 주세요"; m.className = "os-msg"; }   // 실패해도 누른 느낌(떨림·톡)은 위에서 이미 줌
    }
    if (단추) { try { if (navigator.vibrate) navigator.vibrate(20); } catch (e) {} 단추.classList.remove("hw-tap"); void 단추.offsetWidth; 단추.classList.add("hw-tap"); }   // 누르는 그 순간 톡
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
      var s = 줄.trim(); return !(s && (/^(#\S+\s*)+$/.test(s) || /^(원본|元動画|出典|출처)\s*[:：]/.test(s)));   // 해시태그만 있는 줄(끝에 한 번만) · 원본 출처 줄(11/22 사장님 「해짜들 안 씀 → 우리도 안 씀」) 뺌
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

  // ③ 올림 모아 보기(11/22) — 누르면 이 폰에 기억 + ntfy 로 알림(로그인 ✗) → 메인폰이 바로 모아 봄 · PC 가 10분마다 목록에 새김
  var 편표 = {}, 채널표 = {};
  function 올렸나(id, 곳, v) {
    var k = "hw_os_done_" + id + "_" + 곳, p = 편표[id];
    if (v === undefined) return 기억(k) === "1" || !!(p && p.올림 && p.올림[곳]);
    기억(k, v ? "1" : "0");
    if (p) { p.올림 = p.올림 || {}; if (v) p.올림[곳] = 지금때(); else delete p.올림[곳]; }
    var ch = 채널표[id];
    if (ch && ch.알림) try { fetch("https://ntfy.sh/" + ch.알림, { method: "POST", body: "up " + id + " " + 곳 + " " + (v ? 1 : 0) }); } catch (e) {}
  }
  var 보고통로 = "hwreport787ad204254be5bece2a";        // 11/23 사장님 「올리고 보고하기 단추 · 나한테 알림 오게」 = 사장님 폰이 https://ntfy.sh/<이 통로> 구독
  function 보고(p, 곳) {
    var ch = 채널표[p.id] || 자료 || {};
    var 제 = (제목들(p)[0] || "").slice(0, 80);
    var 주 = "https://ntfy.sh/" + 보고통로 + "?title=" + encodeURIComponent("📤 " + (ch.채널 || ch.코드 || "채널") + " · " + 곳 + " 올림") + "&tags=outbox_tray";
    try { fetch(주, { method: "POST", body: 제 + " (" + 지금때() + ")" }); } catch (e) {}
  }
  function 지금때() { var d = new Date(), z = function (n) { return (n < 10 ? "0" : "") + n; }; return z(d.getMonth() + 1) + "/" + z(d.getDate()) + " " + z(d.getHours()) + ":" + z(d.getMinutes()); }
  function 새신호(채널들, 끝) {                        // 메인폰 = PC 를 기다리지 않고 ntfy 에서 바로 읽음(12시간 안)
    var 남 = 채널들.filter(function (c) { return c.알림; });
    if (!남.length) return 끝();
    var n = 남.length;
    남.forEach(function (c) {
      fetch("https://ntfy.sh/" + c.알림 + "/json?poll=1&since=12h").then(function (r) { return r.text(); }).then(function (t) {
        t.split("\n").forEach(function (줄) {
          try {
            var j = JSON.parse(줄), m = String(j.message || "").split(" ");
            if (m.length !== 4 || m[0] !== "up" || !편표[m[1]]) return;
            var p = 편표[m[1]]; p.올림 = p.올림 || {};
            if (m[3] === "1") { var d = new Date(j.time * 1000), z = function (x) { return (x < 10 ? "0" : "") + x; };
              p.올림[m[2]] = z(d.getMonth() + 1) + "/" + z(d.getDate()) + " " + z(d.getHours()) + ":" + z(d.getMinutes()); }
            else delete p.올림[m[2]];
          } catch (e) {}
        });
      }).catch(function () {}).then(function () { if (--n === 0) 끝(); });
    });
  }
  var 고른곳 = {};
  // 11/22 사장님: 원본이 틱톡 소재인 편 = 「틱톡 소재」 표시 · 틱톡 칸 뺌(원본과 겹침)
  function 틱톡소재(p) { return !!(p && (p.틱톡소재 || p.원본곳 === "틱톡")); }
  function 그곳들(p) { var 바탕 = (p && p.곳들 && p.곳들.length) ? 곳들.filter(function (g) { return p.곳들.indexOf(g) >= 0; }) : 곳들; return 틱톡소재(p) ? 바탕.filter(function (g) { return g !== "틱톡"; }) : 바탕; }   // 11/23 채널마다 올릴 곳

  // 11/22 사장님 「배경음악 설명은 폰 앱에서 보이게」 = 올리기.json 「배경음악」(한판이 넣음) · 없으면 칸 감춤
  function 음악칸(c, p) {
    var m = p && p.배경음악;
    if (!m || typeof m !== "object") return;
    var 유 = (m.유튜브 || []).slice(0, 3), 틱 = 틱톡소재(p) ? [] : (m.틱톡 || []).slice(0, 3), 원 = m.원본 || null;
    if (!m.한줄 && !유.length && !틱.length && !원) return;
    if (!document.getElementById("os-music-css")) {       // 11/22 사장님 「업로드할 때 잘 읽을 수 있게」 = 크게 · 곡마다 카드 · 숫자 색 · 1번 추천 크게 · 큰 복사 단추 · 색은 직접 정해 밝은·어두운 화면 둘 다
      var st = document.createElement("style"); st.id = "os-music-css";
      st.textContent =
        ".mu{border:2px solid #F2BE48;border-radius:16px;padding:14px 13px;margin:14px 0 8px;background:#14141a;color:#ffffff;color-scheme:dark}" +
        ".mu-h{font-size:19px;font-weight:900;color:#F2BE48;margin-bottom:6px}" +
        ".mu-one{font-size:17px;font-weight:700;line-height:1.55;color:#ffffff;margin-bottom:10px}" +
        ".mu-sec{font-size:15px;font-weight:800;color:#FFDE8C;margin:16px 0 8px}" +
        ".mu-card{background:#24242c;border:1px solid #3a3a46;border-radius:14px;padding:13px 13px 12px;margin:0 0 12px}" +
        ".mu-card.top{background:#2b2410;border:2px solid #F2BE48;padding:16px 14px 14px}" +
        ".mu-tag{display:inline-block;background:#F2BE48;color:#1a1204;font-weight:900;font-size:13px;border-radius:8px;padding:3px 9px;margin-bottom:8px}" +
        ".mu-song{font-size:18px;font-weight:900;line-height:1.4;color:#ffffff;word-break:keep-all}" +
        ".mu-card.top .mu-song{font-size:22px}" +
        ".mu-artist{font-size:15.5px;color:#d8d8e0;margin-top:3px}" +
        ".mu-vol{display:inline-block;margin-top:8px;background:#3DDC84;color:#062b14;font-weight:900;font-size:15px;border-radius:8px;padding:4px 10px}" +
        ".mu-why{font-size:14.5px;line-height:1.6;color:#c4c4cc;margin-top:8px}" +
        ".mu-copy{display:block;width:100%;min-height:52px;margin-top:11px;border:0;border-radius:12px;background:#F2BE48;color:#1a1204;font:inherit;font-size:17px;font-weight:900;cursor:pointer}" +
        ".mu-ok{font-size:14px;color:#3DDC84;min-height:1em;margin-top:5px;text-align:center}" +
        ".mu-orig{font-size:14px;line-height:1.6;color:#b8b8c2;border-top:1px solid #33333c;margin-top:6px;padding-top:10px}" +
        ".mu-orig b{color:#3DDC84}";
      document.head.appendChild(st);
    }
    var 상 = el("div", "mu");
    상.appendChild(el("div", "mu-h", "🎵 배경음악"));
    if (m.한줄) 상.appendChild(el("div", "mu-one", m.한줄));
    function 줄들(머리, 목록) {
      목록 = 목록.filter(function (x) { return x && String(x.곡 || "").trim(); });
      if (!목록.length) return;
      상.appendChild(el("div", "mu-sec", 머리));
      목록.forEach(function (x, i) {
        var 곡 = String(x.곡).trim();
        var 카 = el("div", "mu-card" + (i === 0 ? " top" : ""));
        if (i === 0) 카.appendChild(el("div", "mu-tag", "⭐ 추천 1번"));
        else 카.appendChild(el("div", "mu-sec", (i + 1) + "번")).style.margin = "0 0 4px";
        카.appendChild(el("div", "mu-song", 곡));
        if (x.가수) 카.appendChild(el("div", "mu-artist", x.가수));
        if (x.크기퍼센트 != null) 카.appendChild(el("div", "mu-vol", "음악 크기 " + x.크기퍼센트 + "%"));
        if (x.까닭) 카.appendChild(el("div", "mu-why", x.까닭));
        var b = el("button", "mu-copy", "📋 곡 이름 복사"); b.type = "button";
        var 메 = el("div", "mu-ok");
        b.onclick = function () { 복사(곡 + (x.가수 ? " " + x.가수 : ""), 메, b); };
        카.appendChild(b); 카.appendChild(메);
        상.appendChild(카);
      });
    }
    줄들("▶ 유튜브 쇼츠 인기 곡", 유);
    줄들("🎵 틱톡 인기 곡", 틱);
    if (원) {
      var 원칸 = el("div", "mu-orig");
      원칸.appendChild(document.createTextNode("원본 음악: " + (원.곡 || "곡 이름 모름")));
      if (원.크기퍼센트 != null) { 원칸.appendChild(document.createTextNode(" · 크기 ")); 원칸.appendChild(el("b", null, 원.크기퍼센트 + "%")); }
      if (원.목소리보다dB != null) 원칸.appendChild(document.createTextNode(" · 목소리보다 " + 원.목소리보다dB + "dB"));
      상.appendChild(원칸);
    }
    c.appendChild(상);
  }

  function 편카드(p, 채널) {
    var c = el("div", "os-card");
    var 위 = el("div", "os-meta");
    위.appendChild(el("span", "os-pill", p.올릴날 ? "올릴 날 " + p.올릴날.slice(5).replace("-", "/") : "새 편"));
    var 곳s = 그곳들(p);
    if (틱톡소재(p)) 위.appendChild(el("span", "os-pill", "🎵 틱톡 소재 · 틱톡엔 안 올림"));
    var 된 = 곳s.filter(function (g) { return 올렸나(p.id, g); }).length;
    위.appendChild(el("span", "os-pill" + (된 === 곳s.length ? " ok" : ""), "올림 " + 된 + "/" + 곳s.length));
    var 때들 = p.올림 ? Object.keys(p.올림).map(function (g) { return g + " " + p.올림[g]; }) : [];
    if (때들.length) 위.appendChild(el("span", "os-pill", 때들.join(" · ")));
    c.appendChild(위);
    c.appendChild(el("div", "os-title", 제목들(p)[0]));
    var 받 = el("a", "os-big", "📂 드라이브에서 영상 받기");
    받.href = 채널.폴더링크 || "#"; 받.target = "_blank"; 받.rel = "noopener";
    c.appendChild(받);
    c.appendChild(el("div", "os-sub", "파일 이름: " + (p.파일 || "") + (아이폰 ? " · 다운로드 → 파일 앱 → 공유 → 비디오 저장" : " · 다운로드 → 갤러리")));
    var 지금 = (곳s.indexOf(고른곳[p.id]) >= 0 && 고른곳[p.id]) || 곳s.filter(function (g) { return !올렸나(p.id, g); })[0] || 곳s[0];
    var 탭 = el("div", "os-tabs");
    곳s.forEach(function (g) {
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
      b.onclick = function () { 복사(x[1], m, b); };
      c.appendChild(b); c.appendChild(보기); c.appendChild(m);
    });
    if (지금 === "유튜브" && p.사운드검색어) c.appendChild(el("div", "os-sub", "🎵 유튜브 앱 사운드 검색어: " + p.사운드검색어));
    음악칸(c, p);
    var 했 = 올렸나(p.id, 지금);
    var 끝 = el("button", "os-done" + (했 ? "" : " report"), 했 ? "↩ " + 지금 + " 「올림」 지우기" : "📤 " + 지금 + "에 올리고 보고하기");
    끝.type = "button";
    끝.onclick = function () {
      var 새 = !올렸나(p.id, 지금);
      올렸나(p.id, 지금, 새);
      if (새) { 보고(p, 지금); 눌림(끝, "✓ 보고했어요! 사장님께 알림 갔어요"); setTimeout(다시, 1200); } else 다시();
    };
    c.appendChild(끝);
    return c;
  }

  function 채널칸(ch, 하나만) {
    var s = el("section", "os-ch");
    var h = el("div", "os-chhead");
    var 이름 = el("div", "os-chname", ch.채널 || ch.코드 || "채널");
    var 안올 = 0; (ch.편 || []).forEach(function (p) { 그곳들(p).forEach(function (g) { if (!올렸나(p.id, g)) 안올++; }); });
    var 곁 = el("div", "os-sub", [ch.결, ch.폰, "영상 " + (ch.편 || []).length + "편", (ch.편 || []).length ? "안 올린 곳 " + 안올 : ""].filter(Boolean).join(" · "));
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
        편표 = {}; 채널표 = {};
        (하나 ? [d] : (d.채널들 || [])).forEach(function (c) { (c.편 || []).forEach(function (p) { 편표[p.id] = p; 채널표[p.id] = c; }); });
        if (하나 && d.코드) 채널얼굴(d.코드, d.채널 || "채널");
        if (머리) 머리(하나 ? (d.채널 || "채널") : "숏츠 · 채널 " + (d.채널들 || []).length + "개", 하나);
        다시();
        if (!하나) 새신호(d.채널들 || [], 다시);
      }).catch(function () { 판.innerHTML = '<div class="os-empty">목록을 못 불러왔어요 — 잠시 뒤 다시 열어 주세요</div>'; });
    }
  };
})();
