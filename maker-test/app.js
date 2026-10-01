/* ══════════════════════════════════════════════════════════════
   HW 숏츠 메이커 📱 폰 단독 — 화면 (② 지인 시험판 · 2026-10-02)
   서버 없음: 고른 영상은 폰 밖으로 안 나감 · 만든 숏츠·계획은 이 폰(IndexedDB)에 · 가장 최근 작업의 원본도 같이 (고치기·다시 만들기용)
   아이폰 사파리 홈 화면 앱 · 안드로이드 APK(Capacitor · 저장은 HwShare 네이티브) 한 코드
   ══════════════════════════════════════════════════════════════ */
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const 네이티브 = () => (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.HwShare) || null;
const 상 = { 분야들: [], 분야: "", 파일들: [], 음악: null, 옵션: { 소리: "원본", 길이: "보통", 자막: "보통", 세기: "보통", 끄기: [], 음악결: "0" },
  작업: null, 결과: null, 계획: null, 소재들: null, 후보: null, 고른컷: null, 깨움: null, 만드는중: false };

function 알림(글, 초 = 2.6) { const a = $("#알림"); a.textContent = 글; a.hidden = false; clearTimeout(알림.t); 알림.t = setTimeout(() => (a.hidden = true), 초 * 1000); }
function 보이기(이름) { $$(".화면").forEach((s) => (s.hidden = s.id !== 이름)); window.scrollTo(0, 0); }
function 크기글(b) { return b > 1073741824 ? (b / 1073741824).toFixed(1) + "GB" : Math.max(1, Math.round(b / 1048576)) + "MB"; }
function 초글(s) { s = Math.max(0, s || 0); return s >= 60 ? Math.floor(s / 60) + ":" + String(Math.round(s % 60)).padStart(2, "0") : s.toFixed(1) + "초"; }
function 잠깐(ms) { return new Promise((r) => setTimeout(r, ms)); }
function 기억(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; }
async function 화면켜두기(켬) { try { if (켬 && "wakeLock" in navigator && !상.깨움) { 상.깨움 = await navigator.wakeLock.request("screen"); 상.깨움.addEventListener("release", () => (상.깨움 = null)); } else if (!켬 && 상.깨움) { await 상.깨움.release(); 상.깨움 = null; } } catch (e) {} }

/* ── 이 폰 저장소 (IndexedDB) ── */
const DB = {
  열기() { return this.p || (this.p = new Promise((ok, no) => { const r = indexedDB.open("hw-maker", 1); r.onupgradeneeded = () => { r.result.createObjectStore("작업", { keyPath: "id" }); r.result.createObjectStore("원본", { keyPath: "id" }); }; r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); })); },
  async 일(통, 방식, fn) { const db = await this.열기(); return new Promise((ok, no) => { const tx = db.transaction(통, 방식), s = tx.objectStore(통); const r = fn(s); tx.oncomplete = () => ok(r && r.result); tx.onerror = () => no(tx.error); }); },
  넣기(통, v) { return this.일(통, "readwrite", (s) => s.put(v)); },
  꺼내기(통, id) { return this.일(통, "readonly", (s) => s.get(id)); },
  모두(통) { return this.일(통, "readonly", (s) => s.getAll()); },
  지우기(통, id) { return this.일(통, "readwrite", (s) => s.delete(id)); },
  비우기(통) { return this.일(통, "readwrite", (s) => s.clear()); },
};

/* ── 시작 ── */
async function 시작하기() {
  if ("serviceWorker" in navigator && !네이티브() && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
  try { 상.분야들 = (await (await fetch("fields.json")).json()).분야; } catch (e) { 알림("분야 자료를 못 읽었어요"); }
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
  const 안됨 = [];
  if (!("VideoEncoder" in window)) 안됨.push("영상 굽기(WebCodecs)");
  if (!("AudioEncoder" in window)) 안됨.push("소리 굽기 — 소리 없이 만들어져요");
  if (안됨.length) { $("#지원경고").textContent = "⚠ 이 폰 브라우저에서 안 되는 것: " + 안됨.join(" · ") + " → 아이폰은 iOS 26 이상 사파리, 안드로이드는 크롬 최신으로 열어 주세요."; $("#지원경고").hidden = false; }
  const 홈앱 = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if (!홈앱 && !네이티브()) $("#설치안내").textContent = /iPhone|iPad/.test(navigator.userAgent) ? "사파리 아래 공유(□↑) → 「홈 화면에 추가」 하면 앱처럼 써요" : "크롬 메뉴(⋮) → 「홈 화면에 추가」";
  if (!기억("hw도움봄")) { 기억("hw도움봄", "1"); 보이기("v도움"); return; }
  await 홈열기();
  if (네이티브()) { 공유받기(); document.addEventListener("hwshare", 공유받기); }
}

/* 안드로이드 앱: 갤러리 「공유 → 숏츠 메이커」 로 들어온 파일 (네이티브가 앱 임시 폴더에 복사 → 조각으로 읽어 File 로) */
async function 공유받기() {
  const n = 네이티브(); if (!n || 공유받기.중) return; 공유받기.중 = true;
  try {
    let r = await n.getShared();
    for (let k = 0; r && r.busy && k < 600; k++) { await 잠깐(1000); r = await n.getShared(); }
    const 목록 = (r && r.files) || []; if (!목록.length) return;
    await n.clearShared(); 새로만들기(); 알림("공유받은 " + 목록.length + "개를 여는 중…", 3);
    const 파일들 = [];
    for (const f of 목록) {
      const 조각들 = [];
      for (let i = 0; i < f.size; i += 4 * 1048576) { const d = await n.read({ path: f.path, offset: i, length: 4 * 1048576 }); const s = atob(d.data), 바 = new Uint8Array(s.length); for (let j = 0; j < s.length; j++) 바[j] = s.charCodeAt(j); 조각들.push(바); }
      파일들.push(new File(조각들, f.name, { type: f.type || "" }));
    }
    파일고름(파일들);
  } catch (e) { 알림("공유받은 파일을 못 열었어요"); } finally { 공유받기.중 = false; }
}

async function 홈열기() {
  보이기("v홈");
  const 목록 = $("#작업목록"); 목록.textContent = "";
  let 작업들 = [];
  try { 작업들 = (await DB.모두("작업")).sort((a, b) => b.만든때 - a.만든때); } catch (e) {}
  $("#작업없음").hidden = 작업들.length > 0;
  for (const w of 작업들) {
    const b = document.createElement("button"); b.className = "작업";
    const 썸 = document.createElement("span"); 썸.className = "썸";
    if (w.썸) 썸.style.backgroundImage = "url('" + URL.createObjectURL(w.썸) + "')"; else 썸.textContent = "🎬";
    const 글 = document.createElement("span"); 글.className = "글";
    const 제목 = document.createElement("b"); 제목.textContent = w.제목 || "제목 없음";
    const 작 = document.createElement("small"); 작.textContent = new Date(w.만든때).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) + " · " + 초글(w.길이);
    글.append(제목, 작); b.append(썸, 글);
    b.addEventListener("click", () => 결과보기(w));
    목록.appendChild(b);
  }
}

