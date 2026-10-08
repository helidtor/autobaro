const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Loads only data + renderer scripts needed for VFX (no match simulation); counts Math.random calls.
function loadVfx() {
  let randomCalls = 0;
  const math = Object.create(Math);
  math.random = () => { randomCalls++; return 0.5; };
  const context = { window: {}, document: { readyState: 'loading' }, Math: math, performance, console };
  context.window.window = context.window;
  vm.createContext(context);
  const root = path.resolve(__dirname, '..');
  for (const f of ['data/monstersData.js', 'data/skillsData.js', 'data/ancientBossesData.js', 'renderer/vfxRecipes.js', 'renderer/vfxManager.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8'), context, { filename: f });
  }
  context.window.GameManager = { matchTime: 3 };
  context.window.GameEntities = { AncientSystem: { boss: null } };
  return { w: context.window, randomCalls: () => randomCalls };
}

// Strict stub: rejects NaN/Infinity arguments, negative radii and calls on a missing path.
function strictCtx() {
  const calls = { n: 0 }, state = {};
  const bad = (name, args) => {
    for (const a of args) if (typeof a === 'number' && !Number.isFinite(a)) throw new Error(`non-finite argument to ${name}(${args})`);
    if (name === 'arc' && args[2] < 0) throw new Error('negative arc radius ' + args[2]);
    if (name === 'createRadialGradient' && (args[2] < 0 || args[5] < 0)) throw new Error('negative gradient radius');
    if (name === 'ellipse' && (args[2] < 0 || args[3] < 0)) throw new Error('negative ellipse radius');
  };
  return new Proxy(state, {
    get(t, k) {
      if (k === '__calls') return calls;
      if (k in t) return t[k];
      return (...a) => { calls.n++; bad(String(k), a); return { addColorStop() {} }; };
    },
    set(t, k, v) { if (typeof v === 'number' && !Number.isFinite(v)) throw new Error('non-finite ' + String(k)); t[k] = v; return true; }
  });
}

const SHAPES = [{}, { shape: 'line', length: 200, halfW: 20 }, { shape: 'cone', length: 90, arc: .75 }, { shape: 'cone', length: 180, arc: Math.PI / 2, inner: 20 }];

test('every bot skill id has its own VFX recipe (plus fallbacks for kinds, monster modes, ancient effects)', () => {
  const { w } = loadVfx(), R = w.GameRenderer.VfxRecipes.R;
  const ids = Object.values(w.GameData.Skills).flatMap(g => g.actives.map(s => s.id));
  assert.ok(ids.length >= 32 && new Set(ids).size === ids.length);
  const missing = ids.filter(id => !R[id] || !(R[id].exec || R[id].zone));
  assert.deepEqual(missing, []);
  // Legacy kinds keep a documented fallback recipe.
  for (const k of ['telegraph', 'slash', 'guard', 'dash', 'heal', 'rune', 'smoke', 'flame', 'frost', 'impact', 'hit']) assert.ok(R['k:' + k], k);
  // Every monster tactic mode and ancient effect resolves to a recipe (or the documented mon:default fallback).
  const modes = new Set(Object.values(w.GameData.MonsterTactics).map(t => t[0]));
  for (const m of modes) assert.ok(R['mon:' + m] || R['mon:default'], m);
  const effects = new Set(w.GameData.AncientBosses.flatMap(b => b.skills.map(s => s.effect)));
  assert.deepEqual([...effects].filter(e => !R['anc:' + e]), []);
});

test('drawEffect never throws for any recipe, phase, tier and shape on a stub ctx', () => {
  const { w } = loadVfx(), V = w.GameRenderer.VfxManager, R = w.GameRenderer.VfxRecipes.R;
  V.init();
  let drawn = 0;
  for (const key of Object.keys(R)) {
    for (const tier of [1, 2, 3]) for (const shape of SHAPES) for (const ph of ['tele', 'exec', 'after', 'zone']) for (const p of [0, .3, .99]) {
      const e = V.addEffect(key.startsWith('k:') ? key.slice(2) : 'rune', 100, 100, { fx: key, anc: undefined, tier, ph: ph === 'zone' ? 'exec' : ph, radius: 60, angle: .7, tx: 160, ty: 130, color: '#ff9b48', life: 1, ...shape });
      e.rec = R[key]; e.life = e.maxLife * (1 - p);
      const ctx = strictCtx();
      V.drawEffect(ctx, e); drawn += ctx.__calls.n > 0 || ph === 'zone' || ph === 'after' || !R[key][ph] ? 1 : 0;
    }
    V.effects.length = 0;
  }
  assert.ok(drawn > 1000);
});

