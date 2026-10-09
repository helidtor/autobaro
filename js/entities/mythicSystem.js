window.GameEntities = window.GameEntities || {};
// Luật thần thoại: chọn ở cấp 10 và 15, không bậc, tối đa hai.
window.GameEntities.MythicSystem = {
 has(e,id){return !!e?.isPawn && (e.mythics||[]).includes(id);},
 state(e){return e.mythicState||(e.mythicState={});},
 def(id){return (window.GameData.MythicSkills||[]).find(s=>s.id===id);},
 conflicts(a,b){return (window.GameData.MythicConflicts||[]).some(pair=>pair.includes(a)&&pair.includes(b));},
 now(){return window.GameManager?.matchTime||0;},
 enemies(e,radius){
  const G=window.GameManager,C=window.GameEntities.CombatSystem;
  if(!G||!C)return [];
  return [...(G.pawns||[]),...(G.monsters||[])].filter(t=>t!==e&&t.isAlive&&C.isEnemy(e,t)&&Math.hypot(t.x-e.x,t.y-e.y)<=radius);
 },
 living(id){
  const G=window.GameManager;
  return [...(G?.pawns||[]),...(G?.monsters||[])].find(e=>e.isAlive&&e.id===id)||null;
 },
 offer(p){
  if(!p?.isPawn||(p.level!==10&&p.level!==15))return;
  p.mythicPicks=p.mythicPicks||{};
  if(p.mythicPicks[p.level])return;
  const owned=p.mythics||[];
  let pool=(window.GameData.MythicSkills||[]).filter(s=>!owned.includes(s.id)&&!owned.some(id=>this.conflicts(id,s.id)));
  if(pool.length<3)pool=(window.GameData.MythicSkills||[]).filter(s=>!owned.includes(s.id));
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  const options=pool.slice(0,Math.min(3,pool.length));
  if(!options.length)return;
  const P=p.personality||{};
  const ranked=options.map(s=>{
   let score=Object.entries(s.axes||{}).reduce((sum,[axis,weight])=>sum+(P[axis]||0)*weight,0)+Math.random()*25;
   if(s.id==='myth_dual'&&!['super_rare','supreme','god','ancient'].includes(p.weapon?.tier))score-=80;
   return {s,score};
  }).sort((a,b)=>b.score-a.score);
  const pick=ranked[0].s;
  p.mythics=[...owned,pick.id];
  p.mythicPicks[p.level]=pick.id;
  const entry={level:p.level,picked:pick.id,options:options.map(s=>s.id)};
  p.mythicLog=[...(Array.isArray(p.mythicLog)?p.mythicLog:[]),entry];
  this.onAcquire(p,pick.id);
  const skipped=options.filter(s=>s!==pick).map(s=>s.name).join(', ');
  window.GameUI?.CombatTicker?.log('✦ '+p.name+' cấp '+p.level+' nhận '+pick.name+(skipped?' — bỏ '+skipped:'')+'.');
 },
 onAcquire(p,id){
  const s=this.state(p);
  if(id==='myth_bomb'&&!s.bombCut){s.bombCut=true;p.maxHp=Math.max(1,Math.round(p.maxHp*.85));p.currentHp=Math.min(p.currentHp,p.maxHp);}
  if(id==='myth_dual'){
   s.dualLocked=true;
   const bonus=(p.weapon?.hp||0)+(p.secondaryWeapon?.hp||0);
   if(bonus){p.maxHp+=bonus;p.currentHp=Math.min(p.maxHp,p.currentHp+bonus);}
  }
  if(id==='myth_edge')s.edgeReadyAt=0;
 },
 astralSkill(p){return (p.skills||[]).find(s=>s.def&&!['heal','defense','mobility','buff'].includes(s.def.role));},
 adjustSkill(e,skill,c){
  if(!this.has(e,'myth_astral')||skill!==this.astralSkill(e)&&skill?.id!==this.astralSkill(e)?.id)return;
  c.radius=Math.min(140,(c.radius||50)*1.3);
  c.range=Math.min(280,Math.max(c.range||0,(c.radius||50))*1.3);
  c.cooldown=(c.cooldown||6)*1.4;
 },
 adjustRange(e,range){return range+(this.has(e,'myth_ballista')?70:0);},
 attackInterval(e,weaponSpeed){
  let speed=weaponSpeed||.9;
  if(e.isAncient&&e.ancientKind==='colossus'&&e.phase===2)speed*=1.5;
  if(e.relicState?.tomeSlow?.timer>0)speed*=1-e.relicState.tomeSlow.stacks*.15;
  if(this.has(e,'myth_frenzy'))speed*=1.4;
  if(this.has(e,'myth_mirror'))speed*=.8;
  if(this.has(e,'myth_dual')&&e.weapon?.speed)speed*=(1+(e.weapon.speed-1)*2)/e.weapon.speed;
  const floor=this.has(e,'myth_frenzy')?.45:(e.isAncient?.25:.7);
  return Math.max(floor,1/speed);
 },
 globalCooldown(e){return this.has(e,'myth_frenzy')?1.2:1.8;},
 blocksDash(e,type){return this.has(e,'myth_adamant')&&['teleport','teleport_backstab','linear_dash','dash_stun','backstep_shot'].includes(type);},
 blocksWeaponLoot(e){return this.has(e,'myth_dual');},
 immuneHardCC(e){return this.has(e,'myth_adamant');},
 ccDuration(e,duration){return this.has(e,'myth_sever')?duration*1.5:duration;},
 inCombat(e){const C=window.GameEntities.CombatSystem;return !!(e.combatLease>0||e.underAttack&&C?.underAttack(e)||(e.lastDamageTakenAt!=null&&this.now()-(e.lastDamageTakenAt)<6)||e.action&&['attack','skill'].includes(e.action.kind));},
 regenFactor(e){
  if(this.has(e,'myth_glutton'))return 0;
  if(this.has(e,'myth_harvest')&&this.inCombat(e))return 0;
  if(this.insideEnemyArray(e))return 0;
  return 1;
 },
 potionFactor(e){
  let n=1;
  if(this.has(e,'myth_glutton'))n*=.4;
  if(this.has(e,'myth_alchemy'))n*=2;
  return n;
 },
 blocksPotion(e){return this.has(e,'myth_harvest')&&this.inCombat(e)||this.insideEnemyArray(e);},
 blocksHealing(e){return this.has(e,'myth_harvest')&&this.inCombat(e)||this.insideEnemyArray(e);},
 onEquipment(p){
  if(!this.has(p,'myth_elixir'))return;
  const s=this.state(p);
  const atk=Math.min(2,20-(s.elixirAttack||0));
  const hp=Math.min(15,150-(s.elixirHp||0));
  if(atk<=0&&hp<=0)return;
  s.elixirAttack=(s.elixirAttack||0)+Math.max(0,atk);
  s.elixirHp=(s.elixirHp||0)+Math.max(0,hp);
  p.maxHp+=(Math.max(0,hp));
  p.currentHp=Math.min(p.maxHp,p.currentHp+Math.max(0,hp));
 },
 drinkWindup(e){return this.has(e,'myth_alchemy')?1.85:.65;},
 onPotion(e){if(!this.has(e,'myth_alchemy'))return;const s=this.state(e);s.alchemyUntil=this.now()+10;},
 moveSpeed(e,speed){
  if(!e?.isPawn)return speed;
  const s=this.state(e);
  if(s.stone==='stone'||s.stone==='exit')return 0;
  if(this.has(e,'myth_adamant'))speed*=.65;
  if(this.has(e,'myth_quake'))speed-=20;
  if(this.has(e,'myth_lightning'))speed+=40;
  if(this.has(e,'myth_lone')&&this.enemies(e,200).length===1)speed*=1.15;
  if((s.evadeUntil||0)>this.now())speed*=1.2;
  return Math.max(0,speed);
 },
 adjustStats(e,stats){
  if(!e?.isPawn)return stats;
  const s=this.state(e);
  if(this.has(e,'myth_void'))stats.defense=stats.magicDefense=0;
  if(this.has(e,'myth_adamant'))stats.defense+=40;
  if(this.has(e,'myth_stone')&&s.stone==='stone')stats.defense+=50;
  stats.attack+=(s.harvestAttack||0)+(s.elixirAttack||0)+((s.alchemyUntil||0)>this.now()?8:0);
  if(this.has(e,'myth_dual')){
   for(const w of [e.weapon,e.secondaryWeapon])if(w){stats.attack+=w.attack||0;stats.defense+=w.defense||0;stats.skillPower+=(w.skillPower||0)+(w.magicPower||0);}
  }
  stats.range=this.adjustRange(e,stats.range);
  return stats;
 },
 blocksAction(e){const s=e&&this.state(e);return s?.stone==='stone'||s?.stone==='exit';},
 requestExit(e){const s=this.state(e);if(s.stone==='stone'){s.stone='exit';s.stoneTime=.8;}},
 payBlood(e,kind){
  if(!this.has(e,'myth_blood'))return;
  const cost=Math.max(1,e.maxHp*(kind==='skill'?.03:.02));
  e.currentHp=Math.max(1,e.currentHp-cost);
 },
 beforeHit(a,c){
  if(!a?.isPawn||c?.dot||c?.reflected)return {};
  const s=this.state(a),out=[];
  const add=(id,amount)=>{if(this.has(a,id)&&amount)out.push(amount);};
  add('myth_blood',.15);add('myth_glass',.35);add('myth_frenzy',-.2);add('myth_defiant',s.defiantUsed?0:-.12);
  if(this.has(a,'myth_lone'))out.push(this.enemies(a,200).length===1?.25:-.2);
  if(this.has(a,'myth_edge'))out.push((s.edgeReadyAt||0)<=this.now()?0:-.15);
  if((s.karmaUntil||0)>this.now())out.push(-.3);
  if((s.arrayPenaltyUntil||0)>this.now())out.push(-.25);
  if(this.has(a,'myth_astral')&&c?.sourceSkill?.id&&c.sourceSkill.id===this.astralSkill(a)?.id)out.push(.4);
  if(c?.wrath){
   const atk=window.GameEntities.CombatSystem.combatStats(a).attack||a.attack||0;
   out.push(atk/Math.max(1,c.baseDamage||atk));
  }
  const hit={out};
  if(this.has(a,'myth_combust'))hit.noCrit=true;
  if(this.has(a,'myth_edge')){
   if((s.edgeReadyAt||0)<=this.now()){hit.forceCrit=true;hit.critMult=2;hit.armEdge=true;}
   else hit.noCrit=true;
  }
  if(c?.wrath)hit.wrath=true;
  return hit;
 },
 capOutgoing(damage,parts){
  let positive=0,negative=1;
  for(const n of parts)if(n>0)positive+=n;else negative*=1+n;
  positive=Math.min(.7,positive);
  return damage*(1+positive)*negative;
 },
 onDamage(a,t,damage,c,raw,armor){
  if(c?.reflected)return damage;
  const hit=c?.mythicHit||this.beforeHit(a,c);
  if(!c?.mythicHit&&hit.armEdge&&a)this.state(a).edgeReadyAt=this.now()+5;
  const parts=[...(hit.out||[])];
  if(this.has(a,'myth_gravity')&&t?.ccImmune){
   const g=this.state(a).gravity||(this.state(a).gravity={});
   const row=g[t.id]||(g[t.id]={stacks:0,until:0});
   const near=Math.hypot(a.x-t.x,a.y-t.y)<=120;
   if(row.until<this.now()||!near)row.stacks=0;
   if(near){row.stacks=Math.min(5,(row.stacks||0)+1);row.until=this.now()+4;parts.push(row.stacks*.02);}
  }else if(this.has(a,'myth_gravity')&&t&&!c?.dot&&!t.ccImmune){
   t.slowTimer=Math.max(t.slowTimer||0,1);t.slowPct=Math.min(.35,Math.max(t.slowPct||0,.2));
   const ang=Math.atan2(a.y-t.y,a.x-t.x);
   window.GameEngine.MapTerrain.moveEntity(t,Math.cos(ang)*16,Math.sin(ang)*16);
  }
  if(this.has(a,'myth_ballista')&&t&&Math.hypot(a.x-t.x,a.y-t.y)<50)parts.push(-.4);
  let next=this.capOutgoing(damage,parts);
  if(this.has(a,'myth_blood')&&!c?.dot&&armor>0){
   const full=raw*100/(100+armor),half=raw*.15*100/(100+armor*.5);
   const extra=Math.max(0,half-full*.15);
   next+=Math.min(Math.max(0,damage*1.7-next),extra);
  }
  if(this.has(t,'myth_glass'))next*=1.25;
  if(this.has(t,'myth_nether')&&Math.hypot(a.x-t.x,a.y-t.y)>100)next*=1.2;
  if(this.has(t,'myth_lone')&&this.enemies(t,200).length>=2)next*=1.15;
  if(this.has(t,'myth_gravity')&&(c?.explosion||c?.aoe||c?.dot==='field'))next*=1.15;
  if(this.has(t,'myth_stone')&&this.state(t).stone==='stone')next*=.7;
  if(c?.phaseFail)next*=1.2;
  const ts=t?.isPawn?this.state(t):null;
  if(ts&&(ts.asuraUntil||0)>this.now()&&ts.asuraShield>0){const absorb=Math.min(ts.asuraShield,next);ts.asuraShield-=absorb;next-=absorb;if(ts.asuraShield<=0)this.breakAsura(t);}
  if(ts&&this.has(t,'myth_glutton')&&ts.gluttonShield>0){const absorb=Math.min(ts.gluttonShield,next);ts.gluttonShield-=absorb;next-=absorb;}
  return Math.max(0,next);
 },
 tryEvade(t,c){
  if(!this.has(t,'myth_phase')||c?.dot||c?.explosion||c?.aoe||c?.reflected)return false;
  if(!(c?.projectile||!c?.skill))return false;
  if(Math.random()<.2){this.state(t).evadeUntil=this.now()+2;return true;}
  c.phaseFail=true;return false;
 },
 afterHit(a,t,damage,c){
  if(!damage||c?.reflected||c?.dot)return;
  if(this.has(a,'myth_glutton')&&!(this.has(a,'myth_harvest')&&this.inCombat(a))&&!this.insideEnemyArray(a)){
   const heal=damage*.2,room=Math.max(0,a.maxHp-a.currentHp),s=this.state(a);
   a.currentHp=Math.min(a.maxHp,a.currentHp+Math.min(room,heal));
   s.gluttonShield=Math.min(a.maxHp*.35,(s.gluttonShield||0)+Math.max(0,heal-room));
  }
  if(this.has(a,'myth_combust')&&!c?.skill)this.combust(t);
  if(c?.wrath&&t?.isAlive&&!t.ccImmune)t.silenceTimer=Math.max(t.silenceTimer||0,this.ccDuration(t,.6));
  if(this.has(t,'myth_void')&&damage>t.maxHp*.15&&(this.state(t).voidCd||0)<=this.now()){
   const s=this.state(t);s.voidCd=this.now()+12;t.mythicUntargetable=this.now()+1.5;t.stealthTimer=Math.max(t.stealthTimer||0,1.5);
  }
  if(this.has(t,'myth_asura'))this.tryAsura(t);
  if(this.has(t,'myth_karma'))this.tryKarma(t,a);
  if(this.has(t,'myth_mirror')&&a?.isAlive&&a!==t){
   const back=Math.min(a?damage*.25:0,t.maxHp*.25);
   if(back>0)window.GameEntities.CombatSystem.applyDamage(t,a,null,{baseDamage:back,magic:true,reflected:true,trueDamage:true});
  }
 },
 combust(t){
  if(!t)return;
  for(const skill of t.skills||[]){
   const base=skill.def?.cooldown||skill.def?.t1?.cooldown||6;
   skill.cooldownTimer=Math.min(base+1.5,(skill.cooldownTimer||0)+.3);
  }
  if(t.isAncient||t.isMonster&&t.tier>=6){
   const prev=t.mythicGlobalAdded||0;
   t.mythicGlobalAdded=Math.min(.4,prev+.3);
   t.globalSkillCooldown=(t.globalSkillCooldown||0)+(t.mythicGlobalAdded-prev);
  }
 },
 tryAsura(t){
  const s=this.state(t);
  if(!t?.isAlive||t.currentHp>=t.maxHp*.3||(s.asuraCd||0)>this.now()||(s.asuraUntil||0)>this.now()||this.insideEnemyArray(t))return;
  s.asuraCd=this.now()+40;s.asuraUntil=this.now()+6;s.asuraShield=t.maxHp*.45;
 },
 breakAsura(t){
  const s=this.state(t);if(!s.asuraUntil)return;s.asuraUntil=0;s.asuraShield=0;
  if(!this.immuneHardCC(t))t.stunTimer=Math.max(t.stunTimer||0,.8);
 },
 tryKarma(t,a){
  const s=this.state(t);
  if(!t?.isAlive||!a?.isAlive||t.currentHp>=t.maxHp*.25||(s.karmaCd||0)>this.now())return;
  s.karmaCd=this.now()+35;s.karmaUntil=this.now()+4;
  const bite=t.maxHp*.12;
  a.currentHp=Math.max(1,a.currentHp-bite);
  if(!this.insideEnemyArray(t))t.currentHp=Math.min(t.maxHp,t.currentHp+bite);
  const M=window.GameEngine.MapTerrain;
  if(a.ccImmune){const ang=Math.atan2(t.y-a.y,t.x-a.x);M.moveEntity(t,Math.cos(ang)*80,Math.sin(ang)*80);}
  else {const ang=Math.atan2(a.y-t.y,a.x-t.x);M.moveEntity(a,Math.cos(ang)*80,Math.sin(ang)*80);}
 },
 tryDefiant(victim){
  if(!this.has(victim,'myth_defiant')||this.state(victim).defiantUsed)return false;
  const s=this.state(victim);s.defiantUsed=true;s.immortalUntil=this.now()+2;s.defiantHealAt=s.immortalUntil;
  victim.mythicImmortal=s.immortalUntil;victim.currentHp=1;victim.action=null;victim.attackState=null;
  window.GameUI?.CombatTicker?.log('✦ '+victim.name+' kích Chân Mệnh, bất tử 2 giây.');
  return true;
 },
 explode(victim){
  if(!this.has(victim,'myth_bomb')||victim.mythicBombed)return;
  victim.mythicBombed=true;
  const C=window.GameEntities.CombatSystem,dmg=(victim.attack||16)*1.5+40;
  for(const e of [...(window.GameManager.pawns||[]),...(window.GameManager.monsters||[])]){
   if(!e.isAlive||!C.isEnemy(victim,e)||Math.hypot(e.x-victim.x,e.y-victim.y)>140)continue;
   C.applyDamage(victim,e,null,{baseDamage:dmg,magic:true,explosion:true,aoe:true,mythicBomb:true});
  }
  C.field(victim,{radius:140,element:'fire',color:'#ff6b3d'},victim.x,victim.y,{damage:(victim.attack||16)*.15,life:4,tick:1,mythicBomb:true});
 },
 onKill(killer,victim){
  if(!this.has(killer,'myth_harvest'))return;
  if(!(victim.isPawn||victim.isMonster&&victim.tier>=3))return;
  const s=this.state(killer);
  s.harvestAttack=Math.min(30,(s.harvestAttack||0)+2);
  if(!this.insideEnemyArray(killer))killer.currentHp=Math.min(killer.maxHp,killer.currentHp+killer.maxHp*.25);
 },
 insideEnemyArray(e){
  const G=window.GameManager;if(!G)return false;
  return [...(G.pawns||[]),...(G.monsters||[])].some(p=>p!==e&&p.isAlive&&this.has(p,'myth_array')&&this.zoneHas(p,e));
 },
 zoneHas(owner,e){
  const z=this.state(owner).array;return z&&z.until>this.now()&&Math.hypot(e.x-z.x,e.y-z.y)<=100;
 },
 markBasic(e){
  if(!this.has(e,'myth_wrath'))return false;
  const s=this.state(e);s.wrath=(s.wrath||0)+1;
  if(s.wrath<4)return false;
  s.wrath=0;return true;
 },
 beginLoot(pawn,item){
  if(!this.has(pawn,'myth_elixir')||item.slot==='potion'||item.mythicReady)return false;
  if(pawn.mythicLooting===item)return true;
  if(pawn.action)return true;
  pawn.mythicLooting=item;
  const hp=pawn.currentHp;
  window.GameEntities.CombatSystem.startAction(pawn,'drink',null,()=>{
   pawn.mythicLooting=null;
   if(!pawn.isAlive||pawn.currentHp<hp)return;
   item.mythicReady=true;
   window.GameAI.AIBrain.lootItem(pawn,item);
  },{windup:.8,active:.05,recovery:.05,style:'unarmed'});
  return true;
 },
 tick(e,dt){
  if(!e?.isPawn||!e.mythics?.length)return;
  const s=this.state(e),now=this.now();
  if((s.immortalUntil||0)>now)e.mythicImmortal=s.immortalUntil;
  if(s.defiantHealAt&&now>=s.defiantHealAt){s.defiantHealAt=0;e.currentHp=Math.min(e.maxHp,e.currentHp+e.maxHp*.5);}
  if((s.asuraUntil||0)>0&&now>=s.asuraUntil)this.breakAsura(e);
  if(this.has(e,'myth_stone'))this.tickStone(e,dt);
  if(this.has(e,'myth_lightning'))this.tickLightning(e,dt);
  if(this.has(e,'myth_nether'))this.tickAura(e,dt,'nether',100,(victim)=>this.combatAttack(e)*.08);
  if(this.has(e,'myth_quake'))this.tickAura(e,dt,'quake',60,(victim)=>{if(!victim.ccImmune){victim.slowTimer=Math.max(victim.slowTimer||0,.6);victim.slowPct=Math.min(.35,Math.max(victim.slowPct||0,.2));}return 12+this.combatAttack(e)*.15;});
  if(this.has(e,'myth_chain'))this.tickChain(e,dt);
  if(this.has(e,'myth_array')){this.tickArray(e);this.noteArray(e);}
  if((e.mythicUntargetable||0)<=now)e.mythicUntargetable=0;
 },
 combatAttack(e){return window.GameEntities.CombatSystem.combatStats(e).attack||e.attack||16;},
 tickStone(e,dt){
  const s=this.state(e),moving=Math.hypot(e.vx||0,e.vy||0)>8||!!e.action;
  if(s.stone==='exit'){s.stoneTime-=dt;if(s.stoneTime<=0)s.stone=null;return;}
  if(s.stone==='stone'){e.vx=e.vy=0;e.currentHp=Math.min(e.maxHp,e.currentHp+e.maxHp*.03*dt);return;}
  if(moving)s.stoneTime=0;else s.stoneTime=(s.stoneTime||0)+dt;
  if(s.stoneTime>=1.5){s.stone='stone';s.stoneTime=0;}
 },
 tickLightning(e,dt){
  const s=this.state(e);
  const still=Math.hypot(e.vx||0,e.vy||0)<8&&!e.action;
  s.still=still?(s.still||0)+dt:0;
  if(s.still>=.5&&!this.immuneHardCC(e)){s.still=0;e.silenceTimer=Math.max(e.silenceTimer||0,.8);e.stunTimer=Math.max(e.stunTimer||0,.8);}
  if(s.lastX==null){s.lastX=e.x;s.lastY=e.y;s.trail=0;return;}
  s.trail=(s.trail||0)+Math.hypot(e.x-s.lastX,e.y-s.lastY);s.lastX=e.x;s.lastY=e.y;
  const now=this.now();
  s.trailPts=(s.trailPts||[]).filter(p=>p.until>now);
  s.trailPts.push({x:e.x,y:e.y,until:now+.45});
  if(s.trailPts.length>16)s.trailPts.shift();
  if(s.trail<80)return;
  s.trail=0;
  const C=window.GameEntities.CombatSystem,dmg=this.combatAttack(e)*.2;
  for(const t of this.enemies(e,28))C.applyDamage(e,t,null,{baseDamage:dmg,magic:true,dot:'field',aoe:true});
 },
 tickAura(e,dt,key,radius,amount){
  const s=this.state(e);s[key]=(s[key]||0)+dt;if(s[key]<1)return;s[key]=0;
  const C=window.GameEntities.CombatSystem;
  for(const t of this.enemies(e,radius)){const dmg=amount(t);if(dmg>0)C.applyDamage(e,t,null,{baseDamage:dmg,magic:true,dot:'field',aoe:true});}
 },
 tickChain(e,dt){
  const s=this.state(e),C=window.GameEntities.CombatSystem,M=window.GameEngine.MapTerrain;
  if((s.chainCd||0)>this.now())return;
  let target=this.living(s.chainId);
  if(!target&&e.targetEnemy?.isAlive&&C.isEnemy(e,e.targetEnemy)&&Math.hypot(e.x-e.targetEnemy.x,e.y-e.targetEnemy.y)<=120){target=e.targetEnemy;s.chainId=target.id;s.chainBlock=0;}
  if(!target)return;
  const dist=Math.hypot(e.x-target.x,e.y-target.y);
  if(!M.segmentClear(e.x,e.y,target.x,target.y,false,0))s.chainBlock=(s.chainBlock||0)+dt;else s.chainBlock=0;
  if(s.chainBlock>=2||!target.isAlive){s.chainId=null;s.chainCd=this.now()+20;return;}
  if(dist<=120)return;
  const pull=dist-120,ang=Math.atan2(target.y-e.y,target.x-e.x);
  if(target.ccImmune)M.moveEntity(e,Math.cos(ang)*pull,Math.sin(ang)*pull);
  else {M.moveEntity(target,-Math.cos(ang)*pull*.5,-Math.sin(ang)*pull*.5);M.moveEntity(e,Math.cos(ang)*pull*.5,Math.sin(ang)*pull*.5);}
 },
 tickArray(e){
  const s=this.state(e);
  if(s.array&&s.array.until<=this.now())s.array=null;
  if((s.arrayCd||0)>this.now()||s.array)return;
  const target=e.targetEnemy;
  if(!target?.isAlive||Math.hypot(e.x-target.x,e.y-target.y)>220)return;
  s.array={x:e.x,y:e.y,until:this.now()+10};s.arrayCd=this.now()+16;s.arrayWasInside=true;
 },
 // Gia chủ rời trận thì phạt. Kiểm tra sau khi đã đứng trong trận.
 noteArray(e){
  if(!this.has(e,'myth_array'))return;
  const s=this.state(e),z=s.array;
  if(!z||z.until<=this.now())return;
  const inside=Math.hypot(e.x-z.x,e.y-z.y)<=100;
  if(s.arrayWasInside&&!inside)s.arrayPenaltyUntil=this.now()+4;
  s.arrayWasInside=inside;
 }
};
