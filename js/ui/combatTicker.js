/**
 * combatTicker.js - Nhật ký Chiến trường Kể chuyện Tự phát (RimWorld Procedural Story Log)
 */
window.GameUI = window.GameUI || {};

window.GameUI.CombatTicker = {
  maxLines: 8,
  logs: [],
  containerEl: null,

  init: function(containerId = 'combat-ticker-list') {
    this.containerEl = document.getElementById(containerId);
    this.logs = [];
    this.log('📢 Chào mừng đến với [Đấu Trường Sinh Tử RimWorld - The Crucible of Souls]!');
    this.log('⚔️ 100 Bot AI bắt đầu tay không lùng sục trang bị và quái vật!');
  },

  log: function(message) {
    const timeStr = this.getGameTimeString();
    const entry = { text: `[${timeStr}] ${message}`, time: Date.now() };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLines) {
      this.logs.pop();
    }

    this.render();
  },

  getGameTimeString: function() {
    if (!window.GameManager) return '00:00';
    const totalSec = Math.floor(window.GameManager.matchTime || 0);
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  },

  render: function() {
    if (!this.containerEl) return;
    this.containerEl.innerHTML = '';
    this.logs.forEach(item => {
      const line = document.createElement('div');
      line.className = 'ticker-line';
      line.innerHTML = item.text;
      this.containerEl.appendChild(line);
    });
  }
};
