// s14_8bit · 1985 8-bit 像素游戏 ×「大模型参数」风格样片（10s 单镜头三拍）。
// 题材构图（不搬速通片的房间）：参数＝芯片上一颗颗 2×2 低分辨率像素点——
//   拍一 0–3s   ×2 整倍变焦特写三颗主参数块（白/金/青，缀 3×5 像素小数字 0.73/-1.2/2.4），
//              硅底芯片面与总线走线：块 15fps 两档换色明灭＋整像素起伏，白火花沿方轨绕行步进，
//              金电平沿总线逐像素穿行，小数字牌黑白反闪；镜头停（近景特写）。
//   拍二 3–7s   ×2→×1 平滑退场拉远成整片芯片俯瞰（金色引脚、四角存储阵列、虚线走线、问号块），
//              参数点自三块向外增殖上千颗、阵列逐格充色、青虚线蔓延，计数 1.5B→175B→540B→1T+
//              得分翻滚（15fps 步进），1T+ 问号块顶金币、芯片描金边（唯一一次重音）；拉远后停。
//   拍三 7–10s  增殖停住、参数群自左向右降暗档；书(数据)/四帧齿轮(方法)/电池(算力)整像素升起归位，
//              三颗主参数变亮变大、携小数字飞落三件图标上方，白火花落进电池逐格充能，
//              HUD 三颗心点亮闪烁；停（缓收全貌）。
// 管线：整幅在 240×135 低分辨率画布逐像素画（1 低像素 = 8 屏幕像素，14 色、1px 黑边精灵）
//      → 最近邻放大（×2 特写；3.0–4.1s 平滑变焦退到 ×1，两端都是整倍）
//      → HUD 全分辨率：中文 WenKai 像素木牌（字随牌整像素滑入滑出）、计数 PressStart2P、心形位图。
// 确定性：随机全 U.hash / U.rng 种子，每帧画面只由 (lt,t) 决定；无角色无脸。
// 15–30fps 整像素步进是本风格程式（分镜已写明）；静态层 P.cached 缓存。
SCENES['s14_8bit'] = (() => {
  const W = 1920, H = 1080, LW = 240, LH = 135, P = PAINT;
  // ---------- 14 色板（全部来自风格卡 14_8bit） ----------
  const C = {
    wall: '#064556', plus: '#0b988a', black: '#000000', white: '#fcfcfc', gray: '#bcbcbc',
    cyan: '#47c4f8', pale: '#aae9fb', blueDk: '#0838a8', gold: '#f1bc08', goldHi: '#f8e858',
    wood: '#a77f06', woodHi: '#eeba18', brick: '#d85214', mortar: '#fbe2a6',
  };
  const px = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };

  // ---------- 三颗主参数块（拍一特写对象；拍三飞落图标上方） ----------
  const SEEDS = [
    { x: 78, y: 38, col: C.white, alt: C.gray, hi: null, dk: C.gray, glow: C.mortar, num: '0.73', tx: 53, ty: 76 },
    { x: 98, y: 50, col: C.gold, alt: C.goldHi, hi: C.goldHi, dk: C.wood, glow: C.goldHi, num: '-1.2', tx: 115, ty: 76 },
    { x: 116, y: 36, col: C.cyan, alt: C.pale, hi: C.pale, dk: C.blueDk, glow: C.pale, num: '2.4', tx: 171, ty: 76 },
  ];
  const FLY0 = [8.20, 8.34, 8.48], FLYD = 0.42;   // 携小数字飞落，15fps 整像素步进

  // ---------- 芯片俯瞰布局（240×135 世界） ----------
  const DIE = { x: 24, y: 8, w: 192, h: 88 };                     // 芯片：x 24–216，y 8–96
  const ARR = [                                                    // 四角存储阵列（10×8 格，2×2 格距 3）
    { x: 30, y: 14 }, { x: 178, y: 14 }, { x: 30, y: 58 }, { x: 178, y: 58 },
  ].map((a, k) => ({ ...a, t0: 3.30 + k * 0.25 }));
  const TR = [                                                     // 总线走线（正交折线）
    [[62, 26], [100, 26], [100, 44]], [[178, 26], [112, 26], [112, 44]],
    [[62, 70], [120, 70]], [[178, 70], [134, 70], [134, 54]],
    [[120, 44], [120, 94]], [[66, 50], [26, 50]], [[134, 58], [218, 58]],
  ];
  const PULSE = [{ tr: 1, off: 0 }, { tr: 2, off: 37 }, { tr: 4, off: 71 }];  // 金电平 30fps 逐像素
  const ORBIT = { x: 72, y: 32, w: 68, h: 44 };                    // 白火花方轨（围三块，整条都在特写窗内）
  const QB = { x: 168, y: 14 };                                    // 问号块（芯片面右上、TR 阵列左侧，避开计数器）
  const ICON = [                                                   // 拍三三件图标（立在地板托上）
    { t0: 7.15, pad: 44 }, { t0: 7.55, pad: 106 }, { t0: 7.95, pad: 164 },
  ];
  const CELLT = [8.45, 8.75, 9.05, 9.35];                          // 电池四格充能

  // ---------- 总线走线逐像素点表（一次生成） ----------
  function tracePts(v) {
    const pts = [];
    for (let i = 0; i < v.length - 1; i++) {
      const [x0, y0] = v[i], [x1, y1] = v[i + 1], n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let s = 0; s < n; s++) pts.push([x0 + Math.round((x1 - x0) * s / n), y0 + Math.round((y1 - y0) * s / n)]);
    }
    pts.push(v[v.length - 1]); return pts;
  }
  const TRPTS = TR.map(tracePts);

  // ---------- 参数像素（2×2 点，种子生成一次；出生＝增殖前沿扫过） ----------
  const rD = U.rng(88031);
  const DOTS = [];
  {
    const inRect = (x, y, rx, ry, rw, rh) => x >= rx - 1 && x <= rx + rw + 1 && y >= ry - 1 && y <= ry + rh + 1;
    let tries = 0;
    while (DOTS.length < 950 && tries < 9000) {
      tries++;
      const x = 26 + Math.floor(rD() * 188), y = 10 + Math.floor(rD() * 84);
      if (ARR.some(a => inRect(x, y, a.x, a.y, 32, 24))) continue;           // 不落进阵列
      if (x > 60 && x < 138 && y > 26 && y < 76 && rD() > 0.42) continue;    // 中心核心区稀一点，三块醒目
      const d = Math.hypot(x - 95, y - 40);
      const ci = rD();
      DOTS.push({
        x, y,
        col: ci < 0.26 ? C.white : ci < 0.5 ? C.gold : ci < 0.72 ? C.cyan : ci < 0.85 ? C.pale : ci < 0.94 ? C.mortar : C.gray,
        dim: ci < 0.26 ? C.gray : ci < 0.5 ? C.wood : ci < 0.85 ? C.blueDk : C.woodHi,
        bt: 3.15 + Math.pow(d / 150, 1.25) * 2.9 + rD() * 0.5,
      });
    }
  }
  const dimT = (x) => 7.1 + (x / 240) * 0.45;                                 // 拍三降暗波（左→右）

  // ---------- 3×5 像素数字 / 问号 ----------
  const F3 = {
    '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'],
    '2': ['111', '001', '111', '100', '111'], '3': ['111', '001', '111', '001', '111'],
    '4': ['101', '101', '111', '001', '001'], '7': ['111', '001', '010', '010', '010'],
    '.': ['000', '000', '000', '000', '010'], '-': ['000', '000', '111', '000', '000'],
    '?': ['111', '001', '011', '000', '010'],
  };

  // ---------- 静态背景（低分辨率，一次缓存） ----------
  function bgPaint(g) {
    px(g, 0, 0, LW, LH, C.wall);
    for (let j = 0; j * 6 < 97; j++) for (let i = -1; i * 6 < LW + 6; i++) {          // 十字点纹墙
      const x = i * 6 + (j % 2 ? 3 : 0) + 1, y = j * 6 + 2;
      px(g, x, y - 1, 1, 3, C.plus); px(g, x - 1, y, 3, 1, C.plus);
    }
    // 芯片：黑边 1px、青面、上沿米色高光、种子点纹抖动
    px(g, DIE.x - 1, DIE.y - 1, DIE.w + 2, DIE.h + 2, C.black);
    px(g, DIE.x, DIE.y, DIE.w, DIE.h, C.plus);
    px(g, DIE.x, DIE.y, DIE.w, 1, C.mortar); px(g, DIE.x, DIE.y, 1, DIE.h, C.mortar);
    for (let y = DIE.y + 2; y < DIE.y + DIE.h - 2; y++) for (let x = DIE.x + 2; x < DIE.x + DIE.w - 2; x++) {
      const h = U.hash(x * 3 + 1, y * 7 + 2);
      if (h < 0.055) px(g, x, y, 1, 1, C.wall); else if (h < 0.066) px(g, x, y, 1, 1, C.mortar);
    }
    for (const a of ARR) {                                                            // 四角阵列：黑框＋细网格
      px(g, a.x - 1, a.y - 1, 34, 26, C.black); px(g, a.x, a.y, 32, 24, C.plus);
      for (let k = 2; k < 30; k += 3) { px(g, a.x + k, a.y, 1, 24, C.wall); }
      for (let k = 2; k < 24; k += 3) { px(g, a.x, a.y + k, 32, 1, C.wall); }
    }
    for (const v of TR) for (let i = 0; i < v.length - 1; i++) {                       // 总线走线
      const [x0, y0] = v[i], [x1, y1] = v[i + 1];
      px(g, Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0) + 1, Math.abs(y1 - y0) + 1, C.blueDk);
    }
    for (let k = 0; k < 10; k++) {                                                    // 金色引脚（左右两排）
      const y = 16 + k * 8;
      px(g, 19, y, 4, 4, C.black); px(g, 20, y, 3, 3, C.gold);
      px(g, 217, y, 4, 4, C.black); px(g, 217, y, 3, 3, C.gold);
    }
    // 下方：桌面木条＋砖块地面（本风格的地面语言）
    px(g, 0, 99, LW, 1, C.black);
    px(g, 0, 100, LW, 1, C.woodHi); px(g, 0, 101, LW, 14, C.wood);
    for (let x = 11; x < LW; x += 24) px(g, x, 101, 1, 14, C.black);
    px(g, 0, 115, LW, LH - 115, C.black);
    for (let r = 0; 116 + r * 7 < LH; r++) { const y = 116 + r * 7;
      for (let x = -16 + (r % 2 ? 8 : 0); x < LW; x += 16) {
        px(g, x, y, 15, 6, C.brick); px(g, x, y, 15, 1, C.mortar); px(g, x, y, 1, 6, C.mortar);
      }
    }
    for (const p of [44, 106, 164]) {                                                 // 三件图标的托座
      px(g, p - 1, 125, 30, 7, C.black); px(g, p, 126, 28, 5, C.mortar);
      px(g, p, 126, 28, 1, C.woodHi);
    }
  }

  // ---------- 像素精灵 ----------
  function blockPx(g, bx, by, s, face, hi, dk, glow) {
    px(g, bx - 1, by - 1, s + 2, s + 2, C.black);
    px(g, bx, by, s, s, face);
    if (hi) { px(g, bx, by, s, 1, hi); px(g, bx, by, 1, s, hi); }
    if (dk) { px(g, bx, by + s - 1, s, 1, dk); px(g, bx + s - 1, by, 1, s, dk); }
    if (glow) px(g, bx + 2, by + 2, s - 4, s - 4, glow);                              // 拍三「变亮」中心块
  }
  function labelPx(g, lx, ly, str, inv) {                                             // 3×5 数字牌，黑白反闪
    const w = str.length * 4 - 1, bw = w + 4, bh = 9;
    px(g, lx - 1, ly - 1, bw + 2, bh + 2, C.black);
    px(g, lx, ly, bw, bh, inv ? C.black : C.mortar);
    const fg = inv ? C.white : C.black;
    let cx = lx + 2;
    for (const ch of str) { const rows = F3[ch];
      for (let r = 0; r < 5; r++) for (let q = 0; q < 3; q++) if (rows[r][q] === '1') px(g, cx + q, ly + 2 + r, 1, 1, fg);
      cx += 4;
    }
  }
  function gearFrame(k) {                                                             // 四帧像素齿轮（一齿砖红＝转动的记号）
    return P.cached('s14w_gear' + k, 24, 24, (g) => {
      const cells = [];
      for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) {
        const dx = x - 11.5, dy = y - 11.5, r = Math.hypot(dx, dy);
        if (r > 12) continue;
        const d2 = ((Math.atan2(dy, dx) * 180 / Math.PI - k * 90) % 360 + 360) % 360;
        const m45 = ((d2 % 45) + 45) % 45, dTooth = Math.min(m45, 45 - m45);
        const mo = (((d2 - 45) % 90) + 90) % 90, dHole = Math.min(mo, 90 - mo);
        if (r <= 3.4) continue;                                                        // 轴孔
        if (Math.abs(r - 6) <= 1.1 && dHole <= 15) continue;                          // 四个辐孔（90° 分布，四帧循环无缝）
        if (r > 8.6 && r <= 11.8 && dTooth <= 12) { cells.push([x, y, Math.round(d2 / 45) % 8 === 0 ? 1 : 0]); continue; }
        if (r <= 8.6) cells.push([x, y, 0]);
      }
      for (const [x, y] of cells) px(g, x, y, 1, 1, C.black);                         // 先整描 1px 黑边
      const set = new Set(cells.map(q => q[1] * 24 + q[0]));
      for (const [x, y, m] of cells) {
        const n4 = (x > 0 && set.has(y * 24 + x - 1)) + (x < 23 && set.has(y * 24 + x + 1)) +
                   (y > 0 && set.has((y - 1) * 24 + x)) + (y < 23 && set.has((y + 1) * 24 + x));
        if (n4 === 4) px(g, x, y, 1, 1, m ? C.brick : C.gold);
      }
    });
  }
  function booksPx(g, rise) {                                                          // 一摞书（数据）
    const rows = [[2, 24, C.gold, 104], [0, 28, C.brick, 109], [3, 22, C.cyan, 114], [1, 26, C.white, 119]];
    for (const [dx, w, col, y0] of rows) {
      const x = 44 + dx, y = y0 + rise;
      if (y > LH) continue;
      px(g, x - 1, y - 1, w + 2, 6, C.black); px(g, x, y, w, 4, col); px(g, x + w - 3, y, 3, 4, C.mortar);
    }
  }
  function batteryPx(g, rise, lt) {                                                    // 电池（算力）：四格充能闪
    const by = 102 + rise;
    if (by < LH + 4) {
      px(g, 171, by - 5, 10, 5, C.black); px(g, 172, by - 4, 8, 3, C.gold);          // 触头
      px(g, 165, by - 1, 22, 24, C.black); px(g, 166, by, 20, 22, C.wall);           // 外壳
    }
    const full = lt >= CELLT[3];
    if (by < LH) {
      if (full && Math.floor(lt * 15) % 2 === 0) px(g, 172, by - 4, 8, 3, C.goldHi); // 满电触头闪
      for (let k = 0; k < 4; k++) {                                                   // 逐格充能：白闪两帧后落青
        if (lt < CELLT[k]) continue;
        const fl = lt - CELLT[k] < 0.09;
        px(g, 168, by + 3 + k * 5, 16, 3, fl ? C.white : C.cyan);
      }
    }
  }

  // ---------- 白火花（沿方轨绕行 → 拍三落进电池触头充能） ----------
  const orbD = (lt) => lt <= 3 ? 60 * lt : 180 + 30 * (lt - 3);                       // 前半 30fps 2px，后半 1px
  function orbitPt(d) {
    const { x, y, w, h } = ORBIT, per = 2 * (w + h), q = ((d % per) + per) % per;
    if (q < w) return [x + Math.round(q), y];
    if (q < w + h) return [x + w, y + Math.round(q - w)];
    if (q < 2 * w + h) return [x + w - Math.round(q - w - h), y + h];
    return [x, y + h - Math.round(q - 2 * w - h)];
  }
  function sparkPos(lt) {
    if (lt < 8.0) return orbitPt(orbD(lt));
    const o = orbitPt(orbD(8.0));                                                     // 8.0–8.3 直线飞向电池触头（15fps 步进）
    const t15 = Math.floor(lt * 15) / 15, q = U.clamp((t15 - 8.0) / 0.3);
    return [Math.round(U.lerp(o[0], 176, q)), Math.round(U.lerp(o[1], 97, q))];
  }

  // ---------- 相机：×2 整倍特写停 → 平滑整倍退场 → ×1 停 ----------
  function camOf(lt) {
    let z = 2, ax = 105, ay = 49;
    if (lt >= 3 && lt < 4.1) {
      const p = U.ease.inOut(U.clamp((lt - 3) / 1.1));
      z = U.lerp(2, 1, p); ax = U.lerp(105, 120, p); ay = U.lerp(49, 67.5, p);
    } else if (lt >= 4.1) { z = 1; ax = 120; ay = 67.5; }
    const sw = LW / z, sh = LH / z;
    return { sx: ax - sw / 2, sy: ay - sh / 2, sw, sh };
  }

  // ---------- 计数（真实序列 1.5B→175B→540B→1T+，15fps 得分翻滚） ----------
  const CK = [[3.30, 0], [3.62, 1.5], [3.98, 1.5], [4.50, 175], [4.86, 175], [5.40, 540], [5.75, 540], [6.30, 1000], [1e9, 1000]];
  function countVal(lt) {
    for (let i = 0; i < CK.length - 1; i++) if (lt >= CK[i][0] && lt <= CK[i + 1][0])
      return U.lerp(CK[i][1], CK[i + 1][1], U.ease.inOut(U.clamp((lt - CK[i][0]) / (CK[i + 1][0] - CK[i][0]))));
    return lt < 3.3 ? 0 : 1000;
  }
  const fmtV = (v) => v >= 999.5 ? '1T+' : v < 9.95 ? v.toFixed(1) + 'B' : Math.round(v) + 'B';

  // ---------- HUD（全分辨率） ----------
  const CAPS = [
    { txt: '参数', size: 132, in0: 0.10, out0: 2.80 },
    { txt: '疯狂卷参数', size: 104, in0: 3.13, out0: 6.80 },
    { txt: '参数之外', size: 116, in0: 7.13, out0: 99 },
  ];
  function capY(cp, t15) {                                                             // 整像素牌滑入滑出（15fps 步进）
    if (t15 < cp.in0 || t15 >= cp.out0 + 0.36) return null;
    if (t15 < cp.in0 + 0.33) return 264 * (1 - (t15 - cp.in0) / 0.33);
    if (t15 < cp.out0) return 0;
    return -264 * ((t15 - cp.out0) / 0.33);
  }
  function plaquePx(c, x, y) {                                                         // 像素木牌
    c.fillStyle = C.black; c.fillRect(x - 4, y - 4, 628, 220);
    c.fillStyle = C.mortar; c.fillRect(x, y, 620, 212);
    c.fillStyle = C.woodHi; c.fillRect(x, y, 620, 6);
    c.fillStyle = C.wood; c.fillRect(x, y + 206, 620, 6);
    for (const [rx, ry] of [[14, 14], [594, 14], [14, 186], [594, 186]]) {
      c.fillStyle = C.wood; c.fillRect(x + rx, y + ry, 12, 12);
      c.fillStyle = C.black; c.fillRect(x + rx + 4, y + ry + 4, 4, 4);
    }
  }
  const HEART = ['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'];
  const HEART_E = ['.ww.ww.', 'w..w..w', 'w.....w', '.w...w.', '..w.w..', '...w...'];
  function heartPx(c, rows, col, x, y) {
    rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') { c.fillStyle = C.black; c.fillRect(x + i * 8 + 8, y + j * 8 + 8, 8, 8); } }));
    rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') { c.fillStyle = col; c.fillRect(x + i * 8, y + j * 8, 8, 8); } }));
  }
  function hud(c, lt) {
    const t15 = Math.floor(lt * 15) / 15;
    for (const cp of CAPS) {                                                           // 屏上字（中文 WenKai，≤8 字；顶部居中像素木牌）
      const yo = capY(cp, t15); if (yo == null) continue;
      plaquePx(c, 650, Math.round(44 + yo));
      c.font = cp.size + 'px "LXGWWenKai-500"'; c.fillStyle = C.wall;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(cp.txt, 960, Math.round(44 + yo) + 112);
    }
    const litAt = [7.5, 7.9, 8.3];                                                      // HUD 三颗心（点亮闪烁）
    for (let k = 0; k < 3; k++) {
      const lit = lt >= litAt[k], blink = lit && lt > 8.8 && ((Math.floor(lt * 30) - k * 17) % 48) < 4;
      heartPx(c, lit ? HEART : HEART_E, blink ? C.white : lit ? C.brick : C.gray, 64 + k * 72, 292);
    }
    if (t15 >= 3.25 && t15 < 7.35) {                                                   // 得分计数器（PressStart2P）
      let sx = 0;
      if (t15 < 3.50) sx = 160 * (1 - (t15 - 3.25) / 0.25);
      else if (t15 >= 7.10) sx = 160 * ((t15 - 7.10) / 0.25);
      const x = 1856 + Math.round(sx);
      const pop = (t15 >= 6.30 && t15 < 6.43) ? 1.07 : 1;
      c.save(); c.translate(1712, 102); c.scale(pop, pop); c.translate(-1712, -102);
      c.textAlign = 'right'; c.textBaseline = 'alphabetic';
      c.font = '24px "PressStart2P-400"';
      c.fillStyle = C.black; c.fillText('PARAMS', x + 6, 64 + 6);
      c.fillStyle = C.gold; c.fillText('PARAMS', x, 64);
      c.font = '52px "PressStart2P-400"';
      const v = fmtV(countVal(t15));
      c.fillStyle = C.black; c.fillText(v, x + 8, 140 + 8);
      c.fillStyle = C.white; c.fillText(v, x, 140);
      c.restore();
    }
  }

  // ---------- 世界层（240×135） ----------
  function world(g, lt) {
    const t15 = Math.floor(lt * 15) / 15, f15 = Math.floor(lt * 15);
    g.drawImage(P.cached('s14w_bg', LW, LH, bgPaint), 0, 0);

    for (let a = 0; a < 4; a++) {                                                      // 阵列逐格充色（栅格序）
      const A = ARR[a], lit = Math.round(U.clamp((lt - A.t0) / 2.0) * 80);
      for (let idx = 0; idx < lit; idx++) {
        const i = idx % 10, j = (idx / 10) | 0, x = A.x + i * 3, y = A.y + j * 3;
        const h = U.hash(i + A.x, j + A.y + a * 31);
        let col = h < 0.3 ? C.gold : h < 0.55 ? C.cyan : h < 0.75 ? C.white : h < 0.9 ? C.mortar : C.pale;
        if (lt > dimT(x)) col = h < 0.3 ? C.wood : h < 0.75 ? C.blueDk : C.woodHi;
        px(g, x, y, 2, 2, col);
      }
    }
    for (const d of DOTS) {                                                            // 参数像素增殖（出生白闪→落色→拍三降暗）
      if (lt < d.bt) continue;
      const flash = lt - d.bt < 0.1;
      let col = flash ? C.white : d.col;
      if (!flash && lt < 7.1 && U.hash(d.x * 7 + d.y, f15) < 0.05) col = C.white;      // 落定后的碎星闪
      if (lt > dimT(d.x)) col = flash ? C.gray : d.dim;
      px(g, d.x, d.y, 2, 2, col);
    }
    const off = Math.floor(Math.min(lt, 7.0) * 15) * 2;                                // 青虚线蔓延（7.0 冻结收稳）
    for (let k = 0; k < TRPTS.length; k++) {
      const rev = U.ss(3.4 + k * 0.18, 4.1 + k * 0.18, lt), n = Math.floor(TRPTS[k].length * rev);
      for (let s = 0; s < n; s++) if ((s + off) % 4 < 2) {
        const [x, y] = TRPTS[k][s];
        px(g, x, y, 1, 1, lt > dimT(x) ? C.blueDk : C.cyan);
      }
    }
    for (const p of PULSE) {                                                           // 金电平沿总线逐像素穿行（30fps）
      const pts = TRPTS[p.tr], pos = (Math.floor(lt * 60) + p.off) % pts.length;
      for (let i = 0; i < 5; i++) { const q = pos - i; if (q < 0 || q >= pts.length) continue;
        px(g, pts[q][0], pts[q][1], 1, 1, i === 0 ? C.goldHi : C.gold); }
    }
    if (lt >= 6.3) {                                                                   // 1T+：芯片描金边（唯一重音）
      const col = lt < 6.9 && f15 % 2 === 0 ? C.mortar : C.gold;
      px(g, 23, 7, 194, 1, col); px(g, 23, 97, 194, 1, col);
      px(g, 23, 7, 1, 91, col); px(g, 216, 7, 1, 91, col);
    }
    const used = lt >= 6.78;                                                           // 问号块（顶完变哑块）
    px(g, QB.x - 1, QB.y - 1, 12, 12, C.black);
    px(g, QB.x, QB.y, 10, 10, used ? C.wood : C.gold);
    if (!used) {
      px(g, QB.x, QB.y, 10, 1, C.goldHi); px(g, QB.x, QB.y, 1, 10, C.goldHi);
      px(g, QB.x, QB.y + 9, 10, 1, C.wood); px(g, QB.x + 9, QB.y, 1, 10, C.wood);
      const rows = F3['?'];
      for (let r = 0; r < 5; r++) for (let q = 0; q < 3; q++) if (rows[r][q] === '1') px(g, QB.x + 4 + q, QB.y + 3 + r, 1, 1, C.black);
    }
    for (const t0 of [6.30, 6.55]) {                                                   // 顶金币：半正弦上抛＋四帧旋转＋顶点星光
      const q = (lt - t0) / 0.5; if (q <= 0 || q >= 1) continue;
      const cy = Math.round(QB.y - 1 - Math.sin(q * Math.PI) * 10);
      const w = [5, 3, 1, 3][f15 % 4], cx = QB.x + 5;
      px(g, cx - ((w + 2) >> 1), cy - 3, w + 2, 7, C.black);
      px(g, cx - (w >> 1), cy - 2, w, 5, C.gold); px(g, cx - (w >> 1), cy - 2, 1, 5, C.goldHi);
      if (q > 0.42 && q < 0.62) for (const [sx, sy] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) px(g, cx + sx, cy + sy, 1, 1, C.white);
    }
    for (let k = 0; k < 3; k++) {                                                      // 三件图标整像素升起归位
      const rise = Math.round(38 * (1 - U.ease.out(U.clamp((t15 - ICON[k].t0) / 0.85))));
      if (k === 0) booksPx(g, rise);
      else if (k === 1) { if (rise < 38) g.drawImage(gearFrame(lt < 8 ? 0 : Math.floor((lt - 8) * 3.75) % 4), 0, 0, 24, 24, 108, 101 + rise, 24, 24); }
      else batteryPx(g, rise, lt);
    }
    for (let k = 0; k < 3; k++) {                                                      // 三颗主参数：明灭起伏 → 变亮变大飞落
      const s = SEEDS[k], fly = U.clamp((t15 - FLY0[k]) / FLYD);
      if (fly <= 0) {
        const on = (f15 + k) % 2 === 0, bob = ((f15 + k * 3) % 4) < 2 ? 0 : -1;
        blockPx(g, s.x, s.y + bob, 7, on ? s.col : s.alt, s.hi, s.dk, null);
        labelPx(g, s.x - 3, s.y + bob + 9, s.num, (Math.floor(lt * 30 / 16) + k * 5) % 2 === 1);
      } else {
        const bx = Math.round(U.lerp(s.x, s.tx, fly)), by = Math.round(U.lerp(s.y, s.ty, fly));
        const size = Math.min(10, 7 + Math.floor(fly * 4)), landed = fly >= 1;
        if (landed && lt < FLY0[k] + FLYD + 0.08) px(g, bx - 2, by - 2, size + 4, size + 4, C.white);
        blockPx(g, bx, by, size, s.col, s.hi, s.dk, landed && (f15 + k) % 2 === 0 ? s.glow : null);
        labelPx(g, bx - 3, by + size + 3, s.num, (Math.floor(lt * 30 / 16) + k * 5) % 2 === 1);
      }
    }
    const sp = sparkPos(lt);                                                           // 白火花（绕轨 → 落电池触头闪）
    if (lt < 8.0) for (let i = 1; i <= 3; i++) { const q = orbitPt(orbD(lt) - i * 4); px(g, q[0], q[1], 1, 1, i === 1 ? C.gray : C.wall); }
    px(g, sp[0] - 1, sp[1] - 1, 2, 2, lt >= 8.3 && f15 % 2 === 0 ? C.goldHi : C.white);
  }

  return {
    init() {
      U.assertGlyphs('132px "LXGWWenKai-500"', '参数疯狂卷之外', 's14_8bit 屏上字');
      U.assertGlyphs('52px "PressStart2P-400"', 'PARAMS0123456789.BT+', 's14_8bit 计数');
    },
    draw(c, lt, t) {
      const WC = P.cached('s14w_frame', LW, LH, () => {});
      const g = WC.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0);
      world(g, lt);
      const cam = camOf(lt);
      c.imageSmoothingEnabled = false;                                                 // 最近邻放大：低像素＝8×8 屏幕块
      c.drawImage(WC, cam.sx, cam.sy, cam.sw, cam.sh, 0, 0, W, H);
      c.imageSmoothingEnabled = true;
      hud(c, lt);
    },
  };
})();
