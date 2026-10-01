/* ══════════════════════════════════════════════════════════════
   HW 숏츠 메이커 📱 폰 단독 — mp4 묶기 (우리 코드 · 외부 라이브러리 없음 · 2026-10-01 밤)
   WebCodecs 가 내놓은 H.264(avcC) 영상 조각 + AAC 소리 조각 → 앞쪽에 moov 가 오는(faststart) mp4 하나
   · 영상: avc1 + avcC(인코더가 준 그대로) + colr(bt709) · 표본마다 한 덩이(stco) · 키프레임 stss · 순서가 다르면 ctts
   · 소리: mp4a + esds(AudioSpecificConfig) · 1024 표본씩
   ══════════════════════════════════════════════════════════════ */
"use strict";
(function (전역) {
  const 글 = (s) => Array.from(s).map((c) => c.charCodeAt(0));
  function u32(v) { return [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255]; }
  function u16(v) { return [(v >>> 8) & 255, v & 255]; }
  function 상자(이름, ...안) {
    const 몸 = [];
    for (const x of 안) { if (x instanceof Uint8Array) for (let i = 0; i < x.length; i++) 몸.push(x[i]); else for (const b of x) 몸.push(b); }
    return new Uint8Array([...u32(몸.length + 8), ...글(이름), ...몸]);
  }
  const 온상자 = (이름, 판, 표, ...안) => 상자(이름, [판, (표 >>> 16) & 255, (표 >>> 8) & 255, 표 & 255], ...안);
  const 행렬 = [...u32(0x00010000), ...u32(0), ...u32(0), ...u32(0), ...u32(0x00010000), ...u32(0), ...u32(0), ...u32(0), ...u32(0x40000000)];

  function 서술(꼬리표, 몸) { return [꼬리표, 0x80, 0x80, 0x80, 몸.length, ...몸]; }

  function 트랙(t, 번호, 길이ms) {
    const 영상 = t.종류 === "영상";
    const n = t.표본.length;
    const tkhd = 온상자("tkhd", 0, 3, u32(0), u32(0), u32(번호), u32(0), u32(길이ms), u32(0), u32(0), u16(0), u16(0),
      u16(영상 ? 0 : 0x0100), u16(0), 행렬, u32(영상 ? t.폭 << 16 : 0), u32(영상 ? t.높이 << 16 : 0));
    const mdhd = 온상자("mdhd", 0, 0, u32(0), u32(0), u32(t.시간단위), u32(t.총길이), u16(0x55c4), u16(0));
    const hdlr = 온상자("hdlr", 0, 0, u32(0), 글(영상 ? "vide" : "soun"), u32(0), u32(0), u32(0), 글(영상 ? "HW Video" : "HW Sound"), [0]);
    const 미디어머리 = 영상 ? 온상자("vmhd", 0, 1, u16(0), u16(0), u16(0), u16(0)) : 온상자("smhd", 0, 0, u16(0), u16(0));
    const dinf = 상자("dinf", 온상자("dref", 0, 0, u32(1), 온상자("url ", 0, 1)));
    let 견본;
    if (영상) {
      const colr = 상자("colr", 글("nclx"), u16(1), u16(1), u16(1), [0]);          // bt709 · 제한 범위
      견본 = 상자("avc1", [0, 0, 0, 0, 0, 0], u16(1), u16(0), u16(0), u32(0), u32(0), u32(0), u16(t.폭), u16(t.높이),
        u32(0x00480000), u32(0x00480000), u32(0), u16(1), new Uint8Array(32), u16(0x0018), u16(0xffff),
        상자("avcC", t.설명), colr);
    } else {
      const asc = Array.from(t.설명);
      const dcd = 서술(0x04, [0x40, 0x15, 0, 0, 0, ...u32(t.비트), ...u32(t.비트), ...서술(0x05, asc)]);
      const esd = 서술(0x03, [...u16(2), 0, ...dcd, ...서술(0x06, [0x02])]);
      견본 = 상자("mp4a", [0, 0, 0, 0, 0, 0], u16(1), u32(0), u32(0), u16(t.채널), u16(16), u16(0), u16(0), u32(t.표본율 << 16),
        온상자("esds", 0, 0, esd));
    }
    const stsd = 온상자("stsd", 0, 0, u32(1), 견본);
    // stts — 같은 간격끼리 묶기
    const stts = [];
    for (const s of t.표본) { const 끝 = stts[stts.length - 1]; if (끝 && 끝[1] === s.간격) 끝[0]++; else stts.push([1, s.간격]); }
    const 상자들 = [stsd, 온상자("stts", 0, 0, u32(stts.length), ...stts.map(([c, d]) => [...u32(c), ...u32(d)]))];
    if (영상 && t.표본.some((s) => s.보임차 !== 0)) {
      상자들.push(온상자("ctts", 1, 0, u32(n), ...t.표본.map((s) => [...u32(1), ...u32(s.보임차 >>> 0)])));
    }
    if (영상) { const 키 = []; t.표본.forEach((s, i) => { if (s.키) 키.push(i + 1); }); 상자들.push(온상자("stss", 0, 0, u32(키.length), ...키.map(u32))); }
    상자들.push(온상자("stsc", 0, 0, u32(1), u32(1), u32(1), u32(1)));
    상자들.push(온상자("stsz", 0, 0, u32(0), u32(n), ...t.표본.map((s) => u32(s.data.length))));
    상자들.push(온상자("stco", 0, 0, u32(n), ...t.표본.map((s) => u32(s.자리))));
    return 상자("trak", tkhd, 상자("mdia", mdhd, hdlr, 상자("minf", 미디어머리, dinf, 상자("stbl", ...상자들))));
  }

  /* 영상 = {폭, 높이, 설명(avcC), 시간단위, 표본:[{data, pts, dts, 키}]} · 소리 = {설명(ASC), 표본율, 채널, 비트, 표본:[{data}]} */
  function 묶기(영상, 소리) {
    const 트랙들 = [];
    const v = { 종류: "영상", 폭: 영상.폭, 높이: 영상.높이, 설명: 영상.설명, 시간단위: 영상.시간단위, 표본: [] };
    const 간격 = 영상.간격;
    영상.표본.forEach((s, i) => v.표본.push({ data: s.data, 간격, 보임차: Math.round(s.pts - i * 간격), 키: s.키 }));
    v.총길이 = v.표본.length * 간격;
    트랙들.push(v);
    if (소리 && 소리.표본.length) {
      const a = { 종류: "소리", 설명: 소리.설명, 시간단위: 소리.표본율, 표본율: 소리.표본율, 채널: 소리.채널, 비트: 소리.비트, 표본: [] };
      소리.표본.forEach((s) => a.표본.push({ data: s.data, 간격: 1024 }));
      a.총길이 = a.표본.length * 1024;
      트랙들.push(a);
    }
    const 길이ms = Math.round(1000 * v.총길이 / v.시간단위);
    const ftyp = 상자("ftyp", 글("isom"), u32(0x200), 글("isom"), 글("iso2"), 글("avc1"), 글("mp41"));
    const 만들moov = () => 상자("moov", 온상자("mvhd", 0, 0, u32(0), u32(0), u32(1000), u32(길이ms), u32(0x00010000), u16(0x0100), u16(0), u32(0), u32(0),
      행렬, new Uint8Array(24), u32(트랙들.length + 1)), ...트랙들.map((t, i) => 트랙(t, i + 1, 길이ms)));
    트랙들.forEach((t) => t.표본.forEach((s) => (s.자리 = 0)));
    const moov길이 = 만들moov().length;                         // 자리 값만 바뀌고 길이는 같다
    let 자리 = ftyp.length + moov길이 + 8;
    let mdat길이 = 0;
    for (const t of 트랙들) for (const s of t.표본) { s.자리 = 자리; 자리 += s.data.length; mdat길이 += s.data.length; }
    const moov = 만들moov();
    const 머리 = new Uint8Array([...u32(mdat길이 + 8), ...글("mdat")]);
    const 조각들 = [ftyp, moov, 머리];
    for (const t of 트랙들) for (const s of t.표본) 조각들.push(s.data);
    return new Blob(조각들, { type: "video/mp4" });
  }
  전역.HW묶기 = { 묶기 };
})(self);