/* ── 만들기 ── */
function 새로만들기(유지 = false) {
  상.녹음 = null; 상.녹음말 = null;
  if (!유지) { 상.파일들 = []; 상.음악 = null; 상.작업 = null; 상.계획 = null; 상.소재들 = null; $("#고른칸들").textContent = ""; $("#음악이름").textContent = ""; }
  $("#요청칸").value = 기억("hw요청") || ""; $("#가게칸").value = 기억("hw가게") || 기억("hw채널이름") || "";
  상.분야 = 기억("hw분야") || ""; try { Object.assign(상.옵션, JSON.parse(기억("hw옵션") || "{}")); } catch (e) {}
  분야그리기(); 옵션그리기(); 고른수(); 보이기("v만들기"); 단추살피기();
}
function 분야그리기() {
  const 칩 = $("#분야칩"); 칩.textContent = "";
  for (const x of 상.분야들) { const b = document.createElement("button"); b.textContent = (x.이모지 ? x.이모지 + " " : "") + x.이름; b.className = x.id === 상.분야 ? "켬" : "";
    b.addEventListener("click", () => { 상.분야 = x.id; 기억("hw분야", x.id); 분야그리기(); 단추살피기(); }); 칩.appendChild(b); }
}
function 고른수() { const v = 상.파일들.filter((f) => /^video|\.(mov|mp4|m4v)$/i.test(f.type || f.name)).length, p = 상.파일들.length - v;
  $("#고른수").textContent = 상.파일들.length ? "영상 " + v + "개 · 사진 " + p + "장" : "영상 2개 이상 또는 사진 5장 이상이 좋아요"; }
