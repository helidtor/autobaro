/**
 * monstersData.js - 50 loài Quái Vật qua 5 bậc & 10 World Boss Yêu Thần
 */
window.GameData = window.GameData || {};

window.GameData.Monsters = {
  // 1.1. BẬC LÂU LA (Minion / Grunt) - Thuần vật lý, không skill
  minions: [
    {
      id: 'spike_hare',
      name: 'Thỏ Gai',
      nameEn: 'Spike Hare',
      tier: 1,
      tierName: 'Lâu La',
      maxHp: 85,
      attack: 14,
      defense: 2,
      speed: 105,
      expReward: 35,
      dropTier: 'common',
      scale: 0.65,
      visual: {
        bodyColor: '#ecf0f1',
        detailColor: '#c0392b',
        type: 'beast',
        spikes: true,
        ears: 'long',
        eyeColor: '#e74c3c'
      },
      behavior: 'fast_crawling'
    },
    {
      id: 'dungeon_rat',
      name: 'Chuột Hầm Ngục',
      nameEn: 'Dungeon Rat',
      tier: 1,
      tierName: 'Lâu La',
      maxHp: 90,
      attack: 12,
      defense: 3,
      speed: 95,
      expReward: 30,
      dropTier: 'common',
      scale: 0.7,
      visual: {
        bodyColor: '#7f8c8d',
        detailColor: '#e056fd',
        type: 'rat',
        tail: true,
        eyeColor: '#f1c40f'
      },
      behavior: 'swarm'
    },
    {
      id: 'goblin_clubber',
      name: 'Goblin Cầm Gậy',
      nameEn: 'Goblin Clubber',
      tier: 1,
      tierName: 'Lâu La',
      maxHp: 120,
      attack: 16,
      defense: 5,
      speed: 80,
      expReward: 40,
      dropTier: 'common',
      scale: 0.8,
      visual: {
        bodyColor: '#27ae60',
        detailColor: '#795548',
        type: 'humanoid',
        weapon: 'club',
        pointedEars: true,
        eyeColor: '#d35400'
      },
      behavior: 'melee_hesitant'
    },
    {
      id: 'stone_monkey',
      name: 'Khỉ Đá Rừng Rậm',
      nameEn: 'Stone Monkey',
      tier: 1,
      tierName: 'Lâu La',
      maxHp: 110,
      attack: 15,
      defense: 6,
      speed: 90,
      expReward: 42,
      dropTier: 'common',
      scale: 0.75,
      visual: {
        bodyColor: '#95a5a6',
        detailColor: '#34495e',
        type: 'monkey',
        tail: true,
        eyeColor: '#e67e22'
      },
      behavior: 'pebble_thrower'
    },
    {
      id: 'rusty_skeleton',
      name: 'Khung Xương Rỉ Sét',
      nameEn: 'Rusty Skeleton',
      tier: 1,
      tierName: 'Lâu La',
      maxHp: 130,
      attack: 18,
      defense: 8,
      speed: 70,
      expReward: 45,
      dropTier: 'common',
      scale: 0.85,
      visual: {
        bodyColor: '#bdc3c7',
        detailColor: '#d35400',
        type: 'skeleton',
        weapon: 'rusty_sword',
        ribsVisible: true,
        eyeColor: '#3498db'
      },
      behavior: 'slow_chaser'
    },
    {
      id: 'cave_spiderling',
      name: 'Nhện Đất Nhỏ',
      nameEn: 'Cave Spiderling',
      tier: 1,
      tierName: 'Lâu La',
      maxHp: 95,
      attack: 17,
      defense: 4,
      speed: 100,
      expReward: 38,
      dropTier: 'common',
      scale: 0.7,
      visual: {
        bodyColor: '#2c3e50',
        detailColor: '#8e44ad',
        type: 'spider',
        legs: 8,
        eyeColor: '#e74c3c'
      },
      behavior: 'pouncer'
    },
    {
      id: 'armored_beetle',
      name: 'Bọ Cánh Cứng Bọc Giáp',
      nameEn: 'Armored Beetle',
      tier: 1,
      tierName: 'Lâu La',
      maxHp: 150,
      attack: 15,
      defense: 16,
      speed: 65,
      expReward: 45,
      dropTier: 'common',
      scale: 0.8,
      visual: {
        bodyColor: '#16a085',
        detailColor: '#2c3e50',
        type: 'beetle',
        horn: 'y_horn',
        eyeColor: '#f1c40f'
      },
      behavior: 'head_rammer'
    },
    {
      id: 'shambling_zombie',
      name: 'Thây Ma Rách Rưới',
      nameEn: 'Shambling Zombie',
      tier: 1,
      tierName: 'Lâu La',
      maxHp: 180,
      attack: 20,
      defense: 7,
      speed: 55,
      expReward: 48,
      dropTier: 'common',
      scale: 0.9,
      visual: {
        bodyColor: '#1abc9c',
        detailColor: '#7f8c8d',
        type: 'zombie',
        tatteredClothes: true,
        eyeColor: '#ffffff'
      },
      behavior: 'slow_tank'
    },
    {
      id: 'grass_viper',
      name: 'Rắn Cỏ Đồng Cỏ',
      nameEn: 'Grass Viper',
      tier: 1,
      tierName: 'Lâu La',
      maxHp: 80,
      attack: 19,
      defense: 3,
      speed: 105,
      expReward: 36,
      dropTier: 'common',
      scale: 0.65,
      visual: {
        bodyColor: '#2ecc71',
        detailColor: '#f39c12',
        type: 'snake',
        eyeColor: '#e74c3c'
      },
      behavior: 'hit_and_run'
    },
    {
      id: 'starving_wolf',
      name: 'Sói Hoang Đói Ăn',
      nameEn: 'Starving Wolf',
      tier: 1,
      tierName: 'Lâu La',
      maxHp: 115,
      attack: 18,
      defense: 6,
      speed: 95,
      expReward: 44,
      dropTier: 'common',
      scale: 0.8,
      visual: {
        bodyColor: '#7f8c8d',
        detailColor: '#c0392b',
        type: 'wolf',
        eyeColor: '#e67e22'
      },
      behavior: 'back_chaser'
    }
  ],

  // 1.2. BẬC YÊU THÚ (Beast) - Có 1 Kỹ năng Nội tại đặc thù
  beasts: [
    {
      id: 'ironspine_boar',
      name: 'Heo Rừng Gai Bọc Sắt',
      nameEn: 'Ironspine Boar',
      tier: 2,
      tierName: 'Yêu Thú',
      maxHp: 320,
      attack: 28,
      defense: 22,
      speed: 85,
      expReward: 90,
      dropTier: 'rare',
      scale: 1.1,
      visual: {
        bodyColor: '#795548',
        detailColor: '#bdc3c7',
        type: 'boar',
        spikes: true,
        tusks: true,
        eyeColor: '#c0392b'
      },
      passive: {
        id: 'iron_spikes',
        name: 'Gai Phản Phệ',
        desc: 'Phản lại 20% sát thương cận chiến thành sát thương vật lý.',
        reflectPercent: 0.2
      }
    },
    {
      id: 'swamp_serpent',
      name: 'Mãng Xà Đầm Lầy',
      nameEn: 'Swamp Serpent',
      tier: 2,
      tierName: 'Yêu Thú',
      maxHp: 260,
      attack: 32,
      defense: 12,
      speed: 90,
      expReward: 95,
      dropTier: 'rare',
      scale: 1.05,
      visual: {
        bodyColor: '#16a085',
        detailColor: '#8e44ad',
        type: 'serpent',
        hood: true,
        eyeColor: '#9b59b6'
      },
      passive: {
        id: 'deadly_bite',
        name: 'Vết Đớp Kịch Độc',
        desc: 'Đòn đánh tích lũy độc rút 2% máu tối đa mỗi giây trong 4s.',
        poisonDotPercent: 0.02,
        poisonDuration: 4
      }
    },
    {
      id: 'magma_toad',
      name: 'Cóc Lửa Nham Thạch',
      nameEn: 'Magma Toad',
      tier: 2,
      tierName: 'Yêu Thú',
      maxHp: 300,
      attack: 26,
      defense: 18,
      speed: 70,
      expReward: 92,
      dropTier: 'rare',
      scale: 1.0,
      visual: {
        bodyColor: '#c0392b',
        detailColor: '#f39c12',
        type: 'toad',
        glow: true,
        eyeColor: '#f1c40f'
      },
      passive: {
        id: 'lava_puddle',
        name: 'Tàn Nham Bốc Cháy',
        desc: 'Khi bị đánh trúng, phun vệt lửa nhỏ gây sát thương duy trì dưới chân.',
        burnField: true
      }
    },
    {
      id: 'shadow_panther',
      name: 'Hắc Báo Ám Ảnh',
      nameEn: 'Shadow Panther',
      tier: 2,
      tierName: 'Yêu Thú',
      maxHp: 240,
      attack: 38,
      defense: 14,
      speed: 110,
      expReward: 100,
      dropTier: 'rare',
      scale: 1.05,
      visual: {
        bodyColor: '#1e272e',
        detailColor: '#9b59b6',
        type: 'panther',
        shadowTrail: true,
        eyeColor: '#a29bfe'
      },
      passive: {
        id: 'stealth_strike',
        name: 'Săn Mồi Vô Tích',
        desc: 'Tăng 40% sát thương đòn đánh đầu tiên nếu xuất kích từ bụi rậm.',
        ambushBonus: 0.4
      }
    },
    {
      id: 'frost_ursa',
      name: 'Gấu Băng Bắc Địa',
      nameEn: 'Frost Ursa',
      tier: 2,
      tierName: 'Yêu Thú',
      maxHp: 380,
      attack: 30,
      defense: 25,
      speed: 75,
      expReward: 105,
      dropTier: 'rare',
      scale: 1.2,
      visual: {
        bodyColor: '#dff9fb',
        detailColor: '#0984e3',
        type: 'bear',
        iceClaws: true,
        eyeColor: '#74b9ff'
      },
      passive: {
        id: 'extreme_frost',
        name: 'Hàn Khí Cực Hạn',
        desc: 'Mỗi đòn đánh làm chậm 15% tốc chạy và tốc đánh của đối thủ (cộng dồn 2 lần).',
        slowPercent: 0.15,
        maxStacks: 2
      }
    },
    {
      id: 'vampire_bat',
      name: 'Dơi Quỷ Hút Máu',
      nameEn: 'Vampire Bat',
      tier: 2,
      tierName: 'Yêu Thú',
      maxHp: 220,
      attack: 34,
      defense: 10,
      speed: 105,
      expReward: 92,
      dropTier: 'rare',
      scale: 0.95,
      visual: {
        bodyColor: '#2d3436',
        detailColor: '#d63031',
        type: 'bat',
        wings: true,
        eyeColor: '#ff7675'
      },
      passive: {
        id: 'blood_drain',
        name: 'Hút Máu Tươi',
        desc: 'Hồi phục 35% sát thương vật lý gây ra thành máu.',
        lifeSteal: 0.35
      }
    },
    {
      id: 'sand_trapper',
      name: 'Nhện Bẫy Cát',
      nameEn: 'Sand Trapper',
      tier: 2,
      tierName: 'Yêu Thú',
      maxHp: 270,
      attack: 29,
      defense: 16,
      speed: 85,
      expReward: 96,
      dropTier: 'rare',
      scale: 1.0,
      visual: {
        bodyColor: '#fdcb6e',
        detailColor: '#d35400',
        type: 'spider',
        legs: 8,
        eyeColor: '#e17055'
      },
      passive: {
        id: 'web_bind',
        name: 'Mạng Tơ Ràng Buộc',
        desc: 'Đòn đánh thứ 3 trói chân mục tiêu tại chỗ trong 1.2s.',
        rootInterval: 3,
        rootDuration: 1.2
      }
    },
    {
      id: 'ancient_rock_crab',
      name: 'Cua Đá Cổ Đại',
      nameEn: 'Ancient Rock Crab',
      tier: 2,
      tierName: 'Yêu Thú',
      maxHp: 420,
      attack: 22,
      defense: 35,
      speed: 60,
      expReward: 100,
      dropTier: 'rare',
      scale: 1.15,
      visual: {
        bodyColor: '#636e72',
        detailColor: '#00cec9',
        type: 'crab',
        rockShell: true,
        eyeColor: '#81ecec'
      },
      passive: {
        id: 'fossil_shell',
        name: 'Vỏ Hóa Thạch',
        desc: 'Giảm cố định 15 điểm sát thương nhận vào từ mọi nguồn đánh thường.',
        flatDamageReduction: 15
      }
    },
    {
      id: 'alpha_timberwolf',
      name: 'Sói Đầu Đàn Xám',
      nameEn: 'Alpha Timberwolf',
      tier: 2,
      tierName: 'Yêu Thú',
      maxHp: 310,
      attack: 35,
      defense: 18,
      speed: 95,
      expReward: 105,
      dropTier: 'rare',
      scale: 1.1,
      visual: {
        bodyColor: '#b2bec3',
        detailColor: '#d63031',
        type: 'wolf',
        mane: true,
        eyeColor: '#e74c3c'
      },
      passive: {
        id: 'howl_haste',
        name: 'Tiếng Hú Thúc Ép',
        desc: 'Tự tăng 20% tốc chạy và 15% hút máu khi máu dưới 50%.',
        lowHpSpeedBuff: 0.2,
        lowHpLifeStealBuff: 0.15
      }
    },
    {
      id: 'rotting_treant',
      name: 'Ma Cây Rừng Già',
      nameEn: 'Rotting Treant',
      tier: 2,
      tierName: 'Yêu Thú',
      maxHp: 450,
      attack: 26,
      defense: 24,
      speed: 55,
      expReward: 110,
      dropTier: 'rare',
      scale: 1.25,
      visual: {
        bodyColor: '#535c68',
        detailColor: '#6ab04c',
        type: 'treant',
        branches: true,
        eyeColor: '#badc58'
      },
      passive: {
        id: 'root_regen',
        name: 'Hấp Thụ Thổ Nhưỡng',
        desc: 'Tự hồi phục 1.5% máu tối đa mỗi giây nếu đứng yên trong 3 giây.',
        idleRegenPercent: 0.015
      }
    }
  ],

  // 1.3. BẬC YÊU TƯỚNG (General / Elite) - 1 Nội tại + 2 Kỹ năng chủ động
  generals: [
    {
      id: 'executioner_golem',
      name: 'Đao Phủ Đoạt Mệnh',
      nameEn: 'Executioner Golem',
      tier: 3,
      tierName: 'Yêu Tướng',
      maxHp: 900,
      attack: 55,
      defense: 35,
      speed: 70,
      expReward: 250,
      dropTier: 'super_rare',
      scale: 1.4,
      visual: {
        bodyColor: '#2f3542',
        detailColor: '#ff4757',
        type: 'golem',
        bigWeapon: 'giant_axe',
        cracksLava: true,
        eyeColor: '#ffa502'
      },
      passive: { name: 'Lưỡi Đao Tàn Tạ', desc: 'Tăng 30% sát thương lên mục tiêu dưới 40% máu.' },
      skills: [
        { id: 'cleave_smash', name: 'Chém Bổ Đầu', cooldown: 8, stunDuration: 1.5, type: 'leap_smash' },
        { id: 'axe_spin', name: 'Xoay Rìu Cuồng Bạo', cooldown: 10, knockback: 40, type: 'whirlwind' }
      ]
    },
    {
      id: 'naga_spitfire',
      name: 'Xà Tinh Đầm Lầy',
      nameEn: 'Naga Spitfire',
      tier: 3,
      tierName: 'Yêu Tướng',
      maxHp: 750,
      attack: 60,
      defense: 28,
      speed: 85,
      expReward: 240,
      dropTier: 'super_rare',
      scale: 1.35,
      visual: {
        bodyColor: '#009432',
        detailColor: '#1289A7',
        type: 'naga',
        serpentTail: true,
        acidSpitVfx: true,
        eyeColor: '#ED4C67'
      },
      passive: { name: 'Thân Thể Trơn Trượt', desc: 'Miễn làm chậm, 25% né đòn tầm xa.' },
      skills: [
        { id: 'acid_spit', name: 'Phun Axit Ăn Mòn', cooldown: 7, armorShredPercent: 0.4, type: 'projectile_aoe' },
        { id: 'tail_sweep', name: 'Đuôi Quét Sấm Sét', cooldown: 9, knockdownDuration: 1.2, type: 'cone_sweep' }
      ]
    },
    {
      id: 'centaur_warlord',
      name: 'Thống Lĩnh Nhân Mã',
      nameEn: 'Centaur Warlord',
      tier: 3,
      tierName: 'Yêu Tướng',
      maxHp: 880,
      attack: 52,
      defense: 32,
      speed: 95,
      expReward: 260,
      dropTier: 'super_rare',
      scale: 1.45,
      visual: {
        bodyColor: '#833471',
        detailColor: '#D980FA',
        type: 'centaur',
        bowAndSpear: true,
        eyeColor: '#B53471'
      },
      passive: { name: 'Chiến Ý Bất Bại', desc: 'Mất máu tăng tối đa 50% tốc đánh.' },
      skills: [
        { id: 'piercing_arrow', name: 'Mũi Tên Xuyên Phá', cooldown: 6, lineDistance: 120, type: 'pierce_line' },
        { id: 'gallop_charge', name: 'Xung Phong Rung Chuyển', cooldown: 11, knockback: 60, type: 'charge' }
      ]
    },
    {
      id: 'lich_acolyte',
      name: 'Hắc Vu Cốt Tinh',
      nameEn: 'Lich Acolyte',
      tier: 3,
      tierName: 'Yêu Tướng',
      maxHp: 680,
      attack: 68,
      defense: 22,
      speed: 75,
      expReward: 250,
      dropTier: 'super_rare',
      scale: 1.3,
      visual: {
        bodyColor: '#1e272e',
        detailColor: '#575fcf',
        type: 'undead_mage',
        skullFloating: true,
        staff: true,
        eyeColor: '#0be881'
      },
      passive: { name: 'Linh Hồn Hộ Mệnh', desc: 'Nhận lá chắn phép 20% HP tối đa mỗi 15s.' },
      skills: [
        { id: 'dark_fireball', name: 'Cầu Lửa Hắc Ám', cooldown: 5, burnDuration: 3, type: 'fireball' },
        { id: 'bone_cage', name: 'Vòng Khống Chế Địa Ngục', cooldown: 12, rootDuration: 2.0, type: 'cage' }
      ]
    },
    {
      id: 'gorilla_berserker',
      name: 'Tướng Quân Khỉ Đột',
      nameEn: 'Gorilla Berserker',
      tier: 3,
      tierName: 'Yêu Tướng',
      maxHp: 1050,
      attack: 58,
      defense: 40,
      speed: 75,
      expReward: 270,
      dropTier: 'super_rare',
      scale: 1.5,
      visual: {
        bodyColor: '#1e272e',
        detailColor: '#485460',
        type: 'ape',
        hugeArms: true,
        eyeColor: '#ff3f34'
      },
      passive: { name: 'Da Dày Thịt Béo', desc: 'Giảm 20% sát thương từ phía trước.' },
      skills: [
        { id: 'ground_pound', name: 'Đập Đất Liên Hoàn', cooldown: 8, slowPercent: 0.6, type: 'ground_slam' },
        { id: 'throw_boulder', name: 'Ném Tảng Đá Lớn', cooldown: 10, stunDuration: 1.2, type: 'boulder_throw' }
      ]
    }
  ],

  // 1.4. BẬC YÊU VƯƠNG (Lord / Boss 4 góc lãnh địa) - 2 Nội tại + 3 Kỹ năng + Combo
  lords: [
    {
      id: 'infernal_tyrant',
      name: 'Viêm Ma Bạo Chúa',
      nameEn: 'Infernal Tyrant',
      tier: 4,
      tierName: 'Yêu Vương',
      maxHp: 2400,
      attack: 90,
      defense: 50,
      speed: 80,
      expReward: 600,
      dropTier: 'supreme',
      scale: 1.9,
      corner: 'top_left',
      visual: {
        bodyColor: '#c0392b',
        detailColor: '#f39c12',
        type: 'demon_lord',
        flameAura: true,
        horns: true,
        lavaHammer: true,
        eyeColor: '#f1c40f'
      },
      passives: [
        { name: 'Thân Thể Dung Nham', desc: 'Thiêu đốt 35 sát thương phép/giây kẻ đứng gần.' },
        { name: 'Ý Chí Tro Tàn', desc: 'Máu < 30% tăng 40% tốc đánh và tốc chạy.' }
      ],
      skills: [
        { id: 'fire_pillars', name: 'Hỏa Trụ Tận Thế', cooldown: 9, pillars: 3, type: 'pillar_aoe' },
        { id: 'magma_hammer', name: 'Đập Búa Nham Thạch', cooldown: 11, lineCrack: 80, type: 'crack_slam' },
        { id: 'destroyer_roar', name: 'Gầm Thét Hủy Diệt', cooldown: 14, pushback: 70, type: 'heatwave' }
      ],
      combo: 'Hỏa Trụ trúng đích -> Lướt tới Đập Búa -> Gầm Thét kết liễu'
    },
    {
      id: 'primal_gorilla_sovereign',
      name: 'Cuồng Bạo Kim Cương Vương',
      nameEn: 'Primal Gorilla Sovereign',
      tier: 4,
      tierName: 'Yêu Vương',
      maxHp: 2800,
      attack: 95,
      defense: 55,
      speed: 85,
      expReward: 620,
      dropTier: 'supreme',
      scale: 2.0,
      corner: 'top_right',
      visual: {
        bodyColor: '#2d3436',
        detailColor: '#dfe6e9',
        type: 'titan_ape',
        hugeShoulders: true,
        silverback: true,
        eyeColor: '#d63031'
      },
      passives: [
        { name: 'Cơ Bắp Titan', desc: 'Giảm 35% sát thương nhận vào từ tầm xa.' },
        { name: 'Cuồng Chiến Đỉnh Điểm', desc: 'Mỗi 10% máu mất tăng 8% sát thương.' }
      ],
      skills: [
        { id: 'mega_boulder', name: 'Ném Cự Thạch Hủy Diệt', cooldown: 10, type: 'rolling_boulder' },
        { id: 'crater_leap', name: 'Nhảy Bổ Nghiền Nát', cooldown: 12, stunDuration: 2.0, type: 'leap_crater' },
        { id: 'fury_punches', name: 'Đấm Loạn Xạ 8 Nhịp', cooldown: 15, punchCount: 8, type: 'rapid_flurry' }
      ],
      combo: 'Nhảy Bổ làm choáng -> Đấm Loạn Xạ -> Ném Cự Thạch'
    },
    {
      id: 'emerald_hydra',
      name: 'Thanh Xà Đế Vương',
      nameEn: 'Emerald Hydra',
      tier: 4,
      tierName: 'Yêu Vương',
      maxHp: 2200,
      attack: 85,
      defense: 45,
      speed: 90,
      expReward: 590,
      dropTier: 'supreme',
      scale: 1.85,
      corner: 'bottom_left',
      visual: {
        bodyColor: '#00b894',
        detailColor: '#6c5ce7',
        type: 'three_headed_hydra',
        heads: 3,
        venomSpurt: true,
        eyeColor: '#fdcb6e'
      },
      passives: [
        { name: 'Tái Sinh Vảy Rồng', desc: 'Hồi phục 2% máu tối đa mỗi 3s.' },
        { name: 'Nọc Độc Ăn Mòn', desc: 'Độc trừ dần chỉ số phòng ngự.' }
      ],
      skills: [
        { id: 'triple_spray', name: 'Tam Đầu Phun Nọc', cooldown: 8, fanSpread: true, type: 'poison_fan' },
        { id: 'constrict', name: 'Quấn Quít Bóp Nghẹt', cooldown: 13, lockDuration: 2.5, type: 'lockdown' },
        { id: 'burrow_strike', name: 'Độn Thổ Xuất Kích', cooldown: 14, knockup: true, type: 'burrow' }
      ],
      combo: 'Độn Thổ hất tung -> Quấn Quít trói chân -> Tam Đầu Phun Nọc'
    },
    {
      id: 'lich_king',
      name: 'Lãnh Chúa Xương Vong Hồn',
      nameEn: 'Lich King',
      tier: 4,
      tierName: 'Yêu Vương',
      maxHp: 2000,
      attack: 105,
      defense: 40,
      speed: 75,
      expReward: 610,
      dropTier: 'supreme',
      scale: 1.8,
      corner: 'bottom_right',
      visual: {
        bodyColor: '#0984e3',
        detailColor: '#dfe6e9',
        type: 'floating_wraith',
        iceSpikesCrown: true,
        summonSkeletons: true,
        eyeColor: '#74b9ff'
      },
      passives: [
        { name: 'Hào Quang Tử Khí', desc: 'Giảm 20% sát thương kẻ địch trong bán kính 10 mét.' },
        { name: 'Hồn Ma Bảo Vệ', desc: 'Mỗi 10s triệu hồi 2 khung xương nhỏ chắn đạn.' }
      ],
      skills: [
        { id: 'blizzard_storm', name: 'Băng Phong Bão Tố', cooldown: 10, slowPercent: 0.5, type: 'storm_aoe' },
        { id: 'soul_chains', name: 'Xiềng Xích Linh Hồn', cooldown: 12, damageSharePercent: 0.5, type: 'chain_tether' },
        { id: 'death_scream', name: 'Tiếng Thét Đoạt Mệnh', cooldown: 15, silenceDuration: 3.0, type: 'silence_burst' }
      ],
      combo: 'Xiềng Xích kẻ địch -> Băng Phong Bão Tố -> Tiếng Thét câm lặng'
    }
  ],

  // 1.5. BẬC YÊU THẦN (World Boss Độc Nhất Trấn Giữ Trung Tâm Đền Cổ)
  // Mỗi trận ngẫu nhiên chọn 1 trong 10 thực thể sau
  worldBosses: [
    {
      id: 'chaos_void_drake',
      name: 'Thái Cổ Hỗn Độn Ma Long',
      nameEn: 'Chaos Void Drake',
      tier: 5,
      tierName: 'Yêu Thần (World Boss)',
      maxHp: 6500,
      attack: 160,
      defense: 75,
      speed: 95,
      expReward: 1500,
      godArtifactId: 'god_void_spear',
      godArtifactName: 'Long Thương Hỗn Độn Tận Thế',
      scale: 2.6,
      visual: {
        bodyColor: '#341f97',
        detailColor: '#ee5253',
        type: 'void_dragon',
        wingspan: 140,
        purpleFlames: true,
        horns: 4,
        eyeColor: '#ff9ff3'
      },
      passives: [
        'Chân Thân Hư Không (Miễn khống chế cứng)',
        'Ám Thị Toàn Tri (Phát hiện tàng hình toàn 20m)',
        'Long Lân Bất Diệt (Kháng 50% sát thương kỹ năng)',
        'Nhai Nuốt Sinh Linh (Hồi 1% HP mỗi khi có bot/quái chết)',
        'Tận Thế Giáng Lâm (HP < 20% sấm sét đánh ngẫu nhiên toàn map)'
      ],
      skills: [
        { id: 'void_breath', name: 'Long Tức Hủy Diệt', type: 'line_true_damage', length: 180 },
        { id: 'void_vortex', name: 'Bão Tố Hư Vô', type: 'pull_explosion', radius: 100 },
        { id: 'meteor_rain', name: 'Thiên Thạch Rơi Tự Do', type: 'meteors_cluster', count: 5 },
        { id: 'time_freeze', name: 'Đóng Băng Thời Gian', type: 'global_freeze', duration: 2.0 },
        { id: 'wing_gale', name: 'Cánh Quạt Chấn Động', type: 'knockback_silence', duration: 4.0 }
      ]
    },
    {
      id: 'eternal_solar_phoenix',
      name: 'Viêm Đế Phượng Hoàng',
      nameEn: 'Eternal Solar Phoenix',
      tier: 5,
      tierName: 'Yêu Thần (World Boss)',
      maxHp: 5800,
      attack: 175,
      defense: 65,
      speed: 110,
      expReward: 1500,
      godArtifactId: 'god_solar_bow',
      godArtifactName: 'Cung Thần Mặt Trời Thái Dương',
      scale: 2.4,
      visual: {
        bodyColor: '#e17055',
        detailColor: '#fdcb6e',
        type: 'solar_phoenix',
        blazingWings: true,
        fireTrail: true,
        eyeColor: '#d63031'
      },
      passives: [
        'Niết Bàn Tái Sinh (Sống lại 1 lần với 30% HP)',
        'Tỏa Nhiệt Cực Hạn (Cháy máu toàn khu vực đền)',
        'Lông Vũ Rực Lửa',
        'Bay Lượn Bất Khả Chạm',
        'Tinh Thần Bất Diệt'
      ],
      skills: [
        { id: 'solar_sea', name: 'Biển Lửa Thái Dương', type: 'fire_sea' },
        { id: 'dive_bomb', name: 'Lặn Lao Thiêu Rụi', type: 'flaming_dive' },
        { id: 'scorching_song', name: 'Tiếng Ca Bỏng Rát', type: 'soundwave_burn' },
        { id: 'wing_flare', name: 'Bão Cánh Mặt Trời', type: 'solar_burst' },
        { id: 'supernova', name: 'Tự Bạo Hạt Nhân', type: 'screen_flash_nuke' }
      ]
    },
    {
      id: 'world_eater_yggdrasil',
      name: 'Tru Tiên Thần Cây Cổ Đại',
      nameEn: 'World-Eater Yggdrasil',
      tier: 5,
      tierName: 'Yêu Thần (World Boss)',
      maxHp: 8000,
      attack: 140,
      defense: 90,
      speed: 40,
      expReward: 1500,
      godArtifactId: 'god_yggdrasil_staff',
      godArtifactName: 'Quyền Trượng Cổ Đại Yggdrasil',
      scale: 2.8,
      visual: {
        bodyColor: '#2d3436',
        detailColor: '#2ed573',
        type: 'ancient_world_tree',
        massiveRoots: true,
        canopyLeaves: true,
        sporesFalling: true,
        eyeColor: '#7bed9f'
      },
      passives: [
        'Rễ Bám Căn Nguyên',
        'Vỏ Gỗ Thần Thánh',
        'Hấp Thụ Phép Thuật',
        'Bào Tử Độc Tố',
        'Sinh Sôi Bất Tận'
      ],
      skills: [
        { id: 'heart_roots', name: 'Rễ Cây Xuyên Tim', type: 'ground_roots_pierce' },
        { id: 'thorn_rain', name: 'Mưa Hạt Gai Nhọn', type: 'thorn_barrage' },
        { id: 'branch_slam', name: 'Đập Cành Trời Giáng', type: 'massive_slam' },
        { id: 'sleep_spores', name: 'Bão Bào Tử Ngủ Say', type: 'spore_sleep' },
        { id: 'drain_vitality', name: 'Rút Cạn Sinh Lực', type: 'global_leech' }
      ]
    },
    {
      id: 'yama_death_arbiter',
      name: 'U Minh Diêm La Vương',
      nameEn: 'Yama - The Death Arbiter',
      tier: 5,
      tierName: 'Yêu Thần (World Boss)',
      maxHp: 6200,
      attack: 165,
      defense: 70,
      speed: 85,
      expReward: 1500,
      godArtifactId: 'god_death_tome',
      godArtifactName: 'Sổ Sinh Tử Diêm La',
      scale: 2.5,
      visual: {
        bodyColor: '#1e272e',
        detailColor: '#00d2d3',
        type: 'death_god',
        floatingTome: true,
        soulFlames: true,
        ghostCrown: true,
        eyeColor: '#54a0ff'
      },
      passives: [
        'Sổ Sinh Tử (Đánh dấu tử thần)',
        'Thân Xác Linh Hồn',
        'Trừ Hết Giáp Địch',
        'Đoạt Hồn Tăng Máu',
        'Ám Khí Tử Vong'
      ],
      skills: [
        { id: 'death_warrant', name: 'Trát Tử Hình', type: 'death_mark' },
        { id: 'reincarnation_doom', name: 'Phán Quyết Luân Hồi', type: 'judgment_strike' },
        { id: 'summon_ghost_army', name: 'Triệu Hồi Quỷ Binh', type: 'ghost_summons' },
        { id: 'underworld_rainbow', name: 'Cầu Vồng Âm Ti', type: 'dark_beam' },
        { id: 'five_horse_chains', name: 'Xích Trói Ngũ Mã', type: 'five_point_chains' }
      ]
    }
  ]
};

