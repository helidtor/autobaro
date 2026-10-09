/**
 * aliothSystem.js - Alioth, long thần riêng, không thuộc đàn quái.
 * Thân rắn kiểu châu Á bám một vòng bay khép kín khắp map.
 * Đầu dẫn, các đốt sau lấy mẫu lùi dọc đường bay nên thân uốn theo quỹ đạo.
 */
window.GameEntities = window.GameEntities || {};

window.GameEntities.AliothSystem = {
  alioth: null,
  dragons: [],
  spine: [],
  sparks: [],
  clock: 0,
  travel: 0,
  path: null,
  pathCum: null,
  pathLen: 0,
  mapW: 0,
  mapH: 0,
  speed: 240,
  segments: 34,
  spacing: 18,

  init(mapWidth, mapHeight) {
    this.sparks = [];
    this.clock = 0;
    this.dragons = [];
    this.buildPath(mapWidth, mapHeight);
    const colors = [
      { name: 'Alioth', scale: '#c4342d', deep: '#8d241f', belly: '#f6d48a', gold: '#f0c14d', mane: '#f7f1e4' },
      { name: 'Long Thanh', scale: '#1f6f4a', deep: '#134a31', belly: '#d8f3e2', gold: '#e8c15a', mane: '#f4fff8' },
      { name: 'Long Huyền', scale: '#3a2f8a', deep: '#241c5c', belly: '#e4defa', gold: '#f0c14d', mane: '#f6f2ff' }
    ];
    for (let i = 0; i < colors.length; i++) {
      const travel = this.pathLen * (0.18 + i / colors.length);
      const head = this.sample(travel);
      const spine = this.spineAt(travel);
      this.dragons.push({
        id: 'alioth_entity_' + i,
        name: colors[i].name,
        title: 'Long Thần',
        isAlioth: true,
        isAlive: true,
        invincible: true,
        x: head.x,
        y: head.y,
        vx: 0,
        vy: 0,
        aimAngle: Math.atan2(head.ty, head.tx),
        speed: this.speed,
        radius: 36,
        travel,
        spine,
        sparks: [],
        colors: colors[i]
      });
    }
    this.alioth = this.dragons[0];
    this.spine = this.dragons[0].spine;
    window.GameUI?.CombatTicker?.log('🐉 Ba long thần cất cánh và bay tuần tra khắp đấu trường.');
  },

  reset(mapWidth, mapHeight) {
    this.init(mapWidth, mapHeight);
  },

  buildPath(mapW, mapH) {
    const marks = [
      [.16, .22], [.40, .12], [.66, .18], [.86, .34],
      [.90, .56], [.74, .80], [.48, .90], [.24, .78],
      [.10, .56], [.12, .36]
    ].map(([x, y]) => ({ x: x * mapW, y: y * mapH }));
    const steps = marks.length * 28;
    const path = [];
    for (let i = 0; i < steps; i++) path.push(this.catmull(marks, (i / steps) * marks.length));
    const cum = [0];
    for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y));
    const close = Math.hypot(path[0].x - path[path.length - 1].x, path[0].y - path[path.length - 1].y);
    path.push({ ...path[0] });
    cum.push(cum[cum.length - 1] + close);
    this.path = path;
    this.pathCum = cum;
    this.pathLen = cum[cum.length - 1] || 1;
    this.mapW = mapW;
    this.mapH = mapH;
  },

  catmull(points, t) {
    const n = points.length;
    const i = Math.floor(t) % n;
    const f = t - Math.floor(t);
    const p0 = points[(i - 1 + n) % n], p1 = points[i], p2 = points[(i + 1) % n], p3 = points[(i + 2) % n];
    const f2 = f * f, f3 = f2 * f;
    const axis = k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * f + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * f2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * f3);
    return { x: axis('x'), y: axis('y') };
  },

  pointAlong(dist) {
    const len = this.pathLen || 1;
    dist = ((dist % len) + len) % len;
    const cum = this.pathCum;
    let lo = 1, hi = cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < dist) lo = mid + 1;
      else hi = mid;
    }
    const span = cum[lo] - cum[lo - 1] || 1;
    const f = (dist - cum[lo - 1]) / span;
    const a = this.path[lo - 1], b = this.path[lo];
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
  },

  sample(dist) {
    const base = this.pointAlong(dist);
    const ahead = this.pointAlong(dist + 16);
    let tx = ahead.x - base.x, ty = ahead.y - base.y;
    const mag = Math.hypot(tx, ty) || 1;
    tx /= mag; ty /= mag;
    const nx = -ty, ny = tx;
    const wave = Math.sin(dist * 0.017 + this.clock * 2.4) * 24;
    return { x: base.x + nx * wave, y: base.y + ny * wave, tx, ty, nx, ny };
  },

  spineAt(travel) {
    const spine = [];
    for (let i = 0; i < this.segments; i++) spine.push(this.sample(travel - i * this.spacing));
    return spine;
  },

  protected(entity) {
    if (!entity?.isAlive || entity.isAlioth || entity.isSplit) return true;
    if (entity.isAncient || entity.isAncientClone || entity.isDemonKing) return true;
    return entity === window.GameEntities.EntityManager?.worldBoss;
  },

  nearest(x, y) {
    let best = null, dist = Infinity;
    for (const dragon of this.dragons) for (const point of dragon.spine) {
      const d = Math.hypot(point.x - x, point.y - y);
      if (d < dist) { dist = d; best = point; }
    }
    return { point: best, dist };
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
    if (mapW !== this.mapW || mapH !== this.mapH || !this.path) this.buildPath(mapW, mapH);
    this.clock += dt;
    for (const dragon of this.dragons) {
      if (!dragon.isAlive) continue;
      dragon.travel += this.speed * dt;
      dragon.spine = this.spineAt(dragon.travel);
      const head = dragon.spine[0];
      dragon.x = head.x;
      dragon.y = head.y;
      dragon.vx = head.tx * this.speed;
      dragon.vy = head.ty * this.speed;
      dragon.aimAngle = Math.atan2(head.ty, head.tx);
      if (Math.random() < dt * 4) dragon.sparks.push({ life: 0.16 + Math.random() * 0.08, seed: Math.random() * 6 });
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
      if (hit.dist <= 48) this.executeDevour(victim);
    }
  },

  executeDevour(victim) {
    if (!victim?.isAlive || this.protected(victim)) return;
    const V = window.GameRenderer?.VfxManager;
    const G = window.GameManager;
    const oldX = victim.x;
    const oldY = victim.y;

    V?.addEffect?.('impact', oldX, oldY, { radius: 65, color: '#e7c56a', life: 0.8 });
    V?.addBurstParticles?.(oldX, oldY, '#f4d48a', 25);
    V?.addBurstParticles?.(oldX, oldY, '#c4342d', 25);
    V?.addBurstParticles?.(oldX, oldY, '#2c0b4d', 30);
    V?.addDamageNumber?.(oldX, oldY - 30, 'BIẾN MẤT', 'crit');
    window.GameEngine?.Audio?.play?.('death', victim, undefined, { tier: victim.tier });
    window.GameUI?.CombatTicker?.log(`⚡ Alioth nuốt chửng ${victim.name} — Biến mất hoàn toàn!`);

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

    if (victim === window.GameEntities.EntityManager?.worldBoss) window.GameEntities.AncientSystem?.awaken?.(victim, this.alioth);

    if (G) {
      G.updateHUD?.();
      G.checkVictoryCondition?.();
    }
  },

  renderShadow(ctx) {
    if (!this.dragons.length) return;
    ctx.save();
    ctx.fillStyle = 'rgba(28, 18, 16, 0.16)';
    for (const dragon of this.dragons) for (let i = 0; i < dragon.spine.length; i += 2) {
      const point = dragon.spine[i];
      const girth = 14 + (1 - i / dragon.spine.length) * 10;
      ctx.beginPath();
      ctx.ellipse(point.x, point.y + 30, girth * 1.7, girth * 0.62, Math.atan2(point.ty, point.tx), 0, Math.PI * 2);
      ctx.fill();
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
      for (let i = spine.length - 1; i >= 1; i--) this.drawSegment(ctx, kit, spine, i, c.scale, c.deep, c.belly, c.gold, c.mane, time);
      this.drawHead(ctx, kit, spine[0], c.scale, c.deep, c.belly, c.gold, c.mane, time);
      for (const spark of dragon.sparks) this.drawSpark(ctx, kit, spine[0], spark);
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
    if (index === spine.length - 1) kit.poly([[-rad, -rad * 0.2], [-rad * 2.4, -rad * 0.1], [-rad * 1.6, rad * 0.7], [-rad * 0.2, rad * 0.2]], gold, 1.5);
    if ([8, 14, 21, 27].includes(index)) this.drawClaw(kit, rad, gold, time, index);
    ctx.restore();
    if (index % 7 === 3) this.drawCloud(ctx, kit, point.x + point.nx * 34, point.y + point.ny * 34, 1, time + index);
  },

  drawClaw(kit, rad, gold, time, index) {
    const step = Math.sin(time * 5 + index) * 3;
    kit.line(rad * 0.2, rad * 0.35, rad * 0.15 + step, rad * 1.25, gold, 3);
    kit.oval(rad * 0.15 + step, rad * 1.35, rad * 0.34, rad * 0.22, gold, 1.3);
    for (const toe of [-4, 0, 4]) kit.line(rad * 0.15 + step + toe * 0.35, rad * 1.3, rad * 0.15 + step + toe, rad * 1.62, '#f8e7b4', 1.4);
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
