/**
 * mapLayout.js - Hand-authored layout of the 5200px world (2600 design grid, x2).
 *
 * Everything below is in DESIGN units. Row formats:
 *   obstacles: [kind, x, y, w, h, opts?]  solid rect (blocks movement + sight)
 *   cover:     [kind, x, y, radius]       non-solid concealment (bush / bamboo / reed)
 * Each region also lists its `chokepoints` (gates, passes, bridges, fords). The map tests walk
 * every one of them with the navigation grid, so a wrongly placed prop fails loudly.
 *
 * Tactical reading of the map:
 *  - Kinh Thanh (centre): 4 gates of different widths (110/64/64/48), a breach with rubble, market
 *    halls leaving 44px alleys. The sealed temple disc sits in the middle of the plaza.
 *  - Four lairs on the diagonals share the same 4 avenues (N/E/S/W) that hug the city; every lair has
 *    2-4 gates of 40-110px and its own sightline blockers (pillars / boulders / posts / steles).
 *  - River: 2 stone/wooden bridges = forced dry crossings, 3 fords = shallow, slow and exposed.
 *  - Mountains: closed basin (ridge + canyon pass + east pass + river gorge + ledges).
 *  - Ruins, dikes, rubble and bush hedges give cover islands and flanking routes.
 */
