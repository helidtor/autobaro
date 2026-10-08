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
    }else if(kind==='eternal'){
      // Vẽ theo toạ độ concept (cao ~360) rồi thu nhỏ về cỡ sprite.
      const red=phase===2,fl=red?'#ff6a3d':'#59c8ff',fl2=red?'#ffd166':'#a8e6ff',eye=red?'#ffd84d':'#ff4d5a',O='#1d1a26',hem=red?-80:-30,flick=Math.sin(time*9);
      const sh=(pts,fill)=>{ctx.fillStyle=fill;ctx.strokeStyle=O;ctx.lineWidth=9;ctx.lineJoin='round';ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();ctx.stroke();};
      const flame=(x,y,s,c)=>{ctx.fillStyle=c;ctx.strokeStyle=O;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x-14*s,y-18*s,x-6*s,y-30*s,x,y-(52+flick*7)*s);ctx.bezierCurveTo(x+4*s,y-34*s,x+16*s,y-22*s,x+12*s,y-8*s);ctx.bezierCurveTo(x+10*s,y-2*s,x+4*s,y,x,y);ctx.fill();ctx.stroke();};
      ctx.save();ctx.scale(.21,.21);
      ctx.fillStyle=O;ctx.strokeStyle=O;ctx.lineWidth=9;ctx.lineJoin='round';ctx.fillStyle=red?'#2a1418':'#1b1824';ctx.beginPath();ctx.moveTo(-62,-250);ctx.bezierCurveTo(-110,-230,-140,-150,-125,hem);
      for(let i=0;i<=9;i++)ctx.lineTo(-125+25*i,hem+(i%2?22:-6)+(i*37)%11);ctx.lineTo(125,hem);ctx.bezierCurveTo(140,-150,110,-230,62,-250);ctx.closePath();ctx.fill();ctx.stroke();
      for(const sx of [-1,1]){const x=sx*28;sh([[x-20,-118],[x+20,-118],[x+18,-50],[x+26,-4],[x-26,-4],[x-18,-50]],'#c9cfdc');sh([[x-18,-70],[x+18,-70],[x+20,-50],[x-20,-50]],'#2b2736');sh([[x-28,-16],[x+28,-16],[x+34,4],[x-34,4]],'#2b2736');}
      sh([[-58,-245],[58,-245],[46,-130],[-46,-130]],'#e6eaf2');sh([[-30,-240],[30,-240],[26,-170],[-26,-170]],'#2b2736');
      ctx.fillStyle=fl;ctx.beginPath();ctx.arc(0,-205,13,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,-205,5,0,Math.PI*2);ctx.fill();
      sh([[-52,-142],[52,-142],[52,-120],[-52,-120]],'#2b2736');for(let i=0;i<13;i++){ctx.fillStyle=i%2?fl:fl2;ctx.fillRect(-48+i*7.4,-137,5,12);}
      sh([[-22,-154],[22,-154],[22,-114],[-22,-114]],'#e6eaf2');ctx.fillStyle=fl;ctx.fillRect(-14,-148,28,28);ctx.fillStyle='#fff';ctx.fillRect(-6,-144,12,20);
      sh([[-58,-240],[-92,-190],[-100,-130],[-76,-126],[-66,-178],[-48,-210]],'#e6eaf2');sh([[-108,-142],[-70,-142],[-70,-106],[-108,-106]],'#2b2736');
      sh([[58,-240],[96,-196],[122,-178],[112,-156],[84,-166],[48,-208]],'#e6eaf2');sh([[104,-196],[138,-196],[138,-158],[104,-158]],'#2b2736');
      sh([[138,-178],[150,-178],[150,-150],[138,-150]],'#2b2736');sh([[144,-182],[176,-296],[190,-182]],'#dff3ff');flame(166,-290,.9,fl2);flame(182,-196,.55,fl);
      for(const sx of [-1,1]){ctx.fillStyle='#2b2736';ctx.beginPath();ctx.ellipse(sx*68,-236,30,22,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle=fl;ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(sx*68,-236,21,13,0,0,Math.PI*2);ctx.stroke();}
      sh([[-34,-250],[-34,-300],[-18,-322],[0,-330],[18,-322],[34,-300],[34,-250],[0,-236]],'#eef1f7');sh([[-6,-326],[0,-352],[6,-326]],'#2b2736');
      sh([[-30,-308],[-44,-334],[-24,-318]],'#c9cfdc');sh([[30,-308],[44,-334],[24,-318]],'#c9cfdc');
      sh([[-28,-292],[-6,-280],[-8,-266],[-30,-276]],eye);sh([[28,-292],[6,-280],[8,-266],[30,-276]],eye);sh([[-10,-296],[0,-306],[10,-296],[0,-284]],fl);
      ctx.fillStyle=red?'#2a1418':'#1b1824';ctx.strokeStyle=O;ctx.lineWidth=9;sh([[-62,-246],[-88,-190],[-96,-130],[-84,-60],[-62,-20],[-50,-70],[-52,-170]],red?'#2a1418':'#1b1824');sh([[62,-246],[74,-200],[70,-150],[76,-90],[96,-40],[66,-70],[48,-170]],red?'#2a1418':'#1b1824');
      flame(-72,-4,1.1,fl);flame(80,-4,1.3,fl2);flame(-100,0,.7,fl2);
      for(let i=0;i<(red?6:3);i++){const a=time*.8+i*Math.PI*2/(red?6:3);ctx.save();ctx.translate(Math.cos(a)*175,-190+Math.sin(a)*90);ctx.rotate(a+Math.PI/2);sh([[-9,-16],[9,-16],[9,16],[-9,16]],'#2b2736');ctx.fillStyle=['#ff6a3d','#59c8ff','#9be26b','#ffd166','#bd93f9','#ff8fb8'][i];ctx.fillRect(-6,-12,12,12);ctx.restore();}
      ctx.restore();
    }else if(kind==='diva'){
      // Vẽ theo toạ độ concept (cao ~350) rồi thu nhỏ về cỡ sprite.
      const red=phase===2,hair=red?'#ff4fa3':'#39c5bb',hair2=red?'#39e6ff':'#9ef2ea',eye=red?'#ff2f7a':'#2fb5b0',suit=red?'#2a1a33':'#4b5160',skin='#ffe3d1',O='#1d1a26',sway=Math.sin(time*2)*10;
      ctx.save();ctx.scale(.21,.21);ctx.lineJoin='round';ctx.lineCap='round';
      const paint=(f,w=9)=>{ctx.fillStyle=f;ctx.strokeStyle=O;ctx.lineWidth=w;ctx.fill();ctx.stroke();};
      const sh=(pts,f)=>{ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();paint(f);};
      const el=(x,y,rx,ry,f,w)=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);paint(f,w);};
      for(const sx of [-1,1]){ctx.beginPath();ctx.moveTo(sx*30,-300);ctx.bezierCurveTo(sx*95,-320,sx*150,-250,sx*135,-150);ctx.bezierCurveTo(sx*125,-90,sx*(140+sway),-50,sx*(110+sway),0);ctx.bezierCurveTo(sx*100,-50,sx*80,-90,sx*78,-150);ctx.bezierCurveTo(sx*76,-210,sx*50,-250,sx*30,-262);ctx.closePath();paint(hair);
        ctx.strokeStyle=hair2;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(sx*100,-270);ctx.bezierCurveTo(sx*128,-220,sx*120,-150,sx*108,-80);ctx.stroke();sh([[sx*58-9,-278],[sx*58+9,-278],[sx*58+9,-266],[sx*58-9,-266]],'#2b2736');}
      for(const sx of [-1,1]){const x=sx*24;sh([[x-13,-128],[x+13,-128],[x+13,-88],[x-13,-88]],skin);sh([[x-17,-92],[x+17,-92],[x+15,-14],[x+24,0],[x-24,0],[x-15,-14]],'#2b2736');sh([[x-17,-96],[x+17,-96],[x+17,-86],[x-17,-86]],hair);}
      sh([[-50,-160],[50,-160],[74,-112],[-74,-112]],suit);sh([[-74,-112],[74,-112],[74,-102],[-74,-102]],hair);
      sh([[-40,-250],[40,-250],[34,-160],[-34,-160]],suit);sh([[-8,-250],[8,-250],[16,-190],[0,-172],[-16,-190]],hair);
      sh([[-40,-246],[-96,-222],[-122,-170],[-86,-158],[-66,-196],[-40,-214]],suit);el(-106,-138,14,14,skin,7);
      sh([[40,-246],[92,-226],[130,-196],[116,-170],[84,-190],[40,-214]],suit);el(136,-186,14,14,skin,7);
      ctx.strokeStyle=O;ctx.lineWidth=16;ctx.beginPath();ctx.moveTo(132,-176);ctx.lineTo(150,-30);ctx.stroke();ctx.strokeStyle='#e8f3d8';ctx.lineWidth=8;ctx.stroke();
      ctx.beginPath();ctx.moveTo(128,-190);ctx.bezierCurveTo(100,-250,140,-300,168,-330);ctx.bezierCurveTo(180,-290,190,-240,140,-192);ctx.closePath();paint('#79c94a');
      sh([[-9,-262],[9,-262],[9,-246],[-9,-246]],skin);el(0,-292,38,40,skin,9);
      for(const sx of [-1,1]){el(sx*16,-286,11,14,'#fff',6);ctx.fillStyle=eye;ctx.beginPath();ctx.ellipse(sx*16,-284,8,11,0,0,Math.PI*2);ctx.fill();}
      ctx.beginPath();ctx.moveTo(-42,-292);ctx.bezierCurveTo(-48,-340,-10,-352,0,-352);ctx.bezierCurveTo(10,-352,48,-340,42,-292);ctx.bezierCurveTo(38,-312,28,-318,22,-306);ctx.lineTo(12,-322);ctx.lineTo(2,-304);ctx.lineTo(-8,-322);ctx.lineTo(-18,-306);ctx.lineTo(-28,-318);ctx.bezierCurveTo(-34,-312,-40,-300,-42,-292);ctx.closePath();paint(hair);
      ctx.strokeStyle='#2b2736';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(-44,-296);ctx.bezierCurveTo(-46,-352,46,-352,44,-296);ctx.stroke();
      for(const sx of [-1,1]){sh([[sx*44-8,-308],[sx*44+8,-308],[sx*44+8,-278],[sx*44-8,-278]],'#2b2736');ctx.fillStyle=hair;ctx.fillRect(sx*44-4,-302,8,18);}
      ctx.font='bold 46px Arial';ctx.lineWidth=3;ctx.strokeStyle=O;ctx.fillStyle=red?'#39e6ff':hair;for(let i=0;i<(red?6:3);i++){const a=time*.9+i*Math.PI*2/(red?6:3),x=Math.cos(a)*180,y=-190+Math.sin(a)*90;ctx.strokeText(['♪','♫','♬'][i%3],x,y);ctx.fillText(['♪','♫','♬'][i%3],x,y);}
      ctx.restore();
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
