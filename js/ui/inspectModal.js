/**
 * inspectModal.js - Bảng Soi Chi Tiết Chỉ Số, Cảm Xúc, Trang Bị và Cây Kỹ Năng
 */
window.GameUI = window.GameUI || {};

window.GameUI.InspectModal = {
  currentEntity: null,
  panelEl: null,

  init: function() {
    this.panelEl = document.getElementById('inspect-panel');
  },

  inspect: function(entity) {
    this.currentEntity = entity;
    if (!entity) {
      if (this.panelEl) this.panelEl.classList.add('hidden');
      return;
    }
    if (this.panelEl) this.panelEl.classList.remove('hidden');
    this.updateContent();
  },

  updateContent: function() {
    if (!this.currentEntity || !this.panelEl) return;
    const e = this.currentEntity;

    if (e.isPawn) {
      this.renderPawnInspect(e);
    } else if (e.isMonster) {
      this.renderMonsterInspect(e);
    }
  },

  renderPawnInspect: function(p) {
    const traitDef = window.GameData.Traits[p.trait] || {};
    const classDef = window.GameData.Classes[p.classId] || { name: 'Tay không', role: 'Tự do' };

    const levels=window.GameData.LevelTable;
    const levelBase=levels.expForLevel(p.level),next=levels.expForLevel(p.level+1);
    const xpInLevel=Math.max(0,p.currentExp-levelBase),xpNeeded=next-levelBase;
    const stats=window.GameEntities.CombatSystem.combatStats(p);
    const personality=p.personality||window.GameData.PersonalityProfiles[p.trait];
    const fearPct = Math.round(p.fear || 0);
    const confPct = Math.round(p.confidence || 0);
    const despPct = Math.round(p.despair || 0);

    const weaponName = p.weapon ? `${p.weapon.name} (${window.GameData.Equipments.TIER_NAMES[p.weapon.tier]})` : 'Tay Không';
    const armorName = p.armor ? `${p.armor.name} (+${p.armor.defense||0} Giáp)` : 'Áo Vải Thường';
    const helmetName = p.helmet ? `${p.helmet.name} (+${p.helmet.defense||0} Giáp)` : 'Không';

    let skillsHtml = '';
    if (p.skills && p.skills.length > 0) {
      skillsHtml = p.skills.map(s => `
        <div class="inspect-skill-item">
          <span class="skill-name">${s.def.name}</span>
          <span class="skill-tier">Tier ${s.tier}</span>
          <div class="skill-desc">${this.skillDescription(p,s)}</div>
        </div>
      `).join('');
    } else {
      skillsHtml = '<div class="text-muted">Chưa mở khóa kỹ năng nào</div>';
    }

    this.panelEl.innerHTML = `
      <div class="inspect-header">
        <div class="inspect-title">${p.name}</div>
        <button class="inspect-close" onclick="window.GameUI.InspectModal.inspect(null)">✕</button>
      </div>

      <div class="inspect-subtitle">
        <span class="badge badge-class">Vũ khí: ${classDef.name}</span>
        <span class="badge badge-trait">${traitDef.name || p.trait}</span>
        <span class="badge badge-level">Lv ${p.level} (Kills: ${p.killCount})</span>
      </div>

      <div class="inspect-section">
        <div class="inspect-bar-label">${"EXP: "+xpInLevel+" / "+xpNeeded+" • Còn "+Math.max(0,next-p.currentExp)+" EXP để lên cấp"}</div>
        <div class="inspect-bar-label">Máu: ${Math.round(p.currentHp)} / ${p.maxHp} • Hồi 1 HP/s</div>
        <div class="bar-container"><div class="bar-fill bar-hp" style="width: ${(p.currentHp / p.maxHp) * 100}%"></div></div>

        <div class="inspect-bar-label">Thể Lực: ${Math.round(p.currentStamina)} / ${p.maxStamina}</div>
        <div class="bar-container"><div class="bar-fill bar-stamina" style="width: ${(p.currentStamina / p.maxStamina) * 100}%"></div></div>

        <div class="inspect-bar-label">Mana: ${Math.round(p.currentMana)} / ${p.maxMana}</div>
        <div class="bar-container"><div class="bar-fill bar-mana" style="width: ${(p.currentMana / p.maxMana) * 100}%"></div></div>
      </div>

      <div class="inspect-section">
        <div class="section-title">Chỉ số thực chiến</div>
        <div>ATK: <b>${stats.attack}</b> • DEF: <b>${stats.defense}</b> • Kháng phép: <b>${stats.magicDefense}</b></div>
        <div>Tốc độ: <b>${Math.round(stats.speed)}</b> • Tầm đánh: <b>${stats.range}</b> • Tầm nhìn: <b>${window.GameEntities.CombatSystem.visionRange(p)}</b> • Chí mạng: <b>${Math.round(Math.min(.35,(p.critChance||0)+(p.weapon?.critChance||0))*100)}%</b></div>
        <div class="section-title">Tính cách cá nhân</div>
        <div>Chủ đạo: ${traitDef.name} • Phụ: ${window.GameData.Traits[p.secondaryTrait]?.name||'—'}</div>
        ${Object.entries(window.GameData.PersonalityAxes).map(([key,name])=>'<div class="emotion-row"><span>'+name+':</span><b>'+personality[key]+'/100</b></div>').join('')}
        <div class="section-title">Suy nghĩ & mục tiêu hiện tại</div>
        <div class="bot-objective">${p.objective || "Quan sát chiến trường"}</div>
        <p class="bot-thought">${p.thought || "Đang lựa chọn hành động."}</p>
        <div>Chiến thuật: <b>${p.isHiding?"Đang ẩn nấp":p.combatTactic|| (p.chase?"Truy đuổi có giới hạn":"Cơ động")}</b></div><div>Bình máu: <b>${p.healthPotions || 0}</b> • ${p.action ? ({attack:"Ra đòn",skill:"Thi triển kỹ năng",block:"Đỡ đòn",dodge:"Né đòn",drink:"Uống bình"}[p.action.kind]) : "Sẵn sàng"}</div>
        ${p.allyPawn?.isAlive?'<div>Đồng minh: <b>'+p.allyPawn.name+'</b>'+ (p.pactTarget?' • Truy tìm '+p.pactTarget.name:'')+'</div>':''}
        <div class="section-title">Trạng thái cảm xúc</div>
        <div class="emotion-row"><span>Phẫn nộ:</span><b>${Math.round(p.anger||0)}%</b></div>
        <div class="emotion-row"><span>Chiến ý:</span> <b>${Math.round(p.battleWill||0)}%</b></div>
        <div class="emotion-row"><span>Quyết định:</span> <b>${p.decisionReason||p.combatTactic||p.objective||'Quan sát'}</b></div>
        <div class="emotion-row"><span>Cam kết:</span> <b>${p.survivalTarget?.isAlive?'Tử chiến: '+p.survivalTarget.name:Math.max(0,(p.plan?.until||0)-(p.decisionTime||0)).toFixed(1)+'s'}</b></div>
        <div class="emotion-row"><span>Sợ hãi (Fear):</span> <b>${fearPct}%</b></div>
        <div class="bar-container"><div class="bar-fill bar-fear" style="width: ${fearPct}%"></div></div>
        <div class="emotion-row"><span>Tự tin (Confidence):</span> <b>${confPct}%</b></div>
        <div class="bar-container"><div class="bar-fill bar-conf" style="width: ${confPct}%"></div></div>
        <div class="emotion-row"><span>Tuyệt vọng (Despair):</span> <b>${despPct}%</b></div>
        <div class="bar-container"><div class="bar-fill bar-despair" style="width: ${despPct}%"></div></div>
      </div>

      <div class="inspect-section">
        <div class="section-title">Trang Bị (Paperdoll)</div>
        <div class="item-slot">⚔️ Vũ khí: <b>${weaponName}</b></div>
        <div class="item-slot">🛡️ Giáp ngực: <b>${armorName}</b></div>
        <div class="item-slot">🪖 Mũ bảo hộ: <b>${helmetName}</b></div>
        <div class="item-slot">🥾 Giày: <b>${p.boots?.name||"Không"}</b></div>
        ${window.GameEntities.RelicSystem.equipment(p).filter(d=>d.tier==="ancient").map(d=>'<div class="inspect-skill-item"><b>🏺 '+d.name+'</b><div class="skill-desc">'+d.desc+'</div></div>').join('')}
      </div>

      <div class="inspect-section">
        <div class="section-title">Kỹ năng tự chọn • không giới hạn nhánh</div>
        ${skillsHtml}
        ${(p.passives||[]).map(s=>'<div class="inspect-skill-item"><b>'+s.name+' (Nội tại)</b><div class="skill-desc">'+s.desc+'</div></div>').join('')}
      </div>
    `;
  },

  skillDescription(e,s) {
    const c=window.GameEntities.CombatSystem.getSkillConfig(e,s);
    const status=s.cooldownTimer>0 ? "Hồi chiêu "+s.cooldownTimer.toFixed(1)+"s" : "Sẵn sàng";
    const damage = /heal|buff|stance|stasis|stealth|smoke|speed|swap|shield|^teleport$/.test(c.type) ? "" : " • Sát thương cơ bản "+Math.round(c.damage);
    const details = c.role ? c.desc : c.monsterEffect ? 'Chuẩn bị '+c.windup+'s • '+c.damageScale+'× ATK tổng • '+c.desc+' • Nhịp phép chung '+(e.tier===5?'2':'3')+'s' : c.type==='ancient_skill' ? 'Cảnh báo '+c.windup+'s • '+c.desc+(c.phase?' • Chỉ phase 2':'') : /heal/.test(c.type) ? 'Hồi máu có giới hạn khi thi triển.' : /stance|shield|stasis/.test(c.type) ? 'Đỡ sát thương chính diện trong thời gian ngắn.' : /stealth|smoke/.test(c.type) ? 'Ẩn thân ngắn và tăng tốc để thoát giao tranh.' : /speed|teleport/.test(c.type) ? 'Di chuyển chiến thuật với cự ly/tốc độ giới hạn.' : /buff|swap/.test(c.type) ? 'Cường hóa vũ khí trong thời gian ngắn.' : 'Có lấy đà; có thể đỡ hoặc né.'+(c.stun?' Choáng tối đa '+c.stun+'s.':'')+(c.slow?' Làm chậm '+Math.round(c.slow*100)+'%.':'');
    return status+' • Cooldown '+c.cooldown+'s'+(c.manaCost?' • '+c.manaCost+' mana':'')+(c.staminaCost?' • '+c.staminaCost+' thể lực':'')+damage+'<br>'+details;
  },
  renderMonsterInspect: function(m) {
    this.panelEl.innerHTML = `
      <div class="inspect-header">
        <div class="inspect-title">${m.name}</div>
        <button class="inspect-close" onclick="window.GameUI.InspectModal.inspect(null)">✕</button>
      </div>

      <div class="inspect-subtitle">
        <span class="badge badge-tier">${m.tierName} (Bậc ${m.tier})</span>
      </div>

      <div class="inspect-section">
        <div class="inspect-bar-label">${m.isAncient?"Phase "+m.phase+" / 2 • ":""}Máu: ${Math.round(m.currentHp)} / ${m.maxHp} • ${({3:1,4:3,5:5}[m.tier])?"Ngoài combat: hồi "+({3:1,4:3,5:5}[m.tier])+"% HP/s • Trong combat: 1 HP/s":"Hồi 1 HP/s"}</div>
        <div class="bar-container"><div class="bar-fill bar-hp" style="width: ${(m.currentHp / m.maxHp) * 100}%"></div></div>
      </div>

      <div class="inspect-section">
        ${m.isAncient?'<div>Thanh HP 1: '+(m.phase===1?Math.round(m.currentHp):0)+' / '+m.phaseMaxHp+'</div><div>Thanh HP 2: '+(m.phase===1?m.phaseMaxHp:Math.round(m.currentHp))+' / '+m.phaseMaxHp+'</div><div>Miễn khống chế: 100% • Lá chắn: '+Math.round(m.shield||0)+'</div>':''}
        <div class="section-title">Chỉ Số Thực Chiến</div>
        <div>Tấn công: <b>${m.attack}</b></div>
        <div>Phòng ngự: <b>${m.defense}</b></div>
        <div>Tốc độ chạy: <b>${m.speed}</b></div><div>Tầm đánh: <b>${window.GameEntities.CombatSystem.combatStats(m).range}</b> • Tầm nhìn: <b>${window.GameEntities.CombatSystem.visionRange(m)}</b></div>
        <div>Sinh cảnh: <b>${m.territory?.name||window.GameData.HabitatNames[m.habitat]||'—'}</b></div>
        <div>EXP khi hạ: <b>${m.expReward}</b></div>
        <div>Nhịp phép chung: <b>${m.globalSkillCooldown>0?m.globalSkillCooldown.toFixed(1)+'s':'Sẵn sàng'}</b> • Tối đa 1 phép / ${m.tier>=6?1:m.tier===5?2:3}s</div>
        <div>Mục tiêu: <b>${m.objective||"Canh giữ sinh cảnh"}</b></div>
        ${m.tier>=6?'<div>Lượt '+(m.gauntletRound||1)+'/'+window.GameEntities.AncientSystem.total+' • Hai phase • Rơi 1 Thượng Bảo không trùng; boss tiếp theo sau 10s.</div>':`<div>Phẩm chất rơi đồ: <b>${m.dropTier}</b></div>
        <div>Tỷ lệ rơi: <b>${[0,20,30,40,100,100][m.tier]}%</b> • ${m.tier===5?"1 bình máu + vũ khí, giáp, mũ Thần Khí":m.tier===4?"1 bình máu + 1 trang bị/vũ khí":"1 bình máu hoặc 1 trang bị/vũ khí"}</div>`}
      </div>
      <div class="inspect-section"><div class="section-title">Kỹ năng quái</div>
        ${(m.skills || []).map(s=>'<div class="inspect-skill-item"><span class="skill-name">'+s.def.name+'</span><div class="skill-desc">'+this.skillDescription(m,s)+'</div></div>').join('') || '<div class="skill-desc">Đánh thường • Có lấy đà • Cooldown 1.1s</div>'}
        ${window.GameEntities.CombatSystem.passiveList(m).map(s=>'<div class="inspect-skill-item"><span class="skill-name">'+s.name+' (Nội tại)</span><div class="skill-desc">'+(s.desc || 'Đặc tính loài')+'<br>'+(s.cooldownTimer>0?'Hồi chiêu '+s.cooldownTimer.toFixed(1)+'s':'Sẵn sàng')+'</div></div>').join('')}
      </div>
    `;
  }
};
