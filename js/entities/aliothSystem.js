/**
 * aliothSystem.js - 3 Long thần Alioth (Xích Long, Long Thanh, Long Huyền)
 * Quỹ đạo bay tự do, tính toán động dựa trên vị trí 5 bot gần nhất + biến số ngẫu nhiên.
 * Thân rắn kiểu châu Á dùng kinematic trailing segment uốn lượn mượt mà theo đầu rồng.
 */
window.GameEntities = window.GameEntities || {};

window.GameEntities.AliothSystem = {
  alioth: null,
  dragons: [],
  spine: [],
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

    const configs = [
      {
        name: 'Alioth',
        speed: 240,
        turnSpeed: 1.6,
        seed: 1.37,
        phase: 0,
        startX: this.mapW * 0.25,
        startY: this.mapH * 0.25,
        angle: 0.3,
        colors: { scale: '#c4342d', deep: '#8d241f', belly: '#f6d48a', gold: '#f0c14d', mane: '#f7f1e4' }
      },
      {
        name: 'Long Thanh',
        speed: 225,
        turnSpeed: 1.8,
        seed: 4.82,
        phase: Math.PI * 0.66,
        startX: this.mapW * 0.75,
        startY: this.mapH * 0.35,
        angle: 2.1,
        colors: { scale: '#1f6f4a', deep: '#134a31', belly: '#d8f3e2', gold: '#e8c15a', mane: '#f4fff8' }
      },
      {
        name: 'Long Huyền',
        speed: 235,
        turnSpeed: 1.5,
        seed: 7.91,
        phase: Math.PI * 1.33,
        startX: this.mapW * 0.5,
        startY: this.mapH * 0.8,
        angle: -1.4,
        colors: { scale: '#3a2f8a', deep: '#241c5c', belly: '#e4defa', gold: '#f0c14d', mane: '#f6f2ff' }
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

      // Khởi tạo chuỗi đốt thân ban đầu thẳng hàng lùi về sau đầu
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
        title: 'Long Thần',
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
        seed: cfg.seed,
        phase: cfg.phase,
        spine,
        sparks: [],
        colors: cfg.colors
      });
    }

    this.alioth = this.dragons[0];
    this.spine = this.dragons[0].spine;
    window.GameUI?.CombatTicker?.log('🐉 Ba long thần cất cánh, bay lượn ngẫu nhiên săn lùng theo vết 5 bot gần nhất!');
  },

  reset(mapWidth, mapHeight) {
    this.init(mapWidth, mapHeight);
  },

  /**
   * Tính toán mục tiêu bay ngẫu nhiên dựa vào tọa độ của 5 bot gần nhất
   */
  pickTargetFromNearestBots(dragon, mapW, mapH) {
    const G = window.GameManager;
    const pawns = (G?.pawns || []).filter(p => p.isAlive && !p.isDemonKing);

    if (!pawns.length) {
      // Không còn bot, bay lượn ngẫu nhiên quanh tâm map
      const t = this.clock * 0.4 + dragon.phase;
      dragon.targetX = mapW * 0.5 + Math.cos(t) * (mapW * 0.35);
      dragon.targetY = mapH * 0.5 + Math.sin(t * 0.9) * (mapH * 0.35);
      return;
    }

    // Tìm 5 bot gần đầu rồng nhất
    pawns.sort((a, b) => Math.hypot(a.x - dragon.x, a.y - dragon.y) - Math.hypot(b.x - dragon.x, b.y - dragon.y));
    const top5 = pawns.slice(0, 5);

    // 1. Trọng tâm của 5 bot gần nhất
    const cx = top5.reduce((sum, b) => sum + b.x, 0) / top5.length;
    const cy = top5.reduce((sum, b) => sum + b.y, 0) / top5.length;

    // 2. Độ phân tán không gian giữa 5 bot
    const spreadX = top5.reduce((acc, b) => acc + Math.abs(b.x - cx), 0) / top5.length;
    const spreadY = top5.reduce((acc, b) => acc + Math.abs(b.y - cy), 0) / top5.length;
    const spread = Math.max(120, Math.min(800, (spreadX + spreadY) * 0.5));

    // 3. Hàm băm ngẫu nhiên phụ thuộc tọa độ thực tế của từng bot trong top 5
    const botHash = top5.reduce((acc, b, idx) => {
      return acc + (b.x * 17.3 + b.y * 31.7) * (idx + 1);
    }, 0);

    // 4. Biến ngẫu nhiên biến thiên theo thời gian + hash 5 bot + seed riêng mỗi rồng
    const t = this.clock * 0.9 + dragon.phase + Math.sin(botHash * 0.0002) * 2;
    const orbitAngle = t + Math.sin(t * 1.7 + dragon.seed) * 1.4;
    const orbitDist = spread * (0.6 + 0.7 * Math.sin(t * 1.3 + dragon.seed * 2));

    // 5. Chọn 1 bot ngẫu nhiên trong top 5 làm tâm lượn sóng
    const anchorIdx = Math.floor(Math.abs(Math.sin(this.clock * 0.3 + dragon.seed) * top5.length)) % top5.length;
    const anchor = top5[anchorIdx];

    // Kết hợp giữa trọng tâm top 5, vị trí bot neo và offset ngẫu nhiên
    const targetX = (cx * 0.4 + anchor.x * 0.6) + Math.cos(orbitAngle) * orbitDist;
    const targetY = (cy * 0.4 + anchor.y * 0.6) + Math.sin(orbitAngle) * orbitDist;

    // Giữ mục tiêu trong giới hạn an toàn của map
    dragon.targetX = Math.max(250, Math.min(mapW - 250, targetX));
    dragon.targetY = Math.max(250, Math.min(mapH - 250, targetY));
  },

  protected(entity) {
    if (!entity?.isAlive || entity.isAlioth || entity.isCloud || entity.isSplit) return true;
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
    if (!hit.point || hit.dist > 300) return false;
    const M = window.GameEngine.MapTerrain;
    pawn.plan = null;
    pawn.targetEnemy = null;
    pawn.chase = null;
    pawn.meditating = false;
    pawn.fear = Math.min(100, (pawn.fear || 0) + 40);
    pawn.objective = 'Tránh đường long thần';
    pawn.thought = 'Long thần đang bay ngang. Né thân rồng trước khi bị cuốn đi.';
    const away = Math.atan2(pawn.y - hit.point.y, pawn.x - hit.point.x);
    pawn.aimAngle = away;
    const speed = M.getMoveSpeed(pawn) * 1.25;
    M.moveEntity(pawn, Math.cos(away) * speed * dt, Math.sin(away) * speed * dt);
    return true;
  },

  update(dt) {
    if (!this.dragons.length) return;
    const G = window.GameManager;
    const mapW = G?.width || this.mapW || 5200;
    const mapH = G?.height || this.mapH || 5200;
    this.clock += dt;

    for (const dragon of this.dragons) {
      if (!dragon.isAlive) continue;

      // Cập nhật mục tiêu bay ngẫu nhiên dựa vào 5 bot gần nhất
      dragon.targetTimer = (dragon.targetTimer || 0) - dt;
      if (dragon.targetTimer <= 0) {
        dragon.targetTimer = 0.8 + Math.random() * 0.6;
        this.pickTargetFromNearestBots(dragon, mapW, mapH);
      }

      // 1. Góc lái đầu rồng mượt mà
      const dx = dragon.targetX - dragon.x;
      const dy = dragon.targetY - dragon.y;
      let desiredAngle = Math.atan2(dy, dx);

      // Tránh đâm vào mép map: uốn hướng vào trong nếu quá gần mép
      const margin = 280;
      if (dragon.x < margin) desiredAngle = Math.atan2(dy, Math.abs(dx) + 300);
      else if (dragon.x > mapW - margin) desiredAngle = Math.atan2(dy, -Math.abs(dx) - 300);
      if (dragon.y < margin) desiredAngle = Math.atan2(Math.abs(dy) + 300, dx);
      else if (dragon.y > mapH - margin) desiredAngle = Math.atan2(-Math.abs(dy) - 300, dx);

      let diff = desiredAngle - dragon.aimAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      // Dao động uốn lượn hình sin đặc trưng của thân rồng
      const slither = Math.sin(this.clock * 3.6 + dragon.seed) * 0.45;
      dragon.aimAngle += Math.sign(diff) * Math.min(Math.abs(diff), dragon.turnSpeed * dt) + slither * dt;

      // 2. Di chuyển đầu rồng
      dragon.vx = Math.cos(dragon.aimAngle) * dragon.speed;
      dragon.vy = Math.sin(dragon.aimAngle) * dragon.speed;
      dragon.x += dragon.vx * dt;
      dragon.y += dragon.vy * dt;

      dragon.x = Math.max(80, Math.min(mapW - 80, dragon.x));
      dragon.y = Math.max(80, Math.min(mapH - 80, dragon.y));

      // Cập nhật đốt đầu tiên (Head)
      const head = dragon.spine[0];
      head.x = dragon.x;
      head.y = dragon.y;
      head.tx = Math.cos(dragon.aimAngle);
      head.ty = Math.sin(dragon.aimAngle);
      head.nx = -head.ty;
      head.ny = head.tx;

      // 3. Kinematic trailing constraint: mỗi đốt sau bám theo đốt trước đúng khoảng cách `spacing`
      for (let s = 1; s < this.segments; s++) {
        const prev = dragon.spine[s - 1];
        const curr = dragon.spine[s];
        const segDx = curr.x - prev.x;
        const segDy = curr.y - prev.y;
        const segDist = Math.hypot(segDx, segDy) || 1;

        // Giữ khoảng cách chính xác
        curr.x = prev.x + (segDx / segDist) * this.spacing;
        curr.y = prev.y + (segDy / segDist) * this.spacing;

        // Hướng tiếp tuyến và pháp tuyến của đốt thân
        curr.tx = -segDx / segDist;
        curr.ty = -segDy / segDist;
        curr.nx = -curr.ty;
        curr.ny = curr.tx;
      }

      // Hiệu ứng tia lửa quanh đầu rồng
      if (Math.random() < dt * 4) {
        dragon.sparks.push({ life: 0.16 + Math.random() * 0.08 });
      }
      for (let i = dragon.sparks.length - 1; i >= 0; i--) {
        dragon.sparks[i].life -= dt;
        if (dragon.sparks[i].life <= 0) dragon.sparks.splice(i, 1);
      }
    }

    this.alioth = this.dragons[0];
    this.spine = this.dragons[0].spine;
    this.devour();
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

    // Bot lập tức biến mất hoàn toàn khỏi map (không để lại xác hay đồ rơi)
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
    for (const dragon of this.dragons) {
      const spine = dragon.spine;
      if (!spine.length) continue;
      const c = dragon.colors;
      for (let i = spine.length - 1; i >= 1; i--) {
        this.drawSegment(ctx, kit, spine, i, c.scale, c.deep, c.belly, c.gold, c.mane, time);
      }
      this.drawHead(ctx, kit, spine[0], c.scale, c.deep, c.belly, c.gold, c.mane, time);
      for (const spark of dragon.sparks) {
        this.drawSpark(ctx, kit, spine[0], spark);
      }
      this.drawName(ctx, spine[0], dragon.name);
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

  drawHead(ctx, kit, head, scale, deep, belly, gold, mane, time) {
    const jaw = 0.18 + Math.sin(time * 2.2) * 0.08;
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
    const bob = Math.sin(time * 4) * 3;
    kit.glow(46, -18 + bob, 16, '#e7d6ff', 0.85);
    kit.oval(46, -18 + bob, 5.5, 5.5, '#f4ecff', 1.6);
    kit.oval(46, -18 + bob, 2.2, 2.2, '#c9b4f0', 1);
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
