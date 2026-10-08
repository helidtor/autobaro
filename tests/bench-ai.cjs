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
    vm.runInContext(sourceOverrides[path.relative(root,filename).split(path.sep).join('/')]||fs.readFileSync(filename, 'utf8'), context, { filename });
  }
  context.window.__math=math;context.window.documentText=id=>elements.get(id)?.innerHTML || "";
  context.window.GameManager.init();
  if(openTemple)context.window.GameManager.monsters.filter(m=>m.tier===4).forEach(m=>m.isAlive=false);
  return context.window;
}


const baseline=process.argv[2]?JSON.parse(fs.readFileSync(process.argv[2],'utf8')):null,report=[];let sourceOverrides={};
for(let sample=0;sample<(baseline?6:3);sample++){
 sourceOverrides=baseline&&sample%2===0?baseline:{};
 const w=loadGame(42),G=w.GameManager,times=[];
 for(let i=0;i<120;i++){G.matchTime+=.1;const start=performance.now();G.update(.1);if(i>=10)times.push(performance.now()-start);}
 times.sort((a,b)=>a-b);report.push({sample,baseline:!!baseline&&sample%2===0,p50:times[Math.floor(times.length*.5)],p95:times[Math.floor(times.length*.95)],alive:G.pawns.filter(p=>p.isAlive).length});
}
fs.writeFileSync(path.resolve(__dirname,'../reports/performance-rework.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
