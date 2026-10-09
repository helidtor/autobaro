/**
 * aliothSystem.js - 3 Long thần Alioth mang 3 thuộc tính nguyên tố:
 * 1. Hỏa Long (Rồng Lửa): Phun lửa thiêu đốt phía trước, đốt cháy bụi rậm và gây sát thương bỏng cho bot.
 * 2. Lôi Long (Rồng Sét): Bay đến đâu sét 2 bên sườn thân đánh xuống đất, gây sát thương và tê liệt/choáng bot.
 * 3. Thổ Long (Rồng Đất): Bay đến đâu núi đá nhỏ nhô lên tồn tại trong 7s, hất tung và cản đường bot.
 * Quỹ đạo bay tự do, tính toán động dựa trên vị trí 5 bot gần nhất.
 * Thân rồng dùng kinematic trailing segment uốn lượn mượt mà theo đầu rồng.
 */
window.GameEntities = window.GameEntities || {};

window.GameEntities.AliothSystem = {
  alioth: null,
  dragons: [],
  spine: [],
  earthSpires: [],
  lightningBolts: [],
  clock: 0,
  mapW: 5200,
  mapH: 5200,
  segments: 34,
  spacing: 18,

  init(mapWidth, mapHeight) {
    this.clock = 0;
    this.mapW = mapWidth || 5200;
    this.mapH = mapHeight || 5200;
    this.dragons = [];
    this.earthSpires = [];
    this.lightningBolts = [];

    const configs = [
      {
        name: 'Hỏa Long Alioth',
        title: 'Hỏa Thần',
        element: 'fire',
        speed: 245,
        turnSpeed: 1.6,
        seed: 1.37,
        phase: 0,
        startX: this.mapW * 0.25,
        startY: this.mapH * 0.25,
        angle: 0.3,
        colors: { scale: '#c4342d', deep: '#7f1d1d', belly: '#fca5a5', gold: '#f97316', mane: '#fef08a' }
      },
      {
        name: 'Lôi Long Alioth',
        title: 'Lôi Thần',
        element: 'lightning',
        speed: 250,
        turnSpeed: 1.8,
        seed: 4.82,
        phase: Math.PI * 0.66,
        startX: this.mapW * 0.75,
        startY: this.mapH * 0.35,
        angle: 2.1,
        colors: { scale: '#0284c7', deep: '#0c4a6e', belly: '#bae6fd', gold: '#38bdf8', mane: '#e0f2fe' }
      },
      {
        name: 'Thổ Long Alioth',
        title: 'Thổ Thần',
        element: 'earth',
        speed: 230,
        turnSpeed: 1.4,
        seed: 7.91,
        phase: Math.PI * 1.33,
        startX: this.mapW * 0.5,
        startY: this.mapH * 0.8,
        angle: -1.4,
        colors: { scale: '#78350f', deep: '#451a03', belly: '#fde68a', gold: '#d97706', mane: '#d6d3d1' }
      }
    ];

    for (let i = 0; i < configs.length; i++) {
      const cfg = configs[i];
      const head = {
        x: cfg.startX,
        y: cfg.startY,
        tx: Math.cos(cfg.angle),
        ty: Math.sin(cfg.angle),
        nx: -Math.sin(cfg.angle),
        ny: Math.cos(cfg.angle)
      };

      const spine = [head];
      for (let s = 1; s < this.segments; s++) {
        spine.push({
          x: head.x - head.tx * s * this.spacing,
          y: head.y - head.ty * s * this.spacing,
          tx: head.tx,
          ty: head.ty,
          nx: head.nx,
          ny: head.ny
        });
      }

      this.dragons.push({
        id: 'alioth_dragon_' + i,
        index: i,
        name: cfg.name,
        title: cfg.title,
        element: cfg.element,
        isAlioth: true,
        isAlive: true,
        invincible: true,
        x: head.x,
        y: head.y,
        vx: head.tx * cfg.speed,
        vy: head.ty * cfg.speed,
        aimAngle: cfg.angle,
        speed: cfg.speed,
        turnSpeed: cfg.turnSpeed,
        radius: 36,
        targetX: this.mapW / 2,
        targetY: this.mapH / 2,
        targetTimer: 0,
        elementTimer: 0,
        isBreathingFire: false,
        fireBreathDuration: 0,
        seed: cfg.seed,
        phase: cfg.phase,
        spine,
        sparks: [],
        colors: cfg.colors
      });
    }

    this.alioth = this.dragons[0];
    this.spine = this.dragons[0].spine;
    window.GameUI?.CombatTicker?.log('🐉 3 Long Thần Alioth (Hỏa Long, Lôi Long, Thổ Long) đã thức tỉnh mang theo bão lửa, sấm sét và địa chấn!');
  },

  reset(mapWidth, mapHeight) {
    this.init(mapWidth, mapHeight);
  },

  pickTargetFromNearestBots(dragon, mapW, mapH) {
    const G = window.GameManager;
    const pawns = (G?.pawns || []).filter(p => p.isAlive && !p.isDemonKing);

    if (!pawns.length) {
      const t = this.clock * 0.4 + dragon.phase;
      dragon.targetX = mapW * 0.5 + Math.cos(t) * (mapW * 0.35);
      dragon.targetY = mapH * 0.5 + Math.sin(t * 0.9) * (mapH * 0.35);
      return;
    }

    pawns.sort((a, b) => Math.hypot(a.x - dragon.x, a.y - dragon.y) - Math.hypot(b.x - dragon.x, b.y - dragon.y));
    const top5 = pawns.slice(0, 5);

    const cx = top5.reduce((sum, b) => sum + b.x, 0) / top5.length;
    const cy = top5.reduce((sum, b) => sum + b.y, 0) / top5.length;

    const spreadX = top5.reduce((acc, b) => acc + Math.abs(b.x - cx), 0) / top5.length;
    const spreadY = top5.reduce((acc, b) => acc + Math.abs(b.y - cy), 0) / top5.length;
    const spread = Math.max(120, Math.min(800, (spreadX + spreadY) * 0.5));

    const botHash = top5.reduce((acc, b, idx) => {
      return acc + (b.x * 17.3 + b.y * 31.7) * (idx + 1);
    }, 0);

    const t = this.clock * 0.9 + dragon.phase + Math.sin(botHash * 0.0002) * 2;
    const orbitAngle = t + Math.sin(t * 1.7 + dragon.seed) * 1.4;
    const orbitDist = spread * (0.6 + 0.7 * Math.sin(t * 1.3 + dragon.seed * 2));

    const anchorIdx = Math.floor(Math.abs(Math.sin(this.clock * 0.3 + dragon.seed) * top5.length)) % top5.length;
    const anchor = top5[anchorIdx];

    const targetX = (cx * 0.4 + anchor.x * 0.6) + Math.cos(orbitAngle) * orbitDist;
    const targetY = (cy * 0.4 + anchor.y * 0.6) + Math.sin(orbitAngle) * orbitDist;

    dragon.targetX = Math.max(250, Math.min(mapW - 250, targetX));
    dragon.targetY = Math.max(250, Math.min(mapH - 250, targetY));
  },

  protected(entity) {
    if (!entity?.isAlive || entity.isAlioth || entity.isCloud || entity.isSplit) return true;
    if (entity.captured) return true;
    if (entity.isAncient || entity.isAncientClone || entity.isDemonKing) return true;
    return entity === window.GameEntities.EntityManager?.worldBoss;
  },

  nearest(x, y) {
    let best = null, dist = Infinity, bestDragon = null;
    for (const dragon of this.dragons) {
      for (const point of dragon.spine) {
        const d = Math.hypot(point.x - x, point.y - y);
        if (d < dist) { dist = d; best = point; bestDragon = dragon; }
      }
    }
    return { point: best, dist, dragon: bestDragon };
  },

  avoid(pawn, dt) {
    if (!pawn?.isAlive || !this.dragons.length) return false;
    const hit = this.nearest(pawn.x, pawn.y);
    const M = window.GameEngine.MapTerrain;

    // Tránh né rồng
    if (hit.point && hit.dist <= 300) {
      pawn.plan = null;
      pawn.targetEnemy = null;
      pawn.chase = null;
      pawn.meditating = false;
      pawn.fear = Math.min(100, (pawn.fear || 0) + 35);
      pawn.objective = 'Tránh đường long thần ' + (hit.dragon?.name || '');
      pawn.thought = 'Long thần đang bay qua! Tránh xa thân rồng kẻo bị nuốt chửng!';
      const away = Math.atan2(pawn.y - hit.point.y, pawn.x - hit.point.x);
      pawn.aimAngle = away;
      const speed = M.getMoveSpeed(pawn) * 1.25;
      M.moveEntity(pawn, Math.cos(away) * speed * dt, Math.sin(away) * speed * dt);
      return true;
    }

    // Tránh núi đá nhỏ của Thổ Long
    for (const spire of this.earthSpires) {
      const d = Math.hypot(pawn.x - spire.x, pawn.y - spire.y);
      if (d < spire.radius + 30) {
        const away = Math.atan2(pawn.y - spire.y, pawn.x - spire.x);
        M.moveEntity(pawn, Math.cos(away) * 80 * dt, Math.sin(away) * 80 * dt);
      }
    }

    return false;
  },

  update(dt) {
    if (!this.dragons.length) return;
    const G = window.GameManager;
    const mapW = G?.width || this.mapW || 5200;
    const mapH = G?.height || this.mapH || 5200;
    this.clock += dt;

    for (const dragon of this.dragons) {
      if (!dragon.isAlive || dragon.captured) continue;

      dragon.targetTimer = (dragon.targetTimer || 0) - dt;
      if (dragon.targetTimer <= 0) {
        dragon.targetTimer = 0.8 + Math.random() * 0.6;
        this.pickTargetFromNearestBots(dragon, mapW, mapH);
      }

      // 1. Góc lái đầu rồng mượt mà
      const dx = dragon.targetX - dragon.x;
      const dy = dragon.targetY - dragon.y;
      let desiredAngle = Math.atan2(dy, dx);

      const margin = 280;
      if (dragon.x < margin) desiredAngle = Math.atan2(dy, Math.abs(dx) + 300);
      else if (dragon.x > mapW - margin) desiredAngle = Math.atan2(dy, -Math.abs(dx) - 300);
      if (dragon.y < margin) desiredAngle = Math.atan2(Math.abs(dy) + 300, dx);
      else if (dragon.y > mapH - margin) desiredAngle = Math.atan2(-Math.abs(dy) - 300, dx);

      let diff = desiredAngle - dragon.aimAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      const slither = Math.sin(this.clock * 3.6 + dragon.seed) * 0.45;
      dragon.aimAngle += Math.sign(diff) * Math.min(Math.abs(diff), dragon.turnSpeed * dt) + slither * dt;

      // 2. Di chuyển đầu rồng
      dragon.vx = Math.cos(dragon.aimAngle) * dragon.speed;
      dragon.vy = Math.sin(dragon.aimAngle) * dragon.speed;
      dragon.x += dragon.vx * dt;
      dragon.y += dragon.vy * dt;

      dragon.x = Math.max(80, Math.min(mapW - 80, dragon.x));
      dragon.y = Math.max(80, Math.min(mapH - 80, dragon.y));

      const head = dragon.spine[0];
      head.x = dragon.x;
      head.y = dragon.y;
      head.tx = Math.cos(dragon.aimAngle);
      head.ty = Math.sin(dragon.aimAngle);
      head.nx = -head.ty;
      head.ny = head.tx;

      // 3. Trailing segments
      for (let s = 1; s < this.segments; s++) {
        const prev = dragon.spine[s - 1];
        const curr = dragon.spine[s];
        const segDx = curr.x - prev.x;
        const segDy = curr.y - prev.y;
        const segDist = Math.hypot(segDx, segDy) || 1;

        curr.x = prev.x + (segDx / segDist) * this.spacing;
        curr.y = prev.y + (segDy / segDist) * this.spacing;
        curr.tx = -segDx / segDist;
        curr.ty = -segDy / segDist;
        curr.nx = -curr.ty;
        curr.ny = curr.tx;
      }

      // 4. Kích hoạt thuộc tính nguyên tố riêng biệt
      this.updateDragonElement(dragon, dt);

      // Hiệu ứng tia lửa
      if (Math.random() < dt * 4) {
        dragon.sparks.push({ life: 0.16 + Math.random() * 0.08 });
      }
      for (let i = dragon.sparks.length - 1; i >= 0; i--) {
        dragon.sparks[i].life -= dt;
        if (dragon.sparks[i].life <= 0) dragon.sparks.splice(i, 1);
      }
    }

    // 5. Cập nhật các hiệu ứng nguyên tố trên map
    this.updateWorldElements(dt);

    this.alioth = this.dragons[0];
    this.spine = this.dragons[0].spine;
    this.devour();
  },

  /**
   * Cập nhật kỹ năng thuộc tính riêng của từng rồng
   */
  updateDragonElement(dragon, dt) {
    dragon.elementTimer = (dragon.elementTimer || 0) + dt;

    if (dragon.element === 'fire') {
      // RỒNG LỬA: Phun lửa hình nón phía trước
      if (dragon.isBreathingFire) {
        dragon.fireBreathDuration -= dt;
        this.applyFireBreathDamage(dragon, dt);
        if (dragon.fireBreathDuration <= 0) {
          dragon.isBreathingFire = false;
          dragon.elementTimer = 0;
        }
      } else if (dragon.elementTimer >= 2.8) {
        dragon.isBreathingFire = true;
        dragon.fireBreathDuration = 1.6; // Phun lửa trong 1.6 giây
        window.GameRenderer?.VfxManager?.addBurstParticles?.(dragon.x, dragon.y, '#f97316', 15);
      }
    } else if (dragon.element === 'lightning') {
      // RỒNG SÉT: Bay đến đâu sét 2 bên sườn thân đánh xuống đất
      if (dragon.elementTimer >= 0.22) {
        dragon.elementTimer = 0;
        this.castFlankLightning(dragon);
      }
    } else if (dragon.element === 'earth') {
      // RỒNG ĐẤT: Bay đến đâu núi nhỏ/ụ đá nhô lên trong vòng 7s
      if (dragon.elementTimer >= 0.42) {
        dragon.elementTimer = 0;
        this.spawnEarthSpire(dragon);
      }
    }
  },

  /**
   * RỒNG LỬA: Phun luồng lửa thiêu đốt bot trước mặt
   */
  applyFireBreathDamage(dragon, dt) {
    const G = window.GameManager;
    const V = window.GameRenderer?.VfxManager;
    const head = dragon.spine[0];
    const reach = 220;
    const halfAngle = 0.55;

    // Đốt cháy bụi rậm trên đường phun
    window.GameEngine?.MapTerrain?.bushes?.forEach(b => {
      const bx = b.x * (window.GameEngine?.MapTerrain?.scale || 2);
      const by = b.y * (window.GameEngine?.MapTerrain?.scale || 2);
      const d = Math.hypot(bx - head.x, by - head.y);
      if (d <= reach) {
        const ang = Math.atan2(by - head.y, bx - head.x);
        let diff = ang - dragon.aimAngle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        if (Math.abs(diff) <= halfAngle) b.isBurned = true;
      }
    });

    const pawns = (G?.pawns || []).filter(p => p.isAlive && !p.isDemonKing);
    for (const p of pawns) {
      const d = Math.hypot(p.x - head.x, p.y - head.y);
      if (d <= reach) {
        const ang = Math.atan2(p.y - head.y, p.x - head.x);
        let diff = ang - dragon.aimAngle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        if (Math.abs(diff) <= halfAngle) {
          // Gây sát thương thiêu đốt
          const dmg = (18 + Math.random() * 8) * dt * 2.2;
          p.currentHp = Math.max(1, p.currentHp - dmg);
          p.burnTimer = Math.max(p.burnTimer || 0, 3.0);
          p.fear = Math.min(100, (p.fear || 0) + 15 * dt);

          if (!p.lastDragonBurnVfx || this.clock - p.lastDragonBurnVfx > 0.4) {
            p.lastDragonBurnVfx = this.clock;
            V?.addDamageNumber?.(p.x, p.y - 20, '-' + Math.round(dmg * 2.5), 'crit');
            V?.addBurstParticles?.(p.x, p.y, '#f97316', 8);
          }
        }
      }
    }
  },

  /**
   * RỒNG SÉT: Sét đánh xuống đất dọc 2 bên thân rồng
   */
  castFlankLightning(dragon) {
    const V = window.GameRenderer?.VfxManager;
    const G = window.GameManager;

    // Chọn ngẫu nhiên đốt thân dọc chiều dài rồng
    const segIdx = 3 + Math.floor(Math.random() * (this.segments - 8));
    const seg = dragon.spine[segIdx];
    if (!seg) return;

    // Đánh đồng thời 2 bên thân (trái & phải)
    for (const side of [-1, 1]) {
      const flankDist = 48 + Math.random() * 32;
      const targetX = seg.x + seg.nx * side * flankDist;
      const targetY = seg.y + seg.ny * side * flankDist;

      // Sinh tia sét giật từ trời xuống
      const startX = targetX - (seg.tx * 30) + (Math.random() - 0.5) * 40;
      const startY = targetY - 260;
      const points = [{ x: startX, y: startY }];
      let cx = startX, cy = startY;
      const steps = 5;

      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        cx = startX + (targetX - startX) * t + (Math.random() - 0.5) * 36;
        cy = startY + (targetY - startY) * t;
        points.push({ x: cx, y: cy });
      }
      points.push({ x: targetX, y: targetY });

      this.lightningBolts.push({
        points,
        targetX,
        targetY,
        life: 0.22,
        color: Math.random() < 0.5 ? '#38bdf8' : '#a855f7'
      });

      // Gây sát thương & tê liệt/choáng cho bot đứng gần điểm sét đánh
      V?.addBurstParticles?.(targetX, targetY, '#38bdf8', 12);
      V?.addEffect?.('impact', targetX, targetY, { radius: 38, color: '#38bdf8', life: 0.35 });

      const victims = (G?.pawns || []).filter(p => p.isAlive && !p.isDemonKing);
      for (const p of victims) {
        if (Math.hypot(p.x - targetX, p.y - targetY) <= 45) {
          const dmg = Math.round(16 + Math.random() * 10);
          p.currentHp = Math.max(1, p.currentHp - dmg);
          p.stunTimer = Math.max(p.stunTimer || 0, 0.55); // Tê liệt choáng 0.55s
          p.slowTimer = Math.max(p.slowTimer || 0, 2.0);  // Làm chậm
          p.slowPct = Math.max(p.slowPct || 0, 0.45);
          p.fear = Math.min(100, (p.fear || 0) + 25);

          V?.addDamageNumber?.(p.x, p.y - 25, '⚡ SÉT: -' + dmg, 'crit');
          V?.addEmotionMote?.(p, '⚡', '#38bdf8');
          window.GameEngine?.Audio?.play?.('impact', p, 'lightning');
        }
      }
    }
  },

  /**
   * RỒNG ĐẤT: Núi đá nhỏ nhô lên tồn tại 7s
   */
  spawnEarthSpire(dragon) {
    const V = window.GameRenderer?.VfxManager;
    const G = window.GameManager;

    // Sinh ở phần bụng/đuôi rồng
    const segIdx = 8 + Math.floor(Math.random() * 14);
    const seg = dragon.spine[segIdx];
    if (!seg) return;

    const spireX = seg.x + (Math.random() - 0.5) * 24;
    const spireY = seg.y + (Math.random() - 0.5) * 24;

    const spire = {
      x: spireX,
      y: spireY,
      radius: 26,
      life: 7.0, // Tồn tại đúng 7 giây
      maxLife: 7.0,
      scale: 0.2 + Math.random() * 0.3,
      seed: Math.random() * 100
    };

    this.earthSpires.push(spire);

    // Khi nhô lên: hất tung và gây sát thương va đập bot đứng tại đó
    V?.addBurstParticles?.(spireX, spireY, '#78350f', 16);
    V?.addBurstParticles?.(spireX, spireY, '#d97706', 10);

    const victims = (G?.pawns || []).filter(p => p.isAlive && !p.isDemonKing);
    for (const p of victims) {
      if (Math.hypot(p.x - spireX, p.y - spireY) <= 36) {
        const dmg = Math.round(15 + Math.random() * 8);
        p.currentHp = Math.max(1, p.currentHp - dmg);
        p.stunTimer = Math.max(p.stunTimer || 0, 0.4);
        const away = Math.atan2(p.y - spireY, p.x - spireX);
        window.GameEngine?.MapTerrain?.moveEntity(p, Math.cos(away) * 35, Math.sin(away) * 35);
        V?.addDamageNumber?.(p.x, p.y - 20, 'ĐỊA CHẤN: -' + dmg, 'crit');
      }
    }
  },

  /**
   * Cập nhật thời gian tồn tại của các vết nứt, núi đá, tia sét
   */
  updateWorldElements(dt) {
    // 1. Cập nhật núi đá tồn tại 7s
    for (let i = this.earthSpires.length - 1; i >= 0; i--) {
      const spire = this.earthSpires[i];
      spire.life -= dt;
      if (spire.life <= 0) {
        // Vụn đá tan vỡ
        window.GameRenderer?.VfxManager?.addBurstParticles?.(spire.x, spire.y, '#78350f', 10);
        this.earthSpires.splice(i, 1);
      }
    }

    // 2. Cập nhật tia sét
    for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
      this.lightningBolts[i].life -= dt;
      if (this.lightningBolts[i].life <= 0) {
        this.lightningBolts.splice(i, 1);
      }
    }
  },

  devour() {
    const G = window.GameManager;
    if (!G || !this.dragons.length) return;
    const victims = [...(G.pawns || []), ...(G.monsters || [])];
    for (const victim of victims) {
      if (this.protected(victim)) continue;
      const hit = this.nearest(victim.x, victim.y);
      if (hit.dist <= 48) this.executeDevour(victim, hit.dragon);
    }
  },

  executeDevour(victim, dragon) {
    if (!victim?.isAlive || this.protected(victim)) return;
    const V = window.GameRenderer?.VfxManager;
    const G = window.GameManager;
    const oldX = victim.x;
    const oldY = victim.y;
    const dragonName = dragon?.name || 'Long Thần Alioth';

    V?.addEffect?.('impact', oldX, oldY, { radius: 65, color: '#e7c56a', life: 0.8 });
    V?.addBurstParticles?.(oldX, oldY, '#f4d48a', 25);
    V?.addBurstParticles?.(oldX, oldY, '#c4342d', 25);
    V?.addBurstParticles?.(oldX, oldY, '#2c0b4d', 30);
    V?.addDamageNumber?.(oldX, oldY - 30, 'BIẾN MẤT', 'crit');
    window.GameEngine?.Audio?.play?.('death', victim, undefined, { tier: victim.tier });
    window.GameUI?.CombatTicker?.log(`⚡ ${dragonName} nuốt chửng ${victim.name} — Biến mất hoàn toàn!`);

    victim.isAlive = false;
    victim.despawned = true;
    victim.currentHp = 0;
    victim.action = null;
    victim.attackState = null;
    victim.targetEnemy = null;
    victim.plan = null;
    victim.chase = null;
    victim.combatLease = 0;
    victim.x = -9999;
    victim.y = -9999;
    victim.vx = 0;
    victim.vy = 0;

    if (victim === window.GameEntities.EntityManager?.worldBoss) {
      window.GameEntities.AncientSystem?.awaken?.(victim, dragon || this.alioth);
    }

    if (G) {
      G.updateHUD?.();
      G.checkVictoryCondition?.();
    }
  },

  renderShadow(ctx) {
    if (!this.dragons.length) return;
    ctx.save();
    ctx.fillStyle = 'rgba(28, 18, 16, 0.16)';
    for (const dragon of this.dragons) {
      for (let i = 0; i < dragon.spine.length; i += 2) {
        const point = dragon.spine[i];
        const girth = 14 + (1 - i / dragon.spine.length) * 10;
        ctx.beginPath();
        ctx.ellipse(point.x, point.y + 30, girth * 1.7, girth * 0.62, Math.atan2(point.ty, point.tx), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  },

  render(ctx) {
    if (!this.dragons.length || !window.GameRenderer?.ArtKit) return;
    const kit = window.GameRenderer.ArtKit(ctx);
    const time = this.clock;

    // 1. Vẽ các núi nhỏ nhô lên của Thổ Long (7s)
    this.renderEarthSpires(ctx);

    // 2. Vẽ 3 thân rồng
    for (const dragon of this.dragons) {
      const spine = dragon.spine;
      if (!spine.length) continue;
      const c = dragon.colors;
      for (let i = spine.length - 1; i >= 1; i--) {
        this.drawSegment(ctx, kit, spine, i, c.scale, c.deep, c.belly, c.gold, c.mane, time);
      }
      this.drawHead(ctx, kit, dragon, spine[0], c.scale, c.deep, c.belly, c.gold, c.mane, time);
      for (const spark of dragon.sparks) {
        this.drawSpark(ctx, kit, spine[0], spark);
      }
      this.drawName(ctx, spine[0], dragon.name);

      // Nếu là Rồng Lửa đang phun lửa, vẽ luồng lửa phía trước
      if (dragon.element === 'fire' && dragon.isBreathingFire) {
        this.drawFireBreath(ctx, spine[0], time);
      }
    }

    // 3. Vẽ các tia sét 2 bên thân của Lôi Long
    this.renderLightningBolts(ctx);
  },

  /**
   * Vẽ núi đá nhỏ của Thổ Long (tồn tại 7s)
   */
  renderEarthSpires(ctx) {
    for (const spire of this.earthSpires) {
      const progress = spire.life / spire.maxLife; // 1 -> 0
      const alpha = Math.min(1, spire.life * 1.5);
      const grow = Math.min(1, (spire.maxLife - spire.life) * 4); // Mọc nhanh lúc đầu

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(spire.x, spire.y);

      // Bóng chân núi
      ctx.fillStyle = 'rgba(20, 10, 5, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 8, spire.radius * 1.2, spire.radius * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Vách đá nhô lên
      const peakH = 34 * grow;
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(-spire.radius, 4);
      ctx.lineTo(-spire.radius * 0.5, -peakH * 0.7);
      ctx.lineTo(0, -peakH);
      ctx.lineTo(spire.radius * 0.6, -peakH * 0.6);
      ctx.lineTo(spire.radius, 4);
      ctx.closePath();
      ctx.fill();

      // Mảng sáng vách núi
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.moveTo(-spire.radius * 0.5, -peakH * 0.7);
      ctx.lineTo(0, -peakH);
      ctx.lineTo(4, 4);
      ctx.lineTo(-spire.radius * 0.4, 4);
      ctx.closePath();
      ctx.fill();

      // Đỉnh núi vàng đá nhọn
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.moveTo(-3, -peakH + 8);
      ctx.lineTo(0, -peakH);
      ctx.lineTo(3, -peakH + 8);
      ctx.closePath();
      ctx.fill();

      // Đồng hồ đếm ngược viền nhỏ
      ctx.strokeStyle = 'rgba(253, 230, 138, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 8, spire.radius * 1.1, 0, Math.PI * 2 * progress);
      ctx.stroke();

      ctx.restore();
    }
  },

  /**
   * Vẽ luồng lửa phun của Hỏa Long
   */
  drawFireBreath(ctx, head, time) {
    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.rotate(Math.atan2(head.ty, head.tx));

    const reach = 220;
    const grad = ctx.createRadialGradient(25, 0, 10, reach * 0.8, 0, reach);
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
    grad.addColorStop(0.3, 'rgba(249, 115, 22, 0.85)');
    grad.addColorStop(0.7, 'rgba(239, 68, 68, 0.6)');
    grad.addColorStop(1, 'rgba(185, 28, 28, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(30, -10);
    ctx.quadraticCurveTo(reach * 0.6, -65 + Math.sin(time * 12) * 15, reach, -30);
    ctx.lineTo(reach + 15 + Math.sin(time * 15) * 10, 0);
    ctx.quadraticCurveTo(reach * 0.6, 65 + Math.cos(time * 12) * 15, 30, 10);
    ctx.closePath();
    ctx.fill();

    // Hạt than hồng bay ra
    for (let i = 0; i < 6; i++) {
      const ex = 40 + Math.random() * (reach - 50);
      const ey = (Math.random() - 0.5) * 45;
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(ex, ey, 2.5 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  },

  /**
   * Vẽ tia sét 2 bên thân của Lôi Long
   */
  renderLightningBolts(ctx) {
    for (const bolt of this.lightningBolts) {
      if (!bolt.points || bolt.points.length < 2) continue;
      ctx.save();
      ctx.strokeStyle = bolt.color;
      ctx.lineWidth = 2.8;
      ctx.shadowColor = bolt.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(bolt.points[0].x, bolt.points[0].y);
      for (let i = 1; i < bolt.points.length; i++) {
        ctx.lineTo(bolt.points[i].x, bolt.points[i].y);
      }
      ctx.stroke();

      // Vòng lóe sáng tại điểm chạm đất
      ctx.fillStyle = bolt.color;
      ctx.beginPath();
      ctx.arc(bolt.targetX, bolt.targetY, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  },

  place(ctx, point) {
    ctx.translate(point.x, point.y);
    const ang = Math.atan2(point.ty, point.tx);
    ctx.rotate(ang);
    if (Math.cos(ang) < 0) ctx.scale(1, -1);
  },

  drawSegment(ctx, kit, spine, index, scale, deep, belly, gold, mane, time) {
    const point = spine[index];
    const u = index / (spine.length - 1);
    const rad = 6 + (1 - u) * 11;
    const sway = Math.sin(time * 3 + index * 0.7) * 2;
    ctx.save();
    this.place(ctx, point);
    kit.oval(0, 0, rad * 1.55, rad * 0.78, index % 2 ? scale : deep, 2);
    kit.oval(rad * 0.15, rad * 0.22, rad * 0.72, rad * 0.3, belly, 1.3);
    kit.poly([[-rad * 0.5, -rad * 0.25], [sway, -rad * 1.25], [rad * 0.45, -rad * 0.15]], mane, 1.4);
    if (index === spine.length - 1) {
      kit.poly([[-rad, -rad * 0.2], [-rad * 2.4, -rad * 0.1], [-rad * 1.6, rad * 0.7], [-rad * 0.2, rad * 0.2]], gold, 1.5);
    }
    if ([8, 14, 21, 27].includes(index)) {
      this.drawClaw(kit, rad, gold, time, index);
    }
    ctx.restore();
    if (index % 7 === 3) {
      this.drawCloud(ctx, kit, point.x + point.nx * 34, point.y + point.ny * 34, 1, time + index);
    }
  },

  drawClaw(kit, rad, gold, time, index) {
    const step = Math.sin(time * 5 + index) * 3;
    kit.line(rad * 0.2, rad * 0.35, rad * 0.15 + step, rad * 1.25, gold, 3);
    kit.oval(rad * 0.15 + step, rad * 1.35, rad * 0.34, rad * 0.22, gold, 1.3);
    for (const toe of [-4, 0, 4]) {
      kit.line(rad * 0.15 + step + toe * 0.35, rad * 1.3, rad * 0.15 + step + toe, rad * 1.62, '#f8e7b4', 1.4);
    }
  },

  drawCloud(ctx, kit, x, y, size, time) {
    const bob = Math.sin(time) * 3;
    ctx.save();
    ctx.translate(x, y + bob);
    kit.oval(-8 * size, 2, 9 * size, 6 * size, '#f7f4ee', 1.6);
    kit.oval(0, -2, 12 * size, 8 * size, '#fff', 1.6);
    kit.oval(10 * size, 2, 8 * size, 5.5 * size, '#f3efe6', 1.6);
    ctx.restore();
  },

  drawHead(ctx, kit, dragon, head, scale, deep, belly, gold, mane, time) {
    const isFireRoar = dragon.element === 'fire' && dragon.isBreathingFire;
    const jaw = isFireRoar ? 0.38 : 0.18 + Math.sin(time * 2.2) * 0.08;
    const whisker = Math.sin(time * 3) * 6;
    ctx.save();
    this.place(ctx, head);
    for (let i = 0; i < 5; i++) {
      const flow = Math.sin(time * 3 + i) * 4;
      kit.poly([[-4, -2], [-16 - i * 7, -18 - i * 2 + flow], [-6, 2]], i % 2 ? mane : gold, 1.3);
    }
    kit.oval(6, -1, 15, 12, scale, 2.2);
    kit.oval(4, 3, 8, 6, belly, 1.4);
    kit.poly([[10, -6], [34, -3], [40, 2], [30, 7], [12, 6]], deep, 2);
    kit.oval(33, 1, 2.1, 1.5, '#1d1a26', 1);
    ctx.save();
    ctx.translate(14, 5);
    ctx.rotate(jaw);
    kit.poly([[0, 0], [18, 3], [16, 9], [-2, 6]], belly, 1.5);
    for (const tooth of [3, 9, 15]) kit.poly([[tooth, 0], [tooth + 2, -4], [tooth + 4, 0]], '#fffaf0', 1);
    ctx.restore();
    for (const tooth of [16, 23, 30]) kit.poly([[tooth, 4], [tooth + 2, 8], [tooth + 4, 4]], '#fffaf0', 1);
    kit.poly([[-2, -10], [-6, -30], [2, -16], [4, -8]], gold, 1.6);
    kit.poly([[-4, -22], [-14, -32], [-2, -16]], '#f8e7b4', 1.3);
    kit.poly([[8, -12], [4, -34], [14, -18], [12, -8]], gold, 1.6);
    kit.poly([[8, -26], [18, -36], [12, -16]], '#f8e7b4', 1.3);
    kit.oval(12, -6, 4.4, 4.8, '#fffaf0', 1.4);
    kit.oval(13.2, -6, 1.7, 3.3, '#1d1a26', 1);
    kit.oval(12.4, -7.2, 0.7, 0.7, '#fff', 0.6);
    kit.tube(28, -1, 46, -12 + whisker, 62, 4, 74, -8 + whisker, 1.5, mane);
    kit.tube(28, 3, 48, 10 - whisker, 64, -2, 76, 8 - whisker, 1.5, mane);

    // Mắt ngọc phát sáng theo nguyên tố
    const eyeColor = dragon.element === 'fire' ? '#f97316' : dragon.element === 'lightning' ? '#38bdf8' : '#eab308';
    const bob = Math.sin(time * 4) * 3;
    kit.glow(46, -18 + bob, 16, eyeColor, 0.85);
    kit.oval(46, -18 + bob, 5.5, 5.5, '#fff', 1.6);
    kit.oval(46, -18 + bob, 2.2, 2.2, eyeColor, 1);
    ctx.restore();
  },

  drawSpark(ctx, kit, head, spark) {
    const fwd = 46, up = -18;
    const x = head.x + head.tx * fwd + head.nx * up;
    const y = head.y + head.ty * fwd + head.ny * up;
    ctx.save();
    ctx.globalAlpha = Math.max(0, spark.life * 5);
    kit.line(x - 4, y, x + 5, y - 6, '#f4ecff', 1.4);
    kit.line(x + 5, y - 6, x + 2, y + 5, '#f4ecff', 1.4);
    ctx.restore();
  },

  drawName(ctx, head, name) {
    ctx.save();
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#1d1a26';
    ctx.strokeText(name, head.x, head.y - 58);
    ctx.fillStyle = '#f6d48a';
    ctx.fillText(name, head.x, head.y - 58);
    ctx.restore();
  }
};