// Sinh cảnh cố định theo loài; mọi cá thể phải ở trong sinh cảnh này.
window.GameData.HabitatNames = {grassland:'Đồng cỏ',forest:'Rừng già',ruins:'Phế tích',marsh:'Đầm lầy',village:'Làng mạc',mountain:'Núi đá',lair:'Sào huyệt',temple:'Điện thờ'};
const monsterHabitats = {
 spike_hare:'grassland',dungeon_rat:'village',goblin_clubber:'village',stone_monkey:'forest',rusty_skeleton:'ruins',cave_spiderling:'mountain',armored_beetle:'mountain',shambling_zombie:'ruins',grass_viper:'grassland',starving_wolf:'forest',
 ironspine_boar:'forest',swamp_serpent:'marsh',magma_toad:'mountain',shadow_panther:'forest',frost_ursa:'mountain',vampire_bat:'ruins',sand_trapper:'grassland',ancient_rock_crab:'marsh',alpha_timberwolf:'forest',rotting_treant:'forest',
 executioner_golem:'mountain',naga_spitfire:'marsh',centaur_warlord:'grassland',lich_acolyte:'ruins',gorilla_berserker:'forest'
};
for (const definitions of Object.values(window.GameData.Monsters)) for (const def of definitions) def.habitat = monsterHabitats[def.id] || (def.tier===4?'lair':'temple');

