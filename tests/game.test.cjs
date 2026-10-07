const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Run the actual browser scripts with a tiny DOM/Canvas stub; no test dependency.
function loadGame(seed = 42, { openTemple = false } = {}) {
  const elements = new Map();
  const ctx = new Proxy({}, { get: (target, key) => target[key] || (() => ({ addColorStop() {} })) });
  ctx.arc = (x, y, radius) => assert.ok(radius >= 0, 'Canvas arc radius must not be negative');
  const element = () => ({ style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {}, appendChild() {}, getContext: () => ctx });
  const math = Object.create(Math);
  math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  const document = { readyState: 'loading', createElement: element, querySelectorAll: () => [], getElementById(id) {
    if (!elements.has(id)) elements.set(id, element());
    return elements.get(id);
  }};
  const context = { window: { addEventListener() {}, innerWidth: 1366, innerHeight: 768 },
    document, Math: math, performance, requestAnimationFrame() {}, console };
  vm.createContext(context);
  const root = path.resolve(__dirname, '..');
  const entry = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');
  for (const [, relative] of entry.matchAll(/import '(.*?)';/g)) {
    const filename = path.join(root, 'js', relative);
    vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
  }
  context.window.__math=math;context.window.documentText=id=>elements.get(id)?.innerHTML || "";
  context.window.GameManager.init();
  if(openTemple)context.window.GameManager.monsters.filter(m=>m.tier===4).forEach(m=>m.isAlive=false);
  return context.window;
}

test('every monster definition renders, including centaur', () => {
  const w = loadGame();
  const E = w.GameEntities.EntityManager;
  for (const definitions of Object.values(w.GameData.Monsters)) {
    for (const def of definitions) w.GameRenderer.MonsterRenderer.render(w.GameManager.ctx, E.spawnMonster(def, 100, 100), false);
  }
});

test('empty hunting targets are safe, drops stay shared and cannot be collected twice', () => {
  const w = loadGame(), G = w.GameManager, A = w.GameAI.AIBrain;
  const p = G.pawns[0];
  A.huntSuitableMonster(p, [], 0.1);
  G.update(0.1);
  const item = G.spawnDropItem(p.x, p.y, w.GameData.Equipments.weapons.w_wooden_wand);
  assert.equal(G.dropItems, w.GameEntities.EntityManager.dropItems);
  assert.ok(G.dropItems.includes(item));
  assert.equal(A.lootItem(p, item), true);
  assert.equal(A.lootItem(G.pawns[1], item), false);
  G.update(0.1);
  assert.equal(G.dropItems.includes(item), false);
});

test('class skills, skill points, resource costs and cooldowns remain consistent', () => {
  const w = loadGame(42,{openTemple:true}), G = w.GameManager, A = w.GameAI.AIBrain, C = w.GameEntities.CombatSystem;
  const p = G.pawns[0], target = G.pawns[1];
  p.x = target.x = 2600; p.y = target.y = 2600;
  p.currentHp = p.maxHp = target.currentHp = target.maxHp = 10000;
  A.handleLevelingAndSkills(p);
  assert.equal(p.skills.length, 0);
  A.lootItem(p, G.spawnDropItem(p.x, p.y, w.GameData.Equipments.weapons.w_wooden_wand));
  assert.equal(p.classId, 'mage');
  assert.equal(p.skills[0].id, 'm_fireball');
  p.skills = []; p.classId = 'warrior'; p.unspentSkillPoints = 15;
  A.handleLevelingAndSkills(p);
  assert.equal(p.skills.length, 4);
  assert.equal(p.skills.reduce((sum, s) => sum + s.tier, 0) + p.unspentSkillPoints, 15);
  const mana = p.currentMana, stamina = p.currentStamina;
  assert.equal(C.castSkill(p, p.skills[0], target), true);
  assert.equal(p.currentMana, mana);
  assert.equal(p.currentStamina, stamina - 15);
  assert.equal(target.currentHp,10000);
  G.spatialGrid.clear();G.spatialGrid.insert(p);G.spatialGrid.insert(target);
  C.updateStatus(p,.6);
  assert.ok(target.currentHp < 10000);
  assert.equal(C.castSkill(p, p.skills[0], target), false);
  assert.ok(Number.isFinite(p.currentMana));
  p.currentExp = 99999; p.level = 1;
  C.checkLevelUp(p);
  assert.equal(p.level, 15);
});

test('pacts track the actual boss and damage rejects allies', () => {
  const w = loadGame(), G = w.GameManager, A = w.GameAI.AIBrain, C = w.GameEntities.CombatSystem;
  const [p, ally] = G.pawns;
  p.trait = 'greedy';p.personality={...w.GameData.PersonalityProfiles.greedy,loyalty:35};p.level=ally.level=10;p.attack=95;p.currentHp=p.maxHp=1400; ally.currentHp = 50;
  const boss = G.monsters.find(m => m.tier === 4);
  A.handleAllianceAndBetrayal(p, [boss], [ally]);
  A.handleAllianceAndBetrayal(p, [], []);
  assert.equal(p.allyPawn, ally);
  C.applyDamage(p, ally, null);
  assert.equal(ally.currentHp, 50);
  boss.isAlive = false;
  A.handleAllianceAndBetrayal(p, [], []);
  assert.equal(p.allyPawn, null);
  assert.equal(ally.allyPawn, null);
});

test('equipment HP does not stack on replacement; helmets mitigate damage', () => {
  const w = loadGame(), G = w.GameManager, A = w.GameAI.AIBrain, C = w.GameEntities.CombatSystem;
  const [attacker, target] = G.pawns;
  attacker.trait = 'wise';
  const helmet = w.GameData.Equipments.armors.a_guard_helmet;
  const baseHp = target.maxHp;
  A.lootItem(target, G.spawnDropItem(target.x, target.y, helmet, 'head'));
  A.lootItem(target, G.spawnDropItem(target.x, target.y, helmet, 'head'));
  assert.equal(target.maxHp, baseHp + helmet.hp);
  target.helmet = { defense: 999 }; target.currentHp = 1000;
  C.applyDamage(attacker, target, null);
  assert.ok(1000 - target.currentHp <= 3);
  target.armor = w.GameData.Equipments.armors.a_phoenix_cloak;
  target.currentHp = 1;
  C.applyDamage(attacker, target, null, { baseDamage: 10000 });
  assert.equal(target.isAlive, true);
  assert.equal(target.hasRevived, true);
  target.currentHp = 0;
  C.handleDeath(null, target);
  assert.equal(target.isAlive, false, 'revival can only happen once');
});

test('water, pause, emotion ticks and invincibility behave correctly', () => {
  const w = loadGame(), G = w.GameManager, C = w.GameEntities.CombatSystem, M = w.GameEngine.MapTerrain;
  const p = G.pawns[0], water = M.waterBodies[0];
  p.x = water.x; p.y = water.y;
  assert.equal(M.getMoveSpeed(p), p.moveSpeed * 0.45);
  assert.equal(C.canAttack(p), false);
  p.waterWalkTimer = 3;
  assert.equal(C.canAttack(p), false);
  p.x = p.y = 2600; p.confidence = 50;
  G.pawns = [p, { ...p, id: 'other', x: 2400, y: 2400 }]; G.monsters = [];
  G.update(0.1);
  assert.equal(p.confidence, 49.75);
  G.isPaused = true;
  const hp = p.currentHp, x = p.x;
  G.update(1); G.executePlayerSkill('q');
  assert.equal(p.currentHp, hp); assert.equal(p.x, x);
  G.isPaused = false;
  assert.equal(w.GameEngine.ZoneCircle,undefined);
  G.render();
  w.GameAI.EmotionEngine.triggerBreakthrough(p, true);
  assert.equal(p.isBerserk, true); assert.equal(p.isClutchEscape, false);
  G.pawns.forEach(e => e.isAlive = false); G.checkVictoryCondition();
  assert.equal(G.isGameOver, true); assert.equal(G.winnerPawn, null);
});

