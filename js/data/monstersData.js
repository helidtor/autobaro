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
