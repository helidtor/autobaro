/**
 * 100 bot và 40 quái vật; loot từ quái và thưởng hạ bot.
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
      const angle = Math.random() * Math.PI * 2;
      const dist = 600 + Math.random() * (mapWidth / 2 - 700);
      const px = center.x + Math.cos(angle) * dist;
      const py = center.y + Math.sin(angle) * dist;

      const randomName = vietnameseNames[i % vietnameseNames.length] + ' #' + (i + 1);
      const randomTrait = traitsList[Math.floor(Math.random() * traitsList.length)];

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

      Object.assign(p,window.GameEngine.MapTerrain.nearestFree(p.x,p.y));
      this.pawns.push(p);
    }

    // Pawn đầu tiên gán làm Player dự phòng (có thể bật tắt chế độ điều khiển)
    this.playerPawn = this.pawns[0];
    this.playerPawn.name = 'Người Chơi (Player)';
    this.playerPawn.isPlayerControlled = false;

    // 20 lâu la, 10 yêu thú, 6 yêu tướng, 3 yêu vương, 1 yêu thần.
    const minionDefs = window.GameData.Monsters.minions;
    for (let i = 0; i < 20; i++) {
      const mDef = minionDefs[Math.floor(Math.random() * minionDefs.length)];
      const ang = Math.random() * Math.PI * 2;
      const dst = 400 + Math.random() * (mapWidth / 2 - 500);
      this.spawnMonster(mDef, center.x + Math.cos(ang) * dst, center.y + Math.sin(ang) * dst);
    }

    // Yêu thú ở rừng và đầm lầy.
    const beastDefs = window.GameData.Monsters.beasts;
    for (let i = 0; i < 10; i++) {
      const bDef = beastDefs[Math.floor(Math.random() * beastDefs.length)];
      const ang = Math.random() * Math.PI * 2;
      const dst = 300 + Math.random() * 450;
      this.spawnMonster(bDef, center.x + Math.cos(ang) * dst, center.y + Math.sin(ang) * dst);
    }

    // Yêu tướng tuần tra gần kinh thành.
    const genDefs = window.GameData.Monsters.generals;
    for (let i = 0; i < 6; i++) {
      const gDef = genDefs[Math.floor(Math.random() * genDefs.length)];
      const ang = Math.random() * Math.PI * 2;
      const dst = 240 + Math.random() * 220;
      this.spawnMonster(gDef, center.x + Math.cos(ang) * dst, center.y + Math.sin(ang) * dst);
    }

    // Ba yêu vương giữ các cửa thành.
    const lordDefs = window.GameData.Monsters.lords;
    const cornerOffsets = [
      { x: -180, y: -180 }, // top-left
      { x: 180, y: -180 },  // top-right
      { x: -180, y: 180 },  // bottom-left
      { x: 180, y: 180 }   // bottom-right
    ];
    for (let i = 0; i < 3; i++) {
      const lDef = lordDefs[i % lordDefs.length];
      this.spawnMonster(lDef, center.x + cornerOffsets[i].x, center.y + cornerOffsets[i].y);
    }

    // E. 1 World Boss Yêu Thần (Bậc 5) trấn giữ trung tâm đền cổ!
    const wbDefs = window.GameData.Monsters.worldBosses;
    const chosenWorldBoss = wbDefs[Math.floor(Math.random() * wbDefs.length)];
    this.worldBoss = this.spawnMonster(chosenWorldBoss, center.x, center.y);
  },

  spawnMonster: function(def, x, y) {
    const pos=window.GameEngine.MapTerrain.nearestFree(x,y);x=pos.x;y=pos.y;
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

  spawnDropItem: function(x, y, equipmentData, slot = 'weapon') {
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