// Fifth species appears only in the survivor's final hunt.
window.GameData.FinalLord = {...window.GameData.Monsters.lords[0],id:'ironhide_rhino_lord',name:'Thiết Giáp Tê Ngưu Vương',habitat:'lair',visual:{type:'rhino',bodyColor:'#768695'},passives:[{name:'Thiết Giáp Hộ Thể',flatDamageReduction:8},{name:'Ý Chí Sơn Vương'}],skills:[
 {id:'rhino_charge',name:'Thiết Giáp Xung Phong',type:'charge',cooldown:11},
 {id:'rhino_slam',name:'Địa Chấn Thiết Đề',type:'slam',cooldown:14},
 {id:'rhino_roar',name:'Gầm Thét Sơn Hà',type:'roar',cooldown:17}
]};

// Damage is the total budget for one cast, including every pulse.
window.GameData.MonsterTactics={
  "cleave_smash": [
    "line",
    1.5,
    0,
    1.1
  ],
  "axe_spin": [
    "circle",
    1.25,
    3,
    0.65
  ],
  "acid_spit": [
    "acid",
    1.1,
    3,
    0.8
  ],
  "tail_sweep": [
    "cone",
    1.1,
    0,
    0.75
  ],
  "piercing_arrow": [
    "line",
    1.35,
    0,
    1
  ],
  "gallop_charge": [
    "charge",
    1.25,
    0,
    0.9
  ],
  "dark_fireball": [
    "projectile",
    1.2,
    0,
    0.8
  ],
  "bone_cage": [
    "cage",
    0.9,
    0,
    1
  ],
  "ground_pound": [
    "ring",
    1.3,
    3,
    0.9
  ],
  "throw_boulder": [
    "projectile",
    1.4,
    0,
    1
  ],
  "fire_pillars": [
    "pillars",
    1.5,
    3,
    1
  ],
  "magma_hammer": [
    "fissure",
    1.5,
    0,
    1.1
  ],
  "destroyer_roar": [
    "cone",
    0.9,
    0,
    0.75
  ],
  "mega_boulder": [
    "projectile",
    1.6,
    0,
    1.1
  ],
  "crater_leap": [
    "leap",
    1.6,
    0,
    1.2
  ],
  "fury_punches": [
    "flurry",
    1.8,
    8,
    0.65
  ],
  "triple_spray": [
    "fan",
    1.4,
    3,
    0.9
  ],
  "constrict": [
    "tether",
    1.2,
    0,
    0.8
  ],
  "burrow_strike": [
    "leap",
    1.5,
    0,
    1.3
  ],
  "blizzard_storm": [
    "storm",
    1.5,
    0,
    1
  ],
  "soul_chains": [
    "tether",
    1.15,
    0,
    1
  ],
  "death_scream": [
    "interrupt",
    0.9,
    0,
    0.75
  ],
  "void_breath": [
    "beam",
    1.7,
    3,
    1.2
  ],
  "void_vortex": [
    "vortex",
    1.4,
    0,
    1.1
  ],
  "meteor_rain": [
    "pillars",
    1.8,
    5,
    1.1
  ],
  "time_freeze": [
    "freeze",
    0.7,
    0,
    1.5
  ],
  "wing_gale": [
    "cone",
    1.2,
    0,
    0.9
  ],
  "solar_sea": [
    "sea",
    1.7,
    0,
    1.2
  ],
  "dive_bomb": [
    "leap",
    1.7,
    0,
    1.3
  ],
  "scorching_song": [
    "song",
    1.3,
    3,
    1.1
  ],
  "wing_flare": [
    "fan",
    1.5,
    3,
    0.9
  ],
  "supernova": [
    "nuke",
    2,
    0,
    2.5
  ],
  "heart_roots": [
    "line",
    1.3,
    0,
    1
  ],
  "thorn_rain": [
    "pillars",
    1.5,
    4,
    1
  ],
  "branch_slam": [
    "cone",
    1.6,
    0,
    1.25
  ],
  "sleep_spores": [
    "spores",
    1,
    0,
    1.1
  ],
  "drain_vitality": [
    "leech",
    1.3,
    0,
    1.2
  ],
  "death_warrant": [
    "mark",
    0.6,
    0,
    0.85
  ],
  "reincarnation_doom": [
    "judgment",
    1.5,
    0,
    1.3
  ],
  "summon_ghost_army": [
    "ghost",
    1.5,
    3,
    1
  ],
  "underworld_rainbow": [
    "beam",
    1.6,
    3,
    1.2
  ],
  "five_horse_chains": [
    "chains",
    1.2,
    5,
    1.1
  ]
};

