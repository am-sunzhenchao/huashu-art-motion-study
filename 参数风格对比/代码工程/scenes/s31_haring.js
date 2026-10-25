// 「大模型参数」× 凯斯·哈林（s31_haring）——地铁墙涂鸦，参数=发光的粉笔能量团群，一切按 128 BPM 跟拍。
// 拍一 0–3s：三颗主参数（红/蓝/粉，各挂 0.73 / -1.2 / 2.4 数字小牌）特写缓推，光芒 8fps 换闪，白色小点呼吸。
// 拍二 3–7s：能量团按拍点从中心增殖成黑线巨网，三个跳舞剪影（无脸程式，4 姿势 8fps 硬切）围网弹跳；
//   右侧黑底粉笔计数牌真实序列滚动 1.5B→175B→540B→1T+，墙色随档加深、底部黑带升高、墙上杂涂鸦逐档显现，1T+ 处一次快推重音。
// 拍三 7–10s：增殖停住；蓝书（数据）/黄齿轮（方法）/红电池（算力）按 BPM 依次弹起归位成排并挂标签牌，
//   网内能量团轮流点亮、连线叠白描「变亮变精」，全场相位收敛成同拍弹跳收稳。
// 硬红线：全片无五官、无机器人、不给物加脸；做旧（刷痕/剥落斑/杂涂鸦）只上背景墙。
// 确定性：所有随机用 U.rng 种子；8fps 硬切（姿势/光芒/电量明灭）是哈林程式的有意步进，属风格。
SCENES['s31_haring'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2, { clamp, lerp, ss, ease } = U, P = PAINT;
  const C = { yel: '#ffd51c', ink: '#111111', red: '#e8262b', blue: '#1f62d6', pink: '#ff6fb0', white: '#ffffff' };
  const BEAT = 128 / 60;                                   // 每秒拍数
  const bounce = (t, ph = 0) => Math.pow(Math.abs(Math.sin((t * BEAT + ph) * Math.PI)), 0.6);   // 0..1，拍点在 0
  const LW = 13;
  const ink = (c, p, fill, lw = LW) => { c.lineJoin = 'round'; c.lineCap = 'round'; if (fill) { c.fillStyle = fill; c.fill(p); } c.strokeStyle = C.ink; c.lineWidth = lw; c.stroke(p); };

  // 放射动作线：围绕 (cx,cy) 的 n 根短线，8fps 换角度（原版程式）
  function action(c, cx, cy, rx, ry, n, t, seed, len = 34, lw = 9) {
    const st = Math.floor(t * 8), r = U.rng(seed * 97 + st * 13); c.save(); c.strokeStyle = C.ink; c.lineWidth = lw; c.lineCap = 'round';
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU + r() * 0.5; const x0 = cx + Math.cos(a) * rx, y0 = cy + Math.sin(a) * ry, L = len * (0.7 + r() * 0.6);
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + Math.cos(a) * L, y0 + Math.sin(a) * L); c.stroke(); }
    c.restore();
  }

  // 跳舞剪影：4 个姿势（局部坐标，原点=脚底中心），8fps 硬切不插值——哈林的跳法；无脸剪影，圆头不画五官
  const POSES = [
    { head: [0, -210], neck: [0, -168], hip: [0, -86], hl: [-74, -150], hr: [70, -250], kl: [-30, -42], kr: [34, -42], fl: [-46, 0], fr: [44, 0] },
    { head: [10, -200], neck: [6, -160], hip: [0, -84], hl: [-90, -220], hr: [86, -200], kl: [-40, -50], kr: [58, -64], fl: [-36, 0], fr: [96, -40] },
    { head: [-12, -206], neck: [-6, -166], hip: [0, -86], hl: [-70, -250], hr: [80, -150], kl: [-50, -60], kr: [26, -40], fl: [-100, -36], fr: [40, 0] },
    { head: [0, -224], neck: [0, -182], hip: [0, -100], hl: [-84, -256], hr: [84, -256], kl: [-40, -54], kr: [40, -54], fl: [-60, -14], fr: [60, -14] },
  ];
  function dancer(c, x, y, s, col, t, ph, flip = 1) {
    const k = Math.floor(t * 8 + ph) % 4, p = POSES[(k + 4) % 4], T = q => [x + q[0] * s * flip, y + q[1] * s];
    const parts = [RIG.limb(T(p.neck), T(p.hip), 64 * s, 54 * s), RIG.limb(T(p.neck), T(p.hl), 34 * s, 30 * s), RIG.limb(T(p.neck), T(p.hr), 34 * s, 30 * s),
      RIG.limb(T(p.hip), T(p.kl), 36 * s, 32 * s), RIG.limb(T(p.kl), T(p.fl), 32 * s, 30 * s), RIG.limb(T(p.hip), T(p.kr), 36 * s, 32 * s), RIG.limb(T(p.kr), T(p.fr), 32 * s, 30 * s)];
    const hd = new Path2D(); const hc = T(p.head); hd.arc(hc[0], hc[1], 38 * s, 0, TAU); parts.push(hd);
    c.save(); c.lineJoin = 'round'; c.strokeStyle = C.ink; c.lineWidth = LW * 2 * Math.max(0.7, s); parts.forEach(q => c.stroke(q)); c.fillStyle = col; parts.forEach(q => c.fill(q)); c.restore();
    c.save(); c.strokeStyle = C.ink; c.lineWidth = 8 * s; c.lineCap = 'round';
    [p.hl, p.hr].forEach((h, i) => { const q = T(h); c.beginPath(); c.arc(q[0], q[1], 40 * s, (i ? -0.6 : 2.4), (i ? 0.4 : 3.4)); c.stroke(); });
    c.restore();
  }

  // ---------- 参数点网（模块加载时用种子一次性生成，静态数据） ----------
  const NET = (() => {
    const r = U.rng(20261024), pts = [], COLS = [C.red, C.blue, C.pink, C.white];
    // 拍一就在场的主参数（内圈核心，birth=-1 常驻）与白色小点
    pts.push({ x: 700, y: 430, r: 92, col: C.red, num: '0.73', birth: -1 });
    pts.push({ x: 1010, y: 590, r: 78, col: C.blue, num: '-1.2', birth: -1 });
    pts.push({ x: 800, y: 720, r: 66, col: C.pink, num: '2.4', birth: -1 });
    for (let i = 0; i < 9; i++) { const a = r() * TAU, d = 100 + r() * 170; pts.push({ x: 870 + Math.cos(a) * d, y: 570 + Math.sin(a) * d * 0.78, r: 12 + r() * 14, col: C.white, birth: -1 }); }
    // 外圈 5 环，按到网心距离排序出生（3–6.4s 从中心向外蔓延）
    const rings = [[300, 9], [460, 12], [620, 15], [790, 14], [950, 10]];
    const outer = [];
    rings.forEach(([rad, n]) => { for (let i = 0; i < n; i++) { const a = (i / n) * TAU + r() * 0.55, d = rad * (0.88 + r() * 0.24);
      const x = 960 + Math.cos(a) * d, y = 520 + Math.sin(a) * d * 0.72; if (y < 70 || y > 900) continue;
      outer.push({ x, y, r: 16 + r() * 22, col: COLS[(outer.length + i) % 4], birth: 0 }); } });
    outer.forEach(p => { p.d = Math.hypot(p.x - 960, p.y - 520); });   // 到网心距离，出生序按它排
    outer.sort((a, b) => a.d - b.d);
    outer.forEach((p, i) => { p.birth = 3.0 + 3.4 * (i / outer.length); });
    const all = pts.concat(outer);
    // 边：每点连向「更早出生」的最近 1–2 个点 → 网从中心蔓延的形
    const edges = [];
    for (let i = 1; i < all.length; i++) { const p = all[i], cand = [];
      for (let j = 0; j < i; j++) { const q = all[j]; const dd = Math.hypot(p.x - q.x, p.y - q.y); if (dd < 500) cand.push([dd, j]); }
      cand.sort((a, b) => a[0] - b[0]);
      const deg = i < 12 ? 2 : (i % 3 === 0 ? 2 : 1);
      for (let k = 0; k < Math.min(deg, cand.length); k++) edges.push([cand[k][1], i]);
    }
    return { pts: all, edges };
  })();

  // ---------- 墙上杂涂鸦（别人的粉笔痕迹，密度升级时逐档显现；前 8 条常驻） ----------
  const STG = [3.6, 4.5, 5.4, 6.3];                          // 计数达档时刻：1.5B / 175B / 540B / 1T+
  const stageSum = lt => ss(STG[0], STG[0] + 0.35, lt) + ss(STG[1], STG[1] + 0.35, lt) + ss(STG[2], STG[2] + 0.35, lt) + ss(STG[3], STG[3] + 0.35, lt);
  const GRAF = (() => {
    const r = U.rng(777), out = [];
    for (let i = 0; i < 30; i++) {
      let x = 80 + r() * 1760, y = 130 + r() * 700;
      if (x > 1180 && x < 1900 && y > 170 && y < 500) x = 80 + r() * 1000;    // 避开计数牌区
      out.push({ x: x | 0, y: y | 0, k: (r() * 4) | 0, s: 12 + r() * 22, stg: i < 8 ? 0 : 1 + Math.floor((i - 8) / 6) });
    }
    return out;
  })();
  const YEL = [[255, 213, 28], [243, 187, 14], [231, 169, 4], [219, 152, 0], [205, 140, 0]];   // 墙色 5 档，随计数档加深
  function wallRGB(lt) { const s = Math.min(4, stageSum(lt)), k = Math.min(3, Math.floor(s)), f = s - k, A = YEL[k], B = YEL[k + 1];
    return [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, A[2] + (B[2] - A[2]) * f]; }

  // ---------- 相机：近景特写 → 缓拉看全墙 → 1T+ 单次快推重音（单向，推到网心停住） → 停 ----------
  // 移动都放缓：画面是黑线世界，相机平移会把所有黑边一起拖着走（帧差大头）。拍三停机，动感交给物。
  function cam(lt) {
    if (lt < 3) { const p = ss(0, 3, lt); return { z: lerp(1.04, 1.15, p), cx: lerp(880, 830, p), cy: lerp(570, 575, p) }; }
    if (lt < 6.3) { const p = ss(3, 6.3, lt); return { z: lerp(1.15, 0.92, p), cx: lerp(830, 960, p), cy: lerp(575, 500, p) }; }
    if (lt < 6.65) { const p = ss(6.3, 6.62, lt); return { z: lerp(0.92, 1.0, p), cx: 960, cy: lerp(500, 530, p) }; }   // 1T+ 揭示：一次快推重音
    return { z: 1.0, cx: 960, cy: 530 };                       // 拍三：停，三物归位＋网收稳
  }

  // ---------- 计数：真实序列（对数段间连续插值），3.2 起滚，1T+ 定格 ----------
  function countVal(lt) {
    const K = [[3.2, 3.6, 0, 1.5], [3.6, 4.5, 1.5, 175], [4.5, 5.4, 175, 540], [5.4, 6.3, 540, 1000]];
    for (let q = 0; q < K.length; q++) { const [a, b, v0, v1] = K[q]; if (lt >= a && lt < b) return v0 + (v1 - v0) * ease.inOut((lt - a) / (b - a)); }
    return lt >= 6.3 ? 1000 : 0;
  }

  // ---------- 主参数的数字小牌（白底黑框挂墙，Kalam 数字；边线 8fps 微闪） ----------
  function label(c, x, y, txt, t, ph) {
    c.save(); c.translate(x, y);
    c.font = '54px "Kalam-700"'; const w = Math.max(120, c.measureText(txt).width + 44), h = 84;
    const p = new Path2D(); p.rect(-w / 2, -h, w, h);
    ink(c, p, C.white, 8);
    c.fillStyle = C.ink; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(txt, 0, -h / 2 + 3);
    const fl = Math.floor(t * 8 + ph) % 2;                    // 牌底两根小粉笔道，随 8fps 轻闪
    c.strokeStyle = C.ink; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-w / 2 + 14 + fl * 5, h - 18); c.lineTo(-w / 2 + 54 + fl * 5, h - 18); c.stroke();
    c.restore();
  }

  // ---------- 参数之网 ----------
  function net(c, lt, t) {
    const conv = 1 - ss(9.2, 9.8, lt);                        // 收稳：全场相位收敛到同拍
    const gild = ss(7, 8.6, lt);                              // 拍三：连线叠白描「变精」
    const st = [];
    for (let i = 0; i < NET.pts.length; i++) {
      const p = NET.pts[i];
      const born = p.birth < 0 ? 1 : ss(p.birth, p.birth + 0.32, lt);
      if (born <= 0) { st.push(null); continue; }
      const pop = p.birth < 0 ? 1 : ease.outBack(clamp(born, 0, 1));
      const bb = p.r > 40 ? bounce(t, (i * 0.31) * conv) : 0;  // 只有主参数跟拍颠，网上的小点安静（帧差预算集中给母题）
      const hi = lt >= 7 ? 1 + 0.18 * Math.max(0, Math.sin(lt * 2.6 - i * 0.83)) : 1;   // 拍三：轮流点亮
      st.push({ x: p.x, y: p.y - bb * 5, R: p.r * pop * (0.94 + 0.06 * bb) * hi, p, born });
    }
    // 连线（黑粗线，出生后渐显；拍三叠白描）
    c.save(); c.lineCap = 'round';
    for (let e = 0; e < NET.edges.length; e++) {
      const i = NET.edges[e][0], j = NET.edges[e][1], A = st[i], B = st[j];
      if (!A || !B) continue;
      const eb = Math.max(NET.pts[i].birth, NET.pts[j].birth);
      const ea = Math.min(A.born, B.born, eb < 0 ? 1 : ss(eb + 0.1, eb + 0.16, lt));   // 粉笔一笔画上去：出现即实线
      if (ea <= 0) continue;
      c.globalAlpha = Math.min(1, ea);
      c.strokeStyle = C.ink; c.lineWidth = 13;
      c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.stroke();
      if (gild > 0) { c.strokeStyle = C.white; c.lineWidth = 5; c.globalAlpha = gild * 0.9; c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.stroke(); }
    }
    c.globalAlpha = 1; c.restore();
    // 能量团（平涂圆 + 粗黑描 + 光芒 8fps 换闪；小点光芒少而短、按奇偶错开半步，压住持续运动面积）
    for (let i = 0; i < st.length; i++) {
      const s = st[i]; if (!s) continue; const p = s.p;
      const big = !!p.num, off = (i % 2) * 0.0625;             // 半步错相：每步只有一半点换光芒
      if (s.R > 8) action(c, s.x, s.y, s.R + 24 + (lt >= 7 ? 9 : 0), s.R + 18, big ? 6 : (p.r > 30 ? 3 : 2), t + off, ((p.x * 7 + p.y) | 0) + (i % 2) * 53, big ? 30 : 20, big ? 9 : 6);
      const path = new Path2D(); path.arc(s.x, s.y, s.R, 0, TAU);
      ink(c, path, p.col, p.r > 50 ? LW : Math.max(7, LW * 0.6));
    }
    // 三颗主参数的数字小牌
    const tag = [[164, -66], [176, -66], [-156, 58]];
    for (let i = 0; i < 3; i++) { const p = NET.pts[i]; label(c, p.x + tag[i][0], p.y + tag[i][1], p.num, t, (i * 0.31) * conv); }
  }

  // ---------- 计数牌（黑底白粉笔字，沿墙跳档滚动） ----------
  function counter(c, lt, t) {
    if (lt < 3.2) return;
    const inn = ease.outBack(clamp((lt - 3.2) / 0.35, 0, 1));
    c.save(); c.translate(1330, 330 + (1 - inn) * 300); c.scale(inn, inn);
    const p = new Path2D(); p.rect(-250, -100, 500, 200);
    c.fillStyle = C.ink; c.fill(p);
    c.strokeStyle = C.white; c.lineWidth = 9; c.stroke(p);
    c.fillStyle = C.white; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.font = '46px "LXGWWenKai-500"'; c.fillText('参数量', 0, -52);
    const v = countVal(lt);
    const txt = v >= 999.5 ? '1T+' : (v < 10 ? v.toFixed(1) : String(Math.round(v))) + 'B';
    c.font = '118px "Kalam-700"'; c.fillText(txt, 0, 68);
    const fl = Math.floor(t * 8) % 2;
    c.strokeStyle = C.white; c.lineWidth = 6; c.lineCap = 'round';
    [[-150 - fl * 16, 84], [40 + fl * 14, 84]].forEach(q => { c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[0] + 86, q[1]); c.stroke(); });
    c.restore();
  }

  // ---------- 拍三：三件涂鸦物（书=数据·蓝 / 齿轮=方法·黄 / 电池=算力·红） ----------
  function popOf(lt, b) { return ease.outBack(clamp((lt - b) / 0.5, 0, 1)); }
  function books(c, x, y) {                                    // 原点=摞底中心
    const B = [[-95, 0, 190, 48], [-78, -48, 158, 44], [-58, -92, 122, 42]];
    B.forEach(q => { const p = new Path2D(); p.rect(x + q[0], y + q[1] - q[3], q[2], q[3]); ink(c, p, C.blue, 10); });
    c.save(); c.strokeStyle = C.white; c.lineWidth = 6; c.lineCap = 'round';
    B.forEach(q => { c.beginPath(); c.moveTo(x + q[0] + 14, y + q[1] - q[3] + 14); c.lineTo(x + q[0] + q[2] - 14, y + q[1] - q[3] + 14); c.stroke(); });
    c.restore();
  }
  function gear(c, x, y, lt) {                                 // 以中心
    const rot = lt * 0.8, p = new Path2D(), n = 12;
    for (let i = 0; i < n * 2; i++) { const a = rot + (i / (n * 2)) * TAU, rr = i % 2 ? 96 : 118;
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; i ? p.lineTo(px, py) : p.moveTo(px, py); }
    p.closePath(); ink(c, p, C.yel, 11);
    const hub = new Path2D(); hub.arc(x, y, 24, 0, TAU); ink(c, hub, C.ink, 8);
    c.save(); c.strokeStyle = C.ink; c.lineWidth = 10; c.lineCap = 'round';
    for (let i = 0; i < 4; i++) { const a = rot * 1.2 + i * Math.PI / 2;
      c.beginPath(); c.moveTo(x + Math.cos(a) * 32, y + Math.sin(a) * 32); c.lineTo(x + Math.cos(a) * 72, y + Math.sin(a) * 72); c.stroke(); }
    c.restore();
  }
  function battery(c, x, y, t) {                               // 原点=底中心；电量格 8fps 明灭
    const cap = new Path2D(); cap.rect(x - 26, y - 216, 52, 26); ink(c, cap, C.ink, 8);
    const body = new Path2D(); body.rect(x - 62, y - 192, 124, 192); ink(c, body, C.red, 10);
    const lit = 2 + (Math.floor(t * 8) % 3);
    for (let i = 0; i < 4; i++) { const g = new Path2D(); g.rect(x - 44, y - 172 + i * 42, 88, 28); ink(c, g, i >= 4 - lit ? C.white : null, 7); }
  }
  function tagCard(c, x, y, txt, pop) {
    c.save(); c.translate(x, y); c.scale(pop, pop);
    const p = new Path2D(); p.rect(-84, -46, 168, 92);
    ink(c, p, C.white, 9);
    c.fillStyle = C.ink; c.font = '50px "LXGWWenKai-500"'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(txt, 0, 2);
    c.restore();
  }
  function trio(c, lt, t) {
    const conv = 1 - ss(9.2, 9.8, lt);
    const B = [7.15, 7.55, 7.95], G = [[620, 812], [960, 800], [1300, 812]], TG = [7.75, 8.15, 8.55];
    const TAGY = [596, 586, 508], TXT = ['数据', '方法', '算力'];
    for (let k = 0; k < 3; k++) {
      const pop = popOf(lt, B[k]);
      if (pop <= 0) continue;
      const [x, gy] = G[k], ph = [0.2, 0.55, 0.85][k] * conv;
      const y = gy + (1 - Math.min(1, pop)) * 300 - (pop >= 1 ? bounce(t, ph) * 8 : 0);
      c.save(); c.translate(x, y); c.scale(0.7 + 0.3 * Math.min(1, pop), 0.7 + 0.3 * Math.min(1, pop));
      if (k === 0) books(c, 0, 0); else if (k === 1) gear(c, 0, -110, lt); else battery(c, 0, 0, t);
      c.restore();
      if (pop >= 1) {                                          // 归位后：标签牌弹入 + 地上跳起横线
        tagCard(c, x, TAGY[k], TXT[k], ease.outBack(clamp((lt - TG[k]) / 0.3, 0, 1)));
        c.save(); c.strokeStyle = C.ink; c.lineWidth = 9; c.lineCap = 'round';
        const L = 30 + 30 * (1 - bounce(t, ph));
        c.beginPath(); c.moveTo(x - 150, gy + 26); c.lineTo(x - 150 + L, gy + 26); c.moveTo(x + 150 - L, gy + 26); c.lineTo(x + 150, gy + 26); c.stroke();
        c.restore();
      }
    }
  }

  // ---------- 屏上字（UI 层，不随镜头；每拍粉笔擦入/擦出，黑字白钩边） ----------
  const BEAT_TXT = [[0.05, 2.95, '参数', 178], [3.05, 6.95, '疯狂卷参数', 152], [7.05, 10.2, '参数之外', 158]];
  function screenText(c, lt, t) {
    for (let q = 0; q < BEAT_TXT.length; q++) {
      const [t0, t1, txt, size] = BEAT_TXT[q];
      const pIn = clamp((lt - t0) / 0.3, 0, 1), pOut = 1 - clamp((lt - (t1 - 0.2)) / 0.2, 0, 1);
      if (pIn <= 0 || pOut <= 0) continue;
      const wipe = Math.min(pIn, pOut), x = 150, y = 250;
      c.save();
      c.font = size + 'px "LXGWWenKai-500"'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      const w = c.measureText(txt).width;
      c.beginPath(); c.rect(x - 24, y - size, (w + 48) * ease.out(wipe), size + 66); c.clip();
      c.lineJoin = 'round'; c.lineWidth = 16; c.strokeStyle = C.white; c.strokeText(txt, x, y);
      c.fillStyle = C.ink; c.fillText(txt, x, y);
      c.restore();
      if (wipe >= 1) {                                         // 字下粉笔粗横线，随 8fps 轻微变长（哈林「跳起」横线）
        const fl = Math.floor(t * 8) % 2;
        c.save(); c.strokeStyle = C.ink; c.lineWidth = 12; c.lineCap = 'round';
        c.beginPath(); c.moveTo(x - 8, y + 36); c.lineTo(x - 8 + w * (0.88 + fl * 0.12), y + 36); c.stroke(); c.restore();
      }
    }
  }

  return {
    init() {
      U.assertGlyphs('170px "LXGWWenKai-500"', '参数疯狂卷之外数据方法算力量', 's31_haring 屏上字/标签');
      U.assertGlyphs('120px "Kalam-700"', '0123456789.-BT+', 's31_haring 数字');
    },
    draw(c, lt, t) {
      const { z, cx, cy } = cam(lt), stage = stageSum(lt);
      // ---- 世界层（随相机推拉） ----
      c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-cx, -cy);
      // 1 地铁黄墙（随密度档加深）
      const wc = wallRGB(lt);
      c.fillStyle = 'rgb(' + (wc[0] | 0) + ',' + (wc[1] | 0) + ',' + (wc[2] | 0) + ')';
      c.fillRect(-300, -300, W + 600, H + 600);
      // 2 做旧：刷痕＋剥落斑（cached，只上背景墙）
      c.drawImage(P.cached('h31_grunge', W, H, g => {
        const r = U.rng(31337);
        g.strokeStyle = 'rgba(255,255,255,0.10)'; g.lineCap = 'round'; g.lineWidth = 60 + r() * 50;
        for (let i = 0; i < 7; i++) { const y = 60 + r() * 920, x0 = r() * 700, x1 = x0 + 500 + r() * 900;
          g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo((x0 + x1) / 2, y + (r() - .5) * 130, x1, y + (r() - .5) * 60); g.stroke(); }
        g.fillStyle = 'rgba(96, 62, 0, 0.05)';
        for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(r() * W, r() * H, 90 + r() * 160, 50 + r() * 90, r() * 3, 0, TAU); g.fill(); }
      }), 0, 0);
      // 3 墙上杂涂鸦（别人的粉笔痕迹，随档显现——背景密度升级）
      c.save(); c.lineCap = 'round'; c.strokeStyle = C.ink; c.lineWidth = 10;
      for (let i = 0; i < GRAF.length; i++) { const g = GRAF[i];
        const a = g.stg === 0 ? 1 : ss(STG[g.stg - 1], STG[g.stg - 1] + 0.35, lt);
        if (a <= 0) continue;
        c.globalAlpha = 0.85 * a; c.beginPath();
        if (g.k === 0) { c.moveTo(g.x - g.s, g.y); c.lineTo(g.x + g.s, g.y); c.moveTo(g.x, g.y - g.s); c.lineTo(g.x, g.y + g.s); }
        else if (g.k === 1) c.arc(g.x, g.y, g.s * 0.7, 0, TAU);
        else if (g.k === 2) { for (let q = 0; q <= 6; q++) { const xx = g.x - g.s + q * g.s / 3, yy = g.y + Math.sin(q * 2.2 + g.x * 0.03) * g.s * 0.4; q ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } }
        else c.rect(g.x - g.s * 0.6, g.y - g.s * 0.6, g.s * 1.2, g.s * 1.2);
        c.stroke();
      }
      c.globalAlpha = 1; c.restore();
      // 4 底部隧道黑带（14px 地平线的加宽版，随档升高）
      const hB = 26 + 34 * stage;
      c.fillStyle = C.ink; c.fillRect(-300, H - hB, W + 600, hB + 300);
      const fl = Math.floor(t * 8) % 2;
      c.save(); c.strokeStyle = C.white; c.lineWidth = 8; c.lineCap = 'round';
      [[340, 0], [960, 22], [1540, 11]].forEach((q, i) => { const L = 54 + fl * 16 + i * 6;
        c.beginPath(); c.moveTo(q[0] - L / 2, H - hB / 2 - 4); c.lineTo(q[0] + L / 2, H - hB / 2 - 4); c.stroke(); });
      c.restore();
      // 5 参数之网
      net(c, lt, t);
      // 6 计数牌
      counter(c, lt, t);
      // 7 跳舞剪影（拍二起，无脸程式 8fps 硬切；相位错开，拍三收敛）
      if (lt >= 2.95) {
        const conv = 1 - ss(9.2, 9.8, lt), dp = ease.outBack(clamp((lt - 2.95) / 0.35, 0, 1));
        c.save(); c.translate(300, 930); c.scale(dp, dp); dancer(c, 0, 0, 0.8, C.red, t, 2 * conv); c.restore();
        c.save(); c.translate(1660, 920); c.scale(dp, dp); dancer(c, 0, 0, 0.85, C.blue, t, 1 + conv, -1); c.restore();
        c.save(); c.translate(500, 420); c.scale(dp, dp); dancer(c, 0, 0, 0.55, C.pink, t, 3 * conv); c.restore();
      }
      // 8 三件涂鸦物
      trio(c, lt, t);
      c.restore();
      // ---- UI 屏上字 ----
      screenText(c, lt, t);
    },
  };
})();
