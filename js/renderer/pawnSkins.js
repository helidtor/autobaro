/**
 * pawnSkins.js - 20 skin nhân vật anime / phim / nổi tiếng cho Pawn.
 * Mỗi skin = bảng màu + 4 hook vẽ tuỳ chọn (chạy trong hệ toạ độ của pawn, đầu tại c.y):
 *   back (sau thân: áo choàng, tóc dài) · outfit (trên thân, khi chưa mặc giáp)
 *   face (trên mặt: kính, mặt nạ, mũ) · hair (thay tóc mặc định khi chưa đội mũ)
 */
window.GameRenderer = window.GameRenderer || {};

(function () {
  const O = '#1e272e', PI = Math.PI;

  // Bộ vẽ nhỏ dùng chung; c = {y: tâm đầu, r: bán kính đầu, t: thời gian, skin, hair}
  const K = (ctx, c) => {
    const { y, r } = c;
    const k = {
      poly(pts, fill, lw = 1.4) {
        ctx.fillStyle = fill; ctx.strokeStyle = O; ctx.lineWidth = lw; ctx.lineJoin = 'round';
        ctx.beginPath(); pts.forEach(([x, py], i) => i ? ctx.lineTo(x, py) : ctx.moveTo(x, py)); ctx.closePath();
        ctx.fill(); if (lw) ctx.stroke();
      },
      oval(x, py, rx, ry, fill, lw = 1.4, rot = 0) {
        ctx.fillStyle = fill; ctx.strokeStyle = O; ctx.lineWidth = lw;
        ctx.beginPath(); ctx.ellipse(x, py, rx, ry, rot, 0, PI * 2); ctx.fill(); if (lw) ctx.stroke();
      },
      line(x1, y1, x2, y2, col, w = 1.5) {
        ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      },
      tube(x1, y1, x2, y2, col, w) { k.line(x1, y1, x2, y2, O, w + 3); k.line(x1, y1, x2, y2, col, w); },
      // Mái tóc phủ đỉnh đầu, chừa mắt; fd = độ cao đường chân tóc
      cap(fill, fd = 11) {
        ctx.fillStyle = fill; ctx.strokeStyle = O; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(0, y - 1, r + 1.5, r + 2.5, 0, PI, PI * 2);
        ctx.quadraticCurveTo(0, y - fd, -(r + 1.5), y - 1); ctx.closePath(); ctx.fill(); ctx.stroke();
      },
      // Gai tóc mọc quanh đỉnh đầu (vẽ TRƯỚC cap để cap che gốc gai)
      spikes(fill, n, len, a0 = 1.1, a1 = 1.9) {
        for (let i = 0; i < n; i++) {
          const a = (a0 + (a1 - a0) * i / (n - 1)) * PI, L = len + (i % 2) * 3, w = .28;
          const P = (ang, rad) => [Math.cos(ang) * rad, y - 1 + Math.sin(ang) * rad];
          k.poly([P(a - w, r + 1), P(a + (a - 1.5 * PI) * .3, r + L + 2), P(a + w, r + 1)], fill, 1.3);
        }
      }
    };
    return k;
  };

  const gold = '#f2b705';

  const SKINS = [
    { id: 'naruto', name: 'Naruto Uzumaki', src: 'Naruto', tone: '#f1c27d', hairc: '#ffd93b', eye: '#2a6fdb', body: '#ff8a1f', accent: '#1f3a8a',
      outfit(ctx, c) { const { poly, line } = K(ctx, c);
        poly([[-10, -22], [10, -22], [6, -16], [-6, -16]], '#1f3a8a'); line(0, -16, 0, 4, '#1f3a8a', 1.6); },
      face(ctx, c) { const { line } = K(ctx, c); for (const s of [-1, 1]) for (const d of [-2, 1, 4]) line(s * 8, c.y + d, s * 12.5, c.y + d - 1, 'rgba(60,35,20,.75)', 1); },
      hair(ctx, c) { const { poly, spikes, cap, line } = K(ctx, c), y = c.y;
        spikes('#ffd93b', 7, 6); cap('#ffd93b');
        poly([[-14, y - 9], [14, y - 9], [14, y - 4], [-14, y - 4]], '#24305e', 1.2);
        poly([[-6.5, y - 9.5], [6.5, y - 9.5], [6.5, y - 3.5], [-6.5, y - 3.5]], '#c8d3dc', 1.2); line(-2.5, y - 6.5, 2.5, y - 6.5, '#47546b', 1); } },

    { id: 'goku', name: 'Son Goku', src: 'Dragon Ball', tone: '#f1c27d', hairc: '#16131c', eye: '#20202a', body: '#ff8f1f', accent: '#1d4ed8',
      outfit(ctx, c) { const { poly } = K(ctx, c);
        poly([[-6, -22], [6, -22], [0, -11]], '#1d4ed8', 1.2); poly([[-12, -5], [12, -5], [12, 0], [-12, 0]], '#1d4ed8', 1.2); },
      hair(ctx, c) { const { spikes, cap } = K(ctx, c); spikes('#16131c', 7, 10, 1.05, 1.95); cap('#16131c'); } },

    { id: 'luffy', name: 'Monkey D. Luffy', src: 'One Piece', tone: '#ffdbac', hairc: '#16121a', eye: '#1a1a22', body: '#d32f2f', accent: '#f4d03f',
      outfit(ctx, c) { const { poly } = K(ctx, c);
        poly([[-5, -22], [5, -22], [4, -8], [-4, -8]], c.skin, 1.1); poly([[-12, -5], [12, -5], [12, 0], [-12, 0]], '#f4d03f', 1.2); },
      face(ctx, c) { const { line } = K(ctx, c); line(-6, c.y + 2, -6, c.y + 6, '#9b3b3b', 1.2); line(-8, c.y + 4, -4, c.y + 4, '#9b3b3b', 1); },
      hair(ctx, c) { const { oval, cap, line } = K(ctx, c), y = c.y;
        cap('#16121a');
        ctx.fillStyle = '#e8c35a'; ctx.strokeStyle = O; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(0, y - 9, 11, 10, 0, PI, PI * 2); ctx.closePath(); ctx.fill(); ctx.stroke();
        oval(0, y - 8, 20, 4.5, '#e8c35a', 1.5);
        ctx.fillStyle = '#c62828'; ctx.fillRect(-10.5, y - 12, 21, 3.5); line(-10.5, y - 8.5, 10.5, y - 8.5, O, 1); } },

    { id: 'zoro', name: 'Roronoa Zoro', src: 'One Piece', tone: '#f1c27d', hairc: '#4caf50', eye: '#1a1a22', body: '#eceff1', accent: '#2e7d32',
      outfit(ctx, c) { const { poly, line } = K(ctx, c);
        poly([[-12, -9], [12, -9], [12, 0], [-12, 0]], '#2e7d32', 1.2);
        for (const [x, a] of [[7, 0], [10, .2], [13, .4]]) line(x - 2, -6, x + 1 + a * 3, -14 - a * 4, '#ffd54f', 1.8); },
      face(ctx, c) { const { oval, line } = K(ctx, c); line(-7, c.y - 5, -4.5, c.y + 5, '#a1473d', 1.4);
        for (const d of [1, 4, 7]) oval(-14, c.y + d - 1, 1.2, 1.6, gold, .8); },
      hair(ctx, c) { const { spikes, cap } = K(ctx, c); spikes('#4caf50', 7, 5); cap('#4caf50'); } },

    { id: 'sailormoon', name: 'Sailor Moon', src: 'Sailor Moon', female: true, tone: '#ffdbac', hairc: '#ffe066', eye: '#3b82f6', body: '#f5f5f5', accent: '#1e3a8a',
      back(ctx, c) { const { tube } = K(ctx, c), y = c.y;
        tube(-10, y - 12, -16, y + 2, '#ffe066', 6); tube(-16, y + 2, -14, y + 22, '#ffe066', 6);
        tube(10, y - 12, 16, y + 2, '#ffe066', 6); tube(16, y + 2, 14, y + 22, '#ffe066', 6); },
      outfit(ctx, c) { const { poly } = K(ctx, c);
        poly([[-12, -22], [12, -22], [12, -14], [0, -6], [-12, -14]], '#1e3a8a', 1.2);
        poly([[0, -13], [-6, -17], [-6, -9]], '#e53935', 1.1); poly([[0, -13], [6, -17], [6, -9]], '#e53935', 1.1);
        poly([[-12, -3], [12, -3], [15, 6], [-15, 6]], '#1e3a8a', 1.2); },
      hair(ctx, c) { const { oval, cap, poly } = K(ctx, c), y = c.y;
        cap('#ffe066', 12); oval(-10, y - 14, 5.5, 5.5, '#ffe066'); oval(10, y - 14, 5.5, 5.5, '#ffe066');
        oval(-10, y - 14, 1.8, 1.8, '#e53935', .8); oval(10, y - 14, 1.8, 1.8, '#e53935', .8);
        poly([[-5, y - 7], [5, y - 7], [0, y - 13]], gold, 1.1); oval(0, y - 8.5, 1.7, 1.7, '#e53935', .8); } },

    { id: 'l', name: 'L Lawliet', src: 'Death Note', tone: '#fce2c4', hairc: '#15131a', eye: '#1a1a22', body: '#f4f4f4', accent: '#4a6fa5',
      outfit(ctx, c) { const { poly } = K(ctx, c); poly([[-12, -4], [12, -4], [12, 6], [-12, 6]], '#4a6fa5', 1.2); },
      face(ctx, c) { const { oval } = K(ctx, c); for (const x of [-4.5, 4.5]) oval(x, c.y + 3, 3.6, 1.3, 'rgba(70,50,90,.5)', 0); },
      hair(ctx, c) { const { spikes, cap } = K(ctx, c); spikes('#15131a', 9, 4, .95, 2.05); cap('#15131a', 10); } },

    { id: 'levi', name: 'Levi Ackerman', src: 'Attack on Titan', tone: '#fce2c4', hairc: '#1b1620', eye: '#8a95a8', body: '#b79c7a', accent: '#2f6b4f',
      back(ctx, c) { const { poly } = K(ctx, c); poly([[-13, -22], [13, -22], [18, 10], [-18, 10]], '#2f6b4f', 1.5); },
      outfit(ctx, c) { const { poly, line } = K(ctx, c);
        line(-12, -6, 12, -18, '#4e342e', 1.8); line(12, -6, -12, -18, '#4e342e', 1.8);
        poly([[-5, -22], [5, -22], [0, -11]], '#fafafa', 1.1); },
      hair(ctx, c) { const { cap, line } = K(ctx, c); cap('#1b1620', 10); line(-1, c.y - 11, -4, c.y - 6, O, 1); } },

    { id: 'tanjiro', name: 'Tanjiro Kamado', src: 'Demon Slayer', tone: '#ffdbac', hairc: '#6b1d2a', eye: '#b3262b', body: '#1f2a1f', accent: '#2e7d32',
      outfit(ctx, c) { ctx.fillStyle = '#2e7d32';
        for (let gx = 0; gx < 5; gx++) for (let gy = 0; gy < 6; gy++) if ((gx + gy) % 2 === 0) ctx.fillRect(-10 + gx * 4.2, -20 + gy * 4.2, 4.2, 4.2);
        const { poly } = K(ctx, c); poly([[-12, -4], [12, -4], [12, 1], [-12, 1]], '#111', 1.1); },
      hair(ctx, c) { const { spikes, cap, oval, poly } = K(ctx, c), y = c.y;
        spikes('#6b1d2a', 7, 5); cap('#6b1d2a'); oval(-5, y - 6.5, 2.6, 2, '#b3262b', 0, .4);
        for (const s of [-1, 1]) { poly([[s * 15.5, y + 3], [s * 12.5, y + 3], [s * 12.5, y + 9], [s * 15.5, y + 9]], '#fff', 1); oval(s * 14, y + 6, 1.1, 1.1, '#c62828', 0); } } },

    { id: 'gojo', name: 'Satoru Gojo', src: 'Jujutsu Kaisen', tone: '#fce2c4', hairc: '#f2f4ff', eye: '#4cc9ff', body: '#1b1f2e', accent: '#2a3150',
      outfit(ctx, c) { const { poly, oval } = K(ctx, c);
        poly([[-10, -22], [10, -22], [8, -16], [-8, -16]], '#2a3150', 1.2); oval(0, -10, 1.2, 1.2, gold, .6); oval(0, -5, 1.2, 1.2, gold, .6); },
      face(ctx, c) { const { poly } = K(ctx, c), y = c.y; poly([[-13.5, y - 5], [13.5, y - 5], [13.5, y + 2], [-13.5, y + 2]], '#16161d', 1.2); },
      hair(ctx, c) { const { spikes, cap } = K(ctx, c); spikes('#f2f4ff', 9, 7, 1.0, 2.0); cap('#f2f4ff', 13); } },

    { id: 'saitama', name: 'Saitama', src: 'One Punch Man', tone: '#fce2c4', hairc: '#fce2c4', eye: '#1a1a22', body: '#f4d03f', accent: '#e53935',
      back(ctx, c) { const { poly } = K(ctx, c); poly([[-12, -22], [12, -22], [20, 12], [-20, 12]], '#f5f5f5', 1.5); },
      outfit(ctx, c) { const { poly } = K(ctx, c); poly([[-12, -6], [12, -6], [12, -2], [-12, -2]], '#222', 1.1);
        poly([[-4, -22], [4, -22], [0, -17]], '#e53935', 1); },
      hair(ctx, c) { const { oval } = K(ctx, c); oval(-4, c.y - 9, 3, 1.5, 'rgba(255,255,255,.6)', 0, -.3); } },

    { id: 'harry', name: 'Harry Potter', src: 'Harry Potter', tone: '#ffdbac', hairc: '#16121a', eye: '#2e7d32', body: '#262230', accent: '#a4161a',
      back(ctx, c) { const { poly } = K(ctx, c); poly([[-14, -22], [14, -22], [16, 8], [-16, 8]], '#1b1722', 1.5); },
      outfit(ctx, c) { const { poly, line } = K(ctx, c);
        poly([[-12, -22], [12, -22], [12, -17], [-12, -17]], '#a4161a', 1.2); line(-12, -19.5, 12, -19.5, '#e0a526', 1.4);
        poly([[3, -17], [9, -17], [9, -7], [3, -7]], '#a4161a', 1.2); line(3, -12, 9, -12, '#e0a526', 1.4); },
      face(ctx, c) { const { line } = K(ctx, c), y = c.y; ctx.strokeStyle = '#222'; ctx.lineWidth = 1.3;
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * 4.5, y - 1, 3.7, 0, PI * 2); ctx.stroke(); }
        line(-.8, y - 1, .8, y - 1, '#222', 1.2); },
      hair(ctx, c) { const { spikes, cap } = K(ctx, c), y = c.y; spikes('#16121a', 7, 3); cap('#16121a');
        ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(1.5, y - 9); ctx.lineTo(-.5, y - 6.5); ctx.lineTo(1.8, y - 6.5); ctx.lineTo(-.2, y - 3.8); ctx.stroke(); } },

    { id: 'gandalf', name: 'Gandalf', src: 'The Lord of the Rings', age: 'elder', tone: '#fce2c4', hairc: '#e4e7eb', eye: '#4a90c2', body: '#9aa0a8', accent: '#cfd4da',
      back(ctx, c) { const { poly } = K(ctx, c), y = c.y; poly([[-14, y - 6], [14, y - 6], [15, y + 16], [-15, y + 16]], '#d7dce2', 1.4); },
      face(ctx, c) { const y = c.y;
        ctx.fillStyle = '#e4e7eb'; ctx.strokeStyle = O; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(-12, y + 1); ctx.bezierCurveTo(-13, y + 16, -4, y + 24, 0, y + 28); ctx.bezierCurveTo(4, y + 24, 13, y + 16, 12, y + 1);
        ctx.quadraticCurveTo(0, y + 7, -12, y + 1); ctx.fill(); ctx.stroke(); },
      hair(ctx, c) { const { poly, oval } = K(ctx, c), y = c.y;
        poly([[-11, y - 9], [11, y - 9], [6, y - 26], [12, y - 38], [-3, y - 27]], '#9aa3ad', 1.5);
        oval(0, y - 8, 20, 4.5, '#9aa3ad', 1.5); } },

    { id: 'sparrow', name: 'Jack Sparrow', src: 'Pirates of the Caribbean', tone: '#c68642', hairc: '#2b1d15', eye: '#2b1d15', body: '#f1e9da', accent: '#5d4037',
      back(ctx, c) { const { poly } = K(ctx, c), y = c.y; poly([[-14, y - 6], [14, y - 6], [13, y + 14], [-13, y + 14]], '#2b1d15', 1.4); },
      outfit(ctx, c) { const { poly } = K(ctx, c);
        poly([[-12, -22], [-5, -22], [-4, 3], [-12, 3]], '#5d4037', 1.2); poly([[12, -22], [5, -22], [4, 3], [12, 3]], '#5d4037', 1.2);
        poly([[-12, -5], [12, -5], [12, 0], [-12, 0]], '#b71c1c', 1.2); },
      face(ctx, c) { const { oval, line } = K(ctx, c), y = c.y;
        for (const x of [-4.5, 4.5]) oval(x, y - 1, 3, 1.6, 'rgba(20,12,8,.55)', 0);
        line(-4, y + 4, 4, y + 4, '#2b1d15', 1.3); line(-1.5, y + 6, -2, y + 13, '#2b1d15', 2); line(1.5, y + 6, 2, y + 13, '#2b1d15', 2); },
      hair(ctx, c) { const { cap, poly, line } = K(ctx, c), y = c.y;
        cap('#b71c1c', 10);
        poly([[-21, y - 6], [-6, y - 17], [6, y - 17], [21, y - 6], [8, y - 8], [-8, y - 8]], '#1f1a17', 1.5);
        line(-19, y - 6.5, -6, y - 16, gold, 1); line(19, y - 6.5, 6, y - 16, gold, 1); } },

    { id: 'vader', name: 'Darth Vader', src: 'Star Wars', tone: '#101015', hairc: '#101015', eye: '#c62828', body: '#101015', accent: '#c62828',
      back(ctx, c) { const { poly } = K(ctx, c); poly([[-14, -22], [14, -22], [19, 12], [-19, 12]], '#0c0c10', 1.5); },
      outfit(ctx, c) { const { poly, oval } = K(ctx, c);
        poly([[-6, -17], [6, -17], [6, -8], [-6, -8]], '#2a2a33', 1);
        oval(-3, -14, 1.2, 1.2, '#e53935', 0); oval(0, -14, 1.2, 1.2, '#43a047', 0); oval(3, -14, 1.2, 1.2, '#1e88e5', 0);
        poly([[-12, -5], [12, -5], [12, 0], [-12, 0]], '#2a2a33', 1.1); },
      face(ctx, c) { const { oval, poly, line } = K(ctx, c), y = c.y;
        oval(0, y - 1, 14.3, 14.3, '#15151a', 1.6); poly([[-14, y + 2], [14, y + 2], [8, y + 12], [-8, y + 12]], '#15151a', 1.4);
        for (const s of [-1, 1]) poly([[s * 2, y - 2], [s * 10, y - 6], [s * 10, y + 1], [s * 5, y + 3]], '#050507', 1);
        poly([[-3, y + 4], [3, y + 4], [0, y + 1]], '#2e2e36', .8);
        for (const d of [6, 8, 10]) line(-4, y + d, 4, y + d, '#9aa3ad', 1); },
      hair() {} },

    { id: 'spiderman', name: 'Spider-Man', src: 'Marvel', tone: '#d32f2f', hairc: '#d32f2f', eye: '#fff', body: '#d32f2f', accent: '#1e40af',
      outfit(ctx, c) { const { poly, oval, line } = K(ctx, c);
        poly([[-12, -8], [12, -8], [12, 6], [-12, 6]], '#1e40af', 1.2);
        line(0, -22, 0, -8, 'rgba(0,0,0,.45)', .8); line(-12, -15, 12, -15, 'rgba(0,0,0,.35)', .8);
        oval(0, -14, 2.2, 3, '#111', 0); for (const s of [-1, 1]) { line(s * 2, -15, s * 6, -18, '#111', 1); line(s * 2, -12, s * 6, -10, '#111', 1); } },
      face(ctx, c) { const { oval, poly, line } = K(ctx, c), y = c.y;
        oval(0, y, 13.8, 13.8, '#d32f2f', 1.6);
        for (const a of [-.6, -.3, 0, .3, .6]) line(0, y - 13, Math.sin(a) * 13, y - 13 + Math.cos(a) * 12, 'rgba(0,0,0,.4)', .7);
        for (const s of [-1, 1]) poly([[s * 10, y - 4], [s * 2, y + 1], [s * 3.5, y + 6], [s * 9.5, y + 3]], '#fff', 1.3); },
      hair() {} },

    { id: 'wonderwoman', name: 'Wonder Woman', src: 'DC', female: true, tone: '#f1c27d', hairc: '#1b1217', eye: '#2a4a7a', body: '#c62828', accent: gold,
      back(ctx, c) { const { poly } = K(ctx, c), y = c.y; poly([[-14, y - 6], [14, y - 6], [15, y + 18], [-15, y + 18]], '#1b1217', 1.4); },
      outfit(ctx, c) { const { poly, oval } = K(ctx, c);
        poly([[-12, -22], [12, -22], [12, -16], [-12, -16]], gold, 1.2);
        poly([[-12, -4], [12, -4], [12, 0], [-12, 0]], gold, 1.2);
        poly([[-12, 0], [12, 0], [14, 7], [-14, 7]], '#1e3a8a', 1.2); for (const x of [-7, 0, 7]) oval(x, 4, 1, 1, '#fff', 0); },
      hair(ctx, c) { const { cap, poly, oval } = K(ctx, c), y = c.y;
        cap('#1b1217', 12); poly([[-8, y - 7], [8, y - 7], [0, y - 13]], gold, 1.2); oval(0, y - 8.5, 1.5, 1.5, '#e53935', .6); } },

    { id: 'ironman', name: 'Iron Man', src: 'Marvel', tone: '#b71c1c', hairc: '#b71c1c', eye: '#bff3ff', body: '#b71c1c', accent: gold,
      outfit(ctx, c) { const { poly, oval } = K(ctx, c);
        poly([[-12, -22], [12, -22], [12, -17], [-12, -17]], gold, 1.2); poly([[-12, -3], [12, -3], [12, 6], [-12, 6]], gold, 1.2);
        ctx.shadowColor = '#9be7ff'; ctx.shadowBlur = 5 + Math.sin(c.t * 5) * 3; oval(0, -12, 3.6, 3.6, '#bff3ff', 1.2); },
      face(ctx, c) { const { oval, poly, line } = K(ctx, c), y = c.y;
        oval(0, y - 1, 14.2, 14.2, '#b71c1c', 1.6);
        poly([[-9, y - 7], [9, y - 7], [8, y + 7], [3, y + 12], [-3, y + 12], [-8, y + 7]], gold, 1.4);
        for (const s of [-1, 1]) poly([[s * 8.5, y - 3], [s * 2, y - 3], [s * 2.5, y + 1], [s * 8, y]], '#bff3ff', 1);
        line(-3, y + 6, 3, y + 6, O, 1); },
      hair() {} },

    { id: 'mario', name: 'Super Mario', src: 'Nintendo', tone: '#ffdbac', hairc: '#4e342e', eye: '#1e40af', body: '#e53935', accent: '#1e40af',
      outfit(ctx, c) { const { poly, oval } = K(ctx, c);
        poly([[-12, -12], [12, -12], [12, 6], [-12, 6]], '#1e40af', 1.2);
        poly([[-9, -22], [-5, -22], [-5, -12], [-9, -12]], '#1e40af', 1.1); poly([[9, -22], [5, -22], [5, -12], [9, -12]], '#1e40af', 1.1);
        oval(-5, -11, 1.3, 1.3, '#f4d03f', .6); oval(5, -11, 1.3, 1.3, '#f4d03f', .6); },
      face(ctx, c) { const { oval } = K(ctx, c), y = c.y;
        oval(0, y + 2.5, 3.4, 3, '#f0a77a', 1.1);
        oval(-3.8, y + 5.2, 4, 2.3, '#4e342e', 1, .25); oval(3.8, y + 5.2, 4, 2.3, '#4e342e', 1, -.25); },
      hair(ctx, c) { const { cap, oval } = K(ctx, c), y = c.y;
        for (const s of [-1, 1]) oval(s * 13, y + 2, 2.4, 4, '#4e342e', 1.2);
        cap('#e53935', 9); oval(2, y - 5, 14, 3, '#e53935', 1.4);
        oval(0, y - 10, 4.6, 4.6, '#fff', 1); ctx.fillStyle = '#e53935'; ctx.font = 'bold 6px Arial, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('M', 0, y - 8); } },

    { id: 'einstein', name: 'Albert Einstein', src: 'Nổi tiếng', age: 'elder', tone: '#fce2c4', hairc: '#ececec', eye: '#4a3728', body: '#6d5b4a', accent: '#f5f5f5',
      outfit(ctx, c) { const { poly } = K(ctx, c);
        poly([[-6, -22], [6, -22], [0, -15]], '#f5f5f5', 1.1); poly([[-12, -5], [12, -5], [12, 6], [-12, 6]], '#4a4036', 1.2); },
      face(ctx, c) { const { oval, line } = K(ctx, c), y = c.y;
        for (const s of [-1, 1]) line(s * 8, y - 4.5, s * 2, y - 4.8, '#d8d8d8', 2.4);
        oval(0, y + 4, 6.5, 2.4, '#dcdcdc', 1.1); },
      hair(ctx, c) { const { spikes, cap } = K(ctx, c); spikes('#ececec', 11, 8, .85, 2.15); cap('#ececec', 9); } },

    { id: 'elsa', name: 'Elsa', src: 'Frozen', female: true, tone: '#fce2c4', hairc: '#f2f7ff', eye: '#3aa7e0', body: '#7fd3f7', accent: '#d9f3ff',
      back(ctx, c) { const { poly } = K(ctx, c); ctx.globalAlpha = .75; poly([[-12, -22], [12, -22], [20, 14], [-20, 14]], '#c9efff', 1.2); ctx.globalAlpha = 1; },
      outfit(ctx, c) { const { poly, line } = K(ctx, c);
        poly([[-12, -3], [12, -3], [18, 8], [-18, 8]], '#7fd3f7', 1.3);
        for (const a of [0, PI / 3, 2 * PI / 3]) line(-Math.cos(a) * 4.5, -13 - Math.sin(a) * 4.5, Math.cos(a) * 4.5, -13 + Math.sin(a) * 4.5, '#fff', 1.1); },
      hair(ctx, c) { const { cap, tube, oval } = K(ctx, c), y = c.y;
        cap('#f2f7ff', 12);
        tube(-10, y + 3, -15, y + 12, '#f2f7ff', 5.5); tube(-15, y + 12, -12, y + 24, '#f2f7ff', 5);
        oval(-12, y + 25, 2.6, 2.6, '#7fd3f7', 1); } }
  ];

  window.GameRenderer.PawnSkins = {
    list: SKINS,
    get: id => SKINS.find(s => s.id === id),
    // Gán skin cho hồ sơ ngoại hình; seed 'pawn_N' → skin N % 20, seed khác → ngẫu nhiên
    apply(app, seed) {
      const n = parseInt(String(seed).replace(/\D/g, ''), 10);
      const sk = SKINS[Number.isFinite(n) ? n % SKINS.length : Math.floor(Math.random() * SKINS.length)];
      return Object.assign(app, {
        skin: sk.id, isFemale: !!sk.female, ageGroup: sk.age || 'young', beardStyle: 'none', hairStyle: 'skin',
        skinColor: sk.tone, hairColor: sk.hairc, eyeColor: sk.eye, heightScale: 1, widthScale: sk.female ? .94 : 1,
        attire: { name: sk.name, color: sk.body, accent: sk.accent, style: 'skin' }
      });
    },
    // Chạy một hook của skin trong ctx.save/restore để không rò trạng thái canvas
    draw(ctx, app, hook, c) {
      const sk = this.get(app.skin);
      if (!sk || !sk[hook]) return;
      c.skin = app.skinColor; c.hair = app.hairColor;
      ctx.save(); sk[hook](ctx, c); ctx.restore();
    }
  };
})();
