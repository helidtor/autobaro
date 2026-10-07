/**
 * game.js - Master Game Loop & Core Controller
 * Điều phối toàn bộ vòng lặp vật lý, tương tác Người Chơi, AI 100 Bot, Quái vật, Camera và Giao diện
 */
window.GameManager = {
  canvas: null,
  ctx: null,
  width: 5200,
  height: 5200,
  gameSpeed: 1.0,
  isPaused: false,
  matchTime: 0,
  isGameOver: false,
  winnerPawn: null,
  battleRoyaleResolved: false,
  resultOpen: false,

  // Chế độ chơi: false = Đạo Diễn / Spectator, true = Người Chơi Điều Khiển (1v99)
  isPlayerMode: false,
  playerPawn: null,

  // Thực thể
  pawns: [],
  monsters: [],
  dropItems: [],
  spatialGrid: null,

  // Trạng thái bàn phím & chuột
  keys: {},
  mouse: {
    screenX: 0,
    screenY: 0,
    worldX: 0,
    worldY: 0,
    isDown: false
  },

  // Chọn thực thể (Inspect)
  selectedEntity: null,

  init: function() {
    this.canvas = document.getElementById('game-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Khởi tạo các hệ thống con
    window.GameEngine.SpatialHash.init(this.width, this.height, 64);
    this.spatialGrid = window.GameEngine.SpatialHash;

    window.GameEngine.MapTerrain.init(this.width, this.height);
    window.GameEngine.Camera.init(this.canvas.width, this.canvas.height);
    window.GameRenderer.VfxManager.init();

    window.GameUI.CombatTicker.init();
    window.GameUI.InspectModal.init();
    window.GameUI.DirectorControls.init();

    // Khởi tạo thực thể
    window.GameEntities.EntityManager.init(this.width, this.height, 100);
    this.pawns = window.GameEntities.EntityManager.pawns;
    this.monsters = window.GameEntities.EntityManager.monsters;
    this.dropItems = window.GameEntities.EntityManager.dropItems;
    this.playerPawn = window.GameEntities.EntityManager.playerPawn;

    // Gán listener sự kiện bàn phím & chuột
    this.bindInputs();

    // Bắt đầu vòng lặp game
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  },

  startNewMatch: function() {
    this.matchTime=0;this.gameSpeed=1;this.isPaused=false;this.isGameOver=false;
    this.battleRoyaleResolved=false;this.resultOpen=false;this.winnerPawn=null;
    this.selectedEntity=null;this.isPlayerMode=false;this.keys={};this.mouse.isDown=false;
    window.GameUI.InspectModal.inspect(null);
    document.getElementById('story-card-modal').classList.add('hidden');
    window.GameEngine.MapTerrain.init(this.width,this.height);
    window.GameEngine.Camera.init(this.canvas.width,this.canvas.height);
    window.GameRenderer.VfxManager.init();
    window.GameUI.CombatTicker.init();
    window.GameUI.DirectorControls.activeGodPower=null;
    document.getElementById('god-power-prompt').classList.add('hidden');
    window.GameEntities.EntityManager.init(this.width,this.height,100);
    const E=window.GameEntities.EntityManager;
    this.pawns=E.pawns;this.monsters=E.monsters;this.dropItems=E.dropItems;this.playerPawn=E.playerPawn;
    this.spatialGrid.clear();
    document.querySelectorAll('.btn-speed').forEach(b=>b.classList.toggle('active',b.dataset.speed==='1'));
    document.getElementById('btn-toggle-mode').innerText='👁️ Chế độ: Đạo Diễn (Spectator)';
    document.getElementById('btn-toggle-mode').classList.remove('btn-player-mode');
    this.updateHUD();
  },

  resizeCanvas: function() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (window.GameEngine.Camera) {
      window.GameEngine.Camera.viewportWidth = this.canvas.width;
      window.GameEngine.Camera.viewportHeight = this.canvas.height;
    }
  },

  bindInputs: function() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;

      if (e.repeat && [' ', 'Shift', 'h', 'q', 'e', 'r', 'f'].includes(e.key)) return;
      if (e.key === ' ') e.preventDefault();
      if (e.key.toLowerCase() === 'm') this.showMapOverview();
      // Phím tắt chế độ
      if (e.key === ' ') {
        // Space: Lướt né đòn (trong Player mode) hoặc Bật/Tắt Auto-Director (trong Spectator mode)
        if (this.isPlayerMode && this.playerPawn && this.playerPawn.isAlive) {
          this.executePlayerDodge();
        } else {
          window.GameEngine.Camera.autoDirector = !window.GameEngine.Camera.autoDirector;
        }
      }

      if (e.key === 'Escape' && this.resultOpen) this.continueAfterResult();
      if (this.isPlayerMode && !this.isPaused && !this.isGameOver) {
        if (e.key === 'Shift') window.GameEntities.CombatSystem.defend(this.playerPawn, 'block');
        if (e.key.toLowerCase() === 'h') window.GameEntities.CombatSystem.usePotion(this.playerPawn);
      }
      // Kỹ năng Q, E, R, F
      if (this.isPlayerMode && this.playerPawn && this.playerPawn.isAlive) {
        if (['q', 'e', 'r', 'f'].includes(e.key.toLowerCase())) {
          this.executePlayerSkill(e.key.toLowerCase());
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.screenX = e.clientX - rect.left;
      this.mouse.screenY = e.clientY - rect.top;

      if(this.mouse.isDown && !this.isPlayerMode){
        const dx=e.clientX-this.mouse.downX,dy=e.clientY-this.mouse.downY;
        if(this.mouse.dragged || Math.hypot(dx,dy)>6){
          this.mouse.dragged=true;
          window.GameEngine.Camera.panPixels(e.clientX-this.mouse.lastX,e.clientY-this.mouse.lastY);
          this.canvas.style.cursor='grabbing';
        }
        this.mouse.lastX=e.clientX;this.mouse.lastY=e.clientY;
      }
      const worldPos = window.GameEngine.Camera.screenToWorld(this.mouse.screenX, this.mouse.screenY);
      this.mouse.worldX = worldPos.x;
      this.mouse.worldY = worldPos.y;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        const rect=this.canvas.getBoundingClientRect(),c=window.GameEngine.Camera;
        this.mouse.screenX=e.clientX-rect.left;this.mouse.screenY=e.clientY-rect.top;
        const world=c.screenToWorld(this.mouse.screenX,this.mouse.screenY);this.mouse.worldX=world.x;this.mouse.worldY=world.y;
        this.mouse.isDown=true;this.mouse.dragged=false;
        this.mouse.downX=this.mouse.lastX=e.clientX;this.mouse.downY=this.mouse.lastY=e.clientY;
        if(this.isPlayerMode)this.handleCanvasClick();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        if(this.mouse.isDown&&!this.mouse.dragged&&!this.isPlayerMode)this.handleCanvasClick();
        this.mouse.isDown = false;this.canvas.style.cursor='default';
      }
    });

    window.addEventListener('blur',()=>{this.keys={};this.mouse.isDown=false;});
    this.canvas.addEventListener('wheel', (e) => {
      // Zoom Camera
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      window.GameEngine.Camera.targetZoom = Math.max(0.1, Math.min(2.5, window.GameEngine.Camera.targetZoom * zoomFactor));
    }, { passive: true });
  },

  handleCanvasClick: function() {
    // 1. Kiểm tra Quyền Năng Chúa Tể đang kích hoạt
    if (window.GameUI.DirectorControls.activeGodPower) {
      window.GameUI.DirectorControls.executeGodPowerAt(this.mouse.worldX, this.mouse.worldY);
      return;
    }

    // 2. Nếu đang ở Player Mode, nhấp chuột trái để đánh
    if (this.isPlayerMode && this.playerPawn && this.playerPawn.isAlive) {
      this.executePlayerAttack();
      return;
    }

    // 3. Nếu ở Spectator Mode, click để Inspect hoặc Khóa Mục Tiêu
    const clickedPawn = this.pawns.find(p => p.isAlive && Math.hypot(p.x - this.mouse.worldX, p.y - this.mouse.worldY) < 25);
    const closestMonster = this.monsters.filter(m=>m.isAlive&&Math.hypot(m.x-this.mouse.worldX,m.y-this.mouse.worldY)<30*(m.scale||1)).sort((a,b)=>Math.hypot(a.x-this.mouse.worldX,a.y-this.mouse.worldY)-Math.hypot(b.x-this.mouse.worldX,b.y-this.mouse.worldY))[0];
    if (clickedPawn && (!closestMonster || Math.hypot(clickedPawn.x-this.mouse.worldX,clickedPawn.y-this.mouse.worldY)<Math.hypot(closestMonster.x-this.mouse.worldX,closestMonster.y-this.mouse.worldY))) {
      this.selectedEntity = clickedPawn;
      window.GameUI.InspectModal.inspect(clickedPawn);
      window.GameEngine.Camera.targetEntity = clickedPawn;
      window.GameEngine.Camera.autoDirector = false;
      return;
    }

    const clickedMonster = closestMonster;
    if (clickedMonster) {
      this.selectedEntity = clickedMonster;
      window.GameUI.InspectModal.inspect(clickedMonster);
      window.GameEngine.Camera.targetEntity = clickedMonster;
      window.GameEngine.Camera.autoDirector = false;
      return;
    }

    // Nhấp vào vùng trống -> bỏ chọn
    this.selectedEntity = null;
    window.GameUI.InspectModal.inspect(null);
  },

  showMapOverview: function() {
    const c=window.GameEngine.Camera;
    c.autoDirector=false; c.targetEntity=null;c.x=c.targetX=this.width/2;c.y=c.targetY=this.height/2;
    c.zoom=c.targetZoom=Math.max(.1,Math.min(this.canvas.width/this.width,(this.canvas.height-150)/this.height));
  },
  togglePlayerMode: function() {
    this.isPlayerMode = !this.isPlayerMode;
    if (this.playerPawn) {
      this.playerPawn.isPlayerControlled = this.isPlayerMode;
      if (this.isPlayerMode) {
        window.GameEngine.Camera.autoDirector = false;
        window.GameEngine.Camera.targetEntity = this.playerPawn;
        if (window.GameUI.CombatTicker) {
          window.GameUI.CombatTicker.log(`🎮 [NGƯỜI CHƠI] Bạn đã nhập hồn vào ${this.playerPawn.name}! Dùng WASD di chuyển, Chuột trái tấn công, Phím Space lướt!`);
        }
      }
    }
    return this.isPlayerMode;
  },

  spawnDropItem: function(x, y, equipmentData, slot = 'weapon') {
    return window.GameEntities.EntityManager.spawnDropItem(x, y, equipmentData, slot);
  },

  // Xử lý đòn đánh cơ bản của Player
  executePlayerAttack: function() {
    const p = this.playerPawn;
    if (!window.GameEntities.CombatSystem.canAttack(p) || p.attackCooldown > 0 || this.isPaused || this.isGameOver) return;

    p.aimAngle = Math.atan2(this.mouse.worldY - p.y, this.mouse.worldX - p.x);


    // Tìm mục tiêu trong góc vung vũ khí hoặc tầm bắn
    const range = p.weapon?.range || 35;
    const targets = this.spatialGrid.queryCircle(p.x, p.y, range);
    const validTarget = targets.find(t => window.GameEntities.CombatSystem.isEnemy(p, t));

    if (validTarget) {
      window.GameEntities.CombatSystem.executeAttack(p, validTarget);
    }
  },

  // Lướt né đòn của Player (Space)
  executePlayerDodge: function() {
    const p = this.playerPawn;
    if (this.isPaused || this.isGameOver) return;
    window.GameEntities.CombatSystem.defend(p, 'dodge');
  },

  // Thi triển kỹ năng Q, E, R, F của Player
  executePlayerSkill: function(key) {
    const p = this.playerPawn;
    if (!p?.isAlive || this.isPaused || this.isGameOver) return false;
    const skillIndex = { 'q': 0, 'e': 1, 'r': 2, 'f': 3 }[key];
    const skill = p.skills[skillIndex];
    if (!skill) return false;
    const targets = this.spatialGrid.queryCircle(p.x, p.y, skill.def.range || skill.def.radius || 110)
      .filter(t => window.GameEntities.CombatSystem.isEnemy(p, t));
    targets.sort((a, b) => Math.hypot(a.x - this.mouse.worldX, a.y - this.mouse.worldY) -
      Math.hypot(b.x - this.mouse.worldX, b.y - this.mouse.worldY));
    return window.GameEntities.CombatSystem.castSkill(p, skill, targets[0]);
  },

  // VÒNG LẶP CHÍNH (Game Loop)
  gameLoop: function(timestamp) {
    const dtRaw = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    const dt = Math.min(0.1, dtRaw) * (this.isPaused ? 0 : this.gameSpeed);

    if (!this.isPaused && !this.isGameOver) {
      this.matchTime += dt;
      this.update(dt);
    }

    window.GameEngine.Camera.update(Math.min(.1,dtRaw),undefined,this.pawns,this.monsters,window.GameEntities.EntityManager.worldBoss);
    this.render();
    this.updateHUD();

    requestAnimationFrame((t) => this.gameLoop(t));
  },

  update: function(dt) {
    if (this.isGameOver || this.isPaused || dt <= 0) return;

    // 1. Tái tạo Spatial Hash Grid
    this.spatialGrid.clear();
    this.pawns.forEach(p => { if (p.isAlive) this.spatialGrid.insert(p); });
    this.monsters.forEach(m => { if (m.isAlive) this.spatialGrid.insert(m); });
    // Preserve the shared array owned by EntityManager.
    for (let i = this.dropItems.length - 1; i >= 0; i--) {
      if (this.dropItems[i].isCollected) this.dropItems.splice(i, 1);
    }
    this.dropItems.forEach(it => this.spatialGrid.insert(it));


    // 3. Cập nhật Player (nếu bật Player Mode)
    if (this.isPlayerMode && this.playerPawn && this.playerPawn.isAlive) {
      this.updatePlayerInput(dt);
    }

    // 4. Cập nhật AI cho các Pawns
    this.pawns.forEach(p => {
      if (!p.isAlive) return;
      p.isSprinting=false;
      window.GameEntities.CombatSystem.updateStatus(p, dt);
      window.GameAI.AIBrain.handleLevelingAndSkills(p);

      // Hồi phục dần Stamina & Mana
      p.currentStamina = Math.min(p.maxStamina, p.currentStamina + 12 * dt);
      p.currentMana = Math.min(p.maxMana, p.currentMana + 8 * dt);

      // Nếu không phải do người chơi điều khiển -> Chạy trí thông minh nhân tạo
      p.emotionTick = (p.emotionTick || 0) + dt;
      if (p.emotionTick >= 0.1) {
        const nearbyPawns = this.spatialGrid.queryCircle(p.x, p.y, 160).filter(e => e.isPawn && e !== p);
        const nearbyMonsters = this.spatialGrid.queryCircle(p.x, p.y, 160).filter(e => e.isMonster);
        window.GameAI.EmotionEngine.updatePawnEmotions(p, p.emotionTick, nearbyPawns, nearbyMonsters);
        p.emotionTick = 0;
      }
      if (!p.isPlayerControlled && !(p.stunTimer > 0)) {
        window.GameAI.AIBrain.updatePawnAI(p, dt, this.spatialGrid, window.GameEngine.MapTerrain);
      }
    });

    // 5. Cập nhật Quái vật AI (Wandering, Aggro, Tấn công)
    this.updateMonsters(dt);

    // 6. Cập nhật Hạt VFX, đường đạn & số sát thương
    window.GameRenderer.VfxManager.update(dt);

    // 7. Cập nhật Camera (Lerp mượt, Auto-Director theo dõi điểm nóng)


    // 8. Cập nhật Inspect Modal nếu đang mở
    if (this.selectedEntity) {
      window.GameUI.InspectModal.updateContent();
    }

    // 9. Kiểm tra Điều Kiện Chiến Thắng (Chỉ còn 1 Pawn sống sót)
    this.checkVictoryCondition();
  },

  updatePlayerInput: function(dt) {
    const p = this.playerPawn;
    if (p.action) return;
    let dx = 0;
    let dy = 0;

    if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
    if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      const speed = window.GameEngine.MapTerrain.getMoveSpeed(p);
      window.GameEngine.MapTerrain.moveEntity(p,dx/len*speed*dt,dy/len*speed*dt);
    }

    // Góc nhìn hướng theo con trỏ chuột
    p.aimAngle = Math.atan2(this.mouse.worldY - p.y, this.mouse.worldX - p.x);

    // Tự động nhặt đồ dưới chân
    for (let i = this.dropItems.length - 1; i >= 0; i--) {
      const item = this.dropItems[i];
      if (Math.hypot(p.x - item.x, p.y - item.y) < 28) {
        if (!window.GameAI.AIBrain.findBestItemToLoot(p, [item])) continue;
        window.GameAI.AIBrain.lootItem(p, item);
        window.GameRenderer.VfxManager.addDamageNumber(p.x, p.y - 15, `NHẬT: ${item.name}`, 'heal');
      }
    }
  },

  updateMonsters: function(dt) {
    const C = window.GameEntities.CombatSystem;
    this.monsters.forEach(m => {
      if (!m.isAlive) return;
      C.updateStatus(m, dt);
      m.currentMana = Math.min(m.maxMana, m.currentMana + 5 * dt);
      m.currentStamina = Math.min(m.maxStamina, m.currentStamina + 8 * dt);
      if (m.action || m.stunTimer > 0) return;
      const M=window.GameEngine.MapTerrain;
      const targets = this.spatialGrid.queryCircle(m.x,m.y,C.visionRange(m)).filter(e=>e.isPawn&&C.canSee(m,e)&&C.canJoin(m,e)&&!M.isInWater(e.x,e.y)&&M.templeAccess(m,e.x,e.y)&&M.monsterCanTarget(m,e));
      targets.sort((a,b)=>Math.hypot(a.x-m.x,a.y-m.y)-Math.hypot(b.x-m.x,b.y-m.y));
      const target=targets[0];m.targetEnemy=target||null;
      if(target){
        const dist=Math.hypot(target.x-m.x,target.y-m.y);m.aimAngle=Math.atan2(target.y-m.y,target.x-m.x);
        if(m.skills.some(s=>C.castSkill(m,s,target)))return;
        const range=C.combatStats(m).range;
        if(dist<=range&&C.canEngage(m,target))C.executeAttack(m,target);
        else M.navigate(m,target.x,target.y,dt);
      }else{
        m.wanderTimer=(m.wanderTimer||0)-dt;
        if(m.wanderTimer<=0){m.wanderTimer=4;m.wanderAngle=Math.random()*Math.PI*2;}
        if(m.packId){const leader=this.monsters.find(e=>e.packId===m.packId&&e.isAlive);
          if(leader&&leader!==m){m.wanderAngle=leader.wanderAngle;const spread=Math.hypot(m.x-leader.x,m.y-leader.y);if(spread>55)m.wanderAngle=Math.atan2(leader.y-m.y,leader.x-m.x);}
        }
        const distance=Math.hypot(m.x-m.homeX,m.y-m.homeY);
        const angle=distance>(m.tier>=4?65:55)?Math.atan2(m.homeY-m.y,m.homeX-m.x):m.wanderAngle;
        M.moveEntity(m,Math.cos(angle)*m.speed*.15*dt,Math.sin(angle)*m.speed*.15*dt);
      }
      m.x = Math.max(0,Math.min(this.width,m.x)); m.y = Math.max(0,Math.min(this.height,m.y));
    });
  },

  checkVictoryCondition: function() {
    const alive = this.pawns.filter(p => p.isAlive);
    if (!this.battleRoyaleResolved && alive.length <= 1) {
      this.battleRoyaleResolved = true; this.winnerPawn = alive[0] || null;
      this.resultOpen = true; this.isPaused = true;
      if (!this.winnerPawn) this.isGameOver = true;
      else {
        const boss=window.GameEntities.EntityManager.worldBoss;
        if (this.winnerPawn.action?.target && !this.winnerPawn.action.target.isAlive) { this.winnerPawn.action=null;this.winnerPawn.attackState=null; }
        this.winnerPawn.targetEnemy=null;
        this.winnerPawn.objective=this.winnerPawn.level<15?'Săn 5 Yêu Vương để đạt cấp 15':'Chuẩn bị đấu Yêu Thần';
        this.winnerPawn.thought='Đóng bảng kết quả để bắt đầu lượt farm cuối; chỉ vào điện thờ khi đạt cấp 15.';
        this.winnerPawn.allyPawn = null; this.winnerPawn.isAllied = false; this.winnerPawn.fear = 0; }
      window.GameUI.DirectorControls.showPostMatchStoryCard(this.winnerPawn);
    } else if (this.battleRoyaleResolved && !alive.length) this.isGameOver = true;
  },

  continueAfterResult: function() {
    if (!this.winnerPawn?.isAlive) return false;
    this.resultOpen = false; this.isPaused = false;
    window.GameEntities.EntityManager.startFinalHunt(this.winnerPawn);
    if (!this.gameSpeed) this.gameSpeed = 1;
    document.getElementById('story-card-modal').classList.add('hidden');
    window.GameEngine.Camera.targetEntity = this.winnerPawn;
    window.GameEngine.Camera.autoDirector = false;
    return true;
  },

  render: function() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Áp dụng Ma Trận Biến Đổi Camera
    window.GameEngine.Camera.applyTransform(ctx);

    // 1. Vẽ Bản Đồ & Địa Hình (Cây cối, đầm lầy, đền cổ, bụi rậm)
    window.GameEngine.MapTerrain.render(ctx, window.GameEngine.Camera);

    this.renderFocusRanges(ctx);

    // 3. Vẽ Trang Bị Rơi Dưới Đất (Paperdoll Drops & Cột Sáng Phẩm Chất)
    const time = performance.now() / 1000;
    this.dropItems.forEach(item => {
      window.GameRenderer.Paperdoll.renderDropItem(ctx, item, time);
    });

    // 4. Vẽ Quái Vật (Vector Thủ Công 50 Loài, Không Khối Vuông Rỗng)
    this.monsters.forEach(m => {
      if (m.isAlive) {
        const isSelected = (this.selectedEntity === m);
        window.GameRenderer.MonsterRenderer.render(ctx, m, isSelected);
      }
    });

    // 5. Vẽ 100 Pawn (RimWorld Đầy Đủ Giới Tính, Tuổi, Tóc, Râu, Biểu Cảm, Động Tác Vũ Khí)
    this.pawns.forEach(p => {
      if (p.isAlive) {
        const isSelected = (this.selectedEntity === p);
        window.GameRenderer.ProceduralPawn.render(ctx, p, p.appearance, isSelected);
      }
    });

    // 6. Vẽ Đạn đạo, Số Sát Thương, Hạt VFX & Cảm Xúc Mote
    window.GameRenderer.VfxManager.render(ctx, time);

    // Khôi phục Ma Trận Camera
    window.GameEngine.Camera.restoreTransform(ctx);
  },

  renderFocusRanges(ctx){
    const camera=window.GameEngine.Camera,e=camera.autoDirector?null:camera.targetEntity;
    if(!e?.isAlive)return;
    const C=window.GameEntities.CombatSystem;
    ctx.save();
    for(const [radius,color,label,dash] of [[C.visionRange(e),'#7edcff','Tầm nhìn',[10,7]],[C.combatStats(e).range,'#ffcb70','Tầm đánh',[]]]){
      ctx.fillStyle=color;ctx.globalAlpha=.055;ctx.beginPath();ctx.arc(e.x,e.y,radius,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=.9;ctx.strokeStyle=color;ctx.lineWidth=2/camera.zoom;ctx.setLineDash(dash.map(v=>v/camera.zoom));ctx.stroke();ctx.setLineDash([]);
      ctx.font='bold '+12/camera.zoom+'px Arial';ctx.textAlign='center';ctx.fillStyle=color;ctx.strokeStyle='#15232c';ctx.lineWidth=3/camera.zoom;
      ctx.strokeText(label+' • '+radius,e.x,e.y-radius-8/camera.zoom);ctx.fillText(label+' • '+radius,e.x,e.y-radius-8/camera.zoom);
    }
    ctx.restore();
  },

  updateHUD: function() {
    const alivePawnsCount = this.pawns.filter(p => p.isAlive).length;
    const aliveMonstersCount = this.monsters.filter(m => m.isAlive).length;

    const elPawns = document.getElementById('hud-pawns-count');
    if (elPawns) elPawns.innerText = `${alivePawnsCount} / 100`;

    const elMonsters = document.getElementById('hud-monsters-count');
    if (elMonsters) elMonsters.innerText = `${aliveMonstersCount}`;

    const elTime = document.getElementById('hud-match-time');
    if (elTime) elTime.innerText = window.GameUI.CombatTicker.getGameTimeString();

    const templeStatus=document.getElementById('hud-temple-status');
    if(templeStatus){
      const remaining=window.GameEngine.MapTerrain.remainingLords();
      templeStatus.innerText=remaining?'Khóa • còn '+remaining+' Yêu Vương':window.GameEntities.EntityManager.worldBoss?.isAlive?'Đã mở cửa':'Đã hạ Yêu Thần';
    }

    // Cập nhật thanh HUD Player nếu ở chế độ người chơi
    const playerHud = document.getElementById('player-hud');
    if (playerHud) {
      if (this.isPlayerMode && this.playerPawn && this.playerPawn.isAlive) {
        playerHud.classList.remove('hidden');
        const p = this.playerPawn;
        document.getElementById('player-hp-bar').style.width = `${(p.currentHp / p.maxHp) * 100}%`;
        document.getElementById('player-stamina-bar').style.width = `${(p.currentStamina / p.maxStamina) * 100}%`;
        document.getElementById('player-mana-bar').style.width = `${(p.currentMana / p.maxMana) * 100}%`;
        document.getElementById('player-level-badge').innerText = 'Lv '+p.level+' • H: bình máu ('+(p.healthPotions||0)+')';
        document.querySelectorAll('.action-slot').forEach((el,i)=>{
          const s=p.skills[i];el.innerHTML='<span class="action-key">'+['Q','E','R','F'][i]+'</span>'+(s?(s.cooldownTimer>0?s.cooldownTimer.toFixed(1)+'s':'✓'):'—');
          el.title=s?s.def.name+' • '+window.GameEntities.CombatSystem.getSkillConfig(p,s).cooldown+'s cooldown':'Chưa mở khóa';
        });
      } else {
        playerHud.classList.add('hidden');
      }
    }
  }
};

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    window.GameManager.init();
  });
} else {
  window.GameManager.init();
}
