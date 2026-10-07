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
    const classDef = window.GameData.Classes[p.classId] || { name: 'Vô Định Hình (Chưa có vũ khí)', role: 'Tự do' };

    const thresholds=window.GameData.LevelTable.expRequirements;
    const levelBase=thresholds[p.level-1]||0,next=p.level<15?thresholds[p.level]:null;
    const xpInLevel=Math.max(0,p.currentExp-levelBase),xpNeeded=next===null?0:next-levelBase;
    const fearPct = Math.round(p.fear || 0);
    const confPct = Math.round(p.confidence || 0);
    const despPct = Math.round(p.despair || 0);

    const weaponName = p.weapon ? `${p.weapon.name} (${window.GameData.Equipments.TIER_NAMES[p.weapon.tier]})` : 'Tay Không';
    const armorName = p.armor ? `${p.armor.name} (+${p.armor.defense} Giáp)` : 'Áo Vải Thường';
    const helmetName = p.helmet ? `${p.helmet.name} (+${p.helmet.defense} Giáp)` : 'Không';

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
        <span class="badge badge-class">${classDef.name}</span>
        <span class="badge badge-trait">${traitDef.name || p.trait}</span>
        <span class="badge badge-level">Lv ${p.level} (Kills: ${p.killCount})</span>
      </div>

      <div class="inspect-section">
        <div class="inspect-bar-label">${next===null?"EXP: Đã đạt cấp tối đa":"EXP: "+xpInLevel+" / "+xpNeeded+" • Còn "+Math.max(0,next-p.currentExp)+" EXP để lên cấp"}</div>
        <div class="inspect-bar-label">Máu: ${Math.round(p.currentHp)} / ${p.maxHp}</div>
        <div class="bar-container"><div class="bar-fill bar-hp" style="width: ${(p.currentHp / p.maxHp) * 100}%"></div></div>

        <div class="inspect-bar-label">Thể Lực: ${Math.round(p.currentStamina)} / ${p.maxStamina}</div>
        <div class="bar-container"><div class="bar-fill bar-stamina" style="width: ${(p.currentStamina / p.maxStamina) * 100}%"></div></div>

        <div class="inspect-bar-label">Mana: ${Math.round(p.currentMana)} / ${p.maxMana}</div>
        <div class="bar-container"><div class="bar-fill bar-mana" style="width: ${(p.currentMana / p.maxMana) * 100}%"></div></div>
      </div>

      <div class="inspect-section">
        <div class="section-title">Suy nghĩ & mục tiêu hiện tại</div>
        <div class="bot-objective">${p.objective || "Quan sát chiến trường"}</div>
        <p class="bot-thought">${p.thought || "Đang lựa chọn hành động."}</p>
        <div>Bình máu: <b>${p.healthPotions || 0}</b> • ${p.action ? ({attack:"Ra đòn",skill:"Thi triển kỹ năng",block:"Đỡ đòn",dodge:"Né đòn",drink:"Uống bình"}[p.action.kind]) : "Sẵn sàng"}</div>
        <div class="section-title">Trạng thái cảm xúc</div>
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
      </div>

      <div class="inspect-section">
        <div class="section-title">Kỹ Năng Đã Mở Khóa</div>
        ${skillsHtml}
      </div>
    `;
  },

  skillDescription(e,s) {
    const c=window.GameEntities.CombatSystem.getSkillConfig(e,s);
    const status=s.cooldownTimer>0 ? "Hồi chiêu "+s.cooldownTimer.toFixed(1)+"s" : "Sẵn sàng";
    const damage = /heal|buff|stance|stasis|stealth|smoke|speed|swap|shield|^teleport$/.test(c.type) ? "" : " • Sát thương cơ bản "+Math.round(c.damage);
    const details = /heal/.test(c.type) ? 'Hồi máu có giới hạn khi thi triển.' : /stance|shield|stasis/.test(c.type) ? 'Đỡ sát thương chính diện trong thời gian ngắn.' : /stealth|smoke/.test(c.type) ? 'Ẩn thân ngắn và tăng tốc để thoát giao tranh.' : /speed|teleport/.test(c.type) ? 'Di chuyển chiến thuật với cự ly/tốc độ giới hạn.' : /buff|swap/.test(c.type) ? 'Cường hóa vũ khí trong thời gian ngắn.' : 'Có lấy đà; có thể đỡ hoặc né.'+(c.stun?' Choáng tối đa '+c.stun+'s.':'')+(c.slow?' Làm chậm '+Math.round(c.slow*100)+'%.':'');
    return status+' • Cooldown '+c.cooldown+'s'+damage+'<br>'+details;
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
        <div class="inspect-bar-label">Máu: ${Math.round(m.currentHp)} / ${m.maxHp}</div>
        <div class="bar-container"><div class="bar-fill bar-hp" style="width: ${(m.currentHp / m.maxHp) * 100}%"></div></div>
      </div>

      <div class="inspect-section">
        <div class="section-title">Chỉ Số Thực Chiến</div>
        <div>Tấn công: <b>${m.attack}</b></div>
        <div>Phòng ngự: <b>${m.defense}</b></div>
        <div>Tốc độ chạy: <b>${m.speed}</b></div>
        <div>Phẩm chất rơi đồ: <b>${m.dropTier}</b></div>
        <div>Tỷ lệ rơi: <b>${[0,20,30,40,100,100][m.tier]}%</b> • ${m.tier>=4?"1 bình máu + 1 trang bị/vũ khí":"1 bình máu hoặc 1 trang bị/vũ khí"}</div>
      </div>
      <div class="inspect-section"><div class="section-title">Kỹ năng quái</div>
        ${(m.skills || []).map(s=>'<div class="inspect-skill-item"><span class="skill-name">'+s.def.name+'</span><div class="skill-desc">'+this.skillDescription(m,s)+'</div></div>').join('') || '<div class="skill-desc">Đánh thường • Có lấy đà • Cooldown 1.1s</div>'}
        ${(m.passives || []).map(s=>'<div class="inspect-skill-item"><span class="skill-name">'+s.name+' (Nội tại)</span><div class="skill-desc">'+(s.desc || 'Đặc tính loài')+'<br>'+(s.cooldownTimer>0?'Hồi chiêu '+s.cooldownTimer.toFixed(1)+'s':'Sẵn sàng')+'</div></div>').join('')}
      </div>
    `;
  }
};