test('a complete seeded match finishes with finite state and real loot/progression', () => {
  const w = loadGame(), G = w.GameManager;
  let dropsSeen = 0;
  for (let i = 0; i < 18000 && !G.battleRoyaleResolved; i++) {
    G.matchTime += 0.1;
    G.update(0.1);
    dropsSeen = Math.max(dropsSeen, G.dropItems.length);
    if (i % 100 === 0) G.render();
    if(i%10===0){const C=w.GameEntities.CombatSystem;
      for(const p of G.pawns.filter(p=>p.isAlive)){assert.ok(C.validMembers(C.crowdAt(p,p.x,p.y)),p.id+' overcrowded');}
      for(const e of [...G.pawns,...G.monsters].filter(e=>e.isAlive&&e.combatLease>0))assert.ok(C.validMembers(new Set(C.groupMembers(e).filter(p=>p.isAlive&&p.combatLease>0))),e.id+' linked battle exceeds cap');
    }
  }
  assert.equal(G.battleRoyaleResolved, true, 'last survivor must be found within 30 simulated minutes without a storm');
  assert.ok(G.pawns.filter(p => p.isAlive).length <= 1);
  assert.ok(dropsSeen > 0);
  // Low-tier loot is probabilistic: a valid seed may award only potions/armor.
  assert.ok(G.monsters.some(m => !m.isAlive));
  assert.ok(G.pawns.some(p => p.level > 1));
  assert.ok(G.monsters.some(m => m.skillsCast > 0));
  for (const p of G.pawns) for (const k of ['x', 'y', 'currentHp', 'currentMana', 'currentStamina']) assert.ok(Number.isFinite(p[k]), `${p.id}.${k}`);
});

test('exact monster counts and no random equipment at initialization', () => {
  const w=loadGame(), G=w.GameManager;
  assert.deepEqual([1,2,3,4,5].map(t=>G.monsters.filter(m=>m.tier===t).length),[40,20,6,4,1]);
  assert.equal(G.dropItems.length,0);
  w.GameUI.DirectorControls.useGodPower('airdrop');
  assert.equal(w.GameUI.DirectorControls.activeGodPower,null);
});

test('drop chance boundaries and cardinality, with no loot from dead bots', () => {
  const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem;
  for(const [tier,chance] of [[1,.2],[2,.3],[3,.4]]){
    const m=G.monsters.find(e=>e.tier===tier);
    G.dropItems.length=0;w.__math.random=()=>chance;C.dropLootOnDeath(m);assert.equal(G.dropItems.length,0);
    w.__math.random=()=>chance-.0001;C.dropLootOnDeath(m);assert.equal(G.dropItems.length,1);
    assert.equal(G.dropItems[0].slot,'potion');
    G.dropItems.length=0;let calls=0;w.__math.random=()=>++calls===1?0:.9;
    C.dropLootOnDeath(m);assert.equal(G.dropItems.length,1);assert.notEqual(G.dropItems[0].slot,'potion');
  }
  for(const tier of [4,5]){
    G.dropItems.length=0;w.__math.random=()=>.99;
    C.dropLootOnDeath(G.monsters.find(e=>e.tier===tier));
    assert.equal(G.dropItems.length,2);assert.equal(G.dropItems.filter(e=>e.slot==='potion').length,1);
  }
  G.dropItems.length=0;C.dropLootOnDeath(G.pawns[0]);assert.equal(G.dropItems.length,0);
});

test('every weapon style winds up before contact and resets after recovery',()=>{
  const w=loadGame(42,{openTemple:true}),G=w.GameManager,C=w.GameEntities.CombatSystem;
  const [p,t]=G.pawns;p.x=2600;p.y=2600;t.x=2620;t.y=2600;p.critChance=0;
  for(const style of Object.keys(C.styles)){
    p.weapon={type:style,attack:10,range:140,speed:1};p.action=null;p.attackCooldown=0;
    t.currentHp=t.maxHp=10000;
    assert.equal(C.executeAttack(p,t),true,style);
    assert.equal(t.currentHp,10000,style+' cannot hit immediately');
    assert.equal(C.executeAttack(p,t),false,style+' cannot spam while attacking');
    C.updateStatus(p,C.styles[style].windup+.001);
    w.GameRenderer.VfxManager.update(.3);
    assert.ok(t.currentHp<10000,style+' contact should hit');
    w.GameRenderer.ProceduralPawn.render(G.ctx,p,p.appearance,false);
    C.updateStatus(p,1);assert.equal(p.action,null,style+' recovery');
  }
});

test('directional block and active dodge change actual damage',()=>{
  const w=loadGame(42,{openTemple:true}),C=w.GameEntities.CombatSystem,[a,t]=w.GameManager.pawns;
  a.x=2620;a.y=t.y=2600;t.x=2600;a.critChance=0;t.currentHp=t.maxHp=10000;
  const normal=C.applyDamage(a,t,null,{baseDamage:100});t.currentHp=10000;
  assert.equal(C.defend(t,'block',0),true);
  const blocked=C.applyDamage(a,t,null,{baseDamage:100});assert.ok(blocked<normal*.5);
  t.action=null;t.defenseCooldown=0;t.currentStamina=100;
  assert.equal(C.defend(t,'dodge',Math.PI/2),true);
  assert.equal(C.applyDamage(a,t,null,{baseDamage:100}),0);
  C.updateStatus(t,.2);assert.ok(t.y>2600);
  C.updateStatus(t,.4);assert.equal(t.action,null);
});

test('HP stays unchanged without a healing skill, level-up or collected potion',()=>{
  const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem,A=w.GameAI.AIBrain,p=G.pawns[0];
  p.currentHp=50;
  C.updateStatus(p,30);assert.equal(p.currentHp,50);
  const armor={name:'Test',tier:'common',hp:80,defense:5};
  A.lootItem(p,G.spawnDropItem(p.x,p.y,armor,'body'));assert.equal(p.currentHp,50,'equipping HP does not heal');
  assert.equal(C.usePotion(p),false);
  const bottle=G.spawnDropItem(p.x,p.y,C.potion,'potion');
  assert.equal(A.findBestItemToLoot(p,[bottle]),bottle);A.lootItem(p,bottle);
  assert.equal(C.usePotion(p),true);assert.equal(p.currentHp,50);C.updateStatus(p,.7);
  assert.ok(p.currentHp>50);assert.equal(p.healthPotions,0);
  const hp=p.currentHp;C.updateStatus(p,30);assert.equal(p.currentHp,hp);
  p.currentExp=1000;C.checkLevelUp(p);assert.equal(p.currentHp,p.maxHp);
});

test('monster skill cooldown only ticks once, CC and skill damage are bounded',()=>{
  const w=loadGame(42,{openTemple:true}),G=w.GameManager,C=w.GameEntities.CombatSystem;
  const m=G.monsters.find(m=>m.tier===5),p=G.pawns[0];
  m.x=p.x=2600;m.y=p.y=2600;p.currentHp=p.maxHp=10000;
  G.spatialGrid.clear();G.spatialGrid.insert(p);G.spatialGrid.insert(m);
  const skill=m.skills[0];skill.cooldownTimer=0;
  assert.equal(C.castSkill(m,skill,p),true);const cd=skill.cooldownTimer;
  assert.equal(C.castSkill(m,skill,p),false);
  C.updateStatus(m,.1);assert.ok(Math.abs(skill.cooldownTimer-(cd-.1))<1e-8);
  C.updateStatus(m,.8);assert.ok(p.currentHp<10000);
  assert.ok((p.stunTimer||0)<=.7);
  for(const data of Object.values(w.GameData.Skills))for(const def of data.actives){
    const c=C.getSkillConfig(p,{def,tier:3});
    assert.ok(c.cooldown>=6);assert.ok(c.damage<=p.attack*2.1);assert.ok(c.stun<=.9);assert.ok(c.slow<=.45);
  }
});

test('result popup pauses once, closes and sole survivor targets the living boss',()=>{
  const w=loadGame(),G=w.GameManager,p=G.pawns[0],boss=w.GameEntities.EntityManager.worldBoss;
  G.pawns.forEach(e=>e.isAlive=e===p);
  G.checkVictoryCondition();assert.equal(G.battleRoyaleResolved,true);assert.equal(G.resultOpen,true);
  assert.equal(G.isPaused,true);assert.equal(G.isGameOver,false);assert.equal(G.winnerPawn,p);
  assert.match(w.GameUI.DirectorControls && w.documentText('story-card-modal'),/btn-continue/);
  assert.equal(G.continueAfterResult(),true);G.update(.1);
  assert.notEqual(p.targetEnemy,boss);assert.match(p.objective,/Farm|cấp 15|Yêu Vương/);
  assert.equal(G.resultOpen,false);G.checkVictoryCondition();assert.equal(G.resultOpen,false);
});

