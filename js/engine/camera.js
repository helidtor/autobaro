/**
 * camera.js - Camera thông minh với Auto-Director, Khóa mục tiêu và Zoom mượt mà
 */
window.GameEngine = window.GameEngine || {};

window.GameEngine.Camera = {
  x: 1300,
  y: 1300,
  targetX: 1300,
  targetY: 1300,
  viewportWidth: 1200,
  viewportHeight: 800,
  zoom: 1.0,
  targetZoom: 1.0,
  targetEntity: null,
  autoDirector: true,
  directorTimer: 0,

  init: function(viewportWidth, viewportHeight) {
    this.viewportWidth = viewportWidth || window.innerWidth;
    this.viewportHeight = viewportHeight || window.innerHeight;
    this.x = window.GameEngine.MapTerrain.MAP_WIDTH/2;
    this.y = window.GameEngine.MapTerrain.MAP_HEIGHT/2;
    this.targetX = this.x;
    this.targetY = this.y;
    this.zoom = 1.0;
    this.targetZoom = 1.0;
    this.targetEntity = null;
    this.autoDirector = true;
    this.directorTimer = 0;
  },

  panPixels(dx,dy){
    this.autoDirector=false;this.targetEntity=null;
    this.x-=dx/this.zoom;this.y-=dy/this.zoom;
    this.x=Math.max(0,Math.min(window.GameEngine.MapTerrain.MAP_WIDTH,this.x));
    this.y=Math.max(0,Math.min(window.GameEngine.MapTerrain.MAP_HEIGHT,this.y));
    this.targetX=this.x;this.targetY=this.y;
  },
  resize: function(w, h) {
    this.viewportWidth = w;
    this.viewportHeight = h;
  },

  follow: function(target) {
    this.targetEntity = target;
    this.autoDirector = false;
  },

  update: function(dt, autoDirectorEnabled, allPawns = [], allMonsters = [], worldBoss = null) {
    if (autoDirectorEnabled !== undefined) {
      this.autoDirector = autoDirectorEnabled;
    }

    const G=window.GameManager;
    if(G)G.cameraShake=Math.max(0,(G.cameraShake||0)-dt);
    if(G&&!G.isPlayerMode){
      const k=G.keys,dx=(k.d||k.arrowright?1:0)-(k.a||k.arrowleft?1:0),dy=(k.s||k.arrowdown?1:0)-(k.w||k.arrowup?1:0);
      if(dx||dy)this.panPixels(-dx*500*dt,-dy*500*dt);
    }
    // 1. Logic Đạo Diễn Tự Động (Auto-Director AI)
    if (this.autoDirector) {
      this.directorTimer -= dt;
      if (this.directorTimer <= 0 || !this.targetEntity || !this.targetEntity.isAlive) {
        this.directorTimer = 10; // Giữ tiêu điểm 10 giây thực tế.

        let bestScore = -1;
        let bestCandidate = null;

        // Ưu tiên 1: Bot đang kích hoạt Cuồng Nộ (Berserk), Sợ hãi cao, hoặc đang đánh nhau
        for (let i = 0; i < allPawns.length; i++) {
          const p = allPawns[i];
          if (!p.isAlive) continue;

          let score = 10;
          if (p.isBerserk) score += 2000;
          if (p.isClutchEscape) score += 1500;
          if (p.isPlottingBetrayal) score += 1200;
          if (p.isAllied) score += 400;
          if (p.currentHp < p.maxHp * 0.4) score += 300;
          if (p.attackState && p.attackState.isAttacking) score += 200;
          if (p.killCount > 2) score += p.killCount * 50;

          if (score > bestScore) {
            bestScore = score;
            bestCandidate = p;
          }
        }

        // Ưu tiên 2: World Boss nếu đang còn sống và gần người
        if (worldBoss && worldBoss.isAlive) {
          if (bestScore < 200 && allPawns.some(p=>p.isAlive&&Math.hypot(p.x-worldBoss.x,p.y-worldBoss.y)<300)) {
            bestCandidate = worldBoss;
          }
        }

        if (bestCandidate) {
          this.targetEntity = bestCandidate;
        }
      }
    }

    // 2. Di chuyển mượt theo mục tiêu
    if (this.targetEntity && this.targetEntity.isAlive) {
      this.targetX = this.targetEntity.x;
      this.targetY = this.targetEntity.y;
    }

    // Lerp di chuyển
    const lerpSpeed = Math.min(1.0, 5.0 * dt);
    this.x += (this.targetX - this.x) * lerpSpeed;
    this.y += (this.targetY - this.y) * lerpSpeed;

    // Giữ camera trong giới hạn bản đồ (0 - 2600)
    this.x = Math.max(0, Math.min(window.GameEngine.MapTerrain.MAP_WIDTH, this.x));
    this.y = Math.max(0, Math.min(window.GameEngine.MapTerrain.MAP_HEIGHT, this.y));

    // Lerp zoom
    this.zoom += (this.targetZoom - this.zoom) * Math.min(1.0, 4.0 * dt);
  },

  // Chuyển đổi tọa độ màn hình sang tọa độ thế giới
  screenToWorld: function(sx, sy) {
    const cx = this.viewportWidth / 2;
    const cy = this.viewportHeight / 2;
    return {
      x: (sx - cx) / this.zoom + this.x,
      y: (sy - cy) / this.zoom + this.y
    };
  },

  worldToScreen: function(wx, wy) {
    const cx = this.viewportWidth / 2;
    const cy = this.viewportHeight / 2;
    return {
      x: (wx - this.x) * this.zoom + cx,
      y: (wy - this.y) * this.zoom + cy
    };
  },

  // Áp dụng biến đổi camera vào Canvas Context
  applyTransform: function(ctx) {
    ctx.save();
    const shake=window.GameManager.cameraShake||0;
    ctx.translate(this.viewportWidth / 2+Math.sin(performance.now()*.06)*shake*15, this.viewportHeight / 2+Math.cos(performance.now()*.07)*shake*15);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, -this.y);
  },

  restoreTransform: function(ctx) {
    ctx.restore();
  }
};
