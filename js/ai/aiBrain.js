/**
 * aiBrain.js - Bộ não quyết định hành vi 3 lớp động của AI Bot
 * Traits -> Emotions -> Utility Decisions (Loot, Farm, Limit, Ally, Betray, Dodge)
 */
window.GameAI = window.GameAI || {};

window.GameAI.AiBrain = {
  updatePawnAI: function(pawn, dt, spatialGrid, mapTerrain) {
    this.update(pawn, dt, spatialGrid, mapTerrain);
  },

  update: function(pawn,dt,spatialGrid,mapTerrain){
    if(!pawn.isAlive||pawn.isPlayerControlled||pawn.action)return;
    const C=window.GameEntities.CombatSystem,G=window.GameManager,P=pawn.personality||window.GameData.PersonalityProfiles[pawn.trait];
    pawn.decisionTime=(pawn.decisionTime||0)+dt;
    this.handleLevelingAndSkills(pawn);
    if(pawn.currentHp<pawn.maxHp*(.3+P.caution*.003)&&C.usePotion(pawn)){
      pawn.thought='Để dành bình cho lúc nguy hiểm: hồi máu trước khi chọn con mồi.';pawn.objective='Uống bình hồi máu';return;
    }
    const nearby=spatialGrid.queryCircle(pawn.x,pawn.y,C.visionRange(pawn));
    const threats=nearby.filter(e=>C.isEnemy(pawn,e)&&C.canSee(pawn,e));
    this.observeThreats(pawn,threats);
    // Collect useful gear underfoot even while another plan is active.
    const underfoot=this.findBestItemToLoot(pawn,nearby.filter(e=>e.isDropItem&&Math.hypot(e.x-pawn.x,e.y-pawn.y)<28));
    if(underfoot)this.lootItem(pawn,underfoot);
    if(pawn.chase&&!this.keepChasing(pawn,pawn.chase.target)){this.abandonChase(pawn);}
    if(C.tryReaction(pawn,threats))return;
    if(G.battleRoyaleResolved){
      const boss=window.GameEntities.EntityManager.worldBoss;
      const items=G.dropItems.filter(it=>!it.isCollected),item=this.findBestItemToLoot(pawn,items);
      if(item&&Math.hypot(item.x-pawn.x,item.y-pawn.y)<650&&this.lootPriority(pawn,item,threats)>0){this.seekLoot(pawn,item,dt);return;}
      if(pawn.level>=15&&!mapTerrain.remainingLords()&&pawn.currentHp<pawn.maxHp*.8&&C.usePotion(pawn)){
        pawn.objective='Chuẩn bị quyết chiến Yêu Thần';pawn.thought='Dùng bình đã nhặt trước khi bước vào điện thờ.';return;
      }
      if(pawn.level>=15&&boss?.isAlive&&!mapTerrain.remainingLords()){
        pawn.objective='Đấu với Yêu Thần: '+boss.name;pawn.thought='Đã đạt cấp 15 và hạ hết Yêu Vương. Điện thờ mở, tiến vào quyết chiến.';
        this.engageCombat(pawn,boss,dt);return;
      }
      const farm=G.monsters.filter(m=>m.isAlive&&m.isFinalHunt).sort((a,b)=>a.huntOrder-b.huntOrder);
      const target=farm.find(m=>this.canHunt(pawn,m));
      if(target){pawn.objective='Farm cấp '+pawn.level+'/15: '+target.name;pawn.thought='Hạ Yêu Vương theo sức hiện tại; tích EXP và nhặt bình, chưa đối đầu Yêu Thần.';this.engageCombat(pawn,target,dt);return;}
      pawn.targetEnemy=null;pawn.objective=pawn.level<15?'Chuẩn bị săn Yêu Vương, đạt cấp 15':'Chiến trường đã được chinh phục';
      pawn.thought='Đánh giá lại sức mạnh, tìm bình hoặc trang bị trước khi tiếp tục.';
      if(item)this.seekLoot(pawn,item,dt);return;
    }
    this.handleCoalition(pawn,threats);
    if(pawn.pactTarget&&this.pursueCoalition(pawn,threats,dt))return;
    if(pawn.isClutchEscape||((pawn.fleeTime||0)<6&&pawn.fear>80+P.aggression*.1&&pawn.currentHp<pawn.maxHp*.35)){
      pawn.fleeTime=(pawn.fleeTime||0)+dt;this.fleeFromThreats(pawn,spatialGrid,mapTerrain,dt);return;
    }
    if(pawn.fear<35)pawn.fleeTime=0;
    const monsters=threats.filter(e=>e.isMonster&&e.tier<5);
    const enemies=threats.filter(e=>e.isPawn);
    const danger=threats.find(e=>C.canSee(e,pawn)&&this.calculateWinRate(pawn,e)<(e.isPawn ? .48 : .4)&&Math.hypot(e.x-pawn.x,e.y-pawn.y)<(e.isPawn?C.visionRange(pawn):160));
    if(danger){
      const chance=this.calculateWinRate(pawn,danger),cornered=!this.hasRetreatRoute(pawn,danger);
      const fighting=pawn.targetEnemy===danger||pawn.lastAttacker===danger&&pawn.grudgeUntil>(G.matchTime||0)||Math.hypot(pawn.x-danger.x,pawn.y-danger.y)<C.combatStats(danger).range+45;
      if(C.canApproach(pawn,danger)&&!pawn.isClutchEscape&&(cornered||fighting&&chance>=.3&&pawn.currentHp>pawn.maxHp*.22)){
        pawn.objective=cornered?'Đường lui bị chặn: chống trả':'Phòng thủ, tìm cơ hội phản công';
        pawn.thought='Bất lợi nhưng còn sức chống trả. Đỡ, giữ khoảng cách và chờ địch hụt đòn.';
        this.engageCombat(pawn,danger,dt);return;
      }
      pawn.plan=null;this.abandonChase(pawn);pawn.targetEnemy=null;
      pawn.objective='Lẩn trốn '+danger.name;pawn.thought='Đối thủ mạnh hơn. Dùng đường khuất và kỹ năng tẩu thoát.';
      this.escapeThreat(pawn,danger,dt);return;
    }
    this.handleAllianceAndBetrayal(pawn,monsters,enemies);
    if(pawn.allyPawn?.isAlive&&G.pawns.filter(p=>p.isAlive).length<=2){const ally=pawn.allyPawn;ally.allyPawn=null;pawn.allyPawn=null;pawn.allianceBoss=null;ally.allianceBoss=null;}
    if(pawn.allyPawn?.isAlive&&pawn.allianceBoss?.isAlive&&this.canHunt(pawn,pawn.allianceBoss,true)){this.engageCombat(pawn,pawn.allianceBoss,dt);return;}
    const loot=this.findBestItemToLoot(pawn,nearby.filter(e=>e.isDropItem&&window.GameEngine.MapTerrain.segmentClear(pawn.x,pawn.y,e.x,e.y,false,0)));
    if(loot&&(!pawn.plan||pawn.plan.kind!=='loot')&&this.lootPriority(pawn,loot,threats)>this.planPriority(pawn,pawn.plan))pawn.plan={kind:'loot',target:loot,until:pawn.decisionTime+4};
    if(!pawn.plan||pawn.decisionTime>=pawn.plan.until||!this.planValid(pawn,pawn.plan)){
      const choices=[];
      if(loot){const score=this.lootPriority(pawn,loot,threats);if(score>0)choices.push({kind:'loot',target:loot,score});}
      for(const m of G.monsters){if(!this.canHunt(pawn,m))continue;
        const dist=Math.hypot(m.x-pawn.x,m.y-pawn.y),chance=this.calculateWinRate(pawn,m);if(dist<450&&!C.canApproach(pawn,m))continue;
        choices.push({kind:'farm',target:m,score:60+chance*55+P.caution*.25+Math.min(35,m.expReward/8)+P.greed*m.tier*2-dist/(15+P.curiosity*.2)});}
      for(const e of enemies){if(!C.canApproach(pawn,e)||this.ignored(pawn,e)||mapTerrain.isInWater(e.x,e.y))continue;
        const chance=this.calculateWinRate(pawn,e);
        if(!this.willingToFight(pawn,chance,true)&&!pawn.isBerserk)continue;
        const revenge=pawn.lastAttacker===e&&(G.matchTime||0)<pawn.grudgeUntil;
        choices.push({kind:'duel',target:e,score:150+P.aggression*.9+(1-e.currentHp/e.maxHp)*P.patience*.9+(revenge?P.aggression*.4:0)+P.greed*(e.weapon? .5:0)});}
      if((pawn.trait==='coward'||P.caution+P.greed-P.loyalty>90)&&pawn.decisionTime>(pawn.ambushRestUntil||0)){
        const bushes=mapTerrain.bushes.filter(b=>!b.isBurned).map(b=>({x:b.x*mapTerrain.scale,y:b.y*mapTerrain.scale,bush:b}))
          .filter(b=>Math.hypot(b.x-pawn.x,b.y-pawn.y)<400&&mapTerrain.canStand(b.x,b.y)&&mapTerrain.canTravel(pawn,b.x,b.y)&&C.validMembers(C.crowdAt(pawn,b.x,b.y)));
        bushes.sort((a,b)=>Math.hypot(a.x-pawn.x,a.y-pawn.y)-Math.hypot(b.x-pawn.x,b.y-pawn.y));
        if(bushes[0])choices.push({kind:'ambush',target:bushes[0],score:85+P.caution*.5+P.greed*.6+Math.random()*60});
      }
      // A per-decision preference varies choices without jittering movement every frame.
      for(const choice of choices)choice.score+=(Math.random()-.5)*(8+P.curiosity*.2);
      choices.sort((a,b)=>b.score-a.score);
      pawn.plan=choices[0]?{...choices[0],until:pawn.decisionTime+(choices[0].kind==='ambush'?12:(pawn.decisionInterval||1)*(1+P.patience/50))}:null;
    }
    if(pawn.plan){const {kind,target}=pawn.plan;
      if(kind==='loot'){this.seekLoot(pawn,target,dt);return;}
      if(kind==='ambush'){this.ambush(pawn,target,enemies,dt);return;}
      pawn.isHiding=false;
      pawn.thought=kind==='farm'?'Ước tính có thể thắng '+Math.round(this.calculateWinRate(pawn,target)*100)+'%; chọn con mồi để thăng tiến.':P.patience>70?'Chờ sơ hở, chọn người đã yếu máu để ra tay.':'Chủ động áp lực đối thủ khi có lợi thế.';
      pawn.objective=(kind==='farm'?'Săn ':'Đấu ')+target.name;
      this.engageCombat(pawn,target,dt);return;
    }
    pawn.isHiding=false;
    this.wanderAround(pawn,dt);
  },
  threatSnapshot(t){
    return {...t,skills:(t.skills||[]).map(s=>({...s})),weapon:t.weapon?{...t.weapon}:null,armor:t.armor?{...t.armor}:null,helmet:t.helmet?{...t.helmet}:null,action:null};
  },
  observeThreats(p,threats){
    const now=window.GameManager.matchTime||0;
    if(p.knownThreat&&(now-p.knownThreat.seenAt>25||!p.knownThreat.target.isAlive))p.knownThreat=null;
    const known=p.knownThreat;
    if(known&&threats.includes(known.target)){known.x=known.target.x;known.y=known.target.y;known.seenAt=now;known.snapshot=this.threatSnapshot(known.target);}
    if(p.pactTarget&&threats.includes(p.pactTarget)){
      const intel={...p.pactIntel,target:p.pactTarget,x:p.pactTarget.x,y:p.pactTarget.y,seenAt:now,snapshot:this.threatSnapshot(p.pactTarget)};
      p.pactIntel=intel;if(p.allyPawn?.pactTarget===p.pactTarget)p.allyPawn.pactIntel={...intel};
    }
  },
  handleCoalition(p,threats){
    const G=window.GameManager,C=window.GameEntities.CombatSystem,now=G.matchTime||0;
    if(p.allyPawn||now<(p.coalitionCheckAt||0)||p.currentHp<p.maxHp*.3)return;
    p.coalitionCheckAt=now+3;
    const peers=threats.filter(e=>e.isPawn&&!e.isPlayerControlled&&!e.allyPawn&&e.currentHp>e.maxHp*.3);
    for(const q of peers){
      const intel=[p.knownThreat,q.knownThreat].filter(k=>k?.kills>=2&&now-k.seenAt<20&&now-k.killAt<60&&k.target.isAlive&&k.target!==p&&k.target!==q).sort((a,b)=>b.kills-a.kills)[0];
      if(!intel)continue;
      const target=intel.target,estimated=intel.snapshot||target;
      // The recruiter shares witnessed kills and a last-seen position, never global coordinates.
      if(this.calculateWinRate(p,estimated)>=.5||this.calculateWinRate(q,estimated)>=.5)continue;
      p.allyPawn=q;q.allyPawn=p;
      const chance=this.calculateWinRate(p,estimated,true),other=this.calculateWinRate(q,estimated,true);
      const admitted=C.canApproach(p,target)&&C.canApproach(q,target);
      p.allyPawn=null;q.allyPawn=null;
      if(Math.min(chance,other)<.4||!admitted)continue;
      const P=p.personality,Q=q.personality;
      const willingness=Math.min(.9,.25+(P.loyalty+Q.loyalty+P.caution+Q.caution)/600+Math.min(4,intel.kills)*.06);
      if(Math.random()>willingness)continue;
      p.allyPawn=q;q.allyPawn=p;
      for(const member of [p,q]){member.isAllied=true;member.pactTarget=target;member.pactUntil=now+25;member.pactIntel={...intel};member.plan=null;member.chase=null;member.allianceBoss=null;}
      window.GameRenderer.VfxManager.addEmotionMote(p,'🤝','#f1c40f');window.GameRenderer.VfxManager.addEmotionMote(q,'🤝','#f1c40f');
      window.GameUI.CombatTicker.log('🤝 '+p.name+' và '+q.name+' liên minh truy tìm '+target.name+' sau chuỗi hạ sát; cơ hội cả cặp '+Math.round(Math.min(chance,other)*100)+'%.');
      return;
    }
  },
  pursueCoalition(p,threats,dt){
    const G=window.GameManager,C=window.GameEntities.CombatSystem,q=p.allyPawn,t=p.pactTarget,now=G.matchTime||0,intel=p.pactIntel;
    const chance=q?.isAlive&&t?this.calculateWinRate(p,intel?.snapshot||t,true):0;
    if(!t?.isAlive||!q?.isAlive||q.allyPawn!==p||now>p.pactUntil||!intel||now-intel.seenAt>12||chance<.35||p.currentHp<p.maxHp*.2){
      // Do not dissolve either pair inside the protected four-person encounter.
      if(p.combatLease>0&&C.groupMembers(p).length===4){this.engageCombat(p,t,dt);return true;}
      for(const member of [p,q].filter(Boolean)){member.pactTarget=null;member.pactIntel=null;member.allyPawn=null;member.isAllied=false;member.plan=null;member.chase=null;member.coalitionCheckAt=now+8;}
      return false;
    }
    p.objective='Liên minh săn '+t.name;p.thought='Phối hợp cùng '+q.name+', cơ hội cả cặp '+Math.round(chance*100)+'%; không truy đuổi vô hạn.';
    const hazard=threats.find(e=>e!==t&&e!==q&&this.calculateWinRate(p,e)<.3&&Math.hypot(e.x-p.x,e.y-p.y)<100);
    if(hazard){this.escapeThreat(p,hazard,dt);return true;}
    const loot=this.findBestItemToLoot(p,G.spatialGrid.queryCircle(p.x,p.y,160).filter(e=>e.isDropItem));
    if(loot&&this.lootPriority(p,loot,threats)>180){this.seekLoot(p,loot,dt);return true;}
    if(Math.hypot(p.x-q.x,p.y-q.y)>210){this.moveToTarget(p,q.x,q.y,dt);return true;}
    if(threats.includes(t)&&C.canApproach(p,t))this.engageCombat(p,t,dt);
    else{p.targetEnemy=null;p.chase=null;const side=p.id<q.id?1:-1;this.moveToTarget(p,intel.x+side*45,intel.y,dt);}
    return true;
  },
  hasRetreatRoute(p,t){
    const M=window.GameEngine.MapTerrain,angle=Math.atan2(p.y-t.y,p.x-t.x);
    return [0,-.8,.8].some(offset=>{const x=p.x+Math.cos(angle+offset)*70,y=p.y+Math.sin(angle+offset)*70;
      return M.canTravel(p,x,y)&&M.segmentClear(p.x,p.y,x,y,false,p.collisionRadius||9,p);});
  },
  planPriority(p,plan){
    if(!plan)return 0;
    if(plan.kind==='loot')return this.lootPriority(p,plan.target,[]);
    if(plan.kind==='duel')return plan.target.currentHp<plan.target.maxHp*.2?230:145;
    return plan.kind==='farm'?125:100;
  },
  lootPriority(p,item,threats){
    const C=window.GameEntities.CombatSystem,P=p.personality;
    if(threats.some(e=>C.canSee(e,p)&&Math.hypot(e.x-item.x,e.y-item.y)<C.combatStats(e).range+55&&this.calculateWinRate(p,e)<.5))return 0;
    const value=this.lootValue(p,item);
    return value>0?130+Math.min(110,value)+P.greed*.3-Math.hypot(item.x-p.x,item.y-p.y)/8:0;
  },
  ignored(p,target){return (p.ignoredTargets?.[target.id]||0)>(window.GameManager.matchTime||0);},
  keepChasing(p,target){
    const now=window.GameManager.matchTime||p.decisionTime||0;
    if(target?.isAlive&&(target.stealthTimer>0||target.isHiding)&&!window.GameEntities.CombatSystem.canSee(p,target))return false;
    return target?.isAlive&&!this.ignored(p,target)&&(!p.chase||p.chase.target!==target||
      (now-p.chase.started<10+(p.personality?.patience||50)*.06&&now-Math.max(p.chase.started,p.lastDamageTarget===target?p.lastDamageDealtAt||0:0)<9&&Math.hypot(p.x-(p.chase.lastX??target.x),p.y-(p.chase.lastY??target.y))<this.chaseLimit(p)));
  },
  chaseLimit(p){return window.GameEntities.CombatSystem.visionRange(p)*1.8;},
  abandonChase(p){
    if(p.chase){p.ignoredTargets=p.ignoredTargets||{};p.ignoredTargets[p.chase.target.id]=(window.GameManager.matchTime||0)+20;}
    p.chase=null;p.targetEnemy=null;p.plan=null;p.roamGoal=null;
  },
  willingToFight(p,chance,isDuel=false){
    if(chance<.5)return false;
    const P=p.personality||window.GameData.PersonalityProfiles[p.trait];
    if(isDuel&&(p.fear||0)>85&&(p.confidence||0)<70)return false;
    const resolve=(chance-.5)*200+P.aggression*.6+P.greed*.25+(p.confidence||0)*.3-(p.fear||0)*.5-(p.despair||0)*.2;
    return chance>=.68||resolve>=P.caution*.4;
  },
  planValid(p,plan){
    if(plan.kind==='loot')return this.lootValue(p,plan.target)>0&&window.GameEngine.MapTerrain.canTravel(p,plan.target.x,plan.target.y);
    if(plan.kind==='ambush')return !plan.target.bush.isBurned;
    return plan.target.isAlive&&(plan.kind==='farm'?this.canHunt(p,plan.target):this.keepChasing(p,plan.target)&&(this.willingToFight(p,this.calculateWinRate(p,plan.target),true)||p.targetEnemy===plan.target&&p.combatLease>0&&this.calculateWinRate(p,plan.target)>=.38&&p.currentHp>p.maxHp*.25));
  },
  ambush(p,site,enemies,dt){
    const M=window.GameEngine.MapTerrain,C=window.GameEntities.CombatSystem;
    p.targetEnemy=null;p.chase=null;p.objective='Ẩn nấp phục kích';p.thought='Nấp trong bụi, rình kẻ bị thương; chỉ ăn hôi khi giao tranh còn chỗ.';
    if(Math.hypot(p.x-site.x,p.y-site.y)>18){p.isHiding=false;this.moveToTarget(p,site.x,site.y,dt);return;}
    p.isHiding=M.isInBush(p.x,p.y);p.vx=p.vy=0;
    p.ambushUntil=p.ambushUntil||p.decisionTime+6+(p.personality?.patience||50)*.08;
    const prey=enemies.find(e=>!this.ignored(p,e)&&C.canApproach(p,e)&&this.willingToFight(p,this.calculateWinRate(p,e),true)&&(e.currentHp<e.maxHp*.65||Math.hypot(e.x-p.x,e.y-p.y)<100));
    if(prey){
      p.isHiding=false;p.ambushUntil=0;p.ambushRestUntil=p.decisionTime+15;
      p.plan={kind:'duel',target:prey,until:p.decisionTime+5};p.thought='Đối thủ lộ sơ hở. Xuất kích ăn hôi!';this.engageCombat(p,prey,dt);
    }else if(p.decisionTime>=p.ambushUntil){p.isHiding=false;p.ambushUntil=0;p.ambushRestUntil=p.decisionTime+20;p.plan=null;p.roamGoal=null;}
  },
  escapeThreat(p,enemy,dt){
    const M=window.GameEngine.MapTerrain,C=window.GameEntities.CombatSystem;
    const angle=Math.atan2(p.y-enemy.y,p.x-enemy.x);p.aimAngle=angle;
    const escape=p.skills?.find(s=>['teleport','speed_buff','ethereal_speed','stealth','smoke_cloud','backstep_shot'].includes(C.getSkillConfig(p,s).type)&&s.cooldownTimer<=0);
    if(escape&&C.castSkill(p,escape,C.getSkillConfig(p,escape).type==='backstep_shot'?enemy:null))return;
    const bushes=M.bushes.filter(b=>!b.isBurned).map(b=>({x:b.x*M.scale,y:b.y*M.scale}))
      .filter(b=>Math.hypot(p.x-b.x,p.y-b.y)<350&&Math.hypot(b.x-enemy.x,b.y-enemy.y)>Math.hypot(p.x-enemy.x,p.y-enemy.y)+40&&M.canStand(b.x,b.y)&&M.canTravel(p,b.x,b.y)&&C.validMembers(C.crowdAt(p,b.x,b.y)));
    bushes.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
    if(bushes[0]){p.currentStamina=Math.max(0,p.currentStamina-20*dt);this.moveToTarget(p,bushes[0].x,bushes[0].y,dt);p.isHiding=M.isInBush(p.x,p.y)&&Math.hypot(p.x-enemy.x,p.y-enemy.y)>90;}
    else{p.isHiding=false;this.retreatSafely(p,enemy,dt);}
  },
  canHunt(p,m,withAlly=false){
    if(!m?.isAlive||window.GameEngine.MapTerrain.isInWater(m.x,m.y))return false;
    if(m.tier===5)return p.level>=15&&!window.GameEngine.MapTerrain.remainingLords();
    const min=[0,1,3,6,10,15][m.tier];
    if(!m.isFinalHunt&&p.level<min)return false;
    const chance=this.calculateWinRate(p,m,withAlly);
    if(p.targetEnemy===m&&p.combatLease>0&&p.currentHp>p.maxHp*.2&&chance>=.4)return true;
    return (m.isFinalHunt?chance>=.5:this.willingToFight(p,chance)) && (p.currentHp/p.maxHp>.2 || chance>.82);
  },
  seekLoot(p,item,dt){p.combatTactic=null;p.tactic=null;p.chase=null;p.isHiding=false;p.targetEnemy=null;p.objective='Nhặt '+item.name;p.thought='Cân nhắc giá trị chiến lợi phẩm và nguy hiểm quanh chỗ rơi.';this.moveToTarget(p,item.x,item.y,dt);if(Math.hypot(p.x-item.x,p.y-item.y)<22){this.lootItem(p,item);p.plan=null;}},

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

  lootValue(p,item){
    if(!item||item.isCollected)return 0;
    if(item.slot==='potion')return (p.healthPotions||0)<5?(p.currentHp<p.maxHp*.65?110:35)-(p.healthPotions||0)*5:0;
    const slot={weapon:'weapon',head:'helmet',body:'armor'}[item.slot],next=item.data;
    if(!slot||!next)return 0;
    if(slot==='weapon'&&p.hasLockedClass&&next.classReq!=='all'&&next.classReq!==p.classId)return 0;
    const current=p[slot];
    const power=e=>{
      if(!e)return slot==='weapon'?(p.attack||16)*.9:0;
      const weapon=slot==='weapon'?((p.attack||16)+Math.min(65,e.attack||e.magicPower||0))*Math.min(1.43,e.speed||.9)*(1+Math.min(.25,(e.range||35)/800)):0;
      return weapon+(e.defense||0)*1.3+(e.hp||0)*.12+(e.manaMax||0)*.07+(e.critChance||0)*60+(e.ccImmunity?12:0)+(e.reviveOnce?25:0);
    };
    const benefit=power(next)-power(current);
    if(benefit<=.5)return 0;
    return benefit*2+(!current?slot==='weapon'?85:35:0);
  },
  findBestItemToLoot: function(pawn, items) {
    let best=null,highestScore=-Infinity;
    const M=window.GameEngine.MapTerrain;
    for(const item of items){
      const value=this.lootValue(pawn,item);if(value<=0||!M.canTravel(pawn,item.x,item.y)||!M.canStand(item.x,item.y))continue;
      const score=value-Math.hypot(item.x-pawn.x,item.y-pawn.y)/25;
      if(score>highestScore){highestScore=score;best=item;}
    }
    return best;
  },

  // Nhặt và trang bị đồ
  lootItem: function(pawn, item) {
    if (!item || item.isCollected || this.lootValue(pawn,item)<=0) return false;
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
    if(pawn.pactTarget)return;
    const boss = monsters.find(m => m.tier === 4 && pawn.level>=8 && this.calculateWinRate(pawn,m)>.3);

    // Kích hoạt Liên Minh nếu cả 2 đang đối mặt Yêu Vương/Yêu Thần
    if (boss && enemyPawns.length > 0 && !pawn.allyPawn) {
      const candidate = enemyPawns[0];
      if (!candidate.allyPawn && candidate.level>=8 && (pawn.personality?.loyalty||0)>30 && this.calculateWinRate(pawn,boss)>.3) {
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
      // Keep both pacts intact during the four-person exception; betray once that encounter ends.
      if(pawn.combatLease>0&&window.GameEntities.CombatSystem.groupMembers(pawn).length===4)return;
      const greedWeight = pawn.trait === 'greedy' ? 2.5 : (pawn.trait === 'cunning' ? 2.0 : 1.0);
      const betrayalScore = (80 * greedWeight) - ally.currentHp;

      const P=pawn.personality||window.GameData.PersonalityProfiles[pawn.trait];
      const betray = ally.isAlive && P.loyalty<45 && (betrayalScore > 30 || (P.greed>70&&ally.currentHp<ally.maxHp*.6));
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

        pawn.targetEnemy = ally;pawn.plan={kind:'duel',target:ally,score:999,until:pawn.decisionTime+3};

        if (window.GameUI && window.GameUI.CombatTicker) {
          window.GameUI.CombatTicker.log(`😈 [PHẢN BỘI] ${pawn.name} nở nụ cười gian xảo, lập tức rút dao đâm lén người bạn thân ${ally.name}!`);
        }
      }
    }
  },

  // Săn quái vật theo cấp độ phù hợp
  huntSuitableMonster: function(pawn, monsters, dt) {
    const suitable=monsters.filter(m=>this.canHunt(pawn,m));
    suitable.sort((a,b)=>this.calculateWinRate(pawn,b)-this.calculateWinRate(pawn,a));
    if(suitable.length)this.engageCombat(pawn,suitable[0],dt);else this.wanderAround(pawn,dt);
  },

  chooseCombatSkill(p,t,mode){
    const C=window.GameEntities.CombatSystem,P=p.personality,dist=Math.hypot(t.x-p.x,t.y-p.y);
    const incoming=t.action&&!t.action.released&&t.action.target===p;
    const opening=t.stunTimer>0||t.currentStamina<18||t.action?.released&&t.action.duration-t.action.elapsed>.15||p.counterTarget===t&&p.counterUntil>(window.GameManager.matchTime||0);
    const candidates=[];
    for(const skill of p.skills||[]){
      const c=C.getSkillConfig(p,skill),type=c.type,mana=(c.manaCost||0)+(c.extraManaPct||0)*p.maxMana,stamina=(c.staminaCost||0)+(c.extraStaminaPct||0)*p.maxStamina;
      if(skill.cooldownTimer>0||p.silenceTimer>0||p.currentMana<mana||p.currentStamina<stamina)continue;
      let score=0;
      if(['self_heal','aura_heal'].includes(type)){if(p.currentHp>=p.maxHp*.65)continue;score=160;}
      else if(['shield_stance','counter_stance','mana_shield_toggle','stasis'].includes(type)){if(!incoming)continue;score=145;}
      else if(['teleport','speed_buff','ethereal_speed','stealth','smoke_cloud','backstep_shot'].includes(type)){
        if(!['retreat','bait'].includes(mode)||p.speedBuffTimer>0||p.stealthTimer>0||dist>160)continue;
        if(type==='backstep_shot'&&dist>c.range)continue;score=95;
      }else if(['weapon_buff','weapon_swap'].includes(type)){
        if(p.weaponBuffTimer>0||type==='weapon_swap'&&!p.secondaryWeapon)continue;score=55;
      }else{
        if(dist>c.range||!C.canEngage(p,t))continue;
        const lethal=t.currentHp<=c.damage*100/(100+C.combatStats(t).defense);
        if(p.currentStamina-stamina<18&&!lethal&&P.aggression<80&&!opening)continue;
        if(c.stun&&t.controlImmunityTimer>0&&!lethal)continue;
        if(['probe','bait'].includes(mode)&&!opening&&!lethal)continue;
        score=40+(opening?55:0)+(lethal?100:0)+c.damage*.12;
        if(c.stun)score+=t.stunTimer>0?0:incoming?65:25;
        if((c.stun||c.slow)&&p.allyPawn?.lastAttacker===t&&P.loyalty>55)score+=35;
        if(/execution|finisher/.test(type)&&t.currentHp>t.maxHp*.4&&!opening)score-=45;
        if(mode==='retreat'&&!opening&&!lethal)score-=25;
      }
      candidates.push({skill,score,type});
    }
    candidates.sort((a,b)=>b.score-a.score);
    for(const candidate of candidates){
      if(candidate.score<=0)continue;
      const escaping=['teleport','speed_buff','ethereal_speed','stealth','smoke_cloud'].includes(candidate.type);
      if(escaping)p.aimAngle=Math.atan2(p.y-t.y,p.x-t.x);
      if(C.castSkill(p,candidate.skill,escaping?null:t))return true;
    }
    return false;
  },
  engageCombat: function(pawn, target, dt) {
    if (!target || !target.isAlive || pawn.allyPawn === target) return;
    const M=window.GameEngine.MapTerrain,C=window.GameEntities.CombatSystem,G=window.GameManager,P=pawn.personality,now=G.matchTime||0;
    if(target.isPawn&&!C.canSee(pawn,target)){
      const trail=pawn.chase;
      if(trail?.target===target&&this.keepChasing(pawn,target)&&now-(trail.seenAt||trail.started)<3){
        pawn.objective='Tìm quanh vị trí cuối đã thấy';pawn.thought='Đã mất dấu. Chỉ tìm trong thời gian ngắn, không biết vị trí hiện tại.';
        this.moveToTarget(pawn,trail.lastX,trail.lastY,dt);return;
      }
      this.abandonChase(pawn);this.wanderAround(pawn,dt);return;
    }
    if(!C.canApproach(pawn,target)||M.isInWater(target.x,target.y)){
      pawn.plan=null;pawn.chase=null;pawn.targetEnemy=null;
      pawn.thought='Cụm giao tranh đã đủ người; tìm mục tiêu khác.';
      const angle=Math.atan2(pawn.y-target.y,pawn.x-target.x);
      this.moveToTarget(pawn,pawn.x+Math.cos(angle)*200,pawn.y+Math.sin(angle)*200,dt);return;
    }
    if(target.isPawn){
      if(!this.keepChasing(pawn,target)){this.abandonChase(pawn);this.wanderAround(pawn,dt);return;}
      if(pawn.chase?.target!==target)pawn.chase={target,started:now};
      Object.assign(pawn.chase,{lastX:target.x,lastY:target.y,seenAt:now});
    }else pawn.chase=null;
    pawn.isHiding=false;pawn.targetEnemy=target;
    const dx=target.x-pawn.x,dy=target.y-pawn.y,dist=Math.hypot(dx,dy),range=C.combatStats(pawn).range;
    pawn.aimAngle=Math.atan2(dy,dx);
    const chance=this.calculateWinRate(pawn,target,!!pawn.allyPawn?.isAlive&&Math.hypot(pawn.x-pawn.allyPawn.x,pawn.y-pawn.allyPawn.y)<240);
    const opening=target.stunTimer>0||target.currentStamina<18||target.action?.released&&target.action.duration-target.action.elapsed>.15||pawn.counterTarget===target&&pawn.counterUntil>now;
    if(!pawn.tactic||pawn.tactic.target!==target){pawn.tactic={target,mode:'probe',until:now+1.2,started:now};}
    const tactic=pawn.tactic;
    if(opening&&pawn.currentStamina>=18)tactic.mode='counter';
    else if(now>=tactic.until){
      tactic.mode=pawn.currentStamina<25||chance<.48&&tactic.mode!=='retreat'?'retreat':P.caution+P.greed>P.aggression+100&&chance<.65&&now-tactic.started<6?'bait':'pressure';
      tactic.until=now+1+P.patience/100;
    }
    if(pawn.allyPawn?.isAlive&&P.loyalty>65&&pawn.allyPawn.currentHp<pawn.allyPawn.maxHp*.35&&pawn.currentHp>pawn.maxHp*.5)tactic.mode='pressure';
    if((pawn.currentHp<pawn.maxHp*.18||chance<.25)&&this.hasRetreatRoute(pawn,target)){
      tactic.mode='escape';pawn.objective='Thoát khỏi giao tranh';pawn.thought='Máu hoặc lợi thế đã xuống quá thấp; thoát thân thay vì đổi mạng.';this.escapeThreat(pawn,target,dt);return;
    }
    if(dist>C.visionRange(target)&&!opening)tactic.mode='pressure';
    if(range>90&&dist<range*.5&&!opening)tactic.mode='retreat';
    const labels={probe:'Thăm dò, giữ chiêu',pressure:'Gây áp lực',retreat:'Lùi chiến thuật',bait:'Giả lùi, dụ đối thủ',counter:'Phản công sơ hở'};
    pawn.combatTactic=labels[tactic.mode];
    const mission=G.battleRoyaleResolved?(target.tier===5?'Quyết chiến Yêu Thần • ':'Farm Yêu Vương, cấp '+pawn.level+'/15 • '):pawn.pactTarget?'Liên minh săn • ':'';
    pawn.objective=mission+(labels[tactic.mode]||'Giao tranh')+': '+target.name;
    pawn.thought=tactic.mode==='counter'?'Địch hụt đòn hoặc đang hồi động tác. Phản công nếu đủ tầm và thể lực.':tactic.mode==='retreat'?'Lùi giữ cự ly, bảo toàn thể lực; vẫn đánh trả khi có thể.':tactic.mode==='bait'?'Giữ chiêu chủ lực, dụ địch qua chỗ che chắn rồi quay lại.':tactic.mode==='probe'?'Thử phản ứng bằng đòn thường, chưa tung hết kỹ năng.':'Ép đối thủ nhưng chừa thể lực để đỡ hoặc né.';
    if(this.chooseCombatSkill(pawn,target,tactic.mode))return;
    if(dist<=range&&!M.isInWater(pawn.x,pawn.y)&&C.canEngage(pawn,target)&&pawn.attackCooldown<=0){
      if(C.executeAttack(pawn,target))return;
    }
    if(['retreat','bait'].includes(tactic.mode)&&this.hasRetreatRoute(pawn,target)){
      // Break a retreat after recovery; depleted bots guard instead of draining stamina forever.
      if(pawn.currentStamina<18&&dist>C.combatStats(target).range+35){pawn.vx=pawn.vy=0;return;}
      this.retreatSafely(pawn,target,dt,true);return;
    }
    if(dist>range||M.isInWater(pawn.x,pawn.y)||!M.segmentClear(pawn.x,pawn.y,target.x,target.y,false,0)){
      if(tactic.mode==='probe'&&dist<140&&now-tactic.started<1.2){
        const angle=Math.atan2(pawn.y-target.y,pawn.x-target.x)+pawn.flankSide*.35;
        this.moveToTarget(pawn,target.x+Math.cos(angle)*Math.max(range,dist-10),target.y+Math.sin(angle)*Math.max(range,dist-10),dt);return;
      }
      if(target.isPawn&&pawn.currentStamina>45&&dist>range+40){pawn.isSprinting=true;pawn.currentStamina=Math.max(0,pawn.currentStamina-24*dt);}
      const lead=target.isPawn?Math.min(.6,dist/Math.max(1,M.getMoveSpeed(pawn))):0;
      const flank=pawn.allyPawn?.isAlive?(pawn.id<pawn.allyPawn.id?1:-1)*Math.min(22,range*.3):0;
      this.moveToTarget(pawn,target.x+(target.vx||0)*lead-Math.sin(pawn.aimAngle)*flank,target.y+(target.vy||0)*lead+Math.cos(pawn.aimAngle)*flank,dt);
    }else pawn.vx=pawn.vy=0;
  },
  performAttack: function(pawn,target){
    const C=window.GameEntities.CombatSystem;
    if(C.canAttack(pawn)&&!this.chooseCombatSkill(pawn,target,'pressure'))C.executeAttack(pawn,target);
  },

  // Di chuyển tới vị trí
  moveToTarget: function(pawn,tx,ty,dt) {
    if(pawn.action)return;
    window.GameEngine.MapTerrain.navigate(pawn,tx,ty,dt);
  },

  // Bỏ chạy khi sợ hãi
  fleeFromThreats: function(pawn, spatialGrid, mapTerrain, dt) {
    const threat=spatialGrid.queryCircle(pawn.x,pawn.y,window.GameEntities.CombatSystem.visionRange(pawn)).find(e=>window.GameEntities.CombatSystem.isEnemy(pawn,e)&&window.GameEntities.CombatSystem.canSee(pawn,e));
    if(threat){pawn.plan=null;this.escapeThreat(pawn,threat,dt);return;}
    pawn.currentStamina=Math.max(0,pawn.currentStamina-30*dt);
    pawn.objective='Rút lui qua chỗ che chắn';pawn.thought='Thoát nguy hiểm nhưng phải tiết kiệm thể lực, không thể chạy mãi.';
    // Tìm bụi rậm gần nhất để trốn
    let nearestBush = null;
    let minDist = 9999;
    mapTerrain.bushes.forEach(b => {
      if (b.isBurned) return;
      const d = Math.hypot(pawn.x - b.x*mapTerrain.scale, pawn.y - b.y*mapTerrain.scale);
      if (d < minDist) {
        minDist = d;
        nearestBush = b;
      }
    });

    if (nearestBush && minDist > 10) {
      this.moveToTarget(pawn, nearestBush.x*mapTerrain.scale, nearestBush.y*mapTerrain.scale, dt);
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
  calculateWinRate: function(pawn, enemy, withAlly=false) {
    const C=window.GameEntities.CombatSystem;
    // ponytail: heuristic readiness, not statistical odds; calibrate with match results before adding combat rollouts.
    const strength=e=>{
      const s=C.combatStats(e),ready=(e.skills||[]).filter(skill=>{const c=C.getSkillConfig(e,skill);return skill.cooldownTimer<=0&&!(e.silenceTimer>0)&&e.currentMana>=((c.manaCost||0)+(c.extraManaPct||0)*e.maxMana)&&e.currentStamina>=((c.staminaCost||0)+(c.extraStaminaPct||0)*e.maxStamina);}).length;
      const stamina=Math.max(0,Math.min(1,(e.currentStamina??100)/(e.maxStamina||100)));
      const recovery=e.action?.released? .9:1,range=1+Math.min(.12,s.range/1200);
      const M=window.GameEngine.MapTerrain,terrain=(M.isOnCliff(e.x,e.y)?1.1:1)*(M.isInBush(e.x,e.y)&&s.range>90?1.05:1);
      return {...s,dps:s.attack*Math.min(1.43,e.weapon?.speed||.9)*(1+Math.min(.24,ready*.08))*(.8+stamina*.2)*range*recovery*terrain,hp:e.currentHp+(e.potionCooldown>0?0:Math.min(2,e.healthPotions||0))*Math.min(220,e.maxHp*.35)};
    };
    const a=strength(pawn),b=strength(enemy);
    if(withAlly&&pawn.allyPawn?.isAlive){const ally=strength(pawn.allyPawn);a.dps+=ally.dps*.8;a.hp+=ally.hp*.6;}
    const ours=a.dps*100/(100+b.defense),theirs=b.dps*100/(100+a.defense);
    const timeToKill=b.hp/Math.max(1,ours),timeToDie=a.hp/Math.max(1,theirs);
    return timeToDie/(timeToDie+timeToKill);
  },

  retreatSafely: function(pawn, enemy, dt, tactical=false) {
    const M=window.GameEngine.MapTerrain,angle=Math.atan2(pawn.y-enemy.y,pawn.x-enemy.x),distance=tactical?75:130;
    const choices=[0,-.7,.7,-1.3,1.3].map(offset=>({x:pawn.x+Math.cos(angle+offset)*distance,y:pawn.y+Math.sin(angle+offset)*distance}));
    if(tactical)for(const b of M.bushes){const x=b.x*M.scale,y=b.y*M.scale;
      if(!b.isBurned&&Math.hypot(x-pawn.x,y-pawn.y)<180&&Math.hypot(x-enemy.x,y-enemy.y)>Math.hypot(pawn.x-enemy.x,pawn.y-enemy.y)+20)choices.push({x,y});}
    const goal=choices.filter(p=>M.canStand(p.x,p.y)&&M.canTravel(pawn,p.x,p.y)&&!M.isInWater(p.x,p.y)&&M.segmentClear(pawn.x,pawn.y,p.x,p.y,false,9,pawn))
      .sort((a,b)=>Math.hypot(b.x-enemy.x,b.y-enemy.y)+(M.isInBush(b.x,b.y)?60:0)-Math.hypot(a.x-enemy.x,a.y-enemy.y)-(M.isInBush(a.x,a.y)?60:0))[0];
    if(!goal){pawn.vx=pawn.vy=0;return;}
    pawn.currentStamina=Math.max(0,pawn.currentStamina-(tactical?8:20)*dt);
    this.moveToTarget(pawn,goal.x,goal.y,dt);pawn.aimAngle=Math.atan2(enemy.y-pawn.y,enemy.x-pawn.x);
  },

  flankAndWait: function(pawn, combatCluster, dt) {
    // Đứng cách 90px quan sát
    const angle = Math.atan2(pawn.y - combatCluster.y, pawn.x - combatCluster.x);
    const targetX = combatCluster.x + Math.cos(angle) * 100;
    const targetY = combatCluster.y + Math.sin(angle) * 100;
    this.moveToTarget(pawn, targetX, targetY, dt);
  },

  wanderAround: function(pawn,dt){
    const G=window.GameManager,M=window.GameEngine.MapTerrain,P=pawn.personality||window.GameData.PersonalityProfiles[pawn.trait];
    pawn.combatTactic=null;pawn.tactic=null;pawn.chase=null;pawn.isHiding=false;pawn.targetEnemy=null;
    if(!pawn.roamGoal||Math.hypot(pawn.x-pawn.roamGoal.x,pawn.y-pawn.roamGoal.y)<45||pawn.decisionTime>(pawn.roamUntil||0)){
      const enemies=G.pawns.filter(p=>p.isAlive&&p!==pawn&&p!==pawn.allyPawn&&!this.ignored(pawn,p)&&(Math.hypot(p.x-pawn.x,p.y-pawn.y)>450||window.GameEntities.CombatSystem.canApproach(pawn,p)));
      enemies.sort((a,b)=>Math.hypot(a.x-pawn.x,a.y-pawn.y)-Math.hypot(b.x-pawn.x,b.y-pawn.y));
      const enemy=enemies[Math.floor(Math.random()*Math.min(3,enemies.length))];
      let goal=enemy?{x:enemy.x,y:enemy.y}: {x:pawn.x+(Math.random()-.5)*700,y:pawn.y+(Math.random()-.5)*700};
      pawn.roamGoal=M.nearestFree(goal.x,goal.y);pawn.roamUntil=pawn.decisionTime+8+P.curiosity*.08;pawn.navTimer=0;
    }
    pawn.objective=P.caution>75?'Tuần tra an toàn, tránh quái quá sức':P.aggression>70?'Tìm đối thủ ở ngoại vi':'Tìm cơ hội phát triển';
    pawn.thought='Chưa thấy con mồi phù hợp. Giữ mục tiêu di chuyển, đi vòng tường và ưu tiên cầu.';
    this.moveToTarget(pawn,pawn.roamGoal.x,pawn.roamGoal.y,dt);
  }

};

window.GameAI.AIBrain = window.GameAI.AiBrain;
