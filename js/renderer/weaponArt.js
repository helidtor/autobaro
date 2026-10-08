window.GameRenderer = window.GameRenderer || {};

/* Weapon art: every weapon id gets its own silhouette (look params from
   Equipments.WEAPON_LOOKS, or a deterministic id hash for anything unlisted),
   then ONE generic tier-FX layer is drawn on top. Geometry stays inside the
   old hand/grip box (hand at 0,0, +x = forward). No Math.random: all motion is
   a function of the time argument. */
window.GameRenderer.WeaponArt = (() => {
  const TIERS = ['common', 'rare', 'super_rare', 'supreme', 'god', 'ancient'];
  const OUT = '#202e3b';
  const PAL = [
    { hi: '#d3dbe0', mid: '#98a3a9', lo: '#66717a', grip: '#8a6a45', wrap: '#d4bd98', trim: '#7b6a50' },
    { hi: '#f2fafe', mid: '#c4d6e0', lo: '#7d93a4', grip: '#6b4c40', wrap: '#e0cfa8', trim: '#a9bdc8' },
    { hi: '#f6f1ff', mid: '#d0c5ef', lo: '#8878b6', grip: '#4f3a63', wrap: '#cdb8f0', trim: '#d9c6ff' },
    { hi: '#fff6df', mid: '#f1cd91', lo: '#b9824a', grip: '#5a3326', wrap: '#ffd88a', trim: '#ffd27a' },
    { hi: '#fffce8', mid: '#ffeaa4', lo: '#d9a03b', grip: '#6d1f2c', wrap: '#fff0b0', trim: '#fff3b0' },
    { hi: '#ffffff', mid: '#fff0d0', lo: '#e8a850', grip: '#2b1c3d', wrap: '#ffe9a0', trim: '#fff7c9' }
  ];
  const PROF = {
    straight: { b: 1, m: 1, e: 1, tip: .12 }, broad: { b: 1.4, m: 1.6, e: 1.3, tip: .16 },
    great: { b: 1.9, m: 2, e: 1.8, tip: .12 }, katana: { b: .8, m: .8, e: .75, tip: .1, bend: .07 },
    scimitar: { b: .7, m: 1.2, e: 1.6, tip: .18, bend: .16 }, falchion: { b: .8, m: 1.2, e: 1.7, tip: .1, bend: .05 },
    leaf: { b: .6, m: 1.7, e: .8, tip: .25 }, flame: { b: 1, m: 1.1, e: 1, tip: .2, wave: .35, yw: 1.4 },
    rapier: { b: .5, m: .5, e: .45, tip: .15 }, serrated: { b: 1.1, m: 1.1, e: 1, tip: .14, teeth: .7, n: 16 },
    tanto: { b: 1.2, m: 1.2, e: 1.1, tip: .2 }, kris: { b: .9, m: 1, e: .8, tip: .15, yw: 2.2 },
    fang: { b: 1, m: .9, e: .5, tip: .1, bend: .3 }, stiletto: { b: .55, m: .5, e: .4, tip: .1 }
  };
  const BOWC = {
    short: { span: 22, tx: 16, c1: 27, c2: 35 }, recurve: { span: 25, tx: 15, c1: 35, c2: 36 },
    long: { span: 30, tx: 19, c1: 30, c2: 34, belly: 28 }, horn: { span: 24, tx: 13, c1: 33, c2: 38, hook: 1 },
    composite: { span: 26, tx: 14, c1: 31, c2: 37, belly: 30 }, sun: { span: 27, tx: 15, c1: 36, c2: 38 }
  };
  const OPT = {
    sword: { blade: ['straight', 'broad', 'great', 'katana', 'scimitar', 'falchion', 'leaf', 'flame', 'rapier', 'serrated'], guard: ['bar', 'disc', 'wing', 'cross', 'horn', 'basket', 'spike'], pommel: ['ball', 'ring', 'spike', 'gem', 'crown', 'none'], len: [40, 42, 44, 46, 48, 50], w: [3, 3.5, 4, 4.5] },
    dagger: { blade: ['tanto', 'kris', 'fang', 'stiletto', 'serrated', 'leaf', 'straight', 'scimitar'], guard: ['bar', 'disc', 'wing', 'cross', 'horn', 'spike'], pommel: ['ball', 'ring', 'spike', 'gem', 'none'], len: [25, 27, 29, 31], w: [2.4, 2.9, 3.4] },
    spear: { head: ['leaf', 'trident', 'halberd', 'glaive', 'fork', 'pike', 'crescent'], tassel: ['#bf5362', '#4f8fd6', '#d9a63a', '#5fae6e'] },
    axe: { head: ['hatchet', 'cleaver', 'bearded', 'double', 'crescent'], top: ['none', 'spike'] },
    hammer: { head: ['block', 'spiked', 'maul', 'war', 'star'] },
    bow: { curve: Object.keys(BOWC), tip: ['none', 'wing', 'horn', 'orb'], arrow: ['tri', 'barbed', 'plain'] },
    crossbow: { stock: ['plain', 'heavy', 'repeater'], limb: ['steel', 'horn'], span: [17, 20, 23] },
    staff: { head: ['wand', 'cane', 'orb', 'crystal', 'crescent', 'bough', 'skull', 'pillar', 'claws'] },
    tome: { emblem: ['none', 'skull', 'eye', 'star', 'orb'], cover: ['#6e584d', '#55416e', '#3f5a52', '#6a3a3a', '#34435f'] }
  };
  const S = { pal: PAL[0], accent: '#fff', rank: 0, hot: [], gems: [], box: null, seed: 0 };
  const cache = { mix: new Map(), pal: new Map(), rgba: new Map(), grad: new Map(), look: new Map(), blade: new Map() };

  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const pick = (arr, h, salt) => arr[(Math.imul(h ^ Math.imul(salt + 1, 0x9e3779b1), 2246822519) >>> 8) % arr.length];
  const rgb = h => /^#[0-9a-f]{6}$/i.test(h) ? [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)) : [255, 255, 255];
  const mix = (a, b, k) => {
    const key = a + b + k; let v = cache.mix.get(key);
    if (!v) { const A = rgb(a), B = rgb(b); v = '#' + A.map((c, i) => Math.round(c + (B[i] - c) * k).toString(16).padStart(2, '0')).join(''); cache.mix.set(key, v); }
    return v;
  };
  const rgba = (h, a) => { const key = h + a; let v = cache.rgba.get(key); if (!v) { v = `rgba(${rgb(h).join(',')},${a})`; cache.rgba.set(key, v); } return v; };
  const glowGrad = (ctx, color) => {
    let g = cache.grad.get(color);
    if (!g) { g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, rgba(color, .95)); g.addColorStop(.45, rgba(color, .32)); g.addColorStop(1, rgba(color, 0)); cache.grad.set(color, g); }
    return g;
  };

  /* ---------- primitives (all take ctx; all draw in weapon-local space) ---------- */
  const path = (ctx, pts) => { ctx.beginPath(); for (let i = 0; i < pts.length; i++) i ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[i][0], pts[i][1]); ctx.closePath(); };
  const poly = (ctx, pts, fill, hot, lw = 1.5) => {
    path(ctx, pts); ctx.fillStyle = fill; ctx.fill();
    if (lw) { ctx.strokeStyle = OUT; ctx.lineWidth = lw; ctx.stroke(); }
    if (hot) S.hot.push(pts);
  };
  const line = (ctx, x, y, tx, ty, color, w = 1.5) => { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke(); };
  const dot = (ctx, x, y, r, fill) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.stroke(); };
  const gem = (ctx, x, y, r, color) => {
    const c = S.rank ? color || S.accent : mix(color || S.accent, '#6b6f73', .5);
    poly(ctx, [[x - r, y], [x, y - r], [x + r, y], [x, y + r]], c, false, 1.2);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(x - r * .35, y - r * .55, r * .45, r * .4);
    S.gems.push([x, y, r, c]);
  };
  const stroke2 = (ctx, under, over, wu, wo) => { ctx.strokeStyle = under; ctx.lineWidth = wu; ctx.stroke(); ctx.strokeStyle = over; ctx.lineWidth = wo; ctx.stroke(); };
  const shaft = (ctx, x0, x1, w, col) => { line(ctx, x0, 0, x1, 0, '#26323c', w + 2.5); line(ctx, x0, 0, x1, 0, col, w); };
  const grip = (ctx, x0, x1, hw, col, wrap) => { poly(ctx, [[x0, -hw], [x1, -hw], [x1, hw], [x0, hw]], col, false, 1.3); for (let x = x0 + 2; x < x1; x += 3) line(ctx, x, -hw, x + 1.2, hw, wrap, 1); };

  /* ---------- blades ---------- */
  const bladeOf = (name, x0, L, w) => {
    const key = name + x0 + L + w; let B = cache.blade.get(key);
    if (B) return B;
    const p = PROF[name] || PROF.straight, N = p.n || 12, top = [], bot = [], mid = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, x = x0 + (L - x0) * t;
      const base = t < .5 ? p.b + (p.m - p.b) * t * 2 : p.m + (p.e - p.m) * (t - .5) * 2;
      const tap = t > 1 - p.tip ? (1 - t) / p.tip : 1;
      const ww = w * base * tap * (1 + (p.wave || 0) * Math.sin(t * 15));
      const yc = -(p.bend || 0) * (L - x0) * t * t + (p.yw || 0) * Math.sin(t * 10) * (t < .95 ? 1 : 0);
      top.push([x, yc - ww]); bot.push([x, yc + ww + (p.teeth && i % 2 ? p.teeth * w * .55 * tap : 0)]); mid.push([x, yc]);
    }
    B = { top, bot, mid, pts: top.concat(bot.slice().reverse()), up: top.concat(mid.slice().reverse()) };
    cache.blade.set(key, B); return B;
  };
  const drawBlade = (ctx, B, lk) => {
    const pal = S.pal, n = B.mid.length;
    path(ctx, B.pts); ctx.fillStyle = pal.mid; ctx.fill();
    path(ctx, B.up); ctx.fillStyle = pal.hi; ctx.fill();
    ctx.beginPath(); B.bot.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.strokeStyle = pal.lo; ctx.lineWidth = 1.1; ctx.stroke();
    path(ctx, B.pts); ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.stroke(); S.hot.push(B.pts);
    const d = (lk.deco || []).concat(S.rank > 1 ? ['fuller'] : [], S.rank > 2 ? ['gold'] : []);
    if (d.includes('fuller')) line(ctx, B.mid[1][0], B.mid[1][1], B.mid[n - 3][0], B.mid[n - 3][1], pal.lo, 1);
    if (d.includes('vein')) line(ctx, B.mid[1][0], B.mid[1][1], B.mid[n - 3][0], B.mid[n - 3][1], S.accent, 1.3);
    if (d.includes('gold')) { ctx.beginPath(); B.top.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.strokeStyle = pal.trim; ctx.lineWidth = .9; ctx.stroke(); }
    if (d.includes('rust') && !S.rank) { ctx.fillStyle = '#8a5a3c'; for (const i of [3, 6, 8]) ctx.fillRect(B.mid[i][0] - 1, B.mid[i][1] + (i % 2 ? 1 : -2), 2.4, 1.6); }
  };

  const guardOf = (ctx, kind, gx, gh) => {
    const c = S.pal.trim;
    if (kind === 'none') return;
    if (kind === 'disc') { ctx.beginPath(); ctx.ellipse(gx, 0, 2.6, gh * .85, 0, 0, 6.2832); ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.3; ctx.stroke(); return; }
    if (kind === 'wing') { for (const s of [-1, 1]) poly(ctx, [[gx - 1, s * 1], [gx - 4, s * gh], [gx + 5, s * gh * .6], [gx + 2.5, s * 1]], c, false, 1.2); return; }
    if (kind === 'horn') { for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(gx, s * 2); ctx.quadraticCurveTo(gx - 3, s * gh, gx + 6, s * (gh + 3)); stroke2(ctx, OUT, c, 4, 2.4); } return; }
    if (kind === 'basket') { ctx.beginPath(); ctx.arc(gx + 4, 0, gh, Math.PI * .5, Math.PI * 1.5); stroke2(ctx, OUT, c, 3.6, 2); line(ctx, gx + 4, -gh, gx + 4, gh, c, 1); return; }
    poly(ctx, [[gx - 1.6, -gh], [gx + 1.6, -gh], [gx + 1.6, gh], [gx - 1.6, gh]], c, false, 1.3);
    if (kind === 'cross') for (const s of [-1, 1]) poly(ctx, [[gx - 1.6, s * gh], [gx + 5, s * (gh + 1)], [gx + 1.6, s * (gh - 3)]], c, false, 1.1);
    if (kind === 'spike') for (const s of [-1, 1]) poly(ctx, [[gx - 1.6, s * gh], [gx + 8, s * (gh + 2)], [gx + 1.6, s * (gh - 4)]], c, false, 1.1);
  };
  const pommelOf = (ctx, kind, px) => {
    const c = S.pal.trim;
    if (kind === 'ball') dot(ctx, px - 1, 0, 3, c);
    else if (kind === 'ring') { ctx.beginPath(); ctx.arc(px - 2, 0, 3.2, 0, 6.2832); stroke2(ctx, OUT, c, 3.8, 2); }
    else if (kind === 'spike') poly(ctx, [[px + 2, -2.4], [px - 6, 0], [px + 2, 2.4]], c, false, 1.2);
    else if (kind === 'gem') gem(ctx, px - 2, 0, 3.4);
    else if (kind === 'crown') poly(ctx, [[px + 2, -3], [px, -5], [px - 1.5, -1.5], [px - 3, -5], [px - 4.5, 0], [px - 3, 5], [px - 1.5, 1.5], [px, 5], [px + 2, 3]], c, false, 1.1);
  };

  /* ---------- weapon drawers ---------- */
  const bladeWeapon = (ctx, lk, type) => {
    const dag = type === 'dagger', L = lk.len + 3, w = lk.w, B = bladeOf(lk.blade, 6, L, w);
    drawBlade(ctx, B, lk);
    grip(ctx, -10, 4, 2.2, S.pal.grip, S.pal.wrap);
    guardOf(ctx, lk.guard, 5, dag ? 6 : lk.guard === 'basket' ? 7 : 8);
    pommelOf(ctx, lk.pommel, -10);
    S.box = { cx: (12 + L) / 2, cy: 0, rx: (L - 12) / 2, ry: w * 1.6 + 2 };
  };

  const spearHead = (ctx, lk) => {
    const c = S.pal.mid, pal = S.pal, h = lk.head;
    if (h === 'leaf' || h === 'pike' || h === 'glaive') {
      const B = bladeOf(h === 'glaive' ? 'scimitar' : h === 'pike' ? 'rapier' : 'leaf', 40, h === 'pike' ? 66 : h === 'glaive' ? 66 : 62, h === 'pike' ? 3 : h === 'glaive' ? 5 : 4.5);
      drawBlade(ctx, B, lk); poly(ctx, [[38, -3], [41, -3], [41, 3], [38, 3]], pal.trim, false, 1.2);
    } else if (h === 'trident' || h === 'fork') {
      poly(ctx, [[38, -4], [42, -4], [42, 4], [38, 4]], pal.trim, false, 1.2);
      if (h === 'trident') poly(ctx, [[42, -2], [64, 0], [42, 2]], c, true);
      for (const s of [-1, 1]) poly(ctx, [[40, s * 2], [44, s * 13], [58, s * 13], [55, s * 9], [48, s * 8], [45, s * 2]], c, true, 1.3);
    } else if (h === 'halberd') {
      poly(ctx, [[41, -2], [66, 0], [41, 2]], c, true);
      poly(ctx, [[43, -1], [44, -17], [57, -15], [52, -6], [50, -1]], pal.hi, true);
      poly(ctx, [[43, 1], [49, 11], [42, 8]], c, true, 1.3);
    } else if (h === 'crescent') {
      const o = [], i2 = [];
      for (let i = 0; i <= 8; i++) { const a = -2.3 + i * 4.6 / 8; o.push([50 + 12 * Math.cos(a), 12 * Math.sin(a) * .95]); }
      for (let i = 0; i <= 8; i++) { const a = 2.3 - i * 4.6 / 8; i2.push([54 + 10 * Math.cos(a), 10 * Math.sin(a) * .95]); }
      poly(ctx, o.concat(i2), c, true); poly(ctx, [[48, -1.5], [70, 0], [48, 1.5]], pal.hi, true, 1.2);
    }
    S.box = { cx: 52, cy: 0, rx: 15, ry: h === 'trident' || h === 'fork' || h === 'halberd' || h === 'crescent' ? 14 : 6 };
  };
  const spearWeapon = (ctx, lk) => {
    shaft(ctx, -25, 44, 3, S.rank ? '#73524a' : '#98754d');
    for (const x of [-18, 0, 20]) line(ctx, x, -2.4, x + 1, 2.4, S.pal.wrap, 1.4);
    line(ctx, 32, -4, 34, 4, S.pal.trim, 3); line(ctx, 36, -4, 38, 4, S.pal.trim, 3);
    poly(ctx, [[32, 2], [28, 14], [36, 11]], lk.tassel || '#bf5362', false, 1.3);
    spearHead(ctx, lk);
  };

  const axeHeads = {
    hatchet: [[28, -3], [26, -12], [34, -18], [44, -20], [41, -10], [40, 3], [31, 5]],
    cleaver: [[27, -4], [27, -18], [34, -24], [46, -23], [50, -16], [48, -4], [43, 2]],
    bearded: [[28, -3], [22, 4], [24, -8], [27, -21], [45, -24], [41, -11], [40, 3]],
    crescent: [[29, -3], [24, -14], [32, -24], [46, -26], [40, -17], [37, -8], [38, 2]]
  };
  const topSpike = (ctx, lk) => { if (lk.top === 'spike') poly(ctx, [[37, -2], [53, 0], [37, 2]], S.pal.mid, true, 1.2); };
  const handle = (ctx, lk) => { shaft(ctx, -12, 38, 3.5, lk.shaft || (S.rank ? '#73524a' : '#98754d')); for (let x = -8; x < 8; x += 4) line(ctx, x, -2, x + 1, 2, S.pal.wrap, 1); dot(ctx, -12, 0, 2.6, S.pal.trim); };
  const axeWeapon = (ctx, lk) => {
    handle(ctx, lk);
    const pal = S.pal, mirror = pts => pts.map(([x, y]) => [x, -y]);
    if (lk.head === 'double') { const top = [[29, -3], [25, -13], [31, -21], [45, -23], [42, -12], [39, -3]]; poly(ctx, top, pal.mid, true); poly(ctx, mirror(top), pal.mid, true); line(ctx, 27, -14, 42, -20, pal.hi, 2); line(ctx, 27, 14, 42, 20, pal.lo, 1.5); }
    else {
      const H = axeHeads[lk.head] || axeHeads.hatchet; poly(ctx, H, pal.mid, true);
      line(ctx, H[1][0] + 2, H[1][1] + 1, H[4][0] - 1, H[4][1] + 1, pal.hi, 2); line(ctx, 31, -9, 36, -4, pal.lo, 1.3);
      if (lk.head === 'cleaver') dot(ctx, 40, -14, 2.2, '#26323c');
      if (lk.head === 'crescent') ctx.fillStyle = pal.hi, ctx.fillRect(33, -20, 8, 1.4);
    }
    topSpike(ctx, lk); gem(ctx, 35, 0, lk.head === 'double' ? 4 : 3);
    S.box = { cx: 36, cy: 0, rx: 12, ry: lk.head === 'double' ? 23 : 17 };
  };
  const hammerWeapon = (ctx, lk) => {
    handle(ctx, lk); const pal = S.pal, h = lk.head;
    if (h === 'star') { ctx.beginPath(); ctx.arc(35, 0, 11, 0, 6.2832); ctx.fillStyle = pal.mid; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.stroke(); S.hot.push([[24, -11], [46, -11], [46, 11], [24, 11]]); for (let i = 0; i < 6; i++) { const a = i * 1.047; poly(ctx, [[35 + 9 * Math.cos(a - .25), 9 * Math.sin(a - .25)], [35 + 16 * Math.cos(a), 16 * Math.sin(a)], [35 + 9 * Math.cos(a + .25), 9 * Math.sin(a + .25)]], pal.hi, false, 1.2); } }
    else if (h === 'maul') { poly(ctx, [[20, -10], [46, -10], [49, -6], [49, 6], [46, 10], [20, 10], [17, 6], [17, -6]], pal.mid, true); for (const x of [22, 44]) line(ctx, x, -10, x, 10, pal.lo, 3); line(ctx, 27, -8, 40, -8, pal.hi, 2); }
    else if (h === 'war') { poly(ctx, [[27, -11], [41, -11], [41, 11], [27, 11]], pal.mid, true); poly(ctx, [[27, -2], [14, 0], [27, 2]], pal.hi, true, 1.2); poly(ctx, [[41, -3], [47, 0], [41, 3]], pal.hi, true, 1.2); line(ctx, 30, -9, 30, 9, pal.hi, 2); }
    else { poly(ctx, [[27, -13], [42, -13], [45, -9], [45, 9], [42, 13], [27, 13], [24, 9], [24, -9]], pal.mid, true); line(ctx, 29, -10, 29, 10, pal.hi, 2); line(ctx, 41, -9, 41, 9, pal.lo, 3); if (h === 'spiked') for (const y of [-8, 8]) poly(ctx, [[32, y], [36, y * 1.9], [40, y]], pal.hi, true, 1.2); }
    gem(ctx, 35, 0, 4.5); S.box = { cx: 35, cy: 0, rx: 14, ry: 15 };
  };

  const bowWeapon = (ctx, lk, draw) => {
    const c = BOWC[lk.curve] || BOWC.short, sp = c.span, tx = c.tx, bx = c.belly || 29, wood = S.rank ? '#73524a' : '#98754d';
    const limb = () => { ctx.beginPath(); ctx.moveTo(tx, -sp); ctx.bezierCurveTo(c.c1, -sp - 3, c.c2, -sp / 2.7, bx, 0); ctx.bezierCurveTo(c.c2, sp / 2.7, c.c1, sp + 3, tx, sp); };
    limb(); ctx.strokeStyle = '#27323c'; ctx.lineWidth = 6.4; ctx.stroke(); ctx.strokeStyle = wood; ctx.lineWidth = 3.2; ctx.stroke();
    if (S.rank > 1 || lk.curve === 'composite') { ctx.strokeStyle = S.pal.trim; ctx.lineWidth = 1; ctx.stroke(); }
    S.hot.push([[tx, -sp], [bx + 2, 0], [tx, sp], [bx - 2, 0]]);
    const sc = S.rank > 1 ? mix(S.accent, '#ffffff', .5) : '#ede5cd';
    line(ctx, tx, -sp, 7 - draw, 0, sc, 1); line(ctx, 7 - draw, 0, tx, sp, sc, 1);
    for (const s of [-1, 1]) {
      const ty = s * sp;
      if (lk.tip === 'wing') poly(ctx, [[tx + 1, ty], [tx - 10, ty + s * 5], [tx - 5, ty + s * .5], [tx - 11, ty - s * 3], [tx - 3, ty - s * 3.5]], S.pal.hi, false, 1.1);
      else if (lk.tip === 'horn') poly(ctx, [[tx + 2, ty], [tx - 8, ty + s * 4], [tx - 2, ty - s * 2.5]], S.pal.hi, false, 1.1);
      else if (lk.tip === 'orb') gem(ctx, tx, ty, 2.8);
      else line(ctx, tx, ty, tx + 5, ty + s * 2, S.pal.trim, 3);
    }
    if (c.hook) for (const s of [-1, 1]) line(ctx, tx, s * sp, tx - 5, s * (sp + 3), wood, 2.2);
    if (c.sun) { for (let i = 0; i < 8; i++) { const a = i * .7854; poly(ctx, [[bx - 3 + 5 * Math.cos(a - .2), 5 * Math.sin(a - .2)], [bx - 3 + 10 * Math.cos(a), 10 * Math.sin(a)], [bx - 3 + 5 * Math.cos(a + .2), 5 * Math.sin(a + .2)]], S.pal.hi, false, 1); } }
    poly(ctx, [[bx - 3, -6.5], [bx + 3, -6.5], [bx + 3, 6.5], [bx - 3, 6.5]], S.pal.grip, false, 1.3);
    for (const y of [-4, 0, 4]) line(ctx, bx - 3, y, bx + 3, y + 1.3, S.pal.wrap, 1);
    if (c.sun) gem(ctx, bx, 0, 3.5);
    line(ctx, 2 - draw, 0, 38 - draw, 0, '#ddc8a0', 2);
    const ax = 38 - draw;
    if (lk.arrow === 'barbed') poly(ctx, [[ax - 2, -3.4], [ax + 7, 0], [ax - 2, 3.4], [ax, 0]], S.pal.mid, false, 1.2);
    else if (lk.arrow === 'plain') line(ctx, ax - 1, 0, ax + 6, 0, S.pal.mid, 2.2);
    else poly(ctx, [[ax, -3], [ax + 6, 0], [ax, 3]], S.pal.mid, false, 1.2);
    for (const y of [-2, 2]) line(ctx, 3 - draw, 0, -3 - draw, y, S.accent, 2);
    S.box = { cx: bx - 4, cy: 0, rx: 7, ry: sp + 3 };
  };

  const crossbowWeapon = (ctx, lk) => {
    const sp = lk.span, wood = S.rank ? '#73524a' : '#98754d', limb = lk.limb === 'horn' ? '#d9c9a4' : S.pal.mid;
    poly(ctx, lk.stock === 'heavy' ? [[0, -5.5], [36, -5.5], [40, 0], [36, 5.5], [0, 5.5], [-5, 2]] : [[0, -4], [36, -4], [39, 0], [36, 4], [0, 4], [-4, 1]], wood, false);
    if (lk.stock === 'repeater') { poly(ctx, [[8, -10], [26, -10], [26, -4], [8, -4]], S.pal.trim, false, 1.3); for (const x of [12, 17, 22]) line(ctx, x, -10, x, -4, OUT, 1); }
    ctx.beginPath(); ctx.moveTo(20, -sp); ctx.quadraticCurveTo(37, 0, 20, sp); stroke2(ctx, OUT, limb, 6, 4); S.hot.push([[20, -sp], [34, 0], [20, sp], [31, 0]]);
    const sc = S.rank > 1 ? mix(S.accent, '#fff', .5) : '#eee0c3';
    line(ctx, 20, -sp, 12, 0, sc, 1); line(ctx, 20, sp, 12, 0, sc, 1);
    line(ctx, 5, 0, 40, 0, '#344555', 2); poly(ctx, [[36, -2.6], [44, 0], [36, 2.6]], S.pal.mid, false, 1.2);
    poly(ctx, [[4, 3], [10, 3], [7, 12], [2, 12]], wood, false); gem(ctx, 30, 0, 3);
    line(ctx, 12, -5, 12, 5, S.pal.trim, 2); line(ctx, 34, -4, 34, 4, S.pal.trim, 2);
    S.box = { cx: 24, cy: 0, rx: 12, ry: sp + 2 };
  };

  const staffWeapon = (ctx, lk) => {
    const h = lk.head, pal = S.pal, sh = lk.shaft || (S.rank ? '#73524a' : '#98754d');
    shaft(ctx, -20, h === 'wand' ? 28 : 31, h === 'wand' ? 2.6 : 3.5, sh);
    for (const x of [7, 12, 22]) line(ctx, x, -3, x, 3, pal.trim, 2);
    const a = S.accent;
    if (h === 'wand') { line(ctx, 28, 0, 40, 0, OUT, 4); line(ctx, 28, 0, 40, 0, pal.trim, 2); gem(ctx, 42, 0, 3.6); }
    else if (h === 'cane') { ctx.beginPath(); ctx.arc(36, -5, 6, Math.PI * .5, Math.PI * 1.6); stroke2(ctx, OUT, pal.trim, 5, 3); gem(ctx, 38, -11, 3); S.hot.push([[30, -11], [42, -11], [36, 1]]); }
    else if (h === 'orb') { ctx.beginPath(); ctx.arc(35, 0, 12, -1.8, 1.8); stroke2(ctx, OUT, pal.trim, 4.2, 2.4); dot(ctx, 36, 0, 6.5, a); S.gems.push([36, 0, 6.5, a]); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(33, -4, 3, 2.4); }
    else if (h === 'crystal') { poly(ctx, [[26, 0], [30, -10], [37, -12], [43, 0], [37, 12], [30, 10]], a, true); line(ctx, 33, -6, 38, -4, '#fbf6ff', 2); line(ctx, 32, 0, 36, 7, 'rgba(60,40,110,.6)', 1.5); ctx.beginPath(); ctx.arc(35, 0, 13, -1.8, 1.8); ctx.strokeStyle = pal.trim; ctx.lineWidth = 2; ctx.stroke(); S.gems.push([36, 0, 6, a]); }
    else if (h === 'crescent') {
      const o = [], i2 = [], d = 5, a2 = Math.atan2(12, -d), r2 = Math.hypot(d, 12);
      for (let i = 0; i <= 10; i++) { const t = Math.PI * .5 + i * Math.PI / 10; o.push([34 + 12 * Math.cos(t), 12 * Math.sin(t)]); }
      for (let i = 0; i <= 10; i++) { const t = (2 * Math.PI - a2) - i * (2 * Math.PI - 2 * a2) / 10; i2.push([34 + d + r2 * Math.cos(t), r2 * Math.sin(t)]); }
      poly(ctx, o.concat(i2), pal.hi, true); gem(ctx, 38, 0, 4, a);
    }
    else if (h === 'bough') {
      ctx.lineCap = 'round';
      for (const [ex, ey] of [[44, -12], [44, 12], [47, 0], [40, -6], [40, 6]]) { ctx.beginPath(); ctx.moveTo(28, 0); ctx.quadraticCurveTo(36, ey * .3, ex, ey); stroke2(ctx, OUT, '#6b4a34', 4, 2.4); }
      for (const [lx, ly] of [[44, -12], [44, 12], [38, -6], [38, 6], [34, -2]]) poly(ctx, [[lx - 3, ly], [lx, ly - 3], [lx + 3, ly], [lx, ly + 3]], a, false, 1);
      gem(ctx, 48, 0, 3.6, mix(a, '#ffffff', .25)); S.hot.push([[28, -12], [48, -12], [48, 12], [28, 12]]);
    }
    else if (h === 'skull') { dot(ctx, 36, -1, 7, '#efe6d2'); poly(ctx, [[32, 5], [40, 5], [39, 10], [33, 10]], '#d9ceb6', false, 1.2); for (const y of [-3, 1.5]) ctx.fillStyle = a, ctx.fillRect(y < 0 ? 32.5 : 37, -3, 2.8, 3); S.gems.push([36, -1, 4, a]); S.hot.push([[29, -8], [43, -8], [43, 10], [29, 10]]); }
    else if (h === 'pillar') { const ice = mix(a, '#ffffff', .45); poly(ctx, [[28, -3], [52, 0], [28, 3]], ice, true); for (const s of [-1, 1]) poly(ctx, [[28, s * 2], [41, s * 13], [35, s * 1]], a, true, 1.3); line(ctx, 31, -1, 46, 0, '#fff', 1.2); S.gems.push([40, 0, 5, a]); }
    else if (h === 'claws') {
      for (const s of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(28, 0); ctx.quadraticCurveTo(34, s * 13, s ? 44 : 49, s * (s ? 10 : 0)); stroke2(ctx, OUT, pal.hi, 5, 3); }
      dot(ctx, 38, 0, 5, a); S.gems.push([38, 0, 5, a]); S.hot.push([[28, -11], [47, -11], [47, 11], [28, 11]]);
    }
    S.box = { cx: 36, cy: 0, rx: h === 'wand' ? 8 : 13, ry: h === 'wand' ? 5 : 13 };
  };

  const tomeWeapon = (ctx, lk) => {
    const pal = S.pal, cover = S.rank > 1 ? mix(lk.cover, S.accent, .15) : lk.cover;
    poly(ctx, [[3, -14], [17, -10], [31, -14], [31, 13], [17, 17], [3, 13]], cover, true);
    poly(ctx, [[5, -11], [16, -7], [16, 13], [5, 9]], '#eedfbc', false, 1.3); poly(ctx, [[18, -7], [29, -11], [29, 9], [18, 13]], '#d7c69f', false, 1.3);
    for (let y = -3; y < 10; y += 4) { line(ctx, 7, y, 13, y + 2, '#937d69', 1); line(ctx, 21, y + 2, 27, y, '#937d69', 1); }
    line(ctx, 17, -9, 17, 15, pal.trim, 2); poly(ctx, [[22, -13], [25, -14], [25, -3], [22, -6]], S.accent, false, 1.2);
    for (const [x, y] of [[3, -14], [31, -14], [3, 13], [31, 13]]) poly(ctx, [[x - 2, y - 2], [x + 2, y - 2], [x + 2, y + 2], [x - 2, y + 2]], pal.trim, false, 1);
    const e = lk.emblem, a = S.accent;
    if (e === 'skull') { dot(ctx, 17, 2, 4.2, '#efe6d2'); ctx.fillStyle = a; ctx.fillRect(14.6, .6, 1.8, 2); ctx.fillRect(17.8, .6, 1.8, 2); }
    else if (e === 'eye') { ctx.beginPath(); ctx.moveTo(11, 2); ctx.quadraticCurveTo(17, -5, 23, 2); ctx.quadraticCurveTo(17, 9, 11, 2); ctx.fillStyle = '#fff4d8'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.stroke(); dot(ctx, 17, 2, 2.5, a); S.gems.push([17, 2, 3, a]); }
    else if (e === 'star') { ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 2.6 : 6, t = -1.5708 + i * .6283; ctx.lineTo(17 + r * Math.cos(t), 2 + r * Math.sin(t)); } ctx.closePath(); ctx.fillStyle = a; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.stroke(); }
    else if (e === 'orb') gem(ctx, 17, -20, 4, a);
    if (lk.chain) { ctx.beginPath(); ctx.moveTo(3, 13); ctx.quadraticCurveTo(-4, 24, 8, 24); ctx.moveTo(31, 13); ctx.quadraticCurveTo(38, 24, 26, 24); ctx.setLineDash && ctx.setLineDash([2, 2]); stroke2(ctx, OUT, pal.trim, 3, 1.6); ctx.setLineDash && ctx.setLineDash([]); }
    gem(ctx, 1, -13, 2); gem(ctx, 33, -13, 2);
    S.box = { cx: 17, cy: 0, rx: 15, ry: e === 'orb' ? 20 : 16 };
  };

  /* ---------- look resolution ---------- */
  const lookOf = (weapon, type) => {
    const id = weapon.id || type, E = window.GameData?.Equipments, explicit = weapon.look || E?.WEAPON_LOOKS?.[id];
    const key = type + '|' + id; let lk = !weapon.look && cache.look.get(key);
    if (lk) return lk;
    const h = hash(id), o = OPT[type] || OPT.sword; lk = {}; let i = 0;
    for (const k of Object.keys(o)) lk[k] = pick(o[k], h, i++);
    lk = Object.assign(lk, explicit); lk.deco = lk.deco || [];
    if (!weapon.look) cache.look.set(key, lk);
    return lk;
  };
  const palOf = (rank, lk) => {
    const base = PAL[rank]; if (!lk.tint) return base;
    const key = lk.tint + rank; let p = cache.pal.get(key);
    if (!p) { const mid = mix(lk.tint, base.mid, .4); p = Object.assign({}, base, { hi: mix(mid, '#ffffff', .55), mid, lo: mix(mid, '#000000', .4) }); cache.pal.set(key, p); }
    return p;
  };

  /* ---------- generic tier FX layer ---------- */
  const glow = (ctx, color, cx, cy, rx, ry, a) => {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(rx, ry); ctx.globalAlpha = Math.max(0, Math.min(1, a)); ctx.fillStyle = glowGrad(ctx, color);
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, 6.2832); ctx.fill(); ctx.restore();
  };
  const star = (ctx, x, y, r, c, a) => {
    ctx.globalAlpha = a; ctx.fillStyle = c; ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.lineTo(x + r * .28, y - r * .28); ctx.lineTo(x + r, y); ctx.lineTo(x + r * .28, y + r * .28);
    ctx.lineTo(x, y + r); ctx.lineTo(x - r * .28, y + r * .28); ctx.lineTo(x - r, y); ctx.lineTo(x - r * .28, y - r * .28); ctx.closePath(); ctx.fill();
  };
  const rune = (ctx, x, y, v, color, a) => {
    for (const pass of [0, 1]) {
      ctx.strokeStyle = pass ? color : 'rgba(15,12,35,.6)'; ctx.lineWidth = pass ? 1 : 1.5; ctx.globalAlpha = pass ? a : .8;
      ctx.globalCompositeOperation = pass ? 'lighter' : 'source-over'; ctx.beginPath();
      if (v === 0) { ctx.moveTo(x, y - 2.2); ctx.lineTo(x, y + 2.2); ctx.moveTo(x - 1.6, y); ctx.lineTo(x + 1.6, y); }
      else if (v === 1) { ctx.moveTo(x - 1.8, y - 2); ctx.lineTo(x, y); ctx.lineTo(x + 1.8, y - 2); ctx.moveTo(x, y); ctx.lineTo(x, y + 2.2); }
      else { ctx.moveTo(x, y - 2.2); ctx.lineTo(x + 2, y); ctx.lineTo(x, y + 2.2); ctx.lineTo(x - 2, y); ctx.closePath(); }
      ctx.stroke();
    }
  };
  const flame = (ctx, x, y, w, h, lean) => {
    ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x - w * .3, y - h * .5, x + lean, y - h); ctx.quadraticCurveTo(x + w * .3, y - h * .5, x + w, y); ctx.closePath(); ctx.fill();
  };
  const ARC = { sword: 1, dagger: 1, axe: 1, hammer: 1 }, STREAK = { spear: 1, bow: 1, crossbow: 1 };
  const fxLayer = (ctx, rank, type, t, fx) => {
    if (rank < 1) return;
    let k = 1;
    try { // zoom/offscreen guard: skip everything when the weapon origin is well outside the canvas
      const m = ctx.getTransform(), W = ctx.canvas && ctx.canvas.width, H = ctx.canvas && ctx.canvas.height;
      k = Math.hypot(m.a, m.b); if (!isFinite(k)) k = 1;
      if (W && isFinite(m.e) && (m.e < -250 || m.f < -250 || m.e > W + 250 || m.f > H + 250)) return;
    } catch (e) { k = 1; }
    const b = S.box, a = S.accent, sd = S.seed, hue = rank >= 5;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round';
    // rare+: rim light on the main metal parts
    ctx.strokeStyle = hue ? `hsl(${(t * 80) % 360},100%,78%)` : mix(a, '#ffffff', .35);
    ctx.lineWidth = rank === 1 ? .9 : 1.2; ctx.globalAlpha = [0, .32, .45, .55, .65, .8][rank];
    for (const p of S.hot) { path(ctx, p); ctx.stroke(); }
    if (k >= .3 && rank >= 2) {
      // super_rare+: soft glow (pulses harder at god/ancient)
      const pulse = rank >= 4 ? Math.sin(t * 4 + sd) * .1 : Math.sin(t * 2.2 + sd) * .05;
      glow(ctx, a, b.cx, b.cy, b.rx + 6 + rank * 2.5, b.ry + 5 + rank * 2.5, [0, 0, .2, .27, .34, .3][rank] + pulse);
      if (rank === 4) glow(ctx, '#ffffff', b.cx, b.cy, b.rx * .8, b.ry * .7, .1 + pulse);
      for (const g of S.gems) glow(ctx, g[3], g[0], g[1], g[2] * 3.2, g[2] * 3.2, .4 + Math.sin(t * 3 + g[0]) * .12);
    }
    if (k >= .6) {
      const horiz = b.rx >= b.ry;
      if (rank >= 2) { // engraved runes pulsing along the weapon
        const rc = mix(a, '#ffffff', .5);
        for (let i = 0; i < 3; i++) {
          const f = (i - 1) * .55, x = horiz ? b.cx + f * b.rx : b.cx, y = horiz ? b.cy : b.cy + f * b.ry;
          rune(ctx, x, y, (i + (sd | 0)) % 3, rc, .45 + .4 * Math.sin(t * 2.5 + i * 1.7 + sd));
        }
        ctx.globalCompositeOperation = 'lighter';
      }
      if (rank >= 3) { // sparkles orbiting the weapon
        const n = rank >= 5 ? 6 : rank >= 4 ? 5 : 3, sc = mix(a, '#ffffff', .65);
        for (let i = 0; i < n; i++) {
          const ang = ((t * (.32 + .04 * i) + i / n) % 1) * 6.2832, tw = .5 + .5 * Math.sin(t * 6 + i * 2.1 + sd);
          star(ctx, b.cx + Math.cos(ang) * (b.rx + 6), b.cy + Math.sin(ang) * (b.ry + 4), 1.3 + 2.4 * tw, sc, .45 + .55 * tw);
        }
      }
      if (rank >= 4) { // flame / light wisps licking upward
        const n = rank >= 5 ? 4 : 3, core = rank >= 5 ? '#fff6c8' : mix(a, '#ffffff', .6);
        for (let i = 0; i < n; i++) {
          const p = (t * .85 + i * .31 + sd * .1) % 1, f = ((i * .37 + .1) % 1) - .5;
          const x = horiz ? b.cx + f * b.rx * 1.6 : b.cx + 5, y = (horiz ? b.cy - b.ry * .55 : b.cy + f * b.ry * 1.6) - p * 10, lean = Math.sin(t * 7 + i * 2 + sd) * 1.8;
          ctx.globalAlpha = .6 * (1 - p); ctx.fillStyle = a; flame(ctx, x, y, (1 - p) * 3.6 + 1, (1 - p) * 13 + 4, lean);
          ctx.globalAlpha = .55 * (1 - p); ctx.fillStyle = core; flame(ctx, x, y, (1 - p) * 1.8 + .5, (1 - p) * 8 + 2, lean * .6);
        }
      }
      if (hue) { // ancient halo
        ctx.globalAlpha = .35 + .2 * Math.sin(t * 3 + sd); ctx.strokeStyle = '#fff3c4'; ctx.lineWidth = .9;
        ctx.beginPath(); ctx.ellipse(b.cx, b.cy, b.rx + 10, b.ry + 8, 0, 0, 6.2832); ctx.stroke();
      }
    }
    if (hue && fx && fx.fade > 0 && k >= .3) { // ancient: glowing slash trail on the swing
      const f = fx.fade, sw = fx.sw;
      if (ARC[type]) {
        const R = b.cx + b.rx, span = Math.max(.15, sw * 1.7);
        for (const [r, w, c, al] of [[.97, 6, a, .5], [.84, 3.2, '#ffffff', .45], [.68, 1.6, a, .35]]) { ctx.globalAlpha = f * al; ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(0, 0, R * r, -span, 0); ctx.stroke(); }
      } else if (STREAK[type]) {
        const tip = b.cx + b.rx + 8, len = 14 + 34 * Math.max(.3, sw);
        for (const [l, w, c, al] of [[1, 5, a, .45], [.7, 2.6, '#ffffff', .5], [.45, 1.2, a, .5]]) { ctx.globalAlpha = f * al; ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(tip, 0); ctx.lineTo(tip - len * l, 0); ctx.stroke(); }
      }
    }
    ctx.restore();
  };

  const draw = (ctx, weapon, type, drawPull = 0, fx) => {
    const lk = lookOf(weapon, type), tier = weapon.tier, rank = Math.max(0, TIERS.indexOf(tier));
    S.rank = rank; S.pal = palOf(rank, lk); S.accent = lk.fx || window.GameData?.Equipments?.TIER_COLORS?.[tier] || '#a68c62';
    S.hot.length = 0; S.gems.length = 0; S.box = { cx: 20, cy: 0, rx: 20, ry: 8 }; S.seed = (hash(weapon.id || type) % 628) / 100;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (type === 'sword' || type === 'dagger') bladeWeapon(ctx, lk, type);
    else if (type === 'spear') spearWeapon(ctx, lk);
    else if (type === 'axe') axeWeapon(ctx, lk);
    else if (type === 'hammer') hammerWeapon(ctx, lk);
    else if (type === 'bow') bowWeapon(ctx, lk, drawPull);
    else if (type === 'crossbow') crossbowWeapon(ctx, lk);
    else if (type === 'staff') staffWeapon(ctx, lk);
    else if (type === 'tome') tomeWeapon(ctx, lk);
    fxLayer(ctx, rank, type, fx && fx.time !== undefined ? fx.time : performance.now() / 1000, fx);
    ctx.restore();
  };

  return { draw, lookOf, OPT, PROF, BOWC, TIERS };
})();
