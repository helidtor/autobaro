window.GameEngine = window.GameEngine || {};
window.GameEngine.MapTerrain = {
 scale:2,cell:40,MAP_WIDTH:5200,MAP_HEIGHT:5200,bushes:[],trees:[],waterBodies:[],cliffs:[],
 regions:[['THIỀN VIỆN TRÚC LÂM',510,420],['RỪNG GIÀ HOANG VU',530,2020],['DÃY NÚI LIÊN SƠN',1990,370],['SÔNG HOÀNG HÀ',2190,1320],['KINH THÀNH',1300,990],['LÀNG TRÚC',560,1080],['LÀNG HÀ',1800,2040]],
 bridges:[2080,3760],
 riverLocalX(y){return 1960+120*Math.sin(y/330);},
 riverX(y){return this.riverLocalX(y/this.scale)*this.scale;},
 init(w=5200,h=5200){
  this.MAP_WIDTH=w;this.MAP_HEIGHT=h;this.bushes=[];this.trees=[];
  this.scale=w/2600;this.templeRuins={x:w/2,y:h/2,radius:200*this.scale};this.waterBodies=[{x:this.riverX(1000),y:1000,radius:54*this.scale}];this.cliffs=[{x:2010*this.scale,y:560*this.scale,radius:240*this.scale}];
  for(let i=0;i<160;i++){const forest=i<90,x=forest?160+Math.random()*760:100+Math.random()*2400,y=forest?1590+Math.random()*740:100+Math.random()*2400;
   if(this.inSettlement(x*this.scale,y*this.scale)||this.isInWater(x*this.scale,y*this.scale)||this.isOnCliff(x*this.scale,y*this.scale))continue;
   this.trees.push({x,y,radius:forest?24+Math.random()*18:18+Math.random()*10,pine:i%3===0});}
  for(let i=0;i<95;i++){const x=130+Math.random()*2340,y=130+Math.random()*2340;if(!this.inSettlement(x*this.scale,y*this.scale)&&!this.isInWater(x*this.scale,y*this.scale))this.bushes.push({x,y,radius:22+Math.random()*16,isBurned:false});}
  this.buildObstacles();
 },
 inSettlement(x,y){x/=this.scale;y/=this.scale;return(Math.abs(x-1300)<265&&Math.abs(y-1300)<265)||(Math.abs(x-510)<220&&Math.abs(y-650)<210)||(Math.abs(x-560)<220&&Math.abs(y-1230)<130)||(Math.abs(x-1800)<240&&Math.abs(y-2200)<120);},
 isInBush(x,y){x/=this.scale;y/=this.scale;return this.bushes.some(b=>!b.isBurned&&Math.hypot(x-b.x,y-b.y)<=b.radius);},
 isInWater(x,y){if(this.bridges.some(by=>Math.abs(y-by)<28*this.scale&&Math.abs(x-this.riverX(by))<105*this.scale))return false;return Math.abs(x-this.riverX(y))<54*this.scale;},
 isOnCliff(x,y){return this.cliffs.some(c=>Math.hypot(x-c.x,y-c.y)<c.radius);},
 getMoveSpeed(e){if(e.stunTimer>0)return 0;let s=e.moveSpeed||e.speed||100;if(e.isClutchEscape)s*=2;if(e.speedBuffTimer>0)s*=1+(e.speedBuff||0);if(e.slowTimer>0)s*=1-(e.slowPct||0);if(this.isInWater(e.x,e.y))s*=.45;else if(this.isOnCliff(e.x,e.y))s*=.7;return s;},

 buildObstacles(){
  const s=this.scale;this.obstacles=[];this.obstacleBuckets=new Map();
  const rect=(x,y,w,h,kind)=>this.obstacles.push({x:x*s,y:y*s,w:w*s,h:h*s,kind});
  const building=(x,y,w,h)=>rect(x-w/2-8,y-30,w+16,h+30,'building');
  building(510,555,200,75);building(350,625,82,105);building(670,625,82,105);
  [[1045,1045],[1555,1045],[1045,1555],[1555,1555]].forEach(([x,y])=>building(x,y-35,90,70));
  for(const [x,y] of [[560,1230],[1800,2200]]){
   [[-140,-20],[-40,-30],[65,-20],[150,45],[-95,55]].forEach(([dx,dy])=>building(x+dx,y+dy,65,40));
   rect(x-210,y-85,165,5,'fence');rect(x+20,y-85,185,5,'fence');
   rect(x-210,y-85,5,150,'fence');rect(x+205,y-85,5,150,'fence');
   rect(x+22,y+55,26,20,'well');
  }
  for(const lo of [1035,1545]){
   rect(1035,lo,233,20,'wall');rect(1332,lo,233,20,'wall');
   rect(lo,1035,20,233,'wall');rect(lo,1332,20,233,'wall');
  }
  rect(285,480,450,10,'wall');rect(285,480,10,360,'wall');rect(725,480,10,360,'wall');
  rect(285,830,185,10,'wall');rect(550,830,185,10,'wall');
  [456,506,556].forEach(x=>rect(x,822,8,28,'gate-post'));
  // Mountain rock faces and tree trunks are solid; foliage remains cover.
  rect(1740,565,255,100,'rock');rect(2140,565,160,100,'rock');
  this.trees.forEach(t=>rect(t.x-6,t.y-2,12,16,'tree'));
  for(const o of this.obstacles){
   for(let x=Math.floor((o.x-30)/100);x<=Math.floor((o.x+o.w+30)/100);x++)
    for(let y=Math.floor((o.y-30)/100);y<=Math.floor((o.y+o.h+30)/100);y++){
     const k=x+','+y;if(!this.obstacleBuckets.has(k))this.obstacleBuckets.set(k,[]);this.obstacleBuckets.get(k).push(o);
    }
  }
  const n=Math.ceil(this.MAP_WIDTH/this.cell),m=Math.ceil(this.MAP_HEIGHT/this.cell);
  this.cols=n;this.rows=m;this.navBlocked=new Uint8Array(n*m);this.navWater=new Uint8Array(n*m);
  for(let y=0;y<m;y++)for(let x=0;x<n;x++){
   const i=y*n+x,px=(x+.5)*this.cell,py=(y+.5)*this.cell;
   this.navBlocked[i]=!this.canStand(px,py,12);this.navWater[i]=this.isInWater(px,py);
  }
 },
 canStand(x,y,r=9){
  if(x<r||y<r||x>this.MAP_WIDTH-r||y>this.MAP_HEIGHT-r)return false;
  return !(this.obstacleBuckets?.get(Math.floor(x/100)+','+Math.floor(y/100)) || []).some(o=>
   x>o.x-r && x<o.x+o.w+r && y>o.y-r && y<o.y+o.h+r);
 },
 nearestFree(x,y,r=9){
  x=Math.max(r,Math.min(this.MAP_WIDTH-r,x));y=Math.max(r,Math.min(this.MAP_HEIGHT-r,y));
  if(this.canStand(x,y,r))return{x,y};
  for(let d=20;d<500;d+=20)for(let i=0;i<16;i++){
   const px=x+Math.cos(i*Math.PI/8)*d,py=y+Math.sin(i*Math.PI/8)*d;
   if(this.canStand(px,py,r))return{x:px,y:py};
  }
  return{x:this.MAP_WIDTH/2,y:this.MAP_HEIGHT/2};
 },
 segmentClear(x1,y1,x2,y2,avoidWater=false,r=9){
  const n=Math.max(1,Math.ceil(Math.hypot(x2-x1,y2-y1)/12));
  for(let i=0;i<=n;i++){const t=i/n,x=x1+(x2-x1)*t,y=y1+(y2-y1)*t;
   if(!this.canStand(x,y,r)||(avoidWater&&this.isInWater(x,y)))return false;}
  return true;
 },
 moveEntity(e,dx,dy){
  const r=e.collisionRadius||9,n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/6));
  const oldX=e.x,oldY=e.y;
  for(let i=0;i<n;i++){
   const x=e.x+dx/n,y=e.y+dy/n;
   if(this.canStand(x,y,r)){e.x=x;e.y=y;}
   else if(this.canStand(x,e.y,r))e.x=x;
   else if(this.canStand(e.x,y,r))e.y=y;
  }
  return Math.hypot(e.x-oldX,e.y-oldY);
 },
 closestCell(x,y){
  const cx=Math.max(0,Math.min(this.cols-1,Math.floor(x/this.cell))),cy=Math.max(0,Math.min(this.rows-1,Math.floor(y/this.cell)));
  for(let r=0;r<12;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
   const nx=cx+dx,ny=cy+dy;
   if(nx>=0&&ny>=0&&nx<this.cols&&ny<this.rows&&!this.navBlocked[ny*this.cols+nx]&&this.segmentClear(x,y,(nx+.5)*this.cell,(ny+.5)*this.cell,false,9))return ny*this.cols+nx;
  }
  return -1;
 },
 findPath(sx,sy,tx,ty){
  const start=this.closestCell(sx,sy),goal=this.closestCell(tx,ty);
  if(start<0||goal<0)return[];
  const search=allowWater=>{
   const count=this.cols*this.rows,g=new Float64Array(count);g.fill(Infinity);
   const parent=new Int32Array(count);parent.fill(-1);const closed=new Uint8Array(count),heap=[];
   const gx=goal%this.cols,gy=Math.floor(goal/this.cols);
   const score=i=>g[i]+Math.hypot(i%this.cols-gx,Math.floor(i/this.cols)-gy);
   const push=i=>{let j=heap.length;heap.push(i);while(j){const p=(j-1)>>1;if(score(heap[p])<=score(i))break;heap[j]=heap[p];j=p;}heap[j]=i;};
   const pop=()=>{const v=heap[0],end=heap.pop();if(heap.length){let j=0;while(j*2+1<heap.length){let k=j*2+1;if(k+1<heap.length&&score(heap[k+1])<score(heap[k]))k++;if(score(end)<=score(heap[k]))break;heap[j]=heap[k];j=k;}heap[j]=end;}return v;};
   g[start]=0;push(start);
   while(heap.length){
    const i=pop();if(closed[i])continue;closed[i]=1;
    if(i===goal){const points=[];for(let at=goal;at!==start;at=parent[at]){if(at<0)return[];points.push({x:(at%this.cols+.5)*this.cell,y:(Math.floor(at/this.cols)+.5)*this.cell});}points.reverse();const first={x:(start%this.cols+.5)*this.cell,y:(Math.floor(start/this.cols)+.5)*this.cell};if(Math.hypot(first.x-sx,first.y-sy)>4)points.unshift(first);return points;}
    const x=i%this.cols,y=Math.floor(i/this.cols);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
     const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=this.cols||ny>=this.rows)continue;
     const j=ny*this.cols+nx;if(closed[j]||this.navBlocked[j]||(!allowWater&&this.navWater[j]&&j!==goal))continue;
     if(dx&&dy&&(this.navBlocked[y*this.cols+nx]||this.navBlocked[ny*this.cols+x]||(!allowWater&&(this.navWater[y*this.cols+nx]||this.navWater[ny*this.cols+x]))))continue;
     const cost=g[i]+(dx&&dy?Math.SQRT2:1)*(this.navWater[j]?6:1);
     if(cost<g[j]){g[j]=cost;parent[j]=i;push(j);}
    }
   }
   return[];
  };
  const dry=search(false);return dry.length?dry:search(true);
 },
 navigate(e,tx,ty,dt){
  const r=e.collisionRadius||9;
  const goal=this.nearestFree(tx,ty,r);
  const changed=!e.navGoal||Math.hypot(goal.x-e.navGoal.x,goal.y-e.navGoal.y)>70;
  const speed=this.getMoveSpeed(e);
  if(speed<=0)return 0;
  e.navTimer=(e.navTimer||0)-dt;
  if(changed||e.navTimer<=0){
   e.navGoal=goal;e.navTimer=1.5;
   e.navPath=this.segmentClear(e.x,e.y,goal.x,goal.y,true,r)?[goal]:this.findPath(e.x,e.y,goal.x,goal.y);
   if(e.navPath.length && this.segmentClear(e.navPath.at(-1).x,e.navPath.at(-1).y,goal.x,goal.y,false,r))e.navPath.push(goal);
   if(!e.navPath.length&&this.segmentClear(e.x,e.y,goal.x,goal.y,false,r))e.navPath=[goal];
  }
  while(e.navPath?.length&&Math.hypot(e.navPath[0].x-e.x,e.navPath[0].y-e.y)<12)e.navPath.shift();
  if(!e.navPath?.length){e.vx=e.vy=0;return 0;}
  const next=e.navPath[0],dx=next.x-e.x,dy=next.y-e.y,dist=Math.hypot(dx,dy);
  e.aimAngle=Math.atan2(dy,dx);e.vx=dx/dist*speed;e.vy=dy/dist*speed;
  const moved=this.moveEntity(e,dx/dist*Math.min(dist,speed*dt),dy/dist*Math.min(dist,speed*dt));
  e.stuckTime=moved<speed*dt*.15?(e.stuckTime||0)+dt:0;
  if(e.stuckTime>.6){e.navTimer=0;e.navPath=[];e.stuckTime=0;e.roamGoal=null;}
  return moved;
 },

 polygon(ctx,points,color,stroke='#36464b'){ctx.fillStyle=color;ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();ctx.stroke();},
 roof(ctx,x,y,w,h,color='#875850'){
  ctx.fillStyle='rgba(20,32,25,.2)';ctx.fillRect(x-w/2+8,y+8,w,h);ctx.fillStyle='#dbc39a';ctx.fillRect(x-w/2+8,y,w-16,h);
  this.polygon(ctx,[[x-w/2-8,y+5],[x-w/2+8,y-12],[x,y-30],[x+w/2-8,y-12],[x+w/2+8,y+5]],color);
  ctx.strokeStyle='#d7b584';ctx.lineWidth=1.5;for(let i=-w/2+10;i<w/2;i+=12){ctx.beginPath();ctx.moveTo(x+i,y-10);ctx.lineTo(x+i,y+3);ctx.stroke();}
  ctx.fillStyle='#553e32';ctx.fillRect(x-7,y+h-21,14,21);ctx.fillStyle='#e8c575';ctx.fillRect(x-w/2+16,y+11,10,10);ctx.fillRect(x+w/2-26,y+11,10,10);
 },
 pagoda(ctx,x,y,levels,w){for(let i=0;i<levels;i++)this.roof(ctx,x,y-i*35,w-i*24,35,i%2?'#476b68':'#365658');ctx.strokeStyle='#eacb85';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y-(levels-1)*35-30);ctx.lineTo(x,y-(levels-1)*35-50);ctx.stroke();},
 village(ctx,x,y){
  ctx.fillStyle='#bcae7b';ctx.fillRect(x-205,y-75,410,160);
  for(let k=0;k<3;k++){ctx.fillStyle=k%2?'#a0ac5d':'#c2b871';ctx.fillRect(x-220,y+95+k*24,200,20);}
  [[-140,-20],[-40,-30],[65,-20],[150,45],[-95,55]].forEach(([dx,dy],i)=>this.roof(ctx,x+dx,y+dy,65,40,i%2?'#8e6252':'#777c69'));
  ctx.fillStyle='#536969';ctx.strokeStyle='#e0cf9b';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(x+35,y+65,13,9,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle='#deaa73';ctx.fillRect(x+80,y+45,45,25);for(let i=0;i<5;i++){ctx.fillStyle=i%2?'#714e46':'#d4b182';ctx.fillRect(x+80+i*9,y+41,9,9);}
 },
 render(ctx){
  ctx.save();ctx.scale(this.scale,this.scale);ctx.fillStyle='#8c9d6b';ctx.fillRect(0,0,2600,2600);
  for(let i=0;i<230;i++){ctx.fillStyle=i%2?'#93a575':'#859563';ctx.beginPath();ctx.ellipse((i*431)%2600,(i*719)%2600,28,14,.4,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#536b4b';ctx.beginPath();ctx.ellipse(530,1900,500,380,-.25,0,Math.PI*2);ctx.fill();
  const roads=[[[510,650],[560,1230],[1300,1300]],[[1300,1300],[1300,1040],[2200,1040]],[[1300,1300],[1450,1880],[2200,1880],[1800,2200]],[[1300,1300],[650,1850]]];
  for(const road of roads){ctx.beginPath();road.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle='#6c7257';ctx.lineWidth=34;ctx.stroke();ctx.strokeStyle='#c2bb94';ctx.lineWidth=27;ctx.stroke();}
  for(let i=0;i<8;i++){const x=1670+i*76,y=650+(i%3)*40,h=145+(i%4)*32;
   this.polygon(ctx,[[x-95,y],[x,y-h],[x+110,y]],'#73858a');this.polygon(ctx,[[x,y-h],[x+110,y],[x+20,y]],'#4e636b');
   this.polygon(ctx,[[x-27,y-h+44],[x,y-h],[x+33,y-h+44],[x+9,y-h+32],[x-5,y-h+48]],'#e1e8dd','#c6d6d1');}
  const river=()=>{ctx.beginPath();for(let y=-100;y<2750;y+=20){const x=this.riverLocalX(y);y===-100?ctx.moveTo(x,y):ctx.lineTo(x,y);}};
  river();ctx.lineWidth=128;ctx.strokeStyle='#c4b990';ctx.stroke();river();ctx.lineWidth=108;ctx.strokeStyle='#426d7b';ctx.stroke();river();ctx.lineWidth=84;ctx.strokeStyle='#629eac';ctx.stroke();
  ctx.strokeStyle='#a3d2d4';ctx.lineWidth=2;for(let y=80;y<2600;y+=75){ctx.beginPath();ctx.moveTo(this.riverLocalX(y)-25,y);ctx.quadraticCurveTo(this.riverLocalX(y),y+8,this.riverLocalX(y)+25,y);ctx.stroke();}
  this.bridges.map(y=>y/this.scale).forEach(y=>{const x=this.riverLocalX(y);ctx.fillStyle='#c6c6ad';ctx.strokeStyle='#4e6060';ctx.lineWidth=3;ctx.fillRect(x-105,y-27,210,54);ctx.strokeRect(x-105,y-27,210,54);
   for(let i=-100;i<105;i+=22){ctx.beginPath();ctx.moveTo(x+i,y-25);ctx.lineTo(x+i,y+25);ctx.stroke();}ctx.fillStyle='#677674';ctx.fillRect(x-110,y-32,220,7);ctx.fillRect(x-110,y+25,220,7);});
  ctx.fillStyle='#c5bca0';ctx.fillRect(1060,1060,480,480);ctx.strokeStyle='#aaa68c';ctx.lineWidth=1;
  for(let i=1060;i<=1540;i+=32){ctx.beginPath();ctx.moveTo(i,1060);ctx.lineTo(i,1540);ctx.moveTo(1060,i);ctx.lineTo(1540,i);ctx.stroke();}
  ctx.strokeStyle='#526468';ctx.lineWidth=20;for(const [x1,y1,x2,y2] of [[1045,1045,1555,1045],[1045,1555,1555,1555],[1045,1045,1045,1555],[1555,1045,1555,1555]]){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
  ctx.fillStyle='#c3b899';ctx.fillRect(1268,1034,64,23);ctx.fillRect(1268,1544,64,23);ctx.fillRect(1034,1268,23,64);ctx.fillRect(1544,1268,23,64);
  [[1045,1045],[1555,1045],[1045,1555],[1555,1555]].forEach(([x,y])=>this.pagoda(ctx,x,y,2,90));
  ctx.fillStyle='#657373';ctx.beginPath();ctx.arc(1300,1300,116,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#e3c78e';ctx.lineWidth=3;
  [100,72,28].forEach(r=>{ctx.beginPath();ctx.arc(1300,1300,r,0,Math.PI*2);ctx.stroke();});
  for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(1300+Math.cos(a)*30,1300+Math.sin(a)*30);ctx.lineTo(1300+Math.cos(a)*98,1300+Math.sin(a)*98);ctx.stroke();}
  ctx.fillStyle='#bdbda2';ctx.fillRect(290,485,440,350);ctx.strokeStyle='#697971';ctx.lineWidth=9;ctx.strokeRect(290,485,440,350);
  this.roof(ctx,510,555,200,75,'#365d58');this.pagoda(ctx,350,695,3,82);this.pagoda(ctx,670,695,3,82);this.roof(ctx,510,817,160,32,'#476b60');
  ctx.fillStyle='#be7961';[460,510,560].forEach(x=>ctx.fillRect(x-4,822,8,28));
  ctx.strokeStyle='#a3a58f';ctx.lineWidth=2;for(let y=640;y<815;y+=25){ctx.beginPath();ctx.moveTo(390,y);ctx.lineTo(630,y);ctx.stroke();}
  for(let i=0;i<5;i++){ctx.fillStyle='#e3b269';ctx.beginPath();ctx.arc(402,650+i*30,4,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(620,650+i*30,4,0,Math.PI*2);ctx.fill();}
  this.village(ctx,560,1230);this.village(ctx,1800,2200);
  this.trees.forEach(t=>{ctx.fillStyle='rgba(24,40,31,.2)';ctx.beginPath();ctx.ellipse(t.x+9,t.y+12,t.radius,9,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#705944';ctx.fillRect(t.x-4,t.y-12,8,26);
   if(t.pine){for(let j=0;j<3;j++)this.polygon(ctx,[[t.x-t.radius+j*5,t.y-j*15],[t.x,t.y-42-j*12],[t.x+t.radius-j*5,t.y-j*15]],j%2?'#456a4d':'#35573f','#3e5543');}
   else{ctx.fillStyle='#3e6348';ctx.beginPath();ctx.arc(t.x,t.y-18,t.radius,0,Math.PI*2);ctx.fill();ctx.fillStyle='#567b51';ctx.beginPath();ctx.arc(t.x-7,t.y-25,t.radius*.7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#719361';ctx.beginPath();ctx.arc(t.x-12,t.y-30,t.radius*.35,0,Math.PI*2);ctx.fill();}});
  this.bushes.forEach(b=>{if(b.isBurned)return;ctx.fillStyle='#66854b';ctx.strokeStyle='#43683f';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(b.x,b.y,b.radius,b.radius*.6,0,0,Math.PI*2);ctx.fill();ctx.stroke();});
  for(const o of this.obstacles.filter(o=>o.kind==='fence')){ctx.fillStyle='#80674b';ctx.fillRect(o.x/this.scale,o.y/this.scale,o.w/this.scale,o.h/this.scale);ctx.strokeStyle='#c5ac7f';ctx.lineWidth=2;ctx.strokeRect(o.x/this.scale,o.y/this.scale,o.w/this.scale,o.h/this.scale);}
  this.regions.forEach(([name,x,y])=>{ctx.textAlign='center';ctx.font='bold 22px Georgia';ctx.strokeStyle='#31463d';ctx.lineWidth=5;ctx.fillStyle='#f5e8ba';ctx.strokeText(name,x,y);ctx.fillText(name,x,y);});
  ctx.restore();
 }
};
