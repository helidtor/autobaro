window.GameEngine = window.GameEngine || {};
window.GameEngine.ZoneCircle = {
 init(w=5200,h=5200){
  this.centerX=w/2;this.centerY=h/2;this.mapArea=w*h;
  this.currentRadius=this.targetRadius=Math.hypot(w,h)/2;
  this.safeFraction=1;this.currentDps=0;this.isShrinking=false;
 },
 update(dt,pawns=[]){
  const count=pawns.filter(p=>p.isAlive).length;
  const fraction=count<=5?.1:count<=10?.25:count<=20?.5:1;
  if(fraction<this.safeFraction){
   this.safeFraction=fraction;
   this.targetRadius=Math.sqrt(this.mapArea*fraction/Math.PI);
   this.shrinkSpeed=(this.currentRadius-this.targetRadius)/15;
   this.currentDps=fraction===.1?7:fraction===.25?4:2;
   window.GameUI?.CombatTicker?.log('☣️ Còn '+count+' bot — vùng an toàn còn '+Math.round(fraction*100)+'% diện tích bản đồ.');
  }
  this.currentRadius=Math.max(this.targetRadius,this.currentRadius-(this.shrinkSpeed||0)*dt);
  this.isShrinking=this.currentRadius>this.targetRadius;
  for(const p of pawns)if(p.isAlive&&!p.invincible&&this.isOutside(p.x,p.y)){
   p.currentHp=Math.max(0,p.currentHp-this.currentDps*dt);
   if(p.currentHp<=0)window.GameEntities.CombatSystem.handleDeath(null,p);
  }
 },
 isOutside(x,y){return Math.hypot(x-this.centerX,y-this.centerY)>this.currentRadius;},
 render(ctx,w=5200,h=5200){
  if(this.safeFraction===1)return;
  ctx.save();ctx.strokeStyle='#bd89e3';ctx.lineWidth=5;ctx.beginPath();ctx.arc(this.centerX,this.centerY,this.currentRadius,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='rgba(60,10,85,.24)';ctx.beginPath();ctx.rect(0,0,w,h);ctx.arc(this.centerX,this.centerY,this.currentRadius,0,Math.PI*2,true);ctx.fill();ctx.restore();
 }
};