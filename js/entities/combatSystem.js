window.GameEntities = window.GameEntities || {};

window.GameEntities.CombatSystem = {
  pendingEffects: [],
  schedule(source,delay,resolve){this.pendingEffects.push({source,delay,resolve});},
  tickEffects(dt){this.tickFields(dt);const pending=this.pendingEffects;this.pendingEffects=[];for(const effect of pending){effect.delay-=dt;if(!effect.source.isAlive)continue;if(effect.delay<=0)effect.resolve();else this.pendingEffects.push(effect);}},

  fields:[],fieldClock:0,
  field(e,c,x,y,options={}){
    const f={owner:e,x,y,radius:c.radius||55,shape:c.shape||'circle',angle:c.angle||0,length:c.range||120,delay:0,life:2,tick:.5,next:0,damage:0,color:c.element==='fire'?'#ff984d':c.element==='ice'?'#85e5ff':'#ad91ec',...options};
    this.fields.push(f);return f;
  },
  fieldContains(f,x,y){
    const dx=x-f.x,dy=y-f.y,d=Math.hypot(dx,dy),along=Math.cos(f.angle)*dx+Math.sin(f.angle)*dy,across=Math.abs(-Math.sin(f.angle)*dx+Math.cos(f.angle)*dy);
    return f.shape==='line'?along>=0&&along<=f.length&&across<f.radius:f.shape==='cone'?d<f.radius&&Math.cos(Math.atan2(dy,dx)-f.angle)>.72:d<f.radius&&(!f.innerRadius||d>f.innerRadius);
  },
  tickFields(dt){
    this.fieldClock+=dt;
    for(const f of this.fields){
      f.life-=dt;f.delay-=dt;f.next-=dt;
      if(!f.owner.isAlive||f.life<=0||f.delay>0||f.next>0||f.smoke)continue;
      f.next=f.tick;
      if(f.target&&(!f.target.isAlive||Math.hypot(f.owner.x-f.target.x,f.owner.y-f.target.y)>240||!window.GameEngine.MapTerrain.segmentClear(f.owner.x,f.owner.y,f.target.x,f.target.y,false,0))) {f.life=0;continue;}
      const targets=window.GameManager.spatialGrid.queryCircle(f.x,f.y,f.shape==='line'?f.length+f.radius:f.radius);
      for(const e of targets){
        if(!e.isAlive||!this.fieldContains(f,e.x,e.y))continue;
        if(f.heal){if(e===f.owner||e===f.owner.allyPawn)e.currentHp=Math.min(e.maxHp,e.currentHp+f.heal*f.tick);continue;}
        if(!this.isEnemy(f.owner,e))continue;
        const dealt=this.applyDamage(f.owner,e,null,{baseDamage:f.damage,skill:true,magic:f.magic,sourceSkill:f.sourceSkill,dot:'field'});
        if(!dealt||!e.isAlive)continue;
        if(f.pull&&!window.GameEntities.RelicSystem.knockbackImmune(e)){const a=Math.atan2(f.y-e.y,f.x-e.x);window.GameEngine.MapTerrain.moveEntity(e,Math.cos(a)*f.pull,Math.sin(a)*f.pull);}
        if(f.slow){e.slowTimer=Math.max(e.slowTimer||0,.6);e.slowPct=f.slow;}
        if(f.armorBreak){e.armorBreak=f.armorBreak;e.armorBreakTimer=1;}
        if(f.spore){e.sporeExposure=(e.sporeExposure||0)+f.tick;if(e.sporeExposure>=1.4){f.stun=.5;e.sporeExposure=0;}}
        if(f.stun&&!(e.controlImmunityTimer>0)&&!e.ccImmune){e.stunTimer=window.GameEntities.RelicSystem.control(e,'stunTimer',f.stun,f.owner);e.controlImmunityTimer=3;}
        if(f.leech)f.owner.currentHp=Math.min(f.owner.maxHp,f.owner.currentHp+dealt*f.leech);
      }
    }
    this.fields=this.fields.filter(f=>f.life>0&&f.owner.isAlive);
  },
  avoidFields(p,dt){
    const M=window.GameEngine.MapTerrain,A=window.GameAI.AIBrain,C=this;
    const danger=this.fields.find(f=>!f.heal&&!f.smoke&&f.damage>0&&f.life>0&&f.delay<.8&&C.isEnemy(f.owner,p)&&C.fieldContains({...f,radius:f.radius+12},p.x,p.y));
    if(!danger){p.fieldEscape=null;return false;}
    if(p.fieldEscape?.field!==danger){
      const points=Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return{x:p.x+Math.cos(a)*110,y:p.y+Math.sin(a)*110};});
      const goal=points.filter(g=>M.canStand(g.x,g.y)&&M.canTravel(p,g.x,g.y)&&!M.isInWater(g.x,g.y)&&M.segmentClear(p.x,p.y,g.x,g.y,false,9,p)&&!C.fieldContains(danger,g.x,g.y)).sort((a,b)=>Math.hypot(a.x-danger.owner.x,a.y-danger.owner.y)-Math.hypot(b.x-danger.owner.x,b.y-danger.owner.y))[0];
      if(!goal)return false;p.fieldEscape={field:danger,goal};
    }
    p.objective='Né vùng kỹ năng rồi phản công';A.moveToTarget(p,p.fieldEscape.goal.x,p.fieldEscape.goal.y,dt);return true;
  },
  renderFields(ctx){
    for(const f of this.fields){ctx.save();ctx.globalAlpha=f.delay>0?.25:.18;ctx.fillStyle=f.smoke?'#8c8c9b':f.color;ctx.strokeStyle=f.color;ctx.lineWidth=2;
      ctx.translate(f.x,f.y);ctx.rotate(f.angle);ctx.beginPath();
      if(f.shape==='line')ctx.rect(0,-f.radius,f.length,f.radius*2);else if(f.shape==='cone'){ctx.moveTo(0,0);ctx.arc(0,0,f.radius,-.75,.75);ctx.closePath();}else ctx.arc(0,0,f.radius,0,Math.PI*2);
      ctx.fill();ctx.globalAlpha=.85;ctx.setLineDash(f.delay>0?[7,5]:[]);ctx.stroke();ctx.restore();
    }
  },
  potion: { id: 'health_potion', name: 'Bình Hồi Máu', tier: 'common', healPct: 0.35 },
  styles: {
    unarmed: { windup: 0.16, active: 0.09, recovery: 0.23 },
    sword: { windup: 0.22, active: 0.12, recovery: 0.28 },
    axe: { windup: 0.38, active: 0.14, recovery: 0.4 },
    hammer: { windup: 0.4, active: 0.14, recovery: 0.42 },
    spear: { windup: 0.22, active: 0.09, recovery: 0.25 },
    dagger: { windup: 0.14, active: 0.08, recovery: 0.22 },
    bow: { windup: 0.42, active: 0.07, recovery: 0.28 },
    crossbow: { windup: 0.28, active: 0.07, recovery: 0.36 },
    staff: { windup: 0.36, active: 0.12, recovery: 0.3 },
    tome: { windup: 0.4, active: 0.12, recovery: 0.32 }
  },

  makePassive(d) {
    if(typeof d==='string') d={name:d.split(' (')[0]};
    const type = d.reflectPercent ? 'reflect' : d.poisonDotPercent ? 'poison' : d.burnField ? 'burn' : d.ambushBonus ? 'ambush' : d.slowPercent ? 'slow' : d.lifeSteal || d.lowHpLifeStealBuff ? 'leech' : d.rootInterval ? 'root' : d.flatDamageReduction ? 'shell' : d.idleRegenPercent ? 'heal' : 'guard';
    const desc={reflect:'Phản 10% sát thương cận chiến (tối đa 8), hồi chiêu 8s.',poison:'Đòn trúng gây thêm 6 sát thương độc, hồi chiêu 8s.',burn:'Phản 6 sát thương lửa khi bị đánh cận chiến, hồi chiêu 8s.',ambush:'Đòn trúng tăng 20% sát thương khi xuất kích từ bụi, hồi chiêu 8s.',slow:'Đòn trúng làm chậm 15% trong 1s, hồi chiêu 8s.',leech:'Đòn trúng hút lại 15% sát thương thành máu, hồi chiêu 8s.',root:'Đòn trúng trói 0.4s, có miễn khống chế 3s, hồi chiêu 8s.',shell:'Giảm thêm tối đa 8 sát thương khi bị đánh, hồi chiêu 8s.',heal:'Khi bị đánh: hồi 4% máu trong 3s, hồi chiêu 12s.',guard:'Khi bị đánh: dựng thế phòng thủ chính diện 0.6s, hồi chiêu 12s.'}[type];
    return {...d,type,desc,cooldownTimer:0,cooldown:['heal','guard'].includes(type)?12:8};
  },
  passiveList(e){return [...(e.passives||[]),...(e.copiedPassives||[])];},
  triggerPassives(e,other,damage,incoming,c={}) {
    const multiplier=e.passiveMultiplier||1;
    for(const p of this.passiveList(e)){
      if(p.cooldownTimer>0)continue;
      if(incoming && ['reflect','burn'].includes(p.type)){
        if(Math.hypot(e.x-other.x,e.y-other.y)>65 || c.reflected)continue;
        p.cooldownTimer=p.cooldown;
        this.applyDamage(e,other,null,{baseDamage:(p.type==='burn'?6:Math.min(8,damage*.1))*multiplier,reflected:true});
      } else if(incoming && p.type==='heal'){
        p.cooldownTimer=p.cooldown;e.healTimer=3;e.healPerSecond=Math.min((e.original?.maxHp||e.ancientOwner?.original?.maxHp||e.maxHp)*.04/3*multiplier,e.isAncient||e.isAncientClone?this.combatStats(e).attack*.3:Infinity);
        window.GameRenderer.VfxManager.addEffect('heal',e.x,e.y,{radius:28,color:'#9fe6af',life:.7});
      } else if(incoming && p.type==='guard'){
        p.cooldownTimer=p.cooldown;e.guardBudget=undefined;e.guardTimer=.6*multiplier;e.guardAngle=undefined;e.aimAngle=Math.atan2(other.y-e.y,other.x-e.x);
      } else if(!incoming && !c.reflected && ['poison','slow','root','leech'].includes(p.type)){
        p.cooldownTimer=p.cooldown;
        if(p.type==='poison')this.applyDamage(e,other,null,{baseDamage:6*multiplier,reflected:true,dot:'poison'});
        if(p.type==='leech')e.currentHp=Math.min(e.maxHp,e.currentHp+damage*.15*multiplier);
        if(p.type==='slow'&&!other.ccImmune){other.slowPct=.15*multiplier;other.slowTimer=multiplier;}
        if(p.type==='root' && !other.ccImmune && !(other.controlImmunityTimer>0)){other.stunTimer=.4*multiplier;other.controlImmunityTimer=3;}
      }
    }
  },

 visionRange(e){return e.isMonster?(e.tier>=4?300:220):230+(e.personality?.curiosity||50);},
 canSee(observer,target,ignoreConcealment=false){
  if(!target?.isAlive||observer===target)return false;
  const M=window.GameEngine.MapTerrain,d=Math.hypot(target.x-observer.x,target.y-observer.y);
  if(d>this.visionRange(observer)||!M.segmentClear(observer.x,observer.y,target.x,target.y,false,0))return false;
  if(ignoreConcealment)return true;
  if(d>35&&this.fields.some(f=>f.smoke&&f.life>0&&[.2,.4,.6,.8,1].some(k=>this.fieldContains(f,observer.x+(target.x-observer.x)*k,observer.y+(target.y-observer.y)*k))))return false;
   if(target.isHiding&&!this.canHideInBush(target))target.isHiding=false;
   if(target.stealthTimer>0&&d>32)return false;
  return !(target.isHiding&&M.isInBush(target.x,target.y)&&d>55);
 },
 canHideInBush(p){
   if(p.action||p.combatLease>0||!window.GameEngine.MapTerrain.isInBush(p.x,p.y))return false;
   return ![...(window.GameManager?.pawns||[]),...(window.GameManager?.monsters||[])].some(e=>e.isAlive&&this.isEnemy(e,p)&&this.canSee(e,p,true));
 },
 canDissolveAlliance(p){
   const q=p.allyPawn;if(!q?.isAlive)return true;
   if([p,q].some(e=>this.groupMembers(e).length===4&&e.combatLease>0))return false;
   const nearby=new Set([...this.crowdAt(p,p.x,p.y),...this.crowdAt(q,q.x,q.y)]);
   return ![...nearby].some(e=>{const members=this.crowdAt(e,e.x,e.y);return members.size===4&&(members.has(p)||members.has(q));});
 },
 validMembers(members){
  return members.size<=3||members.size===4&&[...members].every(p=>p.isPawn&&p.allyPawn!==p&&p.allyPawn?.isAlive&&members.has(p.allyPawn)&&p.allyPawn.allyPawn===p);
 },
 crowdAt(e,x,y){
  const pawns=window.GameManager?.pawns||[];
  return new Set([e,...pawns.filter(p=>p!==e&&p.isAlive&&Math.hypot(p.x-x,p.y-y)<75)]);
 },
 canApproach(e,target){
  if(!this.canJoin(e,target))return false;
  return this.validMembers(this.crowdAt(e,target.x,target.y));
 },
 groupMembers(e){
  const members=new Set([e]),G=window.GameManager,M=window.GameEngine.MapTerrain;
  const addGroup=g=>{
    if(!g)return;
    for(const p of g.members){
      if(!p.isAlive || !(p.combatLease>0)){g.members.delete(p);if(p.combatGroup===g)p.combatGroup=null;}
      else members.add(p);
    }
  };
  addGroup(e.combatGroup);
  // Connected nearby encounters are one battle, including chains of separate pairs.
  const active=[...(G?.pawns||[]),...(G?.monsters||[])].filter(p=>p.isAlive&&(p.combatLease>0||p.action?.target));
  for(const origin of members){
    for(const p of active)if(Math.hypot(p.x-origin.x,p.y-origin.y)<120){addGroup(p.combatGroup);members.add(p);}
    const ally=origin.allyPawn;
    if(ally?.isAlive&&ally.allyPawn===origin&&Math.hypot(origin.x-ally.x,origin.y-ally.y)<240&&!M.isInWater(ally.x,ally.y))members.add(ally);
    if(members.size>4)break;
  }
  for(const p of [...members]){
    const ally=p.allyPawn;
    if(ally?.isAlive&&ally.allyPawn===p&&Math.hypot(p.x-ally.x,p.y-ally.y)<240&&!M.isInWater(ally.x,ally.y))members.add(ally);
  }
  return [...members];
 },
 canJoin(a,t){
  const general=a.isMonster&&a.tier===3?a:t.isMonster&&t.tier===3?t:null;
  const pawn=a.isPawn?a:t.isPawn?t:null;
  if(general&&pawn&&(window.GameManager?.monsters||[]).some(m=>m!==general&&m.isAlive&&m.tier===3&&((m.combatLease>0&&m.focusPawn===pawn)||m.action?.target===pawn)))return false;
  const members=new Set([...this.groupMembers(a),...this.groupMembers(t),a,t]);
  return this.validMembers(members);
 },
 reserveCombat(a,t){
  if(!this.canJoin(a,t))return false;
  const members=new Set([...this.groupMembers(a),...this.groupMembers(t),a,t]),g={members};
  for(const p of members){p.combatGroup=g;if(!(p.combatLease>0))p.combatLease=6;}
  a.combatLease=t.combatLease=6;
  if(window.GameManager.finalShowdown&&a.isPawn&&t.isPawn){
    if(!a.finalDuel?.isAlive)a.finalDuel=t;
    if(!t.finalDuel?.isAlive&&(a.level||1)-(t.level||1)<2&&(t.personality?.cowardice||0)<85)t.finalDuel=a;
  }
  if(a.isMonster&&a.tier===3&&t.isPawn)a.focusPawn=t;
  if(t.isMonster&&t.tier===3&&a.isPawn)t.focusPawn=a;
  return true;
 },
 canEngage(a,t){
  const M=window.GameEngine.MapTerrain;
  return this.isEnemy(a,t) && M.templeAccess(a,t.x,t.y) && M.templeAccess(t,a.x,a.y) && (!a.isMonster || M.monsterCanTarget(a,t)) && !M.isInWater(a.x,a.y) && !M.isInWater(t.x,t.y) && this.canJoin(a,t) && M.segmentClear(a.x,a.y,t.x,t.y,false,0);
 },
 grantLevel(p){
  p.currentExp=Math.max(p.currentExp,window.GameData.LevelTable.expForLevel(p.level+1));
  this.checkLevelUp(p);return true;
 },
 rewardBotKill(killer,victim){
  if(!killer?.isPawn || killer.isPlayerControlled || !victim.isPawn)return false;
  const D=window.GameData.Equipments,tiers=['common','rare','super_rare','supreme','god'];
  const carried=victim.weapon||victim.armor||victim.helmet;
  const rank=Math.max(0,tiers.indexOf(carried?.tier||'common'));
  let item=carried;
  if(!item || Math.random()<.25){
   const tier=tiers[Math.min(4,rank+ (item?1:Math.random()<.25?1:0))];
   const pool=[...Object.values(D.weapons),...Object.values(D.armors)].filter(e=>e.tier===tier);
   item=pool[Math.floor(Math.random()*pool.length)];
  }
  if(item)window.GameManager.spawnDropItem(victim.x,victim.y,{...item},item.slot||'weapon');
  return true;
 },
 combatStats(e){
  const scale=e.statMultiplier||1,R=window.GameEntities.RelicSystem,gear=R.equipment(e),weapon=e.weapon?.attack||e.weapon?.magicPower||0;
  let attack=(e.attack||16)+(e.weapon?.tier==='ancient'?weapon:Math.min(65,weapon))+[e.armor,e.helmet,e.boots].reduce((v,d)=>v+(d?.attack||0),0);
  const steal=e.relicState?.voidblade;
  if(R.has(e,'voidblade')&&steal?.timer>0&&steal.target?.isAlive){const t=steal.target;attack+=steal.stacks*.02*((t.defense||0)*2+R.equipment(t).reduce((v,d)=>v+(d.defense||0)+(d.magicDefense||0),0));}
  const defense=(e.defense||0)+gear.reduce((v,d)=>v+(d.defense||0),0),debuff=e.relicState?.voidArmor;
  const modifier=(e.armorBreakTimer>0?1-(e.armorBreak||0):1)*(debuff?.timer>0?1-debuff.stacks*.02:1);
  return {attack:attack*scale,defense:defense*scale*modifier,magicDefense:(defense+gear.reduce((v,d)=>v+(d.magicDefense||0),0))*scale*modifier,range:e.weapon?.range||(['bow','crossbow','staff','tome'].includes(this.weaponStyle(e))?130:e.isAncient?150:e.tier>=4?75:38),speed:window.GameEngine.MapTerrain.getMoveSpeed(e)};
 },

  canAttack(e) {
    return !!e?.isAlive && !e.action && !e.isSplit && !(e.stunTimer > 0) && !(e.pacifyTimer > 0) && !(e.stasisTimer>0) && !(e.relicInterrupt>0) &&
      !window.GameEngine.MapTerrain.isInWater(e.x, e.y);
  },
  isEnemy(a, t) {
    return !!t?.isAlive && !t.isSplit && !a?.isSplit && !(a?.isMonster && t.isMonster) && t !== a && t !== a?.allyPawn && t.allyPawn !== a && (t.isPawn || t.isMonster);
  },
  weaponStyle(e) {
    if (e.weapon) return e.weapon.type==='hybrid_cane'?'staff':this.styles[e.weapon.type] ? e.weapon.type : 'sword';
    if (!e.isMonster) return 'unarmed';
    if(window.GameData.LowMonsterTactics?.[e.defId])return window.GameData.LowMonsterTactics[e.defId][2];
    if (['golem', 'titan_ape', 'demon_lord','primordial_colossus'].includes(e.visual?.type)) return 'hammer';
    if (['centaur','naga'].includes(e.visual?.type)) return 'spear';
    if(['undead_mage','floating_wraith'].includes(e.visual?.type))return 'staff';
    return e.tier >= 4 ? 'staff' : 'unarmed';
  },
  startAction(e, kind, target, resolve, options = {}) {
    if (e.action || !e.isAlive) return false;
    if (target && ['attack','skill'].includes(kind) && (!this.canEngage(e,target)||!this.reserveCombat(e,target))) return false;
    if(target&&['attack','skill'].includes(kind)){e.isHiding=false;e.stealthTimer=0;}
    const style = options.style || this.weaponStyle(e), timing = this.styles[style];
    const windup = options.windup ?? timing.windup;
    const duration = windup + (options.active ?? timing.active) + (options.recovery ?? timing.recovery);
    const angle = target ? Math.atan2(target.y - e.y, target.x - e.x) : e.aimAngle || 0;
    e.actionSerial=(e.actionSerial||0)+1;
    e.action = { id:e.actionSerial,kind, style, elapsed: 0, windup, duration, angle, target,
      targetX: target?.x ?? e.x, targetY: target?.y ?? e.y, originX: e.x, originY: e.y,
      released: false, resolve, ...options };
    window.GameEngine.Audio?.play(kind==='skill'?'cast':kind==='attack'?'attack':kind,e,style);
    e.aimAngle = angle;
    e.attackState = { isAttacking: true, progress: 0 };
    e.vx = e.vy = 0;
    return true;
  },
  executeAttack(a, target) {
    if (!this.canAttack(a) || a.attackCooldown > 0 || !this.isEnemy(a, target)) return false;
    if(a.isAncient&&a.ancientKind==='chaos'){
      const i=a.weaponCycle=(a.weaponCycle||0)+1;
      a.weapon={type:['sword','spear','hammer','bow'][i%4],range:[55,100,65,230][i%4],armorPierce:i%4===1?.35:0,onHitStun:i%4===2?.3:0,speed:1};
    }
    const low=a.isMonster?window.GameData.LowMonsterTactics?.[a.defId]:null;
    const style = low?.[2]||this.weaponStyle(a), ranged = ['bow', 'crossbow', 'staff', 'tome'].includes(style);
    const range = this.combatStats(a).range;
    if (Math.hypot(target.x - a.x, target.y - a.y) > range + 8) return false;
    const weapon=a.weapon?{...a.weapon}:null,snapshot={baseDamage:this.combatStats(a).attack,actionId:(a.actionSerial||0)+1};
    const ok = this.startAction(a, 'attack', target, () => {
      if (!this.isEnemy(a, target)) return;
      if (ranged) this.launchProjectile(a, target, weapon, {...snapshot,magic:weapon?.effect==='tome'}, ['staff', 'tome'].includes(style) ? '#bba3ff' : '#ffde9a');
      else if (Math.hypot(target.x - a.x, target.y - a.y) <= range + 18) {
        this.applyDamage(a, target, weapon,snapshot);
        window.GameRenderer.VfxManager.addEffect('slash', a.x, a.y, { angle: a.aimAngle, radius: range, color: a.weapon?.color||'#ffe9b1', life: 0.25 });
      }
    }, { style,...(low?{windup:low[0],recovery:low[1]}:{}) });
    if (ok) a.attackCooldown = Math.max(a.isAncient?.25:0.7, 1 / ((a.weapon?.speed || 0.9) * (a.isBerserk ? 1.25 : 1)*(a.isAncient&&a.ancientKind==='colossus'&&a.phase===2?1.5:1)*(a.attackSpeedMultiplier||1)*(a.relicState?.tomeSlow?.timer>0?1-a.relicState.tomeSlow.stacks*.15:1)));
    return ok;
  },
  getSkillConfig(e, skill) {
    if(skill.def.type==='ancient_skill')return window.GameEntities.AncientSystem.config(e,skill);
    const d = skill.def;
    const c = { ...d, ...d.t1, ...(skill.tier >= 2 ? d.t2 : {}), ...(skill.tier >= 3 ? d.t3 : {}) };
    const power=this.combatStats(e).attack;
    const tactic=window.GameData.MonsterTactics?.[skill.id];
    if(tactic){c.monsterEffect=tactic[0];c.desc=window.GameData.MonsterTacticDescriptions[c.monsterEffect];c.damageScale=tactic[1];c.pulses=0;c.monsterPulses=tactic[2];c.windup=tactic[3];c.shape=['line','beam','charge','fissure'].includes(c.monsterEffect)?'line':['cone','fan','flurry'].includes(c.monsterEffect)?'cone':'circle';}
    c.cooldown = Math.max(e.isMonster ? 7 : 6, c.cooldown || 10);
    c.cooldown*=1-window.GameEntities.RelicSystem.equipment(e).reduce((v,d)=>v+(d.cooldownReduction||0),0);
    c.damage = c.damageScale?power*c.damageScale:Math.min(power * 2.1, c.baseDamage || c.magicDamage || c.nukeDamage || power * (c.dmgMultiplier || c.dmgPct || 1.3));
    c.radius = Math.min(100, c.radius || 50);
    c.range = Math.min(240, Math.max(c.range || 100, c.radius));
    c.stun = Math.min(e.isMonster ? 0.7 : 0.9, c.stunDur || c.freezeDuration || 0);
    c.slow = Math.min(0.45, c.slowPct || c.slow || 0);
    return c;
  },
  makeMonsterSkill(d, tier, index) {
    const type = d.type || '';
    const shape = /line|breath|beam|pierce|crack|charge/.test(type) ? 'line' : /fan|sweep|wave|gale|roar/.test(type) ? 'cone' : 'circle';
    const element = /fire|flam|solar|magma|heat|meteor|nuke/.test(type) ? 'fire' : /poison|acid|root|thorn|spore/.test(type) ? 'nature' : /freeze|ice|storm/.test(type) ? 'ice' : /void|dark|death|soul|ghost|judgment/.test(type) ? 'void' : 'earth';
    return { id: d.id, tier: 1, cooldownTimer: 2 + index * 1.4, def: {
      ...d, monsterEffect:type,type: 'monster_skill', cooldown: Math.max(tier === 5 ? 11 + index * 2 : 7, d.cooldown || 11 + index * 2),
      element, shape, range: Math.min(220, d.length || d.lineDistance || 165), radius: Math.min(95, d.radius || 65),
      t1: { stunDur: Math.min(0.7, d.stunDuration || d.rootDuration || d.lockDuration || d.duration || 0),
        slowPct: Math.min(0.4, d.slowPercent || 0), desc: 'Báo vùng nguy hiểm trước khi ra đòn.' }
    }};
  },
  castSkill(e, skill, target) {
    if (!this.canAttack(e) || !skill?.def || skill.cooldownTimer > 0 || (e.globalSkillCooldown>0) || e.silenceTimer > 0) return false;
    if(skill.def.type==='ancient_skill')return window.GameEntities.AncientSystem.cast(e,skill,target);
    const owner=e.ancientOwner||e;if(owner.globalSkillCooldown>0&&e.isAncientClone)return false;
    const c = this.getSkillConfig(e, skill), type = c.type;
    const utility = ['teleport', 'speed_buff', 'ethereal_speed', 'stealth', 'smoke_cloud', 'weapon_swap', 'weapon_buff', 'self_heal', 'aura_heal', 'shield_stance', 'counter_stance', 'mana_shield_toggle', 'stasis'].includes(type);
    if (!utility && (!this.isEnemy(e, target) || Math.hypot(target.x - e.x, target.y - e.y) > c.range)) return false;
    if (['self_heal', 'aura_heal'].includes(type) && e.currentHp >= e.maxHp * 0.85) return false;
    if (type === 'weapon_swap' && !e.secondaryWeapon) return false;
    const mana = (c.manaCost || 0) + (c.extraManaPct || 0) * e.maxMana;
    const stamina = (c.staminaCost || 0) + (c.extraStaminaPct || 0) * e.maxStamina;
    if (e.currentMana < mana || e.currentStamina < stamina) return false;
    const element = c.element || (/fire|meteor/.test(skill.id) ? 'fire' : /frost|ice/.test(skill.id) ? 'ice' : e.classId === 'mage' ? 'void' : 'steel');
    const color = { fire: '#ff9b48', ice: '#8be6ff', nature: '#a9e76c', void: '#bd9cff', earth: '#ebc892', steel: '#ffe4a3' }[element];
    const area = /aoe|slam|barrage|whirlwind|vortex|nuke|monster_skill/.test(type);
    const projectile = /projectile|arrows|snipe|bolt/.test(type);
    const angle = target ? Math.atan2(target.y - e.y, target.x - e.x) : e.aimAngle || 0;
    const tx = target?.x ?? e.x, ty = target?.y ?? e.y;
    Object.assign(c,{originX:e.x,originY:e.y,tx,ty,angle,weaponSnapshot:e.weapon?{...e.weapon}:null,attackSnapshot:this.combatStats(e).attack,castId:(e.skillsCast||0)+1});
    const windup = c.windup ?? (utility ? 0.28 : e.isMonster ? 0.85 : projectile ? 0.45 : 0.38);
    const ok = this.startAction(e, 'skill', utility ? null : target, () => this.resolveSkill(e,skill,target,c), { style: this.weaponStyle(e), windup, recovery: /finisher|execution|nuke/.test(type)||c.monsterEffect==='leap'?.7:.35, color, skillId:skill.id,skillName: c.name });
    if (!ok) return false;
    if(type==='dash_stun'){e.guardTimer=windup;e.guardReduction=.35;e.guardAngle=angle;}
    e.currentMana -= mana; e.currentStamina -= stamina;
    skill.cooldownTimer = c.cooldown; if(e.isMonster){e.globalSkillCooldown=e.isAncientClone?1:e.tier===5?2:3;if(e.isAncientClone)owner.globalSkillCooldown=1;} e.attackCooldown = windup + 0.35;
    if(!e.isMonster)e.globalSkillCooldown=1.8;
    e.skillsCast = (e.skillsCast || 0) + 1;
    if (!utility && area) window.GameRenderer.VfxManager.addEffect('telegraph', ['line','cone'].includes(c.shape) ? e.x : tx, ['line','cone'].includes(c.shape) ? e.y : ty, { radius: c.radius, angle, shape: c.shape || 'circle', length: c.range, color, life: windup, label: c.name });
    else window.GameRenderer.VfxManager.addEffect('rune', e.x, e.y, { radius: 24, color, life: windup });
    return true;
  },
  resolveSkill(e,skill,target,c=this.getSkillConfig(e,skill)){
    if(!c.isPulse)window.GameEntities.RelicSystem.onCast(e,skill,c.castId);
    if(c.pulses>1){
      const count=c.pulses;
      for(let i=0;i<count;i++){const pulse=()=>this.resolveSkill(e,skill,target,{...c,isPulse:true,pulses:0,damage:c.damage/count,useCurrentOrigin:c.type==='whirlwind_aoe'});if(i===0)pulse();else this.schedule(e,i*(c.type==='burst_arrows'?.18:.35),pulse);}
      return;
    }
    if(!c.isPulse)window.GameEngine.Audio?.play(c.role==='heal'?'heal':c.element||'cast',e);
    const type=c.type,originX=c.useCurrentOrigin?e.x:c.originX??e.action?.originX??e.x,originY=c.useCurrentOrigin?e.y:c.originY??e.action?.originY??e.y;
    const utility = ['teleport', 'speed_buff', 'ethereal_speed', 'stealth', 'smoke_cloud', 'weapon_swap', 'weapon_buff', 'self_heal', 'aura_heal', 'shield_stance', 'counter_stance', 'mana_shield_toggle', 'stasis'].includes(type);
    const element = c.element || (/fire|meteor/.test(skill.id) ? 'fire' : /frost|ice/.test(skill.id) ? 'ice' : e.classId === 'mage' ? 'void' : 'steel');
    const color = { fire: '#ff9b48', ice: '#8be6ff', nature: '#a9e76c', void: '#bd9cff', earth: '#ebc892', steel: '#ffe4a3' }[element];
    const area = /aoe|slam|barrage|whirlwind|vortex|nuke|monster_skill/.test(type);
    const projectile = /projectile|arrows|snipe|bolt/.test(type);
    const angle = c.angle??(target ? Math.atan2(target.y - e.y, target.x - e.x) : e.aimAngle || 0);
    const tx = c.tx??target?.x??e.x, ty = c.ty??target?.y??e.y;
    const hit = victim => {
      if(type==='chaos_projectile'){c.breakGuard=victim.guardTimer>0||victim.action?.kind==='block';c.stun=victim.action?.kind==='skill'&&!victim.action.released?.25:0;}
      if(type==='melee_bleed_silence'&&!(victim.action?.kind==='skill'&&!victim.action.released))c.silenceDur=0;
      if(type==='teleport_backstab'){const flank=Math.cos(Math.atan2(e.y-victim.y,e.x-victim.x)-(victim.aimAngle||0))<0;c.flankBonus=flank?.18:0;}
      if(type==='whirlwind_aoe')c.knockback=8+skill.tier*2;

      const damage = this.applyDamage(e, victim, ('weaponSnapshot' in c?c.weaponSnapshot:e.weapon), { baseDamage: Math.min((c.attackSnapshot??this.combatStats(e).attack)*2.1,c.damage*(type==='projectile_explosion'?.85:1)*(1+(c.flankBonus||0))/(1+(c.dotFraction||0))*(victim.currentHp<victim.maxHp*.3?1+(c.executeBonus||0):1)), skill: true, magic:c.magic,armorPierce:c.armorPierce,element:c.element,explosion:c.type==='projectile_explosion',projectile,sourceSkill:{id:skill.id,def:skill.def,tier:skill.tier,castId:c.castId??e.skillsCast??0} });
      if (!damage) return;
      if(!victim.isAlive)return;
      if(c.armorBreak){victim.armorBreak=c.armorBreak;victim.armorBreakTimer=3;}
      if(c.dotFraction)for(let i=1;i<=2;i++)this.schedule(e,i,()=>{if(victim.isAlive)this.applyDamage(e,victim,null,{baseDamage:c.damage*c.dotFraction/(1+c.dotFraction)/2,dot:c.dotKind,reflected:true,magic:c.magic});});
      if (victim.invincible || victim.isBerserk || victim.ccImmune || victim.weapon?.ccImmunity) return;
      if(c.breakGuard){victim.guardTimer=0;if(victim.action?.kind==='block')victim.action=null;}
      if(c.conditionalFreeze&&victim.slowTimer>0&&!(victim.controlImmunityTimer>0)){victim.stunTimer=window.GameEntities.RelicSystem.control(victim,'stunTimer',c.conditionalFreeze,e);victim.controlImmunityTimer=3;}
      if((c.knockback||c.pull)&&!window.GameEntities.RelicSystem.knockbackImmune(victim)){const direction=c.pull?-1:1,a=Math.atan2(victim.y-e.y,victim.x-e.x),distance=c.knockback||c.pull;window.GameEngine.MapTerrain.moveEntity(victim,Math.cos(a)*distance*direction,Math.sin(a)*distance*direction);}
      if (c.stun && !(victim.controlImmunityTimer > 0)) { victim.stunTimer = window.GameEntities.RelicSystem.control(victim,'stunTimer',c.stun,e); victim.controlImmunityTimer = 3; }
      if (c.slow) { victim.slowPct = c.slow; victim.slowTimer = Math.min(2, c.slowDur || 2); }
      if (c.silenceDur) victim.silenceTimer = Math.min(1.5, c.silenceDur);
    };
      const V = window.GameRenderer.VfxManager;
      if (['teleport', 'teleport_backstab', 'backstep_shot', 'linear_dash', 'dash_stun'].includes(type)) {
        const distance = type === 'backstep_shot' ? -(c.backstep || 45) : Math.min(100, c.distance || c.range * 0.5);
        window.GameEngine.MapTerrain.moveEntity(e,Math.cos(angle)*distance,Math.sin(angle)*distance);
        V.addEffect('dash', originX, originY, { tx: e.x, ty: e.y, color, life: 0.45 });
        if(c.cleanseSlow)e.slowTimer=0;
        if(c.afterimage)this.schedule(e,.7,()=>{
          window.GameManager.spatialGrid.queryCircle(originX,originY,45).filter(v=>this.isEnemy(e,v)).forEach(v=>this.applyDamage(e,v,null,{baseDamage:this.combatStats(e).attack*.6,skill:true,magic:true}));
          V.addEffect('impact',originX,originY,{radius:45,color,life:.5});
        });
      }
      if (['self_heal', 'aura_heal'].includes(type)) {
        const healingHp=e.original?.maxHp||e.ancientOwner?.original?.maxHp||e.maxHp;
        e.healPerSecond = Math.min(healingHp * 0.04, c.hotPct?healingHp*c.hotPct/3:c.hotTick||0);
        e.healTimer = Math.min(4, c.duration || 3);
        if(type==='self_heal')e.healInterruptibleTimer=e.healTimer;
        if (type === 'self_heal') e.currentHp = Math.min(e.maxHp, e.currentHp + healingHp * Math.min(0.2, c.instantHealPct || c.lowHpHealPct || 0.15));
        if(type==='aura_heal'){e.healTimer=0;this.field(e,c,originX,originY,{radius:100,life:3,heal:healingHp*(c.hotPct||.06)/3,color:'#86efb5'});}
        V.addEffect('heal', e.x, e.y, { radius: 40, color: '#86efb5', life: 0.9 });
      } else if (['speed_buff', 'ethereal_speed', 'stealth', 'smoke_cloud'].includes(type)) {
        e.speedBuff = Math.min(0.5, c.speedBuff || 0.25);
        e.speedBuffTimer = Math.min(3.5, c.duration || c.stealthDur || 3);
        if (c.waterWalk) e.waterWalkTimer = e.speedBuffTimer;
        if (c.pacify) e.pacifyTimer = e.speedBuffTimer;
        if(type==='stealth')e.stealthTimer=e.speedBuffTimer;
        if(type==='smoke_cloud')this.field(e,c,e.x,e.y,{smoke:true,radius:65,life:c.duration||2});
        if(type==='ethereal_speed'&&skill.tier>=2)e.slowTimer=0;
        if(c.interrupt){const enemy=window.GameManager.spatialGrid.queryCircle(e.x,e.y,100).find(v=>this.isEnemy(e,v)&&!v.ccImmune&&v.action?.target===e&&!v.action.released);if(enemy){enemy.action=null;enemy.attackState=null;}}
        V.addEffect(type === 'smoke_cloud' ? 'smoke' : 'rune', e.x, e.y, { radius: 40, color, life: 0.8 });
      } else if (['weapon_buff', 'weapon_swap'].includes(type)) {
        if (type === 'weapon_swap') [e.weapon, e.secondaryWeapon] = [e.secondaryWeapon, e.weapon];
        if(skill.id==='h_armament_swap'){e.armamentDefense=!e.armamentDefense;e.guardTimer=e.armamentDefense?1.3:0;e.guardReduction=.35;}
        e.magicOnHit = skill.id==='h_armament_swap'?(e.armamentDefense?0:6):Math.min(18, c.magicOnHit || 8);
        e.enchantedCharges=skill.id==='h_enchanted_blade'?2+skill.tier:0;
        e.weaponBuffTimer = c.duration||4;
        if(c.guardReduction){e.guardTimer=.8;e.guardReduction=c.guardReduction;}
        V.addEffect('rune', e.x, e.y, { radius: 28, color, life: 0.6 });
      } else if (['shield_stance', 'counter_stance', 'mana_shield_toggle', 'stasis'].includes(type)) {
        if(type==='mana_shield_toggle'){e.manaShieldTimer=c.duration||2;e.manaAbsorb=c.manaAbsorb||.3;e.manaShieldBudget=e.maxHp*.18;}
        else {e.guardTimer=Math.min(1.6,c.duration||c.window||1.2);e.guardReduction=c.guardReduction||.5;e.guardAngle=e.aimAngle;e.guardBudget=e.maxHp*.22;}
        if(type==='counter_stance'){e.riposteTimer=c.window;e.counterMultiplier=c.counterMultiplier;e.riposteReady=true;}
        if(type==='stasis'){e.slowPct=.8;e.slowTimer=e.guardTimer;e.stasisTimer=e.guardTimer;}
        V.addEffect('guard', e.x, e.y, { radius: 28, color: '#8be6ff', life: 0.8 });
      } else if (!utility) {
        if(c.monsterEffect){this.resolveMonsterSkill(e,skill,target,c,hit,color);return;}
        if(type==='vortex_pull'){
          this.field(e,c,tx,ty,{life:2,damage:c.damage/4,pull:12,tick:.5,magic:true,sourceSkill:{id:skill.id,castId:c.castId}});return;
        }

        if (projectile && !area) this.launchProjectile(e, target, { type: element === 'fire' ? 'fireball' : projectile && e.classId==='archer' ? 'arrow' : 'magic' }, { baseDamage: c.damage, skill: true, onImpact: victim => {
          if (type === 'projectile_explosion') {
            window.GameManager.spatialGrid.queryCircle(victim.x,victim.y,c.radius).filter(v=>this.isEnemy(e,v)).forEach(hit);
            this.field(e,c,victim.x,victim.y,{life:1.5,damage:c.damage*.05,tick:.5,magic:true,color,sourceSkill:{id:skill.id,castId:c.castId}});
            V.addEffect(element==='fire'?'flame':'impact',victim.x,victim.y,{radius:c.radius,color,life:.6});
          } else hit(victim);
        } }, color);
        else {
          const directed = ['line', 'cone'].includes(c.shape) || type === 'cone_slash';
          const victims = window.GameManager.spatialGrid.queryCircle(directed || !area || c.selfArea || type==='whirlwind_aoe' ? e.x : tx, directed || !area || c.selfArea || type==='whirlwind_aoe' ? e.y : ty, directed || !area ? c.range : c.radius).filter(v => this.isEnemy(e, v));
          for (const v of victims) {
            const dx = v.x - originX, dy = v.y - originY;
            const delta = Math.atan2(Math.sin(Math.atan2(dy, dx) - angle), Math.cos(Math.atan2(dy, dx) - angle));
            if (c.shape === 'line' && (Math.abs(-Math.sin(angle) * dx + Math.cos(angle) * dy) > 25 || Math.cos(angle) * dx + Math.sin(angle) * dy < 0)) continue;
            if ((c.shape === 'cone' || type === 'cone_slash') && Math.abs(delta) > 0.75) continue;
            if(type==='ground_slam'&&Math.hypot(dx,dy)<18)continue;
            if (!area && !c.shape && v !== target) continue;
            hit(v);
          }
          V.addEffect(area ? element === 'fire' ? 'flame' : element === 'ice' ? 'frost' : 'impact' : 'slash', directed ? originX : tx, directed ? originY : ty, { radius: c.radius, angle, color, shape: c.shape, length:c.range, life: 0.7 });
        }
        if (element === 'fire') window.GameEngine.MapTerrain.bushes.forEach(b => { if (Math.hypot(b.x - tx, b.y - ty) < c.radius) b.isBurned = true; });
      }
  },

  resolveMonsterSkill(e,s,t,c,hit,color){
    const mode=c.monsterEffect,M=window.GameEngine.MapTerrain,G=window.GameManager,V=window.GameRenderer.VfxManager;
    const x=c.tx??t.x,y=c.ty??t.y,angle=c.angle??e.aimAngle,n=c.monsterPulses||3;
    const victims=(cx,cy,r)=>G.spatialGrid.queryCircle(cx,cy,r).filter(v=>this.isEnemy(e,v));
    const pulse=(cx,cy,shape='circle',ratio=1,extra={})=>this.field(e,{...c,shape},cx,cy,{life:.25,tick:10,damage:c.damage*ratio,color,magic:!['line','cone','ring','charge','flurry'].includes(mode),sourceSkill:{id:s.id,castId:c.castId},...extra});
    if(mode==='projectile'){this.launchProjectile(e,t,{type:mode,color},{onImpact:v=>hit(v)},color);return;}
    if(['leap','charge'].includes(mode)){
      M.moveEntity(e,Math.cos(angle)*Math.min(c.range,Math.hypot(x-e.x,y-e.y)),Math.sin(angle)*Math.min(c.range,Math.hypot(x-e.x,y-e.y)));
      pulse(mode==='charge'?c.originX:e.x,mode==='charge'?c.originY:e.y,mode==='charge'?'line':'circle',1,{radius:mode==='charge'?22:65,knockback:25});return;
    }
    if(mode==='mark'){if(Math.hypot(t.x-x,t.y-y)<c.radius){hit(t);t.deathMarkOwner=e;t.deathMarkTimer=5;V.addEffect('rune',t.x,t.y,{radius:24,color,life:2});}return;}
    if(mode==='judgment'){if(t.deathMarkTimer>0&&t.deathMarkOwner===e)c.damage*=1.25;pulse(x,y);t.deathMarkTimer=0;return;}
    if(['tether','leech'].includes(mode)){pulse(x,y,'circle',.25,{life:2,tick:.5,damage:c.damage/4,target:t,leech:mode==='leech'?.35:0,slow:.2});return;}
    if(mode==='cage'){
      // Two side rails leave both ends open; walls never form a sealed prison.
      for(const side of [-1,1]){const px=x+Math.cos(angle+Math.PI/2)*side*55,py=y+Math.sin(angle+Math.PI/2)*side*55;const wall={x:x+side*55-6,y:y-40,w:12,h:80};
        if(!G.pawns.some(p=>p.isAlive&&p.x>wall.x-12&&p.x<wall.x+wall.w+12&&p.y>wall.y-12&&p.y<wall.y+wall.h+12))this.field(e,{...c,shape:'line'},wall.x+6,wall.y,{wall,radius:6,length:80,angle:Math.PI/2,life:2,damage:c.damage/4,tick:.5,slow:.35,color});}
      return;
    }
    if(['pillars','chains','ghost','fan'].includes(mode)){
      for(let i=0;i<n;i++){
        const a=angle+(i-(n-1)/2)*.5,cx=mode==='fan'?e.x:x+Math.cos(i*Math.PI*2/n)*45,cy=mode==='fan'?e.y:y+Math.sin(i*Math.PI*2/n)*45;
        this.field(e,{...c,shape:mode==='fan'?'line':'circle'},cx,cy,{delay:i*.3,life:i*.3+.35,damage:c.damage/n,color,angle:a,radius:mode==='fan'?12:25,tick:10,slow:mode==='chains'?.3:0,sourceSkill:{id:s.id,castId:c.castId}});
      }return;
    }
    if(['beam','flurry','song'].includes(mode)){
      for(let i=0;i<n;i++)this.field(e,{...c,shape:mode==='beam'?'line':mode==='flurry'?'cone':'circle'},c.originX,c.originY,{delay:i*.35,life:i*.35+.3,damage:c.damage/n,tick:10,radius:mode==='beam'?18:c.radius,color,angle:angle+(mode==='beam'?(i-(n-1)/2)*.14:0),sourceSkill:{id:s.id,castId:c.castId}});return;
    }
    if(['acid','storm','vortex','sea','fissure','spores'].includes(mode)){
      pulse(x,y,mode==='fissure'?'line':'circle',.25,{life:2,tick:.5,damage:c.damage/4,armorBreak:mode==='acid'?.25:0,pull:mode==='vortex'?12:0,slow:['storm','spores'].includes(mode)?.25:0,spore:mode==='spores',innerRadius:mode==='sea'?28:0});return;
    }
    if(mode==='freeze'){pulse(x,y,'circle',1,{radius:70,stun:.6});return;}
    if(mode==='interrupt'){for(const v of victims(e.x,e.y,c.radius)){if(v.action?.kind==='skill'&&!v.action.released&&!v.ccImmune){v.action=null;v.silenceTimer=.5;}hit(v);}return;}
    if(mode==='ring'){pulse(e.x,e.y,'circle',1,{innerRadius:20});return;}
    pulse(['line','cone'].includes(mode)?c.originX:x,['line','cone'].includes(mode)?c.originY:y,['line','cone'].includes(mode)?mode:'circle',1,{radius:mode==='line'?20:c.radius});
  },
  launchProjectile(source, target, weapon, config, color) {
    if (!this.isEnemy(source, target)) return;
    window.GameRenderer.VfxManager.addProjectile(source, source.action?.targetX ?? target.x, source.action?.targetY ?? target.y, 330, { ...weapon, color }, (x, y) => {
      if (!target.isAlive) return true;
      if (Math.hypot(x - target.x, y - target.y) < 22) {
        if (config.onImpact) config.onImpact(target);
        else this.applyDamage(source,target,weapon,{...config,projectile:true});
        window.GameRenderer.VfxManager.addEffect('impact', x, y, { radius: 24, color, life: 0.3 });
        return true;
      }
      return false;
    });
  },
  defend(e, kind = 'block', angle = e.aimAngle || 0) {
    if (!e?.isAlive || window.GameEngine.MapTerrain.isInWater(e.x,e.y) || e.action || e.stunTimer > 0 || e.defenseCooldown > 0 || e.currentStamina < (kind==='dodge'&&window.GameEntities.RelicSystem.has(e,'treads')?12.6:18) || kind==='dodge'&&e.dodgeLockedTimer>0) return false;
    const jet=kind==='dodge'&&window.GameEntities.RelicSystem.has(e,'treads');
    e.currentStamina -= jet?12.6:18; e.defenseCooldown = kind === 'dodge' ? 2.8 : 2.2; e.aimAngle = angle;
    const ok=this.startAction(e, kind, null, () => {}, { style: this.weaponStyle(e), angle, windup: 0, active: 0.3, recovery: 0.22,
      dodgeX: Math.cos(angle) * (jet?140:58), dodgeY: Math.sin(angle) * (jet?140:58) });
    if(ok&&jet)window.GameEntities.RelicSystem.onDodge(e);return ok;
  },
  tryReaction(e, threats) {
    if (e.action || e.defenseCooldown > 0 || e.currentStamina < 18) return false;
    const threat = threats.find(t => {
      const a=t.action;
      return a && !a.released && (a.target===e || (a.kind==='skill' && Math.hypot(e.x-a.targetX,e.y-a.targetY)<70)) && a.elapsed>a.windup*.35;
    });
    if(!threat)return false;
    const reactionToken=threat.id+':'+(threat.action.id||threat.action.elapsed);
    if(e.reactionToken===reactionToken)return false;e.reactionToken=reactionToken;
    if (Math.random() > (e.confidence > 85 ? .18 : .25+(e.personality?.caution||50)*.004+(window.GameEntities.RelicSystem.has(e,'treads')?.2:0))) return false;
    const angle = Math.atan2(threat.y - e.y, threat.x - e.x);
    const dodge = window.GameEntities.RelicSystem.has(e,'treads')||['archer', 'assassin'].includes(e.classId) || e.trait === 'coward';
    e.thought = dodge ? 'Thấy đối thủ lấy đà — né sang sườn!' : 'Đọc đòn, nâng vũ khí đỡ chính diện.';
    e.objective = dodge ? 'Né đòn' : 'Đỡ đòn';
    return this.defend(e, dodge ? 'dodge' : 'block', dodge ? angle + Math.PI / 2 : angle);
  },
  usePotion(e) {
    if (!e?.isAlive || window.GameEngine.MapTerrain.isInWater(e.x,e.y) || e.action || !e.healthPotions || e.potionCooldown > 0 || e.currentHp >= e.maxHp) return false;
    e.healthPotions--; e.potionCooldown = 8;
    return this.startAction(e, 'drink', null, () => {
      const hp = Math.min(220, e.maxHp * 0.35);
      e.currentHp = Math.min(e.maxHp, e.currentHp + hp);
      window.GameRenderer.VfxManager.addEffect('heal', e.x, e.y, { radius: 35, color: '#86efb5', life: 0.8 });
      window.GameRenderer.VfxManager.addDamageNumber(e.x, e.y - 20, '+' + Math.round(hp), 'heal');
    }, { windup: 0.65, active: 0.1, recovery: 0.15, style: 'unarmed' });
  },
  updateStatus(e, dt) {
    if(!e.isAlive)return;
    window.GameEntities.RelicSystem.update(e,dt);if(!e.isAlive)return;
    if(!e.isSplit){
      const engaged=e.targetEnemy?.isAlive&&this.canSee(e,e.targetEnemy);
      const combatTime=engaged?dt:Math.min(dt,Math.max(e.combatLease||0,e.action?.target?e.action.duration-e.action.elapsed:0));
      const rate=e.isMonster?e.maxHp*({3:.01,4:.03,5:.05}[e.tier]||0):0;
      e.currentHp=Math.min(e.maxHp,e.currentHp+combatTime+(dt-combatTime)*(rate||1));
    }
    if(e.isHiding&&!this.canHideInBush(e))e.isHiding=false;
    if(e.ccImmune)e.stunTimer=e.slowTimer=e.silenceTimer=e.panicTimer=0;
    for (const k of ['relicInterrupt','relicSlowTimer','riposteTimer','manaShieldTimer','panicTimer','auraSlowTimer','dodgeLockedTimer','armorBreakTimer','healInterruptibleTimer','stasisTimer','deathMarkTimer','globalSkillCooldown', 'combatLease', 'stunTimer', 'slowTimer', 'silenceTimer', 'speedBuffTimer', 'waterWalkTimer', 'pacifyTimer', 'weaponBuffTimer', 'stealthTimer', 'guardTimer', 'controlImmunityTimer', 'defenseCooldown', 'potionCooldown', 'attackCooldown', 'hitFlashTimer']) e[k] = Math.max(0, (e[k] || 0) - dt);
    for (const p of this.passiveList(e)) p.cooldownTimer=Math.max(0,(p.cooldownTimer||0)-dt);
    for (const s of e.skills || []) s.cooldownTimer = Math.max(0, (s.cooldownTimer || 0) - dt);
    if (e.healTimer > 0) { const time = Math.min(dt, e.healTimer); e.currentHp = Math.min(e.maxHp, e.currentHp + e.healPerSecond * time); e.healTimer -= time; }
    if(e.sporeExposure>0&&!this.fields.some(f=>f.spore&&this.fieldContains(f,e.x,e.y)))e.sporeExposure=Math.max(0,e.sporeExposure-dt);
    const a = e.action;
    if (!a) return;
    if (['attack','skill'].includes(a.kind)&&window.GameEngine.MapTerrain.isInWater(e.x,e.y)) {e.action=null;e.attackState=null;return;}
    if (e.stunTimer > 0 && !e.isBerserk) { e.action = null; e.attackState = null; return; }
    a.elapsed += dt; e.attackState.progress = Math.min(1, a.elapsed / a.duration);
    if (a.kind === 'dodge') {
      const p = Math.min(1, a.elapsed / 0.3), ease = 1 - (1 - p) ** 2;
      window.GameEngine.MapTerrain.moveEntity(e,a.originX+a.dodgeX*ease-e.x,a.originY+a.dodgeY*ease-e.y);
    }
    if (!a.released && a.elapsed >= a.windup) { a.released = true; a.resolve(); }
    if (a.elapsed >= a.duration) { e.action = null; e.attackState = null; }
  },
  applyDamage(a, t, weapon, c = {}) {
    if (!a || !this.canEngage(a,t) || t.invincible || t.relicInvulnerable>0 || !this.reserveCombat(a,t)) return 0;
    if (t.action?.kind === 'dodge' && t.action.elapsed < 0.3) {
      this.counterOpening(t,a);window.GameRenderer.VfxManager.addDamageNumber(t.x,t.y-15,'NÉ','block');return 0;
    }
    let raw=c.baseDamage??this.combatStats(a).attack;
    if (!c.trueDamage && a.weaponBuffTimer > 0&&!c.dot&&!c.reflected){raw+=a.magicOnHit||0;if(a.enchantedCharges>0&&(c.sourceSkill?.castId===undefined||a.lastChargedCast!==c.sourceSkill.castId)&&(a.lastChargedCast=c.sourceSkill?.castId,--a.enchantedCharges===0))a.weaponBuffTimer=0;}
    if (!c.trueDamage && a.currentHp < a.maxHp * 0.25) raw *= 1 + (window.GameData.Traits[a.trait]?.lowHpDamageBonus || 0);
    const crit = !c.trueDamage && Math.random() < Math.min(0.35, (a.critChance || 0.05) + (weapon?.critChance || 0));
    if (crit) raw *= 1.35;
    const ambush=this.passiveList(a).find(p=>p.type==='ambush'&&p.cooldownTimer<=0);
    if(!c.trueDamage&&ambush&&window.GameEngine.MapTerrain.isInBush(a.x,a.y)){raw*=1+.2*(a.passiveMultiplier||1);ambush.cooldownTimer=ambush.cooldown;}
    const armor=(c.magic?this.combatStats(t).magicDefense:this.combatStats(t).defense)*(1-Math.min(.6,c.armorPierce??weapon?.armorPierce??0));
    let damage=c.trueDamage?raw:raw*100/(100+armor);
    if(!c.trueDamage&&t.manaShieldTimer>0){const absorbed=Math.min(t.currentMana,t.manaShieldBudget??Infinity,damage*(t.manaAbsorb||.3));t.currentMana-=absorbed;t.manaShieldBudget=Math.max(0,(t.manaShieldBudget??Infinity)-absorbed);damage-=absorbed;}
    const M=window.GameEngine.MapTerrain;
    if(!c.trueDamage&&Math.hypot(a.x-t.x,a.y-t.y)>90 && M.isInBush(t.x,t.y))damage*=.85;
    if(!c.trueDamage&&M.isOnCliff(a.x,a.y)&&!M.isOnCliff(t.x,t.y))damage*=1.1;
    if (!c.trueDamage && (t.action?.kind === 'block' || t.guardTimer > 0)) {
      const incoming = Math.atan2(a.y - t.y, a.x - t.x);
      if (Math.cos(incoming - (t.action?.angle ?? (t.guardTimer>0?t.guardAngle??t.aimAngle:t.aimAngle))) > 0.25) {
        window.GameEngine.Audio?.play('block',t);
        damage *= 1-(t.action?.kind==='block'?.7:t.guardReduction??.7);this.counterOpening(t,a);
        if(t.guardBudget!==undefined){t.guardBudget-=raw-damage;if(t.guardBudget<=0)t.guardTimer=0;}
        if(t.riposteReady&&t.riposteTimer>0&&!c.reflected){t.riposteReady=false;this.applyDamage(t,a,null,{baseDamage:this.combatStats(t).attack*t.counterMultiplier,reflected:true});}
        window.GameRenderer.VfxManager.addEffect('guard', t.x, t.y, { angle: incoming, radius: 30, color: '#8be6ff', life: 0.3 });
        window.GameRenderer.VfxManager.addDamageNumber(t.x, t.y - 20, 'ĐỠ', 'block');
      }
    }
    const shell=this.passiveList(t).find(p=>p.type==='shell'&&p.cooldownTimer<=0);
    if(shell&&!c.trueDamage){damage-=Math.min(8,damage*.25)*(t.passiveMultiplier||1);shell.cooldownTimer=shell.cooldown;}
    damage=window.GameEntities.RelicSystem.modifyDamage(a,t,damage);
    damage=window.GameEntities.AncientSystem.incoming(a,t,Math.max(1,damage),c,weapon);
    damage=window.GameEntities.RelicSystem.incoming(a,t,damage,c);
    if(damage<=0)return 0;
    damage=Math.max(1,Math.round(damage));t.currentHp = Math.max(0, t.currentHp - damage);
    a.lastDamageTarget=t;a.lastDamageDealtAt=window.GameManager.matchTime||0;t.lastDamageTakenAt=window.GameManager.matchTime||0;
    window.GameEngine.Audio?.play('hit',t);
    t.hitFlashTimer = 0.13; t.stealthTimer = 0; a.stealthTimer = 0;t.isHiding=a.isHiding=false;
    if (a.isBerserk) a.currentHp = Math.min(a.maxHp, a.currentHp + damage * 0.15);
    window.GameRenderer.VfxManager.addDamageNumber(t.x, t.y, damage, crit ? 'crit' : 'normal');
    window.GameRenderer.VfxManager.addEffect('hit', t.x, t.y - 15, { angle: a.aimAngle || 0, radius: 15, color: crit ? '#ffb38d' : '#fff2d6', life: 0.2 });
    if (t.isPawn) {t.lastAttacker=a;t.grudgeUntil=(window.GameManager.matchTime||0)+18; window.GameAI.EmotionEngine.onDamageTaken(t, damage, a,c);}
    if(a.isPawn&&!c.reflected&&(c.sourceSkill?.castId===undefined||a.lastRecordedSkillCast!==c.sourceSkill.castId)){if(c.sourceSkill?.castId!==undefined)a.lastRecordedSkillCast=c.sourceSkill.castId;a.attackHistory=[...(a.attackHistory||[]).slice(-9),{kind:c.skill?'skill':'attack',targetId:t.id,damage,skill:c.sourceSkill,weapon:a.weapon?{...a.weapon}:null}];}
    window.GameEntities.AncientSystem.afterDamage(a,t,damage,c);
    window.GameEntities.RelicSystem.afterDamage(a,t,damage,c);
    if(weapon?.onHitStun&&!t.ccImmune&&!(t.controlImmunityTimer>0)){t.stunTimer=window.GameEntities.RelicSystem.control(t,'stunTimer',weapon.onHitStun,a);t.controlImmunityTimer=3;}
    if (t.currentHp <= 0) this.handleDeath(a, t);
    if(a.isAlive && t.isAlive) {this.triggerPassives(a,t,damage,false,c);this.triggerPassives(t,a,damage,true,c);}
    return damage;
  },
  counterOpening(defender,attacker){
    if(!defender.isPawn)return;
    defender.counterTarget=attacker;defender.counterUntil=(window.GameManager.matchTime||0)+1.5;
    defender.confidence=Math.min(100,(defender.confidence||0)+4);defender.fear=Math.max(0,(defender.fear||0)-3);
    defender.successfulDefenses=(defender.successfulDefenses||0)+1;
  },
  rememberBotKill(killer,victim){
    if(!killer?.isPawn||killer.isPlayerControlled||!victim.isPawn)return;
    const G=window.GameManager,now=G.matchTime||0;
    killer.botKillTimes=[...(killer.botKillTimes||[]).filter(at=>now-at<60),now];killer.botKillStreak=killer.botKillTimes.length;
    for(const observer of G.pawns){
      if(observer===killer||!observer.isAlive||!this.canSee(observer,killer))continue;
      const previous=observer.knownThreat;
      observer.knownThreat={target:killer,x:killer.x,y:killer.y,seenAt:now,killAt:now,kills:previous?.target===killer&&now-previous.killAt<60?previous.kills+1:1,snapshot:window.GameAI.AIBrain.threatSnapshot(killer)};
    }
  },
  handleDeath(killer, victim) {
    if (!victim?.isAlive) return;
    if(window.GameEntities.AncientSystem.beforeDeath(victim,killer))return;
    if (!victim.isAncient && victim.armor?.reviveOnce && !victim.hasRevived) { victim.hasRevived = true; victim.currentHp = victim.maxHp * 0.2; return; }
    window.GameEngine.Audio?.play('death',victim);
    victim.isAlive = false; victim.action = null;
    if(victim.isMonster&&victim.tier>=4&&victim.territory)victim.territory.isCleared=true;
    window.GameRenderer.VfxManager.addBurstParticles(victim.x, victim.y, '#d8c4a3', 12);
    if (killer?.isPawn&&!victim.isAncient&&!victim.isAncientClone) { this.rewardBotKill(killer,victim);killer.currentExp += victim.isPawn ? Math.max(1,victim.level||1)*60 : victim.expReward||50; this.checkLevelUp(killer); killer.killCount = (killer.killCount || 0) + 1; window.GameAI.EmotionEngine.onKillOrLoot(killer, victim.dropTier || 'rare'); }
    this.rememberBotKill(killer,victim);
    this.dropLootOnDeath(victim);
    if(victim.isAncient)window.GameEntities.AncientSystem.finish(killer,victim);
    else if(victim===window.GameEntities.EntityManager.worldBoss)window.GameEntities.AncientSystem.awaken(victim,killer);
    window.GameUI.CombatTicker.log('💀 ' + victim.name + ' bị hạ bởi ' + (killer?.name || 'Thiên tai') + '.');
  },
  checkLevelUp(p) {
    const D=window.GameData.LevelTable;
    if(!Number.isFinite(p.currentExp))return;
    while (p.currentExp >= D.expForLevel(p.level+1)) {
      window.GameEngine.Audio?.play('level',p);
      p.level++; p.unspentSkillPoints++; p.maxHp += 24; p.currentHp = p.maxHp; p.attack += 3; p.defense += 2;
      window.GameRenderer.VfxManager.addEffect('heal', p.x, p.y, { radius: 36, color: '#ffe5a4', life: 0.8 });
      window.GameUI.CombatTicker.log('⭐ ' + p.name + ' lên cấp ' + p.level + ', hồi đầy máu.');
    }
  },
  dropLootOnDeath(v) {
    if (!v.isMonster || v.isAncient || v.isAncientClone) return;
    if (Math.random() >= [0, 0.2, 0.3, 0.4, 1, 1][v.tier]) return;
    const G = window.GameManager, D = window.GameData.Equipments;
    if (v.tier >= 4) G.spawnDropItem(v.x - 14, v.y, this.potion, 'potion');
    else if (Math.random() < 0.45) { G.spawnDropItem(v.x, v.y, this.potion, 'potion'); return; }
    if(v.tier===5){
      const weapons=Object.values(D.weapons).filter(e=>e.tier==='god');
      const weapon=D.weapons[v.godArtifactId]||weapons[Math.floor(Math.random()*weapons.length)];
      const armor=Object.values(D.armors).find(e=>e.tier==='god'&&e.slot==='body');
      const helmet=Object.values(D.armors).find(e=>e.tier==='god'&&e.slot==='head');
      for(const [i,equipment] of [weapon,armor,helmet].entries())if(equipment)G.spawnDropItem(v.x+(i-1)*32,v.y+20,equipment,equipment.slot||'weapon');
      return;
    }
    const pool = [...Object.values(D.weapons), ...Object.values(D.armors)].filter(e => e.tier === v.dropTier);
    const equipment = pool[Math.floor(Math.random() * pool.length)];
    if (equipment) G.spawnDropItem(v.x + (v.tier >= 4 ? 14 : 0), v.y, equipment, equipment.slot || 'weapon');
  }
};
