window.GameEntities.RelicSystem={
 equipment(e){return [e.weapon,e.armor,e.helmet,e.boots].filter(Boolean);},
 has(e,kind){return this.equipment(e).some(d=>d.effect===kind);},
 state(e,kind){e.relicState=e.relicState||{};return e.relicState[kind]||(e.relicState[kind]={cooldown:0});},
 update(e,dt){
  if(!e.relicState&&!e.relicBolts?.length&&!e.relicTraps?.length&&![e.weapon,e.armor,e.helmet,e.boots].some(d=>d?.tier==='ancient'))return;
  const C=window.GameEntities.CombatSystem,M=window.GameEngine.MapTerrain,G=window.GameManager;
  for(const s of Object.values(e.relicState||{}))for(const key of ['cooldown','timer','shieldTimer','invulnerable'])if(s[key]>0)s[key]=Math.max(0,s[key]-dt);
  e.relicInvulnerable=Math.max(0,(e.relicInvulnerable||0)-dt);
  if(this.has(e,'nano')){
   e.currentHp=Math.min(e.maxHp,e.currentHp+C.healthRegenRate(e,'nano')*dt);
   const s=this.state(e,'nano');if(e.despair>90&&s.cooldown<=0){s.cooldown=40;e.currentStamina=Math.min(e.maxStamina,e.currentStamina+e.maxStamina*.5);e.speedBuff=.25;e.speedBuffTimer=4;}
  }
  const prism=e.relicState?.prism;if(prism?.timer>0&&prism.decoy){const d=prism.decoy;const pos=M.nearestFree(d.x+Math.cos(d.angle)*100*dt,d.y+Math.sin(d.angle)*100*dt);Object.assign(d,pos);}
  for(const bolt of e.relicBolts||[]){
   bolt.life-=dt;if(!bolt.target.isAlive||!e.isAlive){bolt.life=0;continue;}
   const t=bolt.target,dx=t.x-bolt.x,dy=t.y-bolt.y,d=Math.hypot(dx,dy),step=360*dt;
   bolt.x+=dx/Math.max(1,d)*Math.min(d,step);bolt.y+=dy/Math.max(1,d)*Math.min(d,step);
   if(d<=step+12){C.applyDamage(e,t,e.weapon,{baseDamage:bolt.damage,magic:true,relic:true,projectile:true,damageBudget:bolt.damageBudget});bolt.life=0;}
  }
  e.relicBolts=(e.relicBolts||[]).filter(b=>b.life>0);
  for(const trap of e.relicTraps||[]){trap.life-=dt;trap.next-=dt;if(trap.next<=0){trap.next=.5;const pool=[...G.monsters,...(G.monsters.some(m=>m.isDemonKing)?G.pawns:[])];for(const t of pool)if(t.isAlive&&C.isEnemy(e,t)&&Math.hypot(t.x-trap.x,t.y-trap.y)<30)C.applyDamage(e,t,null,{baseDamage:C.combatStats(e).attack*.2,magic:true,relic:true,dot:'burn',element:'fire'});}}
  e.relicTraps=(e.relicTraps||[]).filter(f=>f.life>0);
 },
 incoming(a,e,damage,c){
  const V=window.GameRenderer.VfxManager;
  if(this.has(e,'core')){
   const s=this.state(e,'core');
   if(['meteor','nuclear','collapse','sweep','lava'].includes(c.effect)||c.explosion)damage*=.75;
   if(e.currentHp-damage<e.maxHp*.3&&s.cooldown<=0){s.cooldown=45;s.shield=e.maxHp*.25;s.shieldTimer=4;V.addEffect('guard',e.x,e.y,{radius:40,color:'#ffd166',life:4});}
   if(s.shieldTimer>0){const absorbed=Math.min(s.shield||0,damage);s.shield-=absorbed;damage-=absorbed;}
  }
  if(this.has(e,'crown')&&['fire','ice','poison','burn'].includes(c.element||c.dot))damage*=.7;
  if(this.has(e,'prism')&&damage>e.maxHp*.2){
   const s=this.state(e,'prism');if(s.cooldown<=0){s.cooldown=30;s.timer=2;s.decoy={...e,action:null,attackState:null,x:e.x,y:e.y,angle:Math.atan2(e.y-a.y,e.x-a.x)};}
  }
  return damage;
 },
 modifyDamage(a,t,damage){
  if(this.has(a,'prism')&&(a.skills||[]).some(s=>[...(t.skills||[]),...(t.copiedSkills||[])].some(q=>q.id===s.id)))damage*=1.2;
  const mark=t.relicState?.moon;if(mark?.timer>0&&mark.owner===a)damage*=1.2;
  return damage;
 },
 afterDamage(a,t,damage,c){
  if(!a.isAlive)return;
  const C=window.GameEntities.CombatSystem,M=window.GameEngine.MapTerrain;
  const leech=this.equipment(a).reduce((v,d)=>v+(d.lifeSteal||0),0);if(leech&&a.isAlive)a.currentHp=Math.min(a.maxHp,a.currentHp+damage*leech);
  if(c.relic||c.reflected||!t.isAlive)return;
  if(this.has(a,'voidblade')&&!c.skill&&!c.dot){const s=this.state(a,'voidblade');if(s.timer<=0||s.target!==t)s.stacks=0;s.target=t;s.stacks=Math.min(10,(s.stacks||0)+1);s.timer=5;const debuff=this.state(t,'voidArmor');debuff.stacks=s.stacks;debuff.timer=5;}
  if(this.has(a,'halberd')&&!c.skill&&!c.dot){
   const s=this.state(a,'halberd');s.hits=(s.hits||0)+1;
   if(s.hits%4===0){const element=s.element||0;s.element=(element+1)%4;
    if(element===0){t.relicSlow=.3;t.relicSlowTimer=2;}
    if(element===1){const total=t.currentHp*.04;for(let i=1;i<=3;i++)C.schedule(a,i,()=>{if(t.isAlive)C.applyDamage(a,t,null,{baseDamage:total/3,magic:true,relic:true,dot:'burn',element:'fire'});});}
    if(element===2&&t.action&&!t.action.released){t.action=null;t.attackState=null;t.relicInterrupt=.2;}
    if(element===3){a.speedBuff=.3;a.speedBuffTimer=2;}
   }
  }
  if(this.has(a,'greatbow')&&!c.skill&&!c.dot){
   const s=this.state(a,'greatbow');s.moon=!s.moon;
   if(s.moon){const ancient=window.GameEntities.AncientSystem;ancient.fields=ancient.fields.filter(f=>f.warningOnly||Math.hypot(f.x-t.x,f.y-t.y)>40||!['acid','lava'].includes(f.effect));
    const pool=[...window.GameManager.monsters,...(window.GameManager.monsters.some(m=>m.isDemonKing)?window.GameManager.pawns:[])];for(const e of pool)if(e!==t&&e!==a&&e.isAlive&&C.isEnemy(a,e)&&Math.hypot(e.x-t.x,e.y-t.y)<40)C.applyDamage(a,e,null,{baseDamage:damage*.4,magic:true,relic:true,explosion:true});
    window.GameRenderer.VfxManager.addEffect('flame',t.x,t.y,{radius:40,color:'#ffd166',life:.5});
   }else{const mark=this.state(t,'moon');mark.owner=a;mark.timer=4;}
  }
  if(this.has(a,'tome')&&(c.magic||a.weapon?.type==='tome')&&Math.random()<.2){const s=this.state(t,'tomeSlow');s.stacks=s.timer>0?Math.min(2,(s.stacks||0)+1):1;s.timer=3;}
  if(this.has(a,'ring')&&(t.isAncient||t.isAncientClone)){
   const s=this.state(a,'ring');if(s.charge>=50){s.charge=0;a.currentHp=Math.min(a.maxHp,a.currentHp+damage*.1);const angle=Math.atan2(a.y-t.y,a.x-t.x);M.moveEntity(a,Math.cos(angle)*80,Math.sin(angle)*80);window.GameRenderer.VfxManager.addEffect('rune',a.x,a.y,{radius:32,color:'#c5acff',life:.5});}else s.charge=Math.min(50,(s.charge||0)+1);
  }
 },
 onCast(e,skill,castId=e.skillsCast,damageBudget){
  if(!this.has(e,'tome')||skill.tier!==3)return;
  const s=this.state(e,'tome');if(s.cast!==undefined&&castId<=s.cast)return;s.cast=castId;
  const C=window.GameEntities.CombatSystem,G=window.GameManager,pool=[...G.monsters,...(e.isDemonKing||G.monsters.some(m=>m.isDemonKing)?G.pawns:[])],t=pool.filter(m=>C.isEnemy(e,m)&&C.canEngage(e,m)).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0];
  if(t)e.relicBolts=[...(e.relicBolts||[]),...[0,1,2].map(i=>({x:e.x,y:e.y+i*8,target:t,life:3,damageBudget,damage:C.combatStats(e).attack*.5}))];
 },
 tryDash(e,t,mode){
  if(!this.has(e,'voidblade')||!['retreat','bait','counter'].includes(mode)||e.action||e.stunTimer>0||e.relicInterrupt>0)return false;
  const s=this.state(e,'voidblade');if(s.cooldown>0)return false;
  const angle=Math.atan2(t.y-e.y,t.x-e.x),M=window.GameEngine.MapTerrain,x=e.x,y=e.y;
  if(M.moveEntity(e,Math.cos(angle)*120,Math.sin(angle)*120)<20)return false;
  s.cooldown=12;e.relicInvulnerable=.4;e.slowTimer=e.relicSlowTimer=0;
  window.GameRenderer.VfxManager.addEffect('dash',x,y,{tx:e.x,ty:e.y,color:'#b782ff',life:.4});return true;
 },
 onDodge(e){
  if(!this.has(e,'treads'))return;
  e.relicTraps=[...(e.relicTraps||[]),{x:e.x,y:e.y,life:3,next:0}];
  window.GameRenderer.VfxManager.addEffect('dash',e.x,e.y,{tx:e.x+e.action.dodgeX,ty:e.y+e.action.dodgeY,color:'#ff8758',life:.3});
 },
 control(e,kind,duration,source){
  const Mythic=window.GameEntities.MythicSystem;
  if(Mythic?.immuneHardCC(e)&&/stun|freeze|petrify|root/.test(kind||''))return 0;
  duration=Mythic?.ccDuration(e,duration)??duration;
  if(!this.has(e,'crown')||!source?.isMonster)return duration;
  const s=this.state(e,'crown');if(s.cooldown>0)return duration;s.cooldown=25;
  for(const m of window.GameManager.monsters)if(m.isAlive&&!m.isAncient&&!m.isAncientClone&&Math.hypot(m.x-e.x,m.y-e.y)<65){const a=Math.atan2(m.y-e.y,m.x-e.x);window.GameEngine.MapTerrain.moveEntity(m,Math.cos(a)*35,Math.sin(a)*35);}
  window.GameRenderer.VfxManager.addEffect('guard',e.x,e.y,{radius:65,color:'#ffe0a3',life:.4});return duration*.5;
 },
 knockbackImmune(e){return this.has(e,'core')&&(e.relicState?.core?.shieldTimer||0)>0;},
 distract(m,dt){
  const owners=[...window.GameManager.pawns,...window.GameManager.monsters.filter(e=>e.isDemonKing)];
  const p=owners.find(e=>e!==m&&e.isAlive&&this.has(e,'prism')&&e.relicState?.prism?.timer>0&&Math.hypot(e.x-m.x,e.y-m.y)<350);
  if(!p)return false;const d=p.relicState.prism.decoy;m.objective='Đuổi ảo ảnh Kính Vạn Hoa';m.targetEnemy=null;
  if(m.action&&!m.action.released){m.action.targetX=d.x;m.action.targetY=d.y;}
  if(!m.action)window.GameEngine.MapTerrain.navigate(m,d.x,d.y,dt);return true;
 },
 render(ctx){
  for(const p of [...window.GameManager.pawns,...window.GameManager.monsters.filter(e=>e.isDemonKing)].filter(e=>e.isAlive)){
   const s=p.relicState?.prism;if(s?.timer>0&&s.decoy){ctx.save();ctx.globalAlpha=.35;window.GameRenderer.ProceduralPawn.renderPawn(ctx,s.decoy,performance.now()/1000,s.decoy.angle,true);ctx.restore();}
   for(const b of p.relicBolts||[]){ctx.fillStyle='#d7a0ff';ctx.beginPath();ctx.arc(b.x,b.y,5,0,Math.PI*2);ctx.fill();}
   for(const f of p.relicTraps||[]){ctx.fillStyle='#ff8758';ctx.globalAlpha=.4;ctx.beginPath();ctx.arc(f.x,f.y,30,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
  }
 }
};
