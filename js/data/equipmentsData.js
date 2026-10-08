/**
 * equipmentsData.js - Trang Bị & Vũ Khí theo 5 Bậc Phẩm Chất
 * (Thường -> Hiếm -> Siêu Hiếm -> Cực Phẩm -> Thần Khí Độc Nhất)
 */
window.GameData = window.GameData || {};

window.GameData.Equipments = {
  // Cấu hình màu sắc theo bậc phẩm chất
  TIER_COLORS: {
    common: '#95a5a6',      // Xám trắng
    rare: '#2ecc71',        // Xanh lá
    super_rare: '#9b59b6',  // Tím
    supreme: '#e67e22',     // Cam vàng
    god: '#e74c3c'          // Đỏ rực rỡ / Thần bí
  },

  TIER_NAMES: {
    common: 'Thường',
    rare: 'Hiếm',
    super_rare: 'Siêu Hiếm',
    supreme: 'Cực Phẩm',
    god: 'Thần Khí'
  },

  // Danh mục Vũ khí
  weapons: {
    // 3.1. BẬC THƯỜNG (Common)
    w_rusty_axe: {
      id: 'w_rusty_axe',
      name: 'Rìu Gỗ Gãy',
      type: 'axe',
      classReq: 'warrior',
      tier: 'common',
      attack: 12,
      speed: 0.85,
      range: 35,
      weight: 'heavy',
      desc: 'Chiếc rìu thô sơ chém chậm nhưng có lực.'
    },
    w_rusty_sword: {
      id: 'w_rusty_sword',
      name: 'Kiếm Sắt Rỉ Sét',
      type: 'sword',
      classReq: 'warrior',
      tier: 'common',
      attack: 14,
      speed: 1.0,
      range: 35,
      weight: 'medium',
      desc: 'Thanh kiếm cùn nhặt từ bãi phế tích.'
    },
    w_wooden_wand: {
      id: 'w_wooden_wand',
      name: 'Que Đũa Phép Tre',
      type: 'staff',
      classReq: 'mage',
      tier: 'common',
      magicPower: 15,
      speed: 0.9,
      range: 90,
      weight: 'light',
      desc: 'Cành tre khô dẫn truyền một chút ma lực.'
    },
    w_crude_bow: {
      id: 'w_crude_bow',
      name: 'Cung Cành Tre',
      type: 'bow',
      classReq: 'archer',
      tier: 'common',
      attack: 13,
      speed: 1.1,
      range: 110,
      weight: 'light',
      desc: 'Cung buộc dây dừa đơn sơ săn bắt thỏ hoang.'
    },
    w_rusty_dagger: {
      id: 'w_rusty_dagger',
      name: 'Dao Găm Rỉ Sét',
      type: 'dagger',
      classReq: 'assassin',
      tier: 'common',
      attack: 11,
      critChance: 0.1,
      speed: 1.4,
      range: 25,
      weight: 'very_light',
      desc: 'Mũi dao găm sứt mẻ chuyên dùng rạch bao tải.'
    },
    w_hybrid_cane: {
      id: 'w_hybrid_cane',
      name: 'Gậy Ngắn Đa Năng',
      type: 'hybrid_cane',
      classReq: 'hybrid',
      tier: 'common',
      attack: 10,
      magicPower: 10,
      speed: 1.1,
      range: 35,
      weight: 'medium',
      desc: 'Vũ khí cân bằng đấm cận chiến và dẫn truyền phép.'
    },

    // 3.2. BẬC HIẾM (Rare)
    w_tempered_blade: {
      id: 'w_tempered_blade',
      name: 'Kiếm Thép Luyện Rắn',
      type: 'sword',
      classReq: 'warrior',
      tier: 'rare',
      attack: 28,
      defense: 5,
      speed: 1.05,
      range: 38,
      weight: 'medium',
      desc: '+15 Sát thương vật lý, thép tôi dầu bền bỉ.'
    },
    w_crystal_staff: {
      id: 'w_crystal_staff',
      name: 'Trượng Thủy Tinh Xanh',
      type: 'staff',
      classReq: 'mage',
      tier: 'rare',
      magicPower: 32,
      manaMax: 30,
      speed: 0.95,
      range: 100,
      weight: 'light',
      desc: '+20 Sát thương phép, ngọc xanh tích tụ linh khí.'
    },
    w_stag_bow: {
      id: 'w_stag_bow',
      name: 'Cung Sừng Hươu Nặng',
      type: 'bow',
      classReq: 'archer',
      tier: 'rare',
      attack: 26,
      critChance: 0.08,
      speed: 1.15,
      range: 130,
      weight: 'light',
      desc: '+16 Sát thương, cánh cung đàn hồi từ gạc hươu rừng.'
    },
    w_serrated_dagger: {
      id: 'w_serrated_dagger',
      name: 'Dao Găm Răng Cưa',
      type: 'dagger',
      classReq: 'assassin',
      tier: 'rare',
      attack: 22,
      critChance: 0.18,
      speed: 1.5,
      range: 28,
      weight: 'very_light',
      bleedOnHit: 0.02,
      desc: '+12 Sát thương, đòn đánh có 10% gây chảy máu.'
    },
    w_enchanted_shortblade: {
      id: 'w_enchanted_shortblade',
      name: 'Kiếm Ngắn Phép Thuật',
      type: 'sword',
      classReq: 'hybrid',
      tier: 'rare',
      attack: 20,
      magicPower: 20,
      speed: 1.2,
      range: 36,
      weight: 'medium',
      desc: '+10 Công vật lý, +10 Phép, cân bằng hoàn hảo.'
    },

    // 3.3. BẬC SIÊU HIẾM (Super Rare)
    w_steel_cleaver_axe: {
      id: 'w_steel_cleaver_axe',
      name: 'Rìu Chiến Chém Thép',
      type: 'axe',
      classReq: 'warrior',
      tier: 'super_rare',
      attack: 48,
      speed: 0.9,
      range: 40,
      weight: 'heavy',
      passive: 'Đòn đánh thường trừ 5 giáp địch, cộng dồn 4 lần',
      armorShredPerHit: 5,
      desc: 'Rìu chiến khổng lồ chém nát khiên giáp đối thủ.'
    },
    w_frost_pillar_staff: {
      id: 'w_frost_pillar_staff',
      name: 'Gậy Băng Trụ Vĩnh Cửu',
      type: 'staff',
      classReq: 'mage',
      tier: 'super_rare',
      magicPower: 54,
      speed: 1.0,
      range: 110,
      weight: 'light',
      passive: 'Kỹ năng phép làm chậm tăng thêm 20%',
      bonusSlowPct: 0.2,
      desc: 'Gậy kết tinh từ băng bắc địa ngưng đọng thời gian.'
    },
    w_tempest_bow: {
      id: 'w_tempest_bow',
      name: 'Cung Bão Tố Tật Phong',
      type: 'bow',
      classReq: 'archer',
      tier: 'super_rare',
      attack: 44,
      speed: 1.3,
      range: 140,
      weight: 'light',
      passive: 'Mỗi phát bắn tăng 4% tốc chạy trong 2s (cộng dồn 5 lần)',
      speedOnShoot: 0.04,
      desc: 'Cung gió thần tốc giúp cung thủ lướt nhẹ trên chiến trường.'
    },
    w_viper_venom_dagger: {
      id: 'w_viper_venom_dagger',
      name: 'Dao Găm Răng Rắn Kịch Độc',
      type: 'dagger',
      classReq: 'assassin',
      tier: 'super_rare',
      attack: 38,
      critChance: 0.25,
      speed: 1.6,
      range: 30,
      weight: 'very_light',
      passive: 'Tấn công mục tiêu dính độc hồi 5 HP cho bản thân',
      poisonLeechHp: 5,
      desc: 'Lưỡi dao nhúng nọc mãng xà đầm lầy xanh lét.'
    },

    // 3.4. BẬC CỰC PHẨM (Supreme - Rơi từ Yêu Vương)
    w_infernal_axe: {
      id: 'w_infernal_axe',
      name: 'Rìu Hủy Diệt Của Viêm Ma',
      type: 'axe',
      classReq: 'warrior',
      tier: 'supreme',
      attack: 85,
      speed: 0.95,
      range: 48,
      weight: 'heavy',
      passive: 'Tạo vệt dung nham cháy rực dưới chân mỗi nhát bổ',
      lavaSlash: true,
      desc: 'Rìu khổng lồ rỉ dung nham cháy xèo xèo từ Viêm Ma Bạo Chúa.'
    },
    w_black_panther_staff: {
      id: 'w_black_panther_staff',
      name: 'Trượng Hắc Báo Phẫn Nộ',
      type: 'staff',
      classReq: 'mage',
      tier: 'supreme',
      magicPower: 95,
      speed: 1.1,
      range: 125,
      weight: 'light',
      passive: 'Kỹ năng diện rộng AoE tăng gấp rưỡi bán kính tác động (+50%)',
      aoeRadiusBonus: 0.5,
      desc: 'Trượng khảm linh hồn hắc báo khuếch đại ma pháp khủng khiếp.'
    },
    w_thunderbird_bow: {
      id: 'w_thunderbird_bow',
      name: 'Cung Bão Tố Ưng Vương',
      type: 'bow',
      classReq: 'archer',
      tier: 'supreme',
      attack: 78,
      critChance: 0.35,
      speed: 1.45,
      range: 160,
      weight: 'light',
      passive: 'Mũi tên biến thành tia chớp giật nảy 3 mục tiêu xung quanh',
      chainLightningArrow: 3,
      desc: 'Mũi tên tích điện giật tung chiến trường từ Ưng Vương Sấm Sét.'
    },
    w_blood_lord_dagger: {
      id: 'w_blood_lord_dagger',
      name: 'Dao Găm Huyết Ma Vương',
      type: 'dagger',
      classReq: 'assassin',
      tier: 'supreme',
      attack: 72,
      critChance: 0.40,
      speed: 1.8,
      range: 32,
      weight: 'very_light',
      passive: 'Hút 25% máu gây ra chuyển hóa thành khiên ảo cho sát thủ',
      bloodShieldLeech: 0.25,
      desc: 'Lưỡi dao thèm khát máu tươi cướp sinh lực đối thủ thành lá chắn.'
    },

    // 3.5. BẬC THẦN KHÍ (God Artifacts - Độc nhất vô nhị từ World Boss)
    god_void_spear: {
      id: 'god_void_spear',
      name: 'Long Thương Hỗn Độn Tận Thế',
      type: 'spear',
      classReq: 'all',
      tier: 'god',
      attack: 130,
      speed: 1.3,
      range: 75,
      weight: 'divine',
      passive: 'Đòn đánh quét tia năng lượng tím 8m mang SÁT THƯƠNG CHUẨN. Miễn nhiễm hoàn toàn mọi khống chế cứng.',
      trueDamageBeam: true,
      ccImmunity: true,
      desc: 'Thần khí tối cao từ Thái Cổ Hỗn Độn Ma Long, biến người cầm thành chiến thần.'
    },
    god_solar_bow: {
      id: 'god_solar_bow',
      name: 'Cung Thần Mặt Trời Thái Dương',
      type: 'bow',
      classReq: 'all',
      tier: 'god',
      attack: 125,
      speed: 1.5,
      range: 280, // Gần như toàn màn hình
      weight: 'divine',
      passive: 'Tầm bắn bao quát toàn camera. Mũi tên nổ thành biển lửa thiêu đốt 5% máu tối đa/giây.',
      infiniteRange: true,
      solarBurnDot: 0.05,
      desc: 'Thần khí từ Viêm Đế Phượng Hoàng, thiêu rụi mọi thứ trong tầm mắt.'
    },
    god_yggdrasil_staff: {
      id: 'god_yggdrasil_staff',
      name: 'Quyền Trượng Cổ Đại Yggdrasil',
      type: 'staff',
      classReq: 'all',
      tier: 'god',
      magicPower: 140,
      defense: 40,
      speed: 1.2,
      range: 130,
      weight: 'divine',
      passive: 'Tự hồi phục 4% máu và mana mỗi giây. Rễ cây gai tự động mọc lên trói và đâm nát kẻ địch trong bán kính 12m.',
      regenAllPercent: 0.04,
      autoRootsAoe: true,
      desc: 'Thần khí từ Tru Tiên Thần Cây, sức mạnh sinh sôi bất diệt của đại ngàn.'
    },
    god_death_tome: {
      id: 'god_death_tome',
      name: 'Sổ Sinh Tử Diêm La',
      type: 'tome',
      classReq: 'all',
      tier: 'god',
      magicPower: 145,
      speed: 1.1,
      range: 150,
      weight: 'divine',
      passive: 'Tự động đánh dấu tử thần lên bot có máu cao nhất. Mỗi 10s giáng sét rút 20% máu bất kể khoảng cách.',
      deathMarkGlobal: true,
      desc: 'Thần khí phán quyết sinh tử từ U Minh Diêm La Vương.'
    }
  },

  // Hình dáng riêng từng vũ khí (weaponArt.js). Thiếu id => sinh tất định từ hash id.
  // fx = màu hào quang/rune; tint = màu kim loại; deco = rust|fuller|vein|gold.
  WEAPON_LOOKS: {
    w_rusty_axe: { head: 'hatchet', deco: ['rust'] },
    w_steel_cleaver_axe: { head: 'cleaver', top: 'spike', fx: '#a9c4ff' },
    w_infernal_axe: { head: 'double', top: 'spike', fx: '#ff6a2a', tint: '#e8b9a0' },
    w_rusty_sword: { blade: 'straight', len: 42, w: 3.5, guard: 'bar', pommel: 'ball', deco: ['rust'] },
    w_tempered_blade: { blade: 'katana', len: 48, w: 3.2, guard: 'disc', pommel: 'ring', deco: ['fuller'] },
    w_enchanted_shortblade: { blade: 'leaf', len: 38, w: 3.8, guard: 'wing', pommel: 'gem', deco: ['vein'], fx: '#6fe0ff' },
    w_wooden_wand: { head: 'wand' },
    w_hybrid_cane: { head: 'cane' },
    w_crystal_staff: { head: 'crystal', fx: '#5fe3ff' },
    w_frost_pillar_staff: { head: 'pillar', fx: '#8fe8ff' },
    w_black_panther_staff: { head: 'claws', fx: '#d04dff', shaft: '#1c1624' },
    god_yggdrasil_staff: { head: 'bough', fx: '#6dff9a', shaft: '#6b4a34' },
    w_crude_bow: { curve: 'short', tip: 'none', arrow: 'plain' },
    w_stag_bow: { curve: 'horn', tip: 'horn', arrow: 'tri' },
    w_tempest_bow: { curve: 'recurve', tip: 'wing', arrow: 'barbed', fx: '#7fd0ff' },
    w_thunderbird_bow: { curve: 'composite', tip: 'wing', arrow: 'barbed', fx: '#ffe14a' },
    god_solar_bow: { curve: 'sun', tip: 'orb', arrow: 'barbed', fx: '#ffb81f' },
    w_rusty_dagger: { blade: 'tanto', len: 26, w: 2.9, guard: 'bar', pommel: 'ball', deco: ['rust'] },
    w_serrated_dagger: { blade: 'serrated', len: 28, w: 2.6, guard: 'cross', pommel: 'spike' },
    w_viper_venom_dagger: { blade: 'kris', len: 30, w: 2.8, guard: 'wing', pommel: 'gem', deco: ['vein'], fx: '#7bff5a', tint: '#bfe8a8' },
    w_blood_lord_dagger: { blade: 'fang', len: 30, w: 3.2, guard: 'horn', pommel: 'crown', fx: '#ff3050', tint: '#e0a0a8' },
    god_void_spear: { head: 'trident', fx: '#b27cff', tint: '#d9c6ff', tassel: '#6d3fb0' },
    god_death_tome: { cover: '#2a1236', emblem: 'skull', chain: true, fx: '#c46bff' },
    relic_voidblade: { blade: 'flame', len: 34, w: 2.8, guard: 'disc', pommel: 'ring', fx: '#b782ff', tint: '#d9c6ff' },
    relic_halberd: { head: 'halberd', fx: '#f8b05b', tassel: '#d9a63a' },
    relic_greatbow: { curve: 'long', tip: 'orb', arrow: 'barbed', fx: '#ffe0a3' },
    relic_tome: { cover: '#4b2a6b', emblem: 'eye', fx: '#d7a0ff' }
  },

  // Danh mục Đồ Phòng Thủ (Paperdoll Helmets & Armors)
  armors: {
    // Thường
    a_straw_hat: { id: 'a_straw_hat', slot: 'head', name: 'Nón Rơm Rách', tier: 'common', defense: 2, hp: 20 },
    a_cloth_robe: { id: 'a_cloth_robe', slot: 'body', name: 'Áo Vải Gai Thô', tier: 'common', defense: 5, hp: 40 },

    // Hiếm
    a_guard_helmet: { id: 'a_guard_helmet', slot: 'head', name: 'Mũ Nồi Thép Lính Tuần', tier: 'rare', defense: 10, hp: 60 },
    a_studded_leather: { id: 'a_studded_leather', slot: 'body', name: 'Giáp Da Bọc Đinh Sắt', tier: 'rare', defense: 18, hp: 120 },

    // Siêu Hiếm
    a_dragon_iron_helm: { id: 'a_dragon_iron_helm', slot: 'head', name: 'Mũ Sắt Rồng Bay', tier: 'super_rare', defense: 22, hp: 160, fireResist: 0.2 },
    a_reinforced_plate: { id: 'a_reinforced_plate', slot: 'body', name: 'Giáp Tấm Thép Cường Lực', tier: 'super_rare', defense: 38, hp: 280, heavyDmgReduction: 25 },

    // Cực Phẩm
    a_tyrant_crown: { id: 'a_tyrant_crown', slot: 'head', name: 'Vương Miện Viêm Đế', tier: 'supreme', defense: 35, hp: 300, burnImmune: true, fireDmgReduction: 0.5 },
    a_phoenix_cloak: { id: 'a_phoenix_cloak', slot: 'body', name: 'Áo Choàng Niết Bàn', tier: 'supreme', defense: 50, hp: 450, reviveOnce: true, desc: 'Sống lại với 20% HP khi nhận đòn chí tử (1 lần/trận)' },

    // Thần Khí
    a_god_crown: { id: 'a_god_crown', slot: 'head', name: 'Thiên Miện Thần Vương', tier: 'god', defense: 60, hp: 600, desc: 'Vương miện Thần Khí, tăng 60 phòng ngự và 600 HP tối đa.' },
    a_archdemon_armor: { id: 'a_archdemon_armor', slot: 'body', name: 'Áo Giáp Hắc Ám Archdemon', tier: 'god', defense: 85, hp: 1000, desc: 'Hóa Ma Thần Khổng Lồ x2 Máu, thiêu đốt 50 HP/giây kẻ dám lại gần 6m' }
  }
};
