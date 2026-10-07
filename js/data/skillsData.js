/**
 * skillsData.js - 150 Kỹ Năng qua 5 Nhánh (20 Chủ Động + 10 Nội Tại mỗi nhánh)
 * Mỗi kỹ năng có 3 Tier, Tier 3 mở cơ chế Đánh Đổi (Risk vs Reward)
 */
window.GameData = window.GameData || {};

window.GameData.Skills = {
  // 2.1. NHÁNH ĐẤU SĨ (Warrior)
  warrior: {
    name: 'Đấu Sĩ',
    nameEn: 'Warrior',
    actives: [
      {
        id: 'w_thunder_slash',
        name: 'Chém Sấm Sét',
        nameEn: 'Thunder Slash',
        cooldown: 5.0,
        staminaCost: 15,
        type: 'cone_slash',
        range: 45,
        t1: { desc: '110% sát thương vật lý hình quạt', dmgMultiplier: 1.1 },
        t2: { desc: 'Tăng phạm vi quạt thêm 30%, hồi chiêu giảm 2s', dmgMultiplier: 1.25, cooldown: 3.0, rangeBonus: 0.3 },
        t3: { desc: 'Sóng xung kích làm chậm 50% trong 2s; đánh trượt bị khựng 0.5s', dmgMultiplier: 1.45, slow: 0.5, slowDur: 2, missStumble: 0.5 }
      },
      {
        id: 'w_shield_bash',
        name: 'Khiên Chắn Cương Bộc',
        nameEn: 'Shield Bash',
        cooldown: 7.0,
        staminaCost: 20,
        type: 'dash_stun',
        range: 40,
        t1: { desc: 'Choáng 1s, gây 80 sát thương', baseDamage: 80, stunDur: 1.0 },
        t2: { desc: 'Tăng tầm lướt thêm 2 mét', baseDamage: 110, stunDur: 1.2, dashBonus: 20 },
        t3: { desc: 'Choáng tăng 2s; nhưng bản thân giảm 15% tốc chạy trong 2s', baseDamage: 140, stunDur: 2.0, selfSlow: 0.15 }
      },
      {
        id: 'w_whirlwind',
        name: 'Cuồng Nộ Chém Xoay',
        nameEn: 'Whirlwind',
        cooldown: 8.0,
        staminaCost: 30,
        type: 'whirlwind_aoe',
        radius: 50,
        t1: { desc: 'Gây 6 đòn chém nhỏ xung quanh trong 2 giây', hits: 6, hitDmgMultiplier: 0.3 },
        t2: { desc: 'Có thể vừa di chuyển vừa xoay chiêu', hits: 6, hitDmgMultiplier: 0.38, canMove: true },
        t3: { desc: 'Miễn đẩy lùi khi xoay; xoay xong bị chóng mặt giảm 20% tốc đánh 2s', hits: 7, hitDmgMultiplier: 0.48, dizzyDebuff: 0.2 }
      },
      {
        id: 'w_crushing_charge',
        name: 'Xung Kích Nghiền Nát',
        nameEn: 'Crushing Charge',
        cooldown: 9.0,
        staminaCost: 25,
        type: 'linear_dash',
        range: 90,
        t1: { desc: 'Húc kẻ địch đầu tiên, đẩy lùi 3 mét', dmgMultiplier: 1.2, knockback: 30 },
        t2: { desc: 'Tăng tốc độ lao thêm 40%', dmgMultiplier: 1.4, chargeSpeedBuff: 0.4 },
        t3: { desc: 'Húc đập tường gây choáng 2.5s; lao hụt đâm tường tự choáng 1s', dmgMultiplier: 1.8, wallStun: 2.5, selfWallStun: 1.0 }
      },
      {
        id: 'w_second_wind',
        name: 'Vận Lực Tự Chữa',
        nameEn: 'Second Wind',
        cooldown: 18.0,
        staminaCost: 10,
        type: 'self_heal',
        t1: { desc: 'Hồi ngay lập tức 15% máu tối đa', instantHealPct: 0.15 },
        t2: { desc: 'Hồi thêm 5% máu duy trì trong 3 giây tiếp theo', instantHealPct: 0.15, hotPct: 0.05 },
        t3: { desc: 'Hồi 35% máu nếu kích hoạt khi < 20% HP; khóa dùng bình máu trong 20s', lowHpHealPct: 0.35, potionLock: 20 }
      },
      {
        id: 'w_execution_cleave',
        name: 'Trảm Quyết Tận Tuyệt',
        nameEn: 'Execution Cleave',
        cooldown: 10.0,
        staminaCost: 35,
        type: 'finisher_slam',
        range: 40,
        t1: { desc: 'Gây 150% sát thương, tăng thêm lên mục tiêu yếu máu', dmgMultiplier: 1.5, executeBonus: true },
        t2: { desc: 'Tăng 25% tỷ lệ chí mạng của đòn đánh này', dmgMultiplier: 1.8, critBonus: 0.25 },
        t3: { desc: 'Hồi lập tức hồi chiêu nếu kết liễu; không chết bị phạt hồi chiêu gấp đôi', dmgMultiplier: 2.3, resetOnKill: true, doubleCdOnFail: true }
      },
      {
        id: 'w_earthquake_stomp',
        name: 'Dậm Chân Nứt Đất',
        nameEn: 'Earthquake Stomp',
        cooldown: 8.0,
        staminaCost: 20,
        type: 'ground_slam',
        radius: 45,
        t1: { desc: 'Làm chậm 30% đối thủ trong bán kính 3 mét', slowPct: 0.3, radius: 45 },
        t2: { desc: 'Bổ sung 100 sát thương địa chấn', baseDamage: 100, slowPct: 0.4 },
        t3: { desc: 'Phá hủy trạng thái đỡ đòn (block); giảm 10% giáp bản thân trong 3s', baseDamage: 140, breakGuard: true, selfArmorDebuff: 0.1 }
      },
      {
        id: 'w_iron_wall',
        name: 'Thiết Giáp Bất Hoại',
        nameEn: 'Iron Wall',
        cooldown: 14.0,
        staminaCost: 20,
        type: 'shield_stance',
        t1: { desc: 'Giảm 40% sát thương từ hướng trước mặt trong 3s', blockAngle: 90, dmgReduction: 0.4, duration: 3.0 },
        t2: { desc: 'Tăng góc chặn đòn lên 180 độ', blockAngle: 180, dmgReduction: 0.5, duration: 3.5 },
        t3: { desc: 'Chặn 100% sát thương; nhưng tốc độ di chuyển bị giảm về 0', blockAngle: 180, dmgReduction: 1.0, rootSelf: true }
      },
      {
        id: 'w_armor_piercer',
        name: 'Đâm Thấu Giáp',
        nameEn: 'Armor Piercer',
        cooldown: 6.0,
        staminaCost: 15,
        type: 'thrust_pierce',
        range: 50,
        t1: { desc: 'Gây 100% sát thương, trừ 15% giáp địch 4s', dmgMultiplier: 1.0, armorShred: 0.15 },
        t2: { desc: 'Tăng lượng giáp bị trừ lên 30%', dmgMultiplier: 1.2, armorShred: 0.3 },
        t3: { desc: 'Bỏ qua 100% giáp kẻ địch có giáp cao hơn bản thân', dmgMultiplier: 1.4, ignoreArmorIfTank: true }
      },
      {
        id: 'w_riposte',
        name: 'Phản Kích Thần Tốc',
        nameEn: 'Riposte',
        cooldown: 11.0,
        staminaCost: 20,
        type: 'counter_stance',
        t1: { desc: 'Đỡ 1 đòn cận chiến và đánh trả 100% sát thương', counterDmg: 1.0, window: 0.8 },
        t2: { desc: 'Cửa sổ căn thời gian phản đòn kéo dài thêm 0.3s', counterDmg: 1.3, window: 1.1 },
        t3: { desc: 'Phản đòn gây choáng 2s và hồi 10% HP; nếu không ai đánh thì bị trễ nhịp 1.5s', counterDmg: 1.8, stunDur: 2.0, healPct: 0.1, whiffStumble: 1.5 }
      }
    ],
    passives: [
      {
        id: 'w_iron_constitution',
        name: 'Thể Lực Thép',
        nameEn: 'Iron Constitution',
        t1: { desc: '+10% Máu tối đa', maxHpBonus: 0.1 },
        t2: { desc: '+20% Máu tối đa', maxHpBonus: 0.2 },
        t3: { desc: '+30% Máu tối đa, +15% kháng choáng khi HP > 70%', maxHpBonus: 0.3, stunResistBonus: 0.15 }
      },
      {
        id: 'w_battle_trance',
        name: 'Máu Lửa Đấu Trường',
        nameEn: 'Battle Trance',
        t1: { desc: 'Đòn đánh trúng tích tầng tăng 2% tốc đánh (tối đa 5 tầng)', atkSpeedPerStack: 0.02, maxStacks: 5 },
        t2: { desc: 'Mỗi tầng tăng 4% tốc đánh (tối đa 5 tầng)', atkSpeedPerStack: 0.04, maxStacks: 5 },
        t3: { desc: 'Mỗi tầng +6% tốc đánh; đủ 5 tầng hồi 15 HP mỗi đòn đánh', atkSpeedPerStack: 0.06, maxStacks: 5, fullStackHeal: 15 }
      },
      {
        id: 'w_thick_skin',
        name: 'Da Dày Thịt Béo',
        nameEn: 'Thick Skin',
        t1: { desc: 'Giảm 4 sát thương cố định từ đánh thường', flatDmgReduction: 4 },
        t2: { desc: 'Giảm 8 sát thương cố định từ đánh thường', flatDmgReduction: 8 },
        t3: { desc: 'Giảm 12 sát thương cố định từ đánh thường; Miễn nhiễm chảy máu', flatDmgReduction: 12, bleedImmune: true }
      },
      {
        id: 'w_last_stand',
        name: 'Huyết Chiến Đến Cùng',
        nameEn: 'Last Stand',
        t1: { desc: 'Khi HP < 30%, tăng 15% giáp vật lý', defBonusLowHp: 0.15 },
        t2: { desc: 'Khi HP < 30%, tăng 30% giáp vật lý', defBonusLowHp: 0.3 },
        t3: { desc: 'Khi HP < 30%, tăng 50% giáp vật lý; Đòn chí mạng hồi máu', defBonusLowHp: 0.5, critHeals: true }
      },
      {
        id: 'w_melee_leech',
        name: 'Khát Máu Cận Chiến',
        nameEn: 'Melee Leech',
        t1: { desc: '+4% Hút máu vật lý cận chiến', lifeSteal: 0.04 },
        t2: { desc: '+8% Hút máu vật lý cận chiến', lifeSteal: 0.08 },
        t3: { desc: '+12% Hút máu vật lý; Tiêu diệt mục tiêu hồi ngay 15% máu', lifeSteal: 0.12, killHealPct: 0.15 }
      }
    ]
  },

  // 2.2. NHÁNH PHÁP SƯ (Mage)
  mage: {
    name: 'Pháp Sư',
    nameEn: 'Mage',
    actives: [
      {
        id: 'm_fireball',
        name: 'Hỏa Cầu Thuật',
        nameEn: 'Fireball',
        cooldown: 4.5,
        manaCost: 20,
        type: 'projectile_explosion',
        range: 120,
        radius: 35,
        t1: { desc: 'Gây sát thương phép diện rộng bán kính 2m', magicDamage: 90 },
        t2: { desc: 'Gây thêm hiệu ứng thiêu đốt rút máu trong 3s', magicDamage: 120, burnDot: 15, burnDur: 3 },
        t3: { desc: 'Để lại biển lửa 4s thiêu đốt; nhưng thời gian niệm chú tăng 0.5s', magicDamage: 160, fireFieldDur: 4, castDelay: 0.5 }
      },
      {
        id: 'm_frost_bolt',
        name: 'Băng Tuyết Tiễn',
        nameEn: 'Frost Bolt',
        cooldown: 4.0,
        manaCost: 15,
        type: 'projectile_slow',
        range: 110,
        t1: { desc: 'Sát thương đơn mục tiêu, làm chậm 30% trong 2s', magicDamage: 80, slowPct: 0.3, slowDur: 2 },
        t2: { desc: 'Tăng tốc độ bay mũi tên 35%', magicDamage: 105, speedBonus: 0.35, slowPct: 0.4 },
        t3: { desc: 'Đóng băng cứng 1.5s nếu địch đã bị chậm; cự ly bắn giảm 2m', magicDamage: 130, freezeDuration: 1.5, rangeReduction: 20 }
      },
      {
        id: 'm_blink',
        name: 'Hư Không Nhấp Nháy',
        nameEn: 'Blink',
        cooldown: 7.0,
        manaCost: 25,
        type: 'teleport',
        range: 65,
        t1: { desc: 'Tức thời dịch chuyển 5 mét về hướng nhìn', distance: 65 },
        t2: { desc: 'Giảm thời gian hồi chiêu 3 giây', distance: 75, cooldown: 4.0 },
        t3: { desc: 'Để lại ảo ảnh nổ sau 1s tại điểm cũ; tiêu tốn thêm 20% mana tối đa', distance: 85, cloneExplosion: 120, extraManaPct: 0.2 }
      },
      {
        id: 'm_gravity_vortex',
        name: 'Vòng Xoáy Hút Hồn',
        nameEn: 'Gravity Vortex',
        cooldown: 12.0,
        manaCost: 35,
        type: 'vortex_pull',
        radius: 60,
        t1: { desc: 'Hút kẻ thù trong bán kính 4 mét', pullDuration: 2.0 },
        t2: { desc: 'Làm chậm 50% những kẻ đang bị hút', pullDuration: 2.5, slowPct: 0.5 },
        t3: { desc: 'Nổ tung ở giây cuối cực mạnh; có thể hút mất cả trang bị rơi', nukeDamage: 220, voidItems: true }
      },
      {
        id: 'm_mana_shield',
        name: 'Khiên Ma Lực',
        nameEn: 'Mana Shield',
        cooldown: 15.0,
        manaCost: 10,
        type: 'mana_shield_toggle',
        t1: { desc: 'Chuyển 30% sát thương nhận vào trừ vào mana', manaAbsorbPct: 0.3 },
        t2: { desc: 'Tăng hiệu suất chuyển đổi (1 mana đỡ 1.5 sát thương)', manaAbsorbPct: 0.45, efficiency: 1.5 },
        t3: { desc: 'Kháng 100% sát thương phép; hết mana bị câm lặng 3s', magicImmune: true, silenceOnDeplete: 3.0 }
      },
      {
        id: 'm_meteor_strike',
        name: 'Hỏa Phụng Liêu Nguyên',
        nameEn: 'Meteor Strike',
        cooldown: 14.0,
        manaCost: 45,
        type: 'ground_nuke',
        delay: 1.5,
        radius: 70,
        t1: { desc: 'Vùng ảnh hưởng lớn, rơi sau 1.5 giây', magicDamage: 180 },
        t2: { desc: 'Sát thương tăng thêm 35%', magicDamage: 245 },
        t3: { desc: 'Sóng chấn động làm ngã tất cả kẻ địch; nếu trúng bản thân tự chịu 50%', magicDamage: 320, knockdownAll: true, selfDamagePct: 0.5 }
      },
      {
        id: 'm_ice_block',
        name: 'Băng Giáp Tự Thân',
        nameEn: 'Ice Block',
        cooldown: 20.0,
        manaCost: 25,
        type: 'stasis',
        t1: { desc: 'Miễn nhiễm mọi sát thương trong 2.5s, không thể di chuyển', stasisDur: 2.5 },
        t2: { desc: 'Hồi phục 15% máu khi đang đóng băng', stasisDur: 2.5, healPct: 0.15 },
        t3: { desc: 'Khối băng tan phát nổ hất văng địch; sau đó tốc chạy bị giảm 20% trong 5s', shatterDamage: 110, knockback: 40, postSlow: 0.2 }
      }
    ],
    passives: [
      {
        id: 'm_arcane_flow',
        name: 'Ma Lực Tuôn Trào',
        nameEn: 'Arcane Flow',
        t1: { desc: '+15% Tốc độ hồi phục Mana', manaRegenBonus: 0.15 },
        t2: { desc: '+30% Tốc độ hồi phục Mana', manaRegenBonus: 0.30 },
        t3: { desc: '+45% Tốc độ hồi mana; Nhận khiên chắn khi mana đầy 100%', manaRegenBonus: 0.45, fullManaShield: true }
      },
      {
        id: 'm_spell_penetration',
        name: 'Thấu Suốt Căn Nguyên',
        nameEn: 'Spell Penetration',
        t1: { desc: 'Bỏ qua 10% kháng phép', mPen: 0.10 },
        t2: { desc: 'Bỏ qua 20% kháng phép', mPen: 0.20 },
        t3: { desc: 'Bỏ qua 35% kháng phép; 15% cơ hội gây sát thương chuẩn', mPen: 0.35, trueDmgChance: 0.15 }
      },
      {
        id: 'm_spell_vamp',
        name: 'Ma Thuật Hút Hồn',
        nameEn: 'Spell Vamp',
        t1: { desc: 'Hút máu phép 5%', spellVamp: 0.05 },
        t2: { desc: 'Hút máu phép 10%', spellVamp: 0.10 },
        t3: { desc: 'Hút máu phép 18%; Hạ gục bằng phép hồi ngay 20% mana', spellVamp: 0.18, killManaRefund: 0.2 }
      }
    ]
  },

  // 2.3. NHÁNH CUNG THỦ (Archer)
  archer: {
    name: 'Cung Thủ',
    nameEn: 'Archer',
    actives: [
      {
        id: 'a_double_tap',
        name: 'Bắn Đôi Thần Tốc',
        nameEn: 'Double Tap',
        cooldown: 4.0,
        staminaCost: 15,
        type: 'burst_arrows',
        range: 130,
        t1: { desc: 'Hai mũi tên liên tiếp, 70% sát thương mỗi mũi', arrows: 2, dmgPct: 0.7 },
        t2: { desc: 'Tăng tốc độ bay mũi tên 30%', arrows: 2, dmgPct: 0.85, speedBonus: 0.3 },
        t3: { desc: 'Cả 2 trúng gây xé rách chảy máu; nếu trượt 1 mũi mất hiệu ứng', arrows: 2, dmgPct: 1.0, bleedIfBoth: true }
      },
      {
        id: 'a_disengage_vault',
        name: 'Nhảy Lùi Thoát Cương',
        nameEn: 'Disengage Vault',
        cooldown: 6.0,
        staminaCost: 20,
        type: 'backstep_shot',
        range: 50,
        t1: { desc: 'Nhảy lùi 4 mét, bắn 1 mũi tên làm chậm 30%', backstep: 45, slowPct: 0.3 },
        t2: { desc: 'Cho phép nhảy vượt qua vật cản thấp hoặc tảng đá', backstep: 55, slowPct: 0.4, crossObstacles: true },
        t3: { desc: 'Xóa bỏ mọi làm chậm khi nhảy; nhưng tốn 30% thanh thể lực', backstep: 65, cleanseSlow: true, extraStaminaPct: 0.3 }
      },
      {
        id: 'a_rain_of_arrows',
        name: 'Mưa Tên Trút Xuống',
        nameEn: 'Rain of Arrows',
        cooldown: 10.0,
        staminaCost: 30,
        type: 'arrow_barrage',
        radius: 65,
        t1: { desc: 'Rơi tên liên tục trong 2 giây gây sát thương diện rộng', duration: 2.0, tickDmg: 25 },
        t2: { desc: 'Tăng bán kính rơi tên thêm 1.5 mét', duration: 2.5, tickDmg: 35, radius: 80 },
        t3: { desc: 'Kẻ địch dẫm vào bị giảm 60% tốc chạy; cung thủ phải đứng yên kéo cung 1s', duration: 3.0, tickDmg: 45, slowPct: 0.6, channelTime: 1.0 }
      },
      {
        id: 'a_snipe',
        name: 'Ngắm Bắn Tử Thần',
        nameEn: 'Snipe',
        cooldown: 12.0,
        staminaCost: 35,
        type: 'charged_snipe',
        range: 220,
        chargeTime: 2.0,
        t1: { desc: 'Đứng yên tụ lực 2s, bắn cực xa và uy lực', baseDamage: 220 },
        t2: { desc: 'Tăng 40% tỉ lệ chí mạng cho phát bắn này', baseDamage: 280, critBonus: 0.4 },
        t3: { desc: 'Phát bắn chắc chắn chí mạng 100% và xuyên táo; nhưng lúc tụ lực bị mù 2 bên', baseDamage: 380, guaranteedCrit: true, tunnelVision: true }
      },
      {
        id: 'a_windrunner',
        name: 'Phản Xạ Gió Lốc',
        nameEn: 'Windrunner',
        cooldown: 9.0,
        staminaCost: 20,
        type: 'speed_buff',
        t1: { desc: 'Tăng 40% tốc chạy trong 3 giây', speedBuff: 0.4, duration: 3.0 },
        t2: { desc: 'Nhận thêm 25% né tránh đòn tầm xa khi đang chạy', speedBuff: 0.5, dodgeRanged: 0.25, duration: 3.5 },
        t3: { desc: 'Tốc chạy tăng 80% không bị vật cản làm chậm; nhưng không thể tấn công', speedBuff: 0.8, ghostWalk: true, pacify: true, duration: 4.0 }
      }
    ],
    passives: [
      {
        id: 'a_eagle_eye',
        name: 'Mắt Đại Bàng',
        nameEn: 'Eagle Eye',
        t1: { desc: '+10% Tầm nhìn trên bản đồ', visionBonus: 0.1 },
        t2: { desc: '+20% Tầm nhìn trên bản đồ', visionBonus: 0.2 },
        t3: { desc: '+35% Tầm nhìn; Tăng 15% tầm bắn xa tối đa', visionBonus: 0.35, rangeBonus: 0.15 }
      },
      {
        id: 'a_sharpshooter',
        name: 'Bách Phát Bách Trúng',
        nameEn: 'Sharpshooter',
        t1: { desc: 'Bắn trúng tích tầng tăng 2% sát thương (tối đa 5 tầng, bắn trượt mất)', stackDmg: 0.02, maxStacks: 5 },
        t2: { desc: 'Mỗi tầng tăng 4% sát thương (tối đa 5 tầng)', stackDmg: 0.04, maxStacks: 5 },
        t3: { desc: 'Mỗi tầng +6% sát thương; đủ 5 tầng đòn tiếp theo chắc chắn chí mạng', stackDmg: 0.06, maxStacks: 5, critOnMax: true }
      },
      {
        id: 'a_forest_stalker',
        name: 'Thợ Săn Rừng Rậm',
        nameEn: 'Forest Stalker',
        t1: { desc: 'Di chuyển trong bụi rậm không bị giảm tốc', bushNoSlow: true },
        t2: { desc: '+20% Tốc chạy khi ở trong bụi rậm', bushNoSlow: true, bushSpeedBonus: 0.2 },
        t3: { desc: '+30% Tốc chạy trong bụi; Đòn bắn từ bụi không lộ vị trí tức thì', bushNoSlow: true, bushSpeedBonus: 0.3, ambushSilent: true }
      }
    ]
  },

  // 2.4. NHÁNH SÁT THỦ (Assassin)
  assassin: {
    name: 'Sát Thủ',
    nameEn: 'Assassin',
    actives: [
      {
        id: 'as_shadowstep',
        name: 'Ám Đột Sau Lưng',
        nameEn: 'Shadowstep',
        cooldown: 7.0,
        staminaCost: 20,
        type: 'teleport_backstab',
        range: 65,
        t1: { desc: 'Lướt ra sau lưng địch cự ly 5m gây 120% sát thương', dmgPct: 1.2 },
        t2: { desc: 'Giảm hồi chiêu 2s nếu mục tiêu đang quay lưng', dmgPct: 1.4, cdRefundBack: 2.0 },
        t3: { desc: 'Đòn chém chắc chắn chí mạng 100%; nếu địch kịp quay mặt đỡ, bản thân bị trừ 20% giáp', dmgPct: 1.9, guaranteedCrit: true, parryVulnerability: 0.2 }
      },
      {
        id: 'as_vanish',
        name: 'Ẩn Vào Bóng Tối',
        nameEn: 'Vanish',
        cooldown: 12.0,
        staminaCost: 25,
        type: 'stealth',
        t1: { desc: 'Tàng hình hoàn toàn trong 3 giây', stealthDur: 3.0 },
        t2: { desc: 'Tăng 30% tốc độ di chuyển khi đang tàng hình', stealthDur: 3.5, speedBuff: 0.3 },
        t3: { desc: 'Xóa bỏ làm chậm và trói khi bật; đi vào nước sâu hoặc bị đốt cháy bị lộ ngay', stealthDur: 4.0, speedBuff: 0.45, cleanseHard: true, revealInWater: true }
      },
      {
        id: 'as_throat_slit',
        name: 'Cắt Cổ Đoạt Mệnh',
        nameEn: 'Throat Slit',
        cooldown: 8.0,
        staminaCost: 20,
        type: 'melee_bleed_silence',
        range: 35,
        t1: { desc: 'Gây sát thương và câm lặng đối thủ 1 giây', baseDamage: 90, silenceDur: 1.0 },
        t2: { desc: 'Gây chảy máu rút 3% máu tối đa/giây trong 3s', baseDamage: 120, silenceDur: 1.2, bleedPct: 0.03, bleedDur: 3 },
        t3: { desc: 'Sát thương tăng gấp 3 nếu đánh từ tàng hình; nếu địch có khiên không gây câm lặng', stealthTripleDmg: true }
      },
      {
        id: 'as_smoke_bomb',
        name: 'Bom Khói Tẩu Thoát',
        nameEn: 'Smoke Bomb',
        cooldown: 11.0,
        staminaCost: 20,
        type: 'smoke_cloud',
        radius: 45,
        t1: { desc: 'Che mắt kẻ thù trong bán kính 3 mét', duration: 3.0 },
        t2: { desc: 'Tăng 50% tốc chạy khi thoát ra khỏi khói', duration: 3.5, speedBuffAfter: 0.5 },
        t3: { desc: 'Ngắt toàn bộ kỹ năng định vị đang nhắm vào sát thủ; trễ nổ 0.3s', duration: 4.0, cancelTargeting: true, delayFuse: 0.3 }
      },
      {
        id: 'as_assassinate',
        name: 'Đoạt Mạng Bất Ngờ',
        nameEn: 'Assassinate',
        cooldown: 16.0,
        staminaCost: 40,
        type: 'execution_strike',
        range: 40,
        chargeTime: 1.0,
        t1: { desc: 'Tụ lực 1s tung đòn đâm chí tử cực nặng', baseDamage: 250 },
        t2: { desc: 'Giảm thời gian tụ lực xuống còn 0.6 giây', baseDamage: 310, chargeTime: 0.6 },
        t3: { desc: 'Tăng thêm 100% sát thương nếu mục tiêu > 90% HP (phủ đầu); mục tiêu < 50% HP gây bình thường', fullHpAmbushBonus: 1.0 }
      }
    ],
    passives: [
      {
        id: 'as_silent_footsteps',
        name: 'Bước Chân Không Vết',
        nameEn: 'Silent Footsteps',
        t1: { desc: 'Giảm 30% tiếng động phát ra khi chạy', noiseReduction: 0.3 },
        t2: { desc: 'Giảm 60% tiếng động phát ra khi chạy', noiseReduction: 0.6 },
        t3: { desc: 'Không tạo sóng âm phát hiện tiếng động cho các bot khác', silentWalk: true }
      },
      {
        id: 'as_killer_instinct',
        name: 'Bản Năng Sát Thủ',
        nameEn: 'Killer Instinct',
        t1: { desc: '+5% Tỉ lệ chí mạng', critRateBonus: 0.05 },
        t2: { desc: '+10% Tỉ lệ chí mạng', critRateBonus: 0.10 },
        t3: { desc: '+20% Tỉ lệ chí mạng; Đòn chí mạng +35% sát thương', critRateBonus: 0.20, critDmgBonus: 0.35 }
      },
      {
        id: 'as_opportunist',
        name: 'Kẻ Cơ Hội',
        nameEn: 'Opportunist',
        t1: { desc: '+10% Sát thương lên mục tiêu quay lưng hoặc HP < 30%', opportunistBonus: 0.1 },
        t2: { desc: '+20% Sát thương lên mục tiêu quay lưng hoặc HP < 30%', opportunistBonus: 0.2 },
        t3: { desc: '+35% Sát thương; +20% Tốc chạy khi đuổi theo mục tiêu yếu máu', opportunistBonus: 0.35, huntSpeedBonus: 0.2 }
      }
    ]
  },

  // 2.5. NHÁNH THUẬT SĨ (Hybrid / All-Rounder)
  hybrid: {
    name: 'Thuật Sĩ',
    nameEn: 'Hybrid / All-Rounder',
    actives: [
      {
        id: 'h_armament_swap',
        name: 'Chuyển Đổi Vũ Trang',
        nameEn: 'Armament Swap',
        cooldown: 3.0,
        staminaCost: 5,
        type: 'weapon_swap',
        t1: { desc: 'Đổi tức thời giữa tầm xa và cận chiến, đòn tiếp +20% sát thương', nextHitBonus: 0.2 },
        t2: { desc: '+20% Tốc chạy trong 2s sau khi đổi vũ khí', nextHitBonus: 0.3, speedBuff: 0.2, buffDur: 2 },
        t3: { desc: 'Đổi sang cận chiến nhận khiên chắn; đổi sang tầm xa phát bắn đầu làm chậm 50%', meleeShield: 80, rangedSlow: 0.5 }
      },
      {
        id: 'h_enchanted_blade',
        name: 'Ma Đao Cường Hóa',
        nameEn: 'Enchanted Blade',
        cooldown: 7.0,
        manaCost: 20,
        type: 'weapon_buff',
        t1: { desc: 'Đòn đánh cận chiến gây thêm sát thương phép trong 5s', magicOnHit: 25, duration: 5.0 },
        t2: { desc: 'Đòn đánh hút lại 10% sát thương thành máu và mana', magicOnHit: 35, dualLeech: 0.1, duration: 6.0 },
        t3: { desc: 'Sát thương hỗn hợp nửa lý nửa phép bỏ qua 30% giáp; tốn mana mỗi nhát chém', hybridPen: 0.3, manaPerSwing: 4 }
      },
      {
        id: 'h_healing_aura',
        name: 'Hào Quang Tự Chữa',
        nameEn: 'Healing Aura',
        cooldown: 12.0,
        manaCost: 25,
        type: 'aura_heal',
        radius: 50,
        t1: { desc: 'Hồi máu dần dần trong 4 giây', hotTick: 20, duration: 4.0 },
        t2: { desc: 'Hồi máu cho cả đồng minh trong liên minh tạm thời', hotTick: 30, healAlly: true, duration: 5.0 },
        t3: { desc: 'Hóa giải 1 bùa hại khi kích hoạt; lượng hồi giảm 50% nếu đang bơi dưới nước', cleanseOne: true, waterPenalty: 0.5 }
      },
      {
        id: 'h_wind_form',
        name: 'Hóa Thân Tật Phong',
        nameEn: 'Wind Form',
        cooldown: 10.0,
        manaCost: 20,
        type: 'ethereal_speed',
        t1: { desc: 'Tăng 50% tốc chạy và đi xuyên người trong 2 giây', speedBuff: 0.5, ghost: true, duration: 2.0 },
        t2: { desc: 'Không bị chặn bởi quái vật hoặc vật cản nhỏ', speedBuff: 0.65, ghost: true, duration: 2.5 },
        t3: { desc: 'Không nhận sát thương từ bẫy và bơi dưới nước tốc độ 100%; không thể tấn công', trapImmune: true, waterWalk: true, pacify: true, duration: 3.5 }
      },
      {
        id: 'h_chaos_bolt',
        name: 'Hỗn Độn Trừng Phạt',
        nameEn: 'Chaos Bolt',
        cooldown: 6.0,
        manaCost: 25,
        type: 'chaos_projectile',
        range: 110,
        t1: { desc: 'Gây hiệu ứng ngẫu nhiên: Đóng băng, Thiêu đốt hoặc Giật điện', baseDamage: 95 },
        t2: { desc: 'Sát thương nguyên tố tăng thêm 30%', baseDamage: 135 },
        t3: { desc: 'Bắn 2 quả cầu 2 nguyên tố đối lập gây nổ cực mạnh; tiêu tốn một nửa mana hiện có', doubleSphere: true, manaCostHalf: true }
      }
    ],
    passives: [
      {
        id: 'h_weapons_master',
        name: 'Bậc Thầy Binh Khí',
        nameEn: 'Weapons Master',
        t1: { desc: '+8% Sát thương tổng thể cả cận chiến và tầm xa', allDmgBonus: 0.08 },
        t2: { desc: '+15% Sát thương tổng thể', allDmgBonus: 0.15 },
        t3: { desc: '+25% Sát thương tổng thể; +10% Tốc độ chuyển đổi vũ khí', allDmgBonus: 0.25, swapSpeedBonus: 0.10 }
      },
      {
        id: 'h_harmonious_balance',
        name: 'Thể Phách Cân Bằng',
        nameEn: 'Harmonious Balance',
        t1: { desc: 'Giáp và Kháng phép tự cân bằng theo chỉ số cao hơn, +5 điểm', defBalancePlus: 5 },
        t2: { desc: 'Giáp và Kháng phép cân bằng, +10 điểm phòng thủ', defBalancePlus: 10 },
        t3: { desc: '+18 Điểm phòng thủ cân bằng; Miễn nhiễm sát thương chuẩn từ đánh thường', defBalancePlus: 18, trueDmgImmuneFromNormals: true }
      },
      {
        id: 'h_adaptability',
        name: 'Thích Ứng Môi Trường',
        nameEn: 'Adaptability',
        t1: { desc: 'Giảm 20% tác động tiêu cực của địa hình', terrainPenaltyReduction: 0.2 },
        t2: { desc: 'Giảm 40% tác động tiêu cực địa hình (bơi nhanh hơn, leo dốc ít chậm)', terrainPenaltyReduction: 0.4 },
        t3: { desc: 'Giảm 60% tác động địa hình; Bơi dưới nước vẫn hồi phục thể lực', terrainPenaltyReduction: 0.6, swimRegenStamina: true }
      }
    ]
  }
};
