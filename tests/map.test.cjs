const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Same tiny DOM/Canvas stub as game.test.cjs; counts offscreen canvases so cache behaviour is observable.
function loadGame(seed = 42) {
  const elements = new Map(); const stats = { canvases: 0, drawImage: 0 };
  const ctx = new Proxy({}, { get: (target, key) => key === 'drawImage' ? () => { stats.drawImage++; } : target[key] || (() => ({ addColorStop() {} })) });
  ctx.arc = (x, y, radius) => assert.ok(radius >= 0, 'Canvas arc radius must not be negative');
  const element = () => ({ style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, appendChild() {}, getContext: () => ctx });
  const math = Object.create(Math);
  math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  const document = { readyState: 'loading', createElement: tag => { if (tag === 'canvas') stats.canvases++; return element(); }, querySelectorAll: () => [],
    getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); } };
  const context = { window: { addEventListener() {}, innerWidth: 1366, innerHeight: 768 }, document, Math: math, performance, requestAnimationFrame() {}, console };
  vm.createContext(context);
  const root = path.resolve(__dirname, '..');
  const entry = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');
  for (const [, relative] of entry.matchAll(/import '(.*?)';/g)) {
    const filename = path.join(root, 'js', relative);
    vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
  }
  context.window.GameManager.init();
  return { w: context.window, ctx, stats };
}

/** 4-connected flood fill over free nav cells. blocked(i) may add extra walls (e.g. water). */
function flood(M, start, blocked = () => false) {
  const seen = new Uint8Array(M.cols * M.rows), stack = [start]; seen[start] = 1;
  while (stack.length) {
    const i = stack.pop(), x = i % M.cols, y = (i / M.cols) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= M.cols || ny >= M.rows) continue;
      const j = ny * M.cols + nx; if (!seen[j] && !M.navBlocked[j] && !blocked(j)) { seen[j] = 1; stack.push(j); }
    }
  }
  return seen;
}
const cellOf = (M, x, y) => Math.floor(y / M.cell) * M.cols + Math.floor(x / M.cell);
// Nearest free nav cell by pure grid search (closestCell also applies the temple lock, which we do not want here).
const freeNear = (M, x, y) => {
  const cx = Math.floor(x / M.cell), cy = Math.floor(y / M.cell);
  for (let r = 0; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const nx = cx + dx, ny = cy + dy; if (nx >= 0 && ny >= 0 && nx < M.cols && ny < M.rows && !M.navBlocked[ny * M.cols + nx]) return ny * M.cols + nx;
  }
  assert.fail('no free cell near ' + x + ',' + y);
};
const poi = M => { const s = M.scale; return {
  temple: [M.templeRuins.x, M.templeRuins.y], ...Object.fromEntries(M.lairs.map((l, i) => ['lair' + i, [l.x, l.y]])),
  monastery: [510 * s, 650 * s], bamboo: [560 * s, 1230 * s], ha: [1620 * s, 2235 * s], city: [1300 * s, 1100 * s], steleCourt: [2300 * s, 1305 * s], mountainBasin: [1950 * s, 380 * s] }; };

test('nav grid: temple, 4 lairs, 3 settlements and every bridge/ford/gate are mutually reachable', () => {
  for (const seed of [42, 7, 2026]) {
    const { w } = loadGame(seed), M = w.GameEngine.MapTerrain, main = flood(M, freeNear(M, M.templeRuins.x, M.templeRuins.y));
    for (const [name, [x, y]] of Object.entries(poi(M))) assert.equal(main[freeNear(M, x, y)], 1, `${name} unreachable (seed ${seed})`);
    assert.ok(M.bridges.length >= 2 && M.fords.length >= 2, '2+ bridges and 2+ fords');
    for (const c of M.chokepoints) { const i = cellOf(M, c.x, c.y); assert.equal(M.navBlocked[i], 0, `${c.id} blocked`); assert.equal(main[i], 1, `${c.id} unreachable`); }
    // river: bridges are dry decks, fords are shallow (not water, but slow)
    for (const by of M.bridges) { assert.equal(M.isInWater(M.riverX(by), by), false); assert.equal(M.isInFord(M.riverX(by), by), false); }
    for (const f of M.fords) { assert.equal(M.isInWater(M.riverX(f.y), f.y), false); assert.equal(M.isInFord(M.riverX(f.y), f.y), true); assert.ok(M.getMoveSpeed({ x: M.riverX(f.y), y: f.y, moveSpeed: 100 }) < 100); }
  }
});

test('map has no walled-off pockets, also after the final-hunt site is added', () => {
  const { w } = loadGame(42), M = w.GameEngine.MapTerrain;
  const unreachable = () => { const main = flood(M, freeNear(M, M.templeRuins.x, M.templeRuins.y)); let n = 0; for (let i = 0; i < main.length; i++) if (!main[i] && !M.navBlocked[i]) n++; return n; };
  assert.equal(unreachable(), 0, 'free cells cut off from the temple');
  const site = M.makeFinalHuntSite(), main = flood(M, freeNear(M, M.templeRuins.x, M.templeRuins.y));
  assert.equal(main[freeNear(M, site.x, site.y)], 1, 'final lair reachable');
  assert.ok(unreachable() <= 12, 'final lair ring may only seal a handful of corner cells, got ' + unreachable());
});

