window.GameEngine = window.GameEngine || {};
/**
 * MapTerrain - collision, water/cliff/marsh rules, navigation grid and AI pathing for the world.
 * Layout data lives in mapLayout.js, drawing in mapRender.js. Obstacles are stored in WORLD units
 * (design units x scale); bushes, trees and layout rows stay in design units (x scale at use).
 */
window.GameEngine.MapTerrain = {
 scale:2,cell:40,MAP_WIDTH:5200,MAP_HEIGHT:5200,bushes:[],trees:[],waterBodies:[],cliffs:[],habitats:[],obstacles:[],marshes:[],fords:[],chokepoints:[],regions:[],
 bridges:[2080,3760],
 riverLocalX(y){return window.GameEngine.MapLayout.river.center(y);},
 riverX(y){return this.riverLocalX(y/this.scale)*this.scale;},
 // The previous map spent Math.random on tree and bush scatter before any pawn existed.
 // Replay those discarded draws so seeded bots and the Yêu Thần stay on the same sequence.
 legacyScatterRolls(scale){
  const riverX=y=>(1960+120*Math.sin((y/scale)/330))*scale;
  const inSettlement=(x,y)=>{x/=scale;y/=scale;return(Math.abs(x-1300)<265&&Math.abs(y-1300)<265)||(Math.abs(x-510)<220&&Math.abs(y-650)<210)||(Math.abs(x-560)<220&&Math.abs(y-1230)<130)||(Math.abs(x-1800)<240&&Math.abs(y-2200)<120);};
  const isInWater=(x,y)=>{if([2080,3760].some(by=>Math.abs(y-by)<28*scale&&Math.abs(x-riverX(by))<105*scale))return false;return Math.abs(x-riverX(y))<54*scale;};
  const isOnCliff=(x,y)=>Math.hypot(x-2010*scale,y-560*scale)<240*scale;
  for(let i=0;i<160;i++){
   const forest=i<90,x=forest?160+Math.random()*760:100+Math.random()*2400,y=forest?1590+Math.random()*740:100+Math.random()*2400;
   if(inSettlement(x*scale,y*scale)||isInWater(x*scale,y*scale)||isOnCliff(x*scale,y*scale))continue;
   Math.random();
  }
  for(let i=0;i<95;i++){
   const x=130+Math.random()*2340,y=130+Math.random()*2340;
   if(!inSettlement(x*scale,y*scale)&&!isInWater(x*scale,y*scale))Math.random();
  }
 },
 init(w=5200,h=5200){
  this.legacyScatterRolls(w/2600);
  const L=this.layout=window.GameEngine.MapLayout,s=this.scale=w/L.size;
  this.ancientArena=null;this.MAP_WIDTH=w;this.MAP_HEIGHT=h;this.habitats=[];this.tileCache=null;
  this.bridges=L.river.bridges.map(y=>y*s);this.fords=L.river.fords.map(f=>({...f,y:f.y*s}));
  this.lairs=L.lairDefs.map((d,i)=>({id:'lair_'+i,name:d.name,x:d.x*s,y:d.y*s,radius:125*s,color:d.color,theme:d.theme}));
  this.templeRuins={id:'temple',name:'ĐIỆN THỜ YÊU THẦN',x:w/2,y:h/2,radius:L.temple.r*s};
  this.waterBodies=[{x:this.riverX(1000),y:1000,radius:54*s}];
  this.cliffs=L.regions.flatMap(r=>r.ledges||[]).map(([x,y,r])=>({x:x*s,y:y*s,radius:r*s}));
  this.marshes=L.regions.flatMap(r=>r.marsh||[]).map(m=>({x:m.x*s,y:m.y*s,rx:m.rx*s,ry:m.ry*s}));
  this.regions=L.regions.filter(r=>r.label).map(r=>[r.name,...r.label]);
  this.chokepoints=L.regions.flatMap(r=>(r.chokepoints||[]).map(c=>({...c,region:r.id,x:c.x*s,y:c.y*s,w:c.w*s})));
  // fixed layout rows (design units) + the eight temple columns
  this.fixed=L.regions.flatMap(r=>r.obstacles);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;this.fixed.push(['temple-pillar',L.temple.x+Math.cos(a)*138-9,L.temple.y+Math.sin(a)*138-9,18,18]);}
  this.bushes=L.regions.flatMap(r=>r.cover).map(([kind,x,y,radius])=>({x,y,radius,kind:kind==='bush'?undefined:kind,isBurned:false}));
  // The map is authored, not random: one fixed PRNG keeps scatter identical between matches.
  let seed=0x5eed1008;const rng=()=>{seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
  this.trees=[];this.scatterTrees(rng);this.scatterBushes(rng);
  this.buildObstacles();
 },
 // Habitats must not sit on gates, passes, bridges or fords (their props would pinch the chokepoint).
 nearChoke(x,y,pad){return this.chokepoints.some(c=>Math.hypot(x-c.x,y-c.y)<c.w/2+pad);},
 // Distance (design units) from a point to the closest road centre-line.
 roadDistance(x,y){let best=1e9;for(const road of this.layout.roads)for(let i=1;i<road.length;i++){
  const [x1,y1]=road[i-1],[x2,y2]=road[i],dx=x2-x1,dy=y2-y1,t=Math.max(0,Math.min(1,((x-x1)*dx+(y-y1)*dy)/(dx*dx+dy*dy||1)));
  best=Math.min(best,Math.hypot(x-x1-dx*t,y-y1-dy*t));}return best;},
 // True when a design-space point is free of fixed solids (+pad), water, roads, gates and the boss/temple domains.
 openGround(x,y,pad,roadPad=0){const s=this.scale,a=[this.templeRuins,...this.lairs];
  if(x<80||y<235||x>this.layout.size-80||y>this.layout.size-80)return false;
  if(this.inSettlement(x*s,y*s)||this.isOnCliff(x*s,y*s)||Math.abs(x-this.layout.river.center(y))<54+pad+16)return false;
  if(a.some(b=>Math.hypot(x*s-b.x,y*s-b.y)<b.radius+80))return false;
  if(this.chokepoints.some(c=>Math.hypot(x*s-c.x,y*s-c.y)<c.w/2+45*s))return false;
  if(roadPad&&this.roadDistance(x,y)<roadPad)return false;
  return !this.fixed.some(([,rx,ry,rw,rh])=>x>rx-pad&&x<rx+rw+pad&&y>ry-pad&&y<ry+rh+pad);},
 // Poisson-style scatter inside every forest stand / grove with spacing so trunks never wall a lane.
 scatterTrees(rng){
  const L=this.layout,stands=[...L.regions.flatMap(r=>r.stands||[]).map(st=>({...st,pine:.33})),...L.groves];
  for(const st of stands){let placed=0;const mine=[];
   for(let n=0;n<st.count*40&&placed<st.count;n++){
    const a=rng()*Math.PI*2,d=Math.sqrt(rng()),lx=Math.cos(a)*d*st.rx,ly=Math.sin(a)*d*st.ry,rot=st.rot||0;
    const x=st.cx+lx*Math.cos(rot)-ly*Math.sin(rot),y=st.cy+lx*Math.sin(rot)+ly*Math.cos(rot);
    if(!this.openGround(x,y,22,34)||this.trees.some(t=>Math.hypot(t.x-x,t.y-y)<st.spacing))continue;
    const radius=st.r[0]+rng()*(st.r[1]-st.r[0]);this.trees.push({x,y,radius,pine:rng()<st.pine});placed++;
   }}
 },
 scatterBushes(rng){
  const L=this.layout;
  for(let n=0,placed=0;n<2000&&placed<46;n++){const x=130+rng()*2340,y=240+rng()*2230;
   if(!this.openGround(x,y,12,26)||this.marshes.some(m=>Math.hypot(x*this.scale-m.x,y*this.scale-m.y)<m.rx))continue;
   this.bushes.push({x,y,radius:22+rng()*14,isBurned:false});placed++;}
 },
 inSettlement(x,y){x/=this.scale;y/=this.scale;return this.layout.regions.some(r=>r.settlement&&Math.abs(x-r.settlement[0])<r.settlement[2]&&Math.abs(y-r.settlement[1])<r.settlement[3]);},
 isInBush(x,y){if(this.ancientArena)return false;x/=this.scale;y/=this.scale;for(const b of this.bushes){if(b.isBurned)continue;const dx=x-b.x,dy=y-b.y;if(dx*dx+dy*dy<=b.radius*b.radius)return true;}return false;},
 // Fords are shallow crossings: not water (combat works) but slow, see isInFord/getMoveSpeed.
 isInWater(x,y){if(this.ancientArena)return false;if(this.bridges.some(by=>Math.abs(y-by)<28*this.scale&&Math.abs(x-this.riverX(by))<105*this.scale))return false;if(this.fords.some(f=>Math.abs(y-f.y)<24*this.scale))return false;return Math.abs(x-this.riverX(y))<54*this.scale;},
 isInFord(x,y){if(this.ancientArena)return false;return this.fords.some(f=>Math.abs(y-f.y)<24*this.scale)&&Math.abs(x-this.riverX(y))<54*this.scale;},
 isInMarsh(x,y){if(this.ancientArena)return false;return this.marshes.some(m=>((x-m.x)/m.rx)**2+((y-m.y)/m.ry)**2<1)||this.habitats.some(c=>c.kind==='marsh'&&Math.hypot(x-c.x,y-c.y)<c.radius);},
 isOnCliff(x,y){if(this.ancientArena)return false;return this.cliffs.some(c=>Math.hypot(x-c.x,y-c.y)<c.radius)||this.habitats.some(c=>c.kind==='mountain'&&Math.hypot(x-c.x,y-c.y)<c.radius);},
 getMoveSpeed(e){if(e.stunTimer>0)return 0;let s=e.moveSpeed||e.speed||100;if(e.auraSlowTimer>0)s*=1-(e.auraSlow||0);if(e.isPawn&&e.currentStamina<18)s*=.6;if(e.isClutchEscape)s*=2;if(e.isSprinting)s*=1.25;if(e.speedBuffTimer>0)s*=1+(e.speedBuff||0);if(e.slowTimer>0)s*=1-(e.slowPct||0);if(e.relicSlowTimer>0)s*=1-(e.relicSlow||0);s*=1+[e.weapon,e.armor,e.helmet,e.boots].reduce((v,d)=>v+(d?.moveBonus||0),0);if(e.boots?.effect==='treads')return s;if(this.isInWater(e.x,e.y))s*=.45;else if(this.isInFord(e.x,e.y))s*=.65;else if(this.isOnCliff(e.x,e.y)&&e.ancientKind!=='mecha')s*=.7;else if(e.ancientKind!=='mecha'&&this.isInMarsh(e.x,e.y))s*=.8;return s;},

 buildObstacles(){
  const s=this.scale,L=this.layout;this.obstacles=[];this.obstacleBuckets=new Map();this.tileCache=null;
  const rect=(kind,x,y,w,h,o)=>this.obstacles.push({...o,x:x*s,y:y*s,w:w*s,h:h*s,kind});
  for(const row of this.fixed)rect(...row);
  const open={n:[[0,70]],e:[[0,70]],s:[[0,70]],w:[[0,70]]};
  for(const a of this.lairs)if(a.id==='final_lair')L.lairRing(a.x/s,a.y/s,open,'steel').forEach(row=>rect(...row));
  this.trees=this.trees.filter(t=>![this.templeRuins,...this.lairs].some(a=>Math.hypot(t.x*s-a.x,t.y*s-a.y)<a.radius+80));
  this.trees.forEach(t=>rect('tree',t.x-6,t.y-2,12,16));
  for(const h of this.habitats){const x=h.x/s,y=h.y/s,r=h.radius/s;
   if(h.kind==='ruins')for(const dx of [-r*.7,r*.7])rect('ruin',x+dx-7,y-26,14,24);
   if(h.kind==='mountain')for(const dx of [-r*.7,r*.7])rect('rock',x+dx-10,y+12,20,22,{theme:'moss'});
   if(h.kind==='village')for(const dx of [-r*.65,r*.65])rect('building',x+dx-16,y-34,32,30,{style:'house',roof:'#8e7456'});
  }
  for(const o of this.obstacles){
   for(let x=Math.floor((o.x-30)/100);x<=Math.floor((o.x+o.w+30)/100);x++)
    for(let y=Math.floor((o.y-30)/100);y<=Math.floor((o.y+o.h+30)/100);y++){
     const k=x+','+y;if(!this.obstacleBuckets.has(k))this.obstacleBuckets.set(k,[]);this.obstacleBuckets.get(k).push(o);
    }
  }
  const n=Math.ceil(this.MAP_WIDTH/this.cell),m=Math.ceil(this.MAP_HEIGHT/this.cell);
  this.cols=n;this.rows=m;this.navBlocked=new Uint8Array(n*m);this.navWater=new Uint8Array(n*m);this.navSlow=new Uint8Array(n*m);
  for(let y=0;y<m;y++)for(let x=0;x<n;x++){
   const i=y*n+x,px=(x+.5)*this.cell,py=(y+.5)*this.cell;
   this.navBlocked[i]=!this.canStand(px,py,12);this.navWater[i]=this.isInWater(px,py);
   this.navSlow[i]=this.isInFord(px,py)||this.isInMarsh(px,py)||this.isOnCliff(px,py)?1:0; // pathing prefers dry flat ground when the detour is short
  }
 },
 canStand(x,y,r=9){
  const a=this.ancientArena;
  if(window.GameEntities.CombatSystem?.fields?.some(f=>f.wall&&f.life>0&&x>f.wall.x-r&&x<f.wall.x+f.wall.w+r&&y>f.wall.y-r&&y<f.wall.y+f.wall.h+r))return false;
  if(a){
   if(x<a.x+r||y<a.y+r||x>a.x+a.w-r||y>a.y+a.h-r)return false;
   return ![...a.covers,...(window.GameEntities.AncientSystem?.walls||[])].some(o=>!o.destroyed&&x>o.x-r&&x<o.x+o.w+r&&y>o.y-r&&y<o.y+o.h+r);
  }
  if(x<r||y<r||x>this.MAP_WIDTH-r||y>this.MAP_HEIGHT-r)return false;
  if(window.GameEntities.AncientSystem?.walls.some(o=>x>o.x-r&&x<o.x+o.w+r&&y>o.y-r&&y<o.y+o.h+r))return false;
  return !(this.obstacleBuckets?.get(Math.floor(x/100)+','+Math.floor(y/100)) || []).some(o=>
   !o.destroyed && x>o.x-r && x<o.x+o.w+r && y>o.y-r && y<o.y+o.h+r);
 },
 nearestFree(x,y,r=9){
  if(this.ancientArena){const a=this.ancientArena;x=Math.max(a.x+r,Math.min(a.x+a.w-r,x));y=Math.max(a.y+r,Math.min(a.y+a.h-r,y));}
  x=Math.max(r,Math.min(this.MAP_WIDTH-r,x));y=Math.max(r,Math.min(this.MAP_HEIGHT-r,y));
  if(this.canStand(x,y,r))return{x,y};
  for(let d=20;d<500;d+=20)for(let i=0;i<16;i++){
   const px=x+Math.cos(i*Math.PI/8)*d,py=y+Math.sin(i*Math.PI/8)*d;
   if(this.canStand(px,py,r))return{x:px,y:py};
  }
  return this.ancientArena?{x:this.ancientArena.cx,y:this.ancientArena.cy}:{x:this.MAP_WIDTH/2,y:this.MAP_HEIGHT/2};
 },
 segmentClear(x1,y1,x2,y2,avoidWater=false,r=9,e=null){
  const n=Math.max(1,Math.ceil(Math.hypot(x2-x1,y2-y1)/12));
  for(let i=0;i<=n;i++){const t=i/n,x=x1+(x2-x1)*t,y=y1+(y2-y1)*t;
   if(!this.canStand(x,y,r)||(avoidWater&&this.isInWater(x,y))||!this.templeAccess(e,x,y)||(e&&!this.canTravel(e,x,y)))return false;}
  return true;
 },
 remainingLords(){
  const monsters=window.GameManager?.monsters||[];
  if(this.lordSource!==monsters||this.lordSourceSize!==monsters.length){this.lordSource=monsters;this.lordSourceSize=monsters.length;this.lordActors=monsters.filter(m=>m.tier===4);}
  return this.lordActors.reduce((count,m)=>count+(m.isAlive?1:0),0);
 },
 templeAccess(e,x,y){
  if(this.ancientArena)return true;
  if(!this.templeRuins||!this.remainingLords())return true;
  if(e?.isMonster&&e.tier>=5)return true;
  const a=this.templeRuins,d=Math.hypot(x-a.x,y-a.y);
  if(d>=a.radius+12)return true;
  // An actor already inside can leave, but cannot move further into a locked arena.
  return !!e&&d>Math.hypot(e.x-a.x,e.y-a.y)+.01;
 },
 moveEntity(e,dx,dy){
  const r=e.collisionRadius||9,n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/6));
  e.moveBlockReason=null;
  const oldX=e.x,oldY=e.y,C=window.GameEntities.CombatSystem;
  const enforce=e.isPawn||e.isMonster&&(e.targetEnemy||e.combatLease>0);
  const wasBattleValid=!enforce||C.validMembers(new Set(C.groupMembers(e)));
  const wasCrowdValid=!enforce||[...C.crowdAt(e,e.x,e.y)].every(p=>C.validMembers(C.crowdAt(p,p.x,p.y)));
  if(enforce){
   const C=window.GameEntities.CombatSystem,G=window.GameManager,tx=e.x+dx,ty=e.y+dy;
   const crowd=C.crowdAt(e,tx,ty);
   for(const p of crowd)if(p!==e)for(const member of C.crowdAt(p,p.x,p.y))if(Math.hypot(p.x-tx,p.y-ty)<75)crowd.add(member);
   let blocked=!C.validMembers(crowd),center=[...crowd].filter(p=>p!==e);
   const active=[...(G?.pawns||[]),...(G?.monsters||[])].filter(p=>p!==e&&p.isAlive&&p.combatLease>0&&Math.hypot(p.x-tx,p.y-ty)<120);
   if(active.length&&!C.validMembers(new Set([...C.groupMembers(e),...active.flatMap(p=>C.groupMembers(p))]))){blocked=true;center=active;}
   if(blocked&&center.length){const cx=center.reduce((v,p)=>v+p.x,0)/center.length,cy=center.reduce((v,p)=>v+p.y,0)/center.length;
    const currentValid=C.validMembers(C.crowdAt(e,e.x,e.y))&&C.validMembers(new Set([...C.groupMembers(e),...active.filter(p=>Math.hypot(p.x-e.x,p.y-e.y)<120).flatMap(p=>C.groupMembers(p))]));
    if(currentValid||Math.hypot(tx-cx,ty-cy)<=Math.hypot(e.x-cx,e.y-cy)){e.moveBlockReason='crowd';e.blockingCenter={x:cx,y:cy};return 0;}
   }
  }
  for(let i=0;i<n;i++){
   const x=e.x+dx/n,y=e.y+dy/n;
   const free=(px,py)=>this.canStand(px,py,r)&&this.templeAccess(e,px,py)&&(!e.isMonster||this.monsterCanOccupy(e,px,py));
   if(free(x,y)){e.x=x;e.y=y;}
   else if(free(x,e.y))e.x=x;
   else if(free(e.x,y))e.y=y;
  }
  if(enforce&&((wasBattleValid&&!C.validMembers(new Set(C.groupMembers(e))))||(wasCrowdValid&&[...C.crowdAt(e,e.x,e.y)].some(p=>!C.validMembers(C.crowdAt(p,p.x,p.y)))))){e.x=oldX;e.y=oldY;e.moveBlockReason='crowd';return 0;}
  return Math.hypot(e.x-oldX,e.y-oldY);
 },
 closestCell(x,y,e=null){
  const cx=Math.max(0,Math.min(this.cols-1,Math.floor(x/this.cell))),cy=Math.max(0,Math.min(this.rows-1,Math.floor(y/this.cell)));
  for(let r=0;r<12;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
   const nx=cx+dx,ny=cy+dy;
   if(nx>=0&&ny>=0&&nx<this.cols&&ny<this.rows&&!this.navBlocked[ny*this.cols+nx]&&(!e||this.canTravel(e,(nx+.5)*this.cell,(ny+.5)*this.cell))&&this.segmentClear(x,y,(nx+.5)*this.cell,(ny+.5)*this.cell,false,9))return ny*this.cols+nx;
  }
  return -1;
 },
 findPath(sx,sy,tx,ty,e=null){
  const start=this.closestCell(sx,sy,e),goal=this.closestCell(tx,ty,e);
  if(start<0||goal<0)return[];
  const search=allowWater=>{
   const count=this.cols*this.rows,g=new Float64Array(count);g.fill(Infinity);
   const parent=new Int32Array(count);parent.fill(-1);const closed=new Uint8Array(count),heap=[];
   const gx=goal%this.cols,gy=Math.floor(goal/this.cols);
   const score=i=>{const dx=Math.abs(i%this.cols-gx),dy=Math.abs(Math.floor(i/this.cols)-gy);return g[i]+dx+dy+(Math.SQRT2-2)*Math.min(dx,dy);};
   const push=i=>{let j=heap.length;heap.push(i);while(j){const p=(j-1)>>1;if(score(heap[p])<=score(i))break;heap[j]=heap[p];j=p;}heap[j]=i;};
   const pop=()=>{const v=heap[0],end=heap.pop();if(heap.length){let j=0;while(j*2+1<heap.length){let k=j*2+1;if(k+1<heap.length&&score(heap[k+1])<score(heap[k]))k++;if(score(end)<=score(heap[k]))break;heap[j]=heap[k];j=k;}heap[j]=end;}return v;};
   g[start]=0;push(start);
   while(heap.length){
    const i=pop();if(closed[i])continue;closed[i]=1;
    if(i===goal){const points=[];for(let at=goal;at!==start;at=parent[at]){if(at<0)return[];points.push({x:(at%this.cols+.5)*this.cell,y:(Math.floor(at/this.cols)+.5)*this.cell});}points.reverse();const first={x:(start%this.cols+.5)*this.cell,y:(Math.floor(start/this.cols)+.5)*this.cell};if(Math.hypot(first.x-sx,first.y-sy)>4)points.unshift(first);return points;}
    const x=i%this.cols,y=Math.floor(i/this.cols);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
     const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=this.cols||ny>=this.rows)continue;
     const j=ny*this.cols+nx;if(closed[j]||this.navBlocked[j]||(e&&!this.canTravel(e,(nx+.5)*this.cell,(ny+.5)*this.cell))||(!allowWater&&this.navWater[j]&&j!==goal))continue;
     if(dx&&dy&&(this.navBlocked[y*this.cols+nx]||this.navBlocked[ny*this.cols+x]||(!allowWater&&(this.navWater[y*this.cols+nx]||this.navWater[ny*this.cols+x]))))continue;
     const cost=g[i]+(dx&&dy?Math.SQRT2:1)*(this.navWater[j]?6:this.navSlow[j]?1.8:1);
     if(cost<g[j]){g[j]=cost;parent[j]=i;push(j);}
    }
   }
   return[];
  };
  const dry=search(false);return dry.length?dry:search(true);
 },
 navigate(e,tx,ty,dt){
  const r=e.collisionRadius||9;
  // A rebuilt obstacle can cover an actor; a blocked start cannot produce any path.
  if(!this.canStand(e.x,e.y,r)){
   const pos=this.nearestFree(e.x,e.y,r),C=window.GameEntities.CombatSystem;
   if(!this.canStand(pos.x,pos.y,r)||!this.canTravel(e,pos.x,pos.y)||!C.validMembers(C.crowdAt(e,pos.x,pos.y)))return 0;
   Object.assign(e,pos);e.navPath=[];e.navTimer=0;e.navDetour=null;e.navProgress=null;
  }
  const avoidWater=!this.isInWater(e.x,e.y);
  const now=window.GameManager.matchTime||e.decisionTime||0;
  if(e.navDetour&&e.navDetour.until>now&&Math.hypot(e.x-e.navDetour.x,e.y-e.navDetour.y)>15){tx=e.navDetour.x;ty=e.navDetour.y;}else e.navDetour=null;
  const goal=this.safeGoal(e,tx,ty,r);
  const changed=!e.navGoal||Math.hypot(goal.x-e.navGoal.x,goal.y-e.navGoal.y)>70;
  const speed=this.getMoveSpeed(e);
  if(speed<=0)return 0;
  e.navTimer=(e.navTimer||0)-dt;
  if(changed||e.navTimer<=0){
   e.navGoal=goal;e.navTimer=1.2+String(e.id).split('').reduce((v,c)=>v+c.charCodeAt(0),0)%61/100;
   e.navPath=this.segmentClear(e.x,e.y,goal.x,goal.y,true,r,e)?[goal]:this.findPath(e.x,e.y,goal.x,goal.y,e);
   if(e.navPath.length && Math.hypot(e.navPath.at(-1).x-goal.x,e.navPath.at(-1).y-goal.y)>1 && this.segmentClear(e.navPath.at(-1).x,e.navPath.at(-1).y,goal.x,goal.y,false,r,e))e.navPath.push(goal);
   if(!e.navPath.length&&this.segmentClear(e.x,e.y,goal.x,goal.y,false,r,e))e.navPath=[goal];
  }
  while(e.navPath?.length&&Math.hypot(e.navPath[0].x-e.x,e.navPath[0].y-e.y)<12)e.navPath.shift();
  if(!e.navPath?.length){e.vx=e.vy=0;return 0;}
  const next=e.navPath[0],dx=next.x-e.x,dy=next.y-e.y,dist=Math.hypot(dx,dy);
  e.aimAngle=Math.atan2(dy,dx);e.vx=dx/dist*speed;e.vy=dy/dist*speed;
  const moved=this.moveEntity(e,dx/dist*Math.min(dist,speed*dt),dy/dist*Math.min(dist,speed*dt));
  e.navProgress=e.navProgress||{x:e.x,y:e.y,time:0};e.navProgress.time+=dt;
  if(Math.hypot(e.x-goal.x,e.y-goal.y)<30)e.navProgress=null;
  else if(e.navProgress.time>=1.5){
   const progress=Math.hypot(e.x-e.navProgress.x,e.y-e.navProgress.y);
   if(progress<Math.min(20,speed*.35)&&!e.navDetour){
    const C=window.GameEntities.CombatSystem,heading=Math.atan2(goal.y-e.y,goal.x-e.x),side=e.flankSide||1;
    const options=[side*.8,-side*.8,side*1.6,-side*1.6,Math.PI].map(offset=>({x:e.x+Math.cos(heading+offset)*90,y:e.y+Math.sin(heading+offset)*90}));
    const escape=options.find(g=>this.canTravel(e,g.x,g.y)&&this.segmentClear(e.x,e.y,g.x,g.y,avoidWater,r,e)&&C.validMembers(C.crowdAt(e,g.x,g.y)));
    if(escape){e.navDetour={...escape,until:now+2};e.navRecoveries=(e.navRecoveries||0)+1;e.navTimer=0;}
    else{e.navTimer=0;e.navPath=[];}
   }
   e.navProgress={x:e.x,y:e.y,time:0};
  }
  if(moved<speed*dt*.15&&e.moveBlockReason==='crowd'&&!e.navDetour){
   const C=window.GameEntities.CombatSystem,center=e.blockingCenter||goal,angle=Math.atan2(e.y-center.y,e.x-center.x),side=e.flankSide||1;
   const detour=[side*.9,-side*.9,side*1.4,0].map(offset=>({x:e.x+Math.cos(angle+offset)*100,y:e.y+Math.sin(angle+offset)*100})).find(g=>this.canTravel(e,g.x,g.y)&&this.segmentClear(e.x,e.y,g.x,g.y,avoidWater,r,e)&&C.validMembers(C.crowdAt(e,g.x,g.y)));
   if(detour){e.navDetour={...detour,until:now+2};e.navTimer=0;}
   e.vx=e.vy=0;
  }
  e.stuckTime=moved<speed*dt*.15?(e.stuckTime||0)+dt:0;
  if(e.stuckTime>.6){e.navTimer=0;e.navPath=[];e.stuckTime=0;}
  return moved;
 },

 makeFinalHuntSite(){
  const site={id:'final_lair',name:'THIẾT GIÁP ĐÀI',x:510*this.scale,y:735*this.scale,radius:125*this.scale,color:'#7d99aa'};
  this.lairs.push(site);this.buildObstacles();return site;
 },
 bossDomain(x,y){return [this.templeRuins,...this.lairs].find(a=>Math.hypot(x-a.x,y-a.y)<a.radius+40)||null;},
 safeGoal(e,x,y,r=9){
  if(this.ancientArena)return this.nearestFree(x,y,r);
  if(e.isMonster&&e.territory){const a=e.territory,d=Math.hypot(x-a.x,y-a.y),limit=a.radius-20;if(d>limit){x=a.x+(x-a.x)/d*limit;y=a.y+(y-a.y)/d*limit;}}
  if(!this.templeAccess(e,x,y)){const a=this.templeRuins,angle=Math.atan2(e.y-a.y,e.x-a.x);x=a.x+Math.cos(angle)*(a.radius+100);y=a.y+Math.sin(angle)*(a.radius+100);}
  if(e.isPawn&&!e.isPlayerControlled)for(const a of [this.templeRuins,...this.lairs]){
   if(a.isCleared||e.level>=(a.id==='temple'?15:10)||e.targetEnemy?.isFinalHunt&&e.targetEnemy.territory===a)continue;
   if(Math.hypot(x-a.x,y-a.y)<a.radius+70){const angle=Math.atan2(e.y-a.y,e.x-a.x);x=a.x+Math.cos(angle)*(a.radius+100);y=a.y+Math.sin(angle)*(a.radius+100);}
  }
  return this.nearestFree(x,y,r);
 },
 canTravel(e,x,y){
  if(this.ancientArena)return this.canStand(x,y,e.collisionRadius||9);
  if(!this.templeAccess(e,x,y)||window.GameEntities.AncientSystem?.walls.some(o=>x>o.x-9&&x<o.x+o.w+9&&y>o.y-9&&y<o.y+o.h+9))return false;
  if(e.isMonster)return this.monsterCanOccupy(e,x,y);
  if(!e.isPawn||e.isPlayerControlled)return true;
  for(const a of [this.templeRuins,...this.lairs]){
   const level=a.id==='temple'?15:10;
   if(a.isCleared||e.level>=level||e.targetEnemy?.isFinalHunt&&e.targetEnemy.territory===a)continue;
   const distance=Math.hypot(x-a.x,y-a.y),start=Math.hypot(e.x-a.x,e.y-a.y);
   if(distance<a.radius+65 && !(start<a.radius+65&&distance>=start-1))return false;
  }
  return true;
 },
 monsterCanTarget(e,target){
  if(this.ancientArena)return this.canStand(target.x,target.y,target.collisionRadius||9);
  const domain=this.bossDomain(target.x,target.y);
  return !domain||domain===e.territory||(e.isAncient||e.isAncientClone)&&domain.id==='temple';
 },
 monsterCanOccupy(e,x,y){
  if(this.ancientArena)return this.canStand(x,y,e.collisionRadius||9);
  if(!e.territory)return true;
  if(this.isInWater(x,y))return false;
  const a=e.territory,domain=this.bossDomain(x,y);
  if(domain&&domain.id!==a.id&&!((e.isAncient||e.isAncientClone)&&domain.id==='temple'))return false;
  if(Math.hypot(x-a.x,y-a.y)<=a.radius-12)return true;
  const now=window.GameManager?.matchTime||0,C=window.GameEntities.CombatSystem,vision=C.visionRange(e);
  const alert=e.packAlert?.until>now&&e.packAlert.target?.isAlive?e.packAlert.target:null;
  if(alert)return Math.hypot(x-a.x,y-a.y)<=a.radius+vision;
  const prey=e.tier<=3&&e.targetEnemy?.isAlive?e.targetEnemy:null;
  return !!prey&&C.canSee(e,prey)&&Math.hypot(x-prey.x,y-prey.y)<=vision;
 },
 makeGuardHabitat(def,index,lair){
  const radius=135*this.scale/2,base=Math.atan2(this.MAP_HEIGHT/2-lair.y,this.MAP_WIDTH/2-lair.x)+(index>=4?.75:-.15);
  for(let i=0;i<48;i++){
   const angle=base+i*.13,x=lair.x+Math.cos(angle)*(lair.radius+radius+90),y=lair.y+Math.sin(angle)*(lair.radius+radius+90);
   if(!this.canStand(x,y,20)||this.isInWater(x,y)||this.nearChoke(x,y,radius+40)||[this.templeRuins,...this.lairs].some(a=>Math.hypot(x-a.x,y-a.y)<a.radius+radius+50)||this.habitats.some(a=>Math.hypot(x-a.x,y-a.y)<a.radius+radius+15))continue;
   const site={id:'guard_'+index,kind:def.habitat,name:window.GameData.HabitatNames[def.habitat]+' • Canh '+lair.name,x,y,radius,guardingLair:lair.id};this.habitats.push(site);return site;
  }
  throw new Error('Không tìm được chốt gác '+def.id);
 },
 makeHabitat(def,index){
  const angles={grassland:[-Math.PI/2,Math.PI/2],forest:[-Math.PI*.75,Math.PI*.75],ruins:[-Math.PI*.25],marsh:[0],village:[Math.PI,Math.PI*.25],mountain:[-Math.PI*.5,Math.PI*.25]};
  const choices=angles[def.habitat],angle=choices[Math.floor(index/choices.length)%choices.length]+((index%5)-2)*.16;
  const distance=[0,2220,1640,850][def.tier]*this.scale/2;
  const radius=[0,150,145,145][def.tier]*this.scale/2;
  let site=null;
  // Sweep the ring around the preferred angle; later passes shift the ring in/out (+-110px) when walls and trees crowd it.
  for(let n=0;n<240;n++){
   const a=angle+(n%2?1:-1)*Math.ceil(n/2)*.045,ring=distance+(Math.floor(n/80)%3===0?0:Math.floor(n/80)%3===1?-110:110)*this.scale/2;
   const x=this.MAP_WIDTH/2+Math.cos(a)*ring,y=this.MAP_HEIGHT/2+Math.sin(a)*ring;
   if(!this.canStand(x,y,20)||this.isInWater(x,y)||this.nearChoke(x,y,radius+40)||[this.templeRuins,...this.lairs].some(b=>Math.hypot(x-b.x,y-b.y)<radius+b.radius+65)||this.habitats.some(b=>Math.hypot(x-b.x,y-b.y)<radius+b.radius+25))continue;
   site={id:'habitat_'+index+'_'+def.tier,kind:def.habitat,name:window.GameData.HabitatNames[def.habitat],x,y,radius};break;
  }
  if(!site)throw new Error('Không tìm được sinh cảnh cho '+def.id);
  this.habitats.push(site);return site;
 },
 // ---- rendering: static layer cached in offscreen tiles, bushes and the temple seal drawn live ----
 // Two LODs: whole map at 0.5px/world px when zoomed out, 1024px tiles at 1:1 when zoomed in (LRU capped).
 buildTile(size,res,tx,ty){
  if(typeof document==='undefined'||!document.createElement)return null;
  const m=4,c=document.createElement('canvas');c.width=c.height=Math.ceil((size+2*m)*res);
  const g=c.getContext&&c.getContext('2d');if(!g)return null;
  const s=this.scale,ox=tx*size-m,oy=ty*size-m;
  g.setTransform(res*s,0,0,res*s,-ox*res,-oy*res);
  g.save();g.beginPath();g.rect(ox/s,oy/s,(size+2*m)/s,(size+2*m)/s);g.clip();
  window.GameEngine.MapRender.drawStatic(this,g,{x0:ox/s-40,y0:oy/s-40,x1:(ox+size+2*m)/s+40,y1:(oy+size+2*m)/s+40},res>=1);
  g.restore();c.originX=ox;c.originY=oy;c.span=size+2*m;return c;
 },
 invalidateCache(){this.tileCache=null;},
 drawStaticLayer(ctx,v,zoom){
  if(this.cacheArena!==this.ancientArena){this.tileCache=null;this.cacheArena=this.ancientArena;}
  const hi=zoom>=.7,size=hi?1024:2600,res=hi?1:.5,cache=this.tileCache||(this.tileCache=new Map());
  const x0=Math.max(0,Math.floor(v.x0/size)),x1=Math.min(Math.ceil(this.MAP_WIDTH/size)-1,Math.floor(v.x1/size)),y0=Math.max(0,Math.floor(v.y0/size)),y1=Math.min(Math.ceil(this.MAP_HEIGHT/size)-1,Math.floor(v.y1/size));
  const cap=Math.max(14,(x1-x0+1)*(y1-y0+1)+2); // never evict tiles that are on screen right now
  for(let tx=x0;tx<=x1;tx++)
   for(let ty=y0;ty<=y1;ty++){
    const key=(hi?'h':'l')+tx+','+ty;let tile=cache.get(key);
    if(tile===undefined){tile=this.buildTile(size,res,tx,ty);cache.set(key,tile);
     if(hi){const keys=[...cache.keys()].filter(k=>k[0]==='h');if(keys.length>cap)cache.delete(keys[0]);}}
    else if(hi){cache.delete(key);cache.set(key,tile);}
    if(tile)ctx.drawImage(tile,tile.originX,tile.originY,tile.span,tile.span);
    else{const s=this.scale;ctx.save();ctx.scale(s,s);window.GameEngine.MapRender.drawStatic(this,ctx,{x0:v.x0/s,y0:v.y0/s,x1:v.x1/s,y1:v.y1/s},hi);ctx.restore();}
   }
 },
 render(ctx,camera){
  const s=this.scale,c=camera||{x:this.MAP_WIDTH/2,y:this.MAP_HEIGHT/2,zoom:.2,viewportWidth:1366,viewportHeight:768},z=Math.max(.05,c.zoom||1);
  const hw=(c.viewportWidth||1366)/2/z+100,hh=(c.viewportHeight||768)/2/z+100,v={x0:c.x-hw,y0:c.y-hh,x1:c.x+hw,y1:c.y+hh};
  this.drawStaticLayer(ctx,v,z);
  ctx.save();ctx.scale(s,s);window.GameEngine.MapRender.drawDynamic(this,ctx,{x0:v.x0/s,y0:v.y0/s,x1:v.x1/s,y1:v.y1/s});ctx.restore();
 }
};
