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

    switch (type) {
      case 'primordial_colossus': case 'primordial_mirror': case 'primordial_void': case 'primordial_chaos': case 'primordial_mecha': case 'primordial_eternal':
        this.renderAncient(ctx,monster,time);break;
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
      case 'rhino': this.renderRhino(ctx,monster,time);break;
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
        if(!this.renderSpecies(ctx,monster,time))this.renderGenericMonster(ctx, monster, time);
        break;
    }

    this.renderSpeciesDetails(ctx,monster,time);

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
    if(kind==='mirror'){
      for(let i=0;i<6;i++){const a=time*.3+i*Math.PI/3,x=Math.cos(a)*34,y=-23+Math.sin(a)*27;poly([[x-4,y-8],[x+5,y-2],[x+3,y+8],[x-5,y+1]],'#9d80c1');}
      window.GameRenderer.ProceduralPawn.renderPawn(ctx,{...m,x:0,y:0,confidence:95,appearance:phase===2?{...m.appearance,skinColor:'#705a88',hairColor:'#191527',attire:{...m.appearance.attire,color:'#30263f'}}:m.appearance},time,m.aimAngle||0,!!m.vx);
      line(-17,-45,17,-45,'#edc9ff',2);
    }else if(kind==='colossus'){
      for(const side of [-1,1]){
        poly([[side*8,-8],[side*21,-6],[side*23,10],[side*5,10]],phase===2?'#402b27':'#64544a');
        poly([[side*17,-49],[side*32,-45],[side*37,-18],[side*23,-12],[side*18,-29]],'#776859');oval(side*31,-14,9,9,'#8d7861');
      }
      poly([[-21,-49],[-26,-22],[-15,-6],[15,-6],[26,-22],[21,-49]],phase===2?'#472e26':'#7d7364');
      poly([[-14,-50],[-12,-68],[0,-76],[14,-67],[15,-48],[0,-42]],'#8b806e');
      for(const side of [-1,1])line(side*3,-59,side*9,-59,phase===2?'#fff3a3':'#ffc468',3);
      for(const f of [[0,-43,-8,-27],[-8,-27,2,-18],[2,-18,0,-7],[-17,-38,-23,-24],[16,-39,10,-25]])line(...f,phase===2?'#ff6a35':'#dab76e',phase===2?3:1.5);
      oval(0,-32,5,7,phase===2?'#ffefb7':'#d68a46');
    }else if(kind==='void'){
      for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.cos(a)*18,y=-25+Math.sin(a)*18;ctx.strokeStyle=i%2?'#73518c':'#513669';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x*2,y-10,x*2.5+Math.sin(time*2+i)*7,15,Math.cos(a)*40,8+Math.sin(time*3+i)*7);ctx.stroke();}
      oval(0,-28,24,28,'#34283f');oval(0,-26,17,20,'#160f24');
      for(let i=0;i<12;i++){const a=i*Math.PI/6;poly([[Math.cos(a)*16,-26+Math.sin(a)*19],[Math.cos(a+.12)*13,-26+Math.sin(a+.12)*15],[Math.cos(a+.25)*16,-26+Math.sin(a+.25)*19]],'#eadbb8');}
      oval(0,-26,6+pulse*2,7+pulse*2,phase===2?'#ff91bb':'#ad73d4');for(const side of [-1,1])oval(side*17,-48,4,2,'#e3b7ff');
    }else if(kind==='chaos'){
      poly([[-15,-9],[-26,12],[0,4],[26,12],[15,-9]],'#352330');poly([[-17,-43],[-22,-25],[0,-9],[22,-25],[17,-43]],'#6e334a');
      oval(0,-51,13,14,'#ad6478');poly([[-13,-60],[-23,-77],[-8,-65],[0,-70],[8,-65],[23,-77],[13,-60]],'#322133');for(const side of [-1,1])line(side*3,-52,side*9,-52,'#ffe8b0',3);
      for(let i=0;i<4;i++){const a=i*Math.PI/2+time*(phase===2?.5:.12),x=Math.cos(a)*32,y=-30+Math.sin(a)*26;ctx.save();ctx.translate(x,y);ctx.rotate(a);line(0,12,0,-15,'#e9bc98',2);
        if(i===0)poly([[-3,-4],[0,-25],[3,-4]],'#d8bfdf');
        if(i===1)poly([[-4,-13],[0,-28],[4,-13]],'#ffb3bd');
        if(i===2)poly([[-10,-17],[10,-17],[10,-7],[-10,-7]],'#be8595');
        if(i===3){ctx.strokeStyle='#ffd6ad';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,15,-Math.PI/2,Math.PI/2);ctx.stroke();line(0,-15,0,15,'#dcc9c5',1);}ctx.restore();
      }
    }else if(kind==='mecha'){
      for(const side of [-1,1]){poly([[side*5,-4],[side*17,-4],[side*20,10],[side*3,10]],'#737d88');poly([[side*18,-50],[side*30,-44],[side*29,-16],[side*19,-16]],'#5e6b7b');ctx.fillStyle='#bec7cd';ctx.fillRect(side<0?-33:24,-25,9,19);for(let i=0;i<3;i++)line(side*20,-41+i*5,side*27,-41+i*5,phase===2?'#ff7f50':'#77d6eb',2);}
      poly([[-20,-46],[-24,-25],[-14,-8],[14,-8],[24,-25],[20,-46]],'#858f9e');poly([[-13,-47],[-16,-65],[-8,-72],[10,-72],[16,-63],[13,-47]],'#4b576a');
      line(-10,-59,10,-59,'#ff6a66',4);oval(0,-29,8,8,phase===2?'#fff1c0':'#7fddf5');
      for(let i=0;i<8;i++){const a=time*2+i*Math.PI/4;line(Math.cos(a)*5,-29+Math.sin(a)*5,Math.cos(a)*8,-29+Math.sin(a)*8,'#fff4cc',1);}
      if(m.shield>0){ctx.save();ctx.globalAlpha=.25+pulse*.1;ctx.strokeStyle='#8ae3ff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-30,34,45,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
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
    }
  },

  renderSpecies(ctx,m,time){
    const type=m.visual.type,body=m.visual.bodyColor||'#69767b',detail=m.visual.detailColor||'#bcb092';
    const poly=(points,color)=>{ctx.fillStyle=color;ctx.strokeStyle='#182c36';ctx.lineWidth=1.7;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();ctx.stroke();};
    const oval=(x,y,rx,ry,color)=>{ctx.fillStyle=color;ctx.strokeStyle='#182c36';ctx.lineWidth=1.7;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.stroke();};
    const line=(x,y,tx,ty,color,width=2)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(tx,ty);ctx.stroke();};
    const eyes=(x,y,gap=4)=>{for(const side of [-1,1]){oval(x+side*gap,y,2.5,2,m.visual.eyeColor||'#ffbb67');line(x+side*gap,y-1,x+side*gap,y+1,'#15212a',1);}};
    const stride=Math.sin(time*6)*2;
    if(type==='spider'){
      for(const side of [-1,1])for(let i=0;i<4;i++){
        const y=-17+i*7,tip=side*(23+Math.sin(time*5+i)*2);
        line(side*6,y,side*18,y-8,body,3);line(side*18,y-8,tip,y+8,'#21333f',2);
      }
      oval(0,-14,12,14,body);oval(0,0,8,7,detail);
      for(const x of [-6,-2,2,6])oval(x,-1,1.7,2,m.visual.eyeColor);poly([[-5,5],[-5,12],[-1,7]],'#e8dabc');poly([[5,5],[5,12],[1,7]],'#e8dabc');
      for(const y of [-22,-17,-12])line(-4,y,4,y+2,detail,2);
    }else if(type==='wolf'||type==='panther'){
      ctx.strokeStyle=body;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-19,-8);ctx.quadraticCurveTo(-35,-8,-28,-24+stride);ctx.stroke();
      for(const x of [-15,-6,9,18]){line(x,-1,x+stride*(x<0?1:-1),11,body,5);line(x-2,11,x+4,11,'#192e36',2);}
      oval(0,-9,22,11,body);
      if(type==='wolf')poly([[9,-17],[10,-28],[15,-21],[21,-29],[25,-19],[32,-12],[28,-4],[13,-5]],body);
      else{oval(21,-12,11,9,body);oval(16,-20,4,4,body);oval(26,-20,4,4,body);for(const x of [-12,-3,6])poly([[x,-17],[x+3,-12],[x-2,-9]],detail);}
      oval(29,-11,3,2,'#182c36');oval(23,-16,2,2,m.visual.eyeColor);
      line(23,-6,29,-6,'#e9dcc1',1.5);
      if(m.visual.mane)poly([[4,-17],[8,-28],[11,-23],[15,-31],[15,-17]],'#d2dce2');
    }else if(type==='bear'){
      for(const x of [-14,11]){oval(x,4+stride,8,10,body);for(let i=0;i<3;i++)poly([[x-5+i*4,9],[x-3+i*4,17],[x-1+i*4,9]],detail);}
      oval(0,-12,24,21,body);oval(-10,-32,6,6,body);oval(10,-32,6,6,body);oval(0,-23,15,13,body);
      oval(0,-18,8,5,'#bddee2');oval(0,-20,4,3,'#2c4f63');eyes(0,-27,6);
      for(const side of [-1,1])poly([[side*14,-10],[side*22,-26],[side*26,-7]],detail);
    }else if(type==='bat'){
      const flap=Math.sin(time*7)*5;
      for(const side of [-1,1]){ctx.save();ctx.scale(side,1);poly([[5,-15],[29,-28+flap],[39,-7+flap],[27,-10],[23,1],[16,-6],[9,3],[5,-3]],body);for(const tip of [[29,-28+flap],[39,-7+flap],[23,1]])line(5,-15,...tip,detail,1.3);ctx.restore();}
      oval(0,-8,9,14,body);poly([[-8,-15],[-9,-29],[-2,-20],[2,-20],[9,-29],[8,-15]],body);eyes(0,-16,4);
      poly([[-4,-8],[-3,-2],[-1,-8]],'#f5e3cc');poly([[4,-8],[3,-2],[1,-8]],'#f5e3cc');
    }else if(type==='crab'){
      for(const side of [-1,1]){for(let i=0;i<3;i++){line(side*13,i*5-9,side*27,i*7-4,body,3);line(side*27,i*7-4,side*31,i*7+3,body,2);}
        line(side*12,-12,side*26,-23,body,5);ctx.save();ctx.scale(side,1);poly([[23,-21],[22,-34],[29,-38],[32,-28],[38,-35],[41,-26],[32,-16]],body);ctx.restore();
      }
      poly([[-20,-10],[-12,-23],[9,-24],[22,-11],[17,4],[-16,4]],body);
      poly([[-8,-17],[4,-20],[11,-9],[2,-3],[-12,-6]],'#8ba0a1');
      for(const side of [-1,1]){line(side*7,-18,side*9,-29,body,3);oval(side*9,-30,3,3,m.visual.eyeColor);}
      line(-9,-12,2,-8,detail,1.5);line(2,-8,7,-14,detail,1.5);
    }else if(type==='monkey'||type==='ape'){
      const large=type==='ape';ctx.save();ctx.scale(large?1.6:1,large?1.5:1);
      ctx.strokeStyle=body;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-8,0);ctx.bezierCurveTo(-28,7,-32,-21,-22,-19+stride);ctx.stroke();
      for(const side of [-1,1]){oval(side*13,-3,large?9:6,large?15:10,body);oval(side*13,8,7,5,detail);oval(side*7,9,5,5,body);}
      oval(0,-12,13,16,body);oval(0,-14,7,10,detail);oval(-11,-25,5,5,body);oval(11,-25,5,5,body);oval(0,-25,11,10,body);oval(0,-24,8,6,'#b8a593');eyes(0,-27);
      line(-3,-21,3,-21,'#382f2d',1.5);if(large)poly([[-6,-37],[0,-44],[6,-37]],detail);ctx.restore();
    }else if(type==='snake'||type==='naga'){
      ctx.strokeStyle='#182c36';ctx.lineWidth=type==='naga'?12:9;ctx.beginPath();ctx.moveTo(-23,8);ctx.bezierCurveTo(-6,-17+stride,24,24,-2,-4);ctx.bezierCurveTo(-15,-16,5,-19,8,-24);ctx.stroke();
      ctx.strokeStyle=body;ctx.lineWidth=type==='naga'?8:5;ctx.stroke();
      for(const x of [-15,-6,4])line(x,2,x+2,6,detail,2);
      if(type==='naga'){poly([[-12,-23],[-17,-39],[-10,-51],[0,-54],[11,-49],[17,-35],[10,-23]],body);oval(0,-52,10,8,body);
        for(const side of [-1,1]){line(side*10,-40,side*22,-26,body,5);poly([[side*18,-31],[side*24,-22],[side*27,-33]],'#c3d1af');}
        poly([[-12,-54],[-21,-68],[-5,-60],[0,-73],[5,-60],[21,-68],[12,-54]],detail);eyes(0,-54);
      }else{poly([[3,-28],[12,-32],[18,-25],[12,-19],[4,-22]],body);oval(12,-27,2,2,m.visual.eyeColor);line(16,-23,24,-21,'#e86679',1);line(24,-21,27,-24,'#e86679',1);line(24,-21,28,-19,'#e86679',1);}
    }else if(type==='zombie'||type==='undead_mage'||type==='floating_wraith'){
      const floating=type!=='zombie';poly([[-10,-22],[-19,8],[-8,4],[-2,12],[6,4],[18,9],[11,-22]],floating?detail:'#56665f');
      for(const side of [-1,1]){line(side*9,-16,side*23,-8+stride,body,5);line(side*23,-8+stride,side*28,-17+stride,body,3);}
      oval(0,-29,11,12,floating?'#dbd7c3':body);
      eyes(0,-31,5);line(-5,-23,5,-23,'#192d32',2);
      for(let i=0;i<4;i++)line(-4+i*3,-25,-4+i*3,-21,'#b7ad99',1);
      if(floating){poly([[-14,-36],[-17,-52],[-6,-45],[0,-58],[6,-45],[17,-52],[14,-36]],detail);
        line(22,7,22,-43,'#bca681',3);oval(22,-46,6,8,m.visual.eyeColor);
        for(const y of [-12,-5,2])line(-7,y,7,y,'#a7bec8',1);
      }else{poly([[-9,-13],[-4,-16],[1,-12],[-5,-8]],'#a58c80');line(-7,7,-8,15,body,5);line(9,7,13,15,body,5);}
    }else if(type==='treant'){
      poly([[-9,-31],[-13,1],[-27,13],[-9,8],[0,17],[9,8],[27,13],[13,1],[9,-31]],'#6b5746');
      for(const side of [-1,1]){line(side*8,-22,side*22,-28,body,6);line(side*22,-28,side*27,-42,body,4);line(side*22,-28,side*35,-24,body,3);oval(side*17,-37,13,9,detail);}
      for(const x of [-9,0,9])oval(x,-34,10,12,detail);
      eyes(0,-19,5);line(-4,-11,4,-11,'#14262c',2);for(const x of [-5,4])line(x,-5,x+2,4,'#bb9770',1.5);
    }else return false;
    return true;
  },
  renderSpeciesDetails(ctx,m,time){
    const type=m.visual.type,color=m.visual.detailColor||'#d1b99a';
    const line=(x,y,tx,ty,c=color,w=1.5)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(tx,ty);ctx.stroke();};
    const oval=(x,y,rx,ry,c)=>{ctx.fillStyle=c;ctx.strokeStyle='#192b34';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.stroke();};
    if(type==='rat'){oval(12,-9,6,6,m.visual.bodyColor);oval(8,-15,4,5,'#b09892');oval(18,-8,2,2,'#182a32');for(const y of [-10,-6])line(15,y,25,y+2,'#d3c6b1',1);for(const x of [-9,6])line(x,2,x+4,7,'#425961',3);}
    if(type==='beast'){for(const x of [-7,7])oval(x,5,5,3,'#cbd6d2');oval(0,-1,3,2,'#d7939a');line(-6,-27,-6,-18,'#d9aeb5',2);line(6,-27,6,-18,'#d9aeb5',2);}
    if(type==='beetle'){line(0,-20,0,7,'#123637',2);for(const side of [-1,1]){for(let i=0;i<3;i++)line(side*11,-11+i*7,side*22,-16+i*10,'#243a3f',2);oval(side*4,-17,2,2,m.visual.eyeColor);}line(-8,-12,-5,-17,'#92e5c4',2);}
    if(type==='humanoid'){for(const x of [-5,5])line(x,3,x,12,'#224d36',4);line(-7,-8,7,-4,'#68482f',3);for(const x of [8,13])line(x,-22,x+2,-26,'#d7c6a0',2);line(-4,-14,4,-14,'#e9e0bc',2);}
    if(type==='skeleton'){for(const side of [-1,1]){line(side*4,0,side*9,12,'#bcc8c9',3);line(side*6,-10,side*12,0,'#bcc8c9',2);}line(-3,-13,3,-13,'#614b47',2);}
    if(type==='boar'){oval(18,-8,8,7,'#a67f6a');oval(24,-7,4,5,'#82665b');oval(18,-13,2,2,m.visual.eyeColor);for(const x of [-12,10])line(x,3,x,12,'#473e3b',6);line(-17,-14,-6,-17,'#a9c0c6',2);}
    if(type==='toad'){for(const side of [-1,1]){oval(side*18,0,7,6,'#7e3831');line(side*16,5,side*23,8,'#e5ab62',3);oval(side*10,-16,1.5,3,'#392720');}line(-8,1,8,1,'#5c2f2c',2);}
    if(type==='serpent'){ctx.strokeStyle='#1f483d';ctx.lineWidth=1.5;ctx.fillStyle=m.visual.bodyColor;ctx.beginPath();ctx.moveTo(14,-9);ctx.bezierCurveTo(0,-13,4,-34,18,-31);ctx.bezierCurveTo(34,-30,34,-12,23,-6);ctx.closePath();ctx.fill();ctx.stroke();oval(18,-20,7,8,'#61b08e');for(const x of [15,21])oval(x,-23,1.5,2,'#ffc972');line(18,-13,22,-8,'#e1b86b',1);}
    if(type==='golem'){for(const side of [-1,1]){oval(side*25,-20,8,13,'#4c5567');line(side*13,0,side*13,13,'#293844',8);}line(30,-35,29,8,'#aa8062',4);line(24,-20,40,-26,'#f8bd8c',2);line(-7,-11,0,-4,'#ffb565',2);}
    if(type==='centaur'){line(6,-28,21,-28,'#d7c2f1',2);line(14,-38,14,-29,'#d7c2f1',2);ctx.strokeStyle='#d8b888';ctx.lineWidth=2;ctx.beginPath();ctx.arc(-13,-20,13,-1.2,1.2);ctx.stroke();line(-8,-32,-8,-8,'#eee2c7',1);line(2,-10,-3,-30,'#605574',3);}
    if(type==='titan_ape'){oval(0,-54,19,17,'#4e5860');oval(0,-49,13,8,'#a3adb2');for(const x of [-7,7])oval(x,-58,3,2,'#fa716b');line(-8,-48,8,-48,'#2e393e',2);for(const side of [-1,1]){line(side*38,-7,side*44,4,'#879397',4);line(side*9,-32,side*11,-22,'#a5b5bb',2);}}
    if(type==='demon_lord'){for(const x of [-11,11])oval(x,-43,4,2,'#fff3b1');line(-12,-34,0,-29,'#ffe196',2);line(0,-29,12,-34,'#ffe196',2);line(41,-34,41,10,'#5c4343',6);for(const y of [-51,-43])line(34,y,46,y+4,'#ffdb8a',2);for(const x of [-17,17])line(x,-8,x,13,'#5a3333',10);}
    if(type==='three_headed_hydra'){for(const [i,ang] of [-.6,0,.6].entries()){ctx.save();ctx.translate(0,-16);ctx.rotate(ang);const y=-35+Math.sin(time*4+i*2)*6;for(const x of [-3,3])oval(x,y-2,1.7,2,'#f07866');line(-3,y+4,3,y+4,'#31514a',1);line(-4,y-6,-8,y-13,'#cceab4',3);line(4,y-6,8,y-13,'#cceab4',3);ctx.restore();}}
    if(type==='void_dragon'){for(const side of [-1,1]){oval(side*13,-54,5,3,'#a3ffdf');line(side*27,-44,side*60,-44,'#9c83ef',2);line(side*20,-40,side*65,-68,'#9c83ef',2);line(side*24,-7,side*38,11,'#8e6ec7',8);}for(const y of [-41,-28,-15])line(-12,y,12,y,'#bc9ddd',2);line(-12,-34,12,-34,'#f6e6cf',2);}
    if(type==='solar_phoenix'){oval(0,-53,10,11,'#ffdc8a');oval(4,-56,2,2,'#402e30');ctx.fillStyle='#e57837';ctx.beginPath();ctx.moveTo(6,-52);ctx.lineTo(21,-49);ctx.lineTo(7,-46);ctx.fill();for(const side of [-1,1])for(let i=0;i<4;i++){line(side*(20+i*12),-29,side*(30+i*14),-14-i*3,'#ffd88c',3);line(side*(5+i*4),-6,side*(8+i*8),30+Math.sin(time*3+i)*5,'#ed8f43',5);}for(const x of [-5,0,5])line(x,-60,x*2,-72,'#fff0ae',3);}
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
  renderRhino(ctx,monster,time){
    ctx.strokeStyle='#293641';ctx.lineWidth=2;ctx.fillStyle='#748995';
    ctx.beginPath();ctx.ellipse(-2,-6,24,17,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#a6b9be';for(const x of [-15,-2,11]){ctx.beginPath();ctx.roundRect(x-6,-22,11,25,3);ctx.fill();ctx.stroke();}
    ctx.fillStyle='#596e7b';ctx.beginPath();ctx.ellipse(22,-6,12,11,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#eadbbb';ctx.beginPath();ctx.moveTo(24,-12);ctx.lineTo(31,-33);ctx.lineTo(35,-10);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#e4a753';ctx.beginPath();ctx.arc(23,-12,2.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#465766';for(const x of [-17,9])ctx.fillRect(x,5,9,9);
  },
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
  renderExecutionerGolem: function(ctx,m,time) {
    const a=m.action,p=a?Math.min(1,a.elapsed/a.duration):0,wind=a&&!a.released,walk=Math.sin(time*7)*Math.min(3,Math.hypot(m.vx||0,m.vy||0)/35);
    ctx.strokeStyle='#171e28';ctx.lineWidth=2;
    const plate=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,3);ctx.fill();ctx.stroke();};
    for(const side of [-1,1]){plate(side*12-7,-7+side*walk,14,18,'#424a58');plate(side*12-9,8+side*walk,18,7,'#242b38');}
    plate(-21,-37,42,32,'#303745');plate(-27,-42,18,14,'#647080');plate(9,-42,18,14,'#647080');
    ctx.fillStyle='#854542';ctx.beginPath();ctx.moveTo(-15,-8);ctx.lineTo(15,-8);ctx.lineTo(20,12);ctx.lineTo(0,7);ctx.lineTo(-20,12);ctx.closePath();ctx.fill();ctx.stroke();
    plate(-12,-58,24,23,'#222935');plate(-16,-49,32,9,'#6e7784');
    ctx.fillStyle='#ff8264';ctx.fillRect(-9,-48,6,3);ctx.fillRect(3,-48,6,3);
    ctx.strokeStyle='#ff7960';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-7,-34);ctx.lineTo(1,-26);ctx.lineTo(-3,-19);ctx.lineTo(8,-12);ctx.stroke();
    for(const side of [-1,1]){ctx.strokeStyle='#a6afbc';ctx.beginPath();ctx.moveTo(side*17,-37);ctx.lineTo(side*24,-23);ctx.lineTo(side*18,-10);ctx.stroke();}
    ctx.save();ctx.translate(23,-24);ctx.rotate(wind?-1.15*(a.elapsed/a.windup):a?Math.sin(p*Math.PI)*1.05:.15);
    plate(-4,-3,10,15,'#636d7e');ctx.strokeStyle='#916846';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(3,20);ctx.lineTo(3,-39);ctx.stroke();
    ctx.fillStyle='#9ca8b5';ctx.strokeStyle='#151b25';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(2,-40);ctx.lineTo(20,-43);ctx.quadraticCurveTo(38,-28,24,-13);ctx.lineTo(4,-21);ctx.lineTo(-7,-16);ctx.lineTo(-11,-33);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='#eddfc7';ctx.beginPath();ctx.moveTo(22,-40);ctx.quadraticCurveTo(34,-29,24,-17);ctx.stroke();ctx.fillStyle='#f8775c';ctx.beginPath();ctx.arc(7,-29,3,0,Math.PI*2);ctx.fill();ctx.restore();
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
  renderVoidDragon: function(ctx,m,time) {
    const a=m.action,charge=a?.kind==='skill'&&!a.released,flap=Math.sin(time*(charge?7:2.6))*8;
    ctx.strokeStyle='#1a152b';ctx.lineWidth=2.5;
    ctx.fillStyle='#39244f';ctx.beginPath();ctx.moveTo(8,-1);ctx.bezierCurveTo(45,10,69,-17,90,4);ctx.quadraticCurveTo(60,24,12,15);ctx.closePath();ctx.fill();ctx.stroke();
    for(const side of [-1,1]){ctx.save();ctx.scale(side,1);ctx.fillStyle='#49306b';ctx.beginPath();ctx.moveTo(13,-39);ctx.lineTo(57,-91+flap);ctx.lineTo(83,-78+flap);ctx.lineTo(70,-50);ctx.lineTo(54,-55);ctx.lineTo(47,-23);ctx.lineTo(32,-34);ctx.lineTo(16,-13);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='#9974bb';ctx.lineWidth=2;for(const [x,y] of [[57,-91+flap],[70,-50],[47,-23]]){ctx.beginPath();ctx.moveTo(14,-39);ctx.lineTo(x,y);ctx.stroke();}ctx.restore();}
    ctx.fillStyle='#5a3e76';ctx.beginPath();ctx.ellipse(0,-24,25,34,-.2,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#a596b9';ctx.beginPath();ctx.ellipse(-4,-21,10,25,-.2,0,Math.PI*2);ctx.fill();
    for(const side of [-1,1]){ctx.fillStyle='#4d345e';ctx.beginPath();ctx.moveTo(side*15,-9);ctx.lineTo(side*29,7);ctx.lineTo(side*27,17);ctx.lineTo(side*10,14);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#d9cde3';for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(side*(13+i*5),13);ctx.lineTo(side*(14+i*5),20);ctx.lineTo(side*(17+i*5),13);ctx.fill();}}
    ctx.fillStyle='#6b4c89';ctx.beginPath();ctx.moveTo(-15,-42);ctx.bezierCurveTo(-30,-62,-20,-79,0,-81);ctx.lineTo(25,-71);ctx.lineTo(32,-59);ctx.lineTo(11,-55);ctx.lineTo(9,-37);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#ccbad8';for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*11,-74);ctx.lineTo(side*25,-98);ctx.lineTo(side*6,-82);ctx.fill();ctx.stroke();}
    ctx.fillStyle='#88f3ed';ctx.beginPath();ctx.moveTo(3,-72);ctx.lineTo(15,-68);ctx.lineTo(6,-64);ctx.closePath();ctx.fill();ctx.strokeStyle='#f3d9ff';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(12,-59);ctx.lineTo(28,-60);ctx.stroke();
    ctx.strokeStyle='#8c68aa';for(let row=0;row<4;row++)for(let col=0;col<3;col++){const x=-18+col*12,y=-41+row*11;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+5,y+5);ctx.lineTo(x+10,y);ctx.stroke();}
    if(charge){ctx.save();ctx.shadowColor='#ad7fff';ctx.shadowBlur=14;ctx.fillStyle='#e3c7ff';ctx.beginPath();ctx.arc(29,-57,5+Math.sin(time*15)*2,0,Math.PI*2);ctx.fill();ctx.restore();}
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
    const barWidth = monster.tier>=4?48:34;
    const barHeight = 4.5;
    const tops={beast:45,rat:29,humanoid:36,skeleton:37,beetle:47,boar:42,toad:28,serpent:42,monkey:44,spider:38,zombie:47,snake:42,wolf:43,panther:36,bear:47,bat:42,crab:46,treant:58,golem:53,centaur:75,naga:83,undead_mage:68,ape:78,floating_wraith:68,demon_lord:98,titan_ape:83,three_headed_hydra:84,void_dragon:112,solar_phoenix:84,ancient_world_tree:72,death_god:59,rhino:44};
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
