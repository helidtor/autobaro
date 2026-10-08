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

test('all 70 pawn skins are assigned in order and render with and without gear', () => {
  const w = loadGame(), G = w.GameManager, S = w.GameRenderer.PawnSkins;
  assert.equal(S.list.length, 70);
  assert.equal(new Set(S.list.map(s => s.id)).size, 70);
  assert.deepEqual(G.pawns.slice(0, 70).map(p => p.appearance.skin), S.list.map(s => s.id));
  for (const s of S.list) {
    const p = { ...G.pawns[0], appearance: S.apply(w.GameRenderer.ProceduralPawn.generateAppearance('x'), 'pawn_' + S.list.indexOf(s)) };
    for (const gear of [{}, { armor: { tier: 'rare' }, helmet: { tier: 'rare' } }]) {
      w.GameRenderer.ProceduralPawn.renderPawn(G.ctx, { ...p, ...gear }, 1, 0, true);
    }
  }
});

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
  assert.equal(p.skills.length, 1);
  A.lootItem(p, G.spawnDropItem(p.x, p.y, w.GameData.Equipments.weapons.w_wooden_wand));
  assert.equal(p.classId, 'mage');
  assert.ok(p.skills[0].id);
  p.skills = []; p.classId = 'warrior'; p.unspentSkillPoints = 15;
  A.handleLevelingAndSkills(p);
  assert.ok(p.skills.length>=5);
  assert.equal(p.skills.reduce((sum, s) => sum + s.tier, 0) + p.unspentSkillPoints, 15);
  const def=w.GameData.Skills.warrior.actives[0];p.skills=[{id:def.id,def,tier:1,cooldownTimer:0}];
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
  assert.ok(p.level>15);assert.ok(w.GameData.LevelTable.expForLevel(p.level+1)>p.currentExp);
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
  assert.ok(p.confidence>49.7&&p.confidence<50);
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
  for (let i = 0; i < 27000 && !G.battleRoyaleResolved; i++) {
    G.matchTime += 0.1;
    G.update(0.1);
    dropsSeen = Math.max(dropsSeen, G.dropItems.length);
    if (i % 100 === 0) G.render();
    if(i%10===0){const C=w.GameEntities.CombatSystem;
      for(const p of G.pawns.filter(p=>p.isAlive)){assert.ok(C.validMembers(C.crowdAt(p,p.x,p.y)),p.id+' overcrowded');}
      for(const e of [...G.pawns,...G.monsters].filter(e=>e.isAlive&&e.combatLease>0))assert.ok(C.validMembers(new Set(C.groupMembers(e).filter(p=>p.isAlive&&p.combatLease>0))),e.id+' linked battle exceeds cap');
    }
  }
  assert.equal(G.battleRoyaleResolved, true, 'last survivor must be found within 45 simulated minutes without a storm: '+JSON.stringify(G.pawns.filter(p=>p.isAlive).map(p=>({id:p.id,lv:p.level,x:Math.round(p.x),y:Math.round(p.y),hp:Math.round(p.currentHp),objective:p.objective,plan:p.plan?.kind,target:p.targetEnemy?.id}))));
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
  for(const tier of [4]){
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

test('HP regenerates one per second, gear does not heal and potions add healing',()=>{
  const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem,A=w.GameAI.AIBrain,p=G.pawns[0];
  p.currentHp=50;
  C.updateStatus(p,30);assert.equal(p.currentHp,80);
  const armor={name:'Test',tier:'common',hp:80,defense:5};
  A.lootItem(p,G.spawnDropItem(p.x,p.y,armor,'body'));assert.equal(p.currentHp,80,'equipping HP does not heal');
  assert.equal(C.usePotion(p),false);
  const bottle=G.spawnDropItem(p.x,p.y,C.potion,'potion');
  assert.equal(A.findBestItemToLoot(p,[bottle]),bottle);A.lootItem(p,bottle);
  assert.equal(C.usePotion(p),true);assert.equal(p.currentHp,80);C.updateStatus(p,.7);
  assert.ok(p.currentHp>50);assert.equal(p.healthPotions,0);
  const hp=p.currentHp;C.updateStatus(p,30);assert.equal(p.currentHp,Math.min(p.maxHp,hp+30));
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
  C.updateStatus(m,1.3);C.tickEffects(.2);assert.ok(p.currentHp<10000);
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
 a.x=M.riverX(3000);a.y=3000;b.x=a.x+5;b.y=a.y;a.waterWalkTimer=10; // y=2600 is now a shallow ford, so use a deep stretch
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
 p.level=15;p.currentExp=w.GameData.LevelTable.expForLevel(15);I.inspect(p);assert.match(w.documentText('inspect-panel'),/Còn 1200 EXP/);
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

test('Yêu Thần cannot chain different spells less than two seconds apart',()=>{
 const w=loadGame(42,{openTemple:true}),G=w.GameManager,C=w.GameEntities.CombatSystem,m=G.monsters.find(m=>m.tier===5),p=G.pawns[0];
 p.x=m.x+20;p.y=m.y;p.maxHp=p.currentHp=10000;G.spatialGrid.clear();G.spatialGrid.insert(p);G.spatialGrid.insert(m);
 m.skills.forEach(s=>s.cooldownTimer=0);assert.equal(C.castSkill(m,m.skills[0],p),true);
 C.updateStatus(m,1.5);assert.equal(m.action,null);assert.equal(C.castSkill(m,m.skills[1],p),false);
 C.updateStatus(m,.49);assert.equal(C.castSkill(m,m.skills[1],p),false);
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
 for(const m of E.finalHuntMonsters)C.handleDeath(p,m);assert.ok(p.level>=15);
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
  if(p.level>=15&&p.targetEnemy===boss){reached=true;break;}
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

test('ambush requires a visible full battle, safe nearby bush and attacks a passerby only after a slot opens',()=>{
 const w=loadGame(),G=w.GameManager,A=w.GameAI.AIBrain,C=w.GameEntities.CombatSystem,M=w.GameEngine.MapTerrain,[p,q,r,t]=G.pawns;
 G.pawns=[p,q,r,t];G.monsters=[];p.x=1120;q.x=1320;r.x=1340;t.x=1360;p.y=q.y=r.y=t.y=300;
 const bush={x:490,y:150,radius:25,isBurned:false};M.bushes.push(bush);p.decisionTime=1;
 p.trait='coward';p.personality={...p.personality,aggression:90,caution:85,greed:80,loyalty:10};
 C.reserveCombat(q,r);C.reserveCombat(r,t);G.spatialGrid.clear();[p,q,r,t].forEach(e=>G.spatialGrid.insert(e));A.update(p,.1,G.spatialGrid,M);
 assert.equal(p.plan?.kind,'ambush');const site=p.plan.target;p.x=site.x;p.y=site.y;A.ambush(p,site,[q,r,t],.1);
 assert.equal(p.isHiding,true);assert.equal(C.canSee(q,p),false);
 q.combatLease=r.combatLease=t.combatLease=0;q.x=p.x+20;q.currentHp=35;A.ambush(p,site,[q],.1);
 assert.equal(p.targetEnemy,q);assert.equal(p.isHiding,false);
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

test('a melee survivor completes all five final-hunt bosses with the current regeneration rule',()=>{
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
 assert.equal(p.plan.kind,'farm');assert.equal(p.combatLoot.item,item);assert.ok(p.x>1000);
 p.x=item.x;p.y=item.y;p.action=null;p.plan={kind:'duel',target:q,until:100};
 A.update(p,.1,G.spatialGrid,M);assert.equal(item.isCollected,true);assert.equal(p.weapon.id,'w_rusty_sword');
});

test('equipment evaluation includes speed, range and HP across weapon styles and cleared lairs',()=>{
 const w=loadGame(),G=w.GameManager,A=w.GameAI.AIBrain,p=G.pawns[0],D=w.GameData.Equipments;
 p.x=1000;p.y=300;A.lootItem(p,G.spawnDropItem(p.x,p.y,D.weapons.w_rusty_axe));
 const faster=G.spawnDropItem(p.x,p.y,{...D.weapons.w_rusty_axe,id:'fast',attack:11,speed:1.3});
 assert.equal(A.findBestItemToLoot(p,[faster]),faster);assert.equal(A.lootItem(p,faster),true);
 const crossStyle=G.spawnDropItem(p.x,p.y,{...D.weapons.w_wooden_wand,attack:40,magicPower:40,tier:'super_rare'});assert.equal(A.lootItem(p,crossStyle),true);assert.equal(p.classId,'mage');
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
 p.personality={...w.GameData.PersonalityProfiles.brave};p.lastAttacker=q;p.grudgeUntil=20;G.matchTime=1;
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
 assert.equal(p.action?.kind,'drink');assert.equal(p.healthPotions,0);p.action=null;p.currentHp=p.maxHp;
 A.update(p,.1,G.spatialGrid,M);assert.match(p.objective,/Nhặt/);assert.ok(!p.targetEnemy);
});


test('tactical teleport moves away from the attacker instead of toward it',()=>{
 const w=loadGame(),G=w.GameManager,A=w.GameAI.AIBrain,C=w.GameEntities.CombatSystem,[p,q]=G.pawns;
 G.pawns=[p,q];G.monsters=[];p.x=1000;q.x=1100;p.y=q.y=300;
 const def=w.GameData.Skills.mage.actives.find(s=>s.type==='teleport');p.skills=[{id:def.id,def,tier:1,cooldownTimer:0}];
 const old=p.x;assert.equal(A.chooseCombatSkill(p,q,'retreat'),true);C.updateStatus(p,.8);assert.ok(p.x<old);
});


test('two-level gaps prioritize farming; coalition remains a deliberate exception; nearby underdogs can recruit without kill history',()=>{
 const w=loadGame(42,{openTemple:true}),G=w.GameManager,A=w.GameAI.AIBrain,C=w.GameEntities.CombatSystem,[p,q,t]=G.pawns;
 p.x=2500;q.x=2540;t.x=2580;p.y=q.y=t.y=2600;
 p.level=q.level=5;t.level=7;p.fear=p.despair=q.fear=q.despair=0;p.confidence=q.confidence=60;
 const rate=A.calculateWinRate;A.calculateWinRate=(a,b,allied)=>allied?.45:.4;
 assert.equal(A.duelEligible(p,t),false);t.level=10;assert.equal(A.duelEligible(p,t),false);
 t.level=7;w.__math.random=()=>0;A.handleCoalition(p,[q,t]);
 assert.equal(p.allyPawn,q);assert.equal(p.pactTarget,t);assert.equal(p.pactIntel.local,true);
 A.calculateWinRate=rate;
});

function ancientScenario(kind){
 const w=loadGame(42,{openTemple:true}),G=w.GameManager,E=w.GameEntities.EntityManager,C=w.GameEntities.CombatSystem,A=w.GameEntities.AncientSystem,p=G.pawns[0],god=E.worldBoss;
 G.pawns.forEach(q=>q.isAlive=q===p);p.level=15;p.unspentSkillPoints=15;p.classId='warrior';p.maxHp=p.currentHp=1500;w.GameAI.AIBrain.handleLevelingAndSkills(p);
 G.winnerPawn=p;G.battleRoyaleResolved=true;G.resultOpen=false;G.isPaused=false;
 const index=w.GameData.AncientBosses.findIndex(d=>d.kind===kind);w.__math.random=()=> (index+.1)/5;
 C.handleDeath(p,god);assert.equal(A.boss,null);A.tick(19.9);assert.equal(A.boss,null);A.tick(.11);const m=A.boss;
 p.x=m.x+70;p.y=m.y;G.pawns=[p];G.monsters=[m];G.spatialGrid.clear();G.spatialGrid.insert(p);G.spatialGrid.insert(m);
 p.combatLease=m.combatLease=0;p.combatGroup=m.combatGroup=null;p.critChance=0;
 return {w,G,E,C,A,p,m};
}

test('all five Ancient variants awaken in the collapsed arena and continue the gauntlet after both HP bars',()=>{
 for(const kind of ['colossus','mirror','void','chaos','mecha']){
  const {w,G,C,A,p,m}=ancientScenario(kind),god=w.GameEntities.EntityManager.worldBoss;
  assert.equal(m.ancientKind,kind);assert.ok(w.GameEngine.MapTerrain.canStand(m.x,m.y));assert.notEqual(m.y,god.y);assert.equal(A.arena.w*A.arena.h,2250000);
  assert.equal(A.awaken(god,p),m);assert.equal(m.skills.length,6);assert.equal(m.passives.length,6);
  assert.equal(m.ccImmune,true);assert.ok(Number.isFinite(m.maxHp));assert.equal(m.currentHp,m.maxHp);G.render();w.GameUI.InspectModal.inspect(m);
  assert.match(w.documentText('inspect-panel'),/Phase 1/);assert.ok(w.documentText('inspect-panel').includes('1 phép / 1s'));
  const exp=p.currentExp,drops=G.dropItems.length;m.currentHp=0;C.handleDeath(p,m);
  assert.equal(m.phase,2);assert.equal(m.currentHp,m.phaseMaxHp);assert.equal(m.isAlive,true);assert.equal(G.isGameOver,false);
  m.stunTimer=m.silenceTimer=m.slowTimer=10;C.updateStatus(m,.1);assert.equal(m.stunTimer+m.silenceTimer+m.slowTimer,0);
  m.currentHp=0;C.handleDeath(p,m);assert.equal(m.isAlive,false);assert.equal(G.isGameOver,false);assert.equal(G.isPaused,false);
  assert.equal(p.currentExp,exp);assert.equal(G.dropItems.length,drops+1);assert.equal(A.defeated,1);assert.equal(A.nextAt,A.clock+10);
  G.startNewMatch();assert.equal(A.awakened,false);assert.equal(A.boss,null);assert.equal(G.isGameOver,false);
 }
});

test('Yêu Vương keeps 3s cadence; Ancient keeps 1s even with Zero Protocol phase-two zero cooldown',()=>{
 const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem,m=G.monsters.find(m=>m.tier===4),p=G.pawns[0];
 p.x=m.x+30;p.y=m.y;p.currentHp=p.maxHp=100000;G.spatialGrid.clear();G.spatialGrid.insert(p);G.spatialGrid.insert(m);
 m.skills.forEach(s=>s.cooldownTimer=0);assert.equal(C.castSkill(m,m.skills[0],p),true);C.updateStatus(m,2.99);
 assert.equal(C.castSkill(m,m.skills[1],p),false);C.updateStatus(m,.02);assert.equal(C.castSkill(m,m.skills[1],p),true);
 const a=ancientScenario('mecha');a.m.currentHp=0;a.C.handleDeath(a.p,a.m);a.C.updateStatus(a.m,1);
 const s=a.m.skills[0];s.cooldownTimer=0;assert.equal(a.C.castSkill(a.m,s,a.p),true);assert.equal(s.cooldownTimer,0);
 a.C.updateStatus(a.m,.96);assert.equal(a.C.castSkill(a.m,s,a.p),false);a.C.updateStatus(a.m,.5);assert.equal(a.C.castSkill(a.m,s,a.p),true);
});

test('Ancient movesets resolve all thirty skills with real timed fields, collision walls and split clones',()=>{
 for(const kind of ['colossus','mirror','void','chaos','mecha']){
  const {w,G,C,A,p,m}=ancientScenario(kind);p.invincible=true;
  for(const s of m.skills){
   A.fields=[];m.action=null;m.attackState=null;m.globalSkillCooldown=0;m.ventUntil=0;m.castHeat=0;s.cooldownTimer=0;m.phase=2;
   assert.equal(C.castSkill(m,s,p),true,kind+' '+s.id);assert.ok(A.fields.some(f=>f.warningOnly));
   C.updateStatus(m,s.def.windup+.01);A.tick(.1);G.render();assert.ok(Number.isFinite(m.x));
   if(s.def.effect==='split'){
    assert.equal(m.clones.length,2);assert.equal(m.isSplit,true);assert.equal(C.isEnemy(p,m),false);
    assert.equal(C.validMembers(new Set([p,...m.clones])),true);
    assert.equal(m.clones[0].statMultiplier,.5);m.isSplit=false;m.clones.forEach(c=>c.isAlive=false);
   }
  }
  if(kind==='colossus'){
   const wall=A.walls[0];assert.ok(wall);assert.equal(w.GameEngine.MapTerrain.canStand(wall.x+16,wall.y+16,0),false);
   A.tick(6);assert.equal(A.walls.length,0);
  }
 }
});

test('Ancient defenses, copied build and warned ultimate behave as designed',()=>{
 const mirror=ancientScenario('mirror');
 assert.equal(mirror.m.maxHp,450);assert.equal(mirror.m.copiedPassives.length,mirror.p.passives.length);assert.equal(mirror.m.passiveMultiplier,1);
 assert.equal(mirror.A.incoming(mirror.p,mirror.m,100,{skill:true},null),0);assert.equal(mirror.A.incoming(mirror.p,mirror.m,100,{skill:true},null),100);
 const col=ancientScenario('colossus');assert.equal(col.A.incoming(col.p,col.m,100,{},null),90);assert.equal(col.A.incoming(col.p,col.m,100,{trueDamage:true},null),75);
 const mecha=ancientScenario('mecha'),shield=mecha.m.shield;
 assert.ok(mecha.A.incoming(mecha.p,mecha.m,100,{},null)>0);for(let i=1;i<10;i++)mecha.A.incoming(mecha.p,mecha.m,100,{},null);
 assert.equal(mecha.m.shield,0);assert.ok(mecha.A.fields.some(f=>f.name==='Xả Nhiệt Quá Tải'));
 const v=ancientScenario('void');assert.equal(v.A.incoming(v.p,v.m,100,{dot:'poison'},null),0);assert.equal(v.A.incoming(v.p,v.m,100,{projectile:true},null),80);
 v.m.phase=2;v.m.globalSkillCooldown=0;const skill=v.m.skills[5];skill.cooldownTimer=0;v.p.defense=100000;v.p.passives=[];
 assert.equal(v.C.castSkill(v.m,skill,v.p),true);const hp=v.p.currentHp;v.C.updateStatus(v.m,2.9);v.A.tick(2.9);assert.equal(v.p.currentHp,hp);
 v.C.updateStatus(v.m,.11);v.A.tick(.11);assert.ok(v.p.currentHp>=hp*.9,'warned lanes replace unavoidable 80% max-HP damage');assert.ok(v.A.fields.every(f=>!f.trueHpPct));
});

test('no-prey exploration persists then visits a different sector; bosses reposition during skill cooldowns',()=>{
 const w=loadGame(),G=w.GameManager,A=w.GameAI.AIBrain,p=G.pawns[0];p.decisionTime=1;A.wanderAround(p,.1);const goal=p.roamGoal;
 A.wanderAround(p,.1);assert.equal(p.roamGoal,goal);p.x=goal.x;p.y=goal.y;p.decisionTime=100;A.wanderAround(p,.1);assert.notEqual(p.roamGoal.key,goal.key);
 const boss=G.monsters.find(m=>m.tier===4);p.x=boss.x+180;p.y=boss.y;boss.skills.forEach(s=>s.cooldownTimer=10);boss.attackCooldown=10;
 const x=boss.x,y=boss.y;w.GameAI.BossBrain.update(boss,[p],.2);assert.ok(Math.hypot(boss.x-x,boss.y-y)>0);assert.match(boss.objective,/Bọc sườn/);
});

test('ordinary bots do not camp; concealment needs recent pursuit, broken vision and no active combat',()=>{
 const w=loadGame(),G=w.GameManager,A=w.GameAI.AIBrain,C=w.GameEntities.CombatSystem,M=w.GameEngine.MapTerrain,[p,q]=G.pawns;
 G.pawns=[p,q];G.monsters=[];p.x=1000;q.x=1200;p.y=q.y=300;p.fear=p.despair=0;p.trait='coward';
 M.bushes.push({x:500,y:150,radius:30,isBurned:false});G.spatialGrid.clear();G.spatialGrid.insert(p);
 A.update(p,.1,G.spatialGrid,M);assert.notEqual(p.plan?.kind,'ambush');assert.equal(p.isHiding,false);
 p.x=1000;p.y=300;assert.equal(C.canHideInBush(p),false,'enemy sees bush entry');
 q.x=1600;assert.equal(A.hideAfterEscape(p,.1),false,'no pursuit memory');
 q.x=1200;q.targetEnemy=p;G.matchTime=1;A.escapeThreat(p,q,.01);assert.ok(p.escapeMemory);assert.equal(p.isHiding,false);
 p.x=850;p.y=300;M.bushes.push({x:425,y:150,radius:30,isBurned:false});p.combatLease=2;
 A.hideAfterEscape(p,.1);assert.equal(p.isHiding,false,'active combat disallows concealment');
 C.updateStatus(p,2.1);G.matchTime=1.2;A.hideAfterEscape(p,.1);assert.equal(p.isHiding,true);
 q.x=p.x+200;assert.equal(C.canSee(q,p),true);assert.equal(p.isHiding,false,'re-entry into vision reveals hidden bot');
});

test('Mirror copied utility uses the original effect; Mecha nuclear warning makes bots seek cover',()=>{
 const a=ancientScenario('mirror'),def=a.w.GameData.Skills.hybrid?.actives.find(s=>/heal/.test(s.type))||{id:'test_heal',name:'Hồi máu',type:'self_heal',t1:{instantHealPct:.15},cooldown:8};
 a.m.copiedSkills=[{id:def.id,def,tier:3,cooldownTimer:0}];a.m.currentHp=a.m.maxHp/2;const hp=a.m.currentHp;
 a.A.resolve(a.m,a.A.config(a.m,a.m.skills[0]),a.p,{x:a.p.x,y:a.p.y},0);a.C.tickEffects(.5);assert.ok(a.m.currentHp>hp||a.C.fields.some(f=>f.heal>0));
 const z=ancientScenario('mecha');z.m.phase=2;z.m.globalSkillCooldown=0;z.m.skills[5].cooldownTimer=0;
 assert.equal(z.C.castSkill(z.m,z.m.skills[5],z.p),true);assert.equal(z.A.avoid(z.p,.1),true);assert.match(z.p.objective,/tàn tích|Né/);
});

test('boss brain attack range matches its real normal attack; Mirror clone deaths share one phase-two bar',()=>{
 const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem,p=G.pawns[0],boss=G.monsters.find(m=>m.tier===4);
 p.x=boss.x+C.combatStats(boss).range-5;p.y=boss.y;
 assert.equal(C.executeAttack(boss,p),true);
 const a=ancientScenario('mirror');a.m.currentHp=0;a.C.handleDeath(a.p,a.m);a.A.split(a.m,a.p);
 const [first,second]=a.m.clones;assert.equal(first.speed,a.m.speed*.5);
 first.currentHp=0;a.C.handleDeath(a.p,first);assert.equal(a.m.isAlive,true);assert.equal(a.m.currentHp,second.currentHp);
 second.currentHp=0;a.C.handleDeath(a.p,second);assert.equal(a.G.isGameOver,false);assert.equal(a.A.defeated,1);assert.equal(a.A.nextAt,a.A.clock+10);
});

test('expired alliances disperse before breaking a four-person physical crowd',()=>{
 const w=loadGame(),G=w.GameManager,A=w.GameAI.AIBrain,C=w.GameEntities.CombatSystem,[p,q,r,s,t]=G.pawns;
 G.pawns=[p,q,r,s,t];G.monsters=[];[p,q,r,s].forEach((e,i)=>{e.x=1000+i*12;e.y=300;e.combatLease=0;});
 p.allyPawn=q;q.allyPawn=p;r.allyPawn=s;s.allyPawn=r;p.pactTarget=q.pactTarget=t;p.pactUntil=q.pactUntil=0;G.matchTime=30;
 assert.equal(C.validMembers(C.crowdAt(p,p.x,p.y)),true);assert.equal(C.canDissolveAlliance(p),false);
 assert.equal(A.pursueCoalition(p,[],.1),true);assert.equal(p.allyPawn,q);
 assert.equal(C.validMembers(C.crowdAt(q,q.x,q.y)),true);assert.match(p.objective,/Tản ra/);
});

test('respawn waves wait exactly 10s per extinct tier and stop for the final hunt',()=>{
 const w=loadGame(),E=w.GameEntities.EntityManager,G=w.GameManager;
 const beasts=G.monsters.filter(m=>m.tier===2),generals=G.monsters.filter(m=>m.tier===3);
 beasts.forEach(m=>m.isAlive=false);generals.slice(1).forEach(m=>m.isAlive=false);
 E.updateRespawns(9.9);assert.equal(G.monsters.filter(m=>m.tier===2&&m.isAlive).length,0);
 E.updateRespawns(.1);const wave=G.monsters.filter(m=>m.tier===2&&m.isAlive);assert.equal(wave.length,20);assert.equal(G.monsters.filter(m=>m.tier===3&&m.isAlive).length,1);
 wave.forEach((m,i)=>{assert.equal(m.territory,beasts[i].territory);assert.equal(m.homeX,beasts[i].homeX);});
 generals[0].isAlive=false;E.updateRespawns(10);assert.equal(G.monsters.filter(m=>m.tier===3&&m.isAlive).length,6);
 G.battleRoyaleResolved=true;G.monsters.filter(m=>m.tier===2).forEach(m=>m.isAlive=false);E.updateRespawns(20);assert.equal(G.monsters.filter(m=>m.tier===2&&m.isAlive).length,0);
});
test('regeneration is independent of frame size, capped, pauses and never revives',()=>{
 const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem,[p]=G.pawns,m=G.monsters[0];
 p.currentHp=m.currentHp=20;for(let i=0;i<100;i++){C.updateStatus(p,.01);C.updateStatus(m,.01);}
 assert.ok(Math.abs(p.currentHp-21)<1e-8);assert.ok(Math.abs(m.currentHp-21)<1e-8);
 p.currentHp=p.maxHp-.1;C.updateStatus(p,10);assert.equal(p.currentHp,p.maxHp);
 m.isAlive=false;m.currentHp=0;C.updateStatus(m,10);assert.equal(m.currentHp,0);
 p.currentHp=20;G.isPaused=true;G.update(5);assert.equal(p.currentHp,20);
});
test('personality chooses breadth or mastery without weapon locks or a four-skill cap',()=>{
 const w=loadGame(),A=w.GameAI.AIBrain,[wide,deep]=w.GameManager.pawns;
 for(const [p,random] of [[wide,0],[deep,.99]]){p.skills=[];p.unspentSkillPoints=15;p.skillPreferences=Object.fromEntries(Object.values(w.GameData.Skills).flatMap(g=>g.actives).map((d,i)=>[d.id,100-i]));w.__math.random=()=>random;A.handleLevelingAndSkills(p);assert.equal(p.skills.reduce((n,s)=>n+s.tier,0),15);}
 assert.equal(wide.skills.length,15);assert.equal(deep.skills.length,5);assert.ok(deep.skills.every(s=>s.tier===3));
 assert.ok(wide.skills.some(s=>s.id.startsWith('m_')));assert.ok(wide.skills.some(s=>s.id.startsWith('w_')));
});
test('repeated pokes create bounded fear, anger and defiance; blocked escape leads to resistance',()=>{
 const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem,A=w.GameAI.AIBrain,[p,q]=G.pawns;
 G.pawns=[p,q];G.monsters=[];p.x=1000;q.x=1030;p.y=q.y=300;p.currentHp=p.maxHp=500;q.currentHp=q.maxHp=500;p.personality.aggression=80;
 for(let i=0;i<4;i++){G.matchTime=i;C.applyDamage(q,p,null,{baseDamage:12});}
 assert.ok(p.fear<15);assert.ok(p.anger>35);assert.equal(p.defiantTarget,q);
 p.skills=[];G.spatialGrid.clear();[p,q].forEach(e=>G.spatialGrid.insert(e));A.engageCombat(p,q,.1);assert.equal(p.tactic.mode,'counter');assert.equal(p.action?.kind,'attack');
 p.action=null;p.defiantUntil=0;p.anger=0;p.currentHp=40;const original=A.hasRetreatRoute;A.hasRetreatRoute=()=>false;
 A.engageCombat(p,q,.1);assert.notEqual(p.tactic.mode,'escape');assert.equal(p.targetEnemy,q);A.hasRetreatRoute=original;
});
test('tactic and retreat goals hold steady under alternating openings and near-equal plans',()=>{
 const w=loadGame(),G=w.GameManager,A=w.GameAI.AIBrain,C=w.GameEntities.CombatSystem,[p,q]=G.pawns;
 G.pawns=[p,q];G.monsters=[];p.x=1000;q.x=1140;p.y=q.y=300;p.skills=[];p.attackCooldown=100;p.currentHp=q.currentHp=160;
 let switches=0,last,firstGoal;for(let i=0;i<60;i++){G.matchTime=i*.05;q.stunTimer=i%2?.2:0;A.engageCombat(p,q,.05);if(last&&last!==p.tactic.mode)switches++;last=p.tactic.mode;}
 assert.ok(switches<=6,'no frame-by-frame tactic flip: '+switches);
 p.x=1000;p.y=300;q.x=1040;q.y=300;p.retreatGoal=null;G.matchTime=4;A.retreatSafely(p,q,.01,true);firstGoal=p.retreatGoal;
 for(let i=1;i<15;i++){G.matchTime=4+i*.04;A.retreatSafely(p,q,.01,true);assert.equal(p.retreatGoal,firstGoal);}
});
test('reworked skills split damage over real pulses and mana shields consume their own resource',()=>{
 const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem,[p,q]=G.pawns;
 G.pawns=[p,q];G.monsters=[];p.x=1000;q.x=1030;p.y=q.y=300;p.maxHp=p.currentHp=q.maxHp=q.currentHp=1000;q.defense=0;w.__math.random=()=>.99;
 G.spatialGrid.clear();[p,q].forEach(e=>G.spatialGrid.insert(e));
 const def=w.GameData.Skills.warrior.actives.find(d=>d.type==='whirlwind_aoe'),skill={id:def.id,def,tier:3,cooldownTimer:0};
 C.resolveSkill(p,skill,q);const first=1000-q.currentHp;assert.ok(first>0&&C.pendingEffects.length===2);C.tickEffects(.4);assert.ok(q.currentHp<1000-first);const second=q.currentHp;C.tickEffects(.4);assert.ok(q.currentHp<second);assert.equal(C.pendingEffects.length,0);
 const shieldDef=w.GameData.Skills.mage.actives.find(d=>d.type==='mana_shield_toggle');C.resolveSkill(q,{id:shieldDef.id,def:shieldDef,tier:3},null);
 const mana=q.currentMana,hp=q.currentHp;C.applyDamage(p,q,null,{baseDamage:40});assert.equal(q.currentMana,mana-20);assert.equal(q.currentHp,hp-20);
 for(const group of Object.values(w.GameData.Skills))for(const def of group.actives)for(let tier=1;tier<=3;tier++){const c=C.getSkillConfig(p,{def,tier});assert.ok(c.damage<=C.combatStats(p).attack*2.1);assert.ok(c.cooldown>=6);assert.ok(c.stun<=.9);}
});

test('escape stops after the threat is out of sight instead of driving the bot to the map edge',()=>{
 const w=loadGame(),G=w.GameManager,A=w.GameAI.AIBrain,[p,q]=G.pawns;
 G.pawns=[p,q];G.monsters=[];p.x=1000;p.y=300;q.x=2500;q.y=300;p.plan={kind:'duel',target:q,until:100};p.targetEnemy=q;
 A.escapeThreat(p,q,.1);assert.equal(p.targetEnemy,null);assert.equal(p.plan,null);assert.ok(A.ignored(p,q));assert.ok(p.roamGoal);
});

test('near-equal hunt scores do not alternate plans every evaluation',()=>{
 const w=loadGame(),G=w.GameManager,A=w.GameAI.AIBrain,[p]=G.pawns,[m,n]=G.monsters;
 G.pawns=[p];G.monsters=[m,n];p.x=1000;p.y=300;p.skills=[];p.unspentSkillPoints=0;
 for(const [target,x] of [[m,1800],[n,1805]]){target.x=x;target.y=300;target.tier=1;target.attack=1;target.defense=0;target.currentHp=target.maxHp=40;target.territory=null;}
 const move=A.moveToTarget;A.moveToTarget=()=>{};G.spatialGrid.clear();[p,m,n].forEach(e=>G.spatialGrid.insert(e));
 let chosen;for(let i=0;i<80;i++){G.matchTime=i*.1;m.currentHp=i%2?39:40;n.currentHp=i%2?40:39;A.update(p,.1,G.spatialGrid,w.GameEngine.MapTerrain);chosen=chosen||p.plan.target;assert.equal(p.plan.target,chosen);}
 A.moveToTarget=move;
});
test('sound controls, camera distance and voice budget guard Web Audio playback',()=>{
 const w=loadGame(),A=w.GameEngine.Audio,G=w.GameManager,cam=w.GameEngine.Camera,p={id:'sound',x:cam.x,y:cam.y};
 assert.equal(A.play('hit',p),false);A.ctx={state:'running',currentTime:0};A.enabled=false;assert.equal(A.play('hit',p),false);
 A.enabled=true;A.voices=16;assert.equal(A.play('hit',p),false);A.voices=0;G.isPaused=true;assert.equal(A.play('hit',p),false);
 G.isPaused=false;assert.equal(A.play('hit',{...p,x:-10000,y:-10000}),false);
 A.setVolume(500);assert.equal(A.volume,1);A.setVolume(-20);assert.equal(A.volume,0);assert.equal(A.play('hit',p),false);
});

test('audio recipes cover every weapon style, skill, monster mode, ancient effect and play without gameplay RNG',async()=>{
 const w=loadGame(),A=w.GameEngine.Audio,G=w.GameManager,T=A.recipes,cam=w.GameEngine.Camera,ended=[];let nodes=0;
 const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}});
 const node=()=>{nodes++;return{connect(){},disconnect(){},start(){},stop(){},gain:param(),frequency:param(),Q:param(),pan:param(),delayTime:param(),threshold:param(),ratio:param(),set onended(f){ended.push(f);}};};
 w.AudioContext=function(){return{state:'running',currentTime:0,sampleRate:8000,destination:{},createGain:node,createOscillator:node,createBufferSource:node,createBiquadFilter:node,createStereoPanner:node,
  createDynamicsCompressor:node,createDelay:node,createBuffer:(c,n)=>({getChannelData:()=>new Float32Array(n)}),resume:async()=>{}};};
 await A.unlock();assert.ok(A.master&&A.noise&&A.fx);
 const missing=[];const need=name=>{if(!T[name])missing.push(name);};
 for(const s of Object.keys(w.GameEntities.CombatSystem.styles))['wind','swing','hit'].forEach(k=>need(k+'.'+s));
 for(const g of ['blade','heavy','arrow','magic'])need('block.'+g);
 for(const d of Object.values(w.GameData.Skills).flatMap(g=>g.actives))need('skill.'+d.id);
 for(const mode of new Set(Object.values(w.GameData.MonsterTactics).map(t=>t[0])))need('skill.m_'+mode);
 for(const b of w.GameData.AncientBosses){need('warn.'+b.kind);need('phase.'+b.kind);for(const s of b.skills)need('ancient.'+s.effect);}
 for(const def of Object.values(w.GameData.Monsters).flat()){const f=A.fam({visual:def.visual});['roar','bite','grunt','death'].forEach(k=>need(k+'.'+f));}
 for(const s of ['grass','stone','swim','bridge','bush','rock'])need('step.'+s);
 for(const e of ['fire','ice','void','steel','burn','bleed','poison'])need('hit.'+e);
 for(const k of ['dodge','evade','drink','potion','heal','level','loot','death.pawn','awaken','ancientDown','victory','raise','ui.on','ui.tick','loot.potion','loot.weapon','loot.body','loot.head','loot.feet','loot.relic','impact.fire','impact.ice','impact.void','impact.steel'])need(k);
 assert.deepEqual(missing,[]);
 // Every recipe is well formed.
 for(const [name,r] of Object.entries(T))for(const L of r.L)assert.ok(L.d>0&&L.g>0&&L.at>=0&&(L.o?L.f0>0&&L.f1>0:L.f0>0&&L.f1>0&&L.q>0),name);
 // play() builds nodes, never touches gameplay Math.random, honours the voice cap and releases voices.
 const random=w.__math.random;w.__math.random=()=>{throw new Error('audio must not consume gameplay RNG');};
 const p={id:'a',x:cam.x,y:cam.y};let t=0,played=0;
 const calls=[['skill','w_whirlwind',{tier:3,el:undefined}],['skill','m_cleave',{}],['skill','not_a_skill',{el:'fire'}],['hit','sword',{crit:true,big:.2}],['block','axe'],['swing','bow'],['wind','tome'],['step','stone',{heavy:true}],['roar','giant',{tier:5}],['warn','mecha'],['phase','void'],['ancient','meteor'],['loot','relic'],['death'],['level'],['ui',null]];
 for(const [kind,style,o] of calls){A.ctx.currentTime=t+=1;if(A.play(kind,kind==='ui'?null:p,style==null?undefined:style,o))played++;}
 assert.ok(played>=calls.length-1,'played '+played);assert.ok(nodes>50);assert.ok(A.voices>0&&A.voices<=20);
 const live=A.voices;A.voices=16;assert.equal(A.play('hit',p,'sword'),false);A.voices=live;
 ended.forEach(f=>f());assert.equal(A.sources,0);assert.equal(A.voices,0);
 assert.equal(A.surface(cam.x,cam.y)!==undefined,true);
 G.isPaused=true;assert.equal(A.play('hit',p,'sword'),false);assert.equal(A.play('victory',null),true);
 w.__math.random=random;
});

test('all 32 reworked skills execute at all ranks without invalid resources or effects',()=>{
 const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem,V=w.GameRenderer.VfxManager,[p,q]=G.pawns;G.pawns=[p,q];G.monsters=[];
 const defs=Object.values(w.GameData.Skills).flatMap(group=>group.actives);assert.equal(defs.length,32);
 for(const def of defs)for(let tier=1;tier<=3;tier++){
  for(const e of [p,q]){e.action=null;e.attackState=null;e.isAlive=true;e.x=e===p?1000:1030;e.y=300;e.maxHp=10000;e.currentHp=e===p?5000:10000;e.currentMana=e.currentStamina=100;e.skills=[];e.globalSkillCooldown=e.stunTimer=e.silenceTimer=e.slowTimer=e.guardTimer=e.manaShieldTimer=e.weaponBuffTimer=e.healTimer=e.riposteTimer=e.stealthTimer=0;e.weapon=null;}
  C.pendingEffects=[];V.init();G.spatialGrid.clear();[p,q].forEach(e=>G.spatialGrid.insert(e));
  const skill={id:def.id,def,tier,cooldownTimer:0};p.skills=[skill];assert.equal(C.castSkill(p,skill,q),true,def.id+' rank '+tier);
  for(let i=0;i<30;i++){C.updateStatus(p,.1);C.updateStatus(q,.1);C.tickEffects(.1);V.update(.1);}
  for(const e of [p,q])for(const key of ['currentHp','currentMana','currentStamina','x','y'])assert.ok(Number.isFinite(e[key]),def.id+':'+key);
  assert.ok(p.currentMana>=0&&p.currentStamina>=0);assert.equal(p.action,null);
 }
});
test('riposte counters once from the front and armor break improves following hits',()=>{
 const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem,[p,q]=G.pawns;G.pawns=[p,q];G.monsters=[];p.x=1000;q.x=1030;p.y=q.y=300;p.aimAngle=0;q.currentHp=q.maxHp=p.currentHp=p.maxHp=1000;w.__math.random=()=>.99;
 const def=w.GameData.Skills.warrior.actives.find(d=>d.type==='counter_stance');C.resolveSkill(p,{id:def.id,def,tier:3},q);
 const first=q.currentHp;C.applyDamage(q,p,null,{baseDamage:30});assert.ok(q.currentHp<first);const second=q.currentHp;C.applyDamage(q,p,null,{baseDamage:30});assert.equal(q.currentHp,second);
 q.defense=100;p.guardTimer=0;const before=C.applyDamage(p,q,null,{baseDamage:50});q.armorBreak=.25;q.armorBreakTimer=3;const after=C.applyDamage(p,q,null,{baseDamage:50});assert.ok(after>before);
});

test('multi-hit skills record a cast once and split Mirror HP follows clone regeneration',()=>{
 const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem,[p,q]=G.pawns;G.pawns=[p,q];G.monsters=[];p.x=1000;q.x=1030;p.y=q.y=300;p.currentHp=p.maxHp=q.currentHp=q.maxHp=1000;
 G.spatialGrid.clear();[p,q].forEach(e=>G.spatialGrid.insert(e));const d=w.GameData.Skills.warrior.actives.find(d=>d.type==='whirlwind_aoe');p.skillsCast=1;C.resolveSkill(p,{id:d.id,def:d,tier:3},q);C.tickEffects(.4);C.tickEffects(.4);assert.equal(p.attackHistory.length,1);
 const a=ancientScenario('mirror');a.m.phase=2;a.A.resolve(a.m,a.A.config(a.m,a.m.skills.find(s=>s.def.effect==='split')),a.p,{x:a.p.x,y:a.p.y},0);
 a.m.clones.forEach(c=>{c.currentHp-=10;C.updateStatus.call(a.C,c,1);});a.A.tick(.1);assert.equal(a.m.currentHp,a.m.clones.reduce((sum,c)=>sum+c.currentHp,0));
});


test('final showdown starts at five, weak bots farm until the level gap closes and hunters keep a target',()=>{
 const w=loadGame(),G=w.GameManager,A=w.GameAI.AIBrain,M=w.GameEngine.MapTerrain,C=w.GameEntities.CombatSystem;
 const actors=G.pawns.slice(0,6),[weak,strong]=actors;G.pawns=actors;
 actors.forEach((p,i)=>{p.x=800+i*600;p.y=300;p.level=10;p.skills=[];p.unspentSkillPoints=0;p.action=null;});weak.level=5;
 G.update(.1);assert.equal(G.finalShowdown,false);
 actors[5].isAlive=false;G.update(.1);assert.equal(G.finalShowdown,true);
 assert.equal(weak.plan?.kind,'farm');const engage=A.engageCombat;A.engageCombat=p=>p.plan=null;assert.doesNotThrow(()=>A.updateFinalShowdown(weak,[],[],.1));A.engageCombat=engage;assert.ok(strong.finalHuntTarget?.isPawn);assert.equal(strong.targetEnemy,strong.finalHuntTarget);
 const hunted=strong.finalHuntTarget;strong.action=null;G.matchTime=50;strong.fear=100;strong.currentHp=10;
 A.update(strong,.1,G.spatialGrid,M);assert.equal(strong.finalHuntTarget,hunted);assert.equal(A.keepChasing(strong,hunted),true);
 weak.action=null;weak.level=9;A.update(weak,.1,G.spatialGrid,M);
 assert.ok(weak.finalHuntTarget?.isPawn);assert.equal(weak.plan,null,'one-level gap ends the farm exception');
 const target=strong.finalHuntTarget;target.isAlive=false;strong.action=null;
 A.update(strong,.1,G.spatialGrid,M);assert.notEqual(strong.finalHuntTarget,target);
 G.startNewMatch();assert.equal(G.finalShowdown,false);assert.ok(G.pawns.every(p=>!p.finalDuel&&!p.finalHuntTarget));
});

test('survival commitment defeats fear, low HP and five-level gap without exceeding encounter caps',()=>{
 const w=loadGame(),G=w.GameManager,A=w.GameAI.AIBrain,C=w.GameEntities.CombatSystem,M=w.GameEngine.MapTerrain;
 const [weak,strong,a,b,outsider]=G.pawns;G.pawns=[weak,strong,a,b,outsider];G.monsters=[];G.finalShowdown=true;
 G.pawns.forEach((p,i)=>{p.x=1000+i*500;p.y=300;p.skills=[];p.unspentSkillPoints=0;});
 weak.level=1;strong.level=15;weak.x=1000;strong.x=1020;weak.currentHp=10;weak.fear=weak.despair=100;weak.isClutchEscape=true;
 assert.equal(C.executeAttack(strong,weak),true);assert.ok(!weak.finalDuel);weak.personality={...w.GameData.PersonalityProfiles.brave};w.GameAI.EmotionEngine.commitSurvival(weak,strong);assert.equal(weak.finalDuel,strong);
 G.spatialGrid.clear();G.pawns.forEach(p=>G.spatialGrid.insert(p));
 A.update(weak,.1,G.spatialGrid,M);assert.equal(weak.targetEnemy,strong);assert.equal(weak.action?.kind,'attack');assert.match(weak.objective,/Quyết đấu|Phản công/);
 assert.equal(C.reserveCombat(a,strong),true);assert.equal(C.reserveCombat(b,strong),false);
 assert.ok(C.validMembers(new Set(C.groupMembers(strong))));
 for(const p of G.pawns){p.action=null;p.combatLease=0;p.combatGroup=null;}
 weak.allyPawn=strong;strong.allyPawn=weak;a.allyPawn=b;b.allyPawn=a;a.x=1040;b.x=1060;
 assert.equal(C.reserveCombat(weak,a),true);assert.equal(C.groupMembers(weak).length,4);
 assert.equal(C.reserveCombat(outsider,a),false);
 strong.isAlive=a.isAlive=b.isAlive=false;G.checkVictoryCondition();assert.equal(G.finalShowdown,true);
 outsider.isAlive=false;G.checkVictoryCondition();assert.equal(G.finalShowdown,false);assert.equal(G.battleRoyaleResolved,true);
});

test('two final bots dissolve their pact and finish a real duel instead of farming or fleeing',()=>{
 const w=loadGame(),G=w.GameManager,[p,q]=G.pawns;G.pawns=[p,q];G.monsters=[];
 for(const [i,e] of [p,q].entries()){e.x=1000+i*30;e.y=300;e.skills=[];e.unspentSkillPoints=0;e.currentHp=e.maxHp=100;e.attack=24;e.defense=0;e.healthPotions=0;e.fear=100;e.despair=100;e.allyPawn=i?p:q;}
 for(let i=0;i<1200&&!G.battleRoyaleResolved;i++){G.matchTime+=.1;G.update(.1);}
 assert.equal(p.allyPawn,null);assert.equal(q.allyPawn,null);assert.equal(G.battleRoyaleResolved,true);
 assert.equal(G.pawns.filter(e=>e.isAlive).length,1);assert.equal(G.finalShowdown,false);
 assert.equal(G.continueAfterResult(),true);assert.equal(G.monsters.filter(m=>m.isFinalHunt).length,5);
});


test('all bots level past 15 without a cap, with increasing EXP, stat gains and shared inspection',()=>{
 const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem,D=w.GameData.LevelTable,p=G.pawns[0];
 const hp=p.maxHp,atk=p.attack,def=p.defense,startLevel=p.level,points=p.unspentSkillPoints;
 p.currentExp=D.expForLevel(100);C.checkLevelUp(p);assert.equal(p.level,100);
 assert.equal(G.pawns.filter(e=>e.isAlive).length,100);assert.equal(G.battleRoyaleResolved,false);
 assert.equal(p.maxHp,hp+(100-startLevel)*24);assert.equal(p.attack,atk+(100-startLevel)*3);assert.equal(p.defense,def+(100-startLevel)*2);assert.equal(p.unspentSkillPoints,points+100-startLevel);
 assert.ok(p.level>15);assert.equal(p.currentHp,p.maxHp);assert.ok(p.unspentSkillPoints>15);
 const next=D.expForLevel(p.level+1);assert.ok(next>p.currentExp);
 assert.ok(D.expForLevel(18)-D.expForLevel(17)>D.expForLevel(17)-D.expForLevel(16));
 w.GameUI.InspectModal.inspect(p);const html=w.documentText('inspect-panel');assert.match(html,/Còn/);assert.doesNotMatch(html,/NaN|undefined|cấp tối đa/);
 assert.equal(C.grantLevel(p),true);assert.ok(Number.isFinite(p.attack)&&Number.isFinite(p.defense));
 const q=G.pawns[1];q.currentExp=D.expForLevel(16)-1;C.checkLevelUp(q);assert.equal(q.level,15);q.currentExp++;C.checkLevelUp(q);assert.equal(q.level,16);
 G.pawns.forEach(e=>e.isAlive=e===p);G.checkVictoryCondition();assert.equal(C.grantLevel(p),true);assert.equal(p.level,102);
});

test('high-tier monsters recover percentage HP only out of combat, with frame-independent lease expiry',()=>{
 const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem,p=G.pawns[0];
 for(const [tier,pct] of [[3,.01],[4,.03],[5,.05]]){
   const m=G.monsters.find(e=>e.tier===tier);m.maxHp=1000;m.currentHp=100;m.action=null;m.targetEnemy=null;m.combatLease=0;
   C.updateStatus(m,2);assert.equal(m.currentHp,100+2000*pct);
   m.combatLease=6;const hp=m.currentHp;C.updateStatus(m,2);assert.equal(m.currentHp,hp+2);
   m.action=null;m.combatLease=2;m.currentHp=100;const copy={...m,skills:[],passives:[]};
   C.updateStatus(m,3);for(let i=0;i<30;i++)C.updateStatus(copy,.1);assert.ok(Math.abs(m.currentHp-copy.currentHp)<1e-8);
   assert.equal(m.currentHp,102+1000*pct);
   m.currentHp=999;m.combatLease=0;C.updateStatus(m,1);assert.equal(m.currentHp,1000);
   m.isAlive=false;C.updateStatus(m,10);assert.equal(m.currentHp,1000);
 }
 const god=G.monsters.find(m=>m.tier===5);god.isAlive=true;god.currentHp=100;god.combatLease=0;
 god.x=1000;god.y=300;p.x=1020;p.y=300;god.targetEnemy=p;C.updateStatus(god,1);assert.equal(god.currentHp,101,'visible pursuit is still combat');
 god.targetEnemy=null;G.isPaused=true;G.update(1);assert.equal(god.currentHp,101);
});

test('God rewards every top-tier equipment slot, one potion and 10000 EXP before Ancient awakening',()=>{
 const w=loadGame(),G=w.GameManager,E=w.GameEntities.EntityManager,C=w.GameEntities.CombatSystem,p=G.pawns[0],god=E.worldBoss;
 G.pawns.forEach(e=>e.isAlive=e===p);G.checkVictoryCondition();p.currentExp=6400;C.checkLevelUp(p);assert.equal(p.level,15);
 assert.equal(god.expReward,10000);const before=p.currentExp;C.handleDeath(p,god);
 assert.equal(p.currentExp-before,10000);assert.ok(p.level>15);
 const rewards=G.dropItems.filter(d=>d.slot!=='potion');assert.equal(rewards.length,3);
 assert.deepEqual(Array.from(rewards,d=>d.slot).sort(),['body','head','weapon']);assert.ok(rewards.every(d=>d.tier==='god'));
 assert.equal(G.dropItems.filter(d=>d.slot==='potion').length,1);assert.equal(w.GameEntities.AncientSystem.awakened,false);assert.equal(w.GameEntities.AncientSystem.wakeRemaining,20);
 w.GameUI.InspectModal.inspect(god);assert.match(w.documentText('inspect-panel'),/5% HP/);assert.match(w.documentText('inspect-panel'),/giáp, mũ Thần Khí/);
 const count=G.dropItems.length;C.handleDeath(p,god);assert.equal(G.dropItems.length,count);assert.equal(p.currentExp-before,10000);
});


test('gauntlet defeats all five unique bosses, waits exactly ten seconds and drops five different relics',()=>{
 const a=ancientScenario('colossus'),{w,G,C,A,p}=a,M=w.GameEngine.MapTerrain,seen=[];
 for(let round=1;round<=5;round++){
  const m=A.boss;seen.push(m.ancientKind);assert.equal(m.gauntletRound,round);assert.equal(m.isAlive,true);
  const count=G.dropItems.filter(d=>d.tier==='ancient').length;
  m.currentHp=0;C.handleDeath(p,m);assert.equal(m.phase,2);assert.equal(G.dropItems.filter(d=>d.tier==='ancient').length,count);
  m.currentHp=0;C.handleDeath(p,m);assert.equal(G.dropItems.filter(d=>d.tier==='ancient').length,count+1);
  const relic=p.relicLoot;assert.equal(relic.tier,'ancient');C.handleDeath(p,m);assert.equal(A.defeated,round);
  p.action=null;p.targetEnemy=null;for(let i=0;i<60&&!relic.isCollected;i++)A.prepare(p,.1);assert.equal(relic.isCollected,true,'survivor walks to collect the relic, equipping only upgrades');
  if(round<5){const next=A.nextAt;A.tick(9.999);assert.equal(A.boss,m);assert.equal(G.isGameOver,false);G.isPaused=true;G.update(10);assert.equal(A.nextAt,next);G.isPaused=false;A.tick(.002);assert.notEqual(A.boss,m);}
 }
 assert.equal(new Set(seen).size,5);assert.deepEqual([...new Set(seen)].sort(),['chaos','colossus','mecha','mirror','void']);assert.equal(new Set(A.usedRelics).size,5);assert.equal(A.queue.length,0);
 A.tick(.1);assert.equal(G.isGameOver,true);assert.equal(G.ancientDefeated,true);assert.match(w.documentText('story-card-modal'),/đủ 5 boss/);
 G.startNewMatch();assert.equal(A.arena,null);assert.equal(M.ancientArena,null);assert.equal(A.usedRelics.length,0);assert.equal(A.defeated,0);
 assert.ok(M.canStand(1000,300));assert.equal(M.navBlocked[Math.floor(300/M.cell)*M.cols+Math.floor(1000/M.cell)],0);
});

test('collapsed arena enforces the full 1500 square, physical cover, dry combat, dash bounds and clone bounds',()=>{
 const a=ancientScenario('mirror'),{w,G,C,A,p,m}=a,M=w.GameEngine.MapTerrain,r=A.arena;
 assert.equal(r.w,1500);assert.equal(r.h,1500);assert.equal(M.canStand(r.x-1,r.cy,0),false);assert.equal(M.canTravel(p,1000,300),false);
 assert.ok(M.canTravel(p,r.x+20,r.y+20));assert.ok(M.canTravel(m,r.x+20,r.y+20),'boss is free outside the old temple');assert.equal(M.isInWater(r.cx,r.cy),false);M.bushes.push({x:r.cx/M.scale,y:r.cy/M.scale,radius:60,isBurned:false});assert.equal(M.isInBush(r.cx,r.cy),false);
 const cover=r.covers[0];assert.equal(M.canStand(cover.x+10,cover.y+10),false);assert.equal(M.segmentClear(cover.x-30,cover.y+10,cover.x+60,cover.y+10),false);
 p.x=r.x+15;p.y=r.cy;M.moveEntity(p,-1000,0);assert.ok(p.x>=r.x+9);
 w.GameAI.AIBrain.lootItem(p,G.spawnDropItem(p.x,p.y,w.GameData.Equipments.relics.treads,'feet'));
 assert.equal(C.defend(p,'dodge',Math.PI),true);C.updateStatus(p,.3);assert.ok(p.x>=r.x+9);p.action=null;
 A.split(m,p);assert.ok(m.clones.every(c=>M.canStand(c.x,c.y)));assert.equal(C.validMembers(new Set([p,...m.clones])),true);G.render();
});

function relicScenario(kind){
 const a=ancientScenario('mirror'),d=a.w.GameData.Equipments.relics[kind];
 a.m.ancientKind='training';a.m.foreseen=true;a.m.passives=[];a.m.copiedPassives=[];a.m.weapon=null;a.m.maxHp=a.m.currentHp=100000;
 a.p.x=a.A.arena.cx-20;a.m.x=a.A.arena.cx+20;a.p.y=a.m.y=a.A.arena.cy;a.p.skills=[];a.p.unspentSkillPoints=0;a.p.passives=[];
 a.w.GameAI.AIBrain.lootItem(a.p,a.G.spawnDropItem(a.p.x,a.p.y,d,d.slot));
 return {...a,d,R:a.w.GameEntities.RelicSystem};
}

test('all ten relics equip their actual slots and apply bounded stats, shields, debuffs, recovery and cooldowns',()=>{
 for(const key of Object.keys(loadGame().GameData.Equipments.relics)){
  const {w,G,p,d}=relicScenario(key),slot={weapon:'weapon',body:'armor',head:'helmet',feet:'boots'}[d.slot];assert.equal(p[slot].id,d.id);
  w.GameUI.InspectModal.inspect(p);assert.ok(w.documentText('inspect-panel').includes(d.name));assert.doesNotMatch(w.documentText('inspect-panel'),/NaN|undefined/);G.render();
 }
 const core=relicScenario('core');const lower=core.G.spawnDropItem(core.p.x,core.p.y,core.w.GameData.Equipments.armors.a_archdemon_armor,'body');assert.equal(core.w.GameAI.AIBrain.lootItem(core.p,lower),false,'never replace a relic with lower rarity while collecting remaining God loot');core.p.currentHp=core.p.maxHp*.31;
 const dmg=core.C.applyDamage(core.m,core.p,null,{baseDamage:core.p.maxHp*.15,trueDamage:true,effect:'meteor'});
 assert.equal(dmg,0);assert.equal(core.p.relicState.core.cooldown,45);assert.equal(core.R.knockbackImmune(core.p),true);
 core.C.updateStatus(core.p,4);assert.equal(core.R.knockbackImmune(core.p),false);assert.equal(core.p.relicState.core.cooldown,41);
 const blade=relicScenario('voidblade'),atk=blade.C.combatStats(blade.p).attack,def=blade.C.combatStats(blade.m).defense;
 for(let i=0;i<15;i++)blade.C.applyDamage(blade.p,blade.m,blade.p.weapon,{baseDamage:5});
 assert.equal(blade.p.relicState.voidblade.stacks,10);assert.ok(blade.C.combatStats(blade.p).attack>atk);assert.equal(blade.C.combatStats(blade.m).defense,def*.8);
 assert.equal(blade.R.tryDash(blade.p,blade.m,'counter'),true);assert.equal(blade.C.applyDamage(blade.m,blade.p,null,{baseDamage:500}),0);assert.equal(blade.R.tryDash(blade.p,blade.m,'counter'),false);
 blade.C.updateStatus(blade.p,5);blade.C.updateStatus(blade.m,5);assert.equal(blade.C.combatStats(blade.p).attack,atk);assert.equal(blade.C.combatStats(blade.m).defense,def);
 const prism=relicScenario('prism'),skill={id:'same',def:prism.w.GameData.Skills.warrior.actives[0],tier:1,cooldownTimer:0};prism.p.skills=[skill];prism.m.skills=[skill];
 assert.equal(prism.R.modifyDamage(prism.p,prism.m,100),120);assert.equal(prism.C.getSkillConfig(prism.p,skill).cooldown,prism.C.getSkillConfig({...prism.p,helmet:null},skill).cooldown*.85);
 prism.R.incoming(prism.m,prism.p,prism.p.maxHp*.25,{});assert.equal(prism.R.distract(prism.m,.1),true);assert.equal(prism.p.relicState.prism.cooldown,30);prism.C.updateStatus(prism.p,2);assert.equal(prism.R.distract(prism.m,.1),false);
 const hal=relicScenario('halberd');hal.p.currentHp=100;
 for(let i=0;i<4;i++)hal.C.applyDamage(hal.p,hal.m,hal.p.weapon,{baseDamage:10});assert.ok(hal.p.currentHp>100);assert.equal(hal.m.relicSlowTimer,2);
 for(let i=0;i<4;i++)hal.C.applyDamage(hal.p,hal.m,hal.p.weapon,{baseDamage:10});assert.equal(hal.C.pendingEffects.length,3);
 hal.m.action={released:false};for(let i=0;i<4;i++)hal.C.applyDamage(hal.p,hal.m,hal.p.weapon,{baseDamage:10});assert.equal(hal.m.action,null);assert.equal(hal.m.relicInterrupt,.2);
 for(let i=0;i<4;i++)hal.C.applyDamage(hal.p,hal.m,hal.p.weapon,{baseDamage:10});assert.equal(hal.p.speedBuff,.3);
 const jet=relicScenario('treads');assert.equal(jet.p.maxStamina,150);assert.equal(jet.w.GameEngine.MapTerrain.getMoveSpeed(jet.p),jet.p.moveSpeed*1.35);
 const stamina=jet.p.currentStamina;assert.equal(jet.C.defend(jet.p,'dodge',Math.PI/2),true);assert.equal(jet.p.currentStamina,stamina-12.6);assert.equal(Math.hypot(jet.p.action.dodgeX,jet.p.action.dodgeY),140);assert.equal(jet.p.relicTraps.length,1);jet.p.action=null;jet.p.defenseCooldown=0;jet.p.currentStamina=100;jet.A.fields=[{owner:jet.m,x:jet.p.x,y:jet.p.y,radius:50,at:jet.A.clock+.1,end:jet.A.clock+1,name:'AoE'}];assert.equal(jet.A.avoid(jet.p,.1),true);assert.equal(jet.p.action?.kind,'dodge');
 const bow=relicScenario('greatbow');bow.A.fields=[{effect:'acid',x:bow.m.x,y:bow.m.y,warningOnly:false}];bow.C.applyDamage(bow.p,bow.m,bow.p.weapon,{baseDamage:10});assert.equal(bow.A.fields.length,0);bow.C.applyDamage(bow.p,bow.m,bow.p.weapon,{baseDamage:10});assert.equal(bow.R.modifyDamage(bow.p,bow.m,100),120);
 const tome=relicScenario('tome');tome.p.skillsCast=1;const tier3={tier:3};tome.R.onCast(tome.p,tier3);tome.R.onCast(tome.p,tier3);assert.equal(tome.p.relicBolts.length,3);const hp=tome.m.currentHp;tome.C.updateStatus(tome.p,.5);assert.ok(tome.m.currentHp<hp);assert.equal(tome.p.relicBolts.length,0);
 const crown=relicScenario('crown');assert.equal(crown.R.incoming(crown.m,crown.p,100,{element:'fire'}),70);assert.equal(crown.R.control(crown.p,'stunTimer',2,crown.m),1);assert.equal(crown.R.control(crown.p,'stunTimer',2,crown.m),2);
 const nano=relicScenario('nano');nano.G.matchTime=5;nano.p.lastDamageTakenAt=0;nano.p.currentHp=100;nano.p.currentStamina=0;nano.p.despair=95;const max=nano.p.maxHp;nano.C.updateStatus(nano.p,1);assert.ok(Math.abs(nano.p.currentHp-(101+max*.015))<1e-8);assert.equal(nano.p.currentStamina,nano.p.maxStamina*.5);assert.equal(nano.p.relicState.nano.cooldown,40);
 const ring=relicScenario('ring');ring.p.currentHp=100;for(let i=0;i<50;i++)ring.C.applyDamage(ring.p,ring.m,null,{baseDamage:10});assert.equal(ring.p.relicState.ring.charge,50);const x=ring.p.x;ring.C.applyDamage(ring.p,ring.m,null,{baseDamage:10});assert.equal(ring.p.relicState.ring.charge,0);assert.ok(ring.p.currentHp>100);assert.ok(ring.p.x<x);
});


test('early God death defers world collapse until the sole survivor clears the final hunt',()=>{
 const w=loadGame(42,{openTemple:true}),G=w.GameManager,C=w.GameEntities.CombatSystem,A=w.GameEntities.AncientSystem,[p,q]=G.pawns;
 G.pawns=[p,q];C.handleDeath(p,w.GameEntities.EntityManager.worldBoss);assert.equal(A.awakened,false);assert.equal(A.arena,null);assert.ok(A.pendingGod);
 q.isAlive=false;G.checkVictoryCondition();G.continueAfterResult();A.tick(.1);assert.equal(A.awakened,false);
 for(const m of w.GameEntities.EntityManager.finalHuntMonsters)C.handleDeath(p,m);
 A.tick(20);assert.equal(A.awakened,true);assert.equal(A.boss.gauntletRound,1);assert.equal(A.pendingGod,null);assert.ok(w.GameEngine.MapTerrain.canStand(p.x,p.y));
});

test('survival counts independent attacks, ignores pulses and exempts extreme cowardice',()=>{
 const w=loadGame(),G=w.GameManager,A=w.GameAI.AIBrain,E=w.GameAI.EmotionEngine,C=w.GameEntities.CombatSystem,[p,q]=G.pawns;
 G.pawns=[p,q];G.monsters=[];p.x=1000;q.x=1040;p.y=q.y=300;p.personality={...w.GameData.PersonalityProfiles.brave};p.skills=[];p.unspentSkillPoints=0;
 G.matchTime=1;E.onDamageTaken(p,4,q,{sourceSkill:{castId:1}});E.onDamageTaken(p,4,q,{sourceSkill:{castId:1}});E.onDamageTaken(p,4,q,{dot:'burn'});assert.equal(p.pokeHistory.hits,1);
 G.matchTime=2;E.onDamageTaken(p,4,q,{actionId:1});G.matchTime=3;E.onDamageTaken(p,4,q,{actionId:2});assert.equal(p.pokeHistory.hits,3);
 q.targetEnemy=p;p.lastAttacker=q;q.moveSpeed=200;p.escapeProbe={target:q,at:-2,distance:45};
 G.spatialGrid.clear();[p,q].forEach(e=>G.spatialGrid.insert(e));A.update(p,.1,G.spatialGrid,w.GameEngine.MapTerrain);assert.equal(p.survivalTarget,q);
 p.action=null;p.fear=100;p.currentHp=10;G.matchTime=4;A.update(p,.1,G.spatialGrid,w.GameEngine.MapTerrain);assert.equal(p.targetEnemy,q);assert.equal(p.survivalTarget,q);
 const coward={...p,survivalTarget:null,personality:{...p.personality,cowardice:95}};assert.equal(E.commitSurvival(coward,q),false);
 p.survivalTarget=null;p.action=null;p.personality={...w.GameData.PersonalityProfiles.coward};p.plan=null;p.allyPawn=null;p.isClutchEscape=false;p.healthPotions=0;q.level=p.level+2;
 A.hasRetreatRoute=()=>false;let fled=false,fought=false;A.escapeThreat=()=>{fled=true;};A.engageCombat=()=>{fought=true;};A.update(p,.1,G.spatialGrid,w.GameEngine.MapTerrain);assert.equal(fled,true);assert.equal(fought,false,'extreme cowardice also bypasses the ordinary cornered counterattack path');
});

test('smoke blocks actual sight across its region but does not grant damage immunity',()=>{
 const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem,[p,q]=G.pawns;G.pawns=[p,q];G.monsters=[];p.x=1000;q.x=1140;p.y=q.y=300;
 assert.equal(C.canSee(p,q),true);C.field(p,{radius:55},1070,300,{smoke:true,life:2});assert.equal(C.canSee(p,q),false);assert.equal(C.canSee(q,p),false);
 const hp=p.currentHp;C.applyDamage(q,p,null,{baseDamage:20,skill:true});assert.ok(p.currentHp<hp);C.tickEffects(2.1);assert.equal(C.canSee(p,q),true);
});

test('changing a weapon underfoot keeps an in-flight attack snapshot and combat intent',()=>{
 const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem,A=w.GameAI.AIBrain,[p,q]=G.pawns;G.pawns=[p,q];G.monsters=[];p.x=1000;q.x=1020;p.y=q.y=300;p.critChance=0;q.currentHp=q.maxHp=10000;
 p.weapon={id:'old',type:'sword',attack:5,range:50,speed:1,tier:'common'};const damage=C.combatStats(p).attack*100/(100+C.combatStats(q).defense);assert.equal(C.executeAttack(p,q),true);
 p.plan={kind:'duel',target:q,until:100};const lease=p.combatLease,item=G.spawnDropItem(p.x,p.y,{id:'new',name:'Mạnh',type:'axe',attack:60,range:60,speed:1,tier:'supreme'});
 A.update(p,.1,G.spatialGrid,w.GameEngine.MapTerrain);assert.equal(item.isCollected,true);assert.equal(p.plan.target,q);assert.equal(p.combatLease,lease);
 C.updateStatus(p,.25);assert.ok(Math.abs(10000-q.currentHp-Math.round(damage))<=1);assert.equal(p.weapon.id,'new');
});

test('God countdown uses simulation time, survives early death and is reset exactly once',()=>{
 const w=loadGame(42,{openTemple:true}),G=w.GameManager,A=w.GameEntities.AncientSystem,C=w.GameEntities.CombatSystem,p=G.pawns[0];G.pawns.forEach(q=>q.isAlive=q===p);p.level=15;G.winnerPawn=p;G.battleRoyaleResolved=true;
 C.handleDeath(p,w.GameEntities.EntityManager.worldBoss);C.handleDeath(p,w.GameEntities.EntityManager.worldBoss);assert.equal(A.wakeRemaining,20);assert.equal(A.arena,null);
 G.isPaused=true;G.update(10);assert.equal(A.wakeRemaining,20);G.isPaused=false;A.tick(19.99);assert.equal(A.boss,null);A.tick(.02);assert.equal(A.awakened,true);assert.equal(A.boss.gauntletRound,1);
 A.reset();assert.equal(A.wakeRemaining,null);assert.equal(A.pendingGod,null);
});

test('Ancient hunt survives lost sight without reading hidden coordinates',()=>{
 const a=ancientScenario('colossus'),B=a.w.GameAI.BossBrain,M=a.w.GameEngine.MapTerrain;a.m.skills.forEach(s=>s.cooldownTimer=100);a.m.attackCooldown=100;
 B.update(a.m,[a.p],.1);const intel={...a.m.huntIntel};a.p.stealthTimer=5;a.p.x+=400;const before={x:a.m.x,y:a.m.y};
 B.update(a.m,[],.1);assert.equal(a.m.huntTarget,a.p);assert.equal(a.m.targetEnemy,a.p);assert.deepEqual({...a.m.huntIntel},intel);assert.ok(Math.hypot(a.m.x-before.x,a.m.y-before.y)>0);assert.ok(M.canStand(a.m.x,a.m.y));
});

test('monster tactics cover all 42 actives, are bounded, and cages leave physical exits',()=>{
 const w=loadGame(42,{openTemple:true}),C=w.GameEntities.CombatSystem,G=w.GameManager,M=w.GameEngine.MapTerrain,p=G.pawns[0];let count=0;
 for(const defs of Object.values(w.GameData.Monsters))for(const d of defs)for(const def of d.skills||[]){const m=w.GameEntities.EntityManager.spawnMonster(d,1000,300),s=C.makeMonsterSkill(def,d.tier,0),c=C.getSkillConfig(m,s);assert.ok(c.monsterEffect,def.id);assert.ok(c.damage<=C.combatStats(m).attack*2.1);assert.ok(c.windup>=.6);count++;}
 assert.equal(count,42);const m=G.monsters.find(m=>m.skills.some(s=>s.id==='bone_cage'))||w.GameEntities.EntityManager.spawnMonster(w.GameData.Monsters.generals.find(m=>m.id==='lich_acolyte'),1000,300);
 m.x=1000;m.y=300;p.x=1100;p.y=300;const s=m.skills.find(s=>s.id==='bone_cage'),c={...C.getSkillConfig(m,s),originX:1000,originY:300,tx:1100,ty:300,angle:0};C.resolveSkill(m,s,p,c);
 assert.equal(C.fields.filter(f=>f.wall).length,2);assert.equal(M.canStand(1045,300),false);assert.equal(M.canStand(1100,350),true);C.tickEffects(2.1);assert.equal(M.canStand(1045,300),true);
});

test('navigation escapes a congested route and keeps its strategic destination',()=>{
 const w=loadGame(),G=w.GameManager,M=w.GameEngine.MapTerrain,C=w.GameEntities.CombatSystem,p=G.pawns[0];G.pawns=[p];G.monsters=[];p.x=1000;p.y=300;p.flankSide=1;
 const move=M.moveEntity;let calls=0;M.moveEntity=function(e,dx,dy){calls++;if(!e.navDetour){e.moveBlockReason='crowd';e.blockingCenter={x:1050,y:300};return 0;}return move.call(this,e,dx,dy);};
 const plan=p.plan={kind:'farm',target:{id:'goal'},until:100};for(let i=0;i<12;i++){G.matchTime+=.1;M.navigate(p,1300,300,.1);}
 assert.ok(Math.hypot(p.x-1000,p.y-300)>30);assert.equal(p.plan,plan);assert.ok(calls>1);M.moveEntity=move;
});


test('a swimming bot escapes low progress at the river and restricted lair boundary',()=>{
 const w=loadGame(),G=w.GameManager,M=w.GameEngine.MapTerrain,p=G.pawns[0];G.pawns=[p];G.monsters=[];Object.assign(p,{x:3868.1466,y:3699.999,level:8,moveSpeed:95});
 assert.equal(M.isInWater(p.x,p.y),true);for(let i=0;i<60;i++){G.matchTime+=.1;M.navigate(p,i%3===0?4065.8:4766.7,i%3===0?3751:3900,.1);}
 assert.ok(Math.hypot(p.x-3868.1466,p.y-3699.999)>30,'must leave the repeated short-step loop');assert.ok(p.navRecoveries>0);assert.ok(M.canStand(p.x,p.y));
});

test('progression passives open at three and spend shared points without granting a full level-15 build',()=>{
 const w=loadGame(),p=w.GameManager.pawns[0],A=w.GameAI.AIBrain;p.level=3;p.skills=[];p.passives=[];p.unspentSkillPoints=30;A.handleLevelingAndSkills(p);
 assert.equal(p.passives.reduce((n,s)=>n+s.tier,0)+p.skills.reduce((n,s)=>n+s.tier,0),31);assert.equal(w.GameData.EndgamePassives.length,18);assert.ok(p.passives.every(s=>s.id&&s.tier<=3));
 const count=p.passives.length;p.level=15;p.unspentSkillPoints=0;A.handleLevelingAndSkills(p);assert.equal(p.passives.length,count);
});
test('Blood Body heals in real combat, crosses once, ignores lethal hits and stops outside combat',()=>{
 const w=loadGame(9,{openTemple:true}),G=w.GameManager,C=w.GameEntities.CombatSystem,[p,q]=G.pawns;G.pawns=[p,q];G.monsters=[];Object.assign(p,{x:2600,y:2600,maxHp:1000,currentHp:410,defense:0});Object.assign(q,{x:2640,y:2600});p.passives=[C.makePassive(w.GameData.EndgamePassives.find(d=>d.id==='p_blood_body'))];p.passives[0].tier=3;p.lastHostileAt=0;G.matchTime=0;
 C.updateStatus(p,1);assert.equal(p.currentHp,421);C.applyDamage(q,p,null,{baseDamage:80,trueDamage:true});assert.equal(p.progression.bloodRemaining,3);assert.equal(p.passives[0].cooldownTimer,60);
 const hp=p.currentHp;C.updateStatus(p,1);assert.equal(p.currentHp,hp+91);C.applyDamage(q,p,null,{baseDamage:50,trueDamage:true});assert.equal(p.progression.bloodRemaining,2);
 G.matchTime=20;C.updateStatus(p,1);assert.equal(p.progression.bloodRemaining,0);p.currentHp=1;C.applyDamage(q,p,null,{baseDamage:100,trueDamage:true});assert.equal(p.isAlive,false);
});
test('each Ancient has distinct bounded phase HP and stronger phase-two attacks',()=>{
 for(const kind of ['colossus','mirror','void','chaos','mecha']){const {m,p,C,A}=ancientScenario(kind),atk=m.attack;assert.ok(m.maxHp>=450&&m.maxHp<=650);m.currentHp=0;C.handleDeath(p,m);assert.equal(m.phase,2);assert.ok(m.maxHp>=1350&&m.maxHp<=1700);assert.equal(m.currentHp,m.maxHp);assert.ok(m.attack>atk);assert.ok(m.defense<m.profile.def);}
});
test('visible potion is sought outside combat, collected and consumed for healing',()=>{
 const w=loadGame(12),G=w.GameManager,A=w.GameAI.AIBrain,M=w.GameEngine.MapTerrain,p=G.pawns[0];G.pawns=[p];G.monsters=[];Object.assign(p,{x:1000,y:300,currentHp:p.maxHp*.6,healthPotions:0});const item=G.spawnDropItem(1060,300,w.GameEntities.CombatSystem.potion,'potion');G.spatialGrid.clear();[p,item].forEach(e=>G.spatialGrid.insert(e));A.update(p,.1,G.spatialGrid,M);assert.match(p.objective,/bình máu/);p.x=item.x;p.y=item.y;A.update(p,.1,G.spatialGrid,M);assert.equal(item.isCollected,true);assert.equal(p.action?.kind,'drink');const hp=p.currentHp;w.GameEntities.CombatSystem.updateStatus(p,1);assert.ok(p.currentHp>hp);
});

test('split boss redirects survival commitments to a visible living clone',()=>{
 const {w,G,A,C,p,m}=ancientScenario('mirror');p.survivalTarget=p.finalDuel=m;A.split(m,p);G.spatialGrid.clear();[p,...m.clones].forEach(e=>G.spatialGrid.insert(e));w.GameAI.AIBrain.update(p,.1,G.spatialGrid,w.GameEngine.MapTerrain);assert.ok(m.clones.includes(p.survivalTarget));assert.notEqual(p.finalDuel,m);
});
test('mecha overheat opens a recovery window after three casts and the exposed core is interruptible',()=>{
 const {A,C,p,m}=ancientScenario('mecha');m.phase=2;const s=m.skills[0];for(let i=0;i<3;i++){m.action=null;m.attackState=null;m.globalSkillCooldown=0;s.cooldownTimer=0;assert.equal(C.castSkill(m,s,p),true);}assert.ok(m.ventUntil>A.clock);m.action=null;m.globalSkillCooldown=0;s.cooldownTimer=0;assert.equal(C.castSkill(m,s,p),false);A.clock=m.ventUntil;assert.equal(C.castSkill(m,s,p),true);
});

test('forming an alliance clears stale survival targets and never stalls against its own ally',()=>{
 const w=loadGame(),G=w.GameManager,C=w.GameEntities.CombatSystem,A=w.GameAI.AIBrain,[p,q,t]=G.pawns;G.pawns=[p,q,t];G.monsters=[];p.allyPawn=q;q.allyPawn=p;p.survivalTarget=p.finalDuel=q;p.pactTarget=t;p.x=1000;q.x=1020;t.x=1100;p.y=q.y=t.y=300;G.spatialGrid.clear();[p,q,t].forEach(e=>G.spatialGrid.insert(e));A.update(p,.1,G.spatialGrid,w.GameEngine.MapTerrain);assert.notEqual(p.survivalTarget,q);assert.equal(w.GameAI.EmotionEngine.commitSurvival(p,q),false);
});

test('species catalogue uses explicit identities including the final rhino, and zero-damage zones actually slow',()=>{
 const w=loadGame(42,{openTemple:true}),C=w.GameEntities.CombatSystem,G=w.GameManager;let count=0;for(const d of [...Object.values(w.GameData.Monsters).flat(),w.GameData.FinalLord])for(const p of d.passives||[]){assert.equal(p.type,'species');assert.ok(p.id);count++;}assert.equal(count,45);const [p,q]=G.pawns;G.pawns=[p,q];G.monsters=[];p.x=2600;q.x=2640;p.y=q.y=2600;G.spatialGrid.clear();[p,q].forEach(e=>G.spatialGrid.insert(e));C.field(p,{radius:60},q.x,q.y,{slow:.3,damage:0,life:2});C.tickFields(.1);assert.ok(q.slowTimer>0);assert.equal(q.slowPct,.3);
});

test('phase-two acid consumes only a snapshot of live puddles and cannot recursively spawn fields',()=>{const {A,m,p}=ancientScenario('void');m.phase=2;const c=A.config(m,m.skills.find(s=>s.id==='av_acid'));A.field(m,c,p.x,p.y,0,{end:A.clock+3});A.resolve(m,c,p,{x:p.x,y:p.y},0);assert.ok(A.fields.length<=3);assert.ok(A.fields.some(f=>f.effect==='acid_pull'));});

test('all eighteen passives retain three ranks, explicit cooldowns and independent direct-hit tokens',()=>{
 const w=loadGame(42,{openTemple:true}),G=w.GameManager,C=w.GameEntities.CombatSystem,[p,q]=G.pawns;G.pawns=[p,q];G.monsters=[];p.x=2600;q.x=2640;p.y=q.y=2600;G.matchTime=10;
 for(const d of w.GameData.EndgamePassives)for(let rank=1;rank<=3;rank++){const passive=C.makePassive(d);passive.tier=rank;p.passives=[passive];p.progression={};assert.equal(d.ranks.length,3);assert.ok(d.ranks[rank-1].desc);assert.ok(d.cooldown>=12);C.progressionEvent(p,q,'strike',{actionId:1,damage:20});C.progressionEvent(p,q,'strike',{actionId:1,damage:20});assert.equal(p.progression.combo,1);C.progressionEvent(p,q,'strike',{actionId:2,damage:20});assert.equal(p.progression.combo,2);C.tickProgression(p,.1);assert.ok(Number.isFinite(p.currentHp));}
});


test('rank-three effects consume charges, move attacks and respect directional armor and aura budgets',()=>{
 const w=loadGame(42,{openTemple:true}),G=w.GameManager,C=w.GameEntities.CombatSystem,M=w.GameEngine.MapTerrain,[p,q]=G.pawns;G.pawns=[p,q];G.monsters=[];Object.assign(p,{x:2600,y:2600,attack:20,critChance:0,skills:[],passives:[],currentStamina:100});Object.assign(q,{x:2640,y:2600,maxHp:1000,currentHp:1000,defense:100,critChance:0,passives:[]});G.matchTime=10;G.spatialGrid.clear();[p,q].forEach(e=>G.spatialGrid.insert(e));
 q.armorBreak=.5;q.armorBreakTimer=3;q.crackOwner=p;q.crackAngle=Math.PI;assert.equal(C.combatStats(q,p).defense,50);p.x=2680;assert.equal(C.combatStats(q,p).defense,100);p.x=2600;
 p.weaponBuffTimer=4;p.magicOnHit=8;p.enchantedCharges=3;p.enchantedRank=3;p.enchantedElement='ice';for(let id=1;id<=3;id++){C.applyDamage(p,q,null,{baseDamage:10,sourceSkill:{castId:id}});C.applyDamage(p,q,null,{baseDamage:10,sourceSkill:{castId:id}});}assert.equal(p.enchantedCharges,0);assert.ok(C.fields.some(f=>f.owner===p&&f.slow));
 q.currentHp=300;q.healingAura=C.field(q,{radius:100},q.x,q.y,{heal:20,life:3,convertible:true});const hp=q.currentHp;C.applyDamage(p,q,null,{baseDamage:30,trueDamage:true});assert.equal(q.healingAura.life,0);assert.equal(q.currentHp,hp);
 p.weapon={type:'bow',range:130,speed:1};p.action=null;p.attackCooldown=0;p.movingShotReady=true;p.speedBuffTimer=3;const y=p.y;assert.equal(C.executeAttack(p,q),true);C.updateStatus(p,.1);assert.ok(p.y!==y);assert.equal(p.movingShotReady,false);assert.ok(M.canStand(p.x,p.y));
});


test('Phoenix egg allows one rebirth, can be destroyed and delays the God countdown until true death',()=>{
 for(const destroy of [false,true]){const w=loadGame(3,{openTemple:true}),G=w.GameManager,C=w.GameEntities.CombatSystem,p=G.pawns[0],m=w.GameEntities.EntityManager.spawnMonster({...Object.values(w.GameData.Monsters).flat().find(d=>d.id==='eternal_solar_phoenix')},2600,2600);G.pawns=[p];G.monsters=[m];Object.assign(p,{x:2640,y:2600});w.GameEntities.EntityManager.worldBoss=m;m.currentHp=0;C.handleDeath(p,m);assert.equal(m.isAlive,true);assert.ok(m.phoenixEgg);assert.equal(G.ancientCountdown,undefined);
 if(destroy){C.applyDamage(p,m,null,{baseDamage:100,trueDamage:true});assert.equal(m.isAlive,false);}else{G.matchTime=4;C.tickSpecies(m,.1);assert.equal(m.phoenixEgg,null);assert.equal(m.currentHp,m.maxHp*.3);m.currentHp=0;C.handleDeath(p,m);assert.equal(m.isAlive,false);}
 }
});


test('momentum reacts to real interruptions and pattern reading waits for the third observed action',()=>{
 const w=loadGame(),C=w.GameEntities.CombatSystem,G=w.GameManager,[p,q]=G.pawns;G.matchTime=10;p.passives=[C.makePassive(w.GameData.EndgamePassives.find(d=>d.id==='p_turning_momentum'))];p.passives[0].tier=3;p.progression={};C.progressionEvent(p,q,'opening');assert.equal(p.passives[0].cooldownTimer,0);q.action={id:1,kind:'skill',castId:8,released:false};assert.equal(C.interruptChannel(p,q),true);assert.equal(q.action,null);assert.equal(q.cancelledCastId,8);assert.ok(p.progression.strideUntil>10);
 p.passives=[C.makePassive(w.GameData.EndgamePassives.find(d=>d.id==='p_pattern_reading'))];p.progression={};for(let i=1;i<=3;i++){q.action={id:i,kind:'skill',skillId:'m_fireball',released:false};C.progressionEvent(p,q,'observed');assert.equal(p.passives[0].cooldownTimer>0,i===3);}
});

test('weaponArt draws every weapon and relic at every tier, each id has a distinct look',()=>{
 const w=loadGame(),G=w.GameManager,WA=w.GameRenderer.WeaponAnimations,A=w.GameRenderer.WeaponArt,E=w.GameData.Equipments;
 const all=[...Object.values(E.weapons),...Object.values(E.relics).filter(r=>r.slot==='weapon')],seen=new Set();
 for(const def of all){
  for(const tier of A.TIERS)for(const fx of [undefined,{time:2,sw:.5,fade:1}])WA.drawWeapon(G.ctx,{...def,tier},def.type==='bow'?9:0,fx);
  const sig=WA.weaponType(def)+JSON.stringify(A.lookOf(def,WA.weaponType(def)));
  assert.ok(!seen.has(sig),'duplicate look '+def.id);seen.add(sig);
 }
 for(const type of ['hammer','crossbow','sword','tome'])for(const id of 'abcdefgh')WA.drawWeapon(G.ctx,{id:type+id,type,tier:'god'});
 assert.ok(all.length>=27);
});
