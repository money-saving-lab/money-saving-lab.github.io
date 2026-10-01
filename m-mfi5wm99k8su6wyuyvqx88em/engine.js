/* ══════════════════════════════════════════════════════════════
   HW 숏츠 메이커 📱 폰 단독 엔진 (② 지인 시험판 · 2026-10-01 밤~10/2)
   서버 없이 폰 브라우저 안에서: 고객 영상·사진 → 살펴보기·대본·컷 계획(계획.js) → 캔버스 합성(그림.js·판.js) → WebCodecs H.264
   → 소리(OfflineAudioContext: 원본 소리·음악·hw 효과음 · K 가중 −14 LUFS · 한계 −3 dB) → WebCodecs AAC → 묶기.js mp4 · 썸네일 jpg
   장면 순서(엔진 영상._장면 그대로): 바탕 영상(다가가기 4.5%·구절 펀치·훅 슬램+흔들림·컷 효과) → 스케치 등장 → 훅 번쩍 → 화면 빛 →
   훅 글자+딱지 / 인트로 배지 → (정보판 장면 뒤 50% 어둡게) → 📌 고정 제목 → 정보판 / 글귀 상자+빛 → 자막 → 진행 막대 · 끝에 아웃트로 4.2초
   ★스톡 영상 ✗ — 고객이 넣은 영상·사진만★
   ══════════════════════════════════════════════════════════════ */
