/**
 * vfxManager.js - Hiệu ứng kỹ năng data-driven: 8 primitive (ring, arc, beam, pillar, decal, burst, streak, glyph)
 * + telegraph chính xác hitbox, ghép theo recipe trong vfxRecipes.js (id kỹ năng / mode quái / effect boss / kind cũ).
 * Ba pha: tele (báo hiệu) -> exec (ra đòn) -> zone/after (vùng tồn đọng / ảnh tàn).
 * Hạt analytic (tính từ tiến độ p, không state) + pool hạt có trần; ánh sáng bằng gradient / 'lighter', không shadowBlur.
 * Mọi random của hình ảnh dùng PRNG cục bộ (không đụng Math.random của mô phỏng).
 */
window.GameRenderer = window.GameRenderer || {};
(function(){
const TAU=Math.PI*2,PI=Math.PI,MAX_EFFECTS=140,MAX_PARTICLES=500,MAX_PROJECTILES=80;
const clamp=(v,a=0,b=1)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,eo=t=>1-(1-t)*(1-t)*(1-t);
// Hash không trạng thái -> [0,1): cùng seed luôn cho cùng hình.
const H=(a,b)=>{let x=Math.imul((a|0)^0x9e3779b9,0x85ebca6b)^Math.imul((b|0)+0x7f4a7c15,0xc2b2ae35);x^=x>>>15;x=Math.imul(x,0x2c1b3c6d);x^=x>>>12;x=Math.imul(x,0x297a2d39);x^=x>>>15;return(x>>>0)/4294967296;};

// ---------- Palette ----------
const hex=v=>'#'+[v[0],v[1],v[2]].map(n=>Math.round(clamp(n,0,255)).toString(16).padStart(2,'0')).join('');
function mk(core,mid,edge,dark){
  const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),m=rgb(mid),e=rgb(edge),d=rgb(dark);
  return{core,mid,edge,dark,mid0:`rgba(${m},0)`,edge0:`rgba(${e},0)`,dark0:`rgba(${d},0)`,darkA:`rgba(${d},.6)`};
}
const PAL={
  fire:mk('#fff3c4','#ff9b3d','#d6381f','#4a1208'),ice:mk('#ffffff','#8be6ff','#3b8fe0','#0d2a5c'),
  void:mk('#f3e6ff','#b58cff','#6a3bc4','#1a0b3a'),steel:mk('#ffffff','#ffe4a3','#c9a24a','#4a3b15'),
  earth:mk('#fff0d0','#e0b070','#8f6a3a','#2c1d0e'),nature:mk('#efffd0','#a9e76c','#3f9a3a','#102c14'),
  poison:mk('#f4ffb0','#9be83a','#4c8f1e','#16300a'),heal:mk('#ffffff','#86efb5','#2fb877','#0b3a25'),
  blood:mk('#ffd0d0','#ff4d5e','#8e1224','#2a0509'),shadow:mk('#d8c8ff','#8b6bd0','#3a2468','#0a0614'),
  lightning:mk('#ffffff','#fff07a','#58b4ff','#17243f'),mecha:mk('#ffffff','#ff8a7a','#ff3b30','#3a0f0c'),
  chaos:mk('#ffe0ea','#ff5b86','#a3103b','#2d0512'),wind:mk('#ffffff','#bff5e6','#5fd1b4','#0f3a30'),
  smoke:mk('#e0dcec','#9a98b0','#5f5d78','#1e1d2a'),mana:mk('#e8f0ff','#7ab8ff','#3a5fe0','#0c1a4a'),
  holy:mk('#ffffff','#ffe9a0','#e0a93a','#4a3410')
};
const tintCache=new Map();
function tintPal(c){
  if(typeof c!=='string'||!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c))return PAL.steel;
  let p=tintCache.get(c);if(p)return p;
  const h=c.length===4?'#'+c[1]+c[1]+c[2]+c[2]+c[3]+c[3]:c,v=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
  p=mk(hex(v.map(n=>n+(255-n)*.75)),hex(v),hex(v.map(n=>n*.62)),hex(v.map(n=>n*.2)));
  if(tintCache.size>64)tintCache.clear();
  tintCache.set(c,p);return p;
}

