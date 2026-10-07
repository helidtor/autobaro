/**
 * monsterRenderer.js - Vẽ quái vật hoạt họa riêng biệt theo 5 Bậc (Không dùng hình học đơn điệu)
 * - Lâu la (Thỏ Gai, Goblin, Xương rỉ, Bọ cánh cứng...)
 * - Yêu thú (Heo gai sắt, Cóc nham thạch, Mãng xà đầm lầy...)
 * - Yêu tướng (Đao Phủ Golem, Naga, Thống lĩnh nhân mã...)
 * - Yêu vương (Viêm Ma Bạo Chúa, Cuồng bạo kim cương vương, Hydra 3 đầu...)
 * - Yêu thần (Ma Long Hư Không, Phượng Hoàng Thái Dương, Diêm La Vương...)
 */
window.GameRenderer = window.GameRenderer || {};

window.GameRenderer.MonsterRenderer = {
  render: function(ctx, monster, isSelected) {
    if (!monster || !monster.isAlive) return;
    const time = performance.now() / 1000;

    if (isSelected) {
      ctx.save();
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(monster.x, monster.y + 10, 22 * (monster.scale || 1.0), 10 * (monster.scale || 1.0), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    this.renderMonster(ctx, monster, time);
  },

  renderMonster: function(ctx, monster, time) {
    ctx.save();
    ctx.translate(monster.x, monster.y);

    const scale = monster.scale || 1.0;
    ctx.scale(scale, scale);

    // Bóng chân mờ
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nhịp thở / cử động idle
    const breathe = Math.sin(time * 3 + monster.id.charCodeAt(0)) * 2;
    ctx.translate(0, breathe);

    if (monster.action) {
      const a=monster.action, p=window.GameRenderer.WeaponAnimations.pose(monster);
      const lean=a.released ? (1-p.recover)*8 : -p.wind*5;
      ctx.translate(Math.cos(a.angle)*lean,Math.sin(a.angle)*lean*.4);
      ctx.rotate(Math.cos(a.angle)*lean*.025);
      ctx.scale(a.released?1.05:1-p.wind*.07,a.released?.95:1+p.wind*.06);
    }
    if(monster.hitFlashTimer>0)ctx.globalAlpha=.7;
    const type = (monster.visual && monster.visual.type) || 'beast';

    switch (type) {
      case 'beast': // Thỏ gai / sói
        this.renderSpikeHare(ctx, monster, time);
        break;
      case 'rat':
        this.renderRat(ctx, monster, time);
        break;
      case 'humanoid': // Goblin
        this.renderGoblin(ctx, monster, time);
        break;
      case 'skeleton':
        this.renderSkeleton(ctx, monster, time);
        break;
      case 'beetle':
        this.renderBeetle(ctx, monster, time);
        break;
      case 'boar': // Heo gai sắt
        this.renderBoar(ctx, monster, time);
        break;
      case 'toad': // Cóc nham thạch
        this.renderToad(ctx, monster, time);
        break;
      case 'serpent': // Mãng xà
        this.renderSerpent(ctx, monster, time);
        break;
      case 'golem': // Đao Phủ
        this.renderExecutionerGolem(ctx, monster, time);
        break;
      case 'centaur':
        this.renderCentaur(ctx, monster, time);
        break;
      case 'demon_lord': // Viêm Ma Bạo Chúa
        this.renderInfernalTyrant(ctx, monster, time);
        break;
      case 'titan_ape': // Kim Cương Vương
        this.renderTitanApe(ctx, monster, time);
        break;
      case 'three_headed_hydra': // Hydra 3 đầu
        this.renderHydra(ctx, monster, time);
        break;
      case 'void_dragon': // World Boss Ma Long Hư Không
        this.renderVoidDragon(ctx, monster, time);
        break;
      case 'death_god': this.renderDeathGod(ctx,monster,time);break;
      case 'ancient_world_tree': this.renderWorldTree(ctx,monster,time);break;
      case 'solar_phoenix': // Phượng Hoàng
        this.renderPhoenix(ctx, monster, time);
        break;
      default:
        this.renderGenericMonster(ctx, monster, time);
        break;
    }

    // Thanh máu quái vật
    this.renderMonsterHpBar(ctx, monster);

    ctx.restore();
  },

  renderDeathGod(ctx,m,time) {
    ctx.strokeStyle='#11282d';ctx.lineWidth=2.5;ctx.fillStyle='#243d43';
    ctx.beginPath();ctx.moveTo(-12,-26);ctx.lineTo(-25,12);ctx.quadraticCurveTo(0,23,25,12);ctx.lineTo(12,-26);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#d3e8df';ctx.beginPath();ctx.arc(0,-26,11,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#0d242c';ctx.fillRect(-7,-29,4,5);ctx.fillRect(3,-29,4,5);
    ctx.fillStyle='#57e7d4';ctx.beginPath();ctx.moveTo(-13,-34);ctx.lineTo(-15,-45);ctx.lineTo(-6,-39);ctx.lineTo(0,-49);ctx.lineTo(6,-39);ctx.lineTo(15,-45);ctx.lineTo(13,-34);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#7863ad';ctx.beginPath();ctx.roundRect(17,-19+Math.sin(time*3)*2,17,22,3);ctx.fill();ctx.stroke();
    ctx.strokeStyle='#bff6e8';ctx.lineWidth=1;ctx.strokeRect(20,-16,11,14);ctx.fillStyle='#e1e8bd';ctx.fillRect(24,-13,2,8);
    for(let i=0;i<3;i++){const a=time*.4+i*Math.PI*2/3;const x=Math.cos(a)*30,y=Math.sin(a)*12;
      ctx.fillStyle='#71e3d3';ctx.beginPath();ctx.moveTo(x-4,y);ctx.quadraticCurveTo(x-6,y-11,x,y-16);ctx.quadraticCurveTo(x+7,y-5,x+4,y);ctx.fill();}
  },
  renderWorldTree(ctx,m,time) {
    ctx.strokeStyle='#243d35';ctx.lineWidth=3;ctx.fillStyle='#68533e';
    ctx.beginPath();ctx.moveTo(-9,-30);ctx.lineTo(-12,2);ctx.lineTo(-28,15);ctx.lineTo(-9,9);ctx.lineTo(0,20);ctx.lineTo(8,9);ctx.lineTo(28,15);ctx.lineTo(12,2);ctx.lineTo(9,-30);ctx.closePath();ctx.fill();ctx.stroke();
    for(let i=0;i<5;i++){ctx.fillStyle=i%2?'#48764f':'#325941';ctx.beginPath();ctx.arc((i-2)*10,-37+Math.abs(i-2)*5,16,0,Math.PI*2);ctx.fill();ctx.stroke();}
    ctx.fillStyle='#adf6a5';ctx.fillRect(-7,-14,4,5);ctx.fillRect(3,-14,4,5);
    ctx.strokeStyle='#433728';ctx.beginPath();ctx.moveTo(-4,-3);ctx.lineTo(4,-3);ctx.stroke();
  },

  // 1. Thỏ Gai (Spike Hare)
  renderSpikeHare: function(ctx, monster, time) {
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#1e272e';

    // Thân thỏ tròn xoe
    ctx.fillStyle = monster.visual.bodyColor || '#ecf0f1';
    ctx.beginPath();
    ctx.arc(0, -6, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Gai nhọn trên lưng dựng đứng
    ctx.fillStyle = '#c0392b';
    for (let i = -8; i <= 8; i += 4) {
      ctx.beginPath();
      ctx.moveTo(i, -18);
      ctx.lineTo(i + 2, -26);
      ctx.lineTo(i + 4, -18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Tai dài rung rinh
    const earWiggle = Math.sin(time * 5) * 3;
    ctx.fillStyle = '#ecf0f1';
    ctx.beginPath();
    ctx.ellipse(-6, -24 + earWiggle, 4, 10, -0.2, 0, Math.PI * 2);
    ctx.ellipse(6, -24 - earWiggle, 4, 10, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Mắt đỏ lừ
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(-4, -6, 2.5, 0, Math.PI * 2);
    ctx.arc(4, -6, 2.5, 0, Math.PI * 2);
    ctx.fill();
  },

  // 2. Chuột Hầm Ngục (Dungeon Rat)
  renderRat: function(ctx, monster, time) {
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#1e272e';
    ctx.fillStyle = '#7f8c8d';

    // Thân thon dài
    ctx.beginPath();
    ctx.ellipse(0, -4, 15, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Đuôi dài ngoe nguẩy
    const tailWiggle = Math.sin(time * 8) * 8;
    ctx.strokeStyle = '#e056fd';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-15, -4);
    ctx.quadraticCurveTo(-24, -8 + tailWiggle, -30, -2 + tailWiggle);
    ctx.stroke();

    // Mắt vàng
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(8, -5, 2, 0, Math.PI * 2);
    ctx.fill();
  },

  // 3. Goblin Cầm Gậy
  renderGoblin: function(ctx, monster, time) {
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = '#1e272e';
    ctx.fillStyle = '#27ae60';

    // Thân
    ctx.beginPath();
    ctx.roundRect(-8, -12, 16, 18, 6);
    ctx.fill();
    ctx.stroke();

    // Đầu
    ctx.beginPath();
    ctx.arc(0, -18, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Tai nhọn hoắt
    ctx.beginPath();
    ctx.moveTo(-10, -18);
    ctx.lineTo(-20, -22);
    ctx.lineTo(-8, -12);
    ctx.moveTo(10, -18);
    ctx.lineTo(20, -22);
    ctx.lineTo(8, -12);
    ctx.fill();
    ctx.stroke();

    // Khúc gỗ cầm trên tay
    ctx.fillStyle = '#795548';
    ctx.fillRect(8, -26, 6, 22);
    ctx.strokeRect(8, -26, 6, 22);

    // Mắt cam gian manh
    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.arc(-3, -19, 2, 0, Math.PI * 2);
    ctx.arc(3, -19, 2, 0, Math.PI * 2);
    ctx.fill();
  },

  // 4. Khung Xương Rỉ Sét
  renderSkeleton: function(ctx, monster, time) {
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = '#2c3e50';
    ctx.fillStyle = '#bdc3c7';

    // Đầu lâu
    ctx.beginPath();
    ctx.arc(0, -20, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hốc mắt xanh lam ma mị
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(-3, -20, 2.5, 0, Math.PI * 2);
    ctx.arc(3, -20, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Lồng ngực sườn
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(0, 0);
    ctx.moveTo(-8, -8);
    ctx.lineTo(8, -8);
    ctx.moveTo(-7, -4);
    ctx.lineTo(7, -4);
    ctx.stroke();

    // Kiếm gãy rỉ sét
    ctx.strokeStyle = '#d35400';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(10, 2);
    ctx.lineTo(18, -14);
    ctx.stroke();
  },

  // 5. Bọ Cánh Cứng Bọc Giáp
  renderBeetle: function(ctx, monster, time) {
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = '#1e272e';
    ctx.fillStyle = '#16a085';

    // Thân mai bóng bẩy
    ctx.beginPath();
    ctx.arc(0, -6, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Sừng chữ Y nhô cao
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(0, -32);
    ctx.lineTo(-7, -39);
    ctx.moveTo(0, -32);
    ctx.lineTo(7, -39);
    ctx.stroke();
  },

  // 6. Heo Rừng Gai Bọc Sắt
  renderBoar: function(ctx, monster, time) {
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = '#1e272e';
    ctx.fillStyle = '#795548';

    // Thân vạm vỡ
    ctx.beginPath();
    ctx.ellipse(0, -8, 20, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Gai thép nhọn trên lưng phản quang
    ctx.fillStyle = '#bdc3c7';
    for (let i = -14; i <= 14; i += 6) {
      ctx.beginPath();
      ctx.moveTo(i, -20);
      ctx.lineTo(i + 3, -32);
      ctx.lineTo(i + 6, -20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Cặp nanh cong vút
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(14, -4);
    ctx.quadraticCurveTo(24, -12, 22, -18);
    ctx.lineTo(16, -6);
    ctx.fill();
    ctx.stroke();
  },

  // 7. Cóc Lửa Nham Thạch
  renderToad: function(ctx, monster, time) {
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = '#1e272e';
    ctx.fillStyle = '#c0392b';

    // Thân cóc bè to
    ctx.beginPath();
    ctx.ellipse(0, -6, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Mụn nham thạch phát sáng
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.arc(-8, -10, 4, 0, Math.PI * 2);
    ctx.arc(6, -12, 5, 0, Math.PI * 2);
    ctx.arc(0, -4, 3, 0, Math.PI * 2);
    ctx.fill();

    // Mắt lồi vàng rực
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(-10, -16, 4, 0, Math.PI * 2);
    ctx.arc(10, -16, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  },

  // 8. Mãng Xà Đầm Lầy
  renderSerpent: function(ctx, monster, time) {
    ctx.lineWidth = 3.0;
    ctx.strokeStyle = '#16a085';

    // Thân uốn lượn
    const wiggle = Math.sin(time * 6) * 6;
    ctx.beginPath();
    ctx.moveTo(-18, 4);
    ctx.quadraticCurveTo(-8, -12 + wiggle, 0, -4);
    ctx.quadraticCurveTo(10, 6 - wiggle, 18, -12);
    ctx.stroke();

    // Đầu rắn bành mang
    ctx.fillStyle = '#8e44ad';
    ctx.beginPath();
    ctx.arc(18, -12, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  },

  // 9. Đao Phủ Đoạt Mệnh (Executioner Golem)
  renderExecutionerGolem: function(ctx, monster, time) {
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#1e272e';

    // Thân đá khổng lồ nứt nẻ
    ctx.fillStyle = '#2f3542';
    ctx.beginPath();
    ctx.roundRect(-22, -36, 44, 40, 8);
    ctx.fill();
    ctx.stroke();

    // Khe nứt dung nham đỏ rực
    ctx.strokeStyle = '#ff4757';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-12, -30);
    ctx.lineTo(-4, -18);
    ctx.lineTo(8, -24);
    ctx.stroke();

    // Rìu đao phủ khổng lồ kéo lê trên đất
    ctx.fillStyle = '#ff4757';
    ctx.beginPath();
    ctx.moveTo(24, -45);
    ctx.lineTo(44, -20);
    ctx.lineTo(24, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Mắt đỏ cam
    ctx.fillStyle = '#ffa502';
    ctx.beginPath();
    ctx.arc(-8, -26, 3, 0, Math.PI * 2);
    ctx.arc(8, -26, 3, 0, Math.PI * 2);
    ctx.fill();
  },

  renderCentaur: function(ctx, monster, time) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1e272e';
    ctx.fillStyle = monster.visual.bodyColor || '#795548';
    ctx.beginPath();
    ctx.ellipse(0, -8, 24, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (const x of [-18, -8, 10, 20]) {
      const stride = Math.sin(time * 6 + x) * 3;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stride, 13);
      ctx.stroke();
    }
    ctx.fillStyle = '#bdc3c7';
    ctx.beginPath();
    ctx.roundRect(6, -35, 15, 25, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#d9a066';
    ctx.beginPath();
    ctx.arc(14, -42, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(25, 5);
    ctx.lineTo(25, -55);
    ctx.stroke();
    ctx.fillStyle = '#ecf0f1';
    ctx.beginPath();
    ctx.moveTo(21, -51);
    ctx.lineTo(25, -64);
    ctx.lineTo(29, -51);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  },

  // 10. Viêm Ma Bạo Chúa (Infernal Tyrant - Yêu Vương)
  renderInfernalTyrant: function(ctx, monster, time) {
    ctx.lineWidth = 3.0;
    ctx.strokeStyle = '#1e272e';

    // Thân ma quỷ rực lửa
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.roundRect(-30, -50, 60, 56, 12);
    ctx.fill();
    ctx.stroke();

    // Hào quang lửa bập bùng xung quanh
    const flameSize = Math.sin(time * 8) * 4;
    ctx.fillStyle = 'rgba(243, 156, 18, 0.4)';
    ctx.beginPath();
    ctx.arc(0, -25, 42 + flameSize, 0, Math.PI * 2);
    ctx.fill();

    // Cặp sừng quỷ cong vút
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.moveTo(-20, -48);
    ctx.quadraticCurveTo(-38, -75, -28, -85);
    ctx.lineTo(-14, -50);
    ctx.moveTo(20, -48);
    ctx.quadraticCurveTo(38, -75, 28, -85);
    ctx.lineTo(14, -50);
    ctx.fill();
    ctx.stroke();

    // Cây Búa Lửa Nham Thạch
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(32, -60, 18, 28);
    ctx.strokeRect(32, -60, 18, 28);
  },

  // 11. Cuồng Bạo Kim Cương Vương (Primal Gorilla Sovereign - Yêu Vương)
  renderTitanApe: function(ctx, monster, time) {
    ctx.lineWidth = 3.0;
    ctx.strokeStyle = '#1e272e';
    ctx.fillStyle = '#2d3436';

    // Thân khỉ đột khổng lồ
    ctx.beginPath();
    ctx.ellipse(0, -30, 36, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hai cánh tay cuồn cuộn cơ bắp
    ctx.beginPath();
    ctx.ellipse(-38, -18, 14, 24, 0.2, 0, Math.PI * 2);
    ctx.ellipse(38, -18, 14, 24, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Ngực xám bạc rung chuyển
    ctx.fillStyle = '#636e72';
    ctx.beginPath();
    ctx.arc(-10, -32, 12, 0, Math.PI * 2);
    ctx.arc(10, -32, 12, 0, Math.PI * 2);
    ctx.fill();
  },

  // 12. Thanh Xà Đế Vương (Emerald Hydra - 3 đầu)
  renderHydra: function(ctx, monster, time) {
    ctx.lineWidth = 3.0;
    ctx.strokeStyle = '#1e272e';
    ctx.fillStyle = '#00b894';

    // Thân chính
    ctx.beginPath();
    ctx.ellipse(0, -12, 28, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 3 Đầu rắn uốn lượn riêng biệt
    const angles = [-0.6, 0, 0.6];
    angles.forEach((ang, idx) => {
      const wiggle = Math.sin(time * 4 + idx * 2) * 6;
      ctx.save();
      ctx.translate(0, -16);
      ctx.rotate(ang);
      ctx.strokeStyle = '#00b894';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -35 + wiggle);
      ctx.stroke();

      // Đầu rắn
      ctx.fillStyle = '#fdcb6e';
      ctx.beginPath();
      ctx.arc(0, -35 + wiggle, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
  },

  // 13. Thái Cổ Hỗn Độn Ma Long (Chaos Void Drake - World Boss)
  renderVoidDragon: function(ctx, monster, time) {
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#1e272e';

    // Đôi cánh hư không khổng lồ đập nhẹ
    const wingFlap = Math.sin(time * 3) * 12;
    ctx.fillStyle = '#341f97';
    ctx.beginPath();
    ctx.moveTo(-20, -40);
    ctx.lineTo(-80, -90 + wingFlap);
    ctx.lineTo(-60, -20);
    ctx.closePath();
    ctx.moveTo(20, -40);
    ctx.lineTo(80, -90 + wingFlap);
    ctx.lineTo(60, -20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Thân rồng phủ vảy tím phát quang
    ctx.fillStyle = '#5f27cd';
    ctx.beginPath();
    ctx.roundRect(-35, -60, 70, 65, 16);
    ctx.fill();
    ctx.stroke();

    // 4 Sừng rồng hung tợn
    ctx.fillStyle = '#ee5253';
    ctx.beginPath();
    ctx.moveTo(-24, -60);
    ctx.lineTo(-44, -95);
    ctx.lineTo(-14, -65);
    ctx.moveTo(24, -60);
    ctx.lineTo(44, -95);
    ctx.lineTo(14, -65);
    ctx.fill();
    ctx.stroke();

    // Lửa tím hư không bập bùng ở miệng
    ctx.fillStyle = 'rgba(255, 159, 243, 0.7)';
    ctx.beginPath();
    ctx.arc(0, -30, 18, 0, Math.PI * 2);
    ctx.fill();
  },

  // 14. Viêm Đế Phượng Hoàng (Eternal Solar Phoenix - World Boss)
  renderPhoenix: function(ctx, monster, time) {
    const wingFlap = Math.sin(time * 6) * 16;
    ctx.fillStyle = '#e17055';
    ctx.strokeStyle = '#d63031';
    ctx.lineWidth = 2.5;

    // Cánh lửa rực rỡ
    ctx.beginPath();
    ctx.moveTo(-10, -30);
    ctx.quadraticCurveTo(-70, -80 + wingFlap, -85, -20);
    ctx.lineTo(-20, -20);
    ctx.moveTo(10, -30);
    ctx.quadraticCurveTo(70, -80 + wingFlap, 85, -20);
    ctx.lineTo(20, -20);
    ctx.fill();
    ctx.stroke();

    // Thân phượng hoàng vàng rực
    ctx.fillStyle = '#fdcb6e';
    ctx.beginPath();
    ctx.ellipse(0, -30, 18, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  },

  renderGenericMonster: function(ctx, monster, time) {
    ctx.fillStyle = (monster.visual && monster.visual.bodyColor) || '#7f8c8d';
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -10, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  },

  // Thanh máu hiển thị trên đầu quái
  renderMonsterHpBar: function(ctx, monster) {
    const hpPct = Math.max(0, monster.currentHp / monster.maxHp);
    const barWidth = 34;
    const barHeight = 4.5;
    const barY = -35 * (monster.scale || 1.0);

    // Nền đen
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(-barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2);

    // Máu đỏ / vàng
    ctx.fillStyle = monster.tier >= 4 ? '#e74c3c' : (monster.tier === 3 ? '#e67e22' : '#2ecc71');
    ctx.fillRect(-barWidth / 2, barY, barWidth * hpPct, barHeight);

    // Viền trắng nếu là Boss
    if (monster.tier >= 4) {
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 1;
      ctx.strokeRect(-barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2);
    }
  }
};