test('river is a real barrier: only bridges and fords cross it on dry ground', () => {
  const { w } = loadGame(42), M = w.GameEngine.MapTerrain, dryRows = [];
  for (let y = 0; y < M.rows; y++) { // a row is a crossing when one dry, free run links the west bank to the east bank
    const rx = Math.floor(M.riverX((y + .5) * M.cell) / M.cell); let ok = true;
    for (let x = rx - 4; x <= rx + 4; x++) { const i = y * M.cols + x; if (M.navWater[i] || M.navBlocked[i]) ok = false; }
    if (ok) dryRows.push((y + .5) * M.cell);
  }
  const bands = dryRows.reduce((b, y) => { if (!b.length || y - b[b.length - 1].end > M.cell * 1.5) b.push({ start: y, end: y }); else b[b.length - 1].end = y; return b; }, []);
  const targets = [...M.bridges, ...M.fords.map(f => f.y)];
  for (const t of targets) assert.ok(bands.some(b => t >= b.start - M.cell && t <= b.end + M.cell), 'missing crossing at y=' + t);
  assert.ok(bands.length <= targets.length + 1, 'unexpected extra dry crossings: ' + JSON.stringify(bands));
  const dry = flood(M, freeNear(M, 1300 * 2, 1300 * 2), j => M.navWater[j]); // land-only reach still gets across (via bridges/fords)
  assert.equal(dry[freeNear(M, 2335 * 2, 1300 * 2)], 1);
});

test('lairs have 2-4 gates of varying width and each gate lets a bot through', () => {
  const { w } = loadGame(42), M = w.GameEngine.MapTerrain, widths = new Set();
  for (let i = 0; i < 4; i++) {
    const gates = M.chokepoints.filter(c => c.id.startsWith('lair_' + i + '_'));
    assert.ok(gates.length >= 2 && gates.length <= 4, `lair ${i} has ${gates.length} gates`);
    assert.ok(new Set(gates.map(g => g.w)).size >= 2 || gates.length === 2, `lair ${i} gates should differ in width`);
    gates.forEach(g => { widths.add(g.w); assert.ok(g.w / M.scale >= 40 && g.w / M.scale <= 110); assert.equal(M.canStand(g.x, g.y, 9), true); });
    const entry = gates[0], p = { x: entry.x, y: entry.y, collisionRadius: 9 };
    assert.ok(M.findPath(p.x, p.y, M.lairs[i].x, M.lairs[i].y).length, 'path into lair ' + i);
  }
  assert.ok(widths.size >= 5, 'gate widths vary across lairs');
});

test('spawns never land inside solids, water or unreachable cells (several seeds)', () => {
  for (const seed of [1, 2, 3, 11, 17, 67, 2026]) {
    const { w } = loadGame(seed), M = w.GameEngine.MapTerrain, G = w.GameManager, main = flood(M, freeNear(M, M.templeRuins.x, M.templeRuins.y));
    for (const e of [...G.pawns, ...G.monsters]) {
      assert.equal(M.canStand(e.x, e.y, 9), true, `${e.id} spawned in a solid (seed ${seed}) at ${e.x | 0},${e.y | 0}`);
      assert.equal(M.isInWater(e.x, e.y), false, `${e.id} spawned in water`);
      assert.equal(main[freeNear(M, e.x, e.y)], 1, `${e.id} spawned in a sealed pocket`);
    }
    for (const t of M.trees) assert.equal(M.templeRuins && Math.hypot(t.x * 2 - M.templeRuins.x, t.y * 2 - M.templeRuins.y) > M.templeRuins.radius, true);
  }
});

test('navigation crosses the map: every settlement pair has a clear segmented path', () => {
  const { w } = loadGame(42), M = w.GameEngine.MapTerrain, spots = { ...poi(M), temple: [M.templeRuins.x - 380, M.templeRuins.y] }, names = Object.keys(spots);
  for (let a = 0; a < names.length; a++) for (let b = a + 1; b < names.length; b++) {
    const [x1, y1] = spots[names[a]], [x2, y2] = spots[names[b]], lord = { id: 'walker', isMonster: true, tier: 5, x: x1, y: y1 }, path = M.findPath(x1, y1, x2, y2, lord); // a tier-5 walker ignores temple/lair locks
    assert.ok(path.length, `no path ${names[a]} -> ${names[b]}`);
    let prev = M.nearestFree(x1, y1, 12); for (const n of path) { assert.ok(M.segmentClear(prev.x, prev.y, n.x, n.y, false, 9, lord), `blocked leg ${names[a]} -> ${names[b]}`); prev = n; }
  }
});

test('static map layer is cached into offscreen tiles and rebuilt on init and ancient-arena switch', () => {
  const { w, ctx, stats } = loadGame(42), M = w.GameEngine.MapTerrain, cam = { x: 2600, y: 2600, zoom: .3, viewportWidth: 1366, viewportHeight: 768 };
  const base = stats.canvases; M.render(ctx, cam); const first = stats.canvases - base; assert.ok(first > 0 && first <= 4, 'zoomed-out view uses the 4 coarse tiles');
  const drawn = stats.drawImage; M.render(ctx, cam); assert.equal(stats.canvases - base, first, 'second frame reuses tiles'); assert.ok(stats.drawImage > drawn);
  cam.zoom = 1; M.render(ctx, cam); assert.ok(stats.canvases - base > first, 'zoomed-in view builds fine tiles on demand');
  const before = stats.canvases; M.ancientArena = { x: 1850, y: 2650, w: 1500, h: 1500, cx: 2600, cy: 3400, covers: [] }; M.render(ctx, cam); assert.ok(stats.canvases > before, 'arena switch invalidates the cache');
  M.ancientArena = null; M.init(5200, 5200); assert.equal(M.tileCache, null, 'init invalidates the cache');
  M.bushes[0].isBurned = true; M.render(ctx, cam); // bushes are dynamic: burning must not need a rebuild
});
