window.GameEntities=window.GameEntities||{};
window.GameEntities.AncientSystem={
 boss:null,awakened:false,fields:[],walls:[],clock:0,lightningAt:0,queue:[],defeated:0,usedRelics:[],nextAt:null,arena:null,god:null,original:null,victoryPending:false,pendingGod:null,wakeRemaining:null,
 reset(){if(window.GameEntities.CombatSystem){window.GameEntities.CombatSystem.fields=[];window.GameEntities.CombatSystem.fieldClock=0;}this.boss=null;this.awakened=false;this.fields=[];this.walls=[];this.clock=0;this.lightningAt=0;this.queue=[];this.defeated=0;this.usedRelics=[];this.nextAt=null;this.arena=null;this.god=null;this.original=null;this.victoryPending=false;this.pendingGod=null;this.wakeRemaining=null;if(window.GameEngine.MapTerrain)window.GameEngine.MapTerrain.ancientArena=null;},
 awaken(god,killer,ready=false){
  if(this.awakened)return this.boss;
  if(!ready){if(!this.pendingGod&&!this.awakened){this.pendingGod=god;this.wakeRemaining=20;this.god=killer;window.GameUI.CombatTicker.log("⏳ Yêu Thần đã chết. Thượng Cổ thức tỉnh sau 20 giây: thu thập chiến lợi phẩm!");}return null;}
  if(this.awakened)return this.boss;
  const G=window.GameManager,E=window.GameEntities.EntityManager,D=window.GameData.AncientBosses;
  if(G.pawns.filter(p=>p.isAlive).length!==1){this.pendingGod=god;return null;}
  this.pendingGod=null;this.awakened=true;
  const original=G.winnerPawn?.isAlive?G.winnerPawn:killer?.isPawn?killer:G.pawns.find(p=>p.isAlive);
  const first=D[Math.floor(Math.random()*D.length)];this.queue=[first,...D.filter(d=>d!==first)];this.god=god;this.original=original;
  this.openArena(original,god);
  return this.spawnNext();
 },
 openArena(p,god){
  const G=window.GameManager,M=window.GameEngine.MapTerrain,cx=G.width/2,cy=G.height/2+800;
  this.arena={x:cx-750,y:cy-750,w:1500,h:1500,cx,cy,started:this.clock,covers:[[-105,-100],[105,-100],[-105,100],[105,100],[-440,-400],[440,-400],[-440,400],[440,400]].map(([x,y])=>({x:cx+x-14,y:cy+y-24,w:28,h:48,kind:'ancient-cover'}))};M.ancientArena=this.arena;
  for(const m of G.monsters)if(m.isAlive){m.isAlive=false;m.action=null;m.despawned=true;}
  for(const item of G.dropItems.filter(d=>!d.isCollected&&Math.hypot(d.x-god.x,d.y-god.y)<120)){const pos=M.nearestFree(cx-155+Math.random()*50,cy+40+Math.random()*50);item.x=pos.x;item.y=pos.y;}
  if(p){Object.assign(p,M.nearestFree(cx-140,cy));p.action=null;p.attackState=null;p.combatGroup=null;p.combatLease=0;p.targetEnemy=null;p.navPath=[];p.navTimer=0;p.plan=null;p.chase=null;}
  window.GameRenderer.VfxManager.projectiles=[];window.GameEntities.CombatSystem.pendingEffects=[];
  // Rebuild just the existing navigation grid against the collapsed world's physical rules.
  for(let y=0;y<M.rows;y++)for(let x=0;x<M.cols;x++){const i=y*M.cols+x;M.navBlocked[i]=!M.canStand((x+.5)*M.cell,(y+.5)*M.cell,12);M.navWater[i]=0;}
  G.cataclysm=true;const camera=window.GameEngine.Camera;camera.targetEntity=null;camera.autoDirector=false;camera.x=camera.targetX=cx;camera.y=camera.targetY=cy;camera.targetZoom=Math.min(camera.viewportWidth/(this.arena.w+200),camera.viewportHeight/(this.arena.h+200),1.3);
 },
 spawnNext(){
  const G=window.GameManager,E=window.GameEntities.EntityManager,god=this.god,original=this.original;
  const def=this.queue.shift();if(!def||!original?.isAlive)return null;
  this.nextAt=null;
  const angle=Math.atan2(this.arena.cy-original.y,this.arena.cx-original.x),spawn=window.GameEngine.MapTerrain.nearestFree(this.arena.cx+Math.cos(angle)*110,this.arena.cy+Math.sin(angle)*110);
  const hp=def.kind==='mirror'?(original?.maxHp||500)*15:Math.max(god.maxHp*1.5,(original?.maxHp||500)*4,6000);
  const m=E.spawnMonster({id:def.id,name:def.name,tier:6,tierName:'Thượng Cổ',scale:def.scale,maxHp:hp,attack:def.kind==='mirror'?(original?.attack||40):Math.max(god.attack*1.3,55),defense:def.kind==='mirror'?(original?.defense||20):god.defense+15,speed:def.kind==='mirror'?(original?.moveSpeed||95):105,expReward:0,passives:[],skills:[],visual:{type:'primordial_'+def.kind,bodyColor:def.color}},spawn.x,spawn.y);
  Object.assign(m,{homeX:m.x,homeY:m.y,gauntletRound:this.defeated+1,isAncient:true,ancientKind:def.kind,ancientDef:def,phase:1,phaseHp:hp,phaseMaxHp:hp,ccImmune:true,globalSkillCooldown:1,original,passives:def.passives.map(p=>({...p})),skills:def.skills.map((s,i)=>({id:s.id,def:{...s},tier:3,cooldownTimer:i*.35})),territory:{id:'ancient_arena',name:'Đấu trường Thượng Cổ',x:this.arena.cx,y:this.arena.cy,radius:this.arena.w/2,isCleared:false},foreseen:false,passiveClock:0,petrification:new Map(),shield:def.kind==='mecha'?hp*.12:0,maxShield:def.kind==='mecha'?hp*.12:0});
  if(def.kind==='mirror'&&original){
   m.maxMana=m.currentMana=original.maxMana;m.maxStamina=m.currentStamina=original.maxStamina;m.critChance=original.critChance;m.secondaryWeapon=original.secondaryWeapon?{...original.secondaryWeapon}:null;
   m.weapon=original.weapon?{...original.weapon}:null;m.armor=original.armor?{...original.armor}:null;m.helmet=original.helmet?{...original.helmet}:null;m.boots=original.boots?{...original.boots}:null;m.appearance={...original.appearance};m.classId=original.classId;
   m.copiedSkills=(original.skills||[]).map(s=>({...s,tier:3,cooldownTimer:0}));m.copiedPassives=(original.passives||[]).map(p=>({...p,cooldownTimer:0}));m.passiveMultiplier=2;m.recordedCombo=(original.attackHistory||[]).filter(a=>a.targetId===god.id).slice(-4);
  }
  this.boss=m;G.monsters=E.monsters;G.cataclysm=true;
  window.GameUI.CombatTicker.log('🌋 THƯỢNG CỔ THỨC TỈNH: '+m.name+' • Lượt '+m.gauntletRound+'/5 • Đấu trường 1500×1500!');
  window.GameRenderer.VfxManager.addEffect('rune',m.x,m.y,{radius:320,color:def.color,life:3});
  return m;
 },
 beforeDeath(m,killer){
  const C=window.GameEntities.CombatSystem,V=window.GameRenderer.VfxManager;
  if(m.isAncientClone){
   m.isAlive=false;m.action=null;const owner=m.ancientOwner;owner.currentHp=owner.clones.reduce((sum,c)=>sum+(c.isAlive?c.currentHp:0),0);
   V.addBurstParticles(m.x,m.y,'#bd93f9',20);
   if(!owner.clones.some(c=>c.isAlive)){owner.isSplit=false;owner.currentHp=0;C.handleDeath(killer,owner);}return true;
  }
  if(!m.isAncient||m.phase!==1)return false;
  this.fields=this.fields.filter(f=>f.owner!==m);
  m.phase=2;m.currentHp=m.phaseMaxHp;m.phaseHp=m.phaseMaxHp;m.action=null;m.attackState=null;m.stunTimer=m.slowTimer=m.silenceTimer=0;
  if(['colossus','mirror'].includes(m.ancientKind))m.speed*=1.5;
  if(m.ancientKind==='mecha'){m.speed*=2;m.shield=0;}
  m.skills.forEach(s=>s.cooldownTimer=s.def.phase?0:s.cooldownTimer);m.globalSkillCooldown=1;
  V.addBurstParticles(m.x,m.y,m.ancientDef.color,45);V.addEffect('impact',m.x,m.y,{radius:220,color:m.ancientDef.color,life:2});
  window.GameUI.CombatTicker.log('🔥 '+m.name+' vỡ thanh máu thứ nhất — PHASE 2!');return true;
 },
 finish(killer,m){
  if(!m.isAncient)return;
  this.fields=[];this.walls=[];m.clones?.forEach(c=>c.isAlive=false);
  const G=window.GameManager,D=window.GameData.Equipments;
  this.defeated++;const pool=Object.values(D.relics).filter(d=>!this.usedRelics.includes(d.id)),relic=pool[Math.floor(Math.random()*pool.length)];
  if(relic){this.usedRelics.push(relic.id);const drop=G.spawnDropItem(m.x,m.y,relic,relic.slot);if(killer?.isPawn){killer.relicLoot=drop;killer.relicPriorityUntil=this.clock+1.5;}}
  if(killer?.isAlive){killer.action=null;killer.attackState=null;killer.targetEnemy=null;killer.combatGroup=null;killer.combatLease=0;killer.navTimer=0;killer.navPath=[];}
  window.GameEntities.CombatSystem.pendingEffects=[];window.GameRenderer.VfxManager.projectiles=[];
  if(this.defeated<5){this.nextAt=this.clock+10;window.GameUI.CombatTicker.log('🏺 Hạ Thượng Cổ '+this.defeated+'/5. Nhặt Thượng Bảo; boss tiếp theo thức tỉnh sau 10 giây.');return;}
  this.victoryPending=true;this.finalAt=this.clock;return;
 },
 showVictory(){
  const G=window.GameManager,killer=this.original,m=this.boss;this.victoryPending=false;
  G.ancientDefeated=true;G.isGameOver=true;G.isPaused=true;G.resultOpen=true;
  const el=document.getElementById('story-card-modal');
  el.innerHTML='<div class="story-card-box"><h1>🏆 CHINH PHỤC THƯỢNG CỔ</h1><div class="story-card-winner">'+(killer?.name||'Người chiến thắng')+'</div><p>Đã hạ '+m.name+' và chinh phục đủ 5 boss qua 10 thanh máu. Trận đấu hoàn tất.</p><button class="btn-restart" onclick="window.GameManager.startNewMatch()">Bắt đầu ván mới</button></div>';el.classList.remove('hidden');
 },
 config(m,s){
  const d={...s.def},owner=m.ancientOwner||m;
  d.cooldown=owner.ancientKind==='mecha'&&owner.phase===2?0:(d.cooldown||8)*(owner.ancientKind==='mirror'&&owner.phase===2?.5:1);
  d.damage=window.GameEntities.CombatSystem.combatStats(m).attack*Math.min(d.effect==='nuclear'?2.5:2,d.damageScale||1.2);d.stun=d.stun||0;d.slow=0;return d;
 },
 cast(m,s,t){
  const C=window.GameEntities.CombatSystem,c=this.config(m,s),owner=m.ancientOwner||m;
  if(!C.canAttack(m)||s.cooldownTimer>0||owner.globalSkillCooldown>0||c.phase&&m.phase<c.phase||!t?.isAlive||Math.hypot(t.x-m.x,t.y-m.y)>c.range||!C.canEngage(m,t))return false;
  const angle=Math.atan2(t.y-m.y,t.x-m.x),point={x:t.x,y:t.y};
  if(c.id==='av_dive'){const pawns=window.GameManager.pawns.filter(p=>p.isAlive&&C.canEngage(m,p));const center=pawns.sort((a,b)=>pawns.filter(p=>Math.hypot(p.x-b.x,p.y-b.y)<120).length-pawns.filter(p=>Math.hypot(p.x-a.x,p.y-a.y)<120).length)[0];if(center){point.x=center.x;point.y=center.y;}}
  const ok=C.startAction(m,'skill',t,()=>this.resolve(m,c,t,point,angle),{windup:c.windup,active:.05,recovery:.45,style:C.weaponStyle(m),color:m.ancientDef.color,skillName:c.name});
  if(!ok)return false;
  window.GameEngine.Audio?.play('boss',m);
  s.cooldownTimer=c.cooldown;owner.globalSkillCooldown=1;m.globalSkillCooldown=1;m.skillsCast=(m.skillsCast||0)+1;
  const self=['sweep','pull','devour','spin_beam','panic','cross','spear','fissure','map_arrow','lasers','collapse','nuclear','matrix'].includes(c.effect);
  this.field(m,c,self?m.x:point.x,self?m.y:point.y,c.windup,{warningOnly:true,end:this.clock+c.windup,shape:['devour','spear','fissure','map_arrow','lasers','spin_beam'].includes(c.effect)?'line':c.effect==='sweep'?'cone':'circle',radius:['devour','spear','fissure','map_arrow','lasers','spin_beam'].includes(c.effect)?25:c.radius,arc:Math.PI/2,angle,length:c.range});return true;
 },
 telegraph(m,x,y,r,delay,label){window.GameRenderer.VfxManager.addEffect('telegraph',x,y,{radius:r,shape:'circle',color:m.ancientDef?.color||'#b995ff',life:Math.max(.15,delay),label});},
 field(m,c,x,y,delay=.5,extra={}){
  const f={owner:m,x,y,radius:c.radius,damage:c.damage,at:this.clock+delay,end:this.clock+delay+.15,shape:'circle',name:c.name,...c,...extra};
  this.fields.push(f);window.GameRenderer.VfxManager.addEffect('telegraph',x,y,{radius:f.radius,shape:f.shape,angle:f.angle||0,length:f.length||c.range,color:m.ancientDef?.color||'#b995ff',life:Math.max(.15,delay),label:c.name});return f;
 },
 resolve(m,c,t,point,angle){
  const M=window.GameEngine.MapTerrain,V=window.GameRenderer.VfxManager,C=window.GameEntities.CombatSystem;
  const area=(extra={},delay=.3,x=point.x,y=point.y)=>this.field(m,c,x,y,delay,extra);
  if(c.effect==='collapse'){for(const side of [-1,0,1])area({shape:'line',angle,length:600,radius:32,damage:c.damage/3,trueHpPct:0},1,m.x-Math.sin(angle)*side*160,m.y+Math.cos(angle)*side*160);}
  else if(c.effect==='meteor')for(let i=0;i<8;i++){const a=i*Math.PI/4;area({damage:c.damage/8},.5+i*.25,point.x+Math.cos(a)*(i?130:0),point.y+Math.sin(a)*(i?130:0));}
  else if(c.effect==='sweep')area({shape:'cone',angle,arc:Math.PI/2,knockback:c.knockback},.25,m.x,m.y);
  else if(['pull','devour'].includes(c.effect)){
   area({shape:c.effect==='devour'?'line':'circle',angle,length:c.range,pull:25,trueHpPct:0},c.effect==='collapse'?.05:1,m.x,m.y);
   if(c.effect!=='collapse')area({damage:0,pull:8,end:this.clock+1,tick:.3,shape:c.effect==='devour'?'line':'circle',angle,length:c.range},.05,m.x,m.y);
  }else if(c.effect==='wall'){
   for(const offset of [-70,0,70]){const x=point.x+Math.cos(angle)*90-Math.sin(angle)*offset,y=point.y+Math.sin(angle)*90+Math.cos(angle)*offset;
    const pos=M.nearestFree(x,y,24);
    if(M.canStand(pos.x,pos.y,22)&&!window.GameManager.pawns.some(p=>p.isAlive&&Math.hypot(p.x-pos.x,p.y-pos.y)<35))this.walls.push({x:pos.x-16,y:pos.y-16,w:32,h:32,end:this.clock+5});}
  }else if(c.effect==='spin_beam')for(let i=0;i<12;i++)area({shape:'line',angle:angle+i*Math.PI/6,length:360,radius:24,damage:c.damage/12},.2+i*.2,m.x,m.y);
  else if(c.effect==='lava')for(const side of [-1,1])area({shape:'line',angle:Math.PI/2,length:1250,radius:70,end:this.clock+5,tick:1,damage:c.damage/10},.8,this.arena.cx+side*260,this.arena.y+100);
  else if(['copy_first','copy_second'].includes(c.effect)){
   const index=c.effect==='copy_first'?0:1,s=m.copiedSkills?.[index];
   if(s){const original=C.getSkillConfig(m,s);C.resolveSkill(m,s,t,{...original,radius:Math.min(130,original.radius*1.2),range:Math.min(300,original.range*1.2),damage:Math.min(c.damage,original.damage*1.2),useCurrentOrigin:true,originX:m.x,originY:m.y,tx:point.x,ty:point.y,angle,attackSnapshot:C.combatStats(m).attack,castId:m.skillsCast});}
   else area({damage:c.damage},.4);
  }else if(c.effect==='leap'||c.effect==='saw'){
   if(c.effect==='saw')this.breakCover(m.x,m.y,point.x,point.y,55);
   const goal=M.safeGoal(m,point.x,point.y);M.moveEntity(m,goal.x-m.x,goal.y-m.y);
   V.addEffect('dash',m.action.originX,m.action.originY,{tx:m.x,ty:m.y,color:m.ancientDef.color,life:.7});area({stun:c.stun,knockback:c.knockback},.2,m.x,m.y);
  }else if(c.effect==='swap'){
   m.weapon=m.weapon?.range>90?{id:'mirror_blade',name:'Binh khí phản chiếu',type:'sword',attack:35,range:55,speed:1}:{id:'mirror_bow',name:'Binh khí phản chiếu',type:'bow',attack:35,range:240,speed:1};m.magicOnHit=20;m.weaponBuffTimer=3;
  }else if(c.effect==='combo'){
   const combo=m.recordedCombo?.length?m.recordedCombo:[{kind:'attack'},{kind:'skill'},{kind:'attack'}];
   combo.forEach((a,i)=>area({damage:c.damage/combo.length,radius:60},.2+i*1));
  }else if(c.effect==='split')this.split(m,t);
  else if(c.effect==='acid')area({end:this.clock+3,tick:1,armorBreak:.25,damage:c.damage/3},.6);
  else if(c.effect==='tentacles')for(let i=0;i<6;i++){const a=i*Math.PI/3;area({damage:c.damage/6,radius:45},.3+(i%3)*.5,m.x+Math.cos(a)*130,m.y+Math.sin(a)*130);}
  else if(c.effect==='panic')area({damage:c.damage*.6,stun:.3},.2,m.x,m.y);
  else if(c.effect==='cross')for(let i=0;i<4;i++)area({shape:'line',angle:angle+i*Math.PI/2,length:300,radius:28,damage:c.damage/4},.3,m.x,m.y);
  else if(c.effect==='homing'){
   const targets=window.GameManager.pawns.filter(p=>p.isAlive&&C.canEngage(m,p));
   for(let i=0;i<c.count;i++){const prey=targets[i%targets.length]||t;area({homing:prey,x:m.x,y:m.y,radius:c.radius,damage:c.damage/c.count,end:this.clock+3,speed:160+i%3*20},.3+i*.04,m.x,m.y);}
  }else if(c.effect==='spear')area({shape:'line',angle,length:c.range,radius:20,stun:.65},.35,m.x,m.y);
  else if(c.effect==='fissure')area({shape:'line',angle,length:c.range,radius:45,end:this.clock+4,tick:1,damage:c.damage/4},.5,m.x,m.y);
  else if(c.effect==='map_arrow')area({shape:'line',angle,length:1200,radius:22,damage:c.damage},.5,m.x,m.y);
  else if(c.effect==='matrix'){
   for(let i=0;i<6;i++)area({damage:c.damage/6,radius:65},.5+i*1,m.x+Math.cos(angle+i*Math.PI/3)*130,m.y+Math.sin(angle+i*Math.PI/3)*130);
  }else if(c.effect==='lasers')for(let i=0;i<3;i++)area({shape:'line',angle:angle+(i-1)*.6,length:500,radius:25,end:this.clock+2.5,tick:.6,damage:c.damage/12},.35+i*.3,m.x,m.y);
  else if(c.effect==='net')area({silence:.6,stun:.4,innerRadius:25},.3);
  else if(c.effect==='nuclear')area({damage:c.damage},.05,m.x,m.y);
 },
 split(m,t){
  if(m.isSplit)return;
  this.fields=this.fields.filter(f=>f.owner!==m);
  const E=window.GameEntities.EntityManager,M=window.GameEngine.MapTerrain;
  m.isSplit=true;m.action=null;m.attackState=null;m.combatLease=0;m.combatGroup=null;m.targetEnemy=null;
  m.clones=[-1,1].map(side=>{
   const pos=M.nearestFree(t.x+side*95,t.y+45);
   const c=E.spawnMonster({id:'mirror_clone',name:'Phân thân Phản Chiếu',tier:6,tierName:'Phân thân Thượng Cổ',maxHp:m.phaseMaxHp/2,attack:m.attack,defense:m.defense,speed:m.speed,scale:1,skills:[],visual:{type:'primordial_mirror'}},pos.x,pos.y);
   Object.assign(c,{cloneRole:side===-1?'pressure':'control',isAncientClone:true,ancientOwner:m,ancientKind:'mirror',statMultiplier:.5,weapon:m.original?.weapon?{...m.original.weapon}:null,armor:m.armor,helmet:m.helmet,boots:m.boots,appearance:m.appearance,classId:m.classId,speed:m.speed*.5,maxMana:m.maxMana*.5,currentMana:m.maxMana*.5,maxStamina:m.maxStamina*.5,currentStamina:m.maxStamina*.5,critChance:m.critChance*.5,skills:m.copiedSkills.filter(s=>side===-1?!['control','defense'].includes(s.def.role):['control','defense','strike'].includes(s.def.role)).map(s=>({...s,cooldownTimer:0})),passives:m.copiedPassives.map(p=>({...p,cooldownTimer:0})),territory:m.territory,ccImmune:true,expReward:0});return c;
  });
 },
 breakCover(x1,y1,x2,y2,r){
  const M=window.GameEngine.MapTerrain,dx=x2-x1,dy=y2-y1,len=dx*dx+dy*dy;
  for(const o of [...M.obstacles,...(this.arena?.covers||[])]){const x=o.x+o.w/2,y=o.y+o.h/2,t=Math.max(0,Math.min(1,((x-x1)*dx+(y-y1)*dy)/Math.max(1,len)));
   if(Math.hypot(x-x1-dx*t,y-y1-dy*t)<r+Math.max(o.w,o.h)/2)o.destroyed=true;}
  for(let y=Math.max(0,Math.floor((Math.min(y1,y2)-r)/M.cell));y<M.rows&&y<=(Math.max(y1,y2)+r)/M.cell;y++)for(let x=Math.max(0,Math.floor((Math.min(x1,x2)-r)/M.cell));x<M.cols&&x<=(Math.max(x1,x2)+r)/M.cell;x++)M.navBlocked[y*M.cols+x]=!M.canStand((x+.5)*M.cell,(y+.5)*M.cell,12);
 },
 incoming(a,m,damage,c,weapon){
  if(!m.isAncient)return damage;
  if(m.ancientKind==='colossus')return c.trueDamage?damage*.5:c.skill?damage:Math.max(damage*.6,damage-40);
  if(m.ancientKind==='mirror'){
   if(c.skill&&!m.foreseen){m.foreseen=true;window.GameRenderer.VfxManager.addDamageNumber(m.x,m.y,'TIÊN TRI','block');return 0;}
   if(weapon?.name&&weapon.name===m.weapon?.name)damage*=.6;
  }
  if(m.ancientKind==='void'){
   if(['poison','bleed'].includes(c.dot))return 0;
   if(c.projectile)damage*=.5;
  }
  if(m.ancientKind==='mecha'){
   if(Math.cos(Math.atan2(a.y-m.y,a.x-m.x)-m.aimAngle)<-.3)damage*=.65;
   m.heatHits=(m.heatHits||0)+1;if(m.heatHits>=10){m.heatHits=0;this.field(m,{name:'Xả Nhiệt Quá Tải',radius:130,damage:m.attack*.6},m.x,m.y,.3);}
   if(m.shield>0){const dealt=Math.min(m.shield,damage*.6);m.shield-=dealt;window.GameRenderer.VfxManager.addDamageNumber(m.x,m.y,Math.round(dealt),'block');return 0;}
   damage*=.6;
  }
  return damage;
 },
 afterDamage(a,t,damage,c){
  const C=window.GameEntities.CombatSystem;
  if(t.isAncientClone){t.ancientOwner.currentHp=t.ancientOwner.clones.reduce((sum,p)=>sum+(p.isAlive?p.currentHp:0),0);}
  if(t.isAncient){
   if(t.ancientKind==='void'&&(c.magic||c.skill&&c.magic===undefined&&a.classId==='mage'))t.currentHp=Math.min(t.maxHp,t.currentHp+damage*.2);
   if(t.ancientKind==='chaos'&&!c.reflected){const near=window.GameManager.pawns.filter(p=>p.isAlive&&C.canEngage(t,p)).sort((p,q)=>Math.hypot(p.x-t.x,p.y-t.y)-Math.hypot(q.x-t.x,q.y-t.y))[0];if(near)C.applyDamage(t,near,null,{baseDamage:damage*.1,reflected:true});}
  }
  if(a.isAncient&&a.ancientKind==='chaos'&&!c.reflected&&!c.dot)a.currentHp=Math.min(a.maxHp,a.currentHp+damage*.1);
 },
 control(p,kind,duration,source){if(p.ccImmune||p.invincible||p.controlImmunityTimer>0)return;p[kind]=window.GameEntities.RelicSystem.control(p,kind,duration,source);p.controlImmunityTimer=3;},
 tick(dt){
  if(!this.awakened){const G=window.GameManager;if(this.pendingGod){this.wakeRemaining=Math.max(0,this.wakeRemaining-dt);if(this.wakeRemaining===0&&G.battleRoyaleResolved&&G.winnerPawn?.isAlive&&G.winnerPawn.level>=15&&!window.GameEngine.MapTerrain.remainingLords())this.awaken(this.pendingGod,G.winnerPawn,true);}return;}
  this.clock+=dt;this.walls=this.walls.filter(w=>w.end>this.clock);
  const C=window.GameEntities.CombatSystem,M=window.GameEngine.MapTerrain,G=window.GameManager,m=this.boss;
  if(!m?.isAlive){if(this.victoryPending&&(this.original?.relicLoot?.isCollected||this.clock-this.finalAt>=5))this.showVictory();if(this.nextAt!==null&&this.clock>=this.nextAt)this.spawnNext();return;}
  if(m.isSplit){m.currentHp=m.clones.reduce((sum,c)=>sum+(c.isAlive?c.currentHp:0),0);this.fields=this.fields.filter(f=>f.owner!==m);return;}
  if(this.clock>=this.lightningAt){this.lightningAt=this.clock+4;this.field(m,{name:'Sấm Tận Thế',radius:45,damage:25},this.arena.x+Math.random()*this.arena.w,this.arena.y+Math.random()*this.arena.h,.8);}
  this.passives(m,dt);
  for(const f of this.fields){
   if(!f.owner.isAlive||f.warningOnly||this.clock<f.at||this.clock>=f.end)continue;
   if(f.homing){const p=f.homing;if(!p.isAlive){f.end=this.clock;continue;}if(!C.canSee(f.owner,p))continue;const dx=p.x-f.x,dy=p.y-f.y,d=Math.hypot(dx,dy);f.x+=dx/Math.max(1,d)*Math.min(d,(f.speed||100)*dt);f.y+=dy/Math.max(1,d)*Math.min(d,(f.speed||100)*dt);if(d>f.radius)continue;}
   if(f.nextTick>this.clock)continue;f.nextTick=this.clock+(f.tick||10);
   if(f.replaySkill){const t=f.replayTarget;if(t?.isAlive&&C.canEngage(f.owner,t))C.resolveSkill(f.owner,f.replaySkill,t,{...C.getSkillConfig(f.owner,f.replaySkill),useCurrentOrigin:true});f.end=this.clock;continue;}
   for(const p of G.pawns){
    if(!p.isAlive)continue;
    const dx=p.x-f.x,dy=p.y-f.y,d=Math.hypot(dx,dy),along=Math.cos(f.angle||0)*dx+Math.sin(f.angle||0)*dy,across=Math.abs(-Math.sin(f.angle||0)*dx+Math.cos(f.angle||0)*dy);
    const inside=f.shape==='line'?along>=0&&along<=f.length&&across<f.radius:f.shape==='cone'?d<f.radius&&Math.abs(Math.atan2(Math.sin(Math.atan2(dy,dx)-f.angle),Math.cos(Math.atan2(dy,dx)-f.angle)))<=f.arc:d<f.radius;
    if(!inside||(f.innerRadius&&d<f.innerRadius)||!C.canEngage(f.owner,p)||!C.reserveCombat(f.owner,p))continue;
    const dealt=f.damage>0||f.trueHpPct?C.applyDamage(f.owner,p,null,{baseDamage:f.trueHpPct?p.maxHp*f.trueHpPct:f.damage,skill:true,trueDamage:!!f.trueHpPct,effect:f.effect,magic:!['sweep','saw','leap','spear','cross'].includes(f.effect),element:['lava','nuclear','meteor'].includes(f.effect)?'fire':f.effect==='acid'?'poison':undefined}):1;
    if(!dealt||!p.isAlive)continue;
    if(f.stun)this.control(p,'stunTimer',f.stun,f.owner);if(f.silence)this.control(p,'silenceTimer',f.silence,f.owner);
    if(f.panic){p.panicSource=f.owner;this.control(p,'panicTimer',f.panic,f.owner);}
    if(f.armorBreak){p.armorBreak=f.armorBreak;p.armorBreakTimer=1.2;}
    if((f.pull||f.knockback)&&!window.GameEntities.RelicSystem.knockbackImmune(p)){const sign=f.knockback?1:-1,amount=f.knockback||f.pull;M.moveEntity(p,dx/Math.max(1,d)*amount*sign,dy/Math.max(1,d)*amount*sign);}
   }
   window.GameRenderer.VfxManager.addEffect('impact',f.x,f.y,{radius:f.radius,shape:f.shape,angle:f.angle,length:f.length,color:f.owner.ancientDef?.color||'#ad88ff',life:.4});
   if(f.homing)f.end=this.clock;
  }
  this.fields=this.fields.filter(f=>f.end>this.clock&&f.owner.isAlive);
 },
 passives(m,dt){
  const G=window.GameManager,C=window.GameEntities.CombatSystem,M=window.GameEngine.MapTerrain,kind=m.ancientKind;
  m.passiveClock+=dt;
  const pawns=G.pawns.filter(p=>p.isAlive&&C.canEngage(m,p));
  for(const p of pawns){const d=Math.hypot(p.x-m.x,p.y-m.y);
   if(kind==='colossus'&&d<300||kind==='mirror'&&d<200){p.auraSlow=kind==='colossus'?.3:.2;p.auraSlowTimer=.2;}
   if(kind==='colossus'){
    const elapsed=d<85?(m.petrification.get(p.id)||0)+dt:0;m.petrification.set(p.id,elapsed);
    if(elapsed>=5){this.control(p,'stunTimer',1.5,m);m.petrification.set(p.id,0);}
    const moved=Math.hypot(m.x-(m.lastStepX??m.x),m.y-(m.lastStepY??m.y));
    if(moved>25&&d<160){if(p.action?.kind==='skill'&&!p.action.released){p.action=null;p.attackState=null;}G.cameraShake=.25;}
   }
   if(kind==='void'&&d<120){p.currentStamina=Math.max(0,p.currentStamina-5*dt);}
  }
  if(kind==='colossus'&&Math.hypot(m.x-(m.lastStepX??m.x),m.y-(m.lastStepY??m.y))>25){m.lastStepX=m.x;m.lastStepY=m.y;}
  if(m.lastStepX===undefined){m.lastStepX=m.x;m.lastStepY=m.y;}
  if(kind==='void'&&m.passiveClock>=4){m.passiveClock=0;const prey=pawns.sort((a,b)=>a.currentHp/a.maxHp-b.currentHp/b.maxHp)[0];if(prey)this.field(m,{name:'Bào Tử Đói Khát',radius:24,damage:m.attack*.4},m.x,m.y,.1,{homing:prey,speed:95,end:this.clock+6});}
  if(kind==='void'&&m.phase===2)for(const item of G.dropItems)if(!item.isCollected&&Math.hypot(item.x-m.x,item.y-m.y)<650){item.isCollected=true;m.currentHp=Math.min(m.maxHp,m.currentHp+m.maxHp*.025);window.GameRenderer.VfxManager.addEffect('dash',item.x,item.y,{tx:m.x,ty:m.y,color:'#ac79ed',life:.5});}
  if(kind==='chaos'){
   m.attackSpeedMultiplier=1+(1-m.currentHp/m.maxHp);
   if(m.passiveClock>=2){m.passiveClock=0;
    const high=[...pawns].sort((a,b)=>b.level-a.level)[0],strong=high?.skills?.map(s=>({...s,tier:3,cooldownTimer:0})).sort((a,b)=>C.getSkillConfig(high,b).damage-C.getSkillConfig(high,a).damage)[0];
    if(strong&&high&&C.canSee(m,high)){const copied=C.getSkillConfig(m,strong);this.field(m,{name:'Tâm Ma: '+strong.def.name,radius:copied.radius,damage:0},high.x,high.y,.8,{damage:Math.min(m.attack*.6,copied.damage),replayTarget:high});}
    if(m.phase===2)for(let i=0;i<4;i++){const t=pawns[i%pawns.length];if(t)this.field(m,{name:'Linh Hồn Binh Khí',radius:28,damage:m.attack*.35},m.x+Math.cos(i*Math.PI/2)*65,m.y+Math.sin(i*Math.PI/2)*65,.2,{homing:t,speed:170,end:this.clock+4});}
   }
  }
  if(kind==='mecha'&&m.passiveClock>=1.5){m.passiveClock=0;const far=pawns.filter(p=>Math.hypot(p.x-m.x,p.y-m.y)>130).sort((a,b)=>b.currentHp-a.currentHp)[0];if(far)this.field(m,{name:'Súng Phụ Tự Động',radius:20,damage:m.attack*.25},m.x,m.y,.1,{homing:far,speed:270,end:this.clock+3});}
 },
 avoid(p,dt){
  const G=window.GameManager,A=window.GameAI.AIBrain,M=window.GameEngine.MapTerrain;
  if(p.panicTimer>0)p.fear=Math.min(70,(p.fear||0)+dt*3);
  const danger=this.fields.find(f=>{
   if(f.end<=this.clock||f.homing)return false;
   const dx=p.x-f.x,dy=p.y-f.y;
   return f.shape==='line'?dx*Math.cos(f.angle)+dy*Math.sin(f.angle)>=0&&dx*Math.cos(f.angle)+dy*Math.sin(f.angle)<f.length&&Math.abs(-dx*Math.sin(f.angle)+dy*Math.cos(f.angle))<f.radius+20:f.shape==='cone'?Math.hypot(dx,dy)<f.radius+20&&Math.cos(Math.atan2(dy,dx)-f.angle)>Math.cos(f.arc):Math.hypot(dx,dy)<f.radius+20&&(!f.innerRadius||Math.hypot(dx,dy)>f.innerRadius);
  });
  if(!danger){p.ancientEscape=null;return false;}
  if(p.ancientEscape?.field===danger&&M.canStand(p.ancientEscape.x,p.ancientEscape.y)&&Math.hypot(p.x-p.ancientEscape.x,p.y-p.ancientEscape.y)>15){A.moveToTarget(p,p.ancientEscape.x,p.ancientEscape.y,dt);return true;}
  if(danger.effect==='nuclear'){
   if(!M.segmentClear(danger.x,danger.y,p.x,p.y,false,0)){p.objective='Nấp sau tàn tích, chờ vụ nổ';p.vx=p.vy=0;return true;}
   const cover=(this.arena?.covers||M.obstacles).filter(o=>!o.destroyed).map(o=>{
    const x=o.x+o.w/2,y=o.y+o.h/2,a=Math.atan2(y-danger.y,x-danger.x),r=Math.hypot(o.w,o.h)/2+25;
    return {x:x+Math.cos(a)*r,y:y+Math.sin(a)*r};
   }).filter(pos=>Math.hypot(pos.x-p.x,pos.y-p.y)<350&&M.canStand(pos.x,pos.y)&&M.canTravel(p,pos.x,pos.y)&&!M.segmentClear(danger.x,danger.y,pos.x,pos.y,false,0));
   cover.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
   if(cover[0]){p.ancientEscape={...cover[0],field:danger};p.objective='Tìm tàn tích chắn vụ nổ';A.moveToTarget(p,cover[0].x,cover[0].y,dt);return true;}
  }
  p.objective='Né vùng Thượng Cổ: '+danger.name;p.thought='Đọc dấu cảnh báo, tìm đường thoát hoặc chỗ che chắn.';
  if(danger.at-this.clock<.35&&window.GameEntities.RelicSystem.tryDash(p,danger.owner,'counter'))return true;
  const angle=danger.shape==='line'?danger.angle+Math.PI/2:Math.atan2(p.y-danger.y,p.x-danger.x),distance=danger.shape==='line'?danger.radius+45:Math.max(65,danger.radius-Math.hypot(p.x-danger.x,p.y-danger.y)+65);
  if(danger.at-this.clock<.3&&window.GameEntities.RelicSystem.has(p,'treads')&&window.GameEntities.CombatSystem.defend(p,'dodge',angle))return true;
  for(const offset of [0,.8,-.8,1.6,-1.6,Math.PI]){
   const x=p.x+Math.cos(angle+offset)*distance,y=p.y+Math.sin(angle+offset)*distance;
   if(M.canTravel(p,x,y)&&M.canStand(x,y)&&M.segmentClear(p.x,p.y,x,y,false,9,p)){p.ancientEscape={field:danger,x,y};A.moveToTarget(p,x,y,dt);return true;}
  }
  return false;
 },
 prepare(p,dt){
  if(!this.awakened){
   if(!this.pendingGod||!window.GameManager.battleRoyaleResolved)return false;
   const A=window.GameAI.AIBrain,C=window.GameEntities.CombatSystem;
   const item=A.findBestItemToLoot(p,window.GameManager.dropItems.filter(d=>Math.hypot(d.x-this.pendingGod.x,d.y-this.pendingGod.y)<150));
   if(item){A.seekLoot(p,item,dt);return true;}
   if(p.currentHp<p.maxHp*.85)C.usePotion(p);
   if(p.level>=15&&!window.GameEngine.MapTerrain.remainingLords()){p.vx=p.vy=0;p.objective='Chuẩn bị Thượng Cổ • '+Math.ceil(this.wakeRemaining)+'s';return true;}
   return false;
  }
  if(p!==this.original)return false;
  const A=window.GameAI.AIBrain,C=window.GameEntities.CombatSystem,G=window.GameManager;
  const relic=p.relicLoot;
  if(relic&&!relic.isCollected){
   p.action=null;p.attackState=null;A.seekLoot(p,relic,dt);p.objective='Nhặt Thượng Bảo: '+relic.name;p.thought='Ưu tiên chiến lợi phẩm, thích ứng trang bị trước lượt boss tiếp theo.';return true;
  }
  if(p.relicPriorityUntil>this.clock){p.vx=p.vy=0;p.objective='Thích ứng Thượng Bảo vừa nhặt';return true;}
  if(this.boss?.isAlive)return false;
  const item=A.findBestItemToLoot(p,G.dropItems.filter(d=>!d.isCollected));
  if(item){A.seekLoot(p,item,dt);return true;}
  if(p.currentHp<p.maxHp*.85&&C.usePotion(p))return true;
  p.vx=p.vy=0;p.targetEnemy=null;p.objective=this.victoryPending?'Hoàn tất chuỗi 5 Thượng Cổ':'Chuẩn bị boss '+(this.defeated+1)+'/5 • '+Math.max(0,(this.nextAt||0)-this.clock).toFixed(1)+'s';p.thought='Giữ thể lực, mana và hồi chiêu trong khoảng nghỉ 10 giây.';return true;
 },
 render(ctx){
  if(!this.awakened)return;
  const G=window.GameManager,a=this.arena;ctx.save();
  if(a){
   ctx.fillStyle='#3a3542';ctx.fillRect(a.x,a.y,a.w,a.h);ctx.strokeStyle='#645765';ctx.lineWidth=1;
   for(let i=0;i<=a.w;i+=25){ctx.beginPath();ctx.moveTo(a.x+i,a.y);ctx.lineTo(a.x+i,a.y+a.h);ctx.moveTo(a.x,a.y+i);ctx.lineTo(a.x+a.w,a.y+i);ctx.stroke();}
   for(const cover of a.covers.filter(o=>!o.destroyed)){ctx.fillStyle='#24212d';ctx.fillRect(cover.x+8,cover.y+8,cover.w,cover.h);ctx.fillStyle='#7c6876';ctx.fillRect(cover.x,cover.y-15,cover.w,cover.h+15);ctx.strokeStyle='#d4ac8e';ctx.lineWidth=2;ctx.strokeRect(cover.x,cover.y-15,cover.w,cover.h+15);}
   const t=Math.min(1,(this.clock-a.started)/6),x=a.x*t,y=a.y*t,w=G.width+(a.w-G.width)*t,h=G.height+(a.h-G.height)*t;
   ctx.fillStyle='#100e19';ctx.fillRect(0,0,G.width,y);ctx.fillRect(0,y,x,h);ctx.fillRect(x+w,y,G.width-x-w,h);ctx.fillRect(0,y+h,G.width,G.height-y-h);
   ctx.strokeStyle='#bc85ec';ctx.shadowColor='#a16fea';ctx.shadowBlur=18;ctx.lineWidth=5;ctx.strokeRect(x,y,w,h);ctx.shadowBlur=0;ctx.strokeStyle='#f6cf9a';ctx.lineWidth=2;ctx.strokeRect(a.x,a.y,a.w,a.h);
  }
  ctx.fillStyle=this.boss?.ancientKind==='mecha'?'rgba(75,62,68,.24)':'rgba(180,35,35,.14)';ctx.fillRect(0,0,G.width,G.height);
  for(const o of window.GameEngine.MapTerrain.obstacles.filter(o=>o.destroyed)){ctx.fillStyle='#4e3237';ctx.fillRect(o.x,o.y,o.w,o.h);ctx.strokeStyle='#ffb48b';ctx.beginPath();ctx.moveTo(o.x,o.y);ctx.lineTo(o.x+o.w*.4,o.y+o.h*.65);ctx.lineTo(o.x+o.w,o.y+o.h);ctx.stroke();}
  for(const w of this.walls){ctx.fillStyle='#664953';ctx.strokeStyle='#ffc684';ctx.lineWidth=3;ctx.fillRect(w.x,w.y-35,w.w,w.h+35);ctx.strokeRect(w.x,w.y-35,w.w,w.h+35);}
  if(a){ctx.beginPath();ctx.rect(a.x,a.y,a.w,a.h);ctx.clip();}
  for(const f of this.fields){ctx.strokeStyle=f.owner.ancientDef?.color||'#bfa1ee';ctx.fillStyle=ctx.strokeStyle;ctx.globalAlpha=this.clock<f.at?.18:.32;
   if(f.homing){ctx.beginPath();ctx.ellipse(f.x,f.y,12,8,0,0,Math.PI*2);ctx.fill();ctx.stroke();}
   else if(f.shape==='line'){ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.angle);ctx.fillRect(0,-f.radius,f.length,f.radius*2);ctx.restore();}
   else{ctx.beginPath();ctx.arc(f.x,f.y,f.radius,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.8;ctx.lineWidth=2;ctx.stroke();}
  }ctx.restore();
 },
 renderSky(ctx,w,h){if(!this.awakened)return;ctx.save();ctx.strokeStyle='#ffc7b8';ctx.lineWidth=2;ctx.globalAlpha=.5;
  for(let i=0;i<4;i++){const x=(i+.2)*w/4;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+20,35);ctx.lineTo(x-10,62);ctx.lineTo(x+45,95);ctx.stroke();}
  ctx.fillStyle='#ffe1cb';ctx.font='bold 16px Arial';ctx.textAlign='center';ctx.fillText(this.nextAt!==null?'BOSS TIẾP THEO • '+Math.max(0,this.nextAt-this.clock).toFixed(1)+'s':'THƯỢNG CỔ '+(this.boss?.gauntletRound||1)+'/5 • ĐẤU TRƯỜNG 1500×1500',w/2,125);ctx.restore();}
};