window.GameData.LowMonsterTactics={
  "spike_hare": [
    0.2,
    0.3,
    "unarmed"
  ],
  "dungeon_rat": [
    0.3,
    0.28,
    "unarmed"
  ],
  "goblin_clubber": [
    0.4,
    0.4,
    "hammer"
  ],
  "stone_monkey": [
    0.5,
    0.35,
    "bow"
  ],
  "rusty_skeleton": [
    0.3,
    0.3,
    "sword"
  ],
  "cave_spiderling": [
    0.24,
    0.32,
    "unarmed"
  ],
  "armored_beetle": [
    0.45,
    0.45,
    "hammer"
  ],
  "shambling_zombie": [
    0.5,
    0.5,
    "unarmed"
  ],
  "grass_viper": [
    0.2,
    0.4,
    "unarmed"
  ],
  "starving_wolf": [
    0.25,
    0.32,
    "unarmed"
  ],
  "ironspine_boar": [
    0.5,
    0.5,
    "hammer"
  ],
  "swamp_serpent": [
    0.45,
    0.4,
    "spear"
  ],
  "magma_toad": [
    0.55,
    0.45,
    "unarmed"
  ],
  "shadow_panther": [
    0.25,
    0.4,
    "dagger"
  ],
  "frost_ursa": [
    0.6,
    0.5,
    "hammer"
  ],
  "vampire_bat": [
    0.22,
    0.35,
    "unarmed"
  ],
  "sand_trapper": [
    0.5,
    0.45,
    "spear"
  ],
  "ancient_rock_crab": [
    0.65,
    0.5,
    "hammer"
  ],
  "alpha_timberwolf": [
    0.35,
    0.4,
    "sword"
  ],
  "rotting_treant": [
    0.7,
    0.55,
    "spear"
  ]
};

