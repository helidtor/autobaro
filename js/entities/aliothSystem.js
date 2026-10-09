/**
 * aliothSystem.js - Thực thể Hư Không Alioth (Loki)
 * Đám mây bão đen tím bất tử, trôi chậm khắp bản đồ, nuốt chửng mọi sinh vật chạm phải.
 */
window.GameEntities = window.GameEntities || {};

window.GameEntities.AliothSystem = {
  alioth: null,
  smokePuffs: [],
  lightningBolts: [],
  clock: 0,
  roarCooldown: 0,

  init: function(mapWidth, mapHeight) {
    this.smokePuffs = [];
    this.lightningBolts = [];
    this.clock = 0;
    this.roarCooldown = 0;

    // Spawn ở một góc xa ngẫu nhiên trên bản đồ
    const corners = [
      { x: 250, y: 250 },
      { x: mapWidth - 250, y: 250 },
      { x: 250, y: mapHeight - 250 },
      { x: mapWidth - 250, y: mapHeight - 250 }
    ];
    const spawn = corners[Math.floor(Math.random() * corners.length)];

    this.alioth = {
      id: 'alioth_entity',
      name: 'Thực Thể Hư Không Alioth',
      isAlioth: true,
      isAlive: true,
      invincible: true,
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      targetX: mapWidth / 2,
      targetY: mapHeight / 2,
      speed: 32, // Rất chậm
      radius: 95, // Bán kính nuốt chửng
      visualRadius: 150, // Bán kính hiển thị sương khói
      aimAngle: 0,
      turnSpeed: 0.8,
      preyTarget: null,
      retargetTimer: 0,
      jawOpenProgress: 0.3,
      isMonster: true,
      tier: 6,
      tierName: 'Thượng Cổ',
      scale: 1.8,
      currentHp: 999999,
      maxHp: 999999,
      attack: 999,
      defense: 999,
      speed: 32,
      isAlioth: true
    };

    // Khởi tạo các cụm khói mây quanh tâm Alioth
    for (let i = 0; i < 36; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 110;
      this.smokePuffs.push({
        relX: Math.cos(angle) * dist,
        relY: Math.sin(angle) * dist,
        baseR: 35 + Math.random() * 45,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.8,
        pulseSpeed: 1.5 + Math.random() * 2,
        pulseOffset: Math.random() * Math.PI * 2,
        shade: Math.random() < 0.4 ? '#180a29' : Math.random() < 0.7 ? '#2a0e44' : '#0d0416',
        alpha: 0.55 + Math.random() * 0.35
      });
    }

    if (window.GameUI && window.GameUI.CombatTicker) {
      window.GameUI.CombatTicker.log('🌌 [CẢNH BÁO] Thực Thể Hư Không Alioth đã xuất hiện và bắt đầu nuốt chửng dòng thời gian!');
    }
  },

  reset: function(mapWidth, mapHeight) {
    this.init(mapWidth, mapHeight);
  },

  avoid: function(pawn, dt) {
    const a = this.alioth;
    if (!a || !a.isAlive) return false;
    const dist = Math.hypot(pawn.x - a.x, pawn.y - a.y);
    if (dist > 360) return false;

    const M = window.GameEngine.MapTerrain;
    pawn.plan = null;
    pawn.targetEnemy = null;
    pawn.chase = null;
    pawn.fear = Math.min(100, (pawn.fear || 0) + 40);
    pawn.objective = '🚨 THÁO CHẠY KHỎI ALIOT!';
    pawn.thought = 'Thực Thể Hư Không Alioth đang tới gần! Chạy mau trước khi bị nuốt chửng!';

    const awayAngle = Math.atan2(pawn.y - a.y, pawn.x - a.x);
    pawn.aimAngle = awayAngle;
    const speed = M.getMoveSpeed(pawn) * 1.25;
    M.moveEntity(pawn, Math.cos(awayAngle) * speed * dt, Math.sin(awayAngle) * speed * dt);
    return true;
  },

  update: function(dt) {
    const a = this.alioth;
    if (!a || !a.isAlive) return;

    this.clock += dt;
    this.roarCooldown -= dt;

    const G = window.GameManager;
    const mapW = G?.width || 5200;
    const mapH = G?.height || 5200;

    // 1. Tìm mục tiêu sống gần nhất (Pawn hoặc Monster) để từ từ lướt đến
    a.retargetTimer -= dt;
    if (a.retargetTimer <= 0 || !a.preyTarget || !a.preyTarget.isAlive) {
      a.retargetTimer = 2.0 + Math.random() * 1.5;
      let closest = null;
      let closestDist = Infinity;

      // Ưu tiên bot / player
      const pawns = (G?.pawns || []).filter(p => p.isAlive);
      for (const p of pawns) {
        const d = Math.hypot(p.x - a.x, p.y - a.y);
        if (d < closestDist) {
          closestDist = d;
          closest = p;
        }
      }

      // Nếu không có pawn trong bán kính 1200, tìm quái vật
      if (!closest || closestDist > 1200) {
        const monsters = (G?.monsters || []).filter(m => m.isAlive && !m.isAncientClone);
        for (const m of monsters) {
          const d = Math.hypot(m.x - a.x, m.y - a.y);
          if (d < closestDist) {
            closestDist = d;
            closest = m;
          }
        }
      }

      a.preyTarget = closest;
      if (closest) {
        a.targetX = closest.x;
        a.targetY = closest.y;
      } else {
        // Tuần tra ngẫu nhiên khắp map nếu không có ai
        if (Math.hypot(a.x - a.targetX, a.y - a.targetY) < 150) {
          a.targetX = 400 + Math.random() * (mapW - 800);
          a.targetY = 400 + Math.random() * (mapH - 800);
        }
      }
    } else {
      if (a.preyTarget && a.preyTarget.isAlive) {
        a.targetX = a.preyTarget.x;
        a.targetY = a.preyTarget.y;
      }
    }

    // 2. Di chuyển chậm xuyên qua mọi địa hình
    const dx = a.targetX - a.x;
    const dy = a.targetY - a.y;
    const dist = Math.hypot(dx, dy);
    const targetAngle = Math.atan2(dy, dx);

    // Xoay góc mặt từ từ về hướng di chuyển
    let diff = targetAngle - a.aimAngle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    a.aimAngle += Math.sign(diff) * Math.min(Math.abs(diff), a.turnSpeed * dt);

    if (dist > 15) {
      const step = a.speed * dt;
      a.vx = Math.cos(a.aimAngle) * step;
      a.vy = Math.sin(a.aimAngle) * step;
      a.x += a.vx;
      a.y += a.vy;
    } else {
      a.vx = 0;
      a.vy = 0;
    }

    // Giữ trong giới hạn map
    a.x = Math.max(80, Math.min(mapW - 80, a.x));
    a.y = Math.max(80, Math.min(mapH - 80, a.y));

    // 3. Nuốt chửng mọi thực thể chạm vào bán kính nuốt
    this.devourPrey(a);

    // 4. Cập nhật xoay các cụm khói & tạo tia sét bên trong
    for (const puff of this.smokePuffs) {
      puff.rot += puff.rotSpeed * dt;
    }

    // Sinh tia sét tím ngẫu nhiên bên trong tầng mây
    if (Math.random() < 0.25) {
      this.generateLightning();
    }
    for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
      this.lightningBolts[i].life -= dt;
      if (this.lightningBolts[i].life <= 0) {
        this.lightningBolts.splice(i, 1);
      }
    }
  },

  devourPrey: function(a) {
    const G = window.GameManager;
    const C = window.GameEntities.CombatSystem;
    const killRadius = a.radius;

    // Quét pawns (người chơi & bot)
    const pawns = (G?.pawns || []).filter(p => p.isAlive);
    for (const p of pawns) {
      const dist = Math.hypot(p.x - a.x, p.y - a.y);
      if (dist <= killRadius) {
        this.executeDevour(p);
      }
    }

    // Quét quái vật
    const monsters = (G?.monsters || []).filter(m => m.isAlive && !m.isAncient && !m.isAncientClone);
    for (const m of monsters) {
      const dist = Math.hypot(m.x - a.x, m.y - a.y);
      if (dist <= killRadius) {
        this.executeDevour(m);
      }
    }
  },

  executeDevour: function(victim) {
    if (!victim || !victim.isAlive) return;
    const C = window.GameEntities.CombatSystem;
    const V = window.GameRenderer.VfxManager;

    victim.currentHp = 0;
    victim.action = null;
    victim.attackState = null;

    // Hiệu ứng tia sét tím và khói nuốt chửng
    if (V) {
      V.addEffect('impact', victim.x, victim.y, {
        radius: 65,
        color: '#9b59b6',
        life: 0.8
      });
      V.addBurstParticles(victim.x, victim.y, '#e74c3c', 25);
      V.addBurstParticles(victim.x, victim.y, '#3b1459', 35);
      V.addDamageNumber(victim.x, victim.y - 30, 'NUỐT CHỬNG', 'crit');
    }

    // Âm thanh
    if (window.GameEngine.Audio) {
      window.GameEngine.Audio.play('death', victim, 'human');
    }

    // Thông báo Ticker
    if (window.GameUI && window.GameUI.CombatTicker) {
      window.GameUI.CombatTicker.log(`⚡ [ALIOTH] Thực Thể Hư Không đã nuốt chửng ${victim.name} vào cõi hư vô!`);
    }

    if (C && C.handleDeath) {
      C.handleDeath(this.alioth, victim);
    } else {
      victim.isAlive = false;
    }
  },

  generateLightning: function() {
    const a = this.alioth;
    if (!a) return;
    const startAngle = Math.random() * Math.PI * 2;
    const startDist = Math.random() * 60;
    const startX = a.x + Math.cos(startAngle) * startDist;
    const startY = a.y + Math.sin(startAngle) * startDist;

    const points = [{ x: startX, y: startY }];
    let curX = startX;
    let curY = startY;
    const segments = 3 + Math.floor(Math.random() * 4);
    const boltAngle = startAngle + (Math.random() - 0.5) * 1.5;

    for (let i = 0; i < segments; i++) {
      const len = 15 + Math.random() * 20;
      const deviation = (Math.random() - 0.5) * 1.8;
      curX += Math.cos(boltAngle + deviation) * len;
      curY += Math.sin(boltAngle + deviation) * len;
      points.push({ x: curX, y: curY });
    }

    this.lightningBolts.push({
      points,
      color: Math.random() < 0.6 ? '#d980fa' : '#ff4757',
      life: 0.12 + Math.random() * 0.1
    });
  },

  render: function(ctx) {
    const a = this.alioth;
    if (!a || !a.isAlive) return;

    ctx.save();

    // 1. Vẽ quầng sáng năng lượng tím đen nền dưới chân
    const bgGrad = ctx.createRadialGradient(a.x, a.y, 20, a.x, a.y, a.visualRadius * 1.3);
    bgGrad.addColorStop(0, 'rgba(44, 11, 77, 0.65)');
    bgGrad.addColorStop(0.5, 'rgba(24, 6, 45, 0.45)');
    bgGrad.addColorStop(1, 'rgba(10, 2, 20, 0)');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.visualRadius * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // 2. Vẽ các cụm khói mây cuộn trào (procedural dark turbulent clouds)
    for (const puff of this.smokePuffs) {
      const pulse = Math.sin(this.clock * puff.pulseSpeed + puff.pulseOffset) * 8;
      const px = a.x + puff.relX;
      const py = a.y + puff.relY;
      const pr = puff.baseR + pulse;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(puff.rot);

      const grad = ctx.createRadialGradient(0, 0, pr * 0.2, 0, 0, pr);
      grad.addColorStop(0, puff.shade);
      grad.addColorStop(0.7, 'rgba(20, 5, 35, 0.85)');
      grad.addColorStop(1, 'rgba(10, 2, 18, 0)');

      ctx.fillStyle = grad;
      ctx.globalAlpha = puff.alpha;
      ctx.beginPath();
      ctx.arc(0, 0, pr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Vẽ khuôn mặt quái thú Alioth bằng khói tối & miệng/mắt phát sáng
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.aimAngle);

    // Họng đỏ/hồng rực há mở nuốt chửng
    const jawGlow = ctx.createRadialGradient(40, 0, 5, 40, 0, 65);
    jawGlow.addColorStop(0, 'rgba(255, 60, 60, 0.95)');
    jawGlow.addColorStop(0.3, 'rgba(235, 47, 6, 0.75)');
    jawGlow.addColorStop(0.7, 'rgba(120, 10, 50, 0.4)');
    jawGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = jawGlow;
    ctx.beginPath();
    // Vòm miệng quái thú mở rộng
    ctx.ellipse(38, 0, 48, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Răng nanh khói đen tua tủa
    ctx.fillStyle = '#0a0314';
    ctx.beginPath();
    ctx.moveTo(25, -20);
    ctx.lineTo(45, -10);
    ctx.lineTo(30, -5);
    ctx.lineTo(52, 0);
    ctx.lineTo(30, 5);
    ctx.lineTo(45, 10);
    ctx.lineTo(25, 20);
    ctx.lineTo(15, 0);
    ctx.closePath();
    ctx.fill();

    // Hai mắt đỏ rực phát sáng uy nghiêm
    const eyeGlow = (ex, ey) => {
      const g = ctx.createRadialGradient(ex, ey, 2, ex, ey, 18);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.2, '#ff3838');
      g.addColorStop(0.6, 'rgba(255, 50, 50, 0.5)');
      g.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(ex, ey, 18, 0, Math.PI * 2);
      ctx.fill();

      // Đồng tử rực lửa
      ctx.fillStyle = '#ff7675';
      ctx.beginPath();
      ctx.ellipse(ex, ey, 5, 9, 0.2, 0, Math.PI * 2);
      ctx.fill();
    };

    eyeGlow(20, -22);
    eyeGlow(20, 22);

    ctx.restore();

    // 4. Vẽ các tia chớp điện giật bên trong đám mây
    for (const bolt of this.lightningBolts) {
      if (!bolt.points || bolt.points.length < 2) continue;
      ctx.save();
      ctx.strokeStyle = bolt.color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = bolt.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(bolt.points[0].x, bolt.points[0].y);
      for (let i = 1; i < bolt.points.length; i++) {
        ctx.lineTo(bolt.points[i].x, bolt.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 5. Viền sương mờ cảnh báo bán kính nuốt
    ctx.strokeStyle = 'rgba(165, 94, 234, 0.22)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Tên hiển thị trên đầu
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e056fd';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 6;
    ctx.fillText('⚡ ALIOT HƯ KHÔNG ⚡', a.x, a.y - a.visualRadius * 0.75);
    ctx.font = '11px Arial';
    ctx.fillStyle = '#ff7979';
    ctx.fillText('Bất Tử • Nuốt Chửng', a.x, a.y - a.visualRadius * 0.75 + 14);

    ctx.restore();
  }
};
