/**
 * truclamSystem.js - Thiền Viện Trúc Lâm & Đoàn Quân Thiết Kỵ Chi Viện
 *
 * Tính năng:
 * 1. Nằm trong vùng Rừng Trúc / Làng Trúc.
 * 2. Ưu tiên trong AI não bộ bot (mục phần thưởng giống Hoa Quả Sơn).
 * 3. Khi vào viện: Bot phải chiến đấu đánh bại 3 vị Quan Tướng hộ viện.
 * 4. Phần thưởng khi thắng:
 *    - Nhận phần thưởng thăng cấp (EXP lớn, hồi đầy máu).
 *    - Phái đoàn quân có 1 Tướng Cưỡi Ngựa (Thiết Kỵ Tướng Quân) + 2 Hộ Vệ đi theo đánh quái trong 8 phút (480s).
 */
window.GameEntities = window.GameEntities || {};

window.GameEntities.TrucLamSystem = {
  temple: null,
  guardians: [],
  legion: null,
  emperor: null,
  decreeEvent: null,
  gate: { x: 1020, y: 1670 },
  clock: 0,
  cooldown: 0,
  mapW: 5200,
  mapH: 5200,

  init(mapWidth, mapHeight) {
    this.clock = 0;
    this.cooldown = 0;
    this.mapW = mapWidth || 5200;
    this.mapH = mapHeight || 5200;
    this.legion = null;
    this.decreeEvent = null;
    this.survivorEscortActive = false;
    this.survivor = null;

    // Vị trí Thiền Viện Trúc Lâm có sẵn trên map (design: 510, 730 -> world x2: 1020, 1460)
    this.temple = {
      x: 1020,
      y: 1460,
      radius: 240,
      name: 'THIỀN VIỆN TRÚC LÂM'
    };

    // Hoàng Thượng ngự tại Chánh Điện Trúc Lâm (phía Bắc sân viện: world 1020, 1140)
    this.emperor = {
      id: 'tl_emperor',
      x: 1020,
      y: 1140,
      radius: 40,
      name: 'Trúc Lâm Thánh Hoàng',
      title: 'Hoàng Thượng • Thiên Tử',
      tierName: 'Ngọc Hoàng Thánh Đế',
      isSpecial: true,
      isEmperor: true,
      isAlive: true,
      maxHp: 99999,
      currentHp: 99999,
      attack: 180,
      defense: 120,
      speed: 0,
      aimAngle: Math.PI / 2, // Hướng nhìn xuống sân viện
      speech: '',
      speechTimer: 0,
      aura: 0,
      level: 99,
      weapon: {
        name: 'Hoàng Chiếu Thư Vàng',
        tier: 'god',
        attack: 180,
        desc: 'Thánh chỉ thêu rồng vàng của Hoàng Thượng, ban lệnh mở Cổng Nam điều Thiết Kỵ xuất quân phò tá 8 phút.'
      },
      armor: {
        name: 'Long Bào Thánh Hoàng',
        tier: 'god',
        defense: 120,
        hp: 99999,
        desc: 'Hoàng bào thêu rồng ngọc vàng lộng lẫy, tỏa ánh hào quang chân long thiên tử bất khả xâm phạm.'
      },
      helmet: {
        name: 'Mũ Bình Thiên Ngọc Đế',
        tier: 'god',
        defense: 60,
        desc: 'Mũ miện chuỗi ngọc rủ uy nghiêm của đấng chí tôn thiên hạ.'
      },
      boots: {
        name: 'Long Vân Hài',
        tier: 'god',
        desc: 'Hài thêu mây vàng ngự tọa long đình chánh điện.'
      },
      skills: [
        { id: 'emp_decree', def: { name: 'Kim Khẩu Lệnh (Ban Chiếu Xuất Quân)', desc: 'Khâm khen dũng sĩ vượt qua thử thách, hạ lệnh mở Cổng Nam điều Thiết Kỵ xuất quan phò tá 8 phút.' } },
        { id: 'emp_dragon_aura', def: { name: 'Chân Long Hộ Thể (Imperial Dragon Aura)', desc: 'Hào quang rồng vàng bao bọc thiền viện, trừ tà khí và khích lệ dũng khí ba quân.' } }
      ],
      passives: [
        { id: 'emp_divine_grace', name: 'Thiên Mệnh Chí Tôn', desc: 'Đấng chí tôn ngự tọa chánh điện thiền viện, ban thưởng và bảo hộ dũng sĩ hữu duyên.' }
      ],
      objective: 'Ngự giá Chánh Điện Trúc Lâm, khảo nghiệm anh hùng',
      thought: 'Kẻ nào khuất phục được ba vị quan tướng, Trẫm ắt ban chiếu điều Thiết Kỵ chi viện!'
    };

    this.gate = { x: 1020, y: 1670 };

    this.spawnGuardians();
    window.GameUI?.CombatTicker?.log('🎋 Chuông chùa Thiền Viện Trúc Lâm ngân vang. Hoàng Thượng ngự giá cùng 3 vị quan tướng trấn viện đợi người hữu duyên.');
  },

  reset(mapWidth, mapHeight) {
    this.init(mapWidth, mapHeight);
  },

  spawnGuardians() {
    const t = this.temple;
    if (!t) return;
    this.guardians = [
      {
        id: 'tl_gen_chan',
        name: 'Trấn Viện Tướng Quân',
        title: 'Chưởng Viện • Chiến Tướng Trúc Lâm',
        tierName: 'Quan Tướng Trấn Viện',
        isSpecial: true,
        x: t.x,
        y: t.y - 100,
        homeX: t.x,
        homeY: t.y - 100,
        vx: 0,
        vy: 0,
        radius: 35,
        aimAngle: Math.PI / 2,
        speed: 115,
        maxHp: 180,
        currentHp: 180,
        attack: 9,
        defense: 2,
        attackCooldown: 0,
        swingTimer: 0,
        isAlive: true,
        isGuardian: true,
        isMonster: true, // để bot nhận diện đánh nhau
        weapon: 'blade',
        weaponObj: {
          name: 'Đại Đao Trấn Viện',
          tier: 'supreme',
          attack: 28,
          desc: 'Đại đao trảm phong uy dũng, đường đao dũng mãnh trấn giữ chánh điện.'
        },
        armor: {
          name: 'Hổ Phù Chiến Giáp',
          tier: 'supreme',
          defense: 10,
          desc: 'Chiến giáp dát đồng viền vàng của tướng quân chưởng viện.'
        },
        skills: [
          { id: 'g_blade_sweep', def: { name: 'Trấn Viện Trảm', desc: 'Vung đại đao quét ngang hất lùi đối thủ và gây sát thương lớn.' } }
        ],
        passives: [
          { id: 'g_iron_will', name: 'Trấn Viện Bất Động', desc: 'Vững như bàn thạch khi giao tranh trong khuôn viên thiền viện.' }
        ],
        objective: 'Trấn thủ Chánh Điện, nghênh chiến khảo nghiệm dũng sĩ',
        thought: 'Rèn giũa dũng khí kẻ phàm trần trước ngự giá Hoàng Thượng!',
        color: '#b91c1c',
        armorCol: '#f59e0b'
      },
      {
        id: 'tl_gen_tien',
        name: 'Tiền Phong Tướng Quân',
        title: 'Tiền Phong • Thần Thương Trúc Lâm',
        tierName: 'Quan Tướng Trấn Viện',
        isSpecial: true,
        x: t.x - 80,
        y: t.y,
        homeX: t.x - 80,
        homeY: t.y,
        vx: 0,
        vy: 0,
        radius: 35,
        aimAngle: 0,
        speed: 135,
        maxHp: 140,
        currentHp: 140,
        attack: 8,
        defense: 1,
        attackCooldown: 0,
        swingTimer: 0,
        isAlive: true,
        isGuardian: true,
        isMonster: true,
        weapon: 'spear',
        weaponObj: {
          name: 'Trường Thương Tiền Phong',
          tier: 'supreme',
          attack: 24,
          desc: 'Mũi thương sắc bén đâm xuyên phòng tuyến đối phương.'
        },
        armor: {
          name: 'Thanh Vân Khôi Giáp',
          tier: 'supreme',
          defense: 8,
          desc: 'Giáp nhẹ linh hoạt màu lam ngọc giúp di chuyển xuất quỷ nhập thần.'
        },
        skills: [
          { id: 'g_spear_thrust', def: { name: 'Tiền Phong Đột Kích', desc: 'Đâm thương chớp nhoáng với cự ly xa ép đối thủ lùi bước.' } }
        ],
        passives: [
          { id: 'g_swift_stride', name: 'Bộ Pháp Tiền Phong', desc: 'Tốc độ áp sát và xoay sở linh hoạt trên sân viện.' }
        ],
        objective: 'Tiền phong xung trận, khảo nghiệm tốc độ kẻ khiêu chiến',
        thought: 'Thương pháp nhanh như chớp giật, liệu ngươi có né được không?',
        color: '#0284c7',
        armorCol: '#e2e8f0'
      },
      {
        id: 'tl_gen_ho',
        name: 'Hộ Pháp Tướng Quân',
        title: 'Hộ Pháp • Kim Cương Trúc Lâm',
        tierName: 'Quan Tướng Trấn Viện',
        isSpecial: true,
        x: t.x + 80,
        y: t.y,
        homeX: t.x + 80,
        homeY: t.y,
        vx: 0,
        vy: 0,
        radius: 35,
        aimAngle: Math.PI,
        speed: 105,
        maxHp: 160,
        currentHp: 160,
        attack: 8,
        defense: 2,
        attackCooldown: 0,
        swingTimer: 0,
        isAlive: true,
        isGuardian: true,
        isMonster: true,
        weapon: 'hammer',
        weaponObj: {
          name: 'Thiết Chùy Hộ Pháp',
          tier: 'supreme',
          attack: 26,
          desc: 'Chùy sắt ngàn cân nghiền nát giáp trụ địch thủ.'
        },
        armor: {
          name: 'Kim Cang Bào Giáp',
          tier: 'supreme',
          defense: 9,
          desc: 'Chiến bào hộ pháp màu lục ngọc kiên cố.'
        },
        skills: [
          { id: 'g_hammer_slam', def: { name: 'Hộ Pháp Nện Đất', desc: 'Bổ mạnh thiết chùy làm rung chuyển mặt đất và gây choáng.' } }
        ],
        passives: [
          { id: 'g_guardian_shield', name: 'Kim Cang Hộ Thể', desc: 'Giảm sát thương nhận vào từ các đòn đánh trực diện.' }
        ],
        objective: 'Bảo hộ thiền viện, thử thách sức chịu đựng dũng sĩ',
        thought: 'Thiết chùy nặng ngàn cân, chỉ kẻ kiên cường mới đứng vững!',
        color: '#15803d',
        armorCol: '#78716c'
      }
    ];
  },

  // Điểm ưu tiên cao cho Bot AI (mục phần thưởng như Hoa Quả Sơn)
  challengeScore(pawn) {
    const t = this.temple;
    if (!t || !pawn?.isAlive || this.cooldown > 0) return 0;
    if (this.decreeEvent?.active) return 0; // Đang trong lễ Hoàng Thượng ban chiếu điều quân
    if (window.GameManager?.battleRoyaleResolved) return 0;
    if (this.survivorEscortActive) return 0;
    const alivePawns = (window.GameManager?.pawns || []).filter(p => p.isAlive && !p.isDemonKing);
    if (alivePawns.length <= 1) return 0;
    if (pawn.currentHp < pawn.maxHp * 0.4) return 0;
    // Nếu đoàn quân đang phục vụ chính bot này thì không cần đi nữa
    if (this.legion?.active && this.legion?.owner === pawn) return 0;
    // Nếu các quan tướng đã bị hạ và viện đang chờ hồi phục
    const aliveGuardians = this.guardians.filter(g => g.isAlive && !g.isEscort);
    if (!aliveGuardians.length && (this.legion?.active || this.decreeEvent?.active)) return 0;

    const dist = Math.hypot(pawn.x - t.x, pawn.y - t.y);
    if (dist > 2800) return 0;
    const M = window.GameEngine.MapTerrain;
    if (M && !M.canTravel(pawn, t.x, t.y)) return 0;
    return 330 - dist / 35;
  },

  seekTrucLam(pawn, dt) {
    const t = this.temple;
    if (!t) return;
    if (this.survivorEscortActive || window.GameManager?.battleRoyaleResolved || (window.GameManager?.pawns || []).filter(p => p.isAlive && !p.isDemonKing).length <= 1) {
      pawn.plan = null;
      pawn.evaluateAt = 0;
      return;
    }
    const dist = Math.hypot(pawn.x - t.x, pawn.y - t.y);
    pawn.isHiding = false;

    // Nếu đang trong lễ Hoàng Thượng ban chiếu điều quân từ cổng
    if (this.decreeEvent?.active) {
      pawn.vx = 0; pawn.vy = 0;
      if (this.emperor) {
        pawn.aimAngle = Math.atan2(this.emperor.y - pawn.y, this.emperor.x - pawn.x);
      }
      pawn.objective = 'Cung nghinh Chiếu chỉ Hoàng Thượng & Tiếp đón Thiết Kỵ';
      pawn.thought = 'Hoàng Thượng ngự giá ban chiếu điều quân! Thiết Kỵ xuất quan từ Cổng Nam!';
      return;
    }

    pawn.objective = 'Thử thách Thiền Viện Trúc Lâm: giao chiến quan tướng';
    pawn.thought = 'Khuất phục các quan tướng để thăng cấp và triệu hồi đoàn quân Thiết Kỵ chi viện 8 phút!';

    const alive = this.guardians.filter(g => g.isAlive && !g.isEscort);
    if (alive.length > 0) {
      // Tìm vị tướng gần nhất để đánh
      let closest = alive[0], cDist = Math.hypot(pawn.x - alive[0].x, pawn.y - alive[0].y);
      for (let i = 1; i < alive.length; i++) {
        const d = Math.hypot(pawn.x - alive[i].x, pawn.y - alive[i].y);
        if (d < cDist) { cDist = d; closest = alive[i]; }
      }

      if (cDist > 45) {
        window.GameAI.AIBrain.moveToTarget(pawn, closest.x, closest.y, dt);
      } else {
        // Đánh tướng
        pawn.aimAngle = Math.atan2(closest.y - pawn.y, closest.x - pawn.x);
        pawn.vx = 0; pawn.vy = 0;
        this.botStrikeGuardian(pawn, closest, dt);
      }
    } else {
      // Tướng đã hạ, hoàn tất thử thách và giải phóng plan
      if (dist > 30) {
        window.GameAI.AIBrain.moveToTarget(pawn, t.x, t.y, dt);
      } else {
        pawn.plan = null;
        pawn.evaluateAt = 0;
        pawn.vx = 0; pawn.vy = 0;
        this.checkMonasteryCleared(pawn);
      }
    }
  },

  botStrikeGuardian(pawn, guardian, dt) {
    pawn.attackCooldown = (pawn.attackCooldown || 0) - dt;
    if (pawn.attackCooldown > 0) return;
    pawn.attackCooldown = 0.8 + Math.random() * 0.3;

    // Kích hoạt animation chém vũ khí cho bot
    const angle = Math.atan2(guardian.y - pawn.y, guardian.x - pawn.x);
    pawn.aimAngle = angle;
    pawn.action = {
      id: Math.random(),
      kind: 'attack',
      angle: angle,
      target: guardian,
      elapsed: 0.08,
      duration: 0.32,
      windup: 0.08,
      active: 0.12,
      released: true
    };
    pawn.attackState = { isAttacking: true, progress: 0.25 };

    const dmg = Math.round((pawn.attack || 20) * 1.5 * (1 - guardian.defense / (guardian.defense + 100)));
    guardian.currentHp -= dmg;
    guardian.lastAttacker = pawn;

    const V = window.GameRenderer?.VfxManager;
    V?.addDamageNumber?.(guardian.x, guardian.y - 25, '-' + dmg, 'normal');
    V?.addBurstParticles?.(guardian.x, guardian.y, '#f59e0b', 8);
    V?.addEffect?.('impact', guardian.x, guardian.y, { radius: 30, color: '#f59e0b', life: 0.25 });
    window.GameEngine?.Audio?.play?.('impact', guardian, 'blade');

    if (guardian.currentHp <= 0) {
      guardian.isAlive = false;
      guardian.currentHp = 0;
      window.GameUI?.CombatTicker?.log(`⚔️ ${pawn.name} đã đánh bại ${guardian.name} tại Trúc Lâm!`);
      V?.addBurstParticles?.(guardian.x, guardian.y, '#e11d48', 25);
      this.checkMonasteryCleared(pawn);
    }
  },

  checkMonasteryCleared(victorPawn) {
    const alive = this.guardians.filter(g => g.isAlive);
    if (alive.length > 0) return;

    // Toàn bộ quan tướng đã bị đánh bại!
    const t = this.temple;
    const G = window.GameManager;
    const V = window.GameRenderer?.VfxManager;

    // Tìm các bot trong khuôn viên viện để chia sẻ phần thưởng cấp
    const participants = (G?.pawns || []).filter(p => p.isAlive && Math.hypot(p.x - t.x, p.y - t.y) <= t.radius + 60);
    const recipients = participants.length > 0 ? participants : [victorPawn];

    for (const p of recipients) {
      p.currentExp = (p.currentExp || 0) + 900;
      window.GameEntities.CombatSystem?.checkLevelUp?.(p);
      p.currentHp = p.maxHp; // hồi đầy máu
      V?.addEffect?.('heal', p.x, p.y, { radius: 50, color: '#10b981', life: 1.2 });
      V?.addEmotionMote?.(p, '⭐', '#f59e0b');
    }

    V?.addEffect?.('rune', t.x, t.y, { radius: 180, color: '#f59e0b', life: 2.5 });
    window.GameEngine?.Audio?.play?.('ascension');

    // Khởi động Animation Hoàng Thượng ban chiếu điều quân từ cổng thành
    this.startDecreeAnimation(victorPawn);
  },

  deployLegion(owner) {
    this.startDecreeAnimation(owner);
  },

  startDecreeAnimation(victorPawn) {
    const gateX = this.gate.x, gateY = this.gate.y;

    // Tạo sẵn đoàn quân xuất hiện từ Cổng Nam thành viện
    this.legion = {
      active: true,
      owner: victorPawn,
      life: 480, // Tồn tại đúng 8 phút = 480 giây
      maxLife: 480,
      marching: true, // đang trong giai đoạn xuất quân từ Cổng Nam
      general: {
        id: 'tl_mounted_general',
        name: 'Thiết Kỵ Tướng Quân',
        title: 'Thống Soái Kỵ Binh • Thiết Kỵ Trúc Lâm',
        tierName: 'Thống Soái Thiết Kỵ',
        isSpecial: true,
        isLegion: true,
        isAlive: true,
        x: gateX,
        y: gateY + 50,
        vx: 0,
        vy: 0,
        radius: 40,
        aimAngle: -Math.PI / 2, // hướng lên sân viện
        speed: 175,
        maxHp: 1200,
        currentHp: 1200,
        attack: 48,
        defense: 16,
        attackCooldown: 0,
        targetMonster: null,
        gallopPhase: 0,
        weapon: {
          name: 'Long Đao Chiến Mã',
          tier: 'supreme',
          attack: 48,
          desc: 'Đại đao trảm mã uy lực vô song khi phi nước đại xung phong.'
        },
        armor: {
          name: 'Chiến Giáp Thiết Kỵ',
          tier: 'supreme',
          defense: 16,
          desc: 'Chiến giáp sắt kiên cố bảo vệ tướng quân và chiến mã.'
        },
        skills: [
          { id: 'leg_charge', def: { name: 'Thiết Kỵ Xung Phong', desc: 'Phi nước đại hất tung quái thú cản đường và gây sát thương nặng.' } }
        ],
        passives: [
          { id: 'leg_mounted', name: 'Chiến Mã Phi Thần', desc: 'Di chuyển thần tốc, miễn nhiễm làm chậm khi hộ tống chủ nhân.' }
        ],
        objective: 'Phụng chỉ Hoàng Thượng, hộ giá ' + (victorPawn?.name || 'Chủ Nhân') + ' diệt quái',
        thought: 'Mạt tướng phụng chỉ Hoàng Thượng, quyết bảo vệ Chủ Nhân an toàn!'
      },
      soldiers: [
        {
          id: 'tl_guard_1',
          name: 'Trúc Lâm Tiền Vệ',
          title: 'Thiết Kỵ Hộ Vệ',
          tierName: 'Binh Sĩ Trúc Lâm',
          isSpecial: true,
          isLegion: true,
          isAlive: true,
          x: gateX - 42,
          y: gateY + 75,
          vx: 0,
          vy: 0,
          radius: 28,
          aimAngle: -Math.PI / 2,
          speed: 140,
          maxHp: 380,
          currentHp: 380,
          attack: 24,
          defense: 6,
          attackCooldown: 0,
          weapon: 'spear',
          weaponObj: { name: 'Trường Thương Trúc Lâm', tier: 'rare', attack: 24, desc: 'Thương tiêu chuẩn của quân hộ vệ.' },
          armor: { name: 'Thiết Giáp Binh Sĩ', tier: 'rare', defense: 6, desc: 'Giáp sắt bền chắc của đội tiền vệ.' },
          objective: 'Hộ vệ đội hình Thiết Kỵ cùng Chủ Nhân',
          thought: 'Theo sát Tướng Quân, dẹp tan yêu ma!'
        },
        {
          id: 'tl_guard_2',
          name: 'Trúc Lâm Hậu Vệ',
          title: 'Thiết Kỵ Hộ Vệ',
          tierName: 'Binh Sĩ Trúc Lâm',
          isSpecial: true,
          isLegion: true,
          isAlive: true,
          x: gateX + 42,
          y: gateY + 75,
          vx: 0,
          vy: 0,
          radius: 28,
          aimAngle: -Math.PI / 2,
          speed: 140,
          maxHp: 380,
          currentHp: 380,
          attack: 22,
          defense: 6,
          attackCooldown: 0,
          weapon: 'sword',
          weaponObj: { name: 'Bảo Kiếm Trúc Lâm', tier: 'rare', attack: 22, desc: 'Kiếm tiêu chuẩn của quân hậu vệ.' },
          armor: { name: 'Thiết Giáp Binh Sĩ', tier: 'rare', defense: 6, desc: 'Giáp sắt bền chắc của đội hậu vệ.' },
          objective: 'Hộ vệ đội hình Thiết Kỵ cùng Chủ Nhân',
          thought: 'Theo sát Tướng Quân, dẹp tan yêu ma!'
        }
      ]
    };

    this.decreeEvent = {
      active: true,
      timer: 0,
      victor: victorPawn,
      phase: 'decree', // 'decree' (0 -> 2.2s) -> 'march' (2.2s -> 5.5s)
      gateX,
      gateY
    };

    if (this.emperor) {
      this.emperor.speech = `Trẫm chuẩn y! Truyền lệnh Thiết Kỵ xuất Cổng Nam phò tá ${victorPawn.name}!`;
      this.emperor.speechTimer = 5.5;
    }

    window.GameUI?.CombatTicker?.log(`👑 Hoàng Thượng giáng chỉ: Khâm khen dũng khí của ${victorPawn.name}! Truyền lệnh mở Cổng Nam, điều Thiết Kỵ xuất quân phò tá 8 phút!`);
  },

  updateDecreeEvent(dt) {
    const ev = this.decreeEvent;
    if (!ev || !ev.active) return;
    ev.timer += dt;
    const V = window.GameRenderer?.VfxManager;

    if (ev.timer < 2.2) {
      // Giai đoạn 1: Hoàng Thượng đứng trên điện ban chiếu (0 -> 2.2s)
      ev.phase = 'decree';
      if (Math.random() < 0.25 && this.emperor) {
        V?.addBurstParticles?.(this.emperor.x, this.emperor.y, '#f59e0b', 4);
      }
    } else if (ev.timer < 5.5) {
      // Giai đoạn 2: Mở Cổng Nam, Thiết Kỵ xuất quan (2.2 -> 5.5s)
      if (ev.phase === 'decree') {
        ev.phase = 'march';
        V?.addEffect?.('impact', ev.gateX, ev.gateY, { radius: 75, color: '#f59e0b', life: 0.8 });
        V?.addBurstParticles?.(ev.gateX, ev.gateY, '#e2e8f0', 25);
        window.GameEngine?.Audio?.play?.('impact', { x: ev.gateX, y: ev.gateY }, 'steel');
        window.GameUI?.CombatTicker?.log('🚪 Cổng Nam Thiền Viện Trúc Lâm mở rộng! Thiết Kỵ Tướng Quân dẫn đầu đoàn quân xuất trận!');
      }

      // Đoàn quân phi nước đại từ Cổng Nam về phía victorPawn
      const leg = this.legion;
      if (leg?.active && ev.victor?.isAlive) {
        const gen = leg.general;
        const dx = ev.victor.x - gen.x;
        const dy = ev.victor.y - gen.y;
        const dist = Math.hypot(dx, dy);
        gen.aimAngle = Math.atan2(dy, dx);
        gen.gallopPhase = (gen.gallopPhase || 0) + dt * 15;

        if (dist > 115) {
          const step = Math.min(dist - 110, gen.speed * dt);
          gen.x += Math.cos(gen.aimAngle) * step;
          gen.y += Math.sin(gen.aimAngle) * step;
        }

        // Binh sĩ theo sát hai bên cánh (giữ khoảng cách rộng thoáng)
        leg.soldiers.forEach((sol, idx) => {
          const sideOffset = idx === 0 ? -60 : 60;
          const targetX = gen.x + Math.sin(gen.aimAngle) * sideOffset - Math.cos(gen.aimAngle) * 35;
          const targetY = gen.y - Math.cos(gen.aimAngle) * sideOffset - Math.sin(gen.aimAngle) * 35;
          sol.aimAngle = gen.aimAngle;
          const sDist = Math.hypot(targetX - sol.x, targetY - sol.y);
          if (sDist > 10) {
            const step = Math.min(sDist, sol.speed * 1.2 * dt);
            const ang = Math.atan2(targetY - sol.y, targetX - sol.x);
            sol.x += Math.cos(ang) * step;
            sol.y += Math.sin(ang) * step;
          }
        });

        if (dist <= 125) {
          this.finishDecreeMarch();
        }
      }
    } else {
      this.finishDecreeMarch();
    }
  },

  finishDecreeMarch() {
    if (!this.decreeEvent?.active) return;
    this.decreeEvent.active = false;
    if (this.legion) {
      this.legion.marching = false;
      const owner = this.decreeEvent.victor;
      window.GameUI?.CombatTicker?.log(`🏇 Thiết Kỵ Tướng Quân: 'Mạt tướng phụng chỉ Hoàng Thượng, nguyện dốc sức bảo hộ ${owner?.name || 'Chủ Nhân'}!'`);
      if (owner) {
        window.GameRenderer?.VfxManager?.addEmotionMote?.(owner, '⚔️', '#f59e0b');
      }
    }
  },

  update(dt) {
    this.clock += dt;
    this.cooldown = Math.max(0, this.cooldown - dt);

    // Cập nhật Hoàng Thượng
    if (this.emperor) {
      this.emperor.aura += dt;
      if (this.emperor.speechTimer > 0) {
        this.emperor.speechTimer -= dt;
        if (this.emperor.speechTimer <= 0) this.emperor.speech = '';
      }
    }

    // Cập nhật Animation Hoàng Thượng ban chiếu điều quân
    if (this.decreeEvent?.active) {
      this.updateDecreeEvent(dt);
    }

    // Kiểm tra chế độ còn 1 bot cuối sống sót -> Tam Vị Quan Tướng & Thiết Kỵ toàn quân xuất trận hộ giá!
    const G = window.GameManager;
    const alivePawns = (G?.pawns || []).filter(p => p.isAlive && !p.isDemonKing);
    const oneBotLeft = (G?.battleRoyaleResolved && !G?.resultOpen) || (alivePawns.length === 1 && !G?.resultOpen);
    if (oneBotLeft && alivePawns.length === 1) {
      if (!this.survivorEscortActive || this.survivor !== alivePawns[0]) {
        this.mobilizeFinalSurvivorEscort(alivePawns[0]);
      }
    }

    // 1. Cập nhật các quan tướng trấn viện khi còn sống
    this.updateGuardians(dt);

    // 2. Cập nhật phái đoàn quân đi theo đánh quái (8 phút)
    if (this.legion?.active) {
      this.updateLegion(dt);
    } else if (this.cooldown <= 0 && this.guardians.every(g => !g.isAlive) && !this.decreeEvent?.active && !this.survivorEscortActive) {
      // Hồi phục lại viện cho lượt sau
      this.spawnGuardians();
      window.GameUI?.CombatTicker?.log('🎋 Ba vị quan tướng Thiền Viện Trúc Lâm đã trở lại trấn giữ viện.');
    }
  },

  mobilizeFinalSurvivorEscort(survivor) {
    if (!survivor?.isAlive) return;
    this.survivorEscortActive = true;
    this.survivor = survivor;

    // Hồi phục và điều động cả 3 vị quan tướng cùng đi theo hộ giá
    for (const g of this.guardians) {
      g.isAlive = true;
      g.currentHp = g.maxHp;
      g.isEscort = true;
      g.speed = 155;
      const d = Math.hypot(g.x - survivor.x, g.y - survivor.y);
      if (d > 350) {
        const ang = Math.random() * Math.PI * 2;
        g.x = survivor.x + Math.cos(ang) * 135;
        g.y = survivor.y + Math.sin(ang) * 135;
        g.homeX = g.x;
        g.homeY = g.y;
      }
    }

    // Kích hoạt đoàn quân Thiết Kỵ hộ tống vĩnh viễn đến hết trận
    if (!this.legion || !this.legion.active) {
      this.legion = {
        active: true,
        owner: survivor,
        life: 99999,
        maxLife: 99999,
        marching: false,
        general: {
          id: 'tl_mounted_general',
          name: 'Thiết Kỵ Tướng Quân',
          x: survivor.x - 115,
          y: survivor.y,
          vx: 0,
          vy: 0,
          aimAngle: survivor.aimAngle || 0,
          speed: 165,
          attack: 48,
          attackCooldown: 0,
          targetMonster: null,
          gallopPhase: 0
        },
        soldiers: [
          {
            id: 'tl_guard_1',
            name: 'Trúc Lâm Tiền Vệ',
            x: survivor.x - 70,
            y: survivor.y - 125,
            vx: 0,
            vy: 0,
            aimAngle: 0,
            speed: 140,
            attack: 24,
            attackCooldown: 0,
            weapon: 'spear'
          },
          {
            id: 'tl_guard_2',
            name: 'Trúc Lâm Hậu Vệ',
            x: survivor.x - 70,
            y: survivor.y + 125,
            vx: 0,
            vy: 0,
            aimAngle: 0,
            speed: 140,
            attack: 22,
            attackCooldown: 0,
            weapon: 'sword'
          }
        ]
      };
    } else {
      this.legion.owner = survivor;
      this.legion.life = 99999;
      this.legion.marching = false;
      const d = Math.hypot(this.legion.general.x - survivor.x, this.legion.general.y - survivor.y);
      if (d > 350) {
        this.legion.general.x = survivor.x - 115;
        this.legion.general.y = survivor.y;
        this.legion.soldiers[0].x = survivor.x - 70;
        this.legion.soldiers[0].y = survivor.y - 125;
        this.legion.soldiers[1].x = survivor.x - 70;
        this.legion.soldiers[1].y = survivor.y + 125;
      }
    }

    if (this.emperor) {
      this.emperor.speech = `Khâm chỉ! Tam Vị Tướng Quân & Thiết Kỵ toàn quân xuất kích phò tá ${survivor.name}!`;
      this.emperor.speechTimer = 6.0;
    }

    window.GameUI?.CombatTicker?.log(`👑 Hoàng Thượng truyền thánh chỉ: Toàn quân Thiền Viện Trúc Lâm (Tam Vị Quan Tướng & Thiết Kỵ Kỵ Binh) xuất trận hộ tống ${survivor.name}!`);
    window.GameRenderer?.VfxManager?.addEmotionMote?.(survivor, '👑', '#f59e0b');
    window.GameRenderer?.VfxManager?.addEffect?.('rune', survivor.x, survivor.y, { radius: 120, color: '#f59e0b', life: 2.0 });
  },

  handleVictimDeath(victim, killer) {
    if (!victim?.isPawn) return;
    const isLegionOwner = this.legion?.active && this.legion?.owner === victim;
    const isSurvivor = this.survivorEscortActive && this.survivor === victim;
    if (!isLegionOwner && !isSurvivor) return;

    if (killer?.isPawn && killer.isAlive && killer !== victim && !killer.isDemonKing) {
      this.transferLegion(killer, `bị ${killer.name} hạ gục`);
    } else {
      const newOwner = this.findNearestLivingBot(victim.x, victim.y, victim);
      if (newOwner) {
        this.transferLegion(newOwner, 'ngã xuống');
      } else {
        if (this.legion) this.legion.active = false;
      }
    }
  },

  handleVictimDevoured(victim, x = victim?.x, y = victim?.y) {
    if (!victim?.isPawn) return;
    const isLegionOwner = this.legion?.active && this.legion?.owner === victim;
    const isSurvivor = this.survivorEscortActive && this.survivor === victim;
    if (!isLegionOwner && !isSurvivor) return;

    const newOwner = this.findNearestLivingBot(x, y, victim);
    if (newOwner) {
      this.transferLegion(newOwner, 'bị nuốt chửng biến mất');
    } else {
      if (this.legion) this.legion.active = false;
    }
  },

  transferLegion(newOwner, reason = 'bị hạ') {
    if (!newOwner?.isAlive) return;
    const oldOwner = this.legion?.owner || this.survivor;
    const oldName = oldOwner?.name || 'Chủ nhân';

    if (this.legion) {
      this.legion.owner = newOwner;
      // Duy trì thời gian chi viện còn lại, tối thiểu 180s
      this.legion.life = Math.max(180, this.legion.life || 0);
      this.legion.marching = false;
    }
    if (this.survivorEscortActive) {
      this.survivor = newOwner;
      for (const g of this.guardians) {
        g.isEscort = true;
      }
    }

    const V = window.GameRenderer?.VfxManager;
    V?.addEmotionMote?.(newOwner, '🏇', '#f59e0b');
    V?.addEffect?.('rune', newOwner.x, newOwner.y, { radius: 85, color: '#f59e0b', life: 1.5 });
    window.GameEngine?.Audio?.play?.('level', newOwner);

    window.GameUI?.CombatTicker?.log(`🏇 ${oldName} ${reason}! Thiết Kỵ Tướng Quân & Hộ Vệ Trúc Lâm quy phục, tôn ${newOwner.name} làm tân chủ nhân!`);
  },

  findNearestLivingBot(x, y, exclude = null) {
    const G = window.GameManager;
    const living = (G?.pawns || []).filter(p => p.isAlive && !p.despawned && p !== exclude && !p.isDemonKing && Number.isFinite(p.x) && Number.isFinite(p.y));
    if (!living.length) return null;
    living.sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
    return living[0];
  },

  updateGuardians(dt) {
    const t = this.temple;
    const G = window.GameManager;
    if (!t || !G) return;

    for (const g of this.guardians) {
      if (!g.isAlive) continue;
      g.attackCooldown = Math.max(0, g.attackCooldown - dt);
      g.swingTimer = Math.max(0, (g.swingTimer || 0) - dt);

      // Đảm bảo tọa độ không bao giờ NaN
      if (!Number.isFinite(g.x) || !Number.isFinite(g.y)) {
        g.x = g.homeX || t.x;
        g.y = g.homeY || t.y;
      }

      const speed = g.speed || 115;

      // Chế độ hộ giá bot cuối sống sót: Tam vị tướng đi theo bảo vệ và diệt quái cùng bot
      if (this.survivorEscortActive && this.survivor?.isAlive) {
        const owner = this.survivor;
        // CHỈ đánh mục tiêu mà chủ nhân đang target đánh trước (không tự ý đánh quái khác nếu chủ nhân chưa target)
        let target = null;
        const ownerTarget = owner.targetEnemy || owner.action?.target || owner.plan?.target;
        if (ownerTarget?.isAlive && !ownerTarget.despawned && ownerTarget !== owner && (ownerTarget.isMonster || ownerTarget.isPawn)) {
          target = ownerTarget;
        }

        if (target) {
          const dTarget = Math.hypot(target.x - g.x, target.y - g.y);
          g.aimAngle = Math.atan2(target.y - g.y, target.x - g.x);
          if (dTarget > 42) {
            const step = Math.min(dTarget - 36, speed * dt);
            g.x += Math.cos(g.aimAngle) * step;
            g.y += Math.sin(g.aimAngle) * step;
          } else if (g.attackCooldown <= 0) {
            g.attackCooldown = 0.95;
            g.swingTimer = 0.35;
            const dmg = Math.round(g.attack * 2.8);
            target.currentHp = Math.max(0, target.currentHp - dmg);
            const V = window.GameRenderer?.VfxManager;
            V?.addDamageNumber?.(target.x, target.y - 20, '-' + dmg, 'crit');
            V?.addBurstParticles?.(target.x, target.y, g.armorCol || '#f59e0b', 8);
            window.GameEngine?.Audio?.play?.('impact', target, 'blade');

            if (target.currentHp <= 0 && target.isAlive) {
              window.GameUI?.CombatTicker?.log(`🎋 ${g.name} trảm hạ ${target.name} theo lệnh ${owner.name}!`);
              window.GameEntities?.CombatSystem?.handleDeath(owner, target);
              if (owner.targetEnemy === target) owner.targetEnemy = null;
            }
          }
        } else {
          // Đi theo đội hình hộ tống quanh bot cuối (đứng xa 125px - 175px để khung hình thoáng đãng, không che khuất chủ nhân)
          const idx = this.guardians.indexOf(g);
          let formAngle = owner.aimAngle || 0;
          let formDist = 125;
          if (idx === 0) {
            // Chưởng Viện: Tiền tiêu chếch trái
            formAngle -= 0.6;
            formDist = 125;
          } else if (idx === 1) {
            // Tiền Phong: Tiền tiêu chếch phải
            formAngle += 0.6;
            formDist = 125;
          } else {
            // Hộ Pháp: Hậu vệ khóa đuôi phía sau
            formAngle += Math.PI;
            formDist = 175;
          }
          const targetX = owner.x + Math.cos(formAngle) * formDist;
          const targetY = owner.y + Math.sin(formAngle) * formDist;
          const dForm = Math.hypot(targetX - g.x, targetY - g.y);
          if (dForm > 20) {
            g.aimAngle = Math.atan2(targetY - g.y, targetX - g.x);
            const step = Math.min(dForm, speed * dt);
            g.x += Math.cos(g.aimAngle) * step;
            g.y += Math.sin(g.aimAngle) * step;
          } else {
            g.aimAngle = owner.aimAngle || 0;
          }
        }
        continue;
      }

      // Tìm bot trong tầm viện để tự vệ phản công
      const nearbyBots = (G.pawns || []).filter(p => p.isAlive && Math.hypot(p.x - g.x, p.y - g.y) <= 180);
      if (nearbyBots.length > 0) {
        let target = nearbyBots[0];
        if (g.lastAttacker?.isAlive && nearbyBots.includes(g.lastAttacker)) {
          target = g.lastAttacker;
        }
        const dist = Math.hypot(target.x - g.x, target.y - g.y);
        g.aimAngle = Math.atan2(target.y - g.y, target.x - g.x);

        if (dist > 40) {
          const step = Math.min(dist - 36, speed * dt);
          g.x += Math.cos(g.aimAngle) * step;
          g.y += Math.sin(g.aimAngle) * step;
        } else if (g.attackCooldown <= 0) {
          // Tướng ra đòn
          g.attackCooldown = 1.8 + Math.random() * 0.5;
          g.swingTimer = 0.35;
          const dmg = Math.round(g.attack * (1 - (target.defense || 5) / ((target.defense || 5) + 100)));
          target.currentHp = Math.max(1, target.currentHp - dmg);
          target.lastDamageTakenAt = window.GameManager?.matchTime || 0;
          target.lastAttacker = g;

          const V = window.GameRenderer?.VfxManager;
          V?.addDamageNumber?.(target.x, target.y - 20, '-' + dmg, 'crit');
          V?.addEffect?.('impact', target.x, target.y, { radius: 38, color: '#f59e0b', life: 0.35 });
          V?.addBurstParticles?.(target.x, target.y, '#f59e0b', 10);
          window.GameEngine?.Audio?.play?.('impact', target, 'blade');
        }
      } else {
        // Trở về vị trí cũ nếu không có ai
        const dHome = Math.hypot(g.homeX - g.x, g.homeY - g.y);
        if (dHome > 5) {
          const step = Math.min(dHome, speed * 0.7 * dt);
          const ang = Math.atan2(g.homeY - g.y, g.homeX - g.x);
          g.x += Math.cos(ang) * step;
          g.y += Math.sin(ang) * step;
          g.aimAngle = ang;
        }
      }
    }
  },

  updateLegion(dt) {
    const leg = this.legion;
    if (!leg?.active) return;

    leg.life -= dt;
    if (leg.life <= 0) {
      leg.active = false;
      this.cooldown = 60; // 60s sau viện mở lại
      window.GameUI?.CombatTicker?.log(`🏇 Đoàn quân Trúc Lâm đã hết thời gian chi viện (8 phút), cúi chào và trở về Thiền Viện.`);
      window.GameRenderer?.VfxManager?.addBurstParticles?.(leg.general.x, leg.general.y, '#f59e0b', 30);
      return;
    }

    if (!leg.owner?.isAlive || leg.owner.despawned) {
      // Chủ nhân ngã xuống hoặc biến mất -> Chuyển giao cho bot gần nhất
      const newOwner = this.findNearestLivingBot(leg.general.x, leg.general.y, leg.owner);
      if (newOwner) {
        this.transferLegion(newOwner, 'ngã xuống');
      } else {
        leg.active = false;
        this.cooldown = 60;
        window.GameUI?.CombatTicker?.log(`🏇 Không còn người thừa kế, Đoàn quân Trúc Lâm cúi chào và trở về Thiền Viện.`);
        window.GameRenderer?.VfxManager?.addBurstParticles?.(leg.general.x, leg.general.y, '#f59e0b', 30);
        return;
      }
    }

    // Nếu đang trong giai đoạn hành quân từ cổng ra, updateDecreeEvent sẽ điều khiển vị trí
    if (leg.marching) return;

    const owner = leg.owner;
    const G = window.GameManager;
    const V = window.GameRenderer?.VfxManager;

    // 1. Quét mục tiêu: CHỈ ĐÁNH MỤC TIÊU MÀ CHỦ NHÂN ĐANG TARGET ĐÁNH TRƯỚC (không tự ý đánh quái khác nếu chủ nhân chưa đánh)
    let target = null;
    const ownerTarget = owner.targetEnemy || owner.action?.target || owner.plan?.target;
    if (ownerTarget?.isAlive && !ownerTarget.despawned && ownerTarget !== owner && (ownerTarget.isMonster || ownerTarget.isPawn)) {
      target = ownerTarget;
    }

    // 2. Cập nhật Tướng Cưỡi Ngựa
    const gen = leg.general;
    gen.gallopPhase = (gen.gallopPhase || 0) + dt * 12;
    gen.attackCooldown = Math.max(0, (gen.attackCooldown || 0) - dt);

    if (target) {
      // Lao đến đánh mục tiêu
      const dTarget = Math.hypot(target.x - gen.x, target.y - gen.y);
      gen.aimAngle = Math.atan2(target.y - gen.y, target.x - gen.x);
      if (dTarget > 45) {
        const step = Math.min(dTarget - 38, gen.speed * dt);
        gen.x += Math.cos(gen.aimAngle) * step;
        gen.y += Math.sin(gen.aimAngle) * step;
      } else if (gen.attackCooldown <= 0) {
        // Tướng đâm thương diệt mục tiêu
        gen.attackCooldown = 0.95;
        const dmg = Math.round(gen.attack * (1.2 + Math.random() * 0.4));
        target.currentHp = Math.max(0, target.currentHp - dmg);
        V?.addDamageNumber?.(target.x, target.y - 25, 'KỴ KÍCH: -' + dmg, 'crit');
        V?.addEffect?.('impact', target.x, target.y, { radius: 55, color: '#f59e0b', life: 0.4 });
        V?.addBurstParticles?.(target.x, target.y, '#eab308', 12);
        window.GameEngine?.Audio?.play?.('impact', target, 'spear');

        if (target.currentHp <= 0 && target.isAlive) {
          window.GameUI?.CombatTicker?.log(`🏇 Thiết Kỵ Tướng Quân đâm thương tiêu diệt ${target.name} theo lệnh chủ nhân!`);
          if (G && window.GameEntities?.CombatSystem) {
            window.GameEntities.CombatSystem.handleDeath(owner, target);
          }
          if (owner.targetEnemy === target) owner.targetEnemy = null;
        }
      }
    } else {
      // Đi theo phò tá chủ nhân (đứng sau lưng khoảng cách 115px, để khung hình thoáng đãng)
      const targetX = owner.x - Math.cos(owner.aimAngle || 0) * 115;
      const targetY = owner.y - Math.sin(owner.aimAngle || 0) * 115;
      const dOwner = Math.hypot(targetX - gen.x, targetY - gen.y);
      if (dOwner > 25) {
        gen.aimAngle = Math.atan2(targetY - gen.y, targetX - gen.x);
        const step = Math.min(dOwner, gen.speed * dt);
        gen.x += Math.cos(gen.aimAngle) * step;
        gen.y += Math.sin(gen.aimAngle) * step;
      } else {
        gen.aimAngle = owner.aimAngle || 0;
      }
    }

    // 3. Cập nhật Binh Sĩ Hộ Vệ
    leg.soldiers.forEach((sol, idx) => {
      sol.attackCooldown = Math.max(0, (sol.attackCooldown || 0) - dt);
      if (target) {
        const dTarget = Math.hypot(target.x - sol.x, target.y - sol.y);
        sol.aimAngle = Math.atan2(target.y - sol.y, target.x - sol.x);
        if (dTarget > 35) {
          const step = Math.min(dTarget - 30, sol.speed * dt);
          sol.x += Math.cos(sol.aimAngle) * step;
          sol.y += Math.sin(sol.aimAngle) * step;
        } else if (sol.attackCooldown <= 0) {
          sol.attackCooldown = 1.1;
          const dmg = Math.round(sol.attack * (1 + Math.random() * 0.3));
          target.currentHp = Math.max(0, target.currentHp - dmg);
          V?.addDamageNumber?.(target.x, target.y - 18, '-' + dmg, 'normal');
          V?.addBurstParticles?.(target.x, target.y, '#94a3b8', 6);
          if (target.currentHp <= 0 && target.isAlive) {
            window.GameUI?.CombatTicker?.log(`🛡️ Hộ Vệ Trúc Lâm chém hạ ${target.name} theo lệnh chủ nhân!`);
            if (G && window.GameEntities?.CombatSystem) {
              window.GameEntities.CombatSystem.handleDeath(owner, target);
            }
            if (owner.targetEnemy === target) owner.targetEnemy = null;
          }
        }
      } else {
        // Đội hình phò tá quanh chủ nhân (đứng xa 130px, dàn sang 2 bên sườn)
        let formX, formY;
        if (this.survivorEscortActive) {
          const flankAngle = (owner.aimAngle || 0) + (idx === 0 ? -1.55 : 1.55);
          formX = owner.x + Math.cos(flankAngle) * 130;
          formY = owner.y + Math.sin(flankAngle) * 130;
        } else {
          const sideOffset = idx === 0 ? -70 : 70;
          formX = gen.x + Math.sin(gen.aimAngle) * sideOffset - Math.cos(gen.aimAngle) * 45;
          formY = gen.y - Math.cos(gen.aimAngle) * sideOffset - Math.sin(gen.aimAngle) * 45;
        }
        const dForm = Math.hypot(formX - sol.x, formY - sol.y);
        if (dForm > 18) {
          sol.aimAngle = Math.atan2(formY - sol.y, formX - sol.x);
          const step = Math.min(dForm, sol.speed * dt);
          sol.x += Math.cos(sol.aimAngle) * step;
          sol.y += Math.sin(sol.aimAngle) * step;
        } else {
          sol.aimAngle = owner.aimAngle || 0;
        }
      }
    });
  },

  render(ctx) {
    const t = this.temple;
    if (!t) return;

    // 0. Cổng Nam Thiền Viện Trúc Lâm và hiệu ứng mở cổng
    this.drawMonasteryGate(ctx);

    // 1. Hoàng Thượng ngự tại Chánh Điện Trúc Lâm
    if (this.emperor) {
      this.drawEmperor(ctx, this.emperor);
    }

    // 2. Vẽ 3 Quan Tướng khi còn sống trong sân viện
    this.drawGuardians(ctx);

    // 3. Vẽ Đoàn Quân Thiết Kỵ đi theo chi viện (nếu có)
    if (this.legion?.active) {
      this.drawLegion(ctx, this.legion);
    }
  },

  drawMonasteryGate(ctx) {
    const gateX = this.gate?.x || 1020, gateY = this.gate?.y || 1670;
    ctx.save();
    // Biển tên Cổng Nam
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(254, 240, 138, 0.75)';
    ctx.fillText('⛩️ CỔNG NAM THIỀN VIỆN', gateX, gateY - 22);

    if (this.decreeEvent?.active && this.decreeEvent.phase === 'march') {
      // Cổng rực sáng hiệu ứng mở cổng xuất quân
      const glow = Math.sin((this.clock || 0) * 8) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(245, 158, 11, ${glow * 0.35})`;
      ctx.beginPath();
      ctx.ellipse(gateX, gateY, 75, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2.0;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.ellipse(gateX, gateY, 70, 22, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  },

  drawEmperor(ctx, emp) {
    const time = this.clock || 0;
    const isDecreeing = this.decreeEvent?.active && this.decreeEvent.phase === 'decree';
    const bob = Math.sin(time * 3) * 1.5;

    ctx.save();
    ctx.translate(emp.x, emp.y);

    // Hào quang rồng vàng của Hoàng Thượng (Imperial Dragon Aura)
    const auraPulse = 0.45 + Math.sin(time * 3.5) * 0.18;
    const auraGrad = ctx.createRadialGradient(0, -16, 8, 0, -16, 55);
    auraGrad.addColorStop(0, `rgba(254, 240, 138, ${auraPulse * 0.7})`);
    auraGrad.addColorStop(0.5, `rgba(245, 158, 11, ${auraPulse * 0.35})`);
    auraGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, -16, 55, 0, Math.PI * 2);
    ctx.fill();

    // 1. Bóng chân
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(0, -bob);

    // 2. Hoàng Bào Rồng Vàng (Imperial Robe - Capsule body)
    const bodyHeight = 23;
    const bodyRadius = 13;
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = '#1e272e';
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(-bodyRadius, -bodyHeight, bodyRadius * 2, bodyHeight + 6, [10, 10, 8, 8]);
    ctx.fill();
    ctx.stroke();

    // Đai ngọc đỏ trước ngực
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-bodyRadius + 2, -bodyHeight + 4, bodyRadius * 2 - 4, 3);

    // Họa tiết rồng vàng giữa ngực
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, -bodyHeight + 11, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Ngọc bội treo đai
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(0, -2, 3, 0, Math.PI * 2);
    ctx.fill();

    // 3. Đầu Hoàng Thượng (Head)
    const headRadius = 13;
    const headY = -32;
    ctx.fillStyle = '#efd0a1';
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 4. Khuôn mặt & Râu rồng quý phái
    ctx.fillStyle = '#1e272e';
    ctx.beginPath();
    ctx.moveTo(-5, headY + 5);
    ctx.quadraticCurveTo(0, headY + 20, 5, headY + 5);
    ctx.quadraticCurveTo(0, headY + 9, -5, headY + 5);
    ctx.fill();

    // Mắt hoàng đế tĩnh tại, uy nghiêm
    ctx.beginPath();
    ctx.arc(-4.5, headY - 1, 1.8, 0, Math.PI * 2);
    ctx.arc(4.5, headY - 1, 1.8, 0, Math.PI * 2);
    ctx.fill();
    // Lông mày
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-7, headY - 4); ctx.lineTo(-2, headY - 3);
    ctx.moveTo(7, headY - 4); ctx.lineTo(2, headY - 3);
    ctx.stroke();

    // 5. Mũ Bình Thiên / Miện Hoàng Đế (Imperial Crown)
    ctx.fillStyle = '#d97706';
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, headY - 3, headRadius + 1, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Bản phẳng Bình Thiên trên đỉnh mũ
    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.rect(-18, headY - headRadius - 6, 36, 4.5);
    ctx.fill();
    ctx.stroke();

    // Các chuỗi ngọc rủ trước trán (Beaded tassels)
    ctx.fillStyle = '#fef08a';
    [-12, -6, 0, 6, 12].forEach(bx => {
      ctx.beginPath();
      ctx.arc(bx, headY - headRadius, 1.5, 0, Math.PI * 2);
      ctx.arc(bx, headY - headRadius + 3.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. Hai bàn tay lơ lửng & Chiếu Thư Vàng (Imperial Decree Scroll)
    const drawHand = (hx, hy) => {
      ctx.fillStyle = '#efd0a1';
      ctx.strokeStyle = '#1e272e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(hx, hy, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };

    if (isDecreeing) {
      // Hoàng Thượng giơ cao Chiếu Thư Vàng
      const raiseY = -28 + Math.sin(time * 8) * 3;
      // Trục cuốn chiếu thư
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-18, raiseY - 1, 36, 3);
      // Giấy hoàng chiếu thêu rồng
      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(-14, raiseY + 2, 28, 18, 2);
      ctx.fill();
      ctx.stroke();
      // Ngọc tỷ ấn đỏ trên chiếu
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-4, raiseY + 6, 8, 8);

      drawHand(-14, raiseY);
      drawHand(14, raiseY);
    } else {
      drawHand(-7, -10);
      drawHand(7, -10);
    }

    ctx.restore();

    // Danh hiệu Hoàng Thượng & Lời ban chiếu
    ctx.save();
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#0f172a';
    ctx.strokeText('👑 Hoàng Thượng', emp.x, emp.y - 56);
    ctx.fillStyle = '#fde047';
    ctx.fillText('👑 Hoàng Thượng', emp.x, emp.y - 56);

    // Bong bóng lời ban chiếu (Imperial Decree Banner)
    if (emp.speech) {
      ctx.font = 'bold 9.5px sans-serif';
      const textW = ctx.measureText(`📜 "${emp.speech}"`).width;
      const bubbleW = Math.min(320, textW + 20);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(emp.x - bubbleW / 2, emp.y - 82, bubbleW, 21, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.fillText(`📜 "${emp.speech}"`, emp.x, emp.y - 68);
    }
    ctx.restore();
  },

  drawGuardians(ctx) {
    for (const g of this.guardians) {
      if (!g.isAlive) continue;
      this.drawGuardianPawn(ctx, g);
    }
  },

  drawGuardianPawn(ctx, g) {
    const time = this.clock || 0;
    const bob = Math.abs(Math.sin(time * 9 + (g.id === 'tl_gen_tran' ? 0 : g.id === 'tl_gen_tien' ? 2 : 4))) * 3.5;
    const facing = Math.cos(g.aimAngle || 0) < 0 ? -1 : 1;

    ctx.save();
    ctx.translate(g.x, g.y);

    // 1. Bóng chân hoạt họa (Shadow)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 15, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nhịp thở / bước đi
    ctx.translate(0, -bob);

    // 2. Áo choàng chiến tướng bay phía sau
    ctx.save();
    ctx.fillStyle = g.color;
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 1.8;
    const capeSway = Math.sin(time * 5 + (g.aimAngle || 0)) * 4;
    ctx.beginPath();
    ctx.moveTo(-10, -18);
    ctx.quadraticCurveTo(-16 - facing * 4, -4, -15 - facing * 6 + capeSway, 8);
    ctx.lineTo(15 - facing * 6 + capeSway, 8);
    ctx.quadraticCurveTo(16 - facing * 4, -4, 10, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Thân viên nhộng (Capsule Body)
    const bodyHeight = 22;
    const bodyRadius = 12;
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = '#1e272e';
    ctx.fillStyle = g.armorCol;
    ctx.beginPath();
    ctx.roundRect(-bodyRadius, -bodyHeight, bodyRadius * 2, bodyHeight + 6, [10, 10, 8, 8]);
    ctx.fill();
    ctx.stroke();

    // Giáp vai pauldrons 2 bên
    ctx.fillStyle = g.armorCol;
    ctx.beginPath();
    ctx.roundRect(-bodyRadius - 4, -bodyHeight + 2, 5, 11, [4, 4, 3, 3]);
    ctx.roundRect(bodyRadius - 1, -bodyHeight + 2, 5, 11, [4, 4, 3, 3]);
    ctx.fill();
    ctx.stroke();

    // Gương hộ tâm / Tâm kính tròn trước ngực
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, -bodyHeight + 8, 4.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Đai lưng chiến tướng (War belt)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-bodyRadius + 1, -6, bodyRadius * 2 - 2, 4);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-3, -7, 6, 6);

    // 4. Đầu tròn bot (Head)
    const headRadius = 13;
    const headY = -31;
    ctx.fillStyle = '#efd0a1';
    ctx.beginPath();
    ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 5. Khuôn mặt & Râu quan tướng uy nghiêm
    const lookX = Math.cos(g.aimAngle || 0) * 2.5;
    const lookY = Math.sin(g.aimAngle || 0) * 1.5;
    const eyeY = headY - 1;

    // Râu quan tướng
    ctx.fillStyle = '#1e272e';
    if (g.weapon === 'blade') {
      // Trấn Viện: Râu dài tam chòm uy dũng
      ctx.beginPath();
      ctx.moveTo(-6, headY + 5);
      ctx.quadraticCurveTo(0, headY + 18, 6, headY + 5);
      ctx.quadraticCurveTo(0, headY + 8, -6, headY + 5);
      ctx.fill();
    } else if (g.weapon === 'spear') {
      // Tiền Phong: Ria mép sắc sảo
      ctx.beginPath();
      ctx.moveTo(-6, headY + 4);
      ctx.quadraticCurveTo(0, headY + 2, 6, headY + 4);
      ctx.lineTo(4, headY + 6);
      ctx.lineTo(-4, headY + 6);
      ctx.closePath();
      ctx.fill();
    } else {
      // Hộ Pháp: Râu quai nón rậm rạp
      ctx.beginPath();
      ctx.arc(0, headY + 4, headRadius - 2, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.quadraticCurveTo(0, headY + 16, -headRadius + 3, headY + 7);
      ctx.fill();
    }

    // Lông mày tướng quân rậm xếch
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-8, headY - 4); ctx.lineTo(-2, headY - 2);
    ctx.moveTo(8, headY - 4); ctx.lineTo(2, headY - 2);
    ctx.stroke();

    // Mắt bot hoạt họa
    ctx.fillStyle = '#1e272e';
    ctx.beginPath();
    ctx.arc(-4.5 + lookX, eyeY + lookY, 2.0, 0, Math.PI * 2);
    ctx.arc(4.5 + lookX, eyeY + lookY, 2.0, 0, Math.PI * 2);
    ctx.fill();

    // 6. Mũ Thiết Khôi quan tướng cổ phong (General Helmet)
    ctx.fillStyle = g.armorCol;
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, headY - 2, headRadius + 1.5, Math.PI * 0.85, Math.PI * 2.15);
    ctx.fill();
    ctx.stroke();

    // Viền mũ bọc vàng
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.rect(-headRadius - 1.5, headY - 3, (headRadius + 1.5) * 2, 3.5);
    ctx.fill();
    ctx.stroke();

    // Đỉnh chóp mũ
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(0, headY - headRadius - 7);
    ctx.lineTo(-4, headY - headRadius);
    ctx.lineTo(4, headY - headRadius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Chùm lông mao đỏ tung bay (Red plume)
    const plumeWave = Math.sin(time * 7 + (g.aimAngle || 0)) * 5;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(0, headY - headRadius - 6);
    ctx.quadraticCurveTo(-6 - facing * 6 + plumeWave, headY - headRadius - 16, -12 - facing * 8 + plumeWave, headY - headRadius - 10);
    ctx.quadraticCurveTo(-4 - facing * 4, headY - headRadius - 6, 0, headY - headRadius - 6);
    ctx.fill();

    // 7. Bàn tay lơ lửng & Vũ khí (Floating Hands & Weapons)
    ctx.save();
    ctx.translate(0, -12);
    ctx.rotate(g.aimAngle || 0);

    const attackThrust = (g.swingTimer > 0) ? Math.sin((g.swingTimer / 0.35) * Math.PI) * 16 : (g.attackCooldown > 0.8 ? Math.sin((g.attackCooldown - 0.8) / 0.5 * Math.PI) * 12 : 0);
    ctx.translate(attackThrust, 0);

    const drawHand = (hx, hy) => {
      ctx.fillStyle = '#efd0a1';
      ctx.strokeStyle = '#1e272e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(hx, hy, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };

    if (g.weapon === 'blade') {
      // Thanh Long Đại Đao
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-16, 4);
      ctx.lineTo(26, 4);
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(24, 1, 6, 6);

      ctx.fillStyle = '#f1f5f9';
      ctx.strokeStyle = '#1e272e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(30, 4);
      ctx.quadraticCurveTo(46, -2, 54, 12);
      ctx.lineTo(46, 12);
      ctx.quadraticCurveTo(38, 6, 30, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(28, 7); ctx.lineTo(24, 15); ctx.lineTo(30, 13);
      ctx.closePath();
      ctx.fill();

      drawHand(8, 4);
      drawHand(-6, 4);
    } else if (g.weapon === 'spear') {
      // Thiết Thương / Bát Trượng Mâu
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-18, 4);
      ctx.lineTo(36, 4);
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#1e272e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(36, 1);
      ctx.lineTo(50, 4);
      ctx.lineTo(36, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(34, 4); ctx.lineTo(28, 11); ctx.lineTo(36, 8);
      ctx.closePath();
      ctx.fill();

      drawHand(14, 4);
      drawHand(-4, 4);
    } else {
      // Kim Qua / Thiết Chùy Bát Giác
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-14, 4);
      ctx.lineTo(24, 4);
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#1e272e';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.rect(22, -4, 14, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(26, -4, 6, 16);

      drawHand(10, 4);
      drawHand(-6, 4);
    }
    ctx.restore();

    ctx.restore();

    // 8. Thanh máu và danh hiệu trên đầu tướng quân
    ctx.save();
    const pct = Math.max(0, g.currentHp / g.maxHp);
    const barW = 46;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(g.x - barW / 2 - 1, g.y - 48, barW + 2, 7, 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = pct > 0.4 ? '#22c55e' : '#ef4444';
    ctx.fillRect(g.x - barW / 2, g.y - 47, barW * pct, 5);

    ctx.font = 'bold 9.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = '#0f172a';
    const titleText = `🎋 ${g.title}`;
    ctx.strokeText(titleText, g.x, g.y - 53);
    ctx.fillStyle = '#fef08a';
    ctx.fillText(titleText, g.x, g.y - 53);
    ctx.restore();
  },

  drawLegion(ctx, leg) {
    // 1. Vẽ Tướng Cưỡi Ngựa (Mounted General on Horseback)
    if (leg.general) {
      this.drawMountedGeneral(ctx, leg.general, leg);
    }

    // 2. Vẽ Các Binh Sĩ Hộ Vệ Đi Theo (Escort Soldiers)
    if (leg.soldiers) {
      for (const sol of leg.soldiers) {
        this.drawEscortSoldier(ctx, sol);
      }
    }
  },

  drawMountedGeneral(ctx, gen, leg) {
    const time = this.clock || 0;
    const facing = Math.cos(gen.aimAngle || 0) < 0 ? -1 : 1;
    const gallop = Math.sin(gen.gallopPhase || (time * 12));
    const gallopBob = Math.abs(gallop) * 4;

    ctx.save();
    ctx.translate(gen.x, gen.y);

    // Bóng chiến mã
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 26, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nhịp phi nước đại
    ctx.translate(0, -gallopBob);
    ctx.scale(facing, 1);

    // 1. VẼ CHIẾN MÃ HOẠT HỌA THEO PHONG CÁCH BOT (Cartoon Warhorse)
    // 4 Chân ngựa chạy nước đại
    const legSwing = gallop * 8;
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    // Chân sau
    ctx.beginPath();
    ctx.moveTo(-14, 6); ctx.lineTo(-18 - legSwing, 18);
    ctx.moveTo(-8, 6); ctx.lineTo(-10 + legSwing, 18);
    // Chân trước
    ctx.moveTo(10, 6); ctx.lineTo(12 + legSwing, 18);
    ctx.moveTo(16, 6); ctx.lineTo(20 - legSwing, 18);
    ctx.stroke();

    // Móng ngựa viền đậm
    ctx.fillStyle = '#1e272e';
    [[-18 - legSwing, 18], [-10 + legSwing, 18], [12 + legSwing, 18], [20 - legSwing, 18]].forEach(([hx, hy]) => {
      ctx.fillRect(hx - 2, hy - 2, 4, 3);
    });

    // Đuôi ngựa hoạt họa
    const tailSway = Math.sin(time * 10) * 5;
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.moveTo(-22, -2);
    ctx.quadraticCurveTo(-32, 2 + tailSway, -36, 12 + tailSway);
    ctx.quadraticCurveTo(-28, 10, -20, 4);
    ctx.closePath();
    ctx.fill();

    // Thân ngựa tròn viên nhộng ngang (Horizontal Capsule)
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.roundRect(-22, -8, 44, 20, [11, 11, 10, 10]);
    ctx.fill();
    ctx.stroke();

    // Thảm yên Trúc Lâm thêu gấm đỏ & viền vàng
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.roundRect(-10, -10, 20, 13, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-8, 0, 16, 2.5);

    // Cổ và đầu chiến mã hoạt họa
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(12, -4);
    ctx.lineTo(22, -18);
    ctx.lineTo(34, -14);
    ctx.lineTo(36, -6);
    ctx.lineTo(20, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Mũi ngựa & má
    ctx.fillStyle = '#9a3412';
    ctx.beginPath();
    ctx.arc(33, -10, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Tai ngựa vểnh
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(21, -18); ctx.lineTo(23, -25); ctx.lineTo(26, -17);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Mắt ngựa hoạt họa to tròn
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(27, -13, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e272e';
    ctx.beginPath();
    ctx.arc(28, -13, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Dây cương vàng
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(33, -9); ctx.lineTo(16, -16); ctx.lineTo(0, -16);
    ctx.stroke();

    // Bờm ngựa
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.moveTo(15, -6); ctx.lineTo(21, -18); ctx.lineTo(17, -14); ctx.lineTo(13, -4);
    ctx.closePath();
    ctx.fill();

    // 2. VẼ TƯỚNG QUÂN TRÊN LƯNG NGỰA THEO PHONG CÁCH BOT PAWN
    ctx.save();
    ctx.translate(0, -18); // Ngồi trên yên ngựa

    // Áo choàng đỏ bay phần phật sau lưng
    const capeFly = Math.sin(time * 12) * 5;
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-8, -14);
    ctx.quadraticCurveTo(-22, -8, -32 + capeFly, -2);
    ctx.lineTo(-26 + capeFly, 8);
    ctx.quadraticCurveTo(-14, 2, -6, -2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Thân tướng quân (Capsule Body)
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.roundRect(-10, -20, 20, 22, [9, 9, 7, 7]);
    ctx.fill();
    ctx.stroke();

    // Pauldrons vai giáp
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(-14, -18, 5, 9, 3);
    ctx.roundRect(9, -18, 5, 9, 3);
    ctx.fill();
    ctx.stroke();

    // Đai ngọc đỏ trước ngực
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-8, -12, 16, 3);
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(0, -10.5, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Đầu tướng quân
    const genHeadY = -29;
    ctx.fillStyle = '#efd0a1';
    ctx.beginPath();
    ctx.arc(0, genHeadY, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Mắt & lông mày cương nghị
    ctx.fillStyle = '#1e272e';
    ctx.beginPath();
    ctx.arc(3.5, genHeadY - 1, 1.8, 0, Math.PI * 2);
    ctx.arc(-2.5, genHeadY - 1, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(1, genHeadY - 4); ctx.lineTo(6, genHeadY - 3);
    ctx.stroke();

    // Mũ kim khôi + chùm lông vũ đỏ cao vút
    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, genHeadY - 2, 12, Math.PI * 0.85, Math.PI * 2.15);
    ctx.fill();
    ctx.stroke();
    // Chóp mũ
    ctx.beginPath();
    ctx.moveTo(0, genHeadY - 18); ctx.lineTo(-3, genHeadY - 11); ctx.lineTo(3, genHeadY - 11);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Lông phụng đỏ bay cao
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(0, genHeadY - 16);
    ctx.quadraticCurveTo(-10 + capeFly * 0.5, genHeadY - 26, -18 + capeFly, genHeadY - 20);
    ctx.quadraticCurveTo(-6, genHeadY - 16, 0, genHeadY - 16);
    ctx.fill();

    // Cán đại thương kỵ binh cắm cờ Trúc Lâm
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(-16, -6);
    ctx.lineTo(44, -12);
    ctx.stroke();

    // Mũi thương vàng sắc nhọn
    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(44, -15);
    ctx.lineTo(58, -12);
    ctx.lineTo(44, -9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cờ lệnh Trúc Lâm đuôi én
    const bannerWave = Math.sin(time * 8) * 4;
    ctx.fillStyle = '#b91c1c';
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(42, -12);
    ctx.lineTo(16, -24 + bannerWave);
    ctx.lineTo(24, -14 + bannerWave);
    ctx.lineTo(16, -4 + bannerWave);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Biểu tượng tre trên cờ
    ctx.font = 'bold 8px sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.fillText('🎋', 24, -12 + bannerWave);

    // 2 Bàn tay tướng quân
    const drawHand = (hx, hy) => {
      ctx.fillStyle = '#efd0a1';
      ctx.strokeStyle = '#1e272e';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(hx, hy, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };
    drawHand(14, -8);
    drawHand(-2, -6);

    ctx.restore(); // Xong Tướng
    ctx.restore(); // Xong Toàn bộ Kỵ Binh

    // Chữ đếm lùi thời gian (8 phút) trên đầu Tướng Cưỡi Ngựa (gọn gàng, không che khuất khung hình)
    ctx.save();
    const mm = Math.floor(leg.life / 60);
    const ss = Math.floor(leg.life % 60).toString().padStart(2, '0');
    const label = this.survivorEscortActive ? '🏇 Thiết Kỵ Tướng Quân' : (leg.marching ? '🏇 Thiết Kỵ (Xuất Quan)' : `🏇 Thiết Kỵ (${mm}:${ss})`);
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = '#0f172a';
    ctx.strokeText(label, gen.x, gen.y - 42);
    ctx.fillStyle = '#fde047';
    ctx.fillText(label, gen.x, gen.y - 42);
    ctx.restore();
  },

  drawEscortSoldier(ctx, sol) {
    const time = this.clock || 0;
    const bob = Math.abs(Math.sin(time * 12 + (sol.id === 'tl_guard_1' ? 0 : 3))) * 3.0;

    ctx.save();
    ctx.translate(sol.x, sol.y);

    // Bóng binh sĩ
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(0, -bob);

    // Thân viên nhộng lính hộ vệ
    const bodyHeight = 18;
    const bodyRadius = 10;
    ctx.fillStyle = '#0f766e';
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(-bodyRadius, -bodyHeight, bodyRadius * 2, bodyHeight + 5, [8, 8, 6, 6]);
    ctx.fill();
    ctx.stroke();

    // Giáp sắt che ngực
    ctx.fillStyle = '#475569';
    ctx.fillRect(-bodyRadius + 2, -bodyHeight + 4, bodyRadius * 2 - 4, 8);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.0;
    ctx.strokeRect(-bodyRadius + 2, -bodyHeight + 4, bodyRadius * 2 - 4, 8);

    // Đầu bot lính
    const headRadius = 11;
    const headY = -27;
    ctx.fillStyle = '#efd0a1';
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Mắt bot
    const lookX = Math.cos(sol.aimAngle || 0) * 2;
    const lookY = Math.sin(sol.aimAngle || 0) * 1.2;
    ctx.fillStyle = '#1e272e';
    ctx.beginPath();
    ctx.arc(-3.5 + lookX, headY - 1 + lookY, 1.6, 0, Math.PI * 2);
    ctx.arc(3.5 + lookX, headY - 1 + lookY, 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Mũ nón chiến binh Trúc Lâm hình chóp
    ctx.fillStyle = '#d97706';
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, headY - headRadius - 8);
    ctx.lineTo(headRadius + 5, headY - headRadius + 3);
    ctx.lineTo(-headRadius - 5, headY - headRadius + 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Nút đỏ trên chóp nón
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, headY - headRadius - 8, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Tay và vũ khí / khiên
    ctx.save();
    ctx.translate(0, -10);
    ctx.rotate(sol.aimAngle || 0);

    const drawHand = (hx, hy) => {
      ctx.fillStyle = '#efd0a1';
      ctx.strokeStyle = '#1e272e';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(hx, hy, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };

    // Khiên tròn Trúc Lâm ở tay trái
    ctx.fillStyle = '#b45309';
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(4, -9, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(4, -9, 3, 0, Math.PI * 2);
    ctx.fill();

    // Vũ khí tay phải
    if (sol.weapon === 'spear') {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(-10, 6);
      ctx.lineTo(26, 6);
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = '#1e272e';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(26, 3); ctx.lineTo(36, 6); ctx.lineTo(26, 9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      drawHand(8, 6);
    } else {
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = '#1e272e';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(2, 5); ctx.lineTo(22, 4); ctx.lineTo(24, 7); ctx.lineTo(2, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      drawHand(4, 6);
    }
    drawHand(4, -7);

    ctx.restore();
    ctx.restore();

    // Tên nhỏ trên đầu lính
    ctx.save();
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#0f172a';
    const sName = sol.name.replace('Trúc Lâm ', '🛡️ ');
    ctx.strokeText(sName, sol.x, sol.y - 34);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(sName, sol.x, sol.y - 34);
    ctx.restore();
  }
};
