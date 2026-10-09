/**
 * cloudSystem.js - Đám mây Hư Không Loki (riêng, không đụng long thần Alioth)
 * Trôi chậm xuyên mọi địa hình. Lướt qua bot/quái nào thì thực thể đó biến mất.
 */
window.GameEntities = window.GameEntities || {};

window.GameEntities.CloudSystem = {
  cloud: null,
  puffs: [],
  bolts: [],
  clock: 0,

  init(mapWidth, mapHeight) {
    this.puffs = [];
    this.bolts = [];
    this.clock = 0;
    const corners = [
      { x: 250, y: 250 },
      { x: mapWidth - 250, y: 250 },
      { x: 250, y: mapHeight - 250 },
      { x: mapWidth - 250, y: mapHeight - 250 }
    ];
    const spawn = corners[Math.floor(Math.random() * corners.length)];
    this.cloud = {
      id: 'loki_cloud',
      name: 'Đám Mây Hư Không',
      isCloud: true,
      isAlive: true,
      invincible: true,
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      targetX: mapWidth / 2,
      targetY: mapHeight / 2,
      speed: 32,
      radius: 95,
      visualRadius: 150,
      aimAngle: 0,
      turnSpeed: 0.8,
      prey: null,
      retarget: 0
    };
    for (let i = 0; i < 36; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 110;
      this.puffs.push({
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
    window.GameUI?.CombatTicker?.log('🌌 Đám mây Hư Không Loki xuất hiện và bắt đầu nuốt chửng dòng thời gian!');
  },

  reset(mapWidth, mapHeight) {
    this.init(mapWidth, mapHeight);
  },

  protected(entity) {
    if (!entity?.isAlive || entity.isAlioth || entity.isCloud || entity.isSplit) return true;
    if (entity.isAncient || entity.isAncientClone || entity.isDemonKing) return true;
    return entity === window.GameEntities.EntityManager?.worldBoss;
  },

  update(dt) {
    const c = this.cloud;
    if (!c?.isAlive) return;
    this.clock += dt;
    const G = window.GameManager;
    const mapW = G?.width || 5200;
    const mapH = G?.height || 5200;

    c.retarget -= dt;
    if (c.retarget <= 0 || !c.prey?.isAlive) {
      c.retarget = 2 + Math.random() * 1.5;
      let closest = null, closestDist = Infinity;
      for (const p of (G?.pawns || []).filter(e => e.isAlive)) {
        const d = Math.hypot(p.x - c.x, p.y - c.y);
        if (d < closestDist) { closestDist = d; closest = p; }
      }
      if (!closest || closestDist > 1200) {
        for (const m of (G?.monsters || []).filter(e => e.isAlive && !e.isAncientClone)) {
          const d = Math.hypot(m.x - c.x, m.y - c.y);
          if (d < closestDist) { closestDist = d; closest = m; }
        }
      }
      c.prey = closest;
      if (closest) { c.targetX = closest.x; c.targetY = closest.y; }
      else if (Math.hypot(c.x - c.targetX, c.y - c.targetY) < 150) {
        c.targetX = 400 + Math.random() * (mapW - 800);
        c.targetY = 400 + Math.random() * (mapH - 800);
      }
    } else { c.targetX = c.prey.x; c.targetY = c.prey.y; }

    const dx = c.targetX - c.x, dy = c.targetY - c.y, dist = Math.hypot(dx, dy);
    const targetAngle = Math.atan2(dy, dx);
    let diff = targetAngle - c.aimAngle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    c.aimAngle += Math.sign(diff) * Math.min(Math.abs(diff), c.turnSpeed * dt);
    if (dist > 15) {
      const step = c.speed * dt;
      c.vx = Math.cos(c.aimAngle) * step;
      c.vy = Math.sin(c.aimAngle) * step;
      c.x += c.vx;
      c.y += c.vy;
    } else { c.vx = 0; c.vy = 0; }
    c.x = Math.max(80, Math.min(mapW - 80, c.x));
    c.y = Math.max(80, Math.min(mapH - 80, c.y));

    this.devour();

    for (const puff of this.puffs) puff.rot += puff.rotSpeed * dt;
    if (Math.random() < 0.25) this.bolt();
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      this.bolts[i].life -= dt;
      if (this.bolts[i].life <= 0) this.bolts.splice(i, 1);
    }
  },

  devour() {
    const c = this.cloud, G = window.GameManager;
    if (!c || !G) return;
    for (const victim of [...(G.pawns || []), ...(G.monsters || [])]) {
      if (this.protected(victim)) continue;
      if (Math.hypot(victim.x - c.x, victim.y - c.y) <= c.radius) this.executeDevour(victim);
    }
  },

  executeDevour(victim) {
    if (!victim?.isAlive || this.protected(victim)) return;
    const V = window.GameRenderer?.VfxManager;
    const oldX = victim.x, oldY = victim.y;
    V?.addEffect?.('impact', oldX, oldY, { radius: 75, color: '#9b59b6', life: 0.9 });
    V?.addBurstParticles?.(oldX, oldY, '#a55eea', 30);
    V?.addBurstParticles?.(oldX, oldY, '#ff3838', 25);
    V?.addBurstParticles?.(oldX, oldY, '#180a29', 35);
    V?.addDamageNumber?.(oldX, oldY - 30, 'BIẾN MẤT', 'crit');
    window.GameEngine?.Audio?.play?.('death', victim, undefined, { tier: victim.tier });
    window.GameUI?.CombatTicker?.log(`⚡ Đám mây Hư Không nuốt chửng ${victim.name} — Biến mất hoàn toàn!`);
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
    const G = window.GameManager;
    G?.updateHUD?.();
    G?.checkVictoryCondition?.();
  },

  bolt() {
    const c = this.cloud;
    if (!c) return;
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 60;
    let x = c.x + Math.cos(angle) * dist, y = c.y + Math.sin(angle) * dist;
    const points = [{ x, y }];
    const dir = angle + (Math.random() - 0.5) * 1.5;
    const segments = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < segments; i++) {
      const len = 15 + Math.random() * 20;
      x += Math.cos(dir + (Math.random() - 0.5) * 1.8) * len;
      y += Math.sin(dir + (Math.random() - 0.5) * 1.8) * len;
      points.push({ x, y });
    }
    this.bolts.push({ points, color: Math.random() < 0.6 ? '#d980fa' : '#ff4757', life: 0.12 + Math.random() * 0.1 });
  },

  avoid(pawn, dt) {
    const c = this.cloud;
    if (!c?.isAlive || !pawn?.isAlive) return false;
    const dist = Math.hypot(pawn.x - c.x, pawn.y - c.y);
    if (dist > 360) return false;
    const M = window.GameEngine.MapTerrain;
    pawn.plan = null;
    pawn.targetEnemy = null;
    pawn.chase = null;
    pawn.meditating = false;
    pawn.fear = Math.min(100, (pawn.fear || 0) + 40);
    pawn.objective = '🚨 THÁO CHẠY KHỎI ĐÁM MÂY HƯ KHÔNG!';
    pawn.thought = 'Đám mây Hư Không đang tới! Chạy trước khi bị nuốt chửng!';
    const away = Math.atan2(pawn.y - c.y, pawn.x - c.x);
    pawn.aimAngle = away;
    const speed = M.getMoveSpeed(pawn) * 1.25;
    M.moveEntity(pawn, Math.cos(away) * speed * dt, Math.sin(away) * speed * dt);
    return true;
  },

  render(ctx) {
    const c = this.cloud;
    if (!c?.isAlive) return;
    ctx.save();

    const bg = ctx.createRadialGradient(c.x, c.y, 20, c.x, c.y, c.visualRadius * 1.3);
    bg.addColorStop(0, 'rgba(44, 11, 77, 0.65)');
    bg.addColorStop(0.5, 'rgba(24, 6, 45, 0.45)');
    bg.addColorStop(1, 'rgba(10, 2, 20, 0)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.visualRadius * 1.3, 0, Math.PI * 2);
    ctx.fill();

    for (const puff of this.puffs) {
      const pulse = Math.sin(this.clock * puff.pulseSpeed + puff.pulseOffset) * 8;
      const pr = puff.baseR + pulse;
      ctx.save();
      ctx.translate(c.x + puff.relX, c.y + puff.relY);
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

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.aimAngle);
    const jaw = ctx.createRadialGradient(40, 0, 5, 40, 0, 65);
    jaw.addColorStop(0, 'rgba(255, 60, 60, 0.95)');
    jaw.addColorStop(0.3, 'rgba(235, 47, 6, 0.75)');
    jaw.addColorStop(0.7, 'rgba(120, 10, 50, 0.4)');
    jaw.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = jaw;
    ctx.beginPath();
    ctx.ellipse(38, 0, 48, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0314';
    ctx.beginPath();
    ctx.moveTo(25, -20); ctx.lineTo(45, -10); ctx.lineTo(30, -5); ctx.lineTo(52, 0);
    ctx.lineTo(30, 5); ctx.lineTo(45, 10); ctx.lineTo(25, 20); ctx.lineTo(15, 0);
    ctx.closePath();
    ctx.fill();
    const eye = (ex, ey) => {
      const g = ctx.createRadialGradient(ex, ey, 2, ex, ey, 18);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.2, '#ff3838');
      g.addColorStop(0.6, 'rgba(255, 50, 50, 0.5)');
      g.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(ex, ey, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff7675';
      ctx.beginPath();
      ctx.ellipse(ex, ey, 5, 9, 0.2, 0, Math.PI * 2);
      ctx.fill();
    };
    eye(20, -22);
    eye(20, 22);
    ctx.restore();

    for (const bolt of this.bolts) {
      if (!bolt.points || bolt.points.length < 2) continue;
      ctx.save();
      ctx.strokeStyle = bolt.color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = bolt.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(bolt.points[0].x, bolt.points[0].y);
      for (let i = 1; i < bolt.points.length; i++) ctx.lineTo(bolt.points[i].x, bolt.points[i].y);
      ctx.stroke();
      ctx.restore();
    }

    ctx.strokeStyle = 'rgba(165, 94, 234, 0.22)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e056fd';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 6;
    ctx.fillText('⚡ HƯ KHÔNG ⚡', c.x, c.y - c.visualRadius * 0.75);
    ctx.font = '11px Arial';
    ctx.fillStyle = '#ff7979';
    ctx.fillText('Bất Tử • Nuốt Chửng', c.x, c.y - c.visualRadius * 0.75 + 14);
    ctx.restore();
  }
};