window.GameData.MonsterTacticDescriptions={
  "line": "Đòn khóa hướng; né ngang.",
  "cone": "Quét cung trước mặt; vòng sau.",
  "acid": "Vùng axit cắt đường 2s, phá giáp 25%.",
  "circle": "Vùng đánh quanh người.",
  "charge": "Lao thẳng bị tường chặn; hụt có hồi đòn.",
  "projectile": "Đạn va chạm; dùng vật cản.",
  "cage": "Hai rào có va chạm trong 2s, hai đầu mở.",
  "ring": "Vòng chấn có tâm an toàn.",
  "pillars": "Nhiều dấu khóa điểm đánh lần lượt, chia tổng damage.",
  "fissure": "Khe nóng khóa tuyến; rời hành lang.",
  "leap": "Điểm đáp khóa trước; có thể né và phản công.",
  "flurry": "Tám nhịp khóa hướng, chia tổng sát thương.",
  "fan": "Các tuyến hình quạt có khe né.",
  "tether": "Liên kết đứt khi quá 240px hoặc bị cover chắn.",
  "storm": "Vùng lạnh 2s, slow ngắn.",
  "interrupt": "Ngắt niệm trong cự ly; không khóa đòn thường.",
  "beam": "Tia khóa hướng rồi quét theo ba nhịp.",
  "vortex": "Vùng kéo bốn nhịp, có thể bước khỏi vùng.",
  "freeze": "Dấu thời gian trong 70px, choáng tối đa 0.6s.",
  "sea": "Vùng nóng có tâm an toàn.",
  "song": "Ba nhịp quanh người, có niệm.",
  "nuke": "Niệm 2.5s, nổ ở điểm khóa trước.",
  "spores": "Đứng trong vùng đủ lâu mới chịu choáng.",
  "leech": "Hút máu qua liên kết có thể cắt.",
  "mark": "Đặt dấu 5s, không tự tử hình.",
  "judgment": "Sát thương tăng 25% nếu dấu còn hiệu lực.",
  "ghost": "Ba vùng quỷ binh, không sinh thêm người tham chiến.",
  "chains": "Năm điểm dây xích có khe, slow hữu hạn."
};

