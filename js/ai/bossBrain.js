window.GameAI=window.GameAI||{};
window.GameAI.BossBrain={
 update(m,targets,dt){
  const C=window.GameEntities.CombatSystem,M=window.GameEngine.MapTerrain,G=window.GameManager;
  const previous=m.targetEnemy;
  if(m.isAncient||m.isAncientClone){
   const owner=m.ancientOwner||m;
   if(!owner.huntTarget?.isAlive)owner.huntTarget=targets[0]||owner.original;
   const prey=owner.huntTarget;
   if(!prey?.isAlive)return false;
   if(C.canSee(m,prey)){owner.huntIntel={x:prey.x,y:prey.y};targets=[prey];}
   else{
    m.targetEnemy=prey;m.objective='Truy sát: tìm vị trí cuối và lối thoát';
    const intel=owner.huntIntel||{x:m.homeX,y:m.homeY};
    if(Math.hypot(m.x-intel.x,m.y-intel.y)>35){M.navigate(m,intel.x,intel.y,dt);return true;}
    const arena=window.GameEntities.AncientSystem.arena;
    if(!m.searchGoal||Math.hypot(m.x-m.searchGoal.x,m.y-m.searchGoal.y)<40){m.searchSector=((m.searchSector||0)+1)%9;const i=m.searchSector;m.searchGoal=M.nearestFree(arena.x+(i%3+.5)*arena.w/3,arena.y+(Math.floor(i/3)+.5)*arena.h/3);}
    M.navigate(m,m.searchGoal.x,m.searchGoal.y,dt);return true;
   }
  }
  targets.sort((a,b)=>{
   const score=p=>(p.currentHp/p.maxHp)*90+Math.hypot(p.x-m.x,p.y-m.y)*.25-(p.action?.released?25:0)-(p===previous?30:0);
   return score(a)-score(b);
  });
  const t=targets[0];m.targetEnemy=t||null;if(!t)return false;
  const dist=Math.hypot(t.x-m.x,t.y-m.y),range=C.combatStats(m).range,angle=Math.atan2(t.y-m.y,t.x-m.x);
  m.aimAngle=angle;m.decisionClock=(m.decisionClock||0)+dt;
  const incoming=t.action&&!t.action.released&&t.action.target===m;
  if(incoming&&m.defenseCooldown<=0&&m.currentStamina>=30&&dist<range+60&&!m.isAncient){
   m.objective='Đọc đòn, phòng thủ';if(C.defend(m,m.tier===3?'dodge':'block',m.tier===3?angle+Math.PI/2:angle))return true;
  }
  const skills=(m.skills||[]).filter(s=>s.cooldownTimer<=0&&(!s.def.phase||m.phase>=s.def.phase));
  skills.sort((a,b)=>{
   const score=s=>{const c=C.getSkillConfig(m,s),kind=c.monsterEffect||c.effect||c.shape;
    const close=dist<95,casting=t.action?.kind==='skill'&&!t.action.released,running=(t.vx||0)*Math.cos(angle)+(t.vy||0)*Math.sin(angle)>40;
    const conditional=close&&['cone','ring','flurry','interrupt','sweep','cross'].includes(kind)?50:running&&['line','beam','charge','pillars','tether','homing'].includes(kind)?40:casting&&['interrupt','mark','chains','net'].includes(kind)?40:0;
    const setup=t.slowTimer>0||t.armorBreakTimer>0||t.deathMarkTimer>0;
    const followup=setup&&['judgment','leap','nuke','fissure','spear'].includes(kind)?35:0;
    return conditional+followup+(s.def.phase?30:0)+(dist<c.range?30:-100)+(c.stun&&t.controlImmunityTimer<=0?15:0)+(t.action?.released?20:0)+(['wall','pull','devour','spear','homing'].includes(kind)&&dist>range?25:0)+(['sweep','cross','lava','net'].includes(kind)&&dist<180?25:0)+(s.id!==m.lastSkill?10:-30);
   };return score(b)-score(a);
  });
  for(const s of skills)if(C.castSkill(m,s,t)){m.lastSkill=s.id;m.objective='Thi triển '+s.def.name;return true;}
  if(dist<=range&&C.canEngage(m,t)&&m.attackCooldown<=0){C.executeAttack(m,t);m.objective='Đánh vào sơ hở';return true;}
  const ranged=range>=100;
  if(ranged&&dist<range*.55&&m.currentStamina>20&&!t.stunTimer){
   const goal=M.safeGoal(m,m.x-Math.cos(angle)*65,m.y-Math.sin(angle)*65);
   if(M.segmentClear(m.x,m.y,goal.x,goal.y,true,9,m)&&Math.hypot(goal.x-m.x,goal.y-m.y)>15){m.objective='Lùi giữ cự ly, chờ chiêu';M.navigate(m,goal.x,goal.y,dt);return true;}
  }
  if(dist>range){
   const lead=Math.min(.45,dist/Math.max(1,M.getMoveSpeed(m)));
   const flank=(m.defId.length%2?1:-1)*Math.min(30,dist*.12);
   m.objective='Bọc sườn, cắt đường rút';M.navigate(m,t.x+(t.vx||0)*lead-Math.sin(angle)*flank,t.y+(t.vy||0)*lead+Math.cos(angle)*flank,dt);
  }else{
   // Recover at a different angle instead of idling until the next cooldown.
   m.objective='Đổi góc giao tranh';M.navigate(m,t.x-Math.cos(angle+.35)*range*.8,t.y-Math.sin(angle+.35)*range*.8,dt);
  }
  return true;
 }
};
