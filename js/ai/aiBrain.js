/**
 * aiBrain.js - Bộ não quyết định hành vi 3 lớp động của AI Bot
 * Traits -> Emotions -> Utility Decisions (Loot, Farm, Limit, Ally, Betray, Dodge)
 */
window.GameAI = window.GameAI || {};

window.GameAI.AiBrain = {
  updatePawnAI: function(pawn, dt, spatialGrid, mapTerrain, zoneCircle, dropItems) {
    this.update(pawn, dt, spatialGrid, mapTerrain, zoneCircle);
  },

  update: function(pawn, dt, spatialGrid, mapTerrain, zoneCircle) {
    if (!pawn.isAlive || pawn.isPlayerControlled) return;

    const combat = window.GameEntities.CombatSystem;
    if (pawn.action) return;
    if (pawn.currentHp < pawn.maxHp * 0.45 && combat.usePotion(pawn)) {
      pawn.thought = 'Máu thấp, uống bình vừa nhặt được trước khi giao tranh.';
      pawn.objective = 'Uống bình hồi máu'; return;
    }
    pawn.decisionTime=(pawn.decisionTime||0)+dt;
    const threats = spatialGrid.queryCircle(pawn.x, pawn.y, 240).filter(e => combat.isEnemy(pawn, e));
    if (combat.tryReaction(pawn, threats)) return;
    if (window.GameManager.battleRoyaleResolved) {
      const boss = window.GameEntities.EntityManager.worldBoss;
      if (boss?.isAlive) {
        pawn.thought = 'Chỉ còn mình ta. Tiến đến Kinh Thành quyết chiến với Yêu Thần.';
        pawn.objective = 'Đấu với Yêu Thần: ' + boss.name;
        this.engageCombat(pawn, boss, dt); return;
      }
    }

    // 2. Tự động cộng điểm kỹ năng khi lên cấp (Level 1 -> 15)
    this.handleLevelingAndSkills(pawn);

    // 3. Ưu tiên sinh tồn: Trốn thoát khỏi Vòng Bo Sương Mù Độc nếu đang ở ngoài
    if (!window.GameManager.battleRoyaleResolved && zoneCircle && zoneCircle.isOutside(pawn.x, pawn.y)) {
      pawn.thought = 'Sương độc đang áp sát, phải vào vùng an toàn.'; pawn.objective = 'Thoát vòng bo';
      this.fleeTowardsCenter(pawn, zoneCircle.centerX, zoneCircle.centerY, dt);
      return;
    }

    // 4. Nếu đang Hoảng Loạn (Fear > 80 hoặc Clutch Escape), ưu tiên bỏ chạy tìm bụi rậm
    if (pawn.isClutchEscape || ((pawn.fleeTime||0)<8 && pawn.fear >= window.GameData.Emotions.FEAR_FLEE_THRESHOLD && pawn.trait !== 'brave')) {
      pawn.fleeTime=(pawn.fleeTime||0)+dt;
      pawn.thought = 'Đối thủ quá mạnh, tìm bụi rậm để thoát thân.'; pawn.objective = 'Rút lui, bảo toàn mạng sống';
      this.fleeFromThreats(pawn, spatialGrid, mapTerrain, dt);
      return;
    }

    if(pawn.fear<40)pawn.fleeTime=0;
    // 5. Nếu đang Cuồng Nộ (Berserk), bỏ qua mọi thứ lao vào kẻ gần nhất
    if (pawn.isBerserk) {
      this.berserkAssault(pawn, spatialGrid, dt);
      return;
    }

    // 6. Quét môi trường xung quanh bằng Spatial Hash Grid
    const visionRadius = (pawn.visionRange || 180) * (mapTerrain.isInBush(pawn.x, pawn.y) ? 0.6 : 1.0);
    const nearbyEntities = spatialGrid.queryCircle(pawn.x, pawn.y, visionRadius);

    // Phân loại các đối tượng nhìn thấy
    const items = [];
    const monsters = [];
    const enemyPawns = [];

    for (let i = 0; i < nearbyEntities.length; i++) {
      const e = nearbyEntities[i];
      if (e === pawn) continue;
      if (e.isDropItem && !e.isCollected) items.push(e);
      else if (e.isMonster && e.isAlive && !mapTerrain.isInWater(e.x,e.y) && combat.canJoin(pawn,e)) monsters.push(e);
      else if (e.isPawn && e.isAlive) {
        if (pawn.allyPawn === e || mapTerrain.isInWater(e.x,e.y) || !combat.canJoin(pawn,e)) continue; // Đồng minh tạm thời
        enemyPawns.push(e);
      }
    }

    // 7. Quyết định hành vi (Utility Action Selection)
    // A. Nhặt đồ (Looting) nếu có đồ xịn xung quanh
    if (items.length > 0) {
      const bestItem = this.findBestItemToLoot(pawn, items);
      if (bestItem) {
        pawn.thought = 'Có chiến lợi phẩm từ quái ở gần, tranh thủ nhặt.'; pawn.objective = 'Nhặt ' + bestItem.name;
        this.moveToTarget(pawn, bestItem.x, bestItem.y, dt);
        if (Math.hypot(pawn.x - bestItem.x, pawn.y - bestItem.y) < 18) {
          this.lootItem(pawn, bestItem);
        }
        return;
      }
    }

    // B. Kiểm tra Liên Minh Tạm Thời (Pact of Two) & Phản Bội
    this.handleAllianceAndBetrayal(pawn, monsters, enemyPawns);
    // Alliance may have changed since the scan; never reuse an ally as an enemy.
    for (let i = enemyPawns.length - 1; i >= 0; i--) {
      if (pawn.allyPawn === enemyPawns[i]) enemyPawns.splice(i, 1);
    }
    if(pawn.allyPawn && window.GameManager.pawns.filter(p=>p.isAlive).length<=2){
      const ally=pawn.allyPawn;ally.allyPawn=null;ally.isAllied=false;pawn.allyPawn=null;pawn.isAllied=false;
    }
    if (pawn.allyPawn && pawn.allianceBoss && pawn.allianceBoss.isAlive) {
      this.engageCombat(pawn, pawn.allianceBoss, dt);
      return;
    }

    // C. Điều tiết giao tranh số đông (Crowd Combat Limiter)
    // Khóa cụm 3 bot: Bot thứ 4 tản ra hoặc rình rập ăn hôi
    if (enemyPawns.length >= 3) {
      if (pawn.trait === 'coward' || pawn.trait === 'wise') {
        // Tản ra farm quái khác
        this.huntSuitableMonster(pawn, monsters, dt);
        return;
      } else if (pawn.trait === 'cunning' || pawn.trait === 'greedy') {
        // Rình rập ở rìa tầm nhìn chờ ăn hôi
        const weakEnemy = enemyPawns.find(e => e.currentHp < e.maxHp * 0.2);
        if (weakEnemy) this.engageCombat(pawn, weakEnemy, dt);
        else this.flankAndWait(pawn, enemyPawns[0], dt);
        return;
      }
    }

    enemyPawns.sort((a,b)=>Math.hypot(a.x-pawn.x,a.y-pawn.y)-Math.hypot(b.x-pawn.x,b.y-pawn.y));
    if (pawn.level<4 && monsters.some(m=>m.tier===1)) {this.huntSuitableMonster(pawn,monsters,dt);return;}
    // D. Giao tranh PvP nếu gặp bot khác và đủ tự tin
    if (enemyPawns.length > 0) {
      const targetPawn = enemyPawns[0];
      const winChance = this.calculateWinRate(pawn, targetPawn);

      if (pawn.trait === 'wise' && winChance < 0.55) {
        // Không đánh nếu tỷ lệ thắng < 55%
        this.retreatSafely(pawn, targetPawn, dt);
        return;
      }

      this.engageCombat(pawn, targetPawn, dt);
      return;
    }

    // E. Săn Quái Vật theo cấp độ phù hợp (PvE Farming)
    if (monsters.length > 0) {
      this.huntSuitableMonster(pawn, monsters, dt);
      return;
    }

    // F. Lang thang tuần tra tìm mục tiêu
    this.wanderAround(pawn, dt);
  },

  // Tự động phân bổ 15 điểm kỹ năng từ Lv 1 -> 15
  handleLevelingAndSkills: function(pawn) {
    if (!pawn.unspentSkillPoints || pawn.unspentSkillPoints <= 0) return;

    pawn.skills = pawn.skills || [];
    const classData = window.GameData.Skills[pawn.classId];
    if (!classData) return;

    while (pawn.unspentSkillPoints > 0) {
      // Four slots correspond to Q/E/R/F. Keep points when no upgrade is available.
      if (pawn.skills.length < Math.min(4, classData.actives.length)) {
        const nextSkillDef = classData.actives[pawn.skills.length];
        if (nextSkillDef) {
          pawn.skills.push({
            id: nextSkillDef.id,
            def: nextSkillDef,
            tier: 1,
            cooldownTimer: 0
          });
          pawn.unspentSkillPoints--;
        }
      } else {
        // Nâng cấp Tier 2 -> Tier 3
        const skillToUpgrade = pawn.skills.find(s => s.tier < 3);
        if (skillToUpgrade) {
          skillToUpgrade.tier++;
          pawn.unspentSkillPoints--;
        } else {
          break;
        }
      }
    }
  },

  // Chọn đồ loot tốt nhất
  findBestItemToLoot: function(pawn, items) {
    let best = null;
    let highestScore = -1;

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.isCollected) continue;
      if (it.slot === 'potion') { if ((pawn.healthPotions || 0) < 5) return it; continue; }
      const slot = { weapon: 'weapon', head: 'helmet', body: 'armor' }[it.slot];
      if (!slot) continue;
      const current = pawn[slot];
      const tiers = ['common', 'rare', 'super_rare', 'supreme', 'god'];
      if (it.slot === 'weapon' && pawn.hasLockedClass && it.data.classReq !== 'all' && it.data.classReq !== pawn.classId) continue;
      if (current && (tiers.indexOf(current.tier) > tiers.indexOf(it.tier) ||
          (current.tier === it.tier && ((current.attack || current.magicPower || current.defense || 0) >=
            (it.data.attack || it.data.magicPower || it.data.defense || 0))))) continue;
      let score = 10;
      if (it.tier === 'rare') score = 30;
      else if (it.tier === 'super_rare') score = 60;
      else if (it.tier === 'supreme') score = 100;
      else if (it.tier === 'god') score = 250;

      if (pawn.trait === 'greedy') score *= 2.0;

      if (score > highestScore) {
        highestScore = score;
        best = it;
      }
    }
    return best;
  },

  // Nhặt và trang bị đồ
  lootItem: function(pawn, item) {
    if (!item || item.isCollected) return false;
    if (item.slot === 'potion') { pawn.healthPotions = (pawn.healthPotions || 0) + 1; item.isCollected = true; return true; }
    const eqData = item.data || item;
    const slot = { weapon: 'weapon', head: 'helmet', body: 'armor' }[item.slot];
    if (!slot) return false;
    const oldEquipment = pawn[slot];
    if (item.slot === 'weapon') {
      pawn.weapon = eqData;
      // Khóa Class theo vũ khí đầu tiên nếu chưa có
      if (!pawn.hasLockedClass) {
        pawn.hasLockedClass = true;
        pawn.classId = (eqData.classReq === 'all' || !eqData.classReq) ? 'warrior' : eqData.classReq;
        this.handleLevelingAndSkills(pawn);
        if (window.GameUI && window.GameUI.CombatTicker) {
          const className = window.GameData.Classes[pawn.classId] ? window.GameData.Classes[pawn.classId].name : 'Chiến Binh';
          window.GameUI.CombatTicker.log(`⚔️ ${pawn.name} nhặt ${item.name} và định hình thành [${className}]!`);
        }
      }
    } else if (item.slot === 'head') {
      pawn.helmet = eqData;
    } else if (item.slot === 'body') {
      pawn.armor = eqData;
    }

    const hpChange = (eqData.hp || 0) - (oldEquipment?.hp || 0);
    pawn.maxHp += hpChange;
    pawn.currentHp = Math.min(pawn.maxHp, pawn.currentHp);
    const manaChange = (eqData.manaMax || 0) - (oldEquipment?.manaMax || 0);
    pawn.maxMana += manaChange;
    pawn.currentMana = Math.min(pawn.maxMana, pawn.currentMana + Math.max(0, manaChange));

    window.GameAI.EmotionEngine.onKillOrLoot(pawn, item.tier);
    item.isCollected = true;
    return true;
  },

  // Cơ chế Liên Minh Tạm Thời (Pact of Two) & Thuật toán Phản Bội
  handleAllianceAndBetrayal: function(pawn, monsters, enemyPawns) {
    const boss = monsters.find(m => m.tier >= 4);

    // Kích hoạt Liên Minh nếu cả 2 đang đối mặt Yêu Vương/Yêu Thần
    if (boss && enemyPawns.length > 0 && !pawn.allyPawn) {
      const candidate = enemyPawns[0];
      if (!candidate.allyPawn && pawn.trait !== 'brave') {
        pawn.allyPawn = candidate;
        candidate.allyPawn = pawn;
        pawn.isAllied = true;
        candidate.isAllied = true;
        pawn.allianceBoss = boss;
        candidate.allianceBoss = boss;
        window.GameRenderer.VfxManager.addEmotionMote(pawn, '🤝', '#f1c40f');
        window.GameRenderer.VfxManager.addEmotionMote(candidate, '🤝', '#f1c40f');
        if (window.GameUI && window.GameUI.CombatTicker) {
          window.GameUI.CombatTicker.log(`🤝 ${pawn.name} và ${candidate.name} bất ngờ bắt tay liên minh trước mặt ${boss.name}!`);
        }
      }
    }

    // Khi Boss chết, tính toán phản bội
    if (pawn.allyPawn && (!pawn.allyPawn.isAlive || (pawn.allianceBoss && !pawn.allianceBoss.isAlive))) {
      const ally = pawn.allyPawn;
      const greedWeight = pawn.trait === 'greedy' ? 2.5 : (pawn.trait === 'cunning' ? 2.0 : 1.0);
      const betrayalScore = (80 * greedWeight) - ally.currentHp;

      const betray = ally.isAlive && (betrayalScore > 30 || pawn.trait === 'cunning');
      // A loyal pair can fight another pair after its boss dies.
      // Dissolve the final two-person pact so the survival match can finish.
      if(!betray && ally.isAlive && window.GameManager.pawns.filter(p=>p.isAlive).length>2){
        pawn.allianceBoss=null;ally.allianceBoss=null;return;
      }
      pawn.allyPawn = null;
      ally.allyPawn = null;
      pawn.isAllied = false;
      ally.isAllied = false;
      pawn.allianceBoss = null;
      ally.allianceBoss = null;
      if (betray) {
        pawn.isPlottingBetrayal = true;
        window.GameRenderer.VfxManager.addEmotionMote(pawn, '🗡️', '#9b59b6');

        pawn.targetEnemy = ally;

        if (window.GameUI && window.GameUI.CombatTicker) {
          window.GameUI.CombatTicker.log(`😈 [PHẢN BỘI] ${pawn.name} nở nụ cười gian xảo, lập tức rút dao đâm lén người bạn thân ${ally.name}!`);
        }
      }
    }
  },

  // Săn quái vật theo cấp độ phù hợp
  huntSuitableMonster: function(pawn, monsters, dt) {
    let target = null;
    const lv = pawn.level || 1;

    for (let i = 0; i < monsters.length; i++) {
      const m = monsters[i];
      if (!m.isAlive) continue;
      if (lv <= 3 && m.tier <= 2) { target = m; break; }
      else if (lv >= 4 && lv <= 6 && m.tier <= 2) { target = m; break; }
      else if (lv >= 7 && lv <= 10 && m.tier <= 3) { target = m; break; }
      else if (lv >= 11) { target = m; break; }
    }

    if (target) this.engageCombat(pawn, target, dt);
    else this.wanderAround(pawn, dt);
  },

  // Tham chiến với mục tiêu (Bot hoặc Quái)
  engageCombat: function(pawn, target, dt) {
    if (!target || !target.isAlive || pawn.allyPawn === target) return;
    const M=window.GameEngine.MapTerrain,C=window.GameEntities.CombatSystem;
    if(!C.canJoin(pawn,target)||M.isInWater(target.x,target.y)){
      if(window.GameManager.battleRoyaleResolved&&target.tier===5){
        pawn.targetEnemy=target;pawn.objective='Đấu với Yêu Thần: '+target.name;
        pawn.thought='Tiến đến Yêu Thần; chờ cụm giao tranh mở chỗ trước khi ra đòn.';
        this.moveToTarget(pawn,target.x,target.y,dt);return;
      }
      pawn.roamGoal=null;this.wanderAround(pawn,dt);return;
    }
    pawn.targetEnemy = target;
    if (!window.GameManager.battleRoyaleResolved) { pawn.objective = 'Tấn công ' + target.name; pawn.thought = target.isMonster ? 'Canh lấy đà, hạ quái để lên cấp và kiếm trang bị.' : 'Giữ cự ly, chờ thời cơ tung đòn và đỡ phản công.'; }
    const dx = target.x - pawn.x;
    const dy = target.y - pawn.y;
    const dist = Math.hypot(dx, dy);
    pawn.aimAngle = Math.atan2(dy, dx);

    const weaponRange = (pawn.weapon && pawn.weapon.range) || 35;
    const readySkill = pawn.skills?.find(s => s.cooldownTimer <= 0 && dist <= window.GameEntities.CombatSystem.getSkillConfig(pawn, s).range);
    if (readySkill && window.GameEntities.CombatSystem.castSkill(pawn, readySkill, target)) return;

    // Giữ cự ly hoặc áp sát tùy vũ khí
    if (dist > weaponRange || M.isInWater(pawn.x,pawn.y) || !M.segmentClear(pawn.x,pawn.y,target.x,target.y,false,0)) {
      this.moveToTarget(pawn, target.x, target.y, dt);
    } else {
      // Đã trong tầm đánh
      pawn.vx = 0;
      pawn.vy = 0;

      // Tung đòn đánh thường hoặc kỹ năng
      if (pawn.attackCooldown <= 0) {
        this.performAttack(pawn, target);
      }
    }
  },

  // Thực hiện tấn công
  performAttack: function(pawn, target) {
    const combat = window.GameEntities.CombatSystem;
    if (!combat.canAttack(pawn)) return;
    const skill = pawn.skills?.find(s => combat.castSkill(pawn, s, target));
    if (skill) return;
    // Tính sát thương và trừ máu
    if (window.GameEntities && window.GameEntities.CombatSystem) {
      window.GameEntities.CombatSystem.executeAttack(pawn, target);
    }
  },

  // Di chuyển tới vị trí
  moveToTarget: function(pawn,tx,ty,dt) {
    if(pawn.action)return;
    window.GameEngine.MapTerrain.navigate(pawn,tx,ty,dt);
  },

  // Chạy về tâm vòng bo an toàn
  fleeTowardsCenter: function(pawn, cx, cy, dt) {
    this.moveToTarget(pawn, cx, cy, dt);
  },

  // Bỏ chạy khi sợ hãi
  fleeFromThreats: function(pawn, spatialGrid, mapTerrain, dt) {
    // Tìm bụi rậm gần nhất để trốn
    let nearestBush = null;
    let minDist = 9999;
    mapTerrain.bushes.forEach(b => {
      if (b.isBurned) return;
      const d = Math.hypot(pawn.x - b.x, pawn.y - b.y);
      if (d < minDist) {
        minDist = d;
        nearestBush = b;
      }
    });

    if (nearestBush && minDist > 10) {
      this.moveToTarget(pawn, nearestBush.x, nearestBush.y, dt);
    } else {
      // Chạy ngược hướng trung tâm
      this.moveToTarget(pawn, pawn.x + (Math.random() - 0.5) * 80, pawn.y + (Math.random() - 0.5) * 80, dt);
    }
  },

  // Cuồng nộ tấn công điên cuồng
  berserkAssault: function(pawn, spatialGrid, dt) {
    const nearby = spatialGrid.queryCircle(pawn.x, pawn.y, 160);
    const enemies = nearby.filter(e => e !== pawn && e !== pawn.allyPawn && (e.isPawn || e.isMonster) && e.isAlive);
    if (enemies.length > 0) {
      this.engageCombat(pawn, enemies[0], dt);
    }
  },

  // Tính tỷ lệ thắng dự kiến
  calculateWinRate: function(pawn, enemy) {
    const myDps = (pawn.attack || 20) * ((pawn.weapon && pawn.weapon.attack) || 10);
    const enemyDps = (enemy.attack || 20) * ((enemy.weapon && enemy.weapon.attack) || 10);
    const myTimeToLive = pawn.currentHp / Math.max(1, enemyDps);
    const enemyTimeToLive = enemy.currentHp / Math.max(1, myDps);
    return myTimeToLive / (myTimeToLive + enemyTimeToLive);
  },

  retreatSafely: function(pawn, enemy, dt) {
    const dx = pawn.x - enemy.x;
    const dy = pawn.y - enemy.y;
    this.moveToTarget(pawn, pawn.x + dx, pawn.y + dy, dt);
  },

  flankAndWait: function(pawn, combatCluster, dt) {
    // Đứng cách 90px quan sát
    const angle = Math.atan2(pawn.y - combatCluster.y, pawn.x - combatCluster.x);
    const targetX = combatCluster.x + Math.cos(angle) * 100;
    const targetY = combatCluster.y + Math.sin(angle) * 100;
    this.moveToTarget(pawn, targetX, targetY, dt);
  },

  wanderAround: function(pawn, dt) {
    const G=window.GameManager,M=window.GameEngine.MapTerrain,C=window.GameEntities.CombatSystem;
    pawn.targetEnemy=null;
    if(!pawn.roamGoal || Math.hypot(pawn.x-pawn.roamGoal.x,pawn.y-pawn.roamGoal.y)<35 || (pawn.roamTarget&&!pawn.roamTarget.isAlive) || pawn.decisionTime>(pawn.roamUntil||0)){
      const candidates=G.monsters.filter(m=>m.isAlive&&m.tier<=(pawn.level<4?2:pawn.level<8?3:5)&&!M.isInWater(m.x,m.y)&&C.canJoin(pawn,m));
      const enemies=G.pawns.filter(p=>p.isAlive&&p!==pawn&&p!==pawn.allyPawn&&C.canJoin(pawn,p));
      // When alone nearby, converge on living targets instead of short random loops.
      const pool=candidates.length?candidates:enemies;
      pool.sort((a,b)=>Math.hypot(a.x-pawn.x,a.y-pawn.y)-Math.hypot(b.x-pawn.x,b.y-pawn.y));
      pawn.roamTarget=pool[0]||null;
      pawn.roamGoal=pawn.roamTarget?{x:pawn.roamTarget.x,y:pawn.roamTarget.y}:M.nearestFree(300+Math.random()*(M.MAP_WIDTH-600),300+Math.random()*(M.MAP_HEIGHT-600));
      if(G.battleRoyaleResolved&&!pawn.roamTarget)pawn.roamGoal={x:M.MAP_WIDTH/2,y:M.MAP_HEIGHT/2};
      pawn.roamUntil=pawn.decisionTime+12;pawn.navTimer=0;
    }
    pawn.objective=pawn.roamTarget?'Tìm '+pawn.roamTarget.name:'Tuần tra tuyến đường mới';
    pawn.thought='Chọn đường đất hoặc cầu, đi vòng công trình để tiếp cận mục tiêu.';
    this.moveToTarget(pawn,pawn.roamGoal.x,pawn.roamGoal.y,dt);
  }
};

window.GameAI.AIBrain = window.GameAI.AiBrain;