// Authored species passives keep their identity; none falls back to generic guard.
const speciesPassives={"ironspine_boar":["Gai dựng có thời gian, đánh trực diện sẽ bị đẩy nhẹ; vòng sau khi gai đang mở."],"swamp_serpent":["Nọc tích tối đa ba dấu; rời giao tranh hoặc dùng giải độc hạ dấu, không lấy %HP vô hạn."],"magma_toad":["Bị đánh tích nhiệt; đủ ngưỡng nhả vũng lửa có báo trước, tạo quyết định đứng đánh hay đổi vị trí."],"shadow_panther":["Chỉ săn từ bụi khi chưa bị thấy; đòn xuất kích mở một bước bọc sườn, bị phát hiện thì mất lợi thế."],"frost_ursa":["Hai lần chạm liên tiếp tích Lạnh; bot rời cự ly để hạ dấu trước cú vồ kế."],"vampire_bat":["Hút máu cần bám mục tiêu trong một nhịp; đẩy/né/cover cắt hút, không hồi trên mọi DoT."],"sand_trapper":["Đủ ba đòn thật đặt tơ trên đất, cắt/burn được; không choáng tự động không có cảnh báo."],"ancient_rock_crab":["Mai chắn phía trước; kẹp hụt làm lộ bụng trong hồi động tác, không giảm damage mọi hướng."],"alpha_timberwolf":["Hú ở ít máu cần lấy đà, mở chạy bọc sườn nhưng hụt vồ sẽ mất nhịp săn."],"rotting_treant":["Đứng yên mọc rễ hồi ngắt được; địch lựa chọn ngắt hoặc lợi dụng cây mất di chuyển."],"executioner_golem":["Tích huyết ấn khi chém thật trúng; tới ngưỡng mở nhát bổ kết liễu có cảnh báo, không auto crit."],"naga_spitfire":["Trượt theo sườn sau đỡ/né, có cooldown; không random miễn đạn, vẫn bị kéo/tơ theo điều kiện."],"centaur_warlord":["Hụt một đòn cho nhịp phi nước đại ngắn để đổi góc; lao sai hướng tạo sơ hở."],"lich_acolyte":["Hồn hộ mệnh là một neo/lá chắn phá được; neo vỡ tạm ngừng khả năng dựng lồng."],"gorilla_berserker":["Chính diện tích lực đỡ, đòn cuối hụt/đánh sau lưng làm hết lực, không giáp mọi hướng."],"infernal_tyrant":["Vỏ dung nham tích nhiệt và để vùng nóng có thời hạn; tới ngưỡng phải xả, lúc xả giảm thủ.","Ít máu đổi nhịp combo sang nhanh/chậm xen kẽ; không chỉ cộng tốc đánh mãi."],"primal_gorilla_sovereign":["Gồng chắn đạn trước mặt, đánh sườn/ngắt gồng tạo cửa cận chiến.","Mất máu mở nối đòn thứ ba, nhưng tăng hồi động tác khi hụt chuỗi."],"emerald_hydra":["Lột vảy hồi ngắt được, để lại xác vảy cover tạm; không cộng hồi phần trăm liên tục trong combat.","Nọc làm suy yếu guard theo dấu có hạn; giải độc/rời vũng cắt chuỗi."],"lich_king":["Tử khí là vùng cần thoát, chủ động tắt nó để gom lực niệm chiêu; không aura toàn phòng.","Hai hồn chắn là hiệu ứng gắn boss, có charge chặn đạn và neo phá được, không hai thành viên combat mới."],"chaos_void_drake":["Miễn hard CC; mỗi lần phản công đúng cửa niệm phá một lớp ổn định, lộ cửa ngắt chiêu được đánh dấu.","Chỉ cảm nhận ẩn trong vùng đã dò có cảnh báo, không biết toàn bộ vị trí vô hình.","Vảy cường hóa theo hướng; đổi góc hoặc đánh vào phần vừa phóng long tức.","Chỉ nuốt hồn cục bộ nhìn thấy, có charge/trần và có thể bị cướp/cắt nghi lễ.","Ít máu mở sét theo lane báo trước quanh điện thờ, không đánh ngẫu nhiên mọi map."],"eternal_solar_phoenix":["Tái sinh một lần cần trứng/nhân lửa có countdown và cách phá; chết thật mới chạy countdown Thượng Cổ.","Nhiệt tích theo vùng; có đảo nguội và cách giải nhiệt, không cháy toàn đền không tránh được.","Lông rụng dựng những vệt lửa ngắn có thể dùng lạnh để tắt.","Bay đổi hướng theo nhịp, luôn có lúc đáp/niệm dễ bị đánh; không vô địch trước cận chiến.","Đỡ ngắt đúng nhịp làm phượng hoàng hao tinh thần, mở thời gian đáp thay miễn mọi ngắt."],"world_eater_yggdrasil":["Rễ nối theo neo; phá neo mở đường đi, cây cần tái bám mới hồi.","Vỏ gỗ phân đoạn hướng, đánh liên tiếp cùng phía mở vết nứt có hồi lại hữu hạn.","Hấp một projectile phép nạp vỏ; trộn đòn thường/phép phá nhịp, không hồi từ mọi magic hit.","Bào tử tích phơi nhiễm; rời vùng hoặc đốt vùng để giảm tích, không sleep ngay.","Mầm tái sinh là hiệu ứng neo giới hạn số lượng; phá mầm trước lượt hồi, không spawn thêm quái."],"yama_death_arbiter":["Dấu sổ cần hoàn tất hai điều kiện nhìn thấy; hủy một điều kiện làm yếu phán quyết.","Linh hồn chuyển đặc/vô hình theo nhịp có báo; luôn có cửa nhận đòn, không bỏ toàn bộ sát thương.","Chỉ lột một lớp guard/khiên khi phán quyết đủ điều kiện, không trừ mọi giáp vĩnh viễn.","Hồn rơi trong vùng giao tranh là charge nghi lễ; cắt niệm ngăn hồi, không mỗi cái chết toàn map đều hồi.","Ám khí đi theo bóng lane, rời bóng hoặc dùng sáng/phép phá dấu để tránh."],"ironhide_rhino_lord":["Giáp theo hướng, va cover đủ mạnh làm nứt và tạo cửa đánh vào thân.","Giữ sào huyệt, gầm lấy lại thế khi ít máu; ngắt gầm sẽ giữ điểm yếu lâu hơn."]};
for(const d of [...Object.values(window.GameData.Monsters).flat(),window.GameData.FinalLord]){const descriptions=speciesPassives[d.id];if(!descriptions)continue;const original=d.passives||(d.passive?[d.passive]:[]);d.passives=descriptions.map((desc,i)=>({id:d.id+'_passive_'+i,name:typeof original[i]==='string'?original[i].split(' (')[0]:original[i]?.name||'Đặc tính '+(i+1),desc,type:'species',species:d.id,index:i,cooldown:12+i*3}));delete d.passive;}
window.GameData.MonsterTactics.rhino_charge=['charge',1.4,0,1];window.GameData.MonsterTactics.rhino_slam=['ring',1.3,3,.9];window.GameData.MonsterTactics.rhino_roar=['cone',.8,0,.8];
window.GameData.MonsterSkillProgression={"cleave_smash":["Bổ điểm đã khóa; chém trượt cắm rìu, mở cửa đánh sườn.","Chém kẻ mất thế kéo hắn ra khỏi vị trí che chắn; không trừ HP theo %."],"axe_spin":["Hai nhịp quét có quãng nghỉ, đẩy ra mép thay xoay liên tục.","Dùng để cắt đường lùi sau nhát bổ; bot có thể chui qua khe đúng nhịp."],"acid_spit":["Đặt vũng axit cản lối và phủ dấu ăn mòn.","Đuôi quét đẩy vào vũng; thoát/giải độc cắt tích lũy, không mất giáp vĩnh viễn."],"tail_sweep":["Quét nửa vòng, đẩy theo hướng đầu đuôi.","Chọn hướng đẩy về axit khi nhìn thấy đường hợp lệ; bọc phía đầu để né."],"piercing_arrow":["Ngắm đường thẳng; xuyên một khiên yếu, dừng bởi kiến trúc.","Đánh dấu hành lang để chặn chạy; ép vào cover rồi áp sát từ góc khác."],"gallop_charge":["Nhân mã chạy một hành lang có điểm dừng rõ.","Dồn kẻ đang ngắm vào cover; va tường làm chính boss mất thế."],"dark_fireball":["Hỏa cầu để lại vùng hắc hỏa nhỏ, giảm hiệu quả hồi trong vùng có trần.","Chỉ phủ một lối ra của lồng, luôn để lối thoát khác."],"bone_cage":["Lồng có hai đầu mở, tường kỹ năng phá được.","Boss khóa một lối bằng cầu lửa sau quãng đọc; không tạo vòng nhốt kín."],"ground_pound":["Sóng đất nối nhau, vùng an toàn đổi vị trí giữa các nhịp.","Nhịp cuối làm rơi guard yếu nếu địch cố đứng đỡ mọi nhịp; không stun liên hoàn."],"throw_boulder":["Ném đá đọc hướng; cover chặn được và đá vụn tồn tại ngắn.","Có thể dùng đá vụn làm chỗ che khi hồi động tác; địch đổi góc phá thế thủ."],"fire_pillars":["Ba cột mọc lần lượt khóa các điểm cũ, luôn có khe.","Cột để nền nóng; nhịp cuối mở đường cho đập búa."],"magma_hammer":["Bổ búa hướng cố định, tạo rãnh lửa ngắn.","Va nền nóng gây xung hất khỏi nền, không cộng hai lần toàn bộ sát thương."],"destroyer_roar":["Hô có lấy đà; vòng đẩy phá ngắm/chuẩn bị ở gần.","Dùng khi bị áp sát hoặc bị ngắt liên tiếp; né ra rìa rồi phản công."],"mega_boulder":["Đá lớn chia lane thành hai đường vòng, không chặn mọi cửa.","Boss có thể đập đá của chính mình tạo vụn có cảnh báo."],"crater_leap":["Nhảy tới vị trí đã thấy; hố có cửa chạy qua giữa các sóng.","Nhảy dùng để cắt đường bắn, không cập nhật tọa độ tàng hình giữa không trung."],"fury_punches":["Tám đấm chia thành các cặp; chỉ xoay giữa cặp, cho đối thủ bọc sau.","Khi địch vỡ guard, boss tiếp tục cặp kế thay tự động kết liễu; hụt cuối lộ lưng."],"triple_spray":["Ba luồng nọc có khe khô; vị trí phủ khác nhau.","Quấn địch có nọc mở hút nhẹ, nhưng nọc không gây trừ giáp vô hạn."],"constrict":["Dây/quấn theo đường nhìn thấy, đứt bởi cover hoặc khoảng cách.","Tích áp lực trước bóp; bot đánh cắt/né/giải trói được trước khi hoàn tất."],"burrow_strike":["Dấu đất chạy tới vị trí cuối, chui lên có cảnh báo.","Bỏ vùng bị áp sát rồi tái xuất ở sườn; không xuyên tường, sào huyệt khác hay sông."],"blizzard_storm":["Vùng bão có mắt bão, tích Lạnh thay đóng băng tức thời.","Xiềng kéo về vành bão; cắt xiềng trước nhịp lạnh cuối để thoát."],"soul_chains":["Xích cần tầm nhìn và có điểm neo phá được.","Kéo một nhịp sau delay; cắt neo hoặc vòng cover để phá combo."],"death_scream":["Tiếng thét vùng nón ngắt kỹ năng đang niệm.","Dùng khi bị ép cận hoặc thấy địch đứng hồi; không ép mọi bot chạy vì sợ."],"void_breath":["Long tức quét một hành lang, boss chỉ xoay với tốc độ hữu hạn.","Trải tàn dư hư không; đổi phía trước khi bắt đầu quét, không bám đầu chính xác từng frame."],"void_vortex":["Hút theo nhịp có khe, không kéo xuyên kiến trúc.","Long tức hướng về cạnh vortex thay phủ toàn vùng cùng lúc."],"meteor_rain":["Thiên thạch khóa vị trí theo từng loạt, không rải kín điện thờ.","Các loạt hình khác nhau; bot có thể dùng hố tàn dư để che long tức."],"time_freeze":["Vùng thời gian cần tích phơi nhiễm; mép chạy ra được.","Chỉ đóng băng ngắn sau đủ tích lũy; boss cũng hồi động tác dài sau xả."],"wing_gale":["Quạt đẩy theo hướng; có khe sát sườn.","Xua địch khỏi cover để nối long tức nhưng không ép vào nước để đánh."],"solar_sea":["Biển lửa có đảo/khe an toàn được báo trước.","Đảo thay đổi từng nhịp; không khiến cả điện thờ đồng thời bắt buộc chịu damage."],"dive_bomb":["Lao xuống điểm cũ, để lông cháy trên đường bay.","Thả lông khóa một đường thoát; điểm đáp hụt làm lộ lõi."],"scorching_song":["Channel theo nhịp, vòng nhiệt đi ra ngoài.","Ngắt đúng nhịp dừng các vòng chưa phát; boss giữ lửa đã tạo, không mất hết chiêu."],"wing_flare":["Quạt lông lửa theo các quạt tách biệt.","Khi gặp vùng lạnh, lông tạo hơi nước có lợi/hại cho cả hai phía."],"supernova":["Tích lực dài, lõi hiện rõ; có cách ngắt hoặc chạy tới cover đúng điều kiện.","Niết bàn chỉ kích sau tử trận thật của lần đầu, không cộng thêm hồi trong lấy đà."],"heart_roots":["Rễ theo đường, đầu rễ là neo phá được.","Nối vào vùng bào tử để ép chọn cắt rễ hay bỏ vị trí."],"thorn_rain":["Mưa gai tạo bãi gai tạm có khoảng hở.","Cắt bãi gai bằng lửa/địa chấn; đòn thường đi qua vẫn có lối vòng."],"branch_slam":["Đập cành khóa hướng, nhịp thu cành tạo sơ hở.","Đập lên bãi gai đẩy gai một đoạn, không tạo sát thương kép tức thời."],"sleep_spores":["Phơi nhiễm liên tục mới ngủ, rời vùng làm giảm tích lũy.","Lửa tiêu vùng bào tử; ngủ chỉ một lần trong cửa miễn CC."],"drain_vitality":["Kênh hút có dây nhìn thấy, dừng khi cắt cover/tầm hoặc phá neo.","Boss dùng khi bot đang bị rễ; bot vẫn có một cửa hành động trước hút."],"death_warrant":["Dấu truy nã có thời gian và điều kiện, không phải án chết chắc.","Đỡ đúng/giải dấu tại điểm neo làm án bị hủy hoặc giảm cấp."],"reincarnation_doom":["Phán quyết cần dấu còn hiệu lực, lấy đà nhìn thấy.","Địch đã hủy dấu khiến boss hụt nghi lễ và lộ lõi; không bỏ qua mọi khiên/HP."],"summon_ghost_army":["Quỷ binh là hiệu ứng lane/vật chắn kỹ năng, không thêm thực thể tham chiến.","Bot phá banner/neo để dẹp một lane; tránh biến trận ba người thành đánh hội đồng."],"underworld_rainbow":["Đường quét theo màu/nhịp, tác dụng cắt đường.","Boss chọn đường đối thủ đã lộ, mỗi lần chỉ một hiệu ứng khống chế chính."],"five_horse_chains":["Các neo xích phát sáng, dây đứt theo khoảng cách/cover.","Phá một neo mở cửa thoát; boss không kéo xuyên tường hay giữ stun dài."],"rhino_charge":["Lao thiết giáp khóa hướng, va tường kỹ năng làm vỡ lớp giáp ngoài.","Đổi nhịp đầu trận/giữa trận; bot nhử lao vào cover để mở điểm yếu."],"rhino_slam":["Sóng chân vòng ngoài, phần sau lưng có khe.","Địch đứng đỡ liên tiếp bị áp lực stamina; hụt mở cửa loot/đánh trả."],"rhino_roar":["Gầm nạp giáp nhìn thấy được, có thể ngắt đúng nhịp.","Chỉ phục hồi lớp giáp tạm nếu không bị ngắt, không hồi HP vô hạn."]};

// Runtime boss ATK is authored directly; low-tier spawn reductions remain separate.
for(const d of [...window.GameData.Monsters.lords,...window.GameData.Monsters.worldBosses,window.GameData.FinalLord]){
 d.attack={infernal_tyrant:70,primal_gorilla_sovereign:80,emerald_hydra:60,lich_king:65,ironhide_rhino_lord:75,chaos_void_drake:105,eternal_solar_phoenix:95,world_eater_yggdrasil:80,yama_death_arbiter:100}[d.id];
}
