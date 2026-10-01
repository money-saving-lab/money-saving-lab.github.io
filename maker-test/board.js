/* ══════════════════════════════════════════════════════════════
   HW 숏츠 메이커 📱 폰 단독 — 정보판 (하이퍼 정보판 틀을 캔버스로 다시 그림 · 2026-10-01 밤)
   종류: checklist · route(단계) · vs · bars · price · numbers   — 판 자리 화면 y 480 (1080×760) · 카드는 판 안 y 660 에서 끝
   공통(panel.css·panel.js): 알약 kicker · 제목 66px 【강조】 금색 · 금선 · 제목 빛 쓸기 · 카드 #0C0E16 65% · 숫자 굴러가기 · 옮겨 다니는 금 테두리 · 끝 0.3초 흐려짐
   그리기(ctx, 판, t, 길이) → 소리 때 [[t, "띵"|"톡"]] (처음 부를 때 계산)
   ══════════════════════════════════════════════════════════════ */
"use strict";
(function (전역) {
  const G = () => 전역.HW그림;
  const Y0 = 480, 금 = "#F2B134", 강조 = "#FFD069", 초록 = "#7EE08A", 빨강 = "#FF6B6B";
  const 쉬움 = (p) => { p = Math.max(0, Math.min(1, p)); return 1 - Math.pow(1 - p, 3); };
  const 뒤튐 = (p, s = 2.2) => { p = Math.max(0, Math.min(1, p)); const c = s + 1; return 1 + c * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2); };
  const 글꼴 = (b, s) => `${b} ${s}px Pretendard, sans-serif`;

  function 한값(글) {                                       // 「6만 5천 원」 → 65000 · 「2,000원」 → 2000 (막대 높이용 · 시험판: 「6만 5천」 을 65 로 읽어 막대가 틀렸다)
    const s = String(글 || "").replace(/,/g, ""); let 합 = 0, 남 = 0, 찾음 = false;
    for (const m of s.matchAll(/(\d+(?:\.\d+)?)\s*(억|만|천|백)?/g)) {
      찾음 = true; const v = parseFloat(m[1]), u = m[2];
      if (u === "억") 합 += v * 1e8; else if (u === "만") 합 += v * 1e4; else if (u === "천") 남 += v * 1e3; else if (u === "백") 남 += v * 100; else 남 += v;
    }
    return 찾음 ? 합 + 남 : 0;
  }

  function 맞춤(ctx, 글, 최대폭, 최대, 최소, 굵기 = 900) {
    let fs = 최대; ctx.font = 글꼴(굵기, fs);
    while (fs > 최소 && ctx.measureText(글).width > 최대폭) { fs -= 2; ctx.font = 글꼴(굵기, fs); }
    return fs;
  }

  function 굴림(ctx, 글, x, y, p, 정렬 = "center") {         // 숫자 굴러가기 (끝자리부터 · 한 바퀴 + 목표)
    글 = String(글 == null ? "" : 글);
    const 폭 = ctx.measureText(글).width;
    let cx = 정렬 === "center" ? x - 폭 / 2 : 정렬 === "right" ? x - 폭 : x;
    const 높 = parseFloat(ctx.font.split(" ")[1]) * 1.18;
    const 자리수 = [...글].filter((c) => /\d/.test(c)).length; let k = 0;
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    for (const ch of 글) {
      const w = ctx.measureText(ch).width;
      if (/\d/.test(ch)) {
        const q = 쉬움(Math.max(0, p - (자리수 - 1 - k) * 0.04) / 0.96), 굴 = (10 + Number(ch)) * q, a = Math.floor(굴) % 10, f = 굴 - Math.floor(굴);
        ctx.save(); ctx.beginPath(); ctx.rect(cx - 2, y - 높 / 2, w + 4, 높); ctx.clip();
        ctx.strokeText(String(a), cx, y - f * 높); ctx.fillText(String(a), cx, y - f * 높);
        ctx.strokeText(String((a + 1) % 10), cx, y + (1 - f) * 높); ctx.fillText(String((a + 1) % 10), cx, y + (1 - f) * 높);
        ctx.restore(); k++;
      } else { ctx.strokeText(ch, cx, y); ctx.fillText(ch, cx, y); }
      cx += w;
    }
  }

  function 머리(ctx, 판, t) {
    const g = ctx.createLinearGradient(0, Y0, 0, Y0 + 760);
    g.addColorStop(0, "rgba(0,0,0,.40)"); g.addColorStop(0.82, "rgba(0,0,0,.40)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, Y0, 1080, 760);
    if (판.kicker) {
      const a = 쉬움(t / 0.32); ctx.save(); ctx.globalAlpha *= a; ctx.font = 글꼴(800, 34);
      const w = ctx.measureText(String(판.kicker).slice(0, 10)).width + 56, y = Y0 + 18 * (1 - a);
      G().둥근(ctx, 60, y, w, 58, 29); ctx.fillStyle = "rgba(12,14,22,.81)"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,.62)"; ctx.stroke();
      ctx.fillStyle = 강조; ctx.textBaseline = "middle"; ctx.textAlign = "left"; ctx.fillText(String(판.kicker).slice(0, 10), 88, y + 30); ctx.restore();
    }
    const 원 = String(판.title || ""), 맨 = 원.replace(/[【】]/g, "");
    const a = 쉬움((t - 0.08) / 0.32);
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a;
    const fs = 맞춤(ctx, 맨, 1080 - 150, 66, 40);
    const 전체 = ctx.measureText(맨).width, y = Y0 + 70 + 48 + 18 * (1 - a);
    let x = (1080 - 전체) / 2;
    ctx.textBaseline = "middle"; ctx.textAlign = "left"; ctx.lineJoin = "round"; ctx.lineWidth = 6; ctx.strokeStyle = "#141414";
    for (const [i, 덩] of 원.split(/【|】/).entries()) {
      if (!덩) continue;
      ctx.fillStyle = i % 2 ? 강조 : "#fff"; ctx.strokeText(덩, x, y); ctx.fillText(덩, x, y); x += ctx.measureText(덩).width;
    }
    const 틈 = (1080 - 전체) / 2, s = 쉬움((t - 0.15) / 0.4);
    if (틈 - 36 > 70) { ctx.fillStyle = 금; const lw = Math.max(0, 틈 - 90) * s; ctx.fillRect(60 + (틈 - 90) - lw, Y0 + 127, lw, 4); ctx.fillRect(1080 - 틈 + 30, Y0 + 127, lw, 4); }
    if (t > 0.8 && t < 1.71) {                              // 제목 빛 쓸기
      const p = (t - 0.8) / 0.9, cx = (1080 + 전체) / 2 - (전체 + 200) * p;
      ctx.save(); ctx.globalCompositeOperation = "source-atop";
      const l = ctx.createLinearGradient(cx - 80, 0, cx + 80, 0); l.addColorStop(0, "rgba(255,255,240,0)"); l.addColorStop(0.5, "rgba(255,255,240,.9)"); l.addColorStop(1, "rgba(255,255,240,0)");
      ctx.fillStyle = l; ctx.fillRect(cx - 80, Y0 + 70, 160, 96); ctx.restore();
    }
    ctx.restore();
  }

  function 카드(ctx, r, t, at, 위색 = 금) {
    const a = 쉬움((t - at) / 0.32);
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(0, 18 * (1 - a));
    G().둥근(ctx, r.x, Y0 + r.y, r.w, r.h, 22); ctx.fillStyle = "rgba(12,14,22,.65)"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,.23)"; ctx.stroke();
    if (위색) { G().둥근(ctx, r.x + 18, Y0 + r.y, r.w - 36, 6, 3); ctx.fillStyle = 위색; ctx.fill(); }
    ctx.restore();
    return a;
  }

  function 테두리(ctx, rects, t, 시작, 끝) {                   // 옮겨 다니는 금 테두리
    if (!rects.length || t < 시작 || t > 끝 || 끝 - 시작 < 0.5) return;
    const 머물 = Math.max(0.5, (끝 - 시작) / rects.length), i = Math.min(rects.length - 1, Math.floor((t - 시작) / 머물));
    const p = 쉬움(((t - 시작) - i * 머물) / 0.28), a = rects[Math.max(0, i - 1)], b = rects[i];
    const r = i === 0 ? b : { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, w: a.w + (b.w - a.w) * p, h: a.h + (b.h - a.h) * p };
    const 숨 = 0.85 + 0.15 * Math.cos((t - 시작) * Math.PI / 0.8);
    ctx.save(); ctx.globalAlpha *= Math.min(1, (t - 시작) / 0.2, (끝 - t) / 0.2) * 숨;
    ctx.shadowColor = "rgba(242,177,52,.75)"; ctx.shadowBlur = 18; ctx.lineWidth = 4; ctx.strokeStyle = "#FFD66E";
    G().둥근(ctx, r.x - 2, Y0 + r.y - 2, r.w + 4, r.h + 4, 24); ctx.stroke(); ctx.restore();
  }

  /* 종류별 */
  function 줄판(ctx, 판, t, 길이, 숫자식) {                     // checklist · route(단계)
    const 줄 = (판.checks || 판.route || []).slice(0, 4).map((x) => (Array.isArray(x) ? x : [x, ""]));
    const n = Math.max(1, 줄.length), rh = Math.min(118, Math.floor(400 / n));
    const r = { x: 60, y: 190, w: 960, h: Math.min(470, 40 + n * (rh + 12)) };
    카드(ctx, r, t, 0.25); const 때 = [], 칸 = [];
    줄.forEach(([이름, 말], i) => {
      const at = 0.55 + i * 0.3; 때.push(at); const y = r.y + 24 + i * (rh + 12); 칸.push({ x: r.x + 16, y, w: r.w - 32, h: rh });
      const p = 쉬움((t - at) / 0.3); if (p <= 0) return;
      ctx.save(); ctx.globalAlpha *= p; ctx.translate(-30 * (1 - p), 0);
      G().둥근(ctx, r.x + 16, Y0 + y, r.w - 32, rh, 18); ctx.fillStyle = "rgba(255,255,255,.05)"; ctx.fill();
      const cx = r.x + 70, cy = Y0 + y + rh / 2, 원 = Math.min(34, rh * 0.32), s = 뒤튐((t - at) / 0.35, 3);
      ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.beginPath(); ctx.arc(0, 0, 원, 0, Math.PI * 2); ctx.fillStyle = 숫자식 ? 금 : 초록; ctx.fill();
      if (숫자식) { ctx.fillStyle = "#0C0E16"; ctx.font = 글꼴(900, 원 * 1.1); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(i + 1), 0, 2); }
      else { ctx.strokeStyle = "#0C0E16"; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-원 * 0.45, 0); ctx.lineTo(-원 * 0.1, 원 * 0.38); ctx.lineTo(원 * 0.5, -원 * 0.4); ctx.stroke(); }
      ctx.restore();
      ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillStyle = "#fff";
      const fs = 맞춤(ctx, 이름, r.w - 190, 말 ? 50 : 54, 26);
      ctx.fillText(이름, r.x + 130, cy - (말 ? fs * 0.38 : 0));
      if (말) { ctx.font = 글꼴(600, Math.min(32, fs * 0.66)); ctx.fillStyle = "#AAB2BE"; ctx.fillText(String(말).slice(0, 30), r.x + 132, cy + fs * 0.5); }
      ctx.restore();
    });
    테두리(ctx, 칸, t, 0.55 + n * 0.3 + 0.2, 길이 - 0.3);
    return [[0.12, "띵"]].concat(때.map((x) => [x, "톡"]));
  }

  function vs판(ctx, 판, t, 길이) {
    const 줄 = (판.rows || []).slice(0, 3), rh = Math.min(130, Math.floor(270 / Math.max(1, 줄.length)));
    const r = { x: 60, y: 190, w: 960, h: Math.min(470, 140 + 줄.length * (rh + 10) + 46) };
    const 낫 = 판.better === "right" ? "right" : 판.better === "left" ? "left" : "";
    카드(ctx, r, t, 0.25);
    const A = { x: r.x + 262, w: 320 }, B = { x: r.x + 622, w: 320 };
    const 톤 = (쪽) => (!낫 ? "plain" : 낫 === 쪽 ? "good" : "bad"), 색 = (k) => (k === "good" ? 초록 : k === "bad" ? 빨강 : "#fff");
    const 켬 = 0.95 + 0.3 * 줄.length + 0.6, tp = 쉬움((t - 켬) / 0.35);
    [[A, "left"], [B, "right"]].forEach(([c, 쪽]) => {
      if (tp > 0) { ctx.save(); ctx.globalAlpha *= tp; const k = 톤(쪽);
        G().둥근(ctx, c.x, Y0 + r.y + 14, c.w, r.h - 44, 16); ctx.fillStyle = k === "good" ? "rgba(126,224,138,.16)" : k === "bad" ? "rgba(255,107,107,.12)" : "rgba(255,255,255,.04)"; ctx.fill(); ctx.restore(); }
      const p = 쉬움((t - 0.35) / 0.35); ctx.save(); ctx.globalAlpha *= p; ctx.translate((쪽 === "left" ? -120 : 120) * (1 - p), 0);
      맞춤(ctx, 쪽 === "left" ? 판.left : 판.right, c.w - 70, 54, 28); ctx.fillStyle = 색(톤(쪽)); ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(쪽 === "left" ? 판.left : 판.right, c.x + c.w / 2, Y0 + r.y + 71); ctx.restore();
    });
    const vx = (A.x + A.w + B.x) / 2, vy = Y0 + r.y + 71, vp = Math.max(0, Math.min(1, (t - 0.55) / 0.28));
    if (vp > 0) { const s = 2.4 - 1.4 * Math.pow(vp, 3); ctx.save(); ctx.translate(vx, vy); ctx.rotate(-25 * (1 - vp) * Math.PI / 180); ctx.scale(s, s);
      ctx.beginPath(); ctx.arc(0, 0, 48, 0, Math.PI * 2); ctx.fillStyle = "rgba(20,20,26,.94)"; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = 금; ctx.shadowColor = "rgba(242,177,52,.6)"; ctx.shadowBlur = 22; ctx.stroke();
      ctx.shadowBlur = 0; ctx.fillStyle = 강조; ctx.font = 글꼴(900, 36); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("VS", 0, 2); ctx.restore(); }
    const 때 = [[0.12, "띵"], [0.6, "톡"]];
    줄.forEach((row, i) => {
      const y = Y0 + r.y + 140 + i * (rh + 10), at = 0.95 + 0.3 * i; 때.push([at, "톡"]);
      const p = 쉬움((t - at) / 0.3); if (p <= 0) return;
      ctx.save(); ctx.globalAlpha *= p; ctx.fillStyle = "rgba(255,255,255,.14)"; ctx.fillRect(r.x + 30, y, r.w - 60, 2);
      ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillStyle = "#fff"; 맞춤(ctx, row[0], 226, 40, 22, 800); ctx.fillText(row[0], r.x + 36, y + rh / 2);
      const fs = 줄.length >= 3 ? 48 : 58;
      [[row[1], A], [row[2], B]].forEach(([글, c], j) => { 맞춤(ctx, 글, c.w - 16, fs, 22); ctx.fillStyle = 강조; ctx.strokeStyle = "#141414"; ctx.lineWidth = 4; ctx.lineJoin = "round";
        굴림(ctx, 글, c.x - 20 + c.w / 2, y + rh / 2 + 24 * (1 - p), Math.max(0, (t - at - 0.08 * j) / 0.85)); });
      ctx.restore();
    });
    if (낫 && t > 켬 + 0.1) { const c = 낫 === "right" ? B : A, s = 뒤튐((t - 켬 - 0.1) / 0.35, 3); ctx.save(); ctx.translate(c.x + 5, Y0 + r.y + 71); ctx.scale(s, s);
      ctx.beginPath(); ctx.arc(0, 0, 29, 0, Math.PI * 2); ctx.fillStyle = 초록; ctx.shadowColor = "rgba(126,224,138,.8)"; ctx.shadowBlur = 16; ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = "#0C0E16"; ctx.font = 글꼴(900, 38); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("✓", 0, 2); ctx.restore(); }
    return 때;
  }

  function 막대판(ctx, 판, t, 길이) {
    const 막대 = (판.bars || []).slice(0, 4).map((b) => (Array.isArray(b) ? { label: b[0], text: b[1], hi: 한값(b[1]) } : b));
    const r = { x: 60, y: 190, w: 960, h: 470 }, 바닥 = 370, 최고높이 = 250;
    카드(ctx, r, t, 0.25);
    ctx.save(); ctx.setLineDash([10, 10]); ctx.strokeStyle = "rgba(255,255,255,.10)"; ctx.lineWidth = 2;
    [0.25, 0.5, 0.75, 1].forEach((f) => { ctx.beginPath(); ctx.moveTo(r.x + 40, Y0 + r.y + 바닥 - 최고높이 * f); ctx.lineTo(r.x + r.w - 40, Y0 + r.y + 바닥 - 최고높이 * f); ctx.stroke(); });
    ctx.restore(); ctx.fillStyle = "rgba(255,255,255,.45)"; ctx.fillRect(r.x + 40, Y0 + r.y + 바닥, r.w - 80, 3);
    const n = Math.max(1, 막대.length), 최대 = Math.max(1, ...막대.map((b) => Number(b.hi || b.lo || 0))), 칸 = r.w / n, bw = [0, 200, 180, 150, 120][n];
    const 낮을수록 = 판.better === "low", 때 = [[0.12, "띵"]];
    막대.forEach((b, i) => {
      const 값 = Number(b.hi || b.lo || 0), h = Math.max(10, 최고높이 * 값 / 최대), cx = r.x + 칸 * (i + 0.5), at = 0.5 + 0.18 * i; 때.push([at, "톡"]);
      const 최선 = 막대.every((o) => (낮을수록 ? 값 <= Number(o.hi || o.lo || 0) : 값 >= Number(o.hi || o.lo || 0)));
      const 톤 = b.tone || (막대.length > 1 ? (최선 ? "good" : "mid") : "mid");
      const p = 쉬움((t - at) / 0.9), hh = h * p, y = Y0 + r.y + 바닥 - hh;
      const g = ctx.createLinearGradient(0, y + hh, 0, y);
      const [c1, c2] = 톤 === "good" ? ["#2E9A48", 초록] : 톤 === "bad" ? ["#A92E2E", 빨강] : ["#B7801C", 금];
      g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g;
      if (hh > 1) { ctx.beginPath(); ctx.roundRect(cx - bw / 2, y, bw, hh, [14, 14, 4, 4]); ctx.fill(); }
      const ns = 뒤튐((t - 0.35 - 0.12 * i) / 0.35);
      ctx.save(); ctx.translate(cx, Y0 + r.y + 바닥 + 40); ctx.scale(Math.max(0.01, ns), Math.max(0.01, ns)); ctx.fillStyle = 톤 === "good" ? 초록 : 톤 === "bad" ? 빨강 : "#fff";
      맞춤(ctx, b.label, 칸 - 12, [0, 46, 44, 38, 32][n], 22, 800); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(b.label, 0, 0); ctx.restore();
      if (p > 0) { ctx.save(); ctx.globalAlpha *= Math.min(1, p * 2); 맞춤(ctx, b.text || String(값), 칸 - 12, [0, 50, 44, 38, 32][n], 22); ctx.fillStyle = 강조; ctx.strokeStyle = "#141414"; ctx.lineWidth = 4;
        굴림(ctx, b.text || String(값), cx, y - 38, Math.max(0, (t - at) / 1.0)); ctx.restore(); }
    });
    return 때;
  }

  function 가격판(ctx, 판, t, 길이) {
    const r = { x: 60, y: 190, w: 960, h: 420 };
    카드(ctx, r, t, 0.25);
    const 앞 = 판.before || ["", ""], 뒤 = 판.after || ["", ""];
    const p1 = 쉬움((t - 0.45) / 0.35), p2 = 쉬움((t - 1.2) / 0.4);
    ctx.save(); ctx.globalAlpha *= p1; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#AAB2BE"; 맞춤(ctx, 앞[0], 380, 40, 22, 800); ctx.fillText(앞[0], r.x + 240, Y0 + r.y + 110);
    맞춤(ctx, 앞[1], 400, 66, 30); ctx.fillStyle = "#cfd5de"; ctx.fillText(앞[1], r.x + 240, Y0 + r.y + 200);
    const sw = ctx.measureText(앞[1]).width, sp = 쉬움((t - 0.9) / 0.3); ctx.strokeStyle = 빨강; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(r.x + 240 - sw / 2 - 10, Y0 + r.y + 200); ctx.lineTo(r.x + 240 - sw / 2 - 10 + (sw + 20) * sp, Y0 + r.y + 200); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.globalAlpha *= p2; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#fff"; 맞춤(ctx, "→", 80, 70, 40); ctx.fillText("→", r.x + 480, Y0 + r.y + 200);
    맞춤(ctx, 뒤[0], 380, 40, 22, 800); ctx.fillStyle = 강조; ctx.fillText(뒤[0], r.x + 720, Y0 + r.y + 110);
    맞춤(ctx, 뒤[1], 400, 84, 30); ctx.fillStyle = 강조; ctx.strokeStyle = "#141414"; ctx.lineWidth = 5; 굴림(ctx, 뒤[1], r.x + 720, Y0 + r.y + 205, Math.max(0, (t - 1.2) / 0.9));
    if (판.badge) { const bs = 뒤튐((t - 1.9) / 0.35, 3); ctx.save(); ctx.translate(r.x + 720, Y0 + r.y + 320); ctx.scale(Math.max(0.01, bs), Math.max(0.01, bs)); ctx.font = 글꼴(900, 40);
      const w = ctx.measureText(판.badge).width + 50; G().둥근(ctx, -w / 2, -32, w, 64, 32); ctx.fillStyle = 빨강; ctx.fill();
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(판.badge, 0, 2); ctx.restore(); }   // 굴림()이 왼쪽 정렬로 바꿔 둠 → 다시 가운데
    ctx.restore();
    return [[0.12, "띵"], [0.45, "톡"], [0.9, "톡"], [1.2, "톡"], [1.9, "톡"]];
  }

  function 숫자판(ctx, 판, t, 길이) {
    const 줄 = (판.numbers || []).slice(0, 3), n = Math.max(1, 줄.length), rh = Math.min(130, Math.floor(400 / n));
    const r = { x: 60, y: 190, w: 960, h: Math.min(470, 40 + n * (rh + 12)) };
    카드(ctx, r, t, 0.25); const 때 = [[0.12, "띵"]], 칸 = [];
    줄.forEach(([이름, 값, 말], i) => {
      const at = 0.55 + i * 0.32, y = r.y + 24 + i * (rh + 12); 때.push([at, "톡"]); 칸.push({ x: r.x + 16, y, w: r.w - 32, h: rh });
      const p = 쉬움((t - at) / 0.3); if (p <= 0) return;
      ctx.save(); ctx.globalAlpha *= p; G().둥근(ctx, r.x + 16, Y0 + y, r.w - 32, rh, 18); ctx.fillStyle = "rgba(255,255,255,.05)"; ctx.fill();
      ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillStyle = "#fff"; 맞춤(ctx, 이름, 420, 44, 24, 800); ctx.fillText(이름, r.x + 50, Y0 + y + rh / 2 - (말 ? 16 : 0));
      if (말) { ctx.font = 글꼴(600, 28); ctx.fillStyle = "#AAB2BE"; ctx.fillText(String(말).slice(0, 24), r.x + 52, Y0 + y + rh / 2 + 26); }
      맞춤(ctx, 값, 440, 66, 28); ctx.fillStyle = 강조; ctx.strokeStyle = "#141414"; ctx.lineWidth = 4; 굴림(ctx, 값, r.x + r.w - 50, Y0 + y + rh / 2, Math.max(0, (t - at) / 0.85), "right");
      ctx.restore();
    });
    테두리(ctx, 칸, t, 0.55 + n * 0.32 + 0.2, 길이 - 0.3);
    return 때;
  }

  function 그리기(ctx, 판, t, 길이) {
    if (!판) return [];
    const 나감 = t > 길이 - 0.3 ? Math.max(0, (길이 - t) / 0.3) : 1;
    ctx.save(); ctx.globalAlpha = 나감;
    머리(ctx, 판, t);
    let 때 = [];
    const 종류 = 판.layout;
    if (종류 === "vs") 때 = vs판(ctx, 판, t, 길이);
    else if (종류 === "bars") 때 = 막대판(ctx, 판, t, 길이);
    else if (종류 === "price") 때 = 가격판(ctx, 판, t, 길이);
    else if (종류 === "numbers") 때 = 숫자판(ctx, 판, t, 길이);
    else 때 = 줄판(ctx, 판, t, 길이, 종류 === "route");
    ctx.restore();
    return 때;
  }

  function 쓸수있나(판) {
    if (!판 || typeof 판 !== "object") return false;
    return !!((판.checks && 판.checks.length) || (판.route && 판.route.length) || (판.rows && 판.rows.length) || (판.bars && 판.bars.length >= 2) ||
      (판.after && 판.before) || (판.numbers && 판.numbers.length));
  }

  전역.HW판 = { 그리기, 쓸수있나 };
})(window);
