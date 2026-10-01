/* ══════════════════════════════════════════════════════════════
   HW 숏츠 메이커 📱 폰 단독 — 엣지 읽기 목소리 (열쇠 없이 · 2026-10-02 사장님 「엣지는 지인들 줄 때 쓰게 앱에 연결」)
   우리 엔진 목소리.py 의 엣지 길(edge-tts 방식)을 브라우저 웹소켓으로: speech.config → ssml → mp3 조각 + 낱말 시각(WordBoundary)
   ★붙는 조건(10/2 실측)★: 서버는 접속한 브라우저 이름(User-Agent)에 「최신 엣지 표시(Edg/판번호)」 가 있어야 받아 준다.
     · 안드로이드 앱(APK) = Capacitor 설정 appendUserAgent 로 웹뷰 이름에 Edg/판번호 를 붙여 둠 → 됨
     · 아이폰 사파리 홈 화면 앱 = 웹 페이지는 브라우저 이름을 못 바꿈 → 안 붙음(막힘) → 쓸수있나() 가 false
   판 번호가 낡으면 서버가 403 → 판번호 한 곳만 고치면 됨 (edge-tts constants.CHROMIUM_FULL_VERSION 과 같은 값)
   ══════════════════════════════════════════════════════════════ */
"use strict";
(function (전역) {
  const 판번호 = "143.0.3650.75", 큰판 = 판번호.split(".")[0];
  const 토큰 = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";                 // 엣지 읽기 공개 값 (edge-tts TRUSTED_CLIENT_TOKEN · 비밀 열쇠 아님)
  const 주소 = "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=" + 토큰;
  const 목소리들 = [["ko-KR-SunHiNeural", "선희 (여 · 밝음)"], ["ko-KR-InJoonNeural", "인준 (남 · 차분)"], ["ko-KR-HyunsuMultilingualNeural", "현수 (남 · 자연스러움)"]];

  const 네이티브 = () => { const p = 전역.Capacitor && 전역.Capacitor.Plugins && 전역.Capacitor.Plugins.HwShare; return p && p.edgeTts ? p : null; };
  const 엣지이름 = () => /\bEdg(A|iOS)?\/\d+/.test(navigator.userAgent);
  function 쓸수있나() { return 엣지이름() || !!네이티브(); }

  async function GEC() {                                     // Sec-MS-GEC = SHA256(5분 단위 윈도우 시각 + 토큰) 대문자
    let t = Date.now() / 1000 + 11644473600; t -= t % 300;
    const 글 = (t * 1e7).toFixed(0) + 토큰;
    const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(글));
    return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  }
  const 번호 = () => (crypto.randomUUID ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, "0")).join("")).replace(/-/g, "");
  const 날짜 = () => new Date().toUTCString().replace("GMT", "GMT+0000 (Coordinated Universal Time)");
  const 풀기 = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /* 글 한 덩이 → {mp3: Uint8Array, 낱말: [[글, 시작초, 끝초]]} · 빠르기 1.2 = "+20%" */
  function 낱말풀기(몸, 낱말) { try { for (const m of JSON.parse(몸).Metadata || []) if (m.Type === "WordBoundary") 낱말.push([m.Data.text.Text, m.Data.Offset / 1e7, (m.Data.Offset + m.Data.Duration) / 1e7]); } catch (err) {} }

  async function 읽기(글, 목소리 = "ko-KR-SunHiNeural", 빠르기 = 1.2, 높이 = "+0Hz") {
    const 접속 = 주소 + "&ConnectionId=" + 번호() + "&Sec-MS-GEC=" + (await GEC()) + "&Sec-MS-GEC-Version=1-" + 판번호;
    const rate = (빠르기 >= 1 ? "+" : "") + Math.round((빠르기 - 1) * 100) + "%";
    const 보낼 = ["X-Timestamp:" + 날짜() + "\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n" +
      '{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"true"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n',
      "X-RequestId:" + 번호() + "\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:" + 날짜() + "Z\r\nPath:ssml\r\n\r\n" +
      "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='ko-KR'><voice name='" + 목소리 + "'><prosody pitch='" + 높이 + "' rate='" + rate + "' volume='+0%'>" + 풀기(글) + "</prosody></voice></speak>"];
    // 브라우저 이름에 엣지 표시가 없으면(안드로이드 웹뷰 이름 바꾸기가 웹소켓에 안 먹을 때 등) 안드로이드 앱의 네이티브 길로 — 네이티브는 머리표를 직접 넣는다
    if (!엣지이름() && 네이티브()) return 네이티브읽기(접속, 보낼);
    try { return await 웹소켓읽기(접속, 보낼); }
    catch (e) { if (네이티브()) return 네이티브읽기(접속, 보낼); throw e; }
  }

  async function 네이티브읽기(접속, 보낼) {
    const r = await 네이티브().edgeTts({ url: 접속, messages: 보낼,
      ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/" + 큰판 + ".0.0.0 Safari/537.36 Edg/" + 큰판 + ".0.0.0" });
    const s = atob(r.audio || ""), mp3 = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) mp3[i] = s.charCodeAt(i);
    if (!mp3.length) throw new Error("목소리가 비었어요");
    const 낱말 = []; for (const m of r.meta || []) 낱말풀기(m, 낱말);
    return { mp3, 낱말 };
  }

  function 웹소켓읽기(접속, 보낼) {
    const ws = new WebSocket(접속);
    ws.binaryType = "arraybuffer";
    return new Promise((ok, no) => {
      const 조각 = [], 낱말 = []; let 끝남 = false;
      const 시한 = setTimeout(() => { if (!끝남) { 끝남 = true; try { ws.close(); } catch (e) {} no(new Error("목소리 서버가 대답하지 않아요")); } }, 30000);
      ws.onopen = () => { for (const m of 보낼) ws.send(m); };
      ws.onmessage = (e) => {
        if (typeof e.data === "string") {
          const i = e.data.indexOf("\r\n\r\n"), 머리 = e.data.slice(0, i), 몸 = e.data.slice(i + 4);
          if (/Path:audio\.metadata/.test(머리)) 낱말풀기(몸, 낱말);
          else if (/Path:turn\.end/.test(머리)) {
            끝남 = true; clearTimeout(시한); ws.close();
            if (!조각.length) return no(new Error("목소리가 비었어요"));
            const 합 = new Uint8Array(조각.reduce((a, b) => a + b.length, 0)); let p = 0; for (const c of 조각) { 합.set(c, p); p += c.length; }
            ok({ mp3: 합, 낱말 });
          }
        } else {
          const 바 = new Uint8Array(e.data), n = (바[0] << 8) | 바[1], 머리 = new TextDecoder().decode(바.subarray(2, 2 + n));
          if (/Path:audio/.test(머리) && 바.length > n + 2) 조각.push(바.slice(n + 2));
        }
      };
      ws.onerror = () => {};
      ws.onclose = (e) => { if (!끝남) { 끝남 = true; clearTimeout(시한); no(Object.assign(new Error("목소리 서버에 붙지 못했어요 (닫힘 " + e.code + ")"), { 닫힘: e.code })); } };
    });
  }

  전역.HW엣지 = { 읽기, 쓸수있나, 목소리들, 판번호, 큰판 };
})(window);
