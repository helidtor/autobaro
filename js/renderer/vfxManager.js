/**
 * vfxManager.js - Quản lý hạt hiệu ứng, Mote cảm xúc, Đạn bay và Số sát thương nảy
 * Áp dụng Object Pooling tối đa để không bao giờ bị drop FPS do Garbage Collection!
 */
window.GameRenderer = window.GameRenderer || {};

window.GameRenderer.VfxManager = {
  effects: [],
  damageNumbers: [],
  motes: [],
  projectiles: [],
  particles: [],

  init: function() {
    this.effects = [];
    this.damageNumbers = [];
    this.motes = [];
    this.projectiles = [];
    this.particles = [];
  },

  addEffect(kind, x, y, options = {}) {
    this.effects.push({kind,x,y,radius:30,angle:0,color:'#ffdea4',life:.5,...options,maxLife:options.life || .5});
  },

  drawEffect(ctx, e) {
    const p = Math.min(1,1-e.life/e.maxLife), r = e.radius;
    ctx.save(); ctx.translate(e.x,e.y);
    ctx.strokeStyle = e.color; ctx.fillStyle = e.color;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const circle = radius => {ctx.beginPath();ctx.arc(0,0,Math.max(0,radius),0,Math.PI*2);};
    if (e.kind === 'telegraph') {
      ctx.rotate(e.angle);
      ctx.lineWidth = 2.5; ctx.setLineDash([7,5]);
      ctx.globalAlpha = .18 + p*.15;
      ctx.beginPath();
      if (e.shape === 'line') ctx.rect(0,-25,e.length,50);
      else if (e.shape === 'cone') {ctx.moveTo(0,0);ctx.arc(0,0,e.length,-.75,.75);ctx.closePath();}
      else ctx.arc(0,0,r,0,Math.PI*2);
      ctx.fill(); ctx.globalAlpha = .9; ctx.stroke(); ctx.setLineDash([]);
      if (e.shape === 'circle') {circle(r*p);ctx.globalAlpha=.35;ctx.fill();}
      ctx.rotate(-e.angle); ctx.globalAlpha = 1;
      ctx.font = 'bold 11px Arial'; ctx.textAlign='center'; ctx.strokeStyle='#17252c';ctx.lineWidth=3;
      ctx.strokeText(e.label || 'NGUY HIỂM',0,-r-10);ctx.fillText(e.label || 'NGUY HIỂM',0,-r-10);
    } else {
      ctx.globalAlpha = Math.min(1,e.life/e.maxLife*2);
      ctx.lineWidth = 2.5;
      if (e.kind === 'slash') {
        ctx.rotate(e.angle);ctx.lineWidth = 7*(1-p)+1;
        ctx.beginPath();ctx.arc(0,0,r*(.7+.3*p),-.9+p*.5,.7+p*.5);ctx.stroke();
        ctx.strokeStyle='#fffdf2';ctx.lineWidth=2;ctx.stroke();
      } else if (e.kind === 'guard') {
        ctx.rotate(e.angle);ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,-8,r,-.9,.9);ctx.stroke();
        ctx.strokeStyle='#ffffff';ctx.lineWidth=1.5;ctx.stroke();
      } else if (e.kind === 'dash') {
        ctx.globalAlpha *= 1-p;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(e.tx-e.x,e.ty-e.y-10);ctx.stroke();
        ctx.lineWidth=1;ctx.strokeStyle='#fff';ctx.stroke();
      } else if (e.kind === 'heal') {
        circle(r*(.4+.6*p));ctx.stroke();
        for(let i=0;i<4;i++){const a=i*Math.PI/2;const x=Math.cos(a)*r*.6,y=Math.sin(a)*r*.3-p*28;
          ctx.fillRect(x-2,y-7,4,14);ctx.fillRect(x-7,y-2,14,4);}
      } else if (e.kind === 'rune' || e.kind === 'smoke') {
        circle(r*(.7+.3*p));ctx.stroke();ctx.rotate(-.3+p*.6);
        for(let i=0;i<6;i++){ctx.rotate(Math.PI/3);ctx.beginPath();ctx.moveTo(r*.7,-4);ctx.lineTo(r,0);ctx.lineTo(r*.7,4);ctx.stroke();}
        if(e.kind==='smoke'){ctx.globalAlpha*=.25;circle(r);ctx.fill();}
      } else if (e.shape === 'line' || e.shape === 'cone') {
        ctx.rotate(e.angle);ctx.lineWidth=6*(1-p)+2;
        ctx.beginPath();
        if(e.shape==='line'){ctx.moveTo(0,0);ctx.lineTo(e.length,0);}
        else {ctx.arc(0,0,e.length*(.5+.5*p),-.75,.75);}
        ctx.stroke();ctx.strokeStyle='#fff8df';ctx.lineWidth=2;ctx.stroke();
      } else {
        circle(r*(.3+.7*p));ctx.stroke();
        const count = e.kind==='hit' ? 6 : 12;
        for(let i=0;i<count;i++){
          const a=i*Math.PI*2/count, x=Math.cos(a)*r*(.2+.75*p),y=Math.sin(a)*r*(.2+.75*p);
          ctx.save();ctx.translate(x,y);ctx.rotate(a);
          if(e.kind==='flame'){ctx.beginPath();ctx.moveTo(-5,0);ctx.quadraticCurveTo(-10,-18,0,-22-20*(1-p));ctx.quadraticCurveTo(10,-10,5,0);ctx.fill();ctx.fillStyle='#fff2b8';ctx.fillRect(-1,-18,2,13);}
          else if(e.kind==='frost'){ctx.beginPath();ctx.moveTo(-4,0);ctx.lineTo(0,-20*(1-p)-8);ctx.lineTo(4,0);ctx.closePath();ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke();}
          else {ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(10+12*(1-p),0);ctx.stroke();}
          ctx.restore();
        }
      }
    }
    ctx.restore();
  },

  // Thêm chữ số sát thương bay lên
  addDamageNumber: function(x, y, amount, type = 'normal') {
    this.damageNumbers.push({
      x: x + (Math.random() - 0.5) * 16,
      y: y - 10,
      vy: -1.8,
      text: typeof amount === 'number' ? Math.round(amount) : amount,
      type: type, // 'normal', 'crit', 'heal', 'true', 'block'
      life: 1.0, // giây
      scale: type === 'crit' ? 1.5 : 1.0
    });
  },

  // Thêm Emotion Mote lơ lửng trên đầu Pawn
  addEmotionMote: function(targetPawn, icon, color = '#ffffff') {
    // Không spam nhiều mote cùng lúc trên 1 pawn
    const existing = this.motes.find(m => m.pawn === targetPawn && m.icon === icon);
    if (existing) {
      existing.life = 1.6; // làm mới thời gian
      return;
    }

    this.motes.push({
      pawn: targetPawn,
      icon: icon,
      color: color,
      offsetY: -36,
      life: 1.8,
      wobble: Math.random() * Math.PI
    });
  },

  // Thêm Đạn bay (Mũi tên, Quả cầu lửa, Đạn phép)
  addProjectile: function(source, targetX, targetY, speed, weaponOrSkill, onHit) {
    const dx = targetX - source.x;
    const dy = targetY - source.y;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    this.projectiles.push({
      x: source.x,
      y: source.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      source: source,
      angle: angle,
      rangeLeft: Math.min(dist + 20, 300),
      config: weaponOrSkill,
      onHit: onHit
    });
  },

  // Thêm hạt máu/bụi/tia lửa cartoon
  addBurstParticles: function(x, y, color = '#e74c3c', count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        radius: 2.0 + Math.random() * 2.0,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.5
      });
    }
  },

  // Cập nhật logic VFX theo delta time
  update: function(dt) {
    this.effects = this.effects.filter(e => {e.life -= dt; return e.life > 0;});
    // 1. Cập nhật Số sát thương
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.y += dn.vy * 60 * dt;
      dn.vy += 0.05 * 60 * dt; // trọng lực nhẹ
      dn.life -= dt;
      if (dn.life <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }

    // 2. Cập nhật Emotion Motes
    for (let i = this.motes.length - 1; i >= 0; i--) {
      const m = this.motes[i];
      m.life -= dt;
      m.offsetY -= 4 * dt; // bay lên nhẹ
      if (m.life <= 0 || !m.pawn.isAlive) {
        this.motes.splice(i, 1);
      }
    }

    // 3. Cập nhật Đạn bay
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const voidBoss=window.GameEntities.AncientSystem.boss;
      if(voidBoss?.isAlive&&voidBoss.ancientKind==='void'&&!p.voidBent&&Math.hypot(p.x-voidBoss.x,p.y-voidBoss.y)<120){
        p.voidBent=true;const angle=.6,vx=p.vx;p.vx=vx*Math.cos(angle)-p.vy*Math.sin(angle);p.vy=vx*Math.sin(angle)+p.vy*Math.cos(angle);
        this.addEffect('rune',p.x,p.y,{radius:18,color:'#ad87ee',life:.3});
      }
      const moveDist = Math.hypot(p.vx * dt, p.vy * dt);
      // Swept substeps keep fast-forward projectiles from tunnelling through targets.
      const steps = Math.max(1,Math.ceil(moveDist/10));
      let hit = false;
      for(let j=0;j<steps && !hit;j++){
        p.x += p.vx*dt/steps; p.y += p.vy*dt/steps;
        hit = !window.GameEngine.MapTerrain.canStand(p.x,p.y,0) || !window.GameEngine.MapTerrain.templeAccess(null,p.x,p.y) || (p.onHit ? p.onHit(p.x,p.y,p) : false);
      }
      p.rangeLeft -= moveDist;
      if (hit || p.rangeLeft <= 0) {
        // Nổ hạt khi chạm đích
        this.addBurstParticles(p.x, p.y, p.config && p.config.type === 'fireball' ? '#f39c12' : '#ecf0f1', 5);
        this.projectiles.splice(i, 1);
      }
    }

    // 4. Cập nhật Hạt hạt nổ
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * 60 * dt;
      pt.y += pt.vy * 60 * dt;
      pt.life -= dt;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  },

  // Vẽ toàn bộ VFX lên màn hình
  render: function(ctx, time) {
    time = (time !== undefined ? time : performance.now() / 1000);
    this.effects.forEach(e => this.drawEffect(ctx,e));
    // 1. Vẽ Đạn bay
    this.projectiles.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      ctx.strokeStyle=p.config?.color || '#ffdba1';ctx.lineWidth=4;ctx.globalAlpha=.45;
      ctx.beginPath();ctx.moveTo(-26,0);ctx.lineTo(0,0);ctx.stroke();ctx.globalAlpha=1;
      if (p.config && p.config.type === 'fireball') {
        // Cầu lửa
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(2, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Mũi tên
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(8, 0);
        ctx.stroke();

        // Đầu tên
        ctx.fillStyle = '#bdc3c7';
        ctx.beginPath();
        ctx.moveTo(8, -3);
        ctx.lineTo(13, 0);
        ctx.lineTo(8, 3);
        ctx.fill();
      }

      ctx.restore();
    });

    // 2. Vẽ Hạt nổ
    this.particles.forEach(pt => {
      const alpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // 3. Vẽ Emotion Motes trên đầu Pawn
    this.motes.forEach(m => {
      const px = m.pawn.x;
      const py = m.pawn.y + m.offsetY + Math.sin(time * 6 + m.wobble) * 3;

      ctx.save();
      ctx.font = '16px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Nền bóng nhỏ sau emote
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.arc(px, py, 11, 0, Math.PI * 2);
      ctx.fill();

      // Vẽ Icon emote
      ctx.fillText(m.icon, px, py + 1);
      ctx.restore();
    });

    // 4. Vẽ Số sát thương nảy
    this.damageNumbers.forEach(dn => {
      ctx.save();
      ctx.globalAlpha = Math.min(1.0, dn.life * 1.5);

      let color = '#ffffff';
      let font = 'bold 12px Arial, sans-serif';

      if (dn.type === 'crit') {
        color = '#ff4757';
        font = 'bold 16px Arial, sans-serif';
      } else if (dn.type === 'heal') {
        color = '#2ed573';
        font = 'bold 12px Arial, sans-serif';
      } else if (dn.type === 'true') {
        color = '#a55eea';
        font = 'bold 13px Arial, sans-serif';
      } else if (dn.type === 'block') {
        color = '#fed330';
      }

      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(dn.text, dn.x, dn.y);
      ctx.fillText(dn.text, dn.x, dn.y);

      ctx.restore();
    });
  }
};
