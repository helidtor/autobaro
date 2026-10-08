/**
 * directorControls.js - Bảng Điều Khiển Quyền Năng Chúa Tể & Chuyển Đổi Chế Độ Chơi
 */
window.GameUI = window.GameUI || {};

window.GameUI.DirectorControls = {
  activeGodPower: null,

  init: function() {
    this.bindEvents();
  },

  setSpeed(speed) {
    const G=window.GameManager;
    if(!G||G.resultOpen||G.isGameOver)return;
    if(speed>0)G.gameSpeed=speed;
    G.isPaused=speed===0;
    this.syncSpeed();
  },

  togglePause() {
    const G=window.GameManager;
    if(G)this.setSpeed(G.isPaused?(G.gameSpeed||1):0);
  },

  syncSpeed() {
    const G=window.GameManager;
    document.querySelectorAll('.btn-speed').forEach(button=>button.classList.toggle('active',Number(button.dataset.speed)===(G.isPaused?0:G.gameSpeed)));
  },

  bindEvents: function() {
    // Tốc độ game
    document.querySelectorAll('.btn-speed').forEach(btn => {
      btn.addEventListener('click', () => this.setSpeed(Number(btn.dataset.speed)));
    });

    // Chuyển đổi chế độ chơi
    const btnMode = document.getElementById('btn-toggle-mode');
    if (btnMode) {
      btnMode.addEventListener('click', () => {
        if (!window.GameManager) return;
        const isPlayer = window.GameManager.togglePlayerMode();
        btnMode.innerText = isPlayer ? '🎮 Chế độ: Người Chơi (1v99)' : '👁️ Chế độ: Đạo Diễn (Spectator)';
        btnMode.classList.toggle('btn-player-mode', isPlayer);
      });
    }
  },

  useGodPower: function(powerName) {
    if (powerName === 'airdrop') return;
    this.activeGodPower = powerName;
    const prompt = document.getElementById('god-power-prompt');
    if (prompt) {
      prompt.innerText = `[Click chuột lên bản đồ để kích hoạt: ${powerName.toUpperCase()}]`;
      prompt.classList.remove('hidden');
    }
  },

  executeGodPowerAt: function(worldX, worldY) {
    if (!this.activeGodPower || !window.GameManager) return;
    const power = this.activeGodPower;
    this.activeGodPower = null;

    const prompt = document.getElementById('god-power-prompt');
    if (prompt) prompt.classList.add('hidden');

    switch (power) {
      case 'smite':
        // Giáng sấm sét
        window.GameRenderer.VfxManager.addBurstParticles(worldX, worldY, '#3498db', 25);
        window.GameRenderer.VfxManager.addDamageNumber(worldX, worldY, 250, 'crit');
        // Gây sát thương các thực thể lân cận
        const victims = window.GameManager.spatialGrid.queryCircle(worldX, worldY, 60);
        victims.forEach(v => {
          if (v.isAlive) {
            v.currentHp = Math.max(0, v.currentHp - 250);
            if (v.currentHp <= 0 && window.GameEntities.CombatSystem) {
              window.GameEntities.CombatSystem.handleDeath(null, v);
            }
          }
        });
        if (window.GameUI.CombatTicker) {
          window.GameUI.CombatTicker.log(`⚡ [THIÊN LÔI] Sấm sét vừa giáng xuống tiêu diệt kẻ cản đường!`);
        }
        break;

      case 'firestorm':
        // Đốt cháy bụi rậm
        window.GameEngine.MapTerrain.bushes.forEach(b => {
          if (Math.hypot(b.x - worldX, b.y - worldY) < 120) {
            b.isBurned = true;
            window.GameRenderer.VfxManager.addBurstParticles(b.x, b.y, '#e74c3c', 12);
          }
        });
        if (window.GameUI.CombatTicker) {
          window.GameUI.CombatTicker.log(`🔥 [HỎA THẦN] Một góc rừng đã bị thiêu rụi hoàn toàn, xua đuổi các bot nấp bụi!`);
        }
        break;

      case 'berserk':
        // Ép bot gần nhất vào trạng thái Cuồng Nộ
        const nearestPawn = window.GameManager.pawns.find(p => p.isAlive && Math.hypot(p.x - worldX, p.y - worldY) < 80);
        if (nearestPawn) {
          window.GameAI.EmotionEngine.triggerBreakthrough(nearestPawn, true);
        }
        break;
    }
  },

  // Hiển thị Post-Match Story Card khi chỉ còn 1 bot sống sót
  showPostMatchStoryCard: function(winner) {
    const cardEl = document.getElementById('story-card-modal');
    if (!cardEl) return;
    if (!winner) {
      cardEl.innerHTML = '<div class="story-card-box"><h1>Không có người sống sót</h1><button class="btn-restart" onclick="window.GameManager.startNewMatch()">🔄 BẮT ĐẦU TRẬN ĐẤU MỚI</button></div>';
      cardEl.classList.remove('hidden');
      return;
    }

    // Tìm các danh hiệu
    const allPawns = window.GameManager.pawns;
    const sortedByKills = [...allPawns].sort((a, b) => (b.killCount || 0) - (a.killCount || 0));
    const topKiller = sortedByKills[0];

    const weaponName = winner.weapon ? '<span style="color:'+window.GameData.Equipments.TIER_COLORS[winner.weapon.tier]+'">'+winner.weapon.name+'</span>' : 'Tay Không';
    const godArtifact = winner.weapon && winner.weapon.tier === 'god' ? '🏆 Sở hữu: '+weaponName : 'Chưa có Thần Khí';

    cardEl.innerHTML = `
      <div class="story-card-box">
        <h1 class="story-card-title">👑 KẺ SỐNG SÓT CUỐI CÙNG 👑</h1>
        <div class="story-card-winner">${winner.name}</div>
        <div class="story-card-subtitle">
          Cấp ${winner.level} | Vũ khí ${window.GameData.Classes[winner.classId || 'warrior'].name} | Tính cách: ${window.GameData.Traits[winner.trait].name}
        </div>
        <div class="story-card-god">${godArtifact}</div>
        <div class="story-card-weapon">Vũ khí tối hậu: ${weaponName} (Tổng Kills: ${winner.killCount})</div>

        <div class="story-card-honors">
          <h3>🎖️ BẢNG DANH HIỆU BẤT HỦ RIMWORLD 🎖️</h3>
          <div class="honor-row">⚔️ <b>Chiến Thần Đơn Độc:</b> ${topKiller ? topKiller.name + ` (${topKiller.killCount} mạng)` : 'Không có'}</div>
          
          
        </div>

        <button class="btn-restart" id="btn-continue" onclick="window.GameManager.continueAfterResult()">✕ Đóng kết quả • Tiếp tục trận đấu</button>
        <p>Đóng kết quả: quái cũ rời bản đồ, 5 Yêu Vương mới xuất hiện. Luyện tới cấp 15 rồi mới quyết chiến Yêu Thần. Hạ hết 5 Yêu Vương để mở điện thờ.</p>
        <button class="btn-ctrl" onclick="window.GameManager.startNewMatch()">Bắt đầu trận mới</button>
      </div>
    `;
    cardEl.classList.remove('hidden');
  }
};