function 파일고름(목록) {
  for (const f of Array.from(목록 || [])) {
    if (!/^(video|image)\//.test(f.type || "") && !/\.(mov|mp4|m4v|heic|jpe?g|png|webp)$/i.test(f.name || "")) continue;
    if (상.파일들.length >= 20) { 알림("한 번에 20개까지예요"); break; }
    상.파일들.push(f);
    const 칸 = document.createElement("div"); 칸.className = "고른칸 끝";
    const u = URL.createObjectURL(f), 영상 = /^video\//.test(f.type) || /\.(mov|mp4|m4v)$/i.test(f.name);
    if (영상) { const v = document.createElement("video"); v.muted = true; v.playsInline = true; v.preload = "metadata"; v.src = u + "#t=0.1"; 칸.appendChild(v); } else { const i = document.createElement("img"); i.src = u; 칸.appendChild(i); }
    const 표 = document.createElement("span"); 표.className = "표"; 표.textContent = (영상 ? "🎬 " : "🖼 ") + 크기글(f.size);
    const 빼 = document.createElement("button"); 빼.className = "빼기"; 빼.textContent = "✕"; 빼.setAttribute("aria-label", "빼기");
    빼.addEventListener("click", () => { 상.파일들 = 상.파일들.filter((x) => x !== f); 칸.remove(); 상.계획 = null; 상.소재들 = null; 고른수(); 단추살피기(); });
    칸.append(표, 빼); $("#고른칸들").appendChild(칸);
  }
  상.계획 = null; 상.소재들 = null; 고른수(); 단추살피기();
}
function 단추살피기() {
  const b = $("#만들기단추"), 있음 = 상.파일들.length > 0;
  b.disabled = !있음 || !상.분야 || 상.만드는중;
  b.textContent = !있음 ? "✨ 영상·사진을 먼저 골라 주세요" : !상.분야 ? "✨ 분야를 골라 주세요" : "✨ 숏츠 만들기";
}
const 소리설명 = { 원본: "찍은 현장 소리를 살리고 음악을 작게 깔아요", 음악: "현장 소리는 빼고 음악 + 큰 자막으로",
  나레이션: "AI 목소리가 자막을 읽어 줘요 — 열쇠 없이 돼요 (영상에 「목소리: AI」 표시가 들어가요)",
  녹음: "자막 문장을 큰 글씨로 보여 드리면 장면마다 내 목소리로 읽어 녹음해요 (열쇠 없어도 돼요) · 장면 길이·자막이 녹음에 맞춰져요" };

/* ── 🎙 내 목소리 녹음 — 프롬프터 · 장면마다 녹음/다시/듣기 → [AudioBuffer] (엔진이 장면 길이·자막을 녹음에 맞춤) ──
   아이폰 사파리 = audio/mp4(AAC) · 안드로이드 = audio/webm(Opus) — MediaRecorder 가 고른 형식 그대로, decodeAudioData 로 풂 */
function 녹음받기(장면들) {
  return new Promise((끝냄, 그만) => {
    // 고친 뒤 다시 그릴 때: 문장이 그대로인 장면만 지난 녹음을 다시 씀 (문장을 고친 장면은 새로 녹음)
    const n = 장면들.length, 녹음들 = 장면들.map((s, k) => (상.녹음 && 상.녹음말 && 상.녹음[k] && 상.녹음말[k] === s.말 ? 상.녹음[k] : null));
    let i = 0, 레코더 = null, 흐름 = null, 조각 = [], 듣기 = null;
    보이기("v녹음");
    const 그리기 = () => {
      $("#녹음번호").textContent = "장면 " + (i + 1) + " / " + n + (i === 0 ? " · 훅 (힘 있게!)" : "");
      $("#프롬프터").textContent = 장면들[i].말;
      $("#녹음듣기").disabled = !녹음들[i]; $("#녹음다시").disabled = !녹음들[i];
      $("#녹음글").textContent = 녹음들[i] ? "✅ 녹음됐어요 — 들어 보고 괜찮으면 다음으로" : "● 를 누르고 읽은 뒤 한 번 더 누르세요";
      $("#녹음이전").disabled = i === 0;
      $("#녹음다음").textContent = i === n - 1 ? (녹음들.every(Boolean) ? "✨ 이 목소리로 만들기" : "녹음을 다 해 주세요") : "다음 ▶";
      $("#녹음점들").innerHTML = ""; 녹음들.forEach((x, k) => { const d = document.createElement("i"); d.className = (x ? "됨" : "") + (k === i ? " 지금" : ""); $("#녹음점들").appendChild(d); });
    };
    const 멈추기 = () => { if (레코더 && 레코더.state !== "inactive") 레코더.stop(); };
    const 시작 = async () => {
      try {
        if (!흐름) 흐름 = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      } catch (e) { 알림("마이크를 쓸 수 없어요 — 폰 설정에서 이 앱의 마이크를 허용해 주세요", 5); return; }
      const 형식 = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", ""].find((t) => !t || (window.MediaRecorder && MediaRecorder.isTypeSupported(t)));
      조각 = []; 레코더 = new MediaRecorder(흐름, 형식 ? { mimeType: 형식 } : undefined);
      레코더.ondataavailable = (e) => { if (e.data && e.data.size) 조각.push(e.data); };
      레코더.onstop = () => { $("#녹음단추").classList.remove("켜짐"); 녹음들[i] = new Blob(조각, { type: 레코더.mimeType || 형식 || "audio/mp4" }); 그리기(); };
      레코더.start(); $("#녹음단추").classList.add("켜짐"); $("#녹음글").textContent = "🔴 녹음 중… 다 읽으면 ■ 를 누르세요";
    };
    const 정리 = () => { 멈추기(); if (흐름) 흐름.getTracks().forEach((t) => t.stop()); 흐름 = null; ["녹음단추", "녹음듣기", "녹음다시", "녹음이전", "녹음다음", "문장고치기"].forEach((id) => { const e = $("#" + id); e.replaceWith(e.cloneNode(true)); }); };
    $("#녹음단추").addEventListener("click", () => (레코더 && 레코더.state === "recording" ? 멈추기() : 시작()));
    $("#녹음다시").addEventListener("click", () => { 녹음들[i] = null; 그리기(); 시작(); });
    $("#녹음듣기").addEventListener("click", () => { if (!녹음들[i]) return; if (듣기) 듣기.pause(); 듣기 = new Audio(URL.createObjectURL(녹음들[i])); 듣기.play().catch(() => {}); });
    $("#문장고치기").addEventListener("click", () => { const 새 = prompt("이 장면 문장을 고쳐 주세요 (자막에도 그대로 나와요)", 장면들[i].말); if (새 && 새.trim()) { 장면들[i].말 = 새.trim().slice(0, 80); 녹음들[i] = null; 그리기(); } });
    $("#녹음이전").addEventListener("click", () => { 멈추기(); if (i > 0) { i--; 그리기(); } });
    $("#녹음다음").addEventListener("click", async () => {
      멈추기();
      if (i < n - 1) { i++; 그리기(); return; }
      if (!녹음들.every(Boolean)) { const k = 녹음들.findIndex((x) => !x); 알림("장면 " + (k + 1) + " 을 아직 안 녹음했어요"); i = k; 그리기(); return; }
      try {
        $("#녹음글").textContent = "🎚 목소리 다듬는 중…";
        const 버퍼들 = []; for (const b of 녹음들) 버퍼들.push(await HW계획.녹음다듬기(b));
        상.녹음 = 녹음들; 상.녹음말 = 장면들.map((s) => s.말); 정리(); 보이기("v진행"); 끝냄(버퍼들);
      } catch (e) { 알림("녹음을 읽지 못했어요 — 다시 녹음해 주세요", 4); }
    });
    그리기();
  });
}
function 옵션그리기() {
  $$(".고름[data-옵션]").forEach((g) => $$("button", g).forEach((b) => b.classList.toggle("켬", String(b.dataset.값) === String(상.옵션[g.dataset.옵션]))));
  $$("#토글들 input").forEach((c) => (c.checked = !(상.옵션.끄기 || []).includes(c.dataset.끄기)));
  // 🗣 AI 목소리 = 엣지 읽기(열쇠 없이 · 붙을 수 있는 폰에서만) + 제미나이(내 열쇠를 켠 사람만)
  const 목들 = AI목소리들(), 됨 = 목들.length > 0;
  const 나레단추 = $('.고름[data-옵션="소리"] button[data-값="나레이션"]');
  if (나레단추) { 나레단추.disabled = !됨; 나레단추.style.opacity = 됨 ? "" : ".35"; }
  if (상.옵션.소리 === "나레이션" && !됨) { 상.옵션.소리 = "원본"; $$('.고름[data-옵션="소리"] button').forEach((b) => b.classList.toggle("켬", b.dataset.값 === "원본")); }
  if (!됨) 소리설명.나레이션 = "이 폰 브라우저(아이폰 사파리 등)에서는 AI 목소리 서버에 붙을 수 없어요 — 「🎙 내 목소리」 로 녹음해 주세요";
  $("#소리설명").textContent = 소리설명[상.옵션.소리] || "";
  const 줄 = $("#목소리줄"); 줄.hidden = 상.옵션.소리 !== "나레이션";
  if (!줄.hidden) {
    if (!목들.some(([id]) => id === 상.옵션.목소리)) 상.옵션.목소리 = 목들[0][0];
    const 칩 = $("#목소리칩"); 칩.textContent = "";
    for (const [id, 이름] of 목들) { const b = document.createElement("button"); b.textContent = 이름; b.className = id === 상.옵션.목소리 ? "켬" : "";
      b.addEventListener("click", () => { 상.옵션.목소리 = id; 옵션그리기(); }); 칩.appendChild(b); }
    $("#목소리듣기").hidden = !String(상.옵션.목소리).startsWith("edge:");
  }
  $("#소리설명").textContent = 소리설명[상.옵션.소리] || "";
  const 기본 = 상.옵션.소리 === "원본" && 상.옵션.길이 === "보통" && 상.옵션.자막 === "보통" && 상.옵션.세기 === "보통" && !(상.옵션.끄기 || []).length;
  $("#옵션요약").textContent = 기본 ? "기본값 그대로 좋아요" : [{ 원본: "원본 소리", 음악: "음악만", 나레이션: "나레이션" }[상.옵션.소리], 상.옵션.길이, "자막 " + 상.옵션.자막, "효과 " + 상.옵션.세기].join(" · ");
}

/* 🤖 AI 분석은 선택 (기본 = 사용 안 함 · 열쇠 없이 규칙 편집) — 켰고 열쇠가 있을 때만 제미나이·나레이션 */
function AI켜짐() { return 기억("hwAI") === "켬" && !!기억("hw열쇠"); }
function AI열쇠() { return AI켜짐() ? 기억("hw열쇠") : ""; }
function AI목소리들() {                                         // [[id, 보이는 이름]] — 엣지(열쇠 없이) 먼저 · 제미나이는 내 열쇠를 켠 사람만
  const out = [];
  if (window.HW엣지 && HW엣지.쓸수있나()) for (const [v, 이름] of HW엣지.목소리들) out.push(["edge:" + v, 이름]);
  if (AI켜짐()) out.push(["gemini:Kore", "제미나이 (내 열쇠)"]);
  return out;
}
async function 목소리미리듣기() {
  const id = String(상.옵션.목소리 || ""); if (!id.startsWith("edge:")) return;
  const b = $("#목소리듣기"); b.disabled = true; b.textContent = "받는 중…";
  try { const r = await HW엣지.읽기("안녕하세요, 이 목소리로 읽어 드릴게요.", id.slice(5), 1.2); const a = new Audio(URL.createObjectURL(new Blob([r.mp3], { type: "audio/mpeg" }))); await a.play(); }
  catch (e) { 알림("목소리를 받지 못했어요 — " + (e.message || e), 4); }
  b.disabled = false; b.textContent = "▶ 이 목소리 미리 듣기";
}
function AI고름그리기() {
  const 켬 = 기억("hwAI") === "켬";
  $$("#AI고름 button").forEach((b) => b.classList.toggle("켬", (b.dataset.ai === "켬") === 켬));
  $("#열쇠줄").hidden = !켬;
}

function 채널() { return { 이름: 기억("hw채널이름") || "", 부제: 기억("hw채널부제") || "", 이모지: 기억("hw채널이모지") || "", 색: "rgb(255,208,105)" }; }

const 단계들 = [["열기", "영상·사진 열기", 0.02], ["살펴", "장면 살펴보기", 0.12], ["대본", "자막·순서 정하기", 0.2], ["그리", "효과 입히며 그리기", 0.88], ["소리", "소리 섞기·굽기", 0.97], ["끝", "완성", 1]];
function 진행그리기(글, p) {
  p = Math.max(0, Math.min(1, p || 0));
  $("#진행퍼센트").textContent = Math.round(p * 100) + "%"; $("#원값").style.strokeDashoffset = String(326.7 * (1 - p)); $("#진행글").textContent = 글 || "";
  const 목록 = $("#단계목록"); 목록.textContent = "";
  let 지금 = 단계들.findIndex(([, , 끝]) => p < 끝); if (지금 < 0) 지금 = 단계들.length - 1;
  단계들.forEach(([, 이름], i) => { const li = document.createElement("li"), 표 = document.createElement("i"), 끝 = p >= 1 || i < 지금; li.className = 끝 ? "끝" : i === 지금 ? "지금" : ""; 표.textContent = 끝 ? "✓" : i === 지금 ? "●" : "○"; li.append(표, 이름); 목록.appendChild(li); });
}

async function 만들기(계획 = null) {
  if (상.만드는중) return;
  const 분 = 상.분야들.find((x) => x.id === 상.분야);
  if (!분) { 알림("분야를 골라 주세요"); return; }
  기억("hw요청", $("#요청칸").value); 기억("hw가게", $("#가게칸").value); 기억("hw옵션", JSON.stringify(상.옵션));
  상.만드는중 = true; 보이기("v진행"); $("#진행오류").hidden = true; $("#진행바닥").hidden = true; 진행그리기("준비하는 중…", 0);
  await 화면켜두기(true);
  try {
    const 옵션 = Object.assign({}, 상.옵션);
    const 채 = 채널(); if ($("#가게칸").value.trim() && !채.이름) 채.이름 = $("#가게칸").value.trim().slice(0, 16);
    if (옵션.소리 === "나레이션" && !AI목소리들().length) 옵션.소리 = "원본";   // AI 목소리를 못 받는 폰이면 원본 소리로
    const r = await HW폰엔진.만들기(상.파일들, { 분야: 분, 요청: $("#요청칸").value, 가게: $("#가게칸").value.trim(), 옵션, 열쇠: AI열쇠(), 채널: 채,
      목소리: 옵션.목소리 || "edge:ko-KR-SunHiNeural", 음악파일: 상.음악, 음악결: Number(옵션.음악결 || 0), 계획, 소재들: 상.소재들 && 계획 ? 상.소재들 : null, 진행: 진행그리기, 녹음받기 });
    상.계획 = r.계획; 상.소재들 = r.소재들; if (r.후보) 상.후보 = r.후보;
    const 작업 = { id: 상.작업 || "w" + Date.now(), 만든때: Date.now(), 제목: r.계획.제목, 설명: (r.계획.설명 || "") + (r.계획.태그 && r.계획.태그.length ? "\n\n" + r.계획.태그.map((t) => "#" + String(t).replace(/\s/g, "")).join(" ") : ""),
      영상: r.blob, 썸: r.썸네일, 계획: r.계획, 분야: 분.id, 요청: $("#요청칸").value, 가게: $("#가게칸").value, 옵션, 확인: r.확인, 걸린초: r.걸린초, 길이: r.길이,
      녹음: r.계획.녹음 ? 상.녹음 : null, 녹음말: r.계획.녹음 ? 상.녹음말 : null };
    상.작업 = 작업.id;
    try { await DB.넣기("작업", 작업); await DB.비우기("원본"); await DB.넣기("원본", { id: 작업.id, 파일들: 상.파일들, 음악: 상.음악 }); } catch (e) { 알림("폰 저장 공간이 부족해서 목록엔 못 남겼어요", 4); }
    결과보기(작업);
  } catch (e) {
    console.error(e); $("#진행오류").textContent = "❌ " + (e.message || e); $("#진행오류").hidden = false; $("#진행바닥").hidden = false;
  } finally { 상.만드는중 = false; 화면켜두기(false); 단추살피기(); }
}

/* ── 결과 ── */
function 결과보기(w) {
  상.결과 = w; 상.작업 = w.id; 상.계획 = w.계획; 상.녹음 = w.녹음 || null; 상.녹음말 = w.녹음말 || null; 보이기("v결과");
  const v = $("#결과영상"); v.src = URL.createObjectURL(w.영상); if (w.썸) v.poster = URL.createObjectURL(w.썸);
  $("#결과제목").textContent = w.제목 || ""; $("#결과설명").textContent = w.설명 || "";
  $("#썸틀").hidden = !w.썸; if (w.썸) $("#썸그림").src = URL.createObjectURL(w.썸);
  const 확인 = $("#확인목록"); 확인.textContent = ""; for (const x of w.확인 || []) { const li = document.createElement("li"); li.textContent = "⚠ " + x; 확인.appendChild(li); }
  $("#걸린시간").textContent = w.걸린초 ? "이 폰에서 " + Math.round(w.걸린초) + "초 걸렸어요 · " + 초글(w.길이) + " · " + 크기글(w.영상.size) : "";
  $("#저장도움").textContent = 네이티브() ? "누르면 폰의 Movies\\HW숏츠 폴더(갤러리)에 저장돼요." : /iPhone|iPad/.test(navigator.userAgent) ? "공유 창이 뜨면 「비디오 저장」 → 사진 앱. 인스타·유튜브 앱으로 바로 보내도 돼요." : "공유 창에서 저장하거나 인스타·유튜브로 바로 보내세요.";
}

async function 블롭저장(blob, 이름, 종류) {
  const n = 네이티브();
  if (n) {
    const 조각 = 2 * 1048576;
    for (let i = 0; i < blob.size; i += 조각) {
      const 바 = new Uint8Array(await blob.slice(i, i + 조각).arrayBuffer()); let 글 = "";
      for (let j = 0; j < 바.length; j += 0x8000) 글 += String.fromCharCode.apply(null, 바.subarray(j, j + 0x8000));
      await n.saveChunk({ name: 이름, data: btoa(글), first: i === 0 });
    }
    await n.saveDone({ name: 이름, mime: 종류 });
    알림("갤러리(Movies\\HW숏츠)에 저장했어요 ✓", 3.5); return;
  }
  const f = new File([blob], 이름, { type: 종류 });
  if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f] }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
  const a = document.createElement("a"); a.href = URL.createObjectURL(f); a.download = 이름; document.body.appendChild(a); a.click(); a.remove();
}

