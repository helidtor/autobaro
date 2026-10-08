/**
 * pawnSkinsExtra.js - 50 skin nhân vật nữa (anime, phim, nổi tiếng), nối tiếp 20 skin của pawnSkins.js.
 * Dùng chung bộ vẽ S.kit và vài preset hook nhỏ bên dưới để mỗi nhân vật chỉ vài dòng.
 */
(function () {
  const S = window.GameRenderer.PawnSkins, K = S.kit, O = '#1e272e', PI = Math.PI, gold = '#f2b705';

  // ---- preset hook: (ctx, c) => void; c = {y: tâm đầu, r, t, skin, hair} ----
  const run = (...fns) => (ctx, c) => fns.forEach(f => f(ctx, c));
  const spiky = (col, n, len, fd = 11, a0, a1) => (ctx, c) => { const k = K(ctx, c); k.spikes(col, n, len, a0, a1); k.cap(col, fd); };
  const capH = (col, fd) => (ctx, c) => K(ctx, c).cap(col, fd);
  const longBack = (col, len = 16) => (ctx, c) => K(ctx, c).poly([[-14, c.y - 6], [14, c.y - 6], [15, c.y + len], [-15, c.y + len]], col, 1.4);
  const cape = (col, w = 18) => (ctx, c) => K(ctx, c).poly([[-13, -22], [13, -22], [w, 12], [-w, 12]], col, 1.5);
  const band = (col, y0, y1) => (ctx, c) => K(ctx, c).poly([[-12, y0], [12, y0], [12, y1], [-12, y1]], col, 1.2);
  const belt = col => band(col, -5, 0);
  const vee = (col, d = 11) => (ctx, c) => K(ctx, c).poly([[-6, -22], [6, -22], [0, -22 + d]], col, 1.1);
  const collar = (col, d = 6) => (ctx, c) => K(ctx, c).poly([[-10, -22], [10, -22], [7, -22 + d], [-7, -22 + d]], col, 1.2);
  const straps = col => (ctx, c) => { const k = K(ctx, c); k.line(-12, -6, 12, -18, col, 1.8); k.line(12, -6, -12, -18, col, 1.8); };
  const sides = (col, w = 4) => (ctx, c) => { const k = K(ctx, c); k.poly([[-12, -22], [-12 + w, -22], [-12 + w, 6], [-12, 6]], col, 1.1); k.poly([[12, -22], [12 - w, -22], [12 - w, 6], [12, 6]], col, 1.1); };
  const scarf = col => (ctx, c) => { const k = K(ctx, c); k.poly([[-12, -22], [12, -22], [12, -18], [-12, -18]], col, 1.2); k.poly([[5, -18], [11, -18], [10, -4], [6, -4]], col, 1.2); };
  const brows = (col = '#111') => (ctx, c) => { const k = K(ctx, c); k.line(-8, c.y - 4, -2, c.y - 2, col, 1.7); k.line(8, c.y - 4, 2, c.y - 2, col, 1.7); };
  const freckles = col => (ctx, c) => { const k = K(ctx, c); for (const s of [-1, 1]) for (const d of [[7, 2], [9, 4], [6, 5]]) k.oval(s * d[0], c.y + d[1], .7, .7, col, 0); };
  const tail = (col, x0, y0, x1, y1, w = 5) => (ctx, c) => K(ctx, c).tube(x0, c.y + y0, x1, c.y + y1, col, w);
  const star = (ctx, x, y, R, col) => { ctx.fillStyle = col; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, r = i % 2 ? R * .45 : R; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); };
  const ears = tone => (ctx, c) => { const k = K(ctx, c); for (const s of [-1, 1]) k.poly([[s * 12.5, c.y - 1], [s * 20, c.y - 7], [s * 12.5, c.y + 3]], tone, 1.2); };
  const hatDome = (col, rx = 11, ry = 9, brow = 19, up = 9) => (ctx, c) => {
    ctx.fillStyle = col; ctx.strokeStyle = O; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, c.y - up, rx, ry, 0, PI, PI * 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    K(ctx, c).oval(0, c.y - up + 1, brow, 4.2, col, 1.5);
  };
  // Mặt nạ trùm đầu + hai mảng mắt
  const hood = (col, eyeFill, eyePoly) => (ctx, c) => {
    const k = K(ctx, c), y = c.y; k.oval(0, y - 1, 14.2, 14.2, col, 1.6);
    for (const s of [-1, 1]) { k.poly(eyePoly(s, y), eyeFill, 1.2); k.poly([[s * 8, y - 2.5], [s * 4, y - 1.2], [s * 4.5, y + 1.5], [s * 8, y + .5]], '#fff', 0); }
  };
  const slit = (s, y) => [[s * 9, y - 3], [s * 2, y - 1], [s * 2.5, y + 3], [s * 8.5, y + 1]];

  const add = (id, name, src, tone, hairc, eye, body, accent, hooks = {}, opts = {}) =>
    S.list.push({ id, name, src, tone, hairc, eye, body, accent, ...hooks, ...opts });
  const harry = () => S.get('harry');

  // ================= ANIME =================
  add('vegeta', 'Vegeta', 'Dragon Ball', '#e0ac69', '#15131a', '#222', '#1e40af', '#f5f5f5', {
    outfit: run(band('#f5f5f5', -22, -9), (ctx, c) => { const k = K(ctx, c); for (const s of [-1, 1]) k.poly([[s * 12, -22], [s * 12, -17], [s * 7, -22]], '#f4d03f', 1); }),
    face: brows(), hair: spiky('#15131a', 5, 13, 12, 1.2, 1.8) });
  add('kakashi', 'Kakashi Hatake', 'Naruto', '#fce2c4', '#d5d9de', '#222', '#2f4a66', '#556b2f', {
    outfit: sides('#556b2f', 6),
    face: (ctx, c) => K(ctx, c).poly([[-13, c.y + 1], [13, c.y + 1], [9, c.y + 11], [-9, c.y + 11]], '#2b3445', 1.2),
    hair: run(spiky('#d5d9de', 7, 6), (ctx, c) => { const k = K(ctx, c), y = c.y; k.poly([[-14, y - 9], [2, y - 4], [2, y + 1], [-14, y - 3]], '#24305e', 1.2); k.poly([[-8, y - 7], [-3, y - 5.5], [-3, y - 2], [-8, y - 4]], '#c8d3dc', 1); }) });
  add('sasuke', 'Sasuke Uchiha', 'Naruto', '#fce2c4', '#14161f', '#b71c1c', '#2a3a6b', '#f5f5f5', {
    outfit: run(collar('#1f2b52', 7), belt('#f5f5f5')),
    hair: run(spiky('#14161f', 5, 7, 12, 1.2, 1.95), (ctx, c) => { const k = K(ctx, c), y = c.y; k.poly([[-9, y - 8], [-5, y + 3], [-2, y - 8]], '#14161f', 1.2); k.poly([[9, y - 8], [6, y + 1], [3, y - 8]], '#14161f', 1.2); }) });
  add('itachi', 'Itachi Uchiha', 'Naruto', '#fce2c4', '#15131a', '#b71c1c', '#14141a', '#d32f2f', {
    back: longBack('#15131a', 18),
    outfit: run(collar('#2a2a33', 8), (ctx, c) => { const k = K(ctx, c); for (const [x, y] of [[-6, -12], [5, -6], [-4, 0]]) { k.oval(x, y, 3.2, 2, '#e53935', 1); k.oval(x, y, 1.4, .9, '#f5f5f5', 0); } }),
    face: (ctx, c) => { const k = K(ctx, c); for (const s of [-1, 1]) k.line(s * 5, c.y + 2, s * 3.5, c.y + 8, 'rgba(60,30,40,.6)', 1); },
    hair: capH('#15131a', 10) });
  add('eren', 'Eren Yeager', 'Attack on Titan', '#f1c27d', '#4e342e', '#2a9d8f', '#8d6e4f', '#2f6b4f', {
    back: cape('#2f6b4f'), outfit: straps('#4e342e'), hair: spiky('#4e342e', 7, 3, 10) });
  add('mikasa', 'Mikasa Ackerman', 'Attack on Titan', '#fce2c4', '#16121a', '#3b3b44', '#8d6e4f', '#c62828', {
    back: (ctx, c) => K(ctx, c).poly([[-14, c.y - 6], [14, c.y - 6], [14, c.y + 6], [-14, c.y + 6]], '#16121a', 1.4),
    outfit: scarf('#c62828'), hair: capH('#16121a', 10) }, { female: true });
  add('edward', 'Edward Elric', 'Fullmetal Alchemist', '#ffdbac', '#f5c518', '#c9a227', '#c62828', '#111', {
    back: run(cape('#c62828', 16), tail('#f5c518', -13, 4, -15, 26, 4.5)),
    outfit: run(vee('#111', 12), belt('#111')),
    hair: run(capH('#f5c518', 10), (ctx, c) => K(ctx, c).poly([[-1.5, c.y - 14], [.5, c.y - 25], [3, c.y - 14]], '#f5c518', 1.2)) });
  add('natsu', 'Natsu Dragneel', 'Fairy Tail', '#f1c27d', '#f48fb1', '#222', '#111827', '#f5f5f5', {
    outfit: run((ctx, c) => K(ctx, c).poly([[-5, -22], [5, -22], [3, -6], [-3, -6]], c.skin, 1.1), scarf('#f5f5f5')),
    hair: spiky('#f48fb1', 7, 8, 12) });
  add('ichigo', 'Ichigo Kurosaki', 'Bleach', '#f1c27d', '#ff8a2a', '#6b3e1e', '#15151c', '#f5f5f5', {
    outfit: run(vee('#f5f5f5', 12), belt('#f5f5f5')), face: brows(), hair: spiky('#ff8a2a', 7, 8, 12) });
  add('light', 'Light Yagami', 'Death Note', '#fce2c4', '#6a4a2f', '#c47a2c', '#33384a', '#f5f5f5', {
    outfit: run(vee('#f5f5f5', 11), (ctx, c) => K(ctx, c).poly([[0, -18], [-2, -15], [0, -6], [2, -15]], '#a4161a', 1)),
    hair: run(capH('#6a4a2f', 11), (ctx, c) => { const k = K(ctx, c), y = c.y; k.poly([[-9, y - 8], [-6, y], [-2, y - 8]], '#6a4a2f', 1.2); k.poly([[9, y - 8], [7, y - 1], [3, y - 8]], '#6a4a2f', 1.2); }) });
  add('deku', 'Izuku Midoriya', 'My Hero Academia', '#ffdbac', '#2f6b3a', '#2f7d32', '#2e7d4f', '#c62828', {
    outfit: run(collar('#f5f5f5', 4), belt('#c62828')), face: freckles('#b5651d'), hair: spiky('#2f6b3a', 9, 4, 10) });
  add('bakugo', 'Katsuki Bakugo', 'My Hero Academia', '#fce2c4', '#e6d28a', '#c62828', '#161616', '#e65100', {
    outfit: straps('#e65100'), face: brows(), hair: spiky('#e6d28a', 9, 10, 12) });
  add('asuka', 'Asuka Langley', 'Evangelion', '#fce2c4', '#d9531e', '#2a7fd1', '#d32f2f', '#ffb300', {
    back: longBack('#d9531e', 20), outfit: run(band('#ffb300', -22, -18), belt('#f5f5f5')),
    hair: run(capH('#d9531e', 11), (ctx, c) => { const k = K(ctx, c); for (const s of [-1, 1]) k.oval(s * 11, c.y - 9, 3, 2.6, '#ffb300', 1.2); }) }, { female: true });
  add('rei', 'Rei Ayanami', 'Evangelion', '#fce2c4', '#9bc4e8', '#c62828', '#f5f5f5', '#9bb7d4', {
    back: (ctx, c) => K(ctx, c).poly([[-14, c.y - 6], [14, c.y - 6], [14, c.y + 5], [-14, c.y + 5]], '#9bc4e8', 1.4),
    outfit: run(band('#9bb7d4', -22, -18), belt('#9bb7d4')), hair: capH('#9bc4e8', 10) }, { female: true });
  add('spike', 'Spike Spiegel', 'Cowboy Bebop', '#f1c27d', '#2d3b2d', '#3a2a22', '#2c4a8a', '#f4d03f', {
    outfit: run(vee('#f4d03f', 12), sides('#1f3566', 3)),
    face: (ctx, c) => { const k = K(ctx, c); k.line(3, c.y + 5, 11, c.y + 4, '#eee', 1.6); k.oval(11.5, c.y + 4, .9, .9, '#ff7a3d', 0); },
    hair: spiky('#2d3b2d', 7, 3, 10) });
  add('kirito', 'Kirito', 'Sword Art Online', '#ffdbac', '#14141c', '#2a2a35', '#14141c', '#7a8fa6', {
    back: cape('#14141c', 17), outfit: (ctx, c) => K(ctx, c).poly([[-6, -20], [6, -20], [4, -8], [-4, -8]], '#9aa7b5', 1.1),
    hair: spiky('#14141c', 9, 5, 12) });
  add('asuna', 'Asuna Yuuki', 'Sword Art Online', '#ffdbac', '#a65a2e', '#b36a2c', '#f5f5f5', '#c62828', {
    back: longBack('#a65a2e', 22), outfit: run(band('#c62828', -22, -17), (ctx, c) => K(ctx, c).poly([[-3, -17], [3, -17], [4, 6], [-4, 6]], '#c62828', 1.1)),
    hair: run(capH('#a65a2e', 11), (ctx, c) => { const k = K(ctx, c); for (const s of [-1, 1]) k.oval(s * 12, c.y - 6, 1.8, 1.8, '#f5f5f5', 1); }) }, { female: true });
  add('rem', 'Rem', 'Re:Zero', '#fce2c4', '#6ea8e8', '#4a90d9', '#2a3a6b', '#f5f5f5', {
    outfit: run((ctx, c) => K(ctx, c).poly([[-8, -20], [8, -20], [9, 6], [-9, 6]], '#fff', 1.2), collar('#f5f5f5', 4)),
    hair: run(capH('#6ea8e8', 10), (ctx, c) => K(ctx, c).poly([[-13, c.y - 9], [13, c.y - 9], [13, c.y - 6], [-13, c.y - 6]], '#f5f5f5', 1.2)) }, { female: true });
  add('kenshin', 'Himura Kenshin', 'Rurouni Kenshin', '#ffdbac', '#a8321c', '#8a5a9c', '#e8749a', '#f5f5f5', {
    back: tail('#a8321c', -6, 2, -14, 22, 4.5),
    outfit: band('#f5f5f5', -8, 6),
    face: (ctx, c) => { const k = K(ctx, c); k.line(-10, c.y + 1, -5, c.y + 7, '#b0353f', 1.2); k.line(-5, c.y + 1, -10, c.y + 7, '#b0353f', 1.2); },
    hair: capH('#a8321c', 10) });
  add('inuyasha', 'Inuyasha', 'Inuyasha', '#f1c27d', '#f2f2f7', '#e0a526', '#d32f2f', '#f5f5f5', {
    back: longBack('#f2f2f7', 22), outfit: vee('#f5f5f5', 12),
    hair: run((ctx, c) => { const k = K(ctx, c); for (const s of [-1, 1]) { k.poly([[s * 11, c.y - 9], [s * 6, c.y - 21], [s * 3, c.y - 12]], '#f2f2f7', 1.3); k.poly([[s * 9, c.y - 11], [s * 6.5, c.y - 17], [s * 5, c.y - 12]], '#f4a6b8', 0); } }, capH('#f2f2f7', 11)) });
  add('sakura', 'Sakura Haruno', 'Naruto', '#ffdbac', '#f48fb1', '#2e9d58', '#d32f2f', '#f5f5f5', {
    back: (ctx, c) => K(ctx, c).poly([[-14, c.y - 6], [14, c.y - 6], [14, c.y + 6], [-14, c.y + 6]], '#f48fb1', 1.4),
    outfit: run(band('#f5f5f5', -4, 0), (ctx, c) => K(ctx, c).oval(0, -13, 3.5, 3.5, '#f5f5f5', 1)),
    hair: run(capH('#f48fb1', 10), (ctx, c) => K(ctx, c).poly([[-13, c.y - 8.5], [13, c.y - 8.5], [13, c.y - 5.5], [-13, c.y - 5.5]], '#c62828', 1.2)) }, { female: true });
  add('hinata', 'Hinata Hyuga', 'Naruto', '#fce2c4', '#232a56', '#d8d8f5', '#cfd2e8', '#7d6ca8', {
    back: longBack('#232a56', 18), outfit: collar('#7d6ca8', 7),
    hair: run(capH('#232a56', 12), (ctx, c) => { const k = K(ctx, c); k.poly([[-13, c.y - 3], [-9, c.y + 8], [-6, c.y - 5]], '#232a56', 1.2); k.poly([[13, c.y - 3], [9, c.y + 8], [6, c.y - 5]], '#232a56', 1.2); }) }, { female: true });
  add('nezuko', 'Nezuko Kamado', 'Demon Slayer', '#fce2c4', '#1c1620', '#e8567a', '#f5a3b8', '#e0702a', {
    back: run(longBack('#1c1620', 24), (ctx, c) => K(ctx, c).poly([[-14, c.y + 18], [14, c.y + 18], [15, c.y + 24], [-15, c.y + 24]], '#e0702a', 1.2)),
    outfit: run((ctx, c) => { ctx.fillStyle = '#f48fb1'; for (let gx = 0; gx < 5; gx++) for (let gy = 0; gy < 5; gy++) if ((gx + gy) % 2 === 0) ctx.fillRect(-9 + gx * 3.8, -20 + gy * 3.8, 3, 3); }, belt('#e0702a')),
    face: (ctx, c) => { const k = K(ctx, c); k.oval(0, c.y + 5, 6.5, 2.6, '#6b8e4e', 1.2); k.line(-6, c.y + 5, -12, c.y + 8, '#f48fb1', 1.3); k.line(6, c.y + 5, 12, c.y + 8, '#f48fb1', 1.3); },
    hair: capH('#1c1620', 11) }, { female: true });
  add('zerotwo', 'Zero Two', 'Darling in the Franxx', '#fce2c4', '#f48fb1', '#3ac7a8', '#d32f2f', '#f5f5f5', {
    back: longBack('#f48fb1', 22), outfit: run(collar('#f5f5f5', 5), belt('#f5f5f5')),
    hair: run(capH('#f48fb1', 11), (ctx, c) => { const k = K(ctx, c); for (const s of [-1, 1]) k.poly([[s * 6, c.y - 13], [s * 9, c.y - 21], [s * 11, c.y - 12]], '#d32f2f', 1.2); k.poly([[-13, c.y - 9], [13, c.y - 9], [13, c.y - 6.5], [-13, c.y - 6.5]], '#d32f2f', 1.1); }) }, { female: true });
  add('anya', 'Anya Forger', 'Spy x Family', '#ffdbac', '#f4a6b8', '#2e9d58', '#1a1a40', '#d4a017', {
    outfit: run(collar('#f5f5f5', 4), (ctx, c) => { const k = K(ctx, c); for (const y of [-14, -8]) for (const x of [-3, 3]) k.oval(x, y, 1.1, 1.1, '#d4a017', .5); }),
    face: (ctx, c) => K(ctx, c).line(-2, c.y + 5, 3, c.y + 4, O, 1.2),
    hair: run(capH('#f4a6b8', 10), (ctx, c) => { const k = K(ctx, c); for (const s of [-1, 1]) { k.poly([[s * 7, c.y - 12], [s * 11, c.y - 20], [s * 12, c.y - 10]], '#1a1a22', 1.2); k.oval(s * 10.5, c.y - 10, 1.2, 1.2, '#d4a017', .5); } }) }, { female: true });
  add('lelouch', 'Lelouch Lamperouge', 'Code Geass', '#fce2c4', '#14121c', '#7e3ff2', '#1b1030', '#d4a017', {
    back: cape('#2b1250', 19), outfit: run(vee('#d4a017', 12), collar('#d4a017', 4)),
    hair: run(capH('#14121c', 11), (ctx, c) => { const k = K(ctx, c); k.poly([[-10, c.y - 8], [-8, c.y + 5], [-4, c.y - 8]], '#14121c', 1.2); k.poly([[10, c.y - 8], [8, c.y + 5], [4, c.y - 8]], '#14121c', 1.2); }) });

  // ================= PHIM / NỔI TIẾNG =================
  add('batman', 'Batman', 'DC', '#fce2c4', '#1c1c24', '#fff', '#4b4f5c', '#f4d03f', {
    back: cape('#14141a', 20),
    outfit: run((ctx, c) => K(ctx, c).oval(0, -14, 5.5, 3.4, '#f4d03f', 1), (ctx, c) => K(ctx, c).poly([[-3, -14], [0, -16], [3, -14], [0, -12]], '#111', .5), belt('#f4d03f')),
    face: (ctx, c) => { const k = K(ctx, c), y = c.y; k.oval(0, y - 1, 14.2, 14.2, '#1c1c24', 1.6);
      for (const s of [-1, 1]) k.poly([[s * 6, y - 11], [s * 11, y - 24], [s * 13, y - 8]], '#1c1c24', 1.4);
      k.oval(0, y + 6.5, 8, 5.5, c.skin, 1.2); for (const s of [-1, 1]) k.poly(slit(s, y), '#f5f5f5', 1); },
    hair() {} });
  add('superman', 'Superman', 'DC', '#fce2c4', '#14121c', '#2a6fdb', '#1e50b8', '#c62828', {
    back: cape('#c62828'),
    outfit: run((ctx, c) => { K(ctx, c).poly([[-5.5, -19], [5.5, -19], [6.5, -13], [0, -7], [-6.5, -13]], '#f4d03f', 1.1); ctx.fillStyle = '#c62828'; ctx.font = 'bold 8px Arial'; ctx.textAlign = 'center'; ctx.fillText('S', 0, -11); }, band('#c62828', -2, 6), belt('#f4d03f')),
    hair: run(capH('#14121c', 11), (ctx, c) => { ctx.strokeStyle = '#14121c'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(2, c.y - 7, 3, 0, PI); ctx.stroke(); }) });
  add('captain', 'Captain America', 'Marvel', '#fce2c4', '#d4b36a', '#3a78c9', '#1e3a8a', '#c62828', {
    outfit: run((ctx, c) => star(ctx, 0, -15, 5.5, '#f5f5f5'), (ctx, c) => { const k = K(ctx, c); for (let i = 0; i < 4; i++) k.poly([[-12, -8 + i * 3.5], [12, -8 + i * 3.5], [12, -5 + i * 3.5], [-12, -5 + i * 3.5]], i % 2 ? '#f5f5f5' : '#c62828', .8); }, belt('#6d4c2f')),
    hair: run(capH('#1e3a8a', 7), (ctx, c) => { const k = K(ctx, c), y = c.y; for (const s of [-1, 1]) k.poly([[s * 13, y - 3], [s * 20, y - 8], [s * 15, y]], '#f5f5f5', 1.1); k.oval(0, y - 9, 3, 3, '#f5f5f5', 1); }) });
  add('thor', 'Thor', 'Marvel', '#fce2c4', '#d6b25a', '#4a90c2', '#6b6f78', '#c62828', {
    back: run(cape('#c62828'), longBack('#d6b25a', 18)),
    outfit: run((ctx, c) => { const k = K(ctx, c); for (const s of [-1, 1]) k.oval(s * 5, -14, 3.4, 3.4, '#c8ccd4', 1.1); }, belt('#3f4650')),
    hair: capH('#d6b25a', 11) });
  add('hulk', 'Hulk', 'Marvel', '#5aa05a', '#1f2a1f', '#7bd35a', '#5aa05a', '#7b3fb0', {
    outfit: run(band('#7b3fb0', -8, 6), (ctx, c) => { const k = K(ctx, c); k.line(0, -20, 0, -10, 'rgba(0,50,0,.5)', 1); k.line(-5, -16, 5, -16, 'rgba(0,50,0,.5)', 1); }),
    face: brows('#0f1a0f'), hair: run(spiky('#1f2a1f', 5, 3, 9)) }, { w: 1.2 });
  add('deadpool', 'Deadpool', 'Marvel', '#b71c1c', '#b71c1c', '#fff', '#b71c1c', '#111', {
    outfit: run(sides('#111', 3), straps('#444'), belt('#111')),
    face: hood('#b71c1c', '#111', (s, y) => [[s * 10, y - 5], [s * 2, y - 1], [s * 3, y + 4], [s * 10, y + 2]]), hair() {} });
  add('joker', 'The Joker', 'DC', '#f4f4ea', '#2f9e44', '#222', '#6a1b9a', '#2f9e44', {
    outfit: run(vee('#2f9e44', 13), collar('#f5f5f5', 4)),
    face: (ctx, c) => { const k = K(ctx, c); for (const s of [-1, 1]) k.oval(s * 4.5, c.y - 1, 3.4, 2.6, 'rgba(20,20,20,.5)', 0);
      ctx.strokeStyle = '#c62828'; ctx.lineWidth = 1.9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-9, c.y + 2); ctx.quadraticCurveTo(0, c.y + 13, 9, c.y + 2); ctx.stroke(); },
    hair: spiky('#2f9e44', 7, 4, 11) });
  add('wolverine', 'Wolverine', 'Marvel', '#f1c27d', '#14121a', '#222', '#f4c20d', '#1e40af', {
    outfit: run(sides('#1e40af', 4), belt('#1e40af')),
    hair: run(spiky('#14121a', 5, 5, 11), (ctx, c) => { const k = K(ctx, c), y = c.y; for (const s of [-1, 1]) k.poly([[s * 12, y - 8], [s * 21, y - 17], [s * 15, y - 1]], '#14121a', 1.3); }) });
  add('neo', 'Neo', 'The Matrix', '#fce2c4', '#15131a', '#222', '#111', '#1c1c20', {
    back: cape('#0d0d10', 17), outfit: vee('#26262c', 12),
    face: (ctx, c) => { const k = K(ctx, c); for (const s of [-1, 1]) k.oval(s * 4.8, c.y - 1, 3.8, 3, '#0b0b0b', 1.3); k.line(-1, c.y - 1, 1, c.y - 1, '#0b0b0b', 1.3); },
    hair: capH('#15131a', 11) });
  add('indiana', 'Indiana Jones', 'Indiana Jones', '#e0ac69', '#3a2a20', '#3a2a20', '#8a5a2e', '#c68642', {
    outfit: run(vee('#e8dcc0', 11), (ctx, c) => K(ctx, c).line(-12, -20, 10, 4, '#5d4037', 2)), hair: run(capH('#3a2a20', 11), hatDome('#6b5236', 10.5, 8, 19, 9)) });
  add('legolas', 'Legolas', 'The Lord of the Rings', '#fce2c4', '#e8d28a', '#4a90c2', '#3f6b45', '#8b6b3a', {
    back: longBack('#e8d28a', 20), outfit: run((ctx, c) => K(ctx, c).line(-12, -20, 10, 4, '#8b6b3a', 2), (ctx, c) => K(ctx, c).oval(-5, -17, 2, 2.6, '#9ccc65', 1)),
    face: ears('#fce2c4'), hair: run(capH('#e8d28a', 11), tail('#e8d28a', -12, 3, -14, 11, 3.5), tail('#e8d28a', 12, 3, 14, 11, 3.5)) });
  add('bond', 'James Bond', 'James Bond', '#fce2c4', '#3a2f26', '#4a90c2', '#14141c', '#f5f5f5', {
    outfit: run(vee('#f5f5f5', 12), (ctx, c) => { const k = K(ctx, c); k.poly([[0, -20], [-5, -23], [-5, -17]], '#111', 1); k.poly([[0, -20], [5, -23], [5, -17]], '#111', 1); }),
    hair: capH('#3a2f26', 11) });
  add('elvis', 'Elvis Presley', 'Nổi tiếng', '#fce2c4', '#14121a', '#3a4a6a', '#f5f5f5', '#d4a017', {
    outfit: run(collar('#f5f5f5', 8), band('#d4a017', -22, -20), belt('#d4a017'), (ctx, c) => { const k = K(ctx, c); for (const x of [-6, 0, 6]) k.oval(x, -2.5, 1.4, 1.4, '#c62828', .6); }),
    face: (ctx, c) => { const k = K(ctx, c); for (const s of [-1, 1]) { k.oval(s * 4.8, c.y - 1, 3.8, 3.2, '#b8860b', 1.3); k.poly([[s * 12, c.y - 3], [s * 14, c.y - 3], [s * 14, c.y + 6], [s * 12, c.y + 4]], '#14121a', .8); } k.line(-1, c.y - 1, 1, c.y - 1, O, 1.3); },
    hair: run(capH('#14121a', 9), (ctx, c) => K(ctx, c).oval(2, c.y - 14, 12, 6, '#14121a', 1.4)) });
  add('chaplin', 'Charlie Chaplin', 'Nổi tiếng', '#fce2c4', '#14121a', '#222', '#14141a', '#d8d8d8', {
    outfit: run(vee('#f5f5f5', 10), (ctx, c) => { const k = K(ctx, c); k.poly([[0, -20], [-4, -22], [-4, -18]], '#111', .8); k.poly([[0, -20], [4, -22], [4, -18]], '#111', .8); }),
    face: (ctx, c) => K(ctx, c).oval(0, c.y + 3.5, 3, 1.4, '#111', 0),
    hair: run(capH('#14121a', 11), hatDome('#15151a', 10, 8, 15, 9)) });
  add('sherlock', 'Sherlock Holmes', 'Sherlock Holmes', '#fce2c4', '#4a3320', '#6b8fa3', '#6e5a45', '#8d6e4f', {
    back: cape('#6e5a45', 16), outfit: vee('#f5f5f5', 11),
    face: (ctx, c) => { const k = K(ctx, c); k.line(2, c.y + 6, 9, c.y + 9, '#5d4037', 1.6); k.oval(10.5, c.y + 8, 3, 3, '#5d4037', 1.1); },
    hair: run(capH('#4a3320', 11), (ctx, c) => { const k = K(ctx, c), y = c.y; for (const s of [-1, 1]) k.oval(s * 13, y - 8, 3, 2, '#9a8460', 1.2); hatDome('#9a8460', 11, 8, 12, 9)(ctx, c); k.oval(0, y - 18, 3, 1.6, '#7a6848', 1); }) });
  add('zorro', 'Zorro', 'The Mask of Zorro', '#e0ac69', '#111', '#222', '#111', '#d4a017', {
    back: cape('#111', 19), outfit: run(vee('#f5f5f5', 10), belt('#b71c1c')),
    face: (ctx, c) => { const k = K(ctx, c), y = c.y; k.poly([[-13.5, y - 4], [13.5, y - 4], [13.5, y + 2], [-13.5, y + 2]], '#0b0b0b', 1.2);
      for (const s of [-1, 1]) { k.oval(s * 4.5, y - 1, 2.4, 1.7, '#f5f5f5', 0); k.oval(s * 4.5, y - 1, 1, 1, '#111', 0); }
      k.oval(0, y + 5, 4.5, 1.2, '#111', 0); },
    hair: hatDome('#111', 10.5, 8, 21, 9) });
  add('santa', 'Santa Claus', 'Nổi tiếng', '#f1c27d', '#f5f5f5', '#3a78c9', '#c62828', '#f5f5f5', {
    outfit: run((ctx, c) => K(ctx, c).poly([[-3, -22], [3, -22], [3, 6], [-3, 6]], '#fff', 1), belt('#222'), (ctx, c) => K(ctx, c).oval(0, -2.5, 3, 2.3, gold, .8)),
    face: (ctx, c) => { const y = c.y; ctx.fillStyle = '#f5f5f5'; ctx.strokeStyle = O; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-12.5, y + 1); ctx.bezierCurveTo(-13, y + 14, -5, y + 20, 0, y + 22); ctx.bezierCurveTo(5, y + 20, 13, y + 14, 12.5, y + 1);
      ctx.quadraticCurveTo(0, y + 7, -12.5, y + 1); ctx.fill(); ctx.stroke(); K(ctx, c).oval(0, y + 3.5, 5, 1.8, '#f5f5f5', 1); },
    hair: run(capH('#c62828', 9), (ctx, c) => { const k = K(ctx, c), y = c.y; k.oval(0, y - 6, 14.5, 3.2, '#fff', 1.3); k.poly([[8, y - 12], [18, y - 12], [16, y - 19]], '#c62828', 1.3); k.oval(17, y - 20, 3.4, 3.4, '#fff', 1.2); }) }, { age: 'elder' });
  add('link', 'Link', 'The Legend of Zelda', '#ffdbac', '#d9b650', '#2a6fdb', '#3f8f3f', '#8b5a2b', {
    outfit: run(belt('#8b5a2b'), (ctx, c) => K(ctx, c).line(-12, -20, 10, 4, '#8b5a2b', 1.8)),
    face: ears('#ffdbac'),
    hair: run(capH('#d9b650', 11), (ctx, c) => K(ctx, c).poly([[-14, c.y - 4], [14, c.y - 4], [10, c.y - 16], [-2, c.y - 23], [-16, c.y - 14], [-21, c.y - 6]], '#3f8f3f', 1.5)) });
  add('lara', 'Lara Croft', 'Tomb Raider', '#f1c27d', '#5b3a24', '#4a3a2a', '#2a9d8f', '#6d4c2f', {
    back: tail('#5b3a24', -6, 6, -11, 22, 4.5),
    outfit: run(band('#8d6e4f', -3, 6), straps('#6d4c2f'), belt('#6d4c2f')), hair: capH('#5b3a24', 11) }, { female: true });
  add('cleopatra', 'Cleopatra', 'Lịch sử / Phim', '#c68642', '#14121a', '#14121a', '#f5f5f5', '#d4a017', {
    back: longBack('#14121a', 8),
    outfit: (ctx, c) => { const k = K(ctx, c); k.poly([[-12, -22], [12, -22], [10, -14], [0, -9], [-10, -14]], gold, 1.2); k.poly([[-8, -20], [8, -20], [6, -16], [0, -13], [-6, -16]], '#1e5aa8', .8); },
    face: (ctx, c) => { const k = K(ctx, c); for (const s of [-1, 1]) k.line(s * 7, c.y - 1, s * 10, c.y - 3, '#111', 1.2); },
    hair: run(capH('#14121a', 11), (ctx, c) => { const k = K(ctx, c), y = c.y; k.poly([[-13, y - 10], [13, y - 10], [13, y - 6], [-13, y - 6]], gold, 1.2); k.poly([[-2.5, y - 10], [2.5, y - 10], [0, y - 18]], gold, 1.2); }) }, { female: true });
  add('napoleon', 'Napoleon Bonaparte', 'Lịch sử', '#fce2c4', '#4a3320', '#4a5a7a', '#1e3a8a', '#f5f5f5', {
    outfit: run(straps('#f5f5f5'), (ctx, c) => { const k = K(ctx, c); for (const s of [-1, 1]) k.oval(s * 12, -21, 3.2, 1.8, '#d4a017', .8); }, collar('#c62828', 4)),
    hair: (ctx, c) => { const k = K(ctx, c), y = c.y; k.poly([[-22, y - 6], [-6, y - 16], [6, y - 16], [22, y - 6], [10, y - 3], [-10, y - 3]], '#15151a', 1.5); k.oval(0, y - 9, 2, 2, '#c62828', .8); } });
  add('harley', 'Harley Quinn', 'DC', '#fff1e6', '#e65a9a', '#222', '#c62828', '#2a9df4', {
    outfit: (ctx, c) => K(ctx, c).poly([[0, -22], [12, -22], [12, 6], [0, 6]], '#111', 1.1),
    face: (ctx, c) => { const k = K(ctx, c), y = c.y; k.poly([[-13, y - 4], [13, y - 4], [13, y + 2], [-13, y + 2]], '#111', 1);
      for (const s of [-1, 1]) { k.oval(s * 4.5, y - 1, 2.2, 1.6, '#fff', 0); k.oval(s * 4.5, y - 1, 1, 1, '#111', 0); } },
    hair: (ctx, c) => { const k = K(ctx, c), y = c.y; k.tube(-12, y - 5, -18, y + 10, '#e65a9a', 6); k.tube(12, y - 5, 18, y + 10, '#2a9df4', 6);
      k.cap('#e65a9a', 11); ctx.save(); ctx.beginPath(); ctx.rect(0, y - 30, 20, 40); ctx.clip(); k.cap('#2a9df4', 11); ctx.restore(); } }, { female: true });
  add('hermione', 'Hermione Granger', 'Harry Potter', '#f1c27d', '#6b4226', '#6b4226', '#262230', '#a4161a', {
    back: (ctx, c) => harry().back(ctx, c), outfit: (ctx, c) => harry().outfit(ctx, c),
    hair: spiky('#6b4226', 11, 6, 10, .8, 2.2) }, { female: true });
  add('katniss', 'Katniss Everdeen', 'The Hunger Games', '#c68642', '#2a1a12', '#6b7a8a', '#1b1b22', '#8b6b3a', {
    outfit: run(vee('#2c2c36', 12), (ctx, c) => K(ctx, c).line(-12, -20, 10, 4, '#8b6b3a', 2), (ctx, c) => K(ctx, c).oval(-5, -16, 1.8, 1.8, gold, .6)),
    hair: run(capH('#2a1a12', 11), tail('#2a1a12', -10, 3, -14, 13, 4.5), tail('#2a1a12', -14, 13, -12, 24, 4)) }, { female: true });
})();
