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
    if (!monster || !monster.isAlive || monster.isSplit) return;
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

    const art = window.GameRenderer.BossArt[type] || window.GameRenderer.MinionArt[type];
    if (art) art(ctx, monster, time);
    else if (type.startsWith('primordial_')) this.renderAncient(ctx, monster, time);
    else this.renderGenericMonster(ctx, monster, time);

    // Thanh máu quái vật
    this.renderMonsterHpBar(ctx, monster);

    ctx.restore();
  },

  renderAncient(ctx,m,time){
    const kind=m.ancientKind,phase=m.phase||m.ancientOwner?.phase||1,color=m.ancientDef?.color||'#bd93f9',pulse=.6+Math.sin(time*3)*.3;
    const poly=(points,fill)=>{ctx.fillStyle=fill;ctx.strokeStyle='#201e2c';ctx.lineWidth=2;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();ctx.stroke();};
    const oval=(x,y,rx,ry,fill)=>{ctx.fillStyle=fill;ctx.strokeStyle='#241b30';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.stroke();};
    const line=(x,y,tx,ty,stroke,width=2)=>{ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(tx,ty);ctx.stroke();};
    ctx.save();ctx.globalAlpha=.2;ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,10,37,14,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    const glow=(x,y,r,c,a=.5)=>{const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,c);g.addColorStop(1,'rgba(0,0,0,0)');ctx.save();ctx.globalAlpha=a;ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore();};
    const lin=(y0,y1,c0,c1)=>{const g=ctx.createLinearGradient(0,y0,0,y1);g.addColorStop(0,c0);g.addColorStop(1,c1);return g;};
    if(kind==='mirror'){
      const p2=phase===2,frame=p2?'#c06a9a':'#d9c6ff',crack=p2?'#ff6aa8':'#f4eaff';
      glow(0,-28,44,p2?'#ff4f9a':'#a98cff',.28);
      ctx.save();ctx.beginPath();ctx.ellipse(0,-28,25,41,0,0,Math.PI*2);ctx.fillStyle=lin(-70,12,p2?'rgba(120,60,110,.55)':'rgba(190,170,255,.4)',p2?'rgba(40,20,50,.6)':'rgba(90,70,150,.4)');ctx.fill();ctx.clip();
      ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=4;const gl=((time*.6)%1)*90-45;ctx.beginPath();ctx.moveTo(gl-12,-70);ctx.lineTo(gl+16,10);ctx.stroke();
      ctx.strokeStyle=crack;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-20,-52);ctx.lineTo(-6,-40);ctx.lineTo(-12,-24);ctx.moveTo(-6,-40);ctx.lineTo(8,-46);ctx.lineTo(22,-60);ctx.moveTo(14,-8);ctx.lineTo(4,-18);ctx.lineTo(12,-30);ctx.stroke();ctx.restore();
      ctx.strokeStyle='#241b30';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(0,-28,25,41,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=frame;ctx.lineWidth=2.5;ctx.stroke();
      poly([[-5,-72],[0,-80],[5,-72],[0,-66]],frame);poly([[-5,13],[0,19],[5,13],[0,8]],frame);
      for(let i=0;i<8;i++){const a=time*.35+i*Math.PI/4,x=Math.cos(a)*38,y=-26+Math.sin(a)*34,s=3.5+i%3*1.2;poly([[x-s*.6,y-s*1.6],[x+s*.9,y-s*.3],[x+s*.4,y+s*1.5],[x-s,y+s*.4]],i%2?(p2?'#d0709f':'#a98fd6'):(p2?'#8a4a86':'#cdb7ff'));line(x-s*.2,y-s,x+s*.4,y+s*.2,'rgba(255,255,255,.7)',1);}
      window.GameRenderer.ProceduralPawn.renderPawn(ctx,{...m,x:0,y:0,confidence:95,appearance:p2?{...m.appearance,skinColor:'#705a88',hairColor:'#191527',attire:{...m.appearance.attire,color:'#30263f'}}:m.appearance},time,m.aimAngle||0,!!m.vx);
      line(-17,-45,17,-45,'#edc9ff',2);
    }else if(kind==='colossus'){
      const p2=phase===2,st=p2?'#4b3029':'#80766a',sd=p2?'#33201c':'#5b5248',sl=p2?'#6e4638':'#a39682',lv=p2?'#ff7a3d':'#e3b15c',moss='#6f8a4f';
      glow(0,-34,48,lv,p2?.5:.2);
      for(let i=0;i<6;i++){const a=time*.5+i*Math.PI/3,x=Math.cos(a)*46,y=-34+Math.sin(a)*30,s=3+i%3;poly([[x-s,y-s*1.3],[x+s*1.1,y-s*.4],[x+s*.5,y+s*1.3],[x-s*1.2,y+s*.3]],i%2?sd:sl);}
      for(const side of [-1,1]){poly([[side*4,-14],[side*22,-14],[side*25,8],[side*28,11],[side*2,11],[side*3,-2]],sd);poly([[side*7,-14],[side*20,-14],[side*21,-6],[side*8,-6]],sl);line(side*12,-4,side*20,6,'#2a2420',1.2);}
      poly([[-24,-52],[-31,-26],[-19,-8],[19,-8],[31,-26],[24,-52],[0,-58]],lin(-58,-8,sl,st));
      for(const y of [-22,-14])line(-22,y,22,y,sd,2);poly([[-18,-48],[-8,-52],[-6,-38],[-18,-36]],sd);poly([[18,-48],[8,-52],[6,-38],[18,-36]],sd);
      for(const side of [-1,1]){
        poly([[side*22,-56],[side*28,-72],[side*34,-56]],sd);poly([[side*31,-52],[side*40,-64],[side*42,-48]],sd);oval(side*31,-46,14,12,st);poly([[side*33,-38],[side*40,-40],[side*38,-35]],moss);
        poly([[side*29,-38],[side*42,-34],[side*44,-14],[side*29,-12]],st);
        oval(side*38,-7,12,11,sl);for(const k of [-5,0,5])line(side*(38+k*.6),-14,side*(38+k*.6),-8,sd,1.5);
        if(p2)glow(side*38,-7,18,lv,.8);
      }
      poly([[-14,-57],[-17,-72],[-8,-80],[8,-80],[17,-72],[14,-57],[0,-51]],sl);poly([[-14,-64],[-26,-76],[-12,-70]],sd);poly([[14,-64],[26,-76],[12,-70]],sd);poly([[-3,-80],[0,-90],[3,-80]],sd);
      line(-12,-68,-3,-64,'#2a2420',3);line(12,-68,3,-64,'#2a2420',3);
      for(const side of [-1,1]){glow(side*6,-63,9,lv,.9);oval(side*6,-63,3.2,2.2,p2?'#fff3a3':lv);}
      line(-6,-55,6,-55,'#2a2420',2);
      const pl=.75+Math.sin(time*3)*.25;
      for(const f of [[0,-47,-9,-32],[-9,-32,2,-22],[2,-22,0,-9],[-19,-40,-24,-24],[18,-41,12,-26],[8,-30,16,-18]]){ctx.save();ctx.globalAlpha=pl;line(...f,lv,p2?3:2);ctx.restore();}
      glow(0,-33,18,lv,.8*pl);oval(0,-33,6,8,p2?'#ffefb7':'#e7a24f');
      if(p2)for(const side of [-1,1])for(let i=0;i<3;i++){const t=(time*1.4+i*.33)%1;ctx.save();ctx.globalAlpha=1-t;oval(side*(30+i*3),-62-t*22,3-t*1.5,5-t*2,i%2?'#ffd166':'#ff6a35');ctx.restore();}
    }else if(kind==='void'){
      const p2=phase===2,core=p2?'#ff7fb7':'#b77af0',rim=p2?'#a04a85':'#6b4a8a';
      glow(0,-26,52,core,.22);
      ctx.save();ctx.translate(0,-26);ctx.rotate(-.18);ctx.strokeStyle=rim;for(const r of [46,40]){ctx.lineWidth=r>42?3:2;ctx.beginPath();ctx.ellipse(0,0,r,r*.26,0,Math.PI,Math.PI*2);ctx.stroke();}ctx.restore();
      for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.cos(a)*18,y=-25+Math.sin(a)*18,ex=Math.cos(a)*40,ey=8+Math.sin(time*3+i)*7,cx=x*2.5+Math.sin(time*2+i)*7;
        for(const [w,c] of [[8,'#201530'],[5.5,i%2?'#7a55a0':'#5a3d78']]){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x*2,y-10,cx,15,ex,ey);ctx.stroke();}
        ctx.fillStyle=core;for(const t of [.35,.6,.82]){const px=(1-t)**3*x+3*(1-t)**2*t*x*2+3*(1-t)*t*t*cx+t**3*ex,py=(1-t)**3*y+3*(1-t)**2*t*(y-10)+3*(1-t)*t*t*15+t**3*ey;ctx.beginPath();ctx.arc(px,py,1.2,0,Math.PI*2);ctx.fill();}}
      oval(0,-28,25,29,lin(-57,1,'#4a3560','#241a33'));oval(0,-26,18,21,'#120b1d');
      ctx.save();ctx.translate(0,-26);ctx.rotate(time*.8);ctx.strokeStyle=core;ctx.globalAlpha=.55;ctx.lineWidth=1.6;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(0,0,5+i*4,i*2.1,i*2.1+2.2);ctx.stroke();}ctx.restore();
      for(let i=0;i<12;i++){const a=i*Math.PI/6;poly([[Math.cos(a)*17,-26+Math.sin(a)*20],[Math.cos(a+.12)*13,-26+Math.sin(a+.12)*15],[Math.cos(a+.25)*17,-26+Math.sin(a+.25)*20]],'#eadbb8');}
      glow(0,-26,14,core,.9);oval(0,-26,5+pulse*2,7+pulse*2,core);ctx.fillStyle='#120b1d';ctx.fillRect(-1,-32-pulse,2,12+pulse*2);
      for(const [ex,ey] of [[-17,-50],[17,-50],[-26,-36],[26,-36],[0,-57]]){oval(ex,ey,4,2.6,'#f1d9ff');oval(ex+Math.sin(time*2)*.8,ey,1.5,1.5,'#3a1c58');}
      ctx.save();ctx.translate(0,-26);ctx.rotate(-.18);ctx.strokeStyle=rim;for(const r of [46,40]){ctx.lineWidth=r>42?3:2;ctx.beginPath();ctx.ellipse(0,0,r,r*.26,0,0,Math.PI);ctx.stroke();}
      ctx.fillStyle=core;for(let i=0;i<9;i++){const a=time*1.6+i*.7;ctx.beginPath();ctx.arc(Math.cos(a)*43,Math.sin(a)*43*.26,1.4,0,Math.PI*2);ctx.fill();}ctx.restore();
    }else if(kind==='chaos'){
      const p2=phase===2,arm=p2?'#8a2d4a':'#6e334a',dk='#2a1b2b',skin='#c27c8d',gold='#f1c27a',fire=p2?'#ff7a3d':'#ff5a7a';
      glow(0,-38,54,fire,p2?.4:.2);
      poly([[-30,-54],[-46,-14],[-34,6],[-22,-2],[-12,10],[0,0],[12,10],[22,-2],[34,6],[46,-14],[30,-54]],lin(-54,10,'#5a2038','#220f1e'));
      for(let i=0;i<5;i++){const t=(time*.9+i*.2)%1,x=-34+i*17;ctx.save();ctx.globalAlpha=(1-t)*.8;oval(x,-6-t*30,2.4-t,4-t*2,fire);ctx.restore();}
      for(const side of [-1,1])poly([[side*5,-12],[side*17,-12],[side*20,8],[side*3,8]],dk);
      poly([[-16,-9],[-27,12],[0,5],[27,12],[16,-9]],'#352330');
      poly([[-18,-44],[-23,-25],[0,-9],[23,-25],[18,-44]],lin(-44,-9,arm,'#3d1b2c'));line(-14,-38,0,-18,gold,1.6);line(14,-38,0,-18,gold,1.6);line(-20,-30,20,-30,gold,1.2);
      glow(0,-30,10,fire,.9);ctx.save();ctx.translate(0,-30);ctx.rotate(time*.5);ctx.strokeStyle=fire;ctx.lineWidth=1.4;for(let i=0;i<6;i++){ctx.rotate(Math.PI/3);ctx.beginPath();ctx.moveTo(2,0);ctx.lineTo(7,0);ctx.stroke();}ctx.restore();oval(0,-30,2.4,2.4,'#fff1c8');
      for(const side of [-1,1]){poly([[side*17,-44],[side*34,-50],[side*33,-34],[side*20,-34]],dk);poly([[side*22,-50],[side*28,-62],[side*31,-49]],gold);poly([[side*30,-48],[side*40,-56],[side*38,-43]],gold);line(side*20,-36,side*32,-36,gold,1.4);}
      oval(0,-51,13,14,skin);poly([[-14,-54],[-15,-44],[-8,-38],[8,-38],[15,-44],[14,-54],[0,-47]],'#3a2332');
      poly([[-14,-60],[-31,-70],[-33,-88],[-20,-76],[-9,-66]],'#1f1420');poly([[14,-60],[31,-70],[33,-88],[20,-76],[9,-66]],'#1f1420');
      poly([[-13,-60],[-8,-72],[0,-66],[8,-72],[13,-60],[0,-63]],'#322133');line(-7,-61,7,-61,gold,1.4);
      for(const side of [-1,1]){glow(side*6,-52,8,'#ffe8b0',.8);poly([[side*2,-54],[side*10,-55],[side*9,-50],[side*3,-51]],'#ffe8b0');}
      line(-6,-44,6,-44,'#4a2230',2);
      for(let i=0;i<4;i++){const a=i*Math.PI/2+time*(p2?.5:.12),x=Math.cos(a)*32,y=-30+Math.sin(a)*26;ctx.save();ctx.translate(x,y);ctx.rotate(a);line(0,12,0,-15,'#e9bc98',2);
        if(i===0)poly([[-3,-4],[0,-25],[3,-4]],'#d8bfdf');
        if(i===1)poly([[-4,-13],[0,-28],[4,-13]],'#ffb3bd');
        if(i===2)poly([[-10,-17],[10,-17],[10,-7],[-10,-7]],'#be8595');
        if(i===3){ctx.strokeStyle='#ffd6ad';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,15,-Math.PI/2,Math.PI/2);ctx.stroke();line(0,-15,0,15,'#dcc9c5',1);}ctx.restore();
      }
    }else if(kind==='mecha'){
      const p2=phase===2,core=p2?'#ffd7a0':'#7fddf5',acc=p2?'#ff7f50':'#77d6eb',metal='#9aa5b1',mid='#667384',dk='#3f4a5b';
      for(const side of [-1,1]){const fl=(p2?9:5)+Math.sin(time*18+side)*2;poly([[side*10,-36],[side*17,-36],[side*14,-36+fl*2]],p2?'#ff9a4d':'#8fe3ff');}
      for(const side of [-1,1]){poly([[side*5,-6],[side*17,-6],[side*21,10],[side*3,10]],metal);poly([[side*7,-18],[side*15,-18],[side*16,-6],[side*6,-6]],dk);line(side*11,-18,side*11,-6,acc,1.5);}
      for(const side of [-1,1]){poly([[side*19,-52],[side*33,-47],[side*33,-27],[side*19,-23]],mid);for(let i=0;i<3;i++){oval(side*26,-45+i*7,2.6,2.6,dk);oval(side*26,-45+i*7,1.2,1.2,acc);}
        poly([[side*29,-26],[side*36,-26],[side*36,-8],[side*29,-8]],metal);poly([[side*28,-9],[side*37,-9],[side*37,3],[side*28,3]],dk);glow(side*32.5,3,7,acc,.7);}
      poly([[-21,-48],[-26,-26],[-15,-8],[15,-8],[26,-26],[21,-48]],lin(-48,-8,'#a3adba','#6c7787'));
      poly([[-17,-46],[-21,-28],[-12,-12],[-6,-12],[-8,-30],[-6,-46]],mid);poly([[17,-46],[21,-28],[12,-12],[6,-12],[8,-30],[6,-46]],mid);
      for(const [x,y] of [[-19,-40],[19,-40],[-14,-14],[14,-14]])oval(x,y,1.3,1.3,'#dfe6ec');
      oval(0,-30,10,10,dk);glow(0,-30,17,core,.8);ctx.save();ctx.translate(0,-30);ctx.rotate(time*1.6);ctx.strokeStyle=core;ctx.lineWidth=1.6;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(0,0,6.6,i*2.1,i*2.1+1.4);ctx.stroke();}ctx.restore();oval(0,-30,4,4,core);oval(0,-30,1.8,1.8,'#fff');
      poly([[-14,-49],[-17,-66],[-9,-73],[9,-73],[17,-66],[14,-49]],lin(-73,-49,'#5d6a7e','#3a4557'));poly([[-12,-69],[12,-69],[10,-62],[-10,-62]],'#1b2230');
      ctx.save();ctx.shadowColor='#ff6a66';ctx.shadowBlur=6;line(-9,-65.5,9,-65.5,p2?'#ffb35a':'#ff6a66',3);ctx.restore();
      line(10,-72,15,-84,metal,1.6);oval(15,-85,1.6,1.6,p2?'#ffb35a':'#ff6a66');poly([[-3,-73],[0,-78],[3,-73]],mid);
      if(m.shield>0){ctx.save();ctx.globalAlpha=.22+pulse*.1;ctx.strokeStyle='#8ae3ff';ctx.fillStyle='#8ae3ff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-34,35,47,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=.06;ctx.fill();ctx.restore();}
    }
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
    const barWidth = monster.tier>=4?48:34;
    const barHeight = 4.5;
    const tops={beast:45,rat:29,humanoid:46,skeleton:46,beetle:47,boar:42,toad:28,serpent:52,monkey:44,spider:38,zombie:50,snake:42,wolf:43,panther:36,bear:47,bat:56,crab:46,treant:66,golem:80,centaur:88,naga:88,undead_mage:70,ape:90,floating_wraith:90,demon_lord:106,titan_ape:96,three_headed_hydra:84,void_dragon:116,solar_phoenix:92,ancient_world_tree:100,death_god:80,rhino:44};
    const barY=-(monster.isAncient||monster.isAncientClone?82:tops[monster.visual?.type]||42);
    if(monster.isAncient){
      for(let i=0;i<2;i++){ctx.fillStyle='rgba(0,0,0,.85)';ctx.fillRect(-25,barY+i*8,50,6);ctx.fillStyle=i===0?'#ff6b65':'#bc9aff';ctx.fillRect(-24,barY+1+i*8,48*(i===0?(monster.phase===1?hpPct:0):(monster.phase===1?1:hpPct)),4);}
      if(monster.maxShield){ctx.fillStyle='#83e1ff';ctx.fillRect(-24,barY+17,48*monster.shield/monster.maxShield,3);}return;
    }

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