async function 다시만들기(옵션바꿈) {
  if (!상.파일들.length) {                                    // 앱을 다시 켠 뒤면 원본을 폰 저장소에서 꺼냄
    const 원 = await DB.꺼내기("원본", 상.작업).catch(() => null);
    if (!원) { 알림("원본이 없어요 — 영상을 다시 골라 주세요", 3.5); 새로만들기(); return; }
    상.파일들 = 원.파일들; 상.음악 = 원.음악 || null;
    if (상.결과) { $("#요청칸").value = 상.결과.요청 || ""; 상.분야 = 상.결과.분야; 기억("hw분야", 상.분야); 기억("hw요청", 상.결과.요청 || ""); 기억("hw가게", 상.결과.가게 || ""); }
  }
  상.계획 = null; 상.소재들 = null;
  if (옵션바꿈) { 새로만들기(true); $("#고른칸들").textContent = ""; $("#고른수").textContent = "이미 고른 " + 상.파일들.length + "개 그대로 써요"; $("#옵션접기").open = true; return; }
  if (!confirm("같은 영상·사진으로 새로 만들까요? (컷·효과가 새로 골라져요)")) return;
  상.녹음 = null; 상.녹음말 = null;                                // 새 대본이라 녹음도 새로
  만들기(null);
}

