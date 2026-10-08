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
  // Silhouette + tier FX live in weaponArt.js; fx={time,sw,fade} only drives time-based glow and the ancient swing trail.
  drawWeapon(ctx,weapon={},draw=0,fx){window.GameRenderer.WeaponArt.draw(ctx,weapon,this.weaponType(weapon),draw,fx);},
  weaponType(w){return w.type==='hybrid_cane'?'staff':this.stylesHas(w.type)?w.type:'sword';},
  stylesHas(type){return ['sword','dagger','axe','hammer','spear','bow','crossbow','staff','tome'].includes(type);},
  renderWeaponAndHands(ctx,pawn,weapon,state,aim,time){
    const {a,wind,strike,recover}=this.pose(pawn),style=weapon?this.weaponType(weapon):'unarmed';
    const attack=a&&['attack','skill'].includes(a.kind),fx={time,sw:attack&&a.released?strike:0,fade:attack&&a.released?Math.max(0,1-recover*2.2):0},thrust=attack?(a.released?Math.sin((1-recover)*Math.PI/2):-wind*.35):0;
    ctx.save();ctx.translate(0,-12);ctx.rotate(a?.angle??aim);
    const hand=(x,y)=>{ctx.fillStyle=pawn.appearance?.skinColor||'#efd0a1';ctx.strokeStyle='#27323d';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,3.8,0,Math.PI*2);ctx.fill();ctx.stroke();};
    if(a?.kind==='drink'){hand(8,-10);ctx.fillStyle='#ec6476';ctx.fillRect(6,-19,8,11);ctx.fillStyle='#ead7aa';ctx.fillRect(8,-22,4,4);}
    else if(a?.kind==='dodge'){hand(5,10);hand(10,-9);}
    else if(a?.kind==='block'||pawn.guardTimer>0){
      if(style!=='unarmed'){ctx.save();ctx.translate(15,12);ctx.rotate(-Math.PI/2);this.drawWeapon(ctx,weapon,0,fx);ctx.restore();}
      hand(15,-3);hand(15,9);ctx.strokeStyle='#9ceaff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(2,0,27,-.8,.8);ctx.stroke();
    }else if(style==='unarmed'){hand(16+thrust*15,-6);hand(11,10);}
    else{
      ctx.save();
      if(['sword','axe','hammer','dagger'].includes(style)){
        ctx.translate(12+Math.max(0,thrust)*4,5);ctx.rotate(attack?(a.released?-.9+strike*1.6-recover*.7:.1-wind*1.05):.05);
        this.drawWeapon(ctx,weapon,0,fx);hand(0,0);if(['axe','hammer'].includes(style))hand(-7,0);
      }else if(style==='spear'){ctx.translate(thrust*23,3);this.drawWeapon(ctx,weapon,0,fx);hand(7,0);hand(-8,0);}
      else if(style==='bow'){this.drawWeapon(ctx,weapon,attack&&!a.released?wind*13:0,fx);hand(29,0);hand(7-(attack&&!a.released?wind*13:0),0);}
      else if(style==='crossbow'){ctx.translate(a?.released?-(1-strike)*5:0,0);this.drawWeapon(ctx,weapon,0,fx);hand(5,7);hand(19,5);}
      else if(style==='staff'){
        ctx.translate(12+thrust*6,4);ctx.rotate(-.8-wind*.2*(1-recover));this.drawWeapon(ctx,weapon,0,fx);hand(-2,0);hand(-12,0);
        if(attack){ctx.strokeStyle=a.color||'#c2a6ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(35,0,14+wind*4,0,Math.PI*2);ctx.stroke();}
      }else if(style==='tome'){ctx.translate(7,-wind*4);this.drawWeapon(ctx,weapon,0,fx);hand(5,12);hand(31+thrust*8,-8);}
      ctx.restore();
    }
    ctx.restore();
  }
};
