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
  renderWeaponAndHands(ctx,pawn,weapon,state,aim,time) {
    const {a,wind,strike,recover} = this.pose(pawn);
    const style = a?.style || window.GameEntities.CombatSystem.weaponStyle(pawn);
    const attack = a && ['attack','skill'].includes(a.kind);
    const thrust = attack ? (a.released ? Math.sin((1-recover)*Math.PI/2) : -wind*.35) : 0;
    const sweep = attack ? (a.released ? -.9+strike*1.6-recover*.7 : .1-wind*1.05) : .05;
    const skin = pawn.appearance?.skinColor || '#efd0a1';
    const steel = weapon?.tier==='god' ? '#ffdd7e' : '#d9e9ed';
    ctx.save();ctx.translate(0,-12);ctx.rotate(a?.angle ?? aim);
    ctx.lineCap='round';ctx.lineJoin='round';
    const line=(x1,y1,x2,y2,color,width)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();};
    const hand=(x,y)=>{ctx.fillStyle=skin;ctx.strokeStyle='#27323d';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();ctx.stroke();};
    if(a?.kind==='drink'){
      hand(8,-10);ctx.fillStyle='#ec6476';ctx.fillRect(6,-19,8,11);ctx.fillStyle='#ead7aa';ctx.fillRect(8,-22,4,4);
      ctx.restore();return;
    }
    if(a?.kind==='dodge'){
      for(let i=0;i<3;i++)line(-15-i*10,4+i*4,-24-i*10,4+i*4,'#e8f7ff',2);
      hand(5,10);hand(10,-9);ctx.restore();return;
    }
    if(a?.kind==='block' || pawn.guardTimer>0) {
      if(style==='unarmed'){line(8,-11,18,6,skin,5);line(8,11,18,-6,skin,5);hand(18,6);hand(18,-6);}
      else if(style==='tome'){ctx.fillStyle='#7965a5';ctx.fillRect(10,-14,12,25);line(16,-14,16,11,'#fff0c3',1);hand(11,5);}
      else if(style==='bow'||style==='crossbow'){line(13,-17,18,17,'#b99765',4);hand(12,-5);hand(17,8);}
      else if(style==='spear'||style==='staff'){line(13,-27,18,24,'#b59566',4);hand(14,-4);hand(16,9);if(style==='staff'){ctx.fillStyle='#c2a6ff';ctx.beginPath();ctx.arc(13,-28,5,0,Math.PI*2);ctx.fill();}}
      else if(style==='axe'||style==='hammer'){line(15,-25,15,20,'#b59566',4);ctx.fillStyle=steel;ctx.fillRect(8,-27,15,11);hand(15,0);hand(15,9);}
      else {line(15,-22,15,20,steel,5);line(8,-8,22,-8,'#b28b4c',4);hand(15,0);hand(12,8);}
      ctx.strokeStyle='#9ceaff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(2,0,27,-.8,.8);ctx.stroke();
      ctx.restore();return;
    }
    if(style==='unarmed'){
      const punch=thrust*15;line(5,-6,16+punch,-6,'#3b4352',4);hand(16+punch,-6);hand(11,10);
    } else if(['sword','axe','hammer','dagger'].includes(style)){
      ctx.translate(12+Math.max(0,thrust)*4,5);ctx.rotate(sweep);
      const length=style==='dagger'?21:style==='sword'?39:34;
      line(-5,0,length,0,'#243340',7);line(-5,0,length,0,style==='sword'||style==='dagger'?steel:'#947350',4);
      if(style==='sword'||style==='dagger'){
        ctx.fillStyle=steel;ctx.beginPath();ctx.moveTo(9,-3);ctx.lineTo(length+5,0);ctx.lineTo(9,3);ctx.closePath();ctx.fill();
        line(5,-7,5,7,'#d4ac63',3);
      } else if(style==='hammer'){
        ctx.fillStyle=steel;ctx.strokeStyle='#263744';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(length-8,-12,14,24,3);ctx.fill();ctx.stroke();
      } else {
        ctx.fillStyle=steel;ctx.beginPath();ctx.moveTo(length-7,-3);ctx.quadraticCurveTo(length-18,-20,length+9,-16);ctx.lineTo(length+4,5);ctx.closePath();ctx.fill();ctx.stroke();
      }
      hand(0,0);if(style==='axe'||style==='hammer')hand(-7,0);
    } else if(style==='spear'){
      const x=thrust*23;line(-18+x,3,45+x,3,'#263744',6);line(-18+x,3,45+x,3,'#b89c68',3);
      ctx.fillStyle=steel;ctx.beginPath();ctx.moveTo(43+x,-3);ctx.lineTo(58+x,3);ctx.lineTo(43+x,9);ctx.closePath();ctx.fill();
      hand(7+x,3);hand(-8+x,3);
    } else if(style==='bow'){
      const draw=attack && !a.released?wind*13:0;
      ctx.strokeStyle='#d3a66a';ctx.lineWidth=4;ctx.beginPath();ctx.arc(9,0,20,-1.2,1.2);ctx.stroke();
      line(16,-19,7-draw,0,'#f5ecd4',1);line(7-draw,0,16,19,'#f5ecd4',1);
      if(!a?.released)line(5-draw,0,35-draw,0,steel,2);hand(19,0);hand(7-draw,0);
    } else if(style==='crossbow'){
      const recoil=a?.released ? (1-strike)*5 : 0;line(4-recoil,0,34-recoil,0,'#9e7952',7);
      line(26-recoil,-14,26-recoil,14,steel,4);line(26-recoil,-14,12-recoil,0,'#e8d5af',1);line(26-recoil,14,12-recoil,0,'#e8d5af',1);
      hand(9-recoil,0);hand(18-recoil,5);
    } else if(style==='staff'){
      const lift=attack ? wind*8*(1-recover):0;
      ctx.translate(16+thrust*6,-lift);ctx.rotate(-.35+thrust*.25);
      line(0,18,0,-23,'#302b45',7);line(0,18,0,-23,'#b59566',4);
      ctx.fillStyle=a?.color || '#c2a6ff';ctx.beginPath();ctx.arc(0,-25,7,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#fff0bd';ctx.lineWidth=2;ctx.stroke();hand(0,4);hand(-9,10);
      if(attack){ctx.strokeStyle=a.color||'#c2a6ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-25,11+wind*5,0,Math.PI*2);ctx.stroke();}
    } else if(style==='tome'){
      ctx.translate(15,-wind*4);ctx.fillStyle='#7965a5';ctx.strokeStyle='#263744';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(-10,-10);ctx.lineTo(0,-6);ctx.lineTo(10,-10);ctx.lineTo(10,10);ctx.lineTo(0,14);ctx.lineTo(-10,10);ctx.closePath();ctx.fill();ctx.stroke();
      line(0,-6,0,14,'#fff0c3',2);hand(-9,10);hand(12+thrust*8,-8);
      if(attack){ctx.strokeStyle=a.color||'#bd9cff';ctx.beginPath();ctx.arc(25,-9,7+wind*7,0,Math.PI*2);ctx.stroke();}
    }
    ctx.restore();
  }
};