// ---------- Scratch state (không cấp phát trong vòng vẽ nóng) ----------
const S={e:null,p:0,t:0,R:30,L:30,hw:25,arc:.75,angle:0,shape:'circle',inner:0,tier:1,k:1,pal:PAL.steel,seed:0,ex:0,ey:0,fade:1};
function setup(src,p,t,pal){
  S.p=p;S.t=t;S.R=Math.max(0,src.radius??30);S.L=Math.max(0,src.length||S.R);S.hw=src.halfW||25;S.arc=src.arc||.75;
  S.angle=src.angle||0;S.shape=src.shape||'circle';S.inner=src.inner||0;S.tier=src.tier||1;S.k=1+.18*(S.tier-1);
  S.pal=pal;S.seed=src.seed|0;S.ex=(src.tx??src.x??0)-(src.x??0);S.ey=(src.ty??src.y??0)-(src.y??0);S.fade=1;
}
// Đường bao hitbox (circle / line / cone) theo tỉ lệ f; dùng cho telegraph, fill, clip decal.
function region(c,s,f=1){
  if(s.shape==='line')c.rect(0,-s.hw,s.L*f,s.hw*2);
  else if(s.shape==='cone'){c.moveTo(0,0);c.arc(0,0,s.L*f,-s.arc,s.arc);c.closePath();}
  else{c.moveTo(s.R*f,0);c.arc(0,0,s.R*f,0,TAU);if(s.inner&&f>=1){c.moveTo(s.inner,0);c.arc(0,0,s.inner,0,TAU,true);}}
}
function glow(c,r,col0,col1,a){ // đĩa sáng mềm (gradient, không shadowBlur)
  r=Math.max(.5,r);const g=c.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,col0);g.addColorStop(1,col1);
  const op=c.globalCompositeOperation;c.globalCompositeOperation='lighter';c.globalAlpha=a;c.fillStyle=g;c.beginPath();c.arc(0,0,r,0,TAU);c.fill();c.globalCompositeOperation=op;
}
function star4(c,x,y,r){c.beginPath();c.moveTo(x,y-r);c.lineTo(x+r*.28,y-r*.28);c.lineTo(x+r,y);c.lineTo(x+r*.28,y+r*.28);c.lineTo(x,y+r);c.lineTo(x-r*.28,y+r*.28);c.lineTo(x-r,y);c.lineTo(x-r*.28,y-r*.28);c.closePath();c.fill();}
function poly(c,n,r,rot=0){c.beginPath();for(let i=0;i<n;i++){const a=rot+i*TAU/n;i?c.lineTo(Math.cos(a)*r,Math.sin(a)*r):c.moveTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();}
function zig(c,x0,y0,x1,y1,seed,amp,steps=8){c.moveTo(x0,y0);const dx=x1-x0,dy=y1-y0,l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l;
  for(let i=1;i<steps;i++){const u=i/steps,o=(H(seed,i)-.5)*2*amp;c.lineTo(x0+dx*u+nx*o,y0+dy*u+ny*o);}c.lineTo(x1,y1);}

// ---------- 8 primitive ----------
const P={};
P.ring=(c,s,o,q)=>{
  const n=o.n||1,R=o.R||s.R,pal=s.pal;
  for(let i=0;i<n;i++){
    const u=(q-i*(o.gap||.15))/Math.max(.2,1-(n-1)*(o.gap||.15));if(u<=0||u>=1)continue;
    const r=Math.max(0,R*lerp(o.r0??.1,o.r1??1,eo(u))),a=Math.pow(1-u,.8)*(o.a??1);
    if(o.fill){const g=c.createRadialGradient(0,0,r*.4,0,0,r+1);g.addColorStop(0,pal.mid0);g.addColorStop(1,pal.mid);c.globalAlpha=a*o.fill;c.fillStyle=g;c.beginPath();c.arc(0,0,r,0,TAU);c.fill();}
    if(o.dash)c.setLineDash([6,5]);
    c.globalAlpha=a;c.lineWidth=(o.w??6)*s.k*(1-u*.75)+1;c.strokeStyle=pal.mid;c.beginPath();c.arc(0,0,r,0,TAU);c.stroke();
    c.lineWidth=Math.max(1,c.lineWidth*.35);c.strokeStyle=pal.core;c.globalAlpha=a*.85;c.stroke();if(o.dash)c.setLineDash([]);
  }
};
P.arc=(c,s,o,q)=>{
  const L=Math.max(1,o.L||(o.r||1)*s.L),a=o.spread??s.arc,th=o.th??.28,n=o.n||1,pal=s.pal,lead=lerp(-a,a,eo(q)),al=(1-q*q)*(o.a??1);
  for(let i=0;i<n;i++){
    const rot=s.angle+(o.off||0)+i*(o.step??TAU/n),dir=o.flip?-1:1;
    c.rotate(rot);if(dir<0)c.scale(1,-1);
    const g=c.createRadialGradient(0,0,L*(1-th),0,0,L);g.addColorStop(0,pal.edge0);g.addColorStop(.6,pal.mid);g.addColorStop(1,pal.core);
    c.globalAlpha=al;c.fillStyle=g;c.beginPath();c.arc(0,0,L,-a,lead);c.arc(0,0,L*(1-th),lead,-a,true);c.closePath();c.fill();
    c.strokeStyle=pal.core;c.lineWidth=2.5*s.k;c.beginPath();c.moveTo(Math.cos(lead)*L*(1-th*1.1),Math.sin(lead)*L*(1-th*1.1));c.lineTo(Math.cos(lead)*L*1.05,Math.sin(lead)*L*1.05);c.stroke();
    if(dir<0)c.scale(1,-1);c.rotate(-rot);
  }
};
P.beam=(c,s,o,q)=>{
  const a=(o.abs?0:s.angle)+(o.da||0),x0=o.from||0,x1=o.px!==undefined?o.px:(o.len??1)*s.L,pal=s.pal,w=(o.w??14)*s.k*(o.hold?1:Math.sqrt(1-q)),
    fl=o.flick?.7+.3*Math.sin(s.t*50):1;
  c.rotate(a);c.lineCap='round';c.lineJoin='round';
  const stroke=(wd,col,al)=>{c.globalAlpha=al*fl*(o.a??1);c.lineWidth=Math.max(.5,wd);c.strokeStyle=col;c.beginPath();
    if(o.zig)zig(c,x0,0,x1,0,s.seed+(q*6|0)*17,o.zig*(1-q*.5),10);else{c.moveTo(x0,0);c.lineTo(x1,0);}c.stroke();};
  stroke(w*2.4,pal.edge,.35);stroke(w*1.3,pal.mid,.7);stroke(w*.5,pal.core,.95);
  glow(c,w*1.6,pal.core,pal.mid0,.6*(1-q));c.translate(x1,0);glow(c,w*1.8,pal.mid,pal.mid0,.5*(1-q));c.translate(-x1,0);
  c.rotate(-a);
};
P.pillar=(c,s,o,q)=>{
  const w=(o.px||(o.w??.5)*s.R)*(1+.35*(1-q)),h=o.h??160,pal=s.pal;
  if(o.drop){ // thiên thạch rơi trong pha báo hiệu: chạm đất đúng lúc hết windup
    const y=-h*(1-s.p*s.p),r=Math.max(3,w*.5);c.globalAlpha=(o.a??1)*clamp(s.p*3);c.translate(0,y);
    const g=c.createLinearGradient(0,0,0,-h*.35);g.addColorStop(0,pal.mid);g.addColorStop(1,pal.mid0);c.fillStyle=g;c.beginPath();c.moveTo(-r*.8,0);c.lineTo(0,-h*.35);c.lineTo(r*.8,0);c.fill();
    glow(c,r*2,pal.core,pal.mid0,c.globalAlpha);glow(c,r,pal.core,pal.mid,c.globalAlpha);c.translate(0,-y);
    c.globalAlpha=.25*s.p;c.fillStyle=pal.edge;c.beginPath();c.ellipse(0,0,w*(.4+s.p),w*(.4+s.p)*.5,0,0,TAU);c.fill();return;
  }
  const al=Math.pow(1-q,.6)*(o.a??1),g=c.createLinearGradient(-w,0,w,0);
  g.addColorStop(0,pal.edge0);g.addColorStop(.35,pal.mid);g.addColorStop(.5,pal.core);g.addColorStop(.65,pal.mid);g.addColorStop(1,pal.edge0);
  c.globalAlpha=al;c.fillStyle=g;c.fillRect(-w,-h,w*2,h);
  const gb=c.createRadialGradient(0,0,0,0,0,w*2);gb.addColorStop(0,pal.core);gb.addColorStop(1,pal.mid0);c.globalAlpha=al*.8;c.fillStyle=gb;c.beginPath();c.ellipse(0,0,w*2,w,0,0,TAU);c.fill();
};
P.burst=(c,s,o,q)=>{
  const k=o.k||'spark',n=Math.max(1,Math.round((o.n||8)*(1+.25*(s.tier-1)))),R=o.R||s.R,r0=o.r0??0,r1=o.r1??1,u=eo(q),pal=s.pal,sd=s.seed+(o.sd||0);
  c.lineCap='round';
  for(let i=0;i<n;i++){
    const h1=H(sd,i),h2=H(sd,i+50),h3=H(sd,i+99);
    if(k==='arrowfall'){
      const d=h3*.45,qq=clamp((q*1.35-d)/.4),x=(h1*2-1)*R*.8,ye=(h2*2-1)*R*.6,y=lerp(ye-170,ye,qq);
      c.globalAlpha=(o.a??1)*(qq<1?1:1-clamp((q-.55)/.45));c.strokeStyle=pal.mid;c.lineWidth=1.6;c.beginPath();c.moveTo(x,y-13);c.lineTo(x,y);c.stroke();
      c.strokeStyle=pal.core;c.beginPath();c.moveTo(x,y-3);c.lineTo(x,y);c.stroke();continue;
    }
    let a=o.dir?s.angle+(h2-.5)*2*(o.spread||.75):h1*TAU,uu=u,al=(1-q)*(o.a??1);
    if(o.loop){uu=(s.t*.8+h1)%1;al=Math.sin(uu*PI)*(o.a??1);}
    const rr=lerp(r0,r1,o.inward?1-uu:uu)*R*(.55+.45*h3),ca=Math.cos(a),sa=Math.sin(a);
    const x=ca*rr,y=sa*rr-(o.up||0)*u+(o.g||0)*q*q,sz=(o.sz||3)*(1-q*.55)*(.7+.6*h2);
    c.globalAlpha=al;
    if(k==='spark'){const len=3+8*(1-q);c.strokeStyle=h3>.5?pal.core:pal.mid;c.lineWidth=1.6;c.beginPath();c.moveTo(x,y);c.lineTo(x-ca*len,y-sa*len);c.stroke();}
    else if(k==='ember'){c.fillStyle=h3>.6?pal.core:pal.mid;c.beginPath();c.arc(x,y,sz,0,TAU);c.fill();}
    else if(k==='shard'){c.save();c.translate(x,y);c.rotate(a+q*3*(h3-.5));c.fillStyle=pal.mid;c.strokeStyle=pal.core;c.lineWidth=1;c.beginPath();c.moveTo(-sz*2,0);c.lineTo(0,-sz);c.lineTo(sz*2.2,0);c.lineTo(0,sz*.6);c.closePath();c.fill();c.stroke();c.restore();}
    else if(k==='puff'){const r=Math.max(1,(6+10*h3)*(.5+q)*(s.k)),g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,pal.mid);g.addColorStop(1,pal.mid0);c.globalAlpha=al*.55;c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}
    else if(k==='cross'){c.fillStyle=pal.core;const z=sz*1.5;c.fillRect(x-z*.3,y-z,z*.6,z*2);c.fillRect(x-z,y-z*.3,z*2,z*.6);}
    else if(k==='leaf'){c.save();c.translate(x,y);c.rotate(q*4+h1*6);c.fillStyle=pal.mid;c.beginPath();c.ellipse(0,0,sz*2,sz,0,0,TAU);c.fill();c.restore();}
    else if(k==='bubble'){c.strokeStyle=pal.core;c.lineWidth=1.2;c.beginPath();c.arc(x,y,Math.max(1,sz*1.6),0,TAU);c.stroke();}
    else if(k==='star'){c.fillStyle=pal.core;star4(c,x,y,sz*2.6);}
    else if(k==='drop'){c.fillStyle=pal.mid;c.beginPath();c.ellipse(x,y,sz*.8,sz*1.3,Math.atan2(sa,ca)+PI/2,0,TAU);c.fill();}
    else if(k==='wisp'){const g=c.createRadialGradient(x,y,0,x,y,sz*3);g.addColorStop(0,pal.core);g.addColorStop(1,pal.mid0);c.fillStyle=g;c.beginPath();c.arc(x,y,Math.max(1,sz*3),0,TAU);c.fill();}
    else if(k==='feather'){c.save();c.translate(x,y);c.rotate(q*3+h1*6);c.strokeStyle=pal.core;c.lineWidth=1.4;c.beginPath();c.moveTo(-sz*2,0);c.quadraticCurveTo(0,-sz*1.4,sz*2,0);c.stroke();c.restore();}
    else if(k==='note'){c.fillStyle=pal.core;c.strokeStyle=pal.core;c.lineWidth=1.4;c.beginPath();c.ellipse(x,y,sz*1.2,sz*.8,-.4,0,TAU);c.fill();c.beginPath();c.moveTo(x+sz*1.1,y);c.lineTo(x+sz*1.1,y-sz*3.2);c.stroke();}
  }
};
P.streak=(c,s,o,q)=>{
  const dx=s.ex,dy=s.ey,len=Math.hypot(dx,dy),pal=s.pal;if(len<1)return;
  const ang=Math.atan2(dy,dx),k=o.k||'wind',n=o.n||4,al=(1-q)*(o.a??1);
  if(k==='ghost'){ // ảnh tàn: bóng người mờ dần dọc đường lướt
    for(let i=0;i<n;i++){const u=(i+.5)/n;c.globalAlpha=al*(.15+.5*(1-u)*(1-q))*(.4+.6*u);c.fillStyle=pal.mid;c.beginPath();c.ellipse(dx*u,dy*u-6,7,12,0,0,TAU);c.fill();}
  }else if(k==='wind'){
    c.rotate(ang);c.strokeStyle=pal.core;c.lineWidth=1.5;c.lineCap='round';
    for(let i=0;i<n;i++){const off=(H(s.seed,i)-.5)*30,a0=len*(H(s.seed,i+9)*.4),a1=a0+len*(.35+.5*H(s.seed,i+19))*eo(clamp(q*2));
      c.globalAlpha=al*.8;c.beginPath();c.moveTo(a0,off);c.lineTo(Math.min(len,a1),off);c.stroke();}
    c.rotate(-ang);
  }else if(k==='dust'){
    for(let i=0;i<n;i++){const u=(i+.5)/n,r=(7+8*H(s.seed,i))*(.6+q),x=dx*u,y=dy*u+8-q*10;
      const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,pal.mid);g.addColorStop(1,pal.mid0);c.globalAlpha=al*.55;c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}
  }else{ // slice
    c.rotate(ang);c.lineCap='round';c.globalAlpha=al;
    c.strokeStyle=pal.mid;c.lineWidth=(o.w??4)*s.k*(1-q)+1;c.beginPath();c.moveTo(0,-8);c.lineTo(len,-8);c.stroke();
    c.strokeStyle=pal.core;c.lineWidth=1.2;c.stroke();c.rotate(-ang);
  }
};
P.glyph=(c,s,o,q)=>{
  const R=Math.max(1,o.R||s.R*(o.r||.6)),k=o.k||'rune',pal=s.pal,t=s.t*(o.spin??1),al=(o.a??1)*(o.hold?clamp((1-s.p)*5)*clamp(s.p*8):Math.sin(clamp(q)*PI)**.5);
  c.globalAlpha=al;c.strokeStyle=pal.mid;c.fillStyle=pal.mid;c.lineWidth=2;c.lineJoin='round';
  if(k==='rune'||k==='star'){
    const n=o.n||5;c.beginPath();c.arc(0,0,R,0,TAU);c.stroke();c.lineWidth=1.4;c.strokeStyle=pal.core;
    c.rotate(t*.9);poly(c,n,R*.86);c.stroke();if(k==='star'||n>=5){c.beginPath();for(let i=0;i<n;i++){const a=i*2*TAU/n*(n%2?1:.5);c.lineTo(Math.cos(a)*R*.86,Math.sin(a)*R*.86);}c.closePath();c.stroke();}
    for(let i=0;i<12;i++){const a=i*TAU/12;c.beginPath();c.moveTo(Math.cos(a)*R,Math.sin(a)*R);c.lineTo(Math.cos(a)*R*1.12,Math.sin(a)*R*1.12);c.stroke();}c.rotate(-t*.9);
  }else if(k==='cross'){ // tâm ngắm thu hẹp
    const rr=R*(1+(1-clamp(s.p))*.6);c.rotate(t*.5);c.beginPath();c.arc(0,0,rr,0,TAU);c.stroke();
    for(let i=0;i<4;i++){c.rotate(PI/2);c.beginPath();c.moveTo(rr*.55,0);c.lineTo(rr*1.35,0);c.stroke();}c.rotate(-t*.5);
  }else if(k==='shield'){
    c.rotate(s.angle);const w=R*.95;c.lineWidth=5*s.k;c.beginPath();c.arc(0,0,R,-.95,.95);c.stroke();c.lineWidth=1.5;c.strokeStyle=pal.core;c.stroke();
    c.globalAlpha=al*.22;c.fillStyle=pal.mid;c.beginPath();c.moveTo(0,0);c.arc(0,0,w,-.95,.95);c.closePath();c.fill();
    c.globalAlpha=al*.7;c.strokeStyle=pal.core;c.lineWidth=1;for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(Math.cos(i*.4)*R*.55,Math.sin(i*.4)*R*.55);c.lineTo(Math.cos(i*.4)*R,Math.sin(i*.4)*R);c.stroke();}
    c.rotate(-s.angle);
  }else if(k==='orbit'){
    const n=o.n||3;for(let i=0;i<n;i++){const a=t*2.2+i*TAU/n,x=Math.cos(a)*R,y=Math.sin(a)*R*.7;c.save();c.translate(x,y);glow(c,6,pal.core,pal.mid0,al);c.globalAlpha=al;c.fillStyle=pal.core;c.beginPath();c.arc(0,0,2.2,0,TAU);c.fill();c.restore();}
    c.globalAlpha=al*.35;c.lineWidth=1;c.beginPath();c.ellipse(0,0,R,R*.7,0,0,TAU);c.stroke();
  }else if(k==='swap'){
    c.rotate(t*1.6);for(let i=0;i<2;i++){c.rotate(PI);c.beginPath();c.arc(0,0,R,.3,PI*.8);c.stroke();const a=PI*.8;c.beginPath();c.moveTo(Math.cos(a)*R,Math.sin(a)*R);c.lineTo(Math.cos(a-.35)*R*1.2,Math.sin(a-.35)*R*1.2);c.moveTo(Math.cos(a)*R,Math.sin(a)*R);c.lineTo(Math.cos(a+.3)*R*.8,Math.sin(a+.3)*R*.8);c.stroke();}c.rotate(-t*1.6);
  }else if(k==='snow'){
    c.rotate(t*.6);for(let i=0;i<6;i++){c.rotate(PI/3);c.beginPath();c.moveTo(0,0);c.lineTo(R,0);c.moveTo(R*.6,0);c.lineTo(R*.8,R*.18);c.moveTo(R*.6,0);c.lineTo(R*.8,-R*.18);c.stroke();}c.rotate(-t*.6);
  }else if(k==='skull'){
    c.fillStyle=pal.core;c.globalAlpha=al*.9;c.beginPath();c.arc(0,-R*.15,R*.5,0,TAU);c.fill();c.fillRect(-R*.28,R*.2,R*.56,R*.3);c.fillStyle=pal.dark;c.beginPath();c.arc(-R*.2,-R*.15,R*.13,0,TAU);c.arc(R*.2,-R*.15,R*.13,0,TAU);c.fill();
    c.globalAlpha=al*.7;c.strokeStyle=pal.mid;c.beginPath();c.arc(0,0,R*.95,0,TAU);c.stroke();
  }else if(k==='eye'){
    c.beginPath();c.moveTo(-R,0);c.quadraticCurveTo(0,-R*.8,R,0);c.quadraticCurveTo(0,R*.8,-R,0);c.stroke();c.fillStyle=pal.core;c.beginPath();c.arc(0,0,R*.28,0,TAU);c.fill();c.fillStyle=pal.dark;c.beginPath();c.arc(0,0,R*.12,0,TAU);c.fill();
  }else if(k==='clock'){
    c.beginPath();c.arc(0,0,R,0,TAU);c.stroke();for(let i=0;i<12;i++){const a=i*TAU/12;c.beginPath();c.moveTo(Math.cos(a)*R*.88,Math.sin(a)*R*.88);c.lineTo(Math.cos(a)*R,Math.sin(a)*R);c.stroke();}
    c.lineWidth=3;c.strokeStyle=pal.core;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(t*4)*R*.7,Math.sin(t*4)*R*.7);c.moveTo(0,0);c.lineTo(Math.cos(t*.7)*R*.45,Math.sin(t*.7)*R*.45);c.stroke();
  }else if(k==='chain'){
    for(let i=0;i<8;i++){const a=i*TAU/8+t*.4;c.save();c.translate(Math.cos(a)*R,Math.sin(a)*R);c.rotate(a+(i%2?PI/2:0));c.beginPath();c.ellipse(0,0,6,3.4,0,0,TAU);c.stroke();c.restore();}
  }else if(k==='saw'){
    const n=12;c.rotate(t*5);c.beginPath();for(let i=0;i<n*2;i++){const a=i*PI/n,r=i%2?R*.8:R;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.stroke();c.globalAlpha=al*.25;c.fill();c.rotate(-t*5);
  }else if(k==='ghost'){
    const y=-q*18;c.fillStyle=pal.mid;c.globalAlpha=al*.45;c.beginPath();c.moveTo(-R*.45,y+R*.5);c.quadraticCurveTo(-R*.5,y-R*.7,0,y-R*.7);c.quadraticCurveTo(R*.5,y-R*.7,R*.45,y+R*.5);
    for(let i=0;i<3;i++)c.quadraticCurveTo(R*.3-i*R*.3,y+R*.2,R*.15-i*R*.3,y+R*.5);c.closePath();c.fill();
  }
};

