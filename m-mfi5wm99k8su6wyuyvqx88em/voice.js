/* ══════════════════════════════════════════════════════════════
   HW 숏츠 메이커 📱 지인J 전용판 — 「내 목소리(AI)」 (2026-10-02 사장님 「헤어 디자이너 친구는 줘야지 · 그거 하나만 넣어서 줘」)
   길: 애저 공식 음성(선희 · 빠르기 1.2 · 낱말 시각) → 24kHz 로 풀기 → 22.05kHz 로 ★직접 재표본★(브라우저에 맡기면 음색이 벌어짐)
       → 음색 변환기(OpenVoice V2 converter · ONNX · tau 0.3) 로 지인J 음색 입히기 → 길이·크기 맞추기 → 장면 나레이션
   ★열쇠는 이 파일·저장소·공개 페이지에 없다★ — ⚙ 설정의 「목소리 열쇠」 칸에 넣은 값이 이 폰(localStorage)에만 있다
   ★이 폴더(음색 값 + 변환기)는 공개 주소(/maker-test/)에 올리지 않는다★ — 지인 폰 전용 숨은 경로만
   변환기는 처음 한 번 받아 폰에 저장(Cache Storage · 66MB) · 메모리 최고 약 0.9GB(노트북 실측) → 모자라면 오류를 던지고 앱은 「🎙 내 목소리」 로 안내
   onnxruntime-web 1.30.0 고정 (jsdelivr · 처음 받을 때 같이 저장) · WebGPU 되면 그쪽, 아니면 WASM(ort 가 따로 띄우는 일꾼에서 → 화면 안 멈춤)
   ══════════════════════════════════════════════════════════════ */