"use strict";
(function (전역) {
  const G = 전역.HW그림, P = 전역.HW계획, B = 전역.HW판;
  const W = 1080, H = 1920, FPS = 30, 표본율 = 48000, 쉼 = 0.1, 번짐 = 0.45;

  /* ── 소재 열기 (영상 회전·크기는 브라우저가 맞춰 줌) ── */
  async function 소재열기(파일) {
    const url = URL.createObjectURL(파일);
    const 영상 = /^video\//.test(파일.type || "") || /\.(mp4|mov|m4v|webm)$/i.test(파일.name || "");
    if (!영상) {
      const img = new Image(); img.src = url; await img.decode();
      return { 종류: "사진", 파일, url, el: img, w: img.naturalWidth, h: img.naturalHeight, 길이: 0 };
    }
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto"; v.src = url;
    v.setAttribute("playsinline", ""); v.setAttribute("muted", "");
    await new Promise((ok, no) => { v.onloadeddata = ok; v.onerror = () => no(new Error("영상을 못 열어요: " + 파일.name)); v.load(); });
    return { 종류: "영상", 파일, url, el: v, w: v.videoWidth, h: v.videoHeight, 길이: v.duration };
  }

  function 찾기(v, t) {
    return new Promise((ok) => {
      if (Math.abs(v.currentTime - t) < 0.002 && v.readyState >= 2) return ok();
      const 끝 = () => { v.removeEventListener("seeked", 끝); clearTimeout(타); ok(); };
      const 타 = setTimeout(끝, 2500);
      v.addEventListener("seeked", 끝);
      v.currentTime = t;
    });
  }

  function 덮어그리기(ctx, s, cx, cy, 확대, 흔x = 0, 흔y = 0) {
    const 비 = Math.max(W / s.w, H / s.h) * 확대, dw = s.w * 비, dh = s.h * 비;
    let x = W / 2 - cx * dw, y = H / 2 - cy * dh;
    x = Math.min(0, Math.max(W - dw, x)); y = Math.min(0, Math.max(H - dh, y));
    ctx.drawImage(s.el, x + 흔x, y + 흔y, dw, dh);
  }

  /* 🖼 사진 간이 2.5D — 깊이 모델 없이 (폰이 가볍게): 뒤 배경은 한쪽으로·주인공 자리(둥근 가면)는 반대쪽으로 조금 더 커지며 움직여 입체처럼 */
  let 앞판 = null;
  function 입체사진(ctx, c, z, p, hx, hy) {
    const 방 = (c.방향 || 1) > 0 ? 1 : -1, 이동 = 46 * (p - 0.5) * 방;
    덮어그리기(ctx, c.s, c.x ?? 0.5, c.y ?? 0.45, z * 1.06 * (c.확대 || 1), hx - 이동, hy - 이동 * 0.25);
    if (!앞판) { 앞판 = document.createElement("canvas"); 앞판.width = W; 앞판.height = H; }
    const a = 앞판.getContext("2d"); a.globalCompositeOperation = "source-over"; a.clearRect(0, 0, W, H);
    덮어그리기(a, c.s, c.x ?? 0.5, c.y ?? 0.45, z * (1.12 + 0.04 * p) * (c.확대 || 1), hx + 이동, hy + 이동 * 0.25);
    const g = a.createRadialGradient(W / 2, H * 0.47, W * 0.18, W / 2, H * 0.47, W * 0.62);
    g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)");
    a.globalCompositeOperation = "destination-in"; a.fillStyle = g; a.fillRect(0, 0, W, H);
    ctx.drawImage(앞판, 0, 0);
  }

  function 구절(글, 최대 = 16) {                          // 자막 덩이 (목소리.구절 — 숫자+단위 안 자름)
    const out = [];
    for (const 문 of String(글).match(/(?:[^.!?…]|(?<=\d)\.(?=\d))+[.!?…]*\s*/g) || [글]) {
      let r = 문.trim();
      while (r.length > 최대) {
        let 자름 = -1;
        for (let i = Math.floor(최대 * 0.45); i <= Math.min(r.length - 1, 최대 + 4); i++) {
          if (r[i] === " " && !/\d[\d,.]*\s?(?:만|천|백|억)?$/.test(r.slice(0, i)) && !/(?:^|\s)(?:약|총|최대|최소)$/.test(r.slice(0, i))) 자름 = i;
        }
        if (자름 <= 0) 자름 = 최대;
        out.push(r.slice(0, 자름).trim()); r = r.slice(자름).trim();
      }
      if (r) out.push(r);
    }
    return out;
  }

  /* ── 소리 ── */
  const 효과음이름 = ["impact", "stamp", "whoosh_airy", "pop_soft", "pop", "ding", "sparkle", "scroll", "bloom", "coin", "blip"];
  async function 효과음들(ac, 주소) {
    const out = {};
    await Promise.all(효과음이름.map(async (n) => { try { out[n] = await ac.decodeAudioData(await (await fetch(주소 + n + ".wav")).arrayBuffer()); } catch (e) {} }));
    return out;
  }

  function 합성음악(ac, 총, 크기, 결 = 0) {                  // 우리가 만든 시험용 음악 (저작권 걱정 없음) · 결: 0 밝게 · 1 잔잔 · 2 신나게
    const 버스 = ac.createGain(); 버스.gain.value = 크기;
    const 필 = ac.createBiquadFilter(); 필.type = "lowpass"; 필.frequency.value = 결 === 1 ? 2400 : 4200; 버스.connect(필); 필.connect(ac.destination);
    const 화음들 = [[[261.6, 329.6, 392], [220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7]],
      [[220, 277.2, 329.6], [196, 246.9, 293.7], [174.6, 220, 261.6], [164.8, 207.7, 246.9]],
      [[293.7, 370, 440], [246.9, 293.7, 370], [196, 246.9, 293.7], [220, 277.2, 329.6]]][결 % 3];
    const 빠르기 = [112, 92, 124][결 % 3], 박 = 60 / 빠르기;
    for (let t = 0, k = 0; t < 총 + 박 * 4; t += 박 * 4, k++) {
      for (const f of 화음들[k % 4]) {
        const o = ac.createOscillator(); o.type = "triangle"; o.frequency.value = f / 2;
        const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.07, t + 0.15); g.gain.linearRampToValueAtTime(0.0, t + 박 * 4);
        o.connect(g); g.connect(버스); o.start(t); o.stop(t + 박 * 4 + 0.05);
      }
      for (let j = 0; j < 8; j++) {                            // 반짝이는 아르페지오
        const tt = t + j * 박 / 2, f = 화음들[k % 4][j % 3] * (j % 4 === 3 ? 2 : 1);
        const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = f;
        const g = ac.createGain(); g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(결 === 1 ? 0.05 : 0.08, tt + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.35);
        o.connect(g); g.connect(버스); o.start(tt); o.stop(tt + 0.4);
      }
    }
    if (결 !== 1) for (let t = 0; t < 총; t += 박) {
      const o = ac.createOscillator(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
      const g = ac.createGain(); g.gain.setValueAtTime(0.45, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.connect(g); g.connect(버스); o.start(t); o.stop(t + 0.22);
    }
  }

  async function 소리만들기(타임라인, 총, 소리계획, 설정) {
    const ac = new OfflineAudioContext(2, Math.ceil(총 * 표본율), 표본율);
    const 효 = 설정.효과음끔 ? {} : await 효과음들(ac, 설정.효과음주소 || "sfx/");
    for (const [n, t, v] of 소리계획) { const b = 효[n]; if (!b || v <= 0) continue; const s = ac.createBufferSource(); s.buffer = b; const g = ac.createGain(); g.gain.value = v; s.connect(g); g.connect(ac.destination); s.start(Math.max(0, t - 0.035)); }
    const 경고 = [], 나레 = (타임라인.목소리 || []).length > 0;
    for (const [b, t0] of 타임라인.목소리 || []) {                // 🎙 나레이션 — 가벼운 압축 + 말소리 대역 살짝 (엔진 목소리 앞으로와 같은 뜻)
      const s = ac.createBufferSource(); s.buffer = b; s.playbackRate.value = b.hw배 || 1; const g = ac.createGain(); g.gain.value = 1.6;
      const eq = ac.createBiquadFilter(); eq.type = "peaking"; eq.frequency.value = 3200; eq.Q.value = 1.2; eq.gain.value = 2.5;
      const 압 = ac.createDynamicsCompressor(); 압.threshold.value = -20; 압.ratio.value = 2.5; 압.attack.value = 0.008; 압.release.value = 0.12;
      s.connect(eq); eq.connect(압); 압.connect(g); g.connect(ac.destination); s.start(t0);
    }
    // 🔉 원본 소리 살짝 깔기 (10/2 사장님): 나레이션(AI 목소리·내 목소리)일 땐 주변 소리를 기본으로 끈다(0%) · 옵션 「원본깔기」 10·20·30% 면 목소리 밑에 그만큼
    const 깔기 = Math.max(0, Math.min(30, Number(설정.옵션.원본깔기) || 0)) / 100;
    const 원크기 = 설정.옵션.소리 === "원본" ? 1 : 깔기;
    if (설정.옵션.소리 === "원본" || (나레 && 깔기 > 0)) {
      const 풀린 = new Map();
      for (const c of 타임라인.컷들) {
        if (c.s.종류 !== "영상") continue;
        if (!풀린.has(c.s)) {
          if (c.s.파일.size > 350 * 1048576) { 풀린.set(c.s, null); 경고.push(c.s.파일.name + " 은 커서 원본 소리를 뺐어요"); }
          else { try { 풀린.set(c.s, await ac.decodeAudioData(await c.s.파일.arrayBuffer())); } catch (e) { 풀린.set(c.s, null); } }
        }
        const b = 풀린.get(c.s); if (!b) continue;
        const 앞 = c.소리앞 || 0, 길 = c.길이 - 앞; if (길 <= 0.02) continue;
        const s = ac.createBufferSource(); s.buffer = b; const g = ac.createGain(), t0 = c.t0 + 앞;
        g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(원크기, t0 + 0.015); g.gain.setValueAtTime(원크기, t0 + 길 - 0.015); g.gain.linearRampToValueAtTime(0, t0 + 길);
        s.connect(g); g.connect(ac.destination); s.start(t0, c.시작 + 앞, 길);
      }
    }
    const 음크기 = 나레 ? 0.17 : 설정.옵션.소리 === "원본" ? 0.28 : 0.75;    // 나레이션 = 음악은 목소리보다 약 14dB 아래 (엔진 배경음악차이)
    if (설정.음악파일) {
      try {
        const b = await ac.decodeAudioData(await 설정.음악파일.arrayBuffer());
        const s = ac.createBufferSource(); s.buffer = b; s.loop = true; const g = ac.createGain();
        g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(음크기, 0.6); g.gain.setValueAtTime(음크기, Math.max(0.6, 총 - 1.2)); g.gain.linearRampToValueAtTime(0, 총);
        s.connect(g); g.connect(ac.destination); s.start(0, b.duration > 총 + 4 ? Math.random() * (b.duration - 총 - 2) : 0);
      } catch (e) { 합성음악(ac, 총, 음크기, 설정.음악결 || 0); }
    } else 합성음악(ac, 총, 음크기, 설정.음악결 || 0);
    const buf = await ac.startRendering();
    const L = buf.getChannelData(0), R = buf.getChannelData(1);
    const K = (x) => { const y = new Float32Array(x.length);
      const 걸기 = (src, dst, b, a) => { let x1 = 0, x2 = 0, y1 = 0, y2 = 0; for (let i = 0; i < src.length; i++) { const v = b[0] * src[i] + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2; x2 = x1; x1 = src[i]; y2 = y1; y1 = v; dst[i] = v; } };
      걸기(x, y, [1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585]);
      걸기(y, y, [1.0, -2.0, 1.0], [1, -1.99004745483398, 0.99007225036621]); return y; };
    const lu = (m) => -0.691 + 10 * Math.log10(m + 1e-12);
    const 재기 = () => {                                       // BS.1770 통합 음량 (K 가중 · 400ms 블록 · −70 / 상대 −10 LU 게이트)
      const KL = K(L), KR = K(R), 블 = Math.round(0.4 * 표본율), 걸음 = Math.round(0.1 * 표본율), 값 = [];
      for (let i = 0; i + 블 <= L.length; i += 걸음) { let s = 0; for (let j = i; j < i + 블; j++) s += KL[j] * KL[j] + KR[j] * KR[j]; 값.push(s / 블); }
      let 남 = 값.filter((m) => lu(m) > -70); const 평1 = 남.reduce((a, b) => a + b, 0) / Math.max(1, 남.length);
      남 = 남.filter((m) => lu(m) > lu(평1) - 10); return lu(남.reduce((a, b) => a + b, 0) / Math.max(1, 남.length));
    };
    // 한계 −4 dB (AAC 로 구우면 꼭짓점이 약 +3 dB 솟는다 · 실측: −3 → True peak −0.4 · −4.5 → −1.6 dBFS)
    // 한 번에 이득을 주면 한계에 깎여 −15.2 LUFS 로 모자랐다 → 재고 → 이득 → 부드럽게 깎기 를 세 번 되풀이해 −14 에 붙인다
    const 한 = Math.pow(10, -4 / 20), 처음 = 재기(); let 잰 = 처음;
    for (let 번 = 0; 번 < 3 && Math.abs(-14 - 잰) > 0.15; 번++) {
      const 이득 = Math.pow(10, (-14 - 잰) / 20);
      for (const ch of [L, R]) for (let i = 0; i < ch.length; i++) { const x = ch[i] * 이득, ax = Math.abs(x); ch[i] = ax <= 한 * 0.8 ? x : Math.sign(x) * (한 * 0.8 + 한 * 0.2 * Math.tanh((ax - 한 * 0.8) / (한 * 0.2))); }
      잰 = 재기();
    }
    return { buf, 잰LUFS: 처음, 마친LUFS: 잰, 경고 };
  }

  async function 소리굽기(buf) {
    if (!("AudioEncoder" in window)) return null;
    const 설정 = { codec: "mp4a.40.2", sampleRate: 표본율, numberOfChannels: 2, bitrate: 192000 };
    try { if (!(await AudioEncoder.isConfigSupported(설정)).supported) return null; } catch (e) { return null; }
    const 조각들 = []; let 설명 = null, 오류 = null;
    const enc = new AudioEncoder({ output: (c, m) => { const d = new Uint8Array(c.byteLength); c.copyTo(d); 조각들.push({ data: d }); if (m && m.decoderConfig && m.decoderConfig.description) 설명 = new Uint8Array(m.decoderConfig.description); }, error: (e) => (오류 = e) });
    enc.configure(설정);
    const L = buf.getChannelData(0), R = buf.getChannelData(1), n = 1024 * 8;
    for (let i = 0; i < L.length; i += n) {
      const k = Math.min(n, L.length - i), d = new Float32Array(k * 2); d.set(L.subarray(i, i + k), 0); d.set(R.subarray(i, i + k), k);
      const ad = new AudioData({ format: "f32-planar", sampleRate: 표본율, numberOfFrames: k, numberOfChannels: 2, timestamp: Math.round(i / 표본율 * 1e6), data: d });
      enc.encode(ad); ad.close();
    }
    await enc.flush(); enc.close();
    if (오류) throw 오류;
    return { 설명: 설명 || new Uint8Array([0x11, 0x90]), 표본율, 채널: 2, 비트: 192000, 표본: 조각들 };
  }

  async function 영상굽개(알림) {
    const 후보들 = ["avc1.640028", "avc1.4d0028", "avc1.42e028"];
    for (const codec of 후보들) for (const hw of ["prefer-hardware", "no-preference"]) {
      const 설정 = { codec, width: W, height: H, bitrate: 9_000_000, framerate: FPS, avc: { format: "avc" }, hardwareAcceleration: hw };
      try { if ((await VideoEncoder.isConfigSupported(설정)).supported) return 설정; } catch (e) {}
    }
    throw new Error("이 폰은 영상 굽기(H.264)를 못 해요 — 아이폰 iOS 26·안드로이드 크롬 최신으로 해 주세요");
  }

  /* 🗣 AI 목소리 = 엣지 읽기(열쇠 없이 · 기본 선희 · 빠르기 1.2) · 「gemini:이름」 을 고르면 내 제미나이 열쇠 목소리 */
  async function AI목소리받기(장면들, 설정, 알림) {
    const 고름 = String(설정.목소리 || "edge:ko-KR-SunHiNeural");
    if (고름 === "my") {                                       // 🎙 전용판 「내 목소리(AI)」 — 공식 음성 → 내 음색으로 변환 (voice.js)
      if (!전역.HW내목소리) throw new Error("이 앱에는 「내 목소리(AI)」 가 없어요");
      if (!전역.HW내목소리.쓸수있나()) throw new Error("⚙ 설정에 「목소리 열쇠」 를 넣어 주세요 — 없으면 「🎙 내 목소리」 로 직접 녹음할 수 있어요");
      try { return await 전역.HW내목소리.나레이션(장면들, 알림); }
      catch (e) { throw new Error("내 목소리(AI)를 만들지 못했어요 (" + String(e.message || e).slice(0, 90) + ") — 소리를 「🎙 내 목소리」 로 바꿔 직접 녹음해 주세요"); }
    }
    if (고름.startsWith("gemini:")) {
      if (!설정.열쇠) throw new Error("제미나이 목소리는 ⚙ 설정에 내 열쇠가 있어야 해요 — 엣지 목소리나 「🎙 내 목소리」 로 바꿔 주세요");
      return P.나레이션(장면들, 설정.열쇠, 고름.slice(7) || "Kore", 알림);
    }
    if (!전역.HW엣지 || !전역.HW엣지.쓸수있나()) throw new Error("이 폰 브라우저에서는 AI 목소리 서버에 붙을 수 없어요 — 「🎙 내 목소리」 로 녹음하거나 소리를 바꿔 주세요");
    try { return await P.엣지나레이션(장면들, 고름.replace(/^edge:/, ""), 1.2, 알림); }
    catch (e) { throw new Error("AI 목소리를 받지 못했어요 (" + (e.message || e) + ") — 잠시 뒤 다시 하거나 「🎙 내 목소리」 로 해 주세요"); }
  }

  /* 낱말 시각(엣지 WordBoundary)으로 자막 구절 시각 맞추기 — 구절 글자 수만큼 낱말을 차례로 묶는다 */
  function 낱말자막(조각, 낱말, 앞, 장면길이) {
    const 맨 = (s) => String(s).replace(/[\s.,!?…~·"'“”‘’()\-:]/g, "");
    let wi = 0; const out = [];
    for (const g of 조각) {
      const 필요 = 맨(g).length; let 든 = 0; const 시작 = 낱말[Math.min(wi, 낱말.length - 1)][1];
      while (wi < 낱말.length && 든 < 필요) { 든 += Math.max(1, 맨(낱말[wi][0]).length); wi++; }
      out.push([g, 앞 + 시작, 앞 + 낱말[Math.max(0, wi - 1)][2]]);
    }
    for (let k = 0; k < out.length - 1; k++) out[k][2] = out[k + 1][1];        // 다음 구절 시작까지 이어서 보여 줌
    out[0][1] = 0; out[out.length - 1][2] = 장면길이;
    return out;
  }

  /* ── 계획 만들기 (자동) ── */
  async function 자동계획(소재들, 설정, 알림) {
    const 분 = 설정.분야, 확인 = [];
    // 소재가 모자라면 스톡으로 채우지 않고 길이를 줄인다 (같은 컷 되풀이 줄이기 · 사진은 천천히 다가가기)
    let 목표초 = P.길이초[설정.옵션.길이] || 40;
    const 있는초 = P.소재초(소재들);
    if (있는초 < 목표초 * 0.7) {
      const 새 = Math.max(15, Math.min(목표초, Math.round(있는초 * 1.3)));
      if (새 < 목표초) { 확인.push("영상·사진이 적어서(" + Math.round(있는초) + "초 분량) " + 새 + "초로 줄였어요 — 더 넣으면 길어져요"); 목표초 = 새; 설정.옵션 = Object.assign({}, 설정.옵션, { 길이: 새 <= 30 ? "짧게" : 새 <= 45 ? "보통" : "길게" }); }
    }
    const 후보 = await P.살펴보기(소재들, 알림);
    const d = await P.대본(분, 설정.요청, 설정.가게, 후보, 설정.옵션, 설정.열쇠, 알림);
    const 장면들 = d.장면.map((s) => ({ 말: s.말, 화면글: s.화면글 || "", 정보판: (설정.옵션.끄기 || []).includes("정보판") ? null : s.정보판, 컷: s.컷 || [] }));
    let 목소리들 = null, 녹음 = false;
    if (설정.옵션.소리 === "녹음") {                           // 🎙 내 목소리 — 장면 문장을 프롬프터로 보여 주고 폰 마이크로 녹음 (열쇠 없어도 됨)
      if (!설정.녹음받기) throw new Error("녹음 화면을 열 수 없어요");
      목소리들 = await 설정.녹음받기(장면들); 녹음 = true;
    } else if (설정.옵션.소리 === "나레이션") 목소리들 = await AI목소리받기(장면들, 설정, 알림);
    P.장면길이(장면들, 목표초);
    if (목소리들) 장면들.forEach((s, i) => (s.길이 = Math.max(i === 0 ? 1.4 : s.정보판 ? 3.6 : 2.0, 목소리들[i].duration / (목소리들[i].hw배 || 1) + (i === 0 ? 0.1 : 0.2))));
    const 총컷 = P.컷계획(장면들, 후보, 소재들, 분, 설정.옵션);
    const 모양들 = Object.keys(G.딱지모양들), 최근 = JSON.parse(localStorage.getItem("hw딱지") || "[]");
    const 모양 = (모양들.filter((m) => !최근.slice(-3).includes(m))[Math.floor(Math.random() * 4)]) || 모양들[0];
    try { localStorage.setItem("hw딱지", JSON.stringify(최근.concat([모양]).slice(-10))); } catch (e) {}
    return { 버전: 1, 제목: d.제목 || "", 설명: d.설명 || "", 태그: d.태그 || [], 썸네일: d.썸네일 || { 글: "", 부제: "" }, 훅딱지: (설정.옵션.끄기 || []).includes("훅딱지") ? "" : (d.훅딱지 || "").slice(0, 10),
      딱지모양: 모양, 대본: d._모델, 옵션: 설정.옵션, 장면: 장면들.map((s) => ({ 말: s.말, 화면글: s.화면글, 정보판: s.정보판, 컷: s.컷 })),
      후보: 후보.map((c) => ({ n: c.n, 파일: c.파일, t: c.t, 썸: c.썸 })), 총컷, 얼굴: 후보.some((c) => (c.얼굴 || 0) > 0),
      나레이션: !!목소리들, 녹음, _목소리: 목소리들, _확인: 확인 };
  }

  /* ── 그리기 + 굽기 ── */
  async function 만들기(파일들, 설정) {
    const 시작때 = performance.now();
    const 알림 = 설정.진행 || (() => {});
    const 옵션 = Object.assign({ 소리: "원본", 길이: "보통", 자막: "보통", 세기: "보통", 끄기: [] }, 설정.옵션 || {});
    설정.옵션 = 옵션;
    const 끄기 = new Set(옵션.끄기 || []), 세 = P.세기값[옵션.세기] || P.세기값.보통;
    await Promise.all(["900 80px Pretendard", "800 40px Pretendard", "600 30px Pretendard"].map((f) => document.fonts.load(f).catch(() => {})));
    알림("📂 영상·사진 여는 중…", 0.01);
    const 소재들 = 설정.소재들 || [];
    if (!소재들.length) for (const f of 파일들) 소재들.push(await 소재열기(f));
    const 계획 = 설정.계획 || await 자동계획(소재들, 설정, 알림);
    if (계획.나레이션 && !계획._목소리) {                    // 고친 뒤 다시 그릴 때 · 앱을 다시 켠 뒤 → 지금 자막으로 다시 녹음
      if (계획.녹음) { if (!설정.녹음받기) throw new Error("녹음 화면을 열 수 없어요"); 계획._목소리 = await 설정.녹음받기(계획.장면); }
      else 계획._목소리 = await AI목소리받기(계획.장면, 설정, 알림);
    }
    const 목소리들 = 계획._목소리 || null, AI목소리 = !!목소리들 && !계획.녹음;
    // 타임라인
    let t = 0; const 장면들 = [], 컷들 = [], 목소리계획 = [];
    계획.장면.forEach((s, i) => {
      const 장면 = { i, 말: s.말, 화면글: s.화면글 || "", 정보판: B.쓸수있나(s.정보판) && !끄기.has("정보판") ? s.정보판 : null, t0: t, 컷: [] };
      for (const c of s.컷) { const 소 = 소재들[c.파일]; if (!소) continue; const x = Object.assign({}, c, { s: 소, t0: t, 장면: i }); 장면.컷.push(x); 컷들.push(x); t += c.길이; }
      장면.길이 = t - 장면.t0;
      const 목 = 목소리들 && 목소리들[i], 앞 = i === 0 ? 0.25 : 0.05, 말길이 = 목 ? Math.min(장면.길이 - 앞, 목.duration / (목.hw배 || 1)) : 장면.길이;
      if (목) 목소리계획.push([목, 장면.t0 + 앞]);
      const 조각 = 구절(s.말), 합 = 조각.reduce((a, b) => a + b.length, 0) || 1; let a = 목 ? 앞 : 0;
      장면.자막 = 조각.map((g) => { const d = 말길이 * g.length / 합, r = [g, a, a + d]; a += d; return r; });
      if (목 && 목.hw낱말 && 목.hw낱말.length && 조각.length) 장면.자막 = 낱말자막(조각, 목.hw낱말, 앞, 장면.길이);
      if (장면.자막.length) { 장면.자막[0][1] = 0; 장면.자막[장면.자막.length - 1][2] = 장면.길이; }
      장면들.push(장면);
    });
    if (!컷들.length) throw new Error("쓸 수 있는 컷이 없어요");
    if (장면들[0]) 장면들[0].컷.forEach((c) => (c.소리앞 = 0));
    const 아웃시작 = t, 총 = t + G.아웃트로길이;
    // 효과 세기 · 끄기
    const 스케치 = 끄기.has("스케치") ? "없음" : (옵션.소리 === "원본" && 세.스케치 === "모든장면" ? "첫장면" : 세.스케치);
    const 채널이름 = (설정.채널 || {}).이름 || "", 채널색 = (설정.채널 || {}).색 || "rgb(255,208,105)";
    const 효크 = 끄기.has("효과음") ? 0 : (설정.분야.효과음세기 || 0.55) * 세.소리;
    const 소리계획 = [];
    const 넣기 = (n, t, v) => { if (효크 > 0) 소리계획.push([n, t, 효크 * v]); };
    const 고정글 = 끄기.has("고정제목") ? "" : (계획.썸네일 || {}).글 || "";
    const 딱그림 = 계획.훅딱지 ? G.딱지그림(계획.훅딱지, 계획.딱지모양) : null;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d", { alpha: false });
    const 훅준비 = G.훅준비(ctx, 장면들[0].말);
    // 장면별 준비 (스케치 · 인트로 · 소리 계획)
    let 마지막강조 = -99;
    for (const s of 장면들) {
      const 훅 = s.i === 0;
      s.스케치 = !훅 && !s.정보판 && (스케치 === "모든장면" || (스케치 === "첫장면" && s.i === 1));
      s.인트로 = s.i === 1 && !!채널이름;
      s.Li = s.스케치 ? (s.인트로 ? 1.1 : 0.8) + (s.인트로 ? 0.12 : 0.1) : 0;
      if (훅) { 넣기("impact", 0, 1.1); 넣기("stamp", 0.14, 0.9); 훅준비.때들.slice(1).forEach((x) => 넣기("pop", x, 0.4)); continue; }
      넣기("whoosh_airy", s.t0, 0.9);
      if (s.스케치) { 넣기("scroll", s.t0 + 0.15, 0.55); 넣기("bloom", s.t0 + s.Li - 번짐, 0.6); }
      if (s.인트로) 넣기("sparkle", s.t0 + 0.45, 0.5);
      if (!s.정보판) 넣기("pop_soft", s.t0 + (s.인트로 ? 0.3 : 0.12), 0.8);
      for (const [g, a] of s.자막) if (/\d/.test(g) && s.t0 + a - 마지막강조 >= 8) { const 돈 = /\d[\d,.]*\s?(?:만|천)?\s?원/.test(g); 넣기(돈 ? "coin" : "blip", s.t0 + a, 돈 ? 0.8 : 0.7); 마지막강조 = s.t0 + a; }
    }
    // 굽개
    const 설정v = await 영상굽개(알림);
    const 표본 = []; let 설명 = null, 오류 = null;
    const venc = new VideoEncoder({ output: (c, m) => { const d = new Uint8Array(c.byteLength); c.copyTo(d); 표본.push({ data: d, pts: c.timestamp / 1e6 * 30000, 키: c.type === "key" });
      if (m && m.decoderConfig && m.decoderConfig.description) 설명 = new Uint8Array(m.decoderConfig.description); }, error: (e) => (오류 = e) });
    venc.configure(설정v);
    const 총프레임 = Math.round(총 * FPS);
    let 끝화면 = null, 아웃 = null, 스준비 = null, 스장면 = -1, 썸배경 = null;
    const 판소리됨 = new Set();
    for (let f = 0; f < 총프레임; f++) {
      if (오류) throw 오류;
      const 지금 = f / FPS;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      if (지금 < 아웃시작) {
        const c = 컷들.find((x) => 지금 >= x.t0 && 지금 < x.t0 + x.길이) || 컷들[컷들.length - 1];
        const s = 장면들[c.장면], ts = 지금 - s.t0, tc = 지금 - c.t0, 훅 = s.i === 0;
        // 바탕 영상
        if (c.s.종류 === "영상") await 찾기(c.s.el, Math.min(c.s.길이 - 0.04, c.시작 + tc));
        const on = ts * FPS, n = Math.max(1, s.길이 * FPS), 펀배 = (훅 ? 1.9 : 1) * 세.펀치;
        let z = 1 + 0.045 * on / n;
        for (const [, a] of s.자막.slice(1)) { const 시 = a * FPS; if (on >= 시 && on < 시 + 5) z += 0.028 * 펀배 * (on - 시) / 5; else if (on >= 시 + 5 && on < 시 + 18) z += 0.028 * 펀배 * (시 + 18 - on) / 13; }
        let hx = 0, hy = 0;
        if (훅) { z += 0.22 * Math.pow(Math.max(0, 1 - on / 9), 2); const 감 = Math.max(0, (16 - on) / 16); z += 0.06 * 감; hx = 50 * Math.sin(on * 3.1) * 감 * 세.펀치; hy = 36 * Math.cos(on * 4.3) * 감 * 세.펀치; }
        const pc = tc / Math.max(0.1, c.길이);
        if (c.효과 === "줌") z *= 1 + 0.10 * pc; else if (c.효과 === "당기기") z *= 1.12 - 0.10 * pc;
        else if (c.효과 === "흔들림") { const 감 = Math.max(0, 1 - tc * FPS / 14); z *= 1.07 + 0.05 * 감; hx += (34 * 감 + 5) * Math.sin(tc * FPS * 2.9); hy += (26 * 감 + 4) * Math.cos(tc * FPS * 3.7); }
        if (c.s.종류 === "사진") z *= (c.방향 || 1) > 0 ? 1 + 0.12 * pc : 1.12 - 0.12 * pc;
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
        if (c.s.종류 === "사진" && c.효과 === "입체") 입체사진(ctx, c, z, pc, hx, hy);
        else 덮어그리기(ctx, c.s, c.x ?? 0.5, c.y ?? 0.45, z * (c.확대 || 1), hx, hy);
        if (f === 1 && !썸배경) { 썸배경 = document.createElement("canvas"); 썸배경.width = W; 썸배경.height = H; 썸배경.getContext("2d").drawImage(cv, 0, 0); }
        // 스케치 등장
        if (s.스케치 && ts < s.Li) {
          if (스장면 !== s.i) { const 첫 = document.createElement("canvas"); 첫.width = W; 첫.height = H; 첫.getContext("2d").drawImage(cv, 0, 0); 스준비 = G.스케치준비(첫); 스장면 = s.i; }
          const 그리는 = s.Li - (s.인트로 ? 0.12 : 0.1);
          ctx.save(); ctx.globalAlpha = ts < s.Li - 번짐 ? 1 : 1 - (ts - (s.Li - 번짐)) / 번짐; G.스케치(ctx, 스준비, Math.min(1, ts / 그리는)); ctx.restore();
        }
        if (훅 && ts < 0.47) { ctx.fillStyle = `rgba(255,255,255,${0.55 * (1 - ts / 0.47)})`; ctx.fillRect(0, 0, W, H); }
        if (세.화면빛 && !끄기.has("화면빛")) G.화면빛(ctx, s.i, ts, s.길이, f);
        if (훅) {
          G.훅글자(ctx, 훅준비, ts);
          if (딱그림) G.딱지(ctx, 딱그림, 계획.딱지모양, ts - 0.1);
        } else {
          if (s.인트로) G.인트로(ctx, 채널이름, (설정.채널 || {}).부제 || 설정.분야.이름, (설정.채널 || {}).이모지 || 설정.분야.이모지, 채널색, ts, Math.max(1.4, s.Li + 0.6));
          if (s.정보판) { ctx.fillStyle = `rgba(10,8,6,${0.5 * Math.min(1, ts / 0.25)})`; ctx.fillRect(0, 0, W, H); }
          if (고정글) G.고정제목(ctx, 고정글, 채널색, s.i === 1 ? Math.min(1, ts / 0.25) : 1);
          if (s.정보판) {
            const 때 = B.그리기(ctx, s.정보판, Math.max(0, ts - 0.12), s.길이 - 0.12);
            if (!판소리됨.has(s.i)) { 판소리됨.add(s.i); for (const [x, 종] of 때) 넣기(종 === "띵" ? "ding" : "pop_soft", s.t0 + 0.12 + x, 종 === "띵" ? 0.5 : 0.45); }
          } else G.글귀상자(ctx, s.화면글, ts, s.길이, 고정글 ? 610 : 470, Math.max(0.5, s.Li + 0.1));
          const 지금자막 = s.자막.find(([, a, b]) => ts >= a && ts < b) || s.자막[s.자막.length - 1];
          if (지금자막) G.자막(ctx, 지금자막[0], { 보통: 1, 크게: 1.15, 아주크게: 1.3 }[옵션.자막] || 1);
        }
        if (지금 + 1 / FPS >= 아웃시작 && !끝화면) { 끝화면 = document.createElement("canvas"); 끝화면.width = W; 끝화면.height = H; 끝화면.getContext("2d").drawImage(cv, 0, 0); }
      } else {
        if (!아웃) { 아웃 = G.아웃트로준비(끝화면 || cv, 설정.분야.아웃트로문구 || "저장해 두고 필요할 때 꺼내 보세요!", 채널이름, 채널색);
          넣기("pop", 아웃시작 + 1.05, 0.8); 아웃.누름.forEach((x) => 넣기("pop_soft", 아웃시작 + x, 0.8)); 넣기("ding", 아웃시작 + 아웃.누름[2] + 0.33, 0.8); }
        G.아웃트로(ctx, 아웃, 지금 - 아웃시작);
      }
      if (AI목소리 && 지금 < 아웃시작) {                       // 출처 줄 「목소리: AI」 (엔진 영상._출처판 자리 · 24px · 내 목소리 녹음이면 안 붙임)
        ctx.save(); ctx.font = G.글꼴(600, 24); ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.lineWidth = 4; ctx.strokeStyle = "rgba(0,0,0,.6)";
        ctx.strokeText("목소리: AI", 84, 262); ctx.fillStyle = "rgba(255,255,255,.63)"; ctx.fillText("목소리: AI", 84, 262); ctx.restore();
      }
      if (!끄기.has("진행막대")) G.진행막대(ctx, (지금 + 1 / FPS) / 총);
      const vf = new VideoFrame(cv, { timestamp: Math.round(지금 * 1e6), duration: Math.round(1e6 / FPS) });
      venc.encode(vf, { keyFrame: f % 60 === 0 }); vf.close();
      while (venc.encodeQueueSize > 4) await new Promise((r) => setTimeout(r, 2));
      if (f % 10 === 0) 알림("🎬 효과 입히며 그리는 중 " + Math.round(100 * f / 총프레임) + "%", 0.2 + 0.68 * f / 총프레임);
    }
    await venc.flush(); venc.close();
    const 영상초 = (performance.now() - 시작때) / 1000;
    알림("🔊 소리 섞는 중…", 0.9);
    const 소 = await 소리만들기({ 컷들, 목소리: 목소리계획 }, 총, 소리계획, 설정);
    const 소리 = await 소리굽기(소.buf);
    알림("📦 mp4 묶는 중…", 0.97);
    const blob = HW묶기.묶기({ 폭: W, 높이: H, 설명, 시간단위: 30000, 간격: 1000, 표본 }, 소리);
    // 썸네일
    let 썸 = null;
    try { if ((계획.썸네일 || {}).글) { const c = G.썸네일(썸배경 || cv, 계획.썸네일.글, 계획.썸네일.부제 || "", 채널이름, Math.floor(Math.random() * 8)); 썸 = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.92)); } } catch (e) {}
    const 확인 = [].concat(계획._확인 || [], 소.경고);
    if (AI목소리) 확인.push("AI 목소리를 썼어요 — 영상에 「목소리: AI」 · 설명에 「AI 목소리」 표시가 들어갔어요");
    if (계획.녹음) 확인.push("내 목소리 녹음으로 만들었어요 — 장면 길이·자막 시각을 녹음 길이에 맞췄어요");
    if (!소리) 확인.push("이 기기는 소리 굽기가 안 돼서 소리 없이 만들었어요 (아이폰은 iOS 26 이상)");
    if (계획.얼굴) 확인.push("사람 얼굴이 나와요 — 나오는 분께 공개 동의를 받았는지 확인해 주세요");
    if (옵션.소리 === "원본") 확인.push("원본 소리에 매장 음악·남의 노래가 들리면 저작권 알림이 올 수 있어요 — 그럴 땐 「음악만」 으로 다시");
    if (계획.대본 === "규칙") 확인.push("AI 분석 없이(열쇠 없이) 한 줄 요청만으로 자막·컷을 정했어요 — AI 분석은 ⚙ 설정에서 고르는 선택이에요");
    const 걸린 = (performance.now() - 시작때) / 1000;
    알림("✅ 완성 " + 걸린.toFixed(0) + "초", 1);
    // 다시 쓰기 좋게 계획에서 요소 참조는 뺀 사본
    const 저장계획 = JSON.parse(JSON.stringify(Object.assign({}, 계획, { 후보: undefined, _목소리: undefined, _확인: undefined })));
    if (AI목소리) 저장계획.설명 = (저장계획.설명 || "") + "\n\n※ 이 영상은 AI 목소리를 사용했어요.";
    return { blob, 썸네일: 썸, 계획: 저장계획, 후보: 계획.후보, 소재들, 걸린초: 걸린, 영상굽기초: 영상초, 길이: 총, 프레임: 총프레임, LUFS잰값: 소.잰LUFS, 크기MB: blob.size / 1048576, 확인, 코덱: 설정v.codec };
  }

  전역.HW폰엔진 = { 만들기, 소재열기, W, H, FPS };
})(window);
