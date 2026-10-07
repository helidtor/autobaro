/**
 * spatialHash.js - Lưới băm không gian (Spatial Hash Grid) tối ưu hóa truy vấn O(1)
 * Giúp 100 Bot + 200 Quái vật tìm mục tiêu và tính va chạm 60 FPS không giật lag
 */
window.GameEngine = window.GameEngine || {};

window.GameEngine.SpatialHash = {
  cellSize: 64,
  grid: new Map(),

  init: function(width, height, cellSize = 64) {
    this.cellSize = cellSize;
    this.grid = new Map();
  },

  clear: function() {
    this.grid.clear();
  },

  _getKey: function(x, y) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx},${cy}`;
  },

  insert: function(entity) {
    if (!entity || typeof entity.x !== 'number' || typeof entity.y !== 'number') return;
    const key = this._getKey(entity.x, entity.y);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key).push(entity);
  },

  // Truy vấn tất cả thực thể trong bán kính radius
  queryCircle: function(x, y, radius, filterFn = null) {
    const results = [];
    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCy = Math.floor((y - radius) / this.cellSize);
    const maxCy = Math.floor((y + radius) / this.cellSize);

    const radiusSq = radius * radius;

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const key = `${cx},${cy}`;
        const cell = this.grid.get(key);
        if (!cell) continue;

        for (let i = 0; i < cell.length; i++) {
          const entity = cell[i];
          const dx = entity.x - x;
          const dy = entity.y - y;
          if (dx * dx + dy * dy <= radiusSq) {
            if (!filterFn || filterFn(entity)) {
              results.push(entity);
            }
          }
        }
      }
    }
    return results;
  }
};

window.GameEngine.SpatialHashGrid = class SpatialHashGrid {
  constructor(cellSize = 64) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }
  clear() { this.grid.clear(); }
  _getKey(x, y) { return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`; }
  insert(entity) {
    const key = this._getKey(entity.x, entity.y);
    if (!this.grid.has(key)) this.grid.set(key, []);
    this.grid.get(key).push(entity);
  }
  queryCircle(x, y, radius, filterFn = null) {
    return window.GameEngine.SpatialHash.queryCircle.call(this, x, y, radius, filterFn);
  }
};