"use strict";
(function (전역) {
  const 판 = Object.assign({ 이름: "내 목소리", 밑목소리: "ko-KR-SunHiNeural", 빠르기: 1.2, tau: 0.3, 지역: "koreacentral",
    모델: "model/vc.onnx", 음색: "model/se.bin", 모델MB: 66 }, 전역.HW판설정 || {});
  const ORT = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/";
  const SR = 22050, 통이름 = "hw-voice-v1";
  let 세션 = null, 음색 = null, 길 = "";
  const 기억 = (k) => { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } };
  const 열쇠 = () => 기억("hw목소리열쇠").trim();
  const 지역 = () => (기억("hw목소리지역").trim() || 판.지역).toLowerCase().replace(/[^a-z0-9]/g, "");
  function 쓸수있나() { return !!열쇠(); }

  /* ── 애저 공식 음성 (브라우저 웹소켓 · 열쇠 → 10분짜리 출입증으로 바꿔서 접속) ── */
  const 번호 = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()).replace(/-/g, "");
  const 풀기 = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, " ");
  let 출입증 = null;
  async function 출입증받기() {
    if (출입증 && Date.now() - 출입증.때 < 8 * 60000) return 출입증.값;
    const r = await fetch("https://" + 지역() + ".api.cognitive.microsoft.com/sts/v1.0/issueToken", { method: "POST", headers: { "Ocp-Apim-Subscription-Key": 열쇠() } });
    if (!r.ok) throw new Error("목소리 열쇠를 확인해 주세요 (" + r.status + ")");
    출입증 = { 값: await r.text(), 때: Date.now() };
    return 출입증.값;
  }

  async function 애저읽기(글, 목소리 = 판.밑목소리, 빠르기 = 판.빠르기) {
    const 표 = await 출입증받기();
    const 율 = Math.round((빠르기 - 1) * 100);
    const 안 = 율 ? '<prosody rate="' + (율 > 0 ? "+" : "") + 율 + '%">' + 풀기(글) + "</prosody>" : 풀기(글);
    const ssml = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ko-KR"><voice name="' + 목소리 + '">' + 안 + "</voice></speak>";
    const rid = 번호();
    const 줄 = (path, 종류, 몸) => "Path: " + path + "\r\nX-RequestId: " + rid + "\r\nX-Timestamp: " + new Date().toISOString() + "\r\nContent-Type: " + 종류 + "\r\n\r\n" + 몸;
    const ws = new WebSocket("wss://" + 지역() + ".tts.speech.microsoft.com/cognitiveservices/websocket/v1?Authorization=" + encodeURIComponent("Bearer " + 표) + "&X-ConnectionId=" + 번호());
    ws.binaryType = "arraybuffer";
    return new Promise((ok, no) => {
      const 조각 = [], 낱말 = []; let 끝남 = false;
      const 시한 = setTimeout(() => { if (!끝남) { 끝남 = true; try { ws.close(); } catch (e) {} no(new Error("목소리 서버가 대답하지 않아요")); } }, 45000);
      ws.onopen = () => {
        ws.send(줄("speech.config", "application/json", JSON.stringify({ context: { system: { name: "HW-maker", version: "1.0", build: "web", lang: "JavaScript" }, os: { platform: "Browser", name: "Client", version: "1.0" } } })));
        ws.send(줄("synthesis.context", "application/json", JSON.stringify({ synthesis: { audio: { metadataOptions: { bookmarkEnabled: false, punctuationBoundaryEnabled: false,
          sentenceBoundaryEnabled: false, sessionEndEnabled: true, visemeEnabled: false, wordBoundaryEnabled: true }, outputFormat: "audio-24khz-96kbitrate-mono-mp3" }, language: { autoDetection: false } } })));
        ws.send(줄("ssml", "application/ssml+xml", ssml));
      };
      ws.onmessage = (e) => {
        if (typeof e.data === "string") {
          const i = e.data.indexOf("\r\n\r\n"), 머리 = e.data.slice(0, i), 몸 = e.data.slice(i + 4);
          if (/Path:\s*audio\.metadata/i.test(머리)) {
            try { for (const m of JSON.parse(몸).Metadata || []) { const d = m.Data || {}, t = d.text || {};
              if (m.Type === "WordBoundary" && (t.BoundaryType || "WordBoundary") === "WordBoundary") 낱말.push([t.Text || "", d.Offset / 1e7, (d.Offset + d.Duration) / 1e7]); } } catch (err) {}
          } else if (/Path:\s*turn\.end/i.test(머리)) {
            끝남 = true; clearTimeout(시한); ws.close();
            if (!조각.length) return no(new Error("목소리가 비었어요"));
            const 합 = new Uint8Array(조각.reduce((a, b) => a + b.length, 0)); let p = 0; for (const c of 조각) { 합.set(c, p); p += c.length; }
            ok({ mp3: 합, 낱말 });
          }
        } else {
          const 바 = new Uint8Array(e.data); if (바.length < 2) return;
          const n = (바[0] << 8) | 바[1], 머리 = new TextDecoder().decode(바.subarray(2, 2 + n));
          if (/Path:\s*audio/i.test(머리) && 바.length > n + 2) 조각.push(바.slice(n + 2));
        }
      };
      ws.onclose = (e) => { if (!끝남) { 끝남 = true; clearTimeout(시한); 출입증 = null; no(Object.assign(new Error("목소리 서버에 붙지 못했어요 (닫힘 " + e.code + ")"), { 닫힘: e.code })); } };
    });
  }

  /* ── 변환기 준비 (처음 한 번 받아 폰에 저장) ── */
  async function 받아두기(주소, 알림, 글, 전체) {
    const 통 = await caches.open(통이름);
    let r = await 통.match(주소);
    if (r) return r.arrayBuffer();
    r = await fetch(주소);
    if (!r.ok) throw new Error("변환기를 받지 못했어요 (" + r.status + ")");
    const 길이 = Number(r.headers.get("Content-Length")) || 전체 || 0, 읽개 = r.body.getReader(), 조각 = []; let 받은 = 0;
    for (;;) { const { done, value } = await 읽개.read(); if (done) break; 조각.push(value); 받은 += value.length;
      if (알림) 알림(글 + " " + Math.round(받은 / 1048576) + (길이 ? " / " + Math.round(길이 / 1048576) : "") + "MB", 0.17); }
    const 몸 = new Blob(조각);
    try { await 통.put(주소, new Response(몸, { headers: { "Content-Type": "application/octet-stream" } })); } catch (e) { /* 저장 공간이 모자라도 이번엔 쓴다 */ }
    return 몸.arrayBuffer();
  }

  /* 변환기 조각 받기 — 목록(vc.json: {조각, 크기, sha256}) → 조각을 차례로 받아 폰에 저장(받은 조각은 다음에 건너뜀 = 끊겨도 이어서)
     → 이어 붙임 → 크기·해시 확인 (안 맞으면 저장한 조각을 지우고 오류) */
  async function 조각받기(목록주소, 알림) {
    const 밑 = 목록주소.replace(/[^/]*$/, ""), 통 = await caches.open(통이름);
    const r = await fetch(목록주소, { cache: "no-cache" });
    if (!r.ok) throw new Error("변환기 목록을 받지 못했어요 (" + r.status + ")");
    const 표 = await r.json(), 합 = new Uint8Array(표.크기); let 자리 = 0;
    for (const [i, 이름] of 표.조각.entries()) {
      const 주소 = 밑 + 이름; let 몸 = null;
      const 있던 = await 통.match(주소); if (있던) 몸 = new Uint8Array(await 있던.arrayBuffer());
      for (let 번 = 0; !몸 && 번 < 4; 번++) {
        try {
          알림("📥 내 목소리 변환기 받는 중 (처음 한 번) " + Math.round(자리 / 1048576) + " / " + Math.round(표.크기 / 1048576) + "MB", 0.17);
          const q = await fetch(주소); if (!q.ok) throw new Error(String(q.status));
          const b = await q.blob(); 몸 = new Uint8Array(await b.arrayBuffer());
          try { await 통.put(주소, new Response(b, { headers: { "Content-Type": "application/octet-stream" } })); } catch (e) { /* 저장 공간이 모자라도 이번엔 쓴다 */ }
        } catch (e) { 몸 = null; if (번 === 3) throw new Error("변환기 조각 " + (i + 1) + "/" + 표.조각.length + " 을 받지 못했어요 — 와이파이를 확인하고 다시 해 주세요"); await new Promise((ok) => setTimeout(ok, 2000 * (번 + 1))); }
      }
      if (자리 + 몸.length > 표.크기) throw new Error("변환기 크기가 맞지 않아요");
      합.set(몸, 자리); 자리 += 몸.length; 몸 = null;
    }
    const 해시 = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", 합))).map((b) => b.toString(16).padStart(2, "0")).join("");
    if (자리 !== 표.크기 || 해시 !== 표.sha256) {
      for (const 이름 of 표.조각) await 통.delete(밑 + 이름);
      throw new Error("받은 변환기가 깨졌어요 — 다시 시도해 주세요");
    }
    return 합.buffer;
  }

  function 스크립트(주소) { return new Promise((ok, no) => { const s = document.createElement("script"); s.src = 주소; s.crossOrigin = "anonymous"; s.onload = ok; s.onerror = () => no(new Error("실행 도구를 받지 못했어요")); document.head.appendChild(s); }); }

  async function 준비(알림 = () => {}) {
    if (세션) return 길;
    알림("🎙 내 목소리 변환기 준비 중…", 0.16);
    const gpu = !!navigator.gpu;
    if (!전역.ort) await 스크립트(ORT + (gpu ? "ort.webgpu.min.js" : "ort.wasm.min.js"));
    const ort = 전역.ort;
    ort.env.wasm.wasmPaths = ORT;
    ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1;
    const se = new Float32Array(await 받아두기(판.음색, null, "", 0));
    음색 = { 원래: se.slice(0, 256), 대상: se.slice(256, 512) };
    let buf = /\.json$/.test(판.모델) ? await 조각받기(판.모델, 알림) : await 받아두기(판.모델, 알림, "📥 내 목소리 변환기 받는 중 (처음 한 번)", 판.모델MB * 1048576);
    알림("🎙 변환기 켜는 중… (잠깐 폰이 느려져요)", 0.17);
    const 시도 = gpu ? [["webgpu", false], ["wasm", true]] : [["wasm", true]];
    let 마지막 = null;
    for (const [ep, 따로] of 시도) {
      try { ort.env.wasm.proxy = 따로; 세션 = await ort.InferenceSession.create(buf, { executionProviders: [ep], graphOptimizationLevel: "all" }); 길 = ep; break; }
      catch (e) { 마지막 = e; 세션 = null; }
    }
    buf = null;
    if (!세션) throw new Error("이 폰에서 변환기를 켜지 못했어요 (메모리가 모자랄 수 있어요) — " + String((마지막 && 마지막.message) || 마지막).slice(0, 80));
    return 길;
  }

  /* ── 직접 재표본 (ffmpeg swr 기본값 꼴 · 차단 0.97 · 카이저 베타 9 · 탭 32) — 목소리연구소\폰후보\웹시험\test.js 와 같은 셈 ── */
  function 베셀(v) { let s = 1, t = 1, k = 1; const q = v * v / 4; while (t > 1e-12 * s) { t *= q / (k * k); s += t; k++; } return s; }
  function 재표본(x, 들, 날) {
    const 비 = 들 / 날, 배 = Math.max(1, 비), fc = 0.97 / 배, 반 = 16 * 배, b0 = 베셀(9);
    const n = Math.round(x.length / 비), y = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i * 비, a = Math.ceil(t - 반), b = Math.floor(t + 반); let s = 0, w = 0;
      for (let k = a; k <= b; k++) {
        const u = t - k, r = u / 반, 창 = 베셀(9 * Math.sqrt(Math.max(0, 1 - r * r))) / b0, pu = Math.PI * fc * u, h = (u === 0 ? 1 : Math.sin(pu) / pu) * 창;
        w += h; if (k >= 0 && k < x.length) s += x[k] * h;
      }
      y[i] = s / w;
    }
    return y;
  }
  function 크기(x) {                                         // 말소리 부분 RMS (변환.py _크기)
    const n = Math.floor(x.length / 512); if (n < 1) return 0;
    const r = new Float64Array(n); let 최대 = 0;
    for (let k = 0; k < n; k++) { let s = 0; for (let j = k * 512; j < (k + 1) * 512; j++) s += x[j] * x[j]; r[k] = Math.sqrt(s / 512); if (r[k] > 최대) 최대 = r[k]; }
    let 합 = 0, 수 = 0; for (let k = 0; k < n; k++) if (r[k] > 최대 * 0.1) { 합 += r[k] * r[k]; 수++; }
    return 수 ? Math.sqrt(합 / 수) : 0;
  }

  async function 변환(x) {                                    // 22.05kHz 한 채널 → 지인 음색 (길이·크기는 입력과 같게 · ±0.99)
    const ort = 전역.ort;
    const out = await 세션.run({ audio: new ort.Tensor("float32", x, [1, x.length]), g_src: new ort.Tensor("float32", 음색.원래, [1, 256, 1]),
      g_tgt: new ort.Tensor("float32", 음색.대상, [1, 256, 1]), tau: new ort.Tensor("float32", Float32Array.of(판.tau), []) });
    const t = out[세션.outputNames[0]], d = t.data instanceof Float32Array ? t.data : new Float32Array(await t.getData());
    const z = new Float32Array(x.length); z.set(d.subarray(0, Math.min(x.length, d.length)));
    const a = 크기(x), b = 크기(z), g = a > 0 && b > 0 ? Math.min(a / b, 4) : 1;
    for (let i = 0; i < z.length; i++) { const v = z[i] * g; z[i] = v > 0.99 ? 0.99 : v < -0.99 ? -0.99 : v; }
    return z;
  }

  /* 장면들 → [AudioBuffer(22.05kHz · hw낱말 = [[글, 시작, 끝]])] — 엔진의 나레이션 자리에 그대로 들어감 */
  async function 나레이션(장면들, 알림 = () => {}) {
    if (!열쇠()) throw new Error("⚙ 설정에 「목소리 열쇠」 가 없어요");
    await 준비(알림);
    const ac = new OfflineAudioContext(1, 24000, 24000), out = [], 재기 = { 받기: 0, 변환: 0, 소리: 0 };
    for (const [i, s] of 장면들.entries()) {
      알림("🎙 내 목소리로 읽는 중 " + (i + 1) + "/" + 장면들.length, 0.17 + 0.02 * i / 장면들.length);
      const 읽을 = String(s.말).replace(/(\d+)\s*:\s*(\d+)/g, "$1대$2");
      let t0 = performance.now(), r = null;
      for (let 번 = 0; 번 < 3 && !r; 번++) { try { r = await 애저읽기(읽을); } catch (e) { if (번 === 2 || /열쇠/.test(e.message)) throw e; await new Promise((ok) => setTimeout(ok, 1500 * (번 + 1))); } }
      재기.받기 += (performance.now() - t0) / 1000;
      const 원 = await ac.decodeAudioData(r.mp3.buffer.slice(r.mp3.byteOffset, r.mp3.byteOffset + r.mp3.byteLength));
      const x = 재표본(new Float32Array(원.getChannelData(0)), 원.sampleRate, SR);
      t0 = performance.now();
      const z = await 변환(x);
      재기.변환 += (performance.now() - t0) / 1000; 재기.소리 += x.length / SR;
      // 앞뒤 빈소리 자르기 (낱말 시각도 같이 당김)
      const 문 = Math.pow(10, -42 / 20); let a = 0, e = z.length - 1;
      while (a < z.length && Math.abs(z[a]) < 문) a++; while (e > a && Math.abs(z[e]) < 문) e--;
      a = Math.max(0, a - Math.round(0.03 * SR)); e = Math.min(z.length, e + Math.round(0.15 * SR));
      const 새 = ac.createBuffer(1, Math.max(1, e - a), SR); 새.copyToChannel(z.subarray(a, e), 0);
      const 앞 = a / SR;
      새.hw낱말 = r.낱말.map(([w, p, q]) => [w, Math.max(0, p - 앞), Math.max(0, q - 앞)]); 새.hw배 = 1;
      out.push(새);
    }
    전역.HW내목소리.마지막 = Object.assign({ 길 }, 재기);
    return out;
  }

  전역.HW내목소리 = { 이름: 판.이름, 쓸수있나, 준비, 나레이션, 애저읽기, 재표본, 마지막: null };
})(window);