test('bridges count as dry terrain; inspection exposes skills, cooldown and intent',()=>{
  const w=loadGame(),M=w.GameEngine.MapTerrain,I=w.GameUI.InspectModal,G=w.GameManager;
  assert.equal(M.isInWater(M.riverX(500),500),true);
  assert.equal(M.isInWater(M.riverX(M.bridges[0]),M.bridges[0]),false);
  const m=G.monsters.find(e=>e.tier===5);I.inspect(m);
  assert.match(w.documentText('inspect-panel'),/Kỹ năng quái/);assert.match(w.documentText('inspect-panel'),/Cooldown/);
  I.inspect(G.pawns[0]);assert.match(w.documentText('inspect-panel'),/Suy nghĩ & mục tiêu/);
  assert.match(w.documentText('inspect-panel'),/Bình máu/);
});

test('monsters share a faction and a projectile can miss a moving target',()=>{
 const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem,[a,t]=G.pawns;
 assert.equal(C.isEnemy(G.monsters[0],G.monsters[1]),false);
 a.x=2600;a.y=2600;t.x=2660;t.y=2600;t.currentHp=t.maxHp=1000;
 a.weapon={type:'bow',range:150,attack:20,speed:1};
 C.executeAttack(a,t);
 t.y+=70;
 C.updateStatus(a,.5);w.GameRenderer.VfxManager.update(.5);
 assert.equal(t.currentHp,1000,'projectile keeps the windup aim instead of following the dodging target');
});

test('all boss passives have valid labels and a bounded cooldown',()=>{
 const w=loadGame(),E=w.GameEntities.EntityManager;
 for(const def of w.GameData.Monsters.worldBosses){
  const m=E.spawnMonster(def,2600,2600);
  assert.equal(m.dropTier,'god');
  for(const p of m.passives){assert.equal(typeof p.name,'string');assert.ok(p.cooldown>=8);}
  w.GameUI.InspectModal.inspect(m);assert.ok(!w.documentText('inspect-panel').includes('undefined'));
 }
});

test('bot PvP always drops carried gear or a 25% upgrade, and awards level-scaled XP',()=>{
 const w=loadGame(),C=w.GameEntities.CombatSystem,G=w.GameManager,[k,v]=G.pawns;
 w.GameRenderer.VfxManager.addBurstParticles=()=>{};
 v.weapon=w.GameData.Equipments.weapons.w_wooden_wand;w.__math.random=()=>.25;
 C.handleDeath(k,v);assert.equal(k.level,1);assert.equal(k.currentExp,60);assert.equal(G.dropItems.length,1);assert.equal(G.dropItems[0].data.id,v.weapon.id);
 const v2=G.pawns[2];v2.level=8;v2.weapon={id:'victim_sword',name:'Sword',type:'sword',tier:'super_rare'};
 w.__math.random=()=>.24999;C.handleDeath(k,v2);assert.equal(G.dropItems[1].tier,'supreme');assert.equal(k.currentExp,540);assert.equal(k.level,5);
 const count=G.dropItems.length;C.handleDeath(G.monsters[0],G.pawns[3]);assert.equal(G.dropItems.length,count);
 k.isPlayerControlled=true;C.handleDeath(k,G.pawns[4]);assert.equal(G.dropItems.length,count);assert.equal(k.currentExp,600);
});

test('PvP upgrade caps at god, naked victims get an item, and gear preserves its slot',()=>{
 const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem,[k,v]=G.pawns;
 v.weapon={id:'unique',name:'Unique',tier:'god',slot:'weapon'};w.__math.random=()=>.25;C.rewardBotKill(k,v);assert.equal(G.dropItems[0].data.id,'unique');
 w.__math.random=()=>.24999;C.rewardBotKill(k,v);assert.equal(G.dropItems[1].tier,'god');
 v.weapon=null;v.armor={id:'armor',name:'Armor',tier:'rare',slot:'body'};w.__math.random=()=>.8;C.rewardBotKill(k,v);assert.equal(G.dropItems[2].slot,'body');assert.equal(G.dropItems[2].data.id,'armor');
 v.armor=null;C.rewardBotKill(k,v);assert.equal(G.dropItems.length,4);assert.ok(['common','rare'].includes(G.dropItems[3].tier));
});

test('combat groups stop a fourth solo, allow two mutual allied pairs and reject a fifth',()=>{
 const w=loadGame(),C=w.GameEntities.CombatSystem,[a,b,c,d,e]=w.GameManager.pawns;
 assert.equal(C.reserveCombat(a,b),true);assert.equal(C.reserveCombat(c,b),true);
 assert.equal(C.canJoin(d,b),false);
 for(const p of [a,b,c,d,e]){p.combatGroup=null;p.combatLease=0;}
 a.allyPawn=b;b.allyPawn=a;c.allyPawn=d;d.allyPawn=c;
 assert.equal(C.reserveCombat(a,c),true);assert.equal(C.reserveCombat(b,c),true);
 assert.equal(C.reserveCombat(d,a),true);assert.equal(a.combatGroup.members.size,4);
 assert.equal(C.canJoin(e,a),false);
 a.allyPawn=null;assert.equal(C.canJoin(d,a),false);
 for(const p of [a,b,c,d])C.updateStatus(p,7);
 assert.equal(C.canJoin(e,a),true);
});

test('area skill cannot damage a fourth participant and buildings stop melee and projectiles',()=>{
 const w=loadGame(42,{openTemple:true}),G=w.GameManager,C=w.GameEntities.CombatSystem,M=w.GameEngine.MapTerrain;
 const [a,b,c,d]=G.pawns;[a,b,c,d].forEach((p,i)=>{p.x=2600+i*10;p.y=2600;p.currentHp=p.maxHp=1000;});
 C.reserveCombat(a,b);C.reserveCombat(a,c);
 assert.equal(C.applyDamage(a,d,null,{baseDamage:100,skill:true}),0);
 const wall=M.obstacles.find(o=>o.kind==='wall'&&o.w>o.h);
 a.x=wall.x+wall.w/2;a.y=wall.y-20;b.x=a.x;b.y=wall.y+wall.h+20;
 a.combatGroup=b.combatGroup=null;a.combatLease=b.combatLease=0;
 assert.equal(C.canEngage(a,b),false);assert.equal(C.applyDamage(a,b,null,{baseDamage:100}),0);
 const p={x:a.x,y:a.y,isAlive:true};M.moveEntity(p,0,300);assert.ok(p.y<=wall.y-9);
});

test('world doubled, spawns are free, navigation goes around buildings and crosses a dry bridge',()=>{
 const w=loadGame(),G=w.GameManager,M=w.GameEngine.MapTerrain;
 assert.equal(G.width,5200);assert.equal(G.height,5200);
 assert.ok([...G.pawns,...G.monsters].every(p=>M.canStand(p.x,p.y)));
 const o=M.obstacles.find(o=>o.kind==='building');
 const from=M.nearestFree(o.x-30,o.y+o.h/2),to=M.nearestFree(o.x+o.w+30,o.y+o.h/2);
 const path=M.findPath(from.x,from.y,to.x,to.y);assert.ok(path.length);
 let previous=from;for(const p of path){assert.ok(M.segmentClear(previous.x,previous.y,p.x,p.y));previous=p;}
 const y=2600,rx=M.riverX(y),route=M.findPath(rx-180,y,rx+180,y);
 assert.ok(route.length);assert.ok(route.every(p=>!M.isInWater(p.x,p.y)),'land-connected route must use a bridge');
 const entity={...from,moveSpeed:95,isAlive:true};let reached=false;
 for(let i=0;i<800;i++){M.navigate(entity,to.x,to.y,.1);assert.ok(M.canStand(entity.x,entity.y));if(Math.hypot(entity.x-to.x,entity.y-to.y)<50){reached=true;break;}}
 assert.equal(reached,true,'must not stall against building');
});

test('river disables attacks, skills, defensive actions and incoming damage, even with water-walk buff',()=>{
 const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem,M=w.GameEngine.MapTerrain,[a,b]=G.pawns;
 a.x=M.riverX(2600);a.y=2600;b.x=a.x+5;b.y=a.y;a.waterWalkTimer=10;
 assert.equal(C.canAttack(a),false);assert.equal(C.defend(a,'dodge'),false);
 assert.equal(C.applyDamage(a,b,null,{baseDamage:100}),0);
 assert.equal(M.getMoveSpeed(a),a.moveSpeed*.45);
});

