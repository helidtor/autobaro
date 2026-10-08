window.GameRenderer = window.GameRenderer || {};

/* Poses stay relative to the locked aim. No continuous weapon orbit.
   Windup, contact and recovery use the same clock as damage resolution. */
window.GameRenderer.WeaponAnimations = {
  pose(pawn) {
    const a = pawn.action;
    if (!a) return {wind:0, strike:0, recover:0, a:null};
    const wind = Math.min(1,a.elapsed/Math.max(.01,a.windup));
    const strike = a.elapsed < a.windup ? 0 : Math.min(1,(a.elapsed-a.windup)/Math.max(.07,a.active || .12));
    const recover = Math.max(0,(a.elapsed-a.windup-(a.active || .12))/Math.max(.01,a.duration-a.windup-(a.active || .12)));
    return {a,wind,strike,recover};
  },
  drawWeapon(ctx,weapon={},draw=0){
    const type=this.weaponType(weapon),rank=Math.max(0,['common','rare','super_rare','supreme','god','ancient'].indexOf(weapon.tier));
    const accent=window.GameData.Equipments.TIER_COLORS[weapon.tier]||'#a68c62',wood=rank?'#73524a':'#98754d',metal=rank>=4?'#ffe8a4':'#c3d5df';
    const variation=[...(weapon.id||type)].reduce((v,c)=>v+c.charCodeAt(0),0)%3;
    ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
    const line=(x,y,tx,ty,color,width=1.5)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(tx,ty);ctx.stroke();};
    const poly=(points,color)=>{ctx.fillStyle=color;ctx.strokeStyle='#202e3b';ctx.lineWidth=1.5;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();ctx.stroke();};
    const gem=(x,y,r=3)=>poly([[x-r,y],[x,y-r],[x+r,y],[x,y+r]],accent);
    if(['sword','dagger','spear'].includes(type)){
      const length=type==='dagger'?27:type==='spear'?62:44+variation*3;
      if(type==='spear'){
        line(-25,0,44,0,'#26323c',5);line(-25,0,44,0,wood,3);
        poly([[40,-4],[length,0],[40,4],[44,0]],metal);
        if(rank>1){poly([[43,0],[51,-12],[47,-2]],metal);poly([[43,0],[49,10],[47,2]],metal);}
        line(32,-4,34,4,accent,3);line(36,-4,38,4,accent,3);
        poly([[32,2],[28,14],[36,11]],rank?'#bf5362':'#c4a87c');
      }else{
        const curved=variation===1&&type==='sword',wide=variation===2?5:3.5;
        if(curved)poly([[7,-wide],[length-10,-wide-3],[length+3,-9],[length,0],[12,wide]],metal);
        else poly([[7,-wide],[length-7,-wide],[length+3,0],[length-7,wide],[7,wide]],metal);
        line(12,0,length-6,0,'#f6fcff',1.2);line(13,2,length-8,2,'#7e93a6',1);
        poly([[3,-2],[-10,-2],[-10,2],[3,2]],wood);line(5,-8,5,8,accent,3);
        for(let x=-8;x<2;x+=3)line(x,-2,x+1,2,'#d4bd98',1);
        gem(-12,0,rank?3.5:2);if(rank>1)gem(12,0,2);
      }
    }else if(type==='axe'||type==='hammer'){
      line(-12,0,38,0,'#26323c',6);line(-12,0,38,0,wood,3.5);
      for(let x=-8;x<8;x+=4)line(x,-2,x+1,2,'#d7c19a',1);
      if(type==='hammer'){
        poly([[27,-13],[42,-13],[45,-9],[45,9],[42,13],[27,13],[24,9],[24,-9]],metal);
        line(29,-10,29,10,'#f8ffff',2);line(41,-9,41,9,'#7f929e',3);gem(35,0,5);
        if(rank>1)for(const y of [-8,8])poly([[32,y],[36,y*1.9],[40,y]],metal);
      }else{
        poly([[29,-3],[23,-13],[30,-21],[44,-23],[40,-14],[40,5],[31,9]],metal);
        line(28,-16,41,-21,'#f7ffff',2);line(31,-9,36,-4,'#7f929e',1.5);
        if(rank>0)poly([[31,2],[25,12],[32,20],[43,21],[39,11],[39,2]],metal);
        gem(35,0,3);
      }
    }else if(type==='bow'){
      const recurve=rank||variation;
      ctx.strokeStyle='#27323c';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(15,-24);ctx.bezierCurveTo(recurve?35:27,-27,36,-9,29,0);ctx.bezierCurveTo(36,9,recurve?35:27,27,15,24);ctx.stroke();
      ctx.strokeStyle=wood;ctx.lineWidth=3;ctx.stroke();
      line(15,-24,7-draw,0,'#ede5cd',1);line(7-draw,0,15,24,'#ede5cd',1);
      line(26,-5,29,5,accent,4);line(16,-21,21,-23,accent,3);line(16,21,21,23,accent,3);
      line(2-draw,0,38-draw,0,'#ddc8a0',2);poly([[38-draw,-3],[44-draw,0],[38-draw,3]],metal);
      for(const y of [-2,2])line(3-draw,0,-3-draw,y,accent,2);
    }else if(type==='crossbow'){
      poly([[0,-4],[36,-4],[39,0],[36,4],[0,4],[-4,1]],wood);
      ctx.strokeStyle=metal;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(20,-20);ctx.quadraticCurveTo(37,0,20,20);ctx.stroke();
      line(20,-20,12,0,'#eee0c3',1);line(20,20,12,0,'#eee0c3',1);line(5,0,40,0,'#344555',2);
      poly([[4,3],[10,3],[7,12],[2,12]],wood);gem(30,0,3);
      line(12,-5,12,5,accent,2);line(34,-4,34,4,accent,2);
    }else if(type==='staff'){
      line(-20,0,31,0,'#29313d',6);line(-20,0,31,0,wood,3.5);
      for(const x of [7,12,22])line(x,-3,x,3,accent,2);
      const crystal=rank>1;
      poly(crystal?[[26,0],[30,-10],[37,-12],[43,0],[37,12],[30,10]]:[[28,-6],[38,-8],[43,0],[38,8],[28,6]],accent);
      line(33,-6,38,-4,'#fbf6ff',2);line(32,0,36,7,'#645c91',1.5);
      ctx.strokeStyle=rank?'#ead59c':'#8c7654';ctx.lineWidth=2;ctx.beginPath();ctx.arc(35,0,12,-1.8,1.8);ctx.stroke();
      if(rank>2){gem(35,-16,2);gem(35,16,2);}
    }else if(type==='tome'){
      poly([[3,-14],[17,-10],[31,-14],[31,13],[17,17],[3,13]],rank?'#55416e':'#6e584d');
      poly([[5,-11],[16,-7],[16,13],[5,9]],'#eedfbc');poly([[18,-7],[29,-11],[29,9],[18,13]],'#d7c69f');
      for(let y=-3;y<10;y+=4){line(7,y,13,y+2,'#937d69',1);line(21,y+2,27,y,'#937d69',1);}
      line(17,-9,17,15,accent,2);poly([[22,-13],[25,-14],[25,-3],[22,-6]],accent);
      gem(1,-13,2);gem(33,-13,2);
    }
    if(rank>1&&type!=='bow'&&type!=='tome')for(const x of [17,22]){line(x,-2,x+2,2,accent,1);line(x+2,2,x+3,-1,accent,1);}
    ctx.restore();
  },
  weaponType(w){return w.type==='hybrid_cane'?'staff':this.stylesHas(w.type)?w.type:'sword';},
  stylesHas(type){return ['sword','dagger','axe','hammer','spear','bow','crossbow','staff','tome'].includes(type);},
  renderWeaponAndHands(ctx,pawn,weapon,state,aim,time){
    const {a,wind,strike,recover}=this.pose(pawn),style=weapon?this.weaponType(weapon):'unarmed';
    const attack=a&&['attack','skill'].includes(a.kind),thrust=attack?(a.released?Math.sin((1-recover)*Math.PI/2):-wind*.35):0;
    ctx.save();ctx.translate(0,-12);ctx.rotate(a?.angle??aim);
    const hand=(x,y)=>{ctx.fillStyle=pawn.appearance?.skinColor||'#efd0a1';ctx.strokeStyle='#27323d';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,3.8,0,Math.PI*2);ctx.fill();ctx.stroke();};
    if(a?.kind==='drink'){hand(8,-10);ctx.fillStyle='#ec6476';ctx.fillRect(6,-19,8,11);ctx.fillStyle='#ead7aa';ctx.fillRect(8,-22,4,4);}
    else if(a?.kind==='dodge'){hand(5,10);hand(10,-9);}
    else if(a?.kind==='block'||pawn.guardTimer>0){
      if(style!=='unarmed'){ctx.save();ctx.translate(15,12);ctx.rotate(-Math.PI/2);this.drawWeapon(ctx,weapon);ctx.restore();}
      hand(15,-3);hand(15,9);ctx.strokeStyle='#9ceaff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(2,0,27,-.8,.8);ctx.stroke();
    }else if(style==='unarmed'){hand(16+thrust*15,-6);hand(11,10);}
    else{
      ctx.save();
      if(['sword','axe','hammer','dagger'].includes(style)){
        ctx.translate(12+Math.max(0,thrust)*4,5);ctx.rotate(attack?(a.released?-.9+strike*1.6-recover*.7:.1-wind*1.05):.05);
        this.drawWeapon(ctx,weapon);hand(0,0);if(['axe','hammer'].includes(style))hand(-7,0);
      }else if(style==='spear'){ctx.translate(thrust*23,3);this.drawWeapon(ctx,weapon);hand(7,0);hand(-8,0);}
      else if(style==='bow'){this.drawWeapon(ctx,weapon,attack&&!a.released?wind*13:0);hand(29,0);hand(7-(attack&&!a.released?wind*13:0),0);}
      else if(style==='crossbow'){ctx.translate(a?.released?-(1-strike)*5:0,0);this.drawWeapon(ctx,weapon);hand(5,7);hand(19,5);}
      else if(style==='staff'){
        ctx.translate(12+thrust*6,4);ctx.rotate(-.8-wind*.2*(1-recover));this.drawWeapon(ctx,weapon);hand(-2,0);hand(-12,0);
        if(attack){ctx.strokeStyle=a.color||'#c2a6ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(35,0,14+wind*4,0,Math.PI*2);ctx.stroke();}
      }else if(style==='tome'){ctx.translate(7,-wind*4);this.drawWeapon(ctx,weapon);hand(5,12);hand(31+thrust*8,-8);}
      ctx.restore();
    }
    ctx.restore();
  }
};
