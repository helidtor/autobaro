/**
 * proceduralPawn.js - Hệ thống tạo hình Pawn đa dạng chuẩn RimWorld Cartoon
 * (Nam/Nữ, Già/Trẻ, Tóc, Râu, Nếp nhăn, Trang phục khởi đầu, Biểu cảm động)
 */
window.GameRenderer = window.GameRenderer || {};

window.GameRenderer.ProceduralPawn = {
  // Tạo hồ sơ ngoại hình ngẫu nhiên phong phú cho mỗi Pawn
  generateAppearance: function(nameSeed) {
    const isFemale = Math.random() < 0.45;
    const ageRoll = Math.random();
    let ageGroup = 'young'; // young: 50%, middle: 35%, elder: 15%
    if (ageRoll > 0.85) ageGroup = 'elder';
    else if (ageRoll > 0.50) ageGroup = 'middle';

    const skinTones = ['#ffdbac', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#fce2c4'];
    const skinColor = skinTones[Math.floor(Math.random() * skinTones.length)];

    let hairColors = ['#2c3e50', '#4a3728', '#8b5a2b', '#d35400', '#f39c12', '#222f3e'];
    if (ageGroup === 'elder') {
      hairColors = ['#ecf0f1', '#bdc3c7', '#dcdde1', '#e4e7eb'];
    }
    const hairColor = hairColors[Math.floor(Math.random() * hairColors.length)];

    const hairStyles = isFemale
      ? ['ponytail', 'twin_tails', 'long_flow', 'bob_cut', 'braids', 'short_fem']
      : ['short_crop', 'spiky', 'topknot', 'messy_warrior', 'side_part', ageGroup === 'elder' ? 'balding' : 'buzz_cut'];
    const hairStyle = hairStyles[Math.floor(Math.random() * hairStyles.length)];

    // Râu ria cho nam giới trung niên và lão làng
    let beardStyle = 'none';
    if (!isFemale) {
      if (ageGroup === 'elder') {
        beardStyle = Math.random() < 0.75 ? (Math.random() < 0.5 ? 'long_sage_beard' : 'full_bushy_beard') : 'none';
      } else if (ageGroup === 'middle') {
        beardStyle = Math.random() < 0.6 ? (Math.random() < 0.5 ? 'stubble' : 'goatee') : 'none';
      }
    }

    const startingAttires = [
      { name: 'Thợ Săn Rừng', color: '#795548', accent: '#33691e', style: 'hunter' },
      { name: 'Đạo Sĩ Cổ Tự', color: '#3742fa', accent: '#f1f2f6', style: 'monk' },
      { name: 'Đấu Sĩ Nô Lệ', color: '#d35400', accent: '#7f8c8d', style: 'gladiator' },
      { name: 'Du Mục Sa Mạc', color: '#f39c12', accent: '#c0392b', style: 'nomad' },
      { name: 'Lãng Khách Vô Danh', color: '#2f3542', accent: '#747d8c', style: 'wanderer' }
    ];
    const attire = startingAttires[Math.floor(Math.random() * startingAttires.length)];

    const appearance = {
      isFemale: isFemale,
      ageGroup: ageGroup,
      skinColor: skinColor,
      hairColor: hairColor,
      hairStyle: hairStyle,
      beardStyle: beardStyle,
      attire: attire,
      eyeColor: '#2f3542',
      heightScale: isFemale ? 0.94 : (ageGroup === 'elder' ? 0.96 : 1.0),
      widthScale: isFemale ? 0.92 : 1.0
    };
    return window.GameRenderer.PawnSkins ? window.GameRenderer.PawnSkins.apply(appearance, nameSeed) : appearance;
  },

  // Hàm vẽ Pawn chính bằng Canvas 2D
  render: function(ctx, pawn, appearance, isSelected) {
    if (!pawn || !pawn.isAlive) return;
    const time = performance.now() / 1000;
    const zoom = window.GameEngine.Camera?.zoom || 1;
    // Nhìn toàn bản đồ thì mỗi pawn chỉ còn vài pixel; bỏ aura bóng đổ và da procedural.
    if (zoom < 0.45 && !isSelected) {
      ctx.save();
      ctx.fillStyle = pawn.level >= 15 ? '#9d78ff' : pawn.level >= 10 ? '#ffc832' : (appearance?.clothColor || '#d7c4a3');
      ctx.beginPath(); ctx.arc(pawn.x, pawn.y - 8, pawn.isDemonKing ? 16 : 7, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return;
    }
    const isMoving = Math.hypot(pawn.vx || 0, pawn.vy || 0) > 1.5;

    if(pawn.level>=10)this.renderAura(ctx,pawn,time);
    this.renderMythic(ctx,pawn,time);
    // Vòng chọn mục tiêu nếu được click
    if (isSelected) {
      ctx.save();
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(pawn.x, pawn.y + 8, 18, 9, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    this.renderPawn(ctx, pawn, time, pawn.aimAngle || 0, isMoving);
    const relics=window.GameEntities.RelicSystem.equipment(pawn).filter(d=>d.tier==='ancient');
    if(relics.length){ctx.save();ctx.strokeStyle='#ffd166';ctx.lineWidth=3.5;ctx.shadowColor='#f6bf57';ctx.shadowBlur=8;ctx.beginPath();ctx.roundRect(pawn.x-16,pawn.y-38,32,46,13);ctx.stroke();
      for(let i=0;i<6;i++){ctx.fillStyle=relics[i%relics.length].color;ctx.globalAlpha=.5+Math.sin(time*4+i)*.3;ctx.beginPath();ctx.arc(pawn.x+Math.cos(time+i)*24,pawn.y-17+Math.sin(time+i)*30,2,0,Math.PI*2);ctx.fill();}ctx.restore();}
    if(pawn.boots){ctx.save();ctx.fillStyle='#ffbf78';ctx.strokeStyle='#ffd166';ctx.lineWidth=2;for(const side of [-1,1]){ctx.beginPath();ctx.roundRect(pawn.x+side*7-4,pawn.y+2,8,7,2);ctx.fill();ctx.stroke();}ctx.restore();}
    this.renderOverhead(ctx, pawn);
  },

  renderOverhead: function(ctx, pawn) {
    ctx.save();
    const barW = 28, barH = 3.5, barY = pawn.y - 64;
    const hpPct = Math.max(0, Math.min(1, pawn.currentHp / pawn.maxHp));
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(pawn.x - barW / 2, barY, barW, barH);
    ctx.fillStyle = hpPct > 0.5 ? '#2ecc71' : (hpPct > 0.25 ? '#f1c40f' : '#e74c3c');
    ctx.fillRect(pawn.x - barW / 2, barY, barW * hpPct, barH);
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.textAlign = 'center';
    if (pawn.meditating) { ctx.fillStyle = '#9ad7ff'; ctx.fillText('Thiền', pawn.x, barY - 22); }
    if (pawn.isDemonKing) { ctx.fillStyle = '#f0c984'; ctx.fillText('Quỷ Vương', pawn.x, barY - 12); }
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${pawn.name} (Lv.${pawn.level})`, pawn.x, barY - 3);
    ctx.restore();
  },

  renderMythic(ctx,pawn,time){
    const ids=pawn.mythics;if(!ids?.length)return;
    const def=(window.GameData.MythicSkills||[]).find(s=>s.id===ids[0]);
    const s=pawn.mythicState||{};
    ctx.save();
    ctx.strokeStyle=def?.color||'#e6c15a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(pawn.x,pawn.y-16,26,0,Math.PI*2);ctx.stroke();
    if(s.stone==='stone'){ctx.fillStyle='rgba(160,168,156,.45)';ctx.beginPath();ctx.arc(pawn.x,pawn.y-16,18,0,Math.PI*2);ctx.fill();}
    const zone=s.array;if(zone&&zone.until>(window.GameManager?.matchTime||0)){ctx.strokeStyle='#d4b48a';ctx.beginPath();ctx.arc(zone.x,zone.y,100,0,Math.PI*2);ctx.stroke();}
    const chained=[...(window.GameManager?.pawns||[]),...(window.GameManager?.monsters||[])].find(e=>e.isAlive&&e.id===s.chainId);
    if(chained){ctx.strokeStyle='#c9b6a1';ctx.beginPath();ctx.moveTo(pawn.x,pawn.y-16);ctx.lineTo(chained.x,chained.y-16);ctx.stroke();}
    const pts=s.trailPts||[];
    if(pts.length>1){ctx.strokeStyle='#ffe56a';ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(const p of pts)ctx.lineTo(p.x,p.y);ctx.stroke();}
    if(pawn.action?.kind==='attack'&&pawn.action.wrath){ctx.strokeStyle='#fff1a8';ctx.lineWidth=3;ctx.beginPath();ctx.arc(pawn.x,pawn.y-16,32,0,Math.PI*1.4);ctx.stroke();}
    ctx.restore();
  },
  renderAura(ctx,p,time){
    const ultimate=p.level>=15,color=ultimate?'#9d78ff':'#ffc832',edge=ultimate?'#30c9ff':'#ffe96a';
    const pulse=1+Math.sin(time*4)*.045;
    ctx.save();ctx.translate(p.x,p.y-17);ctx.scale(pulse,pulse);
    const glow=ctx.createRadialGradient(0,0,12,0,0,52);
    glow.addColorStop(0,ultimate?'rgba(158,101,255,.08)':'rgba(255,215,55,.08)');
    glow.addColorStop(.55,ultimate?'rgba(117,156,255,.22)':'rgba(255,215,55,.22)');glow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=glow;ctx.beginPath();ctx.ellipse(0,-2,45,60,0,0,Math.PI*2);ctx.fill();
    // Tapered curved wisps: bright cores stay outside the face/body silhouette.
    for(let i=0;i<5;i++){
      const angle=i*Math.PI*2/5+Math.sin(time*.8+i)*.12,flow=(time*.65+i*.17)%1;
      ctx.save();ctx.rotate(angle);ctx.translate(32+flow*7,0);ctx.scale(1,.8+flow*.3);
      ctx.globalAlpha=.45+Math.sin(flow*Math.PI)*.5;ctx.shadowColor=edge;ctx.shadowBlur=10;
      ctx.beginPath();ctx.moveTo(0,19);ctx.bezierCurveTo(13,9,13,-8,0,-26);
      ctx.bezierCurveTo(3,-9,5,0,-4,7);ctx.bezierCurveTo(-10,12,-5,18,0,19);ctx.closePath();
      ctx.fillStyle=color;ctx.fill();ctx.lineWidth=1.3;ctx.strokeStyle=edge;ctx.stroke();
      ctx.shadowBlur=3;ctx.fillStyle='#fffdf2';ctx.beginPath();ctx.moveTo(0,16);
      ctx.bezierCurveTo(9,6,10,-4,2,-19);ctx.bezierCurveTo(6,-2,1,6,-3,10);ctx.quadraticCurveTo(-3,14,0,16);ctx.fill();ctx.restore();
    }
    if(ultimate){
      // Broken jagged arcs with a white hot center and cyan/violet glow.
      const beat=Math.floor(time*9);
      ctx.lineJoin='miter';ctx.lineCap='round';
      for(let i=0;i<3;i++){
        const start=i*Math.PI*2/3+Math.sin(beat*1.7+i)*.18;
        ctx.beginPath();
        for(let j=0;j<9;j++){
          const a=start+j*.12,r=36+(j%2?3+Math.sin(j*2.7+i+beat)*5:-2+Math.sin(j*1.3+i+beat)*3),x=Math.cos(a)*r,y=Math.sin(a)*r*1.4;
          if(j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
        }
        ctx.globalAlpha=.8;ctx.shadowColor=color;ctx.shadowBlur=13;ctx.strokeStyle=color;ctx.lineWidth=6;ctx.stroke();
        ctx.shadowColor=edge;ctx.shadowBlur=6;ctx.strokeStyle=edge;ctx.lineWidth=3.8;ctx.stroke();
        ctx.shadowBlur=0;ctx.strokeStyle='#ffffff';ctx.lineWidth=2.2;ctx.stroke();
      }
    }
    ctx.restore();
  },

  renderPawn: function(ctx, pawn, time, aimAngle, isMoving) {
    const app = pawn.appearance || this.generateAppearance(pawn.id);
    pawn.appearance = app;

    ctx.save();
    ctx.translate(pawn.x, pawn.y);

    // 1. Squash & Stretch Animation khi di chuyển
    let walkBob = 0;
    let walkSquashX = 1.0;
    let walkSquashY = 1.0;
    let tiltAngle = 0;

    if (isMoving) {
      const stepFreq = 14; // tần số bước chân
      walkBob = Math.abs(Math.sin(time * stepFreq)) * 5;
      walkSquashX = 1.0 + Math.sin(time * stepFreq) * 0.08;
      walkSquashY = 1.0 - Math.sin(time * stepFreq) * 0.08;
      tiltAngle = (pawn.vx || 0) * 0.003; // hơi nghiêng theo hướng chạy
    }

    // Hiệu ứng đau đớn khi bị trúng đòn (hit flash)
    if (pawn.hitFlashTimer && pawn.hitFlashTimer > 0) {
      ctx.globalAlpha = 0.85;
      // giật lùi nhẹ
    }

    const action = pawn.action;
    if (action) {
      const pose = window.GameRenderer.WeaponAnimations.pose(pawn);
      const facing = Math.cos(action.angle);
      if (action.kind === 'dodge') { walkSquashY=.7;walkSquashX=1.15;tiltAngle=facing*.3; }
      else if (action.kind === 'block') {walkSquashY=.9;tiltAngle=-facing*.12;}
      else if (['attack','skill'].includes(action.kind)) {
        const lean = action.released ? (1-pose.recover)*6 : -pose.wind*3;
        ctx.translate(Math.cos(action.angle)*lean,Math.sin(action.angle)*lean*.5);
        tiltAngle=facing*lean*.025;walkSquashY=action.released?1.04:.96;
      }
    }
    if(pawn.stealthTimer>0||pawn.isHiding)ctx.globalAlpha=.5;
    if(pawn.hitFlashTimer>0)ctx.translate(-Math.cos(aimAngle)*3,0);
    ctx.rotate(tiltAngle);

    // 2. Bóng chân (Shadow)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 14 * app.widthScale, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dịch chuyển theo nhịp nhảy bước
    ctx.translate(0, -walkBob);
    ctx.scale(app.widthScale * walkSquashX, app.heightScale * walkSquashY);

    // 3. Thân viên nhộng (Capsule Body)
    const bodyHeight = 22;
    const bodyRadius = 12;
    const headRadius = 13;
    const headY = -bodyHeight - headRadius + 4;
    const skinCtx = { y: headY, r: headRadius, t: time };
    const Skins = window.GameRenderer.PawnSkins;
    if (app.skin) Skins.draw(ctx, app, 'back', skinCtx);

    ctx.lineWidth = 2.0;
    ctx.strokeStyle = '#1e272e'; // Viền đen hoạt họa cartoon đậm nét
    ctx.fillStyle = pawn.armor ? this.getArmorColor(pawn.armor) : app.attire.color;

    // Vẽ hình viên nhộng
    ctx.beginPath();
    ctx.roundRect(-bodyRadius, -bodyHeight, bodyRadius * 2, bodyHeight + 6, [10, 10, 8, 8]);
    ctx.fill();
    ctx.stroke();

    // Họa tiết trang phục khởi đầu nếu chưa có giáp
    if (!pawn.armor) {
      ctx.fillStyle = app.attire.accent;
      if (app.attire.style === 'hunter') {
        // Vạt áo lông chéo
        ctx.beginPath();
        ctx.moveTo(-bodyRadius + 2, -bodyHeight + 4);
        ctx.lineTo(bodyRadius - 2, -4);
        ctx.lineTo(bodyRadius - 2, 2);
        ctx.lineTo(-bodyRadius + 2, -bodyHeight + 10);
        ctx.fill();
      } else if (app.attire.style === 'nomad') {
        // Khăn quàng cổ
        ctx.fillStyle = app.attire.accent;
        ctx.beginPath();
        ctx.arc(0, -bodyHeight + 2, 8, 0, Math.PI);
        ctx.fill();
      } else if (app.attire.style === 'gladiator') {
        // Băng quấn ngực
        ctx.fillRect(-bodyRadius + 2, -bodyHeight + 6, bodyRadius * 2 - 4, 4);
      }
    }

    if (app.skin && !pawn.armor) Skins.draw(ctx, app, 'outfit', skinCtx);

    // 4. Đầu nhân vật (Head)
    ctx.fillStyle = app.skinColor;
    ctx.beginPath();
    ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 5. Tóc phía sau / Râu (nếu có)
    if (app.beardStyle !== 'none') {
      this.renderBeard(ctx, app, headY, headRadius);
    }

    // 6. Khuôn mặt & Biểu cảm động (Eyes, Mouth, Eyebrows)
    this.renderFacialExpression(ctx, pawn, app, headY, aimAngle);
    if (app.skin) Skins.draw(ctx, app, 'face', skinCtx);

    // 7. Nếp nhăn lão làng (Wrinkles)
    if (app.ageGroup === 'elder') {
      ctx.strokeStyle = 'rgba(74, 55, 40, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-headRadius + 4, headY - 2);
      ctx.lineTo(-headRadius + 7, headY - 2);
      ctx.moveTo(headRadius - 7, headY - 2);
      ctx.lineTo(headRadius - 4, headY - 2);
      ctx.stroke();
    }

    // 8. Tóc phía trước hoặc Mũ (Helmet Paperdoll)
    if (pawn.helmet) {
      this.renderHelmet(ctx, pawn.helmet, headY, headRadius);
    } else if (app.skin) {
      Skins.draw(ctx, app, 'hair', skinCtx);
    } else {
      this.renderHair(ctx, app, headY, headRadius);
    }

    // 9. Hai bàn tay lơ lửng & Vũ khí (Floating Hands & Weapons)
    if (window.GameRenderer.WeaponAnimations) {
      window.GameRenderer.WeaponAnimations.renderWeaponAndHands(ctx, pawn, pawn.weapon, pawn.attackState, aimAngle, time);
    }

    ctx.restore();
  },

  // Vẽ biểu cảm khuôn mặt sống động phản ánh cảm xúc
  renderFacialExpression: function(ctx, pawn, app, headY, aimAngle) {
    const fear = pawn.fear || 0;
    const confidence = pawn.confidence || 0;
    const despair = pawn.despair || 0;
    const isBerserk = pawn.isBerserk;

    // Hướng nhìn mắt theo góc ngắm
    const lookOffsetX = Math.cos(aimAngle) * 3.0;
    const lookOffsetY = Math.sin(aimAngle) * 2.0;

    const eyeSpacing = 4.5;
    const eyeY = headY - 1;

    ctx.fillStyle = isBerserk ? '#ff4757' : app.eyeColor;
    ctx.strokeStyle = '#2f3542';
    ctx.lineWidth = 1.2;

    if (isBerserk) {
      // Mắt đỏ rực cuồng nộ
      ctx.beginPath();
      ctx.arc(-eyeSpacing + lookOffsetX, eyeY + lookOffsetY, 2.5, 0, Math.PI * 2);
      ctx.arc(eyeSpacing + lookOffsetX, eyeY + lookOffsetY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Miệng gầm thét
      ctx.fillStyle = '#ff4757';
      ctx.beginPath();
      ctx.ellipse(0, headY + 6, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (pawn.anger>55 || pawn.hitFlashTimer>0 || despair>65) {
      ctx.beginPath();ctx.moveTo(-8,headY-2);ctx.lineTo(-4,headY);ctx.moveTo(8,headY-2);ctx.lineTo(4,headY);ctx.stroke();
      ctx.beginPath();ctx.arc(0,headY+8,3,Math.PI,Math.PI*2);ctx.stroke();
    } else if (fear > 70) {
      // Sợ hãi: Mắt to tròn xoe, miệng há chữ O run rẩy
      ctx.beginPath();
      ctx.arc(-eyeSpacing + lookOffsetX, eyeY + lookOffsetY, 3.2, 0, Math.PI * 2);
      ctx.arc(eyeSpacing + lookOffsetX, eyeY + lookOffsetY, 3.2, 0, Math.PI * 2);
      ctx.fill();

      // Miệng chữ O
      ctx.fillStyle = '#2f3542';
      ctx.beginPath();
      ctx.arc(0, headY + 5, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (confidence > 75) {
      // Tự tin / Ngầu: Mắt hí bán nguyệt, miệng cười nhếch
      ctx.beginPath();
      ctx.arc(-eyeSpacing + lookOffsetX, eyeY + lookOffsetY, 2.0, 0, Math.PI);
      ctx.arc(eyeSpacing + lookOffsetX, eyeY + lookOffsetY, 2.0, 0, Math.PI);
      ctx.stroke();

      // Miệng cười nhếch mép
      ctx.beginPath();
      ctx.moveTo(-2, headY + 5);
      ctx.quadraticCurveTo(2, headY + 7, 3, headY + 3);
      ctx.stroke();
    } else if(pawn.action && ['attack','skill'].includes(pawn.action.kind)){
      ctx.beginPath();ctx.moveTo(-8,headY-4);ctx.lineTo(-3,headY-1);ctx.moveTo(8,headY-4);ctx.lineTo(3,headY-1);ctx.stroke();
      ctx.fillRect(-6+lookOffsetX,eyeY,2,2);ctx.fillRect(4+lookOffsetX,eyeY,2,2);
      ctx.beginPath();ctx.moveTo(-3,headY+6);ctx.lineTo(3,headY+6);ctx.stroke();
    } else {
      // Bình thường: 2 chấm tròn mắt, miệng thẳng
      ctx.beginPath();
      ctx.arc(-eyeSpacing + lookOffsetX, eyeY + lookOffsetY, 1.8, 0, Math.PI * 2);
      ctx.arc(eyeSpacing + lookOffsetX, eyeY + lookOffsetY, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Lông mi cho nữ
      if (app.isFemale) {
        ctx.beginPath();
        ctx.moveTo(-eyeSpacing + lookOffsetX - 2, eyeY + lookOffsetY - 2);
        ctx.lineTo(-eyeSpacing + lookOffsetX, eyeY + lookOffsetY - 3);
        ctx.moveTo(eyeSpacing + lookOffsetX, eyeY + lookOffsetY - 3);
        ctx.lineTo(eyeSpacing + lookOffsetX + 2, eyeY + lookOffsetY - 2);
        ctx.stroke();
      }

      // Miệng thẳng
      ctx.beginPath();
      ctx.moveTo(-2, headY + 5);
      ctx.lineTo(2, headY + 5);
      ctx.stroke();
    }
  },

  // Vẽ tóc các kiểu dáng
  renderHair: function(ctx, app, headY, headRadius) {
    ctx.fillStyle = app.hairColor;
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    switch (app.hairStyle) {
      case 'short_crop':
        ctx.arc(0, headY - 3, headRadius + 1.5, Math.PI * 0.9, Math.PI * 2.1);
        ctx.fill();
        ctx.stroke();
        break;
      case 'spiky':
        ctx.arc(0, headY - 2, headRadius + 2, Math.PI * 0.8, Math.PI * 2.2);
        ctx.lineTo(0, headY - headRadius - 6);
        ctx.lineTo(-5, headY - headRadius);
        ctx.fill();
        ctx.stroke();
        break;
      case 'ponytail':
        ctx.arc(0, headY - 2, headRadius + 1, Math.PI * 0.9, Math.PI * 2.1);
        ctx.fill();
        ctx.stroke();
        // Đuôi tóc vểnh ra sau
        ctx.beginPath();
        ctx.ellipse(-headRadius - 2, headY - 2, 7, 4, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
      case 'long_flow':
        ctx.arc(0, headY - 2, headRadius + 1.5, Math.PI * 0.8, Math.PI * 2.2);
        ctx.rect(-headRadius - 2, headY, 4, 14);
        ctx.rect(headRadius - 2, headY, 4, 14);
        ctx.fill();
        ctx.stroke();
        break;
      case 'balding':
        // Hói đỉnh đầu, có tóc hai bên
        ctx.beginPath();
        ctx.arc(-headRadius + 2, headY + 2, 4, 0, Math.PI * 2);
        ctx.arc(headRadius - 2, headY + 2, 4, 0, Math.PI * 2);
        ctx.fill();
        break;
      default:
        ctx.arc(0, headY - 2, headRadius + 1, Math.PI * 0.8, Math.PI * 2.2);
        ctx.fill();
        ctx.stroke();
        break;
    }
  },

  // Vẽ râu cho nam
  renderBeard: function(ctx, app, headY, headRadius) {
    ctx.fillStyle = app.hairColor;
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    if (app.beardStyle === 'long_sage_beard') {
      // Râu dài bạc phơ đạo sĩ
      ctx.moveTo(-headRadius + 4, headY + 6);
      ctx.quadraticCurveTo(0, headY + 22, headRadius - 4, headY + 6);
      ctx.fill();
      ctx.stroke();
    } else if (app.beardStyle === 'full_bushy_beard') {
      // Râu quai nón rậm rạp
      ctx.arc(0, headY + 5, headRadius - 1, 0, Math.PI);
      ctx.fill();
      ctx.stroke();
    } else if (app.beardStyle === 'goatee') {
      ctx.ellipse(0, headY + 9, 3, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  // Mũ Paperdoll
  renderHelmet: function(ctx, helmet, headY, headRadius) {
    ctx.strokeStyle = '#1e272e';
    ctx.lineWidth = 1.8;

    if (helmet.tier === 'common') {
      // Nón rơm rách
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.moveTo(0, headY - headRadius - 8);
      ctx.lineTo(headRadius + 8, headY - headRadius + 4);
      ctx.lineTo(-headRadius - 8, headY - headRadius + 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (helmet.tier === 'rare') {
      // Mũ thép lính tuần
      ctx.fillStyle = '#bdc3c7';
      ctx.beginPath();
      ctx.arc(0, headY - 3, headRadius + 2, Math.PI, Math.PI * 2);
      ctx.rect(-headRadius - 2, headY - 3, headRadius * 2 + 4, 4);
      ctx.fill();
      ctx.stroke();
    } else if (helmet.tier === 'super_rare') {
      // Mũ rồng có sừng
      ctx.fillStyle = '#2c3e50';
      ctx.beginPath();
      ctx.arc(0, headY - 3, headRadius + 2, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // 2 Sừng nhọn
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.moveTo(-headRadius, headY - 4);
      ctx.lineTo(-headRadius - 5, headY - 14);
      ctx.lineTo(-headRadius + 3, headY - 6);
      ctx.moveTo(headRadius, headY - 4);
      ctx.lineTo(headRadius + 5, headY - 14);
      ctx.lineTo(headRadius - 3, headY - 6);
      ctx.fill();
      ctx.stroke();
    } else if (helmet.tier === 'supreme' || helmet.tier === 'god' || helmet.tier==='ancient') {
      // Vương miện Viêm Đế đỏ rực hào quang
      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.moveTo(-headRadius - 2, headY - headRadius + 2);
      ctx.lineTo(-headRadius - 2, headY - headRadius - 6);
      ctx.lineTo(-headRadius / 2, headY - headRadius - 2);
      ctx.lineTo(0, headY - headRadius - 10);
      ctx.lineTo(headRadius / 2, headY - headRadius - 2);
      ctx.lineTo(headRadius + 2, headY - headRadius - 6);
      ctx.lineTo(headRadius + 2, headY - headRadius + 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  },

  getArmorColor: function(armor) {
    switch (armor.tier) {
      case 'ancient':return armor.color||'#c6a15c';
      case 'rare': return '#34495e';
      case 'super_rare': return '#575fcf';
      case 'supreme': return '#c0392b';
      case 'god': return '#2f3542';
      default: return '#7f8c8d';
    }
  }
};