(function () {
  const C = 1300;

  // ---- helpers that expand to obstacle rows -------------------------------------------------
  /** Horizontal wall at y between x1..x2 leaving gaps given as [from,to]. */
  const wallH = (y, x1, x2, gaps = [], t = 12, kind = 'wall', o) => {
    const rows = []; let x = x1;
    for (const [a, b] of [...gaps].sort((p, q) => p[0] - q[0])) { if (a > x) rows.push([kind, x, y, a - x, t, o]); x = b; }
    if (x < x2) rows.push([kind, x, y, x2 - x, t, o]);
    return rows;
  };
  /** Vertical wall at x between y1..y2 leaving gaps given as [from,to]. */
  const wallV = (x, y1, y2, gaps = [], t = 12, kind = 'wall', o) => {
    const rows = []; let y = y1;
    for (const [a, b] of [...gaps].sort((p, q) => p[0] - q[0])) { if (a > y) rows.push([kind, x, y, t, a - y, o]); y = b; }
    if (y < y2) rows.push([kind, x, y, t, y2 - y, o]);
    return rows;
  };
  /** Mirror a NW-quadrant rect across the city axes: sx/sy = +1 keep, -1 flip. */
  const flip = (rows, sx, sy) => rows.map(([k, x, y, w, h, o]) => [k, sx < 0 ? 2 * C - x - w : x, sy < 0 ? 2 * C - y - h : y, w, h, o]);
  const gap = (c, w) => [c - w / 2, c + w / 2];

  /** Square ring wall around a lair; gates = {n,e,s,w: [[offset,width],...]} offsets from the centre. */
  const H = 118, T = 12;
  const lairRing = (cx, cy, gates, theme) => {
    const g = side => (gates[side] || []).map(([off, w], i) => gap((side === 'n' || side === 's' ? cx : cy) + off, w));
    const o = { theme };
    return [
      ...wallH(cy - H - T / 2, cx - H - T / 2, cx + H + T / 2, g('n'), T, 'lair-wall', o),
      ...wallH(cy + H - T / 2, cx - H - T / 2, cx + H + T / 2, g('s'), T, 'lair-wall', o),
      ...wallV(cx - H - T / 2, cy - H + T / 2, cy + H - T / 2, g('w'), T, 'lair-wall', o),
      ...wallV(cx + H - T / 2, cy - H + T / 2, cy + H - T / 2, g('e'), T, 'lair-wall', o),
      ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => ['tower', cx + sx * H - 13, cy + sy * H - 13, 26, 26, { theme }])
    ];
  };

  // ---- river / crossings --------------------------------------------------------------------
  const river = {
    center: y => 1960 + 120 * Math.sin(y / 330), half: 54,
    bridges: [1040, 1880],                 // dry decks, 210 long, 56 wide
    fords: [{ y: 540, name: 'Bến Hẻm Núi' }, { y: 1300, name: 'Bến Đá Cổng Đông' }, { y: 2400, name: 'Bến Cỏ Lau' }]
  };

  // ---- regions ------------------------------------------------------------------------------
  const regions = [];

  regions.push({
    id: 'monastery', name: 'THIỀN VIỆN TRÚC LÂM', label: [510, 420], settlement: [510, 650, 220, 210],
    // Walled courtyard: 80px main gate (south) + 40px postern (west). Bamboo hedges outside form a hidden flank lane.
    obstacles: [
      ...wallH(480, 285, 735), ...wallV(285, 480, 840, [[640, 680]]), ...wallV(723, 480, 840),
      ...wallH(828, 285, 735, [[470, 550]]),
      ['gate-post', 462, 820, 8, 28], ['gate-post', 550, 820, 8, 28],
      ['building', 430, 540, 160, 82, { style: 'hall', roof: '#365d58' }],
      ['building', 312, 728, 70, 100, { style: 'pagoda', levels: 3 }], ['building', 638, 728, 70, 100, { style: 'pagoda', levels: 3 }],
      ['lantern', 455, 650, 10, 10], ['lantern', 555, 650, 10, 10], ['lantern', 455, 790, 10, 10], ['lantern', 555, 790, 10, 10],
      ['rubble', 700, 480, 30, 20] // a toppled corner stone at the north-east
    ],
    cover: [
      ['bamboo', 322, 520, 22], ['bamboo', 344, 544, 20], ['bamboo', 698, 520, 22], ['bamboo', 676, 546, 20], ['bamboo', 318, 800, 22], ['bamboo', 696, 802, 22],
      ...Array.from({ length: 9 }, (_, i) => ['bamboo', 235 + (i % 2) * 14, 470 + i * 42, 26]),      // west flank hedge
      ...Array.from({ length: 10 }, (_, i) => ['bamboo', 290 + i * 48, 440 + (i % 2) * 10, 26]),    // north screen
      ...Array.from({ length: 5 }, (_, i) => ['bamboo', 760 + (i % 2) * 12, 540 + i * 46, 24])       // east grove
    ],
    chokepoints: [
      { id: 'monastery_south', kind: 'gate', x: 510, y: 835, w: 80 },
      { id: 'monastery_west', kind: 'gate', x: 291, y: 660, w: 40 }
    ]
  });

  regions.push({
    id: 'city', name: 'KINH THÀNH', label: [1300, 1000], settlement: [1300, 1300, 265, 265],
    obstacles: [
      // outer wall: 110 main north gate, 64 south gate, 64 west gate, 48 narrow east gate, 50 breach in the SW
      ...wallH(1040, 1040, 1560, [gap(1300, 110)], 16, 'wall', { crenel: true }),
      ...wallH(1544, 1040, 1560, [gap(1300, 64), [1120, 1170]], 16, 'wall', { crenel: true }),
      ...wallV(1040, 1056, 1544, [gap(1300, 64)], 16, 'wall', { crenel: true }),
      ...wallV(1544, 1056, 1544, [gap(1300, 48)], 16, 'wall', { crenel: true }),
      ['building', 1022, 1022, 64, 64, { style: 'tower' }], ['building', 1514, 1022, 64, 64, { style: 'tower' }],
      ['building', 1022, 1514, 64, 64, { style: 'tower' }], ['building', 1514, 1514, 64, 64, { style: 'tower' }],
      // gate-houses flanking the main (north) gate
      ['gate-post', 1236, 1032, 10, 30], ['gate-post', 1354, 1032, 10, 30],
      // market quarters: one hall + one stall block per corner, mirrored; 44px alleys against the wall
      ...flip([['building', 1104, 1104, 54, 38, { style: 'hall', roof: '#7a6960' }], ['stall', 1118, 1176, 34, 16]], 1, 1),
      ...flip([['building', 1104, 1104, 54, 38, { style: 'hall', roof: '#7a6960' }], ['stall', 1118, 1176, 34, 16]], -1, 1),
      ...flip([['building', 1104, 1104, 54, 38, { style: 'hall', roof: '#7a6960' }]], 1, -1),
      ...flip([['building', 1104, 1104, 54, 38, { style: 'hall', roof: '#7a6960' }], ['stall', 1118, 1176, 34, 16]], -1, -1),
      // collapsed wall chunks at the breach act as cover islands
      ['rubble', 1096, 1572, 30, 16], ['rubble', 1176, 1522, 26, 14], ['rubble', 1132, 1494, 18, 12]
    ],
    cover: [],
    chokepoints: [
      { id: 'city_north', kind: 'gate', x: 1300, y: 1048, w: 110 }, { id: 'city_south', kind: 'gate', x: 1300, y: 1552, w: 64 },
      { id: 'city_west', kind: 'gate', x: 1048, y: 1300, w: 64 }, { id: 'city_east', kind: 'gate', x: 1552, y: 1300, w: 48 },
      { id: 'city_breach', kind: 'breach', x: 1145, y: 1552, w: 50 }
    ]
  });

  // Lairs: centre fixed by combat rules (boss home = centre); gates face the shared avenues.
  const lairDefs = [
    { name: 'VIÊM MA ĐIỆN', x: 900, y: 900, color: '#b95c43', theme: 'fire',
      gates: { e: [[0, 56]], s: [[0, 84]], w: [[-40, 44]] },
      props: [...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => ['pillar', 900 + sx * 64 - 9, 900 + sy * 64 - 9, 18, 18, { theme: 'fire' }])] },
    { name: 'KIM CƯƠNG SƠN', x: 1700, y: 900, color: '#b89c61', theme: 'stone',
      gates: { w: [[0, 90]], s: [[0, 40]], n: [[0, 60]] },
      props: [['rock', 1700 - 78, 900 - 50, 40, 52, { theme: 'stone' }], ['rock', 1700 + 38, 900 + 6, 40, 52, { theme: 'stone' }]] },
    { name: 'THANH XÀ ĐẦM', x: 900, y: 1700, color: '#609a79', theme: 'marsh',
      gates: { n: [[0, 70]], e: [[0, 100]], s: [[0, 44]], w: [[0, 56]] },
      props: [['rubble', 900 - 80, 1700 - 12, 36, 24, { theme: 'marsh' }], ['rubble', 900 + 44, 1700 - 74, 36, 24, { theme: 'marsh' }], ['rubble', 900 + 44, 1700 + 52, 36, 24, { theme: 'marsh' }]] },
    { name: 'VONG HỒN THÀNH', x: 1700, y: 1700, color: '#9784b1', theme: 'ghost',
      gates: { n: [[0, 48]], w: [[0, 64]], e: [[0, 110]] },
      props: [...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => ['stele', 1700 + sx * 72 - 7, 1700 + sy * 38 - 11, 14, 22, { theme: 'ghost' }])] }
  ];
  regions.push({
    id: 'lairs', name: 'TỨ VƯƠNG ĐIỆN', label: null,
    obstacles: lairDefs.flatMap(l => [...lairRing(l.x, l.y, l.gates, l.theme), ...l.props]),
    cover: [
      // reed clumps inside the marsh lair, ghostly shrubs in the haunted one
      ['reed', 840, 1650, 20], ['reed', 960, 1630, 18], ['reed', 940, 1760, 20], ['reed', 850, 1750, 18],
      ['bush', 1650, 1640, 20], ['bush', 1760, 1760, 20],
      // avenue hedges: concealed flanking lanes along the four avenues
      ...Array.from({ length: 8 }, (_, i) => ['bush', 1080 + i * 62, 830, 22]), ...Array.from({ length: 8 }, (_, i) => ['bush', 1080 + i * 62, 958, 20]),
      ...Array.from({ length: 8 }, (_, i) => ['bush', 1080 + i * 62, 1625 + (i % 2) * 4, 22]),
      ...Array.from({ length: 6 }, (_, i) => ['bush', 1790, 1030 + i * 90, 22]), ...Array.from({ length: 6 }, (_, i) => ['bush', 810, 1030 + i * 90, 22])
    ],
    chokepoints: lairDefs.flatMap((l, i) => Object.entries(l.gates).flatMap(([side, list]) => list.map(([off, w]) => ({
      id: 'lair_' + i + '_' + side, kind: 'gate', w,
      x: l.x + (side === 'e' ? H : side === 'w' ? -H : off), y: l.y + (side === 's' ? H : side === 'n' ? -H : off)
    })))),
    defs: lairDefs
  });

  regions.push({
    id: 'bamboo', name: 'LÀNG TRÚC', label: [560, 1080], settlement: [560, 1230, 220, 130],
    // Walled hamlet: gates N(80) W(40) E(60) S(60) and three alleys between houses.
    obstacles: [
      ...wallH(1140, 350, 765, [[540, 620]], 6, 'fence'), ...wallH(1305, 350, 765, [[440, 500]], 6, 'fence'),
      ...wallV(350, 1140, 1311, [[1222, 1262]], 6, 'fence'), ...wallV(765, 1140, 1311, [[1215, 1275]], 6, 'fence'),
      ['building', 390, 1160, 64, 42, { style: 'house', roof: '#8e6252' }], ['building', 650, 1160, 64, 42, { style: 'house', roof: '#777c69' }],
      ['building', 520, 1258, 64, 40, { style: 'house', roof: '#777c69' }], ['building', 640, 1258, 62, 40, { style: 'house', roof: '#8e6252' }],
      ['building', 380, 1262, 48, 34, { style: 'house', roof: '#8e6252' }],
      ['well', 650, 1222, 22, 20], ['stall', 460, 1210, 28, 14]
    ],
    cover: [
      ...Array.from({ length: 10 }, (_, i) => ['bamboo', 330 + i * 46, 1100 + (i % 2) * 8, 24]),
      ...Array.from({ length: 6 }, (_, i) => ['bamboo', 800, 1120 + i * 40, 24]),
      ['bamboo', 380, 1218, 18], ['bamboo', 700, 1215, 18]
    ],
    chokepoints: [
      { id: 'bamboo_north', kind: 'gate', x: 580, y: 1143, w: 80 }, { id: 'bamboo_west', kind: 'gate', x: 353, y: 1242, w: 40 },
      { id: 'bamboo_east', kind: 'gate', x: 768, y: 1245, w: 60 }, { id: 'bamboo_south', kind: 'gate', x: 470, y: 1308, w: 60 }
    ]
  });

  regions.push({
    id: 'ha', name: 'LÀNG HÀ', label: [1660, 2040], settlement: [1660, 2210, 215, 125],
    // River village: dock side gate (70), plus N(80) W(50) S(50); granary + net racks form a cover maze.
    obstacles: [
      ...wallH(2100, 1450, 1870, [[1620, 1700]], 6, 'fence'), ...wallH(2325, 1450, 1870, [[1540, 1590]], 6, 'fence'),
      ...wallV(1450, 2100, 2331, [[2190, 2240]], 6, 'fence'), ...wallV(1870, 2100, 2331, [[2180, 2250]], 6, 'fence'),
      ['building', 1485, 2125, 64, 42, { style: 'house', roof: '#8e6252' }], ['building', 1760, 2125, 70, 42, { style: 'house', roof: '#777c69' }],
      ['building', 1560, 2262, 64, 40, { style: 'house', roof: '#777c69' }], ['building', 1700, 2250, 96, 52, { style: 'hall', roof: '#6d5a4a' }],
      ['building', 1480, 2255, 48, 34, { style: 'house', roof: '#8e6252' }], ['building', 1830, 2262, 30, 34, { style: 'house', roof: '#8e6252' }],
      ['well', 1640, 2196, 22, 20], ['stall', 1790, 2190, 28, 14], ['stall', 1520, 2190, 26, 14]
    ],
    cover: [
      ...Array.from({ length: 7 }, (_, i) => ['reed', 1900 + (i % 2) * 6, 2090 + i * 38, 18]),
      ['bush', 1425, 2180, 20], ['bush', 1425, 2250, 20]
    ],
    chokepoints: [
      { id: 'ha_north', kind: 'gate', x: 1660, y: 2103, w: 80 }, { id: 'ha_west', kind: 'gate', x: 1453, y: 2215, w: 50 },
      { id: 'ha_east', kind: 'gate', x: 1873, y: 2215, w: 70 }, { id: 'ha_south', kind: 'gate', x: 1565, y: 2328, w: 50 }
    ]
  });

  regions.push({
    id: 'mountain', name: 'DÃY NÚI LIÊN SƠN', label: [2010, 330], ledges: [[1735, 420, 58], [1895, 350, 46], [2255, 420, 64], [2420, 345, 44], [1700, 560, 42]],
    // Closed basin: south ridge (y 612-688) with a canyon pass (85), a river gorge and an east pass (90);
    // inside, boulders and a baffle wall make switchbacks and two sniper ledges overlook the passes.
    obstacles: [
      ['rock', 1640, 612, 225, 76], ['rock', 1950, 612, 62, 76], ['rock', 2135, 612, 150, 76], ['rock', 2375, 612, 105, 76],
      ['rock', 1612, 276, 30, 336], ['rock', 1642, 262, 370, 26], ['rock', 2125, 262, 355, 26], ['rock', 2480, 262, 26, 426],
      ['rock', 1840, 470, 26, 142], ['rock', 1950, 470, 26, 142],           // canyon walls
      ['rock', 2195, 470, 110, 34], ['rock', 1700, 372, 44, 36], ['rock', 2005, 330, 50, 40], ['rock', 2335, 345, 46, 40],
      ['rock', 2420, 468, 40, 50], ['rock', 1768, 300, 40, 34], ['rock', 1995, 420, 36, 32]
    ],
    cover: [['bush', 1790, 560, 22], ['bush', 1760, 590, 20], ['bush', 2230, 575, 22], ['bush', 2330, 560, 22], ['bush', 1905, 410, 22]],
    chokepoints: [
      { id: 'mountain_canyon', kind: 'pass', x: 1907, y: 650, w: 85 }, { id: 'mountain_east', kind: 'pass', x: 2330, y: 650, w: 90 },
      { id: 'mountain_ford', kind: 'ford', x: river.center(540), y: 540, w: 54 }
    ]
  });

  regions.push({
    id: 'forest', name: 'RỪNG GIÀ HOANG VU', label: [530, 2020],
    stands: [{ cx: 530, cy: 1900, rx: 500, ry: 380, rot: -.25, count: 105, spacing: 58, r: [24, 42] }],
    // fallen giants / mossy boulders create cover islands in the deep wood
    obstacles: [
      ['rock', 430, 1830, 46, 36, { theme: 'moss' }], ['rock', 640, 1960, 40, 32, { theme: 'moss' }], ['rock', 360, 2080, 44, 34, { theme: 'moss' }],
      ['rock', 700, 1750, 38, 30, { theme: 'moss' }], ['rock', 520, 1960, 52, 38, { theme: 'moss' }], ['rock', 260, 1860, 40, 32, { theme: 'moss' }]
    ],
    cover: [
      ['bush', 560, 1990, 26], ['bush', 600, 1960, 24], ['bush', 480, 1990, 24], ['bush', 520, 1930, 22],
      ...Array.from({ length: 6 }, (_, i) => ['bush', 250 + i * 70, 1700 + (i % 3) * 20, 24])
    ],
    chokepoints: []
  });

  regions.push({
    id: 'ruins', name: 'PHẾ TÍCH VỌNG NGUYỆT', label: [1320, 440],
    // Broken moon-gazing terrace north of the avenue: L-shaped wall remnants and column stumps.
    obstacles: [
      ['ruin', 1210, 480, 80, 10], ['ruin', 1330, 480, 90, 10], ['ruin', 1210, 480, 10, 70], ['ruin', 1410, 480, 10, 40],
      ['ruin', 1210, 590, 60, 10], ['ruin', 1330, 590, 10, 40], ['pillar', 1280, 540, 16, 16], ['pillar', 1340, 535, 16, 16],
      ['rubble', 1250, 640, 34, 18], ['rubble', 1440, 540, 30, 18], ['stele', 1305, 515, 14, 24],
      ['ruin', 1150, 560, 10, 60], ['ruin', 1450, 600, 10, 56], ['pillar', 1240, 610, 16, 16], ['pillar', 1390, 615, 16, 16], ['rubble', 1170, 640, 28, 14]
    ],
    cover: [['bush', 1180, 560, 22], ['bush', 1460, 620, 22], ['bush', 1380, 660, 20]],
    chokepoints: []
  });

  regions.push({
    id: 'stele', name: 'BIA ĐÁ CỔ', label: [2440, 1190],
    // East-bank ruined courtyard right behind the central ford: four 40px breaches, cross-shaped lanes.
    obstacles: [
      ...wallH(1230, 2250, 2430, [gap(2330, 40)], 10, 'ruin'), ...wallH(1370, 2250, 2430, [gap(2350, 40)], 10, 'ruin'),
      ...wallV(2250, 1240, 1370, [[1295, 1355]], 10, 'ruin'), ...wallV(2420, 1240, 1370, [gap(1300, 40)], 10, 'ruin'),
      ['stele', 2335, 1292, 14, 30], ['pillar', 2290, 1262, 16, 16], ['pillar', 2380, 1262, 16, 16], ['pillar', 2290, 1335, 16, 16], ['pillar', 2380, 1335, 16, 16],
      ['rubble', 2216, 1190, 30, 16], ['rubble', 2450, 1200, 26, 16], ['rubble', 2210, 1410, 30, 16], ['rubble', 2460, 1420, 28, 16], ['rubble', 2330, 1150, 34, 14]
    ],
    cover: [['bush', 2180, 1260, 20], ['bush', 2480, 1300, 22]],
    chokepoints: [{ id: 'stele_north', kind: 'gate', x: 2330, y: 1235, w: 40 }, { id: 'stele_south', kind: 'gate', x: 2350, y: 1375, w: 40 }]
  });

  regions.push({
    id: 'river', name: 'SÔNG HOÀNG HÀ', label: [2215, 1530],
    // Bridge heads: toll house on the east bank (cover + sightline block), sandbag rubble on the west bank.
    obstacles: [
      ['building', 2096, 1082, 56, 34, { style: 'house', roof: '#6d5a4a' }], ['rubble', 1822, 1076, 26, 14], ['rubble', 1820, 1000, 24, 12],
      ['building', 2090, 1805, 40, 30, { style: 'house', roof: '#6d5a4a' }], ['rubble', 1832, 1912, 26, 14]
    ],
    cover: [
      // reed banks along both shores form concealed lanes (dry, outside fords)
      ...Array.from({ length: 22 }, (_, i) => { const y = 160 + i * 110; return ['reed', river.center(y) - 82, y, 18]; }).filter(([, , y]) => Math.abs(y - 1040) > 90 && Math.abs(y - 1880) > 90 && Math.abs(y - 1300) > 70 && Math.abs(y - 2400) > 70 && y > 740),
      ...Array.from({ length: 22 }, (_, i) => { const y = 200 + i * 110; return ['reed', river.center(y) + 82, y, 18]; }).filter(([, , y]) => Math.abs(y - 1040) > 90 && Math.abs(y - 1880) > 90 && Math.abs(y - 1300) > 70 && Math.abs(y - 2400) > 70 && y > 740)
    ],
    chokepoints: [
      { id: 'bridge_north', kind: 'bridge', x: river.center(1040), y: 1040, w: 56 }, { id: 'bridge_south', kind: 'bridge', x: river.center(1880), y: 1880, w: 56 },
      { id: 'ford_city', kind: 'ford', x: river.center(1300), y: 1300, w: 48 }, { id: 'ford_south', kind: 'ford', x: river.center(2400), y: 2400, w: 48 }
    ]
  });

  regions.push({
    id: 'fields', name: 'ĐỒNG LÚA NAM', label: [1260, 2050],
    marsh: [{ x: 900, y: 1700, rx: 255, ry: 215 }, { x: 1180, y: 2260, rx: 230, ry: 110 }, { x: 2270, y: 1790, rx: 120, ry: 80 }],
    // Paddy dikes: low walls scattered like cover islands between the south road and the marsh.
    obstacles: [
      ['dike', 1160, 1940, 110, 8], ['dike', 1330, 2010, 8, 90], ['dike', 1250, 2100, 100, 8], ['dike', 1440, 1960, 90, 8],
      ['dike', 1100, 2040, 8, 70], ['dike', 1400, 2130, 8, 70],
      ['rock', 1000, 2370, 50, 40, { theme: 'moss' }], ['rock', 1520, 2440, 44, 36, { theme: 'moss' }], ['rock', 2230, 1930, 40, 50, { theme: 'stone' }], ['rock', 2300, 2000, 36, 40, { theme: 'stone' }]
    ],
    cover: [
      ['reed', 1130, 2250, 20], ['reed', 1200, 2275, 20], ['reed', 1250, 2240, 18], ['reed', 1090, 2285, 18], ['reed', 2240, 1780, 18], ['reed', 2300, 1810, 18],
      ...Array.from({ length: 7 }, (_, i) => ['bush', 1060 + i * 70, 2400 + (i % 2) * 16, 22])
    ],
    chokepoints: []
  });

  // ---- global tables ------------------------------------------------------------------------
  const roads = [
    [[1300, 1040], [1300, 900]], [[1018, 900], [1582, 900]], [[1700, 1018], [1700, 1582]], [[900, 1018], [900, 1582]], [[1018, 1700], [1582, 1700]],
    [[1560, 1300], [1700, 1300], [1850, 1300]], [[2060, 1300], [2330, 1300], [2340, 1370]],
    [[1040, 1300], [900, 1300], [765, 1245]],
    [[1300, 1560], [1300, 1700], [1300, 1900], [1500, 1980], [1660, 2100]],
    [[1700, 1040], [1850, 1040], [2064, 1040], [2350, 1090], [2330, 1230]],
    [[1300, 1900], [1850, 1880], [2064, 1880], [2300, 1950]],
    [[510, 840], [510, 900], [620, 1100], [580, 1140]], [[510, 900], [782, 860]],
    [[580, 1310], [540, 1560], [560, 1800], [782, 1720]],
    [[1700, 782], [1700, 700], [1907, 650], [1907, 470]], [[1300, 900], [1300, 640]],
    [[2330, 650], [2330, 500], [2150, 540]]
  ];

  window.GameEngine = window.GameEngine || {};
  window.GameEngine.MapLayout = { size: 2600, center: C, H, river, regions, roads, lairDefs, lairRing,
    temple: { x: C, y: C, r: 160 },
    // pine / broadleaf groves scattered with Poisson spacing (forest stands live on the forest region)
    groves: [
      { cx: 1000, cy: 420, rx: 220, ry: 110, count: 20, spacing: 60, r: [18, 28], pine: .8 }, { cx: 1500, cy: 360, rx: 150, ry: 90, count: 12, spacing: 60, r: [18, 28], pine: .8 },
      { cx: 510, cy: 330, rx: 240, ry: 80, count: 14, spacing: 60, r: [18, 30], pine: .5 }, { cx: 170, cy: 1000, rx: 90, ry: 300, count: 12, spacing: 70, r: [20, 30], pine: .3 },
      { cx: 2480, cy: 1750, rx: 90, ry: 260, count: 12, spacing: 70, r: [20, 30], pine: .3 }, { cx: 2350, cy: 2260, rx: 150, ry: 90, count: 10, spacing: 70, r: [20, 30], pine: .3 },
      { cx: 1450, cy: 2480, rx: 300, ry: 60, count: 10, spacing: 70, r: [20, 30], pine: .4 }, { cx: 2330, cy: 440, rx: 90, ry: 60, count: 5, spacing: 60, r: [18, 26], pine: 1 },
      { cx: 1750, cy: 1980, rx: 60, ry: 50, count: 4, spacing: 60, r: [20, 28], pine: .3 }
    ] };
})();
