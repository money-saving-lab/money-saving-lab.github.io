/* ══════════════════════════════════════════════════════════════
   HW 숏츠 메이커 📱 폰 단독 — 살펴보기 · 대본 · 컷 계획 (2026-10-01 밤 · 서버판 만들기.py·미디어.py 를 폰으로 옮김)
   ① 살펴보기: 영상마다 1.2초 간격 샘플(작게) → 밝기·선명·움직임·흔들림·주인공 자리(가장자리 무게중심) → 점수
   ② 대본: 제미나이 열쇠가 있으면(지인 본인 열쇠 · 폰 안에만) 모음판 그림 + 분야 지침 → JSON · 없거나 실패하면 규칙 대본(한 줄 요청만으로)
      ★사실·숫자는 한 줄 요청·화면 글자에 있는 것만★ (숫자검사 · 금지말) · 스톡 영상 ✗ (고객 소재만)
   ③ 컷 계획: 장면 길이 나누기 · 컷 템포(분야 컷초 × 세기 × 원본 소리면 1.25) · 훅 첫 컷 = 가장 센 움직이는 장면 · 같은 영상 이웃 자리 피하기 ·
      클로즈업 번갈아(1.0/1.3) · 컷 효과(세기별 줌·당기기·흔들림) · 꼬리 컷 짧게 안 남김
   ══════════════════════════════════════════════════════════════ */
