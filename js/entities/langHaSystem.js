/**
 * langHaSystem.js - Hệ thống Nhiệm Vụ Ưu Tiên Làng Hạ & Đám Mây Hư Không
 * Ẩn Sĩ Làng Hạ ban Tiểu Kim Long -> Thử thách 3 viên Long Châu (Hỏa, Lôi, Thổ Long + Kế dụ Đám Mây)
 * Thức tỉnh Kim Thần Long & Đám Mây Hóa Cuồng Mê Hoặc toàn map.
 */
window.GameEntities = window.GameEntities || {};

window.GameEntities.LangHaSystem = {
  hermit: null,
  quest: null,
  miniDragon: null,
  pearls: [],
  seismicPillar: null,
  clock: 0,

  init(mapWidth, mapHeight) {
    this.clock = 0;
    this.seismicPillar = null;

    // Ẩn Sĩ tại trung tâm Làng Hạ (tọa độ thế giới: x: 3400, y: 4420)
    this.hermit = {
      id: 'hermit_ha',
      name: 'Ẩn Sĩ Làng Hạ',
      title: 'Tiên Nhân Quy Ẩn',
      tierName: 'Ẩn Sĩ Nhân Gian (Bất Tử)',
      isSpecial: true,
      isHermit: true,
      isAlive: true,
      invincible: true,
      x: 3400,
      y: 4420,
      radius: 20,
      maxHp: 999999,
      currentHp: 999999,
      attack: 999,
      defense: 999,
      speech: 'Đạo tại tự nhiên, long châu hữu duyên...',
      speechTimer: 0,
      weapon: {
        name: 'Trúc Trượng Thanh Phong',
        tier: 'god',
        attack: 999,
        desc: 'Gậy trúc xanh ngát ngưng tụ linh khí ngàn năm của tiên nhân Làng Hạ.'
      },
      armor: {
        name: 'Hạc Bào Thanh Vân',
        tier: 'god',
        defense: 999,
        desc: 'Đạo bào mỏng như mây, miễn nhiễm mọi sát thương phàm trần.'
      },
      skills: [
        {
          id: 'hermit_dragon_gift',
          def: {
            name: 'Khai Mở Long Châu',
            desc: 'Trao tặng Tiểu Kim Long hộ thể và giải phong ấn 3 viên Long Châu cổ đại khắp giang sơn.'
          }
        }
      ],
      passives: [
        {
          id: 'hermit_zen',
          name: 'Thanh Tâm Ẩn Thế',
          desc: 'Ẩn cư tại Làng Hạ ven sông, bất khả xâm phạm và quán triệt huyền cơ trời đất.'
        }
      ],
      objective: 'Tĩnh tâm truyền dạy cơ duyên cho kẻ hữu duyên',
      thought: 'Thời khắc kiếp nạn hư không đã điểm. Cần tìm anh hùng thu thập ba viên Long Châu!'
    };

    // Khởi tạo Rồng Vàng Mini
    this.miniDragon = {
      id: 'mini_gold_dragon',
      name: 'Tiểu Kim Long',
      title: 'Thần Thú Hộ Thể',
      tierName: 'Linh Thú Thượng Cổ',
      isSpecial: true,
      isMiniDragon: true,
      isAlive: false,
      isAwakened: false,
      active: false,
      owner: null,
      x: 3400,
      y: 4420,
      radius: 24,
      scale: 0.45,
      orbitAngle: 0,
      orbitDist: 52,
      orbitSpeed: 3.2,
      attackCooldown: 0,
      swingTimer: 0,
      repelRadius: 380,
      skills: [
        {
          id: 'dragon_ward',
          def: {
            name: 'Kim Hỏa Thuẫn & Lôi Hấp Thụ',
            desc: 'Vô hiệu hóa sát thương thiêu đốt, hấp thụ sấm sét và tạo từ trường đẩy lùi rồng thần Alioth cùng Mây Hư Không.'
          }
        },
        {
          id: 'dragon_beam',
          def: {
            name: 'Kim Long Thần Quang (Awakened)',
            desc: 'Sau khi thức tỉnh bằng 3 Long Châu, phóng luồng kim quang và lôi điện quét sạch quái vật cùng kẻ địch.'
          }
        }
      ],
      passives: [
        {
          id: 'dragon_shield',
          name: 'Chân Long Hộ Vệ',
          desc: 'Bảo hộ chủ nhân tuyệt đối trước đòn Thôn Phệ (Devour) của Đám Mây Hư Không.'
        }
      ],
      objective: 'Bay lượn hộ mệnh chủ nhân',
      thought: 'Theo sát chủ nhân, xua tan lửa sét và huyền khí hư không!'
    };

    // 3 Viên Long Châu
    this.pearls = [
      {
        id: 'pearl_fire',
        name: 'Hỏa Long Châu',
        element: 'fire',
        color: '#ef4444',
        glowColor: '#fca5a5',
        title: 'Châu Ngọc Hỏa Thần',
        x: 1300,
        y: 1300,
        radius: 16,
        collected: false,
        active: false,
        pulse: 0
      },
      {
        id: 'pearl_lightning',
        name: 'Lôi Long Châu',
        element: 'lightning',
        color: '#0ea5e9',
        glowColor: '#bae6fd',
        title: 'Châu Ngọc Lôi Thần',
        x: 3900,
        y: 1800,
        radius: 16,
        collected: false,
        active: false,
        pulse: 0
      },
      {
        id: 'pearl_earth',
        name: 'Địa Phách Châu',
        element: 'earth',
        color: '#eab308',
        glowColor: '#fef08a',
        title: 'Châu Ngọc Thổ Thần',
        x: 2600,
        y: 3800,
        radius: 16,
        collected: false,
        active: false,
        pulse: 0,
        guardedByVoid: true,
        unlocked: false
      }
    ];

    // Trạng thái Quest
    this.quest = {
      status: 'idle', // 'idle' | 'active' | 'completed'
      owner: null,
      stage: 0, // 0: none, 1: fire, 2: lightning, 3: earth & void lure, 4: awakened
      pearlsCount: 0,
      totalPearls: 3,
      announcedAwaken: false
    };
  },

  reset(mapWidth, mapHeight) {
    this.init(mapWidth, mapHeight);
  },

  /**
   * Điểm ưu tiên để bot ghé Làng Hạ bái kiến Ẩn Sĩ
   */
  questScore(pawn) {
    if (!pawn?.isAlive || this.quest.status !== 'idle') return 0;
    if (window.GameManager?.battleRoyaleResolved) return 0;
    const dist = Math.hypot(pawn.x - this.hermit.x, pawn.y - this.hermit.y);
    if (dist > 1800) return 0;
    // Điểm cao khi ở gần Làng Hạ
    return Math.max(0, 160 - dist / 12);
  },

  /**
   * Bot tiếp cận Ẩn Sĩ nhận nhiệm vụ
   */
  startQuest(pawn) {
    if (!pawn?.isAlive || this.quest.status !== 'idle') return;
    this.quest.status = 'active';
    this.quest.owner = pawn;
    this.quest.stage = 1;
    this.quest.pearlsCount = 0;

    // Kích hoạt viên ngọc đầu tiên (Hỏa Long Châu)
    this.pearls[0].active = true;

    // Triệu hồi Tiểu Kim Long
    const dragon = this.miniDragon;
    dragon.isAlive = true;
    dragon.active = true;
    dragon.owner = pawn;
    dragon.x = pawn.x;
    dragon.y = pawn.y - 40;
    dragon.isAwakened = false;
    dragon.scale = 0.45;

    // Thoại Ẩn Sĩ
    this.hermit.speech = `Hỡi ${pawn.name}, hãy nhận lấy Tiểu Kim Long, thu thập 3 viên Long Châu để chế ngự đại nạn Hư Không!`;
    this.hermit.speechTimer = 5.0;

    window.GameRenderer?.VfxManager?.addEffect?.('rune', this.hermit.x, this.hermit.y, { radius: 100, color: '#f59e0b', life: 1.5 });
    window.GameRenderer?.VfxManager?.addBurstParticles?.(dragon.x, dragon.y, '#fde047', 35);
    window.GameRenderer?.VfxManager?.addBurstParticles?.(dragon.x, dragon.y, '#f59e0b', 30);
    window.GameEngine?.Audio?.play?.('awaken', pawn);
    window.GameUI?.CombatTicker?.log(`🐉 ${pawn.name} bái kiến Ẩn Sĩ Làng Hạ, nhận Tiểu Kim Long và khởi hành tìm 3 Long Châu!`);
  },

  /**
   * Kiểm tra pawn có đang sở hữu Tiểu Kim Long không
   */
  hasMiniDragon(pawn) {
    return this.miniDragon?.active && this.miniDragon?.isAlive && this.miniDragon?.owner === pawn;
  },

  handleVictimDeath(victim, killer) {
    if (this.quest?.owner === victim) {
      if (killer?.isAlive && killer.isPawn && !killer.isDemonKing) {
        this.quest.owner = killer;
        if (this.miniDragon) this.miniDragon.owner = killer;
        window.GameUI?.CombatTicker?.log(`👑 ${killer.name} hạ gục chủ nhân Long Thần, đoạt quyền sở hữu [Tiểu Kim Long]!`);
      } else {
        const G = window.GameManager;
        const alivePawns = (G?.pawns || []).filter(p => p.isAlive && !p.isDemonKing && p !== victim);
        if (alivePawns.length > 0) {
          alivePawns.sort((a, b) => Math.hypot(a.x - victim.x, a.y - victim.y) - Math.hypot(b.x - victim.x, b.y - victim.y));
          this.quest.owner = alivePawns[0];
          if (this.miniDragon) this.miniDragon.owner = alivePawns[0];
          window.GameUI?.CombatTicker?.log(`✨ [Tiểu Kim Long] tìm thấy chủ nhân kế thừa: ${alivePawns[0].name}!`);
        }
      }
    }
  },

  /**
   * Cập nhật logic hệ thống Làng Hạ
   */
  update(dt) {
    this.clock += dt;
    if (this.hermit.speechTimer > 0) this.hermit.speechTimer -= dt;

    // Cập nhật Cột Địa Chấn nếu có
    if (this.seismicPillar) {
      this.seismicPillar.life -= dt;
      this.seismicPillar.pulseTimer = (this.seismicPillar.pulseTimer || 0) + dt;
      if (this.seismicPillar.pulseTimer >= 1.2) {
        this.seismicPillar.pulseTimer = 0;
        window.GameRenderer?.VfxManager?.addEffect?.('impact', this.seismicPillar.x, this.seismicPillar.y, {
          radius: 120,
          color: '#d97706',
          life: 0.8
        });
      }
      if (this.seismicPillar.life <= 0) {
        window.GameRenderer?.VfxManager?.addBurstParticles?.(this.seismicPillar.x, this.seismicPillar.y, '#78350f', 30);
        this.seismicPillar = null;
      }
    }

    // Cập nhật ngọc
    for (const pearl of this.pearls) {
      if (pearl.active && !pearl.collected) {
        pearl.pulse = (pearl.pulse || 0) + dt * 4;
      }
    }

    // Cập nhật Rồng Vàng Mini
    this.updateMiniDragon(dt);

    // Kiểm tra tương tác nhặt ngọc & dụ mây
    if (this.quest.status === 'active' && this.quest.owner?.isAlive) {
      this.checkQuestInteractions(dt);
    }
  },

  /**
   * Cập nhật vị trí & hành vi của Tiểu Kim Long
   */
  updateMiniDragon(dt) {
    const d = this.miniDragon;
    if (!d || !d.active || !d.isAlive) return;

    const owner = d.owner;
    // Chuyển chủ nếu chủ nhân chết
    if (!owner?.isAlive) {
      const G = window.GameManager;
      const alivePawns = (G?.pawns || []).filter(p => p.isAlive && !p.isDemonKing);
      if (alivePawns.length > 0) {
        alivePawns.sort((a, b) => Math.hypot(a.x - d.x, a.y - d.y) - Math.hypot(b.x - d.x, b.y - d.y));
        d.owner = alivePawns[0];
        this.quest.owner = alivePawns[0];
        window.GameUI?.CombatTicker?.log(`✨ Tiểu Kim Long nhận chủ nhân mới: ${d.owner.name}!`);
      } else {
        d.isAlive = false;
        d.active = false;
        return;
      }
    }

    // 1. Quỹ đạo bay quanh chủ nhân
    d.orbitAngle = (d.orbitAngle + d.orbitSpeed * dt) % (Math.PI * 2);
    const targetX = owner.x + Math.cos(d.orbitAngle) * d.orbitDist;
    const targetY = owner.y + Math.sin(d.orbitAngle) * d.orbitDist - 25;
    d.x += (targetX - d.x) * Math.min(1, 10 * dt);
    d.y += (targetY - d.y) * Math.min(1, 10 * dt);

    d.attackCooldown = Math.max(0, (d.attackCooldown || 0) - dt);
    d.swingTimer = Math.max(0, (d.swingTimer || 0) - dt);

    // 2. Nếu đã thức tỉnh -> Tự động phụ tấn công quái/bot mà chủ nhân đang đánh
    if (d.isAwakened) {
      const target = owner.targetEnemy || owner.action?.target || owner.plan?.target;
      if (target?.isAlive && Math.hypot(target.x - d.x, target.y - d.y) <= 320) {
        if (d.attackCooldown <= 0) {
          d.attackCooldown = 0.85;
          d.swingTimer = 0.4;
          this.executeAwakenedAttack(target);
        }
      }
    }

    // 3. Đẩy lùi rồng Alioth và dội ngược Đám Mây Hư Không
    this.repelEnemiesAroundOwner();
  },

  /**
   * Đòn tấn công của Kim Thần Long sau khi thức tỉnh
   */
  executeAwakenedAttack(target) {
    const d = this.miniDragon;
    const V = window.GameRenderer?.VfxManager;
    const dmg = Math.round(75 + Math.random() * 35);

    target.currentHp = Math.max(0, target.currentHp - dmg);
    V?.addEffect?.('impact', target.x, target.y, { radius: 55, color: '#fde047', life: 0.4 });
    V?.addBurstParticles?.(target.x, target.y, '#f59e0b', 16);
    V?.addDamageNumber?.(target.x, target.y - 28, 'KIM LONG: -' + dmg, 'crit');
    window.GameEngine?.Audio?.play?.('impact', target, 'lightning');

    if (target.currentHp <= 0 && target.isAlive) {
      window.GameEntities.CombatSystem?.handleDeath?.(d.owner, target);
    }
  },

  /**
   * Đẩy lùi rồng Alioth và Đám Mây Hư Không quanh chủ nhân
   */
  repelEnemiesAroundOwner() {
    const owner = this.miniDragon?.owner;
    if (!owner?.isAlive) return;

    // Đẩy lùi 3 con rồng Alioth
    const A = window.GameEntities.AliothSystem;
    for (const dragon of (A?.dragons || [])) {
      if (!dragon.isAlive || dragon.captured) continue;
      const head = dragon.spine?.[0];
      if (!head) continue;
      const dist = Math.hypot(head.x - owner.x, head.y - owner.y);
      if (dist < 380) {
        // Lực từ trường hoàng kim đẩy lùi đầu rồng
        const pushAngle = Math.atan2(head.y - owner.y, head.x - owner.x);
        head.x += Math.cos(pushAngle) * 12;
        head.y += Math.sin(pushAngle) * 12;
        window.GameRenderer?.VfxManager?.addBurstParticles?.(head.x, head.y, '#fde047', 4);
      }
    }

    // Đẩy lùi Đám Mây Hư Không
    const C = window.GameEntities.CloudSystem;
    const cloud = C?.cloud;
    if (cloud?.isAlive) {
      const dCloud = Math.hypot(cloud.x - owner.x, cloud.y - owner.y);
      if (dCloud < 420) {
        const pushAway = Math.atan2(cloud.y - owner.y, cloud.x - owner.x);
        cloud.x += Math.cos(pushAway) * 16;
        cloud.y += Math.sin(pushAway) * 16;
        window.GameRenderer?.VfxManager?.addEffect?.('glow', owner.x, owner.y, { radius: 140, color: '#fef08a', life: 0.3 });
      }
    }
  },

  /**
   * Kiểm tra nhặt ngọc & kích hoạt dụ Đám Mây
   */
  checkQuestInteractions(dt) {
    const owner = this.quest.owner;
    if (!owner?.isAlive) return;

    // 1. Kiểm tra nhặt Viên 1 (Hỏa Long Châu)
    const pFire = this.pearls[0];
    if (pFire.active && !pFire.collected) {
      if (Math.hypot(owner.x - pFire.x, owner.y - pFire.y) <= 50) {
        pFire.collected = true;
        this.quest.pearlsCount = 1;
        this.quest.stage = 2;
        this.pearls[1].active = true; // Kích hoạt Viên 2 (Lôi Long Châu)
        window.GameRenderer?.VfxManager?.addEffect?.('impact', pFire.x, pFire.y, { radius: 90, color: '#ef4444', life: 1.0 });
        window.GameRenderer?.VfxManager?.addBurstParticles?.(pFire.x, pFire.y, '#fca5a5', 30);
        window.GameUI?.CombatTicker?.log(`🔥 ${owner.name} đã đoạt được [Hỏa Long Châu]! (1/3)`);
      }
    }

    // 2. Kiểm tra nhặt Viên 2 (Lôi Long Châu)
    const pLight = this.pearls[1];
    if (pLight.active && !pLight.collected) {
      if (Math.hypot(owner.x - pLight.x, owner.y - pLight.y) <= 50) {
        pLight.collected = true;
        this.quest.pearlsCount = 2;
        this.quest.stage = 3;
        this.pearls[2].active = true; // Kích hoạt Viên 3 (Địa Phách Châu)
        window.GameRenderer?.VfxManager?.addEffect?.('impact', pLight.x, pLight.y, { radius: 90, color: '#0ea5e9', life: 1.0 });
        window.GameRenderer?.VfxManager?.addBurstParticles?.(pLight.x, pLight.y, '#38bdf8', 30);
        window.GameUI?.CombatTicker?.log(`⚡ ${owner.name} đã đoạt được [Lôi Long Châu]! (2/3)`);
      }
    }

    // 3. Cơ chế Viên 3: Dụ Đám Mây bằng Thổ Long
    const pEarth = this.pearls[2];
    if (pEarth.active && !pEarth.collected) {
      // Nếu chưa dụ mây: kiểm tra bot đến gần Thổ Long để cộng hưởng địa chấn
      if (!pEarth.unlocked) {
        const A = window.GameEntities.AliothSystem;
        const earthDragon = (A?.dragons || []).find(d => d.element === 'earth' && d.isAlive);
        const head = earthDragon?.spine?.[0];
        if (head && Math.hypot(owner.x - head.x, owner.y - head.y) <= 280) {
          this.triggerEarthDragonSeismicLure(head);
          pEarth.unlocked = true;
        }
      } else {
        // Đã mở đường -> nhặt Địa Phách Châu
        if (Math.hypot(owner.x - pEarth.x, owner.y - pEarth.y) <= 50) {
          pEarth.collected = true;
          this.quest.pearlsCount = 3;
          this.quest.stage = 4;
          window.GameRenderer?.VfxManager?.addEffect?.('impact', pEarth.x, pEarth.y, { radius: 110, color: '#eab308', life: 1.2 });
          window.GameRenderer?.VfxManager?.addBurstParticles?.(pEarth.x, pEarth.y, '#fde047', 40);
          window.GameUI?.CombatTicker?.log(`🌍 ${owner.name} đoạt được [Địa Phách Châu]! Đã gom đủ 3 Long Châu! (3/3)`);
          this.awakenSystem();
        }
      }
    }
  },

  /**
   * Thổ Long triệu hồi Đại Thạch Trụ dụ Đám Mây Hư Không rời ổ
   */
  triggerEarthDragonSeismicLure(earthHead) {
    const pillarX = 1800, pillarY = 3600;
    this.seismicPillar = {
      id: 'seismic_pillar',
      name: 'Đại Thạch Trụ (Cột Địa Chấn)',
      title: 'Địa Mạch Linh Trụ',
      isSpecial: true,
      isAlive: true,
      x: pillarX,
      y: pillarY,
      radius: 45,
      life: 25.0,
      maxLife: 25.0,
      pulseTimer: 0
    };

    const V = window.GameRenderer?.VfxManager;
    V?.addEffect?.('shockwave', earthHead.x, earthHead.y, { radius: 240, color: '#d97706', life: 1.2 });
    V?.addEffect?.('rune', pillarX, pillarY, { radius: 150, color: '#f59e0b', life: 2.0 });
    V?.addBurstParticles?.(pillarX, pillarY, '#78350f', 50);

    window.GameEngine?.Audio?.play?.('roar', null, 'beast');
    window.GameUI?.CombatTicker?.log('🌋 Thổ Long gầm vang! Đại Thạch Trụ mọc lên chấn động địa mạch, dụ Đám Mây Hư Không rời khỏi Địa Phách Châu!');

    // Dụ Đám Mây Hư Không hướng về cột đá
    const C = window.GameEntities.CloudSystem;
    if (C?.cloud) {
      C.cloud.targetX = pillarX;
      C.cloud.targetY = pillarY;
      C.cloud.luredTarget = this.seismicPillar;
    }
  },

  /**
   * Thu thập đủ 3 viên ngọc: Thức tỉnh Rồng Vàng & Đám Mây Hóa Cuồng Mê Hoặc
   */
  awakenSystem() {
    this.quest.status = 'completed';
    const owner = this.quest.owner;
    const dragon = this.miniDragon;

    // 1. Thức tỉnh Rồng Vàng
    dragon.isAwakened = true;
    dragon.scale = 0.75;
    dragon.orbitDist = 65;
    dragon.name = 'Kim Thần Long';
    dragon.title = 'Thần Thú Thức Tỉnh (Awakened)';

    window.GameRenderer?.VfxManager?.addEffect?.('shockwave', dragon.x, dragon.y, { radius: 260, color: '#fde047', life: 1.5 });
    window.GameRenderer?.VfxManager?.addBurstParticles?.(dragon.x, dragon.y, '#f59e0b', 50);
    window.GameEngine?.Audio?.play?.('awaken', owner);
    window.GameUI?.CombatTicker?.log(`🌟 KIM THẦN LONG ĐÃ THỨC TỈNH! Trợ chiến sát cánh cùng ${owner.name}!`);

    // 2. Chuyển mode Đám Mây Hư Không sang Hóa Cuồng Mê Hoặc
    const C = window.GameEntities.CloudSystem;
    if (C?.cloud) {
      C.cloud.mode = 'void_rage_charm';
      C.cloud.speed = 46;
      C.cloud.charmAuraTimer = 0;
      C.cloud.name = 'Đám Mây Hư Không Cuồng Nộ';
      C.cloud.title = 'Thực Thể Hư Không • Ma Thuật Mê Hoặc';
      C.cloud.thought = 'Kẻ phàm trần dám đoạt ngọc! Vạn vật mau quy phục tiêu diệt hắn!';
      C.cloud.objective = 'Mê hoặc quái vật và các bot dồn sát thương về phía Kim Thần Long!';

      window.GameRenderer?.VfxManager?.addEffect?.('shockwave', C.cloud.x, C.cloud.y, { radius: 320, color: '#7e22ce', life: 1.8 });
      window.GameUI?.CombatTicker?.log('🌪️ Đám Mây Hư Không phát hiện bị lừa mất ngọc! Hóa cuồng gieo rắc MÊ HOẶC lên toàn bộ sinh linh trên map!');
    }
  },

  /**
   * Vẽ hệ thống Làng Hạ
   */
  render(ctx) {
    const zoom = window.GameEngine.Camera?.zoom || 1;

    // 1. Vẽ Ẩn Sĩ Làng Hạ
    this.drawHermit(ctx, zoom);

    // 2. Vẽ các viên Long Châu đang xuất hiện
    this.drawPearls(ctx, zoom);

    // 3. Vẽ Cột Địa Chấn nếu có
    if (this.seismicPillar) {
      this.drawSeismicPillar(ctx, zoom);
    }

    // 4. Vẽ Tiểu Kim Long (hoặc Kim Thần Long)
    if (this.miniDragon?.active && this.miniDragon?.isAlive) {
      this.drawMiniDragon(ctx, zoom);
    }
  },

  drawHermit(ctx, zoom) {
    const h = this.hermit;
    if (!h) return;
    const isSelected = window.GameManager?.selectedEntity === h;

    if (zoom < 0.45 && !isSelected) {
      ctx.save();
      ctx.fillStyle = '#0d9488';
      ctx.beginPath();
      ctx.arc(h.x, h.y - 8, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#2dd4bf';
      ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(h.x, h.y);

    // Vòng chọn khi click
    if (isSelected) {
      ctx.strokeStyle = '#2dd4bf';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 10, 26, 12, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Bóng
    ctx.fillStyle = 'rgba(20, 25, 20, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hào quang thanh nhã
    const pulse = Math.sin(this.clock * 2.5) * 0.15 + 0.85;
    ctx.fillStyle = `rgba(45, 212, 191, ${0.12 * pulse})`;
    ctx.beginPath();
    ctx.arc(0, -10, 32, 0, Math.PI * 2);
    ctx.fill();

    // Áo đạo bào xanh hạc
    ctx.fillStyle = '#134e4a';
    ctx.beginPath();
    ctx.ellipse(0, -6, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Y phục ngoài
    ctx.fillStyle = '#14b8a6';
    ctx.beginPath();
    ctx.ellipse(0, -8, 10, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Đầu & Chòm râu bạc tiên nhân
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(0, -26, 8, 0, Math.PI * 2);
    ctx.fill();

    // Râu bạc dài
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(-4, -22);
    ctx.lineTo(4, -22);
    ctx.lineTo(0, -10);
    ctx.closePath();
    ctx.fill();

    // Trúc trượng tay phải
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(14, 6);
    ctx.lineTo(16, -34);
    ctx.stroke();

    // Ngọc bội phát sáng trên đỉnh trượng
    ctx.fillStyle = '#6ee7b7';
    ctx.beginPath();
    ctx.arc(16, -35, 4, 0, Math.PI * 2);
    ctx.fill();

    // Bảng tên
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillText('Ẩn Sĩ Làng Hạ', 1, -44);
    ctx.fillStyle = '#5eead4';
    ctx.fillText('Ẩn Sĩ Làng Hạ', 0, -45);

    // Bong bóng thoại nếu có
    if (this.hermit.speechTimer > 0) {
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.roundRect?.(-130, -78, 260, 24, 6);
      ctx.fill();
      ctx.strokeStyle = '#2dd4bf';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#fef08a';
      ctx.fillText(this.hermit.speech, 0, -62);
    }

    ctx.restore();
  },

  drawPearls(ctx, zoom) {
    for (const p of this.pearls) {
      if (!p.active || p.collected) continue;
      const isSelected = window.GameManager?.selectedEntity === p;

      if (zoom < 0.45 && !isSelected) {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);

      // Hào quang tỏa sáng
      const pulse = Math.sin(p.pulse || 0) * 0.25 + 0.75;
      const glowGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 28 * pulse);
      glowGrad.addColorStop(0, p.glowColor);
      glowGrad.addColorStop(0.5, p.color);
      glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 28 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Thân ngọc rực rỡ
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Đốm sáng phản chiếu
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-3, -3, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Bảng tên
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = p.color;
      ctx.fillText(p.name, 0, -18);

      ctx.restore();
    }
  },

  drawSeismicPillar(ctx, zoom) {
    const sp = this.seismicPillar;
    if (!sp) return;

    ctx.save();
    ctx.translate(sp.x, sp.y);

    // Vòng sóng địa chấn phát ra
    const waveProgress = ((sp.pulseTimer || 0) / 1.2) % 1;
    ctx.strokeStyle = `rgba(217, 119, 6, ${1 - waveProgress})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 60 * waveProgress + 20, 30 * waveProgress + 10, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Thân trụ đá khổng lồ
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-22, 10);
    ctx.lineTo(-14, -60);
    ctx.lineTo(14, -60);
    ctx.lineTo(22, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Rãnh nứt phát quang dung nham
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -50);
    ctx.lineTo(-6, -30);
    ctx.lineTo(4, -10);
    ctx.stroke();

    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde047';
    ctx.fillText('ĐẠI THẠCH TRỤ', 0, -68);

    ctx.restore();
  },

  drawMiniDragon(ctx, zoom) {
    const d = this.miniDragon;
    if (!d || !d.active || !d.isAlive) return;
    const isSelected = window.GameManager?.selectedEntity === d;

    if (zoom < 0.45 && !isSelected) {
      ctx.save();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.isAwakened ? 10 : 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fde047';
      ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(d.x, d.y);
    const scale = d.scale || 0.45;
    ctx.scale(scale, scale);

    // Hào quang hoàng kim
    const pulse = Math.sin(this.clock * 4) * 0.2 + 0.8;
    ctx.fillStyle = `rgba(254, 240, 138, ${d.isAwakened ? 0.35 * pulse : 0.2 * pulse})`;
    ctx.beginPath();
    ctx.arc(0, 0, d.isAwakened ? 75 : 45, 0, Math.PI * 2);
    ctx.fill();

    // Thân rồng uốn lượn phong cách cartoon
    const wave = Math.sin(this.clock * 6) * 8;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.quadraticCurveTo(0, wave * 1.5, -24, -wave);
    ctx.quadraticCurveTo(-40, wave, -55, 0);
    ctx.stroke();

    // Bụng rồng
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(18, 2);
    ctx.quadraticCurveTo(0, wave * 1.5 + 2, -22, -wave + 2);
    ctx.stroke();

    // Đầu rồng
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(26, 0, 15, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mắt rồng
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(28, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(29, -4, 2, 0, Math.PI * 2);
    ctx.fill();

    // Sừng rồng
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(22, -8);
    ctx.lineTo(16, -18);
    ctx.moveTo(28, -8);
    ctx.lineTo(24, -20);
    ctx.stroke();

    // Bờm lửa vàng
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(12, -4, 7, 0, Math.PI * 2);
    ctx.arc(6, -2, 6, 0, Math.PI * 2);
    ctx.fill();

    // Hiệu ứng tia Kim Long Thần Quang khi tấn công
    if (d.swingTimer > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.9)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(35, 0);
      ctx.lineTo(85, 0);
      ctx.stroke();
      ctx.restore();
    }

    // Bảng tên
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde047';
    ctx.fillText(d.name, 0, -28);

    ctx.restore();
  }
};