/* ── ✂ 고치기 ── */
async function 고치기열기() {
  if (!상.파일들.length) { const 원 = await DB.꺼내기("원본", 상.작업).catch(() => null); if (!원) { 알림("원본이 없어요 — 가장 최근 작업만 고칠 수 있어요", 3.5); return; } 상.파일들 = 원.파일들; 상.음악 = 원.음악 || null; }
  if (!상.소재들) { 알림("원본 여는 중…", 1.5); 상.소재들 = []; for (const f of 상.파일들) 상.소재들.push(await HW폰엔진.소재열기(f)); }
  상.고칠계획 = JSON.parse(JSON.stringify(상.계획));
  보이기("v고치기"); 장면그리기();
}
const 썸캐시 = new Map();
function 컷썸(c) {                                            // 그 컷 가운데 화면 (작게) — 사진은 바로, 영상은 처음 한 번 그림
  const 열쇠 = c.파일 + ":" + Math.round((c.시작 + c.길이 / 2) * 10);
  if (썸캐시.has(열쇠)) return Promise.resolve(썸캐시.get(열쇠));
  const s = 상.소재들[c.파일]; if (!s) return Promise.resolve("");
  // ★영상 요소를 새로 많이 만들면 폰 브라우저가 재생기를 멈춰 검은 그림이 나왔다(시험판 1) → 소재마다 하나(s.el)를 줄 세워 차례로 씀★
  const 일 = (컷썸.줄 || Promise.resolve()).then(async () => {
    const cv = document.createElement("canvas"); cv.width = 128; cv.height = 228; const d = cv.getContext("2d");
    if (s.종류 === "영상") {
      const v = s.el;
      await new Promise((r) => { const 끝 = () => { v.removeEventListener("seeked", 끝); r(); }; v.addEventListener("seeked", 끝); v.currentTime = Math.min(s.길이 - 0.05, c.시작 + c.길이 / 2); setTimeout(끝, 3000); });
      await new Promise((r) => (v.requestVideoFrameCallback ? v.requestVideoFrameCallback(() => r()) : requestAnimationFrame(() => r())) && setTimeout(r, 300));
    }
    const 비 = Math.max(128 / s.w, 228 / s.h); d.drawImage(s.el, 64 - (c.x ?? 0.5) * s.w * 비, 114 - (c.y ?? 0.45) * s.h * 비, s.w * 비, s.h * 비);
    const u = cv.toDataURL("image/jpeg", 0.7); 썸캐시.set(열쇠, u); return u;
  });
  컷썸.줄 = 일.catch(() => "");
  return 일;
}
function 장면그리기() {
  const 곳 = $("#장면목록"); 곳.textContent = "";
  상.고칠계획.장면.forEach((s, si) => {
    const 카드 = document.createElement("div"); 카드.className = "장면";
    const 머리 = document.createElement("div"); 머리.className = "장면머리";
    const 이름 = document.createElement("b"); 이름.textContent = si === 0 ? "장면 1 · 훅" : "장면 " + (si + 1) + (s.정보판 ? " · 정보판" : "");
    const 길이 = document.createElement("small"); 길이.textContent = 초글(s.컷.reduce((a, c) => a + c.길이, 0)) + " · 컷 " + s.컷.length;
    머리.append(이름, 길이);
    const 말 = document.createElement("textarea"); 말.className = "칸"; 말.value = s.말; 말.maxLength = 80; 말.rows = 2; 말.addEventListener("input", () => (s.말 = 말.value));
    const 화면글 = document.createElement("input"); 화면글.className = "칸 화면글칸"; 화면글.value = s.화면글 || ""; 화면글.maxLength = 16; 화면글.placeholder = si === 0 ? "(훅은 큰 글자로 나와요)" : "위쪽 글귀 (16자 · 선택)";
    화면글.addEventListener("input", () => (s.화면글 = 화면글.value)); if (si === 0) 화면글.disabled = true;
    const 줄 = document.createElement("div"); 줄.className = "컷줄";
    s.컷.forEach((c, ci) => 줄.appendChild(컷칸(s, si, c, ci)));
    const 더 = document.createElement("button"); 더.className = "컷더하기"; 더.textContent = "＋"; 더.setAttribute("aria-label", "컷 더하기");
    더.addEventListener("click", () => { const s0 = 상.소재들[0]; s.컷.push({ 파일: 0, 시작: 0, 길이: s0.종류 === "사진" ? 1.5 : Math.min(1.5, Math.max(0.5, s0.길이 - 0.1)), x: 0.5, y: 0.45, 확대: 1, 효과: "" }); 장면그리기(); 컷판열기(si, s.컷.length - 1); });
    줄.appendChild(더);
    카드.append(머리, 말, 화면글, 줄); 곳.appendChild(카드);
  });
}
function 컷칸(s, si, c, ci) {
  const 칸 = document.createElement("div"); 칸.className = "컷";
  const 그림 = document.createElement("div"); 그림.className = "그림"; 컷썸(c).then((u) => { if (u) 그림.style.backgroundImage = "url('" + u + "')"; });
  const 길이 = document.createElement("span"); 길이.className = "길이"; 길이.textContent = c.길이.toFixed(1);
  칸.append(그림, 길이);
  if (c.효과) { const 효 = document.createElement("span"); 효.className = "효과표"; 효.textContent = c.효과; 칸.appendChild(효); }
  const 끌 = document.createElement("span"); 끌.className = "끌기"; 끌.textContent = "⠿"; 칸.appendChild(끌);
  그림.addEventListener("click", () => 컷판열기(si, ci));
  let 시작x = 0, 폭 = 72, 움 = 0;
  끌.addEventListener("pointerdown", (e) => { e.preventDefault(); 끌.setPointerCapture(e.pointerId); 시작x = e.clientX; 움 = 0; 폭 = 칸.getBoundingClientRect().width + 7; 칸.classList.add("끄는중"); });
  끌.addEventListener("pointermove", (e) => { if (!칸.classList.contains("끄는중")) return; 움 = e.clientX - 시작x; 칸.style.transform = "translateX(" + 움 + "px) scale(1.06)"; });
  const 끝 = () => { if (!칸.classList.contains("끄는중")) return; 칸.classList.remove("끄는중"); 칸.style.transform = ""; const k = Math.round(움 / 폭);
    if (k) { const 새 = Math.max(0, Math.min(s.컷.length - 1, ci + k)); const [x] = s.컷.splice(ci, 1); s.컷.splice(새, 0, x); 장면그리기(); } };
  끌.addEventListener("pointerup", 끝); 끌.addEventListener("pointercancel", 끝);
  return 칸;
}
function 지금컷() { const g = 상.고른컷; return g ? 상.고칠계획.장면[g.si].컷[g.ci] : null; }
function 컷판열기(si, ci) { 상.고른컷 = { si, ci }; $("#판가림").hidden = false; $("#컷판").hidden = false; 컷판그리기(); }
function 컷판닫기() { $("#판가림").hidden = true; $("#컷판").hidden = true; $("#컷영상").pause(); 상.고른컷 = null; 장면그리기(); }
function 컷판그리기() {
  const c = 지금컷(); if (!c) return; const s = 상.소재들[c.파일], 사진 = s.종류 === "사진";
  const v = $("#컷영상"), 그 = $("#컷사진"); v.hidden = 사진; 그.hidden = !사진;
  if (사진) 그.src = s.url; else { if (v.dataset.src !== s.url) { v.src = s.url; v.dataset.src = s.url; } v.currentTime = c.시작; v.play().catch(() => {}); }
  const 칩 = $("#컷파일칩"); 칩.textContent = "";
  상.소재들.forEach((f, i) => { const b = document.createElement("button"); b.className = i === c.파일 ? "켬" : "";
    컷썸({ 파일: i, 시작: f.종류 === "사진" ? 0 : f.길이 / 2 - 0.1, 길이: 0.2, x: 0.5, y: 0.45 }).then((u) => (b.style.backgroundImage = "url('" + u + "')"));
    b.addEventListener("click", () => { c.파일 = i; c.시작 = 0; c.x = 0.5; c.y = 0.45; c.확대 = 1; if (f.종류 === "영상") c.길이 = Math.min(c.길이, Math.max(0.4, f.길이 - 0.1)); 컷판그리기(); }); 칩.appendChild(b); });
  구간그리기();
  $$("#효과칩 button").forEach((b) => { b.classList.toggle("켬", (b.dataset.효과 || "") === (c.효과 || "")); b.hidden = b.hasAttribute("data-사진만") && !사진; });
}
function 구간그리기() {
  const c = 지금컷(); if (!c) return; const s = 상.소재들[c.파일], 사진 = s.종류 === "사진";
  const D = 사진 ? Math.max(4, c.길이 + 1) : Math.max(0.5, s.길이), 시작 = 사진 ? 0 : c.시작;
  $("#구간창").style.left = (100 * 시작 / D) + "%"; $("#구간창").style.width = (100 * c.길이 / D) + "%";
  $("#구간글").textContent = 사진 ? "사진 " + c.길이.toFixed(1) + "초 (오른쪽 손잡이로 길이)" : 초글(c.시작) + " ~ " + 초글(c.시작 + c.길이) + " · " + c.길이.toFixed(1) + "초 (가운데를 끌면 다른 구간)";
}
function 구간붙이기() {
  const 틀 = $("#구간"); let 잡은 = null, 처음x = 0, 처음 = null;
  const 시작 = (e, 무엇) => { const c = 지금컷(); if (!c) return; e.preventDefault(); e.stopPropagation(); 잡은 = 무엇; 처음x = e.clientX; 처음 = { 시작: c.시작, 길이: c.길이 }; e.target.setPointerCapture(e.pointerId); };
  $("#손왼").addEventListener("pointerdown", (e) => 시작(e, "왼")); $("#손오른").addEventListener("pointerdown", (e) => 시작(e, "오른"));
  $("#구간창").addEventListener("pointerdown", (e) => { if (e.target.id === "구간창") 시작(e, "창"); });
  틀.addEventListener("pointermove", (e) => {
    if (!잡은) return; const c = 지금컷(), s = 상.소재들[c.파일], 사진 = s.종류 === "사진";
    const D = 사진 ? Math.max(4, 처음.길이 + 1) : Math.max(0.5, s.길이), 초 = (e.clientX - 처음x) / 틀.getBoundingClientRect().width * D;
    if (사진) c.길이 = Math.max(0.4, Math.min(8, 처음.길이 + (잡은 === "왼" ? -초 : 초)));
    else if (잡은 === "창") c.시작 = Math.max(0, Math.min(s.길이 - c.길이 - 0.02, 처음.시작 + 초));
    else if (잡은 === "왼") { const 끝 = 처음.시작 + 처음.길이; c.시작 = Math.max(0, Math.min(끝 - 0.4, 처음.시작 + 초)); c.길이 = Math.min(8, 끝 - c.시작); }
    else c.길이 = Math.max(0.4, Math.min(8, s.길이 - c.시작 - 0.02, 처음.길이 + 초));
    c.시작 = Math.round(c.시작 * 100) / 100; c.길이 = Math.round(c.길이 * 100) / 100; 구간그리기();
    const v = $("#컷영상"); if (!사진) v.currentTime = 잡은 === "오른" ? Math.max(c.시작, c.시작 + c.길이 - 0.15) : c.시작;
  });
  const 놓기 = () => { if (잡은) { 잡은 = null; const c = 지금컷(), v = $("#컷영상"); if (c && !v.hidden) { v.currentTime = c.시작; v.play().catch(() => {}); } } };
  틀.addEventListener("pointerup", 놓기); 틀.addEventListener("pointercancel", 놓기);
  $("#컷영상").addEventListener("timeupdate", () => { const c = 지금컷(), v = $("#컷영상"); if (c && !잡은 && (v.currentTime > c.시작 + c.길이 || v.currentTime < c.시작 - 0.3)) v.currentTime = c.시작; });
}
function 컷옮기기(쪽) { const g = 상.고른컷; if (!g) return; const 컷들 = 상.고칠계획.장면[g.si].컷, 새 = g.ci + 쪽; if (새 < 0 || 새 >= 컷들.length) { 알림(쪽 < 0 ? "맨 앞이에요" : "맨 뒤예요"); return; } const [c] = 컷들.splice(g.ci, 1); 컷들.splice(새, 0, c); g.ci = 새; 알림((새 + 1) + "번째로 옮겼어요", 1.4); }
function 컷빼기() { const g = 상.고른컷; if (!g) return; const 컷들 = 상.고칠계획.장면[g.si].컷; if (컷들.length <= 1) { 알림("장면마다 컷은 하나 이상 있어야 해요"); return; } 컷들.splice(g.ci, 1); 컷판닫기(); }
let 대략멈춤 = false;
async function 대략보기() {
  대략멈춤 = false; $("#대략").hidden = false; const v = $("#대략영상"), 그 = $("#대략사진"), 자막 = $("#대략자막");
  for (const s of 상.고칠계획.장면) { 자막.textContent = s.말;
    for (const c of s.컷) { if (대략멈춤) return; const x = 상.소재들[c.파일];
      if (x.종류 === "사진") { v.hidden = true; 그.hidden = false; 그.src = x.url; await 잠깐(c.길이 * 1000); continue; }
      그.hidden = true; v.hidden = false; if (v.dataset.src !== x.url) { v.src = x.url; v.dataset.src = x.url; await new Promise((r) => { v.onloadeddata = r; setTimeout(r, 2500); }); }
      v.currentTime = c.시작; await v.play().catch(() => {}); const 끝 = performance.now() + c.길이 * 1000; while (performance.now() < 끝 && !대략멈춤) await 잠깐(40); v.pause(); } }
  $("#대략").hidden = true;
}
async function 완성그리기() {
  const 안 = 상.고칠계획;
  if (안.장면.some((s) => !String(s.말).trim())) { 알림("자막이 빈 장면이 있어요"); return; }
  if (!confirm("고친 대로 효과를 입혀 다시 그릴까요?")) return;
  if (상.결과) { 상.분야 = 상.결과.분야; $("#요청칸").value = 상.결과.요청 || ""; $("#가게칸").value = 상.결과.가게 || ""; Object.assign(상.옵션, 상.결과.옵션 || {}); }
  만들기(안);
}