"use strict";
(function (전역) {
  const 길이초 = { 짧게: 25, 보통: 40, 길게: 55 };
  const 세기값 = {
    은은: { 펀치: 0.6, 소리: 0.65, 템포: 1.35, 확대: 1.15, 스케치: "없음", 화면빛: false },
    보통: { 펀치: 1.0, 소리: 1.0, 템포: 1.0, 확대: 1.3, 스케치: "첫장면", 화면빛: true },
    화려: { 펀치: 1.45, 소리: 1.3, 템포: 0.82, 확대: 1.35, 스케치: "모든장면", 화면빛: true },
  };
  const 무작위 = (a, b) => a + Math.random() * (b - a);

  function 찾기(v, t) {
    return new Promise((ok) => {
      const 끝 = () => { v.removeEventListener("seeked", 끝); clearTimeout(타); ok(); };
      const 타 = setTimeout(끝, 3000);
      v.addEventListener("seeked", 끝);
      v.currentTime = Math.max(0, t);
    });
  }

  /* ── ① 살펴보기 ── */
  function 재기(그림, w, h) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const d = c.getContext("2d", { willReadFrequently: true }); d.drawImage(그림, 0, 0, w, h);
    const px = d.getImageData(0, 0, w, h).data, g = new Float32Array(w * h);
    let 합 = 0;
    for (let i = 0; i < w * h; i++) { g[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]; 합 += g[i]; }
    let 라 = 0, gx = 0, gy = 0, gs = 0;
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x, l = Math.abs(4 * g[i] - g[i - 1] - g[i + 1] - g[i - w] - g[i + w]); 라 += l;
      const 사전 = Math.exp(-(((x / w - 0.5) / 0.42) ** 2 + ((y / h - 0.45) / 0.45) ** 2));      // 가운데를 조금 더
      const m = l * 사전; gx += x * m; gy += y * m; gs += m;
    }
    const 선명 = Math.max(0, Math.min(1, Math.log10(Math.max(1, 라 / (w * h)) * 8) / 2));
    return { 밝기: 합 / (w * h), 선명, x: gs ? gx / gs / w : 0.5, y: gs ? gy / gs / h : 0.45, g, c };
  }

  async function 살펴보기(소재들, 알림 = () => {}) {
    const 후보 = []; let n = 0;
    for (const [fi, s] of 소재들.entries()) {
      if (s.종류 === "사진") {
        const m = 재기(s.el, 90, Math.round(90 * s.h / s.w));
        n++; 후보.push({ n, 파일: fi, 종류: "사진", t: 0, 밝기: m.밝기, 선명: m.선명, 움직임: 0, 흔들림: 0, x: m.x, y: m.y, 썸: 작은그림(s.el, s) });
        continue;
      }
      const v = s.el, 개수 = Math.max(3, Math.min(14, Math.round(s.길이 / 1.2)));
      const pw = 72, ph = Math.max(40, Math.round(72 * s.h / Math.max(1, s.w)));
      for (let j = 0; j < 개수; j++) {
        const t = Math.min(s.길이 - 0.35, 0.25 + (s.길이 - 0.6) * (j + 0.5) / 개수);
        await 찾기(v, t); const a = 재기(v, pw, ph); const 썸 = 작은그림(v, s);
        await 찾기(v, Math.min(s.길이 - 0.05, t + 0.25)); const b = 재기(v, pw, ph);
        let 차 = 0; for (let i = 0; i < a.g.length; i++) 차 += Math.abs(a.g[i] - b.g[i]);
        const 움직임 = 차 / a.g.length / 255;
        n++; 후보.push({ n, 파일: fi, 종류: "영상", t: Math.round(t * 100) / 100, 밝기: a.밝기, 선명: a.선명, 움직임, 흔들림: Math.max(0, Math.min(1, (움직임 - 0.18) / 0.2)), x: a.x, y: a.y, 썸 });
      }
      알림("🔍 살펴보는 중 " + (fi + 1) + "/" + 소재들.length, 0.02 + 0.1 * (fi + 1) / 소재들.length);
    }
    for (const c of 후보) {
      const 어둠 = Math.max(0, (60 - c.밝기) / 60), 밝음 = Math.max(0, (c.밝기 - 225) / 30);
      const 움점 = c.종류 === "사진" ? 0.3 : c.움직임 < 0.015 ? -0.3 : c.움직임 < 0.14 ? 1.2 : c.움직임 < 0.25 ? 0.4 : -1.2;
      c.매력 = 5; c.점수 = Math.round((5 + 2.2 * (c.선명 - 0.5) + 움점 - 3 * 어둠 - 1.5 * 밝음 - 2.5 * c.흔들림) * 100) / 100;
    }
    return 후보;
  }

  function 작은그림(el, s) {                                // 고치기 화면·제미나이 모음판용 (180×320 덮어 자르기)
    const c = document.createElement("canvas"); c.width = 180; c.height = 320; const d = c.getContext("2d");
    const 비 = Math.max(180 / s.w, 320 / s.h); d.drawImage(el, (180 - s.w * 비) / 2, (320 - s.h * 비) / 2, s.w * 비, s.h * 비);
    return c;
  }

  /* ── ② 대본: 제미나이 (선택) ── */
  const 주소 = "https://generativelanguage.googleapis.com/v1beta";
  const 좋아하는순 = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-flash-latest", "gemini-3.5-flash-lite", "gemini-flash-lite-latest", "gemini-2.5-flash"];
  async function 모델고르기(열쇠) {
    try { const 기억 = JSON.parse(localStorage.getItem("hw모델") || "null"); if (기억 && Date.now() - 기억.때 < 86400000) return 기억.이름; } catch (e) {}
    const r = await fetch(주소 + "/models?pageSize=200", { headers: { "x-goog-api-key": 열쇠 } });
    if (!r.ok) throw new Error("제미나이 열쇠를 확인해 주세요 (" + r.status + ")");
    const 이름들 = ((await r.json()).models || []).filter((m) => (m.supportedGenerationMethods || []).includes("generateContent")).map((m) => m.name.replace("models/", ""));
    const 고름 = 좋아하는순.find((x) => 이름들.includes(x)) || 이름들.find((x) => /flash/.test(x)) || 이름들[0];
    try { localStorage.setItem("hw모델", JSON.stringify({ 이름: 고름, 때: Date.now() })); } catch (e) {}
    return 고름;
  }

  function 모음판(후보들) {                                  // 12칸(4×3) · 칸마다 노란 번호 — 서버판 미디어.모음판과 같음
    const 판들 = [];
    for (let k = 0; k < 후보들.length; k += 12) {
      const 칸들 = 후보들.slice(k, k + 12), c = document.createElement("canvas"); c.width = 4 * 200; c.height = Math.ceil(칸들.length / 4) * 340;
      const d = c.getContext("2d"); d.fillStyle = "#18181c"; d.fillRect(0, 0, c.width, c.height);
      칸들.forEach((x, i) => { const cx = (i % 4) * 200, cy = Math.floor(i / 4) * 340; d.drawImage(x.썸, cx + 10, cy + 10, 180, 320);
        d.fillStyle = "#FFD069"; d.fillRect(cx + 4, cy + 4, 60, 44); d.fillStyle = "#0a0a0a"; d.font = "900 32px Pretendard, sans-serif"; d.textAlign = "center"; d.textBaseline = "middle"; d.fillText(String(x.n), cx + 34, cy + 27); });
      판들.push(c.toDataURL("image/jpeg", 0.8).split(",")[1]);
    }
    return 판들;
  }

  function JSON풀기(글) {
    글 = String(글 || "").replace(/^```(?:json)?/m, "").replace(/```\s*$/m, "");
    const a = 글.indexOf("{"), b = 글.lastIndexOf("}");
    return JSON.parse(글.slice(a, b + 1));
  }

  async function 제미나이대본(열쇠, 분, 요청, 가게, 후보, 옵션, 목표, 다시) {
    const 모델 = await 모델고르기(열쇠);
    const 보낼 = 후보.length > 84 ? Array.from({ length: 84 }, (_, i) => 후보[Math.floor(i * 후보.length / 84)]) : 후보;
    const 판들 = 모음판(보낼);
    const 요청서 = `너는 한국어 세로 숏츠(9:16 · ${목표.초}초 안팎) 편집 감독이자 자막 작가다. 사용자가 직접 찍은 영상·사진만으로 만든다(스톡 ✗).
그림은 사용자 영상에서 뽑은 장면이며 칸마다 노란 번호가 있다.
[분야 지침]
${분.지침}
[사용자 요청] ${요청 || "(없음 — 화면에 보이는 것만으로)"}
[가게·채널 이름] ${가게 || "(없음)"}
[소리 방식] ★목소리 없음★ — 「말」 은 화면 아래 큰 자막으로만 보인다(${옵션.소리 === "원본" ? "현장 소리가 같이 나감" : "음악 위에"}). 한 장면 1~2마디(8~26자) · 짧고 센 말.
[규칙]
1. 사실·숫자·가격·이름·경력·기간은 [사용자 요청] 과 화면 글자에 있는 것만. 없는 숫자 ✗ (계산해 만든 숫자도 ✗).
2. 화면에 없는 장면·후기 ✗. 사람 이름·나이 짐작 ✗.
3. 장면 ${목표.장면[0]}~${목표.장면[1]}개 · 자막 전체 약 ${목표.글자}자 · 1장면(훅)은 12~26자 한 문장 · 말끝 단정적.
4. 숫자는 아라비아 숫자 · 기호 ~ → $ ✗ · 영어 철자 ✗.
5. 장면마다 "말" · "화면글"(16자 이내) · "컷"(그 장면에 쓸 칸 번호 2~4개 · 실제 흐름 순서 · 훅은 매력 높고 움직임 있는 것 · 한 번호는 되도록 한 번).
6. 정보판(선택 · 2개까지 · 1·2번째·마지막 장면 ✗ · 판 안 글·숫자는 그 장면 「말」 에 나온 것만): 좋은 종류 ${(분.판 || []).join(", ")}
   {"layout":"checklist","kicker":"8자","title":"제목 【강조】","checks":["…"]} · {"layout":"route","kicker":"…","title":"…","route":[["단계","한마디"]]} ·
   {"layout":"vs","kicker":"…","title":"…","left":"…","right":"…","rows":[["항목","왼","오른"]],"better":"left"} · {"layout":"numbers","kicker":"…","title":"…","numbers":[["이름","값","한마디"]]} ·
   {"layout":"price","kicker":"…","title":"…","before":["이름","값"],"after":["이름","값"],"badge":"…"} · {"layout":"bars","kicker":"…","title":"…","bars":[["이름","값"]],"better":"low"}
7. 마지막 장면 = 행동 유도(저장·프로필·문의 중 요청에 맞는 것) 한 문장.
8. 썸네일 글 16자 이내 · 핵심 하나만 [[ ]] · 훅딱지 10자 이내.
그리고 칸마다 주인공(핵심 동작·머리 모양·물건) 가운데 자리 x,y(0~1) · 매력(1~10) · 클로즈업 여부 · 또렷한 얼굴 수.
${다시 || ""}
JSON 만: {"칸":[{"n":1,"설명":"…","매력":7,"x":0.5,"y":0.4,"클로즈업":false,"얼굴":0}],"보이는사실":["…"],"훅후보":["12~26자","…","…"],"제목":"40자","훅딱지":"…","썸네일":{"글":"…[[…]]…","부제":"12자"},"설명":"2~3줄","태그":["…"],"장면":[{"말":"…","화면글":"…","컷":[1,2],"정보판":null}]}`;
    const 몸 = { contents: [{ parts: [{ text: 요청서 }].concat(판들.map((b) => ({ inline_data: { mime_type: "image/jpeg", data: b } }))) }],
      generationConfig: { temperature: 0.7, responseMimeType: "application/json" } };
    const r = await fetch(주소 + "/models/" + 모델 + ":generateContent", { method: "POST", headers: { "x-goog-api-key": 열쇠, "Content-Type": "application/json" }, body: JSON.stringify(몸) });
    if (!r.ok) throw new Error("제미나이 응답 " + r.status);
    const j = await r.json();
    const 글 = (((j.candidates || [])[0] || {}).content || {}).parts?.map((p) => p.text || "").join("") || "";
    return JSON풀기(글);
  }

  /* 검사 (서버판 _검사 · 숫자검사 · 금지말 · 정보판 자리) */
  const 수꼴 = /\d[\d,.]*/g;
  function 수값들(글) { return (String(글 || "").match(수꼴) || []).map((x) => parseFloat(x.replace(/,/g, ""))).filter((x) => !isNaN(x)); }
  function 근거없는수(글, 근거) {
    return (String(글 || "").match(/\d[\d,.]*/g) || []).filter((x) => { const v = parseFloat(x.replace(/,/g, "")); return !(v <= 5 && /\d\s*(단계|번째|가지)/.test(글)) && !근거.some((g) => Math.abs(g - v) <= Math.max(0.01, Math.abs(g) * 0.01)); });
  }
  function 대본검사(d, 분, 근거, 목표) {
    const 까닭 = [];
    const 장면 = (d.장면 || []).filter((s) => s && String(s.말 || "").trim());
    if (장면.length < 목표.장면[0] - 1 || 장면.length > 목표.장면[1] + 1) 까닭.push("장면 수 " + 장면.length);
    const 금지 = (분.금지말 || []).map((p) => new RegExp(p));
    for (const s of 장면) {
      s.말 = String(s.말).replace(/\s+/g, " ").trim(); s.화면글 = String(s.화면글 || "").slice(0, 16);
      const 없음 = 근거없는수(s.말, 근거).concat(근거없는수(s.화면글, 근거));
      if (없음.length) 까닭.push("근거 없는 숫자 " + 없음.join("·"));
      for (const p of 금지) if (p.test(s.말) || p.test(s.화면글)) 까닭.push("금지 표현 " + s.말.slice(0, 20));
    }
    if (장면[0] && 장면[0].말.length > 26) {                 // 훅은 12~26자 (나레이션이면 길게 읽어 훅이 7초가 됐다 · 완성판 3)
      const 짧은 = (d.훅후보 || []).map((h) => String(h).trim()).find((h) => h.length >= 10 && h.length <= 26 && !근거없는수(h, 근거).length);
      if (짧은) 장면[0].말 = 짧은; else 까닭.push("훅이 김 (" + 장면[0].말.length + "자) — 12~26자 한 문장");
    }
    장면.forEach((s, i) => { if (i < 2 || i === 장면.length - 1 || !전역.HW판.쓸수있나(s.정보판)) s.정보판 = null;
      else { const 글 = JSON.stringify(s.정보판); if (근거없는수(글, 근거.concat(수값들(s.말))).length) s.정보판 = null; } });
    d.장면 = 장면;
    return 까닭;
  }

  /* ── ② 규칙 대본 (열쇠 없을 때 · 한 줄 요청만으로 · 지어내기 ✗) ── */
  function 규칙대본(분, 요청, 가게, 목표) {
    const 항목 = String(요청 || "").split(/[·•,\n/|]|\s-\s/).map((x) => x.trim()).filter((x) => x.length >= 2).slice(0, 10);
    const 자르기 = (g, n) => { g = g.replace(/\s+/g, " ").trim(); if (g.length <= n) return g; const k = g.lastIndexOf(" ", n); return (k >= 6 ? g.slice(0, k) : g.slice(0, n)).trim(); };
    const 이름 = 분.이름.replace(/·/g, " ");
    const 훅 = 항목[0] ? 자르기(항목[0], 18) + (항목[0].length <= 12 ? ", 직접 보여 드릴게요" : "") : (가게 ? 가게 + " 현장, 직접 보여 드릴게요" : 이름 + " 현장, 직접 보여 드릴게요");
    const 본문 = 항목.slice(1);
    const 끝말 = 항목.find((x) => /DM|문의|예약|상담|전화|프로필/.test(x));
    const 기본말 = [(가게 ? 가게 + "에서 " : "") + "직접 찍은 영상이에요", "한 장면씩 천천히 보세요", "이 순서 그대로 진행돼요", "궁금하면 끝까지 보세요", "현장 분위기 그대로예요"];
    const n = Math.max(목표.장면[0], Math.min(목표.장면[1], 본문.length + 2));
    const 장면 = [{ 말: 훅, 화면글: "", 정보판: null }];
    let k = 0;
    for (let i = 1; i < n - 1; i++) {
      const 말 = 본문[i - 1] && 본문[i - 1] !== 끝말 ? 본문[i - 1] : 기본말[k++ % 기본말.length];
      장면.push({ 말: 자르기(말, 30), 화면글: i === 1 ? 자르기(가게 || 항목[0] || 이름, 14) : 자르기(말, 14), 정보판: null });
    }
    장면.push({ 말: 끝말 ? 자르기(끝말, 26) + " 편하게 연락 주세요" : "저장해 두고 궁금한 점은 프로필로 문의해 주세요", 화면글: 끝말 ? 자르기(끝말, 14) : "프로필에서 문의", 정보판: null });
    // 📋 규칙 정보판 (열쇠 없어도 2종까지) — 판 안의 글 = 한 줄 요청 그대로 (지어낸 말·숫자 없음) · 1·2번째·마지막 장면 ✗ · 같은 종류 연달아 ✗
    const 정리 = 본문.filter((x) => x !== 끝말).slice(0, 4);           // 첫 항목(훅·제목에 쓰임)은 판에서 뺌
    const 숫자든 = 본문.filter((x) => x !== 끝말 && /\d/.test(x)).slice(0, 3);
    const 자리들 = []; for (let i = 2; i < 장면.length - 1; i++) 자리들.push(i);
    const 판들 = [];
    if (정리.length >= 3) 판들.push({ 말: "한눈에 정리했어요", 판: { layout: "checklist", kicker: "한눈에", title: "【핵심】만 정리", checks: 정리.slice(0, 3).map((x) => 자르기(x, 16)) } });
    if (숫자든.length >= 2) {
      판들.push({ 말: "숫자로 보면 이래요", 판: { layout: "numbers", kicker: "숫자로", title: "【숫자】로 보기", numbers: 숫자든.map((x) => {
        const m = x.match(/(?:약\s?)?\d[\d,.]*\s?(?:만|천|백)?\s?[^\s·,]*/); const 값 = m ? m[0].trim() : x; const 이름 = 자르기(x.replace(값, "").trim() || x, 10);
        return [이름, 자르기(값, 10), ""]; }) } });
    } else if (정리.length >= 3) {
      판들.push({ 말: "순서대로 다시 볼게요", 판: { layout: "route", kicker: "순서대로", title: "【한 장면씩】 정리", route: 정리.slice(0, 4).map((x) => [자르기(x, 14), ""]) } });
    }
    판들.slice(0, 자리들.length >= 3 ? 2 : 자리들.length ? 1 : 0).forEach((p, k) => {
      const i = 자리들.length >= 3 ? 자리들[k === 0 ? Math.floor(자리들.length / 3) : 자리들.length - 1] : 자리들[k]; if (i == null || 장면[i].정보판) return;
      장면[i].말 = p.말; 장면[i].화면글 = ""; 장면[i].정보판 = p.판;
    });
    const 첫 = 항목[0] || 이름;
    const 수 = (첫.match(/\d[\d,.]*\s?[^\s]*/) || [""])[0];
    return { 제목: 자르기((가게 ? 가게 + " " : "") + 첫, 40), 훅딱지: "⚠ 저장 필수", 썸네일: { 글: 수 ? 자르기(첫.replace(수, "[[" + 수 + "]]"), 20) : "[[" + 자르기(첫, 10) + "]]", 부제: 자르기(가게 || 항목[1] || "", 12) },
      설명: (가게 ? 가게 + " · " : "") + 항목.join(" · "), 태그: [이름, 가게].filter(Boolean), 장면, _규칙: true };
  }

  async function 대본(분, 요청, 가게, 후보, 옵션, 열쇠, 알림 = () => {}) {
    const 초 = 길이초[옵션.길이] || 40, 장면수 = Math.max(4, Math.min(9, Math.round((초 - 4.5) / 5.5) + 1));
    const 목표 = { 초, 장면: [Math.max(4, 장면수 - 1), 장면수 + 1], 글자: Math.max(60, Math.round((초 - 4.5) * 4.2 / 10) * 10) };
    const 근거 = 수값들(요청 + " " + 가게);
    if (열쇠) {
      let 다시 = "";
      for (let 번 = 0; 번 < 3; 번++) {
        try {
          알림("✍ 제미나이로 대본 쓰는 중… (" + (번 + 1) + "번째)", 0.14 + 번 * 0.02);
          const d = await 제미나이대본(열쇠, 분, 요청, 가게, 후보, 옵션, 목표, 다시);
          for (const c of d.칸 || []) { const x = 후보.find((h) => h.n === Number(c.n)); if (x) Object.assign(x, { 설명: String(c.설명 || ""), 매력: Number(c.매력) || 5, x: Number(c.x ?? x.x), y: Number(c.y ?? x.y), 클로즈업: !!c.클로즈업, 얼굴: Number(c.얼굴) || 0 }); }
          for (const x of 후보) x.점수 = Math.round((x.점수 + (x.매력 - 5) * 0.8) * 100) / 100;
          근거.push(...수값들((d.보이는사실 || []).join(" ")));
          const 까닭 = 대본검사(d, 분, 근거, 목표);
          if (!까닭.length) return Object.assign(d, { _모델: "제미나이", _목표: 목표 });
          다시 = "[지난번에 떨어진 이유 — 꼭 고칠 것]\n" + 까닭.map((x) => "- " + x).join("\n");
        } catch (e) { 알림("⚠ 제미나이 실패 → " + e.message.slice(0, 40), 0.15); if (/열쇠|40[13]/.test(e.message)) break; }
      }
    }
    const d = 규칙대본(분, 요청, 가게, 목표);
    대본검사(d, 분, 근거.concat(수값들(요청)), 목표);
    return Object.assign(d, { _모델: "규칙", _목표: 목표 });
  }

  /* ── ③ 컷 계획 (서버판 만들기.컷계획 그대로) ── */
  function 장면길이(장면들, 초) {
    const 본 = Math.max(6, 초 - 4.2 - 2.35 - 0.1 * (장면들.length - 1));
    const 무게 = 장면들.slice(1).map((s) => Math.max(8, s.말.length) + (s.정보판 ? 10 : 0)), 합 = 무게.reduce((a, b) => a + b, 0) || 1;
    장면들[0].길이 = Math.max(1.6, Math.min(2.6, 0.9 + 장면들[0].말.length * 0.07));
    // 장면 하나가 너무 길면 지루하다 (시험판 1: 정보판 장면 15초) → 정보판 3.6~6.5초 · 보통 2.2~5초 · 남으면 영상이 짧아짐(소재 모자랄 때 자동 줄이기)
    장면들.slice(1).forEach((s, i) => (s.길이 = Math.round(Math.min(s.정보판 ? 6.5 : 5.0, Math.max(s.정보판 ? 3.6 : 2.2, 본 * 무게[i] / 합)) * 100) / 100));
  }

  function 컷계획(장면들, 후보, 소재들, 분, 옵션) {
    const 세 = 세기값[옵션.세기] || 세기값.보통;
    const 번호로 = new Map(후보.map((c) => [c.n, c]));
    const 좋은 = 후보.filter((c) => c.점수 >= 3).length ? 후보.filter((c) => c.점수 >= 3) : 후보;
    const 쓴 = new Map(), 쓴자리 = []; let 앞파일 = null, 총컷 = 0;
    const 훅점수 = (c) => c.점수 + (c.종류 === "영상" ? 1 : 0) + (c.클로즈업 ? 0.6 : 0) - (c.흔들림 > 0.5 ? 2 : 0);
    function 고르기(선호, 이번) {
      for (const n of 선호) { const c = 번호로.get(n); if (c && !이번.has(n) && !쓴.get(n) && !(쓴자리.length && 쓴자리[쓴자리.length - 1][0] === c.파일 && Math.abs(쓴자리[쓴자리.length - 1][1] - c.t) < 2.5)) return c; }
      const 남 = 좋은.filter((c) => !이번.has(c.n)); const 풀 = 남.length ? 남 : 후보;
      let 최고 = null, 값최고 = -1e9;
      for (const c of 풀) { const 가까움 = 쓴자리.filter(([f, t]) => f === c.파일 && Math.abs(t - c.t) < 2.5).length;
        const 값 = c.점수 - 2 * (쓴.get(c.n) || 0) - (c.파일 === 앞파일 ? 4 : 0) - 2.5 * 가까움 + Math.random() * 0.6; if (값 > 값최고) { 값최고 = 값; 최고 = c; } }
      return 최고;
    }
    장면들.forEach((s, i) => {
      const 필요 = s.길이 + 0.1 + (i === 0 ? 0.25 : 0);
      const 배 = 세.템포 * (옵션.소리 === "원본" ? 1.25 : 1);
      let lo, hi;
      if (i === 0) { const h = 분.훅컷초 || 0.9; lo = h * 0.85; hi = h * 1.2; }
      else if (s.정보판) { lo = 2.0; hi = 3.2; }
      else { lo = Math.max(0.7, (분.컷초 || [1, 2])[0] * 배); hi = Math.min(2.6, (분.컷초 || [1, 2])[1] * 배); }
      let 선호 = (s.컷 || []).map(Number);
      if (i === 0) { const 최고 = 후보.reduce((a, b) => (훅점수(b) > 훅점수(a) ? b : a)); 선호 = [최고.n].concat(선호.filter((n) => n !== 최고.n)); }
      const 컷들 = [], 이번 = new Set(); let 남은 = 필요, k = 0;
      while (남은 > 0.05) {
        let d = 무작위(lo, hi);
        if (남은 - d < lo) d = 남은 <= hi + lo * 0.5 ? 남은 : 남은 / 2;
        const c = 고르기(선호, 이번); 이번.add(c.n); 쓴.set(c.n, (쓴.get(c.n) || 0) + 1); 쓴자리.push([c.파일, c.t]);
        const x = 소재들[c.파일], 컷 = { 파일: c.파일, n: c.n, x: c.x, y: c.y, 확대: 1, 시작: 0, 효과: "" };
        if (x.종류 === "영상") {
          d = Math.min(d, Math.max(0.5, x.길이 - 0.15));
          const 반복 = 쓴.get(c.n) - 1; let 시작 = c.t - d * 0.35 + 반복 * d * 0.8;
          if (시작 + d > x.길이 - 0.05) 시작 = Math.max(0, c.t - d * 0.35 - 반복 * d * 0.8);
          컷.시작 = Math.round(Math.min(Math.max(0, 시작), Math.max(0, x.길이 - d - 0.05)) * 1000) / 1000;
        } else 컷.방향 = 총컷 % 2 ? -1 : 1;
        if (!c.클로즈업 && Math.min(x.w, x.h) >= 900) 컷.확대 = i === 0 ? 1.15 : (k % 2 ? 세.확대 : 1.0);
        if (i > 0) 컷.효과 = x.종류 === "사진" ? (옵션.세기 !== "은은" ? "입체" : "") : 옵션.세기 === "화려" ? ["줌", "", "흔들림", "당기기"][총컷 % 4] : 옵션.세기 === "보통" ? (총컷 % 3 === 2 ? "줌" : "") : "";
        컷.길이 = Math.round(d * 1000) / 1000;
        컷들.push(컷); 앞파일 = c.파일; 남은 -= d; k++; 총컷++;
      }
      s.컷 = 컷들;
    });
    return 총컷;
  }

  /* ── 🎙 나레이션 (선택 · 기본 꺼짐) — 지인 본인 제미나이 열쇠의 TTS 모델 (모델 이름은 목록으로 확인 · 짐작 ✗)
     폰 기본 읽어주기(speechSynthesis)는 소리를 영상 파일에 담을 수 없어서(브라우저가 소리를 밖으로 안 줌) 못 씀 ── */
  const TTS순 = ["gemini-3.8-flash-tts", "gemini-3.1-flash-tts-preview", "gemini-2.5-flash-preview-tts", "gemini-3.8-flash-lite-tts"];
  async function TTS모델(열쇠) {
    try { const 기억 = JSON.parse(localStorage.getItem("hw목소리모델") || "null"); if (기억 && Date.now() - 기억.때 < 86400000) return 기억.이름; } catch (e) {}
    const r = await fetch(주소 + "/models?pageSize=200", { headers: { "x-goog-api-key": 열쇠 } });
    if (!r.ok) throw new Error("제미나이 열쇠를 확인해 주세요 (" + r.status + ")");
    const 이름들 = ((await r.json()).models || []).map((m) => m.name.replace("models/", "")).filter((x) => /tts/i.test(x));
    const 고름 = TTS순.find((x) => 이름들.includes(x)) || 이름들[0];
    if (!고름) throw new Error("이 열쇠로 쓸 수 있는 목소리 모델이 없어요");
    try { localStorage.setItem("hw목소리모델", JSON.stringify({ 이름: 고름, 때: Date.now() })); } catch (e) {}
    return 고름;
  }
  function pcm버퍼(ac, 바, 율) {
    const n = Math.floor(바.length / 2), b = ac.createBuffer(1, n, 율), d = b.getChannelData(0), v = new DataView(바.buffer, 바.byteOffset, 바.byteLength);
    for (let i = 0; i < n; i++) d[i] = v.getInt16(i * 2, true) / 32768;
    return b;
  }
  function 빈소리자르기(ac, b) {                               // 앞뒤 조용한 곳 자르기 + 문장 사이 긴 쉼(0.3초↑)은 0.15초로 (엔진 목소리._쉼줄이기 뜻)
    const d = b.getChannelData(0), sr = b.sampleRate, 칸 = Math.round(sr * 0.02), 문 = Math.pow(10, -42 / 20);
    const 조용 = []; for (let i = 0; i < d.length; i += 칸) { let s = 0; const e = Math.min(d.length, i + 칸); for (let j = i; j < e; j++) s += d[j] * d[j]; 조용.push(Math.sqrt(s / Math.max(1, e - i)) < 문); }
    const 남길 = []; let k = 0;
    while (k < 조용.length && 조용[k]) k++;                       // 앞 빈소리
    let 끝 = 조용.length; while (끝 > k && 조용[끝 - 1]) 끝--;     // 뒤 빈소리
    for (let i = k; i < 끝;) {
      if (!조용[i]) { 남길.push(i); i++; continue; }
      let j = i; while (j < 끝 && 조용[j]) j++;
      const 길이 = j - i, 둘 = 길이 * 0.02 > 0.3 ? Math.round(0.15 / 0.02) : 길이;
      for (let t = 0; t < 둘; t++) 남길.push(i + t);
      i = j;
    }
    const 앞 = Math.round(0.03 * sr / 칸), 뒤 = Math.round(0.12 * sr / 칸);
    const 순서 = []; for (let t = Math.max(0, k - 앞); t < k; t++) 순서.push(t); 순서.push(...남길); for (let t = 끝; t < Math.min(조용.length, 끝 + 뒤); t++) 순서.push(t);
    const 새 = ac.createBuffer(1, Math.max(1, 순서.length * 칸), sr), o = 새.getChannelData(0);
    순서.forEach((c, n) => { const 조각 = d.subarray(c * 칸, Math.min(d.length, c * 칸 + 칸)); o.set(조각, n * 칸); });
    for (let n = 1; n < 순서.length; n++) if (순서[n] !== 순서[n - 1] + 1) {   // 이은 자리 5ms 부드럽게 (딱 소리 없게)
      const p = n * 칸, f = Math.round(sr * 0.005); for (let q = 0; q < f && p + q < o.length; q++) { o[p + q] *= q / f; if (p - q - 1 >= 0) o[p - q - 1] *= q / f; }
    }
    return 새;
  }
  async function 나레이션(장면들, 열쇠, 목소리 = "Kore", 알림 = () => {}) {
    const 모델 = await TTS모델(열쇠), ac = new OfflineAudioContext(1, 1, 48000), out = [];
    for (const [i, s] of 장면들.entries()) {
      알림("🎙 나레이션 녹음 " + (i + 1) + "/" + 장면들.length, 0.17);
      // ★읽을 글만 보낸다★ — 「밝고 또렷하게 읽어 주세요:」 같은 지시를 붙였더니 그 지시까지 소리 내 읽었다(10/2 실측 · 6.7초 중 2.8초가 지시문)
      const 몸 = { contents: [{ parts: [{ text: s.말 }] }],
        generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 목소리 } } } } };
      let 버퍼 = null;
      for (let 번 = 0; 번 < 2 && !버퍼; 번++) {
        try {
          const r = await fetch(주소 + "/models/" + 모델 + ":generateContent", { method: "POST", headers: { "x-goog-api-key": 열쇠, "Content-Type": "application/json" }, body: JSON.stringify(몸) });
          if (!r.ok) throw new Error("목소리 응답 " + r.status);
          const p = (((await r.json()).candidates || [])[0] || {}).content?.parts?.find((x) => x.inlineData || x.inline_data);
          const 자료 = p && (p.inlineData || p.inline_data); if (!자료) throw new Error("목소리가 비었어요");
          const 글 = atob(자료.data), 바 = new Uint8Array(글.length); for (let j = 0; j < 글.length; j++) 바[j] = 글.charCodeAt(j);
          const 종류 = 자료.mimeType || 자료.mime_type || "";
          버퍼 = /wav|mpeg|mp3|ogg/.test(종류) ? await ac.decodeAudioData(바.buffer) : pcm버퍼(ac, 바, Number((종류.match(/rate=(\d+)/) || [0, 24000])[1]));
          버퍼 = 빈소리자르기(ac, 버퍼);
          // 제미나이 TTS 는 천천히 읽는다(26자 훅이 약 6초) → 한 글자 0.115초 기준보다 느리면 최대 1.15배 빠르게 (높이는 조금 올라감)
          const 목표 = s.말.length * 0.115 + 0.35;
          버퍼.hw배 = Math.max(1, Math.min(1.15, 버퍼.duration / 목표));
        } catch (e) { if (번 === 1) throw e; }
      }
      out.push(버퍼);
    }
    return out;
  }

  /* ── 소재 모자랄 때 — 쓸 수 있는 초를 재서 목표 길이를 줄인다 (스톡으로 안 채움) ── */
  function 소재초(소재들) { return 소재들.reduce((a, s) => a + (s.종류 === "영상" ? Math.max(0, s.길이 - 0.3) : 2.5), 0); }

  전역.HW계획 = { 길이초, 세기값, 살펴보기, 대본, 장면길이, 컷계획, 규칙대본, 수값들, 나레이션, 소재초 };
})(window);
