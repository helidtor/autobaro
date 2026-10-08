/**
 * paperdoll.js - Hệ thống hiển thị trang bị trực quan trên Pawn & Đồ rơi dưới đất
 */
window.GameRenderer = window.GameRenderer || {};

window.GameRenderer.Paperdoll = {
  // Render trang bị rơi dưới đất (DropItem)
  renderDropItem: function(ctx, item, time) {
    if (!item || item.isCollected) return;
    time = (time !== undefined ? time : performance.now() / 1000);
    ctx.save();
    ctx.translate(item.x, item.y);

    const tier = item.tier || 'common';
    const tierColor = window.GameData.Equipments.TIER_COLORS[tier] || '#95a5a6';

    // 1. Cột sáng hào quang theo phẩm chất
    const floatBob = Math.sin(time * 4 + item.id.charCodeAt(0)) * 4;

    // Vòng phát quang dưới chân
    ctx.fillStyle = tierColor;
    ctx.globalAlpha = 0.35 + Math.sin(time * 3) * 0.15;
    ctx.beginPath();
    ctx.ellipse(0, 4, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tia sáng chiếu thẳng lên trời cho đồ Siêu Hiếm trở lên
    if (tier === 'super_rare' || tier === 'supreme' || tier === 'god' || tier==='ancient') {
      const gradient = ctx.createLinearGradient(0, 0, 0, -40);
      gradient.addColorStop(0, tierColor);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(-6, -45, 12, 45);
    }

    ctx.globalAlpha = 1.0;

    // 2. Icon vật phẩm lơ lửng nhấp nhô
    ctx.translate(0, -10 + floatBob);

    // Hòm đồ / vũ khí mini
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 1.8;

    if (item.slot === 'potion') {
      ctx.fillStyle = '#eb5368'; ctx.beginPath(); ctx.roundRect(-6,-5,12,14,4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f4d4a1'; ctx.fillRect(-3,-9,6,5);
      ctx.fillStyle = '#fff0e5'; ctx.fillRect(-1,-2,2,7); ctx.fillRect(-3,0,6,2);
    } else if (item.slot === 'weapon') {
      ctx.save();ctx.scale(.45,.45);ctx.translate(-15,0);ctx.rotate(-.65);
      window.GameRenderer.WeaponAnimations.drawWeapon(ctx,item.data||item);
      ctx.restore();
    } else {
      // Icon áo giáp/mũ
      ctx.fillStyle = tierColor;
      ctx.beginPath();
      ctx.roundRect(-7, -7, 14, 14, 4);
      ctx.fill();
      ctx.stroke();
    }

    // Nhãn tên vật phẩm nổi
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 3;
    ctx.fillText(item.name, 0, -12);
    ctx.shadowBlur = 0;

    ctx.restore();
  }
};
