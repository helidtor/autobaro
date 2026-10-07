const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Run the actual browser scripts with a tiny DOM/Canvas stub; no test dependency.
function loadGame(seed = 42) {
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
  const w = loadGame(), G = w.GameManager, A = w.GameAI.AIBrain, C = w.GameEntities.CombatSystem;
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
  p.trait = 'greedy'; ally.currentHp = 50;
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

test('water, pause, emotion ticks, invincibility and population storm behave correctly', () => {
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
  const zone = w.GameEngine.ZoneCircle;
  zone.currentRadius = 80;zone.targetRadius=80;zone.safeFraction=.1;zone.currentDps=7;
  p.x = 2800; p.y = 2600; p.invincible = true;
  zone.update(1, [p]);
  assert.equal(zone.currentRadius, 80); assert.equal(p.currentHp, hp);
  p.invincible = false; zone.update(1, [p]);
  assert.ok(p.currentHp < hp);
  zone.currentRadius = 0;
  G.render();
  w.GameAI.EmotionEngine.triggerBreakthrough(p, true);
  assert.equal(p.isBerserk, true); assert.equal(p.isClutchEscape, false);
  G.pawns.forEach(e => e.isAlive = false); G.checkVictoryCondition();
  assert.equal(G.isGameOver, true); assert.equal(G.winnerPawn, null);
});

test('a complete seeded match finishes with finite state and real loot/progression', () => {
  const w = loadGame(), G = w.GameManager;
  let dropsSeen = 0;
  for (let i = 0; i < 9000 && !G.battleRoyaleResolved; i++) {
    G.matchTime += 0.1;
    G.update(0.1);
    dropsSeen = Math.max(dropsSeen, G.dropItems.length);
    if (i % 100 === 0) G.render();
  }
  assert.equal(G.battleRoyaleResolved, true, 'last survivor must be found within 15 simulated minutes');
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
  assert.deepEqual([1,2,3,4,5].map(t=>G.monsters.filter(m=>m.tier===t).length),[20,10,6,3,1]);
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
  const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem;
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
  const w=loadGame(),C=w.GameEntities.CombatSystem,[a,t]=w.GameManager.pawns;
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
  const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem;
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
  const radius=w.GameEngine.ZoneCircle.currentRadius;
  assert.equal(G.continueAfterResult(),true);G.update(.1);
  assert.equal(p.targetEnemy,boss);assert.match(p.objective,/Yêu Thần/);
  assert.equal(w.GameEngine.ZoneCircle.currentRadius,radius);
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

test('bot PvP reward is either one level or one item; monsters and player get no special drop',()=>{
 const w=loadGame(),C=w.GameEntities.CombatSystem,G=w.GameManager,[killer,v]=G.pawns;
 w.GameRenderer.VfxManager.addBurstParticles=()=>{};w.__math.random=()=>.1;C.handleDeath(killer,v);
 assert.equal(killer.level,2);assert.equal(G.dropItems.length,0);assert.equal(killer.killCount,1);
 const victim=G.pawns[2];victim.weapon={tier:'super_rare'};
 let n=0;w.__math.random=()=>++n===1?.7:n===2?.8:.3;
 C.handleDeath(killer,victim);assert.equal(killer.level,2);assert.equal(G.dropItems.length,1);
 assert.equal(G.dropItems[0].tier,'super_rare');
 const victim2=G.pawns[3];victim2.weapon={tier:'super_rare'};n=0;
 w.__math.random=()=>++n===1?.7:n===2?.19:.3;
 C.handleDeath(killer,victim2);assert.equal(G.dropItems[1].tier,'supreme');
 killer.level=15;const naked=G.pawns[4];w.__math.random=()=>.19;
 C.handleDeath(killer,naked);assert.equal(G.dropItems[2].tier,'rare');
 const count=G.dropItems.length;C.handleDeath(G.monsters[0],G.pawns[5]);assert.equal(G.dropItems.length,count);
 killer.isPlayerControlled=true;C.handleDeath(killer,G.pawns[6]);assert.equal(G.dropItems.length,count);
});

test('same-tier/upgraded PvP drop boundary and maximum rarity are exact',()=>{
 const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem,k=G.pawns[0],v=G.pawns[1];k.level=15;
 v.weapon={tier:'super_rare'};w.__math.random=()=>.2;C.rewardBotKill(k,v);assert.equal(G.dropItems[0].tier,'super_rare');
 w.__math.random=()=>.19999;C.rewardBotKill(k,v);assert.equal(G.dropItems[1].tier,'supreme');
 v.weapon={tier:'god'};C.rewardBotKill(k,v);assert.equal(G.dropItems[2].tier,'god');
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
 const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem,M=w.GameEngine.MapTerrain;
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

test('zone follows population thresholds, not elapsed time; percentages refer to map area',()=>{
 const w=loadGame(),Z=w.GameEngine.ZoneCircle,G=w.GameManager;
 G.pawns.forEach(p=>p.invincible=true);const radius=Z.currentRadius;Z.update(9999,G.pawns);assert.equal(Z.currentRadius,radius);assert.equal(Z.safeFraction,1);
 for(const [count,fraction] of [[20,.5],[10,.25],[5,.1]]){
  G.pawns.forEach((p,i)=>p.isAlive=i<count);Z.update(.01,G.pawns);
  assert.equal(Z.safeFraction,fraction);
  assert.ok(Math.abs(Math.PI*Z.targetRadius**2/(5200**2)-fraction)<1e-9);
  Z.update(15,G.pawns);assert.ok(Math.abs(Z.currentRadius-Z.targetRadius)<1e-8);
 }
 Z.update(1000,G.pawns);assert.equal(Z.currentRadius,Z.targetRadius);
});

test('new match clears previous entities, results, effects and control state; camera supports manual pan',()=>{
 const w=loadGame(),G=w.GameManager,C=w.GameEngine.Camera,old=G.pawns[0];
 G.matchTime=100;G.isGameOver=true;G.isPaused=true;G.isPlayerMode=true;G.selectedEntity=old;
 w.GameRenderer.VfxManager.addEffect('hit',1,1);
 G.startNewMatch();assert.equal(G.matchTime,0);assert.equal(G.isGameOver,false);assert.equal(G.isPaused,false);assert.equal(G.isPlayerMode,false);
 assert.notEqual(G.pawns[0],old);assert.equal(G.pawns.length,100);assert.equal(G.monsters.length,40);assert.equal(G.dropItems.length,0);
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
  const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem,E=w.GameEntities.EntityManager;
  for(const def of w.GameData.Monsters[type]){
   const p={...G.pawns[0],x:2600,y:2600,skills:[],weapon:null,action:null,combatGroup:null,combatLease:0};
   p.currentHp=p.maxHp=160;p.attack=16;p.defense=5;p.level=1;p.currentExp=0;p.isPlayerControlled=true;
   for(let i=1;i<level;i++)C.grantLevel(p);
   const m=E.spawnMonster(def,2620,2600);w.__math.random=()=>.99;
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

test('sole survivor retains the boss objective when the current fight is full',()=>{
 const w=loadGame(),G=w.GameManager,p=G.pawns[0],boss=w.GameEntities.EntityManager.worldBoss;
 G.pawns.forEach(e=>e.isAlive=e===p);G.battleRoyaleResolved=true;
 const members=[boss,...G.monsters.filter(m=>m.tier===4).slice(0,2)],group={members:new Set(members)};
 for(const e of members){e.combatGroup=group;e.combatLease=6;}
 p.combatGroup=null;p.combatLease=0;p.action=null;
 w.GameAI.AIBrain.update(p,.1,G.spatialGrid,w.GameEngine.MapTerrain,w.GameEngine.ZoneCircle);
 assert.equal(p.targetEnemy,boss);assert.match(p.objective,/Yêu Thần/);
});