test('population thresholds no longer shrink the map or inflict storm damage',()=>{
 const w=loadGame(),G=w.GameManager,p=G.pawns[0];G.monsters=[];
 assert.equal(w.GameEngine.ZoneCircle,undefined);
 for(const count of [20,10,5]){
  G.pawns.forEach((e,i)=>{e.isAlive=i<count;e.isPlayerControlled=true;e.x=150+i*200;e.y=100;});
  const hp=p.currentHp;G.update(1);assert.equal(p.currentHp,hp);assert.equal(G.width,5200);
 }
 G.render();
});

test('new match clears previous entities, results, effects and control state; camera supports manual pan',()=>{
 const w=loadGame(),G=w.GameManager,C=w.GameEngine.Camera,old=G.pawns[0];
 G.matchTime=100;G.isGameOver=true;G.isPaused=true;G.isPlayerMode=true;G.selectedEntity=old;
 w.GameRenderer.VfxManager.addEffect('hit',1,1);
 G.startNewMatch();assert.equal(G.matchTime,0);assert.equal(G.isGameOver,false);assert.equal(G.isPaused,false);assert.equal(G.isPlayerMode,false);
 assert.notEqual(G.pawns[0],old);assert.equal(G.pawns.length,100);assert.equal(G.monsters.length,71);assert.equal(G.dropItems.length,0);
 assert.equal(w.GameRenderer.VfxManager.effects.length,0);assert.equal(G.selectedEntity,null);
 const x=C.x;C.panPixels(50,0);assert.ok(C.x<x);assert.equal(C.targetEntity,null);assert.equal(C.autoDirector,false);
 G.keys={d:true};const px=C.x;C.update(.1);assert.ok(C.x>px);
});

test('inspection exposes remaining EXP and aura renders gold at 10, supreme at 15',()=>{
 const w=loadGame(),G=w.GameManager,p=G.pawns[0],I=w.GameUI.InspectModal;
 p.currentExp=50;I.inspect(p);assert.match(w.documentText('inspect-panel'),/Còn 30 EXP/);
 for(const level of [10,15]){p.level=level;w.GameRenderer.ProceduralPawn.render(G.ctx,p,p.appearance,false);}
 p.level=15;I.inspect(p);assert.match(w.documentText('inspect-panel'),/Đã đạt cấp tối đa/);
 p.fear=90;w.GameAI.EmotionEngine.update(p,.1);assert.ok(w.GameRenderer.VfxManager.motes.some(m=>m.pawn===p));
});

test('unarmed level 1 can defeat every minion; level 3 can defeat every beast in a controlled duel',()=>{
 for(const [type,level] of [['minions',1],['beasts',3]]){
  const w=loadGame(42,{openTemple:true}),G=w.GameManager,C=w.GameEntities.CombatSystem,E=w.GameEntities.EntityManager;
  for(const def of w.GameData.Monsters[type]){
   const p={...G.pawns[0],x:1000,y:300,skills:[],weapon:null,action:null,combatGroup:null,combatLease:0};
   p.currentHp=p.maxHp=160;p.attack=16;p.defense=5;p.level=1;p.currentExp=0;p.isPlayerControlled=true;
   for(let i=1;i<level;i++)C.grantLevel(p);
   const m=E.spawnMonster(def,1020,300);w.__math.random=()=>.99;
   for(let i=0;i<800&&p.isAlive&&m.isAlive;i++){
    C.updateStatus(p,.05);C.updateStatus(m,.05);C.executeAttack(p,m);C.executeAttack(m,p);
   }
   assert.equal(m.isAlive,false,def.name);assert.equal(p.isAlive,true,def.name+' should be beatable');
  }
 }
});

test('nearby independent duels share the cap; two local allied pairs create a four-person battle',()=>{
 const w=loadGame(),C=w.GameEntities.CombatSystem,actors=w.GameManager.pawns.slice(0,4);
 actors.forEach((p,i)=>{p.x=2600+(i%2)*20;p.y=2600+Math.floor(i/2)*20;});
 const [a,b,c,d]=actors;
 assert.equal(C.reserveCombat(a,b),true);assert.equal(C.reserveCombat(c,d),false);
 actors.forEach(p=>{p.combatGroup=null;p.combatLease=0;});
 a.allyPawn=b;b.allyPawn=a;c.allyPawn=d;d.allyPawn=c;
 assert.equal(C.reserveCombat(a,c),true);assert.equal(a.combatGroup.members.size,4);
 assert.equal(C.reserveCombat(b,d),true);assert.equal(C.groupMembers(a).length,4);
});

test('level 15 survivor still farms every final lord before the god gate opens',()=>{
 const w=loadGame(),G=w.GameManager,p=G.pawns[0],E=w.GameEntities.EntityManager;
 G.pawns.forEach(e=>e.isAlive=e===p);p.level=15;p.maxHp=p.currentHp=1500;p.attack=120;
 G.checkVictoryCondition();G.continueAfterResult();G.update(.1);
 assert.notEqual(p.targetEnemy,E.worldBoss);assert.equal(w.GameEngine.MapTerrain.remainingLords(),5);
 E.finalHuntMonsters.forEach(m=>m.isAlive=false);p.action=null;p.attackState=null;
 w.GameAI.AIBrain.update(p,.1,G.spatialGrid,w.GameEngine.MapTerrain);assert.equal(p.targetEnemy,E.worldBoss);
});


test('species inhabit fixed radial habitats, bots spawn at edges, and boss domains stay exclusive',()=>{
 for(const seed of [42,2026,7]){const w=loadGame(seed),G=w.GameManager,M=w.GameEngine.MapTerrain;
  assert.ok(G.pawns.every(p=>Math.min(p.x,p.y,5200-p.x,5200-p.y)<350&&!M.isInWater(p.x,p.y)));
  const lords=G.monsters.filter(m=>m.tier===4);assert.equal(lords.length,4);assert.equal(new Set(lords.map(m=>m.defId)).size,4);
  assert.deepEqual(Array.from(lords,m=>[m.homeX,m.homeY]),[[1800,1800],[3400,1800],[1800,3400],[3400,3400]]);
  for(const m of G.monsters){assert.ok(M.monsterCanOccupy(m,m.x,m.y),m.name);assert.equal(m.habitat,m.tier<4?m.territory.kind:m.tier===4?'lair':'temple');
   if(m.tier<4){assert.equal(M.bossDomain(m.x,m.y),null);const r=Math.hypot(m.x-2600,m.y-2600);assert.ok(m.tier===1?r>1900:m.tier===2?r>1400&&r<1800:r>500&&r<1800);}
   for(let i=0;i<200;i++)M.moveEntity(m,Math.cos(i)*100,Math.sin(i)*100);
   assert.ok(M.monsterCanOccupy(m,m.x,m.y),m.name+' cannot leave its habitat');
  }
 }
});

test('a monster cannot chain different spells less than three seconds apart',()=>{
 const w=loadGame(42,{openTemple:true}),G=w.GameManager,C=w.GameEntities.CombatSystem,m=G.monsters.find(m=>m.tier===5),p=G.pawns[0];
 p.x=m.x+20;p.y=m.y;p.maxHp=p.currentHp=10000;G.spatialGrid.clear();G.spatialGrid.insert(p);G.spatialGrid.insert(m);
 m.skills.forEach(s=>s.cooldownTimer=0);assert.equal(C.castSkill(m,m.skills[0],p),true);
 C.updateStatus(m,1.5);assert.equal(m.action,null);assert.equal(C.castSkill(m,m.skills[1],p),false);
 C.updateStatus(m,1.49);assert.equal(C.castSkill(m,m.skills[1],p),false);
 C.updateStatus(m,.02);assert.equal(C.castSkill(m,m.skills[1],p),true);
});

