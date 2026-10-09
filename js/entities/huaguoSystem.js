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
    pawn.thought = 'Phần thưởng lớn: đủ năm người thành tâm, Đại Thánh cưỡi mây diệt một long thần.';
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

    if (this.pilgrims.length >= 5) {
      this.ritualTime += dt;
      for (const p of this.pilgrims) {
        p.objective = 'Bái kiến Tôn Ngộ Không tại Hoa Quả Sơn';
        p.thought = 'Năm người đã đủ. Thành tâm khấn, Đại Thánh sẽ ra tay.';
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
    for (const p of this.pilgrims) {
      window.GameRenderer?.VfxManager?.addEmotionMote?.(p, '🙏', '#f6d48a');
    }
    window.GameUI?.CombatTicker?.log(`☁️ Năm người bái kiến thành công! Tôn Ngộ Không cưỡi cân đẩu vân xuất kích diệt ${target.name}!`);
    window.GameEngine?.Audio?.play?.('ascension');
    window.GameRenderer?.VfxManager?.addEffect?.('rune', m.x, m.y, { radius: 160, color: '#f6d48a', life: 2 });
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
          cap.x = w.x - Math.cos(w.angle) * 70;
          cap.y = w.y - Math.sin(w.angle) * 70;
          cap.aimAngle = w.angle + Math.PI;
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
  },

  imprisonDragon(dragon) {
    const m = this.mountain;
    dragon.captured = true;
    dragon.isAlive = false;
    dragon.x = m.x;
    dragon.y = m.y + 6;
    dragon.vx = 0;
    dragon.vy = 0;
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
    if (this.wukong) this.drawWukong(ctx, this.wukong);
    this.drawCaptives(ctx, m);
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
    ctx.save();
    ctx.translate(w.x, w.y);
    const facing = Math.cos(w.angle) < 0 ? -1 : 1;
    ctx.scale(facing * 2.2, 2.2);

    // Cân đẩu vân dưới chân.
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#d9d3c7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 16, 22, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-13, 12, 11, 6.5, 0, 0, Math.PI * 2);
    ctx.ellipse(13, 12, 11, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Choàng đỏ bay sau lưng (hào quang đỏ).
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(-6, -12);
    ctx.quadraticCurveTo(-26, -4, -20, 16);
    ctx.quadraticCurveTo(-14, 6, -4, 4);
    ctx.closePath();
    ctx.fill();

    // Thân giáp vàng kim hào quang.
    ctx.fillStyle = '#e2b007';
    ctx.strokeStyle = '#7a4e06';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-9, -8);
    ctx.lineTo(9, -8);
    ctx.lineTo(11, 8);
    ctx.lineTo(-11, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#f6d48a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(0, 8);
    ctx.moveTo(-9, -2);
    ctx.lineTo(9, -2);
    ctx.stroke();

    // Đai đỏ ngọc hào quang.
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(-11, 6, 22, 4);
    ctx.fillStyle = '#f6d48a';
    ctx.beginPath();
    ctx.arc(0, 8, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Váy giáp chiến bào.
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(-11, 10);
    ctx.lineTo(11, 10);
    ctx.lineTo(8, 18);
    ctx.lineTo(-8, 18);
    ctx.closePath();
    ctx.fill();

    // Ủng vàng hào quang.
    ctx.fillStyle = '#e2b007';
    ctx.fillRect(-7, 17, 5, 5);
    ctx.fillRect(2, 17, 5, 5);

    // Đầu lông khỉ hào quang.
    ctx.fillStyle = '#c9843f';
    ctx.strokeStyle = '#5c3a1e';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, -16, 8.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-8, -17, 3, 0, Math.PI * 2);
    ctx.arc(8, -17, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f3d2a2';
    ctx.beginPath();
    ctx.ellipse(0, -15, 5, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1d1a26';
    ctx.beginPath();
    ctx.arc(-2, -16, 0.9, 0, Math.PI * 2);
    ctx.arc(2, -16, 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1d1a26';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(0, -13.4, 1.6, 0.15, Math.PI - 0.15);
    ctx.stroke();

    // Kim cô vàng kim hào quang.
    ctx.strokeStyle = '#f6d48a';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, -18, 8.6, 0.15, Math.PI - 0.15);
    ctx.stroke();
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.moveTo(-2, -26);
    ctx.lineTo(2, -26);
    ctx.lineTo(0, -34);
    ctx.closePath();
    ctx.fill();

    // Đuôi khỉ cong hào quang.
    ctx.strokeStyle = '#a86b30';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-8, 6);
    ctx.quadraticCurveTo(-20, 2, -16, -12);
    ctx.stroke();

    // Gậy Như Ý viền vàng hào quang.
    const swing = w.state === 'strike' ? -0.9 : 0.5;
    ctx.save();
    ctx.translate(10, -4);
    ctx.rotate(swing);
    const staff = ctx.createLinearGradient(0, 14, 0, -46);
    staff.addColorStop(0, '#b45309');
    staff.addColorStop(0.5, '#f6d48a');
    staff.addColorStop(1, '#b45309');
    ctx.strokeStyle = staff;
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(0, 14);
    ctx.lineTo(0, -44);
    ctx.stroke();
    ctx.fillStyle = '#f6d48a';
    ctx.fillRect(-4, -48, 8, 6);
    ctx.fillRect(-4, 12, 8, 6);
    ctx.restore();

    // Hào quang vàng kim quanh thân.
    ctx.save();
    ctx.globalAlpha = 0.75;
    const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 28);
    glow.addColorStop(0, '#f6d48a');
    glow.addColorStop(1, 'rgba(246, 212, 138, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (w.state === 'strike') {
      ctx.save();
      ctx.globalAlpha = 0.8;
      const staffGlow = ctx.createRadialGradient(0, -22, 2, 0, -22, 18);
      staffGlow.addColorStop(0, '#f6d48a');
      staffGlow.addColorStop(1, 'rgba(246, 212, 138, 0)');
      ctx.fillStyle = staffGlow;
      ctx.beginPath();
      ctx.arc(0, -22, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  },

  drawCaptives(ctx, m) {
    if (!this.capturedDragons.length) return;
    ctx.save();
    ctx.translate(m.x, m.y + 10);
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f6e7a8';
    ctx.fillText('🔒 ' + this.capturedDragons.length + ' long thần', 0, 36);
    for (let i = 0; i < this.capturedDragons.length; i++) {
      ctx.fillStyle = this.capturedDragons[i].colors?.scale || '#c4342d';
      ctx.beginPath();
      ctx.arc(-16 + i * 16, 20, 5, 0, Math.PI * 2);
      ctx.fill();
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
    ctx.fillText(`Bái kiến ${this.pilgrims.length}/5  •  ${Math.round(pct * 100)}%`, 0, m.radius + 96);
    ctx.restore();
  }
};
