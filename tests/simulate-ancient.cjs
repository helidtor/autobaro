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


const reports=[];
for(let run=0;run<10;run++){
 const w=loadGame(71+run,{openTemple:true}),G=w.GameManager,C=w.GameEntities.CombatSystem,E=w.GameEntities.EntityManager,A=w.GameEntities.AncientSystem,p=G.pawns[0],god=E.worldBoss;
 G.pawns.forEach(q=>q.isAlive=q===p);G.pawns=[p];G.winnerPawn=p;G.battleRoyaleResolved=true;G.isPaused=false;G.resultOpen=false;
 for(let i=1;i<15+(run%2)*5;i++)C.grantLevel(p);p.healthPotions=3;p.personality={...w.GameData.PersonalityProfiles[run%2?'brave':'wise']};
 const pos=w.GameEngine.MapTerrain.nearestFree(god.x-45,god.y);Object.assign(p,pos);C.handleDeath(p,god);if(god.phoenixEgg)C.applyDamage(p,god,null,{baseDamage:100,trueDamage:true});G.monsters.forEach(m=>m.isAlive=false);
 const kind=w.GameData.AncientBosses[run%5].kind,originalRandom=w.__math.random;w.__math.random=()=> (run%5+.1)/5;
 let ticks=0,stalls=0,last={x:p.x,y:p.y,t:0},maxFields=0;const history=[];const stallDetails=[];const modes=new Set();
 for(;ticks<9000&&!G.isGameOver;ticks++){
  G.matchTime+=.1;G.update(.1);if(A.awakened&&w.__math.random!==originalRandom)w.__math.random=originalRandom;
  if(G.isPaused&&!G.isGameOver){G.resultOpen=false;G.isPaused=false;}
  maxFields=Math.max(maxFields,A.fields.length+C.fields.length);modes.add(p.combatTactic||p.objective);
  if(ticks%5===0){history.push({x:p.x,y:p.y,action:!!p.action,stun:p.stunTimer>0,move:Math.hypot(p.vx||0,p.vy||0),goal:p.navGoal?Math.hypot(p.x-p.navGoal.x,p.y-p.navGoal.y):0});if(history.length>9)history.shift();if(history.length===9){const travel=Math.max(...history.map(v=>Math.hypot(v.x-history[0].x,v.y-history[0].y))),moving=history.filter(v=>!v.action&&!v.stun&&v.move>30&&v.goal>40).length;if(travel<15&&moving>=7&&(!stallDetails.length||G.matchTime-stallDetails.at(-1).t>10)){stalls++;stallDetails.push({t:G.matchTime,travel,moving,objective:p.objective,goal:p.navGoal});}}}
  assert.ok(Number.isFinite(p.currentHp));if(A.arena)assert.ok(w.GameEngine.MapTerrain.canStand(p.x,p.y),'bot out of arena or inside wall');
 }
 reports.push({run,first:kind,startLevel:15+(run%2)*5,seconds:+G.matchTime.toFixed(1),botAlive:p.isAlive,defeated:A.defeated,boss:A.boss?.ancientKind,phase:A.boss?.phase,bossHp:A.boss?.currentHp,botHp:p.currentHp,weapon:p.weapon?.id,armor:p.armor?.id,level:p.level,skills:p.skillsCast,shield:A.boss?.shield,stalls,stallDetails,maxFields,decisionKinds:modes.size});
 console.log(JSON.stringify(reports.at(-1)));
}
fs.writeFileSync(path.resolve(__dirname,'../reports/ancient-rework-loadouts.json'),JSON.stringify(reports,null,2));
