/**
 * 100 bot và 71 quái vật; loot từ quái và thưởng hạ bot.
 */
window.GameEntities = window.GameEntities || {};

window.GameEntities.EntityManager = {
  pawns: [],
  monsters: [],
  dropItems: [],
  playerPawn: null,
  worldBoss: null,

  init: function(mapWidth, mapHeight, totalBots = 100) {
    this.pawns = [];
    this.monsters = [];
    this.dropItems = [];
    this.finalHuntStarted=false;this.finalHuntMonsters=[];

    const center = { x: mapWidth / 2, y: mapHeight / 2 };

    // 1. Sinh 100 Bot AI (Khởi đầu cấp 1, tay không, phân bố rải rác ngoài rìa)
    const traitsList = ['brave', 'coward', 'wise', 'greedy', 'cunning'];
    const vietnameseNames = [
      'Gia Bảo', 'Minh Khang', 'Đức Anh', 'Hồng Phúc', 'Bảo Long', 'Thanh Tùng', 'Hữu Thắng',
      'Tuấn Kiệt', 'Thái Sơn', 'Hoàng Nam', 'Quốc Bảo', 'Khắc Tiệp', 'Đình Trọng', 'Quang Hải',
      'Ngọc Mai', 'Thu Thảo', 'Khánh Linh', 'Phương Uyên', 'Bảo Trâm', 'Ánh Tuyết', 'Hải Yến',
      'Thanh Hằng', 'Bích Phương', 'Minh Thư', 'Diễm Quỳnh', 'Hương Giang', 'Cẩm Ly', 'Mỹ Tâm'
    ];

    for (let i = 0; i < totalBots; i++) {
      const edge=i%4,offset=(Math.floor(i/4)+.25+Math.random()*.5)/Math.ceil(totalBots/4);
      const inset=100+Math.random()*170;
      const px=edge===0?inset:edge===1?mapWidth-inset:inset+offset*(mapWidth-2*inset);
      const py=edge===2?inset:edge===3?mapHeight-inset:inset+offset*(mapHeight-2*inset);

      const randomName = vietnameseNames[i % vietnameseNames.length] + ' #' + (i + 1);
      const randomTrait = traitsList[Math.floor(Math.random() * traitsList.length)];
      const secondaryTrait=traitsList.filter(t=>t!==randomTrait)[Math.floor(Math.random()*4)];
      const personality={};
      for(const axis of Object.keys(window.GameData.PersonalityAxes)) personality[axis]=Math.round(Math.max(5,Math.min(95,window.GameData.PersonalityProfiles[randomTrait][axis]*.8+window.GameData.PersonalityProfiles[secondaryTrait][axis]*.2+(Math.random()-.5)*28)));

      const p = {
        id: 'pawn_' + i,
        name: randomName,
        isPawn: true,
        isAlive: true,
        isPlayerControlled: false,
        x: px,
        y: py,
        vx: 0,
        vy: 0,
        aimAngle: 0,
        moveSpeed: 95,
        level: 1,
        currentExp: 0,
        unspentSkillPoints: 1, // Điểm kỹ năng đầu tiên
        maxHp: 160,
        currentHp: 160,
        maxStamina: 100,
        currentStamina: 100,
        maxMana: 100,
        currentMana: 100,
        attack: 16,
        defense: 5,
        critChance: 0.05,
        trait: randomTrait,
        secondaryTrait,personality,decisionInterval:.65+Math.random()*.9,flankSide:Math.random()<.5?-1:1,
        hasLockedClass: false,
        classId: null,
        weapon: null,
        helmet: null,
        armor: null,
        skills: [],
        healthPotions: 0,
        thought: 'Tìm quái yếu để luyện cấp, chưa có vũ khí.',
        objective: 'Khám phá vùng ngoại ô',
        fear: 0,
        confidence: 20,
        despair: 0,
        killCount: 0,
        attackCooldown: 0,
        attackState: { isAttacking: false, progress: 0 },
        appearance: window.GameRenderer.ProceduralPawn.generateAppearance('pawn_' + i)
      };

      const M=window.GameEngine.MapTerrain;
      let pos=M.nearestFree(p.x,p.y);
      if(M.isInWater(pos.x,pos.y))pos=M.nearestFree(pos.x+(edge===1?180:-180),pos.y);
      Object.assign(p,pos);
      this.pawns.push(p);
    }

    // Pawn đầu tiên gán làm Player dự phòng (có thể bật tắt chế độ điều khiển)
    this.playerPawn = this.pawns[0];
    this.playerPawn.name = 'Người Chơi (Player)';
    this.playerPawn.isPlayerControlled = false;

    const M=window.GameEngine.MapTerrain,D=window.GameData.Monsters;
    // Sixteen same-species packs: eight groups of 3 and eight groups of 2 = 40 minions.
    for(let i=0;i<16;i++){
      const def=D.minions[i%D.minions.length],site=M.makeHabitat(def,i),size=i<8?3:2;
      for(let n=0;n<size;n++){
        const angle=n*Math.PI*2/size,m=this.spawnMonster(def,site.x+Math.cos(angle)*22,site.y+Math.sin(angle)*22,site);
        m.packId='pack_'+i;m.packIndex=n;
      }
    }
    for(let i=0;i<20;i++){const def=D.beasts[i%D.beasts.length],site=M.makeHabitat(def,i);this.spawnMonster(def,site.x,site.y,site);}
    // One or two generals guard outside each king's domain, never inside the arena.
    for(let i=0;i<6;i++){
      const def=D.generals[i%D.generals.length],lair=M.lairs[i%4],site=M.makeGuardHabitat(def,i,lair);
      const m=this.spawnMonster(def,site.x,site.y,site);m.guardingLair=lair.name;
    }
    // Authored habitat props provide real cover without obstructing spawn centers.
    for(const h of M.habitats)if(h.kind==='forest')for(let n=0;n<5;n++){
      const angle=n*Math.PI*2/5,x=h.x+Math.cos(angle)*h.radius*.72,y=h.y+Math.sin(angle)*h.radius*.72;
      M.trees.push({x:x/M.scale,y:y/M.scale,radius:20,pine:n%2===0});
      M.bushes.push({x:(h.x+Math.cos(angle+.3)*h.radius*.42)/M.scale,y:(h.y+Math.sin(angle+.3)*h.radius*.42)/M.scale,radius:20,isBurned:false});
    }
    M.buildObstacles();
    M.lairs.forEach((site,i)=>this.spawnMonster(D.lords[i],site.x,site.y,site));
    const def=D.worldBosses[Math.floor(Math.random()*D.worldBosses.length)];
    this.worldBoss=this.spawnMonster(def,center.x,center.y,M.templeRuins);
  },

  spawnMonster: function(def, x, y, territory = null) {
    const pos=window.GameEngine.MapTerrain.nearestFree(x,y);x=pos.x;y=pos.y;
    if(territory&&def.tier>=4)territory.isCleared=false;
    const m = {
      id: 'm_' + Math.random().toString(36).substr(2, 9),
      defId: def.id,
      name: def.name,
      isMonster: true,
      isAlive: true,
      x: x,
      y: y,
      tier: def.tier,
      tierName: def.tierName,
      scale: def.scale || 1.0,
      visual: def.visual || {},
      maxHp: Math.round(def.maxHp * [0, 0.5, 0.5, 0.7, 0.65, 0.45][def.tier]),
      currentHp: Math.round(def.maxHp * [0, 0.5, 0.5, 0.7, 0.65, 0.45][def.tier]),
      attack: Math.round(def.attack * [0, 0.45, 0.4, 0.65, 0.5, 0.35][def.tier]),
      defense: Math.round(def.defense*(def.tier<=2?.55:1)),
      speed: def.speed || 80,
      expReward: def.expReward || 50,
      dropTier: def.dropTier || (def.tier===5?'god':'common'),
      godArtifactId: def.godArtifactId,
      attackCooldown: 0,
      action: null,
      aimAngle: 0,
      homeX: x,
      homeY: y,
      territory,habitat:def.habitat,globalSkillCooldown:0,
      guardingLair:def.tier>=2&&def.tier<=3?window.GameEngine.MapTerrain.lairs.reduce((a,b)=>Math.hypot(x-a.x,y-a.y)<Math.hypot(x-b.x,y-b.y)?a:b).name:null,
      maxMana: 100,
      currentMana: 100,
      maxStamina: 100,
      currentStamina: 100,
      passives: (def.passives || (def.passive ? [def.passive] : [])).map(d=>window.GameEntities.CombatSystem.makePassive(d)),
      skills: (def.skills || []).map((s, i) => window.GameEntities.CombatSystem.makeMonsterSkill(s, def.tier, i)),
      wanderTimer: 0,
      wanderAngle: 0
    };
    this.monsters.push(m);
    return m;
  },

  startFinalHunt: function(winner) {
    if(this.finalHuntStarted)return;
    this.finalHuntStarted=true;
    const G=window.GameManager,M=window.GameEngine.MapTerrain,D=window.GameData.Monsters;
    for(const m of this.monsters)if(m.tier<=4){m.isAlive=false;m.action=null;m.despawned=true;}
    // Remove lingering attacks from the dismissed monsters before the new hunt.
    window.GameRenderer.VfxManager.projectiles=[];
    winner.action=null;winner.attackState=null;winner.targetEnemy=null;winner.combatGroup=null;winner.combatLease=0;winner.roamGoal=null;winner.navTimer=0;winner.navPath=[];
    if(M.bossDomain(winner.x,winner.y)){const a=M.lairs[0];Object.assign(winner,M.nearestFree(a.x,a.y+a.radius+90));}
    const last=M.makeFinalHuntSite();
    const missing=Math.max(0,window.GameData.LevelTable.expRequirements[14]-winner.currentExp);
    const definitions=[...D.lords,window.GameData.FinalLord];
    const sites=[...M.lairs,last];
    this.finalHuntMonsters=definitions.map((def,i)=>{
      const m=this.spawnMonster(def,sites[i].x,sites[i].y,sites[i]);
      m.isFinalHunt=true;m.expReward=Math.max(def.expReward,Math.ceil(missing/5));
      // Five distinct bosses get stronger in sequence; the first is viable for the survivor.
      m.maxHp=m.currentHp=Math.round(winner.maxHp*(.9+i*.35));
      m.attack=Math.round((winner.attack+Math.min(40,winner.weapon?.attack||winner.weapon?.magicPower||0)+i*6)*(.3+i*.015));
      m.defense=8+i*5;m.huntOrder=i;
      if(i===0&&winner.currentHp<winner.maxHp*.5){m.maxHp=m.currentHp=Math.round(m.maxHp*.55);m.attack=Math.max(4,Math.round(m.attack*.6));}
      return m;
    });
    winner.objective=winner.level<15?'Săn 5 Yêu Vương để đạt cấp 15':'Chuẩn bị đấu Yêu Thần';
    window.GameUI.CombatTicker.log('🏯 Thử thách cuối: 5 Yêu Vương xuất hiện. Hạ chúng để luyện tới cấp 15!');
    G.monsters=this.monsters;
  },
  spawnDropItem: function(x, y, equipmentData, slot = 'weapon') {
    const position=window.GameEngine.MapTerrain.nearestFree(x,y);x=position.x;y=position.y;
    const item = {
      id: 'drop_' + Math.random().toString(36).substr(2, 9),
      isDropItem: true,
      x: x,
      y: y,
      slot: slot,
      tier: equipmentData.tier,
      name: equipmentData.name,
      data: equipmentData,
      isCollected: false
    };
    this.dropItems.push(item);
    return item;
  }
};
