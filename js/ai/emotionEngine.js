/** Short event memory drives emotion; personality remains stable. */
window.GameAI = window.GameAI || {};
window.GameAI.EmotionEngine = {
  updatePawnEmotions(p,dt,pawns=[],monsters=[]){
    if(!p?.isAlive)return;
    const C=window.GameEntities.CombatSystem,visible=[...pawns,...monsters].filter(t=>C.isEnemy(p,t)&&C.canSee(p,t));
    p.isUnderThreat=visible.some(t=>C.canSee(t,p));this.observe(p,visible);this.update(p,dt);
  },
  observe(p,targets){
    const now=window.GameManager.matchTime||0,P=p.personality||window.GameData.PersonalityProfiles[p.trait];
    p.seenRivals=p.seenRivals||{};
    for(const [id,m] of Object.entries(p.seenRivals))if(now-m.at>20||!m.target.isAlive)delete p.seenRivals[id];
    for(const t of targets){
      if(!t.isPawn)continue;
      const memory=p.seenRivals[t.id];
      if(!memory||now-memory.eventAt>=8){
        const gap=t.level-p.level;
        if(gap<=0){p.battleWill=Math.min(100,(p.battleWill||0)+32+P.aggression*.16-(P.cowardice||0)*.08);p.confidence=Math.min(100,(p.confidence||20)+5);}
        else if(gap>=2)p.farmMotivationUntil=now+4;
        p.seenRivals[t.id]={target:t,at:now,eventAt:now,x:t.x,y:t.y};
      }else Object.assign(memory,{at:now,x:t.x,y:t.y});
    }
  },
  update(p,dt){
    if(!p.isAlive)return;
    const P=p.personality||window.GameData.PersonalityProfiles[p.trait],baseline=25+P.aggression*.2+(P.composure||50)*.15;
    p.fear=Math.max(0,(p.fear||0)-dt*(3+(P.composure||50)/25));
    p.anger=Math.max(0,(p.anger||0)-dt*(2+(P.composure||50)/50));
    p.battleWill=Math.max(0,(p.battleWill||0)-dt*3);
    p.confidence=(p.confidence??baseline)+(baseline-(p.confidence??baseline))*Math.min(1,dt*.08);
    const ready=p.skills||[],needsMana=ready.some(s=>(s.def.t1?.manaCost||s.def.manaCost||0)>0),needsStamina=ready.some(s=>(s.def.t1?.staminaCost||s.def.staminaCost||0)>0);
    const depleted=(needsMana&&p.currentMana<12)&&(needsStamina&&p.currentStamina<15)||p.currentHp<p.maxHp*.2&&p.currentStamina<15;
    p.despair=Math.max(0,Math.min(100,(p.despair||0)+(p.isUnderThreat&&depleted?5:-4)*dt));
    if(p.survivalTarget&&!p.survivalTarget.isAlive){p.survivalTarget=null;p.decisionReason='Kẻ truy sát đã bị hạ';}
    p.emotionMoteTimer=(p.emotionMoteTimer||0)-dt;
    if(p.emotionMoteTimer<=0){p.emotionMoteTimer=2.5;const icon=p.survivalTarget?'💀':p.anger>55?'😡':p.fear>65?'😨':p.battleWill>65?'⚔️':p.confidence>75?'😎':p.objective?.startsWith('Nhặt')?'🤩':null;if(icon)window.GameRenderer.VfxManager.addEmotionMote(p,icon,p.fear>65?'#8bdfff':'#ffdf96');}
    if(p.isBerserk){p.berserkTimer-=dt;if(p.berserkTimer<=0)p.isBerserk=false;}
    if(p.isClutchEscape){p.clutchEscapeTimer-=dt;if(p.clutchEscapeTimer<=0){p.isClutchEscape=false;p.invincible=false;}}
  },
  onDamageTaken(p,damage,a,c={}){
    const P=p.personality||window.GameData.PersonalityProfiles[p.trait],now=window.GameManager.matchTime||0,fraction=damage/p.maxHp;
    const independent=!c.dot&&!c.reflected,token=c.sourceSkill?.castId!==undefined?'skill:'+c.sourceSkill.castId:c.actionId!==undefined?'attack:'+c.actionId:a.action?.id!==undefined?'action:'+a.action.id:'time:'+now;
    const previous=p.pokeHistory,repeated=previous?.attacker===a&&now-previous.at<6,distinct=independent&&(!repeated||previous.token!==token);
    if(distinct){p.pokeHistory={attacker:a,at:now,token,hits:repeated?previous.hits+1:1};}
    p.fear=Math.min(100,(p.fear||0)+Math.min(9,fraction*35)*(1+(P.cowardice||0)/100)/(1+(P.composure||50)/100));
    p.anger=Math.min(100,(p.anger||0)+fraction*65+(distinct?P.aggression*.08+(repeated?9:0):0));
    if(p.pokeHistory?.attacker===a&&p.pokeHistory.hits>=3){p.defiantTarget=a;p.defiantUntil=now+6;p.battleWill=Math.min(100,(p.battleWill||0)+12);p.fear=Math.max(0,p.fear-6);}
    if(p.action?.skillId==='a_snipe'&&!p.action.released){p.action=null;p.attackState=null;}
    if(p.healInterruptibleTimer>0){p.healTimer=0;p.healInterruptibleTimer=0;}
  },
  commitSurvival(p,t){
    if((p.personality?.cowardice??window.GameData.PersonalityProfiles[p.trait]?.cowardice??50)>=85||p.survivalTarget===t)return false;
    p.survivalTarget=t;p.finalDuel=t;p.plan=null;p.chase=null;p.isClutchEscape=false;p.invincible=false;p.battleWill=100;p.fear=Math.min(25,p.fear||0);
    p.decisionReason='Bị truy sát liên tục, không còn đường thoát';p.thought='Không chạy thoát được: giữ phòng thủ và chiến đấu tới cùng.';
    window.GameUI.CombatTicker.log('💀 '+p.name+' thức tỉnh bản năng sinh tồn, quyết đấu với '+t.name);return true;
  },
  onKillOrLoot(p,tier='rare'){p.confidence=Math.min(100,(p.confidence||0)+(['supreme','god','ancient'].includes(tier)?35:15));p.fear=Math.max(0,(p.fear||0)-15);p.battleWill=Math.min(100,(p.battleWill||0)+10);},
  triggerBreakthrough(p,forceBerserk=false){
    p.hasBreakthrough=true;
    if(forceBerserk||p.trait==='brave'){p.isBerserk=true;p.isClutchEscape=false;p.invincible=false;p.berserkTimer=5;p.fear=0;p.confidence=100;}
    else{p.isClutchEscape=true;p.isBerserk=false;p.clutchEscapeTimer=3;p.invincible=false;p.fear=100;}
  }
};