test('final hunt replaces lower monsters with five distinct bosses once, with enough farm XP',()=>{
 const w=loadGame(),G=w.GameManager,E=w.GameEntities.EntityManager,C=w.GameEntities.CombatSystem,p=G.pawns[0],boss=E.worldBoss;
 G.pawns.forEach(e=>e.isAlive=e===p);G.checkVictoryCondition();assert.equal(G.resultOpen,true);
 const old=G.monsters.filter(m=>m.tier<=4);G.continueAfterResult();
 assert.ok(old.every(m=>!m.isAlive&&m.despawned));assert.equal(G.monsters.filter(m=>m.isAlive).length,6);
 assert.equal(new Set(E.finalHuntMonsters.map(m=>m.defId)).size,5);assert.equal(new Set(E.finalHuntMonsters.map(m=>m.homeX+','+m.homeY)).size,5);
 const count=G.monsters.length;G.continueAfterResult();assert.equal(G.monsters.length,count);assert.equal(boss.isAlive,true);
 G.update(.1);assert.notEqual(p.targetEnemy,boss);assert.ok(p.targetEnemy?.isFinalHunt);
 p.action=null;p.attackState=null;
 for(const m of E.finalHuntMonsters)C.handleDeath(p,m);assert.equal(p.level,15);
 p.action=null;w.GameAI.AIBrain.update(p,.1,G.spatialGrid,w.GameEngine.MapTerrain);assert.equal(p.targetEnemy,boss);
});

test('personality varies individuals and readiness considers gear, HP and the monster tier',()=>{
 const w=loadGame(),G=w.GameManager,A=w.GameAI.AIBrain,[p,q]=G.pawns,m=G.monsters.find(m=>m.tier===4);
 assert.equal(new Set(G.pawns.map(p=>JSON.stringify(p.personality))).size,100);
 assert.ok(G.pawns.every(p=>Object.values(p.personality).every(v=>v>=5&&v<=95)));
 assert.equal(A.canHunt(p,m),false);p.level=15;assert.equal(A.canHunt(p,m),false);
 p.attack=100;p.currentHp=p.maxHp=1500;p.weapon={attack:65};p.personality.aggression=90;p.personality.caution=20;p.confidence=60;assert.equal(A.canHunt(p,m),true);
 const chance=A.calculateWinRate(p,q);q.armor={defense:200};assert.ok(A.calculateWinRate(p,q)<chance);
 p.currentHp=1;assert.equal(A.canHunt(p,m),false);
 w.GameUI.InspectModal.inspect(p);assert.match(w.documentText('inspect-panel'),/ATK:/);assert.match(w.documentText('inspect-panel'),/DEF:/);assert.match(w.documentText('inspect-panel'),/Kiên nhẫn/);
});


test('weak AI paths go around the god sanctuary and retreat consumes stamina',()=>{
 const w=loadGame(),M=w.GameEngine.MapTerrain,A=w.GameAI.AIBrain,p=w.GameManager.pawns[0];
 p.x=2100;p.y=2600;p.level=4;const path=M.findPath(p.x,p.y,3100,2600,p);assert.ok(path.length);assert.ok(path.every(n=>Math.hypot(n.x-2600,n.y-2600)>385));
 const old=p.currentStamina;A.retreatSafely(p,w.GameManager.pawns[1],.1);assert.ok(p.currentStamina<old);
 p.currentStamina=0;assert.ok(M.getMoveSpeed(p)<p.moveSpeed);
});


test('survivor farms real final-hunt combat to level 15 before engaging the god',()=>{
 const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem,A=w.GameAI.AIBrain,p=G.pawns[0],boss=w.GameEntities.EntityManager.worldBoss;
 G.pawns.forEach(e=>e.isAlive=e===p);p.currentExp=320;C.checkLevelUp(p);p.x=1400;p.y=1800;
 A.lootItem(p,G.spawnDropItem(p.x,p.y,w.GameData.Equipments.weapons.w_wooden_wand));
 G.checkVictoryCondition();G.continueAfterResult();let reached=false;
 for(let i=0;i<12000&&p.isAlive;i++){
  G.matchTime+=.1;G.update(.1);
  if(p.level<15||w.GameEngine.MapTerrain.remainingLords())assert.notEqual(p.targetEnemy,boss);
  if(p.level===15&&p.targetEnemy===boss){reached=true;break;}
 }
 assert.equal(p.isAlive,true);assert.equal(reached,true,'must farm and then choose the god');
 assert.ok(G.monsters.filter(m=>m.isFinalHunt).every(m=>!m.isAlive));
});


test('forty minions form packs of two or three, twenty beasts are solitary and generals guard all four lairs',()=>{
 const w=loadGame(),G=w.GameManager,M=w.GameEngine.MapTerrain;
 const packs=new Map();for(const m of G.monsters.filter(m=>m.tier===1)){if(!packs.has(m.packId))packs.set(m.packId,[]);packs.get(m.packId).push(m);}
 assert.equal(packs.size,16);for(const pack of packs.values()){assert.ok(pack.length===2||pack.length===3);assert.equal(new Set(pack.map(m=>m.territory.id)).size,1);}
 assert.equal(G.monsters.filter(m=>m.tier===2).length,20);assert.equal(new Set(G.monsters.filter(m=>m.tier===2).map(m=>m.territory.id)).size,20);
 const guards=G.monsters.filter(m=>m.tier===3);assert.equal(new Set(guards.map(m=>m.guardingLair)).size,4);
 for(const m of guards){const lair=M.lairs.find(a=>a.name===m.guardingLair);assert.ok(Math.hypot(m.x-lair.x,m.y-lair.y)>lair.radius+m.territory.radius);}
});


test('generals cannot gang up on one pawn through attacks, spells or damage, but can choose different pawns',()=>{
 const w=loadGame(42,{openTemple:true}),G=w.GameManager,C=w.GameEntities.CombatSystem,[p,q]=G.pawns,[a,b]=G.monsters.filter(m=>m.tier===3);
 [p,q,a,b].forEach((e,i)=>{e.x=1000+i*10;e.y=300;e.territory=null;e.currentHp=e.maxHp=10000;});
 a.skills.forEach(s=>s.cooldownTimer=0);b.skills.forEach(s=>s.cooldownTimer=0);
 assert.equal(C.executeAttack(a,p),true);assert.equal(C.canJoin(b,p),false);assert.equal(C.castSkill(b,b.skills[0],p),false);assert.equal(C.applyDamage(b,p,null,{baseDamage:50}),0);
 C.updateStatus(a,2);assert.equal(C.canJoin(b,p),false,'lease prevents alternating spells between generals');
 assert.equal(C.canJoin(b,q),false,'local combat cap still applies to a fourth participant');
 q.x=4500;b.x=4510;assert.equal(C.castSkill(b,b.skills[0],q),true,'another bot is a valid target');
 C.updateStatus(a,7);assert.equal(C.canJoin(b,p),true,'claim expires after disengaging');
 w.GameRenderer.MonsterRenderer.render(G.ctx,w.GameEntities.EntityManager.spawnMonster(w.GameData.FinalLord,100,100),false);
});


test('a cleared final-hunt lair permits a sub-level-10 bot to collect the defeated king loot',()=>{
 const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem,M=w.GameEngine.MapTerrain,p=G.pawns[0];
 G.pawns.forEach(e=>e.isAlive=e===p);G.checkVictoryCondition();G.continueAfterResult();
 const king=w.GameEntities.EntityManager.finalHuntMonsters[0];p.x=king.x-200;p.y=king.y;p.targetEnemy=king;
 C.handleDeath(p,king);assert.ok(p.level<10);assert.equal(king.territory.isCleared,true);p.targetEnemy=null;
 assert.equal(M.canTravel(p,king.x,king.y),true);
 const potion=G.dropItems.find(d=>d.slot==='potion');assert.ok(potion);const goal=M.safeGoal(p,potion.x,potion.y);
 assert.ok(Math.hypot(goal.x-potion.x,goal.y-potion.y)<20);assert.ok(M.findPath(p.x,p.y,goal.x,goal.y,p).length);
});

