/**
 * huaguoSystem.js - Núi Hoa Quả Sơn, nơi Tôn Ngộ Không nghỉ ngơi.
 * Nằm giữa lòng chảo Dãy Núi Liên Sơn. Bầy khỉ ở quanh núi.
 * Khi đủ 5 bot tụ tập bái kiến và hoàn tất nghi lễ, Tôn Ngộ Không cưỡi mây xuất kích
 * tiêu diệt một long thần đang hoành hành.
 */
window.GameEntities = window.GameEntities || {};

window.GameEntities.HuaguoSystem = {
  mountain: null,
  monkeys: [],
  pilgrims: [],
  wukong: null,
  clouds: [],
  capturedDragons: [],
  clock: 0,
  ritualTime: 0,
  ritualNeeded: 8,
  cooldown: 0,
  mapW: 5200,
  mapH: 5200,

  init(mapWidth, mapHeight) {
    this.clock = 0;
    this.ritualTime = 0;
    this.cooldown = 0;
    this.pilgrims = [];
    this.clouds = [];
    this.capturedDragons = [];
    this.wukong = null;
    this.mapW = mapWidth || 5200;
    this.mapH = mapHeight || 5200;

    // Tâm lòng chảo Dãy Núi Liên Sơn (đơn vị thiết kế x2).
    const cx = 2070 * 2, cy = 450 * 2;
    this.mountain = {
      x: cx,
      y: cy,
      radius: 130,
      name: 'NÚI HOA QUẢ SƠN',
      peakH: 96
    };

    this.monkeys = [];
    const spots = 6;
    for (let i = 0; i < spots; i++) {
      const a = (i / spots) * Math.PI * 2 + 0.4;
      this.monkeys.push({
        homeX: cx + Math.cos(a) * 150,
        homeY: cy + Math.sin(a) * 150,
        x: cx + Math.cos(a) * 150,
        y: cy + Math.sin(a) * 150,
        phase: Math.random() * Math.PI * 2,
        facing: Math.random() < 0.5 ? 1 : -1,
        cheering: false
      });
    }
    window.GameUI?.CombatTicker?.log('🐒 Núi Hoa Quả Sơn hiện ra giữa Dãy Núi Liên Sơn. Tôn Ngộ Không đang nghỉ ngơi trong động.');
  },

  reset(mapWidth, mapHeight) {
    this.init(mapWidth, mapHeight);
  },

  // Điểm ưu tiên cho AI: bái kiến là phần thưởng (triệu hồi Đại Thánh diệt rồng), nên xếp trên farm/loot thường.
  pilgrimageScore(pawn) {
    const m = this.mountain;
    if (!m || !pawn?.isAlive || this.wukong || this.cooldown > 0) return 0;
    if (!(window.GameEntities.AliothSystem?.dragons || []).some(d => d.isAlive)) return 0;
    const dist = Math.hypot(pawn.x - m.x, pawn.y - m.y);
    if (dist > 2600) return 0;
    const M = window.GameEngine.MapTerrain;
    if (M && !M.canTravel(pawn, m.x, m.y)) return 0;
    return 320 - dist / 40;
  },

  seekPilgrimage(pawn, dt) {
    const m = this.mountain;
    if (!m) return;
    const dist = Math.hypot(pawn.x - m.x, pawn.y - m.y);
    pawn.isHiding = false;
    pawn.targetEnemy = null;
    pawn.objective = 'Bái kiến Hoa Quả Sơn: triệu hồi Tôn Ngộ Không';
    pawn.thought = 'Một người cũng bắt đầu được nghi lễ. Càng đông càng nhanh, EXP chia đều.';
    if (dist > m.radius + 60) window.GameAI.AIBrain.moveToTarget(pawn, m.x, m.y + 40, dt);
    else { pawn.vx = 0; pawn.vy = 0; pawn.aimAngle = Math.atan2(m.y - pawn.y, m.x - pawn.x); }
  },

  update(dt) {
    const m = this.mountain;
    if (!m) return;
    this.clock += dt;
    this.cooldown = Math.max(0, this.cooldown - dt);
    const G = window.GameManager;

    // Khỉ nhảy nhót quanh núi; reo hò khi có nghi lễ.
    const ritual = this.ritualTime > 0;
    for (const k of this.monkeys) {
      k.phase += dt * (ritual ? 6 : 2.2);
      k.cheering = ritual;
      const hop = Math.abs(Math.sin(k.phase)) * (ritual ? 14 : 6);
      const sway = Math.sin(k.phase * 0.5) * 10;
      k.x = k.homeX + sway;
      k.y = k.homeY - hop;
      if (Math.sin(k.phase) > 0.98) k.facing = -k.facing;
    }

    // Tôn Ngộ Không đang xuất kích.
    if (this.wukong) {
      this.updateWukong(dt);
      return;
    }
    if (this.cooldown > 0) return;

    // Đếm bot bái kiến: đứng trong vòng núi, không giao tranh.
    const pawns = (G?.pawns || []).filter(p => p.isAlive && !p.isDemonKing);
    this.pilgrims = pawns.filter(p => Math.hypot(p.x - m.x, p.y - m.y) < m.radius + 70 && !(p.combatLease > 0));

    if (this.pilgrims.length >= 1) {
      this.ritualTime += dt * this.pilgrims.length;
      for (const p of this.pilgrims) {
        p.objective = 'Bái kiến Tôn Ngộ Không tại Hoa Quả Sơn';
        p.thought = 'Càng đông người, nghi lễ càng nhanh. Phần thưởng kinh nghiệm chia đều.';
        p.vx = 0;
        p.vy = 0;
      }
      if (this.ritualTime >= this.ritualNeeded) this.summonWukong();
    } else {
      this.ritualTime = Math.max(0, this.ritualTime - dt * 2);
    }
  },

  summonWukong() {
    const G = window.GameManager;
    const dragons = (window.GameEntities.AliothSystem?.dragons || []).filter(d => d.isAlive);
    if (!dragons.length) {
      this.ritualTime = 0;
      window.GameUI?.CombatTicker?.log('🐒 Bầy khỉ reo hò, nhưng không còn long thần nào để Đại Thánh ra tay.');
      this.cooldown = 30;
      return;
    }
    const target = dragons[Math.floor(Math.random() * dragons.length)];
    const m = this.mountain;
    this.wukong = {
      x: m.x,
      y: m.y - 40,
      vx: 0,
      vy: 0,
      target,
      state: 'rise',
      timer: 1.2,
      angle: 0
    };
    this.ritualTime = 0;
    this.rewardPilgrims();
    window.GameUI?.CombatTicker?.log(`☁️ Bái kiến thành công! Tôn Ngộ Không cưỡi cân đẩu vân xuất kích diệt ${target.name}!`);
    window.GameEngine?.Audio?.play?.('ascension');
    window.GameRenderer?.VfxManager?.addEffect?.('rune', m.x, m.y, { radius: 160, color: '#f6d48a', life: 2 });
  },

  rewardPilgrims() {
    const pilgrims = this.pilgrims.filter(p => p.isAlive);
    if (!pilgrims.length) return;
    const total = 600;
    const share = Math.max(1, Math.round(total / pilgrims.length));
    const C = window.GameEntities.CombatSystem;
    for (const p of pilgrims) {
      p.currentExp = (p.currentExp || 0) + share;
      C?.checkLevelUp?.(p);
      window.GameRenderer?.VfxManager?.addEmotionMote?.(p, '🙏', '#f6d48a');
      window.GameRenderer?.VfxManager?.addDamageNumber?.(p.x, p.y - 30, '+' + share + ' EXP', 'heal');
    }
    window.GameUI?.CombatTicker?.log(`🎁 ${pilgrims.length} người bái kiến chia đều ${total} EXP — mỗi người +${share}.`);
  },

  updateWukong(dt) {
    const w = this.wukong;
    if (!w) return;
    w.timer -= dt;

    if (w.state === 'rise') {
      w.y -= 90 * dt;
      if (w.timer <= 0) { w.state = 'fly'; w.timer = 12; }
    } else if (w.state === 'fly') {
      const t = w.target;
      if (!t?.isAlive) { w.state = 'return'; w.timer = 8; return; }
      const dx = t.x - w.x, dy = (t.y - 30) - w.y, dist = Math.hypot(dx, dy);
      w.angle = Math.atan2(dy, dx);
      if (dist > 40) {
        const step = Math.min(dist, 520 * dt);
        w.x += dx / dist * step;
        w.y += dy / dist * step;
      } else {
        w.state = 'strike';
        w.timer = 0.6;
      }
      if (w.timer <= 0) { w.state = 'return'; w.timer = 8; }
    } else if (w.state === 'strike') {
      if (w.timer <= 0) {
        if (w.target?.isAlive) this.captureDragon(w.target);
        else { w.state = 'return'; w.timer = 8; }
      }
    } else if (w.state === 'drag') {
      const m = this.mountain;
      const cap = w.captive;
      const dx = m.x - w.x, dy = (m.y - 40) - w.y, dist = Math.hypot(dx, dy);
      w.angle = Math.atan2(dy, dx);
      if (dist > 30) {
        const step = Math.min(dist, 420 * dt);
        w.x += dx / dist * step;
        w.y += dy / dist * step;
        if (cap) {
          const lead = 150;
          cap.x = w.x + Math.cos(w.angle) * lead;
          cap.y = w.y + Math.sin(w.angle) * lead - 70;
          cap.aimAngle = w.angle;
          const head = cap.spine?.[0];
          if (head) {
            head.x = cap.x;
            head.y = cap.y;
            head.tx = Math.cos(cap.aimAngle);
            head.ty = Math.sin(cap.aimAngle);
            head.nx = -head.ty;
            head.ny = head.tx;
          }
        }
      } else {
        if (cap) this.imprisonDragon(cap);
        w.state = 'return';
        w.timer = 2;
        w.captive = null;
      }
      if (w.timer <= 0) { w.state = 'return'; w.timer = 2; }
    } else if (w.state === 'return') {
      const m = this.mountain;
      const dx = m.x - w.x, dy = (m.y - 40) - w.y, dist = Math.hypot(dx, dy);
      w.angle = Math.atan2(dy, dx);
      if (dist > 30) {
        const step = Math.min(dist, 600 * dt);
        w.x += dx / dist * step;
        w.y += dy / dist * step;
      } else {
        window.GameUI?.CombatTicker?.log('☁️ Tôn Ngộ Không trở về Hoa Quả Sơn nghỉ ngơi.');
        this.wukong = null;
        this.clouds = [];
        this.cooldown = 45;
      }
    }

    // Vệt mây phía sau.
    this.clouds.push({ x: w.x, y: w.y + 18, life: 1.1, r: 16 + Math.random() * 10 });
    for (let i = this.clouds.length - 1; i >= 0; i--) {
      this.clouds[i].life -= dt;
      if (this.clouds[i].life <= 0) this.clouds.splice(i, 1);
    }
  },

  captureDragon(dragon) {
    const w = this.wukong;
    if (!w || !dragon?.isAlive) return;
    dragon.captured = true;
    dragon.invincible = true;
    w.captive = dragon;
    w.state = 'drag';
    w.timer = 14;
    const V = window.GameRenderer?.VfxManager;
    V?.addEffect?.('impact', dragon.x, dragon.y, { radius: 140, color: '#f6d48a', life: 1.2 });
    V?.addBurstParticles?.(dragon.x, dragon.y, '#f6d48a', 24);
    window.GameUI?.CombatTicker?.log(`🐵 Tôn Ngộ Không trói ${dragon.name} bằng gậy Như Ý, lôi cổ về Hoa Quả Sơn!`);
    V?.addEffect?.('glow', dragon.x, dragon.y, { color: '#f6d48a', life: 0.6, radius: 60 });
    V?.addEffect?.('chain', dragon.x, dragon.y, { color: '#f6d48a', life: 0.8, radius: 55 });
  },

  imprisonDragon(dragon) {
    const m = this.mountain;
    dragon.captured = true;
    dragon.isAlive = false;
    const slot = this.capturedDragons.length;
    const side = slot % 2 === 0 ? -1 : 1;
    const ring = Math.floor(slot / 2);
    dragon.x = m.x + side * (m.radius + 55 + ring * 36);
    dragon.y = m.y + 18;
    dragon.aimAngle = side > 0 ? Math.PI : 0;
    dragon.vx = 0;
    dragon.vy = 0;
    const head = dragon.spine?.[0];
    if (head) {
      head.x = dragon.x;
      head.y = dragon.y;
      head.tx = Math.cos(dragon.aimAngle);
      head.ty = Math.sin(dragon.aimAngle);
      head.nx = -head.ty;
      head.ny = head.tx;
    }
    this.capturedDragons.push(dragon);
    const A = window.GameEntities.AliothSystem;
    if (A) A.dragons = A.dragons.filter(d => d !== dragon);
    window.GameRenderer?.VfxManager?.addEffect?.('rune', m.x, m.y, { radius: 120, color: '#f6d48a', life: 2 });
    window.GameUI?.CombatTicker?.log(`🔒 ${dragon.name} bị nhốt trong động Thủy Liêm, Hoa Quả Sơn.`);
  },

  render(ctx) {
    const m = this.mountain;
    if (!m) return;
    this.drawMountain(ctx, m);
    this.drawMonkeys(ctx);
    this.drawClouds(ctx);
    if (this.wukong?.captive) this.drawChain(ctx, this.wukong.captive, this.wukong.x, this.wukong.y);
    this.drawCaptives(ctx, m);
    if (this.wukong) this.drawWukong(ctx, this.wukong);
    this.drawRitual(ctx, m);
  },

  drawMountain(ctx, m) {
    ctx.save();
    ctx.translate(m.x, m.y);

    // Bóng chân núi.
    ctx.fillStyle = 'rgba(40, 60, 30, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 18, m.radius * 1.15, m.radius * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    // Thân núi nhiều tầng, đỉnh nhọn.
    const tiers = [
      { w: m.radius, h: 46, c: '#6b8f4e' },
      { w: m.radius * 0.72, h: 72, c: '#4f7a3a' },
      { w: m.radius * 0.42, h: m.peakH, c: '#3d6630' }
    ];
    for (const t of tiers) {
      ctx.fillStyle = t.c;
      ctx.strokeStyle = '#24331c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-t.w, 10);
      ctx.lineTo(0, 10 - t.h);
      ctx.lineTo(t.w, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Cửa động Thủy Liêm.
    ctx.fillStyle = '#1c2418';
    ctx.beginPath();
    ctx.ellipse(0, 2, 16, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d8c07a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Thác nước nhỏ bên sườn.
    const fall = ctx.createLinearGradient(0, -30, 0, 14);
    fall.addColorStop(0, 'rgba(150, 210, 235, 0.9)');
    fall.addColorStop(1, 'rgba(150, 210, 235, 0.2)');
    ctx.fillStyle = fall;
    ctx.fillRect(m.radius * 0.34, -34, 7, 48);

    // Cây đào hai bên.
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#5c3a22';
      ctx.fillRect(side * 78 - 3, -26, 6, 30);
      ctx.fillStyle = '#e86b8a';
      ctx.beginPath();
      ctx.arc(side * 78, -34, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f7b7c8';
      ctx.beginPath();
      ctx.arc(side * 78 + side * 8, -40, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bảng tên.
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#1d2418';
    ctx.strokeText(m.name, 0, -m.peakH - 16);
    ctx.fillStyle = '#f6e7a8';
    ctx.fillText(m.name, 0, -m.peakH - 16);
    ctx.restore();
  },

  drawMonkeys(ctx) {
    for (const k of this.monkeys) {
      ctx.save();
      ctx.translate(k.x, k.y);
      ctx.scale(k.facing, 1);
      // Thân.
      ctx.fillStyle = '#c9843f';
      ctx.strokeStyle = '#5c3a1e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, -6, 7, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Đầu.
      ctx.beginPath();
      ctx.arc(0, -18, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Mặt.
      ctx.fillStyle = '#f3d2a2';
      ctx.beginPath();
      ctx.ellipse(2, -17, 3.5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      // Tai.
      ctx.fillStyle = '#c9843f';
      ctx.beginPath();
      ctx.arc(-4, -21, 2.4, 0, Math.PI * 2);
      ctx.fill();
      // Đuôi cong.
      ctx.strokeStyle = '#a86b30';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-4, -2);
      ctx.quadraticCurveTo(-14, k.cheering ? -16 : 2, -8, -12);
      ctx.stroke();
      // Tay giơ khi reo hò.
      if (k.cheering) {
        ctx.strokeStyle = '#5c3a1e';
        ctx.beginPath();
        ctx.moveTo(-3, -10);
        ctx.lineTo(-7, -20);
        ctx.moveTo(3, -10);
        ctx.lineTo(7, -20);
        ctx.stroke();
      }
      ctx.restore();
    }
  },

  drawClouds(ctx) {
    for (const c of this.clouds) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, c.life);
      ctx.fillStyle = '#f7f4ee';
      ctx.beginPath();
      ctx.ellipse(c.x - 8, c.y, c.r * 0.7, c.r * 0.45, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x + 6, c.y - 2, c.r, c.r * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  },

  drawWukong(ctx, w) {
    const TAU = Math.PI * 2;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const lerp = (a, b, k) => a + (b - a) * k;
    const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
    const lg = (x0, y0, x1, y1, stops) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      stops.forEach(s => g.addColorStop(s[0], s[1]));
      return g;
    };
    const rg = (x, y, r0, r1, stops) => {
      const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
      stops.forEach(s => g.addColorStop(s[0], s[1]));
      return g;
    };
    const gold = (x0, y0, x1, y1) => lg(x0, y0, x1, y1, [[0, '#fff1a8'], [0.35, '#f7c531'], [0.7, '#c98a0e'], [1, '#8a5a06']]);
    const OUT = '#3b2105';

    const aura = (t, state) => {
      const strike = state === 'strike';
      const pulse = 0.8 + Math.sin(t * 4) * 0.2;
      const R = strike ? 135 : 108;
      ctx.fillStyle = rg(0, -10, 10, R, [
        [0, 'rgba(255,214,90,' + 0.55 * pulse + ')'],
        [0.5, (strike ? 'rgba(255,90,40,' : 'rgba(255,150,40,') + 0.2 * pulse + ')'],
        [1, 'rgba(255,120,30,0)']
      ]);
      ctx.beginPath();
      ctx.arc(0, -10, R, 0, TAU);
      ctx.fill();
    };

    const speedLines = (t) => {
      ctx.save();
      ctx.lineCap = 'round';
      for (let i = 0; i < 7; i++) {
        const y = -62 + i * 24 + ((i * 37) % 11);
        const len = 40 + ((i * 53) % 40);
        const off = (t * 260 + i * 47) % 120;
        ctx.strokeStyle = 'rgba(255,226,140,' + 0.5 * (1 - off / 120) + ')';
        ctx.lineWidth = 2.6 - (i % 3) * 0.7;
        ctx.beginPath();
        ctx.moveTo(-72 - off * 0.6, y);
        ctx.lineTo(-72 - off * 0.6 - len, y + 3);
        ctx.stroke();
      }
      ctx.restore();
    };

    const cloud = (t) => {
      ctx.save();
      ctx.translate(0, 66 + Math.sin(t * 3) * 2.5);
      ctx.fillStyle = rg(0, 14, 4, 70, [[0, 'rgba(255,220,120,0.45)'], [1, 'rgba(255,220,120,0)']]);
      ctx.beginPath();
      ctx.arc(0, 14, 70, 0, TAU);
      ctx.fill();
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = 'rgba(255,255,255,' + (0.38 - i * 0.08) + ')';
        ctx.beginPath();
        ctx.arc(-52 - i * 20, 10 + Math.sin(t * 4 + i) * 3, 14 - i * 2.5, 0, TAU);
        ctx.fill();
      }
      const puffs = [[-34, 8, 20], [-14, 12, 26], [14, 10, 28], [38, 6, 20], [-2, -4, 24], [22, -6, 17], [-24, -2, 15]];
      puffs.forEach(p => {
        ctx.fillStyle = 'rgba(110,150,185,0.35)';
        ctx.beginPath();
        ctx.arc(p[0], p[1] + 5, p[2], 0, TAU);
        ctx.fill();
      });
      puffs.forEach(p => {
        ctx.fillStyle = rg(p[0] - p[2] * 0.3, p[1] - p[2] * 0.4, 2, p[2], [[0, '#ffffff'], [0.7, '#eef6ff'], [1, '#cfe3f5']]);
        ctx.beginPath();
        ctx.arc(p[0], p[1], p[2], 0, TAU);
        ctx.fill();
      });
      ctx.restore();
    };

    const cape = (t, fast) => {
      const f = Math.sin(t * 7) * (fast ? 9 : 5);
      const f2 = Math.sin(t * 7 + 1.4) * (fast ? 7 : 4);
      ctx.beginPath();
      ctx.moveTo(-4, -28);
      ctx.bezierCurveTo(-34, -34 + f2, -72, -22 + f, -108, -34 + f * 1.6);
      ctx.bezierCurveTo(-90, -14, -98, 6 + f2, -84, 20 + f);
      ctx.bezierCurveTo(-76, 14, -70, 30 + f2, -58, 34);
      ctx.bezierCurveTo(-46, 26, -38, 40 + f, -24, 38);
      ctx.bezierCurveTo(-14, 30, -6, 24, -2, 14);
      ctx.closePath();
      ctx.fillStyle = lg(-100, -30, -4, 20, [[0, '#6f0b0e'], [0.5, '#c81e1e'], [1, '#ef4444']]);
      ctx.fill();
      ctx.strokeStyle = '#4a0709';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.28)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-10, -22);
      ctx.quadraticCurveTo(-60, -12 + f, -92, -22 + f);
      ctx.moveTo(-8, -10);
      ctx.quadraticCurveTo(-48, 6 + f2, -74, 22 + f);
      ctx.stroke();
    };

    const leg = (hx, hy, kx, ky, fx, fy, dark) => {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const seg = (x0, y0, x1, y1, ww, c) => {
        ctx.strokeStyle = OUT;
        ctx.lineWidth = ww + 3;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        ctx.strokeStyle = c;
        ctx.lineWidth = ww;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      };
      seg(hx, hy, kx, ky, 14, dark ? '#8a4a10' : '#b45f14');
      seg(kx, ky, fx, fy, 12, dark ? '#a8780f' : '#e0a920');
      ctx.fillStyle = gold(kx - 7, ky - 7, kx + 7, ky + 7);
      ctx.strokeStyle = OUT;
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(kx, ky, 7, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.save();
      ctx.translate(fx, fy);
      ctx.beginPath();
      ctx.moveTo(-8, -5);
      ctx.lineTo(8, -5);
      ctx.quadraticCurveTo(19, -3, 22, -11);
      ctx.quadraticCurveTo(24, 4, 11, 8);
      ctx.lineTo(-9, 8);
      ctx.closePath();
      ctx.fillStyle = gold(0, -6, 0, 8);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    const skirt = (t) => {
      const tw = Math.sin(t * 5) * 2.5;
      for (let i = 0; i < 5; i++) {
        const x0 = -17 + i * 7.6;
        ctx.beginPath();
        ctx.moveTo(x0, 14);
        ctx.lineTo(x0 + 7.8, 14);
        ctx.lineTo(x0 + 6.6 + tw * 0.6, 40 + (i % 2) * 5);
        ctx.lineTo(x0 + 1 + tw * 0.3, 37 + (i % 2) * 3);
        ctx.closePath();
        ctx.fillStyle = i % 2 ? '#c2710f' : '#e08a1a';
        ctx.fill();
        ctx.strokeStyle = '#3a1a05';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x0 + 2, 22); ctx.lineTo(x0 + 6, 25);
        ctx.moveTo(x0 + 2, 30); ctx.lineTo(x0 + 5.5, 33);
        ctx.stroke();
      }
    };

    const torso = (t) => {
      const f = Math.sin(t * 6) * 5;
      ctx.fillStyle = '#b91c1c';
      ctx.strokeStyle = '#4a0709';
      ctx.lineWidth = 1.2;
      for (let k = 0; k < 2; k++) {
        ctx.beginPath();
        ctx.moveTo(-14, 14 + k * 3);
        ctx.quadraticCurveTo(-30, 18 + f + k * 4, -46 - k * 8, 26 + f * 1.4 + k * 6);
        ctx.lineTo(-44 - k * 8, 33 + f * 1.4 + k * 6);
        ctx.quadraticCurveTo(-28, 26 + f + k * 4, -13, 22 + k * 3);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(-17, -28);
      ctx.lineTo(19, -28);
      ctx.quadraticCurveTo(22, -6, 16, 18);
      ctx.lineTo(-14, 18);
      ctx.quadraticCurveTo(-20, -6, -17, -28);
      ctx.closePath();
      ctx.fillStyle = lg(-18, 0, 20, 0, [[0, '#9a6408'], [0.4, '#f7c531'], [0.7, '#e0a920'], [1, '#8a5a06']]);
      ctx.fill();
      ctx.strokeStyle = OUT;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(80,40,0,0.55)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(1, -22); ctx.lineTo(1, 12);
      ctx.moveTo(-12, 2); ctx.quadraticCurveTo(1, 6, 15, 2);
      ctx.stroke();
      [[-7, -12], [10, -12]].forEach(c => {
        ctx.fillStyle = rg(c[0] - 2, c[1] - 3, 1, 9, [[0, '#fff6c8'], [0.5, '#f1b81f'], [1, '#9a6408']]);
        ctx.beginPath(); ctx.arc(c[0], c[1], 8.5, 0, TAU); ctx.fill();
        ctx.strokeStyle = OUT; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.fillStyle = '#c81e1e';
        ctx.beginPath(); ctx.arc(c[0], c[1], 2.6, 0, TAU); ctx.fill();
      });
      ctx.fillStyle = gold(-14, -32, 16, -24);
      ctx.beginPath(); ctx.ellipse(1, -28, 15, 5.5, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = OUT; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-15, 11); ctx.lineTo(18, 11); ctx.lineTo(18, 22); ctx.lineTo(-15, 22);
      ctx.closePath();
      ctx.fillStyle = lg(0, 11, 0, 22, [[0, '#ef4444'], [1, '#8f1014']]);
      ctx.fill(); ctx.strokeStyle = '#4a0709'; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.fillStyle = rg(0, 15, 0.5, 6, [[0, '#d1fae5'], [0.5, '#10b981'], [1, '#065f46']]);
      ctx.beginPath(); ctx.arc(2, 16.5, 5, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#f7c531'; ctx.lineWidth = 1.6; ctx.stroke();
    };

    const pauldron = (x, y, s) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s, s);
      ctx.fillStyle = gold(0, -26, 0, -12);
      ctx.strokeStyle = OUT; ctx.lineWidth = 1.3;
      [[-9, -12, -12, -23, -4, -13], [-3, -14, 0, -28, 4, -14], [4, -13, 12, -23, 10, -12]].forEach(p => {
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[2], p[3]); ctx.lineTo(p[4], p[5]); ctx.closePath();
        ctx.fill(); ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(-14, 3);
      ctx.quadraticCurveTo(-15, -15, 0, -16);
      ctx.quadraticCurveTo(15, -15, 14, 3);
      ctx.quadraticCurveTo(0, 8, -14, 3);
      ctx.closePath();
      ctx.fillStyle = lg(-14, -16, 14, 6, [[0, '#fff1a8'], [0.4, '#f7c531'], [1, '#8a5a06']]);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c81e1e';
      ctx.beginPath(); ctx.arc(0, -5, 3.2, 0, TAU); ctx.fill();
      ctx.restore();
    };

    const arm = (sx, sy, hx, hy, dark) => {
      const l1 = 26, l2 = 26;
      const dx = hx - sx, dy = hy - sy;
      const d = clamp(Math.hypot(dx, dy), 8, l1 + l2 - 1);
      const a = Math.atan2(dy, dx);
      const cA = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
      const th = Math.acos(cA);
      const ex = sx + Math.cos(a + th) * l1, ey = sy + Math.sin(a + th) * l1;
      const px = sx + Math.cos(a) * d, py = sy + Math.sin(a) * d;
      ctx.lineCap = 'round';
      const seg = (x0, y0, x1, y1, ww, c) => {
        ctx.strokeStyle = OUT; ctx.lineWidth = ww + 3;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        ctx.strokeStyle = c; ctx.lineWidth = ww;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      };
      seg(sx, sy, ex, ey, 12, dark ? '#9b5412' : '#c9741a');
      seg(ex, ey, px, py, 11, dark ? '#a8780f' : '#e0a920');
      const wx = lerp(ex, px, 0.75), wy = lerp(ey, py, 0.75);
      ctx.fillStyle = '#c81e1e';
      ctx.beginPath(); ctx.arc(wx, wy, 3, 0, TAU); ctx.fill();
      ctx.fillStyle = dark ? '#c9741a' : '#e08a2c';
      ctx.strokeStyle = OUT; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(px, py, 6.5, 0, TAU); ctx.fill(); ctx.stroke();
    };

    const staff = (hx, hy, ang, back, front, glow) => {
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(ang);
      const h = 4.8, cap = 24;
      if (glow) { ctx.shadowColor = 'rgba(255,200,60,0.95)'; ctx.shadowBlur = glow; }
      ctx.fillStyle = lg(0, -h, 0, h, [[0, '#4a0707'], [0.35, '#e0402e'], [0.62, '#a31616'], [1, '#3d0505']]);
      ctx.fillRect(-back, -h, back + front, h * 2);
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,215,100,0.8)';
      for (let x = -back + cap + 8; x < front - cap - 4; x += 14) ctx.fillRect(x, -1, 6, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.fillRect(-back + cap, -h + 1, back + front - cap * 2, 1.6);
      [[-back, 1], [front - cap, -1]].forEach(c => {
        ctx.fillStyle = lg(0, -h - 3, 0, h + 3, [[0, '#fff1a8'], [0.4, '#f7c531'], [0.75, '#c98a0e'], [1, '#7a4a05']]);
        ctx.fillRect(c[0], -h - 2.5, cap, (h + 2.5) * 2);
        ctx.strokeStyle = OUT; ctx.lineWidth = 1.2;
        ctx.strokeRect(c[0], -h - 2.5, cap, (h + 2.5) * 2);
        ctx.strokeStyle = 'rgba(90,50,0,0.7)';
        ctx.beginPath();
        [6, 12, 18].forEach(o => { ctx.moveTo(c[0] + o, -h - 2.5); ctx.lineTo(c[0] + o, h + 2.5); });
        ctx.stroke();
      });
      ctx.fillStyle = gold(0, -8, 0, 8);
      ctx.beginPath(); ctx.arc(front, 0, 7.5, -Math.PI / 2, Math.PI / 2); ctx.fill();
      ctx.beginPath(); ctx.arc(-back, 0, 7.5, Math.PI / 2, -Math.PI / 2); ctx.fill();
      ctx.restore();
    };

    const feather = (x0, y0, cx, cy, x1, y1, ww, c0, c1, t, ph) => {
      const sw = Math.sin(t * 4 + ph) * 4;
      x1 += sw; y1 += sw * 0.3; cx += sw * 0.4;
      const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
      const nx = (-dy / len) * ww * 1.6, ny = (dx / len) * ww * 1.6;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(cx + nx, cy + ny, x1, y1);
      ctx.quadraticCurveTo(cx - nx, cy - ny, x0, y0);
      ctx.fillStyle = lg(x0, y0, x1, y1, [[0, c0], [1, c1]]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(60,5,5,0.7)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,230,150,0.85)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.stroke();
      ctx.fillStyle = '#2dd4bf';
      ctx.beginPath(); ctx.arc(lerp(cx, x1, 0.55), lerp(cy, y1, 0.55), 2.6, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fde68a';
      ctx.beginPath(); ctx.arc(lerp(cx, x1, 0.55), lerp(cy, y1, 0.55), 1, 0, TAU); ctx.fill();
    };

    const head = (t, state) => {
      const strike = state === 'strike';
      ctx.save();
      ctx.translate(6, -46);
      feather(2, -34, 16, -104, -62, -96, 6, '#8f1014', '#ff6b5a', t, 0);
      feather(-2, -30, -30, -80, -72, -66, 5, '#b45309', '#ffd36b', t, 1.3);
      ctx.fillStyle = '#6e3510';
      const n = 13;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + 0.2, da = 0.2, r0 = 17;
        const r1 = 25 + (i % 2) * 5 + (strike ? 5 + Math.sin(t * 12 + i) * 2 : Math.sin(t * 5 + i) * 1.5);
        ctx.beginPath();
        ctx.moveTo(Math.cos(a - da) * r0, Math.sin(a - da) * r0 * 1.05);
        ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1 * 1.05);
        ctx.lineTo(Math.cos(a + da) * r0, Math.sin(a + da) * r0 * 1.05);
        ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = '#b8661a'; ctx.strokeStyle = '#5b2a07'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(-18, -2, 9, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f0a090';
      ctx.beginPath(); ctx.arc(-18, -2, 5, 0, TAU); ctx.fill();
      ctx.fillStyle = lg(-18, -20, 18, 20, [[0, '#e8963a'], [1, '#a95a14']]);
      ctx.beginPath(); ctx.ellipse(0, 0, 19, 20, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-9, -6);
      ctx.bezierCurveTo(-9, -14, 2, -14, 6, -6);
      ctx.bezierCurveTo(10, -14, 24, -14, 23, -4);
      ctx.bezierCurveTo(23, 6, 20, 18, 8, 19);
      ctx.bezierCurveTo(-4, 18, -10, 6, -9, -6);
      ctx.closePath();
      ctx.fillStyle = lg(0, -14, 0, 19, [[0, '#ffe3bd'], [1, '#f0ae78']]);
      ctx.fill();
      ctx.strokeStyle = '#8a4a1a'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#d9822b';
      ctx.beginPath(); ctx.moveTo(-12, 8); ctx.lineTo(-21, 17); ctx.lineTo(-6, 14); ctx.closePath(); ctx.fill();
      ctx.save();
      ctx.shadowColor = strike ? 'rgba(255,60,20,0.95)' : 'rgba(255,210,70,0.95)';
      ctx.shadowBlur = strike ? 12 : 8;
      ctx.fillStyle = '#fffbe6';
      ctx.beginPath();
      ctx.moveTo(-6, -1); ctx.quadraticCurveTo(0, -4, 5, 2); ctx.quadraticCurveTo(0, 3.5, -6, -1);
      ctx.moveTo(11, 2); ctx.quadraticCurveTo(16, -4, 22, -1); ctx.quadraticCurveTo(16, 3.5, 11, 2);
      ctx.fill();
      ctx.restore();
      [[0.5, 0.3], [16.5, 0.1]].forEach(e => {
        ctx.fillStyle = strike ? '#ff4d1f' : '#fbbf24';
        ctx.beginPath(); ctx.arc(e[0], e[1], strike ? 2.7 : 2.3, 0, TAU); ctx.fill();
        ctx.fillStyle = '#1a0a02';
        ctx.beginPath(); ctx.ellipse(e[0], e[1], 0.9, 1.9, 0, 0, TAU); ctx.fill();
      });
      ctx.strokeStyle = '#2a1204'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-8, -9); ctx.lineTo(5, -3.5);
      ctx.moveTo(10, -3.5); ctx.lineTo(23, -8.5);
      ctx.stroke();
      ctx.fillStyle = '#4a1d08';
      ctx.beginPath(); ctx.arc(12, 8, 1.3, 0, TAU); ctx.arc(17, 7.5, 1.3, 0, TAU); ctx.fill();
      if (strike) {
        ctx.beginPath();
        ctx.moveTo(2, 12); ctx.quadraticCurveTo(10, 27, 21, 11); ctx.quadraticCurveTo(11, 13.5, 2, 12);
        ctx.fillStyle = '#5b0f0f'; ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(5, 12.4); ctx.lineTo(7.4, 17.5); ctx.lineTo(9.4, 12.8);
        ctx.moveTo(14, 12.6); ctx.lineTo(16.4, 17); ctx.lineTo(18.4, 12.2);
        ctx.fill();
      } else {
        ctx.strokeStyle = '#4a1d08'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(3, 14); ctx.quadraticCurveTo(11, 19, 20, 12); ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.moveTo(16, 14.6); ctx.lineTo(17.6, 17.8); ctx.lineTo(19.2, 13); ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(-18, -8); ctx.quadraticCurveTo(2, -24, 23, -12);
      ctx.lineTo(22, -6); ctx.quadraticCurveTo(2, -18, -18, -1);
      ctx.closePath();
      ctx.fillStyle = gold(0, -22, 0, -6);
      ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.stroke();
      for (let k = 0; k < 2; k++) {
        ctx.beginPath();
        ctx.moveTo(-10, -18 - k * 3);
        ctx.quadraticCurveTo(-30 - k * 8, -42 - k * 4, -52 - k * 10, -36 - k * 8);
        ctx.quadraticCurveTo(-36 - k * 6, -30 - k * 3, -26, -16);
        ctx.closePath();
        ctx.fillStyle = k ? lg(-50, -40, -10, -16, [[0, '#c98a0e'], [1, '#7a4a05']]) : gold(-50, -40, -10, -16);
        ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.3; ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(-12, -16); ctx.lineTo(-9, -30); ctx.lineTo(-3, -23); ctx.lineTo(4, -42);
      ctx.lineTo(10, -23); ctx.lineTo(16, -31); ctx.lineTo(19, -14);
      ctx.quadraticCurveTo(3, -22, -12, -16);
      ctx.closePath();
      ctx.fillStyle = gold(-12, -42, 19, -14);
      ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = rg(3, -26, 0.5, 4, [[0, '#fecaca'], [0.5, '#ef4444'], [1, '#7f1d1d']]);
      ctx.beginPath(); ctx.arc(4, -25, 3.4, 0, TAU); ctx.fill();
      ctx.restore();
    };

    const swoosh = (hx, hy, sa) => {
      ctx.save();
      ctx.lineCap = 'round';
      for (let k = 0; k < 4; k++) {
        ctx.strokeStyle = 'rgba(255,' + (225 - k * 25) + ',' + (130 - k * 20) + ',' + (0.55 - k * 0.12) + ')';
        ctx.lineWidth = 11 - k * 2.4;
        ctx.beginPath();
        ctx.arc(hx, hy, 108 + k * 5, sa - 0.75 - k * 0.2, sa - 0.08, false);
        ctx.stroke();
      }
      ctx.restore();
    };
    const sparks = (x, y, t) => {
      ctx.save();
      ctx.strokeStyle = '#fff3b0';
      ctx.lineCap = 'round';
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU + t * 3;
        const r0 = 8 + (i % 3) * 3, r1 = r0 + 12 + (i % 2) * 10;
        ctx.lineWidth = 2.2 - (i % 3) * 0.5;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0);
        ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1);
        ctx.stroke();
      }
      ctx.restore();
    };

    const S = 0.62;
    const state = w.state || 'fly';
    const t = w.t != null ? w.t : this.clock || 0;
    const ang = w.angle || 0;
    const dir = Math.cos(ang) >= 0 ? 1 : -1;
    const tilt = Math.atan2(Math.sin(ang), Math.abs(Math.cos(ang)));
    const strike = state === 'strike';

    let legs, sa, back = 60, front = 100, hand, glow = 8, p = 0, swinging = false;
    const FS = { x: 17, y: -24 };
    if (strike) {
      legs = [[-7, 24, -22, 38, -26, 57], [7, 24, 30, 34, 34, 57]];
      p = w.swing != null ? clamp(w.swing, 0, 1) : 0.5;
      if (p < 0.5) { sa = lerp(-2.5, 0.7, ease(p / 0.5)); swinging = p > 0.12; }
      else sa = lerp(0.7, -2.5, ease((p - 0.5) / 0.5));
      back = 42; front = 122; glow = 18;
      hand = { x: FS.x + Math.cos(sa) * 30, y: FS.y + Math.sin(sa) * 30 };
    } else if (state === 'drag') {
      legs = [[-7, 24, -24, 38, -28, 57], [7, 24, 26, 36, 26, 57]];
      sa = 0.35; back = 30; front = 130; glow = 14;
      hand = { x: 30, y: 6 };
    } else {
      legs = [[-7, 24, -24, 38, -30, 57], [7, 24, 26, 36, 26, 57]];
      sa = -0.5; back = 60; front = 100;
      hand = { x: 32, y: -8 };
    }

    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.scale(S * dir, S);
    ctx.rotate(tilt * 0.6);

    aura(t, state);
    if (!strike) speedLines(t);
    cloud(t);
    cape(t, state !== 'return');

    leg(...legs[0], true);
    leg(...legs[1], false);

    if (!strike) arm(-15, -24, -6, 12, true);
    pauldron(-18, -26, 0.9);
    skirt(t);
    torso(t);

    if (strike && swinging && p < 0.5) swoosh(hand.x, hand.y, sa);
    staff(hand.x, hand.y, sa, back, front, glow);
    arm(FS.x, FS.y, hand.x, hand.y, false);
    if (strike) {
      const bx = hand.x + Math.cos(sa) * 24, by = hand.y + Math.sin(sa) * 24;
      arm(-15, -24, bx, by, true);
    }
    pauldron(FS.x, FS.y - 2, 1.05);

    head(t, state);

    if (strike && p > 0.44 && p < 0.72) {
      sparks(hand.x + Math.cos(sa) * front, hand.y + Math.sin(sa) * front, t);
    }
    ctx.restore();
  },

  drawCaptives(ctx, m) {
    if (!this.capturedDragons.length) return;
    const kit = window.GameRenderer?.ArtKit?.(ctx);
    for (const d of this.capturedDragons) {
      if (kit && d.spine?.length) {
        const spine = d.spine, c = d.colors || {};
        for (let i = spine.length - 1; i >= 1; i--) {
          window.GameEntities.AliothSystem?.drawSegment?.(ctx, kit, spine, i, c.scale, c.deep, c.belly, c.gold, c.mane, 0);
        }
        window.GameEntities.AliothSystem?.drawHead?.(ctx, kit, d, spine[0], c.scale, c.deep, c.belly, c.gold, c.mane, 0);
      }
      this.drawChain(ctx, d, m.x, m.y + 12);
      ctx.save();
      ctx.strokeStyle = 'rgba(246, 212, 138, 0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(d.x, d.y + 10, 48, 26, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  },

  drawChain(ctx, dragon, x2, y2) {
    if (!dragon?.captured) return;
    const x1 = dragon.x, y1 = dragon.y + 12;
    const dist = Math.hypot(x2 - x1, y2 - y1) || 1;
    const links = Math.max(4, Math.min(18, Math.round(dist / 16)));
    ctx.save();
    ctx.strokeStyle = '#d6d3d1';
    ctx.fillStyle = '#f6d48a';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#f6d48a';
    ctx.shadowBlur = 6;
    for (let i = 0; i <= links; i++) {
      const t = i / links;
      const sag = Math.sin(t * Math.PI) * Math.min(30, dist * 0.12);
      const px = x1 + (x2 - x1) * t;
      const py = y1 + (y2 - y1) * t + sag;
      ctx.beginPath();
      ctx.ellipse(px, py, 4.5, 2.6, t * 1.2, 0, Math.PI * 2);
      ctx.stroke();
      if (i % 2 === 0) ctx.fill();
    }
    ctx.restore();
  },

  drawRitual(ctx, m) {
    if (this.wukong || this.ritualTime <= 0) return;
    const pct = Math.min(1, this.ritualTime / this.ritualNeeded);
    ctx.save();
    ctx.translate(m.x, m.y + 34);
    ctx.strokeStyle = 'rgba(246, 212, 138, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, m.radius + 70, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#f6d48a';
    ctx.beginPath();
    ctx.arc(0, 0, m.radius + 70, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
    ctx.stroke();
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f6e7a8';
    ctx.fillText(`Bái kiến ${this.pilgrims.length} người (x${this.pilgrims.length})  •  ${Math.round(pct * 100)}%`, 0, m.radius + 96);
    ctx.restore();
  }
};