// Decal: vùng/zone nền đất, animate theo thời gian s.t, giới hạn trong hitbox bằng clip.
const D={};
function decal(c,s,o,q){
  const f=D[o.k];if(!f)return;
  if(!o.R&&s.shape!=='circle')c.rotate(s.angle);
  c.beginPath();region(c,o.R?{...s,shape:'circle',R:o.R,inner:0}:s);c.clip();f(c,s,o,(o.a??1)*s.fade*(o.hold||s.zone?1:Math.pow(1-q,.7)));
}
P.decal=(c,s,o,q)=>decal(c,s,o,q);
const ext=(s,o)=>o.R||(s.shape==='circle'?s.R:Math.max(s.L,s.hw)); // phạm vi vẽ
D.scorch=(c,s,o,a)=>{
  const R=ext(s,o),pal=s.pal;c.globalCompositeOperation='source-over';
  const g=c.createRadialGradient(0,0,0,0,0,R);g.addColorStop(0,pal.darkA);g.addColorStop(1,pal.dark0);c.globalAlpha=a*.7;c.fillStyle=g;c.fillRect(-R,-R,R*2,R*2);
  c.globalCompositeOperation='lighter';const n=8+s.tier*2;
  for(let i=0;i<n;i++){
    const ang=H(s.seed,i)*TAU,d=R*.78*Math.sqrt(H(s.seed,i+20)),x=Math.cos(ang)*d,y=Math.sin(ang)*d,fh=(9+15*H(s.seed,i+40))*(.65+.35*Math.sin(s.t*9+i*2.1))*(1+.15*s.tier);
    c.globalAlpha=a*.85;c.fillStyle=pal.mid;c.beginPath();c.moveTo(x-4,y);c.quadraticCurveTo(x-6,y-fh*.6,x,y-fh);c.quadraticCurveTo(x+6,y-fh*.6,x+4,y);c.fill();
    c.fillStyle=pal.core;c.beginPath();c.moveTo(x-1.8,y);c.quadraticCurveTo(x-2.5,y-fh*.4,x,y-fh*.62);c.quadraticCurveTo(x+2.5,y-fh*.4,x+1.8,y);c.fill();
  }
  glow(c,R*.7,pal.mid,pal.mid0,a*.22);
};
D.frost=(c,s,o,a)=>{
  const R=ext(s,o),pal=s.pal;c.globalCompositeOperation='source-over';
  const g=c.createRadialGradient(0,0,0,0,0,R);g.addColorStop(0,pal.core);g.addColorStop(1,pal.mid0);c.globalAlpha=a*.4;c.fillStyle=g;c.fillRect(-R,-R,R*2,R*2);
  c.globalAlpha=a*.9;c.strokeStyle=pal.core;c.fillStyle=pal.mid;c.lineWidth=1;
  for(let i=0;i<12;i++){const ang=i*TAU/12+H(s.seed,i)*.3,d=R*(.55+.4*H(s.seed,i+9)),h=8+14*H(s.seed,i+30),x=Math.cos(ang)*d,y=Math.sin(ang)*d;
    c.save();c.translate(x,y);c.rotate(ang);c.beginPath();c.moveTo(-3,-3);c.lineTo(h,0);c.lineTo(-3,3);c.closePath();c.fill();c.stroke();c.restore();}
  c.fillStyle=pal.core;for(let i=0;i<5;i++){const tw=Math.sin(s.t*3+i*1.7);if(tw>0){c.globalAlpha=a*tw;star4(c,(H(s.seed,i+60)*2-1)*R*.8,(H(s.seed,i+70)*2-1)*R*.8,5);}}
};
D.acid=(c,s,o,a)=>{
  const R=ext(s,o),pal=s.pal;c.globalCompositeOperation='source-over';
  for(let i=0;i<8;i++){const ang=H(s.seed,i)*TAU,d=i?R*.5*H(s.seed,i+9):0,r=R*(.3+.22*H(s.seed,i+20))*(1+.06*Math.sin(s.t*1.8+i));
    c.globalAlpha=a*.55;c.fillStyle=pal.edge;c.beginPath();c.arc(Math.cos(ang)*d,Math.sin(ang)*d,r,0,TAU);c.fill();}
  c.globalCompositeOperation='lighter';
  for(let i=0;i<5;i++){const ang=H(s.seed,i+30)*TAU,d=R*.4*H(s.seed,i+39);c.globalAlpha=a*.28;c.fillStyle=pal.mid;c.beginPath();c.arc(Math.cos(ang)*d,Math.sin(ang)*d,R*.2,0,TAU);c.fill();}
  c.globalCompositeOperation='source-over';c.strokeStyle=pal.core;c.lineWidth=1.3;
  for(let i=0;i<7;i++){const u=(s.t*.6+H(s.seed,i+50))%1,x=(H(s.seed,i+60)*2-1)*R*.7,y=(H(s.seed,i+70)*2-1)*R*.6-u*8;c.globalAlpha=a*(1-u)*.9;c.beginPath();c.arc(x,y,1.5+u*4,0,TAU);c.stroke();}
  c.globalAlpha=a*.85;c.strokeStyle=pal.mid;c.lineWidth=2;c.beginPath();for(let i=0;i<=28;i++){const ang=i*TAU/28,r=R*(.93+.05*Math.sin(ang*5+s.t*2));i?c.lineTo(Math.cos(ang)*r,Math.sin(ang)*r):c.moveTo(r,0);}c.closePath();c.stroke();
};
D.crack=(c,s,o,a)=>{
  const pal=s.pal,line=s.shape==='line',R=ext(s,o),n=line?3:7,flick=.65+.35*Math.sin(s.t*4);
  c.lineCap='round';c.lineJoin='round';
  if(o.lava){c.globalCompositeOperation='source-over';c.globalAlpha=a*.45;c.fillStyle=pal.dark;c.fillRect(line?0:-R,line?-s.hw:-R,line?s.L:R*2,line?s.hw*2:R*2);}
  for(let pass=0;pass<3;pass++){
    c.globalCompositeOperation=pass===0?'source-over':'lighter';c.strokeStyle=pass===0?pal.dark:pass===1?pal.mid:pal.core;c.lineWidth=pass===0?5:pass===1?3:1.2;c.globalAlpha=a*(pass===0?.8:pass===1?.9*flick:.8*flick);
    c.beginPath();
    for(let i=0;i<n;i++){
      if(line)zig(c,0,(i-1)*s.hw*.5,s.L,(H(s.seed,i)-.5)*s.hw*.6,s.seed+i*7,s.hw*.35,Math.max(6,s.L/28|0));
      else{const ang=i*TAU/n+H(s.seed,i)*.6;zig(c,0,0,Math.cos(ang)*R,Math.sin(ang)*R,s.seed+i*13,R*.12,7);}
    }
    c.stroke();
  }
  if(o.lava)glow(c,Math.min(R,160),pal.mid,pal.mid0,a*.18*flick);
};
D.void=(c,s,o,a)=>{
  const R=ext(s,o),pal=s.pal;
  c.globalCompositeOperation='source-over';
  const g=c.createRadialGradient(0,0,0,0,0,R);g.addColorStop(0,'rgba(5,0,12,.95)');g.addColorStop(.35,pal.darkA);g.addColorStop(1,pal.dark0);c.globalAlpha=a;c.fillStyle=g;c.fillRect(-R,-R,R*2,R*2);
  c.globalCompositeOperation='lighter';c.lineCap='round';
  for(let i=0;i<3;i++){c.strokeStyle=i?pal.mid:pal.core;c.lineWidth=3-i;c.globalAlpha=a*.55;c.beginPath();for(let u=.08;u<=1;u+=.05){const ang=i*TAU/3+u*5-s.t*2.2,r=R*u;u<.1?c.moveTo(Math.cos(ang)*r,Math.sin(ang)*r):c.lineTo(Math.cos(ang)*r,Math.sin(ang)*r);}c.stroke();}
  for(let i=0;i<16;i++){const u=1-((s.t*.5+H(s.seed,i))%1),ang=H(s.seed,i+20)*TAU+(1-u)*3.5-s.t,r=R*u;c.globalAlpha=a*u;c.fillStyle=pal.core;c.fillRect(Math.cos(ang)*r-1,Math.sin(ang)*r-1,2.4,2.4);}
  c.globalAlpha=a*.8;c.strokeStyle=pal.core;c.lineWidth=1.5;c.beginPath();c.arc(0,0,R*.16+Math.sin(s.t*5)*1.5,0,TAU);c.stroke();
  c.strokeStyle=pal.mid;c.lineWidth=2;c.globalAlpha=a*.5;c.beginPath();c.arc(0,0,R*.97,0,TAU);c.stroke();
};
D.smoke=(c,s,o,a)=>{
  const R=ext(s,o),pal=s.pal;c.globalCompositeOperation='source-over';
  for(let i=0;i<14;i++){
    const ang=H(s.seed,i)*TAU+s.t*.18*(i%2?1:-1),d=R*.62*Math.sqrt(H(s.seed,i+20)),r=R*(.3+.2*H(s.seed,i+40))*(1+.07*Math.sin(s.t*1.3+i)),x=Math.cos(ang)*d,y=Math.sin(ang)*d;
    const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,pal.mid);g.addColorStop(.6,pal.edge);g.addColorStop(1,pal.edge0);c.globalAlpha=a*.5;c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
  }
  c.globalAlpha=a*.35;c.strokeStyle=pal.mid;c.lineWidth=1.5;c.setLineDash([4,6]);c.lineDashOffset=-s.t*10;c.beginPath();c.arc(0,0,R*.98,0,TAU);c.stroke();c.setLineDash([]);
};
D.heal=(c,s,o,a)=>{
  const R=ext(s,o),pal=s.pal;c.globalCompositeOperation='source-over';
  const g=c.createRadialGradient(0,0,R*.2,0,0,R);g.addColorStop(0,pal.mid0);g.addColorStop(1,pal.mid);c.globalAlpha=a*.28;c.fillStyle=g;c.fillRect(-R,-R,R*2,R*2);
  c.globalCompositeOperation='lighter';c.lineWidth=2;c.strokeStyle=pal.core;
  for(let i=0;i<2;i++){const u=(s.t*.6+i*.5)%1;c.globalAlpha=a*(1-u)*.8;c.beginPath();c.arc(0,0,R*u,0,TAU);c.stroke();}
  c.globalAlpha=a*.55;c.strokeStyle=pal.mid;c.lineWidth=2.5;c.beginPath();c.arc(0,0,R*.98,0,TAU);c.stroke();
  for(let i=0;i<14;i++){const u=(s.t*.35+H(s.seed,i))%1,x=(H(s.seed,i+20)*2-1)*R*.8,y=R*.3-u*R*.9;c.globalAlpha=a*Math.sin(u*PI);
    if(i%3){c.fillStyle=pal.core;c.fillRect(x-1,y-5,2,10);c.fillRect(x-5,y-1,10,2);}else{c.fillStyle=pal.mid;c.beginPath();c.ellipse(x,y,5,2.4,u*5,0,TAU);c.fill();}}
};
D.storm=(c,s,o,a)=>{
  const R=ext(s,o),pal=s.pal;c.globalCompositeOperation='source-over';
  const g=c.createRadialGradient(0,0,0,0,0,R);g.addColorStop(0,pal.core);g.addColorStop(1,pal.mid0);c.globalAlpha=a*.3;c.fillStyle=g;c.fillRect(-R,-R,R*2,R*2);
  c.globalCompositeOperation='lighter';c.lineCap='round';c.strokeStyle=pal.core;
  for(let i=0;i<3;i++){c.lineWidth=2;c.globalAlpha=a*.5;c.beginPath();c.arc(0,0,R*(.35+.22*i),s.t*(1.4-.4*i)+i,s.t*(1.4-.4*i)+i+2.2);c.stroke();}
  for(let i=0;i<18;i++){const ang=s.t*(1.1+H(s.seed,i)*.6)+H(s.seed,i+9)*TAU,r=R*(.2+.75*H(s.seed,i+20));c.globalAlpha=a*.8;c.beginPath();c.moveTo(Math.cos(ang)*r,Math.sin(ang)*r);c.lineTo(Math.cos(ang-.12)*r,Math.sin(ang-.12)*r);c.stroke();}
  if((Math.floor(s.t*3)+s.seed)%3===0){c.globalAlpha=a*(.6+.4*Math.sin(s.t*60));c.lineWidth=2;c.strokeStyle=pal.core;c.beginPath();zig(c,0,-R,(H(s.seed,Math.floor(s.t*3))-.5)*R,0,s.seed+Math.floor(s.t*3),R*.12,8);c.stroke();}
};
D.net=(c,s,o,a)=>{
  const R=ext(s,o),pal=s.pal;c.globalCompositeOperation='lighter';c.strokeStyle=pal.mid;c.lineWidth=1.3;c.globalAlpha=a*.55;
  c.beginPath();for(let i=-6;i<=6;i++){const d=i*R/4.2;for(let k=0;k<3;k++){const ang=k*PI/3,nx=-Math.sin(ang),ny=Math.cos(ang),ax=Math.cos(ang),ay=Math.sin(ang);c.moveTo(nx*d-ax*R*1.4,ny*d-ay*R*1.4);c.lineTo(nx*d+ax*R*1.4,ny*d+ay*R*1.4);}}c.stroke();
  c.fillStyle=pal.core;for(let i=0;i<14;i++){if(((s.t*8|0)+i)%3)continue;c.globalAlpha=a*.9;star4(c,(H(s.seed,i)*2-1)*R*.9,(H(s.seed,i+9)*2-1)*R*.9,4);}
  c.globalAlpha=a*.7;c.lineWidth=2;c.strokeStyle=pal.core;c.beginPath();c.arc(0,0,R*.98,0,TAU);c.stroke();
};
D.spores=(c,s,o,a)=>{
  const R=ext(s,o),pal=s.pal;c.globalCompositeOperation='source-over';
  const g=c.createRadialGradient(0,0,0,0,0,R);g.addColorStop(0,pal.edge);g.addColorStop(1,pal.edge0);c.globalAlpha=a*.3;c.fillStyle=g;c.fillRect(-R,-R,R*2,R*2);
  c.globalCompositeOperation='lighter';
  for(let i=0;i<22;i++){const ang=H(s.seed,i)*TAU+Math.sin(s.t*.5+i)*.4,d=R*.85*Math.sqrt(H(s.seed,i+20)),x=Math.cos(ang)*d,y=Math.sin(ang)*d-((s.t*8+i*5)%14);
    c.save();c.translate(x,y);glow(c,5+3*H(s.seed,i+40),pal.core,pal.mid0,a*.7);c.restore();}
};
D.sea=(c,s,o,a)=>{
  const R=ext(s,o),pal=s.pal;c.globalCompositeOperation='source-over';
  const g=c.createRadialGradient(0,0,R*.1,0,0,R);g.addColorStop(0,pal.darkA);g.addColorStop(.6,pal.edge);g.addColorStop(1,pal.mid);c.globalAlpha=a*.5;c.fillStyle=g;c.fillRect(-R,-R,R*2,R*2);
  c.globalCompositeOperation='lighter';c.lineWidth=2.5;c.strokeStyle=pal.mid;
  for(let i=0;i<3;i++){const u=(s.t*.3+i/3)%1;c.globalAlpha=a*Math.sin(u*PI)*.8;c.beginPath();c.arc(0,0,R*(.3+.7*u),0,TAU);c.stroke();}
  for(let i=0;i<16;i++){const ang=H(s.seed,i)*TAU,r=R*(.35+.6*H(s.seed,i+20)),x=Math.cos(ang)*r,y=Math.sin(ang)*r,fh=7+9*Math.abs(Math.sin(s.t*5+i));c.globalAlpha=a*.8;c.fillStyle=pal.core;c.beginPath();c.moveTo(x-3,y);c.quadraticCurveTo(x,y-fh,x+3,y);c.fill();}
};
D.tentacle=(c,s,o,a)=>{
  const R=ext(s,o),pal=s.pal,grow=eo(clamp(s.p*3));c.lineCap='round';
  for(let i=0;i<3;i++){const base=(i-1)*R*.45,h=R*1.4*grow*(.8+.2*H(s.seed,i));
    for(let pass=0;pass<2;pass++){c.globalCompositeOperation='source-over';c.strokeStyle=pass?pal.mid:pal.dark;c.lineWidth=pass?4:9;c.globalAlpha=a*(pass?.8:.9);c.beginPath();
      for(let u=0;u<=1;u+=.1){const x=base+Math.sin(u*5+s.t*3+i)*8*u,y=R*.4-u*h;u?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}
    c.fillStyle=pal.core;c.globalAlpha=a*.6;for(let u=.2;u<.9;u+=.2){c.beginPath();c.arc(base+Math.sin(u*5+s.t*3+i)*8*u+3,R*.4-u*h,1.6,0,TAU);c.fill();}}
};
D.arrows=(c,s,o,a)=>{
  const R=ext(s,o),pal=s.pal;c.globalCompositeOperation='source-over';c.lineWidth=1.5;
  for(let i=0;i<9;i++){const x=(H(s.seed,i)*2-1)*R*.8,y=(H(s.seed,i+9)*2-1)*R*.6;c.globalAlpha=a*.9;c.strokeStyle=pal.edge;c.beginPath();c.moveTo(x,y);c.lineTo(x-2,y-13);c.stroke();
    c.strokeStyle=pal.core;c.beginPath();c.moveTo(x-2,y-13);c.lineTo(x-5,y-16);c.moveTo(x-2,y-13);c.lineTo(x+1,y-16);c.stroke();}
  c.globalAlpha=a*.3;c.fillStyle=pal.edge;c.beginPath();c.arc(0,0,R,0,TAU);c.fill();
};
D.dome=(c,s,o,a)=>{
  const R=ext(s,o),pal=s.pal;c.globalCompositeOperation='lighter';
  const g=c.createRadialGradient(0,0,R*.4,0,0,R);g.addColorStop(0,pal.mid0);g.addColorStop(.85,pal.mid);g.addColorStop(1,pal.core);c.globalAlpha=a*.35;c.fillStyle=g;c.beginPath();c.arc(0,0,R,0,TAU);c.fill();
  c.strokeStyle=pal.core;c.lineWidth=1;c.globalAlpha=a*.5;c.rotate(s.t*.5);for(let i=0;i<6;i++){c.rotate(PI/3);poly(c,6,R*.38);c.save();c.translate(R*.55,0);poly(c,6,R*.38);c.stroke();c.restore();}c.rotate(-s.t*.5);
  c.globalAlpha=a*(.7+.2*Math.sin(s.t*6));c.lineWidth=2.5;c.beginPath();c.arc(0,0,R,0,TAU);c.stroke();
};
D.crystal=(c,s,o,a)=>{
  const R=ext(s,o),pal=s.pal;c.globalCompositeOperation='source-over';
  poly(c,6,R,PI/6);const g=c.createLinearGradient(-R,-R,R,R);g.addColorStop(0,pal.core);g.addColorStop(.5,pal.mid);g.addColorStop(1,pal.edge);c.globalAlpha=a*.5;c.fillStyle=g;c.fill();
  c.globalAlpha=a*.9;c.strokeStyle=pal.core;c.lineWidth=2;c.stroke();c.lineWidth=1;c.globalAlpha=a*.55;
  c.beginPath();for(let i=0;i<6;i++){const ang=PI/6+i*PI/3;c.moveTo(0,0);c.lineTo(Math.cos(ang)*R,Math.sin(ang)*R);}c.stroke();
  const tw=Math.sin(s.t*4);if(tw>0){c.globalCompositeOperation='lighter';c.fillStyle=pal.core;c.globalAlpha=a*tw;star4(c,-R*.35,-R*.35,7);}
};
D.swirl=(c,s,o,a)=>{
  const R=ext(s,o),pal=s.pal;c.globalCompositeOperation='lighter';c.lineCap='round';c.strokeStyle=pal.core;c.lineWidth=1.8;
  for(let i=0;i<4;i++){c.globalAlpha=a*.7;c.beginPath();for(let u=.1;u<=1;u+=.06){const ang=i*PI/2+u*4+s.t*3,r=R*u;u<.15?c.moveTo(Math.cos(ang)*r,Math.sin(ang)*r):c.lineTo(Math.cos(ang)*r,Math.sin(ang)*r);}c.stroke();}
};
D.bars=(c,s,o,a)=>{ // lồng xương: hàng gai xương dọc mép vùng
  const R=ext(s,o),pal=s.pal;c.globalCompositeOperation='source-over';const n=s.shape==='line'?Math.max(3,s.L/14|0):14,rise=eo(clamp(s.p*4));
  for(let i=0;i<n;i++){const x=s.shape==='line'?i*s.L/n:Math.cos(i*TAU/n)*R*.92,y=s.shape==='line'?(i%2?s.hw*.9:-s.hw*.9):Math.sin(i*TAU/n)*R*.92,h=(16+10*H(s.seed,i))*rise;
    c.globalAlpha=a;c.fillStyle=pal.core;c.strokeStyle=pal.edge;c.lineWidth=1;c.beginPath();c.moveTo(x-3,y);c.lineTo(x,y-h);c.lineTo(x+3,y);c.closePath();c.fill();c.stroke();}
  c.globalCompositeOperation='lighter';c.globalAlpha=a*.25;c.fillStyle=pal.mid;c.fillRect(s.shape==='line'?0:-R,s.shape==='line'?-s.hw:-R,s.shape==='line'?s.L:R*2,s.shape==='line'?s.hw*2:R*2);
};
D.laser=(c,s,o,a)=>{ // tia laser duy trì: thân + lõi + nhiễu nhiệt
  const pal=s.pal,L=s.L,fl=.75+.25*Math.sin(s.t*40+s.seed);c.globalCompositeOperation='lighter';c.lineCap='round';
  c.globalAlpha=a*.3*fl;c.fillStyle=pal.edge;c.fillRect(0,-s.hw,L,s.hw*2);
  for(const [w,col,al] of [[s.hw*.9,pal.mid,.7],[s.hw*.35,pal.core,.95]]){c.globalAlpha=a*al*fl;c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(0,0);c.lineTo(L,0);c.stroke();}
  for(let i=0;i<8;i++){const u=(s.t*1.5+H(s.seed,i))%1;c.globalAlpha=a*(1-u);c.fillStyle=pal.core;c.fillRect(u*L,(H(s.seed,i+9)*2-1)*s.hw,2.5,2.5);}
};
D.maw=(c,s,o,a)=>{ // miệng hố hút: dòng hạt chảy dọc vùng về phía kẻ hút
  const pal=s.pal,L=s.L;c.globalCompositeOperation='source-over';
  const g=c.createLinearGradient(0,0,L,0);g.addColorStop(0,pal.darkA);g.addColorStop(1,pal.dark0);c.globalAlpha=a*.7;c.fillStyle=g;c.fillRect(0,-s.hw,L,s.hw*2);
  c.globalCompositeOperation='lighter';c.strokeStyle=pal.mid;c.lineWidth=1.6;
  for(let i=0;i<16;i++){const u=1-((s.t*.9+H(s.seed,i))%1),x=u*L,y=(H(s.seed,i+9)*2-1)*s.hw*u;c.globalAlpha=a*(1-u*.6);c.beginPath();c.moveTo(x,y);c.lineTo(x+14*u,y);c.stroke();}
};
D.tether=(c,s,o,a)=>{ // dây nối chủ - mục tiêu (rotate đã bị hủy: vẽ trong hệ tọa độ thế giới nhờ s.ox/s.oy)
  const pal=s.pal,ox=s.ox||0,oy=s.oy||0,tx=s.tx||0,ty=s.ty||0;c.globalCompositeOperation='lighter';c.lineCap='round';
  for(let pass=0;pass<2;pass++){c.strokeStyle=pass?pal.core:pal.mid;c.lineWidth=pass?1.4:4;c.globalAlpha=a*(pass?.9:.5);c.beginPath();zig(c,ox,oy,tx,ty,s.seed+(s.t*10|0),5,10);c.stroke();}
  if(o.leech)for(let i=0;i<5;i++){const u=(s.t*.9+i/5)%1;c.globalAlpha=a;c.fillStyle=pal.core;c.beginPath();c.arc(lerp(tx,ox,u),lerp(ty,oy,u),2.4,0,TAU);c.fill();}
  c.globalAlpha=a*.5;c.strokeStyle=pal.mid;c.lineWidth=2;c.beginPath();c.arc(0,0,Math.max(0,s.R*(.5+.06*Math.sin(s.t*6))),0,TAU);c.stroke();
};

// ---------- Telegraph chính xác hitbox ----------
function telegraph(c,s,label){
  const pal=s.pal,p=clamp(s.p),flash=p>.82?.5+.5*Math.sin(s.t*40):0,shape=s.shape,R=s.R;
  c.rotate(shape==='circle'?0:s.angle);
  c.globalCompositeOperation='source-over';
  c.globalAlpha=.14+.12*p+.2*flash;c.fillStyle=pal.edge;c.beginPath();region(c,s);c.fill('evenodd');
  // vùng tiến độ lớn dần (đòn chạm khi đầy)
  const g=shape==='circle'?c.createRadialGradient(0,0,0,0,0,Math.max(1,R*p)):null;
  if(g){g.addColorStop(0,pal.mid0);g.addColorStop(1,pal.mid);c.fillStyle=g;}else c.fillStyle=pal.mid;
  c.globalAlpha=.3;c.beginPath();region(c,s,Math.max(.001,p));c.fill('evenodd');
  c.setLineDash([8,6]);c.lineDashOffset=-s.t*28;c.lineWidth=2.5;c.strokeStyle=pal.mid;c.globalAlpha=.95;c.beginPath();region(c,s);c.stroke();
  c.setLineDash([]);c.lineWidth=1;c.strokeStyle=pal.core;c.globalAlpha=.45+.4*flash;c.stroke();
  c.globalCompositeOperation='lighter';c.fillStyle=pal.mid;c.strokeStyle=pal.core;
  if(shape==='circle'){
    c.globalAlpha=.8;for(let i=0;i<12;i++){const a=i*TAU/12+s.t*.6;c.save();c.rotate(a);c.beginPath();c.moveTo(R+4,0);c.lineTo(R-7,-4);c.lineTo(R-7,4);c.closePath();c.fill();c.restore();}
    if(s.inner){c.globalAlpha=.6;c.lineWidth=1.5;c.beginPath();c.arc(0,0,s.inner,0,TAU);c.stroke();}
  }else{
    const L=s.L,span=shape==='line'?s.hw:L*.5;c.lineWidth=2;c.globalAlpha=.7;
    for(let i=0;i<4;i++){const x=((s.t*80+i*L/4)%L),w=shape==='line'?s.hw*.7:Math.min(L*.4,x*.55);c.beginPath();c.moveTo(x-6,-w);c.lineTo(x,0);c.lineTo(x-6,w);c.stroke();}
    glow(c,Math.max(8,span*.5),pal.mid,pal.mid0,.35);
  }
  c.rotate(shape==='circle'?0:-s.angle);c.globalCompositeOperation='source-over';
  if(label){
    const ty=-(shape==='circle'?R:Math.max(s.hw,24))-10,w=label.length*6.6+14;
    c.globalAlpha=.65;c.fillStyle='rgba(10,12,22,.8)';c.beginPath();c.rect(-w/2,ty-12,w,17);c.fill();
    c.globalAlpha=1;c.font='bold 11px Arial';c.textAlign='center';c.fillStyle=pal.core;c.fillText(label,0,ty);
  }
}

// ---------- Vẽ projectile ----------
function drawProjectileBody(c,p,t,pal,spec){
  const k=spec.k,sz=spec.size||7;
  if(k==='arrow'){
    c.strokeStyle=pal.mid;c.globalAlpha=.4;c.lineWidth=3;c.beginPath();c.moveTo(-26,0);c.lineTo(-8,0);c.stroke();c.globalAlpha=1;
    c.strokeStyle='#5a4a35';c.lineWidth=2;c.beginPath();c.moveTo(-11,0);c.lineTo(8,0);c.stroke();
    c.fillStyle=pal.core;c.beginPath();c.moveTo(8,-3.2);c.lineTo(14,0);c.lineTo(8,3.2);c.closePath();c.fill();
    c.strokeStyle=pal.mid;c.lineWidth=1.3;c.beginPath();c.moveTo(-11,0);c.lineTo(-15,-3);c.moveTo(-11,0);c.lineTo(-15,3);c.moveTo(-8,0);c.lineTo(-12,-3);c.moveTo(-8,0);c.lineTo(-12,3);c.stroke();
  }else if(k==='comet'){
    const len=sz*5,fl=1+.12*Math.sin(t*30+p.x);c.globalCompositeOperation='lighter';
    const g=c.createLinearGradient(0,0,-len,0);g.addColorStop(0,pal.mid);g.addColorStop(1,pal.edge0);c.fillStyle=g;c.globalAlpha=.85;c.beginPath();c.moveTo(0,-sz*.9);c.quadraticCurveTo(-len*.5,-sz*.6*fl,-len,0);c.quadraticCurveTo(-len*.5,sz*.6*fl,0,sz*.9);c.fill();
    glow(c,sz*2.2,pal.mid,pal.mid0,.5);glow(c,sz*fl,pal.core,pal.mid,1);
  }else if(k==='orb'){
    c.globalCompositeOperation='lighter';
    const j=spec.jitter?Math.sin(t*50+p.y)*2:0;
    c.strokeStyle=pal.mid;c.globalAlpha=.4;c.lineWidth=sz*.6;c.beginPath();c.moveTo(-sz*3,j);c.lineTo(0,0);c.stroke();
    glow(c,sz*2.4,pal.mid,pal.mid0,.55);glow(c,sz,pal.core,pal.mid,1);
    c.fillStyle=pal.core;for(let i=0;i<2;i++){const a=t*9+i*PI;c.globalAlpha=.9;c.beginPath();c.arc(Math.cos(a)*sz*1.5,Math.sin(a)*sz*1.5+j,1.5,0,TAU);c.fill();}
  }else if(k==='shard'){
    c.globalCompositeOperation='lighter';
    const g=c.createLinearGradient(0,0,-sz*4,0);g.addColorStop(0,pal.mid);g.addColorStop(1,pal.mid0);c.fillStyle=g;c.globalAlpha=.7;c.beginPath();c.moveTo(0,-sz*.5);c.lineTo(-sz*4,0);c.lineTo(0,sz*.5);c.fill();
    c.globalCompositeOperation='source-over';c.globalAlpha=1;c.fillStyle=pal.mid;c.strokeStyle=pal.core;c.lineWidth=1.2;c.beginPath();c.moveTo(sz*1.6,0);c.lineTo(0,-sz*.8);c.lineTo(-sz*1.2,0);c.lineTo(0,sz*.8);c.closePath();c.fill();c.stroke();
  }else if(k==='bolt'){
    c.globalCompositeOperation='lighter';c.lineCap='round';
    for(const [w,col,al] of [[sz*2.2,pal.edge,.35],[sz*1.1,pal.mid,.7],[sz*.45,pal.core,1]]){c.globalAlpha=al;c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(-60,0);c.lineTo(6,0);c.stroke();}
  }else if(k==='rock'){
    c.save();c.rotate(t*5+p.x*.05);c.fillStyle=pal.edge;c.strokeStyle=pal.dark;c.lineWidth=1.5;c.beginPath();
    for(let i=0;i<8;i++){const a=i*TAU/8,r=sz*(.8+.35*H(7,i));i?c.lineTo(Math.cos(a)*r,Math.sin(a)*r):c.moveTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();c.stroke();
    c.fillStyle=pal.mid;c.globalAlpha=.6;c.beginPath();c.arc(-sz*.25,-sz*.25,sz*.3,0,TAU);c.fill();c.restore();
    c.strokeStyle=pal.mid;c.globalAlpha=.25;c.lineWidth=sz*.8;c.beginPath();c.moveTo(-sz*3,0);c.lineTo(-sz,0);c.stroke();
  }
}

// ---------- Manager ----------
const V=window.GameRenderer.VfxManager={
  effects:[],damageNumbers:[],motes:[],projectiles:[],particles:[],_free:[],seq:0,_rs:0x1badf00d,view:{on:false,x:0,y:0,hw:0,hh:0},

  init(){this.effects=[];this.damageNumbers=[];this.motes=[];this.projectiles=[];this.particles=[];this._free=[];this.seq=0;this._rs=0x1badf00d;},
  // PRNG cục bộ cho hình ảnh (mulberry32): không đụng Math.random của mô phỏng.
  rnd(){let t=this._rs=(this._rs+0x6d2b79f5)|0;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;},
  recipes(){return window.GameRenderer.VfxRecipes;},
  ownerTint(e){return e&&e.isMonster?(e.ancientDef&&e.ancientDef.color)||(e.visual&&e.visual.detailColor):undefined;},
  pal(rec,e){return(rec&&PAL[rec.el])||(e.tint&&tintPal(e.tint))||PAL[e.el]||tintPal(e.color);},
  recFor(e){
    const R=this.recipes().R;
    return R[e.fx]||(e.mon&&(R['mon:'+e.mon]||R['mon:default']))||(e.anc&&R['anc:'+e.anc])||R['k:'+e.kind]||null;
  },
  // Tạo hiệu ứng. Tùy chọn skill: fx (id), el, tint, mon (mode quái), anc (effect boss), tier, ph ('tele'|'exec'|'after').
  addEffect(kind,x,y,options={}){
    const e={kind,x,y,radius:30,angle:0,color:'#ffdea4',life:.5,...options};
    e.seed=(this.seq=(this.seq+1)|0)*7919;e.rec=this.recFor(e);e.tier=e.tier||1;
    e.ph=e.ph||(kind==='telegraph'?'tele':'exec');
    if(e.ph!=='tele'&&e.rec?.life&&e.rec.life>e.life)e.life=e.rec.life;
    e.maxLife=e.life;e._pal=this.pal(e.rec,e);
    if(this.effects.length>=MAX_EFFECTS)this.effects.shift();
    this.effects.push(e);return e;
  },
  runList(c,list,p,t){
    for(let i=0;i<list.length;i++){
      const o=list[i][1],fn=P[list[i][0]];
      if(!fn||(o.tier&&o.tier>S.tier)||(o.sh&&o.sh!==S.shape))continue;
      const t0=o.t0||0,t1=o.t1||1;if(p<t0||(p>t1&&!o.hold))continue;
      c.save();c.globalCompositeOperation=o.add===true?'lighter':'source-over';
      if(o.at==='end')c.translate(S.ex,S.ey);
      fn(c,S,o,Math.min(1,(p-t0)/(t1-t0)));c.restore();
    }
  },
  drawEffect(ctx,e){
    const p=Math.min(1,1-e.life/e.maxLife),t=e.maxLife-e.life,rec=e.rec||this.recFor(e);
    setup(e,p,t,e._pal||this.pal(rec,e));S.e=e;
    ctx.save();ctx.translate(e.x,e.y);ctx.lineCap='round';ctx.lineJoin='round';
    if(e.ph==='tele'){
      if(!e.plain)telegraph(ctx,S,e.label||'NGUY HIỂM');
      if(rec&&rec.tele)this.runList(ctx,rec.tele,p,t);else if(e.plain)this.runList(ctx,PLAIN_TELE,p,t);
    }else{
      const list=rec&&(rec[e.ph]||(e.ph==='exec'?rec.exec:null));
      if(list)this.runList(ctx,list,p,t);
    }
    ctx.restore();
  },

  // ----- Vùng tồn đọng (CombatSystem.fields) -----
  fieldPal(f){return f._pal||(f._pal=this.pal(this.recipes().R[f.fx]||this.recipes().R['mon:'+f.ftype],{tint:f.tint,el:f.el,color:f.color}));},
  drawField(ctx,f){
    if(this.culled(f.x,f.y,(f.length||0)+f.radius+80))return;
    const time=(window.GameManager&&window.GameManager.matchTime)||0,R=this.recipes().R,rec=R[f.fx]||(f.mon&&(R['mon:'+f.ftype]||R['mon:default']))||null;
    f.seed=f.seed||((this.seq=(this.seq+1)|0)*7919);
    const src=this._fsrc||(this._fsrc={});src.x=f.x;src.y=f.y;src.radius=f.radius;src.length=f.length;src.halfW=f.radius;src.shape=f.shape;src.angle=f.angle||0;src.arc=.75;src.inner=f.innerRadius||0;src.tier=f.tier||1;src.seed=f.seed;src.tx=f.x;src.ty=f.y;
    const pal=this.fieldPal(f);
    if(f.delay>0){ // pha báo hiệu: đúng hình dạng hitbox
      setup(src,f.delay0>0?1-f.delay/f.delay0:1,time,pal);ctx.save();ctx.translate(f.x,f.y);telegraph(ctx,S,null);ctx.restore();return;
    }
    if(f.mon&&!f.fxDone){f.fxDone=true;this.addEffect('exec',f.x,f.y,{fx:f.fx,mon:f.ftype,tint:f.tint,el:f.el,color:f.color,radius:f.radius,halfW:f.radius,shape:f.shape,angle:f.angle||0,length:f.length,inner:f.innerRadius,tier:f.tier,life:.6});}
    let list=rec&&rec.zone;
    if(!list)list=f.smoke?ZONE_SMOKE:f.heal?ZONE_HEAL:f.pull?ZONE_VOID:f.armorBreak?ZONE_ACID:null;
    if(!list||(f.maxLife<.9&&!f.smoke&&!f.heal))return;
    const age=f.maxLife-f.life-(f.delay0||0);
    setup(src,clamp(age/Math.max(.1,f.maxLife)),time+f.seed*.001,pal);S.zone=1;S.fade=Math.min(1,age/.3+.05,f.life/.4);
    S.ox=f.owner?f.owner.x-f.x:0;S.oy=f.owner?f.owner.y-f.y:0;S.tx=f.target?f.target.x-f.x:0;S.ty=f.target?f.target.y-f.y:0;
    ctx.save();ctx.translate(f.x,f.y);
    for(const[name,o]of list){const fn=P[name];if(!fn)continue;ctx.save();ctx.globalCompositeOperation='source-over';fn(ctx,S,o,S.p);ctx.restore();}
    ctx.restore();S.zone=0;
  },
  // ----- Boss Thượng Cổ: vùng dài + đạn truy đuổi + tường đá -----
  drawAncientField(ctx,f,clock){
    if(f.warningOnly||clock<f.at||clock>=f.end||this.culled(f.x,f.y,(f.length||0)+f.radius+80))return;
    const time=(window.GameManager&&window.GameManager.matchTime)||0,col=f.owner.ancientDef?.color||'#bfa1ee',kind=f.owner.ancientKind;
    f.seed=f.seed||((this.seq=(this.seq+1)|0)*7919);
    if(f.speed!==undefined){ // kiếm / tên lửa truy đuổi
      const dx=f.x-(f._px??f.x),dy=f.y-(f._py??f.y);if(dx||dy)f._a=Math.atan2(dy,dx);f._px=f.x;f._py=f.y;
      const pal=kind==='mecha'?PAL.mecha:tintPal(f.color||col);ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f._a||0);
      ctx.globalCompositeOperation='lighter';
      if(kind==='mecha'){const g=ctx.createLinearGradient(0,0,-34,0);g.addColorStop(0,pal.mid);g.addColorStop(1,pal.edge0);ctx.fillStyle=g;ctx.globalAlpha=.85*(.8+.2*Math.sin(time*50));ctx.beginPath();ctx.moveTo(-4,-3);ctx.lineTo(-34,0);ctx.lineTo(-4,3);ctx.fill();
        ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.fillStyle='#d8d3d0';ctx.fillRect(-8,-3,14,6);ctx.fillStyle=pal.mid;ctx.beginPath();ctx.moveTo(6,-3);ctx.lineTo(12,0);ctx.lineTo(6,3);ctx.fill();ctx.fillStyle='#8b8582';ctx.fillRect(-8,-6,4,3);ctx.fillRect(-8,3,4,3);}
      else{glow(ctx,16,pal.mid,pal.mid0,.45);ctx.rotate(time*8);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.fillStyle=pal.core;ctx.strokeStyle=pal.mid;ctx.lineWidth=1.5;
        ctx.beginPath();ctx.moveTo(-2,-3);ctx.lineTo(16,0);ctx.lineTo(-2,3);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=pal.mid;ctx.fillRect(-6,-5,4,10);}
      ctx.restore();return;
    }
    if(f.end-f.at<=.6)return; // đòn ngắn do effect 'impact' (fx = f.effect) mỗi nhịp đảm nhiệm
    const rec=this.recipes().R['anc:'+f.effect];if(!rec||!rec.zone)return;
    const src=this._asrc||(this._asrc={});src.x=f.x;src.y=f.y;src.radius=f.radius;src.length=f.length;src.halfW=f.radius;src.shape=f.shape;src.angle=f.angle||0;src.arc=f.arc||.75;src.inner=f.innerRadius||0;src.tier=1;src.seed=f.seed;
    const age=clock-f.at;setup(src,clamp(age/(f.end-f.at)),time+f.seed*.001,f._pal||(f._pal=tintPal(col)));S.zone=1;S.fade=Math.min(1,age/.3+.05,(f.end-clock)/.4);
    ctx.save();ctx.translate(f.x,f.y);
    for(const[name,o]of rec.zone){const fn=P[name];if(!fn)continue;ctx.save();fn(ctx,S,o,S.p);ctx.restore();}
    ctx.restore();S.zone=0;
  },
  drawWall(ctx,w,clock){
    if(this.culled(w.x,w.y,60))return;
    const t=clock,left=Math.max(0,w.end-clock),a=Math.min(1,left/.5),rise=eo(clamp((w.end-clock>4.5?(5-(w.end-clock))*2:1)));
    ctx.save();ctx.globalAlpha=a;
    const g=ctx.createLinearGradient(w.x,w.y-35,w.x+w.w,w.y+w.h);g.addColorStop(0,'#8a6a74');g.addColorStop(1,'#4a3641');
    ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(w.x+4,w.y+6,w.w,w.h);
    ctx.fillStyle=g;ctx.fillRect(w.x,w.y-35*rise,w.w,w.h+35*rise);
    ctx.strokeStyle='#ffc684';ctx.lineWidth=2;ctx.strokeRect(w.x,w.y-35*rise,w.w,w.h+35*rise);
    ctx.strokeStyle='#2a1c24';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(w.x+w.w*.2,w.y-35*rise);ctx.lineTo(w.x+w.w*.45,w.y+w.h*.2);ctx.lineTo(w.x+w.w*.3,w.y+w.h);ctx.moveTo(w.x+w.w*.75,w.y-10*rise);ctx.lineTo(w.x+w.w*.6,w.y+w.h*.6);ctx.stroke();
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a*(.45+.25*Math.sin(t*4+w.x));ctx.strokeStyle='#ff9d4d';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(w.x+w.w*.2,w.y-35*rise);ctx.lineTo(w.x+w.w*.45,w.y+w.h*.2);ctx.stroke();
    ctx.restore();
  },
  culled(x,y,m){const v=this.view;return v.on&&(Math.abs(x-v.x)>v.hw+m||Math.abs(y-v.y)>v.hh+m);},
  updateView(){
    const C=window.GameEngine&&window.GameEngine.Camera,v=this.view;
    if(!C||!(C.zoom>0)||!C.viewportWidth){v.on=false;return;}
    v.on=true;v.x=C.x;v.y=C.y;v.hw=C.viewportWidth/2/C.zoom;v.hh=C.viewportHeight/2/C.zoom;
  },

  addDamageNumber(x,y,amount,type='normal'){
    this.damageNumbers.push({x:x+(this.rnd()-.5)*16,y:y-10,vy:-1.8,text:typeof amount==='number'?Math.round(amount):amount,type,life:1.0,scale:type==='crit'?1.5:1.0});
  },
  addEmotionMote(targetPawn,icon,color='#ffffff'){
    const existing=this.motes.find(m=>m.pawn===targetPawn&&m.icon===icon);
    if(existing){existing.life=1.6;return;}
    this.motes.push({pawn:targetPawn,icon,color,offsetY:-36,life:1.8,wobble:this.rnd()*Math.PI});
  },
  // config.skillId / type / el / tint quyết định kiểu đạn (xem PROJ trong vfxRecipes)
  addProjectile(source,targetX,targetY,speed,weaponOrSkill,onHit){
    const dx=targetX-source.x,dy=targetY-source.y,dist=Math.hypot(dx,dy),angle=Math.atan2(dy,dx),cfg=weaponOrSkill||{};
    const PR=this.recipes().PROJ,spec=PR[cfg.skillId]||PR[cfg.type]||PR.projectile;
    const pal=PAL[cfg.el||spec.el]||tintPal(cfg.tint||cfg.color);
    if(this.projectiles.length>=MAX_PROJECTILES)this.projectiles.shift();
    this.projectiles.push({x:source.x,y:source.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,source,angle,rangeLeft:Math.min(dist+20,300),config:cfg,onHit,spec,pal,acc:0});
  },
  // Hạt có trần + free-list (không cấp phát khi spawn lại). kind: 0 tròn, 1 tia, 2 glow cộng sáng.
  addBurstParticles(x,y,color='#e74c3c',count=6,kind=0){
    for(let i=0;i<count&&this.particles.length<MAX_PARTICLES;i++){
      const a=this.rnd()*TAU,sp=1.5+this.rnd()*3.5,pt=this._free.pop()||{};
      pt.x=x;pt.y=y;pt.vx=Math.cos(a)*sp;pt.vy=Math.sin(a)*sp;pt.color=color;pt.radius=2+this.rnd()*2;pt.life=.35+this.rnd()*.25;pt.maxLife=.5;pt.kind=kind;
      if(kind===2){pt.vx*=.15;pt.vy*=.15;pt.life=.3;pt.maxLife=.3;pt.radius=3;}
      this.particles.push(pt);
    }
  },

  update(dt){
    let w=0;for(let i=0;i<this.effects.length;i++){const e=this.effects[i];e.life-=dt;if(e.life>0)this.effects[w++]=e;}this.effects.length=w;
    for(let i=this.damageNumbers.length-1;i>=0;i--){const dn=this.damageNumbers[i];dn.y+=dn.vy*60*dt;dn.vy+=.05*60*dt;dn.life-=dt;if(dn.life<=0)this.damageNumbers.splice(i,1);}
    for(let i=this.motes.length-1;i>=0;i--){const m=this.motes[i];m.life-=dt;m.offsetY-=4*dt;if(m.life<=0||!m.pawn.isAlive)this.motes.splice(i,1);}
    for(let i=this.projectiles.length-1;i>=0;i--){
      const p=this.projectiles[i],voidBoss=window.GameEntities.AncientSystem.boss;
      if(voidBoss?.isAlive&&voidBoss.ancientKind==='void'&&!p.voidBent&&Math.hypot(p.x-voidBoss.x,p.y-voidBoss.y)<120){
        p.voidBent=true;const angle=.6,vx=p.vx;p.vx=vx*Math.cos(angle)-p.vy*Math.sin(angle);p.vy=vx*Math.sin(angle)+p.vy*Math.cos(angle);
        this.addEffect('rune',p.x,p.y,{radius:18,color:'#ad87ee',life:.3});
      }
      const moveDist=Math.hypot(p.vx*dt,p.vy*dt),steps=Math.max(1,Math.ceil(moveDist/10));let hit=false;
      for(let j=0;j<steps&&!hit;j++){
        p.x+=p.vx*dt/steps;p.y+=p.vy*dt/steps;
        hit=!window.GameEngine.MapTerrain.canStand(p.x,p.y,0)||!window.GameEngine.MapTerrain.templeAccess(null,p.x,p.y)||(p.onHit?p.onHit(p.x,p.y,p):false);
      }
      p.angle=Math.atan2(p.vy,p.vx);p.rangeLeft-=moveDist;
      if(p.spec.k==='comet'||p.spec.k==='orb'||p.spec.k==='rock'){p.acc+=moveDist;if(p.acc>7&&!this.culled(p.x,p.y,40)){p.acc=0;this.addBurstParticles(p.x,p.y,p.pal.mid,1,2);}}
      if(hit||p.rangeLeft<=0){
        this.addBurstParticles(p.x,p.y,p.pal.mid,5,0);
        this.projectiles.splice(i,1);
      }
    }
    for(let i=this.particles.length-1;i>=0;i--){
      const pt=this.particles[i];pt.x+=pt.vx*60*dt;pt.y+=pt.vy*60*dt;pt.life-=dt;
      if(pt.life<=0){this._free.push(pt);this.particles[i]=this.particles[this.particles.length-1];this.particles.pop();}
    }
  },

  render(ctx,time){
    time=(time!==undefined?time:performance.now()/1000);this.updateView();
    for(let i=0;i<this.effects.length;i++){
      const e=this.effects[i];
      if(this.culled(e.x,e.y,Math.max(e.radius,e.length||0,120))&&!(e.tx!==undefined&&!this.culled(e.tx,e.ty,e.radius+60)))continue;
      this.drawEffect(ctx,e);
    }
    for(let i=0;i<this.projectiles.length;i++){
      const p=this.projectiles[i];if(this.culled(p.x,p.y,80))continue;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);drawProjectileBody(ctx,p,time,p.pal,p.spec);ctx.restore();
    }
    let add=false;
    for(let i=0;i<this.particles.length;i++){
      const pt=this.particles[i];if(this.culled(pt.x,pt.y,20))continue;
      if((pt.kind===2)!==add){add=!add;ctx.globalCompositeOperation=add?'lighter':'source-over';}
      ctx.globalAlpha=Math.max(0,pt.life/pt.maxLife);ctx.fillStyle=pt.color;ctx.beginPath();ctx.arc(pt.x,pt.y,Math.max(.1,pt.radius*(pt.kind===2?Math.max(.3,pt.life/pt.maxLife):1)),0,TAU);ctx.fill();
    }
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;

    this.motes.forEach(m=>{
      const px=m.pawn.x,py=m.pawn.y+m.offsetY+Math.sin(time*6+m.wobble)*3;
      ctx.save();ctx.font='16px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillStyle='rgba(0, 0, 0, 0.4)';ctx.beginPath();ctx.arc(px,py,11,0,Math.PI*2);ctx.fill();ctx.fillText(m.icon,px,py+1);ctx.restore();
    });
    this.damageNumbers.forEach(dn=>{
      ctx.save();ctx.globalAlpha=Math.min(1.0,dn.life*1.5);
      let color='#ffffff',font='bold 12px Arial, sans-serif';
      if(dn.type==='crit'){color='#ff4757';font='bold 16px Arial, sans-serif';}
      else if(dn.type==='heal')color='#2ed573';
      else if(dn.type==='true'){color='#a55eea';font='bold 13px Arial, sans-serif';}
      else if(dn.type==='block')color='#fed330';
      ctx.font=font;ctx.fillStyle=color;ctx.textAlign='center';ctx.strokeStyle='#000000';ctx.lineWidth=3;
      ctx.strokeText(dn.text,dn.x,dn.y);ctx.fillText(dn.text,dn.x,dn.y);ctx.restore();
    });
  }
};
V.PALETTES=PAL;V.primitives=P;V.decals=D;
const PLAIN_TELE=[['glyph',{k:'rune',R:26,n:5}]];
const ZONE_SMOKE=[['decal',{k:'smoke'}]],ZONE_HEAL=[['decal',{k:'heal'}]],ZONE_VOID=[['decal',{k:'void'}]],ZONE_ACID=[['decal',{k:'acid'}]];
V.fallbackZones={ZONE_SMOKE,ZONE_HEAL,ZONE_VOID,ZONE_ACID};
})();
