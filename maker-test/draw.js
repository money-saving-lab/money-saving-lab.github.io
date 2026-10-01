/* ══════════════════════════════════════════════════════════════
   HW 숏츠 메이커 📱 폰 단독 — 그림 (캔버스) · 우리 엔진 모양을 그대로 옮김 (2026-10-01 밤)
   자막(영상._자막판) · 글귀 상자+빛(영상._제목상자·효과.상자빛) · 고정 제목(영상._고정제목) · 훅 글자(브랜드.훅글자) ·
   딱지 7모양+등장 4가지(브랜드._딱지·_딱지등장) · 인트로 배지(브랜드.인트로) · 화면 빛 8가지(효과.순서) · 스케치 등장(효과.스케치등장) ·
   진행 막대 · 아웃트로(브랜드.아웃트로) · 썸네일(썸네일.py hwThumb · 안전 자리 패드 120 · 오른여백 170)
   ★ctx.filter(흐림)는 아이폰 사파리에서 설정 켜야만 됨(MDN) → 흐림은 작게 줄였다 키우기로★
   ══════════════════════════════════════════════════════════════ */
"use strict";
(function (전역) {
  const W = 1080, H = 1920, FPS = 30;
  const 숫자노랑 = "#FAC775", 상자노랑 = "#FFD400", 노랑 = "rgb(255,212,0)", 빨강 = "rgb(230,33,23)";
  const 단위 = "원|달러|엔|%|퍼센트|배|년|명|개|위|달|시간|분|박|일|시|km|킬로|월|곳|가지|도|회|kg|cm|초|컷|단계|세트|번";
  const 숫자꼴 = new RegExp("(?:약\\s?)?\\d[\\d,.]*(?:\\s?(?:만|천|백|억|조))*(?:\\s?\\d[\\d,.]*(?:만|천|백)?)*\\s?(?:" + 단위 + ")?", "g");
  const 쉬움 = (p) => { p = Math.max(0, Math.min(1, p)); return 1 - Math.pow(1 - p, 3); };
  const 스프링 = (t, 지연 = 0) => { t -= 지연; if (t <= 0) return 0; return 1 - Math.exp(-7 * t) * Math.cos(11 * t); };
  const 글꼴 = (굵기, 크기) => `${굵기} ${크기}px Pretendard, "Apple SD Gothic Neo", sans-serif`;
  const 이모지글꼴 = (크기) => `${크기}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;

  function 둥근(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

  function 조각(줄) {                                       // 숫자+단위만 강조 (영상._조각)
    const out = []; let i = 0, m; 숫자꼴.lastIndex = 0;
    while ((m = 숫자꼴.exec(줄))) {
      if (!m[0] || !/\d/.test(m[0])) { if (m[0] === "") 숫자꼴.lastIndex++; continue; }
      if (m.index > i) out.push([줄.slice(i, m.index), false]);
      out.push([m[0], true]); i = m.index + m[0].length;
    }
    if (i < 줄.length) out.push([줄.slice(i), false]);
    return out;
  }

  function 줄나누기(ctx, 글, 폭) {                         // 낱말 단위 (숫자+단위 덩어리는 안 쪼갬)
    const 붙 = String(글 || "").replace(숫자꼴, (m) => m.replace(/ /g, " "));
    const 줄들 = []; let 지금 = "";
    for (const w of 붙.split(" ")) {
      const 시 = 지금 ? 지금 + " " + w : w;
      if (지금 && ctx.measureText(시.replace(/ /g, " ")).width > 폭) { 줄들.push(지금); 지금 = w; } else 지금 = 시;
    }
    if (지금) 줄들.push(지금);
    return 줄들.map((z) => z.replace(/ /g, " "));
  }

  /* ── 자막 (80px · 테두리 9 · 그림자 · 숫자 노랑 · 아래 576) ── */
  function 자막(ctx, 글, 배 = 1) {
    if (!글) return;
    let 크기 = Math.round(80 * 배);
    ctx.font = 글꼴(900, 크기);
    const 폭 = Math.min(W - 2 * 84 - 60, (W - 120));
    let 줄들 = 줄나누기(ctx, 글, 폭);
    while (줄들.length > 2 && 크기 > 56) { 크기 -= 6; ctx.font = 글꼴(900, 크기); 줄들 = 줄나누기(ctx, 글, 폭); }
    줄들 = 줄들.slice(0, 2);
    const 줄높이 = 크기 * 1.22;
    let y = H - 576 - 줄높이 * 줄들.length + 크기 * 0.92;
    ctx.lineJoin = "round"; ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
    for (const z of 줄들) {
      let x = (W - ctx.measureText(z).width) / 2;
      for (const [g, 강] of 조각(z)) {
        ctx.save(); ctx.shadowColor = "rgba(0,0,0,.59)"; ctx.shadowBlur = 6; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 4;
        ctx.lineWidth = 18; ctx.strokeStyle = "#101010"; ctx.strokeText(g, x, y); ctx.restore();
        ctx.fillStyle = 강 ? 숫자노랑 : "#fff"; ctx.fillText(g, x, y);
        x += ctx.measureText(g).width;
      }
      y += 줄높이;
    }
  }

  /* ── 글귀 상자 (88px · 노랑 글자 · 반투명 상자 · 위 강조 막대) + 빛 쓸기 0.8초 ── */
  function 글귀상자(ctx, 글, t, 길이, 가운데y = 470, 빛때 = 0.5) {
    if (!글) return;
    ctx.font = 글꼴(900, 88);
    const 줄들 = 줄나누기(ctx, 글, W - 300).slice(0, 2);
    const 줄높이 = 88 * 1.22;
    const bw = Math.max(...줄들.map((z) => ctx.measureText(z).width)) + 92;
    const bh = 줄높이 * 줄들.length + 56 - (줄높이 - 88) + 10;
    const bx = (W - bw) / 2, by = 가운데y - bh / 2;
    const a = 쉬움((t - 0.1) / 0.3);
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    둥근(ctx, bx, by, bw, bh, 30); ctx.fillStyle = "rgba(8,10,16,.67)"; ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = "rgba(255,212,0,.92)"; ctx.stroke();
    둥근(ctx, W / 2 - 23, by + 12, 46, 6, 3); ctx.fillStyle = 상자노랑; ctx.fill();
    ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.lineJoin = "round";
    줄들.forEach((z, i) => { const y = by + 34 + i * 줄높이; ctx.lineWidth = 8; ctx.strokeStyle = "#000"; ctx.strokeText(z, W / 2, y); ctx.fillStyle = 상자노랑; ctx.fillText(z, W / 2, y); });
    const 때들 = [빛때].concat(길이 - 빛때 > 3.2 ? [길이 - 1.6] : []);
    for (const 때 of 때들) {
      const p = (t - 때) / 0.8;
      if (p <= 0 || p >= 1) continue;
      ctx.save(); 둥근(ctx, bx, by, bw, bh, 30); ctx.clip();
      const c = bx - 0.25 * bw + (1.5 * bw + bh * 0.45) * 쉬움(p), 폭 = Math.max(40, bw * 0.1);
      ctx.translate(c, by); ctx.transform(1, 0, -0.45, 1, 0, 0);
      const g = ctx.createLinearGradient(-폭 * 2.2, 0, 폭 * 1.2, 0);
      g.addColorStop(0, "rgba(255,252,230,0)"); g.addColorStop(0.18, "rgba(255,252,230,.45)"); g.addColorStop(0.3, "rgba(255,252,230,0)");
      g.addColorStop(0.55, "rgba(255,252,230,0)"); g.addColorStop(0.72, "rgba(255,252,230,.85)"); g.addColorStop(1, "rgba(255,252,230,0)");
      ctx.fillStyle = g; ctx.fillRect(-폭 * 2.2, 0, 폭 * 3.4 + bh, bh); ctx.restore();
    }
    ctx.restore();
    return { bx, by, bw, bh };
  }

  /* ── 📌 고정 제목 (썸네일 문구 · 위 어둡게 · 두 줄 흰/채널색 · 가운데 334/432) ── */
  function 고정제목(ctx, 글, 채널색, 투명 = 1) {
    글 = String(글 || "").replace(/\[\[(.+?)\]\]/g, "$1").replace(/\s+/g, " ").trim();
    if (!글 || 투명 <= 0) return;
    ctx.save(); ctx.globalAlpha = 투명;
    const g = ctx.createLinearGradient(0, 0, 0, 560); g.addColorStop(0, "rgba(0,0,0,.59)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 560);
    const 낱 = 글.split(" ");
    let 크기 = 90, 줄들;
    for (;;) {
      ctx.font = 글꼴(900, 크기);
      if (낱.length < 2) 줄들 = [글];
      else {
        let 가장 = 1, 차 = 1e9;
        for (let j = 1; j < 낱.length; j++) { const d = Math.abs(ctx.measureText(낱.slice(0, j).join(" ")).width - ctx.measureText(낱.slice(j).join(" ")).width); if (d < 차) { 차 = d; 가장 = j; } }
        줄들 = [낱.slice(0, 가장).join(" "), 낱.slice(가장).join(" ")];
      }
      if (Math.max(...줄들.map((z) => ctx.measureText(z).width)) <= W - 180 || 크기 <= 56) break;
      크기 -= 4;
    }
    const 색들 = 줄들.length === 1 ? [채널색] : ["#fff", 채널색];
    const 가운데 = 줄들.length === 1 ? [383] : [334, 432];
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
    줄들.forEach((z, i) => {
      ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.lineWidth = 14; ctx.strokeStyle = "rgba(0,0,0,.55)"; ctx.strokeText(z, W / 2 + 4, 가운데[i] + 5); ctx.fillText(z, W / 2 + 4, 가운데[i] + 5);
      ctx.strokeStyle = "rgb(12,12,12)"; ctx.strokeText(z, W / 2, 가운데[i]); ctx.fillStyle = 색들[i]; ctx.fillText(z, W / 2, 가운데[i]);
    });
    ctx.restore();
  }

  /* ── 🪝 훅 글자 (126px · 낱말마다 3프레임 간격으로 쾅 · 숫자 낱말 = 노란 형광 상자+검은 글자 · 뒤 둥글게 어둡게) ── */
  function 훅준비(ctx, 글) {
    let 크기 = 126, 줄들;
    for (;;) { ctx.font = 글꼴(900, 크기); 줄들 = 줄나누기(ctx, 글, 912); if (줄들.length <= 3 || 크기 <= 84) break; 크기 -= 10; }
    const 줄높이 = Math.round(크기 * 1.18), 낱말 = [];
    let y = 330 + 620 - (줄높이 * 줄들.length) / 2;
    for (const 줄 of 줄들) {
      let x = (W - ctx.measureText(줄).width) / 2;
      for (const w of 줄.split(" ")) {
        낱말.push({ w, x, y, 너비: ctx.measureText(w).width, 강조: /\d/.test(w) });
        x += ctx.measureText(w + " ").width;
      }
      y += 줄높이;
    }
    return { 크기, 줄높이, 낱말, 때들: 낱말.map((_, k) => 0.05 + k * 3 / FPS) };
  }

  function 훅글자(ctx, 준비, t) {
    // 뒤 어둡게 (가운데 y 950 · 둥근 비네트)
    const g = ctx.createRadialGradient(W / 2, 950, 0, W / 2, 950, W * 0.75);
    g.addColorStop(0, "rgba(0,0,0,.62)"); g.addColorStop(0.75, "rgba(0,0,0,.18)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 330, W, 1030);
    ctx.font = 글꼴(900, 준비.크기); ctx.textBaseline = "top"; ctx.textAlign = "left"; ctx.lineJoin = "round";
    준비.낱말.forEach((n, k) => {
      const tt = t - 준비.때들[k];
      if (tt < 0) return;
      const s = 1.45 - 0.45 * 스프링(tt), a = Math.min(1, tt * 12);
      ctx.save(); ctx.globalAlpha = a;
      ctx.translate(n.x + n.너비 / 2, n.y + 준비.크기 / 2); ctx.scale(s, s); ctx.translate(-n.너비 / 2, -준비.크기 / 2);
      if (n.강조) {
        ctx.shadowColor = "rgba(255,200,0,.75)"; ctx.shadowBlur = 24;
        둥근(ctx, -12, -4, n.너비 + 24, 준비.크기 + 14, 16); ctx.fillStyle = 노랑; ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = "rgb(10,10,10)"; ctx.fillText(n.w, 0, 0);
      } else {
        ctx.lineWidth = 20; ctx.strokeStyle = "#000"; ctx.strokeText(n.w, 0, 0); ctx.fillStyle = "#fff"; ctx.fillText(n.w, 0, 0);
      }
      ctx.restore();
    });
  }

  /* ── 🏷 딱지 7모양 (92px) + 등장 4가지 (도장·휙·툭·통통) ── */
  const 딱지모양들 = { 빨강도장: "도장", 노랑테이프: "휙", 검정네온: "툭", 흰스티커: "통통", 빨강말풍선: "통통", 주의띠: "휙", 금색배지: "도장" };
  function 딱지그림(글, 모양) {
    const c = document.createElement("canvas"), x = c.getContext("2d");
    x.font = 글꼴(900, 92); const tw = Math.ceil(x.measureText(글).width);
    const 흰 = "#fff", 검 = "rgb(12,12,14)";
    let w, h, 기울 = 0, 그리기;
    if (모양 === "노랑테이프") {
      w = tw + 250; h = 190; 기울 = 3;
      그리기 = (d) => { d.fillStyle = "rgba(0,0,0,.43)"; d.fillRect(10, 30, tw + 240, 140); d.fillStyle = "rgb(255,214,0)"; d.fillRect(0, 18, tw + 240, 140);
        d.fillStyle = 검; for (const 끝 of [0, tw + 150]) for (let k = -2; k < 6; k++) { const xx = 끝 + k * 34; d.beginPath(); d.moveTo(xx, 158); d.lineTo(xx + 18, 158); d.lineTo(xx + 78, 18); d.lineTo(xx + 60, 18); d.fill(); }
        d.fillStyle = "rgb(255,214,0)"; 둥근(d, 98, 26, tw + 44, 124, 10); d.fill(); d.fillStyle = 검; d.fillText(글, 120, 34); };
    } else if (모양 === "검정네온") {
      w = tw + 200; h = 230;
      그리기 = (d) => { d.save(); d.shadowColor = "rgb(255,60,170)"; d.shadowBlur = 28; d.lineWidth = 14; d.strokeStyle = "rgb(255,60,170)"; 둥근(d, 30, 30, tw + 140, 170, 85); d.stroke(); d.restore();
        둥근(d, 34, 34, tw + 132, 162, 81); d.fillStyle = "rgba(10,10,16,.92)"; d.fill(); d.lineWidth = 7; d.strokeStyle = "rgb(255,120,205)"; d.stroke(); d.fillStyle = 흰; d.fillText(글, 100, 54); };
    } else if (모양 === "흰스티커") {
      w = tw + 150; h = 200; 기울 = -7;
      그리기 = (d) => { 둥근(d, 18, 26, tw + 120, 160, 34); d.fillStyle = "rgba(0,0,0,.51)"; d.fill(); 둥근(d, 6, 10, tw + 120, 160, 34); d.fillStyle = 흰; d.fill(); d.lineWidth = 6; d.strokeStyle = 빨강; d.stroke(); d.fillStyle = "rgb(220,25,20)"; d.fillText(글, 66, 30); };
    } else if (모양 === "빨강말풍선") {
      w = tw + 150; h = 250;
      그리기 = (d) => { d.fillStyle = "rgba(0,0,0,.43)"; 둥근(d, 16, 22, tw + 120, 154, 60); d.fill(); d.beginPath(); d.moveTo(90, 150); d.lineTo(170, 150); d.lineTo(86, 232); d.fill();
        d.fillStyle = 빨강; d.lineWidth = 7; d.strokeStyle = 흰; 둥근(d, 6, 8, tw + 120, 154, 60); d.fill(); d.stroke(); d.beginPath(); d.moveTo(80, 140); d.lineTo(160, 140); d.lineTo(74, 222); d.closePath(); d.fill(); d.stroke();
        d.fillRect(84, 132, 72, 18); d.fillStyle = 흰; d.fillText(글, 66, 26); };
    } else if (모양 === "주의띠") {
      const 글2 = 글.replace("⚠", "").trim(); const tw2 = Math.ceil(x.measureText(글2).width);
      w = tw2 + 330; h = 190;
      그리기 = (d) => { d.fillStyle = "rgba(0,0,0,.47)"; d.fillRect(12, 26, tw2 + 310, 150); d.fillStyle = 흰; d.fillRect(0, 14, tw2 + 310, 150); d.fillStyle = 빨강; d.fillRect(0, 14, 190, 150);
        d.fillRect(190, 150, tw2 + 120, 14); d.fillStyle = 흰; d.font = 글꼴(900, 70); d.textAlign = "center"; d.textBaseline = "middle"; d.fillText("주의", 95, 89);
        d.font = 글꼴(900, 92); d.textAlign = "left"; d.textBaseline = "top"; d.fillStyle = 검; d.fillText(글2, 230, 28); };
    } else if (모양 === "금색배지") {
      w = tw + 150; h = 200; 기울 = 4;
      그리기 = (d) => { 둥근(d, 16, 22, tw + 120, 158, 22); d.fillStyle = "rgba(0,0,0,.47)"; d.fill(); 둥근(d, 6, 8, tw + 120, 158, 22); d.fillStyle = "rgba(18,16,12,.94)"; d.fill();
        d.lineWidth = 9; d.strokeStyle = "rgb(242,177,52)"; d.stroke(); d.fillStyle = "rgb(255,208,105)"; d.fillText(글, 66, 30); };
    } else {
      w = tw + 140; h = 190; 기울 = -4;
      그리기 = (d) => { 둥근(d, 16, 22, tw + 110, 152, 28); d.fillStyle = "rgba(0,0,0,.47)"; d.fill(); 둥근(d, 6, 8, tw + 110, 152, 28); d.fillStyle = 빨강; d.fill();
        d.lineWidth = 8; d.strokeStyle = 흰; d.stroke(); d.fillStyle = 흰; d.fillText(글, 61, 26); };
    }
    const r = 기울 * Math.PI / 180, cw = Math.ceil(Math.abs(w * Math.cos(r)) + Math.abs(h * Math.sin(r))), ch = Math.ceil(Math.abs(w * Math.sin(r)) + Math.abs(h * Math.cos(r)));
    c.width = cw; c.height = ch;
    const d = c.getContext("2d");
    d.translate(cw / 2, ch / 2); d.rotate(-r); d.translate(-w / 2, -h / 2);
    d.font = 글꼴(900, 92); d.textBaseline = "top"; d.lineJoin = "round";
    그리기(d);
    return c;
  }

  function 딱지(ctx, 그림, 모양, t) {                         // 훅영역 위 y 330+170 = 500 가운데
    if (!그림 || t < 0) return;
    const 등장 = 딱지모양들[모양] || "도장", cy = 500;
    let s = 1, x = (W - 그림.width) / 2, y = cy - 그림.height / 2, a = 1;
    if (등장 === "휙") { const p = 1 - Math.exp(-9 * t) * Math.cos(9 * t); x = -그림.width + (x + 그림.width) * p; }
    else if (등장 === "툭") { const p = 1 - Math.abs(Math.exp(-6 * t) * Math.cos(14 * t)); y = -그림.height + (y + 그림.height) * p; }
    else if (등장 === "통통") s = Math.max(0.05, 1 - Math.exp(-6 * t) * Math.cos(16 * t));
    else { s = 1 + 1.2 * Math.pow(Math.max(0, 1 - t / 0.12), 2) + 0.06 * Math.exp(-9 * t) * Math.sin(40 * t); if (t < 0.06) a = t / 0.06; }
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x + 그림.width / 2, y + 그림.height / 2); ctx.scale(s, s);
    ctx.drawImage(그림, -그림.width / 2, -그림.height / 2); ctx.restore();
  }

  /* ── 인트로 채널 배지 (가운데 y 960 · 어두운 알약 · 채널색 테두리 · 이모지 동그라미 · 스프링 · 빛 쓸기) ── */
  function 인트로(ctx, 이름, 부제, 이모지, 채널색, t, 길이) {
    if (!이름 || t < 0 || t > 길이) return;
    ctx.save();
    ctx.font = 글꼴(900, 76); const w1 = ctx.measureText(이름).width;
    ctx.font = 글꼴(800, 40); const w2 = ctx.measureText(부제).width;
    const bw = 150 + 40 + Math.max(w1, w2) + 110, bh = 210;
    const sc = 0.55 + 0.45 * 스프링(t), 나감 = t > 길이 - 0.3 ? 1 - 쉬움((t - (길이 - 0.3)) / 0.3) : 1;
    ctx.globalAlpha = 나감; ctx.translate(W / 2, 960); ctx.scale(sc, sc); ctx.translate(-bw / 2, -bh / 2);
    둥근(ctx, 0, 0, bw, bh, bh / 2); ctx.fillStyle = "rgba(12,13,18,.9)"; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = 채널색; ctx.stroke();
    ctx.beginPath(); ctx.arc(105, 105, 75, 0, Math.PI * 2); ctx.fillStyle = 채널색; ctx.fill();
    ctx.font = 이모지글꼴(78); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#000"; ctx.fillText(이모지 || "✨", 105, 110);
    ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.font = 글꼴(900, 76); ctx.fillStyle = "#fff"; ctx.fillText(이름, 220, 34);
    ctx.font = 글꼴(800, 40); ctx.fillStyle = 노랑; ctx.fillText(부제, 222, 134);
    if (t > 0.3 && t < 1.1) {
      ctx.save(); 둥근(ctx, 0, 0, bw, bh, bh / 2); ctx.clip();
      const c = -0.2 * bw + 1.4 * bw * 쉬움((t - 0.3) / 0.8);
      ctx.transform(1, 0, -0.45, 1, 0, 0);
      const g = ctx.createLinearGradient(c - bw * 0.1, 0, c + bw * 0.1, 0);
      g.addColorStop(0, "rgba(255,250,225,0)"); g.addColorStop(0.5, "rgba(255,250,225,.8)"); g.addColorStop(1, "rgba(255,250,225,0)");
      ctx.fillStyle = g; ctx.fillRect(c - bw * 0.1, 0, bw * 0.2 + bh, bh); ctx.restore();
    }
    ctx.restore();
  }

  /* ── 화면 빛 (효과.순서 8가지 돌리기 · 늘 테두리 어둡게 + 필름 입자) ── */
  const 빛순서 = ["빛줄기", "빛샘", "렌즈빛", "따뜻하게", "빛줄기", "차갑게", "렌즈빛", "빛샘"];
  let 입자판 = null;
  function 입자() {
    if (입자판) return 입자판;
    입자판 = [];
    for (let k = 0; k < 4; k++) {
      const c = document.createElement("canvas"); c.width = 270; c.height = 480; const d = c.getContext("2d"), im = d.createImageData(270, 480);
      for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 14; }
      d.putImageData(im, 0, 0); 입자판.push(c);
    }
    return 입자판;
  }
  function 화면빛(ctx, i, t, 길이, 프레임, 잡음 = true) {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.7);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.45)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (잡음) { ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(입자()[프레임 % 4], 0, 0, W, H); ctx.restore(); }
    const 종류 = 빛순서[i % 빛순서.length];
    ctx.save();
    if (종류 === "빛줄기") {
      const x = -900 + (W + 1300) * t / Math.max(0.1, 길이) + 350;
      ctx.translate(x, H / 2); ctx.rotate(14 * Math.PI / 180);
      const l = ctx.createLinearGradient(-300, 0, 300, 0);
      l.addColorStop(0, "rgba(255,250,225,0)"); l.addColorStop(0.5, "rgba(255,250,225,.36)"); l.addColorStop(1, "rgba(255,250,225,0)");
      ctx.fillStyle = l; ctx.fillRect(-300, -1500, 600, 3000);
    } else if (종류 === "빛샘") {
      ctx.globalAlpha = 0.75;
      let r = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.9); r.addColorStop(0, "rgba(255,140,80,.55)"); r.addColorStop(1, "rgba(255,140,80,0)"); ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
      r = ctx.createRadialGradient(W, H, 0, W, H, W * 0.85); r.addColorStop(0, "rgba(120,170,255,.42)"); r.addColorStop(1, "rgba(120,170,255,0)"); ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
    } else if (종류 === "렌즈빛") {
      ctx.translate(18 * Math.sin(t * 0.5), 0);
      for (const [cx, cy, rr, col] of [[W * 0.78, H * 0.17, 330, "255,232,170"], [W * 0.24, H * 0.7, 170, "180,218,255"]]) {
        const r = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr); r.addColorStop(0, `rgba(${col},.6)`); r.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = r; ctx.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
      }
    } else if (종류 === "따뜻하게") {
      ctx.globalCompositeOperation = "soft-light"; ctx.fillStyle = "rgba(255,170,90,.35)"; ctx.fillRect(0, 0, W, H);
    } else if (종류 === "차갑게") {
      ctx.globalCompositeOperation = "soft-light"; ctx.fillStyle = "rgba(90,150,255,.35)"; ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  /* ── ✏ 스케치 등장 (효과.스케치등장 — 종이 → 진한 선 먼저 → 명암 · 대각선으로 번짐) ── */
  function 스케치준비(그림원본) {                            // 그림원본 = 그 장면 첫 화면 캔버스(1080×1920) → 작은 판(270×480)에서 계산
    const w = 270, h = 480, c = document.createElement("canvas"); c.width = w; c.height = h;
    const d = c.getContext("2d"); d.drawImage(그림원본, 0, 0, w, h);
    const src = d.getImageData(0, 0, w, h).data, n = w * h;
    const g = new Float32Array(n);
    for (let i = 0; i < n; i++) g[i] = 0.299 * src[i * 4] + 0.587 * src[i * 4 + 1] + 0.114 * src[i * 4 + 2];
    // 흐림(상자 흐림 3번 ≈ 가우스)
    const 흐리게 = (a, r) => { let x = Float32Array.from(a), y = new Float32Array(n);
      for (let k = 0; k < 3; k++) {
        for (let yy = 0; yy < h; yy++) { let s = 0, q = 0; for (let xx = -r; xx < w + r; xx++) { const xi = xx + r; if (xi < w) { s += x[yy * w + xi]; q++; } const xo = xx - r - 1; if (xo >= 0) { s -= x[yy * w + xo]; q--; } if (xx >= 0 && xx < w) y[yy * w + xx] = s / q; } }
        for (let xx = 0; xx < w; xx++) { let s = 0, q = 0; for (let yy = -r; yy < h + r; yy++) { const yi = yy + r; if (yi < h) { s += y[yi * w + xx]; q++; } const yo = yy - r - 1; if (yo >= 0) { s -= y[yo * w + xx]; q--; } if (yy >= 0 && yy < h) x[yy * w + xx] = s / q; } }
      } return x; };
    const 반 = new Float32Array(n); for (let i = 0; i < n; i++) 반[i] = 255 - g[i];
    const b = 흐리게(반, 3);
    const s = new Float32Array(n), 진 = new Float32Array(n);
    for (let yy = 1; yy < h - 1; yy++) for (let xx = 1; xx < w - 1; xx++) {
      const i = yy * w + xx;
      const 닷지 = Math.min(255, g[i] * 256 / Math.max(1, 255 - b[i]));
      const gx = g[i + 1] - g[i - 1], gy = g[i + w] - g[i - w], 선 = Math.min(1, Math.hypot(gx, gy) / 90);
      const v = Math.max(0, Math.min(1, Math.pow(닷지 / 255, 1.8) - 선 * 0.55));
      s[i] = v; 진[i] = 1 - v;
    }
    const 방향 = Math.floor(Math.random() * 3), 문턱 = new Float32Array(n);
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      const i = yy * w + xx, u = xx / w, v = yy / h;
      const 자리 = 방향 === 0 ? u * 0.55 + v * 0.45 : 방향 === 1 ? v : Math.hypot(u - 0.5, (v - 0.45) * 1.2) / 0.75;
      const 잡 = 0.5 + 0.5 * Math.sin(xx * 0.21 + Math.sin(yy * 0.13) * 3) * Math.cos(yy * 0.17);
      문턱[i] = Math.max(-0.4, Math.min(1.2, 자리 * 0.75 + 잡 * 0.25 - 진[i] * 0.35));
    }
    return { w, h, s, 문턱, c, d, im: d.createImageData(w, h) };
  }
  function 스케치(ctx, 준비, p) {                             // p 0→1 (그리는 동안)
    const { w, h, s, 문턱, im } = 준비, q = 쉬움(p) * 1.25 - 0.3, D = im.data;
    for (let i = 0; i < w * h; i++) {
      const m = Math.max(0, Math.min(1, (q - 문턱[i]) / 0.08)), v = s[i];
      D[i * 4] = 247 * (1 - m) + 247 * v * m; D[i * 4 + 1] = 243 * (1 - m) + 243 * v * m; D[i * 4 + 2] = 234 * (1 - m) + 234 * v * m; D[i * 4 + 3] = 255;
    }
    준비.d.putImageData(im, 0, 0);
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high"; ctx.drawImage(준비.c, 0, 0, W, H); ctx.restore();
  }

  /* ── 진행 막대 (위 7px · 주황→노랑 · 끝 흰 점) ── */
  function 진행막대(ctx, p) {
    const w = W * p, g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, "rgb(255,140,60)"); g.addColorStop(1, "rgb(255,212,0)");
    ctx.save(); ctx.globalAlpha = 0.92; ctx.fillStyle = g; ctx.fillRect(0, 0, w, 7); ctx.globalAlpha = 1;
    ctx.shadowColor = "#fff"; ctx.shadowBlur = 6; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(Math.max(9, w - 13), 9, 6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  /* ── 흐림 (작게 줄였다 키우기 · ctx.filter 없이) ── */
  function 흐림판(그림, 세기 = 24) {
    const k = Math.max(4, Math.round(세기 / 2)), w = Math.ceil(W / k), h = Math.ceil(H / k);
    const a = document.createElement("canvas"); a.width = w; a.height = h; const ad = a.getContext("2d"); ad.imageSmoothingQuality = "high"; ad.drawImage(그림, 0, 0, w, h);
    const b = document.createElement("canvas"); b.width = W; b.height = H; const bd = b.getContext("2d"); bd.imageSmoothingQuality = "high"; bd.drawImage(a, 0, 0, W, H);
    return b;
  }

  /* ── 📺 아웃트로 (4.2초 · 마지막 화면 흐리게 0.33 + 채널색 빛 · 낱말 올라옴 · 채널 이름 · 🔖저장 ❤️좋아요 🔔 알약) ── */
  const 아웃트로길이 = 4.2;
  function 아웃트로준비(끝화면, 문구, 이름, 채널색) {
    const 바탕 = 흐림판(끝화면, 28);
    const d = 바탕.getContext("2d");
    d.fillStyle = "rgba(0,0,0,.67)"; d.fillRect(0, 0, W, H);
    const r = d.createRadialGradient(W * 0.35, H * 0.32, 0, W * 0.35, H * 0.32, W * 0.75);
    r.addColorStop(0, 채널색.replace("rgb(", "rgba(").replace(")", ",.42)")); r.addColorStop(1, "rgba(0,0,0,0)"); d.fillStyle = r; d.fillRect(0, 0, W, H);
    d.font = 글꼴(900, 88); const 줄들 = 줄나누기(d, 문구, 900), 낱말 = [];
    let y = 640 - 줄들.length * 108 / 2;
    for (const 줄 of 줄들) { let x = (W - d.measureText(줄).width) / 2; for (const w of 줄.split(" ")) { 낱말.push([w, x, y]); x += d.measureText(w + " ").width; } y += 108; }
    return { 바탕, 낱말, 이름, 누름: [1.85, 2.23, 2.61] };
  }
  function 아웃트로(ctx, 준비, t) {
    const f = t * FPS, n = 아웃트로길이 * FPS;
    ctx.drawImage(준비.바탕, 0, 0);
    ctx.textBaseline = "top"; ctx.textAlign = "left"; ctx.lineJoin = "round"; ctx.font = 글꼴(900, 88);
    준비.낱말.forEach(([w, x, y], k) => { const a = 쉬움((f - 6 - k * 6) / 14); if (a <= 0) return; ctx.globalAlpha = a;
      const yy = y + (1 - a) * 30; ctx.lineWidth = 12; ctx.strokeStyle = "rgba(0,0,0,.8)"; ctx.strokeText(w, x, yy); ctx.fillStyle = "#fff"; ctx.fillText(w, x, yy); });
    ctx.globalAlpha = 1;
    const a = 쉬움((t - 0.8) / 0.6);
    if (a > 0 && 준비.이름) { ctx.globalAlpha = a; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = 글꼴(800, 54); ctx.lineWidth = 6; ctx.strokeStyle = "rgba(0,0,0,.7)"; ctx.strokeText(준비.이름, W / 2, 860); ctx.fillStyle = 노랑; ctx.fillText(준비.이름, W / 2, 860); ctx.globalAlpha = 1; }
    const 알약 = [["🔖", "저장"], ["❤️", "좋아요"], ["🔔", ""]];
    ctx.font = 글꼴(900, 50); const 폭들 = 알약.map(([, g]) => 44 + 64 + (g ? 18 + ctx.measureText(g).width : 0) + 44);
    let x = (W - (폭들.reduce((p, q) => p + q, 0) + 28 * 2)) / 2;
    알약.forEach(([e, g], k) => {
      let sc = Math.max(0, 스프링(t, 1.05 + k * 0.16)); const 눌림 = t >= 준비.누름[k], df = f - 준비.누름[k] * FPS;
      if (df >= 0 && df < 7) sc *= 0.9; else if (df >= 7 && df < 14) sc *= 1.08;
      if (sc > 0.01) {
        const bw = 폭들[k];
        ctx.save(); ctx.translate(x + bw / 2, 1060 + 56);
        if (e === "🔔" && 눌림) ctx.rotate(Math.sin(df / 2.2) * 14 * Math.max(0, 1 - df / 45) * Math.PI / 180);
        ctx.scale(sc, sc); ctx.translate(-bw / 2, -56);
        둥근(ctx, 0, 0, bw, 112, 56); ctx.fillStyle = 눌림 ? (e === "🔔" ? "#fff" : 노랑) : "rgba(30,33,44,.92)"; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = 노랑; ctx.stroke();
        ctx.font = 이모지글꼴(60); ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillStyle = "#000"; ctx.fillText(e, 44, 60);
        if (g) { ctx.font = 글꼴(900, 50); ctx.fillStyle = 눌림 ? "rgb(15,15,15)" : "#fff"; ctx.fillText(g, 44 + 64 + 18, 58); }
        ctx.restore();
      }
      x += 폭들[k] + 28;
    });
    const 흐 = f > n - 12 ? Math.min(쉬움(f / 10), 1 - 쉬움((f - (n - 12)) / 12)) : 쉬움(f / 10);
    if (흐 < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - 흐})`; ctx.fillRect(0, 0, W, H); }
  }

  /* ── 🖼 썸네일 (hwThumb · 왼쪽 정렬 · [[ ]] 하나만 강조 · 안전 자리) ── */
  const 썸테마 = [["흰·노랑 형광펜", "#fff", "rgb(255,212,0)", "pen"], ["흰·민트 형광펜", "#fff", "rgb(40,224,180)", "pen"], ["흰·분홍 형광펜", "#fff", "rgb(255,92,138)", "pen"],
    ["흰·빨강 상자", "#fff", "rgb(255,59,59)", "box"], ["노랑·보라 밑줄", "rgb(255,212,0)", "rgb(185,140,255)", "under"], ["흰·노랑 상자", "#fff", "rgb(255,212,0)", "box"],
    ["하늘·주황 밑줄", "rgb(69,182,255)", "rgb(255,138,31)", "under"], ["흰·노랑 가는밑줄", "#fff", "rgb(255,212,0)", "line"]];
  function 썸네일(배경, 문구, 부제, 배지, 테마번호) {
    const c = document.createElement("canvas"); c.width = W; c.height = H; const d = c.getContext("2d");
    d.drawImage(배경, 0, 0, W, H);
    const 위 = d.createLinearGradient(0, 0, 0, H); 위.addColorStop(0, "rgba(6,9,14,.64)"); 위.addColorStop(0.45, "rgba(6,9,14,.72)"); 위.addColorStop(1, "rgba(6,9,14,.56)");
    d.fillStyle = 위; d.fillRect(0, 0, W, H);
    const 가 = d.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, H * 0.5); 가.addColorStop(0, "rgba(6,9,14,.55)"); 가.addColorStop(1, "rgba(6,9,14,0)"); d.fillStyle = 가; d.fillRect(0, 0, W, H);
    const [, 글자색, 강조색, 모양] = 썸테마[테마번호 % 썸테마.length];
    const 패드 = 120, 글폭 = W - 120 - 170;
    const 조각들 = []; let rest = String(문구 || "").trim(), m;
    while (rest) { m = /\[\[([^\]]+)\]\]/.exec(rest); if (!m) { 조각들.push([rest, false]); break; } if (m.index) 조각들.push([rest.slice(0, m.index), false]); 조각들.push([m[1], true]); rest = rest.slice(m.index + m[0].length); }
    const 맨 = 조각들.map((x) => x[0]).join("").replace(/\s/g, "").length;
    let fs = 맨 <= 6 ? 252 : 맨 <= 10 ? 206 : 맨 <= 16 ? 168 : 맨 <= 24 ? 138 : 114;
    const 낱 = []; for (const [g, 칠] of 조각들) { if (칠) 낱.push([g, true]); else for (const w of g.split(/(\s+)/)) if (w) 낱.push([w, false]); }
    const 나누기 = (폭) => { const 줄들 = []; let 지금 = []; for (const [w, 칠] of 낱) { const 시 = 지금.map((x) => x[0]).join("") + w;
      if (지금.length && !/^\s+$/.test(w) && d.measureText(시.trimEnd()).width > 폭) { while (지금.length && /^\s+$/.test(지금[지금.length - 1][0])) 지금.pop(); 줄들.push(지금); 지금 = []; }
      if (지금.length || !/^\s+$/.test(w)) 지금.push([w, 칠]); } if (지금.length) 줄들.push(지금); return 줄들; };
    const 자리 = H - 840 - (부제 ? 58 * 1.9 + 34 : 0) - 48;
    let 줄들;
    for (;;) { d.font = 글꼴(900, fs); 줄들 = 나누기(글폭); const 넓 = Math.max(...줄들.map((z) => d.measureText(z.map((x) => x[0]).join("").trim()).width));
      if ((줄들.length * fs * 1.16 <= 자리 && 넓 <= 글폭) || fs <= 70) break; fs -= 6; }
    const 줄높이 = fs * (모양 === "box" ? 1.36 : 1.16);
    let y = (H - (44 + 줄높이 * 줄들.length + (부제 ? 34 + 58 * 1.75 : 0))) / 2;
    둥근(d, 패드, y, 120, 14, 7); d.fillStyle = 강조색; d.fill(); y += 44;
    d.textBaseline = "top"; d.lineJoin = "round";
    const 밝 = (c) => { const m2 = /(\d+),(\d+),(\d+)/.exec(c); return m2 ? (m2[1] * 299 + m2[2] * 587 + m2[3] * 114) / 1000 : 255; };
    const 위글 = 밝(강조색) > 150 ? "rgb(10,13,20)" : "#fff";
    for (const 줄 of 줄들) {
      let x = 패드; const 덩 = []; let 열림 = false;
      for (const [w, 칠] of 줄) { const 너비 = d.measureText(w).width; if (칠 && !/^\s+$/.test(w)) { if (열림) 덩[덩.length - 1][1] = x + 너비; else { 덩.push([x, x + 너비]); 열림 = true; } } else if (!칠) 열림 = false; x += 너비; }
      for (const [a, b] of 덩) {
        d.fillStyle = 강조색;
        if (모양 === "under") { 둥근(d, a, y + fs * 0.92 - 0.13 * fs * 0.35, b - a, 0.13 * fs, 3); d.fill(); }
        else if (모양 === "line") d.fillRect(a, y + fs * 1.0, b - a, Math.max(3, 0.055 * fs));
        else if (모양 === "box") { d.save(); d.shadowColor = "rgba(0,0,0,.4)"; d.shadowBlur = 22; d.shadowOffsetY = 8; 둥근(d, a - 0.12 * fs, y + 0.02 * fs, b - a + 0.24 * fs, fs * 1.08, 0.08 * fs); d.fill(); d.restore(); }
        else { d.globalAlpha = 0.9; 둥근(d, a - 0.06 * fs, y + fs * 0.5, b - a + 0.12 * fs, fs * 0.6, 4); d.fill(); d.globalAlpha = 1; }
      }
      x = 패드;
      for (const [w, 칠] of 줄) {
        if (!/^\s+$/.test(w)) {
          if (모양 === "box" && 칠) { d.fillStyle = 위글; d.fillText(w, x, y); }
          else { d.save(); d.shadowColor = "rgba(0,0,0,.72)"; d.shadowBlur = 34; d.shadowOffsetY = 8; d.fillStyle = 글자색; d.fillText(w, x, y); d.restore();
            d.lineWidth = Math.min(8, Math.max(4, fs * 0.032)); d.strokeStyle = "rgba(12,14,20,.92)"; d.strokeText(w, x, y); d.fillStyle = 글자색; d.fillText(w, x, y); }
        }
        x += d.measureText(w).width;
      }
      y += 줄높이;
    }
    if (부제) { d.font = 글꼴(800, 58); const tw = d.measureText(부제).width; y += 34 - (줄높이 - fs);
      둥근(d, 패드, y, tw + 48, 58 + 24, 12); d.fillStyle = 강조색; d.fill(); d.fillStyle = 위글; d.fillText(부제, 패드 + 24, y + 8); }
    if (배지) { d.font = 글꼴(900, 40); const tw = d.measureText(배지).width, bh = 72; 둥근(d, 패드, 250, tw + 60, bh, bh / 2); d.fillStyle = 강조색; d.fill();
      d.fillStyle = 위글; d.textBaseline = "middle"; d.fillText(배지, 패드 + 30, 250 + bh / 2 + 2); }
    return c;
  }

  전역.HW그림 = { W, H, FPS, 숫자꼴, 쉬움, 스프링, 글꼴, 둥근, 줄나누기, 자막, 글귀상자, 고정제목, 훅준비, 훅글자, 딱지모양들, 딱지그림, 딱지, 인트로, 화면빛, 빛순서,
    스케치준비, 스케치, 진행막대, 흐림판, 아웃트로길이, 아웃트로준비, 아웃트로, 썸테마, 썸네일 };
})(window);
