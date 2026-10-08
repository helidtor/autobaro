/**
 * bossArt.js - Hình vẽ canvas cho 13 boss (Yêu Tướng, Yêu Vương, Yêu Thần), khoá theo visual.type.
 * Gốc toạ độ ở chân boss, y âm hướng lên; monsterRenderer đã tịnh tiến và scale sẵn.
 */
window.GameRenderer = window.GameRenderer || {};
(() => {
  const O = '#1d1a26';
  const kit = ctx => {
    const poly = (pts, fill, w = 2) => { ctx.fillStyle = fill; ctx.strokeStyle = O; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); ctx.stroke(); };
    const oval = (x, y, rx, ry, fill, w = 2, rot = 0) => { ctx.fillStyle = fill; ctx.strokeStyle = O; ctx.lineWidth = w; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); };
    const line = (x, y, tx, ty, c, w = 2) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke(); };
    const glow = (x, y, r, c, a = .5) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore(); };
    const lin = (y0, y1, c0, c1) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; };
    const tube = (x0, y0, a, b, c, d, x1, y1, w, color, edge = O) => { ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.bezierCurveTo(a, b, c, d, x1, y1); ctx.strokeStyle = edge; ctx.lineWidth = w + 3; ctx.stroke(); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke(); };
    const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = c => Math.max(0, Math.min(255, Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
    return { poly, oval, line, glow, lin, tube, shade };
  };
  window.GameRenderer.ArtKit = kit;

  window.GameRenderer.BossArt = {
    // Thiết Giáp Tê Ngưu Vương
    rhino(ctx, m, time) {
      const { poly, oval, line, glow, lin, tube } = kit(ctx);
      const hide = m.visual.bodyColor || '#768695', st = Math.sin(time * 5) * 3, br = Math.sin(time * 3) * .8;
      tube(-24, -12, -38, -10, -40, 0 + st, -34, 8, 4, '#4a5a68');
      for (const [x, ph] of [[-16, 0], [-6, 2], [10, 1], [20, 3]]) { const sw = Math.sin(time * 5 + ph) * 3; poly([[x - 6, -4], [x + 6, -4], [x + 5 + sw, 10], [x - 5 + sw, 10]], '#4a5a68'); poly([[x - 6 + sw, 10], [x + 6 + sw, 10], [x + 7 + sw, 14], [x - 7 + sw, 14]], '#1f2a33', 1.5); }
      oval(-2, -14 + br, 28, 21, lin(-35, 7, '#8fa3b0', '#4f6270'), 2.5);
      for (const [x, y, w] of [[-16, -18, 9], [-2, -22, 10], [12, -20, 9]]) poly([[x - w, y + 16], [x - w + 2, y - 6], [x + w - 2, y - 6], [x + w, y + 16]], '#a9bcc6');
      for (const x of [-20, -8, 4, 16]) line(x, -30 + br, x + 3, -24 + br, '#2f3d48', 2);
      for (const x of [-14, 0, 14]) poly([[x - 4, -33 + br], [x, -42 + br], [x + 4, -33 + br]], '#d9c9a0', 1.5);
      poly([[16, -30], [38, -26], [40, -6], [20, -2]], lin(-30, -2, '#6c8190', '#44596a')); poly([[18, -34], [26, -42], [30, -32]], '#44596a');
      poly([[34, -20], [40, -52], [46, -18]], lin(-52, -18, '#f4ead0', '#bba77d'), 2); poly([[28, -18], [32, -32], [37, -18]], '#d9c9a0', 1.8);
      glow(31, -22, 6, '#ffb347', .8); oval(31, -22, 2.4, 2, '#ffb347', 1); oval(41, -8, 2, 2.4, '#1f2a33', 1);
      line(18, -12, 30, -8, '#1f2a33', 1.8);
    },

    // Đao Phủ Đoạt Mệnh
    golem(ctx, m, time) {
      const { poly, oval, line, glow, lin } = kit(ctx);
      const a = m.action, p = a ? Math.min(1, a.elapsed / a.duration) : 0, wind = a && !a.released, walk = Math.sin(time * 7) * Math.min(3, Math.hypot(m.vx || 0, m.vy || 0) / 35);
      glow(0, -30, 40, '#ff5a3c', .18 + Math.sin(time * 4) * .05);
      for (const s of [-1, 1]) { poly([[s * 5, -8 + s * walk], [s * 19, -8 + s * walk], [s * 21, 6], [s * 3, 6]], '#3b4352'); poly([[s * 1, 6 + s * walk], [s * 24, 6 + s * walk], [s * 26, 12], [s * -1, 12]], '#1f2530'); line(s * 12, -7, s * 12, 4, '#ff6a4a', 1.2); }
      poly([[-18, -12], [18, -12], [22, 12], [0, 6], [-22, 12]], '#8a3f3c'); line(-8, -10, -10, 8, '#5b2523', 1.5); line(8, -10, 10, 8, '#5b2523', 1.5);
      poly([[-22, -42], [22, -42], [19, -9], [-19, -9]], lin(-42, -9, '#454e5f', '#232a37'));
      for (const y of [-34, -26, -18]) line(-17, y, 17, y, '#171c26', 1.5);
      ctx.strokeStyle = '#ff7a5c'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-8, -38); ctx.lineTo(0, -28); ctx.lineTo(-4, -21); ctx.lineTo(6, -13); ctx.stroke();
      for (const s of [-1, 1]) { poly([[s * 18, -46], [s * 32, -44], [s * 30, -32], [s * 18, -34]], '#6d7889'); poly([[s * 22, -46], [s * 26, -58], [s * 30, -45]], '#a6afbc'); line(s * 19, -34, s * 22, -12, '#9aa5b3', 1.6); oval(s * 22, -10, 2, 2, '#9aa5b3', 1); }
      poly([[-14, -62], [-12, -72], [0, -76], [12, -72], [14, -62], [14, -44], [-14, -44]], '#262c3a'); poly([[-16, -60], [-6, -73], [0, -77], [6, -73], [16, -60], [0, -64]], '#3a4252');
      glow(0, -55, 14, '#ff4a3a', .5);
      poly([[-10, -58], [-3, -56], [-4, -52], [-10, -53]], '#ff7a5a', 1.2); poly([[10, -58], [3, -56], [4, -52], [10, -53]], '#ff7a5a', 1.2);
      line(-7, -46, 7, -46, '#10131a', 2);
      ctx.save(); ctx.translate(26, -26); ctx.rotate(wind ? -1.15 * (a.elapsed / a.windup) : a ? Math.sin(p * Math.PI) * 1.05 : .15);
      oval(0, 2, 5, 6, '#3d3b47'); line(3, 22, 3, -40, '#8a6240', 5);
      ctx.fillStyle = '#b4bfcb'; ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(2, -41); ctx.lineTo(22, -46); ctx.quadraticCurveTo(42, -30, 26, -12); ctx.lineTo(4, -22); ctx.lineTo(-9, -17); ctx.lineTo(-13, -35); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#ff6a4a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(23, -43); ctx.quadraticCurveTo(38, -30, 25, -15); ctx.stroke();
      glow(30, -28, 12, '#ff5a3c', wind ? .7 : .35); oval(5, -30, 3, 3, '#ff7a5a', 1); ctx.restore();
    },

    // Xà Tinh Đầm Lầy
    naga(ctx, m, time) {
      const { poly, oval, line, glow, lin, tube } = kit(ctx);
      const sw = Math.sin(time * 2.2) * 6, belly = '#d9e6a0', skin = '#1fa75a', dark = '#0d6b3a';
      glow(0, -30, 42, '#6bff6b', .12);
      tube(-4, -20, -40, -14, -34 + sw, 14, -10, 10, 14, dark); tube(-10, 10, 20, 14, 36 + sw, -4, 30, -14 + sw, 9, skin); poly([[27, -17 + sw], [38, -22 + sw], [32, -9 + sw]], dark);
      for (let i = 0; i < 6; i++) line(-30 + i * 5, -2 + (i % 2) * 10, -27 + i * 5, 3 + (i % 2) * 10, belly, 1.4);
      tube(0, -34, -2, -22, 2, -14, 0, -6, 18, skin); for (let i = 0; i < 4; i++) line(-6, -30 + i * 6, 6, -28 + i * 6, belly, 2);
      for (const s of [-1, 1]) { line(s * 8, -32, s * 22, -22, skin, 5); line(s * 22, -22, s * 28, -34 + s * sw * .3, skin, 4); poly([[s * 25, -34], [s * 31, -48], [s * 34, -34]], '#cfe2d0'); }
      poly([[-20, -50], [-34, -66], [-18, -70], [-8, -80], [0, -73], [8, -80], [18, -70], [34, -66], [20, -50]], dark);
      poly([[-14, -48], [-22, -62], [-8, -68], [0, -72], [8, -68], [22, -62], [14, -48]], '#1c8f50');
      line(-10, -56, -6, -66, '#e8c84a', 2); line(10, -56, 6, -66, '#e8c84a', 2); line(0, -54, 0, -70, '#e8c84a', 2);
      oval(0, -50, 11, 12, skin);
      for (const s of [-1, 1]) { oval(s * 5, -53, 3.2, 2.6, '#ffe36a', 1.2); line(s * 5, -55, s * 5, -51, '#10131a', 1.2); }
      line(-5, -44, 5, -44, '#10131a', 1.6); poly([[-4, -44], [-3, -39], [-1, -44]], '#fff'); poly([[4, -44], [3, -39], [1, -44]], '#fff');
      const d = (time * 1.5) % 1; ctx.save(); ctx.globalAlpha = 1 - d; oval(10 + d * 24, -41 + d * 14, 3, 4, '#9bff4a', 1); ctx.restore();
    },

    // Thống Lĩnh Nhân Mã
    centaur(ctx, m, time) {
      const { poly, oval, line, glow, lin, tube } = kit(ctx);
      const body = m.visual.bodyColor || '#833471', st = Math.sin(time * 6) * 4;
      tube(-22, -14, -42, -10, -44 + st, 6, -36, 10 + st, 5, '#3a2a30');
      for (const [x, ph] of [[-16, 0], [-7, 2], [10, 1], [19, 3]]) { const sw = Math.sin(time * 6 + ph) * 4; line(x, -2, x + sw, 12, '#2f2330', 5); poly([[x - 4 + sw, 12], [x + 4 + sw, 12], [x + 5 + sw, 15], [x - 5 + sw, 15]], '#d9c7a0', 1.5); }
      poly([[-26, -14], [-22, -22], [20, -22], [27, -14], [22, -2], [-22, -2]], lin(-22, -2, body, '#4a1d3f'));
      poly([[-10, -22], [12, -22], [10, -2], [-8, -2]], '#bda46b'); line(-10, -12, 12, -12, '#7a5a30', 1.5); line(0, -22, 0, -2, '#7a5a30', 1);
      poly([[18, -22], [25, -26], [28, -14], [20, -12]], body);
      for (const s of [0, 1, 2]) line(23 + s, -26 - s * 2, 28 + s * 2, -34 - s * 3, '#2a1c28', 3);
      poly([[8, -42], [24, -42], [26, -22], [6, -22]], lin(-42, -22, '#c9d1da', '#8d99a8')); line(8, -33, 26, -33, '#5d6978', 1.5);
      poly([[4, -42], [10, -52], [16, -42]], '#d9e2ea'); poly([[22, -42], [28, -50], [30, -40]], '#d9e2ea');
      oval(15, -49, 8, 9, '#d9a066'); poly([[6, -53], [10, -64], [24, -64], [24, -53], [15, -47]], '#8d99a8');
      line(15, -64, 12 + Math.sin(time * 5) * 2, -76, '#e3402f', 5); line(12, -76, 8 + Math.sin(time * 5) * 2, -82, '#e3402f', 3);
      oval(19, -49, 1.6, 1.6, '#10131a', 1); line(15, -43, 21, -43, '#7a4a2a', 1.5);
      oval(-4, -34, 11, 11, '#2d3a5c'); oval(-4, -34, 7, 7, '#8a2a3d', 1.5); oval(-4, -34, 2.4, 2.4, '#ffd166', 1);
      line(30, 8, 30, -66, '#7a5a3a', 3); poly([[26, -62], [30, -78], [34, -62]], '#e6eef5'); line(28, -56, 32, -56, '#e3402f', 3);
    },

    // Hắc Vu Cốt Tinh
    undead_mage(ctx, m, time) {
      const { poly, oval, line, glow, lin } = kit(ctx);
      const hv = Math.sin(time * 2) * 2, pu = '#8a4fff';
      ctx.save(); ctx.translate(0, 8); ctx.scale(1, .32); ctx.strokeStyle = pu; ctx.globalAlpha = .7; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.stroke(); ctx.rotate(time); ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(18, 0); ctx.moveTo(0, -18); ctx.lineTo(0, 18); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.translate(0, hv);
      poly([[-14, -34], [-22, 2], [-14, -2], [-9, 8], [-2, -1], [3, 9], [10, -1], [16, 6], [22, 2], [14, -34]], lin(-34, 8, '#2c1f4a', '#14102a'));
      glow(0, -20, 18, pu, .22);
      for (const y of [-26, -20, -14]) line(-6, y, 6, y, '#d9d2c0', 2);
      for (const s of [-1, 1]) { poly([[s * 12, -34], [s * 22, -30], [s * 20, -22], [s * 12, -26]], '#3b2a64'); line(s * 18, -26, s * 26, -16, '#d9d2c0', 2.5); }
      poly([[-14, -38], [-17, -52], [-8, -64], [8, -64], [17, -52], [14, -38], [0, -34]], '#241a3c');
      oval(0, -48, 9, 10, '#e7e1cf'); poly([[-6, -50], [-2, -50], [-3, -45], [-7, -46]], '#10131a', 1); poly([[6, -50], [2, -50], [3, -45], [7, -46]], '#10131a', 1);
      glow(-4.5, -48, 6, pu, .9); glow(4.5, -48, 6, pu, .9); for (const x of [-4, -1, 2, 5]) line(x, -41, x, -38, '#10131a', 1);
      line(26, 8, 26, -50, '#7a5a3a', 3.5); oval(26, -58 + Math.sin(time * 3) * 2, 7, 8, '#d9d2c0'); glow(26, -58, 14, '#7affc4', .7);
      oval(24, -60 + Math.sin(time * 3) * 2, 1.8, 2.2, '#10131a', 1); oval(28, -60 + Math.sin(time * 3) * 2, 1.8, 2.2, '#10131a', 1);
      ctx.restore();
      for (let i = 0; i < 3; i++) { const t = (time * .7 + i / 3) % 1; ctx.save(); ctx.globalAlpha = 1 - t; oval(-18 + i * 18, -10 - t * 40, 2, 3, '#b58bff', 1); ctx.restore(); }
    },

    // Tướng Quân Khỉ Đột
    ape(ctx, m, time) {
      const { poly, oval, line, glow, lin } = kit(ctx);
      const fur = '#2f3a3d', fur2 = '#58666b', br = Math.sin(time * 3) * 1;
      for (const s of [-1, 1]) { oval(s * 12, 0, 9, 11, fur); oval(s * 12, 8, 8, 4, '#1c2427', 1.5); }
      oval(0, -26 + br, 26, 26, lin(-52, 0, fur2, fur)); oval(0, -22 + br, 15, 17, '#77868b', 1.5);
      for (const s of [-1, 1]) { oval(s * 30, -22, 10, 22, fur, 2, s * .25); oval(s * 33, -3, 11, 10, '#232c2f'); for (const k of [-4, 0, 4]) line(s * (33 + k * .5), -9, s * (33 + k * .5), -3, '#8d9aa0', 1.2); }
      for (const s of [-1, 1]) { poly([[s * 17, -48], [s * 34, -46], [s * 36, -34], [s * 18, -32]], '#6d7889'); poly([[s * 22, -48], [s * 26, -60], [s * 31, -47]], '#a6afbc'); }
      poly([[-9, -20], [9, -20], [8, -6], [-8, -6]], '#7c3b35'); line(-9, -14, 9, -14, '#b75a4b', 1.5);
      oval(0, -52 + br, 15, 14, fur); oval(0, -48 + br, 10, 8, '#6f7d82', 1.5);
      poly([[-16, -56], [-14, -66], [-6, -72], [0, -76], [6, -72], [14, -66], [16, -56], [0, -60]], '#6d7889'); poly([[-2, -76], [0, -86], [2, -76]], '#e3402f');
      for (const s of [-1, 1]) { glow(s * 5, -54 + br, 6, '#ff3a3a', .8); oval(s * 5, -54 + br, 2.4, 1.8, '#ff6a5a', 1); poly([[s * 3, -53 + br], [s * 8, -58 + br], [s * 9, -56 + br]], '#1c2427', 1); }
      oval(0, -46 + br, 3, 2, '#1c2427', 1); line(-6, -42 + br, 6, -42 + br, '#1c2427', 1.5); poly([[-5, -42 + br], [-4, -38 + br], [-2, -42 + br]], '#fff', 1); poly([[5, -42 + br], [4, -38 + br], [2, -42 + br]], '#fff', 1);
      line(-4, -58 + br, 2, -48 + br, '#c8c1ae', 1.2);
    },

    // Viêm Ma Bạo Chúa
    demon_lord(ctx, m, time) {
      const { poly, oval, line, glow, lin, tube } = kit(ctx);
      const fl = Math.sin(time * 8) * 4;
      glow(0, -40, 54 + fl, '#ff8a2a', .35);
      for (const s of [-1, 1]) { poly([[s * 20, -58], [s * 56, -80 + fl], [s * 64, -52], [s * 48, -40], [s * 50, -22], [s * 30, -34]], '#7a1f1a'); line(s * 24, -56, s * 52, -44, '#ff7a3a', 1.2); line(s * 30, -50, s * 46, -28, '#ff7a3a', 1.2); }
      for (const s of [-1, 1]) { poly([[s * 6, -12], [s * 22, -12], [s * 24, 8], [s * 4, 8]], '#8a2a22'); poly([[s * 2, 6], [s * 26, 6], [s * 28, 12], [s * 0, 12]], '#2a1818'); }
      poly([[-24, -52], [24, -52], [20, -10], [-20, -10]], lin(-52, -10, '#d9482b', '#8d2118'));
      for (const y of [-40, -30, -20]) line(-14, y, 14, y, '#7a1a14', 1.5); line(0, -50, 0, -12, '#7a1a14', 1.5);
      ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, -46); ctx.lineTo(-2, -34); ctx.lineTo(-8, -24); ctx.lineTo(2, -14); ctx.stroke();
      for (const s of [-1, 1]) { oval(s * 28, -50, 11, 10, '#a82a1f'); poly([[s * 22, -56], [s * 28, -70], [s * 34, -56]], '#2a1818'); oval(s * 34, -24, 8, 16, '#c0392b', 2, s * .15); oval(s * 34, -6, 8, 8, '#8d2118'); }
      poly([[-14, -60], [-12, -72], [0, -78], [12, -72], [14, -60], [0, -50]], '#e0502e');
      poly([[-12, -70], [-30, -80], [-34, -100], [-20, -90], [-8, -76]], '#ffb347'); poly([[12, -70], [30, -80], [34, -100], [20, -90], [8, -76]], '#ffb347');
      for (const k of [-1, 0, 1]) poly([[k * 6 - 4, -76], [k * 6, -90 - fl - (k === 0 ? 6 : 0)], [k * 6 + 4, -76]], k === 0 ? '#ffd166' : '#ff8a2a', 1.5);
      for (const s of [-1, 1]) { glow(s * 6, -64, 8, '#fff3a3', .9); poly([[s * 2, -64], [s * 10, -67], [s * 9, -61]], '#fff3a3', 1.2); }
      poly([[-8, -55], [8, -55], [6, -50], [-6, -50]], '#2a1010', 1.5); for (const x of [-5, -2, 2, 5]) line(x, -55, x, -52, '#fff', 1.2);
      line(44, -10, 44, -52, '#4a3030', 6); poly([[34, -66], [58, -66], [60, -46], [32, -46]], '#c2531a'); line(34, -56, 58, -56, '#ffb347', 2); glow(46, -56, 18, '#ff7a1a', .5);
      for (let i = 0; i < 5; i++) { const t = (time * .8 + i * .2) % 1; ctx.save(); ctx.globalAlpha = 1 - t; oval(-30 + i * 15, -20 - t * 50, 2.4 - t, 3.5 - t * 2, '#ffb347', 1); ctx.restore(); }
    },

    // Cuồng Bạo Kim Cương Vương
    titan_ape(ctx, m, time) {
      const { poly, oval, line, glow, lin } = kit(ctx);
      const fur = '#2d3436', fur2 = '#636e72', cy = '#8ff5ff', br = Math.sin(time * 3) * 1.5;
      glow(0, -40, 50, cy, .18);
      for (const [x, y, h] of [[-26, -56, 22], [-14, -62, 28], [0, -64, 30], [14, -62, 28], [26, -56, 22]]) poly([[x - 6, y + 4], [x, y - h + 10], [x + 6, y + 4]], lin(y - h, y, '#d9ffff', '#3aa8c9'), 1.8);
      for (const s of [-1, 1]) oval(s * 14, 2, 11, 9, '#1c2427');
      oval(0, -30 + br, 36, 30, lin(-60, 0, fur2, fur));
      oval(0, -24 + br, 22, 22, '#8b979b', 1.8); for (const s of [-1, 1]) line(s * 4, -40 + br, s * 12, -22 + br, '#4a5558', 1.5);
      for (const s of [-1, 1]) { oval(s * 42, -22, 15, 28, fur, 2.5, s * .2); poly([[s * 36, -48], [s * 44, -66], [s * 50, -46]], lin(-66, -46, '#d9ffff', '#3aa8c9')); poly([[s * 46, -42], [s * 58, -52], [s * 56, -36]], lin(-52, -36, '#d9ffff', '#3aa8c9')); oval(s * 46, 0, 14, 12, '#232c2f'); for (const k of [-6, 0, 6]) line(s * (46 + k * .6), -8, s * (46 + k * .6), 0, '#8d9aa0', 1.5); }
      glow(0, -26 + br, 10, cy, .8); poly([[-5, -26 + br], [0, -34 + br], [5, -26 + br], [0, -18 + br]], '#d9ffff', 1.5);
      oval(0, -62 + br, 17, 16, fur); oval(0, -57 + br, 12, 10, '#7a888c', 1.8);
      for (const s of [-1, 1]) { glow(s * 6, -65 + br, 6, '#ff5a5a', .8); poly([[s * 2, -65 + br], [s * 10, -69 + br], [s * 10, -65 + br], [s * 3, -62 + br]], '#ff6a5a', 1); }
      poly([[-10, -50 + br], [10, -50 + br], [8, -44 + br], [-8, -44 + br]], '#1c2427', 1.5); poly([[-8, -50 + br], [-5, -43 + br], [-3, -50 + br]], '#fff', 1); poly([[8, -50 + br], [5, -43 + br], [3, -50 + br]], '#fff', 1);
      line(-6, -72 + br, -2, -66 + br, '#232c2f', 2); line(6, -72 + br, 2, -66 + br, '#232c2f', 2);
    },

    // Thanh Xà Đế Vương
    three_headed_hydra(ctx, m, time) {
      const { poly, oval, line, glow, lin, tube } = kit(ctx);
      const sk = '#10a37f', dk = '#08604b', belly = '#d9e6a0';
      glow(0, -30, 54, '#3bffb0', .14);
      tube(16, -6, 40, 0, 50, 8, 44, 12, 9, dk); tube(-16, -6, -40, 0, -50, 8, -44, 12, 9, dk);
      oval(0, -12, 30, 19, lin(-31, 7, sk, dk)); for (let i = -2; i <= 2; i++) oval(i * 9, -4, 4, 8, belly, 1.2);
      for (let i = 0; i < 6; i++) poly([[-24 + i * 9, -28 + Math.abs(i - 2.5) * 2], [-20 + i * 9, -36 + Math.abs(i - 2.5) * 2], [-16 + i * 9, -28 + Math.abs(i - 2.5) * 2]], '#08604b', 1.5);
      const heads = [[-26, -.55, 0, '#ff7a3a'], [0, 0, 2, '#3bffb0'], [26, .55, 4, '#7ad4ff']];
      heads.forEach(([bx, ang, ph, eye]) => {
        const sw = Math.sin(time * 3 + ph) * 8, hx = bx * 1.7 + sw, hy = -64 + Math.abs(bx) * -.25 + Math.cos(time * 2.4 + ph) * 3;
        tube(bx * .3, -18, bx * .6, -34, hx - bx * .2, hy + 26, hx, hy + 6, 9, sk);
        for (let i = 0; i < 3; i++) { const t = .3 + i * .25; line(bx * .3 + (hx - bx * .3) * t - 3, -20 + (hy - -20) * t, bx * .3 + (hx - bx * .3) * t + 3, -20 + (hy - -20) * t, belly, 1.5); }
        poly([[hx - 9, hy + 4], [hx - 14, hy - 10], [hx - 6, hy - 14], [hx, hy - 9], [hx + 6, hy - 14], [hx + 14, hy - 10], [hx + 9, hy + 4]], dk);
        oval(hx, hy, 9, 8, sk); poly([[hx - 7, hy + 2], [hx, hy + 12], [hx + 7, hy + 2]], '#0b7a5e');
        poly([[hx - 4, hy + 5], [hx - 3, hy + 10], [hx - 1.5, hy + 5]], '#fff', 1); poly([[hx + 4, hy + 5], [hx + 3, hy + 10], [hx + 1.5, hy + 5]], '#fff', 1);
        for (const s of [-1, 1]) { glow(hx + s * 4, hy - 2, 5, eye, .9); oval(hx + s * 4, hy - 2, 2.4, 2, '#ffe36a', 1); line(hx + s * 4, hy - 3.5, hx + s * 4, hy - .5, '#10131a', 1); }
        line(hx, hy + 11, hx - 1, hy + 16, '#e8426a', 1.3); line(hx - 1, hy + 16, hx - 4, hy + 19, '#e8426a', 1.3); line(hx - 1, hy + 16, hx + 2, hy + 19, '#e8426a', 1.3);
      });
    },

    // Lãnh Chúa Xương Vong Hồn
    floating_wraith(ctx, m, time) {
      const { poly, oval, line, glow, lin } = kit(ctx);
      const hv = Math.sin(time * 2) * 3, bl = '#3fa8ff';
      glow(0, -30, 50, bl, .22);
      ctx.save(); ctx.translate(0, hv);
      for (let i = 0; i < 5; i++) { const x = -22 + i * 11, w = Math.sin(time * 3 + i) * 3; poly([[x - 5, 0], [x + w, 14 + (i % 2) * 6], [x + 5, 0]], 'rgba(40,110,200,.75)', 1.5); }
      poly([[-26, -40], [-34, -2], [-18, 2], [18, 2], [34, -2], [26, -40]], lin(-40, 2, '#2a6cc4', '#0f2a66'));
      poly([[-16, -38], [-20, -4], [0, 0], [20, -4], [16, -38]], lin(-38, 0, '#16328a', '#0a1a4a')); line(-16, -34, -4, -4, '#e8c84a', 1.4); line(16, -34, 4, -4, '#e8c84a', 1.4);
      for (const y of [-30, -24, -18, -12]) line(-7, y, 7, y, '#dfe8f0', 2); line(0, -34, 0, -10, '#dfe8f0', 2);
      for (const s of [-1, 1]) { poly([[s * 20, -42], [s * 36, -40], [s * 34, -28], [s * 20, -30]], '#3a64b0'); line(s * 30, -30, s * 38, -14, '#dfe8f0', 2.5); for (const k of [0, 3, 6]) line(s * 38 + (s > 0 ? k * .3 : -k * .3), -14, s * 40 + k * .5 * s, -8, '#dfe8f0', 1.2); }
      oval(0, -52, 12, 13, '#eef0e8'); poly([[-8, -54], [-2, -54], [-3, -47], [-9, -49]], '#10131a', 1); poly([[8, -54], [2, -54], [3, -47], [9, -49]], '#10131a', 1);
      glow(-5, -51, 7, bl, .95); glow(5, -51, 7, bl, .95); for (const x of [-5, -2, 1, 4]) line(x, -43, x, -40, '#10131a', 1); poly([[-1.5, -48], [1.5, -48], [0, -44]], '#10131a', 1);
      poly([[-14, -60], [-17, -76], [-8, -68], [-4, -82], [0, -70], [4, -82], [8, -68], [17, -76], [14, -60]], '#e8c84a'); for (const x of [-9, 0, 9]) oval(x, -66, 1.8, 1.8, bl, 1);
      line(34, 6, 34, -62, '#8a8f9a', 3.5); oval(34, -66, 7, 7, '#cfe8ff'); glow(34, -68, 18, bl, .8);
      for (let i = 0; i < 3; i++) { const t = (time + i / 3) % 1; ctx.save(); ctx.globalAlpha = 1 - t; poly([[31 + i, -72 - t * 16], [34 + i * 2, -86 - t * 16], [37 + i, -72 - t * 16]], bl, 1); ctx.restore(); }
      ctx.restore();
    },

    // Thái Cổ Hỗn Độn Ma Long
    void_dragon(ctx, m, time) {
      const { poly, oval, line, glow, lin, tube } = kit(ctx);
      const a = m.action, charge = a?.kind === 'skill' && !a.released, flap = Math.sin(time * (charge ? 7 : 2.6)) * 8, vc = '#ad7fff';
      glow(0, -40, 80, vc, .2 + (charge ? .15 : 0));
      tube(10, 2, 46, 14, 66, -18, 92, 4, 11, '#39244f'); poly([[88, 8], [102, 2], [92, -6]], '#c3a0ff', 1.8);
      for (const s of [-1, 1]) {
        ctx.save(); ctx.scale(s, 1);
        poly([[13, -39], [57, -91 + flap], [86, -80 + flap], [76, -56], [64, -60], [58, -34], [44, -42], [36, -22], [24, -30], [16, -13]], lin(-91, -13, '#5b3d86', '#2d1d46'), 2.4);
        for (const [x, y] of [[57, -91 + flap], [76, -56], [58, -34], [36, -22]]) line(14, -38, x, y, '#b896ee', 2);
        for (const [x, y] of [[64, -76 + flap * .6], [54, -50], [40, -32]]) glow(x, y, 9, vc, .35);
        poly([[10, -36], [20, -52 + flap * .4], [24, -34]], '#2d1d46', 1.8);
        ctx.restore();
      }
      oval(0, -24, 25, 34, lin(-58, 10, '#68469a', '#2f1f4a'), 2.5, -.15);
      oval(-3, -20, 11, 26, '#bfb2d6', 2, -.15); for (let i = 0; i < 5; i++) line(-12, -38 + i * 10, 6, -36 + i * 10, '#8c78ab', 1.4);
      for (let i = 0; i < 4; i++) poly([[-4 + i * 2, -52 + i * 12], [2 + i * 2, -60 + i * 12], [6 + i * 2, -50 + i * 12]], '#c3a0ff', 1.5);
      for (const s of [-1, 1]) { poly([[s * 15, -9], [s * 29, 7], [s * 27, 17], [s * 10, 14]], '#4d345e'); for (let i = 0; i < 3; i++) poly([[s * (13 + i * 5), 13], [s * (14.5 + i * 5), 21], [s * (17 + i * 5), 13]], '#eadcf2', 1.2); }
      poly([[-15, -42], [-30, -62], [-20, -80], [0, -84], [26, -73], [34, -60], [12, -55], [9, -37]], lin(-84, -37, '#7c58a6', '#4d345e'));
      for (const s of [-1, 1]) { poly([[s * 10, -76], [s * 28, -104], [s * 5, -84]], '#e0d2ec', 1.8); poly([[s * 17, -70], [s * 38, -86], [s * 14, -76]], '#c3b0d9', 1.5); }
      glow(8, -69, 12, '#88f3ed', .9); poly([[2, -73], [16, -69], [6, -63]], '#bffcf6', 1.5);
      poly([[12, -58], [32, -60], [28, -54], [12, -54]], '#2a1a3a', 1.5); for (const x of [16, 21, 26]) poly([[x, -58], [x + 2, -52], [x + 4, -58]], '#fff', 1);
      if (charge) { glow(30, -57, 22 + Math.sin(time * 15) * 4, '#e3c7ff', .95); oval(30, -57, 5, 5, '#fff', 1); }
      for (let i = 0; i < 4; i++) { const t = (time * .6 + i * .25) % 1; ctx.save(); ctx.globalAlpha = 1 - t; oval(-30 + i * 20, -10 - t * 60, 2, 2, vc, 1); ctx.restore(); }
    },

    // Viêm Đế Phượng Hoàng
    solar_phoenix(ctx, m, time) {
      const { poly, oval, line, glow, lin, tube } = kit(ctx);
      const fl = Math.sin(time * 6) * 16, cols = ['#c1301f', '#e8572d', '#ffa63a'];
      glow(0, -40, 74, '#ffb347', .3 + Math.sin(time * 4) * .06);
      for (let i = 0; i < 5; i++) { const x = (i - 2) * 8, w = Math.sin(time * 4 + i) * 5; tube(x * .4, -14, x + w, 2, x * 1.8 + w, 12, x * 2 + w, 24 - Math.abs(i - 2) * 3, 6, i % 2 ? '#ffa63a' : '#e8572d'); }
      for (const s of [-1, 1]) for (let r = 2; r >= 0; r--) {
        const sp = 1 - r * .18, ang = fl * (1 - r * .3);
        poly([[s * 10, -34], [s * (50 * sp), -66 * sp + ang], [s * (92 * sp), -48 * sp + ang * .6], [s * (84 * sp), -24 * sp + ang * .3], [s * (60 * sp), -14], [s * 20, -16]], cols[r], 2.2);
        for (let k = 0; k < 4; k++) line(s * (20 + k * 18 * sp), -28 - k * 4, s * (30 + k * 20 * sp), -52 * sp + ang * (k / 4) - k * 3, '#ffe1a0', 1.5);
      }
      oval(0, -30, 18, 28, lin(-58, -2, '#ffe28a', '#ff8a2a'), 2.5); oval(0, -22, 10, 16, '#fff3c4', 1.5);
      for (const s of [-1, 1]) { line(s * 6, -4, s * 10, 12, '#ff8a2a', 4); for (const k of [-3, 0, 3]) line(s * 10, 12, s * 10 + k, 18, '#d9902a', 1.8); }
      oval(0, -56, 11, 11, '#ffe28a', 2.2);
      poly([[8, -58], [24, -54], [8, -48]], '#ff8a2a', 1.8); line(8, -54, 22, -54, '#a8450f', 1);
      glow(-3, -59, 6, '#fff', .9); oval(-3, -59, 2.6, 3, '#1d1a26', 1); oval(-2.4, -60, 1, 1, '#fff', .5);
      for (const [x, h, c] of [[-8, 18, '#e8572d'], [-3, 24, '#ffa63a'], [3, 22, '#ffd166'], [8, 16, '#e8572d']]) poly([[x - 3, -64], [x + Math.sin(time * 6 + x) * 3, -64 - h], [x + 3, -64]], c, 1.5);
      for (let i = 0; i < 6; i++) { const t = (time * .9 + i * .17) % 1; ctx.save(); ctx.globalAlpha = 1 - t; oval(-40 + i * 16, -20 - t * 50, 2.2 - t, 3.2 - t * 2, '#ffd166', 1); ctx.restore(); }
    },

    // Tru Tiên Thần Cây Cổ Đại
    ancient_world_tree(ctx, m, time) {
      const { poly, oval, line, glow, lin, tube } = kit(ctx);
      const sw = Math.sin(time * 1.5) * 2.5, bark = '#6b543d';
      glow(0, -50, 70, '#8aff9a', .16);
      for (const s of [-1, 1]) for (const [x1, y1, w] of [[44, 14, 9], [34, 20, 6]]) tube(s * 8, -4, s * 16, 8, s * (x1 - 12), y1 - 6, s * x1, y1, w, '#4f3d2b');
      poly([[-12, -42], [-16, -6], [-10, 4], [10, 4], [16, -6], [12, -42]], lin(-42, 4, '#7d6448', '#4a3a29'));
      for (const x of [-8, 0, 8]) line(x, -38, x + (x ? x * .2 : 0), 0, '#3d2f20', 1.4);
      tube(-10, -34, -30, -40, -40 + sw, -52, -46 + sw, -62, 7, bark); tube(10, -34, 30, -40, 40 + sw, -52, 46 + sw, -62, 7, bark); tube(0, -40, -2, -52, 6, -60, 8 + sw, -72, 6, bark);
      for (const [x, y, r, c] of [[-44, -62, 14, '#2f6b43'], [44, -62, 14, '#2f6b43'], [-30, -70, 17, '#3d8a55'], [30, -70, 17, '#3d8a55'], [0, -76, 19, '#48a063'], [-14, -62, 15, '#3d8a55'], [14, -62, 15, '#3d8a55']]) oval(x + sw * .6, y, r, r * .85, c, 2.2);
      for (let i = 0; i < 6; i++) { const x = -34 + i * 14, hang = 12 + (i % 3) * 6; tube(x, -50, x + 2, -44, x - 2, -40, x + Math.sin(time * 2 + i) * 3, -50 + hang, 2, '#3d8a55'); }
      for (const [x, y] of [[-26, -66], [22, -76], [38, -60], [-6, -84]]) { glow(x, y, 8, '#fff3a3', .8); oval(x, y, 2.6, 2.6, '#fff3a3', 1); }
      poly([[-9, -26], [-3, -28], [-4, -22], [-10, -22]], '#10131a', 1.2); poly([[9, -26], [3, -28], [4, -22], [10, -22]], '#10131a', 1.2);
      glow(-6, -24, 8, '#adf6a5', .9); glow(6, -24, 8, '#adf6a5', .9); oval(-6, -24, 2.4, 1.8, '#d9ffd0', 1); oval(6, -24, 2.4, 1.8, '#d9ffd0', 1); line(-5, -12, 5, -12, '#2a2014', 2);
      for (let i = 0; i < 6; i++) { const t = (time * .5 + i * .17) % 1; ctx.save(); ctx.globalAlpha = Math.sin(t * Math.PI); oval(-50 + i * 20 + Math.sin(time + i) * 4, -16 - t * 70, 1.6, 1.6, '#e6ff9a', 1); ctx.restore(); }
    },

    // U Minh Diêm La Vương
    death_god(ctx, m, time) {
      const { poly, oval, line, glow, lin, tube } = kit(ctx);
      const hv = Math.sin(time * 2) * 2, gr = '#57e7d4';
      glow(0, -28, 50, gr, .18);
      for (let i = 0; i < 3; i++) { const a = time * .5 + i * Math.PI * 2 / 3, x = Math.cos(a) * 32, y = -14 + Math.sin(a) * 12; glow(x, y - 8, 14, gr, .5); poly([[x - 4, y], [x - 6, y - 11], [x, y - 17], [x + 7, y - 5], [x + 4, y]], '#71e3d3', 1.5); oval(x - 1, y - 8, 1.2, 1.5, '#10131a', .5); }
      ctx.save(); ctx.translate(0, hv);
      for (let i = 0; i < 4; i++) { const w = Math.sin(time * 3 + i) * 3, x = -20 + i * 13; poly([[x - 6, 4], [x + w, 14 + (i % 2) * 5], [x + 6, 4]], 'rgba(30,70,80,.85)', 1.5); }
      poly([[-14, -32], [-28, 8], [-14, 4], [0, 12], [14, 4], [28, 8], [14, -32]], lin(-32, 12, '#2b5560', '#10282f'));
      poly([[-6, -34], [6, -34], [10, 6], [-10, 6]], '#8c2a2a'); line(-6, -34, -10, 6, '#e8c84a', 1.6); line(6, -34, 10, 6, '#e8c84a', 1.6);
      for (const s of [-1, 1]) { poly([[s * 12, -34], [s * 28, -30], [s * 30, -12], [s * 18, -12]], '#244a55'); line(s * 28, -30, s * 30, -12, '#e8c84a', 1.6); }
      oval(0, -44, 12, 13, '#dce9e2'); poly([[-9, -48], [-3, -48], [-4, -40], [-9, -42]], '#10131a', 1); poly([[9, -48], [3, -48], [4, -40], [9, -42]], '#10131a', 1);
      glow(-5, -45, 7, gr, .95); glow(5, -45, 7, gr, .95); poly([[-1.5, -42], [1.5, -42], [0, -38]], '#10131a', 1); for (const x of [-5, -2, 1, 4]) line(x, -35, x, -32, '#10131a', 1);
      { const w = Math.sin(time * 4) * 2; poly([[-6, -37], [6, -37], [4 + w, -24], [w * 1.5, -12], [-4 + w, -24]], gr, 1.5); glow(0, -24, 10, gr, .5); }
      poly([[-16, -52], [-22, -66], [-10, -62], [0, -72], [10, -62], [22, -66], [16, -52]], '#161c24'); poly([[-12, -54], [-14, -62], [14, -62], [12, -54]], '#e8c84a', 1.5);
      line(-22, -64, -34, -64, '#161c24', 3.5); line(22, -64, 34, -64, '#161c24', 3.5); oval(-35, -64, 2.6, 2.6, '#e8c84a', 1); oval(35, -64, 2.6, 2.6, '#e8c84a', 1);
      ctx.save(); ctx.translate(30, -14 + Math.sin(time * 3) * 2); poly([[-9, -12], [9, -12], [9, 12], [-9, 12]], '#6b4fb8'); ctx.strokeStyle = '#bff6e8'; ctx.lineWidth = 1; ctx.strokeRect(-6, -9, 12, 18); for (const y of [-5, 0, 5]) line(-3, y, 3, y, '#e1e8bd', 1); ctx.restore();
      line(-30, -10, -22, -52, '#8a6a3a', 2.5); poly([[-26, -52], [-22, -62], [-18, -52]], '#161c24', 1.5);
      ctx.restore();
    }
  };
})();
