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


if(process.argv[2]?.includes(',')){
 const seeds=process.argv[2].split(',').map(Number),{spawn}=require('node:child_process');
 async function worker(){while(seeds.length){const seed=seeds.shift();await new Promise((resolve,reject)=>{const child=spawn('rtk',['proxy','node',__filename,String(seed)],{stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code?reject(new Error('seed '+seed+' failed: '+code)):resolve());});}}
 Promise.all([worker(),worker()]).catch(e=>{console.error(e);process.exitCode=1;});
}else{

const {createHash}=require('node:crypto'),entry=fs.readFileSync(path.resolve(__dirname,'../js/main.js'),'utf8'),fingerprint=createHash('sha256').update([...entry.matchAll(/import '(.*?)';/g)].map(m=>fs.readFileSync(path.resolve(__dirname,'../js',m[1]),'utf8')).join('')).digest('hex');
const seed=Number(process.argv[2]||42),w=loadGame(seed),G=w.GameManager,C=w.GameEntities.CombatSystem;
const history=new Map(),suspects=[],times=[],transitions=new Map();let peakDrops=0,ticks=0,largestGroup=0,invalidGroups=[];
for(;ticks<27000&&!G.battleRoyaleResolved;ticks++){
 G.matchTime+=.1;const before=performance.now();G.update(.1);if(ticks%10===0)times.push(performance.now()-before);peakDrops=Math.max(peakDrops,G.dropItems.length);
 if(ticks%1000===0)console.log('seed='+seed+' time='+G.matchTime.toFixed(0)+' alive='+G.pawns.filter(p=>p.isAlive).length+' candidates='+suspects.length);
 if(ticks%5)continue;
 for(const p of G.pawns){if(!p.isAlive)continue;
  for(const k of ['x','y','currentHp','currentMana','currentStamina'])assert.ok(Number.isFinite(p[k]),p.id+'.'+k);
  const intent=p.combatLoot?'loot:'+p.combatLoot.item.id:p.survivalTarget?'survival:'+p.survivalTarget.id:p.plan?p.plan.kind+':'+p.plan.target?.id:p.targetEnemy?'fight:'+p.targetEnemy.id:'roam';
  const h=history.get(p.id)||[];h.push({t:G.matchTime,x:p.x,y:p.y,intent,mode:p.tactic?.mode,action:!!p.action,stun:p.stunTimer>0,goal:p.navGoal?Math.hypot(p.x-p.navGoal.x,p.y-p.navGoal.y):0,move:Math.hypot(p.vx||0,p.vy||0),blocked:p.moveBlockReason,objective:p.objective});while(h.length>9)h.shift();history.set(p.id,h);
  if(h.length<9)continue;const travel=Math.max(...h.map(v=>Math.hypot(v.x-h[0].x,v.y-h[0].y))),swaps=h.slice(1).filter((v,i)=>v.intent!==h[i].intent).length;
  const moving=h.filter(v=>!v.action&&!v.stun&&v.goal>40&&v.move>30&&v.blocked!=='crowd').length;
  if(travel<15&&(swaps>=5||moving>=7)&&!suspects.some(v=>v.id===p.id&&G.matchTime-v.t<10))suspects.push({id:p.id,t:+G.matchTime.toFixed(1),travel:+travel.toFixed(1),swaps,moving,blocked:p.moveBlockReason,detour:p.navDetour,level:p.level,objective:p.objective,goal:p.navGoal,plan:p.plan?.kind,target:p.targetEnemy?.id,x:p.x,y:p.y,samples:h.map(v=>({...v}))});
 }
 if(ticks%20===0)for(const p of G.pawns.filter(p=>p.isAlive)){assert.ok(C.validMembers(C.crowdAt(p,p.x,p.y)),p.id+' overcrowded');const active=C.groupMembers(p).filter(q=>q.isAlive&&q.combatLease>0);largestGroup=Math.max(largestGroup,active.length);if(p.combatLease>0&&!C.validMembers(new Set(active))&&!invalidGroups.some(g=>G.matchTime-g.t<2))invalidGroups.push({t:G.matchTime,members:active.map(q=>({id:q.id,x:q.x,y:q.y,ally:q.allyPawn?.id,lease:q.combatLease,action:q.action?.kind,target:q.action?.target?.id}))});}
}
times.sort((a,b)=>a-b);const report={seed,fingerprint,finished:G.battleRoyaleResolved,simulatedSeconds:+G.matchTime.toFixed(1),survivors:G.pawns.filter(p=>p.isAlive).map(p=>({id:p.id,level:p.level,hp:p.currentHp,objective:p.objective,x:p.x,y:p.y})),ticks,peakDrops,largestGroup,p95Ms:times[Math.floor(times.length*.95)],invalidGroups,suspects};
fs.writeFileSync(path.resolve(__dirname,'../reports/match-rework-'+seed+'.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,suspects:suspects.slice(0,5),suspectCount:suspects.length}));
assert.equal(invalidGroups.length,0,'encounter cap violation');assert.equal(report.finished,true,'no survivor after 45 simulated minutes');

}