/* ── 설정 ── */
function 설정열기() { $("#채널이름칸").value = 기억("hw채널이름") || ""; $("#채널부제칸").value = 기억("hw채널부제") || ""; $("#채널이모지칸").value = 기억("hw채널이모지") || "";
  $("#열쇠칸").value = ""; $("#열쇠칸").placeholder = 기억("hw열쇠") ? "열쇠가 들어 있어요 (바꾸려면 새로 붙여 넣기)" : "열쇠를 붙여 넣어 주세요"; AI고름그리기(); 보이기("v설정"); }
function 설정저장() { 기억("hw채널이름", $("#채널이름칸").value.trim()); 기억("hw채널부제", $("#채널부제칸").value.trim()); 기억("hw채널이모지", $("#채널이모지칸").value.trim());
  const k = $("#열쇠칸").value.trim(); if (k) { 기억("hw열쇠", k); 기억("hw모델", null); 기억("hw목소리모델", null); }
  if (기억("hwAI") === "켬" && !기억("hw열쇠")) 알림("AI 분석을 켰지만 열쇠가 없어서 AI 없이 만들어요", 3.5); else 알림("저장했어요 ✓"); 홈열기(); }

/* ── 묶기 ── */
function 묶기() {
  $("#홈단추").addEventListener("click", () => { if (!상.만드는중) 홈열기(); });
  $("#도움단추").addEventListener("click", () => { if (!상.만드는중) 보이기("v도움"); });
  $("#설정단추").addEventListener("click", () => { if (!상.만드는중) 설정열기(); });
  $("#도움닫기").addEventListener("click", 홈열기);
  $("#설정저장").addEventListener("click", 설정저장);
  $("#AI고름").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; 기억("hwAI", b.dataset.ai); AI고름그리기(); });
  $("#열쇠지우기").addEventListener("click", () => { 기억("hw열쇠", null); 기억("hw모델", null); 알림("열쇠를 지웠어요"); 설정열기(); });
  $("#새로단추").addEventListener("click", () => 새로만들기());
  $("#파일칸").addEventListener("change", (e) => { 파일고름(e.target.files); e.target.value = ""; });
  $("#음악칸").addEventListener("change", (e) => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if (f) { 상.음악 = f; $("#음악이름").textContent = "🎵 " + f.name; } });
  $$(".고름[data-옵션]").forEach((g) => g.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; 상.옵션[g.dataset.옵션] = b.dataset.값; 옵션그리기(); }));
  $("#토글들").addEventListener("change", () => { 상.옵션.끄기 = $$("#토글들 input").filter((c) => !c.checked).map((c) => c.dataset.끄기); 옵션그리기(); });
  $("#목소리듣기").addEventListener("click", 목소리미리듣기);
  $("#만들기단추").addEventListener("click", () => 만들기(null));
  $("#실패다시").addEventListener("click", () => 만들기(null));
  $("#저장단추").addEventListener("click", () => 상.결과 && 블롭저장(상.결과.영상, "숏츠_" + new Date(상.결과.만든때).toISOString().slice(0, 16).replace(/[-:T]/g, "") + ".mp4", "video/mp4"));
  $("#썸저장").addEventListener("click", () => 상.결과 && 상.결과.썸 && 블롭저장(상.결과.썸, "썸네일_" + 상.결과.만든때 + ".jpg", "image/jpeg"));
  $("#다시단추").addEventListener("click", () => 다시만들기(false));
  $("#옵션다시단추").addEventListener("click", () => 다시만들기(true));
  $("#고치기단추").addEventListener("click", 고치기열기);
  $$("[data-복사]").forEach((b) => b.addEventListener("click", async () => { try { await navigator.clipboard.writeText($("#" + b.dataset.복사).textContent); 알림("복사했어요 ✓", 1.6); } catch (e) { 알림("길게 눌러 복사해 주세요"); } }));
  $("#판가림").addEventListener("click", 컷판닫기); $("#컷닫기").addEventListener("click", 컷판닫기);
  $("#앞으로").addEventListener("click", () => 컷옮기기(-1)); $("#뒤로").addEventListener("click", () => 컷옮기기(1)); $("#컷빼기").addEventListener("click", 컷빼기);
  $("#효과칩").addEventListener("click", (e) => { const b = e.target.closest("button"), c = 지금컷(); if (!b || !c) return; c.효과 = b.dataset.효과 || ""; 컷판그리기(); });
  구간붙이기();
  $("#대략단추").addEventListener("click", 대략보기);
  $("#대략닫기").addEventListener("click", () => { 대략멈춤 = true; $("#대략영상").pause(); $("#대략").hidden = true; });
  $("#그리기단추").addEventListener("click", 완성그리기);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && 상.만드는중) 화면켜두기(true); });
}
묶기();
시작하기();

/* 자동 시험용 (헤드리스 크롬): 파일들을 주면 기본 옵션으로 끝까지 만들고 결과를 돌려줌 */
window.HW시험 = async (주소들, 분야 = "헬스", 요청 = "", 옵션 = {}) => {
  상.파일들 = [];
  for (const u of 주소들) { const b = await (await fetch(u)).blob(); 상.파일들.push(new File([b], u.split("/").pop(), { type: b.type || (/\.mp4$/.test(u) ? "video/mp4" : "image/jpeg") })); }
  상.분야 = 분야; $("#요청칸").value = 요청; Object.assign(상.옵션, 옵션);
  await 만들기(null);
  const w = 상.결과; if (!w) throw new Error($("#진행오류").textContent || "실패");
  const 읽기 = async (b) => { const 바 = new Uint8Array(await b.arrayBuffer()); let 글 = ""; for (let i = 0; i < 바.length; i += 0x8000) 글 += String.fromCharCode.apply(null, 바.subarray(i, i + 0x8000)); return btoa(글); };
  return { 영상: await 읽기(w.영상), 썸: w.썸 ? await 읽기(w.썸) : "", 걸린초: w.걸린초, 길이: w.길이, 제목: w.제목, 확인: w.확인, 계획: w.계획 };
};
