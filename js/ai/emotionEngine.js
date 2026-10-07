/**
 * emotionEngine.js - Bộ đếm Cảm xúc Động (Fear, Confidence, Despair)
 * và Cơ chế Đột biến Bản năng (Adrenaline Breakthrough: Berserk & Clutch Escape)
 */
window.GameAI = window.GameAI || {};

window.GameAI.EmotionEngine = {
  updatePawnEmotions: function(pawn, dt, nearbyPawns = [], nearbyMonsters = []) {
    if (!pawn || !pawn.isAlive) return;
    pawn.isUnderThreat = (nearbyPawns.length > 0 || nearbyMonsters.length > 0);
    this.update(pawn, dt);
  },

  update: function(pawn, dt) {
    if (!pawn.isAlive) return;

    // 1. Tự giảm dần cảm xúc về trạng thái cân bằng theo thời gian
    const decay = window.GameData.Emotions.DECAY_RATE * dt;
    pawn.fear = Math.max(0, (pawn.fear || 0) - decay);
    pawn.confidence = Math.max(0, (pawn.confidence || 0) - decay);
    pawn.despair = Math.max(0, (pawn.despair || 0) - decay);

    const hpRatio = pawn.currentHp / pawn.maxHp;

    // 2. Tăng Despair khi bị đuổi liên tục hoặc kiệt sức
    if (pawn.isUnderThreat && (pawn.currentStamina < 15 || pawn.currentMana < 15)) {
      pawn.despair = Math.min(100, pawn.despair + 12 * dt);
    }

    pawn.emotionMoteTimer=(pawn.emotionMoteTimer||0)-dt;
    if(pawn.emotionMoteTimer<=0){
      pawn.emotionMoteTimer=2.5;
      const icon=pawn.isBerserk?'😡':pawn.despair>65?'😰':pawn.fear>65?'😨':pawn.confidence>75?'😎':pawn.objective?.startsWith('Nhặt')?'🤩':pawn.trait==='wise'&&pawn.targetEnemy?'🤔':null;
      if(icon)window.GameRenderer.VfxManager.addEmotionMote(pawn,icon,pawn.fear>65?'#8bdfff':'#ffdf96');
    }
    // 3. Cơ chế Đột biến Bản năng (Adrenaline Breakthrough)
    // Kích hoạt khi Tuyệt Vọng > 90 và HP < 15%
    if (!pawn.breakthroughAttempted && !pawn.hasBreakthrough && pawn.despair > window.GameData.Emotions.DESPAIR_BREAKTHROUGH_THRESHOLD && hpRatio < window.GameData.Emotions.LOW_HP_THRESHOLD) {
      pawn.breakthroughAttempted = true;
      if (Math.random() < 0.02) this.triggerBreakthrough(pawn);
    }

    // 4. Cập nhật thời gian duy trì Cuồng Nộ / Sinh Tồn
    if (pawn.isBerserk) {
      pawn.berserkTimer -= dt;
      if (pawn.berserkTimer <= 0) {
        pawn.isBerserk = false;
      }
    }
    if (pawn.isClutchEscape) {
      pawn.clutchEscapeTimer -= dt;
      if (pawn.clutchEscapeTimer <= 0) {
        pawn.isClutchEscape = false;
        pawn.invincible = false;
      }
    }
  },

  // Khi nhận sát thương lớn đột ngột
  onDamageTaken: function(pawn, damage, attacker) {
    const hpRatio = pawn.currentHp / pawn.maxHp;
    const trait = window.GameData.Traits[pawn.trait] || window.GameData.Traits.brave;

    // Tính chỉ số Fear tăng theo tính cách
    let fearGain = (damage / pawn.maxHp) * 100 * trait.fearGainMultiplier;
    pawn.fear = Math.min(100, (pawn.fear || 0) + fearGain);

    // Bị quái Yêu Vương/Thần đánh tăng thêm sợ hãi
    if (attacker && attacker.tier >= 4) {
      pawn.fear = Math.min(100, pawn.fear + 20);
    }

    // Nếu sợ hãi > 80, hiện Mote mồ hôi và bỏ chạy
    if (pawn.fear >= window.GameData.Emotions.FEAR_FLEE_THRESHOLD && pawn.trait !== 'brave') {
      window.GameRenderer.VfxManager.addEmotionMote(pawn, '💧', '#3498db');
    }
  },

  // Khi tiêu diệt mục tiêu hoặc nhặt đồ xịn
  onKillOrLoot: function(pawn, rewardTier = 'rare') {
    let confGain = 25;
    if (rewardTier === 'supreme' || rewardTier === 'god') confGain = 50;

    pawn.confidence = Math.min(100, (pawn.confidence || 0) + confGain);
    pawn.fear = Math.max(0, pawn.fear - 30);

    if (pawn.confidence >= window.GameData.Emotions.CONFIDENCE_OVERCONFIDENT_THRESHOLD) {
      window.GameRenderer.VfxManager.addEmotionMote(pawn, '😎', '#f1c40f');
    }
  },

  // Kích hoạt Đột biến Bản năng (Berserk hoặc Clutch Escape)
  triggerBreakthrough: function(pawn, forceBerserk = false) {
    pawn.hasBreakthrough = true;
    const roll = Math.random();

    if (forceBerserk || roll < 0.6 || pawn.trait === 'brave') {
      // 1. Cuồng nộ (Berserk)
      pawn.isBerserk = true;
      pawn.isClutchEscape = false;
      pawn.invincible = false;
      pawn.berserkTimer = 5.0; // 5 giây
      pawn.fear = 0;
      pawn.despair = 0;
      pawn.confidence = 100;
      window.GameRenderer.VfxManager.addEmotionMote(pawn, '💀', '#e74c3c');
      if (window.GameUI && window.GameUI.CombatTicker) {
        window.GameUI.CombatTicker.log(`🔥 [ĐỘT BIẾN] ${pawn.name} bước vào trạng thái CUỒNG NỘ khi chỉ còn hơi tàn!`);
      }
    } else {
      // 2. Sinh tồn (Clutch Escape)
      pawn.isClutchEscape = true;
      pawn.isBerserk = false;
      pawn.clutchEscapeTimer = 3.0;
      pawn.invincible = true;
      pawn.fear = 100;
      window.GameRenderer.VfxManager.addEmotionMote(pawn, '🪽', '#00d2d3');
      if (window.GameUI && window.GameUI.CombatTicker) {
        window.GameUI.CombatTicker.log(`🪽 [ĐỘT BIẾN] ${pawn.name} mở cánh thiên thần SINH TỒN tháo chạy thoát hiểm!`);
      }
    }
  }
};
