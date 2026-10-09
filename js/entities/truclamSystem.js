/**
 * truclamSystem.js - Thiền Viện Trúc Lâm & Đoàn Quân Thiết Kỵ Chi Viện
 *
 * Tính năng:
 * 1. Nằm trong vùng Rừng Trúc / Làng Trúc.
 * 2. Ưu tiên trong AI não bộ bot (mục phần thưởng giống Hoa Quả Sơn).
 * 3. Khi vào viện: Bot phải chiến đấu đánh bại 3 vị Quan Tướng hộ viện.
 * 4. Phần thưởng khi thắng:
 *    - Nhận phần thưởng thăng cấp (EXP lớn, hồi đầy máu).
 *    - Phái đoàn quân có 1 Tướng Cưỡi Ngựa (Thiết Kỵ Tướng Quân) + 2 Hộ Vệ đi theo đánh quái trong 8 phút (480s).
 */
window.GameEntities = window.GameEntities || {};

window.GameEntities.TrucLamSystem = {
  temple: null,
  guardians: [],
  legion: null,
  clock: 0,
  cooldown: 0,
  mapW: 5200,
  mapH: 5200,

  init(mapWidth, mapHeight) {
    this.clock = 0;
    this.cooldown = 0;
    this.mapW = mapWidth || 5200;
    this.mapH = mapHeight || 5200;
    this.legion = null;

    // Vị trí Thiền Viện Trúc Lâm có sẵn trên map (design: 510, 730 -> world x2: 1020, 1460)
    this.temple = {
      x: 1020,
      y: 1460,
      radius: 240,
      name: 'THIỀN VIỆN TRÚC LÂM'
    };

    this.spawnGuardians();
    window.GameUI?.CombatTicker?.log('🎋 Chuông chùa Thiền Viện Trúc Lâm ngân vang giữa rừng trúc. Ba vị quan tướng trấn viện đợi người hữu duyên.');
  },

  reset(mapWidth, mapHeight) {
    this.init(mapWidth, mapHeight);
  },

  spawnGuardians() {
    const t = this.temple;
    if (!t) return;
    this.guardians = [
      {
        id: 'tl_gen_chan',
        name: 'Trấn Viện Tướng Quân',
        title: 'Chưởng Viện',
        x: t.x,
        y: t.y - 100,
        homeX: t.x,
        homeY: t.y - 100,
        vx: 0,
        vy: 0,
        aimAngle: Math.PI / 2,
        maxHp: 560,
        currentHp: 560,
        attack: 28,
        defense: 10,
        attackCooldown: 0,
        isAlive: true,
        isGuardian: true,
        isMonster: true, // để bot nhận diện đánh nhau
        weapon: 'blade',
        color: '#b91c1c',
        armorCol: '#f59e0b'
      },
      {
        id: 'tl_gen_tien',
        name: 'Tiền Phong Tướng Quân',
        title: 'Tiền Phong',
        x: t.x - 80,
        y: t.y,
        homeX: t.x - 80,
        homeY: t.y,
        vx: 0,
        vy: 0,
        aimAngle: 0,
        maxHp: 440,
        currentHp: 440,
        attack: 24,
        defense: 8,
        attackCooldown: 0,
        isAlive: true,
        isGuardian: true,
        isMonster: true,
        weapon: 'spear',
        color: '#0284c7',
        armorCol: '#e2e8f0'
      },
      {
        id: 'tl_gen_ho',
        name: 'Hộ Pháp Tướng Quân',
        title: 'Hộ Pháp',
        x: t.x + 80,
        y: t.y,
        homeX: t.x + 80,
        homeY: t.y,
        vx: 0,
        vy: 0,
        aimAngle: Math.PI,
        maxHp: 480,
        currentHp: 480,
        attack: 26,
        defense: 9,
        attackCooldown: 0,
        isAlive: true,
        isGuardian: true,
        isMonster: true,
        weapon: 'hammer',
        color: '#15803d',
        armorCol: '#78716c'
      }
    ];
  },

  // Điểm ưu tiên cao cho Bot AI (mục phần thưởng như Hoa Quả Sơn)
  challengeScore(pawn) {
    const t = this.temple;
    if (!t || !pawn?.isAlive || this.cooldown > 0) return 0;
    // Nếu đoàn quân đang phục vụ chính bot này thì không cần đi nữa
    if (this.legion?.active && this.legion?.owner === pawn) return 0;
    // Nếu các quan tướng đã bị hạ và viện đang chờ hồi phục
    const aliveGuardians = this.guardians.filter(g => g.isAlive);
    if (!aliveGuardians.length && this.legion?.active) return 0;

    const dist = Math.hypot(pawn.x - t.x, pawn.y - t.y);
    if (dist > 2800) return 0;
    const M = window.GameEngine.MapTerrain;
    if (M && !M.canTravel(pawn, t.x, t.y)) return 0;
    return 330 - dist / 35;
  },

  seekTrucLam(pawn, dt) {
    const t = this.temple;
    if (!t) return;
    const dist = Math.hypot(pawn.x - t.x, pawn.y - t.y);
    pawn.isHiding = false;
    pawn.objective = 'Thử thách Thiền Viện Trúc Lâm: giao chiến quan tướng';
    pawn.thought = 'Khuất phục các quan tướng để thăng cấp và triệu hồi đoàn quân Thiết Kỵ chi viện 8 phút!';

    const alive = this.guardians.filter(g => g.isAlive);
    if (alive.length > 0) {
      // Tìm vị tướng gần nhất để đánh
      let closest = alive[0], cDist = Math.hypot(pawn.x - alive[0].x, pawn.y - alive[0].y);
      for (let i = 1; i < alive.length; i++) {
        const d = Math.hypot(pawn.x - alive[i].x, pawn.y - alive[i].y);
        if (d < cDist) { cDist = d; closest = alive[i]; }
      }

      if (cDist > 45) {
        window.GameAI.AIBrain.moveToTarget(pawn, closest.x, closest.y, dt);
      } else {
        // Đánh tướng
        pawn.aimAngle = Math.atan2(closest.y - pawn.y, closest.x - pawn.x);
        pawn.vx = 0; pawn.vy = 0;
        this.botStrikeGuardian(pawn, closest, dt);
      }
    } else {
      // Tướng đã hạ, di chuyển vào trung tâm nhận thưởng
      if (dist > 30) {
        window.GameAI.AIBrain.moveToTarget(pawn, t.x, t.y, dt);
      } else {
        pawn.vx = 0; pawn.vy = 0;
      }
    }
  },

  botStrikeGuardian(pawn, guardian, dt) {
    pawn.attackCooldown = (pawn.attackCooldown || 0) - dt;
    if (pawn.attackCooldown > 0) return;
    pawn.attackCooldown = 0.9 + Math.random() * 0.4;

    const dmg = Math.round((pawn.attack || 20) * (1 - guardian.defense / (guardian.defense + 100)));
    guardian.currentHp -= dmg;
    const V = window.GameRenderer?.VfxManager;
    V?.addDamageNumber?.(guardian.x, guardian.y - 25, '-' + dmg, 'normal');
    V?.addBurstParticles?.(guardian.x, guardian.y, '#f59e0b', 8);
    window.GameEngine?.Audio?.play?.('impact', guardian, 'blade');

    if (guardian.currentHp <= 0) {
      guardian.isAlive = false;
      guardian.currentHp = 0;
      window.GameUI?.CombatTicker?.log(`⚔️ ${pawn.name} đã đánh bại ${guardian.name} tại Trúc Lâm!`);
      V?.addBurstParticles?.(guardian.x, guardian.y, '#e11d48', 25);
      this.checkMonasteryCleared(pawn);
    }
  },

  checkMonasteryCleared(victorPawn) {
    const alive = this.guardians.filter(g => g.isAlive);
    if (alive.length > 0) return;

    // Toàn bộ quan tướng đã bị đánh bại!
    const t = this.temple;
    const G = window.GameManager;
    const V = window.GameRenderer?.VfxManager;

    // Tìm các bot trong khuôn viên viện để chia sẻ phần thưởng cấp
    const participants = (G?.pawns || []).filter(p => p.isAlive && Math.hypot(p.x - t.x, p.y - t.y) <= t.radius + 60);
    const recipients = participants.length > 0 ? participants : [victorPawn];

    for (const p of recipients) {
      p.currentExp = (p.currentExp || 0) + 900;
      window.GameEntities.CombatSystem?.checkLevelUp?.(p);
      p.currentHp = p.maxHp; // hồi đầy máu
      V?.addEffect?.('heal', p.x, p.y, { radius: 50, color: '#10b981', life: 1.2 });
      V?.addEmotionMote?.(p, '⭐', '#f59e0b');
    }

    V?.addEffect?.('rune', t.x, t.y, { radius: 180, color: '#f59e0b', life: 2.5 });
    window.GameEngine?.Audio?.play?.('ascension');
    window.GameUI?.CombatTicker?.log(`🏛️ Toàn bộ quan tướng Trúc Lâm đã bị khuất phục! ${victorPawn.name} nhận phần thưởng cấp và triệu hồi đoàn quân Thiết Kỵ chi viện (8 phút)!`);

    // Phái đoàn quân có 1 tướng cưỡi ngựa đi theo đánh quái
    this.deployLegion(victorPawn);
  },

  deployLegion(owner) {
    const t = this.temple;
    this.legion = {
      active: true,
      owner,
      life: 480, // Tồn tại đúng 8 phút = 480 giây
      maxLife: 480,
      // Tướng cưỡi ngựa
      general: {
        id: 'tl_mounted_general',
        name: 'Thiết Kỵ Tướng Quân',
        x: owner.x - 35,
        y: owner.y,
        vx: 0,
        vy: 0,
        aimAngle: owner.aimAngle || 0,
        speed: 150,
        attack: 48,
        attackCooldown: 0,
        targetMonster: null,
        gallopPhase: 0
      },
      // Đoàn quân hộ vệ đi theo
      soldiers: [
        {
          id: 'tl_guard_1',
          name: 'Trúc Lâm Tiền Vệ',
          x: owner.x - 65,
          y: owner.y - 30,
          vx: 0,
          vy: 0,
          aimAngle: 0,
          speed: 115,
          attack: 24,
          attackCooldown: 0,
          weapon: 'spear'
        },
        {
          id: 'tl_guard_2',
          name: 'Trúc Lâm Hậu Vệ',
          x: owner.x - 65,
          y: owner.y + 30,
          vx: 0,
          vy: 0,
          aimAngle: 0,
          speed: 115,
          attack: 22,
          attackCooldown: 0,
          weapon: 'sword'
        }
      ]
    };
  },

  update(dt) {
    this.clock += dt;
    this.cooldown = Math.max(0, this.cooldown - dt);

    // 1. Cập nhật các quan tướng trấn viện khi còn sống
    this.updateGuardians(dt);

    // 2. Cập nhật phái đoàn quân đi theo đánh quái (8 phút)
    if (this.legion?.active) {
      this.updateLegion(dt);
    } else if (this.cooldown <= 0 && this.guardians.every(g => !g.isAlive)) {
      // Hồi phục lại viện cho lượt sau
      this.spawnGuardians();
      window.GameUI?.CombatTicker?.log('🎋 Ba vị quan tướng Thiền Viện Trúc Lâm đã trở lại trấn giữ viện.');
    }
  },

  updateGuardians(dt) {
    const t = this.temple;
    const G = window.GameManager;
    if (!t || !G) return;

    for (const g of this.guardians) {
      if (!g.isAlive) continue;
      g.attackCooldown = Math.max(0, g.attackCooldown - dt);

      // Tìm bot trong tầm viện để tự vệ phản công
      const nearbyBots = (G.pawns || []).filter(p => p.isAlive && Math.hypot(p.x - g.x, p.y - g.y) <= 160);
      if (nearbyBots.length > 0) {
        const target = nearbyBots[0];
        const dist = Math.hypot(target.x - g.x, target.y - g.y);
        g.aimAngle = Math.atan2(target.y - g.y, target.x - g.x);

        if (dist > 38) {
          const step = Math.min(dist - 35, g.speed * dt);
          g.x += Math.cos(g.aimAngle) * step;
          g.y += Math.sin(g.aimAngle) * step;
        } else if (g.attackCooldown <= 0) {
          // Tướng ra đòn
          g.attackCooldown = 1.3 + Math.random() * 0.4;
          const dmg = Math.round(g.attack * (1 - (target.defense || 5) / ((target.defense || 5) + 100)));
          target.currentHp = Math.max(1, target.currentHp - dmg);
          target.lastDamageTakenAt = window.GameManager?.matchTime || 0;
          const V = window.GameRenderer?.VfxManager;
          V?.addDamageNumber?.(target.x, target.y - 20, '-' + dmg, 'crit');
          V?.addEffect?.('impact', target.x, target.y, { radius: 35, color: '#f59e0b', life: 0.35 });
          window.GameEngine?.Audio?.play?.('impact', target, 'blade');
        }
      } else {
        // Trở về vị trí cũ nếu không có ai
        const dHome = Math.hypot(g.homeX - g.x, g.homeY - g.y);
        if (dHome > 5) {
          const step = Math.min(dHome, g.speed * 0.7 * dt);
          const ang = Math.atan2(g.homeY - g.y, g.homeX - g.x);
          g.x += Math.cos(ang) * step;
          g.y += Math.sin(ang) * step;
          g.aimAngle = ang;
        }
      }
    }
  },

  updateLegion(dt) {
    const leg = this.legion;
    if (!leg?.active) return;

    leg.life -= dt;
    if (leg.life <= 0 || !leg.owner?.isAlive) {
      // Hết 8 phút hoặc chủ nhân đã chết -> Thu quân
      leg.active = false;
      this.cooldown = 60; // 60s sau viện mở lại
      const reason = !leg.owner?.isAlive ? 'chủ nhân đã gục ngã' : 'đã hết thời gian chi viện (8 phút)';
      window.GameUI?.CombatTicker?.log(`🏇 Đoàn quân Trúc Lâm ${reason}, cúi chào và trở về Thiền Viện.`);
      window.GameRenderer?.VfxManager?.addBurstParticles?.(leg.general.x, leg.general.y, '#f59e0b', 30);
      return;
    }

    const owner = leg.owner;
    const G = window.GameManager;
    const V = window.GameRenderer?.VfxManager;

    // 1. Quét tìm quái vật xung quanh bot để đánh
    const monsters = (G?.monsters || []).filter(m => m.isAlive && Math.hypot(m.x - owner.x, m.y - owner.y) <= 420);
    let targetMon = null;
    if (monsters.length > 0) {
      monsters.sort((a, b) => Math.hypot(a.x - owner.x, a.y - owner.y) - Math.hypot(b.x - owner.x, b.y - owner.y));
      targetMon = monsters[0];
    }

    // 2. Cập nhật Tướng Cưỡi Ngựa
    const gen = leg.general;
    gen.gallopPhase = (gen.gallopPhase || 0) + dt * 12;
    gen.attackCooldown = Math.max(0, (gen.attackCooldown || 0) - dt);

    if (targetMon) {
      // Lao đến đánh quái
      const dMon = Math.hypot(targetMon.x - gen.x, targetMon.y - gen.y);
      gen.aimAngle = Math.atan2(targetMon.y - gen.y, targetMon.x - gen.x);
      if (dMon > 45) {
        const step = Math.min(dMon - 38, gen.speed * dt);
        gen.x += Math.cos(gen.aimAngle) * step;
        gen.y += Math.sin(gen.aimAngle) * step;
      } else if (gen.attackCooldown <= 0) {
        // Tướng đâm thương diệt quái
        gen.attackCooldown = 0.95;
        const dmg = Math.round(gen.attack * (1.2 + Math.random() * 0.4));
        targetMon.currentHp = Math.max(0, targetMon.currentHp - dmg);
        V?.addDamageNumber?.(targetMon.x, targetMon.y - 25, 'KỴ KÍCH: -' + dmg, 'crit');
        V?.addEffect?.('impact', targetMon.x, targetMon.y, { radius: 55, color: '#f59e0b', life: 0.4 });
        V?.addBurstParticles?.(targetMon.x, targetMon.y, '#eab308', 12);
        window.GameEngine?.Audio?.play?.('impact', targetMon, 'spear');

        if (targetMon.currentHp <= 0) {
          targetMon.isAlive = false;
          window.GameUI?.CombatTicker?.log(`🏇 Thiết Kỵ Tướng Quân đâm thương tiêu diệt ${targetMon.name}!`);
          if (G && window.GameEntities?.CombatSystem) {
            window.GameEntities.CombatSystem.handleDeath(owner, targetMon);
          }
        }
      }
    } else {
      // Đi theo phò tá chủ nhân
      const targetX = owner.x - Math.cos(owner.aimAngle || 0) * 55;
      const targetY = owner.y - Math.sin(owner.aimAngle || 0) * 55;
      const dOwner = Math.hypot(targetX - gen.x, targetY - gen.y);
      if (dOwner > 25) {
        gen.aimAngle = Math.atan2(targetY - gen.y, targetX - gen.x);
        const step = Math.min(dOwner, gen.speed * dt);
        gen.x += Math.cos(gen.aimAngle) * step;
        gen.y += Math.sin(gen.aimAngle) * step;
      }
    }

    // 3. Cập nhật Binh Sĩ Hộ Vệ
    leg.soldiers.forEach((sol, idx) => {
      sol.attackCooldown = Math.max(0, (sol.attackCooldown || 0) - dt);
      if (targetMon) {
        const dMon = Math.hypot(targetMon.x - sol.x, targetMon.y - sol.y);
        sol.aimAngle = Math.atan2(targetMon.y - sol.y, targetMon.x - sol.x);
        if (dMon > 35) {
          const step = Math.min(dMon - 30, sol.speed * dt);
          sol.x += Math.cos(sol.aimAngle) * step;
          sol.y += Math.sin(sol.aimAngle) * step;
        } else if (sol.attackCooldown <= 0) {
          sol.attackCooldown = 1.1;
          const dmg = Math.round(sol.attack * (1 + Math.random() * 0.3));
          targetMon.currentHp = Math.max(0, targetMon.currentHp - dmg);
          V?.addDamageNumber?.(targetMon.x, targetMon.y - 18, '-' + dmg, 'normal');
          V?.addBurstParticles?.(targetMon.x, targetMon.y, '#94a3b8', 6);
          if (targetMon.currentHp <= 0 && targetMon.isAlive) {
            targetMon.isAlive = false;
            window.GameUI?.CombatTicker?.log(`🛡️ Hộ Vệ Trúc Lâm chém hạ ${targetMon.name}!`);
            if (G && window.GameEntities?.CombatSystem) {
              window.GameEntities.CombatSystem.handleDeath(owner, targetMon);
            }
          }
        }
      } else {
        const sideOffset = idx === 0 ? -40 : 40;
        const formX = gen.x + Math.sin(gen.aimAngle) * sideOffset - Math.cos(gen.aimAngle) * 35;
        const formY = gen.y - Math.cos(gen.aimAngle) * sideOffset - Math.sin(gen.aimAngle) * 35;
        const dForm = Math.hypot(formX - sol.x, formY - sol.y);
        if (dForm > 15) {
          sol.aimAngle = Math.atan2(formY - sol.y, formX - sol.x);
          const step = Math.min(dForm, sol.speed * dt);
          sol.x += Math.cos(sol.aimAngle) * step;
          sol.y += Math.sin(sol.aimAngle) * step;
        }
      }
    });
  },

  render(ctx) {
    const t = this.temple;
    if (!t) return;

    // 1. Vẽ 3 Quan Tướng khi còn sống trong sân viện
    this.drawGuardians(ctx);

    // 2. Vẽ Đoàn Quân Thiết Kỵ đi theo chi viện (nếu có)
    if (this.legion?.active) {
      this.drawLegion(ctx, this.legion);
    }
  },

  drawGuardians(ctx) {
    for (const g of this.guardians) {
      if (!g.isAlive) continue;
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(g.aimAngle);

      // Thân giáp tướng quân
      ctx.fillStyle = g.armorCol;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Áo choàng màu
      ctx.fillStyle = g.color;
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-24, -14);
      ctx.lineTo(-24, 14);
      ctx.lineTo(-8, 4);
      ctx.closePath();
      ctx.fill();

      // Đầu + nón trụ
      ctx.fillStyle = '#fcd34d';
      ctx.beginPath();
      ctx.arc(6, 0, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Lông mao đỉnh nón
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(3, 0);
      ctx.lineTo(-8, 0);
      ctx.lineTo(0, -6);
      ctx.closePath();
      ctx.fill();

      // Vũ khí theo loại
      ctx.save();
      ctx.translate(10, 8);
      if (g.weapon === 'spear') {
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(26, 0); ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(16, -2, 5, 4);
      } else if (g.weapon === 'blade') {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(0, -3); ctx.lineTo(22, -6); ctx.lineTo(24, 6); ctx.lineTo(0, 3);
        ctx.closePath(); ctx.fill();
      } else {
        ctx.fillStyle = '#475569';
        ctx.fillRect(10, -8, 12, 16);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(16, 0); ctx.stroke();
      }
      ctx.restore();

      ctx.restore();

      // Thanh máu trên đầu tướng
      ctx.save();
      const pct = Math.max(0, g.currentHp / g.maxHp);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(g.x - 22, g.y - 28, 44, 6);
      ctx.fillStyle = pct > 0.4 ? '#22c55e' : '#ef4444';
      ctx.fillRect(g.x - 21, g.y - 27, 42 * pct, 4);
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fef08a';
      ctx.fillText(g.title, g.x, g.y - 32);
      ctx.restore();
    }
  },

  drawLegion(ctx, leg) {
    const gen = leg.general;

    // 1. Vẽ Tướng Cưỡi Ngựa (Mounted General on Horseback)
    ctx.save();
    ctx.translate(gen.x, gen.y);
    ctx.rotate(gen.aimAngle);

    // -- BÓNG NGỰA --
    ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
    ctx.beginPath();
    ctx.ellipse(-4, 0, 28, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // -- THÂN CHIẾN MÃ --
    // Thân ngựa màu nâu đỏ dũng mãnh
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(-2, 0, 22, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cổ và đầu ngựa
    ctx.beginPath();
    ctx.moveTo(12, -6);
    ctx.lineTo(26, -10);
    ctx.lineTo(34, -4);
    ctx.lineTo(26, 6);
    ctx.lineTo(12, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bờm ngựa bay
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(14, -8);
    ctx.lineTo(26, -13);
    ctx.lineTo(20, -5);
    ctx.closePath();
    ctx.fill();

    // 4 Chân ngựa đang phi nước đại (Galloping legs)
    const gallop = Math.sin(gen.gallopPhase || 0) * 8;
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 3;
    // Chân trước
    ctx.beginPath();
    ctx.moveTo(16, -6); ctx.lineTo(26 + gallop, -12);
    ctx.moveTo(16, 6); ctx.lineTo(26 - gallop, 12);
    // Chân sau
    ctx.moveTo(-16, -6); ctx.lineTo(-26 - gallop, -12);
    ctx.moveTo(-16, 6); ctx.lineTo(-26 + gallop, 12);
    ctx.stroke();

    // Yên cương ngựa
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-6, -8, 12, 16);

    // -- TƯỚNG QUÂN TRÊN LƯNG NGỰA --
    // Thân tướng
    ctx.fillStyle = '#e2e8f0'; // giáp bạc sáng
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Choàng đỏ tướng quân bay phấp phới
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(-28, -12);
    ctx.lineTo(-28, 12);
    ctx.lineTo(-8, 4);
    ctx.closePath();
    ctx.fill();

    // Đầu tướng + Mũ Thiết Giáp
    ctx.fillStyle = '#f59e0b'; // mũ vàng kim
    ctx.beginPath();
    ctx.arc(6, 0, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Lông vũ đỏ trên nón tướng
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(4, 0); ctx.lineTo(-10, -4); ctx.lineTo(-2, 0);
    ctx.closePath();
    ctx.fill();

    // Ngọn giáo / Đại thương kỵ binh cắm cờ Trúc Lâm
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-12, 10);
    ctx.lineTo(42, 10);
    ctx.stroke();
    // Mũi giáo vàng
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(42, 7); ctx.lineTo(54, 10); ctx.lineTo(42, 13);
    ctx.closePath();
    ctx.fill();
    // Lá cờ lệnh Trúc Lâm bay sau ngọn giáo
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(34, 10); ctx.lineTo(16, 2); ctx.lineTo(24, 10);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Chữ đếm lùi thời gian (8 phút) trên đầu Tướng Cưỡi Ngựa
    ctx.save();
    const mm = Math.floor(leg.life / 60);
    const ss = Math.floor(leg.life % 60).toString().padStart(2, '0');
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000';
    ctx.strokeText(`🏇 Thiết Kỵ Tướng Quân (${mm}:${ss})`, gen.x, gen.y - 32);
    ctx.fillStyle = '#fde047';
    ctx.fillText(`🏇 Thiết Kỵ Tướng Quân (${mm}:${ss})`, gen.x, gen.y - 32);
    ctx.restore();

    // 2. Vẽ các binh sĩ hộ vệ đi theo
    leg.soldiers.forEach(sol => {
      ctx.save();
      ctx.translate(sol.x, sol.y);
      ctx.rotate(sol.aimAngle);

      ctx.fillStyle = '#64748b';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(4, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Khiên tròn
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.arc(-2, -7, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Vũ khí
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(2, 6); ctx.lineTo(18, 6);
      ctx.stroke();

      ctx.restore();
    });
  }
};