test('temple seal blocks movement, paths, attacks and opens only after every lord dies',()=>{
 const w=loadGame(),G=w.GameManager,M=w.GameEngine.MapTerrain,C=w.GameEntities.CombatSystem,p=G.pawns[0],god=w.GameEntities.EntityManager.worldBoss;
 p.level=15;p.isPlayerControlled=true;p.x=2600-M.templeRuins.radius-20;p.y=2600;
 assert.equal(M.remainingLords(),4);assert.equal(C.applyDamage(p,god,null,{baseDamage:999}),0);
 assert.equal(M.segmentClear(p.x,p.y,2600,2600),false);M.moveEntity(p,150,0);
 assert.ok(p.x<=2600-M.templeRuins.radius-12);
 const lords=G.monsters.filter(m=>m.tier===4);
 lords.slice(0,3).forEach(m=>m.isAlive=false);assert.equal(M.templeAccess(p,2500,2600),false);
 lords[3].isAlive=false;assert.equal(M.remainingLords(),0);assert.equal(M.templeAccess(p,2500,2600),true);
 M.moveEntity(p,100,0);assert.ok(p.x>2600-M.templeRuins.radius);
 G.updateHUD();
});

test('physical admission rejects a fourth solo bot and admits exactly two allied pairs',()=>{
 const w=loadGame(),G=w.GameManager,M=w.GameEngine.MapTerrain,C=w.GameEntities.CombatSystem,[a,b,c,d]=G.pawns;
 G.pawns=[a,b,c,d];G.monsters=[];
 [a,b,c].forEach((p,i)=>{p.x=1000+i*12;p.y=300;});d.x=1150;d.y=300;
 assert.equal(C.canApproach(d,a),false);assert.equal(M.moveEntity(d,-150,0),0);
 assert.equal(d.x,1150);a.allyPawn=b;b.allyPawn=a;c.allyPawn=d;d.allyPawn=c;
 assert.equal(C.canApproach(d,a),true);assert.ok(M.moveEntity(d,-120,0)>0);
 const e={...d,id:'fifth',x:1200,allyPawn:null};G.pawns.push(e);assert.equal(C.canApproach(e,a),false);
});

test('connected encounters cannot bypass the cap by chaining separate duels',()=>{
 const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem,[a,b,c,d,e]=G.pawns;
 G.pawns=[a,b,c,d,e];G.monsters=[];
 [a,b,c,d,e].forEach((p,i)=>{p.x=1000+i*300;p.y=300;});
 assert.equal(C.reserveCombat(a,b),true);assert.equal(C.reserveCombat(c,d),true);
 a.x=1000;b.x=1040;c.x=1140;d.x=1180;e.x=1280;
 assert.equal(C.canJoin(e,d),false);assert.equal(C.reserveCombat(e,a),false);
});

test('50 percent hunts depend on personality and emotion rather than a higher fixed floor',()=>{
 const w=loadGame(),A=w.GameAI.AIBrain,p=w.GameManager.pawns[0],m=w.GameManager.monsters[0];
 p.personality={...p.personality,aggression:90,caution:20,greed:60};p.confidence=60;p.fear=p.despair=0;
 assert.equal(A.willingToFight(p,.5),true);assert.equal(A.willingToFight(p,.499),false);
 A.calculateWinRate=()=>.5;assert.equal(A.canHunt(p,m),true);
 p.personality.aggression=5;p.personality.caution=95;p.fear=90;assert.equal(A.canHunt(p,m),false);
});

test('strong bots choose weaker opponents, time out pursuit and do not immediately reacquire',()=>{
 const w=loadGame(),G=w.GameManager,A=w.GameAI.AIBrain,M=w.GameEngine.MapTerrain,[p,q]=G.pawns;
 G.pawns=[p,q];G.monsters=[];p.x=1000;q.x=1160;p.y=q.y=300;q.currentHp=25;
 p.personality={...p.personality,aggression:90,caution:10};p.fear=p.despair=0;
 G.spatialGrid.clear();[p,q].forEach(e=>G.spatialGrid.insert(e));G.matchTime=1;
 A.update(p,.1,G.spatialGrid,M);assert.equal(p.targetEnemy,q);assert.ok(p.chase);
 G.matchTime=40;p.action=null;A.update(p,.1,G.spatialGrid,M);
 assert.notEqual(p.targetEnemy,q);assert.equal(A.ignored(p,q),true);
 p.chase={target:q,started:40};q.x=p.x+A.chaseLimit(p)+1;assert.equal(A.keepChasing(p,q),false);
});

test('weak bots immediately use escape skills and concealment respects distance and walls',()=>{
 const w=loadGame(),G=w.GameManager,A=w.GameAI.AIBrain,C=w.GameEntities.CombatSystem,M=w.GameEngine.MapTerrain,[p,q]=G.pawns;
 G.pawns=[p,q];G.monsters=[];p.x=1000;q.x=1160;p.y=q.y=300;p.currentHp=35;q.attack=80;
 p.skills=[{id:'escape',tier:1,cooldownTimer:0,def:{id:'escape',name:'Ẩn thân',type:'stealth',cooldown:8,range:200,t1:{}}}];
 G.spatialGrid.clear();[p,q].forEach(e=>G.spatialGrid.insert(e));A.update(p,.1,G.spatialGrid,M);
 assert.equal(p.action?.kind,'skill');assert.match(p.objective,/Lẩn trốn/);C.updateStatus(p,.8);
 assert.ok(p.stealthTimer>0);assert.equal(C.canSee(q,p),false);q.chase={target:p,started:0};assert.equal(A.keepChasing(q,p),false);q.x=p.x+20;assert.equal(C.canSee(q,p),true);
});

test('coward ambush hides in bushes and attacks a wounded target only when a slot opens',()=>{
 const w=loadGame(),G=w.GameManager,A=w.GameAI.AIBrain,C=w.GameEntities.CombatSystem,M=w.GameEngine.MapTerrain,[p,q]=G.pawns;
 G.pawns=[p,q];G.monsters=[];p.x=1000;p.y=300;q.x=1180;q.y=300;q.currentHp=35;
 const bush={x:500,y:150,radius:25,isBurned:false};M.bushes.push(bush);p.decisionTime=1;
 p.personality={...p.personality,aggression:90,caution:20};const site={x:1000,y:300,bush};
 A.ambush(p,site,[],.1);assert.equal(p.isHiding,true);assert.equal(C.canSee(q,p),false);
 A.ambush(p,site,[q],.1);assert.equal(p.targetEnemy,q);assert.equal(p.isHiding,false);
});

test('monsters proactively aggro the player inside visible range, but respect cover',()=>{
 const w=loadGame(),G=w.GameManager,M=w.GameEngine.MapTerrain,C=w.GameEntities.CombatSystem,p=G.pawns[0],m=G.monsters[0];
 G.pawns=[p];G.monsters=[m];m.territory=null;m.x=1000;m.y=300;p.x=1170;p.y=300;p.isPlayerControlled=true;
 G.spatialGrid.clear();[p,m].forEach(e=>G.spatialGrid.insert(e));G.updateMonsters(.2);
 assert.equal(m.targetEnemy,p);assert.ok(m.x>1000);assert.equal(C.canSee(m,p),true);
 const o=M.obstacles.find(o=>o.kind==='wall'&&o.w>o.h);
 m.x=p.x=o.x+o.w/2;m.y=o.y-25;p.y=o.y+o.h+25;m.action=null;
 G.spatialGrid.clear();[p,m].forEach(e=>G.spatialGrid.insert(e));G.updateMonsters(.1);assert.equal(m.targetEnemy,null);
});

test('every authored monster has a distinct renderer and focus draws both real ranges',()=>{
 const w=loadGame(),G=w.GameManager,R=w.GameRenderer.MonsterRenderer,C=w.GameEntities.CombatSystem;
 R.renderGenericMonster=()=>assert.fail('Authored species must never fall back to a generic circle');
 for(const def of [...Object.values(w.GameData.Monsters).flat(),w.GameData.FinalLord])R.render(G.ctx,w.GameEntities.EntityManager.spawnMonster(def,100,100),true);
 for(const def of Object.values(w.GameData.Equipments.weapons)){
  w.GameRenderer.WeaponAnimations.drawWeapon(G.ctx,def);
  w.GameRenderer.Paperdoll.renderDropItem(G.ctx,{id:def.id,x:100,y:100,slot:'weapon',data:def,tier:def.tier,name:def.name},0);
 }
 const rings=[];G.ctx.arc=(x,y,r)=>rings.push(r);
 for(const e of [G.pawns[0],G.monsters[0]]){
  rings.length=0;w.GameEngine.Camera.follow(e);G.renderFocusRanges(G.ctx);
  assert.ok(rings.includes(C.combatStats(e).range));assert.ok(rings.includes(C.visionRange(e)));
  w.GameUI.InspectModal.inspect(e);assert.match(w.documentText('inspect-panel'),/Tầm nhìn/);
 }
});

