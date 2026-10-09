/**
 * equipmentsData.js - Trang Bị & Vũ Khí theo 5 Bậc Phẩm Chất
 * (Thường -> Hiếm -> Siêu Hiếm -> Cực Phẩm -> Thần Khí Độc Nhất)
 */
window.GameData = window.GameData || {};

window.GameData.Equipments = {
  // Cấu hình màu sắc theo bậc phẩm chất
  TIER_COLORS: {
    common: '#f1f5f9',      // Xám trắng
    rare: '#4ade80',        // Xanh lá
    super_rare: '#60a5fa',  // Tím
    supreme: '#c084fc',     // Cam vàng
    god: '#ff6b6b'          // Đỏ rực rỡ / Thần bí
  },

  TIER_NAMES: {
    common: 'Thường',
    rare: 'Hiếm',
    super_rare: 'Cực Hiếm',
    supreme: 'Cực Phẩm',
    god: 'Thần Khí'
  },

  // Danh mục Vũ khí
  weapons: {
    // Công theo loại, không còn trần chung. Tốc dưới 1,43 để không dính sàn hồi chiêu 0,7 giây.
    w_rusty_axe: {
      id: 'w_rusty_axe',
      name: 'Rìu Gỗ Gãy',
      type: 'axe',
      classReq: 'warrior',
      tier: 'common',
      attack: 17,
      speed: 0.75,
      range: 42,
      desc: 'Chém chậm, mỗi nhát nặng hơn kiếm và dao cùng bậc.'
    },
    w_rusty_sword: {
      id: 'w_rusty_sword',
      name: 'Kiếm Sắt Rỉ Sét',
      type: 'sword',
      classReq: 'warrior',
      tier: 'common',
      attack: 13,
      critChance: 0.05,
      speed: 1,
      range: 40,
      desc: 'Nhịp và sức đánh ở giữa rìu và dao.'
    },
    w_wooden_wand: {
      id: 'w_wooden_wand',
      name: 'Que Đũa Phép Tre',
      type: 'staff',
      classReq: 'mage',
      tier: 'common',
      attack: 6,
      skillPower: 14,
      speed: 0.95,
      range: 100,
      desc: 'Đòn thường yếu. Sức kỹ năng dùng cho phép.'
    },
    w_crude_bow: {
      id: 'w_crude_bow',
      name: 'Cung Cành Tre',
      type: 'bow',
      classReq: 'archer',
      tier: 'common',
      attack: 12,
      critChance: 0.08,
      speed: 1.1,
      range: 130,
      desc: 'Sát thương duy trì vừa, tầm xa hơn mọi vũ khí cận chiến.'
    },
    w_rusty_dagger: {
      id: 'w_rusty_dagger',
      name: 'Dao Găm Rỉ Sét',
      type: 'dagger',
      classReq: 'assassin',
      tier: 'common',
      attack: 8,
      critChance: 0.22,
      speed: 1.35,
      range: 28,
      desc: 'Mỗi nhát yếu, ra đòn nhanh và nhiều chí mạng.'
    },
    w_hybrid_cane: {
      id: 'w_hybrid_cane',
      name: 'Gậy Ngắn Đa Năng',
      type: 'hybrid_cane',
      classReq: 'hybrid',
      tier: 'common',
      attack: 8,
      skillPower: 8,
      speed: 1.05,
      range: 35,
      desc: 'Nửa sức kiếm, nửa sức phép của trượng cùng bậc.'
    },

    // 3.2. BẬC HIẾM (Rare)
    w_tempered_blade: {
      id: 'w_tempered_blade',
      name: 'Kiếm Thép Luyện Rắn',
      type: 'sword',
      classReq: 'warrior',
      tier: 'rare',
      attack: 24,
      critChance: 0.05,
      speed: 1,
      range: 40,
      desc: 'Kiếm hiếm, nhịp đều và lực ở giữa rìu với dao.'
    },
    w_crystal_staff: {
      id: 'w_crystal_staff',
      name: 'Trượng Thủy Tinh Xanh',
      type: 'staff',
      classReq: 'mage',
      tier: 'rare',
      attack: 11,
      skillPower: 25,
      speed: 0.95,
      range: 108,
      desc: 'Đòn thường thấp. Sức kỹ năng cao hơn kiếm cùng bậc.'
    },
    w_stag_bow: {
      id: 'w_stag_bow',
      name: 'Cung Sừng Hươu Nặng',
      type: 'bow',
      classReq: 'archer',
      tier: 'rare',
      attack: 20,
      critChance: 0.08,
      speed: 1.1,
      range: 150,
      desc: 'Bắn xa, sát thương mỗi phát ở mức duy trì.'
    },
    w_serrated_dagger: {
      id: 'w_serrated_dagger',
      name: 'Dao Găm Răng Cưa',
      type: 'dagger',
      classReq: 'assassin',
      tier: 'rare',
      attack: 15,
      critChance: 0.22,
      speed: 1.35,
      range: 28,
      desc: 'Nhát yếu, tốc đánh cao và 22% chí mạng.'
    },
    w_enchanted_shortblade: {
      id: 'w_enchanted_shortblade',
      name: 'Kiếm Ngắn Phép Thuật',
      type: 'sword',
      classReq: 'hybrid',
      tier: 'rare',
      attack: 13,
      skillPower: 13,
      speed: 1.1,
      range: 36,
      desc: 'Chia đều công vật lý và sức kỹ năng.'
    },

    // 3.3. BẬC SIÊU HIẾM (Super Rare)
    w_steel_cleaver_axe: {
      id: 'w_steel_cleaver_axe',
      name: 'Rìu Chiến Chém Thép',
      type: 'axe',
      classReq: 'warrior',
      tier: 'super_rare',
      attack: 48,
      speed: 0.75,
      range: 42,
      desc: 'Rìu siêu hiếm. Một nhát nặng, hồi chiêu dài.'
    },
    w_frost_pillar_staff: {
      id: 'w_frost_pillar_staff',
      name: 'Gậy Băng Trụ Vĩnh Cửu',
      type: 'staff',
      classReq: 'mage',
      tier: 'super_rare',
      attack: 17,
      skillPower: 39,
      speed: 0.95,
      range: 112,
      desc: 'Phần lớn sức nằm ở kỹ năng, không ở đòn thường.'
    },
    w_tempest_bow: {
      id: 'w_tempest_bow',
      name: 'Cung Bão Tố Tật Phong',
      type: 'bow',
      classReq: 'archer',
      tier: 'super_rare',
      attack: 32,
      critChance: 0.08,
      speed: 1.1,
      range: 170,
      desc: 'Tầm bắn dài, nhịp bắn ổn định.'
    },
    w_viper_venom_dagger: {
      id: 'w_viper_venom_dagger',
      name: 'Dao Găm Răng Rắn Kịch Độc',
      type: 'dagger',
      classReq: 'assassin',
      tier: 'super_rare',
      attack: 23,
      critChance: 0.22,
      speed: 1.35,
      range: 28,
      desc: 'Dao siêu hiếm, nhanh và nhiều chí mạng hơn rìu.'
    },

    // 3.4. BẬC CỰC PHẨM (Supreme - Rơi từ Yêu Vương)
    w_infernal_axe: {
      id: 'w_infernal_axe',
      name: 'Rìu Hủy Diệt Của Viêm Ma',
      type: 'axe',
      classReq: 'warrior',
      tier: 'supreme',
      attack: 69,
      speed: 0.75,
      range: 42,
      desc: 'Rìu cực phẩm. Nhát mạnh nhất bậc này, ra đòn chậm nhất.'
    },
    w_black_panther_staff: {
      id: 'w_black_panther_staff',
      name: 'Trượng Hắc Báo Phẫn Nộ',
      type: 'staff',
      classReq: 'mage',
      tier: 'supreme',
      attack: 24,
      skillPower: 56,
      speed: 0.95,
      range: 116,
      desc: 'Sức kỹ năng áp đảo đòn thường.'
    },
    w_thunderbird_bow: {
      id: 'w_thunderbird_bow',
      name: 'Cung Bão Tố Ưng Vương',
      type: 'bow',
      classReq: 'archer',
      tier: 'supreme',
      attack: 46,
      critChance: 0.08,
      speed: 1.1,
      range: 185,
      desc: 'Cung cực phẩm, giữ lợi thế tầm xa.'
    },
    w_blood_lord_dagger: {
      id: 'w_blood_lord_dagger',
      name: 'Dao Găm Huyết Ma Vương',
      type: 'dagger',
      classReq: 'assassin',
      tier: 'supreme',
      attack: 33,
      critChance: 0.22,
      speed: 1.35,
      range: 28,
      desc: 'Dao cực phẩm, nhiều nhát và 22% chí mạng.'
    },

    // 3.5. BẬC THẦN KHÍ (God Artifacts - Độc nhất vô nhị từ World Boss)
    god_void_spear: {
      id: 'god_void_spear',
      name: 'Long Thương Hỗn Độn Tận Thế',
      type: 'spear',
      classReq: 'all',
      tier: 'god',
      attack: 78,
      critChance: 0.04,
      speed: 1,
      range: 72,
      ccImmunity: true,
      desc: 'Thương tầm trung. Miễn khống chế cứng khi đang cầm.'
    },
    god_solar_bow: {
      id: 'god_solar_bow',
      name: 'Cung Thần Mặt Trời Thái Dương',
      type: 'bow',
      classReq: 'all',
      tier: 'god',
      attack: 64,
      critChance: 0.08,
      speed: 1.1,
      range: 200,
      desc: 'Cung Thần Khí. Tầm 200, sát thương duy trì ngang rìu chậm.'
    },
    god_yggdrasil_staff: {
      id: 'god_yggdrasil_staff',
      name: 'Quyền Trượng Cổ Đại Yggdrasil',
      type: 'staff',
      classReq: 'all',
      tier: 'god',
      attack: 34,
      skillPower: 78,
      speed: 0.95,
      range: 120,
      desc: 'Đòn thường thấp, sức kỹ năng cao cho phép.'
    },
    god_death_tome: {
      id: 'god_death_tome',
      name: 'Sổ Sinh Tử Diêm La',
      type: 'tome',
      classReq: 'all',
      tier: 'god',
      attack: 28,
      skillPower: 90,
      speed: 0.95,
      range: 150,
      desc: 'Sách Thần Khí. Đòn thường yếu nhất, sức kỹ năng cao nhất.'
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
    // Cùng bậc có thân/mũ nặng, pháp và nhẹ. Áo Choàng Niết Bàn là thân hồi phục bậc Cực Phẩm.
    a_iron_cap: { id: 'a_iron_cap', slot: 'head', name: 'Mũ Sắt Thô', tier: 'common', defense: 6, hp: 63, moveBonus: -0.01, desc: 'Mũ nặng. Nhiều máu và giáp, chạy chậm hơn.' },
    a_apprentice_hood: { id: 'a_apprentice_hood', slot: 'head', name: 'Mũ Vải Học Việc', tier: 'common', defense: 1, hp: 21, manaMax: 12, skillPower: 3, desc: 'Mũ pháp. Ít máu, thêm mana và sức kỹ năng.' },
    a_straw_hat: { id: 'a_straw_hat', slot: 'head', name: 'Nón Rơm Rách', tier: 'common', defense: 2, hp: 27, critChance: 0.01, moveBonus: 0.01, desc: 'Mũ nhẹ. Ít máu, thêm chí mạng và tốc chạy.' },
    a_wood_plate: { id: 'a_wood_plate', slot: 'body', name: 'Giáp Gỗ Bọc Sắt', tier: 'common', defense: 11, hp: 135, moveBonus: -0.02, desc: 'Giáp nặng. Nhiều máu, chậm.' },
    a_cloth_robe: { id: 'a_cloth_robe', slot: 'body', name: 'Áo Vải Gai Thô', tier: 'common', defense: 3, hp: 42, manaMax: 18, skillPower: 5, cooldownReduction: 0.012, desc: 'Áo pháp. Ít máu, hỗ trợ phép.' },
    a_hide_wrap: { id: 'a_hide_wrap', slot: 'body', name: 'Áo Da Mỏng', tier: 'common', defense: 4, hp: 63, critChance: 0.012, moveBonus: 0.012, desc: 'Giáp nhẹ. Máu vừa, nhanh và nhiều chí mạng hơn.' },

    a_guard_helmet: { id: 'a_guard_helmet', slot: 'head', name: 'Mũ Nồi Thép Lính Tuần', tier: 'rare', defense: 13, hp: 126, moveBonus: -0.02, desc: 'Mũ nặng bậc Hiếm.' },
    a_jade_circlet: { id: 'a_jade_circlet', slot: 'head', name: 'Vòng Ngọc Học Giả', tier: 'rare', defense: 2, hp: 42, manaMax: 24, skillPower: 7, desc: 'Mũ pháp bậc Hiếm.' },
    a_hunter_hood: { id: 'a_hunter_hood', slot: 'head', name: 'Mũ Trùm Thợ Săn', tier: 'rare', defense: 4, hp: 54, critChance: 0.018, moveBonus: 0.018, desc: 'Mũ nhẹ bậc Hiếm.' },
    a_band_plate: { id: 'a_band_plate', slot: 'body', name: 'Giáp Đai Sắt', tier: 'rare', defense: 21, hp: 270, moveBonus: -0.04, desc: 'Giáp nặng bậc Hiếm.' },
    a_scholar_robe: { id: 'a_scholar_robe', slot: 'body', name: 'Áo Học Giả', tier: 'rare', defense: 5, hp: 84, manaMax: 36, skillPower: 11, cooldownReduction: 0.024, desc: 'Áo pháp bậc Hiếm.' },
    a_studded_leather: { id: 'a_studded_leather', slot: 'body', name: 'Giáp Da Bọc Đinh Sắt', tier: 'rare', defense: 8, hp: 126, critChance: 0.024, moveBonus: 0.024, desc: 'Giáp nhẹ bậc Hiếm.' },

    a_dragon_iron_helm: { id: 'a_dragon_iron_helm', slot: 'head', name: 'Mũ Sắt Rồng Bay', tier: 'super_rare', defense: 21, hp: 210, moveBonus: -0.03, desc: 'Mũ nặng bậc Siêu Hiếm.' },
    a_rune_circlet: { id: 'a_rune_circlet', slot: 'head', name: 'Vòng Rune', tier: 'super_rare', defense: 4, hp: 70, manaMax: 40, skillPower: 11, desc: 'Mũ pháp bậc Siêu Hiếm.' },
    a_hawk_hood: { id: 'a_hawk_hood', slot: 'head', name: 'Mũ Trùm Ưng', tier: 'super_rare', defense: 7, hp: 90, critChance: 0.03, moveBonus: 0.03, desc: 'Mũ nhẹ bậc Siêu Hiếm.' },
    a_reinforced_plate: { id: 'a_reinforced_plate', slot: 'body', name: 'Giáp Tấm Thép Cường Lực', tier: 'super_rare', defense: 35, hp: 450, moveBonus: -0.06, desc: 'Giáp nặng bậc Siêu Hiếm.' },
    a_silk_robe: { id: 'a_silk_robe', slot: 'body', name: 'Áo Lụa Phù Thủy', tier: 'super_rare', defense: 9, hp: 140, manaMax: 60, skillPower: 18, cooldownReduction: 0.04, desc: 'Áo pháp bậc Siêu Hiếm.' },
    a_shadow_leather: { id: 'a_shadow_leather', slot: 'body', name: 'Áo Da Bóng', tier: 'super_rare', defense: 14, hp: 210, critChance: 0.04, moveBonus: 0.04, desc: 'Giáp nhẹ bậc Siêu Hiếm.' },

    a_tyrant_crown: { id: 'a_tyrant_crown', slot: 'head', name: 'Vương Miện Viêm Đế', tier: 'supreme', defense: 30, hp: 302, moveBonus: -0.04, desc: 'Mũ nặng bậc Cực Phẩm.' },
    a_oracle_crown: { id: 'a_oracle_crown', slot: 'head', name: 'Miện Tiên Tri', tier: 'supreme', defense: 6, hp: 101, manaMax: 58, skillPower: 16, desc: 'Mũ pháp bậc Cực Phẩm.' },
    a_wind_hood: { id: 'a_wind_hood', slot: 'head', name: 'Mũ Trùm Cuồng Phong', tier: 'supreme', defense: 10, hp: 130, critChance: 0.043, moveBonus: 0.043, desc: 'Mũ nhẹ bậc Cực Phẩm.' },
    a_tyrant_plate: { id: 'a_tyrant_plate', slot: 'body', name: 'Giáp Bạo Chúa', tier: 'supreme', defense: 50, hp: 648, moveBonus: -0.09, desc: 'Giáp nặng bậc Cực Phẩm.' },
    a_astral_robe: { id: 'a_astral_robe', slot: 'body', name: 'Áo Tinh Tú', tier: 'supreme', defense: 13, hp: 202, manaMax: 86, skillPower: 26, cooldownReduction: 0.058, desc: 'Áo pháp bậc Cực Phẩm.' },
    a_night_mail: { id: 'a_night_mail', slot: 'body', name: 'Áo Đêm', tier: 'supreme', defense: 20, hp: 302, critChance: 0.058, moveBonus: 0.058, desc: 'Giáp nhẹ bậc Cực Phẩm.' },
    a_phoenix_cloak: { id: 'a_phoenix_cloak', slot: 'body', name: 'Áo Choàng Niết Bàn', tier: 'supreme', defense: 26, hp: 340, hpRegen: 1.4, reviveOnce: true, desc: 'Sống lại với 20% HP khi nhận đòn chí tử (1 lần). Hồi thêm 1,4 HP mỗi giây.' },

    a_god_crown: { id: 'a_god_crown', slot: 'head', name: 'Thiên Miện Thần Vương', tier: 'god', defense: 42, hp: 420, moveBonus: -0.06, desc: 'Mũ nặng Thần Khí. Nhiều máu và giáp, chạy chậm.' },
    a_god_diadem: { id: 'a_god_diadem', slot: 'head', name: 'Miện Pháp Thần', tier: 'god', defense: 8, hp: 140, manaMax: 80, skillPower: 22, desc: 'Mũ pháp Thần Khí. Ít máu, nhiều mana và sức kỹ năng.' },
    a_god_visor: { id: 'a_god_visor', slot: 'head', name: 'Mặt Nạ Thần Hành', tier: 'god', defense: 14, hp: 180, critChance: 0.06, moveBonus: 0.06, desc: 'Mũ nhẹ Thần Khí. Chí mạng và tốc chạy.' },
    a_archdemon_armor: { id: 'a_archdemon_armor', slot: 'body', name: 'Áo Giáp Hắc Ám Archdemon', tier: 'god', defense: 70, hp: 900, moveBonus: -0.12, desc: 'Giáp nặng Thần Khí. Máu và giáp cao, tốc chạy giảm 12%.' },
    a_god_vestment: { id: 'a_god_vestment', slot: 'body', name: 'Pháp Bào Thần', tier: 'god', defense: 18, hp: 280, manaMax: 120, skillPower: 36, cooldownReduction: 0.08, desc: 'Áo pháp Thần Khí. Ít máu, mạnh phép và giảm hồi chiêu.' },
    a_god_mantle: { id: 'a_god_mantle', slot: 'body', name: 'Áo Choàng Thần Tốc', tier: 'god', defense: 28, hp: 420, critChance: 0.08, moveBonus: 0.08, desc: 'Giáp nhẹ Thần Khí. Máu vừa, chí mạng và tốc chạy.' }
  }
};
