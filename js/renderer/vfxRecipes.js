/**
 * vfxRecipes.js - Bảng công thức hiệu ứng (data-driven) cho vfxManager.
 * Mỗi recipe = { el?, life?, tele:[], exec:[], zone:[], after:[] }, mỗi phần tử = [primitive, options].
 * Primitive: ring, arc, beam, pillar, decal, burst, streak, glyph (xem vfxManager.js).
 * Khóa tra cứu: id kỹ năng bot ('w_thunder_slash'), 'mon:<mode>' (quái), 'anc:<effect>' (boss Thượng Cổ), 'k:<kind>' (cũ).
 * Tùy chọn chung: t0/t1 cửa sổ thời gian 0..1, tier = bậc tối thiểu, at:'end' = vẽ ở điểm đích, sh = chỉ khi shape khớp.
 */
window.GameRenderer = window.GameRenderer || {};
(function(){
const PI=Math.PI,R={};

// ---------- 35 kỹ năng bot (id -> recipe riêng) ----------
// Chiến binh
R.w_thunder_slash={el:'lightning',life:.6,
  tele:[['glyph',{k:'cross',R:22,a:.6}]],
  exec:[['arc',{th:.3}],['beam',{w:4,zig:9}],['beam',{w:3,zig:8,da:.4,len:.8,tier:2}],['beam',{w:3,zig:8,da:-.4,len:.8,tier:2}],
    ['arc',{th:.14,t0:.25,tier:3,flip:1}],['burst',{k:'spark',n:10,r1:1.1,dir:1,spread:.75}]]};
R.w_shield_bash={el:'steel',life:.65,
  tele:[['glyph',{k:'shield',R:26}]],
  exec:[['streak',{k:'ghost',n:4}],['streak',{k:'wind',n:5}],['ring',{at:'end',R:34,w:7,fill:.25}],['glyph',{k:'shield',at:'end',R:26,t0:.1,t1:.8}],
    ['burst',{k:'spark',at:'end',n:10,R:40}],['burst',{k:'star',at:'end',n:3,R:22,up:22,t0:.3,tier:2}]]};
R.w_whirlwind={el:'steel',life:.7,
  exec:[['arc',{spread:PI,th:.18,n:2,step:PI,a:.9}],['arc',{spread:PI,th:.1,n:2,step:PI,off:1.2,t0:.1,tier:2}],['ring',{r0:.8,r1:1,w:4,a:.6}],
    ['decal',{k:'swirl',a:.6}],['burst',{k:'spark',n:12,r0:.9,r1:1.15}]]};
R.w_crushing_charge={el:'earth',life:.8,
  tele:[['glyph',{k:'rune',R:26,n:3}]],
  exec:[['streak',{k:'dust',n:6,add:false}],['streak',{k:'ghost',n:3}],['ring',{at:'end',R:46,w:9,fill:.3}],['burst',{k:'puff',at:'end',n:8,R:52,add:false}],
    ['decal',{k:'crack',at:'end',R:34,a:.8,t0:.1,tier:2}],['burst',{k:'shard',at:'end',n:8,R:44,tier:3}]]};
R.w_second_wind={el:'heal',life:1,
  exec:[['ring',{r0:1.5,r1:.3,w:3,t1:.5}],['ring',{t0:.4,r1:1.1,fill:.3,w:6}],['burst',{k:'cross',n:5,R:36,up:34}],['burst',{k:'leaf',n:6,R:30,up:26,tier:2}],
    ['glyph',{k:'rune',R:30,n:6,tier:3}]]};
R.w_execution_cleave={el:'blood',life:.9,
  tele:[['glyph',{k:'cross',R:36}],['pillar',{w:.12,h:120,a:.3}]],
  exec:[['beam',{abs:1,da:PI/2,from:-170,px:0,w:12,t1:.5}],['pillar',{w:.16,h:200,tier:3}],['ring',{R:62,w:8,fill:.3,t0:.15}],['ring',{R:84,w:4,t0:.3,tier:2}],
    ['decal',{k:'crack',R:50,a:.8,t0:.15}],['burst',{k:'drop',n:14,R:56,g:26,t0:.15}]]};
R.w_earthquake_stomp={el:'earth',life:1.1,
  exec:[['ring',{n:2,gap:.18,w:10,fill:.2}],['decal',{k:'crack',a:.9,t0:.05}],['burst',{k:'shard',n:10,r1:1.1,up:16}],['burst',{k:'puff',n:8,r0:.2,r1:.9,add:false}],
    ['ring',{r0:.1,r1:.5,w:5,t0:.2,tier:3}],['burst',{k:'shard',n:12,r1:.6,t0:.2,tier:3}]]};
R.w_iron_wall={el:'steel',
  exec:[['glyph',{k:'shield',R:34,hold:1}],['glyph',{k:'shield',R:42,a:.6,tier:2,hold:1}],['glyph',{k:'shield',R:50,a:.45,tier:3,hold:1}],['ring',{R:36,w:4,t1:.35}]]};
R.w_armor_piercer={el:'steel',life:.7,
  exec:[['beam',{from:-90,px:16,w:6,t1:.6}],['ring',{R:28,w:4}],['burst',{k:'shard',n:8,R:34,r0:.2}],['burst',{k:'shard',n:5,R:44,tier:3}]]};
R.w_riposte={el:'steel',
  exec:[['glyph',{k:'shield',R:34,hold:1}],['glyph',{k:'cross',R:26,spin:1,hold:1,tier:2}],['burst',{k:'spark',n:6,R:30,t1:.5}],['ring',{R:40,w:3,tier:3}]]};

// Pháp sư
R.m_fireball={el:'fire',life:.9,
  exec:[['pillar',{w:.5,h:70,a:.7}],['ring',{w:8,fill:.5}],['ring',{w:4,t0:.15,tier:2}],['burst',{k:'ember',n:10,up:30,r1:1.2}],['burst',{k:'spark',n:8}],['decal',{k:'scorch',a:.7}]],
  zone:[['decal',{k:'scorch'}]]};
R.m_frost_bolt={el:'ice',life:.6,
  exec:[['ring',{R:30,w:5,fill:.4}],['burst',{k:'shard',n:8,R:34}],['decal',{k:'frost',R:26,a:.6}],['glyph',{k:'snow',R:30,tier:3}]]};
R.m_blink={el:'void',life:.65,
  tele:[['glyph',{k:'rune',R:26,n:5}]],
  exec:[['ring',{R:30,r0:1,r1:.1,w:4}],['ring',{at:'end',R:36,w:6,fill:.3}],['streak',{k:'slice',w:3}],['burst',{k:'spark',at:'end',n:10,R:34}]],
  after:[['glyph',{k:'ghost',R:22,hold:1}],['glyph',{k:'rune',R:22,n:5,hold:1}],['burst',{k:'wisp',n:5,R:22,up:20}]]};
R.m_gravity_vortex={el:'void',
  tele:[['burst',{k:'spark',n:12,r0:1.1,r1:.2,inward:1,loop:1}],['glyph',{k:'rune',n:3,a:.5}]],
  zone:[['decal',{k:'void'}]]};
R.m_mana_shield={el:'mana',
  exec:[['decal',{k:'dome',R:32,hold:1}],['glyph',{k:'orbit',R:36,n:2,hold:1}],['glyph',{k:'orbit',R:44,n:3,spin:-1.4,tier:3,hold:1}]]};
R.m_meteor_strike={el:'fire',life:1.4,
  tele:[['pillar',{drop:1,h:300,w:.2,a:.85}],['glyph',{k:'rune',n:5,a:.6}]],
  exec:[['pillar',{w:.9,h:300,t1:.5}],['ring',{n:3,gap:.14,w:12,fill:.5}],['burst',{k:'ember',n:18,up:40,r1:1.3}],['burst',{k:'shard',n:10}],
    ['burst',{k:'puff',n:6,t0:.2,add:false}],['decal',{k:'scorch',a:.9}],['decal',{k:'crack',a:.8,tier:2,t0:.1}]]};
R.m_ice_block={el:'ice',
  exec:[['decal',{k:'crystal',R:30,hold:1}],['ring',{R:40,w:5,t1:.4}],['burst',{k:'shard',n:8,R:36,t1:.5}]]};

// Xạ thủ
R.a_double_tap={el:'steel',life:.4,
  tele:[['beam',{w:1.3,a:.5,flick:1}],['glyph',{k:'cross',at:'end',R:14,spin:0}]],
  exec:[['ring',{R:24,w:4}],['burst',{k:'spark',n:5,R:26}],['glyph',{k:'cross',R:18,spin:0,t1:.5}]]};
R.a_disengage_vault={el:'wind',life:.6,
  tele:[['glyph',{k:'rune',R:24,n:3}]],
  exec:[['streak',{k:'wind',n:5}],['burst',{k:'puff',n:5,R:24,add:false}],['ring',{R:26,w:4}],['burst',{k:'feather',at:'end',n:5,R:26,up:14,tier:3}]]};
R.a_rain_of_arrows={el:'steel',life:1.2,
  tele:[['glyph',{k:'rune',n:3,a:.5}]],
  exec:[['burst',{k:'arrowfall',n:10,t1:.4}],['ring',{t0:.3,w:4,fill:.2}],['decal',{k:'arrows',a:.9,t0:.15}],['burst',{k:'puff',n:6,t0:.3,add:false}]]};
R.a_snipe={el:'steel',life:.6,
  tele:[['beam',{w:1.6,a:.8,flick:1}],['glyph',{k:'cross',at:'end',R:20,spin:0}],['glyph',{k:'cross',at:'end',R:34,spin:0,a:.4}]],
  exec:[['ring',{R:30,w:6,fill:.5}],['glyph',{k:'cross',R:38,spin:0,a:.9,t1:.5}],['burst',{k:'spark',n:12,R:40}],['burst',{k:'shard',n:6,R:30,tier:3}]]};
R.a_windrunner={el:'wind',life:1.4,
  exec:[['ring',{n:2,fill:.15,w:4}],['decal',{k:'swirl',a:.8}],['burst',{k:'leaf',n:6,up:20,tier:2}]]};

// Sát thủ
R.as_shadowstep={el:'shadow',life:.7,
  tele:[['glyph',{k:'rune',R:24,n:4,add:false}]],
  exec:[['streak',{k:'ghost',n:4,add:false}],['streak',{k:'slice',w:3}],['ring',{at:'end',R:30,add:false}],
    ['arc',{at:'end',L:44,spread:.8,n:2,step:PI,off:.8,th:.2}],['burst',{k:'puff',at:'end',n:6,R:32,add:false}]]};
R.as_vanish={el:'shadow',life:1,
  exec:[['burst',{k:'puff',n:10,R:34,add:false}],['glyph',{k:'ghost',R:24,add:false,t1:.8}],['ring',{R:38,w:5,add:false}],['burst',{k:'wisp',n:6,R:30,up:26}]]};
R.as_throat_slit={el:'blood',life:.7,
  exec:[['arc',{L:48,spread:.9,th:.18,off:.5}],['beam',{from:-40,px:40,w:3,da:.5,abs:0}],['burst',{k:'drop',n:8,R:30,g:30}],['burst',{k:'drop',n:6,R:44,g:30,tier:3}],
    ['glyph',{k:'cross',R:22,spin:0,tier:2,t0:.2}]]};
R.as_smoke_bomb={el:'smoke',life:1,
  exec:[['ring',{R:50,w:10,add:false,fill:.4}],['burst',{k:'puff',n:12,R:60,add:false}],['burst',{k:'spark',n:6,R:30,t1:.3}]],
  zone:[['decal',{k:'smoke'}]]};
R.as_assassinate={el:'blood',life:.9,
  exec:[['arc',{L:56,spread:.9,th:.2,off:.9,n:2,step:-1.8}],['ring',{R:44,w:5}],['pillar',{w:.1,h:150,tier:2}],['burst',{k:'drop',n:12,R:44,g:26}],
    ['glyph',{k:'skull',R:30,tier:3,t0:.2}]]};

// Hỗ trợ
R.h_armament_swap={el:'steel',life:.8,
  exec:[['glyph',{k:'swap',R:32}],['ring',{R:34,w:4,fill:.2}],['burst',{k:'spark',n:6,R:30,tier:2}]]};
R.h_enchanted_blade={el:'void',life:.9,
  exec:[['glyph',{k:'orbit',R:34,n:3,t1:.9}],['ring',{R:30,w:4}],['burst',{k:'spark',n:8,R:30,up:20,tier:2}],['glyph',{k:'orbit',R:44,n:4,spin:-1.2,tier:3,t1:.9}]]};
R.h_healing_aura={el:'heal',life:.9,
  exec:[['ring',{R:100,w:6,fill:.15}],['ring',{R:100,w:3,t0:.2,tier:2}],['burst',{k:'cross',n:6,R:60,up:36}],['burst',{k:'leaf',n:8,R:70,up:30,tier:3}]],
  zone:[['decal',{k:'heal'}]]};
R.h_wind_form={el:'wind',life:1,
  exec:[['decal',{k:'swirl',R:38,a:.9}],['ring',{R:40,w:4}],['burst',{k:'feather',n:8,R:34,up:18}],['ring',{R:46,w:3,t0:.3,tier:3,dash:1}]]};
R.h_chaos_bolt={el:'chaos',life:.65,
  exec:[['ring',{R:30,w:6}],['glyph',{k:'eye',R:26,a:.8}],['burst',{k:'shard',n:8,R:36}],['burst',{k:'spark',n:6}],['glyph',{k:'star',R:34,tier:3}]]};

// ---------- Quái vật: recipe theo cơ chế (mode); màu lấy theo loài (tint) ----------
R['mon:line']={life:.55,exec:[['beam',{w:12,sh:'line'}],['arc',{th:.3,sh:'cone'}],['burst',{k:'spark',n:10,R:40,r1:1.2}],['ring',{R:30,w:5,at:'end',sh:'line',fill:.3}]]};
R['mon:circle']={life:.7,exec:[['arc',{spread:PI,th:.2,n:3,step:PI*2/3,a:.9}],['ring',{r0:.7,r1:1,w:6}],['burst',{k:'spark',n:10,r0:.9,r1:1.2}]]};
R['mon:acid']={life:.8,exec:[['burst',{k:'bubble',n:10,r1:.9}],['ring',{w:6,fill:.3}]],zone:[['decal',{k:'acid'}]]};
R['mon:cone']={life:.6,exec:[['arc',{th:.35,a:.9}],['arc',{th:.2,t0:.2,off:0}],['burst',{k:'puff',n:6,r1:1,dir:1,spread:.75,add:false}]]};
R['mon:charge']={life:.7,exec:[['beam',{w:18,t1:.5}],['burst',{k:'puff',n:8,r1:1,dir:1,spread:.3,add:false}],['burst',{k:'shard',n:6,R:30}],['ring',{R:28,w:5,t1:.5}]]};
R['mon:cage']={life:2,exec:[['burst',{k:'shard',n:6,R:60,r0:.4}]],zone:[['decal',{k:'bars'}]]};
R['mon:ring']={life:1,exec:[['ring',{n:2,gap:.18,w:11,fill:.25}],['decal',{k:'crack',a:.8,t0:.05}],['burst',{k:'shard',n:10,up:14}],['burst',{k:'puff',n:8,r1:.9,add:false}]]};
R['mon:pillars']={life:.9,exec:[['pillar',{w:.8,h:220,t1:.6}],['ring',{w:6,fill:.4}],['burst',{k:'ember',n:10,up:36}],['decal',{k:'scorch',a:.8,t0:.1}]]};
R['mon:fissure']={life:1,exec:[['decal',{k:'crack',lava:1}],['burst',{k:'ember',n:10,up:26}]],zone:[['decal',{k:'crack',lava:1}]]};
R['mon:leap']={life:.9,exec:[['ring',{n:2,gap:.15,w:9,fill:.3}],['burst',{k:'puff',n:10,r1:1,add:false}],['burst',{k:'shard',n:8,up:20}],['decal',{k:'crack',a:.7,t0:.1}]]};
R['mon:flurry']={life:.7,exec:[['arc',{th:.2,spread:.7,n:3,step:.5,off:-.5}],['burst',{k:'spark',n:12,dir:1,spread:.75,r1:1.1}],['ring',{R:26,w:4,at:'end',sh:'cone'}]]};
R['mon:fan']={life:.55,exec:[['beam',{w:6,sh:'line'}],['burst',{k:'bubble',n:5,R:30,sh:'line',at:'end'}],['burst',{k:'spark',n:5,R:26,r1:1.1}]]};
R['mon:tether']={life:2,zone:[['decal',{k:'tether'}]],exec:[['ring',{R:34,w:5}]]};
R['mon:leech']={life:2,zone:[['decal',{k:'tether',leech:1}]],exec:[['ring',{R:34,w:5}],['burst',{k:'drop',n:6,R:34,g:-30}]]};
R['mon:storm']={life:1.8,exec:[['ring',{w:5,fill:.3}],['burst',{k:'shard',n:10,up:12}]],zone:[['decal',{k:'storm'}]]};
R['mon:interrupt']={life:.7,exec:[['ring',{n:3,gap:.14,w:7}],['glyph',{k:'cross',R:30,a:.8}],['burst',{k:'spark',n:10}]]};
R['mon:beam']={life:.6,exec:[['beam',{w:16,t1:.7}],['burst',{k:'spark',n:10,R:30,r1:1.1,at:'end',sh:'line'}]]};
R['mon:vortex']={life:2,exec:[['ring',{r0:1.2,r1:.2,w:5}]],zone:[['decal',{k:'void'}]]};
R['mon:freeze']={life:1,exec:[['ring',{n:2,gap:.15,w:8,fill:.4}],['glyph',{k:'clock',R:70}],['burst',{k:'shard',n:14,up:10}],['decal',{k:'frost',a:.7}]]};
R['mon:sea']={life:2,exec:[['ring',{w:7,fill:.3}]],zone:[['decal',{k:'sea'}]]};
R['mon:song']={life:.9,exec:[['ring',{n:4,gap:.12,w:5}],['burst',{k:'note',n:8,up:30}]]};
R['mon:nuke']={life:1.3,exec:[['pillar',{w:1,h:360,t1:.6}],['ring',{n:3,gap:.12,w:14,fill:.5}],['burst',{k:'ember',n:20,up:30,r1:1.2}],['decal',{k:'scorch',a:.9}]]};
R['mon:spores']={life:2,exec:[['burst',{k:'puff',n:8,r1:.9,add:false}]],zone:[['decal',{k:'spores'}]]};
R['mon:mark']={life:2,exec:[['glyph',{k:'skull',R:26,hold:1}],['glyph',{k:'rune',R:30,n:5,hold:1}],['ring',{R:30,w:3,t1:.3}]]};
R['mon:judgment']={life:1,exec:[['pillar',{w:.5,h:260,t1:.5}],['ring',{n:2,gap:.15,w:9,fill:.35}],['glyph',{k:'rune',n:6,a:.7}]]};
R['mon:ghost']={life:.9,exec:[['burst',{k:'wisp',n:10,up:36}],['ring',{w:5,fill:.25}],['glyph',{k:'ghost',R:24,add:false,t1:.8}]]};
R['mon:chains']={life:.9,exec:[['glyph',{k:'chain',R:30}],['ring',{w:5,fill:.25}],['burst',{k:'spark',n:8}]]};
R['mon:projectile']={life:.5,exec:[['ring',{R:30,w:6,fill:.4}],['burst',{k:'shard',n:8,R:34}],['burst',{k:'spark',n:6,R:30}]]};
R['mon:default']={life:.6,exec:[['ring',{w:6,fill:.35}],['burst',{k:'spark',n:8}]]};
// Chiêu đặc trưng của Yêu Thần
R.supernova=R['mon:nuke'];
R.underworld_rainbow={life:.8,exec:[['beam',{w:22,t1:.8}],['beam',{w:12,da:.05,t1:.8}],['beam',{w:12,da:-.05,t1:.8}],['burst',{k:'wisp',n:8,R:40,r1:1.2}]]};

// ---------- Boss Thượng Cổ: recipe theo effect ----------
R['anc:meteor']={life:1.1,exec:[['pillar',{w:.9,h:320,t1:.5}],['ring',{n:2,gap:.14,w:11,fill:.5}],['burst',{k:'ember',n:14,up:36}],['decal',{k:'scorch',a:.85}]]};
R['anc:sweep']={life:.8,exec:[['arc',{th:.4,a:.9}],['arc',{th:.2,t0:.15}],['burst',{k:'shard',n:10,dir:1,spread:1.2,r1:1.1}],['burst',{k:'puff',n:6,add:false,dir:1,spread:1}]]};
R['anc:pull']={life:1.2,exec:[['ring',{r0:1.2,r1:.1,w:8,fill:.2}],['burst',{k:'shard',n:10,inward:1,r0:1.1,r1:.2}]],zone:[['decal',{k:'void',sand:1}]]};
R['anc:spin_beam']={life:.5,exec:[['beam',{w:22,t1:.8}],['burst',{k:'spark',n:8,at:'end',R:30}]]};
R['anc:lava']={life:1,exec:[['burst',{k:'ember',n:12,up:30,r1:1}]],zone:[['decal',{k:'crack',lava:1}]]};
R['anc:copy_first']={life:.8,exec:[['glyph',{k:'swap',R:60}],['ring',{n:2,gap:.15,w:6,fill:.2}],['burst',{k:'shard',n:10}]]};
R['anc:copy_second']=R['anc:copy_first'];
R['anc:leap']={life:.9,exec:[['ring',{n:2,gap:.14,w:10,fill:.3}],['burst',{k:'puff',n:10,add:false}],['decal',{k:'crack',a:.7,t0:.1}],['burst',{k:'shard',n:8,up:18}]]};
R['anc:swap']={life:.8,exec:[['glyph',{k:'swap',R:40}],['ring',{R:44,w:5}]]};
R['anc:combo']={life:.5,exec:[['arc',{th:.25,n:2,step:PI,off:.7,spread:.9,L:60}],['burst',{k:'spark',n:10,R:50}],['ring',{w:5}]]};
R['anc:devour']={life:1.2,exec:[['beam',{w:30,t1:.6}]],zone:[['decal',{k:'maw'}]]};
R['anc:acid']={life:1,exec:[['burst',{k:'bubble',n:14,r1:.9}],['ring',{w:6,fill:.3}]],zone:[['decal',{k:'acid'}]]};
R['anc:tentacles']={life:1,exec:[['decal',{k:'tentacle'}],['ring',{w:5,fill:.3}],['burst',{k:'puff',n:6,add:false}]]};
R['anc:panic']={life:.9,exec:[['ring',{n:4,gap:.12,w:6}],['arc',{th:.3,a:.7}],['glyph',{k:'eye',R:50,a:.8}]]};
R['anc:collapse']={life:.8,exec:[['beam',{w:26,t1:.8}],['beam',{w:6,zig:20,da:.04}],['burst',{k:'spark',n:12,R:50,sh:'line'}]]};
R['anc:cross']={life:.7,exec:[['beam',{w:18}],['burst',{k:'spark',n:8,R:40,at:'end'}],['ring',{R:40,w:5,t0:.1}]]};
R['anc:spear']={life:.7,exec:[['beam',{w:14,t1:.6}],['ring',{R:30,w:6,at:'end'}],['burst',{k:'shard',n:8,R:34,at:'end'}]]};
R['anc:fissure']={life:1.2,exec:[['decal',{k:'crack',lava:1}],['burst',{k:'ember',n:10,up:26}]],zone:[['decal',{k:'crack',lava:1}]]};
R['anc:map_arrow']={life:.9,exec:[['beam',{w:20,t1:.9}],['burst',{k:'feather',n:8,R:40,at:'end'}]]};
R['anc:matrix']={life:1.1,exec:[['glyph',{k:'rune',n:6,R:70}],['ring',{w:6,fill:.35}],['burst',{k:'spark',n:10}]]};
R['anc:lasers']={life:.7,exec:[['beam',{w:18,t1:.9}]],zone:[['decal',{k:'laser'}]]};
R['anc:net']={life:1,exec:[['ring',{n:2,gap:.15,w:5,fill:.2}],['burst',{k:'spark',n:14}]],zone:[['decal',{k:'net'}]]};
R['anc:saw']={life:.9,exec:[['ring',{n:2,gap:.14,w:9,fill:.3}],['glyph',{k:'saw',R:56}],['burst',{k:'spark',n:16,R:60}]]};
R['anc:wall']={life:.8,exec:[['ring',{w:6,fill:.3}],['burst',{k:'shard',n:10,up:22}],['burst',{k:'puff',n:6,add:false}],['decal',{k:'crack',R:36,a:.7}]]};
R['anc:split']={life:1,exec:[['glyph',{k:'swap',R:80}],['ring',{n:3,gap:.12,w:7,fill:.25}],['burst',{k:'shard',n:16,r1:1.2}],['burst',{k:'wisp',n:8,up:30}]]};
R['anc:homing']={life:.5,exec:[['ring',{R:34,w:6,fill:.4}],['burst',{k:'spark',n:10,R:36}],['burst',{k:'ember',n:6,R:30,up:16}]]};
R['anc:nuclear']={life:1.6,
  tele:[['ring',{r0:1.6,r1:.9,w:4,t1:.9}],['glyph',{k:'rune',n:8,a:.7}]],
  exec:[['pillar',{w:1.2,h:420,t1:.6}],['ring',{n:4,gap:.12,w:16,fill:.55}],['burst',{k:'ember',n:26,up:40,r1:1.3}],['decal',{k:'scorch',a:.95}]]};
R['anc:doom_bolt']={life:.6,tele:[['pillar',{drop:1,h:420,w:.14,a:.9}]],exec:[['pillar',{w:.5,h:420,t1:.4}],['ring',{w:6,fill:.5}],['burst',{k:'spark',n:12}]]};

// ---------- Kind cũ (relic, đánh thường, hit...) ----------
R['k:telegraph']={};
R['k:slash']={exec:[['arc',{th:.26}],['burst',{k:'spark',n:5,dir:1,spread:.8,r1:1.1}]]};
R['k:guard']={exec:[['glyph',{k:'shield',R:30,hold:1}]]};
R['k:dash']={exec:[['streak',{k:'wind',n:3}],['streak',{k:'slice',w:3}]]};
R['k:heal']={exec:[['ring',{w:4,fill:.25}],['burst',{k:'cross',n:4,R:30,up:28}]]};
R['k:rune']={exec:[['glyph',{k:'rune',n:6}],['ring',{w:3,t1:.5}]]};
R['k:smoke']={exec:[['burst',{k:'puff',n:8,add:false}],['ring',{w:5,add:false}]]};
R['k:flame']={exec:[['pillar',{w:.5,h:60,a:.6}],['ring',{w:6,fill:.4}],['burst',{k:'ember',n:8,up:26}]]};
R['k:frost']={exec:[['ring',{w:5,fill:.35}],['burst',{k:'shard',n:8}],['decal',{k:'frost',a:.5}]]};
R['k:impact']={exec:[['ring',{w:6,fill:.3}],['beam',{w:10,sh:'line'}],['arc',{th:.3,sh:'cone'}],['burst',{k:'spark',n:8}]]};
R['k:hit']={exec:[['ring',{w:3}],['burst',{k:'spark',n:6,r1:1.2}]]};

// ---------- Đạn bay: kiểu vẽ + nguyên tố ----------
const PROJ={
  m_fireball:{k:'comet',el:'fire',size:9},
  m_frost_bolt:{k:'shard',el:'ice',size:8},
  a_double_tap:{k:'arrow',el:'steel'},
  a_snipe:{k:'bolt',el:'steel',size:3},
  h_chaos_bolt:{k:'orb',el:'chaos',size:8,jitter:1},
  a_rain_of_arrows:{k:'arrow',el:'steel'},
  dark_fireball:{k:'comet',el:'void',size:9},
  throw_boulder:{k:'rock',el:'earth',size:11},
  mega_boulder:{k:'rock',el:'earth',size:14},
  bow:{k:'arrow',el:'steel'},crossbow:{k:'arrow',el:'steel'},
  staff:{k:'orb',size:6},tome:{k:'orb',size:6},hybrid_cane:{k:'orb',size:6},
  fireball:{k:'comet',el:'fire',size:8},magic:{k:'orb',size:6},arrow:{k:'arrow',el:'steel'},projectile:{k:'orb',size:8}
};

window.GameRenderer.VfxRecipes={R,PROJ};
})();
