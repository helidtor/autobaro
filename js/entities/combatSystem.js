window.GameEntities = window.GameEntities || {};

window.GameEntities.CombatSystem = {
  pendingEffects: [],
  schedule(source,delay,resolve){this.pendingEffects.push({source,delay,resolve});},
  tickEffects(dt){this.tickFields(dt);const pending=this.pendingEffects;this.pendingEffects=[];for(const effect of pending){effect.delay-=dt;if(!effect.source.isAlive)continue;if(effect.delay<=0)effect.resolve();else this.pendingEffects.push(effect);}},

  fields:[],fieldClock:0,
  field(e,c,x,y,options={}){
    const f={owner:e,x,y,radius:c.radius||55,shape:c.shape||'circle',angle:c.angle||0,length:c.range||120,delay:0,life:2,tick:.5,next:0,damage:0,damageBudget:c.damageBudget,color:c.element==='fire'?'#ff984d':c.element==='ice'?'#85e5ff':'#ad91ec',...options};
    f.maxLife=f.life;f.delay0=f.delay;f.fx=c.id;f.ftype=c.monsterEffect||c.type;f.mon=!!c.monsterEffect;f.el=c.element;f.tint=window.GameRenderer.VfxManager.ownerTint(e);
    this.fields.push(f);return f;
  },
  fieldContains(f,x,y){
    const dx=x-f.x,dy=y-f.y,d=Math.hypot(dx,dy),along=Math.cos(f.angle)*dx+Math.sin(f.angle)*dy,across=Math.abs(-Math.sin(f.angle)*dx+Math.cos(f.angle)*dy);
    return f.shape==='line'?along>=0&&along<=f.length&&across<f.radius:f.shape==='cone'?d<f.radius&&Math.cos(Math.atan2(dy,dx)-f.angle)>.72:d<f.radius&&(!f.innerRadius||d>f.innerRadius);
  },
  tickFields(dt){
    this.fieldClock+=dt;
    for(const f of [...this.fields]){
      f.life-=dt;f.delay-=dt;f.next-=dt;
      if((!f.owner.isAlive&&!f.mythicBomb)||f.life<=0||f.delay>0||f.next>0||f.smoke)continue;
      f.next=f.tick;
      if(f.bend)for(const p of window.GameRenderer.VfxManager.projectiles)if(p.source!==f.owner&&!p.vortexBent&&this.fieldContains(f,p.x,p.y)){p.vortexBent=true;const angle=Math.atan2(f.y-p.y,f.x-p.x),speed=Math.hypot(p.vx,p.vy);p.vx=Math.cos(angle)*speed;p.vy=Math.sin(angle)*speed;}
      if(f.target&&(!f.target.isAlive||Math.hypot(f.owner.x-f.target.x,f.owner.y-f.target.y)>240||!window.GameEngine.MapTerrain.segmentClear(f.owner.x,f.owner.y,f.target.x,f.target.y,false,0))) {f.life=0;continue;}
      const targets=window.GameManager.spatialGrid.queryCircle(f.x,f.y,f.shape==='line'?f.length+f.radius:f.radius);
      for(const e of targets){
        if(!e.isAlive||!this.fieldContains(f,e.x,e.y))continue;
        if(f.heal){if(e===f.owner||e===f.owner.allyPawn){e.currentHp=Math.min(e.maxHp,e.currentHp+this.healthRegenRate(e,'aura',f)*f.tick);if(f.cleanse&&(f.healTicks=(f.healTicks||0)+1)>=2){e.slowTimer=0;f.cleanse=false;}}continue;}
        if(!this.isEnemy(f.owner,e))continue;
        const dealt=f.damage>0?this.applyDamage(f.owner,e,null,{baseDamage:f.damage,skill:true,magic:f.magic,damageBudget:f.damageBudget,sourceSkill:f.sourceSkill,dot:'field',aoe:true,mythicBomb:!!f.mythicBomb}):(this.canEngage(f.owner,e)&&this.reserveCombat(f.owner,e)?1:0);
        if(!dealt||!e.isAlive)continue;
        if(f.pull&&!e.ccImmune&&!window.GameEntities.RelicSystem.knockbackImmune(e)){const a=Math.atan2(f.y-e.y,f.x-e.x);window.GameEngine.MapTerrain.moveEntity(e,Math.cos(a)*f.pull,Math.sin(a)*f.pull);}
        if(f.slow&&!(e.fieldPassUntil>(window.GameManager.matchTime||0))){e.slowTimer=Math.max(e.slowTimer||0,.6);e.slowPct=Math.min(.35,Math.max(e.slowPct||0,f.slow));}
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
    const now=window.GameManager.matchTime||0;
    for(const e of [...(window.GameManager.pawns||[]),...(window.GameManager.monsters||[])])if(e.isAlive){
      const marks=(e.tacticalMarks||[]).filter(m=>m.until>now);e.tacticalMarks=marks;if(e.phoenixEgg){ctx.save();ctx.fillStyle='#ffc66d';ctx.beginPath();ctx.ellipse(e.x,e.y-12,18,25,0,0,Math.PI*2);ctx.fill();ctx.font='bold 12px Arial';ctx.textAlign='center';ctx.fillText('TRỨNG '+Math.ceil(e.phoenixEgg.hp)+' · '+Math.max(0,e.phoenixEgg.until-now).toFixed(1)+'s',e.x,e.y-45);ctx.restore();}
      if(!marks.length&&!e.progression?.bloodRemaining&&!e.armorBreakTimer)continue;
      ctx.save();ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.fillStyle=e.progression?.bloodRemaining?'#99ffbd':e.armorBreakTimer?'#ffd27e':'#aaddff';ctx.fillText(e.progression?.bloodRemaining?'HUYẾT THỂ':e.armorBreakTimer?'GIÁP NỨT':marks.map(m=>(m.kind==='frost'?'❄':'◆')+m.stacks).join(' '),e.x,e.y-42);ctx.restore();
    }
    for(const f of this.fields)window.GameRenderer.VfxManager.drawField(ctx,f);
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
    if(d.type==='species')return {...d,tier:1,cooldownTimer:0};
    if(d.type==='progression')return {...d,tier:1,desc:d.ranks[0].desc,cooldownTimer:0};
    if(typeof d==='string') d={name:d.split(' (')[0]};
    const type = d.reflectPercent ? 'reflect' : d.poisonDotPercent ? 'poison' : d.burnField ? 'burn' : d.ambushBonus ? 'ambush' : d.slowPercent ? 'slow' : d.lifeSteal || d.lowHpLifeStealBuff ? 'leech' : d.rootInterval ? 'root' : d.flatDamageReduction ? 'shell' : d.idleRegenPercent ? 'heal' : 'guard';
    const desc={reflect:'Phản 10% sát thương cận chiến (tối đa 8), hồi chiêu 8s.',poison:'Đòn trúng gây thêm 6 sát thương độc, hồi chiêu 8s.',burn:'Phản 6 sát thương lửa khi bị đánh cận chiến, hồi chiêu 8s.',ambush:'Đòn trúng tăng 20% sát thương khi xuất kích từ bụi, hồi chiêu 8s.',slow:'Đòn trúng làm chậm 15% trong 1s, hồi chiêu 8s.',leech:'Đòn trúng hút lại 15% sát thương thành máu, hồi chiêu 8s.',root:'Đòn trúng trói 0.4s, có miễn khống chế 3s, hồi chiêu 8s.',shell:'Giảm thêm tối đa 8 sát thương khi bị đánh, hồi chiêu 8s.',heal:'Khi bị đánh: hồi 4% máu trong 3s, hồi chiêu 12s.',guard:'Khi bị đánh: dựng thế phòng thủ chính diện 0.6s, hồi chiêu 12s.'}[type];
    return {...d,type,desc,cooldownTimer:0,cooldown:['heal','guard'].includes(type)?12:8};
  },
  passiveList(e){return [...(e.passives||[]),...(e.copiedPassives||[])];},
  triggerPassives(e,other,damage,incoming,c={}) {
    this.speciesEvent(e,other,damage,incoming,c);
    this.progressionEvent(e,other,incoming?'hit':'strike',{...c,damage});
    const multiplier=e.passiveMultiplier||1;
    for(const p of this.passiveList(e)){
      if(p.cooldownTimer>0||['progression','species'].includes(p.type))continue;
      if(incoming && ['reflect','burn'].includes(p.type)){
        if(Math.hypot(e.x-other.x,e.y-other.y)>65 || c.reflected)continue;
        p.cooldownTimer=p.cooldown;
        this.applyDamage(e,other,null,{baseDamage:(p.type==='burn'?Math.min(8,2+this.combatStats(e).attack*.05):Math.min(8,1+damage*.08))*multiplier,reflected:true});
      } else if(incoming && p.type==='heal'){
        p.cooldownTimer=p.cooldown;e.healTimer=3;e.healPerSecond=Math.min((e.original?.maxHp||e.ancientOwner?.original?.maxHp||e.maxHp)*.04/3*multiplier,e.isAncient||e.isAncientClone?this.combatStats(e).attack*.3:Infinity);
        window.GameRenderer.VfxManager.addEffect('heal',e.x,e.y,{radius:28,color:'#9fe6af',life:.7});
      } else if(incoming && p.type==='guard'){
        p.cooldownTimer=p.cooldown;e.guardBudget=undefined;e.guardTimer=.6*multiplier;e.guardAngle=undefined;e.aimAngle=Math.atan2(other.y-e.y,other.x-e.x);
      } else if(!incoming && !c.reflected && ['poison','slow','root','leech'].includes(p.type)){
        p.cooldownTimer=p.cooldown;
        if(p.type==='poison')this.applyDamage(e,other,null,{baseDamage:Math.min(8,2+this.combatStats(e).attack*.05)*multiplier,reflected:true,dot:'poison'});
        if(p.type==='leech')e.currentHp=Math.min(e.maxHp,e.currentHp+Math.min(damage*.2,1+damage*.12)*multiplier);
        if(p.type==='slow'&&!other.ccImmune){other.slowPct=.15*multiplier;other.slowTimer=multiplier;}
        if(p.type==='root' && !other.ccImmune && !(other.controlImmunityTimer>0)){other.stunTimer=.4*multiplier;other.controlImmunityTimer=3;}
      }
    }
  },



  speciesEvent(e,t,damage,incoming,c){
    if(!e.isMonster||e.isAncient||c.dot||c.reflected)return;const now=window.GameManager.matchTime||0,token=c.sourceSkill?.castId??c.actionId??(incoming?t.action?.id:e.action?.id);
    const state=e.speciesState||(e.speciesState={});if(state.lastToken===token&&state.lastIncoming===incoming&&state.other===t)return;state.lastToken=token;state.lastIncoming=incoming;state.other=t;
    for(const p of this.passiveList(e)){if(p.type!=='species'||p.cooldownTimer>0)continue;const id=p.species,i=p.index;let used=false;
      if(['swamp_serpent','frost_ursa','sand_trapper','executioner_golem','emerald_hydra','yama_death_arbiter'].includes(id)&&!incoming){const m=this.markTarget(e,t,id);if(m.stacks>=2){if(id==='sand_trapper')this.field(e,{radius:30},t.x,t.y,{slow:.3,life:2});else if(id==='frost_ursa'){t.slowTimer=1;t.slowPct=.25;}else if(id==='emerald_hydra'){t.armorBreak=.15;t.armorBreakTimer=2;}else {t.deathMarkTimer=3;t.deathMarkOwner=e;}used=true;}}
      if(['magma_toad','infernal_tyrant'].includes(id)&&incoming&&i===0){state.heat=(state.heat||0)+1;if(state.heat>=2){state.heat=0;this.field(e,{radius:45,element:'fire'},e.x,e.y,{delay:.6,damage:2+this.combatStats(e).attack*.08,life:2.1,tick:.7});used=true;}}
      if(['ironspine_boar','ancient_rock_crab','ironhide_rhino_lord','gorilla_berserker','primal_gorilla_sovereign'].includes(id)&&incoming&&i===0&&Math.cos(Math.atan2(t.y-e.y,t.x-e.x)-e.aimAngle)>.4){e.guardTimer=.5;e.guardAngle=e.aimAngle;e.guardBudget=Math.min(e.maxHp*.04,5+this.combatStats(e).defense*.3);e.guardReduction=.2;used=true;}
      if(['naga_spitfire','centaur_warlord','shadow_panther'].includes(id)&&incoming){const a=e.aimAngle+Math.PI/2;window.GameEngine.MapTerrain.moveEntity(e,Math.cos(a)*20,Math.sin(a)*20);used=true;}
      if(id==='vampire_bat'&&!incoming){this.schedule(e,.5,()=>{if(e.isAlive&&t.isAlive&&this.canSee(e,t)&&Math.hypot(e.x-t.x,e.y-t.y)<70)e.currentHp=Math.min(e.maxHp,e.currentHp+Math.min(e.maxHp*.04,damage*.2));});used=true;}
      if(['lich_acolyte','lich_king','world_eater_yggdrasil'].includes(id)&&incoming&&i===0){e.guardTimer=.8;e.guardBudget=Math.min(e.maxHp*.06,8+this.combatStats(e).defense*.4);e.guardReduction=.3;e.guardAngle=e.aimAngle;used=true;}
      if(['chaos_void_drake','eternal_solar_phoenix','world_eater_yggdrasil','yama_death_arbiter'].includes(id)&&incoming&&i>0){if(i===1){this.field(e,{radius:45},e.x,e.y,{slow:.15,life:1.2});}else if(i===2){e.guardTimer=.5;e.guardBudget=Math.min(e.maxHp*.03,4+this.combatStats(e).defense*.2);e.guardAngle=e.aimAngle;}else if(i===3){state.ritualUntil=now+1.2;state.ritualHp=e.currentHp;}else if(i===4){this.field(e,{shape:'line',range:120,radius:14,angle:e.aimAngle},e.x,e.y,{delay:.7,life:1.5,damage:3+this.combatStats(e).attack*.1,tick:.7});}used=true;}
      if(used){p.cooldownTimer=p.cooldown;break;}
    }
  },
  tickSpecies(e,dt){
    if(e.phoenixEgg){e.stasisTimer=Math.max(e.stasisTimer||0,.2);if((window.GameManager.matchTime||0)>=e.phoenixEgg.until){e.phoenixEgg=null;e.stasisTimer=0;e.currentHp=e.maxHp*.3;window.GameRenderer.VfxManager.addEffect('heal',e.x,e.y,{radius:70,color:'#ffbd50',life:1});}return;}
    if(!e.isMonster||e.isAncient)return;const state=e.speciesState||(e.speciesState={}),now=window.GameManager.matchTime||0;
    for(const p of this.passiveList(e)){if(p.type!=='species'||p.cooldownTimer>0)continue;
      if(p.species==='rotting_treant'||p.species==='emerald_hydra'&&p.index===0){state.rooted=!e.action&&Math.hypot(e.vx||0,e.vy||0)<1&&now-(e.lastDamageTakenAt??-Infinity)>1.2?(state.rooted||0)+dt:0;if(state.rooted>=1.5){e.currentHp=Math.min(e.maxHp,e.currentHp+Math.min(e.maxHp*.03,4+e.maxHp*.02));p.cooldownTimer=p.cooldown;state.rooted=0;}}
      if(['alpha_timberwolf','ironhide_rhino_lord','infernal_tyrant','primal_gorilla_sovereign'].includes(p.species)&&e.currentHp<e.maxHp*.4){e.speedBuff=.2;e.speedBuffTimer=1.2;p.cooldownTimer=p.cooldown;}
    }
    if(state.ritualUntil&&now>=state.ritualUntil){if(e.currentHp>=state.ritualHp)e.currentHp=Math.min(e.maxHp,e.currentHp+Math.min(e.maxHp*.02,3+e.maxHp*.015));state.ritualUntil=0;}
  },
  progressionEvent(e,t,event,c={}){
    if(!e.isAlive||c.reflected||c.dot)return;
    const now=window.GameManager.matchTime||0,token=c.sourceSkill?.castId??c.actionId??(event==='strike'?e.action?.id:t?.action?.id);
    const state=e.progression||(e.progression={});
    if(event==='hit'){state.hits=(state.hits||[]).filter(h=>now-h.at<6);if(!state.hits.some(h=>h.token===token&&h.enemy===t))state.hits.push({at:now,token,enemy:t});}
    if(event==='strike'){if(state.lastToken===token&&state.lastEnemy===t)return;state.lastToken=token;state.lastEnemy=t;state.combo=state.comboTarget===t&&now-state.comboAt<5?(state.combo||0)+1:1;state.comboTarget=t;state.comboAt=now;const reserve=this.passiveList(e).find(p=>p.id==='p_blood_reserve');state.reserve=Math.min(reserve?this.passiveConfig(e,reserve).reserveAmount:0,(state.reserve||0)+(c.damage||0)*.1);}
    const candidates=this.passiveList(e).filter(p=>p.type==='progression'&&p.cooldownTimer<=0&&p.id!=='p_blood_body');
    for(const p of candidates){const r=p.tier||1,id=p.id,pc=this.passiveConfig(e,p);let trigger=false;
      if(id==='p_last_exit')trigger=event==='hit'&&c.hpBefore>e.maxHp*.35&&e.currentHp<e.maxHp*.25&&e.currentStamina>=e.maxStamina*.15&&!state.exitLocked;
      if(id==='p_flexible_armor')trigger=event==='block';if(id==='p_counter_shock')trigger=event==='block'&&!c.projectile&&Math.hypot(e.x-t.x,e.y-t.y)<90;
      if(id==='p_rebound_step'||id==='p_feint_afterimage')trigger=event==='dodge';
      if(id==='p_opening_stride')trigger=event==='opening'&&e.currentStamina>=e.maxStamina*.25;
      if(id==='p_tether_pivot')trigger=event==='strike'&&state.combo>=3;
      if(id==='p_exhausting_venom'||id==='p_blood_reserve')trigger=event==='strike'&&state.combo>=2;
      if(id==='p_ember_reversal')trigger=['block','dodge'].includes(event)&&state.hits?.filter(h=>h.enemy===t).length>=2;
      if(id==='p_cornered_instinct')trigger=event==='hit'&&state.hits?.length>=3&&(e.personality?.cowardice||0)<85&&!window.GameAI.AIBrain.hasRetreatRoute(e,t);
      if(id==='p_pattern_reading'&&event==='observed'){const pattern=t.action?.skillId||t.action?.style||'attack';state.pattern=state.pattern?.enemy===t&&state.pattern.kind===pattern&&now-state.pattern.at<12?{...state.pattern,count:state.pattern.count+1,at:now}:{enemy:t,kind:pattern,count:1,at:now};trigger=state.pattern.count>=3;}
      if(id==='p_turning_momentum')trigger=event==='interrupt'||event==='anchor'||event==='kill';
      if(id==='p_ambush_shadow')trigger=event==='concealed';
      if(id==='p_frost_trail')trigger=event==='dodge'&&state.comboTarget===t&&now-state.comboAt<4;
      if(id==='p_protective_charge')trigger=event==='support';
      if(!trigger||now<(state.procUntil||0))continue;
      p.cooldownTimer=p.cooldown;state.procUntil=now+2;state.strideRank=r;state.strideKind=id;state.strideDistance=pc.distanceAmount;
      if(id==='p_last_exit'||id==='p_flexible_armor'){state.shield=Math.max(state.shield||0,pc.shieldAmount||0);state.shieldUntil=now+1.2;state.shieldAngle=Math.atan2(t.y-e.y,t.x-e.x);if(id==='p_last_exit'){state.exitLocked=true;state.lastExitRank=r;}if(id==='p_flexible_armor')state.armorRank=r;}
      else if(id==='p_blood_reserve'){state.reserveAt=now;state.reserveRank=r;}
      else if(id==='p_tether_pivot'){this.field(e,{radius:pc.radiusAmount||45},t.x,t.y,{target:t,slow:.15,life:1.2,damage:0});state.pivotTarget=t;state.pivotRank=r;if(r>=2)state.strideUntil=now+1.5;}
      else if(id==='p_exhausting_venom'){this.markTarget(e,t,'venom');if(r>=2&&t.action?.kind==='skill'&&!t.action.released&&!t.ccImmune){this.interruptChannel(e,t);}else if(r===3)this.field(e,{radius:pc.radiusAmount||30},t.x,t.y,{slow:.2,life:2});}
      else if(id==='p_frost_trail')this.field(e,{radius:pc.radiusAmount||20+r*8,element:'ice'},e.x,e.y,{slow:.15+r*.05,life:1.5+r*.5});
      else if(id==='p_ember_reversal'){if(r===3&&e.tactic?.mode==='counter'&&!t.ccImmune){const angle=Math.atan2(t.y-e.y,t.x-e.x);window.GameEngine.MapTerrain.moveEntity(t,Math.cos(angle)*18,Math.sin(angle)*18);}else this.field(e,{radius:r>=2?55:40,element:'fire'},e.x,e.y,{damage:Math.min(this.combatStats(e).attack*.25,pc.damageAmount),life:1,tick:1});}
      else if(id==='p_protective_charge'){if(r>=2&&e.slowTimer>0){e.slowTimer=0;state.protectedUntil=0;}else {state.protectedUntil=now+1.2;state.shield=Math.max(state.shield||0,pc.shieldAmount||0);state.shieldUntil=now+1.2;state.shieldAngle=e.aimAngle;}}
      else if(id==='p_counter_shock'||id==='p_cornered_instinct'||id==='p_pattern_reading'){this.counterOpening(e,t);if(r===3&&id==='p_counter_shock'&&!t.ccImmune){const a=Math.atan2(t.y-e.y,t.x-e.x);window.GameEngine.MapTerrain.moveEntity(t,Math.cos(a)*15,Math.sin(a)*15);}if(id==='p_cornered_instinct'){e.defiantTarget=t;e.defiantUntil=now+5;}if(r>=2)state.strideUntil=now+1.5;}
      else {state.strideUntil=now+1.5;state.strideRank=r;if(id==='p_feint_afterimage'||id==='p_ambush_shadow')e.afterimageReady=1;}
      window.GameRenderer.VfxManager.addEffect('rune',e.x,e.y,{radius:24+r*4,color:p.role==='defense'?'#95efbd':'#c7b4ff',life:.5});break;
    }
  },


  tacticalCast(e,s,t,c){
    const r=s.tier||1,id=s.id,now=window.GameManager.matchTime||0,M=window.GameEngine.MapTerrain,V=window.GameRenderer.VfxManager;
    if(id==='w_crushing_charge'&&r>=2){const a=c.angle,x=e.x+Math.cos(a)*(c.distance||60),y=e.y+Math.sin(a)*(c.distance||60);if(!M.segmentClear(e.x,e.y,x,y,false,9,e)){e.counterTarget=t;e.counterUntil=now+1;if(r===3)e.nextAttackStride=20;}}
    if(id==='w_iron_wall'&&r>=2){e.preciseGuardUntil=now+.6;if(r===3)e.guardAdvanceUntil=now+1;}
    if(id==='w_riposte'&&r===3)e.slowTimer=0;
    if(id==='m_gravity_vortex'&&r>=2){c.bend=true;if(r===3)this.schedule(e,1.8,()=>this.field(e,{radius:c.radius},c.tx,c.ty,{pull:-14,life:.4}));}
    if(id==='m_meteor_strike'&&r>=2){const x=c.tx,y=c.ty;if(M.canStand(x,y,16)&&!window.GameManager.pawns.some(p=>p.isAlive&&Math.hypot(p.x-x,p.y-y)<40)){this.fields.filter(f=>f.owner===e&&f.wall).slice(1).forEach(f=>f.life=0);this.field(e,{radius:18},x,y,{wall:{x:x-10,y:y-10,w:20,h:20},life:2,color:'#efaf7b'});}if(r===3)for(const f of this.fields)if(f.wall&&f.owner!==e&&Math.hypot(f.x-x,f.y-y)<c.radius)f.life=0;}
    if(id==='m_ice_block'&&r>=2){e.icePieceReady=true;if(r===3)this.schedule(e,c.duration||1.4,()=>this.field(e,{radius:40,element:'ice'},e.x,e.y,{slow:.25,life:1.2}));}
    if(id==='a_double_tap'&&r>=2&&t?.action?.kind==='dodge'){c.tx=t.action.originX+t.action.dodgeX;c.ty=t.action.originY+t.action.dodgeY;}
    if(id==='a_rain_of_arrows'&&r>=2)c.fanPulses=true;
    if(id==='a_windrunner'&&r>=2)e.afterimageReady=1;if(id==='a_windrunner'&&r===3)e.windShotUntil=now+(c.duration||3);
    if(id==='as_shadowstep'&&r>=2&&t?.action?.kind==='dodge'){c.angle=Math.atan2(t.action.originY+t.action.dodgeY-e.y,t.action.originX+t.action.dodgeX-e.x);}
    if(id==='as_vanish'&&r>=2){e.falseTrail={x:e.x,y:e.y,until:now+1};V.addEffect('dash',e.x,e.y,{tx:e.x-Math.cos(e.aimAngle)*30,ty:e.y-Math.sin(e.aimAngle)*30,color:'#d2b1ff',life:.7});}
    if(id==='as_smoke_bomb'&&r>=2){e.falseTrail={x:e.x,y:e.y,until:now+1};if(r===3)c.smokeLane=true;}
    if(id==='h_armament_swap'){e.armamentRank=r;e.nextAttackStride=r===3?20:0;}
    if(id==='h_enchanted_blade'&&r>=2)e.enchantedElement=(e.personality?.aggression||0)>60?'fire':'ice';

    if(e.falseTrail?.until>now)for(const observer of window.GameManager.pawns){const chase=observer.chase;if(chase?.target===e&&now-chase.seenAt<.8&&this.canSee(observer,e)){chase.lastX=e.x+Math.cos(e.aimAngle)*25;chase.lastY=e.y+Math.sin(e.aimAngle)*25;}}
    if(id==='h_wind_form'&&r>=2)e.fieldPassUntil=now+.8;
    if(id==='h_chaos_bolt'&&r===3)this.field(e,{radius:30},c.tx,c.ty,{delay:.7,life:1.5,slow:.2});
  },
  interruptChannel(source,target){
    const action=target?.action;if(!action||action.kind!=='skill'||action.released||target.ccImmune)return false;
    const now=window.GameManager.matchTime||0,protectedState=target.progression;
    if(protectedState?.protectedUntil>now&&Math.cos(Math.atan2(source.y-target.y,source.x-target.x)-(target.aimAngle||0))>.25){protectedState.protectedUntil=0;return false;}
    target.cancelledCastId=action.castId;target.action=null;target.attackState=null;target.healTimer=0;target.healCompleteRank=0;this.progressionEvent(source,target,'interrupt');window.GameRenderer.VfxManager.addDamageNumber(target.x,target.y-30,'NGẮT','block');return true;
  },
  tacticalHit(e,t,s,c){
    const r=s.tier||1,id=s.id,now=window.GameManager.matchTime||0,M=window.GameEngine.MapTerrain;
    if(c.isPulse&&c.pulseIndex>0&&id!=='a_double_tap')return;
    const mark=(kind)=>this.markTarget(e,t,kind);
    if(id==='w_thunder_slash'){const f=this.field(e,{shape:'line',range:70,radius:10,angle:c.angle,element:'ice'},e.x,e.y,{slow:.15,life:2});if(r>=2&&t.action?.kind==='skill'&&!t.action.released&&!t.ccImmune){this.interruptChannel(e,t);}if(r===3)this.schedule(e,.6,()=>{f.damage=Math.min(c.damage*.12,3+(c.attackSnapshot||this.combatStats(e).attack)*.08);f.damageBudget=c.damageBudget;f.life=.5;});}
    if(id==='w_shield_bash'&&r>=2&&t.currentStamina<25){M.moveEntity(t,Math.cos(e.aimAngle)*18,Math.sin(e.aimAngle)*18);if(r===3)t.guardTimer=0;}
    if(id==='w_armor_piercer'){t.crackOwner=e;t.crackAngle=Math.atan2(e.y-t.y,e.x-t.x);t.armorBreakTimer=3;if(r===3&&t.currentStamina<20)t.guardTimer=0;}
    if(id==='m_frost_bolt'){const m=mark('frost');if(r>=2&&m.stacks>=2)this.field(e,{radius:35,element:'ice'},t.x,t.y,{slow:.25,life:2});if(r===3&&m.stacks>=3&&!t.ccImmune&&!(t.controlImmunityTimer>0)){t.stunTimer=.5;t.controlImmunityTimer=3;m.stacks=0;}}
    if(['a_double_tap','a_snipe','as_throat_slit','h_chaos_bolt'].includes(id)){const m=mark(id);if(r>=2&&m.stacks>=2&&t.action?.kind==='skill'&&!t.action.released&&!t.ccImmune){if(this.interruptChannel(e,t))m.stacks=0;}if(r===3&&id==='a_double_tap'){t.currentStamina=Math.max(0,t.currentStamina-8);}}
    if(id==='a_disengage_vault'&&r>=2)this.field(e,{radius:22,element:'ice'},c.originX??e.x,c.originY??e.y,{slow:.3,life:2});
    if(id==='w_earthquake_stomp'&&r>=2)for(const f of this.fields)if(f.owner!==e&&(f.slow||f.spore)&&Math.hypot(f.x-e.x,f.y-e.y)<c.radius)f.life=0;
    if(['m_fireball','m_meteor_strike'].includes(id))for(const f of this.fields)if(f.slow&&Math.hypot(f.x-t.x,f.y-t.y)<65){f.life=0;this.field(e,{radius:35},t.x,t.y,{smoke:true,life:1.2});}
    if(id==='as_shadowstep'&&r===3&&Math.cos(Math.atan2(e.y-t.y,e.x-t.x)-(t.aimAngle||0))<0){t.turnLockedUntil=now+.5;t.turnLockedAngle=t.aimAngle;}
    for(const f of window.GameEntities.AncientSystem.fields)if(f.neoHp>0&&Math.hypot(f.x-t.x,f.y-t.y)<(c.radius||40)){f.neoHp-=c.damage;if(f.neoHp<=0)f.end=window.GameEntities.AncientSystem.clock;}
    for(const w of window.GameEntities.AncientSystem.walls)if(w.hp>0&&Math.hypot(w.x-t.x,w.y-t.y)<(c.radius||40))w.hp-=c.damage;
    if(id==='h_enchanted_blade'&&r>=2)mark((e.personality?.aggression||0)>60?'fire':'frost');
  },
  markTarget(e,t,kind){if(!t)return;const marks=t.tacticalMarks||(t.tacticalMarks=[]),now=window.GameManager.matchTime||0;let m=marks.find(m=>m.owner===e&&m.kind===kind);if(!m){m={owner:e,kind,stacks:0};marks.push(m);}m.stacks=Math.min(3,m.stacks+1);m.until=now+4;return m;},
  tickProgression(e,dt){
    const now=window.GameManager.matchTime||0,state=e.progression||(e.progression={}),M=window.GameEngine.MapTerrain;
    if(e.blinkReturn?.until>now&&!e.action&&e.lastAttacker?.isAlive&&Math.hypot(e.x-e.lastAttacker.x,e.y-e.lastAttacker.y)<60){M.moveEntity(e,e.blinkReturn.x-e.x,e.blinkReturn.y-e.y);e.blinkReturn=null;}
    if(e.healCompleteRank&&e.healTimer<=0&&e.healInterruptibleTimer<=0){if(e.healCompleteRank>=2)e.slowTimer=0;if(e.healCompleteRank===3)state.dodgeDiscount=true;e.healCompleteRank=0;}
    if(e.manaShieldRank===3&&e.manaShieldTimer<=dt&&e.manaAbsorbed>0){this.field(e,{radius:50},e.x,e.y,{pull:-8,life:.5,damage:0});e.manaAbsorbed=0;}
    if(e.isSplit)return;
    const blood=this.passiveList(e).find(p=>p.id==='p_blood_body'),combat=now-(e.lastHostileAt??-Infinity)<6&&!M.isInWater(e.x,e.y);
    const anti=Math.min(.5,Math.max(0,e.antiHealUntil>now?e.antiHeal||0:0));
    if(blood){
      if(combat){e.currentHp=Math.min(e.maxHp,e.currentHp+this.healthRegenRate(e,'blood')*dt);if(state.bloodRemaining>0){const elapsed=Math.min(dt,state.bloodRemaining);e.currentHp=Math.min(e.maxHp,e.currentHp+this.healthRegenRate(e,'burst')*elapsed);if(!e.isAncientClone||e===e.ancientOwner.clones.find(q=>q.isAlive))state.bloodRemaining-=elapsed;}}
      else state.bloodRemaining=0;
      state.bloodRearm=e.currentHp>e.maxHp*.6?(state.bloodRearm||0)+dt:0;if(state.bloodRearm>=8&&blood.cooldownTimer<=0)state.bloodLocked=false;
    }
    state.exitRearm=e.currentHp>e.maxHp*.55?(state.exitRearm||0)+dt:0;if(state.exitRearm>=8)state.exitLocked=false;
    if(state.reserveAt!==undefined&&now-state.reserveAt>=.8){if(now-(e.lastDamageTakenAt??-Infinity)>=.8){if(state.reserveRank===3&&e.currentHp>e.maxHp*.65){state.shield=Math.max(state.shield||0,state.reserve||0);state.shieldUntil=now+1.2;}else e.currentHp=Math.min(e.maxHp,e.currentHp+(state.reserve||0)*(1-anti));state.reserve=0;delete state.reserveAt;}else if(now-state.reserveAt>3){delete state.reserveAt;state.reserve=0;}}
    const recovery=this.passiveList(e).find(p=>p.id==='p_recovery_cycle'&&p.cooldownTimer<=0);
    if(recovery&&e.currentHp<e.maxHp*.85&&!e.action&&Math.hypot(e.vx||0,e.vy||0)<1&&now-(e.lastDamageTakenAt??-Infinity)>1.2){state.recover=(state.recover||0)+dt;if(state.recover>=1.2){e.currentHp=Math.min(e.maxHp,e.currentHp+this.passiveConfig(e,recovery).healAmount*(1-anti));recovery.cooldownTimer=recovery.cooldown;state.recover=0;if(recovery.tier>=2)e.slowTimer=0;if(recovery.tier===3)state.dodgeDiscount=true;}}else state.recover=0;
    if(state.lastExitRank>=2){const rank=state.lastExitRank;state.lastExitRank=0;if(e.lastAttacker?.isAlive&&e.currentStamina>=e.maxStamina*.15){if(window.GameAI.AIBrain.hasRetreatRoute(e,e.lastAttacker)&&e.tactic?.mode==='retreat'){const angle=Math.atan2(e.y-e.lastAttacker.y,e.x-e.lastAttacker.x);e.currentStamina-=15;M.moveEntity(e,Math.cos(angle)*30,Math.sin(angle)*30);state.shield=0;}else if(rank===3){e.guardTimer=.6;e.guardAngle=state.shieldAngle;e.guardBudget=state.shield;state.shield=0;}}}
    if(state.strideKind==='p_ambush_shadow'&&state.strideUntil>now&&window.GameManager.pawns.some(t=>this.isEnemy(t,e)&&this.canSee(t,e)))state.strideUntil=0;
    const watched=e.targetEnemy;if(watched?.action&&!watched.action.released&&this.canSee(e,watched)&&state.observedAction!==watched.id+':'+watched.action.id){state.observedAction=watched.id+':'+watched.action.id;this.progressionEvent(e,watched,'observed');}
    if(state.strideUntil>now&&!e.action&&e.targetEnemy?.isAlive&&e.currentStamina>=10){const a=Math.atan2(e.targetEnemy.y-e.y,e.targetEnemy.x-e.x)+(e.tactic?.mode==='retreat'?Math.PI:state.strideRank>=2?.7:0),distance=state.strideDistance||10+(state.strideRank||1)*10;e.currentStamina-=10;M.moveEntity(e,Math.cos(a)*distance,Math.sin(a)*distance);state.strideUntil=0;if(state.strideRank===3&&['p_rebound_step','p_opening_stride'].includes(state.strideKind)&&Math.cos(a-e.targetEnemy.aimAngle)<0){e.movingShotReady=true;e.speedBuffTimer=Math.max(e.speedBuffTimer||0,1);}}
  },

 visionRange(e){
  if(!e?.isMonster)return 230+(e?.personality?.curiosity||50);
  const base=e.tier>=4?300:220;
  const mult=e.tier>=6||e.isAncient||e.isAncientClone?4:e.tier===5?3:e.tier===4?2:1;
  return base*mult;
 },
 canSee(observer,target,ignoreConcealment=false){
  if(!target?.isAlive||observer===target)return false;
  if((target.mythicUntargetable||0)>(window.GameManager.matchTime||0))return false;
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
  const list=[...members];
  const packs=new Set(list.filter(e=>e.isMonster&&e.packId).map(e=>e.packId));
  const packId=packs.size===1?[...packs][0]:null;
  const counted=packId?list.filter(e=>!(e.isMonster&&e.packId===packId)):list;
  return counted.length<=3||counted.length===4&&counted.every(p=>p.isPawn&&p.allyPawn!==p&&p.allyPawn?.isAlive&&counted.includes(p.allyPawn)&&p.allyPawn.allyPawn===p);
 },
 crowdAt(e,x,y){
  const pawns=window.GameManager?.pawns||[],set=new Set([e]),grid=window.GameManager?.spatialGrid;
  const indexed=grid&&grid._gen&&grid.grid.size?grid:null;
  if(indexed){
   const near=indexed.queryCircle(x,y,75);
   for(let i=0;i<near.length;i++){const p=near[i];if(p.isPawn&&p!==e&&p.isAlive&&Math.hypot(p.x-x,p.y-y)<75)set.add(p);}
  }
  for(let i=0;i<pawns.length;i++){
   const p=pawns[i];
   if(p===e||!p.isAlive||set.has(p))continue;
   // Cùng ô với lần đưa vào lưới thì queryCircle đã xét. Ai vừa đổi ô, hoặc chưa được đưa vào, vẫn đo trực tiếp.
   if(indexed&&p._hashGen===indexed._gen&&p._hashKey===indexed._getKey(p.x,p.y))continue;
   if(Math.hypot(p.x-x,p.y-y)<75)set.add(p);
  }
  return set;
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
  const active=[],units=[G?.pawns,G?.monsters];
  for(let u=0;u<2;u++){const list=units[u]||[];for(let i=0;i<list.length;i++){const p=list[i];if(p.isAlive&&(p.combatLease>0||p.action?.target))active.push(p);}}
  for(const origin of members){
    for(const p of active)if(Math.hypot(p.x-origin.x,p.y-origin.y)<120){addGroup(p.combatGroup);members.add(p);}
    const ally=origin.allyPawn;
    if(ally?.isAlive&&ally.allyPawn===origin&&Math.hypot(origin.x-ally.x,origin.y-ally.y)<240&&!M.isInWater(ally.x,ally.y))members.add(ally);
    if(members.size>8)break;
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
  if(a.packId&&this.isEnemy(a,t))this.alertPack(a,t);
  if(t.packId&&this.isEnemy(t,a))this.alertPack(t,a);
  return true;
 },
 alertPack(monster,enemy){
  if(!monster?.packId||!enemy?.isAlive)return;
  const now=window.GameManager.matchTime||0;
  for(const mate of window.GameManager.monsters||[]){
    if(!mate.isAlive||mate.packId!==monster.packId)continue;
    mate.packAlert={target:enemy,until:now+8};
    mate.targetEnemy=enemy;
  }
 },
 bossDen(e){
  if(!e?.isMonster||(e.tier||0)<4)return null;
  const a=e.territory;
  return a?.radius>0?a:null;
 },
 insideDen(e,den){
  if(!den||!e)return true;
  const arena=window.GameEngine.MapTerrain?.ancientArena;
  if(den.id==='ancient_arena'&&arena)return e.x>=arena.x&&e.y>=arena.y&&e.x<=arena.x+arena.w&&e.y<=arena.y+arena.h;
  return Math.hypot(e.x-den.x,e.y-den.y)<=den.radius+1;
 },
 canEngage(a,t){
  const M=window.GameEngine.MapTerrain;
  const den=this.bossDen(t)||this.bossDen(a);
  if(den&&(!this.insideDen(a,den)||!this.insideDen(t,den)))return false;
  const pierce=window.GameEntities.MythicSystem?.has(a,'myth_ballista')&&['bow','crossbow','staff','tome'].includes(this.weaponStyle(a));
  return this.isEnemy(a,t) && M.templeAccess(a,t.x,t.y) && M.templeAccess(t,a.x,a.y) && (!a.isMonster || M.monsterCanTarget(a,t)) && !M.isInWater(a.x,a.y) && !M.isInWater(t.x,t.y) && this.canJoin(a,t) && M.segmentClear(a.x,a.y,t.x,t.y,false,0,null,pierce);
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
 combatStats(e,attacker){
  const scale=e.statMultiplier||1,R=window.GameEntities.RelicSystem,gear=R.equipment(e),ancient=e.weapon?.tier==='ancient';
  const weaponAttack=ancient?(e.weapon?.attack||e.weapon?.magicPower||0):(e.weapon?.attack||0);
  let attack=(e.attack||16)+weaponAttack+[e.armor,e.helmet,e.boots].reduce((v,d)=>v+(d?.attack||0),0);
  const steal=e.relicState?.voidblade;
  if(R.has(e,'voidblade')&&steal?.timer>0&&steal.target?.isAlive){const t=steal.target;attack+=steal.stacks*.02*((t.defense||0)*2+R.equipment(t).reduce((v,d)=>v+(d.defense||0)+(d.magicDefense||0),0));}
  const defense=(e.defense||0)+gear.reduce((v,d)=>v+(d.defense||0),0),debuff=e.relicState?.voidArmor;
  const crackApplies=!e.crackOwner||!attacker||attacker===e.crackOwner&&Math.cos(Math.atan2(attacker.y-e.y,attacker.x-e.x)-e.crackAngle)>.5;
  const breakTimer=window.GameEntities.MythicSystem?.has(e,'myth_sever')?0:e.armorBreakTimer;
  const modifier=(breakTimer>0&&crackApplies?1-(e.armorBreak||0):1)*(debuff?.timer>0?1-debuff.stacks*.02:1);
  const range=this.bossDamageRange(e);
  const skillPower=((e.skillPower||0)+gear.reduce((v,d)=>v+(d.skillPower||0),0)+(ancient?(e.weapon?.magicPower||0):0))*scale;
  const stats={attack:range?Math.max(range[0],Math.min(range[1],attack*scale)):attack*scale,defense:defense*scale*modifier,magicDefense:(defense+gear.reduce((v,d)=>v+(d.magicDefense||0),0))*scale*modifier,skillPower,range:e.weapon?.range||(['bow','crossbow','staff','tome'].includes(this.weaponStyle(e))?130:e.isAncient?150:e.tier>=4?75:38),speed:window.GameEngine.MapTerrain.getMoveSpeed(e)};
  return window.GameEntities.MythicSystem?.adjustStats(e,stats)||stats;
 },
 critChance(e){
  if(window.GameEntities.MythicSystem?.has(e,'myth_combust'))return 0;
  return Math.min(.5,(e?.critChance||0)+window.GameEntities.RelicSystem.equipment(e).reduce((v,d)=>v+(d.critChance||0),0));
 },
 buildRows:{
  fortify:{hp:40,attack:1,defense:4,crit:0,mana:0,skill:0,hpRegen:0},
  assassin:{hp:12,attack:4,defense:0,crit:.015,mana:0,skill:0,hpRegen:0},
  archer:{hp:32,attack:3,defense:1,crit:.01,mana:0,skill:0,hpRegen:0},
  mage:{hp:16,attack:1,defense:0,crit:0,mana:15,skill:4,hpRegen:0},
  restore:{hp:20,attack:2,defense:1,crit:0,mana:5,skill:0,hpRegen:.15}
 },
 buildBonusRows:{
  fortify:{hp:.05,attack:.01,defense:.05,skill:.01,crit:.005},
  assassin:{hp:.02,attack:.05,defense:.01,skill:.01,crit:.02},
  archer:{hp:.01,attack:.04,defense:.02,skill:.02,crit:.015},
  mage:{hp:.01,attack:.01,defense:.01,skill:.05,crit:.005},
  restore:{hp:.02,attack:.02,defense:.03,skill:.03,crit:.0025}
 },
 skillVector(d){
  const id=d?.id||'',role=d?.role||'',blank={fortify:0,assassin:0,archer:0,mage:0,restore:0};
  if(role==='heal'||id==='h_healing_aura'||id==='p_blood_body'||id==='p_recovery_cycle')return {...blank,restore:1};
  if(role==='defense'||id==='w_riposte'||id==='w_iron_wall'||id==='p_flexible_armor')return {...blank,fortify:1};
  if(id.startsWith('as_')||role==='finisher')return {...blank,assassin:1};
  if(id.startsWith('a_'))return {...blank,archer:1};
  if(id.startsWith('m_')||d?.magic)return {...blank,mage:1};
  if(id.startsWith('w_')&&(role==='control'||role==='defense'))return {...blank,fortify:1};
  if(id.startsWith('w_'))return {...blank,fortify:.5,assassin:.5};
  if(role==='mobility')return {...blank,assassin:.5,archer:.5};
  if(role==='buff')return {...blank,mage:.5,restore:.5};
  if(role==='control')return {...blank,fortify:.5,mage:.5};
  return {fortify:.25,assassin:.25,archer:.25,mage:.25,restore:0};
 },
 investBuild(p,d){
  const source=d?.def||d;if(!p||!source)return;
  const v=this.skillVector(source);
  p.buildPoints=p.buildPoints||{fortify:0,assassin:0,archer:0,mage:0,restore:0};
  for(const key of Object.keys(p.buildPoints))p.buildPoints[key]+=v[key]||0;
 },
 normalizedBuild(p){
  const w={fortify:0,assassin:0,archer:0,mage:0,restore:0};
  const P=p?.personality||window.GameData.PersonalityProfiles?.[p?.trait]||{};
  w.fortify+=(P.caution||0)*.008;
  w.assassin+=(P.aggression||0)*.008;
  w.archer+=(P.patience||0)*.006;
  w.mage+=(P.curiosity||0)*.008;
  w.restore+=(P.loyalty||0)*.008;
  for(const key of Object.keys(w))w[key]+=p?.buildPoints?.[key]||0;
  const sum=Object.values(w).reduce((s,n)=>s+n,0);
  if(sum<=0)return {fortify:.2,assassin:.2,archer:.2,mage:.2,restore:.2};
  for(const key of Object.keys(w))w[key]/=sum;
  return w;
 },
 levelGrowth(p){
  const w=this.normalizedBuild(p),g={hp:0,attack:0,defense:0,crit:0,mana:0,skill:0,hpRegen:0};
  for(const [key,row] of Object.entries(this.buildRows))for(const stat of Object.keys(g))g[stat]+=w[key]*(row[stat]||0);
  // Equipment HP is already included in maxHp; exclude it from permanent level bonuses.
  const equipmentHp=[p.weapon,p.armor,p.helmet,p.boots].reduce((sum,item)=>sum+(item?.hp||0),0);
  const base={hp:Math.max(0,(p.maxHp||0)-equipmentHp),attack:p.attack||0,defense:p.defense||0,skill:p.skillPower||0,crit:p.critChance||0};
  for(const [key,row] of Object.entries(this.buildBonusRows))for(const [stat,rate] of Object.entries(row))g[stat]+=w[key]*rate*base[stat];
  return g;
 },
 dominantBuild(p){
  const names={fortify:'Chống chịu',assassin:'Sát thủ',archer:'Cung thủ',mage:'Pháp sư',restore:'Hồi phục'};
  const best=Object.entries(this.normalizedBuild(p)).sort((a,b)=>b[1]-a[1])[0][0];
  return names[best];
 },
 bonusHealthRegen(e){
  if(!e?.isPawn)return 0;
  return (e.hpRegen||0)+window.GameEntities.RelicSystem.equipment(e).reduce((v,d)=>v+(d.hpRegen||0),0);
 },

  canAttack(e) {
    return !!e?.isAlive && !e.action && !e.isSplit && !(e.stunTimer > 0) && !(e.pacifyTimer > 0) && !(e.stasisTimer>0) && !(e.relicInterrupt>0) &&
      !window.GameEntities.MythicSystem?.blocksAction(e) && !window.GameEngine.MapTerrain.isInWater(e.x, e.y);
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
    if (target && ['attack','skill'].includes(kind)) {
      const den=this.bossDen(target)||this.bossDen(e);
      if(e.isPlayerControlled&&den&&!this.insideDen(e,den))window.GameRenderer.VfxManager.addDamageNumber(e.x,e.y-18,'VÀO SÀO HUYỆT','block');
      if (!this.canEngage(e,target)||!this.reserveCombat(e,target)) return false;
    }
    if(target&&['attack','skill'].includes(kind)){e.isHiding=false;e.stealthTimer=0;}
    const style = options.style || this.weaponStyle(e), timing = this.styles[style];
    const windup = options.windup ?? timing.windup;
    const duration = windup + (options.active ?? timing.active) + (options.recovery ?? timing.recovery);
    const angle = target ? Math.atan2(target.y - e.y, target.x - e.x) : e.aimAngle || 0;
    e.actionSerial=(e.actionSerial||0)+1;
    e.action = { id:e.actionSerial,kind, style, elapsed: 0, startedAt:window.GameManager.matchTime||0, windup, duration, angle, target,
      targetX: target?.x ?? e.x, targetY: target?.y ?? e.y, originX: e.x, originY: e.y,
      released: false, resolve, ...options };
    if(kind==='attack'){if(!e.isMonster)window.GameEngine.Audio?.play('wind',e,style);}else if(kind!=='skill')window.GameEngine.Audio?.play(kind==='block'?'raise':kind,e,style);
    e.aimAngle = angle;
    e.attackState = { isAttacking: true, progress: 0 };
    e.vx = e.vy = 0;
    return true;
  },
  executeAttack(a, target) {
    if(window.GameEntities.MythicSystem?.blocksAction(a)){window.GameEntities.MythicSystem.requestExit(a);return false;}
    if (!this.canAttack(a) || a.attackCooldown > 0 || !this.isEnemy(a, target)) return false;
    if(a.isAncient&&a.ancientKind==='chaos'){
      const i=a.weaponCycle=(a.weaponCycle||0)+1;
      a.weapon={type:['sword','spear','hammer','bow'][i%4],range:[55,100,65,230][i%4],armorPierce:i%4===1?.35:0,onHitStun:i%4===2?.3:0,speed:1};
    }
    const low=a.isMonster?window.GameData.LowMonsterTactics?.[a.defId]:null;
    const style = low?.[2]||this.weaponStyle(a), ranged = ['bow', 'crossbow', 'staff', 'tome'].includes(style);
    const range = this.combatStats(a).range;
    if (Math.hypot(target.x - a.x, target.y - a.y) > range + 8) return false;
    const glide=ranged&&a.movingShotReady&&a.speedBuffTimer>0;if(glide)a.movingShotReady=false;
    const Mythic=window.GameEntities.MythicSystem;
    const wrath=!!(Mythic?.has(a,'myth_wrath')&&((Mythic.state(a).wrath||0)+1)>=4);
    const weapon=a.weapon?{...a.weapon}:null,snapshot={baseDamage:this.combatStats(a).attack,actionId:(a.actionSerial||0)+1,wrath};
    const timing=this.styles[style]||{windup:.2};
    const ok = this.startAction(a, 'attack', target, () => {
      if (!this.isEnemy(a, target)) return;
      if (ranged) this.launchProjectile(a, target, weapon, {...snapshot,magic:weapon?.effect==='tome'}, ['staff', 'tome'].includes(style) ? '#bba3ff' : '#ffde9a');
      else if (Math.hypot(target.x - a.x, target.y - a.y) <= range + 18) {
        this.applyDamage(a, target, weapon,snapshot);
        window.GameRenderer.VfxManager.addEffect('slash', a.x, a.y, { angle: a.aimAngle, radius: range, color: a.weapon?.color||'#ffe9b1', life: 0.25 });
      }
    }, { style,movingShot:glide,wrath,windup:(low?low[0]:timing.windup)+(wrath?.4:0),...(low?{recovery:low[1]}:{}) });
    if (ok) {Mythic?.payBlood(a,'basic');if(Mythic?.has(a,'myth_wrath'))Mythic.markBasic(a);a.attackCooldown=Mythic?.attackInterval(a,(a.weapon?.speed||.9)*(a.isBerserk?1.25:1)*(a.attackSpeedMultiplier||1))??Math.max(a.isAncient?.25:.7,1/((a.weapon?.speed||.9)*(a.isBerserk?1.25:1)*(a.attackSpeedMultiplier||1)));}
    return ok;
  },
  bossDamageRange(e){
    if(!e.isMonster||e.tier<4)return null;
    return e.isAncientClone?[50,100]:e.tier>=6?[100,200]:e.tier===5?[80,150]:[60,100];
  },
  supportHp(e){return (e.profile?.hp||e.ancientOwner?.profile?.hp||e.maxHp)*(e.isAncientClone?.5:1);},
  scaledValue(e,f,context={}){
    if(!f)return 0;
    const stats=this.combatStats(e),hp=this.supportHp(e),scale=e.statMultiplier||1;
    const stat={attack:stats.attack,defense:stats.defense,hp,mana:e.maxMana||0,speed:(e.moveSpeed||e.speed||95)*scale,skill:stats.skillPower||0,...context}[f.stat]||0;
    const value=f.base*scale+f.ratio*stat;
    return Math.max(0,Math.min(value,f.cap===undefined?Infinity:hp*f.cap));
  },
  evaluateScaling(e,c){
    const stats=this.combatStats(e),hp=this.supportHp(e),range=this.bossDamageRange(e);
    for(const [key,f] of Object.entries(c.scaling||{}))c[key+'Amount']=this.scaledValue(e,f);
    const power=Math.max(stats.attack,c.magic?stats.skillPower||0:0);
    c.maxDamage=range?.[1]??power*(c.role==='finisher'?2.4:2.1);
    if(c.scaling?.counter)c.counterAmount=Math.min(c.maxDamage,c.counterAmount);
    c.damage=c.scaling?.damage?Math.min(c.maxDamage,Math.max(range?.[0]||0,c.damageAmount)):0;
    if(c.scaling?.distance){const base=c.scaling.distance.base*(e.statMultiplier||1),distance=Math.min(base*1.2,c.distanceAmount);if(c.backstep)c.backstep=distance;else c.distance=distance;}
    if(c.scaling?.speed){c.speedAmount=Math.min(.35*(e.moveSpeed||e.speed||95)*(e.statMultiplier||1),c.speedAmount);c.speedBuff=c.speedAmount/Math.max(1,(e.moveSpeed||e.speed||95)*(e.statMultiplier||1));}
    if(c.scaling?.onHit)c.magicOnHit=Math.min(stats.attack*.15,c.onHitAmount);
    return c;
  },
  damageBudget(e,c){return {limit:e.isMonster?c.damage:Math.min(c.maxDamage,c.damage*1.35*(1+(c.executeBonus||0))*(c.type==='teleport_backstab'?1.18:1)),spent:new Map(),dealt:new Map()};},
  passiveConfig(e,p){
    const c={...p,...p.ranks?.[(p.tier||1)-1]};
    for(const [key,f] of Object.entries(c.scaling||{}))c[key+'Amount']=this.scaledValue(e,f);
    if(c.scaling?.distance)c.distanceAmount=Math.min(c.scaling.distance.base*(e.statMultiplier||1)*1.2,c.distanceAmount);
    if(c.scaling?.regen)c.regenAmount=Math.min(this.supportHp(e)*.012,c.regenAmount);
    return c;
  },
  getSkillConfig(e, skill) {
    if(skill.def.type==='ancient_skill')return window.GameEntities.AncientSystem.config(e,skill);
    const d = skill.def;
    const c = { ...d, ...d.t1, ...(skill.tier >= 2 ? d.t2 : {}), ...(skill.tier >= 3 ? d.t3 : {}) };
    const tactic=window.GameData.MonsterTactics?.[skill.id];
    if(tactic){c.monsterEffect=tactic[0];c.desc=(window.GameData.MonsterSkillProgression?.[skill.id]||[window.GameData.MonsterTacticDescriptions[c.monsterEffect]]).join(' • ');c.damageScale=tactic[1];c.pulses=0;c.monsterPulses=tactic[2];c.windup=tactic[3];c.shape=['line','beam','charge','fissure'].includes(c.monsterEffect)?'line':['cone','fan','flurry'].includes(c.monsterEffect)?'cone':'circle';}
    c.cooldown = Math.max(e.isMonster ? 7 : 6, c.cooldown || 10);
    c.cooldown*=1-window.GameEntities.RelicSystem.equipment(e).reduce((v,d)=>v+(d.cooldownReduction||0),0);
    if(e.isMonster&&c.type==='monster_skill'){
      const factor=tactic?.[1]||1.3,base=e.tier===5?80:e.tier===4?55:e.tier===3?18:6;
      c.scaling={damage:{base:Math.round(base*factor/1.3),ratio:e.tier===5?.35:e.tier===4?.25:factor*.5,stat:'attack'}};
    }
    if(!c.scaling)c.scaling={damage:{base:c.baseDamage||c.magicDamage||c.nukeDamage||0,ratio:c.dmgMultiplier||c.dmgPct||1.3,stat:'attack'}};
    if(c.magic)c.scaling=Object.fromEntries(Object.entries(c.scaling).map(([key,f])=>[key,f&&f.stat==='attack'?{...f,stat:'skill'}:f]));
    this.evaluateScaling(e,c);
    c.radius = Math.min(100, c.radius || 50);
    c.range = Math.min(240, Math.max(c.range || 100, c.radius));
    window.GameEntities.MythicSystem?.adjustSkill(e,skill,c);
    if(window.GameEntities.MythicSystem?.has(e,'myth_ballista')&&/projectile|arrows|snipe|bolt/.test(c.type||''))c.range=(c.range||0)+70;
    c.stun = Math.min(e.isMonster ? 0.7 : 0.9, c.stunDur || c.freezeDuration || 0);
    c.slow = Math.min(0.35, c.slowPct || c.slow || 0);
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
    if(e?.isAlive&&skill?.id==='m_blink'&&e.blinkReturn?.until>(window.GameManager.matchTime||0)&&!e.action&&!window.GameEngine.MapTerrain.isInWater(e.x,e.y)){const point=e.blinkReturn;e.blinkReturn=null;window.GameEngine.MapTerrain.moveEntity(e,point.x-e.x,point.y-e.y);return true;}
    if (!this.canAttack(e) || !skill?.def || skill.cooldownTimer > 0 || (e.globalSkillCooldown>0) || e.silenceTimer > 0) return false;
    if(skill.def.type==='ancient_skill')return window.GameEntities.AncientSystem.cast(e,skill,target);
    const owner=e.ancientOwner||e;if(owner.globalSkillCooldown>0&&e.isAncientClone)return false;
    const c = this.getSkillConfig(e, skill), type = c.type;
    const utility = ['teleport', 'speed_buff', 'ethereal_speed', 'stealth', 'smoke_cloud', 'weapon_swap', 'weapon_buff', 'self_heal', 'aura_heal', 'shield_stance', 'counter_stance', 'mana_shield_toggle', 'stasis'].includes(type);
    if (!utility && (!this.isEnemy(e, target) || Math.hypot(target.x - e.x, target.y - e.y) > c.range)) return false;
    if (['self_heal', 'aura_heal'].includes(type) && e.currentHp >= e.maxHp * 0.85) return false;
    if (type === 'weapon_swap' && (!e.secondaryWeapon || window.GameEntities.MythicSystem?.blocksWeaponLoot(e))) return false;
    if (window.GameEntities.MythicSystem?.blocksDash(e,type)) return false;
    const mana = (c.manaCost || 0) + (c.extraManaPct || 0) * e.maxMana;
    const stamina = (c.staminaCost || 0) + (c.extraStaminaPct || 0) * e.maxStamina;
    if (e.currentMana < mana || e.currentStamina < stamina) return false;
    const element = c.element || (/fire|meteor/.test(skill.id) ? 'fire' : /frost|ice/.test(skill.id) ? 'ice' : e.classId === 'mage' ? 'void' : 'steel');
    const color = { fire: '#ff9b48', ice: '#8be6ff', nature: '#a9e76c', void: '#bd9cff', earth: '#ebc892', steel: '#ffe4a3' }[element];
    const area = /aoe|slam|barrage|whirlwind|vortex|nuke|monster_skill/.test(type);
    const projectile = /projectile|arrows|snipe|bolt/.test(type);
    const angle = target ? Math.atan2(target.y - e.y, target.x - e.x) : e.aimAngle || 0;
    const tx = target?.x ?? e.x, ty = target?.y ?? e.y;
    c.damageBudget=this.damageBudget(e,c);
    Object.assign(c,{originX:e.x,originY:e.y,tx,ty,angle,weaponSnapshot:e.weapon?{...e.weapon}:null,attackSnapshot:this.combatStats(e).attack,castId:(e.skillsCast||0)+1});
    const windup = c.windup ?? (utility ? 0.28 : e.isMonster ? 0.85 : projectile ? 0.45 : 0.38);
    const ok = this.startAction(e, 'skill', utility ? null : target, () => this.resolveSkill(e,skill,target,c), { style: this.weaponStyle(e), windup, recovery: /finisher|execution|nuke/.test(type)||c.monsterEffect==='leap'?.7:.35, color, castId:c.castId,skillId:skill.id,skillName: c.name });
    if (!ok) return false;
    window.GameEngine.Audio?.castStart(e,skill,c,element);
    if(utility)this.progressionEvent(e,target,'support');
    if(type==='dash_stun'){e.guardTimer=windup;e.guardReduction=.35;e.guardAngle=angle;}
    e.currentMana -= mana; e.currentStamina -= stamina;
    skill.cooldownTimer = c.cooldown; if(e.isMonster){e.globalSkillCooldown=e.isAncientClone?1:e.tier===5?2:3;if(e.isAncientClone)owner.globalSkillCooldown=1;} e.attackCooldown = windup + 0.35;
    if(!e.isMonster){e.globalSkillCooldown=window.GameEntities.MythicSystem?.globalCooldown(e)??1.8;window.GameEntities.MythicSystem?.payBlood(e,'skill');}
    e.skillsCast = (e.skillsCast || 0) + 1;
    const V=window.GameRenderer.VfxManager,mm=c.monsterEffect,fx={fx:skill.id,mon:mm,el:element,tint:V.ownerTint(e),tier:skill.tier};
    if (!utility && (area || type==='cone_slash')) {
      // Telegraph khớp hitbox thật: tâm tại thân khi đòn quanh thân/hướng, dải/nón theo shape của field.
      const shape=type==='cone_slash'?'cone':c.shape||'circle',self=(shape!=='circle'&&mm!=='fissure')||c.selfArea||type==='whirlwind_aoe'||mm==='ring'||mm==='interrupt';
      V.addEffect('telegraph', self?e.x:tx, self?e.y:ty, { ...fx, radius: c.radius, angle, shape, length: mm&&shape==='cone'?c.radius:c.range, halfW:mm?({line:20,beam:18,charge:22,fan:12,fissure:c.radius})[mm]??25:25, inner:type==='ground_slam'?18:mm==='ring'?20:0, color, life: windup, label: c.name });
    } else V.addEffect('rune', e.x, e.y, { ...fx, plain:true, ph:'tele', radius: 24, tx, ty, angle, length: Math.hypot(tx-e.x,ty-e.y), color, life: windup });
    return true;
  },
  resolveSkill(e,skill,target,c=this.getSkillConfig(e,skill)){
    if(!c.damageBudget)c.damageBudget=this.damageBudget(e,c);
    if(!c.isPulse){this.tacticalCast(e,skill,target,c);window.GameEntities.RelicSystem.onCast(e,skill,c.castId,c.damageBudget);}
    if(c.pulses>1){
      const count=c.pulses;
      for(let i=0;i<count;i++){const pulse=()=>{if(c.castId!==undefined&&e.cancelledCastId===c.castId)return;this.resolveSkill(e,skill,target,{...c,isPulse:true,pulses:0,damage:c.damage/count,tx:c.fanPulses?c.tx+Math.cos(c.angle+Math.PI/2)*(i-1)*25:c.tx,ty:c.fanPulses?c.ty+Math.sin(c.angle+Math.PI/2)*(i-1)*25:c.ty,pulseIndex:i,pulseCount:count,useCurrentOrigin:c.type==='whirlwind_aoe'});};if(i===0)pulse();else this.schedule(e,i*(c.type==='burst_arrows'?.18:.35),pulse);}
      return;
    }
    window.GameEngine.Audio?.skill(e,skill,c);
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
      if(type==='whirlwind_aoe')c.knockback=skill.tier===3&&c.pulseIndex===c.pulseCount-1?25:0;

      const damage = this.applyDamage(e, victim, ('weaponSnapshot' in c?c.weaponSnapshot:e.weapon), { baseDamage: Math.min(c.maxDamage??(c.attackSnapshot??this.combatStats(e).attack)*2.1,c.damage*(type==='projectile_explosion'?.85:1)*(1+(c.flankBonus||0))/(1+(c.dotFraction||0))*(victim.currentHp<victim.maxHp*.3?1+(c.executeBonus||0):1)), skill: true, damageBudget:c.damageBudget, magic:c.magic,armorPierce:c.armorPierce,element:c.element,explosion:c.type==='projectile_explosion',projectile,sourceSkill:{id:skill.id,def:skill.def,tier:skill.tier,castId:c.castId??e.skillsCast??0} });
      if (!damage) return;
      if(skill.id==='dark_fireball'){victim.antiHeal=.3;victim.antiHealUntil=(window.GameManager.matchTime||0)+3;}
      if(!victim.isAlive){if(['w_execution_cleave','as_assassinate'].includes(skill.id)&&skill.tier===3)e.currentStamina=Math.min(e.maxStamina,e.currentStamina+12);return;}
      this.tacticalHit(e,victim,skill,c);
      if(c.armorBreak){victim.armorBreak=c.armorBreak;victim.armorBreakTimer=3;}
      if(c.dotFraction)for(let i=1;i<=2;i++)this.schedule(e,i,()=>{if(victim.isAlive)this.applyDamage(e,victim,null,{baseDamage:c.damage*c.dotFraction/(1+c.dotFraction)/2,dot:c.dotKind,reflected:true,magic:c.magic,damageBudget:c.damageBudget});});
      if (victim.invincible || victim.isBerserk || victim.ccImmune || victim.weapon?.ccImmunity) return;
      if(c.breakGuard){victim.guardTimer=0;if(victim.action?.kind==='block')victim.action=null;}
      if(c.conditionalFreeze&&victim.tacticalMarks?.some(m=>m.owner===e&&m.kind==='frost'&&m.stacks>=3)&&!(victim.controlImmunityTimer>0)){victim.stunTimer=window.GameEntities.RelicSystem.control(victim,'stunTimer',c.conditionalFreeze,e);victim.controlImmunityTimer=3;}
      if((c.knockback||c.pull)&&!window.GameEntities.RelicSystem.knockbackImmune(victim)){const direction=c.pull?-1:1,a=Math.atan2(victim.y-e.y,victim.x-e.x),distance=c.knockback||c.pull;window.GameEngine.MapTerrain.moveEntity(victim,Math.cos(a)*distance*direction,Math.sin(a)*distance*direction);}
      if (c.stun && !(victim.controlImmunityTimer > 0)) { victim.stunTimer = window.GameEntities.RelicSystem.control(victim,'stunTimer',c.stun,e); victim.controlImmunityTimer = 3; }
      if (c.slow) { victim.slowPct = c.slow; victim.slowTimer = Math.min(2, c.slowDur || 2); }
      if (c.silenceDur){const sil=window.GameEntities.MythicSystem?.ccDuration(victim,c.silenceDur)??c.silenceDur;victim.silenceTimer=Math.min(window.GameEntities.MythicSystem?.has(victim,'myth_sever')?2.25:1.5,sil);}
    };
      const V = window.GameRenderer.VfxManager,fxo=o=>({fx:skill.id,mon:c.monsterEffect,el:element,tier:skill.tier,tint:V.ownerTint(e),...o});
      if (['teleport', 'teleport_backstab', 'backstep_shot', 'linear_dash', 'dash_stun'].includes(type)) {
        const distance = type === 'backstep_shot' ? -(c.backstep || 45) : Math.min(120, c.distance || c.range * 0.5);
        window.GameEngine.MapTerrain.moveEntity(e,Math.cos(angle)*distance,Math.sin(angle)*distance);
        V.addEffect('dash', originX, originY, fxo({ tx: e.x, ty: e.y, angle, color, life: 0.45 }));
        if(c.cleanseSlow)e.slowTimer=0;
        if(type==='teleport'&&skill.tier>=2){V.addEffect('rune',originX,originY,fxo({radius:22,color,life:1,ph:'after'}));if(skill.tier===3)e.blinkReturn={x:originX,y:originY,until:(window.GameManager.matchTime||0)+1.5};}
      }
      if (['self_heal', 'aura_heal'].includes(type)) {
        const total=(c.healAmount||0)*(window.GameEntities.MythicSystem?.blocksHealing(e)?0:1),anti=1-Math.min(.5,e.antiHealUntil>(window.GameManager.matchTime||0)?e.antiHeal||0:0);
        e.healTimer=3;e.healPerSecond=total*.3/3;
        if(type==='self_heal'){e.healInterruptibleTimer=3;e.healCompleteRank=skill.tier;e.currentHp=Math.min(e.maxHp,e.currentHp+total*.7*anti);}
        if(type==='aura_heal'){e.healTimer=0;if(skill.tier>=2)e.slowTimer=0;e.healingAura=this.field(e,c,originX,originY,{radius:100,life:3,heal:total/3,cleanse:skill.tier>=2,convertible:skill.tier===3,color:'#86efb5'});}
        V.addEffect('heal', e.x, e.y, fxo({ radius: 40, color: '#86efb5', life: 0.9 }));
      } else if (['speed_buff', 'ethereal_speed', 'stealth', 'smoke_cloud'].includes(type)) {
        e.speedBuff = Math.max(e.speedBuffTimer>0?e.speedBuff||0:0,Math.min(.35,c.speedBuff||0));
        e.speedBuffTimer = Math.min(3.5, c.duration || c.stealthDur || 3);
        if (c.waterWalk) e.waterWalkTimer = e.speedBuffTimer;
        if (c.pacify) e.pacifyTimer = e.speedBuffTimer;
        if(type==='stealth')e.stealthTimer=e.speedBuffTimer;
        if(type==='smoke_cloud')this.field(e,c,e.x,e.y,{smoke:true,shape:c.smokeLane?'line':'circle',angle:e.aimAngle,length:100,radius:c.smokeLane?35:65,life:c.duration||2});
        if(type==='ethereal_speed'&&skill.tier>=2)e.slowTimer=0;
        if(c.interrupt){const enemy=window.GameManager.spatialGrid.queryCircle(e.x,e.y,100).find(v=>this.isEnemy(e,v)&&!v.ccImmune&&v.action?.target===e&&!v.action.released);if(enemy)this.interruptChannel(e,enemy);}
        V.addEffect(type === 'smoke_cloud' ? 'smoke' : 'rune', e.x, e.y, fxo({ radius: type === 'smoke_cloud' ? 65 : 40, color, life: 0.8 }));
      } else if (['weapon_buff', 'weapon_swap'].includes(type)) {
        if (type === 'weapon_swap') [e.weapon, e.secondaryWeapon] = [e.secondaryWeapon, e.weapon];
        if(skill.id==='h_armament_swap'){e.armamentDefense=!e.armamentDefense;e.guardTimer=e.armamentDefense?1.3:0;e.guardReduction=.35;}
        e.magicOnHit = skill.id==='h_armament_swap'&&e.armamentDefense?0:c.magicOnHit||0;
        if(skill.id==='h_armament_swap'&&e.armamentDefense)e.guardBudget=Math.min(this.supportHp(e)*.15,15+this.combatStats(e).defense*.5);
        e.enchantedRank=skill.id==='h_enchanted_blade'?skill.tier:0;e.enchantedCharges=e.enchantedRank?2+skill.tier:0;
        e.weaponBuffTimer = c.duration||4;
        if(c.guardReduction&&skill.id!=='h_armament_swap'){e.guardTimer=.8;e.guardReduction=c.guardReduction;}
        V.addEffect('rune', e.x, e.y, fxo({ radius: 28, color, life: 0.6 }));
      } else if (['shield_stance', 'counter_stance', 'mana_shield_toggle', 'stasis'].includes(type)) {
        if(type==='mana_shield_toggle'){e.manaShieldTimer=c.duration||2;e.manaAbsorb=c.manaAbsorb||.3;e.manaShieldBudget=c.shieldAmount;e.manaShieldRank=skill.tier;e.manaAbsorbed=0;}
        else {e.guardTimer=Math.min(1.6,c.duration||c.window||1.2);e.guardReduction=c.guardReduction||.5;e.guardAngle=e.aimAngle;e.guardBudget=c.guardAmount;}
        if(type==='counter_stance'){e.riposteTimer=c.window;e.counterDamage=c.counterAmount;e.counterMultiplier=0;e.riposteReady=true;}
        if(type==='stasis'){e.slowPct=.8;e.slowTimer=e.guardTimer;e.stasisTimer=e.guardTimer;}
        V.addEffect('guard', e.x, e.y, fxo({ radius: 28, angle: e.aimAngle, color: '#8be6ff', life: Math.max(0.8, e.guardTimer||e.manaShieldTimer||0) }));
      } else if (!utility) {
        if(c.monsterEffect){this.resolveMonsterSkill(e,skill,target,c,hit,color);return;}
        if(type==='vortex_pull'){
          this.field(e,c,tx,ty,{life:2,damage:c.damage/4,pull:12,bend:c.bend,tick:.5,magic:true,sourceSkill:{id:skill.id,castId:c.castId}});return;
        }

        if (projectile && !area) this.launchProjectile(e, target, { type: element === 'fire' ? 'fireball' : projectile && e.classId==='archer' ? 'arrow' : 'magic', skillId: skill.id, tier: skill.tier }, { baseDamage: c.damage, skill: true, ownFx: type === 'projectile_explosion', onImpact: victim => {
          if (type === 'projectile_explosion') {
            window.GameManager.spatialGrid.queryCircle(victim.x,victim.y,c.radius).filter(v=>this.isEnemy(e,v)).forEach(hit);
            this.field(e,c,victim.x,victim.y,{life:1.5,damage:c.damage*.05,tick:.5,magic:true,color,sourceSkill:{id:skill.id,castId:c.castId}});
            V.addEffect(element==='fire'?'flame':'impact',victim.x,victim.y,fxo({radius:c.radius,color,life:.6}));window.GameEngine.Audio?.play('impact',victim,element);
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
          const atSelf = directed || c.selfArea || type==='whirlwind_aoe';
          V.addEffect(area ? element === 'fire' ? 'flame' : element === 'ice' ? 'frost' : 'impact' : 'slash', atSelf ? originX : tx, atSelf ? originY : ty, fxo({ radius: c.radius, angle, color, shape: c.shape||(type==='cone_slash'?'cone':undefined), length:c.range, life: 0.7 }));
        }
        if (element === 'fire') window.GameEngine.MapTerrain.bushes.forEach(b => { if (Math.hypot(b.x - tx, b.y - ty) < c.radius) b.isBurned = true; });
      }
  },

  resolveMonsterSkill(e,s,t,c,hit,color){
    const mode=c.monsterEffect,M=window.GameEngine.MapTerrain,G=window.GameManager,V=window.GameRenderer.VfxManager;
    const x=c.tx??t.x,y=c.ty??t.y,angle=c.angle??e.aimAngle,n=c.monsterPulses||3;
    const victims=(cx,cy,r)=>G.spatialGrid.queryCircle(cx,cy,r).filter(v=>this.isEnemy(e,v));
    const pulse=(cx,cy,shape='circle',ratio=1,extra={})=>this.field(e,{...c,shape},cx,cy,{life:.25,tick:10,damage:c.damage*ratio,color,magic:!['line','cone','ring','charge','flurry'].includes(mode),sourceSkill:{id:s.id,castId:c.castId},...extra});
    if(mode==='projectile'){this.launchProjectile(e,t,{type:mode,color,skillId:s.id,tint:V.ownerTint(e),mon:'projectile'},{onImpact:v=>hit(v)},color);return;}
    if(['leap','charge'].includes(mode)){
      M.moveEntity(e,Math.cos(angle)*Math.min(c.range,Math.hypot(x-e.x,y-e.y)),Math.sin(angle)*Math.min(c.range,Math.hypot(x-e.x,y-e.y)));
      pulse(mode==='charge'?c.originX:e.x,mode==='charge'?c.originY:e.y,mode==='charge'?'line':'circle',1,{radius:mode==='charge'?22:65,knockback:25});return;
    }
    if(mode==='mark'){if(Math.hypot(t.x-x,t.y-y)<c.radius){hit(t);t.deathMarkOwner=e;t.deathMarkTimer=5;V.addEffect('rune',t.x,t.y,{mon:'mark',fx:s.id,tint:V.ownerTint(e),radius:24,color,life:2});}return;}
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
        if(!config.ownFx)window.GameRenderer.VfxManager.addEffect('impact', x, y, { fx: weapon?.skillId, mon: weapon?.mon, tint: weapon?.tint, tier: weapon?.tier, radius: 24, color, life: 0.3 });
        return true;
      }
      return false;
    });
  },
  defend(e, kind = 'block', angle = e.aimAngle || 0) {
    if (!e?.isAlive || window.GameEngine.MapTerrain.isInWater(e.x,e.y) || e.action || e.stunTimer > 0 || e.defenseCooldown > 0 || e.currentStamina < (kind==='dodge'&&window.GameEntities.RelicSystem.has(e,'treads')?12.6:18) || kind==='dodge'&&e.dodgeLockedTimer>0) return false;
    if(kind==='block'&&e.turnLockedUntil>(window.GameManager.matchTime||0))angle=e.turnLockedAngle;
    const jet=kind==='dodge'&&window.GameEntities.RelicSystem.has(e,'treads');
    const discount=kind==='dodge'&&e.progression?.dodgeDiscount;e.currentStamina-=discount?9:jet?12.6:18;if(discount)e.progression.dodgeDiscount=false; e.defenseCooldown = kind === 'dodge' ? 2.8 : 2.2; e.aimAngle = angle;
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
    if (!e?.isAlive || window.GameEngine.MapTerrain.isInWater(e.x,e.y) || e.action || !(e.healthPotions||e.fullHealthPotions) || e.potionCooldown > 0 || e.currentHp >= e.maxHp || window.GameEntities.MythicSystem?.blocksPotion(e)) return false;
    const full=e.fullHealthPotions>0;if(full)e.fullHealthPotions--;else e.healthPotions--; e.potionCooldown = 8;
    const factor=window.GameEntities.MythicSystem?.potionFactor(e)??1;
    return this.startAction(e, 'drink', null, () => {
      const hp = (full?e.maxHp-e.currentHp:Math.min(220, e.maxHp * 0.35))*factor;
      e.currentHp = Math.min(e.maxHp, e.currentHp + hp);
      window.GameEntities.MythicSystem?.onPotion(e);
      window.GameEngine.Audio?.play('potion',e);
      window.GameRenderer.VfxManager.addEffect('heal', e.x, e.y, { radius: 35, color: '#86efb5', life: 0.8 });
      window.GameRenderer.VfxManager.addDamageNumber(e.x, e.y - 20, '+' + Math.round(hp), 'heal');
    }, { windup: window.GameEntities.MythicSystem?.drinkWindup(e)??0.65, active: 0.1, recovery: 0.15, style: 'unarmed' });
  },
  underAttack(e) {
    if (!e) return false;
    const now = window.GameManager.matchTime || 0;
    if (e.combatLease > 0 || e.stunTimer > 0) return true;
    if (now - (e.lastDamageTakenAt ?? -Infinity) < 0.75) return true;
    if (e.action && ['attack', 'skill'].includes(e.action.kind)) return true;
    const near = window.GameManager.spatialGrid?.queryCircle(e.x, e.y, 180) || [];
    return near.some(t => t !== e && t.isAlive && this.isEnemy(t, e) && (t.targetEnemy === e || t.action?.target === e));
  },
  healthRegenRate(e, source = 'total', field = null) {
    if (!e?.isAlive||e.isPawn&&window.GameEntities.MythicSystem?.blocksHealing(e)) return 0;
    const now = window.GameManager.matchTime || 0;
    if (source === 'idle') return (e.isMonster ? e.maxHp * ({3:.01,4:.03,5:.05}[e.tier] || 0) || 1 : 1) + this.bonusHealthRegen(e);
    if (source === 'base') return e.isSplit ? 0 :
      (e.targetEnemy?.isAlive && this.canSee(e,e.targetEnemy) || e.combatLease > 0 || e.action?.target && e.action.duration > e.action.elapsed ? 1 + this.bonusHealthRegen(e) : this.healthRegenRate(e,'idle'));
    if (source === 'hot') return e.healTimer > 0 ? e.healPerSecond || 0 : 0;
    if (source === 'nano') return window.GameEntities.RelicSystem.has(e,'nano') && now - (e.lastDamageTakenAt ?? -Infinity) >= 3 ? e.maxHp * .015 : 0;
    if (source === 'meditation') return e.isPawn && e.meditating && e.currentHp < e.maxHp * .75 && !this.underAttack(e) ? e.maxHp * .08 : 0;
    if (source === 'total') {
      if (e.isSplit) return e.clones.reduce((sum,c) => sum + this.healthRegenRate(c),0);
      // Instant heals and damage are separate from the active HP/s rate.
      return ['base','hot','nano','meditation','blood','burst'].reduce((sum,key) => sum + this.healthRegenRate(e,key),0) +
        this.fields.reduce((sum,f) => sum + this.healthRegenRate(e,'aura',f),0);
    }
    if (source === 'aura') return field?.heal && field.life > 0 && field.delay <= 0 && field.owner.isAlive &&
      (e === field.owner || e === field.owner.allyPawn) && this.fieldContains(field,e.x,e.y) ?
      field.heal * (e === field.owner ? 1 : .5) * (1 - Math.min(.5,e.antiHealUntil > now ? e.antiHeal || 0 : 0)) : 0;
    if (e.isSplit || now - (e.lastHostileAt ?? -Infinity) >= 6 || window.GameEngine.MapTerrain.isInWater(e.x,e.y)) return 0;
    const blood = this.passiveList(e).find(p => p.id === 'p_blood_body');
    if (!blood) return 0;
    const multiplier = 1 - Math.min(.5,Math.max(0,e.antiHealUntil > now ? e.antiHeal || 0 : 0));
    if (source === 'blood') return Math.min(this.supportHp(e) * .012,this.passiveConfig(e,blood).regenAmount) * multiplier;
    return e.progression?.bloodRemaining > 0 ? e.progression.bloodRate * multiplier /
      (e.isAncientClone ? Math.max(1,e.ancientOwner.clones.filter(q => q.isAlive).length) : 1) : 0;
  },
  tickMeditation(e, dt) {
    if (!e.isPawn || !e.meditating) return;
    if (this.underAttack(e)) { e.meditating = false; e.objective = 'Thiền định bị ngắt'; return; }
    const cap = e.maxHp * 0.75;
    if (e.currentHp >= cap) { e.currentHp = cap; e.meditating = false; e.objective = 'Xong thiền định'; return; }
    e.currentHp = Math.min(cap, e.currentHp + this.healthRegenRate(e,'meditation') * dt);
    if (e.currentHp >= cap) { e.meditating = false; e.objective = 'Xong thiền định'; }
    e.vx = e.vy = 0; e.navPath = [];
  },
  updateStatus(e, dt) {
    if(!e.isAlive)return;
    this.tickProgression(e,dt);this.tickSpecies(e,dt);
    window.GameEntities.RelicSystem.update(e,dt);if(!e.isAlive)return;
    if(!e.isSplit){
      const engaged=e.targetEnemy?.isAlive&&this.canSee(e,e.targetEnemy);
      const combatTime=engaged?dt:Math.min(dt,Math.max(e.combatLease||0,e.action?.target?e.action.duration-e.action.elapsed:0));
      const regen=window.GameEntities.MythicSystem?.regenFactor(e)??1;
      e.currentHp=Math.min(e.maxHp,e.currentHp+regen*(combatTime*(1+this.bonusHealthRegen(e))+(dt-combatTime)*this.healthRegenRate(e,'idle')));
    }
    window.GameEntities.MythicSystem?.tick(e,dt);
    if(e.isHiding&&!this.canHideInBush(e))e.isHiding=false;
    if(e.ccImmune)e.stunTimer=e.slowTimer=e.silenceTimer=e.panicTimer=0;
    if(window.GameEntities.MythicSystem?.immuneHardCC(e))e.stunTimer=0;
    for (const k of ['relicInterrupt','relicSlowTimer','riposteTimer','manaShieldTimer','panicTimer','auraSlowTimer','dodgeLockedTimer','armorBreakTimer','healInterruptibleTimer','stasisTimer','deathMarkTimer','globalSkillCooldown', 'combatLease', 'stunTimer', 'slowTimer', 'silenceTimer', 'speedBuffTimer', 'waterWalkTimer', 'pacifyTimer', 'weaponBuffTimer', 'stealthTimer', 'guardTimer', 'controlImmunityTimer', 'defenseCooldown', 'potionCooldown', 'attackCooldown', 'hitFlashTimer']) e[k] = Math.max(0, (e[k] || 0) - dt);
    for (const p of this.passiveList(e)) if(!e.isAncientClone)p.cooldownTimer=Math.max(0,(p.cooldownTimer||0)-dt);
    for (const s of e.skills || []) s.cooldownTimer = Math.max(0, (s.cooldownTimer || 0) - dt);
    if (e.healTimer > 0) { const time = Math.min(dt, e.healTimer); if(!window.GameEntities.MythicSystem?.blocksHealing(e))e.currentHp = Math.min(e.maxHp, e.currentHp + this.healthRegenRate(e,'hot') * time); e.healTimer -= time; }
    this.tickMeditation(e, dt);
    if(e.sporeExposure>0&&!this.fields.some(f=>f.spore&&this.fieldContains(f,e.x,e.y)))e.sporeExposure=Math.max(0,e.sporeExposure-dt);
    if(e.guardAdvanceUntil>(window.GameManager.matchTime||0)&&!e.action&&e.targetEnemy?.isAlive){const angle=Math.atan2(e.targetEnemy.y-e.y,e.targetEnemy.x-e.x);window.GameEngine.MapTerrain.moveEntity(e,Math.cos(angle)*20*dt,Math.sin(angle)*20*dt);}
    if(e.turnLockedUntil>(window.GameManager.matchTime||0))e.aimAngle=e.turnLockedAngle;if(e.armorBreakTimer<=0)e.crackOwner=null;
    const a = e.action;
    if (!a) return;
    if(a.movingShot){const direction=a.angle+Math.PI/2;window.GameEngine.MapTerrain.moveEntity(e,Math.cos(direction)*20*dt,Math.sin(direction)*20*dt);}
    if(a.skillId==='w_whirlwind'&&(e.skills.find(s=>s.id===a.skillId)?.tier||1)>=2&&a.released&&a.target?.isAlive){const angle=Math.atan2(a.target.y-e.y,a.target.x-e.x);window.GameEngine.MapTerrain.moveEntity(e,Math.cos(angle)*15*dt,Math.sin(angle)*15*dt);}
    if (['attack','skill'].includes(a.kind)&&window.GameEngine.MapTerrain.isInWater(e.x,e.y)) {e.action=null;e.attackState=null;return;}
    if (e.stunTimer > 0 && !e.isBerserk) { e.action = null; e.attackState = null; return; }
    a.elapsed += dt; e.attackState.progress = Math.min(1, a.elapsed / a.duration);
    if (a.kind === 'dodge') {
      const p = Math.min(1, a.elapsed / 0.3), ease = 1 - (1 - p) ** 2;
      window.GameEngine.MapTerrain.moveEntity(e,a.originX+a.dodgeX*ease-e.x,a.originY+a.dodgeY*ease-e.y);
    }
    if (!a.released && a.elapsed >= a.windup) { a.released = true; if(a.kind==='attack')window.GameEngine.Audio?.attackRelease(e,a); a.resolve(); }
    if (a.elapsed >= a.duration) {if(['attack','skill'].includes(a.kind)&&a.target?.isAlive&&this.canSee(a.target,e)&&(e.lastDamageDealtAt??-Infinity)<(a.startedAt??0))this.progressionEvent(a.target,e,'opening'); e.action = null; e.attackState = null; }
  },
  applyDamage(a, t, weapon, c = {}) {
    if (!a || !t) return 0;
    if (c.mythicBomb){ if(!this.isEnemy(a,t)) return 0; const den=this.bossDen(t)||this.bossDen(a); if(den&&(!this.insideDen(a,den)||!this.insideDen(t,den)))return 0; }
    else if (!this.canEngage(a,t) || t.invincible || t.relicInvulnerable>0 || !this.reserveCombat(a,t)) return 0;
    if(t.phoenixEgg){const dealt=Math.max(1,c.baseDamage??this.combatStats(a).attack);t.phoenixEgg.hp-=dealt;a.lastHostileAt=t.lastHostileAt=window.GameManager.matchTime||0;window.GameRenderer.VfxManager.addDamageNumber(t.x,t.y,dealt,'normal');if(t.phoenixEgg.hp<=0){t.phoenixEgg=null;t.currentHp=0;this.handleDeath(a,t);}return dealt;}
    if(t.afterimageReady&&c.projectile&&!c.dot&&t.action?.kind==='dodge'){t.afterimageReady=0;return 0;}
    if (t.action?.kind === 'dodge' && t.action.elapsed < 0.3) {
      if(t.windShotUntil>(window.GameManager.matchTime||0))t.movingShotReady=true;this.progressionEvent(t,a,'dodge',c);this.counterOpening(t,a);window.GameRenderer.VfxManager.addDamageNumber(t.x,t.y-15,'NÉ','block');window.GameEngine.Audio?.play('evade',t);return 0;
    }
    const Mythic=window.GameEntities.MythicSystem;
    if(c.dot&&['poison','burn','bleed'].includes(c.dot)&&Mythic?.has(t,'myth_sever'))return 0;
    if(Mythic?.tryEvade(t,c)){window.GameRenderer.VfxManager.addDamageNumber(t.x,t.y-15,'NÉ','block');return 0;}
    const hpBefore=t.currentHp;
    let raw=c.baseDamage??this.combatStats(a).attack;
    if(t.icePieceReady&&c.projectile){t.icePieceReady=false;raw*=.8;}
    if(t.preciseGuardUntil>(window.GameManager.matchTime||0)&&!c.dot&&t.guardTimer>0){t.preciseGuardUntil=0;this.counterOpening(t,a);}
    if (!c.trueDamage && a.weaponBuffTimer > 0&&!c.dot&&!c.reflected){
      raw+=a.magicOnHit||0;
      const token=c.sourceSkill?.castId!==undefined?'cast:'+c.sourceSkill.castId:'attack:'+(c.actionId??a.action?.id);
      if(a.enchantedCharges>0&&a.lastChargedCast!==token){a.lastChargedCast=token;a.enchantedCharges--;
        if(a.enchantedRank>=2){const kind=a.enchantedElement==='fire'?'fire':'frost',mark=this.markTarget(a,t,kind),last=a.enchantedRank===3&&a.enchantedCharges===0;
          if(kind==='fire'){const budget=Math.min(raw*.15,(a.magicOnHit||0)*.5);raw-=budget;this.field(a,{radius:last?45:25,element:'fire',damageBudget:c.damageBudget},t.x,t.y,{damage:budget,life:1.1,tick:1});}
          else if(!t.ccImmune){t.slowTimer=1;t.slowPct=.15;if(last&&mark.stacks>=2)this.field(a,{radius:40,element:'ice'},t.x,t.y,{slow:.25,life:1.5});}
          if(last)mark.stacks=0;
        }
        if(a.enchantedCharges===0)a.weaponBuffTimer=0;
      }
    }
    if (!c.trueDamage && a.currentHp < a.maxHp * 0.25) raw *= 1 + (window.GameData.Traits[a.trait]?.lowHpDamageBonus || 0);
    const prepared=Mythic?.beforeHit(a,c)||{};
    c.mythicHit=prepared;
    if(prepared.armEdge&&a)Mythic.state(a).edgeReadyAt=(window.GameManager.matchTime||0)+5;
    const crit = !c.trueDamage && (prepared.forceCrit || (!prepared.noCrit && Math.random() < this.critChance(a)));
    if (crit) raw *= prepared.critMult || 1.35;
    const ambush=this.passiveList(a).find(p=>p.type==='ambush'&&p.cooldownTimer<=0);
    if(!c.trueDamage&&ambush&&window.GameEngine.MapTerrain.isInBush(a.x,a.y)){raw*=1+.2*(a.passiveMultiplier||1);ambush.cooldownTimer=ambush.cooldown;}
    const M=window.GameEngine.MapTerrain;
    if(!c.trueDamage&&M.isOnCliff(a.x,a.y)&&!M.isOnCliff(t.x,t.y))raw*=1.1;
    const bossRange=this.bossDamageRange(a);
    if(bossRange)raw=Math.min(raw,bossRange[1]);
    if(c.damageBudget){const used=c.damageBudget.spent.get(t.id)||0;raw=Math.min(raw,Math.max(0,c.damageBudget.limit-used));if(raw<=0)return 0;c.damageBudget.spent.set(t.id,used+raw);}
    const armor=(c.magic?this.combatStats(t,a).magicDefense:this.combatStats(t,a).defense)*(1-Math.min(.6,c.armorPierce??weapon?.armorPierce??0));
    let damage=c.trueDamage?raw:raw*100/(100+armor);
    if(!c.trueDamage&&t.manaShieldTimer>0){const absorbed=Math.min(t.currentMana,t.manaShieldBudget??Infinity,damage*(t.manaAbsorb||.3));t.manaAbsorbed=(t.manaAbsorbed||0)+absorbed;t.currentMana-=absorbed;t.manaShieldBudget=Math.max(0,(t.manaShieldBudget??Infinity)-absorbed);damage-=absorbed;}
    if(!c.trueDamage&&Math.hypot(a.x-t.x,a.y-t.y)>90 && M.isInBush(t.x,t.y))damage*=.85;

    if (!c.trueDamage && (t.action?.kind === 'block' || t.guardTimer > 0)) {
      const incoming = Math.atan2(a.y - t.y, a.x - t.x);
      if (Math.cos(incoming - (t.action?.angle ?? (t.guardTimer>0?t.guardAngle??t.aimAngle:t.aimAngle))) > 0.25) {
        window.GameEngine.Audio?.play('block',t,c.magic||c.element?'magic':this.weaponStyle(a));
        this.progressionEvent(t,a,'block',c);
        const desired=damage*(t.action?.kind==='block'?.7:t.guardReduction??.7),absorbed=Math.min(desired,t.guardBudget===undefined?desired:Math.max(0,t.guardBudget));
        damage-=absorbed;this.counterOpening(t,a);
        if(t.guardBudget!==undefined){t.guardBudget-=absorbed;if(t.guardBudget<=0)t.guardTimer=0;}
        if(t.riposteReady&&t.riposteTimer>0&&!c.reflected){t.riposteReady=false;this.applyDamage(t,a,null,{baseDamage:t.counterDamage??this.combatStats(t).attack*t.counterMultiplier,reflected:true});}
        window.GameRenderer.VfxManager.addEffect('guard', t.x, t.y, { angle: incoming, radius: 30, color: '#8be6ff', life: 0.3 });
        window.GameRenderer.VfxManager.addDamageNumber(t.x, t.y - 20, 'ĐỠ', 'block');
      }
    }
    const shell=this.passiveList(t).find(p=>p.type==='shell'&&p.cooldownTimer<=0);
    if(shell&&!c.trueDamage){damage-=Math.min(8,damage*.25,2+this.combatStats(t).defense*.1)*(t.passiveMultiplier||1);shell.cooldownTimer=shell.cooldown;}
    damage=window.GameEntities.RelicSystem.modifyDamage(a,t,damage);
    damage=window.GameEntities.AncientSystem.incoming(a,t,Math.max(1,damage),c,weapon);
    damage=window.GameEntities.RelicSystem.incoming(a,t,damage,c);
    if(bossRange||c.damageBudget)damage=Math.min(damage,raw);
    damage=Mythic?.onDamage(a,t,damage,c,raw,armor)??damage;
    if(damage<=0)return 0;
    const now=window.GameManager.matchTime||0;
    const aura=t.healingAura;if(aura?.convertible&&aura.life>0&&this.fieldContains(aura,t.x,t.y)&&t.currentHp-damage<t.maxHp*.4){const budget=Math.min(t.maxHp*.08,aura.heal*aura.life);aura.life=0;aura.convertible=false;t.progression=t.progression||{};t.progression.shield=budget;t.progression.shieldUntil=now+1;t.progression.shieldAngle=Math.atan2(a.y-t.y,a.x-t.x);}
    const ps=t.progression;
    if(ps?.shieldUntil>now&&ps.shield>0&&Math.cos(Math.atan2(a.y-t.y,a.x-t.x)-(ps.shieldAngle??t.aimAngle))>.25){const absorbed=Math.min(ps.shield,damage);damage-=absorbed;ps.shield=0;if(ps.armorRank===3){ps.strideUntil=now+1;ps.strideRank=1;ps.armorRank=0;}if(damage<=0)return 0;}
    damage=Math.max(1,Math.round(damage));
    if(c.damageBudget){const used=c.damageBudget.dealt.get(t.id)||0;damage=Math.min(damage,Math.max(0,Math.floor(c.damageBudget.limit)-used));if(damage<=0)return 0;c.damageBudget.dealt.set(t.id,used+damage);}
    t.currentHp = Math.max(0, t.currentHp - damage);
    if((t.mythicImmortal||0)>(window.GameManager.matchTime||0))t.currentHp=Math.max(1,t.currentHp);
    a.lastHostileAt=t.lastHostileAt=window.GameManager.matchTime||0;
    const blood=this.passiveList(t).find(p=>p.id==='p_blood_body'),bs=t.progression||(t.progression={});
    if(t.currentHp>0&&blood?.tier>=2&&!bs.bloodLocked&&blood.cooldownTimer<=0&&!window.GameEngine.MapTerrain.isInWater(t.x,t.y)){const threshold=blood.tier===3?.4:.35;if(hpBefore>t.maxHp*threshold&&t.currentHp<=t.maxHp*threshold){bs.bloodRemaining=blood.tier===3?3:4;bs.bloodRate=this.passiveConfig(t,blood).burstAmount/bs.bloodRemaining;bs.bloodLocked=true;bs.procUntil=(window.GameManager.matchTime||0)+2;blood.cooldownTimer=60;}}
    c={...c,hpBefore};
    a.lastDamageTarget=t;a.lastDamageDealtAt=window.GameManager.matchTime||0;t.lastDamageTakenAt=window.GameManager.matchTime||0;
    window.GameEngine.Audio?.play('hit',t,c.dot||c.element||(c.magic?'magic':this.weaponStyle(a)),{crit,big:damage/t.maxHp});
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
    if(damage>0)Mythic?.afterHit(a,t,damage,c);
    const successionKill=!t.isAlive&&(t.isDemonKing||a.isDemonKing&&t===window.GameEntities.AncientSystem.original);
    if(a.isAlive && !t.isAlive && !successionKill)this.progressionEvent(a,t,'kill',c);
    if(a.isAlive&&t.isAlive&&!c.skill&&!c.dot&&!c.reflected&&a.nextAttackStride){const step=a.nextAttackStride;a.nextAttackStride=0;const direction=Math.atan2(t.y-a.y,t.x-a.x)+(a.armamentDefense?Math.PI:Math.PI/2);M.moveEntity(a,Math.cos(direction)*step,Math.sin(direction)*step);}
    if(a.isAlive && t.isAlive) {this.triggerPassives(a,t,damage,false,c);this.triggerPassives(t,a,damage,true,c);}
    return damage;
  },
  counterOpening(defender,attacker){
    this.progressionEvent(defender,attacker,'opening');
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
    if(victim.defId==='eternal_solar_phoenix'&&!victim.phoenixReborn){victim.phoenixReborn=true;victim.currentHp=1;victim.action=null;victim.attackState=null;victim.stasisTimer=4;victim.phoenixEgg={hp:80,until:(window.GameManager.matchTime||0)+4};window.GameRenderer.VfxManager.addEffect('rune',victim.x,victim.y,{radius:48,color:'#ffb449',life:4});return;}
    if (!victim.isAncient && victim.armor?.reviveOnce && !victim.hasRevived) { victim.hasRevived = true; victim.currentHp = victim.maxHp * 0.2; return; }
    if (window.GameEntities.MythicSystem?.tryDefiant(victim)) return;
    const duel=victim.isDemonKing||window.GameEntities.AncientSystem.demonKingFight&&victim===window.GameEntities.AncientSystem.original;
    window.GameEngine.Audio?.play('death',victim,undefined,{tier:victim.tier});
    victim.isAlive = false; victim.action = null;
    window.GameEntities.MythicSystem?.explode(victim);
    if(killer?.isAlive)window.GameEntities.MythicSystem?.onKill(killer,victim);
    if(duel){
      window.GameRenderer.VfxManager.addBurstParticles(victim.x, victim.y, '#d8c4a3', 12);
      window.GameEntities.AncientSystem.clearDuelHazards();
      window.GameUI.CombatTicker.log('💀 ' + victim.name + ' bị hạ bởi ' + (killer?.name || 'Thiên tai') + '.');
      if(victim.isDemonKing)window.GameEntities.AncientSystem.showDemonVictory();
      else window.GameEntities.AncientSystem.showDemonDefeat();
      return;
    }
    if(victim.isMonster&&victim.tier>=4&&victim.territory)victim.territory.isCleared=true;
    window.GameRenderer.VfxManager.addBurstParticles(victim.x, victim.y, '#d8c4a3', 12);
    if (killer?.isPawn&&!victim.isAncient&&!victim.isAncientClone) {
      this.rewardBotKill(killer,victim);
      const exp = victim.isPawn ? Math.max(1,victim.level||1)*100
        : victim.expRewardPerLevel ? victim.expRewardPerLevel*Math.max(1,killer.level||1)
        : victim.expReward??60;
      killer.currentExp += exp;
      this.checkLevelUp(killer); killer.killCount = (killer.killCount || 0) + 1; window.GameAI.EmotionEngine.onKillOrLoot(killer, victim.dropTier || 'rare');
    }
    if(victim.isMonster&&killer?.isPawn)for(const pawn of window.GameManager.pawns||[])if(pawn!==killer&&pawn.isAlive&&(pawn.targetEnemy===victim||pawn.plan?.target===victim))window.GameAI.AIBrain.noteGrudge(pawn,killer,'kill');
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
      p.level++; p.unspentSkillPoints++;
      window.GameAI.AIBrain.handleLevelingAndSkills(p);
      const g=this.levelGrowth(p);
      p.maxHp += Math.round(g.hp); p.currentHp = p.maxHp; p.attack += Math.round(g.attack); p.defense += Math.round(g.defense);
      p.critChance=(p.critChance||0)+g.crit; p.maxMana=(p.maxMana||0)+Math.round(g.mana); p.currentMana=Math.min(p.maxMana,(p.currentMana||0)+Math.max(0,Math.round(g.mana)));
      p.skillPower=(p.skillPower||0)+Math.round(g.skill); p.hpRegen=(p.hpRegen||0)+g.hpRegen;
      window.GameEntities.MythicSystem?.offer(p);
      p.currentHp=Math.min(p.currentHp,p.maxHp);
      window.GameRenderer.VfxManager.addEffect('heal', p.x, p.y, { radius: 36, color: '#ffe5a4', life: 0.8 });
      window.GameUI.CombatTicker.log('⭐ ' + p.name + ' lên cấp ' + p.level + ', hồi đầy máu.');
    }
  },
  dropLootOnDeath(v) {
    if (!v.isMonster || v.isAncient || v.isAncientClone) return;
    if (v.tier === 5 && window.GameManager.demonKing) {
      if (v.successionLooted) return;
      v.successionLooted = true;
      const G = window.GameManager, relics = Object.values(window.GameData.Equipments.relics);
      const weapons = relics.filter(e => e.slot === 'weapon'), bodies = relics.filter(e => e.slot === 'body');
      const weapon = G.spawnDropItem(v.x - 24, v.y, weapons[Math.floor(Math.random() * weapons.length)], 'weapon');
      const armor = G.spawnDropItem(v.x + 24, v.y, bodies[Math.floor(Math.random() * bodies.length)], 'body');
      const potions = [0, 1, 2].map(i => G.spawnDropItem(v.x + (i - 1) * 28, v.y + 36, this.potion, 'potion'));
      for (const item of [weapon, armor, ...potions]) item.successionPrep = true;
      const bundle = { weapon, armor, potions };
      window.GameEntities.AncientSystem.successionLoot = bundle;
      return;
    }
    if (Math.random() >= [0, 0.2, 0.3, 0.4, 1, 1][v.tier]) return;
    const G = window.GameManager, D = window.GameData.Equipments;
    if (v.tier >= 4) G.spawnDropItem(v.x - 14, v.y, this.potion, 'potion');
    else if (Math.random() < 0.45) { G.spawnDropItem(v.x, v.y, this.potion, 'potion'); return; }
    if(v.tier===5){
      const weapons=Object.values(D.weapons).filter(e=>e.tier==='god');
      const weapon=D.weapons[v.godArtifactId]||weapons[Math.floor(Math.random()*weapons.length)];
      const bodies=Object.values(D.armors).filter(e=>e.tier==='god'&&e.slot==='body');
      const heads=Object.values(D.armors).filter(e=>e.tier==='god'&&e.slot==='head');
      const armor=bodies[Math.floor(Math.random()*bodies.length)];
      const helmet=heads[Math.floor(Math.random()*heads.length)];
      for(const [i,equipment] of [weapon,armor,helmet].entries())if(equipment)G.spawnDropItem(v.x+(i-1)*32,v.y+20,equipment,equipment.slot||'weapon');
      return;
    }
    const pool = [...Object.values(D.weapons), ...Object.values(D.armors)].filter(e => e.tier === v.dropTier);
    const equipment = pool[Math.floor(Math.random() * pool.length)];
    if (equipment) G.spawnDropItem(v.x + (v.tier >= 4 ? 14 : 0), v.y, equipment, equipment.slot || 'weapon');
  }
};