test('a cautious bot still attacks a weaker bot instead of standing beside it forever',()=>{
 const w=loadGame(),G=w.GameManager,A=w.GameAI.AIBrain,M=w.GameEngine.MapTerrain,[p,q]=G.pawns;
 G.pawns=[p,q];G.monsters=[];p.x=1000;q.x=1020;p.y=q.y=300;
 p.personality={...p.personality,aggression:26,caution:85,greed:37};p.confidence=p.fear=p.despair=0;q.currentHp=100;
 G.spatialGrid.clear();[p,q].forEach(e=>G.spatialGrid.insert(e));A.update(p,.1,G.spatialGrid,M);
 assert.equal(p.targetEnemy,q);assert.equal(p.action?.kind,'attack');
});
test('a real habitat monster detects the player beyond its home radius without leaving the habitat',()=>{
 const w=loadGame(),G=w.GameManager,M=w.GameEngine.MapTerrain,C=w.GameEntities.CombatSystem,p=G.pawns[0],m=G.monsters[0];
 G.pawns=[p];G.monsters=[m];m.x=m.homeX=m.territory.x;m.y=m.homeY=m.territory.y;
 p.x=m.x+170;p.y=m.y;p.isPlayerControlled=true;
 assert.ok(C.canSee(m,p));G.spatialGrid.clear();[p,m].forEach(e=>G.spatialGrid.insert(e));
 G.updateMonsters(.1);assert.equal(m.targetEnemy,p);
 for(let i=0;i<100;i++)G.updateMonsters(.1);
 assert.equal(M.monsterCanOccupy(m,m.x,m.y),true);
});

test('a melee survivor completes all five final-hunt bosses without passive healing',()=>{
 const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem,A=w.GameAI.AIBrain,p=G.pawns[59],E=w.GameEntities.EntityManager;
 G.pawns.forEach(e=>e.isAlive=e===p);p.currentExp=1150;C.checkLevelUp(p);
 A.lootItem(p,G.spawnDropItem(p.x,p.y,w.GameData.Equipments.weapons.w_tempered_blade));p.x=1400;p.y=1800;
 G.checkVictoryCondition();G.continueAfterResult();
 for(let i=0;i<12000&&p.isAlive&&w.GameEngine.MapTerrain.remainingLords();i++){G.matchTime+=.1;G.update(.1);}
 assert.equal(p.isAlive,true);assert.equal(w.GameEngine.MapTerrain.remainingLords(),0);assert.equal(p.level,15);
});

test('aggro monsters cannot move two separate duels together to bypass the cap',()=>{
 const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem,M=w.GameEngine.MapTerrain,[a,b]=G.pawns,[m,n]=G.monsters;
 G.pawns=[a,b];G.monsters=[m,n];a.x=1000;a.y=300;m.x=1020;m.y=300;b.x=1300;b.y=300;n.x=1280;n.y=300;
 m.territory=n.territory=null;m.targetEnemy=a;n.targetEnemy=b;
 C.reserveCombat(m,a);C.reserveCombat(n,b);n.targetEnemy=null;
 assert.equal(M.moveEntity(n,-180,0),0);assert.equal(n.x,1280);
});


test('a visible meaningful upgrade interrupts farming and is collected during a duel',()=>{
 const w=loadGame(),G=w.GameManager,A=w.GameAI.AIBrain,M=w.GameEngine.MapTerrain,[p,q]=G.pawns;
 G.pawns=[p,q];G.monsters=[];p.x=1000;p.y=300;q.x=2000;q.y=300;
 p.plan={kind:'farm',target:{isAlive:true,tier:1,currentHp:30,maxHp:30,x:1200,y:300},until:100};
 const item=G.spawnDropItem(1080,300,w.GameData.Equipments.weapons.w_rusty_sword);
 G.spatialGrid.clear();[p,q,item].forEach(e=>G.spatialGrid.insert(e));A.update(p,.1,G.spatialGrid,M);
 assert.equal(p.plan.kind,'loot');assert.equal(p.plan.target,item);assert.ok(p.x>1000);
 p.x=item.x;p.y=item.y;p.action=null;p.plan={kind:'duel',target:q,until:100};
 A.update(p,.1,G.spatialGrid,M);assert.equal(item.isCollected,true);assert.equal(p.weapon.id,'w_rusty_sword');
});

test('equipment evaluation includes speed, range and HP while respecting class and cleared lairs',()=>{
 const w=loadGame(),G=w.GameManager,A=w.GameAI.AIBrain,p=G.pawns[0],D=w.GameData.Equipments;
 p.x=1000;p.y=300;A.lootItem(p,G.spawnDropItem(p.x,p.y,D.weapons.w_rusty_axe));
 const faster=G.spawnDropItem(p.x,p.y,{...D.weapons.w_rusty_axe,id:'fast',attack:11,speed:1.3});
 assert.equal(A.findBestItemToLoot(p,[faster]),faster);assert.equal(A.lootItem(p,faster),true);
 const incompatible=G.spawnDropItem(p.x,p.y,D.weapons.w_wooden_wand);assert.equal(A.lootItem(p,incompatible),false);
 p.armor={id:'old',tier:'rare',defense:10,hp:0};
 const durable=G.spawnDropItem(p.x,p.y,{id:'hp-armor',tier:'rare',slot:'body',defense:10,hp:100},'body');
 assert.equal(A.findBestItemToLoot(p,[durable]),durable);
 const worse=G.spawnDropItem(p.x,p.y,{id:'worse',tier:'god',slot:'body',defense:1,hp:0},'body');assert.equal(A.findBestItemToLoot(p,[worse]),null);
 const lair=w.GameEngine.MapTerrain.lairs[0];lair.isCleared=true;p.level=3;
 const cleared=G.spawnDropItem(lair.x,lair.y,{id:'cleared',tier:'rare',slot:'head',defense:15},'head');assert.equal(A.findBestItemToLoot(p,[cleared]),cleared);
});

test('an engaged slightly weaker bot fights back; extreme disadvantage still escapes',()=>{
 const w=loadGame(),G=w.GameManager,A=w.GameAI.AIBrain,M=w.GameEngine.MapTerrain,[p,q]=G.pawns;
 G.pawns=[p,q];G.monsters=[];p.x=1000;q.x=1020;p.y=q.y=300;p.fear=0;p.currentHp=125;q.currentHp=160;
 p.lastAttacker=q;p.grudgeUntil=20;G.matchTime=1;
 G.spatialGrid.clear();[p,q].forEach(e=>G.spatialGrid.insert(e));A.update(p,.1,G.spatialGrid,M);
 assert.equal(p.targetEnemy,q);assert.equal(p.action?.kind,'attack');
 p.action=null;p.currentHp=10;q.attack=100;A.update(p,.1,G.spatialGrid,M);
 assert.match(p.objective,/Lẩn trốn|Thoát/);assert.equal(p.action?.kind==='attack',false);
});

test('successful defense creates a bounded counter opportunity without a damage bonus',()=>{
 const w=loadGame(42,{openTemple:true}),G=w.GameManager,C=w.GameEntities.CombatSystem,A=w.GameAI.AIBrain,[p,q]=G.pawns;
 G.pawns=[p,q];G.monsters=[];p.x=1000;q.x=1020;p.y=q.y=300;G.matchTime=3;
 assert.equal(C.defend(p,'block',0),true);const hp=p.currentHp;C.applyDamage(q,p,null,{baseDamage:30});
 assert.ok(p.currentHp>hp-30);assert.equal(p.counterTarget,q);assert.equal(p.counterUntil,4.5);
 C.updateStatus(p,.6);A.engageCombat(p,q,.1);assert.equal(p.tactic.mode,'counter');assert.equal(p.action?.kind,'attack');
});

test('skill choice saves attacks during probing, favors openings and reserves defense stamina',()=>{
 const w=loadGame(),G=w.GameManager,A=w.GameAI.AIBrain,C=w.GameEntities.CombatSystem,[p,q]=G.pawns;
 G.pawns=[p,q];G.monsters=[];p.x=1000;q.x=1020;p.y=q.y=300;
 const def=w.GameData.Skills.warrior.actives[0];p.skills=[{id:def.id,def,tier:1,cooldownTimer:0}];
 p.personality.aggression=30;p.currentStamina=28;
 assert.equal(A.chooseCombatSkill(p,q,'probe'),false);assert.equal(p.skills[0].cooldownTimer,0);
 assert.equal(A.chooseCombatSkill(p,q,'pressure'),false,'reserve 18 for defense');
 p.currentStamina=100;q.stunTimer=.5;assert.equal(A.chooseCombatSkill(p,q,'counter'),true);
 assert.equal(p.action?.kind,'skill');assert.ok(p.skills[0].cooldownTimer>0);
});

