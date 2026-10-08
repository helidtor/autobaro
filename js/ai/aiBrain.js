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
    if(!pawn.isAlive||pawn.isPlayerControlled )return;
    const C=window.GameEntities.CombatSystem,G=window.GameManager,P=pawn.personality||window.GameData.PersonalityProfiles[pawn.trait];
    for(const key of ['survivalTarget','finalDuel','defiantTarget','targetEnemy'])if(pawn[key]===pawn.allyPawn&&pawn[key])pawn[key]=pawn.pactTarget&&C.isEnemy(pawn,pawn.pactTarget)?pawn.pactTarget:null;
    for(const key of ['survivalTarget','finalDuel','defiantTarget','targetEnemy'])if(pawn[key]?.isSplit){const owner=pawn[key];pawn[key]=owner.clones?.filter(q=>q.isAlive&&C.canSee(pawn,q)).sort((a,b)=>Math.hypot(a.x-pawn.x,a.y-pawn.y)-Math.hypot(b.x-pawn.x,b.y-pawn.y))[0]||null;}
    pawn.decisionTime=(pawn.decisionTime||0)+dt;
    this.handleLevelingAndSkills(pawn);
    const drops=window.GameManager.dropItems||[];
    const foot=this.findBestItemToLoot(pawn,drops.filter(i=>Math.hypot(i.x-pawn.x,i.y-pawn.y)<28));
    if(foot)this.lootItem(pawn,foot);
    if(pawn.action)return;
    if(C.avoidFields(pawn,dt)||window.GameEntities.AncientSystem.avoid(pawn,dt))return;
    if(window.GameEntities.AncientSystem.prepare(pawn,dt))return;
    if(pawn.currentHp<pawn.maxHp*(.3+P.caution*.003)&&C.usePotion(pawn)){
      pawn.thought='Để dành bình cho lúc nguy hiểm: hồi máu trước khi chọn con mồi.';pawn.objective='Uống bình hồi máu';return;
    }
    const nearby=spatialGrid.queryCircle(pawn.x,pawn.y,C.visionRange(pawn));
    const threats=nearby.filter(e=>C.isEnemy(pawn,e)&&C.canSee(pawn,e));
    this.observeThreats(pawn,threats);
    window.GameAI.EmotionEngine.observe(pawn,threats);
    const upgrade=this.findBestItemToLoot(pawn,nearby.filter(i=>i.slot==='weapon'&&Math.hypot(i.x-pawn.x,i.y-pawn.y)<=220));
    if(upgrade&&this.lootValue(pawn,upgrade)>10&&mapTerrain.segmentClear(pawn.x,pawn.y,upgrade.x,upgrade.y,true,9,pawn)&&Math.hypot(upgrade.x-pawn.x,upgrade.y-pawn.y)/Math.max(1,mapTerrain.getMoveSpeed(pawn))<=3){
      if(!pawn.combatLoot||pawn.combatLoot.item.isCollected)pawn.combatLoot={item:upgrade,until:pawn.decisionTime+3};
    }
    const fighting=(G.matchTime-(pawn.lastHostileAt??-Infinity)<6)||pawn.combatLease>0;
    if(!fighting&&!pawn.combatLoot){
      if(pawn.currentHp<pawn.maxHp*.9&&C.usePotion(pawn)){pawn.objective='Hồi phục ngoài giao tranh';return;}
      const potion=this.findBestItemToLoot(pawn,nearby.filter(i=>i.slot==='potion'&&mapTerrain.segmentClear(pawn.x,pawn.y,i.x,i.y,false,0)));
      if(potion){this.seekLoot(pawn,potion,dt);pawn.objective='Nhặt bình máu để hồi phục';return;}
    }
    if(pawn.combatLoot){const task=pawn.combatLoot;
      if(task.until>pawn.decisionTime&&this.lootValue(pawn,task.item)>0){this.seekLoot(pawn,task.item,dt,true);return;}
      pawn.combatLoot=null;
    }
    const persecutor=pawn.lastAttacker;
    if(persecutor?.isAlive&&pawn.pokeHistory?.attacker===persecutor&&pawn.pokeHistory.hits>=3&&G.matchTime-pawn.pokeHistory.at<6&&!this.hasRetreatRoute(pawn,persecutor))window.GameAI.EmotionEngine.commitSurvival(pawn,persecutor);
    if(pawn.survivalTarget?.isAlive){this.engageCombat(pawn,pawn.survivalTarget,dt);return;}
    // Collect useful gear underfoot even while another plan is active.
    const underfoot=this.findBestItemToLoot(pawn,nearby.filter(e=>e.isDropItem&&Math.hypot(e.x-pawn.x,e.y-pawn.y)<28));
    if(underfoot)this.lootItem(pawn,underfoot);
    if(G.finalShowdown&&!G.battleRoyaleResolved){this.updateFinalShowdown(pawn,threats,nearby,dt);return;}
    if(pawn.chase&&!this.keepChasing(pawn,pawn.chase.target)){this.abandonChase(pawn);}
    if(window.GameEntities.AncientSystem.avoid(pawn,dt))return;
    if(this.hideAfterEscape(pawn,dt))return;
    if(C.tryReaction(pawn,threats))return;
    if(G.battleRoyaleResolved){
      const ancient=window.GameEntities.AncientSystem.boss;
      const boss=ancient?.isAlive?(ancient.isSplit?ancient.clones.find(c=>c.isAlive):ancient):window.GameEntities.EntityManager.worldBoss;
      const items=G.dropItems.filter(it=>!it.isCollected),item=this.findBestItemToLoot(pawn,items);
      if(item&&Math.hypot(item.x-pawn.x,item.y-pawn.y)<650&&this.lootPriority(pawn,item,threats)>0){this.seekLoot(pawn,item,dt);return;}
      if(pawn.level>=15&&!mapTerrain.remainingLords()&&pawn.currentHp<pawn.maxHp*.8&&C.usePotion(pawn)){
        pawn.objective='Chuẩn bị quyết chiến Yêu Thần';pawn.thought='Dùng bình đã nhặt trước khi bước vào điện thờ.';return;
      }
      if(pawn.level>=15&&boss?.isAlive&&!mapTerrain.remainingLords()){
        pawn.objective=(boss.tier===6?'Đấu với Thượng Cổ: ':'Đấu với Yêu Thần: ')+boss.name;pawn.thought='Đã đạt cấp 15 và hạ hết Yêu Vương. Điện thờ mở, tiến vào quyết chiến.';
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
    if(pawn.isClutchEscape){
      pawn.fleeTime=(pawn.fleeTime||0)+dt;this.fleeFromThreats(pawn,spatialGrid,mapTerrain,dt);return;
    }
    if(pawn.fear<35)pawn.fleeTime=0;
    const monsters=threats.filter(e=>e.isMonster&&e.tier<5);
    const enemies=threats.filter(e=>e.isPawn);
    const danger=threats.find(e=>C.canSee(e,pawn)&&(e.isPawn?((e.level||1)-(pawn.level||1)>=2||pawn.currentHp<pawn.maxHp*.22&&this.calculateWinRate(pawn,e)<.4):this.calculateWinRate(pawn,e)<.4)&&Math.hypot(e.x-pawn.x,e.y-pawn.y)<(e.isPawn?C.visionRange(pawn):160));
    if(danger){
      const attacking=danger.targetEnemy===pawn||danger.action?.target===pawn||pawn.lastAttacker===danger&&G.matchTime-(pawn.lastDamageAt||0)<6;
      if(danger.isPawn&&danger.level-pawn.level>=2&&!attacking){pawn.farmMotivationUntil=G.matchTime+4;}
      else {
      const chance=this.calculateWinRate(pawn,danger),cornered=!this.hasRetreatRoute(pawn,danger);
      const fighting=pawn.targetEnemy===danger||pawn.lastAttacker===danger&&pawn.grudgeUntil>(G.matchTime||0)||Math.hypot(pawn.x-danger.x,pawn.y-danger.y)<C.combatStats(danger).range+45;
      if(P.cowardice<85&&C.canApproach(pawn,danger)&&!pawn.isClutchEscape&&(cornered||fighting&&chance>=.3&&pawn.currentHp>pawn.maxHp*.22||pawn.defiantTarget===danger&&pawn.defiantUntil>(G.matchTime||0)&&pawn.currentHp>pawn.maxHp*.18&&(danger.level||pawn.level)-pawn.level<5)){
        pawn.objective=cornered?'Đường lui bị chặn: chống trả':'Phòng thủ, tìm cơ hội phản công';
        pawn.thought='Bất lợi nhưng còn sức chống trả. Đỡ, giữ khoảng cách và chờ địch hụt đòn.';
        this.engageCombat(pawn,danger,dt);return;
      }
      pawn.plan=null;this.abandonChase(pawn);pawn.targetEnemy=null;
      pawn.objective='Lẩn trốn '+danger.name;pawn.thought='Đối thủ mạnh hơn. Dùng đường khuất và kỹ năng tẩu thoát.';
      this.escapeThreat(pawn,danger,dt);return;
      }
    }
    const aggressor=enemies.find(e=>pawn.lastAttacker===e&&pawn.grudgeUntil>(G.matchTime||0)&&Math.hypot(e.x-pawn.x,e.y-pawn.y)<C.combatStats(e).range+45&&C.canApproach(pawn,e)&&this.duelEligible(pawn,e));
    if(aggressor){pawn.isHiding=false;pawn.objective='Chống trả '+aggressor.name;pawn.thought='Đang bị áp sát: đỡ và phản công trước khi tính chuyện săn mồi.';this.engageCombat(pawn,aggressor,dt);return;}
    this.handleAllianceAndBetrayal(pawn,monsters,enemies);
    if(pawn.allyPawn?.isAlive&&G.pawns.filter(p=>p.isAlive).length<=2){const ally=pawn.allyPawn;ally.allyPawn=null;pawn.allyPawn=null;pawn.allianceBoss=null;ally.allianceBoss=null;}
    if(pawn.allyPawn?.isAlive&&pawn.allianceBoss?.isAlive&&this.canHunt(pawn,pawn.allianceBoss,true)){this.engageCombat(pawn,pawn.allianceBoss,dt);return;}
    const loot=this.findBestItemToLoot(pawn,nearby.filter(e=>e.isDropItem&&window.GameEngine.MapTerrain.segmentClear(pawn.x,pawn.y,e.x,e.y,false,0)));
    if(loot&&(!pawn.plan||pawn.plan.kind!=='loot')&&this.lootPriority(pawn,loot,threats)>this.planPriority(pawn,pawn.plan)+25)pawn.plan={kind:'loot',target:loot,until:pawn.decisionTime+4};
    if(pawn.decisionTime>=(pawn.evaluateAt||0)&&(!pawn.plan||pawn.decisionTime>=pawn.plan.until||!this.planValid(pawn,pawn.plan))){
      pawn.evaluateAt=pawn.decisionTime+.3;
      const choices=[];
      if(loot){const score=this.lootPriority(pawn,loot,threats);if(score>0)choices.push({kind:'loot',target:loot,score});}
      for(const m of G.monsters){if(!this.canHunt(pawn,m))continue;
        const dist=Math.hypot(m.x-pawn.x,m.y-pawn.y),chance=this.calculateWinRate(pawn,m);if(dist<450&&!C.canApproach(pawn,m))continue;
        choices.push({kind:'farm',target:m,score:60+chance*55+P.caution*.25+Math.min(35,m.expReward/8)+P.greed*m.tier*2-dist/(15+P.curiosity*.2)});}
      for(const e of enemies){if(!C.canApproach(pawn,e)||this.ignored(pawn,e)||mapTerrain.isInWater(e.x,e.y))continue;
        const chance=this.calculateWinRate(pawn,e);
        if(!this.duelEligible(pawn,e)&&!pawn.isBerserk)continue;
        const revenge=pawn.lastAttacker===e&&(G.matchTime||0)<pawn.grudgeUntil;
        choices.push({kind:'duel',target:e,score:150+(pawn.battleWill||0)*.8+P.aggression*.9+(1-e.currentHp/e.maxHp)*P.patience*.9+(revenge?P.aggression*.4:0)+P.greed*(e.weapon? .5:0)});}
      const fullBattle=threats.find(e=>e.combatLease>0&&C.groupMembers(e).length>=3&&!C.canJoin(pawn,e));
      if(fullBattle&&(pawn.trait==='coward'||P.caution+P.greed-P.loyalty>90)&&pawn.decisionTime>(pawn.ambushRestUntil||0)&&!(pawn.combatLease>0)){
        const bushes=mapTerrain.bushes.filter(b=>!b.isBurned).map(b=>({x:b.x*mapTerrain.scale,y:b.y*mapTerrain.scale,bush:b}))
          .filter(b=>Math.hypot(b.x-pawn.x,b.y-pawn.y)<400&&Math.hypot(b.x-fullBattle.x,b.y-fullBattle.y)<350&&mapTerrain.canStand(b.x,b.y)&&mapTerrain.canTravel(pawn,b.x,b.y)&&C.validMembers(C.crowdAt(pawn,b.x,b.y))&&!threats.some(e=>C.canSee(e,{...pawn,x:b.x,y:b.y},true)));
        bushes.sort((a,b)=>Math.hypot(a.x-pawn.x,a.y-pawn.y)-Math.hypot(b.x-pawn.x,b.y-pawn.y));
        if(bushes[0])choices.push({kind:'ambush',target:{...bushes[0],battle:fullBattle},score:85+P.caution*.5+P.greed*.6+Math.random()*60});
      }
      // A per-decision preference varies choices without jittering movement every frame.
      for(const choice of choices)choice.score+=(Math.random()-.5)*(8+P.curiosity*.2);
      choices.sort((a,b)=>b.score-a.score);
      const current=pawn.plan&&choices.find(c=>c.kind===pawn.plan.kind&&c.target===pawn.plan.target);
      const chosen=current&&current.score+30>=(choices[0]?.score||0)?current:choices[0];
      pawn.decisionReason=chosen?(chosen.kind==='duel'?'Chiến ý và lợi thế trước đối thủ':'Mục tiêu phù hợp sức mạnh và tính cách'):'Chưa có mục tiêu: khám phá';
      pawn.plan=chosen?{...chosen,until:pawn.decisionTime+(chosen.kind==='ambush'?12:Math.max(2,(pawn.decisionInterval||1)*(1+P.patience/50)))}:null;
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
  updateFinalShowdown(p,threats,nearby,dt){
    const G=window.GameManager,C=window.GameEntities.CombatSystem,M=window.GameEngine.MapTerrain;
    const alive=G.pawns.filter(e=>e.isAlive);
    p.isHiding=false;p.escapeMemory=null;
    if(p.allyPawn&&(!p.allyPawn.isAlive||alive.length===2)){
      const q=p.allyPawn;
      for(const member of [p,q]){member.allyPawn=null;member.isAllied=false;member.allianceBoss=null;member.pactTarget=null;member.pactIntel=null;}
    }
    if(!p.finalDuel?.isAlive)p.finalDuel=null;
    if((p.personality?.cowardice||0)>=85&&p.finalDuel&&((p.finalDuel.level||1)-p.level>=2||p.currentHp<p.maxHp*.2))p.finalDuel=null;
    // A duel is committed by reserveCombat, including missed attacks and damaging skills.
    if(p.finalDuel){
      p.plan=null;p.finalHuntTarget=p.finalDuel;
      if(C.tryReaction(p,threats))return;
      this.engageCombat(p,p.finalDuel,dt);return;
    }
    const pursuer=threats.find(t=>t.isPawn&&(t.level||1)-p.level>=2&&(t.targetEnemy===p||t.action?.target===p||p.lastAttacker===t&&(G.matchTime||0)-(p.lastDamageTakenAt||0)<6));
    if(pursuer&&!p.survivalTarget){p.objective='Thoát truy sát, tìm quái bắt kịp cấp';this.escapeThreat(p,pursuer,dt);return;}
    this.handleCoalition(p,threats);
    if(p.pactTarget?.isAlive&&p.allyPawn?.isAlive&&this.calculateWinRate(p,p.pactTarget,true)>=.4)p.finalHuntTarget=p.pactTarget;
    const candidates=alive.filter(e=>C.isEnemy(p,e)&&((e.level||1)-p.level<2||e===p.pactTarget)&&M.canTravel(p,e.x,e.y));
    if(!candidates.includes(p.finalHuntTarget))p.finalHuntTarget=null;
    if(!p.finalHuntTarget)p.finalHuntTarget=candidates.filter(e=>C.canApproach(p,e)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0]||null;
    const loot=this.findBestItemToLoot(p,nearby.filter(e=>e.isDropItem));
    if(loot&&this.lootPriority(p,loot,threats)>0){this.seekLoot(p,loot,dt);return;}
    if(p.finalHuntTarget){
      p.plan=null;
      this.engageCombat(p,p.finalHuntTarget,dt);return;
    }
    // Farm only to close an extreme level gap; keep one prey rather than re-picking each frame.
    const outleveled=alive.some(e=>C.isEnemy(p,e))&&alive.filter(e=>C.isEnemy(p,e)).every(e=>(e.level||1)-p.level>=2);
    if(outleveled){
      if(p.plan?.kind!=='farm'||!this.planValid(p,p.plan)){
        const prey=G.monsters.filter(m=>this.canHunt(p,m)&&C.canApproach(p,m)&&M.canTravel(p,m.x,m.y))
          .sort((a,b)=>(b.expReward/(1+Math.hypot(b.x-p.x,b.y-p.y)/300))-(a.expReward/(1+Math.hypot(a.x-p.x,a.y-p.y)/300)))[0];
        p.plan=prey?{kind:'farm',target:prey}:null;
      }
      if(p.plan){const prey=p.plan.target;this.engageCombat(p,prey,dt);p.objective='Farm bắt kịp cấp: '+prey.name;p.thought='Đối thủ hơn ít nhất 2 cấp. Săn quái vừa sức; đủ cấp sẽ quay lại tìm bot.';return;}
    }else p.plan=null;
    this.wanderAround(p,dt);
    p.objective=outleveled?'Tìm quái vừa sức để bắt kịp cấp':'Tìm đối thủ còn chỗ giao tranh';
  },
  threatSnapshot(t){
    return {...t,passives:(t.passives||[]).map(p=>({...p})),skills:(t.skills||[]).map(s=>({...s})),weapon:t.weapon?{...t.weapon}:null,armor:t.armor?{...t.armor}:null,helmet:t.helmet?{...t.helmet}:null,action:null};
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
      const visible=threats.find(t=>t.isPawn&&t!==q&&(t.level||1)>(p.level||1)&&(t.level||1)>(q.level||1)&&C.canSee(q,t));
      const local=visible?{target:visible,x:visible.x,y:visible.y,seenAt:now,killAt:now,kills:2,snapshot:this.threatSnapshot(visible),local:true}:null;
      const intel=[local,p.knownThreat,q.knownThreat].filter(k=>k?.kills>=2&&now-k.seenAt<20&&now-k.killAt<60&&k.target.isAlive&&k.target!==p&&k.target!==q).sort((a,b)=>b.kills-a.kills)[0];
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
      const willingness=Math.min(.95,(intel.local?.8:.25)+(P.loyalty+Q.loyalty+P.caution+Q.caution)/600+Math.min(4,intel.kills)*.06);
      if(Math.random()>willingness)continue;
      p.allyPawn=q;q.allyPawn=p;
      for(const member of [p,q]){member.isAllied=true;member.pactTarget=target;member.pactUntil=now+25;member.pactIntel={...intel};member.plan=null;member.chase=null;member.allianceBoss=null;}
      window.GameRenderer.VfxManager.addEmotionMote(p,'🤝','#f1c40f');window.GameRenderer.VfxManager.addEmotionMote(q,'🤝','#f1c40f');
      window.GameUI.CombatTicker.log('🤝 '+p.name+' và '+q.name+' liên minh truy tìm '+target.name+(intel.local?' vì đối thủ mạnh hơn cả hai; cơ hội cả cặp ':' sau chuỗi hạ sát; cơ hội cả cặp ')+Math.round(Math.min(chance,other)*100)+'%.');
      return;
    }
  },
  pursueCoalition(p,threats,dt){
    const G=window.GameManager,C=window.GameEntities.CombatSystem,q=p.allyPawn,t=p.pactTarget,now=G.matchTime||0,intel=p.pactIntel;
    const chance=q?.isAlive&&t?this.calculateWinRate(p,intel?.snapshot||t,true):0;
    if(!t?.isAlive||!q?.isAlive||q.allyPawn!==p||now>p.pactUntil||!intel||now-intel.seenAt>12||chance<.35||p.currentHp<p.maxHp*.2){
      // Do not dissolve either pair inside the protected four-person encounter.
      if(!C.canDissolveAlliance(p)){
        const opponent=p.combatLease>0&&C.groupMembers(p).find(e=>C.isEnemy(p,e)&&e.combatLease>0);
        if(opponent)this.engageCombat(p,opponent,dt);else{p.objective='Tản ra trước khi giải tán liên minh';this.retreatSafely(p,q,dt);}
        return true;
      }
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
    const M=window.GameEngine.MapTerrain,now=window.GameManager.matchTime||0,angle=Math.atan2(p.y-t.y,p.x-t.x),d=Math.hypot(p.x-t.x,p.y-t.y);
    if(p.escapeProbe?.target!==t)p.escapeProbe={target:t,at:now,distance:d};
    const probe=p.escapeProbe;
    if(now-probe.at>3&&d<probe.distance+25&&M.getMoveSpeed(p)<M.getMoveSpeed(t)*.95&&t.targetEnemy===p)return false;
    if(d>probe.distance+40){probe.at=now;probe.distance=d;}
    if(p.retreatCheck?.target===t&&p.retreatCheck.until>now)return p.retreatCheck.result;
    const result=[0,-.8,.8,-1.4,1.4].some(offset=>{const x=p.x+Math.cos(angle+offset)*100,y=p.y+Math.sin(angle+offset)*100;
      return M.canTravel(p,x,y)&&!M.isInWater(x,y)&&M.segmentClear(p.x,p.y,x,y,false,p.collisionRadius||9,p);});
    p.retreatCheck={target:t,until:now+.5,result};return result;
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
    if((window.GameManager.finalShowdown&&target?.isPawn)||p.survivalTarget===target)return target.isAlive;
    if(target?.isAlive&&(target.stealthTimer>0||target.isHiding)&&!window.GameEntities.CombatSystem.canSee(p,target))return false;
    return target?.isAlive&&!this.ignored(p,target)&&(!p.chase||p.chase.target!==target||
      (now-p.chase.started<10+(p.personality?.patience||50)*.06&&now-Math.max(p.chase.started,p.lastDamageTarget===target?p.lastDamageDealtAt||0:0)<9&&Math.hypot(p.x-(p.chase.lastX??target.x),p.y-(p.chase.lastY??target.y))<this.chaseLimit(p)));
  },
  chaseLimit(p){return window.GameEntities.CombatSystem.visionRange(p)*1.8;},
  abandonChase(p){
    if(p.chase){p.ignoredTargets=p.ignoredTargets||{};p.ignoredTargets[p.chase.target.id]=(window.GameManager.matchTime||0)+20;}
    p.chase=null;p.targetEnemy=null;p.plan=null;p.roamGoal=null;
  },
  duelEligible(p,t){
    if(window.GameManager.finalShowdown&&t?.isPawn)return t.isAlive&&(p.finalDuel===t||(t.level||1)-(p.level||1)<2);
    const gap=(t.level||1)-(p.level||1),chance=this.calculateWinRate(p,t),P=p.personality||window.GameData.PersonalityProfiles[p.trait];
    if(gap>=2)return p.survivalTarget===t||p.pactTarget===t;
    if(p.currentHp<p.maxHp*.22&&!p.isBerserk)return false;
    if(gap<=0)return (P.cowardice||0)<85||chance>=.5;
    if(gap<2&&p.fear<85&&p.despair<85)return chance>=.35||P.aggression+(p.battleWill||0)>100;
    return this.willingToFight(p,chance,true);
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
    if(plan.kind==='ambush')return !plan.target.bush.isBurned&&plan.target.battle?.isAlive&&!(p.combatLease>0);
    return plan.target.isAlive&&(plan.kind==='farm'?this.canHunt(p,plan.target):this.keepChasing(p,plan.target)&&(this.duelEligible(p,plan.target)||p.targetEnemy===plan.target&&p.combatLease>0&&this.calculateWinRate(p,plan.target)>=.38&&p.currentHp>p.maxHp*.25));
  },
  ambush(p,site,enemies,dt){
    const M=window.GameEngine.MapTerrain,C=window.GameEntities.CombatSystem,battle=site.battle;
    if(!battle?.isAlive||!p.isHiding&&(!(battle.combatLease>0)||C.groupMembers(battle).length<3||C.canJoin(p,battle))){p.isHiding=false;p.plan=null;return;}
    p.targetEnemy=null;p.chase=null;p.objective='Rình cạnh combat đã đủ người';p.thought='Không chen vào trận đã kín chỗ. Đợi một người rời combat đi ngang bụi.';
    if(Math.hypot(p.x-site.x,p.y-site.y)>18){p.isHiding=false;this.moveToTarget(p,site.x,site.y,dt);return;}
    const prey=enemies.find(e=>!this.ignored(p,e)&&C.canApproach(p,e)&&this.duelEligible(p,e)&&(e.currentHp<e.maxHp*.65||Math.hypot(e.x-p.x,e.y-p.y)<100));
    if(prey){
      p.isHiding=false;p.ambushUntil=0;p.ambushRestUntil=p.decisionTime+15;
      p.plan={kind:'duel',target:prey,until:p.decisionTime+5};p.thought='Đối thủ rời trận và đi ngang. Xuất kích!';this.engageCombat(p,prey,dt);return;
    }
    if(!C.canHideInBush(p)){p.isHiding=false;p.plan=null;p.ambushUntil=0;p.ambushRestUntil=p.decisionTime+10;return;}
    p.isHiding=true;p.vx=p.vy=0;p.ambushUntil=p.ambushUntil||p.decisionTime+6+(p.personality?.patience||50)*.06;
    if(p.decisionTime>=p.ambushUntil){p.isHiding=false;p.ambushUntil=0;p.ambushRestUntil=p.decisionTime+20;p.plan=null;p.roamGoal=null;}
  },
  escapeThreat(p,enemy,dt){
    const M=window.GameEngine.MapTerrain,C=window.GameEntities.CombatSystem,now=window.GameManager.matchTime||p.decisionTime||0;
    if(Math.hypot(p.x-enemy.x,p.y-enemy.y)>Math.max(C.visionRange(p),C.visionRange(enemy))+80&&!C.canSee(enemy,p,true)){
      p.ignoredTargets=p.ignoredTargets||{};p.ignoredTargets[enemy.id]=now+20;p.plan=null;p.targetEnemy=null;p.tactic=null;p.retreatGoal=null;this.wanderAround(p,dt);return;
    }
    const pursuit=enemy.targetEnemy===p||enemy.chase?.target===p||enemy.action?.target===p||p.lastAttacker===enemy&&p.grudgeUntil>now;
    if(pursuit&&C.canSee(enemy,p,true))p.escapeMemory={enemy,lastSeenAt:now,until:now+12};
    const angle=Math.atan2(p.y-enemy.y,p.x-enemy.x);p.aimAngle=angle;
    const escape=p.skills?.find(s=>['teleport','speed_buff','ethereal_speed','stealth','smoke_cloud','backstep_shot'].includes(C.getSkillConfig(p,s).type)&&s.cooldownTimer<=0);
    if(escape&&C.castSkill(p,escape,C.getSkillConfig(p,escape).type==='backstep_shot'?enemy:null))return;
    const bushes=M.bushes.filter(b=>!b.isBurned).map(b=>({x:b.x*M.scale,y:b.y*M.scale}))
      .filter(b=>Math.hypot(p.x-b.x,p.y-b.y)<350&&Math.hypot(b.x-enemy.x,b.y-enemy.y)>Math.hypot(p.x-enemy.x,p.y-enemy.y)+40&&M.canStand(b.x,b.y)&&M.canTravel(p,b.x,b.y)&&C.validMembers(C.crowdAt(p,b.x,b.y)));
    bushes.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
    if(bushes[0]){p.currentStamina=Math.max(0,p.currentStamina-20*dt);this.moveToTarget(p,bushes[0].x,bushes[0].y,dt);p.isHiding=!!p.escapeMemory&&p.escapeMemory.enemy===enemy&&now-p.escapeMemory.lastSeenAt<=6&&C.canHideInBush(p);}
    else{p.isHiding=false;this.retreatSafely(p,enemy,dt);}
  },
  hideAfterEscape(p,dt){
    const memory=p.escapeMemory,C=window.GameEntities.CombatSystem,M=window.GameEngine.MapTerrain,now=window.GameManager.matchTime||p.decisionTime||0;
    if(!memory)return false;
    if(!memory.enemy.isAlive||now>memory.until){p.escapeMemory=null;p.isHiding=false;return false;}
    if(C.canSee(memory.enemy,p,true)){p.isHiding=false;return false;}
    if(p.isHiding&&C.canHideInBush(p)){p.objective='Núp bụi sau khi cắt tầm nhìn';p.thought='Kẻ truy sát vừa mất dấu. Giữ yên một lúc rồi đổi đường.';p.vx=p.vy=0;return true;}
    if(now-memory.lastSeenAt>6){p.escapeMemory=null;return false;}
    const observers=[...window.GameManager.pawns,...window.GameManager.monsters].filter(e=>e.isAlive&&C.isEnemy(e,p));
    const sites=M.bushes.filter(b=>!b.isBurned).map(b=>({x:b.x*M.scale,y:b.y*M.scale})).filter(b=>Math.hypot(b.x-p.x,b.y-p.y)<250&&M.canTravel(p,b.x,b.y)&&M.canStand(b.x,b.y)&&C.validMembers(C.crowdAt(p,b.x,b.y))&&!observers.some(e=>C.canSee(e,{...p,x:b.x,y:b.y},true)));
    sites.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
    if(!sites[0])return false;
    p.targetEnemy=null;p.plan=null;p.chase=null;p.objective='Cắt tầm nhìn, tìm bụi an toàn';
    this.moveToTarget(p,sites[0].x,sites[0].y,dt);
    if(Math.hypot(p.x-sites[0].x,p.y-sites[0].y)<18&&C.canHideInBush(p)){p.isHiding=true;C.progressionEvent(p,memory.enemy,'concealed');memory.until=Math.min(memory.until,now+4);}
    return true;
  },
  canHunt(p,m,withAlly=false){
    if(!m?.isAlive||m.isSplit||this.ignored(p,m)||window.GameEngine.MapTerrain.isInWater(m.x,m.y))return false;
    if(m.tier>=5)return p.level>=15&&!window.GameEngine.MapTerrain.remainingLords()&&(window.GameManager.battleRoyaleResolved||this.willingToFight(p,this.calculateWinRate(p,m)));
    const min=[0,1,3,6,10,15][m.tier];
    if(!m.isFinalHunt&&p.level<min)return false;
    const chance=this.calculateWinRate(p,m,withAlly);
    if(p.targetEnemy===m&&p.combatLease>0&&p.currentHp>p.maxHp*.2&&chance>=.4)return true;
    return (m.isFinalHunt?chance>=.5:this.willingToFight(p,chance)) && (p.currentHp/p.maxHp>.2 || chance>.82);
  },
  seekLoot(p,item,dt,temporary=false){
    p.isHiding=false;p.objective='Nhặt '+item.name;p.thought='Đổi vũ khí mạnh hơn rồi tiếp tục mục tiêu đã chọn.';
    this.moveToTarget(p,item.x,item.y,dt);
    if(Math.hypot(p.x-item.x,p.y-item.y)<22){this.lootItem(p,item);p.combatLoot=null;if(!temporary&&p.plan?.kind==='loot')p.plan=null;}
  },

  // Phân bổ điểm kỹ năng nhận được ở mọi cấp theo tính cách.
  handleLevelingAndSkills: function(pawn) {
    pawn.passives=pawn.passives||[];
    if(pawn.level>=3&&!pawn.passivePoolOpened){pawn.passivePoolOpened=true;const d=window.GameData.EndgamePassives[Math.floor(Math.random()*18)];pawn.passives.push(window.GameEntities.CombatSystem.makePassive(d));}
    if (!pawn.unspentSkillPoints || pawn.unspentSkillPoints <= 0) return;

    pawn.skills=pawn.skills||[];
    const P=pawn.personality||window.GameData.PersonalityProfiles[pawn.trait];
    const pool=Object.values(window.GameData.Skills).flatMap(group=>group.actives).concat(pawn.level>=3?window.GameData.EndgamePassives:[]);
    if(!pawn.skillPreferences){
      const roles={strike:30+P.aggression*.7,finisher:20+P.greed*.6,control:20+P.patience*.6,defense:20+P.caution*.6,heal:20+P.loyalty*.5,mobility:20+P.caution*.5,buff:20+P.curiosity*.5};
      pawn.skillPreferences=Object.fromEntries(pool.map(d=>[d.id,roles[d.role]+Math.random()*45]));
    }
    for(const d of pool)if(pawn.skillPreferences[d.id]===undefined)pawn.skillPreferences[d.id]=25+(d.role==='defense'?P.caution:d.role==='mobility'?P.curiosity:P.aggression)*.6+Math.random()*45;
    while(pawn.unspentSkillPoints>0){
      const unknown=pool.filter(d=>![...pawn.skills,...pawn.passives].some(s=>s.id===d.id)).sort((a,b)=>pawn.skillPreferences[b.id]-pawn.skillPreferences[a.id]);
      const upgrade=[...pawn.skills,...pawn.passives].filter(s=>s.tier<3).sort((a,b)=>pawn.skillPreferences[b.id]-pawn.skillPreferences[a.id])[0];
      const breadth=Math.max(.15,Math.min(.85,.5+(P.curiosity-P.patience)/120));
      if(unknown.length&&(!upgrade||Math.random()<breadth)){const d=unknown[0];pawn.lastSkillInvestment='Học '+d.name+' theo sở thích '+(d.role==='defense'?'sinh tồn':d.role==='mobility'?'cơ động':'gây áp lực')+'; '+(breadth>.5?'ưu tiên học rộng':'ưu tiên nâng sâu');if(d.type==='progression')pawn.passives.push(window.GameEntities.CombatSystem.makePassive(d));else pawn.skills.push({id:d.id,def:d,tier:1,cooldownTimer:0});}
      else if(upgrade){upgrade.tier++;pawn.lastSkillInvestment='Nâng '+(upgrade.def?.name||upgrade.name)+' lên B'+upgrade.tier+' theo sở thích và tính cách';if(upgrade.type==='progression')upgrade.desc=upgrade.ranks[upgrade.tier-1].desc;}
      else break;
      pawn.unspentSkillPoints--;
    }
  },

  lootValue(p,item){
    if(!item||item.isCollected)return 0;
    if(item.slot==='potion')return (p.healthPotions||0)<5?(p.currentHp<p.maxHp*.65?110:35)-(p.healthPotions||0)*5:0;
    const slot={weapon:'weapon',head:'helmet',body:'armor',feet:'boots'}[item.slot],next=item.data;
    if(!slot||!next)return 0;
    const current=p[slot];
    if(current?.tier==='ancient'&&item.tier!=='ancient')return 0;

    const power=e=>{
      if(!e)return slot==='weapon'?(p.attack||16)*.9:0;
      const stats=window.GameEntities.CombatSystem.combatStats({...p,[slot]:e});
      const weapon=slot==='weapon'?stats.attack*Math.min(1.43,e.speed||.9)*(1+Math.min(.25,stats.range/800))*(1+Math.min(.35,(p.critChance||.05)+(e.critChance||0))*.35)*(1+(e.armorPierce||0)*.2):0;
      return ['common','rare','super_rare','supreme','god','ancient'].indexOf(e.tier)*3+weapon+(e.defense||0)*1.3+(e.hp||0)*.12+(e.manaMax||0)*.07+(e.critChance||0)*60+(e.ccImmunity?12:0)+(e.reviveOnce?25:0);
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
    if(!item||item.isCollected)return false;
    if(this.lootValue(pawn,item)<=0){if(item.tier!=='ancient')return false;pawn.keptRelics=pawn.keptRelics||[];pawn.keptRelics.push(item.data);item.isCollected=true;return true;}
    if (item.slot === 'potion') { window.GameEngine.Audio?.play('loot',pawn);pawn.healthPotions = (pawn.healthPotions || 0) + 1; item.isCollected = true; return true; }
    window.GameEngine.Audio?.play('loot',pawn);
    const eqData = item.data || item;
    const slot = { weapon: 'weapon', head: 'helmet', body: 'armor', feet:'boots' }[item.slot];
    if (!slot) return false;
    const oldEquipment = pawn[slot];
    if (item.slot === 'weapon') {
      pawn.weapon = eqData;
      pawn.classId=(eqData.classReq==='all'||!eqData.classReq)?'warrior':eqData.classReq;
      this.handleLevelingAndSkills(pawn);
      window.GameUI.CombatTicker.log('⚔️ '+pawn.name+' trang bị '+item.name+'.');
    } else if (item.slot === 'head') {
      pawn.helmet = eqData;
    } else if (item.slot === 'body') {
      pawn.armor = eqData;
    } else if(item.slot==='feet'){pawn.boots=eqData;}

    const hpChange = (eqData.hp || 0) - (oldEquipment?.hp || 0);
    pawn.maxHp += hpChange;
    pawn.currentHp = Math.min(pawn.maxHp, pawn.currentHp);
    const manaChange = (eqData.manaMax || 0) - (oldEquipment?.manaMax || 0);
    pawn.maxMana += manaChange;
    pawn.currentMana = Math.min(pawn.maxMana, pawn.currentMana + Math.max(0, manaChange));

    const staminaChange=(eqData.staminaMax||0)-(oldEquipment?.staminaMax||0);pawn.maxStamina+=staminaChange;pawn.currentStamina=Math.min(pawn.maxStamina,pawn.currentStamina+Math.max(0,staminaChange));
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
        const C=window.GameEntities.CombatSystem;
        if(!C.validMembers(new Set([...C.groupMembers(pawn),...C.groupMembers(candidate),boss]))){pawn.allyPawn=null;candidate.allyPawn=null;return;}
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
      if(!window.GameEntities.CombatSystem.canDissolveAlliance(pawn))return;
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
    if(window.GameEntities.RelicSystem.tryDash(p,t,mode))return true;
    const C=window.GameEntities.CombatSystem,P=p.personality,dist=Math.hypot(t.x-p.x,t.y-p.y);
    const incoming=t.action&&!t.action.released&&t.action.target===p;
    const opening=t.stunTimer>0||t.currentStamina<18||t.action?.released&&t.action.duration-t.action.elapsed>.15||p.counterTarget===t&&p.counterUntil>(window.GameManager.matchTime||0);
    if(p.skillCombo&&(p.skillCombo.target!==t||!t.isAlive||p.skillCombo.until<(window.GameManager.matchTime||0)||!C.canSee(p,t)))p.skillCombo=null;
    const candidates=[];
    for(const skill of p.skills||[]){
      const c=C.getSkillConfig(p,skill),type=c.type,mana=(c.manaCost||0)+(c.extraManaPct||0)*p.maxMana,stamina=(c.staminaCost||0)+(c.extraStaminaPct||0)*p.maxStamina;
      if(skill.cooldownTimer>0||p.silenceTimer>0||p.currentMana<mana||p.currentStamina<stamina)continue;
      let score=0;
      if(['self_heal','aura_heal'].includes(type)){if(p.currentHp>=p.maxHp*.65)continue;score=160;}
      else if(['shield_stance','counter_stance','mana_shield_toggle','stasis'].includes(type)){if(!incoming)continue;score=145;}
      else if(['teleport','speed_buff','ethereal_speed','stealth','smoke_cloud','backstep_shot'].includes(type)){
        const advancing=['pressure','counter'].includes(mode)&&dist>C.combatStats(p).range+30&&['teleport','speed_buff','ethereal_speed'].includes(type);
        if((!advancing&&!['retreat','bait'].includes(mode))||p.speedBuffTimer>0||p.stealthTimer>0||dist>200)continue;
        if(type==='backstep_shot'&&dist>c.range)continue;score=95;
      }else if(['weapon_buff','weapon_swap'].includes(type)){
        if(p.weaponBuffTimer>0||type==='weapon_swap'&&!p.secondaryWeapon)continue;score=55;
      }else{
        if(dist>c.range||!C.canEngage(p,t))continue;
        const lethal=t.currentHp<=c.damage*100/(100+C.combatStats(t).defense);
        if(p.currentStamina-stamina<18&&!lethal&&P.aggression<80&&(p.anger||0)<55&&!opening)continue;
        if(['probe','bait'].includes(mode)&&!opening&&!lethal&&(p.anger||0)<55)continue;
        score=40+(opening?55:0)+(lethal?100:0)+c.damage*.12;
        if(c.stun&&!(t.controlImmunityTimer>0))score+=t.stunTimer>0?0:incoming?65:25;
        if((c.stun||c.slow)&&p.allyPawn?.lastAttacker===t&&P.loyalty>55)score+=35;
        if(/execution|finisher/.test(type)&&t.currentHp>t.maxHp*.4&&!opening)score-=45;
        if(mode==='retreat'&&!opening&&!lethal)score-=25;
      }
      if(p.skillCombo?.followupId===skill.id)score+=55;
      candidates.push({skill,score,type});
    }
    candidates.sort((a,b)=>b.score-a.score);
    for(const candidate of candidates){
      if(candidate.score<=0)continue;
      const escaping=['teleport','speed_buff','ethereal_speed','stealth','smoke_cloud'].includes(candidate.type);
      if(escaping)p.aimAngle=['pressure','counter'].includes(mode)?Math.atan2(t.y-p.y,t.x-p.x):Math.atan2(p.y-t.y,p.x-t.x);
      if(C.castSkill(p,candidate.skill,escaping?null:t)){
        if(p.skillCombo?.followupId===candidate.skill.id)p.skillCombo=null;
        else if(candidate.skill.def.role==='control'||candidate.skill.def.role==='mobility'){const next=(p.skills||[]).filter(s=>s!==candidate.skill&&s.cooldownTimer<=0&&['strike','finisher'].includes(s.def.role)).sort((a,b)=>C.getSkillConfig(p,b).damage-C.getSkillConfig(p,a).damage)[0];if(next)p.skillCombo={target:t,setupId:candidate.skill.id,followupId:next.id,until:(window.GameManager.matchTime||0)+4};}
        return true;
      }
    }
    return false;
  },
  engageCombat: function(pawn, target, dt) {
    if (!target || !target.isAlive || pawn.allyPawn === target) return;
    const M=window.GameEngine.MapTerrain,C=window.GameEntities.CombatSystem,G=window.GameManager,P=pawn.personality,now=G.matchTime||0;
    const finalDuel=(G.finalShowdown&&target.isPawn)||pawn.survivalTarget===target||G.battleRoyaleResolved&&(target.isAncient||target.isAncientClone);
    if(finalDuel&&!C.canSee(pawn,target)&&C.canApproach(pawn,target)){
      pawn.targetEnemy=target;pawn.objective='Săn đối thủ cuối trận: '+target.name;pawn.thought='Lần theo đối thủ để quyết đấu; không bỏ cuộc giữa trận.';
      this.moveToTarget(pawn,target.x,target.y,dt);return;
    }
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
    const defiant=window.GameEntities.RelicSystem.has(pawn,'core')&&range<=90||pawn.defiantTarget===target&&pawn.defiantUntil>now||!this.hasRetreatRoute(pawn,target);
    if(opening&&pawn.currentStamina>=18&&tactic.mode!=='counter'&&now>=(tactic.holdUntil||0)){tactic.mode='counter';tactic.until=now+1;tactic.holdUntil=now+.8;}
    else if(now>=tactic.until){
      tactic.mode=!defiant&&(pawn.anger||0)<55&&(pawn.currentStamina<25||!finalDuel&&chance<.48&&tactic.mode!=='retreat')?'retreat':!finalDuel&&P.caution+P.greed>P.aggression+100&&chance<.65&&now-tactic.started<6?'bait':'pressure';
      tactic.until=now+1+P.patience/100;tactic.holdUntil=now+.8;
    }
    if(pawn.allyPawn?.isAlive&&P.loyalty>65&&pawn.allyPawn.currentHp<pawn.allyPawn.maxHp*.35&&pawn.currentHp>pawn.maxHp*.5)tactic.mode='pressure';
    if(!finalDuel&&(pawn.currentHp<pawn.maxHp*.18||chance<.25&&!(G.battleRoyaleResolved&&target.tier>=5)&&(!target.isPawn||(target.level||1)-(pawn.level||1)>=2))&&this.hasRetreatRoute(pawn,target)){
      tactic.mode='escape';pawn.objective='Thoát khỏi giao tranh';pawn.thought='Máu hoặc lợi thế đã xuống quá thấp; thoát thân thay vì đổi mạng.';this.escapeThreat(pawn,target,dt);return;
    }
    if(dist>C.visionRange(target)&&!opening)tactic.mode='pressure';
    if(range>90&&dist<range*.4&&!opening&&!defiant&&now>=(tactic.holdUntil||0)){tactic.mode='retreat';tactic.until=now+1;tactic.holdUntil=now+1;}
    if(defiant&&pawn.currentHp>pawn.maxHp*.12){tactic.mode='counter';pawn.thought='Bị ép hoặc cấu rỉa liên tục: giữ đòn phòng thủ và phản kháng!';}
    const labels={probe:'Thăm dò, giữ chiêu',pressure:'Gây áp lực',retreat:'Lùi chiến thuật',bait:'Giả lùi, dụ đối thủ',counter:'Phản công sơ hở'};
    pawn.combatTactic=labels[tactic.mode];
    const mission=finalDuel?'Quyết đấu cuối trận • ':G.battleRoyaleResolved?(target.tier===6?'Quyết chiến Thượng Cổ • ':target.tier===5?'Quyết chiến Yêu Thần • ':'Farm Yêu Vương, cấp '+pawn.level+'/15 • '):pawn.pactTarget?'Liên minh săn • ':'';
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
    pawn.fleeTime=0;this.wanderAround(pawn,dt);
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
      const hp=e.currentHp+(e.potionCooldown>0?0:Math.min(2,e.healthPotions||0))*Math.min(220,e.maxHp*.35),stamp=Math.floor((window.GameManager.matchTime||0)*4),cached=e.aiStrength;
      const key=[e.level,e.attack,e.defense,Math.floor((e.currentStamina??100)/15),Math.floor((e.currentMana??100)/15),e.action?.kind,e.action?.released,e.armorBreakTimer>0,e.relicState?.voidblade?.stacks,(e.skills||[]).map(s=>s.id+':'+s.tier+':'+(s.cooldownTimer<=0)).join(',')].join(':');
      if(cached&&cached.stamp===stamp&&cached.key===key&&cached.weapon===e.weapon&&cached.armor===e.armor&&cached.helmet===e.helmet&&cached.boots===e.boots)return {...cached.stats,hp};
      const s=C.combatStats(e),ready=(e.skills||[]).filter(skill=>{const c=C.getSkillConfig(e,skill);return skill.cooldownTimer<=0&&!(e.silenceTimer>0)&&e.currentMana>=((c.manaCost||0)+(c.extraManaPct||0)*e.maxMana)&&e.currentStamina>=((c.staminaCost||0)+(c.extraStaminaPct||0)*e.maxStamina);}).length;
      const stamina=Math.max(0,Math.min(1,(e.currentStamina??100)/(e.maxStamina||100)));
      const recovery=e.action?.released? .9:1,range=1+Math.min(.12,s.range/1200);
      const M=window.GameEngine.MapTerrain,terrain=(M.isOnCliff(e.x,e.y)?1.1:1)*(M.isInBush(e.x,e.y)&&s.range>90?1.05:1);
      const stats={...s,dps:s.attack*Math.min(1.43,e.weapon?.speed||.9)*(1+Math.min(.24,ready*.08))*(.8+stamina*.2)*range*recovery*terrain};
      e.aiStrength={stamp,key,weapon:e.weapon,armor:e.armor,helmet:e.helmet,boots:e.boots,stats};return {...stats,hp};
    };
    const a=strength(pawn),b=strength(enemy);
    if(withAlly&&pawn.allyPawn?.isAlive){const ally=strength(pawn.allyPawn);a.dps+=ally.dps*.8;a.hp+=ally.hp*.6;}
    const ours=a.dps*100/(100+b.defense),theirs=b.dps*100/(100+a.defense);
    const timeToKill=b.hp/Math.max(1,ours),timeToDie=a.hp/Math.max(1,theirs);
    return timeToDie/(timeToDie+timeToKill);
  },

  retreatSafely: function(pawn, enemy, dt, tactical=false) {
    const M=window.GameEngine.MapTerrain,now=window.GameManager.matchTime||0,cached=pawn.retreatGoal;
    if(cached?.enemy===enemy&&cached.tactical===tactical&&cached.until>now&&Math.hypot(pawn.x-cached.x,pawn.y-cached.y)>15&&M.canStand(cached.x,cached.y)&&M.segmentClear(pawn.x,pawn.y,cached.x,cached.y,false,9,pawn)){
      pawn.currentStamina=Math.max(0,pawn.currentStamina-(tactical?8:20)*dt);this.moveToTarget(pawn,cached.x,cached.y,dt);pawn.aimAngle=Math.atan2(enemy.y-pawn.y,enemy.x-pawn.x);return;
    }
    const angle=Math.atan2(pawn.y-enemy.y,pawn.x-enemy.x),distance=tactical?75:130;
    const choices=[0,-.7,.7,-1.3,1.3].map(offset=>({x:pawn.x+Math.cos(angle+offset)*distance,y:pawn.y+Math.sin(angle+offset)*distance}));
    if(tactical)for(const b of M.bushes){const x=b.x*M.scale,y=b.y*M.scale;
      if(!b.isBurned&&Math.hypot(x-pawn.x,y-pawn.y)<180&&Math.hypot(x-enemy.x,y-enemy.y)>Math.hypot(pawn.x-enemy.x,pawn.y-enemy.y)+20)choices.push({x,y});}
    const goal=choices.filter(p=>M.canStand(p.x,p.y)&&M.canTravel(pawn,p.x,p.y)&&!M.isInWater(p.x,p.y)&&M.segmentClear(pawn.x,pawn.y,p.x,p.y,false,9,pawn))
      .sort((a,b)=>Math.hypot(b.x-enemy.x,b.y-enemy.y)+(M.isInBush(b.x,b.y)?60:0)-Math.hypot(a.x-enemy.x,a.y-enemy.y)-(M.isInBush(a.x,a.y)?60:0))[0];
    if(!goal){pawn.vx=pawn.vy=0;return;}
    pawn.retreatGoal={...goal,enemy,tactical,until:now+1.2};
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
    if(pawn.roamGoal&&(!M.canTravel(pawn,pawn.roamGoal.x,pawn.roamGoal.y)||!M.canStand(pawn.roamGoal.x,pawn.roamGoal.y)||(pawn.navRecoveries||0)-(pawn.roamRecoveryStart||0)>=3)){if(pawn.roamGoal.key)(pawn.visitedSectors||(pawn.visitedSectors={}))[pawn.roamGoal.key]=pawn.decisionTime+60;pawn.roamGoal=null;}
    if(!pawn.roamGoal||Math.hypot(pawn.x-pawn.roamGoal.x,pawn.y-pawn.roamGoal.y)<45||pawn.decisionTime>(pawn.roamUntil||0)){
      // Sweep persistent sectors rather than following unseen enemies' live coordinates.
      pawn.visitedSectors=pawn.visitedSectors||{};
      const sectors=[];
      const lateSearch=G.pawns.filter(p=>p.isAlive).length<=5;
      pawn.searchLeg=(pawn.searchLeg||0)+1;
      if(lateSearch&&pawn.searchLeg%2===1)for(const [x,y] of [[2600,2100],[3100,2600],[2600,3100],[2100,2600]]){const pos=M.safeGoal(pawn,x,y),key='crossroad_'+x+'_'+y;if(M.canTravel(pawn,pos.x,pos.y))sectors.push({...pos,key,score:750+(pawn.decisionTime-(pawn.visitedSectors[key]??-1000))*.5-Math.hypot(pos.x-pawn.x,pos.y-pawn.y)/100});}
      for(let y=0;y<6;y++)for(let x=0;x<6;x++){
        const key=x+','+y,pos=M.safeGoal(pawn,(x+.5)*G.width/6,(y+.5)*G.height/6);
        if(!M.canTravel(pawn,pos.x,pos.y)||M.isInWater(pos.x,pos.y))continue;
        const dist=Math.hypot(pos.x-pawn.x,pos.y-pawn.y);
        if(dist<120)continue;
        sectors.push({...pos,key,score:(pawn.decisionTime-(pawn.visitedSectors[key]??-1000))*.5-dist/100+Math.random()*30});
      }
      sectors.sort((a,b)=>b.score-a.score);
      const goal=sectors[0]||M.nearestFree(pawn.x+500,pawn.y+200);
      if(goal.key)pawn.visitedSectors[goal.key]=pawn.decisionTime;
      pawn.roamGoal=goal;pawn.roamRecoveryStart=pawn.navRecoveries||0;pawn.roamUntil=pawn.decisionTime+Math.max(12,Math.hypot(goal.x-pawn.x,goal.y-pawn.y)/70);pawn.navTimer=0;
    }
    pawn.objective='Khám phá bản đồ, săn lùng mục tiêu';
    pawn.thought='Chưa thấy con mồi phù hợp. Giữ mục tiêu di chuyển, đi vòng tường và ưu tiên cầu.';
    this.moveToTarget(pawn,pawn.roamGoal.x,pawn.roamGoal.y,dt);
  }

};

window.GameAI.AIBrain = window.GameAI.AiBrain;
