/**
 * minionArt.js - Hình vẽ canvas cho quái bậc Lâu La và Yêu Thú, khoá theo visual.type.
 * Dùng chung bộ công cụ vẽ với bossArt.js; màu lấy từ visual.bodyColor / detailColor / eyeColor.
 */
window.GameRenderer = window.GameRenderer || {};
(() => {
  const tint = m => ({ body: m.visual.bodyColor || '#888', det: m.visual.detailColor || '#ccc', eye: m.visual.eyeColor || '#fc6' });
  const K = ctx => window.GameRenderer.ArtKit(ctx);

  window.GameRenderer.MinionArt = {
    // Thỏ Gai
    beast(ctx, m, time) {
      const { poly, oval, line, shade } = K(ctx), { body, det, eye } = tint(m), hop = Math.abs(Math.sin(time * 5)) * 3;
      ctx.save(); ctx.translate(0, -hop);
      for (const x of [-12, -6, 0, 6]) poly([[x - 3, -22], [x, -32 + (x % 2)], [x + 3, -22]], det, 1.5);
      oval(-14, -9, 7, 6, '#fff', 1.8);
      oval(-2, -10, 17, 12, body); oval(2, -6, 9, 7, shade(body, -.1), 1);
      for (const x of [-4, 8]) oval(x, 2, 4, 3.5, shade(body, -.12), 1.8);
      oval(12, -17, 9, 8, body); oval(18, -15, 2.2, 1.8, '#e87aa0', 1);
      for (const [x, r] of [[8, -.2], [13, .15]]) { oval(x, -31, 3, 10, body, 1.8, r); oval(x, -31, 1.4, 7, '#f5b5c8', .5, r); }
      oval(14, -19, 2.2, 2.4, eye, 1); oval(14.5, -19.8, .8, .8, '#fff', .3); ctx.restore();
    },
    // Chuột Hầm Ngục
    rat(ctx, m, time) {
      const { poly, oval, line, tube, shade } = K(ctx), { body, det, eye } = tint(m), sw = Math.sin(time * 6) * 3;
      tube(-16, -4, -30, -8, -32 + sw, 4, -26, 6 + sw, 2.4, det);
      for (const x of [-8, 6]) oval(x, 3, 4, 3, shade(body, -.2), 1.5);
      oval(-2, -7, 17, 10, body); oval(-2, -4, 11, 5, shade(body, .35), 0);
      poly([[10, -14], [24, -9], [10, -1]], shade(body, .1)); oval(24, -9, 2, 1.8, '#e87aa0', 1);
      oval(8, -15, 5, 5.5, '#c99ab0', 1.8); oval(8, -15, 2.6, 3, '#8a5a78', 0);
      oval(15, -10, 1.9, 1.9, eye, 1); for (const y of [-10, -7]) line(20, y, 29, y - 2 + (y > -9 ? 4 : 0), '#e8dcc0', .9);
      poly([[19, -4], [20, -1], [22, -4]], '#fff', .8);
    },
    // Goblin Cầm Gậy
    humanoid(ctx, m, time) {
      const { poly, oval, line, shade } = K(ctx), { body, det, eye } = tint(m), st = Math.sin(time * 6) * 2;
      for (const s of [-1, 1]) { line(s * 5, 0, s * 5 + s * st, 11, shade(body, -.25), 4.5); oval(s * 5 + s * st, 11, 4, 2, '#2d2318', 1.2); }
      poly([[-9, -22], [9, -22], [11, -3], [-11, -3]], det); poly([[-10, -8], [10, -8], [8, 1], [-8, 1]], shade(det, -.3), 1.5);
      oval(0, -17, 9, 10, body, 2); line(-4, -20, 4, -20, shade(body, -.3), 1);
      line(-8, -18, -14, -10, body, 4.5); oval(-14, -9, 3, 3, body, 1.5);
      line(8, -19, 15, -26, body, 4.5); oval(16, -27, 3, 3, body, 1.5);
      line(16, -8, 14, -36, '#7a5233', 4); poly([[10, -38], [20, -38], [22, -30], [8, -30]], '#9a6b3f', 1.8); for (const x of [11, 15, 19]) line(x, -39, x, -41, '#cfc3a8', 1.5);
      oval(0, -29, 11, 10, body, 2);
      poly([[-9, -32], [-24, -39], [-11, -26]], body, 1.8); poly([[9, -32], [24, -39], [11, -26]], body, 1.8);
      for (const s of [-1, 1]) { oval(s * 4.5, -30, 2.6, 2.2, '#fff', 1); oval(s * 4.5, -30, 1.3, 1.6, eye, 0); }
      line(-4, -25, 4, -25, '#1d1a26', 1.5); poly([[-3, -25], [-2, -22], [-1, -25]], '#fff', .8); poly([[3, -25], [2, -22], [1, -25]], '#fff', .8);
    },
    // Khỉ Đá Rừng Rậm
    monkey(ctx, m, time) {
      const { poly, oval, line, tube, shade } = K(ctx), { body, det, eye } = tint(m), sw = Math.sin(time * 4) * 3;
      tube(-9, -2, -30, 6, -34, -22, -22, -20 + sw, 4, body);
      for (const s of [-1, 1]) { oval(s * 8, 7, 5.5, 4, shade(body, -.2), 1.8); oval(s * 14, -4, 4, 9, body, 1.8, s * .3); oval(s * 17, 3, 4, 3.4, shade(body, -.2), 1.5); }
      oval(0, -12, 13, 15, body); oval(0, -9, 8, 10, shade(body, .3), 0);
      for (const [x, y] of [[-6, -17], [4, -14], [-3, -6]]) line(x, y, x + 4, y + 2, det, 1.2);
      for (const s of [-1, 1]) oval(s * 12, -26, 5, 5, body, 1.8);
      oval(0, -26, 11, 10, body); oval(0, -24, 8, 6.5, '#d8c5ad', 1.5);
      for (const s of [-1, 1]) { oval(s * 4, -28, 2.4, 2, '#fff', 1); oval(s * 4, -28, 1.2, 1.4, eye, 0); }
      line(-6, -32, -2, -30, shade(body, -.4), 1.8); line(6, -32, 2, -30, shade(body, -.4), 1.8); line(-3, -21, 3, -21, '#3b2f2b', 1.5);
    },
    // Khung Xương Rỉ Sét
    skeleton(ctx, m, time) {
      const { poly, oval, line, glow, shade } = K(ctx), { body, det, eye } = tint(m), st = Math.sin(time * 6) * 2;
      for (const s of [-1, 1]) { line(s * 4, -4, s * 5 + s * st, 11, body, 3.2); oval(s * 5 + s * st, 11, 4, 1.8, body, 1); }
      oval(0, -6, 7, 4, body, 1.5); line(0, -22, 0, -8, body, 3);
      for (const y of [-20, -16, -12]) { line(-8, y, 8, y, '#1d1a26', 3.8); line(-8, y, 8, y, body, 2); }
      line(-8, -19, -15, -10, body, 2.6); line(7, -19, 13, -12, body, 2.6);
      ctx.save(); ctx.translate(15, -12); ctx.rotate(-.5 + Math.sin(time * 3) * .1); line(0, 4, 0, -22, '#6b5a3c', 2.5); line(-4, -2, 4, -2, '#6b5a3c', 3);
      poly([[-2.4, -3], [2.4, -3], [1.5, -26], [-1.5, -26]], '#b9b3a8', 1.4); line(-1, -4, -1, -22, det, 1.4); ctx.restore();
      oval(0, -30, 10, 10, '#e9e5da'); poly([[-6, -25], [6, -25], [5, -20], [-5, -20]], '#e9e5da', 1.5);
      oval(-4, -31, 3, 3.2, '#10131a', 1); oval(4, -31, 3, 3.2, '#10131a', 1); glow(-4, -31, 5, eye, .9); glow(4, -31, 5, eye, .9);
      poly([[-1.2, -27], [1.2, -27], [0, -24.5]], '#10131a', .8); for (const x of [-3, 0, 3]) line(x, -22, x, -20, '#10131a', .9);
    },
    // Nhện Đất Nhỏ / Nhện Bẫy Cát
    spider(ctx, m, time) {
      const { poly, oval, line, shade } = K(ctx), { body, det, eye } = tint(m);
      for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
        const y = -14 + i * 5, w = Math.sin(time * 6 + i * 1.7 + (s > 0 ? 1.5 : 0)) * 2, kx = s * (13 + (i % 2) * 3), tx = s * (22 + (i === 1 || i === 2 ? 3 : 0)) + w;
        ctx.strokeStyle = '#1d1a26'; ctx.lineWidth = 3.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s * 5, y); ctx.lineTo(kx, y - 8); ctx.lineTo(tx, y + 6); ctx.stroke();
        ctx.strokeStyle = shade(body, -.1); ctx.lineWidth = 2; ctx.stroke();
      }
      oval(0, -5, 10, 11, body, 2); oval(0, -4, 6, 7, det, 1.2); line(-4, -6, 4, -6, shade(det, -.4), 1); line(-4, -2, 4, -2, shade(det, -.4), 1);
      oval(0, -18, 7, 6.5, shade(body, .1));
      for (const [x, y, r] of [[-3, -20, 1.6], [3, -20, 1.6], [-5.5, -17.5, 1.1], [5.5, -17.5, 1.1]]) { oval(x, y, r, r, eye, .8); }
      poly([[-3, -13], [-2, -8], [-.5, -13]], '#f0e6d0', .9); poly([[3, -13], [2, -8], [.5, -13]], '#f0e6d0', .9);
    },
    // Bọ Cánh Cứng Bọc Giáp
    beetle(ctx, m, time) {
      const { poly, oval, line, tube, shade } = K(ctx), { body, det, eye } = tint(m), w = Math.sin(time * 7) * 2;
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const y = -8 + i * 6; line(s * 8, y, s * (17 + w * s * (i % 2 ? 1 : -1) * .3), y + 4 + i, '#1d1a26', 3.2); line(s * 8, y, s * (17), y + 4 + i, det, 1.8); }
      tube(0, -22, 0, -28, -2, -34, 6, -38, 2.4, det); tube(0, -22, 0, -28, 2, -34, -6, -38, 2.4, det);
      oval(0, -6, 14, 17, body, 2.2); line(0, -22, 0, 11, shade(body, -.4), 1.8);
      oval(-5, -9, 4, 7, shade(body, .4), 0); oval(5, -11, 2, 4, shade(body, .3), 0); for (const [x, y] of [[-8, 2], [8, 3], [-6, 8], [6, 8]]) oval(x, y, 1.1, 1.1, det, .5);
      oval(0, -23, 7, 6, det, 1.8); for (const s of [-1, 1]) { oval(s * 4, -24, 1.8, 1.8, eye, .8); }
    },
    // Thây Ma Rách Rưới
    zombie(ctx, m, time) {
      const { poly, oval, line, shade } = K(ctx), { body, det, eye } = tint(m), sh = Math.sin(time * 4) * 2;
      for (const s of [-1, 1]) { line(s * 4, -2, s * 4 + (s > 0 ? sh : -sh), 11, shade(body, -.3), 4.5); oval(s * 4 + (s > 0 ? sh : -sh), 11, 4.5, 2, '#2d2318', 1.2); }
      poly([[-9, -24], [9, -24], [11, -4], [7, -1], [3, -5], [-2, 0], [-6, -4], [-11, -1]], det);
      for (const y of [-19, -15, -11]) line(-5, y, 5, y, '#d9d2c0', 1.8);
      line(-8, -21, -18, -12 + sh, shade(body, -.1), 4); line(8, -21, 18, -14 - sh, shade(body, -.1), 4);
      oval(-19, -11 + sh, 3, 3, body, 1.4); oval(19, -13 - sh, 3, 3, body, 1.4);
      oval(0, -31, 10, 10.5, body, 2); poly([[-6, -37], [1, -39], [4, -35], [-3, -34]], shade(body, -.3), 1);
      for (const s of [-1, 1]) { oval(s * 4, -32, 2.8, 2.8, '#fff', 1); oval(s * 4, -32, 1, 1.2, '#10131a', 0); }
      poly([[-5, -26], [5, -26], [4, -22], [-4, -22]], '#2d1a1a', 1); for (const x of [-3, 0, 3]) line(x, -26, x, -23, '#e9e5da', 1);
      line(4, -22, 4, -17, '#9be26b', 1.2);
    },
    // Rắn Cỏ Đồng Cỏ
    snake(ctx, m, time) {
      const { poly, oval, line, tube, shade } = K(ctx), { body, det, eye } = tint(m), s = Math.sin(time * 4) * 3;
      tube(-26, 8, -14, -14 + s, -2, 22, 4, 2, 7, body); tube(4, 2, 12, -14, -4, -12 + s, 8, -26, 6, body);
      for (const [x, y] of [[-16, -1], [-8, 4], [0, 8], [6, -4]]) poly([[x - 2, y], [x, y - 3], [x + 2, y], [x, y + 3]], det, .8);
      poly([[4, -32], [16, -33], [20, -25], [8, -21], [3, -26]], body, 2); oval(12, -29, 2, 2, eye, .8); line(11, -29, 11, -29, '#10131a', 1);
      line(19, -24, 26, -22, '#e8426a', 1.3); line(26, -22, 29, -25, '#e8426a', 1.3); line(26, -22, 29, -19, '#e8426a', 1.3);
    },
    // Sói Hoang / Sói Đầu Đàn
    wolf(ctx, m, time) {
      const { poly, oval, line, tube, shade } = K(ctx), { body, det, eye } = tint(m), g = Math.sin(time * 7) * 3;
      tube(-18, -10, -34, -12, -36, -22 + g, -28, -26 + g, 6, body);
      for (const [x, ph] of [[-14, 0], [-6, 2], [9, 1], [18, 3]]) { const w = Math.sin(time * 7 + ph) * 4; line(x, -2, x + w, 10, '#1d1a26', 5.5); line(x, -2, x + w, 10, shade(body, -.2), 3.4); oval(x + w + 1, 11, 3, 1.6, '#1d1a26', 1); }
      oval(0, -11, 23, 11, body);
      if (m.visual.mane) { poly([[2, -19], [8, -31], [12, -22], [17, -32], [20, -19]], shade(body, .55), 1.8); }
      oval(-4, -8, 14, 6, shade(body, .3), 0);
      for (let i = 0; i < 3; i++) line(-14 + i * 5, -14, -12 + i * 5, -8, shade(body, -.3), 1.2);
      poly([[16, -22], [17, -33], [22, -26], [28, -32], [30, -22], [38, -16], [36, -9], [18, -9]], body, 2);
      poly([[32, -16], [40, -13], [36, -9]], shade(body, .35), 1.5); oval(40, -13, 1.8, 1.5, '#1d1a26', .5);
      poly([[20, -24], [20, -31], [24, -26]], '#e9a8b8', 1);
      oval(28, -19, 2.2, 1.7, eye, .8); poly([[34, -10], [35, -6.5], [36.5, -10]], '#fff', .8);
      if (m.visual.mane) line(30, -27, 33, -22, det, 1.2);
    },
    // Heo Rừng Gai Bọc Sắt
    boar(ctx, m, time) {
      const { poly, oval, line, tube, shade } = K(ctx), { body, det, eye } = tint(m), g = Math.sin(time * 6) * 2.5;
      for (const [x, ph] of [[-14, 0], [-5, 2], [8, 1], [16, 3]]) { const w = Math.sin(time * 6 + ph) * 3; poly([[x - 3, -4], [x + 3, -4], [x + 2.5 + w, 9], [x - 2.5 + w, 9]], shade(body, -.35), 1.4); line(x - 2.5 + w, 10, x + 2.5 + w, 10, '#1d1a26', 2.4); }
      tube(-24, -14, -32, -16, -32, -8, -28, -6, 2, shade(body, -.3));
      for (let i = 0; i < 6; i++) poly([[-20 + i * 6, -22], [-17 + i * 6, -32 - (i % 2) * 3], [-14 + i * 6, -22]], det, 1.5);
      oval(-2, -14, 24, 14, shade(body, 0)); oval(-4, -10, 15, 7, shade(body, .25), 0);
      poly([[-12, -24], [8, -24], [10, -16], [-14, -16]], shade(det, -.25), 1.6); for (const x of [-9, -3, 3]) oval(x, -20, 1, 1, '#dfe6ea', .5);
      oval(21, -12 + g * .2, 11, 9.5, shade(body, .08)); oval(29, -10, 5, 4.4, '#d9a08f', 1.8); oval(30, -11, 1, 1.2, '#1d1a26', 0); oval(28, -9, 1, 1.2, '#1d1a26', 0);
      poly([[26, -7], [34, -13], [30, -5]], '#f3ecd6', 1.6); poly([[18, -6], [22, -19], [26, -6]], '#f3ecd6', 1.4);
      poly([[15, -20], [18, -27], [22, -20]], shade(body, -.3), 1.5); oval(22, -15, 1.8, 1.6, eye, .8);
    },
    // Mãng Xà Đầm Lầy
    serpent(ctx, m, time) {
      const { poly, oval, line, glow, tube, shade } = K(ctx), { body, det, eye } = tint(m), s = Math.sin(time * 3) * 3;
      tube(-26, 8, -14, 2, -22, 14, -6, 8, 9, shade(body, -.25)); tube(-6, 8, 14, 6, 12, -4, 4 + s, -14, 10, body);
      for (const [x, y] of [[-18, 8], [-8, 8], [8, 2]]) poly([[x - 3, y], [x, y - 3], [x + 3, y], [x, y + 3]], det, .8);
      tube(4 + s, -12, 2 + s, -22, -2 + s, -26, 2 + s, -34, 8, body);
      poly([[2 + s, -46], [-10 + s, -34], [-6 + s, -26], [2 + s, -22], [10 + s, -26], [14 + s, -34]], shade(body, -.1), 2);
      oval(2 + s, -32, 4, 6, det, 1); oval(2 + s, -37, 5, 6, body, 1.8);
      glow(0 + s, -39, 5, eye, .8); oval(0 + s, -39, 1.6, 1.6, eye, .6); oval(4 + s, -39, 1.6, 1.6, eye, .6);
      line(2 + s, -32, 2 + s, -28, '#e8426a', 1.2); line(2 + s, -28, 0 + s, -26, '#e8426a', 1.1); line(2 + s, -28, 4 + s, -26, '#e8426a', 1.1);
    },
    // Cóc Lửa Nham Thạch
    toad(ctx, m, time) {
      const { poly, oval, line, glow, shade } = K(ctx), { body, det, eye } = tint(m), br = Math.sin(time * 3) * 1.2;
      glow(0, -8, 22, det, .25);
      for (const s of [-1, 1]) { oval(s * 15, 2, 8, 6, shade(body, -.2)); for (const k of [-4, 0, 4]) line(s * (19 + k * .4), 6, s * (22 + k * .5), 9, shade(body, -.4), 1.8); }
      oval(0, -8 + br, 18, 14, shade(body, 0)); oval(0, -2 + br, 11, 7, shade(det, .1), 1.5);
      ctx.strokeStyle = det; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-10, -14 + br); ctx.lineTo(-4, -8 + br); ctx.lineTo(-8, -3 + br); ctx.moveTo(8, -16 + br); ctx.lineTo(5, -9 + br); ctx.lineTo(11, -5 + br); ctx.stroke();
      for (const [x, y] of [[-12, -10], [12, -11], [-3, -17], [5, -3]]) oval(x, y + br, 1.8, 1.8, shade(body, -.35), 1);
      for (const s of [-1, 1]) { oval(s * 8, -21 + br, 5, 5.5, shade(body, .1)); oval(s * 8, -22 + br, 3.4, 3.8, '#fff6c8', 1.2); oval(s * 8, -22 + br, 1, 2.8, '#10131a', 0); }
      line(-12, -9 + br, 12, -9 + br, '#1d1a26', 2.2); poly([[-7, -9 + br], [-6, -6 + br], [-4, -9 + br]], '#fff', .8); poly([[7, -9 + br], [6, -6 + br], [4, -9 + br]], '#fff', .8);
    },
    // Hắc Báo Ám Ảnh
    panther(ctx, m, time) {
      const { poly, oval, line, glow, tube, shade } = K(ctx), { body, det, eye } = tint(m), g = Math.sin(time * 5) * 4;
      for (let i = 0; i < 3; i++) { const t = (time * 1.2 + i * .33) % 1; ctx.save(); ctx.globalAlpha = (1 - t) * .5; oval(-22 - t * 18, -8 + i * 2, 6 - t * 3, 3, det, 0); ctx.restore(); }
      tube(-20, -10, -36, -6, -38, -22 + g, -30, -24 + g, 5, body);
      for (const [x, ph] of [[-14, 0], [-6, 2], [10, 1], [19, 3]]) { const w = Math.sin(time * 6 + ph) * 4; line(x, -2, x + w, 9, '#0b0e12', 5); line(x, -2, x + w, 9, shade(body, .12), 3); }
      oval(0, -10, 23, 9.5, lin2(ctx, body)); oval(-6, -7, 13, 4, shade(body, .2), 0);
      for (const x of [-12, -4, 6]) { oval(x, -12, 2, 1.4, det, .5); }
      poly([[17, -19], [19, -29], [24, -22], [29, -28], [30, -18], [37, -14], [34, -7], [19, -7]], body, 2);
      poly([[21, -22], [21, -27], [24, -23]], shade(det, -.2), 1);
      glow(27, -16, 6, eye, .8); poly([[25, -17], [30, -17.5], [29, -14.5], [25, -15]], eye, .8); oval(36, -12, 1.6, 1.4, '#e9a8b8', .5); poly([[29, -8], [30, -5], [31.5, -8]], '#fff', .8);
    },
    // Gấu Băng Bắc Địa
    bear(ctx, m, time) {
      const { poly, oval, line, glow, shade } = K(ctx), { body, det, eye } = tint(m), g = Math.sin(time * 3) * 1;
      glow(0, -20, 28, det, .15);
      for (const s of [-1, 1]) { oval(s * 13, 3, 8, 8, shade(body, -.1)); for (const k of [-3, 0, 3]) poly([[s * (13 + k) - 1, 8], [s * (13 + k), 14], [s * (13 + k) + 1, 8]], det, 1); }
      oval(0, -14 + g, 25, 22, shade(body, 0)); oval(0, -10 + g, 15, 14, '#fff', 0);
      for (const s of [-1, 1]) { poly([[s * 14, -30], [s * 22, -42], [s * 26, -26]], det, 1.8); poly([[s * 20, -22], [s * 30, -32], [s * 30, -16]], shade(det, .3), 1.6); oval(s * 25, -3, 7, 6, shade(body, -.15)); for (const k of [-3, 0, 3]) poly([[s * (25 + k) - 1, 1], [s * (25 + k), 8], [s * (25 + k) + 1, 1]], det, 1); }
      for (const s of [-1, 1]) oval(s * 11, -37 + g, 5, 5, body, 2);
      oval(0, -29 + g, 15, 13, body, 2); oval(0, -25 + g, 8, 6, '#fff', 1.5); oval(0, -27 + g, 3, 2.2, '#1d1a26', .5);
      for (const s of [-1, 1]) { oval(s * 6, -31 + g, 2, 2.2, '#10131a', .5); }
      line(0, -25 + g, 0, -22 + g, '#1d1a26', 1.2); line(-3, -21 + g, 3, -21 + g, '#1d1a26', 1.2); glow(0, -29 + g, 20, eye, .1);
    },
    // Dơi Quỷ Hút Máu
    bat(ctx, m, time) {
      const { poly, oval, line, glow, shade } = K(ctx), { body, det, eye } = tint(m), f = Math.sin(time * 8) * 7;
      ctx.save(); ctx.translate(0, -16 + Math.sin(time * 4) * 2);
      for (const s of [-1, 1]) {
        poly([[s * 4, -6], [s * 18, -22 + f], [s * 32, -14 + f], [s * 28, -8 + f * .8], [s * 24, -2 + f * .5], [s * 18, -6 + f * .4], [s * 12, 2], [s * 7, 4]], shade(body, .05), 2);
        for (const [x, y] of [[18, -22 + f], [32, -14 + f], [24, -2 + f * .5]]) line(s * 5, -6, s * x, y, det, 1.2);
        poly([[s * 18, -22 + f], [s * 22, -26 + f], [s * 24, -20 + f]], '#1d1a26', 1);
      }
      oval(0, 0, 7, 10, body); oval(0, 2, 4, 6, shade(body, .3), 0);
      oval(0, -11, 6.5, 6, body, 1.8); poly([[-6, -14], [-8, -24], [-2, -16]], body, 1.6); poly([[6, -14], [8, -24], [2, -16]], body, 1.6);
      poly([[-5, -12], [-5.5, -19], [-3, -14]], '#e87a98', .6); poly([[5, -12], [5.5, -19], [3, -14]], '#e87a98', .6);
      for (const s of [-1, 1]) { glow(s * 2.6, -12, 4, eye, .9); oval(s * 2.6, -12, 1.2, 1.4, eye, .5); }
      poly([[-2.6, -7], [-2, -3], [-.8, -7]], '#fff', .7); poly([[2.6, -7], [2, -3], [.8, -7]], '#fff', .7); ctx.restore();
    },
    // Cua Đá Cổ Đại
    crab(ctx, m, time) {
      const { poly, oval, line, glow, shade } = K(ctx), { body, det, eye } = tint(m), c = Math.sin(time * 3) * 2;
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const w = Math.sin(time * 6 + i + (s > 0 ? 2 : 0)) * 2; line(s * 12, -2 + i * 4, s * (24 + w), 3 + i * 5, '#1d1a26', 3.4); line(s * 12, -2 + i * 4, s * (24 + w), 3 + i * 5, shade(body, -.15), 1.8); }
      for (const s of [-1, 1]) { line(s * 12, -14, s * 24, -26 + c, '#1d1a26', 5.5); line(s * 12, -14, s * 24, -26 + c, shade(body, -.1), 3.5);
        poly([[s * 20, -26 + c], [s * 22, -40 + c], [s * 29, -38 + c], [s * 34, -28 + c], [s * 28, -22 + c], [s * 25, -32 + c]], shade(body, .05), 2); line(s * 25, -33 + c, s * 30, -29 + c, det, 1.2); }
      poly([[-18, -12], [-11, -24], [10, -24], [18, -12], [14, 0], [-14, 0]], lin2(ctx, body), 2.2);
      poly([[-9, -19], [4, -22], [10, -11], [2, -4], [-11, -7]], shade(body, .15), 1.4);
      ctx.strokeStyle = det; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-7, -17); ctx.lineTo(0, -12); ctx.lineTo(-3, -6); ctx.moveTo(0, -12); ctx.lineTo(7, -13); ctx.stroke();
      glow(0, -11, 14, det, .3);
      for (const s of [-1, 1]) { line(s * 6, -22, s * 8, -30, '#1d1a26', 3); line(s * 6, -22, s * 8, -30, body, 1.5); oval(s * 8, -31, 3, 3, '#fff', 1.2); oval(s * 8, -31, 1.2, 1.4, eye, 0); }
    },
    // Ma Cây Rừng Già
    treant(ctx, m, time) {
      const { poly, oval, line, glow, tube, shade } = K(ctx), { body, det, eye } = tint(m), sw = Math.sin(time * 1.6) * 2;
      for (const s of [-1, 1]) tube(s * 6, 4, s * 14, 8, s * 20, 10, s * 26, 13, 5, shade(body, -.3));
      poly([[-9, -32], [-13, 0], [-9, 8], [9, 8], [13, 0], [9, -32]], lin2(ctx, body), 2.2);
      for (const x of [-5, 0, 6]) line(x, -28, x + 1, 2, shade(body, -.4), 1.3);
      for (const s of [-1, 1]) { tube(s * 8, -22, s * 16, -26, s * 22, -28, s * 28, -40 + sw, 4.5, shade(body, -.1)); tube(s * 20, -28, s * 26, -26, s * 30, -26, s * 36, -24 + sw, 2.4, shade(body, -.1)); oval(s * 30, -43 + sw, 6, 5, det, 1.6); }
      for (const [x, y, r] of [[-10, -36, 10], [10, -36, 10], [0, -44, 12], [-4, -34, 9]]) oval(x + sw * .3, y, r, r * .85, shade(det, x < 0 ? -.2 : 0), 2);
      oval(8, -48, 3, 2.4, shade(det, .4), 0);
      for (const s of [-1, 1]) { glow(s * 4.5, -19, 5, eye, .9); poly([[s * 2, -21], [s * 7, -22], [s * 7, -17], [s * 2.5, -18]], eye, .8); }
      line(-4, -10, 4, -10, '#1d1a26', 2); line(-1, -10, -1, -6, '#1d1a26', 1.3);
    }
  };
  // Nền gradient dọc dùng chung cho thân quái; tách riêng để không phụ thuộc kit.
  function lin2(ctx, color) {
    const { shade } = K(ctx), g = ctx.createLinearGradient(0, -30, 0, 8);
    g.addColorStop(0, shade(color, .22)); g.addColorStop(1, shade(color, -.25));
    return g;
  }
})();
