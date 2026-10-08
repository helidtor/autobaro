/**
 * mapRender.js - Procedural drawing for MapTerrain (design units, scale applied by the caller).
 * The static layer (ground, river, roads, buildings, trees...) is drawn once into cached tiles by
 * MapTerrain; only bushes and the temple seal are drawn every frame.
 */
window.GameEngine = window.GameEngine || {};
window.GameEngine.MapRender = (() => {
  const TAU = Math.PI * 2;
  const hash = (a, b = 0, c = 0) => {
    let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  const rgb = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  const tint = (c, amt) => { const [r, g, b] = rgb(c), t = amt > 0 ? 255 : 0, k = Math.abs(amt); return `rgb(${Math.round(r + (t - r) * k)},${Math.round(g + (t - g) * k)},${Math.round(b + (t - b) * k)})`; };
  const rgba = (c, a) => { const [r, g, b] = rgb(c); return `rgba(${r},${g},${b},${a})`; };
  const rect = (ctx, x, y, w, h, fill) => { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); };
  const ell = (ctx, x, y, rx, ry, fill, rot = 0) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(x, y, Math.max(.01, rx), Math.max(.01, ry), rot, 0, TAU); ctx.fill(); };
  const poly = (ctx, pts, fill, stroke, lw = 1.5) => {
    ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  };
  const blob = (ctx, x, y, r, c, a) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(c, a)); g.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  const line = (ctx, x1, y1, x2, y2, color, w = 1) => { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
  const hits = (v, x, y, w, h, pad = 0) => x + w + pad >= v.x0 && x - pad <= v.x1 && y + h + pad >= v.y0 && y - pad <= v.y1;
  const w_ = o => o.w * 1.5;
  const THEME = { fire: '#b95c43', stone: '#b89c61', marsh: '#609a79', ghost: '#9784b1', steel: '#7d99aa' };

  const R = {
    hash, tint, rgba,

    // ---------------------------------------------------------------- ground
    ground(ctx, v, detail) {
      rect(ctx, v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0, '#8a9b68');
      const cell = 110;
      for (let gx = Math.floor(v.x0 / cell) - 1; gx <= Math.floor(v.x1 / cell); gx++) for (let gy = Math.floor(v.y0 / cell) - 1; gy <= Math.floor(v.y1 / cell); gy++) {
        for (let k = 0; k < 2; k++) {
          const x = (gx + hash(gx, gy, k)) * cell, y = (gy + hash(gy, gx, k + 7)) * cell;
          blob(ctx, x, y, 55 + hash(gx, gy, k + 3) * 70, hash(gx, gy, k + 5) > .5 ? '#a4b77b' : '#6f8355', .3);
        }
      }
      if (!detail) return;
      const step = 26, light = [], dark = [], flowers = [];
      for (let gx = Math.floor(v.x0 / step); gx <= Math.floor(v.x1 / step); gx++) for (let gy = Math.floor(v.y0 / step); gy <= Math.floor(v.y1 / step); gy++) {
        const r = hash(gx, gy, 1), x = (gx + hash(gx, gy, 2)) * step, y = (gy + hash(gx, gy, 3)) * step;
        if (r < .55) (r < .3 ? dark : light).push([x, y, hash(gx, gy, 4) - .5]);
        else if (r > .975) flowers.push([x, y, hash(gx, gy, 5)]);
      }
      for (const [list, color] of [[dark, '#6c7f4f'], [light, '#adbf84']]) {
        ctx.strokeStyle = color; ctx.lineWidth = 1.1; ctx.beginPath();
        for (const [x, y, d] of list) { ctx.moveTo(x, y); ctx.lineTo(x + d * 6, y - 5); ctx.moveTo(x + 2, y); ctx.lineTo(x + 2 + d * 5, y - 4); ctx.moveTo(x - 2, y + 1); ctx.lineTo(x - 2 + d * 5, y - 3); }
        ctx.stroke();
      }
      const petals = ['#efe9cf', '#e6cd6e', '#d99ab0', '#b9a5de'];
      for (const [x, y, r] of flowers) { ell(ctx, x, y, 1.7, 1.4, petals[Math.floor(r * 4) % 4]); ell(ctx, x, y, .6, .6, '#c89a2a'); }
    },

    forestFloor(ctx, v, st, detail) {
      ctx.save(); ctx.translate(st.cx, st.cy); ctx.rotate(st.rot);
      const g = ctx.createRadialGradient(0, 0, st.rx * .2, 0, 0, st.rx); g.addColorStop(0, 'rgba(38,64,45,.92)'); g.addColorStop(.8, 'rgba(52,82,56,.85)'); g.addColorStop(1, 'rgba(70,104,66,0)');
      ctx.scale(1, st.ry / st.rx); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, st.rx, 0, TAU); ctx.fill(); ctx.restore();
      for (let i = 0; i < 46; i++) {
        const a = hash(i, 11) * TAU, d = Math.sqrt(hash(i, 12)) * .9, lx = Math.cos(a) * d * st.rx, ly = Math.sin(a) * d * st.ry;
        const x = st.cx + lx * Math.cos(st.rot) - ly * Math.sin(st.rot), y = st.cy + lx * Math.sin(st.rot) + ly * Math.cos(st.rot);
        if (hits(v, x - 90, y - 90, 180, 180)) blob(ctx, x, y, 50 + hash(i, 13) * 40, i % 3 ? '#2c4a35' : '#5f7d46', .4);
        if (detail && hits(v, x - 60, y - 60, 120, 120)) for (let k = 0; k < 14; k++) ell(ctx, x + (hash(i, k, 20) - .5) * 100, y + (hash(i, k, 21) - .5) * 70, 3, 1.5, hash(i, k, 22) > .5 ? '#7a6a3a' : '#a07a3a', hash(i, k, 23) * 3);
      }
    },

    marshFloor(ctx, v, m, detail) {
      if (!hits(v, m.x - m.rx, m.y - m.ry, m.rx * 2, m.ry * 2, 30)) return;
      ctx.save(); ctx.translate(m.x, m.y); ctx.scale(1, m.ry / m.rx);
      const g = ctx.createRadialGradient(0, 0, m.rx * .15, 0, 0, m.rx * 1.05); g.addColorStop(0, 'rgba(70,104,92,.95)'); g.addColorStop(.75, 'rgba(88,122,98,.85)'); g.addColorStop(1, 'rgba(110,140,104,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, m.rx * 1.05, 0, TAU); ctx.fill(); ctx.restore();
      for (let i = 0; i < 9; i++) {
        const x = m.x + (hash(i, m.x) - .5) * m.rx * 1.3, y = m.y + (hash(i, m.y) - .5) * m.ry * 1.3, rx = 14 + hash(i, 3) * 22;
        ell(ctx, x, y, rx, rx * .45, 'rgba(120,168,160,.8)'); ell(ctx, x - rx * .2, y - rx * .12, rx * .55, rx * .18, 'rgba(210,235,225,.45)');
      }
      if (detail) for (let i = 0; i < 26; i++) {
        const x = m.x + (hash(i, 31) - .5) * m.rx * 1.6, y = m.y + (hash(i, 32) - .5) * m.ry * 1.6;
        line(ctx, x, y, x + 1, y - 9, '#b6c58a', 1.2); line(ctx, x + 3, y, x + 4, y - 7, '#8fa56c', 1.2);
      }
    },

    mountainFloor(ctx, v, detail) {
      const x0 = 1642, y0 = 288, w = 838, h = 330;
      if (!hits(v, x0, y0, w, h, 30)) return;
      rect(ctx, x0, y0, w, h, '#8d8a7b');
      for (let i = 0; i < 60; i++) blob(ctx, x0 + hash(i, 41) * w, y0 + hash(i, 42) * h, 40 + hash(i, 43) * 60, i % 3 ? '#a8a491' : '#6b695e', .35);
      for (let i = 0; i < 9; i++) blob(ctx, x0 + hash(i, 44) * w, y0 + hash(i, 45) * 90, 40 + hash(i, 46) * 40, '#e6ece8', .3);   // snow in the shade of the north ridge
      if (detail) for (let i = 0; i < 420; i++) { const x = x0 + hash(i, 47) * w, y = y0 + hash(i, 48) * h; ell(ctx, x, y, 1.5 + hash(i, 49) * 2, 1.1, hash(i, 50) > .5 ? '#b9b5a3' : '#625f56'); }
    },

    paddies(ctx, v) {
      const x0 = 1085, y0 = 1925, w = 450, h = 230; if (!hits(v, x0, y0, w, h)) return;
      for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) {
        const x = x0 + i * 90, y = y0 + j * 75, c = (i + j) % 2 ? '#9db26a' : '#92a860';
        rect(ctx, x, y, 90, 75, c);
        for (let k = 5; k < 75; k += 9) line(ctx, x + 4, y + k, x + 86, y + k, (i + j) % 2 ? '#869d52' : '#a9bc78', 1.4);
      }
    },

    habitat(ctx, v, h, s) {
      const x = h.x / s, y = h.y / s, r = h.radius / s;
      if (!hits(v, x - r, y - r, r * 2, r * 2, 20)) return;
      const col = { forest: '#2f5a3a', mountain: '#85897f', marsh: '#4d7d73', village: '#c0ad78', ruins: '#9c9484', grassland: '#b2bd72' }[h.kind] || '#8a9b68';
      blob(ctx, x, y, r * 1.15, col, .6);
      if (h.kind === 'mountain') for (let i = 0; i < 9; i++) ell(ctx, x + (hash(i, x) - .5) * r * 1.4, y + (hash(i, y) - .5) * r * 1.1, 4 + hash(i, 3) * 5, 3, '#6f7670');
      if (h.kind === 'marsh') for (let i = 0; i < 6; i++) ell(ctx, x + (hash(i, x) - .5) * r * 1.4, y + (hash(i, y) - .5) * r * 1.0, 10 + hash(i, 3) * 8, 4, 'rgba(150,190,180,.6)');
      if (h.kind === 'ruins') for (let i = 0; i < 5; i++) rect(ctx, x + (hash(i, x) - .5) * r * 1.4, y + (hash(i, y) - .5) * r, 12, 8, '#b0a690');
      if (h.kind === 'village') for (let i = 0; i < 4; i++) rect(ctx, x - r * .8, y - r * .5 + i * 14, r * 1.6, 3, '#d3bf86');
      if (h.kind === 'grassland') for (let i = 0; i < 14; i++) ell(ctx, x + (hash(i, x) - .5) * r * 1.6, y + (hash(i, y) - .5) * r * 1.3, 1.8, 1.4, ['#efe9cf', '#e6cd6e', '#d99ab0'][i % 3]);
    },

    // ---------------------------------------------------------------- roads
    roads(ctx, v, L, detail) {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const [width, color, alpha] of [[40, '#5d6b45', .22], [34, '#6e6a4c', .35], [28, '#c4b78b', 1], [20, '#d0c498', .8]]) {
        ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = width;
        for (const road of L.roads) { ctx.beginPath(); road.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); }
      }
      ctx.globalAlpha = 1;
      if (detail) for (const road of L.roads) for (let i = 1; i < road.length; i++) {
        const [x1, y1] = road[i - 1], [x2, y2] = road[i], n = Math.hypot(x2 - x1, y2 - y1) / 9;
        for (let k = 0; k < n; k++) { const t = k / n, x = x1 + (x2 - x1) * t + (hash(k, x1, 1) - .5) * 22, y = y1 + (y2 - y1) * t + (hash(k, y1, 2) - .5) * 22;
          if (hits(v, x, y, 1, 1)) ell(ctx, x, y, 1.6, 1.1, hash(k, x1, 3) > .5 ? '#a99b70' : '#e0d6b0'); }
      }
      ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
    },

    // ---------------------------------------------------------------- river
    river(ctx, v, L, detail) {
      const c = L.river.center, path = dx => { ctx.beginPath(); for (let y = -100; y <= 2700; y += 20) y === -100 ? ctx.moveTo(c(y) + dx, y) : ctx.lineTo(c(y) + dx, y); };
      ctx.lineJoin = 'round';
      for (const [w, col, a] of [[160, '#b9ad82', .35], [140, '#cfc294', .9], [122, '#8fbba3', 1], [108, '#3b6f80', 1], [90, '#4a8696', 1], [56, '#58a0ac', .8], [22, '#7cc3c6', .45]]) { ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = w; path(0); ctx.stroke(); }
      ctx.globalAlpha = .55; ctx.strokeStyle = '#eef6f0'; ctx.lineWidth = 2.2; ctx.setLineDash([9, 13]); path(-52); ctx.stroke(); path(52); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      ctx.lineJoin = 'miter';
      for (let y = Math.max(0, Math.floor(v.y0 / 46) * 46); y < Math.min(2600, v.y1 + 46); y += 46) {
        const x = c(y) + (hash(y, 5) - .5) * 60; ctx.strokeStyle = 'rgba(205,236,234,.7)'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(x - 16, y); ctx.quadraticCurveTo(x, y + 6, x + 16, y); ctx.stroke();
        if (detail && hash(y, 6) > .55) { ctx.strokeStyle = 'rgba(40,80,95,.5)'; ctx.beginPath(); ctx.moveTo(x - 5, y + 14); ctx.lineTo(x + 20, y + 15); ctx.stroke(); }
      }
      // boulders sitting in the rapids of the gorge
      for (let y = 300; y < 700; y += 53) { const x = c(y) + (hash(y, 7) - .5) * 70; ell(ctx, x + 3, y + 3, 11, 6, 'rgba(14,32,40,.35)'); ell(ctx, x, y, 10, 7, '#6f7a77'); ell(ctx, x - 2, y - 2, 6, 3.4, '#98a39d'); }
    },

    fords(ctx, L) {
      for (const f of L.river.fords) {
        const cx = L.river.center(f.y);
        rect(ctx, cx - 64, f.y - 24, 128, 48, 'rgba(0,0,0,0)');
        ell(ctx, cx, f.y, 66, 26, 'rgba(216,203,150,.9)'); ell(ctx, cx, f.y, 56, 20, '#8fcdc0'); ell(ctx, cx, f.y - 2, 44, 12, 'rgba(190,232,214,.75)');
        for (let i = -4; i <= 4; i++) { const x = cx + i * 12, y = f.y + (i % 2 ? 7 : -6); ell(ctx, x + 1.5, y + 2, 6, 3.4, 'rgba(18,48,48,.35)'); ell(ctx, x, y, 5.4, 3.6, '#a9ada3'); ell(ctx, x - 1, y - 1, 3, 1.8, '#d1d3c8'); }
        ctx.strokeStyle = 'rgba(240,250,245,.8)'; ctx.lineWidth = 1.4; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(cx - 44 + i * 22, f.y + 12); ctx.quadraticCurveTo(cx - 36 + i * 22, f.y + 8, cx - 28 + i * 22, f.y + 12); ctx.stroke(); }
      }
    },

    bridge(ctx, L, index) {
      const by = L.river.bridges[index], cx = L.river.center(by), x0 = cx - 105, y0 = by - 28, w = 210, h = 56, stone = index === 0;
      ell(ctx, cx, by + 36, 108, 12, 'rgba(10,30,40,.35)');
      if (stone) { // arch piers under the deck
        for (let i = 0; i < 3; i++) { const px = x0 + 30 + i * 75; rect(ctx, px - 6, by + 28, 12, 10, '#6c7570'); ctx.fillStyle = '#2c4650'; ctx.beginPath(); ctx.ellipse(px + 37, by + 30, 24, 10, 0, 0, Math.PI); ctx.fill(); }
        rect(ctx, x0, y0, w, h, '#cdc7ad'); rect(ctx, x0, y0 + h - 6, w, 6, '#8d9288');
        for (let i = 12; i < w; i += 18) line(ctx, x0 + i, y0, x0 + i, y0 + h - 6, 'rgba(110,112,96,.55)', 1);
        for (let j = 14; j < h - 6; j += 14) line(ctx, x0, y0 + j, x0 + w, y0 + j, 'rgba(110,112,96,.35)', 1);
        line(ctx, x0 + 6, by - 1, x0 + w - 6, by - 1, 'rgba(230,226,200,.7)', 3);
        for (const ry of [y0 - 8, y0 + h - 3]) { rect(ctx, x0 - 4, ry, w + 8, 9, '#6f7a76'); rect(ctx, x0 - 4, ry, w + 8, 3, '#a9b3ac'); for (let i = 6; i < w; i += 16) rect(ctx, x0 + i, ry - 4, 7, 5, '#8f9a93'); }
        for (const ex of [x0 - 8, x0 + w - 4]) for (const ey of [y0 - 14, y0 + h - 4]) { rect(ctx, ex, ey, 12, 14, '#7a8480'); rect(ctx, ex - 1, ey - 3, 14, 5, '#b7c0b8'); ell(ctx, ex + 6, ey - 5, 4, 3, '#c8cec4'); }
      } else { // timber deck with rope rails
        rect(ctx, x0, y0, w, h, '#8a6a47');
        for (let i = 0; i < w; i += 10) { rect(ctx, x0 + i, y0, 9, h, i % 20 ? '#9b7a52' : '#8a6a47'); line(ctx, x0 + i + 9, y0, x0 + i + 9, y0 + h, 'rgba(50,30,20,.5)', 1); }
        rect(ctx, x0, y0, w, 3, '#5a4330'); rect(ctx, x0, y0 + h - 3, w, 3, '#5a4330');
        for (const ry of [y0 - 3, y0 + h - 1]) { line(ctx, x0 - 4, ry, x0 + w + 4, ry, '#d3c08a', 2); for (let i = 0; i <= w; i += 30) rect(ctx, x0 + i - 2, ry - 7, 4, 14, '#5d4630'); }
      }
    },

    // ---------------------------------------------------------------- platforms / floors
    cliffs(ctx, v, M) {
      for (const c of M.cliffs) {
        const x = c.x / M.scale, y = c.y / M.scale, r = c.radius / M.scale, ry = r * .78, lift = Math.min(15, r * .26);
        if (!hits(v, x - r, y - r, r * 2, r * 2 + lift, 14)) continue;
        ell(ctx, x + 4, y + lift + 5, r * 1.04, ry, 'rgba(26,28,24,.32)');
        ell(ctx, x, y + lift, r, ry, '#555a53');                                   // cliff face (south side, in shade)
        for (let a = .15; a < Math.PI; a += .24) line(ctx, x + Math.cos(a) * r, y + Math.sin(a) * ry, x + Math.cos(a) * r, y + lift + Math.sin(a) * ry, 'rgba(25,30,28,.4)', 1.6);
        ell(ctx, x, y, r, ry, '#979a82');                                          // plateau top
        ell(ctx, x, y - 1, r * .9, ry * .88, '#a7a98d'); blob(ctx, x - r * .25, y - ry * .25, r * .7, '#e2e0c8', .45); blob(ctx, x + r * .3, y + ry * .2, r * .5, '#6f8a52', .35);
        ctx.strokeStyle = 'rgba(224,222,196,.75)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(x, y, r - 1, ry - 1, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
        for (let i = 0; i < 7; i++) ell(ctx, x + (hash(i, Math.round(x)) - .5) * r * 1.3, y + (hash(i, Math.round(y)) - .5) * ry * 1.2, 2.6, 1.8, i % 2 ? '#bcbaa4' : '#74786a');
      }
    },

    monasteryFloor(ctx, v, detail) {
      if (!hits(v, 285, 480, 450, 360, 30)) return;
      rect(ctx, 285, 480, 450, 360, '#b7b79b');
      // raked gravel gardens (concentric ripples)
      ctx.strokeStyle = 'rgba(120,124,104,.55)'; ctx.lineWidth = 1;
      for (const [gx, gy] of [[350, 560], [670, 560], [345, 780], [680, 780]]) for (let r = 8; r < 38; r += 6) { ctx.beginPath(); ctx.ellipse(gx, gy, r, r * .7, 0, 0, TAU); ctx.stroke(); }
      for (let y = 640; y < 828; y += 12) { line(ctx, 300, y, 392, y, 'rgba(120,124,104,.4)', 1); line(ctx, 628, y, 720, y, 'rgba(120,124,104,.4)', 1); }
      // main stone path: hall steps down to the gate
      rect(ctx, 400, 622, 220, 206, '#cfc9ae'); rect(ctx, 400, 622, 220, 4, '#e6e0c6');
      for (let y = 636; y < 828; y += 22) line(ctx, 400, y, 620, y, 'rgba(140,134,110,.55)', 1);
      for (let x = 400; x <= 620; x += 44) line(ctx, x, 622, x, 828, 'rgba(140,134,110,.4)', 1);
      for (let i = 0; i < 5; i++) { rect(ctx, 440 + i * 2, 618 + i * 0, 140 - i * 4, 3, '#e3dcc1'); }
      ell(ctx, 510, 735, 28, 20, '#a9ab94'); ctx.strokeStyle = '#7d8573'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(510, 735, 28, 20, 0, 0, TAU); ctx.stroke();
      for (let i = 0; i < 5; i++) { ell(ctx, 402, 650 + i * 30, 4, 4, '#e3b269'); ell(ctx, 620, 650 + i * 30, 4, 4, '#e3b269'); }
      ctx.strokeStyle = '#697971'; ctx.lineWidth = 3; ctx.strokeRect(290, 485, 440, 350);
    },

    cityFloor(ctx, v, detail) {
      if (!hits(v, 1030, 1030, 540, 540, 40)) return;
      rect(ctx, 1056, 1056, 488, 488, '#c3b99d');
      for (let ix = 0; ix < 15; ix++) for (let iy = 0; iy < 15; iy++) { const x = 1056 + ix * 32.5, y = 1056 + iy * 32.5; rect(ctx, x, y, 32.5, 32.5, hash(ix, iy, 9) > .5 ? 'rgba(255,248,224,.1)' : 'rgba(80,70,50,.07)'); }
      ctx.strokeStyle = 'rgba(120,112,90,.5)'; ctx.lineWidth = 1;
      for (let i = 0; i <= 15; i++) { line(ctx, 1056 + i * 32.5, 1056, 1056 + i * 32.5, 1544, 'rgba(120,112,90,.5)', 1); line(ctx, 1056, 1056 + i * 32.5, 1544, 1056 + i * 32.5, 'rgba(120,112,90,.5)', 1); }
      // axial avenues (lighter slabs) leading to the four gates + gate aprons outside
      rect(ctx, 1270, 1030, 60, 270, 'rgba(238,230,205,.55)'); rect(ctx, 1270, 1300, 60, 270, 'rgba(238,230,205,.5)');
      rect(ctx, 1030, 1272, 270, 56, 'rgba(238,230,205,.5)'); rect(ctx, 1300, 1272, 270, 56, 'rgba(238,230,205,.5)');
      rect(ctx, 1240, 1018, 120, 26, '#c9bf9f'); rect(ctx, 1268, 1556, 64, 22, '#c9bf9f'); rect(ctx, 1018, 1268, 26, 64, '#c9bf9f'); rect(ctx, 1556, 1274, 22, 52, '#c9bf9f');
      // collapsed section at the SW breach: scattered slabs
      for (let i = 0; i < 6; i++) rect(ctx, 1110 + hash(i, 3) * 60, 1546 + hash(i, 4) * 26, 9 + hash(i, 5) * 6, 5, i % 2 ? '#8e9690' : '#a7aaa0');
      // outer parapet shadow
      ctx.strokeStyle = 'rgba(30,38,40,.18)'; ctx.lineWidth = 8; ctx.strokeRect(1060, 1060, 480, 480);
    },

    temple(ctx, v) {
      const x = 1300, y = 1300; if (!hits(v, x - 180, y - 180, 360, 360)) return;
      ell(ctx, x + 6, y + 10, 166, 160, 'rgba(18,22,30,.35)'); ell(ctx, x, y, 160, 160, '#434d5b');
      for (const [r, c] of [[154, '#5a6577'], [124, '#4b5566'], [88, '#657189'], [52, '#546074']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = '#b6a4d2'; ctx.lineWidth = 2; for (const r of [154, 124, 88, 52]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); }
      for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; line(ctx, x + Math.cos(a) * 90, y + Math.sin(a) * 90, x + Math.cos(a) * 122, y + Math.sin(a) * 122, '#b6a4d2', 2); }
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8; ell(ctx, x + Math.cos(a) * 106, y + Math.sin(a) * 106, 5, 5, '#8c78b0'); }
      ctx.strokeStyle = '#e5ce87'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 28, 0, TAU); ctx.stroke(); ell(ctx, x, y, 18, 18, '#2f3745');
    },

    lairFloor(ctx, v, a, s) {
      const x = a.x / s, y = a.y / s, th = a.theme || 'steel', col = a.color || THEME[th], H = 118;
      if (!hits(v, x - 135, y - 135, 270, 270)) return;
      rect(ctx, x - 130, y - 130, 260, 260, '#4b514a'); rect(ctx, x - 112, y - 112, 224, 224, rgba(col, .22));
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) rect(ctx, x - 128 + i * 32, y - 128 + j * 32, 32, 32, hash(i, j, x) > .5 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.08)');
      ctx.strokeStyle = '#c8b997'; ctx.lineWidth = 2; for (const r of [42, 80, 112]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); }
      if (th === 'fire') { ctx.strokeStyle = '#e8803c'; ctx.lineWidth = 3; for (let i = 0; i < 8; i++) { const t = i * Math.PI / 4 + .2, px = x + Math.cos(t) * 40, py = y + Math.sin(t) * 40; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x + Math.cos(t + .1) * 78, y + Math.sin(t + .1) * 78); ctx.lineTo(x + Math.cos(t - .05) * 104, y + Math.sin(t - .05) * 104); ctx.stroke(); } blob(ctx, x, y, 60, '#ff7a30', .35); }
      if (th === 'stone') { for (let i = 0; i < 12; i++) { const t = i * TAU / 12; poly(ctx, [[x + Math.cos(t) * 50, y + Math.sin(t) * 50], [x + Math.cos(t + .22) * 90, y + Math.sin(t + .22) * 90], [x + Math.cos(t - .22) * 90, y + Math.sin(t - .22) * 90]], i % 2 ? '#7d7766' : '#8f8870'); } ctx.strokeStyle = '#e0c074'; ctx.lineWidth = 1.5; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(x, y, 30 + i * 12, i, i + 1.2); ctx.stroke(); } }
      if (th === 'marsh') { for (const [dx, dy, rx, ry] of [[-60, -20, 26, 14], [55, 45, 30, 16], [20, -70, 20, 12], [-30, 66, 24, 12], [78, -28, 14, 22]]) { ell(ctx, x + dx, y + dy, rx, ry, '#2c5a52'); ell(ctx, x + dx - 3, y + dy - 2, rx * .6, ry * .5, 'rgba(150,200,190,.5)'); } for (let i = -5; i <= 5; i++) rect(ctx, x + i * 16 - 6, y - 4, 12, 8, '#6d573f'); }
      if (th === 'ghost') { ctx.strokeStyle = '#a58fd0'; ctx.lineWidth = 1.5; for (let i = 0; i < 8; i++) { const t = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(x + Math.cos(t) * 52, y + Math.sin(t) * 52); ctx.lineTo(x + Math.cos(t + .3) * 74, y + Math.sin(t + .3) * 74); ctx.lineTo(x + Math.cos(t - .3) * 74, y + Math.sin(t - .3) * 74); ctx.closePath(); ctx.stroke(); } blob(ctx, x, y, 70, '#8f78c8', .28); }
      for (let i = 0; i < 8; i++) { const t = i * Math.PI / 4 + Math.PI / 8; ell(ctx, x + Math.cos(t) * 100, y + Math.sin(t) * 100, 3.5, 3.5, col); }
      // threshold plates in front of every gate on the ring wall
    },

    villageFloor(ctx, v, b) {
      const [cx, cy, hw, hh] = b; if (!hits(v, cx - hw, cy - hh, hw * 2, hh * 2, 40)) return;
      rect(ctx, cx - hw + 12, cy - hh + 10, hw * 2 - 24, hh * 2 - 20, '#b9a979');
      blob(ctx, cx, cy, hw * .9, '#d3c288', .35);
      for (let k = 0; k < 3; k++) rect(ctx, cx - hw + 5, cy + hh + 4 + k * 20, hw * .9, 16, k % 2 ? '#a0ac5d' : '#c2b871');
      for (let k = 0; k < 14; k++) line(ctx, cx - hw + 18 + hash(k, cx) * (hw * 2 - 36), cy - 2 + (hash(k, cy) - .5) * 40, cx - hw + 30 + hash(k, cx) * (hw * 2 - 60), cy - 2 + (hash(k, cy) - .5) * 40, 'rgba(120,100,60,.35)', 1.5);
    },

    steleFloor(ctx, v) {
      if (!hits(v, 2240, 1220, 200, 160, 30)) return;
      rect(ctx, 2255, 1235, 165, 135, '#a39a84');
      for (let i = 0; i < 10; i++) for (let j = 0; j < 8; j++) if (hash(i, j, 5) > .18) rect(ctx, 2257 + i * 16.4, 1237 + j * 16.5, 15, 15, hash(i, j, 6) > .5 ? '#b3ab94' : '#988f7a');
      blob(ctx, 2337, 1300, 50, '#c9b36a', .25);
    },

    // ---------------------------------------------------------------- props
    drawProp(ctx, o) {
      const k = o.kind; ctx.save();
      (R[k] || R.generic)(ctx, o);
      ctx.restore();
    },
    generic(ctx, o) { rect(ctx, o.x, o.y, o.w, o.h, '#7a7a70'); },

    wall(ctx, o) {
      const { x, y, w, h } = o, horizontal = w >= h, lair = o.kind === 'lair-wall', base = lair ? '#596460' : '#6d7a76';
      rect(ctx, x, y, w, h, base);
      if (horizontal) {
        rect(ctx, x, y, w, 3, '#9aa6a0'); rect(ctx, x, y + h - 3, w, 3, '#46524f');
        for (let z = 6; z < w; z += 14) line(ctx, x + z, y + 3, x + z, y + h - 3, 'rgba(30,40,40,.28)', 1);
        if (o.crenel || lair) for (let z = 2; z < w - 6; z += 16) { rect(ctx, x + z, y - 5, 9, 6, tint(base, .12)); rect(ctx, x + z, y - 5, 9, 2, '#b3ae96'); }
      } else {
        rect(ctx, x, y, 3, h, '#9aa6a0'); rect(ctx, x + w - 3, y, 3, h, '#46524f');
        for (let z = 6; z < h; z += 14) line(ctx, x + 3, y + z, x + w - 3, y + z, 'rgba(30,40,40,.28)', 1);
        if (o.crenel || lair) for (let z = 2; z < h - 6; z += 16) { rect(ctx, x - 1, y + z - 3, w + 2, 9, tint(base, .12)); rect(ctx, x - 1, y + z - 3, w + 2, 2.5, '#b3ae96'); }
      }
      if (lair) { const c = THEME[o.theme] || '#c8b997'; ctx.globalAlpha = .55; if (horizontal) rect(ctx, x, y + h - 2, w, 2, c); else rect(ctx, x + w - 2, y, 2, h, c); ctx.globalAlpha = 1; }
    },
    'lair-wall'(ctx, o) { R.wall(ctx, o); },

    'gate-post'(ctx, o) {
      rect(ctx, o.x + 1.5, o.y + o.h - 3, o.w, 4, 'rgba(18,28,22,.3)'); rect(ctx, o.x, o.y + 4, o.w, o.h - 4, '#be4f3e'); rect(ctx, o.x, o.y + 4, 2.5, o.h - 4, '#e0705a');
      rect(ctx, o.x - 2, o.y, o.w + 4, 5, '#3c3a3a'); rect(ctx, o.x - 1, o.y + 8, o.w + 2, 2.5, '#e3c36a');
    },

    building(ctx, o) { (R[o.style] || R.house)(ctx, o); },
    house(ctx, o) {
      const { x, y, w, h } = o, color = o.roof || '#875850', roofH = Math.round(h * .64), by = y + roofH - 4;
      rect(ctx, x + 4, y + h - 3, w, 5, 'rgba(20,32,25,.22)');
      rect(ctx, x + 3, by, w - 6, h - roofH + 4, '#dbc39a'); rect(ctx, x + 3, by, w - 6, 3, 'rgba(70,50,30,.25)'); rect(ctx, x + w - 9, by, 6, h - roofH + 4, 'rgba(90,60,40,.18)');
      rect(ctx, x + w / 2 - 4, y + h - 12, 8, 12, '#553e32');
      if (w > 50) { rect(ctx, x + 10, y + h - 14, 8, 8, '#e8c575'); rect(ctx, x + w - 18, y + h - 14, 8, 8, '#e8c575'); }
      poly(ctx, [[x - 4, by + 3], [x + w * .15, y], [x + w * .85, y], [x + w + 4, by + 3]], color, tint(color, -.4), 1.4);
      poly(ctx, [[x + w * .15, y], [x + w * .85, y], [x + w * .8, y + 4], [x + w * .2, y + 4]], tint(color, .25));
      ctx.strokeStyle = tint(color, -.3); ctx.lineWidth = 1; for (let z = 8; z < w - 4; z += 9) { ctx.beginPath(); ctx.moveTo(x + z, y + 5); ctx.lineTo(x + z - 2 + (z < w / 2 ? -3 : 3) * .3, by + 2); ctx.stroke(); }
      rect(ctx, x - 4, by + 2, w + 8, 2.5, 'rgba(0,0,0,.28)');
    },
    hall(ctx, o) {
      const { x, y, w, h } = o, color = o.roof || '#365d58';
      rect(ctx, x + 4, y + h - 3, w, 6, 'rgba(20,32,25,.25)');
      const bodyY = y + h * .52; rect(ctx, x + 6, bodyY, w - 12, h - h * .52, '#dcc8a0');
      for (let z = 12; z < w - 8; z += Math.max(18, w / 8)) rect(ctx, x + z, bodyY + 2, 4, h - h * .52 - 2, '#a8473a');
      rect(ctx, x + w / 2 - 7, y + h - 15, 14, 15, '#553e32');
      poly(ctx, [[x - 6, bodyY + 6], [x + 6, y + h * .3], [x + w - 6, y + h * .3], [x + w + 6, bodyY + 6]], tint(color, -.12), tint(color, -.45), 1.4);
      poly(ctx, [[x + w * .16, y + h * .32], [x + w * .26, y + 2], [x + w * .74, y + 2], [x + w * .84, y + h * .32]], color, tint(color, -.45), 1.4);
      poly(ctx, [[x + w * .26, y + 2], [x + w * .74, y + 2], [x + w * .72, y + 6], [x + w * .28, y + 6]], tint(color, .3));
      ctx.strokeStyle = tint(color, -.28); ctx.lineWidth = 1; for (let z = 10; z < w - 8; z += 10) { ctx.beginPath(); ctx.moveTo(x + z, y + h * .34); ctx.lineTo(x + z, bodyY + 4); ctx.stroke(); }
      rect(ctx, x + w * .26 - 5, y - 1, 8, 5, '#e3c36a'); rect(ctx, x + w * .74 - 3, y - 1, 8, 5, '#e3c36a');
    },
    pagoda(ctx, o) {
      const { x, y, w, h } = o, n = o.levels || 2, th = h / n; rect(ctx, x + 4, y + h - 3, w, 6, 'rgba(20,32,25,.25)');
      for (let i = 0; i < n; i++) {
        const tw = w * (1 - i * .2), tx = x + (w - tw) / 2, ty = y + h - (i + 1) * th, rc = i % 2 ? '#476b68' : '#365658';
        rect(ctx, tx + 6, ty + th * .45, tw - 12, th * .55, '#d8bd8c'); for (let z = 10; z < tw - 8; z += 14) rect(ctx, tx + z, ty + th * .5, 3.5, th * .5, '#a8473a');
        poly(ctx, [[tx - 5, ty + th * .5], [tx + 7, ty + 3], [tx + tw - 7, ty + 3], [tx + tw + 5, ty + th * .5]], rc, tint(rc, -.45), 1.3);
        rect(ctx, tx + 8, ty + 3, tw - 16, 2.5, tint(rc, .35));
      }
      line(ctx, x + w / 2, y + 2, x + w / 2, y - 10, '#eacb85', 2.5); ell(ctx, x + w / 2, y - 10, 2.6, 2.6, '#f4dc9a');
    },
    tower(ctx, o) {
      const { x, y, w, h } = o, c = THEME[o.theme] || '#6d7a76';
      rect(ctx, x + 3, y + h - 2, w, 5, 'rgba(20,28,28,.3)'); rect(ctx, x, y + 6, w, h - 6, '#6a716c'); rect(ctx, x, y + 6, 3, h - 6, '#98a29b'); rect(ctx, x + w - 3, y + 6, 3, h - 6, '#454e4c');
      for (let z = 4; z < h - 6; z += 8) line(ctx, x + 3, y + 6 + z, x + w - 3, y + 6 + z, 'rgba(30,40,40,.3)', 1);
      for (let z = 0; z < w; z += 8) rect(ctx, x + z, y + 1, 5, 6, '#8c948d');
      rect(ctx, x + w * .25, y + h * .45, w * .5, 3, '#202626'); rect(ctx, x + w * .25, y + h * .62, w * .5, h * .3, 'rgba(0,0,0,.18)');
      poly(ctx, [[x + 3, y + 8], [x + w / 2, y - 6], [x + w - 3, y + 8]], c, tint(c, -.5), 1.2);
      line(ctx, x + w / 2, y - 6, x + w / 2, y - 12, '#e8d89a', 1.5);
    },
    stall(ctx, o) {
      const { x, y, w, h } = o; rect(ctx, x + 2, y + h - 2, w, 4, 'rgba(20,32,25,.25)');
      rect(ctx, x + 2, y + h * .45, w - 4, h * .55, '#8f6f4c'); rect(ctx, x + 2, y + h * .45, w - 4, 2, '#b99668');
      for (let z = 0; z < w - 2; z += 7) rect(ctx, x + z, y, 7, h * .5, z % 14 ? '#e8dcb8' : '#b8483c');
      rect(ctx, x, y + h * .46, w, 2, 'rgba(0,0,0,.3)'); ell(ctx, x + w * .3, y + h * .42, 3.5, 2.5, '#d9a441'); ell(ctx, x + w * .65, y + h * .42, 3.5, 2.5, '#9bb45a');
    },
    well(ctx, o) {
      const { x, y, w, h } = o, cx = x + w / 2, cy = y + h * .6; ell(ctx, cx + 2, cy + 3, w * .55, h * .38, 'rgba(20,32,25,.28)'); ell(ctx, cx, cy, w * .5, h * .4, '#a9a595');
      ell(ctx, cx, cy - 1, w * .36, h * .27, '#38585e'); ctx.strokeStyle = '#e0cf9b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy, w * .5, h * .4, 0, 0, TAU); ctx.stroke();
      rect(ctx, x + 1, y - 6, 3, h * .6, '#6a4d38'); rect(ctx, x + w - 4, y - 6, 3, h * .6, '#6a4d38'); rect(ctx, x - 2, y - 9, w + 4, 4, '#875850');
    },
    lantern(ctx, o) {
      const { x, y, w, h } = o, cx = x + w / 2; ell(ctx, cx + 1, y + h, 6, 2.5, 'rgba(20,32,25,.3)');
      rect(ctx, cx - 4, y + h - 3, 8, 3, '#a9a595'); rect(ctx, cx - 2, y + 2, 4, h - 4, '#b5b19f'); rect(ctx, cx - 5, y - 4, 10, 6, '#c9c4ad'); rect(ctx, cx - 3, y - 3, 6, 4, '#f0c76a'); poly(ctx, [[cx - 6, y - 4], [cx, y - 9], [cx + 6, y - 4]], '#8c8f84');
    },
    pillar(ctx, o) {
      const { x, y, w, h } = o, th = o.theme, c = THEME[th];
      ell(ctx, x + w / 2 + 3, y + h, w * .7, 4, 'rgba(20,28,28,.32)'); rect(ctx, x - 1, y + h - 4, w + 2, 4, '#9ea39a'); rect(ctx, x + 1, y - 10, w - 2, h + 8, '#c5bca9'); rect(ctx, x + 1, y - 10, 3, h + 8, '#e6dfcc'); rect(ctx, x + w - 3, y - 10, 2, h + 8, '#9a927f');
      rect(ctx, x - 2, y - 15, w + 4, 6, '#8b8396');
      if (th === 'fire') { blob(ctx, x + w / 2, y - 20, 16, '#ff8a3a', .6); poly(ctx, [[x + w / 2 - 4, y - 14], [x + w / 2, y - 27], [x + w / 2 + 4, y - 14]], '#ff9a42'); poly(ctx, [[x + w / 2 - 2, y - 14], [x + w / 2, y - 22], [x + w / 2 + 2, y - 14]], '#ffe08a'); }
      else if (th === 'ghost') { blob(ctx, x + w / 2, y - 20, 14, '#9d7de0', .55); poly(ctx, [[x + w / 2 - 3, y - 14], [x + w / 2, y - 24], [x + w / 2 + 3, y - 14]], '#b99cf2'); }
      else if (c) rect(ctx, x + 1, y - 22, w - 2, 7, c);
    },
    'temple-pillar'(ctx, o) {
      const { x, y, w, h } = o, px = x + w / 2; ell(ctx, px + 3, y + h, w * .7, 4, 'rgba(14,18,28,.35)');
      rect(ctx, x - 1, y + h - 5, w + 2, 5, '#d0c4b4'); rect(ctx, x + 2, y - 18, w - 4, h + 14, '#8c78b0'); rect(ctx, x + 2, y - 18, 3, h + 14, '#b19cd4'); rect(ctx, x - 2, y - 23, w + 4, 6, '#e5ce87');
      blob(ctx, px, y - 6, 14, '#b69cff', .3);
    },
    stele(ctx, o) {
      const { x, y, w, h } = o, cx = x + w / 2; ell(ctx, cx + 2, y + h - 1, w * .8, 3.5, 'rgba(20,28,28,.3)');
      rect(ctx, x - 2, y + h - 5, w + 4, 5, '#7e7a6e'); poly(ctx, [[x, y + h - 5], [x, y + 4], [cx, y - 6], [x + w, y + 4], [x + w, y + h - 5]], '#aaa592', '#6d6a5e', 1.1);
      for (let i = 0; i < 3; i++) line(ctx, cx - 3, y + 6 + i * 6, cx + 3, y + 6 + i * 6, 'rgba(60,56,48,.6)', 1);
      if (o.theme === 'ghost') blob(ctx, cx, y + 8, 12, '#a58fd0', .3);
    },
    rock(ctx, o) {
      if (o.h > o.w * 1.7) { // tall ridge: a chain of stacked boulders, top first so lower ones overlap
        const seg = Math.max(w_(o), 22);
        for (let t = 0; t < o.h; t += seg * .8) R.rock(ctx, { ...o, y: o.y + t, h: Math.min(seg, o.h - t + 4) });
        return;
      }
      const { x, y, w, h } = o, big = Math.max(w, h) > 56, tone = o.theme === 'moss' ? ['#77866c', '#93a283', '#4f5c48'] : o.theme === 'stone' ? ['#8b8c84', '#b4b4a6', '#5b5d57'] : ['#78888c', '#a2b1b2', '#495b61'];
      if (!big) { // small boulder: rounded faceted blob with a shaded underside
        const cx = x + w / 2, cy = y + h * .56, rx = w / 2 + 2, ry = h * .5 + 1, ring = [];
        for (let k = 0; k < 10; k++) { const a = k / 10 * TAU, j = .86 + hash(Math.round(x), Math.round(y), k) * .22; ring.push([cx + Math.cos(a) * rx * j, cy + Math.sin(a) * ry * j]); }
        ell(ctx, cx + 3, y + h, rx, 4, 'rgba(18,28,24,.3)'); poly(ctx, ring, tone[2], tint(tone[2], -.3), 1.2);
        poly(ctx, ring.map(([px, py]) => [cx + (px - cx) * .92, cy + (py - cy) * .8 - 2]), tone[0]);
        poly(ctx, [[cx - rx * .6, cy - ry * .2], [cx - rx * .1, cy - ry * .8], [cx + rx * .35, cy - ry * .45], [cx - rx * .1, cy - ry * .1]], tone[1]);
        if (o.theme === 'moss') for (let j = 0; j < 4; j++) ell(ctx, cx + (hash(j, x) - .5) * rx, cy - ry * .5 + hash(j, y) * ry * .3, 5, 2.2, 'rgba(96,130,64,.65)');
        return;
      }
      const step = 26, pts = [[x, y + h]]; let i = 0;
      for (let t = 0; t <= w + .1; t += step, i++) pts.push([x + Math.min(w, t), y + 2 + hash(Math.round(x), Math.round(y), i) * 14]);
      pts.push([x + w, y + h]);
      ell(ctx, x + w / 2 + 4, y + h + 2, w / 2 + 3, 5, 'rgba(18,28,24,.3)');
      poly(ctx, pts, tone[0], tint(tone[2], -.2), 1.4);
      const fh = h * .42; ctx.save(); ctx.beginPath(); pts.forEach(([px, py], j) => j ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath(); ctx.clip();
      rect(ctx, x, y + h - fh, w, fh, tone[2]);
      ctx.strokeStyle = 'rgba(20,28,30,.35)'; ctx.lineWidth = 1.2; for (let z = 4; z < w; z += 7) { ctx.beginPath(); ctx.moveTo(x + z, y + h - fh); ctx.lineTo(x + z + hash(z, y) * 3, y + h); ctx.stroke(); }
      for (let t = 0; t < w; t += step * 2) poly(ctx, [[x + t, y + h - fh], [x + t + step, y + 3], [x + t + step * 1.6, y + h - fh]], tone[1]);
      ctx.restore();
      if (big && o.theme !== 'moss') for (let j = 1; j < pts.length - 1; j += 2) { const [px, py] = pts[j]; poly(ctx, [[px - 9, py + 11], [px, py - 1], [px + 10, py + 12], [px + 3, py + 8], [px - 3, py + 10]], '#e1e8dd'); }
      if (o.theme === 'moss') for (let j = 0; j < 6; j++) ell(ctx, x + hash(j, x) * w, y + 4 + hash(j, y) * h * .4, 6, 2.6, 'rgba(96,130,64,.6)');
    },
    ruin(ctx, o) {
      const { x, y, w, h } = o, horizontal = w >= h, n = Math.max(2, Math.round((horizontal ? w : h) / 10));
      for (let i = 0; i < n; i++) {
        const p = i / n, u = (horizontal ? w : h) * p, len = (horizontal ? w : h) / n + 1, top = hash(Math.round(x), Math.round(y), i) * 5;
        const bx = horizontal ? x + u : x, by = horizontal ? y : y + u;
        rect(ctx, bx, by, horizontal ? len : w, horizontal ? h : len, i % 2 ? '#a29a85' : '#b2aa94');
        if (horizontal) { rect(ctx, bx, by - top * .3, len, 2 + top * .3, '#d4cdb6'); rect(ctx, bx, by + h - 2, len, 2, '#6f6a5c'); } else { rect(ctx, bx, by, 2.5, len, '#d4cdb6'); rect(ctx, bx + w - 2.5, by, 2.5, len, '#6f6a5c'); }
      }
      for (let i = 0; i < 4; i++) ell(ctx, x + hash(i, x) * w, y + h + 1 + hash(i, y) * 3, 3.5, 2, '#8d8774');
      ell(ctx, x + w * .3, y + h * .3, 4, 2, 'rgba(104,140,70,.7)');
    },
    rubble(ctx, o) {
      const { x, y, w, h } = o; ell(ctx, x + w / 2 + 2, y + h - 1, w / 2, 4, 'rgba(20,28,24,.3)');
      for (let i = 0; i < 7; i++) { const px = x + hash(i, x) * (w - 8), py = y + h * .3 + hash(i, y) * (h * .6), s = 4 + hash(i, 5) * 6; poly(ctx, [[px, py + s * .8], [px + s * .3, py], [px + s, py + s * .2], [px + s * 1.1, py + s * .9]], i % 2 ? '#a69f8b' : '#8f8977', '#5d5a4e', 1); }
    },
    dike(ctx, o) {
      const { x, y, w, h } = o; ell(ctx, x + w / 2, y + h, w / 2, 3, 'rgba(20,28,24,.25)'); rect(ctx, x, y, w, h, '#8b7a54'); rect(ctx, x, y, w, Math.min(3, h), '#a3b86a');
    },
    fence(ctx, o) {
      const { x, y, w, h } = o, horizontal = w >= h;
      if (horizontal) { rect(ctx, x, y + 1, w, 2, '#b8a06a'); rect(ctx, x, y + h - 2, w, 2, '#a38b58'); for (let z = 2; z < w; z += 12) { rect(ctx, x + z, y - 5, 3.5, h + 8, '#8e7448'); rect(ctx, x + z, y - 5, 3.5, 2, '#c5ac7f'); } }
      else { rect(ctx, x + 1, y, 2, h, '#b8a06a'); rect(ctx, x + w - 2, y, 2, h, '#a38b58'); for (let z = 2; z < h; z += 12) { rect(ctx, x - 2, y + z, w + 4, 4, '#8e7448'); rect(ctx, x - 2, y + z - 1, w + 4, 1.5, '#c5ac7f'); } }
    },
    // ---------------------------------------------------------------- trees / bushes
    tree(ctx, t, snow) {
      const r = t.radius, seed = Math.round(t.x * 7 + t.y * 13), v = hash(seed), maple = v < .07;
      ell(ctx, t.x + 8, t.y + 12, r * 1.05, 8, 'rgba(24,40,31,.24)');
      rect(ctx, t.x - 4, t.y - 12, 8, 26, '#6a5440'); rect(ctx, t.x - 4, t.y - 12, 2.5, 26, '#8a6e52'); rect(ctx, t.x + 2, t.y - 12, 2, 26, '#4d3b2c');
      if (t.pine) {
        for (let j = 0; j < 4; j++) { const w = r - j * 4.5, yy = t.y - 4 - j * 14, c = j % 2 ? '#456a4d' : '#35573f'; poly(ctx, [[t.x - w, yy], [t.x, yy - 24], [t.x + w, yy]], c, '#2b4433', 1.2); poly(ctx, [[t.x, yy - 24], [t.x + w, yy], [t.x + w * .2, yy]], 'rgba(10,30,20,.28)'); if (snow) poly(ctx, [[t.x - w * .35, yy - 14], [t.x, yy - 24], [t.x + w * .35, yy - 14], [t.x + w * .1, yy - 16], [t.x - w * .1, yy - 12]], '#e6efe8'); }
      } else {
        const base = maple ? ['#a8532e', '#c46f35', '#e0a04a'] : v < .3 ? ['#3a6046', '#53784e', '#6f9560'] : ['#3e6348', '#567b51', '#719361'];
        ell(ctx, t.x, t.y - 18, r, r * .92, base[0]); ell(ctx, t.x + r * .3, t.y - 14, r * .6, r * .55, tint(base[0], -.18));
        ell(ctx, t.x - 7, t.y - 25, r * .72, r * .66, base[1]); ell(ctx, t.x - 12, t.y - 30, r * .38, r * .34, base[2]);
        for (let i = 0; i < 5; i++) ell(ctx, t.x + (hash(seed, i, 1) - .5) * r * 1.3, t.y - 18 + (hash(seed, i, 2) - .5) * r, 2.2, 1.6, base[2]);
      }
    },
    bush(ctx, b) {
      const r = b.radius, st = b.kind || 'bush';
      if (b.isBurned) { ell(ctx, b.x, b.y, r * .8, r * .4, 'rgba(40,34,30,.55)'); return; }
      if (st === 'bamboo') {
        ell(ctx, b.x + 3, b.y + r * .4, r * .9, r * .3, 'rgba(24,40,31,.22)');
        for (let i = 0; i < 6; i++) { const px = b.x + (i - 2.5) * r * .3, sw = (hash(i, Math.round(b.x)) - .5) * 5, top = b.y - r * 1.5 - hash(i, 4) * 12; line(ctx, px, b.y + r * .3, px + sw, top, i % 2 ? '#7aa04a' : '#5c8a3e', 2.6); for (let k = 1; k < 4; k++) line(ctx, px + sw * k / 4 - 1.4, b.y - k * r * .4, px + sw * k / 4 + 1.4, b.y - k * r * .4, '#3f6a30', 1); for (let k = 0; k < 3; k++) poly(ctx, [[px + sw, top + k * 6], [px + sw + 8, top + k * 6 - 3], [px + sw + 3, top + k * 6 + 3]], '#8fb85a'); }
        return;
      }
      if (st === 'reed') {
        ell(ctx, b.x + 2, b.y + r * .3, r * .8, r * .25, 'rgba(24,40,31,.2)');
        for (let i = 0; i < 7; i++) { const px = b.x + (i - 3) * r * .26, top = b.y - r * 1.4 - hash(i, Math.round(b.y)) * 10, sw = (hash(i, 3) - .5) * 6; line(ctx, px, b.y + r * .3, px + sw, top, i % 2 ? '#a7ad6a' : '#8c9858', 1.7); if (i % 3 === 0) ell(ctx, px + sw, top + 2, 1.8, 4.5, '#7a5a3e'); }
        return;
      }
      ell(ctx, b.x + 3, b.y + r * .35, r, r * .38, 'rgba(24,40,31,.22)');
      ell(ctx, b.x, b.y, r, r * .62, '#4f7440'); ell(ctx, b.x - r * .25, b.y - r * .12, r * .7, r * .46, '#66854b'); ell(ctx, b.x - r * .38, b.y - r * .22, r * .34, r * .24, '#86a862');
      ctx.strokeStyle = '#43683f'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(b.x, b.y, r, r * .62, 0, 0, TAU); ctx.stroke();
      for (let i = 0; i < 4; i++) ell(ctx, b.x + (hash(i, Math.round(b.x)) - .5) * r, b.y + (hash(i, Math.round(b.y)) - .5) * r * .5, 1.8, 1.8, i % 2 ? '#d8b15a' : '#e7d6c4');
    },

    // ---------------------------------------------------------------- composition
    labels(ctx, M, v) {
      ctx.textAlign = 'center'; ctx.lineJoin = 'round';
      for (const [name, x, y] of M.regions) { if (!hits(v, x - 160, y - 20, 320, 30)) continue; ctx.font = 'bold 22px Georgia'; ctx.strokeStyle = '#31463d'; ctx.lineWidth = 5; ctx.fillStyle = '#f5e8ba'; ctx.strokeText(name, x, y); ctx.fillText(name, x, y); }
      for (const a of M.lairs) { if (a.id === 'final_lair') continue; const x = a.x / M.scale, y = a.y / M.scale; ctx.font = 'bold 14px Georgia'; ctx.strokeStyle = '#2a2e2c'; ctx.lineWidth = 4; ctx.fillStyle = '#e6d5a6'; ctx.strokeText(a.name, x, y - H_LABEL); ctx.fillText(a.name, x, y - H_LABEL); }
      ctx.font = 'bold 16px Georgia'; ctx.strokeStyle = '#262a38'; ctx.lineWidth = 4; ctx.fillStyle = '#eddcc5'; ctx.strokeText('ĐIỆN THỜ YÊU THẦN • CẤM ĐỊA', 1300, 1122); ctx.fillText('ĐIỆN THỜ YÊU THẦN • CẤM ĐỊA', 1300, 1122);
      ctx.lineJoin = 'miter';
    },

    /** Everything that never changes during a match, in design units. v = visible design rect. */
    drawStatic(M, ctx, v, detail) {
      const L = M.layout, s = M.scale;
      R.ground(ctx, v, detail);
      for (const r of L.regions) for (const st of r.stands || []) R.forestFloor(ctx, v, st, detail);
      R.mountainFloor(ctx, v, detail);
      for (const m of L.regions.flatMap(r => r.marsh || [])) R.marshFloor(ctx, v, m, detail);
      R.paddies(ctx, v);
      for (const h of M.habitats) R.habitat(ctx, v, h, s);
      R.roads(ctx, v, L, detail);
      R.river(ctx, v, L, detail); R.fords(ctx, L);
      R.cliffs(ctx, v, M);
      R.monasteryFloor(ctx, v, detail); R.cityFloor(ctx, v, detail); R.steleFloor(ctx, v);
      for (const r of L.regions) if (r.settlement && r.id !== 'city' && r.id !== 'monastery') R.villageFloor(ctx, v, r.settlement);
      for (const a of M.lairs) R.lairFloor(ctx, v, a, s);
      R.temple(ctx, v);
      L.river.bridges.forEach((_, i) => R.bridge(ctx, L, i));
      // y-sorted solid props + trees (pawns are drawn on top of the whole map by the game renderer)
      const items = [];
      for (const o of M.obstacles) {
        if (o.kind === 'tree') continue;
        const d = { ...o, x: o.x / s, y: o.y / s, w: o.w / s, h: o.h / s };
        if (hits(v, d.x, d.y, d.w, d.h, 40)) items.push([d.y + d.h, 0, d]);
      }
      for (const t of M.trees) if (hits(v, t.x - t.radius, t.y - 60, t.radius * 2, 80, 10)) items.push([t.y + 14, 1, t]);
      items.sort((a, b) => a[0] - b[0]);
      for (const [, isTree, it] of items) { if (isTree) R.tree(ctx, it, it.y < 720 && it.x > 1560); else R.drawProp(ctx, it); }
    },

    /** Per-frame parts: bushes/reeds (they burn) and the temple seal. */
    drawDynamic(M, ctx, v) {
      for (const b of M.bushes) if (hits(v, b.x - b.radius, b.y - b.radius * 1.6, b.radius * 2, b.radius * 2.2, 4)) R.bush(ctx, b);
      R.seal(M, ctx, v); R.labels(ctx, M, v);
    },
    seal(M, ctx, v) {
      const x = 1300, y = 1300; if (!hits(v, x - 190, y - 190, 380, 380)) return;
      const remaining = M.remainingLords();
      ctx.save(); ctx.strokeStyle = remaining ? '#ffad80' : '#9adbbe'; ctx.lineWidth = remaining ? 4 : 2; ctx.shadowColor = remaining ? '#e27477' : '#9adbbe'; ctx.shadowBlur = remaining ? 8 : 0;
      ctx.setLineDash(remaining ? [10, 4] : []); ctx.beginPath(); ctx.arc(x, y, 166, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      if (remaining) for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
        ctx.save(); ctx.translate(x + Math.cos(angle) * 166, y + Math.sin(angle) * 166); ctx.rotate(angle);
        ctx.fillStyle = '#583e51'; ctx.strokeStyle = '#ffd9a7'; ctx.lineWidth = 2; ctx.fillRect(-6, -18, 12, 36); ctx.strokeRect(-6, -18, 12, 36);
        for (const offset of [-10, 0, 10]) { ctx.beginPath(); ctx.moveTo(-5, offset - 3); ctx.lineTo(5, offset + 3); ctx.stroke(); } ctx.restore();
      }
      ctx.restore(); ctx.fillStyle = remaining ? '#ffd3a6' : '#b1f1d4'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center';
      ctx.fillText(remaining ? 'PHONG ẤN • CÒN ' + remaining + ' YÊU VƯƠNG' : 'PHONG ẤN ĐÃ GIẢI', x, y + 145);
    }
  };
  const H_LABEL = 160;
  return R;
})();
