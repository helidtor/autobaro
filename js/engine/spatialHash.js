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
    this._gen = (this._gen || 0) + 1;
    if (!this._pool) this._pool = [];
    this.grid.forEach(list => { list.length = 0; this._pool.push(list); });
    this.grid.clear();
  },

  _getKey: function(x, y) {
    return (Math.floor(x / this.cellSize) + 32768) * 65536 + (Math.floor(y / this.cellSize) + 32768);
  },

  insert: function(entity) {
    if (!entity || typeof entity.x !== 'number' || typeof entity.y !== 'number') return;
    const key = this._getKey(entity.x, entity.y);
    let bucket = this.grid.get(key);
    if (!bucket) {
      bucket = (this._pool && this._pool.pop()) || [];
      this.grid.set(key, bucket);
    }
    bucket.push(entity);
    entity._hashKey = key;
    entity._hashGen = this._gen;
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
        const key = (cx + 32768) * 65536 + (cy + 32768);
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
  clear() { window.GameEngine.SpatialHash.clear.call(this); }
  _getKey(x, y) { return window.GameEngine.SpatialHash._getKey.call(this, x, y); }
  insert(entity) { window.GameEngine.SpatialHash.insert.call(this, entity); }
  queryCircle(x, y, radius, filterFn = null) {
    return window.GameEngine.SpatialHash.queryCircle.call(this, x, y, radius, filterFn);
  }
};
