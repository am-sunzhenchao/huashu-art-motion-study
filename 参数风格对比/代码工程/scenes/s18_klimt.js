// 「大模型参数」× 克里姆特金色时期（s18_klimt）——参数＝金箔上的金点。
// 拍一 0–3s：三枚金质参数徽章（0.73 / -1.2 / 2.4 压花数字，Marcellus 刻进金里）近景缓推端详；
//   徽章外圈金螺旋缓转、三色同心环呼吸胀缩、小金点明灭、金粉四角星闪烁、金箔碎片翻面飘落、斜向流光扫过金墙。
// 拍二 3–7s：徽章增殖成「生命之树」金织物网（金螺旋转/眼形纹轮流眨/三色同心圆/黑白格/白点簇＋金线藤蔓），
//   从网心向外连片生长；右上马赛克饰带计数 1.5B→175B→540B→1T+ 对数滚动，底色随档加深、四角织纹逐档贴上；
//   1T+ 揭示＝一次单向快推（0.96→1.02）＋饰带描金一瞬。
// 拍三 7–10s：增殖停住；三枚金色浅浮雕徽章（一摞书=数据/齿轮=方法/油灯=算力）依次升起归位挂铭牌，
//   齿轮缓转、灯火苗轻晃；网内纹样描金「变亮变精」、金螺旋转速线性收慢归零（收稳），一道流光铺过全网收尾。
// 硬红线：无角色（不画人脸、不给物加脸；眼形纹为袍上织物的平面纹样，散点分布）；做旧（斑驳/接缝/暗角/暗幕）只上背景墙。
// 确定性：随机全用 U.rng 种子；静态金箔层 PAINT.cached；所有动画是 (lt, t) 的纯函数。
SCENES['s18_klimt'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, ss, ease } = U, P = PAINT;
  const C = {
    goldLo: [120, 78, 18], gold: [196, 148, 52], goldHi: [246, 216, 128],
    ink: '#1d140c', red: '#c03a2a', cream: '#f4efe2', bronze: '#3a2410',
    plate: '#1a0d03', rim: '#d6a845', rimHi: '#f6d880',
  };
  const TRIOS = [['#c03a2a', '#f4efe2', '#2a4a9a'], ['#2a4a9a', '#d6a845', '#c03a2a'], ['#6a3a8a', '#f4efe2', '#d6a845']];
  const IRIS = ['#2a4a9a', '#2a7a5a', '#8a2a2a'];
  const mixHex = (a, b, t) => P.rgb(P.mix(P.hex(a), P.hex(b), t));

  // ---------- 金箔（逐像素：斑驳＋拉丝＋颗粒）——18_klimt 原配方 ----------
  const goldTex = () => P.cached('s18k_gold', W, H, (g) => {
    const img = g.createImageData(W, H), d = img.data, r = U.rng(19);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const mott = P.fbm(x * 0.004 + 3, y * 0.004, 4), brush = P.noise(x * 0.003, y * 0.08) * 0.45, gr = (r() - 0.5) * 0.1;
      const f = clamp(0.5 + mott * 0.55 + brush * 0.5 + gr);
      const col = f < 0.5 ? P.mix(C.goldLo, C.gold, f * 2) : P.mix(C.gold, C.goldHi, (f - 0.5) * 2);
      const i = (y * W + x) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
  // 墙＝金箔压暗成《吻》的褐金斑驳底 ＋ 金粉/暗粉 ＋ 一片片贴上去的接缝 ＋ 四角做旧暗角（全静态，缓存）
  const wall = () => P.cached('s18k_wall', W, H, (g) => {
    g.drawImage(goldTex(), 0, 0);
    g.globalCompositeOperation = 'multiply';
    const m = P.cached('s18k_mott', 480, 270, (h) => {
      const im = h.createImageData(480, 270), dd = im.data;
      for (let y = 0; y < 270; y++) for (let x = 0; x < 480; x++) {
        const n = P.fbm(x * 0.012 + 9, y * 0.012, 4), v = clamp(0.58 + n * 0.7);
        const i = (y * 480 + x) * 4; dd[i] = 255 * v; dd[i + 1] = 235 * v; dd[i + 2] = 190 * v; dd[i + 3] = 255;
      }
      h.putImageData(im, 0, 0);
    });
    g.drawImage(m, 0, 0, W, H);
    g.globalCompositeOperation = 'source-over';
    const r = U.rng(23);
    for (let i = 0; i < 8000; i++) { const x = r() * W, y = r() * H, s = 0.6 + r() * 2.2;
      g.fillStyle = r() < 0.7 ? 'rgba(250,226,140,' + (0.3 + r() * 0.5).toFixed(3) + ')' : 'rgba(70,40,10,' + (0.2 + r() * 0.3).toFixed(3) + ')';
      g.fillRect(x, y, s, s); }
    g.strokeStyle = 'rgba(90,55,10,.18)'; g.lineWidth = 1;
    for (let y = 0; y < H; y += 96) for (let x = (y / 96 % 2) * 48; x < W; x += 96) g.strokeRect(x + 0.5, y + 0.5, 96, 96);
    const v = g.createRadialGradient(W / 2, H / 2, 520, W / 2, H / 2, 1180);
    v.addColorStop(0, 'rgba(40,22,6,0)'); v.addColorStop(1, 'rgba(40,22,6,.5)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
  });

  // ---------- 小件画法 ----------
  function spiral(c, x, y, R, rot, col, lw) {
    c.strokeStyle = col; c.lineWidth = lw; c.beginPath();
    for (let a = 0; a < Math.PI * 5.2; a += 0.22) { const rr = R * a / (Math.PI * 5.2);
      const px = x + Math.cos(a + rot) * rr, py = y + Math.sin(a + rot) * rr; a ? c.lineTo(px, py) : c.moveTo(px, py); }
    c.stroke();
  }
  function annularSpiral(c, x, y, r0, r1, rot, col, lw) {
    c.strokeStyle = col; c.lineWidth = lw; c.beginPath();
    const TOT = 2.6 * TAU;
    for (let a = 0; a <= TOT; a += 0.16) { const rr = r0 + (r1 - r0) * a / TOT;
      const px = x + Math.cos(a + rot) * rr, py = y + Math.sin(a + rot) * rr; a ? c.lineTo(px, py) : c.moveTo(px, py); }
    c.stroke();
  }
  // 荷鲁斯式眼形纹（袍上织物的平面纹样）：白底勾线、彩虹膜，轮流眨
  function eye(c, x, y, L, open, iris) {
    const h = L * 0.42 * open;
    c.fillStyle = '#f6f0e0'; c.strokeStyle = C.ink; c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(x - L / 2, y); c.quadraticCurveTo(x, y - h * 2, x + L / 2, y); c.quadraticCurveTo(x, y + h * 2, x - L / 2, y); c.closePath(); c.fill(); c.stroke();
    if (open > 0.25) { c.save(); c.clip(); c.fillStyle = iris; c.beginPath(); c.arc(x, y, L * 0.22, 0, TAU); c.fill();
      c.fillStyle = C.ink; c.beginPath(); c.arc(x, y, L * 0.1, 0, TAU); c.fill(); c.restore(); }
    c.beginPath(); c.moveTo(x - L / 2 - 3, y); c.quadraticCurveTo(x, y - L * 0.84 - 2, x + L / 2 + 3, y); c.stroke();
  }
  // 压花数字：暗字＋错位 1px 亮线＝刻进金箔（哥特卡的压花笔法）
  function engrave(c, txt, x, y, size) {
    c.font = size + 'px "Marcellus-400"'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = 'rgba(255,238,180,.8)'; c.fillText(txt, x + 1.2, y + 1.6);
    c.fillStyle = '#2e1c08'; c.fillText(txt, x, y);
  }
  function star4(c, x, y, R, a) {
    if (a <= 0) return;
    c.fillStyle = 'rgba(255,236,160,' + (0.85 * a).toFixed(3) + ')';
    c.beginPath(); c.moveTo(x, y - R * 2); c.lineTo(x + R * 0.35, y - R * 0.35); c.lineTo(x + R * 2, y);
    c.lineTo(x + R * 0.35, y + R * 0.35); c.lineTo(x, y + R * 2); c.lineTo(x - R * 0.35, y + R * 0.35);
    c.lineTo(x - R * 2, y); c.lineTo(x - R * 0.35, y - R * 0.35); c.closePath(); c.fill();
  }
  function tri(c, x, y, s, ang) {
    c.beginPath();
    for (let k = 0; k < 3; k++) { const a = ang + k * TAU / 3; const px = x + Math.cos(a) * s, py = y + Math.sin(a) * s; k ? c.lineTo(px, py) : c.moveTo(px, py); }
    c.closePath(); c.fill();
  }
  // 斜向流光：金会闪（原 18_klimt 的招牌，α≤.26 防「像镜头眩光」）
  function sweepBand(c, x0, alpha) {
    const gr = c.createLinearGradient(x0 - 260, 0, x0 + 260, 0);
    gr.addColorStop(0, 'rgba(255,240,180,0)'); gr.addColorStop(0.5, 'rgba(255,240,180,' + alpha + ')'); gr.addColorStop(1, 'rgba(255,240,180,0)');
    c.save(); c.globalCompositeOperation = 'lighter'; c.transform(1, 0, -0.45, 1, 0, 0);
    c.fillStyle = gr; c.fillRect(x0 - 260 - 620, 0, 520 + 1240, 1200);
    c.restore();
  }

  // ---------- 数据（全部种子随机，模块加载时一次成型） ----------
  const DUST = (() => { const r = U.rng(31), o = []; for (let i = 0; i < 380; i++) o.push([r() * W, r() * H, 1.5 + r() * 3.5, r() * 6.28, 3 + r() * 6]); return o; })();
  const STG = [3.6, 4.5, 5.4, 6.3];                                    // 计数达档时刻：1.5B / 175B / 540B / 1T+
  const stageSum = lt => ss(STG[0], STG[0] + 0.35, lt) + ss(STG[1], STG[1] + 0.35, lt) + ss(STG[2], STG[2] + 0.35, lt) + ss(STG[3], STG[3] + 0.35, lt);

  // 生命之树网：三枚种子徽章（拍一在场）＋伴点；外圈按到网心距离出生（3.0–6.35s 从中心向外蔓延）
  const NET = (() => {
    const r = U.rng(1818), pts = [], CX = 960, CY = 470;
    pts.push({ x: 700, y: 430, R: 102, num: '0.73', act: 0, ph: 0.4, birth: -1 });
    pts.push({ x: 1010, y: 590, R: 88, num: '-1.2', act: 1, ph: 2.1, birth: -1 });
    pts.push({ x: 800, y: 720, R: 78, num: '2.4', act: 2, ph: 4.4, birth: -1 });
    for (let i = 0; i < 16; i++) { const a = r() * TAU, d = 70 + r() * 190;
      pts.push({ x: 850 + Math.cos(a) * d, y: 545 + Math.sin(a) * d * 0.8, R: 9 + r() * 9, kind: -1, ph: r() * 6.28, birth: -1 }); }
    const outer = [], RINGS = [[300, 10], [450, 13], [600, 16], [740, 15], [880, 12]];
    RINGS.forEach(function (rd) { for (let i = 0; i < rd[1]; i++) {
      const a = (i / rd[1]) * TAU + r() * 0.55, d = rd[0] * (0.86 + r() * 0.28);
      const x = CX + Math.cos(a) * d, y = CY + Math.sin(a) * d * 0.72;
      if (y < 115 || y > 852 || x < 85 || x > 1835) continue;
      let hit = false; for (let q = 0; q < 3; q++) if (Math.hypot(x - pts[q].x, y - pts[q].y) < 140) hit = true;
      if (hit) continue;
      outer.push({ x: x, y: y, k: r(), ph: r() * 6.28, s: 0.7 + r() * 0.6, dir: r() < 0.5 ? 1 : -1, h: 26 + r() * 18, birth: 0, d: 0, i: 0 });
    } });
    outer.forEach(function (p) { p.d = Math.hypot(p.x - CX, (p.y - CY) / 0.72); });
    outer.sort(function (a, b) { return a.d - b.d; });
    outer.forEach(function (p, i) { p.birth = 3.0 + 3.35 * (i / outer.length); p.i = i; });
    const all = pts.concat(outer);
    const edges = [];
    for (let i = 1; i < all.length; i++) { const p = all[i], cand = [];
      for (let j = 0; j < i; j++) { const q = all[j]; const dd = Math.hypot(p.x - q.x, p.y - q.y); if (dd < 540) cand.push([dd, j]); }
      cand.sort(function (a, b) { return a[0] - b[0]; });
      const deg = i < 14 ? 2 : (i % 3 === 0 ? 2 : 1);
      for (let k = 0; k < Math.min(deg, cand.length); k++) {
        const j = cand[k][1];
        edges.push({ i: j, j: i, t0: Math.max(all[i].birth, all[j].birth) + 0.06,
          bow: U.hash(i * 31 + 7, j) - 0.5, leaves: [0.3, 0.62, 0.85], lf: 2.6 + U.hash(i, j * 13) * 1.6 });
      }
    }
    return { pts: all, edges: edges, CX: CX, CY: CY };
  })();

  // 四角织纹（背景随密度逐档贴上）
  const CORNER = (() => {
    const r = U.rng(5150), out = [];
    const ZONES = [[70, 60], [1720, 55], [42, 690], [1830, 730], [80, 838], [1750, 840]];
    for (let stg = 0; stg < 4; stg++) for (let i = 0; i < 3; i++) {
      const zn = ZONES[(stg * 2 + i * 2) % ZONES.length];
      out.push({ x: zn[0] + r() * 80, y: zn[1] + r() * 55, k: (r() * 4) | 0, s: 13 + r() * 15, stg: stg });
    }
    return out;
  })();

  // ---------- 相机 / 时间 ----------
  // 拍一缓推端详 → 拍二缓拉远看织物长全 → 1T+ 一次单向快推重音 → 停（动感交给物）
  function cam(lt) {
    if (lt < 3) { const p = ss(0, 3, lt); return { z: lerp(1.14, 1.28, p), cx: lerp(905, 880, p), cy: lerp(552, 540, p) }; }
    if (lt < 6.3) { const p = ss(3, 6.3, lt); return { z: lerp(1.28, 0.96, p), cx: lerp(880, 960, p), cy: 540 }; }
    if (lt < 6.62) { const p = ss(6.3, 6.62, lt); return { z: lerp(0.96, 1.025, ease.out(p)), cx: 960, cy: 540 }; }
    if (lt < 7.25) { const p = ss(6.62, 7.25, lt); return { z: lerp(1.025, 1.0, p), cx: 960, cy: 540 }; }
    return { z: 1.0, cx: 960, cy: 540 };
  }
  // 收稳钟：7.2s 前全速，2s 内线性减到 0 后冻结——螺旋不再倒转
  function windT(t) { if (t <= 7.2) return t; const q = Math.min(t - 7.2, 2); return 7.2 + q - q * q / 4; }
  // 计数：真实序列（段间对数连续插值），3.2 起滚，6.3 定格 1T+
  function countVal(lt) {
    const K = [[3.2, 3.6, 0, 1.5], [3.6, 4.5, 1.5, 175], [4.5, 5.4, 175, 540], [5.4, 6.3, 540, 1000]];
    for (let q = 0; q < K.length; q++) { const a = K[q]; if (lt >= a[0] && lt < a[1]) return a[2] + (a[3] - a[2]) * ease.inOut((lt - a[0]) / (a[1] - a[0])); }
    return lt >= 6.3 ? 1000 : 0;
  }

  // ---------- 拍一：参数徽章（金质圆牌＋压花数字＋各自的母题小循环） ----------
  function seedDisc(c, p, t, wt, gild) {
    const R = p.R * (1 + 0.015 * Math.sin(t * 2.2 + p.ph));            // 呼吸
    c.save(); c.beginPath(); c.arc(p.x, p.y, R, 0, TAU); c.clip(); c.drawImage(goldTex(), 0, 0); c.restore();
    c.strokeStyle = '#7a4c10'; c.lineWidth = 4; c.beginPath(); c.arc(p.x, p.y, R + 1.5, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(255,240,180,.7)'; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y, R - 3, 0, TAU); c.stroke();
    if (p.act === 0) {                                                  // 环形压花底＋缓转的金螺旋
      c.strokeStyle = 'rgba(58,36,16,.4)'; c.lineWidth = 44; c.beginPath(); c.arc(p.x, p.y, 71, 0, TAU); c.stroke();
      annularSpiral(c, p.x, p.y, 52, 90, 0.5 * wt + p.ph, '#f2cf6a', 4.5);
    } else if (p.act === 1) {                                           // 三色同心环呼吸＋一枚游走微光
      const cols = TRIOS[0];
      [86, 72, 58].forEach(function (rr, k) {
        c.strokeStyle = cols[k]; c.lineWidth = 7; c.beginPath();
        c.arc(p.x, p.y, rr * (1 + 0.05 * Math.sin(t * 1.8 + p.ph + k * 1.1)), 0, TAU); c.stroke();
      });
      const ga = 0.35 * wt + p.ph;
      star4(c, p.x + Math.cos(ga) * 60, p.y + Math.sin(ga) * 60, 7, 0.5 + 0.5 * Math.sin(t * 3.1));
    } else {                                                            // 一圈小金三角缓转、明暗轮换
      const rot = 0.35 * wt + p.ph;
      for (let i = 0; i < 10; i++) { const a = rot + i * TAU / 10;
        const gx = p.x + Math.cos(a) * 68, gy = p.y + Math.sin(a) * 68;
        c.fillStyle = Math.sin(t * 3 + i * 1.26) > 0 ? '#f6d880' : '#c8962e';
        tri(c, gx, gy, 9, a);
      }
    }
    engrave(c, p.num, p.x, p.y + 4, 44);
    if (gild > 0) { c.strokeStyle = 'rgba(246,216,128,' + (0.7 * gild).toFixed(3) + ')'; c.lineWidth = 3;
      c.beginPath(); c.arc(p.x, p.y, R + 6, 0, TAU); c.stroke(); }
  }
  function companion(c, p, t, gild) {
    const R = p.R * (1 + 0.1 * Math.sin(t * 2.6 + p.ph));
    c.fillStyle = '#dcae4a'; c.beginPath(); c.arc(p.x, p.y, R, 0, TAU); c.fill();
    c.strokeStyle = '#7a4c10'; c.lineWidth = 2.2; c.stroke();
    c.fillStyle = 'rgba(255,240,190,.8)'; c.beginPath(); c.arc(p.x - R * 0.3, p.y - R * 0.3, R * 0.28, 0, TAU); c.fill();
    if (p.ph % 3 < 1) { const tw = Math.sin(t * 4 + p.ph * 5); if (tw > 0.5) star4(c, p.x + R + 7, p.y - R, 5, (tw - 0.5) / 0.5); }
    if (gild > 0) { c.strokeStyle = 'rgba(246,216,128,' + (0.5 * gild).toFixed(3) + ')'; c.lineWidth = 1.6;
      c.beginPath(); c.arc(p.x, p.y, R + 4, 0, TAU); c.stroke(); }
  }

  // ---------- 拍二：织物网（母题＝袍上纹样四类＋黑白格；藤蔓带小金叶） ----------
  function motif(c, p, pop, lt, t, wt, gild) {
    const s = p.s * pop; if (s <= 0.02) return;
    const x = p.x, y = p.y;
    if (p.k < 0.28) {                                                   // 三色同心圆（呼吸）
      const cols = TRIOS[(p.i * 7) % 3], R = 15 * s * (1 + 0.06 * Math.sin(t * 2 + p.ph));
      [1, 0.68, 0.38].forEach(function (f, j) { c.strokeStyle = cols[j]; c.lineWidth = 3.4; c.beginPath(); c.arc(x, y, R * f, 0, TAU); c.stroke(); });
    } else if (p.k < 0.56) {                                            // 深褐底金螺旋（转，拍三收慢停住）
      c.fillStyle = '#3a2410'; c.beginPath(); c.arc(x, y, 13 * s, 0, TAU); c.fill();
      c.strokeStyle = C.ink; c.lineWidth = 1.4; c.stroke();
      spiral(c, x, y, 11 * s, 3 * p.dir * wt + p.ph, '#f2cf6a', 1.8);
    } else if (p.k < 0.78) {                                            // 眼形纹（轮流眨；7.4s 后睁定休息）
      let open = 1; if (lt < 7.4) { const bl = Math.sin(t * 2.2 + p.ph * 3); open = bl > 0.86 ? clamp(1 - (bl - 0.86) / 0.07) : 1; }
      eye(c, x, y, 26 * s, Math.max(0.08, open), IRIS[p.i % 3]);
    } else if (p.k < 0.92) {                                            // 白点簇＋红心
      c.fillStyle = '#f4efe2';
      for (let j = 0; j < 5; j++) { c.beginPath(); c.arc(x + Math.cos(j * 1.26) * 9 * s, y + Math.sin(j * 1.26) * 9 * s, 3.2 * s, 0, TAU); c.fill(); }
      c.fillStyle = '#c03a2a'; c.beginPath(); c.arc(x, y, 4 * s, 0, TAU); c.fill();
    } else {                                                            // 黑白竖长方块（《吻》男子袍下摆语言）
      const w = 11 * s, h = p.h * s;
      c.fillStyle = p.i % 2 ? '#141010' : '#f4efe2';
      c.fillRect(x - w / 2, y - h / 2, w, h);
      c.strokeStyle = '#d6a845'; c.lineWidth = 1.8; c.strokeRect(x - w / 2, y - h / 2, w, h);
    }
    if (gild > 0) { c.strokeStyle = 'rgba(246,216,128,' + (0.55 * gild).toFixed(3) + ')'; c.lineWidth = 2;
      c.beginPath(); c.arc(x, y, 22 * s + 4, 0, TAU); c.stroke(); }
  }
  function vines(c, lt, gild) {
    const st = [];
    for (let q = 0; q < NET.pts.length; q++) { const p = NET.pts[q]; st.push(p.birth < 0 ? 1 : ss(p.birth, p.birth + 0.32, lt)); }
    c.save(); c.lineCap = 'round';
    for (let e = 0; e < NET.edges.length; e++) {
      const E = NET.edges[e], A = NET.pts[E.i], B = NET.pts[E.j];
      const ea = Math.min(st[E.i], st[E.j], ss(E.t0, E.t0 + 0.18, lt));
      if (ea <= 0) continue;
      const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
      const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
      const px = -dy / L, py = dx / L, bow = E.bow * L * 0.16;
      c.globalAlpha = Math.min(1, ea);
      c.strokeStyle = '#8a5a1a'; c.lineWidth = 3.4;
      c.beginPath(); c.moveTo(A.x, A.y); c.quadraticCurveTo(mx + px * bow, my + py * bow, B.x, B.y); c.stroke();
      if (gild > 0) { c.strokeStyle = 'rgba(246,216,128,' + (0.75 * gild).toFixed(3) + ')'; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(A.x, A.y); c.quadraticCurveTo(mx + px * bow, my + py * bow, B.x, B.y); c.stroke(); }
      c.fillStyle = '#e3b95c';
      for (let q = 0; q < 3; q++) {                                     // 藤上的小金叶（随藤逐个点亮）
        const qq = E.leaves[q], la = ss(E.t0 + qq * 0.1, E.t0 + qq * 0.1 + 0.2, lt);
        if (la <= 0) continue;
        const u = 1 - qq;
        const bx = u * u * A.x + 2 * u * qq * (mx + px * bow) + qq * qq * B.x;
        const by = u * u * A.y + 2 * u * qq * (my + py * bow) + qq * qq * B.y;
        c.globalAlpha = la * 0.9; c.beginPath(); c.arc(bx, by, E.lf, 0, TAU); c.fill();
      }
    }
    c.globalAlpha = 1; c.restore();
  }

  // ---------- 拍三：三枚金色浅浮雕徽章（书=数据 / 齿轮=方法 / 油灯=算力） ----------
  function medallion(c, R) {
    c.save(); c.beginPath(); c.arc(0, 0, R, 0, TAU); c.clip(); c.drawImage(goldTex(), -960, -540); c.restore();
    c.strokeStyle = '#7a4c10'; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, R + 1.5, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(255,240,180,.7)'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, R - 3, 0, TAU); c.stroke();
    const g = c.createRadialGradient(-20, -24, 12, 0, 0, 84);
    g.addColorStop(0, '#4a2e10'); g.addColorStop(1, '#241505');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, 84, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(216,168,69,.55)'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 84, 0, TAU); c.stroke();
  }
  function mBooks(c) {                                                  // 一摞书（浅浮雕金剪影）
    const B = [[-62, 6, 124, 34], [-50, -26, 100, 32], [-38, -56, 76, 30]];
    for (let k = 0; k < 3; k++) { const b = B[k];
      c.fillStyle = '#dcae4a'; c.strokeStyle = C.ink; c.lineWidth = 3;
      c.beginPath(); c.rect(b[0], b[1], b[2], b[3]); c.fill(); c.stroke();
      c.fillStyle = '#f4efe2'; c.fillRect(b[0] + b[2] - 10, b[1] + 5, 4, b[3] - 10);
    }
  }
  function mGear(c, t) {                                                // 齿轮（一直缓转，方法的活）
    const rot = 0.3 * t, p = new Path2D();
    for (let i = 0; i < 24; i++) { const a = rot + (i / 24) * TAU, rr = i % 2 ? 62 : 78;
      const px = Math.cos(a) * rr, py = Math.sin(a) * rr; i ? p.lineTo(px, py) : p.moveTo(px, py); }
    p.closePath();
    c.fillStyle = '#dcae4a'; c.strokeStyle = C.ink; c.lineWidth = 3; c.fill(p); c.stroke(p);
    c.strokeStyle = C.ink; c.lineWidth = 7;
    for (let i = 0; i < 4; i++) { const a = rot * 1.15 + i * Math.PI / 2;
      c.beginPath(); c.moveTo(Math.cos(a) * 20, Math.sin(a) * 20); c.lineTo(Math.cos(a) * 50, Math.sin(a) * 50); c.stroke(); }
    c.fillStyle = '#241505'; c.beginPath(); c.arc(0, 0, 20, 0, TAU); c.fill();
    c.strokeStyle = '#f6d880'; c.lineWidth = 2.5; c.stroke();
  }
  function mLamp(c, t) {                                                // 油灯（火苗轻晃＝算力的活）
    c.save(); c.scale(0.8, 0.8);
    c.fillStyle = '#dcae4a'; c.strokeStyle = C.ink; c.lineWidth = 3.2;
    c.beginPath();
    c.moveTo(-58, 22);
    c.quadraticCurveTo(-64, -34, -6, -42);
    c.quadraticCurveTo(58, -50, 62, -8);
    c.lineTo(86, -20); c.lineTo(86, 4); c.lineTo(62, 6);
    c.quadraticCurveTo(58, 44, 0, 48);
    c.quadraticCurveTo(-58, 46, -58, 22);
    c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-58, 12); c.quadraticCurveTo(-100, 4, -84, -34); c.stroke();     // 左柄
    c.beginPath(); c.arc(0, 26, 16, 0, TAU); c.stroke();                                     // 灯腹纹
    const fl = 1 + 0.14 * Math.sin(t * 9 + Math.sin(t * 13) * 1.5);
    const fx = 84 + Math.sin(t * 7) * 3, fy = -16;
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(fx, fy - 22, 2, fx, fy - 22, 48);
    g.addColorStop(0, 'rgba(255,236,160,.5)'); g.addColorStop(1, 'rgba(255,236,160,0)');
    c.fillStyle = g; c.beginPath(); c.arc(fx, fy - 22, 48, 0, TAU); c.fill();
    c.restore();
    c.fillStyle = '#e8a83a'; flame(c, fx, fy, 20 * fl);
    c.fillStyle = '#fbe6a0'; flame(c, fx, fy - 3, 10 * fl);
    c.restore();
  }
  function flame(c, x, y, s) {
    c.beginPath(); c.moveTo(x, y - s * 2);
    c.quadraticCurveTo(x + s, y - s, x, y + s * 0.4);
    c.quadraticCurveTo(x - s, y - s, x, y - s * 2);
    c.closePath(); c.fill();
  }
  function tagPlate(c, x, y, txt, a) {                                  // 铭牌（字都 ≤880）
    if (a <= 0) return;
    c.save(); c.globalAlpha = a; c.translate(x, y);
    c.font = '46px "LXGWWenKai-500"';
    const w = c.measureText(txt).width + 56;
    c.fillStyle = '#1a0d03'; c.fillRect(-w / 2, -34, w, 68);
    for (let q = -w / 2 + 4; q < w / 2 - 10; q += 12) {
      c.fillStyle = (((q + w / 2 - 4) / 12) | 0) % 2 ? '#141010' : '#f4efe2';
      c.fillRect(q, -33, 9, 9); c.fillRect(q, 24, 9, 9);
    }
    c.strokeStyle = '#d6a845'; c.lineWidth = 2.5; c.strokeRect(-w / 2 + 8, -22, w - 16, 44);
    c.fillStyle = '#e8cf86'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(txt, 0, 2);
    c.restore();
  }
  function trio(c, lt, t) {
    const B = [7.15, 7.55, 7.95], X = [560, 960, 1360], Y = [698, 684, 698];
    const TXT = ['数据', '方法', '算力'];
    for (let k = 0; k < 3; k++) {
      const pop = ease.outBack(clamp((lt - B[k]) / 0.5, 0, 1)); if (pop <= 0) continue;
      const rise = (1 - Math.min(1, pop)) * 300, sc = 0.75 + 0.25 * Math.min(1, pop);
      c.save(); c.translate(X[k], Y[k] + rise); c.scale(sc, sc);
      medallion(c, 106);
      if (k === 0) mBooks(c); else if (k === 1) mGear(c, t); else mLamp(c, t);
      c.restore();
      if (pop >= 1) tagPlate(c, X[k], 840, TXT[k], ease.out(clamp((lt - B[k] - 0.45) / 0.3, 0, 1)));
    }
  }

  // ---------- 计数饰带（马赛克黑白格边，右上；1T+ 描金一瞬） ----------
  function counterBand(c, lt) {
    if (lt < 3.2) return;
    const inn = ease.outBack(clamp((lt - 3.2) / 0.4, 0, 1));
    const pulse = ss(6.3, 6.5, lt) * (1 - ss(6.75, 7.05, lt));
    c.save(); c.translate(1610, 240); c.scale(clamp(inn, 0.02, 1.12), clamp(inn, 0.02, 1.12));
    const BW = 460, BH = 180;
    c.fillStyle = '#1a0d03'; c.fillRect(-BW / 2, -BH / 2, BW, BH);
    for (let x = -BW / 2; x < BW / 2 - 10; x += 12) {
      c.fillStyle = (((x + BW / 2) / 12) | 0) % 2 ? '#141010' : '#f4efe2';
      c.fillRect(x, -BH / 2 + 5, 10, 10); c.fillRect(x, BH / 2 - 15, 10, 10);
    }
    c.strokeStyle = mixHex(C.rim, C.rimHi, pulse); c.lineWidth = 3 + pulse * 2.5;
    c.strokeRect(-BW / 2 + 12, -BH / 2 + 22, BW - 24, BH - 44);
    c.fillStyle = '#e8cf86'; c.font = '36px "LXGWWenKai-500"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillText('参数量', 0, -48);
    const v = countVal(lt);
    const txt = v >= 999.5 ? '1T+' : ((v < 10 ? v.toFixed(1) : String(Math.round(v))) + 'B');
    const g = c.createLinearGradient(0, -30, 0, 56);
    g.addColorStop(0, '#fbe6a0'); g.addColorStop(0.55, '#e3b95c'); g.addColorStop(1, '#9a6a1c');
    c.font = '88px "Marcellus-400"'; c.fillStyle = g; c.fillText(txt, 0, 56);
    for (let k = 0; k < 4; k++) {                                       // 档位点
      const on = ss(STG[k], STG[k] + 0.2, lt), x = -66 + k * 44;
      if (on > 0) { c.fillStyle = 'rgba(246,216,128,' + (0.9 * on).toFixed(3) + ')'; c.beginPath(); c.arc(x, 74, 5.5, 0, TAU); c.fill(); }
      c.strokeStyle = 'rgba(216,168,69,.5)'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, 74, 5.5, 0, TAU); c.stroke();
    }
    c.restore();
  }

  // ---------- 屏上字（描金牌匾，左上，拍间擦入擦出；不做居中金句卡） ----------
  const BEAT_TXT = [[0.15, 2.9, '参数', 128], [3.05, 6.9, '疯狂卷参数', 116], [7.05, 10.2, '参数之外', 120]];
  function screenText(c, lt) {
    for (let q = 0; q < BEAT_TXT.length; q++) {
      const b = BEAT_TXT[q];
      const pIn = clamp((lt - b[0]) / 0.35, 0, 1), pOut = 1 - clamp((lt - (b[1] - 0.25)) / 0.25, 0, 1);
      if (pIn <= 0 || pOut <= 0) continue;
      c.save();
      c.globalAlpha = Math.min(1, pIn * 2) * pOut;
      c.font = b[3] + 'px "LXGWWenKai-500"';
      const tw = c.measureText(b[2]).width;
      const pw = tw + 96, ph = b[3] + 84, px = 130, py = 150;
      c.beginPath(); c.rect(px - 4, py - 4, (pw + 8) * ease.out(pIn), ph + 8); c.clip();
      c.fillStyle = '#1a0d03'; c.fillRect(px, py, pw, ph);
      for (let x = px + 4; x < px + pw - 10; x += 14) {
        c.fillStyle = (((x - px - 4) / 14) | 0) % 2 ? '#141010' : '#f4efe2';
        c.fillRect(x, py + 5, 12, 12); c.fillRect(x, py + ph - 17, 12, 12);
      }
      c.strokeStyle = '#d6a845'; c.lineWidth = 3; c.strokeRect(px + 10, py + 25, pw - 20, ph - 50);
      c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      const ty = py + ph - 54;
      c.fillStyle = 'rgba(12,6,1,.95)'; c.fillText(b[2], px + 48 + 3, ty + 4);
      const g = c.createLinearGradient(0, ty - b[3], 0, ty + 8);
      g.addColorStop(0, '#fbe6a0'); g.addColorStop(0.5, '#d6a845'); g.addColorStop(1, '#9a6a1c');
      c.fillStyle = g; c.fillText(b[2], px + 48, ty);
      c.restore();
    }
  }

  // ---------- 氛围：金粉四角星（上浮＋闪烁）、金箔碎片（翻面飘落） ----------
  function dust(c, t) {
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < DUST.length; i++) { const d = DUST[i];
      const x = d[0] + Math.sin(t * 0.8 + d[3]) * 14, y = ((d[1] - t * 26) % H + H) % H;
      const tw = Math.sin(t * d[4] + d[3]); if (tw < 0.55) continue;
      const a = (tw - 0.55) / 0.45, R = d[2] * (0.6 + a * 1.1);
      c.fillStyle = 'rgba(255,236,160,' + (0.8 * a).toFixed(3) + ')';
      c.beginPath(); c.moveTo(x, y - R * 2); c.lineTo(x + R * 0.35, y - R * 0.35); c.lineTo(x + R * 2, y);
      c.lineTo(x + R * 0.35, y + R * 0.35); c.lineTo(x, y + R * 2); c.lineTo(x - R * 0.35, y + R * 0.35);
      c.lineTo(x - R * 2, y); c.lineTo(x - R * 0.35, y - R * 0.35); c.closePath(); c.fill();
    }
    c.restore();
  }
  function flakes(c, t) {
    P.particles(30, 77, t, { x0: 0, x1: W, y0: -30, y1: 760, speed: 150, drift: 36, life: 3.2 }).forEach(function (p) {
      c.save(); c.translate(p.x, p.y); c.rotate(p.a); c.scale(1, Math.cos(t * 5 + p.i));
      const s2 = 7 + p.s * 8, g2 = c.createLinearGradient(-s2, -s2, s2, s2);
      g2.addColorStop(0, '#fbe6a0'); g2.addColorStop(1, '#a8741e'); c.fillStyle = g2;
      if (p.i % 3) c.fillRect(-s2, -s2, s2 * 2, s2 * 2); else { c.beginPath(); c.arc(0, 0, s2, 0, TAU); c.fill(); }
      if (p.i % 3) { c.strokeStyle = 'rgba(70,40,10,.6)'; c.lineWidth = 1.2; c.strokeRect(-s2, -s2, s2 * 2, s2 * 2); }
      c.restore();
    });
  }

  // ---------- 地基带（世界层）：深铜＋顶金线＋黑白马赛克一行 ----------
  function baseBand(c) {
    const gr = c.createLinearGradient(0, 878, 0, 1080);
    gr.addColorStop(0, '#3a2410'); gr.addColorStop(1, '#170b02');
    c.fillStyle = gr; c.fillRect(-400, 884, W + 800, 300);
    c.fillStyle = '#d6a845'; c.fillRect(-400, 879, W + 800, 5);
    c.fillStyle = '#141010';
    for (let x = -400; x < W + 400; x += 18) c.fillRect(x, 890, 12, 12);
    c.fillStyle = '#f4efe2';
    for (let x = -400 + 9; x < W + 400; x += 18) c.fillRect(x, 890, 12, 12);
  }
  // 四角织纹（随档贴上的背景密度）
  function cornerTrim(c, lt) {
    c.save(); c.lineCap = 'round';
    for (let i = 0; i < CORNER.length; i++) { const o = CORNER[i];
      const a = ss(STG[o.stg], STG[o.stg] + 0.4, lt); if (a <= 0) continue;
      c.globalAlpha = 0.6 * a; c.strokeStyle = '#d6a845'; c.lineWidth = 2.2;
      if (o.k === 0) spiral(c, o.x, o.y, o.s, 0.4, '#d6a845', 1.8);
      else if (o.k === 1) { for (let j = 0; j < 2; j++) { c.beginPath(); c.arc(o.x, o.y, o.s * (1 - j * 0.45), 0, TAU); c.stroke(); } }
      else if (o.k === 2) { c.beginPath();
        for (let j = 0; j < 3; j++) { const an = j * TAU / 3 - Math.PI / 2; const px = o.x + Math.cos(an) * o.s, py = o.y + Math.sin(an) * o.s; j ? c.lineTo(px, py) : c.moveTo(px, py); }
        c.closePath(); c.stroke(); }
      else { c.beginPath(); c.moveTo(o.x, o.y - o.s); c.lineTo(o.x + o.s * 0.7, o.y); c.lineTo(o.x, o.y + o.s); c.lineTo(o.x - o.s * 0.7, o.y); c.closePath(); c.stroke(); }
    }
    c.globalAlpha = 1; c.restore();
  }

  return {
    init() {
      U.assertGlyphs('170px "LXGWWenKai-500"', '参数疯狂卷之外数据方法算力量', 's18_klimt 屏上字/铭牌/饰带');
      U.assertGlyphs('120px "Marcellus-400"', '0123456789.-BT+', 's18_klimt 数字');
    },
    draw(c, lt, t) {
      const cm = cam(lt), stage = stageSum(lt), gild = ss(7, 8.6, lt), wt = windT(t);
      // 1 背景：静态金墙（做旧都在这层）＋随密度加深的暗幕＋四角织纹
      c.drawImage(wall(), 0, 0);
      if (stage > 0) { c.fillStyle = 'rgba(26,14,3,' + (0.085 * Math.min(stage, 4)).toFixed(3) + ')'; c.fillRect(0, 0, W, H); }
      cornerTrim(c, lt);
      // 2 世界层（随镜头）：地基 → 藤蔓 → 织物母题 → 种子徽章 → 三件物
      c.save(); c.translate(W / 2, H / 2); c.scale(cm.z, cm.z); c.translate(-cm.cx, -cm.cy);
      baseBand(c);
      vines(c, lt, gild);
      for (let i = 0; i < NET.pts.length; i++) { const p = NET.pts[i];
        if (p.kind === -1) companion(c, p, t, gild);
        else if (p.birth >= 0) {
          const born = ss(p.birth, p.birth + 0.32, lt);
          if (born > 0) motif(c, p, ease.outBack(clamp(born, 0, 1)), lt, t, wt, gild);
        }
      }
      for (let i = 0; i < 3; i++) seedDisc(c, NET.pts[i], t, wt, gild);
      trio(c, lt, t);
      c.restore();
      // 3 金会闪：周期流光扫金＋拍三收尾一道铺光
      const ph = (((lt - 0.35) % 2.6) + 2.6) % 2.6 / 2.6;
      sweepBand(c, lerp(-260, 2200, ph), 0.22);
      const fin = ss(8.35, 10.0, lt);
      if (fin > 0 && fin < 1) sweepBand(c, lerp(-300, 2300, fin), 0.26);
      // 4 氛围：金粉星（上浮闪烁）＋金箔碎片（翻面飘落）
      dust(c, t);
      flakes(c, t);
      // 5 拍三：网心金息（变亮）
      if (gild > 0) {
        c.save(); c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(NET.CX, NET.CY, 60, NET.CX, NET.CY, 640);
        g.addColorStop(0, 'rgba(255,226,150,' + (0.09 * gild * (0.75 + 0.25 * Math.sin(t * 2.4))).toFixed(4) + ')');
        g.addColorStop(1, 'rgba(255,226,150,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.restore();
      }
      // 6 计数饰带 ＋ 屏上字（最上层）
      counterBand(c, lt);
      screenText(c, lt);
    },
  };
})();
