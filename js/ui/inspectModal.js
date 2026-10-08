/**
 * inspectModal.js - Bảng Soi Chi Tiết Chỉ Số, Cảm Xúc, Trang Bị và Cây Kỹ Năng
 */
window.GameUI = window.GameUI || {};

window.GameUI.InspectModal = {
  currentEntity: null,tab:'overview',
  panelEl: null,

  init: function() {
    this.panelEl = document.getElementById('inspect-panel');
  },

  inspect: function(entity) {
    if(this.currentEntity!==entity&&this.panelEl){this.panelEl.scrollTop=0;const content=this.panelEl.querySelector?.('.inspect-content');if(content)content.scrollTop=0;this.tab='overview';}
    this.currentEntity = entity;
    document.body?.classList.toggle('inspect-open',!!entity);
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

  selectTab(tab){this.tab=tab;const content=this.panelEl.querySelector?.('.inspect-content');if(content)content.scrollTop=0;this.updateContent();},
  setContent(html){
    const split=html.indexOf('<div class="inspect-section');
    const count=this.activeSkills(this.currentEntity).length+window.GameEntities.CombatSystem.passiveList(this.currentEntity).length;
    const tabs=[['overview','Tổng quan'],['equipment','Trang bị'],['skills','Kỹ năng '+count]].map(([id,label])=>'<button type="button" data-inspect-action="'+id+'" aria-pressed="'+(this.tab===id)+'" onclick="window.GameUI.InspectModal.selectTab(\''+id+'\')">'+label+'</button>').join('');
    const markup='<div class="inspect-top">'+html.slice(0,split)+'<nav class="inspect-tabs" aria-label="Thông tin đối tượng">'+tabs+'</nav></div><div class="inspect-content">'+html.slice(split)+'</div>';
    const kind=this.currentEntity.isPawn?'pawn':'monster';
    const content=this.panelEl.querySelector?.('.inspect-content');
    this.panelEl.dataset.tab=this.tab;
    if(!content||this.panelEl.dataset.kind!==kind){
      this.panelEl.innerHTML=markup;this.panelEl.dataset.kind=kind;return;
    }
    // Keep interactive nodes mounted while live stats and cooldowns change.
    const template=document.createElement('template');template.innerHTML=markup;
    for(const selector of ['.inspect-header > div','.inspect-subtitle']){
      this.panelEl.querySelector(selector).innerHTML=template.content.querySelector(selector).innerHTML;
    }
    this.panelEl.querySelectorAll('.inspect-tabs button').forEach(button=>{
      button.setAttribute('aria-pressed',button.dataset.inspectAction===this.tab);
      if(button.dataset.inspectAction==='skills')button.textContent='Kỹ năng '+count;
    });
    const sections=template.content.querySelector('.inspect-content').children;
    for(let i=0;i<sections.length;i++){
      const current=content.children[i],next=sections[i];
      current.className=next.className;
      if(current.querySelector('.personality-details')){
        for(const selector of ['.inspect-status','.personality-content'])current.querySelector(selector).innerHTML=next.querySelector(selector).innerHTML;
      }else current.innerHTML=next.innerHTML;
    }
  },
  activeSkills(e){return [...new Set([...(e.skills||[]),...(e.copiedSkills||[])])];},
  skillSummaries:{
    w_thunder_slash:'Chém sét phía trước và để lại vệt điện cản bước địch.',
    w_shield_bash:'Lao khiên áp sát, đỡ đòn phía trước và làm choáng đối thủ.',
    w_whirlwind:'Quét kiếm quanh người qua ba nhịp để ép đối thủ rời vị trí.',
    w_crushing_charge:'Lao thẳng, đẩy địch về phía tường và mở cơ hội đánh nối.',
    w_second_wind:'Lùi lại và hồi máu; bị đánh sẽ ngừng hồi.',
    w_execution_cleave:'Bổ mạnh để kết liễu mục tiêu ít máu.',
    w_earthquake_stomp:'Dậm đất tạo sóng chấn động cản di chuyển quanh người.',
    w_iron_wall:'Giữ thế đỡ phía trước để chặn đòn và tìm cơ hội phản công.',
    w_armor_piercer:'Đâm vào điểm yếu, làm nứt giáp để các đòn sau hiệu quả hơn.',
    w_riposte:'Đỡ rồi phản lại một đòn tấn công phía trước.',
    m_fireball:'Phóng cầu lửa nổ và để lại vùng nóng cản đường.',
    m_frost_bolt:'Bắn băng làm chậm; liên tiếp trúng có thể đóng băng địch.',
    m_blink:'Dịch chuyển nhanh để đổi góc hoặc thoát áp sát, dừng trước vật cản.',
    m_gravity_vortex:'Tạo vòng xoáy kéo đối thủ vào giữa theo từng nhịp.',
    m_mana_shield:'Dùng mana hấp thụ sát thương bằng lá chắn.',
    m_meteor_strike:'Gọi thiên thạch xuống điểm đã ngắm và để lại hố nóng.',
    m_ice_block:'Bọc giáp băng chống đòn, nhưng hạn chế hành động của bản thân.',
    a_double_tap:'Bắn hai mũi tên liên tiếp để ép đối thủ né nhiều nhịp.',
    a_disengage_vault:'Nhảy lùi tạo khoảng cách đồng thời bắn trả.',
    a_rain_of_arrows:'Rải ba đợt tên vào một vùng để khóa đường di chuyển.',
    a_snipe:'Ngắm kỹ rồi bắn mạnh vào điểm yếu; bị đánh có thể mất ngắm.',
    a_windrunner:'Tăng tốc để đổi vị trí, truy đuổi hoặc rút lui.',
    as_shadowstep:'Lướt tới sườn và đánh mạnh hơn khi tiếp cận sau lưng.',
    as_vanish:'Ẩn thân để đổi hướng; tấn công hoặc bị đánh sẽ lộ diện.',
    as_throat_slit:'Chém gây chảy máu và ngắt đối thủ đang niệm phép.',
    as_smoke_bomb:'Tạo màn khói che tầm nhìn để thoát thân hoặc đổi góc đánh.',
    as_assassinate:'Áp sát tung đòn kết liễu vào đối thủ ít máu.',
    h_armament_swap:'Chuyển thế công hoặc thủ để cường hóa đòn đánh và đỡ đòn.',
    h_enchanted_blade:'Nạp linh lực cho các đòn đánh tiếp theo.',
    h_healing_aura:'Tạo vùng hồi máu cho bản thân và đồng minh đứng bên trong.',
    h_wind_form:'Tăng tốc và giải làm chậm để áp sát hoặc thoát thân.',
    h_chaos_bolt:'Phóng đạn hỗn mang gây áp lực lên thế đỡ hoặc ngắt niệm phép.',
    p_rebound_step:'Né thành công mở một bước lướt để chọn lại khoảng cách.',
    p_opening_stride:'Khi địch đánh hụt, tận dụng sơ hở để tiến lên hoặc vòng sườn.',
    p_ambush_shadow:'Sau khi khuất tầm nhìn, có thêm bước áp sát hoặc rút lui bất ngờ.',
    p_frost_trail:'Đánh dấu lạnh rồi né để lại vệt băng cản kẻ truy đuổi.',
    p_tether_pivot:'Đánh trúng liên tiếp đặt dây giữ cự ly và tạo cơ hội vòng sườn.',
    p_feint_afterimage:'Đổi hướng khi né tạo dư ảnh đánh lạc hướng đòn đang nhắm.',
    p_blood_reserve:'Đánh trúng liên tiếp tích máu để hồi khi tạo được khoảng trống.',
    p_flexible_armor:'Đỡ thành công giữ một lớp giáp bảo vệ cho đòn tiếp theo.',
    p_recovery_cycle:'Giữ khoảng trống để hồi máu; bị đánh sẽ ngừng hồi.',
    p_protective_charge:'Bảo vệ một lần khỏi bị ngắt khi đang dùng kỹ năng hỗ trợ.',
    p_blood_body:'Tăng hồi máu trong giao tranh; từ bậc 2 bùng hồi khi máu xuống thấp.',
    p_last_exit:'Khi máu nguy hiểm, tạo khiên ngắn và mở cơ hội thoát thân.',
    p_counter_shock:'Đỡ chính xác làm địch mất thế, mở cơ hội phản công.',
    p_exhausting_venom:'Đánh trúng liên tiếp đặt nọc, buộc địch đổi vị trí hoặc ngừng niệm.',
    p_ember_reversal:'Chịu nhiều đòn rồi đỡ hoặc né thành công tạo lửa cắt đường bám.',
    p_cornered_instinct:'Khi bị dồn đường cùng, mở cơ hội đỡ, đánh trả hoặc xoay tìm lối thoát.',
    p_pattern_reading:'Nhận ra đòn lặp lại của đối thủ để né hoặc phản công đúng nhịp.',
    p_turning_momentum:'Ngắt chiêu hoặc hạ địch mở bước di chuyển để chiếm vị trí hay nhặt đồ.',
    am_original_1:'Sao chép và cường hóa kỹ năng đầu tiên của đối thủ.',
    am_original_2:'Sao chép và cường hóa kỹ năng thứ hai của đối thủ.'
  },
  skillDescription(e,s,passive=false){
    if(this.skillSummaries[s.id])return this.skillSummaries[s.id];
    const c=passive?s:window.GameEntities.CombatSystem.getSkillConfig(e,s);
    const text=passive?(s.ranks?.[(s.tier||1)-1]?.desc||s.desc):c.desc;
    return String(text||'Tạo lợi thế khi giao tranh.').split(' • ')[0].split(';')[0]
      .replace(/\bsemantics\b/g,'hiệu ứng').replace(/\btracking\b/g,'bám mục tiêu').replace(/\bprojectile\b/gi,'đạn')
      .replace(/\bguard\b/gi,'thế đỡ').replace(/\bcover\b/gi,'vật che chắn').replace(/\bdash\b/gi,'lướt')
      .replace(/\bchannel\b/gi,'niệm phép').replace(/\bsilence\b/gi,'cấm dùng kỹ năng').replace(/\bslow\b/gi,'làm chậm')
      .replace(/\bHP\b/g,'máu').replace(/\bCC\b/g,'khống chế').replace(/\bphase\b/gi,'giai đoạn').replace(/\bcharge\b/gi,'lượt')
      .replace(/\bdamage\b/gi,'sát thương').replace(/\bpulse\b/gi,'nhịp').replace(/\bbuild\b/gi,'kỹ năng').replace(/\blane\b/gi,'đường')
      .replace(/\bAoE\b/g,'sát thương diện rộng').replace(/\bstamina\b/gi,'thể lực').replace(/\bCD\b/g,'hồi chiêu');
  },
  skillCard(e,s,passive=false){
    const c=passive?s:window.GameEntities.CombatSystem.getSkillConfig(e,s),remaining=Math.max(0,s.cooldownTimer||0);
    const duration=Math.max(c.cooldown||0,remaining),progress=duration?Math.max(0,Math.min(100,(1-remaining/duration)*100)):100;
    const cooldown=c.cooldown?c.cooldown.toFixed(1).replace('.0','')+' giây':'Liên tục';
    return '<div class="inspect-skill-item '+(remaining?'skill-cooling':'skill-ready')+'" style="--skill-progress:'+progress+'%">'+
      '<span class="skill-name">'+(s.def?.name||s.name)+(passive?' · Nội tại':'')+'</span><div class="skill-desc">'+this.skillDescription(e,s,passive)+'</div>'+
      '<div class="skill-cooldown">'+(c.cooldown?'Hồi chiêu: ':'')+cooldown+(remaining?' · Còn '+remaining.toFixed(1)+' giây':'')+'</div>'+
      '<div class="skill-progress" role="progressbar" aria-label="Hồi chiêu '+(s.def?.name||s.name)+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(progress)+'"></div></div>';
  },
  weaponDetails(w,label='Vũ khí'){
    if(!w)return '<div class="item-slot">⚔️ Vũ khí: <b>Tay không</b></div>';
    const fields=[['attack','Tấn công'],['magicPower','Sức mạnh phép'],['defense','Phòng ngự'],['magicDefense','Kháng phép'],['hp','Máu tối đa'],['manaMax','Mana tối đa'],['staminaMax','Thể lực tối đa'],['moveBonus','Tốc di chuyển',true],['range','Tầm đánh'],['speed','Tốc đánh'],['critChance','Chí mạng',true],['lifeSteal','Hút máu',true],['cooldownReduction','Giảm hồi chiêu',true]];
    return '<div class="weapon-details"><div class="equipment-label">'+label+'</div><div class="item-slot"><b class="equipment-name" style="color:'+window.GameData.Equipments.TIER_COLORS[w.tier]+'">'+w.name+'</b></div><div class="skill-summary">'+(window.GameData.Equipments.TIER_NAMES[w.tier]||w.tier)+'</div><dl class="weapon-stats">'+fields.filter(([key])=>typeof w[key]==='number').map(([key,label,percent])=>'<div><dt>'+label+'</dt><dd>'+ (percent?Math.round(w[key]*100)+'%':key==='speed'?w[key]+'×':w[key])+'</dd></div>').join('')+'</dl>'+this.equipmentEffects(w)+'</div>';
  },
  equipmentEffects(w){
    const effects=[w.passive,w.effect||w.reviveOnce?w.desc:null];
    if(w.fireResist)effects.push('Kháng lửa '+Math.round(w.fireResist*100)+'%.');
    if(w.heavyDmgReduction)effects.push('Giảm '+w.heavyDmgReduction+' sát thương từ đòn nặng.');
    if(w.burnImmune)effects.push('Miễn nhiễm cháy.');
    if(w.fireDmgReduction)effects.push('Giảm '+Math.round(w.fireDmgReduction*100)+'% sát thương lửa.');
    const descriptions=effects.filter(Boolean).map(desc=>'<div class="equipment-effect"><span>Hiệu ứng</span><p>'+desc+'</p></div>').join('');
    return descriptions+(w.desc&&!effects.includes(w.desc)?'<div class="equipment-effect"><span>Mô tả</span><p>'+w.desc+'</p></div>':'');
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


    const actives=this.activeSkills(p),passives=window.GameEntities.CombatSystem.passiveList(p);
    const skillsHtml=actives.map(s=>this.skillCard(p,s)).join('')||'<div class="text-muted">Chưa học kỹ năng chủ động</div>';

    this.setContent(`
      <div class="inspect-header">
        <div><div class="inspect-level">Cấp ${p.level}</div><div class="inspect-title">${p.name}</div></div>
        <button class="inspect-close" data-inspect-action="close" aria-label="Đóng bảng thông tin" onclick="window.GameUI.InspectModal.inspect(null)">✕</button>
      </div>

      <div class="inspect-subtitle">
        <span class="badge badge-class">Vũ khí: ${classDef.name}</span>
        <span class="badge badge-trait">${traitDef.name || p.trait}</span>
        <span class="badge badge-level">Hạ gục: ${p.killCount}</span>
      </div>

      <div class="inspect-section pane-overview">
        <div class="inspect-bar-label">${"EXP: "+xpInLevel+" / "+xpNeeded+" • Còn "+Math.max(0,next-p.currentExp)+" EXP để lên cấp"}</div>
        <div class="inspect-bar-label">Máu: ${Math.round(p.currentHp)} / ${p.maxHp} • Hồi 1 HP/s</div>
        <div class="bar-container"><div class="bar-fill bar-hp" style="width: ${(p.currentHp / p.maxHp) * 100}%"></div></div>

        <div class="inspect-bar-label">Thể Lực: ${Math.round(p.currentStamina)} / ${p.maxStamina}</div>
        <div class="bar-container"><div class="bar-fill bar-stamina" style="width: ${(p.currentStamina / p.maxStamina) * 100}%"></div></div>

        <div class="inspect-bar-label">Mana: ${Math.round(p.currentMana)} / ${p.maxMana}</div>
        <div class="bar-container"><div class="bar-fill bar-mana" style="width: ${(p.currentMana / p.maxMana) * 100}%"></div></div>
      </div>

      <div class="inspect-section pane-overview">
        <div class="inspect-status"><div class="section-title">Chỉ số thực chiến</div>
        <div>ATK: <b>${stats.attack}</b> • DEF: <b>${stats.defense}</b> • Kháng phép: <b>${stats.magicDefense}</b></div>
        <div>Tốc độ: <b>${Math.round(stats.speed)}</b> • Tầm đánh: <b>${stats.range}</b> • Tầm nhìn: <b>${window.GameEntities.CombatSystem.visionRange(p)}</b> • Chí mạng: <b>${Math.round(Math.min(.35,(p.critChance||0)+(p.weapon?.critChance||0))*100)}%</b></div>
        <div class="inspect-intent"><div class="section-title">Suy nghĩ & mục tiêu hiện tại</div>
        <div class="bot-objective">${p.objective || "Quan sát chiến trường"}</div>
        <p class="bot-thought">${p.thought || "Đang lựa chọn hành động."}</p>
        <div>Chiến thuật: <b>${p.isHiding?"Đang ẩn nấp":p.combatTactic|| (p.chase?"Truy đuổi có giới hạn":"Cơ động")}</b></div><div>Bình máu: <b>${p.healthPotions || 0}</b>${p.fullHealthPotions?' + '+p.fullHealthPotions+' bình hồi đầy':''} • ${p.action ? ({attack:"Ra đòn",skill:"Thi triển kỹ năng",block:"Đỡ đòn",dodge:"Né đòn",drink:"Uống bình"}[p.action.kind]) : "Sẵn sàng"}</div>
        <div>Đồng minh: <b>${p.allyPawn?.isAlive?p.allyPawn.name:'Không'}</b>${p.allyPawn?.isAlive&&p.pactTarget?' • Truy tìm '+p.pactTarget.name:''}</div></div>
        </div><details class="personality-details"><summary data-inspect-action="personality">Tính cách & cảm xúc</summary><div class="personality-content">
        <div class="section-title">Tính cách cá nhân</div>
        <div>Chủ đạo: ${traitDef.name} • Phụ: ${window.GameData.Traits[p.secondaryTrait]?.name||'—'}</div>
        ${Object.entries(window.GameData.PersonalityAxes).map(([key,name])=>'<div class="emotion-row"><span>'+name+':</span><b>'+personality[key]+'/100</b></div>').join('')}
        <div class="section-title">Trạng thái cảm xúc</div>
        <div class="emotion-row"><span>Phẫn nộ:</span><b>${Math.round(p.anger||0)}%</b></div>
        <div class="emotion-row"><span>Chiến ý:</span> <b>${Math.round(p.battleWill||0)}%</b></div>
        <div class="emotion-row decision-row"><span>Quyết định:</span> <b>${p.decisionReason||p.combatTactic||p.objective||'Quan sát'}</b></div>
        <div class="emotion-row decision-row"><span>Cam kết:</span> <b>${p.survivalTarget?.isAlive?'Tử chiến: '+p.survivalTarget.name:Math.max(0,(p.plan?.until||0)-(p.decisionTime||0)).toFixed(1)+'s'}</b></div>
        <div class="emotion-row"><span>Sợ hãi (Fear):</span> <b>${fearPct}%</b></div>
        <div class="bar-container"><div class="bar-fill bar-fear" style="width: ${fearPct}%"></div></div>
        <div class="emotion-row"><span>Tự tin (Confidence):</span> <b>${confPct}%</b></div>
        <div class="bar-container"><div class="bar-fill bar-conf" style="width: ${confPct}%"></div></div>
        <div class="emotion-row"><span>Tuyệt vọng (Despair):</span> <b>${despPct}%</b></div>
        <div class="bar-container"><div class="bar-fill bar-despair" style="width: ${despPct}%"></div></div>
        </div></details>
      </div>

      <div class="inspect-section pane-equipment">
        <div class="section-title">Trang bị</div>
        ${this.weaponDetails(p.weapon)}
        ${p.armor?this.weaponDetails(p.armor,'Giáp ngực'):'<div class="empty-slot">Giáp ngực · Chưa trang bị</div>'}
        ${p.helmet?this.weaponDetails(p.helmet,'Mũ'):'<div class="empty-slot">Mũ · Chưa trang bị</div>'}
        ${p.boots?this.weaponDetails(p.boots,'Giày'):'<div class="empty-slot">Giày · Chưa trang bị</div>'}
      </div>

      <div class="inspect-section pane-skills">
        <div class="section-title">Kỹ năng (${actives.length+passives.length})</div><div class="skill-summary">${actives.length} chủ động • ${passives.length} nội tại</div>
        ${skillsHtml}
        ${passives.map(s=>this.skillCard(p,s,true)).join('')}
      </div>
    `);
  },

  renderMonsterInspect: function(m) {
    const actives=this.activeSkills(m),passives=window.GameEntities.CombatSystem.passiveList(m);
    this.setContent(`
      <div class="inspect-header">
        <div><div class="inspect-level">${m.level?"Cấp "+m.level:"Bậc "+m.tier}</div><div class="inspect-title">${m.name}</div></div>
        <button class="inspect-close" data-inspect-action="close" aria-label="Đóng bảng thông tin" onclick="window.GameUI.InspectModal.inspect(null)">✕</button>
      </div>

      <div class="inspect-subtitle">
        <span class="badge badge-tier">${m.tierName} (Bậc ${m.tier})</span>
      </div>

      <div class="inspect-section pane-overview">
        <div class="inspect-bar-label">${m.isAncient?"Phase "+m.phase+" / 2 • ":""}Máu: ${Math.round(m.currentHp)} / ${m.maxHp} • ${({3:1,4:3,5:5}[m.tier])?"Ngoài combat: hồi "+({3:1,4:3,5:5}[m.tier])+"% HP/s • Trong combat: 1 HP/s":"Hồi 1 HP/s"}</div>
        <div class="bar-container"><div class="bar-fill bar-hp" style="width: ${(m.currentHp / m.maxHp) * 100}%"></div></div>
      </div>

      <div class="inspect-section pane-overview">
        ${m.isAncient?'<div>Thanh HP 1: '+(m.phase===1?Math.round(m.currentHp):0)+' / '+(m.profile?.hp||m.phaseMaxHp)+'</div><div>Thanh HP 2: '+(m.phase===1?(m.profile?.hp2||m.phaseMaxHp):Math.round(m.currentHp))+' / '+(m.profile?.hp2||m.phaseMaxHp)+'</div><div>Miễn khống chế: 100% • Lá chắn: '+Math.round(m.shield||0)+'</div>':''}
        <div class="section-title">Chỉ Số Thực Chiến</div>
        <div>Tấn công: <b>${m.attack}</b></div>
        <div>Phòng ngự: <b>${m.defense}</b></div>
        <div>Tốc độ chạy: <b>${m.speed}</b></div><div>Tầm đánh: <b>${window.GameEntities.CombatSystem.combatStats(m).range}</b> • Tầm nhìn: <b>${window.GameEntities.CombatSystem.visionRange(m)}</b></div>
        <div>Sinh cảnh: <b>${m.territory?.name||window.GameData.HabitatNames[m.habitat]||'—'}</b></div>
        <div>EXP khi hạ: <b>${m.expReward}</b></div>
        <div>Nhịp phép chung: <b>${m.globalSkillCooldown>0?m.globalSkillCooldown.toFixed(1)+'s':'Sẵn sàng'}</b> • Tối đa 1 phép / ${m.tier>=6?1:m.tier===5?2:3}s</div>
        <div class="monster-objective">Mục tiêu: <b>${m.objective||"Canh giữ sinh cảnh"}</b></div>
        ${m.tier>=6?'<div>Lượt '+(m.gauntletRound||1)+'/'+window.GameEntities.AncientSystem.total+' • Hai phase • Rơi 1 Thượng Cổ và 1 bình hồi đầy máu; boss tiếp theo sau 10s.</div>':`<div>Phẩm chất rơi đồ: <b>${m.dropTier}</b></div>
        <div>Tỷ lệ rơi: <b>${[0,20,30,40,100,100][m.tier]}%</b> • ${m.tier===5?"1 bình máu + vũ khí, giáp, mũ Thần Khí":m.tier===4?"1 bình máu + 1 trang bị/vũ khí":"1 bình máu hoặc 1 trang bị/vũ khí"}</div>`}
      </div>
      ${m.weapon?'<div class="inspect-section pane-equipment">'+this.weaponDetails(m.weapon)+'</div>':'<div class="inspect-section pane-equipment empty-slot">Đối tượng chiến đấu bằng sức mạnh tự thân, không mang trang bị.</div>'}
      <div class="inspect-section pane-skills"><div class="section-title">Kỹ năng quái (${actives.length+passives.length})</div><div class="skill-summary">${actives.length} chủ động • ${passives.length} nội tại</div>
        ${actives.map(s=>this.skillCard(m,s)).join('')||'<div class="skill-desc">Không có kỹ năng chủ động</div>'}
        ${passives.map(s=>this.skillCard(m,s,true)).join('')}
      </div>
    `);
  }
};