test('readiness drops when skills are on cooldown and stamina or mana cannot pay their cost',()=>{
 const w=loadGame(),A=w.GameAI.AIBrain,[p,q]=w.GameManager.pawns,def=w.GameData.Skills.mage.actives[0];
 p.skills=[{id:def.id,def,tier:1,cooldownTimer:0}];const ready=A.calculateWinRate(p,q);
 p.skills[0].cooldownTimer=10;assert.ok(A.calculateWinRate(p,q)<ready);
 p.skills[0].cooldownTimer=0;p.currentMana=0;assert.ok(A.calculateWinRate(p,q)<ready);
 p.currentStamina=0;assert.ok(A.calculateWinRate(p,q)<ready);
});

test('a lost chase follows only its recorded position and stops searching after three seconds',()=>{
 const w=loadGame(),G=w.GameManager,A=w.GameAI.AIBrain,[p,q]=G.pawns;
 G.pawns=[p,q];G.monsters=[];p.x=1000;q.x=1100;p.y=q.y=300;G.matchTime=1;A.engageCombat(p,q,.1);
 const recorded=p.chase.lastX;p.action=null;q.x=2200;G.matchTime=2;
 let goal;A.moveToTarget=(e,x,y)=>goal={x,y};A.engageCombat(p,q,.1);
 assert.equal(goal.x,recorded);assert.notEqual(goal.x,q.x);
 G.matchTime=5;A.engageCombat(p,q,.1);assert.equal(A.ignored(p,q),true);
});

test('only witnessed bot kills create notorious threat intel; monster kills never count',()=>{
 const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem,[killer,observer,hidden,v1,v2]=G.pawns;
 G.pawns=[killer,observer,hidden,v1,v2];G.monsters=[];
 killer.x=1000;observer.x=1150;hidden.x=4000;v1.x=1020;v2.x=1030;[killer,observer,hidden,v1,v2].forEach(p=>p.y=300);
 G.matchTime=1;C.handleDeath(killer,v1);G.matchTime=2;C.handleDeath(killer,v2);
 assert.equal(killer.botKillStreak,2);assert.equal(observer.knownThreat.kills,2);assert.equal(hidden.knownThreat,undefined);
 C.rememberBotKill(killer,{isMonster:true});assert.equal(killer.botKillStreak,2);
 G.matchTime=70;C.rememberBotKill(killer,{isPawn:true});assert.equal(killer.botKillStreak,1);
});

test('two weaker bots may ally at 40 percent after witnessed kills, reject less, and share last-seen intel',()=>{
 for(const chance of [.399,.4]){
  const w=loadGame(),G=w.GameManager,A=w.GameAI.AIBrain,[p,q,t]=G.pawns;
  G.pawns=[p,q,t];G.monsters=[];[p,q,t].forEach((e,i)=>{e.x=1000+i*70;e.y=300;});G.matchTime=3;
  p.knownThreat={target:t,x:t.x,y:t.y,seenAt:3,killAt:3,kills:2,snapshot:A.threatSnapshot(t)};
  A.calculateWinRate=(e,target,withAlly)=>withAlly?chance:.3;w.__math.random=()=>0;
  A.handleCoalition(p,[q,t]);assert.equal(p.allyPawn===q,chance>=.4);
  if(chance>=.4){
   assert.equal(q.allyPawn,p);assert.equal(p.pactTarget,t);assert.equal(q.pactTarget,t);
   t.x=4500;G.matchTime=4;let goal;A.moveToTarget=(e,x,y)=>goal={x,y};A.pursueCoalition(p,[q],.1);
   assert.ok(Math.abs(goal.x-1140)<50);assert.notEqual(goal.x,t.x);
   G.matchTime=30;A.pursueCoalition(p,[],.1);assert.equal(p.allyPawn,null);assert.equal(q.allyPawn,null);
  }
 }
});

test('coalitions do not recruit a third ally or violate an existing battle cap',()=>{
 const w=loadGame(),G=w.GameManager,A=w.GameAI.AIBrain,C=w.GameEntities.CombatSystem,[p,q,t,r]=G.pawns;
 G.pawns=[p,q,t,r];G.monsters=[];[p,q,t,r].forEach((e,i)=>{e.x=1000+i*30;e.y=300;});G.matchTime=3;
 p.knownThreat={target:t,x:t.x,y:t.y,seenAt:3,killAt:3,kills:3};
 A.calculateWinRate=(e,target,withAlly)=>withAlly?.6:.3;w.__math.random=()=>0;
 C.reserveCombat(t,r);A.handleCoalition(p,[q,t,r]);assert.equal(p.allyPawn,null);
 r.x=2000;t.combatLease=r.combatLease=0;t.combatGroup=r.combatGroup=null;p.coalitionCheckAt=0;
 A.handleCoalition(p,[q,t]);assert.equal(p.allyPawn,q);assert.equal(C.reserveCombat(p,t),true);assert.equal(C.groupMembers(t).length,3);
 assert.equal(C.canJoin(r,t),false);
});


test('tactical retreat is local and bounded; it never sends a bot away from a distant hunt',()=>{
 const w=loadGame(),G=w.GameManager,A=w.GameAI.AIBrain,[p,q]=G.pawns;
 G.pawns=[p,q];G.monsters=[];p.x=1000;p.y=300;q.x=1200;q.y=300;G.matchTime=1;
 A.calculateWinRate=()=>.45;p.tactic={target:q,mode:'pressure',until:0,started:0};
 A.engageCombat(p,q,.1);assert.equal(p.tactic.mode,'retreat');
 G.matchTime=4;p.action=null;A.engageCombat(p,q,.1);assert.equal(p.tactic.mode,'pressure');
 const m=w.GameEntities.EntityManager.spawnMonster(w.GameData.Monsters.minions[0],1500,300);m.territory=null;
 const x=p.x;G.matchTime=6;p.action=null;p.tactic=null;A.engageCombat(p,m,.1);
 assert.equal(p.tactic.mode,'pressure');assert.ok(p.x>x,'must approach a distant objective');
});

test('level 15 survivor collects useful nearby loot and uses owned potions before the god',()=>{
 const w=loadGame(),G=w.GameManager,A=w.GameAI.AIBrain,M=w.GameEngine.MapTerrain,p=G.pawns[0];
 G.pawns.forEach(e=>e.isAlive=e===p);G.monsters.filter(m=>m.tier===4).forEach(m=>m.isAlive=false);
 G.battleRoyaleResolved=true;p.level=15;p.x=1000;p.y=300;p.currentHp=p.maxHp*.7;p.healthPotions=1;
 const item=G.spawnDropItem(1080,300,{id:'boost',name:'Giáp tốt',tier:'rare',slot:'body',defense:30,hp:60},'body');
 G.spatialGrid.clear();[p,item].forEach(e=>G.spatialGrid.insert(e));A.update(p,.1,G.spatialGrid,M);
 assert.match(p.objective,/Nhặt/);assert.equal(p.targetEnemy,null);
 item.isCollected=true;p.action=null;A.update(p,.1,G.spatialGrid,M);
 assert.equal(p.action?.kind,'drink');assert.match(p.objective,/Chuẩn bị/);assert.equal(p.healthPotions,0);
});


test('tactical teleport moves away from the attacker instead of toward it',()=>{
 const w=loadGame(),G=w.GameManager,A=w.GameAI.AIBrain,C=w.GameEntities.CombatSystem,[p,q]=G.pawns;
 G.pawns=[p,q];G.monsters=[];p.x=1000;q.x=1100;p.y=q.y=300;
 const def=w.GameData.Skills.mage.actives.find(s=>s.type==='teleport');p.skills=[{id:def.id,def,tier:1,cooldownTimer:0}];
 const old=p.x;assert.equal(A.chooseCombatSkill(p,q,'retreat'),true);C.updateStatus(p,.8);assert.ok(p.x<old);
});
