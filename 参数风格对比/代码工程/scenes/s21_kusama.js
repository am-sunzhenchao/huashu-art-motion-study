// 「大模型参数」× 草间弥生无限波点（s21_kusama）——参数＝波点。纯代码，1920×1080，单段 10 秒。
// 管线：①草间红平涂底（随计数档逐档加深）＋ PAINT.cached 静态远景大波点层（背景深度，不随行波）
//      ②四档六角网格波点（大点层/错位小点层/中点/密点）从网心逐环增殖铺满墙面＝无限网，网眼随计数逐档加密
//      ③地板：透视压扁波点＋深红地板线＋黄南瓜的无限镜屋式上下对称倒影（镜像＋压扁＋低透明度）
//      ④黄南瓜（5 瓣椭圆＋按行排黑波点＋绿柄，底部为轴呼吸；随计数自地面隆起，1T+ 处一次弹跳重音）
//      ⑤计数牌（黄底黑字胶囊＋四角红波点呼吸、逐档弹一下；真实序列 1.5B→175B→540B→1T+）
//      ⑥拍三：波点书（数据）/白波点齿轮（方法）/南瓜灯（算力）升起归位挂标签；全场波点逐颗点出深红芯（变精）、
//        南瓜从内里点亮（变亮），行波相位收敛成全场同拍呼吸（网络收稳）
// 会动的：所有点半径乘同一条「从网心出发的行波」一胀一缩（原版蠕动的点笔法）；南瓜呼吸；齿轮缓转；数字明灭脉动。
// 确定性：随机全 U.rng 种子；cam/wave/计数全是 lt,t 的纯函数，无状态累积。硬红线：无人物无脸、做旧不上身（草间是平涂）。
SCENES['s21_kusama'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, ss, ease, rng } = U, P = PAINT;
  const C = { red: '#d8181e', redDk: '#a80e14', white: '#fbf6ee', yellow: '#f6d02a', black: '#141210', stem: '#2a3a14' };
  const FLOOR = 862;                                    // 地板线（倒影对称轴）
  const O = [920, 524];                                 // 行波原点＝波点网心（全片不动，波形连续无跳）
  const dot = (c, x, y, r, rot, asp, col) => { if (r < 0.6) return; c.fillStyle = col; c.beginPath(); c.ellipse(x, y, r, r * asp, rot || 0, 0, TAU); c.fill(); };
  const hx = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const rgba = (hex, a) => { const n = hx(hex); return 'rgba(' + n[0] + ',' + n[1] + ',' + n[2] + ',' + a.toFixed(3) + ')'; };
  // 行波（原版笔法）：所有点半径乘同一函数一圈圈胀缩；conv→1 时相位收敛成全场同拍呼吸（网络收稳）
  const wave = (x, y, t, conv, amp) => 0.86 + amp * Math.sin(lerp(Math.hypot(x - O[0], y - O[1]) * 0.012, 0.65, conv) - t * 5);
  const bump = (lt, t0, up = 0.12, dn = 0.3) => ss(t0, t0 + up, lt) * (1 - ss(t0 + up, t0 + up + dn, lt));

  // ---------- 静态数据（模块加载时种子一次性生成） ----------
  // 拍一三颗主参数（白/南瓜黄/黑；旁挂数字；core＝拍三点出的芯色）
  const HERO = [
    { x: 665, y: 395, r: 108, col: C.white, core: C.redDk, num: '0.73', nx: 872, ny: 362 },
    { x: 1075, y: 560, r: 86, col: C.yellow, core: C.black, num: '-1.2', nx: 1252, ny: 666 },
    { x: 790, y: 706, r: 95, col: C.black, core: C.white, num: '2.4', nx: 596, ny: 804 },
  ];
  // 拍一环绕的小波点（错相呼吸；避开主参数；之后并入网中常驻）
  const SIDE = (() => {
    const r = rng(21), o = [];
    while (o.length < 11) {
      const a = r() * TAU, d = 170 + r() * 400;
      const x = O[0] + Math.cos(a) * d * 1.35, y = O[1] + Math.sin(a) * d * 0.8, rr = 13 + r() * 15;
      if (HERO.some(h => Math.hypot(x - h.x, y - h.y) < h.r + rr + 26)) continue;
      o.push({ x, y, r: rr, rot: r() * TAU, asp: 0.82 + r() * 0.36 });
    }
    return o;
  })();
  // 无限波点网：四档网格（大点/错位小点/中点/密点），点按到网心距离排序出生（从中心逐环铺开）
  const GRIDS = [[3.0, 118, 27, 11], [3.6, 118, 9.5, 12], [4.5, 74, 15, 13], [5.4, 50, 10.5, 14]].map(([t0, sp, r0, seed], gi) => {
    const r = rng(seed), pts = [];
    for (let y = -80, j = 0; y < FLOOR + 8; y += sp * 0.87, j++)
      for (let x = -80 + (j % 2) * sp / 2; x < W + 80; x += sp)
        pts.push({ x: x + (r() - .5) * sp * 0.34, y: y + (r() - .5) * sp * 0.34, r: r0 * (0.74 + r() * 0.56), rot: r() * TAU, asp: 0.84 + r() * 0.32, d: 0 });
    pts.forEach(p => p.d = Math.hypot(p.x - O[0], p.y - O[1]));
    pts.sort((a, b) => a.d - b.d);
    const win = 0.5 + gi * 0.1;                         // 越密的档铺得越久
    pts.forEach((p, i) => { p.birth = t0 + win * i / pts.length; });
    return pts;
  });
  // 地板波点（原版笔法：越近越大越疏，压成 0.42 透视椭圆）
  const FLOORD = (() => {
    const r = rng(31), o = [];
    for (let row = 0; row < 7; row++) {
      const q = row / 6, y = FLOOR + 18 + Math.pow(q, 1.35) * 186, sp = 54 + q * 66, rr = 7 + q * 15;
      for (let x = -30 + (row % 2) * sp / 2; x < W + 30; x += sp) o.push({ x: x + (r() - .5) * 14, y, r: rr * (0.8 + r() * 0.4), d: 0 });
    }
    o.forEach(p => p.d = Math.hypot(p.x - O[0], p.y - O[1]));
    o.sort((a, b) => a.d - b.d);
    o.forEach((p, i) => { p.birth = 3.0 + 0.5 * i / o.length; });
    return o;
  })();
  // 静态远景大波点层（PAINT.cached，只作背景深度，不随行波呼吸）
  const FAR = P.cached('s21_far', 2400, 1500, g => {
    const r = rng(41); g.fillStyle = C.redDk;
    for (let i = 0; i < 26; i++) { const x = 60 + r() * 2280, y = 60 + r() * 1380, rr = 42 + r() * 34; g.beginPath(); g.ellipse(x, y, rr, rr * (0.8 + r() * 0.3), r() * TAU, 0, TAU); g.fill(); }
  });

  // ---------- 密度升级：计数达档时刻与红底五档 ----------
  const STG = [3.6, 4.5, 5.4, 6.3];                     // 1.5B / 175B / 540B / 1T+
  const stageSum = lt => STG.reduce((s, q) => s + ss(q, q + 0.35, lt), 0);
  const RE = ['#d8181e', '#cc161c', '#c0151a', '#b31419', '#a80e14'].map(hx);
  function bgRGB(lt) {
    const s = Math.min(4, stageSum(lt)), k = Math.min(3, s | 0), f = s - k, A = RE[k], B = RE[k + 1];
    return [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, A[2] + (B[2] - A[2]) * f];
  }
  // 计数：真实序列（对数段间连续插值），3.3 起滚，1T+ 定格
  function countVal(lt) {
    const K = [[3.3, 3.6, 0, 1.5], [3.6, 4.5, 1.5, 175], [4.5, 5.4, 175, 540], [5.4, 6.3, 540, 1000]];
    for (const [a, b, v0, v1] of K) if (lt >= a && lt < b) return v0 + (v1 - v0) * ease.inOut((lt - a) / (b - a));
    return lt >= 6.3 ? 1000 : 0;
  }
  // 相机：近景缓推 → 展开缓拉远 → 拍三停（单向、每步都缓；推拉都锁网心，边缘子像素级位移）
  function cam(lt) {
    if (lt < 3) return { z: lerp(1.045, 1.10, ss(0, 3, lt)) };
    if (lt < 6.3) return { z: lerp(1.10, 1.055, ss(3, 6.3, lt)) };
    return { z: 1.055 };
  }

  // ---------- 南瓜（原版 5 瓣＋行排黑波点＋柄；底部为轴呼吸） ----------
  const PUMP = { cx: 880, yb: 854, S: 2.1 };
  const pumpkinS = lt => PUMP.S * ss(4.15, 6.25, lt) * (1 + 0.09 * bump(lt, 6.3));   // 4.15s 起随计数隆起，1T+ 一次弹跳重音
  function pumpkin(c, t, cx, yb, S, conv, amp, glow) {
    if (S < 0.04) return;
    const br = 1 + Math.sin(t * 5) * 0.022, Sx = S * br, Sy = S * (2 - br);
    const lobes = [[-88, 46, 70], [-44, 58, 74], [0, 62, 80], [44, 58, 74], [88, 46, 70]];
    const lw = Math.max(3, 1.5 * S);
    [0, 4, 1, 3, 2].forEach(k => {
      const [dx, rx, ry] = lobes[k];
      const LX = cx + dx * Sx, LY = yb - ry * Sy;
      const p = new Path2D(); p.ellipse(LX, LY, rx * Sx, ry * Sy, 0, 0, TAU);
      c.fillStyle = C.yellow; c.fill(p);
      if (glow > 0) { c.fillStyle = rgba('#fff6c4', 0.45 * glow); c.fill(p); }       // 南瓜灯：瓣内从里亮起来
      c.strokeStyle = C.black; c.lineWidth = lw; c.stroke(p);
      c.save(); c.clip(p);
      for (let row = -4; row <= 4; row++) {
        const wr = Math.sqrt(Math.max(0, 1 - Math.pow(row * 17 / ry, 2))) * rx;
        for (let col = -3; col <= 3; col++) {
          const edge = 1 - Math.abs(col) / 4, rU = (3 + 6.5 * edge) * (1 - Math.abs(row) / 6);
          const X = LX + col * wr * 0.3 * Sx, Y = LY + row * 17 * Sy;
          const R = rU * (Sx + Sy) * 0.46 * wave(X, Y, t, conv, amp * 1.3);
          if (R > 0.7) {
            dot(c, X, Y, R, 0, 1, C.black);
            if (glow > 0 && R > 4) dot(c, X, Y, R * 0.34, 0, 1, rgba('#fbf6ee', glow * 0.95));   // 灯亮后黑点出白芯（点睛）
          }
        }
      }
      c.restore();
    });
    // 柄（单位坐标以中心瓣心为原点）
    const LYc = yb - 80 * Sy;
    const st = new Path2D();
    st.moveTo(cx - 10 * Sx, LYc - 58 * Sy);
    st.quadraticCurveTo(cx - 14 * Sx, LYc - 94 * Sy, cx + 6 * Sx, LYc - 100 * Sy);
    st.lineTo(cx + 14 * Sx, LYc - 92 * Sy);
    st.quadraticCurveTo(cx + 4 * Sx, LYc - 78 * Sy, cx + 10 * Sx, LYc - 58 * Sy);
    st.closePath();
    c.fillStyle = C.stem; c.fill(st); c.strokeStyle = C.black; c.lineWidth = Math.max(2.5, S); c.stroke(st);
    // 南瓜灯外晕（lighter 暖光，随 glow 呼吸微颤）
    if (glow > 0.01) {
      const gy = yb - 80 * Sy, R = 165 * S;
      const g = c.createRadialGradient(cx, gy, 0, cx, gy, R);
      g.addColorStop(0, rgba('#fff6c4', 0.5 * glow)); g.addColorStop(0.55, rgba('#f6d02a', 0.22 * glow)); g.addColorStop(1, 'rgba(246,208,42,0)');
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.beginPath(); c.arc(cx, gy, R, 0, TAU); c.fill(); c.restore();
    }
  }

  // ---------- 计数牌（黄底黑字胶囊，四角红波点呼吸，逐档弹一下；拍三 7.05–7.45 淡出让位） ----------
  function counter(c, lt, t, conv, amp) {
    if (lt < 3.2) return;
    const fade = 1 - ss(7.05, 7.45, lt);
    if (fade <= 0) return;
    const inn = ease.outBack(clamp((lt - 3.2) / 0.35, 0, 1));
    const pop = 1 + 0.04 * (bump(lt, STG[0]) + bump(lt, STG[1]) + bump(lt, STG[2]) + bump(lt, STG[3]));
    c.save(); c.globalAlpha = fade;
    c.translate(1545, 272 + (1 - Math.min(1, inn)) * 260); c.scale(inn * pop, inn * pop);
    const w = 470, h = 188;
    c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 26);
    c.fillStyle = C.yellow; c.fill(); c.strokeStyle = C.black; c.lineWidth = 8; c.stroke();
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach((s, i) =>
      dot(c, s[0] * (w / 2 - 24), s[1] * (h / 2 - 24), (8 + i) * wave(s[0] * w, s[1] * h, t, conv, amp), 0, 1, C.red));
    c.fillStyle = C.black; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.font = '42px "LXGWWenKai-500"'; c.fillText('参数量', 0, -44);
    const v = countVal(lt);
    c.font = '102px "Poppins-800"';
    c.fillText(v >= 999.5 ? '1T+' : (v < 10 ? v.toFixed(1) : String(Math.round(v))) + 'B', 0, 74);
    c.restore();
  }

  // ---------- 拍三：三件波点物（书=数据·白红 / 齿轮=方法·白红 / 南瓜灯=算力·点亮） ----------
  const BOOKS = [[-105, 210, 50, 0], [-86, 172, 46, 50], [-64, 128, 42, 96]];   // [dx, w, h, 距摞底]
  function books(c, x, y, t, conv, amp) {
    const cols = [[C.white, C.red], [C.red, C.white], [C.yellow, C.black]];
    BOOKS.forEach((q, i) => {
      const bx = x + q[0], by = y - q[3] - q[2], bw = q[1], bh = q[2];
      c.fillStyle = cols[i][0]; c.fillRect(bx, by, bw, bh);
      c.strokeStyle = C.black; c.lineWidth = 7; c.strokeRect(bx, by, bw, bh);
      c.save(); c.beginPath(); c.rect(bx, by, bw, bh); c.clip();
      for (let yy = by + 13, j = 0; yy < by + bh; yy += 25, j++)
        for (let xx = bx + 13 + (j % 2) * 12.5; xx < bx + bw; xx += 25)
          dot(c, xx, yy, 5.5 * wave(xx, yy, t, conv, amp * 1.15), 0, 1, cols[i][1]);
      c.restore();
    });
  }
  function gear(c, x, y, t, conv, amp) {
    const rot = t * 0.55, p = new Path2D();
    for (let i = 0; i < 24; i++) { const a = rot + i * TAU / 24, rr = i % 2 ? 92 : 118;
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; i ? p.lineTo(px, py) : p.moveTo(px, py); }
    p.closePath();
    c.fillStyle = C.white; c.fill(p); c.strokeStyle = C.black; c.lineWidth = 9; c.stroke(p);
    [[64, 8, 10.5], [32, 5, 7]].forEach(q => { for (let i = 0; i < q[1]; i++) {
      const a = rot + i * TAU / q[1], X = x + Math.cos(a) * q[0], Y = y + Math.sin(a) * q[0];
      dot(c, X, Y, q[2] * wave(X, Y, t, conv, amp), 0, 1, C.red); } });
    dot(c, x, y, 20 * wave(x, y, t, conv, amp), 0, 1, C.black);
    dot(c, x, y, 9 * wave(x, y, t, conv, amp * 1.2), 0, 1, C.red);
  }
  function tag(c, x, y, txt, pop, t, conv, amp) {
    if (pop <= 0) return;
    c.save(); c.translate(x, y); c.scale(pop, pop);
    const w = 168, h = 86;
    c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 20);
    c.fillStyle = C.yellow; c.fill(); c.strokeStyle = C.black; c.lineWidth = 7; c.stroke();
    dot(c, -w / 2 + 24, 0, 8 * wave(x, y, t, conv, amp), 0, 1, C.red);
    c.fillStyle = C.black; c.font = '46px "LXGWWenKai-500"'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(txt, 10, 2);
    c.restore();
  }
  function trio(c, lt, t, conv, amp) {
    const up = lt => (1 - Math.min(1, lt)) * 300;
    const pb = ease.outBack(clamp((lt - 7.15) / 0.5, 0, 1));
    if (pb > 0) { const s = 0.72 + 0.28 * Math.min(1, pb); c.save(); c.translate(386, 852 + up(pb)); c.scale(s, s); books(c, 0, 0, t, conv, amp); c.restore(); }
    const pg = ease.outBack(clamp((lt - 7.55) / 0.5, 0, 1));
    if (pg > 0) { const s = 0.72 + 0.28 * Math.min(1, pg); c.save(); c.translate(1500, 745 + up(pg)); c.scale(s, s); gear(c, 0, 0, t, conv, amp); c.restore(); }
    const LAB = [[386, 596, '数据'], [1500, 566, '方法'], [880, 405, '算力']], TG = [7.7, 8.1, 8.5];
    for (let k = 0; k < 3; k++) tag(c, LAB[k][0], LAB[k][1], LAB[k][2], ease.outBack(clamp((lt - TG[k]) / 0.3, 0, 1)), t, conv, amp);
  }

  // ---------- 屏上字（白底胶囊黑字＋红波点；几何擦入擦出，不整片闪） ----------
  const TXT = [[0.05, 2.95, '参数', 168], [3.05, 6.95, '疯狂卷参数', 128], [7.05, 10.2, '参数之外', 138]];
  function screenText(c, lt, t, conv, amp) {
    for (const [t0, t1, txt, size] of TXT) {
      const pIn = clamp((lt - t0) / 0.3, 0, 1), pOut = 1 - clamp((lt - (t1 - 0.22)) / 0.22, 0, 1);
      if (pIn <= 0 || pOut <= 0) continue;
      const wipe = Math.min(pIn, pOut), x = 118, y = 246;
      c.save();
      c.font = size + 'px "LXGWWenKai-500"'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      const tw = c.measureText(txt).width, pw = tw + 96, ph = size + 74;
      c.beginPath(); c.rect(x - 36, y - size - 26, pw * ease.out(wipe), ph); c.clip();
      c.beginPath(); c.roundRect(x - 36, y - size - 26, pw, ph, ph * 0.42);
      c.fillStyle = C.white; c.fill(); c.strokeStyle = C.black; c.lineWidth = 7; c.stroke();
      dot(c, x - 12, y + 20, 9 * wave(x - 12, y, t, conv, amp), 0, 1, C.red);           // 胶囊上的红波点（左下一颗、右端两颗，都呼吸）
      dot(c, x + tw + 26, y - size + 16, 12 * wave(x + tw, y - size, t, conv, amp), 0, 1, C.red);
      dot(c, x + tw + 42, y + 20, 7 * wave(x + tw + 40, y, t, conv, amp), 0, 1, C.red);
      c.fillStyle = C.black; c.fillText(txt, x, y);
      c.restore();
    }
  }

  return {
    init() {
      U.assertGlyphs('170px "LXGWWenKai-500"', '参数疯狂卷之外数据方法算力量', 's21_kusama 屏上字/标签/计数牌');
      U.assertGlyphs('104px "Poppins-800"', '0123456789.-BT+', 's21_kusama 数字');
    },
    draw(c, lt, t) {
      const conv = 1 - ss(9.2, 9.8, lt);               // 收稳：行波相位收敛成全场同拍
      const gild = ss(7.0, 8.6, lt);                    // 变亮变精：波点逐颗点出芯
      const amp = 0.15 - 0.045 * conv;                  // 收稳同时收小幅度
      const z = cam(lt).z;
      c.save();
      c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-O[0], -O[1]);
      // ① 红底（随密度档加深）
      const bg = bgRGB(lt);
      c.fillStyle = 'rgb(' + (bg[0] | 0) + ',' + (bg[1] | 0) + ',' + (bg[2] | 0) + ')';
      c.fillRect(-400, -400, W + 800, H + 800);
      // ② 静态远景波点层
      const fa = ss(3.0, 3.6, lt);
      if (fa > 0) { c.globalAlpha = 0.55 * fa; c.drawImage(FAR, -240, -180); c.globalAlpha = 1; }
      // ③ 地板（渐变＋地板线）
      const fg = c.createLinearGradient(0, FLOOR, 0, H + 300);
      fg.addColorStop(0, 'rgb(' + (bg[0] * 0.82 | 0) + ',' + (bg[1] * 0.82 | 0) + ',' + (bg[2] * 0.82 | 0) + ')');
      fg.addColorStop(1, '#e02024');
      c.fillStyle = fg; c.fillRect(-400, FLOOR, W + 800, H - FLOOR + 400);
      c.fillStyle = C.redDk; c.fillRect(-400, FLOOR - 3, W + 800, 6);
      // ④ 南瓜的无限镜屋式倒影（镜像＋压扁＋低透明，画在地板上）
      const lift = 30 * ease.outBack(clamp((lt - 7.95) / 0.5, 0, 1));   // 拍三南瓜灯轻轻升起
      const pS = pumpkinS(lt), yb = PUMP.yb - lift;
      if (pS > 0.1) {
        c.save();
        c.beginPath(); c.rect(-400, FLOOR, W + 800, H - FLOOR + 400); c.clip();
        c.globalAlpha = 0.22;
        c.translate(0, FLOOR); c.scale(1, -0.85); c.translate(0, -FLOOR);
        pumpkin(c, t, PUMP.cx, yb, pS, conv, amp, 0);
        c.restore();
      }
      // ⑤ 地板波点（3.0–3.5 出生）
      for (const p of FLOORD) {
        const b = ss(p.birth, p.birth + 0.3, lt);
        if (b <= 0) continue;
        dot(c, p.x, p.y, p.r * b * wave(p.x, p.y, t, conv, amp), 0, 0.42, C.white);
      }
      // ⑥ 无限波点网（四档逐环铺开；拍三起大点逐颗点出深红芯）
      for (const pts of GRIDS) for (const p of pts) {
        const b = ss(p.birth, p.birth + 0.3, lt);
        if (b <= 0) continue;
        const R = p.r * b * wave(p.x, p.y, t, conv, amp);
        dot(c, p.x, p.y, R, p.rot, p.asp, C.white);
        if (gild > 0 && R > 13) dot(c, p.x, p.y, R * 0.33, p.rot, p.asp, rgba('#a80e14', gild * 0.95));
      }
      // ⑦ 拍一环绕小波点＋三颗主参数（缓推中被放大端详）＋白字黑影数字（3.0–3.4 溶进网里）
      for (const p of SIDE) dot(c, p.x, p.y, p.r * wave(p.x, p.y, t, conv, amp), p.rot, p.asp, C.white);
      const heroGrow = 1 + 0.07 * ss(0.3, 2.8, lt);
      const numFade = 1 - ss(3.0, 3.4, lt);
      for (let i = 0; i < 3; i++) {
        const h = HERO[i], rot = 0.3 + i * 0.5, asp = 0.94 + i * 0.07;
        const R = h.r * heroGrow * wave(h.x, h.y, t, conv, amp * 1.1);
        dot(c, h.x, h.y, R, rot, asp, h.col);
        if (gild > 0) dot(c, h.x, h.y, R * 0.34, rot, asp, rgba(h.core, gild * 0.95));
      }
      if (numFade > 0) {
        c.save(); c.globalAlpha = numFade;
        for (let i = 0; i < 3; i++) {
          const h = HERO[i], pulse = 1 + 0.05 * Math.sin(t * 2.6 + i * 1.1);
          c.save(); c.translate(h.nx, h.ny); c.scale(pulse, pulse);
          c.font = '64px "Poppins-800"'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillStyle = C.black; c.fillText(h.num, 4, 5);                 // 白字黑影
          c.fillStyle = C.white; c.fillText(h.num, 0, 0);
          c.restore();
        }
        c.restore();
      }
      // ⑧ 南瓜（隆起→1T+ 弹跳→拍三点亮成南瓜灯）
      pumpkin(c, t, PUMP.cx, yb, pS, conv, amp, ss(7.95, 8.5, lt) * (0.92 + 0.08 * Math.sin(lt * 2.4)));
      // ⑨ 计数牌
      counter(c, lt, t, conv, amp);
      // ⑩ 三件波点物＋标签
      trio(c, lt, t, conv, amp);
      c.restore();
      // UI 屏上字
      screenText(c, lt, t, conv, amp);
    },
  };
})();