test('persistent fields, ancient fields, walls and projectiles draw for every recipe on a stub ctx', () => {
  const { w } = loadVfx(), V = w.GameRenderer.VfxManager, R = w.GameRenderer.VfxRecipes;
  V.init();
  const owner = { x: 0, y: 0, ancientKind: 'mecha', ancientDef: { color: '#ff695f' } }, target = { x: 80, y: 20 };
  for (const key of Object.keys(R.R)) for (const shape of ['circle', 'line', 'cone']) {
    const mode = key.startsWith('mon:') ? key.slice(4) : undefined, anc = key.startsWith('anc:') ? key.slice(4) : undefined;
    for (const delay of [.6, 0]) {
      const f = { owner, target, x: 50, y: 50, radius: 55, length: 150, angle: .4, shape, life: 2.5, maxLife: 3, delay, delay0: .6, fx: mode || anc ? undefined : key, ftype: mode, mon: !!mode, el: 'fire', color: '#ff984d', tint: '#c0392b', smoke: key === 'as_smoke_bomb', heal: key === 'h_healing_aura', pull: key === 'm_gravity_vortex' };
      V.drawField(strictCtx(), f);
      if (anc) V.drawAncientField(strictCtx(), { owner, x: 50, y: 50, radius: 55, length: 150, angle: .4, shape, at: 1, end: 4, effect: anc, arc: Math.PI / 2, innerRadius: 25 }, 2);
    }
  }
  V.drawAncientField(strictCtx(), { owner, x: 5, y: 5, radius: 20, at: 1, end: 3, speed: 100, homing: target, x: 9, y: 9 }, 2);
  V.drawAncientField(strictCtx(), { owner: { ...owner, ancientKind: 'chaos' }, x: 5, y: 5, radius: 20, at: 1, end: 3, speed: 100, homing: null }, 2);
  V.drawWall(strictCtx(), { x: 10, y: 10, w: 32, h: 32, end: 5 }, 1);
  for (const key of Object.keys(R.PROJ)) {
    V.addProjectile({ x: 0, y: 0 }, 100, 0, 330, { skillId: key, type: key, color: '#bba3ff' }, null);
  }
  V.addProjectile({ x: 0, y: 0 }, 100, 0, 330, null, null);
  V.render(strictCtx(), 2);
});

test('visual randomness never touches Math.random; pools and caps hold', () => {
  const { w, randomCalls } = loadVfx(), V = w.GameRenderer.VfxManager;
  V.init();
  V.addDamageNumber(1, 2, 30);
  V.addEmotionMote({ isAlive: true, x: 0, y: 0 }, '!', '#fff');
  V.addBurstParticles(0, 0, '#fff', 20);
  for (let i = 0; i < 400; i++) V.addEffect('slash', i, i, { life: 5 });
  for (let i = 0; i < 90; i++) V.addProjectile({ x: 0, y: 0 }, 50, 0, 100, { type: 'bow' }, null);
  for (let i = 0; i < 40; i++) V.addBurstParticles(0, 0, '#fff', 30);
  V.render(strictCtx(), 1);
  assert.equal(randomCalls(), 0);
  assert.ok(V.effects.length <= 140 && V.projectiles.length <= 80 && V.particles.length <= 500);
  // Same seed sequence -> same drawn output (deterministic visuals).
  const sig = () => { V.init(); const e = V.addEffect('slash', 0, 0, { fx: 'w_thunder_slash', radius: 50, life: 1 }); const ctx = strictCtx(); e.life = .5; V.drawEffect(ctx, e); return ctx.__calls.n; };
  assert.equal(sig(), sig());
});
