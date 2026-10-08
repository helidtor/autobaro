window.GameEngine=window.GameEngine||{};
// Procedural Web Audio: no downloads, no dependency and no gameplay RNG (local xorshift only).
// Every sound is a data-driven recipe: layers of pitch-gliding oscillators (o) and filtered noise (n),
// bells (b = 3 inharmonic partials) and an optional shared echo send (rv).
(()=>{
let seed=0x9e3779b9;const rnd=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};
const o=(t,f0,f1,d,g,at=0,c=0)=>({o:1,t,f0,f1,d,g,at,c});
const n=(f,f0,f1,q,d,g,at=0)=>({n:1,f,f0,f1,q,d,g,at});
const b=(f,d,g,at=0,t='sine')=>[o(t,f,f*.997,d,g,at),o('sine',f*2.76,f*2.75,d*.55,g*.4,at),o('sine',f*5.4,f*5.38,d*.3,g*.16,at)];
const rep=(count,gap,make)=>Array.from({length:count},(_,i)=>make(i,i*gap)).flat();
const R=(rv,...parts)=>({rv,L:parts.flat()});
const arp=(notes,gap,d,g,t='triangle')=>notes.flatMap((f,i)=>b(f,d,g,i*gap,t));
const T={};

// ---- weapons: wind (draw/ready), swing (release), hit, block ----
const W={ // style: [wind, swing]
 unarmed:[R(0,n('bandpass',500,900,1,.12,.04)),R(0,n('bandpass',700,350,.8,.1,.09),o('sine',140,60,.1,.1))],
 sword:[R(0,n('highpass',3000,5000,.7,.1,.035),o('sine',2400,3200,.12,.015)),R(.1,n('bandpass',1800,3800,1.2,.16,.1),n('highpass',4000,6000,.6,.1,.04,.02),o('triangle',700,300,.1,.03))],
 dagger:[R(0,n('highpass',5000,7000,.8,.07,.03)),R(0,n('bandpass',3500,6000,1.5,.09,.08),o('sine',900,500,.06,.02))],
 spear:[R(0,n('bandpass',1400,2000,1,.12,.04)),R(.08,n('bandpass',900,2600,1.8,.14,.09),o('sine',300,520,.12,.04))],
 axe:[R(0,o('triangle',90,120,.2,.05),n('lowpass',500,800,.7,.2,.05)),R(.08,n('bandpass',500,1100,.9,.22,.12),o('sine',110,55,.2,.12))],
 hammer:[R(0,o('sine',60,90,.28,.07),n('lowpass',350,500,.7,.25,.05)),R(.12,n('lowpass',900,300,.7,.28,.12),o('sine',80,40,.3,.16))],
 bow:[R(0,o('sawtooth',180,260,.35,.015,0,700),n('bandpass',900,1400,6,.3,.03)),R(.1,o('triangle',520,180,.18,.1),o('sine',1040,360,.14,.04),n('highpass',3000,5000,.7,.04,.03))],
 crossbow:[R(0,rep(3,.07,(i,at)=>n('bandpass',2500,2500,8,.03,.07,at))),R(.08,o('square',300,90,.08,.05,0,900),n('bandpass',2000,900,2,.08,.1),o('triangle',700,250,.12,.06))],
 staff:[R(.15,o('sine',300,480,.3,.04),b(660,.3,.02)),R(.2,o('sine',500,1100,.25,.07),b(880,.4,.04))],
 tome:[R(.1,n('bandpass',2800,1800,1.5,.1,.04),o('sine',420,620,.3,.03)),R(.25,o('sine',380,760,.3,.06),n('bandpass',2200,3200,3,.2,.04),b(1175,.5,.035))]
};
const H={ // hit by weapon style / element / dot
 unarmed:R(0,o('sine',160,55,.13,.18),n('lowpass',800,300,.7,.07,.1)),
 sword:R(0,n('bandpass',2500,1200,1.5,.08,.1),o('sine',180,70,.12,.12),b(1800,.18,.04)),
 dagger:R(0,n('bandpass',3500,2200,2,.05,.09),o('sine',260,110,.07,.1)),
 spear:R(0,n('bandpass',1500,700,1.5,.07,.1),o('triangle',240,90,.1,.12)),
 axe:R(0,o('sine',130,45,.2,.2),n('lowpass',1500,400,.8,.12,.12),b(900,.12,.03)),
 hammer:R(.1,o('sine',90,30,.3,.26),n('lowpass',1100,200,.7,.18,.14),o('triangle',200,60,.14,.1)),
 bow:R(0,o('sine',220,100,.08,.12),n('bandpass',1800,900,2,.05,.07)),
 crossbow:R(0,o('sine',260,90,.08,.14),n('bandpass',2200,900,2,.05,.08)),
 staff:R(.15,o('triangle',900,300,.12,.08),n('bandpass',2500,1200,3,.08,.06),b(1400,.2,.03)),
 tome:R(.15,o('triangle',1000,320,.14,.08),n('bandpass',2800,1300,3,.1,.06),b(1568,.25,.03)),
 fire:R(.1,n('lowpass',2200,500,.8,.22,.12),o('sawtooth',300,80,.18,.05,0,900),o('sine',120,50,.18,.14)),
 ice:R(.15,b(2200,.35,.07),n('highpass',4000,6000,.7,.1,.06),o('sine',700,300,.1,.06)),
 void:R(.2,o('sine',200,80,.3,.12),o('sine',203,82,.3,.1),n('lowpass',600,150,.8,.25,.06)),
 nature:R(0,n('bandpass',1200,600,1.2,.1,.08),o('triangle',320,150,.12,.1)),
 earth:R(.05,o('sine',100,38,.22,.2),n('lowpass',900,250,.8,.14,.1)),
 steel:R(0,n('bandpass',2800,1500,1.5,.07,.1),b(2000,.2,.05),o('sine',190,80,.1,.1)),
 burn:R(0,rep(3,.05,(i,at)=>n('bandpass',2400-i*500,1200,2,.04,.07,at))),
 bleed:R(0,o('sine',900,420,.07,.07),o('sine',200,90,.1,.08)),
 poison:R(.05,o('sine',350,700,.07,.07),o('sine',320,640,.07,.05,.07)),
 field:R(0,o('sine',150,70,.1,.08),n('bandpass',1500,700,1.5,.06,.05))
};
H.magic=H.staff;H.dot=H.poison;H.hit=H.unarmed;
const BL={
 blade:R(.2,b(1900,.3,.1,0,'triangle'),n('highpass',3500,5500,.8,.08,.07),o('sine',300,180,.1,.08)),
 heavy:R(.1,o('sine',140,60,.2,.18),b(700,.3,.08),n('lowpass',1500,400,.8,.1,.1)),
 arrow:R(0,o('sine',300,150,.07,.1),n('bandpass',2000,2000,3,.04,.06)),
 magic:R(.3,b(1200,.4,.06),o('sine',600,200,.25,.08),n('bandpass',2500,1500,3,.15,.05))
};
for(const [s,[w,sw]] of Object.entries(W)){T['wind.'+s]=w;T['swing.'+s]=sw;T['hit.'+s]=H[s];}
for(const k of Object.keys(H))T['hit.'+k]=H[k];
for(const k of Object.keys(BL))T['block.'+k]=BL[k];
T.hit=H.unarmed;T.block=BL.blade;
T['raise']=R(0,n('bandpass',800,1400,1.5,.1,.04),o('sine',200,260,.08,.04));
T.crit=R(.2,b(2640,.3,.07),n('highpass',5000,7000,.7,.05,.04));

// ---- general actions ----
T.dodge=R(0,n('bandpass',600,2200,1.2,.18,.07),n('highpass',5000,3000,.8,.1,.03),o('sine',200,120,.06,.05));
T.evade=R(.15,n('bandpass',3500,1200,1.5,.14,.06),b(1760,.18,.03,.02));
T.drink=R(0,o('sine',900,1300,.04,.05),rep(3,.12,(i,at)=>o('sine',280+i*30,520+i*40,.07,.08,.06+at)),n('bandpass',1500,1000,3,.3,.015,.06));
T.potion=R(.35,arp([660,880,1320],.07,.5,.045));
T.heal=R(.4,arp([523,659,784,1047],.08,.6,.05),n('highpass',5000,7500,.7,.4,.015));
T.level=R(.45,arp([523,659,784,1047,1319],.1,.9,.06),n('highpass',5000,8000,.7,.9,.02,.2));
T.loot=R(.1,b(1568,.25,.08),b(2093,.3,.06,.06));
T['loot.potion']=R(.15,b(2400,.18,.07),o('sine',500,700,.1,.04));
T['loot.weapon']=R(.1,n('highpass',3500,5500,.7,.06,.06),b(1400,.3,.07));
T['loot.body']=R(0,o('sine',180,120,.1,.08),n('bandpass',2000,1500,2,.08,.05),b(900,.25,.04));
T['loot.head']=R(.1,o('sine',260,150,.08,.07),b(1100,.25,.06));
T['loot.feet']=R(0,o('sine',150,90,.08,.07),n('bandpass',1800,1200,2,.07,.05));
T['loot.relic']=R(.5,arp([880,1175,1760],.09,.8,.06),n('highpass',5000,8000,.7,.6,.02,.1));
const dp=R(.25,o('sine',320,70,.5,.12),o('triangle',160,45,.55,.1),n('lowpass',900,150,.8,.4,.06),o('sine',90,40,.25,.14,.12));
T['death.pawn']=dp;T.death=dp;
T['ui.on']=R(0,b(784,.2,.05),b(1175,.25,.05,.07));
T['ui.tick']=R(0,b(1500,.1,.04));
T.victory=R(.5,arp([523,659,784,1047,1319,1568],.12,1.2,.07),o('sine',262,262,1.6,.05,.5),o('sine',392,392,1.6,.04,.5));

// ---- footsteps by terrain (grass/stone/swim/bridge/bush/rock) ----
T['step.grass']=R(0,n('lowpass',900,500,.7,.07,.04),o('sine',90,60,.05,.03));
T['step.stone']=R(0,n('bandpass',2200,1800,2,.02,.06),o('sine',150,90,.05,.05));
T['step.swim']=R(.1,n('bandpass',500,900,1.2,.18,.05),n('bandpass',1200,700,3,.2,.03,.03),o('sine',400,800,.06,.025,.05));
T['step.bridge']=R(.05,o('triangle',210,150,.09,.07),n('bandpass',900,600,3,.04,.06),o('sine',100,70,.1,.05));
T['step.bush']=R(0,n('highpass',2500,4500,.7,.12,.045));
T['step.rock']=R(0,n('bandpass',1400,800,1.5,.05,.06),o('sine',120,70,.05,.04));
T.step=T['step.grass'];T.swim=T['step.swim'];
T.stomp=R(.1,o('sine',60,35,.22,.12));

// ---- creature voices: roar / bite (attack) / grunt (hurt) / death per family ----
const FAMS={beast:[150,'sawtooth',900,800,1],small:[760,'triangle',3200,3500,.55],undead:[120,'sawtooth',1000,1400,1.1],
 reptile:[95,'sawtooth',1400,6000,1],giant:[62,'sawtooth',420,500,1.4],human:[230,'sawtooth',1400,1200,.7],
 bird:[1250,'triangle',4500,5000,.9],void:[80,'sawtooth',700,300,1.3],mecha:[140,'square',1800,2500,1]};
for(const [k,[f,w,c,nz,len]] of Object.entries(FAMS)){
 T['roar.'+k]=R(.25,o(w,f*1.4,f*.8,.55*len,.1,0,c),o(w,f*1.46,f*.84,.55*len,.08,0,c),n('bandpass',nz,nz*.5,1.6,.5*len,.05),o('sine',f*.5,f*.35,.6*len,.07));
 T['bite.'+k]=R(0,n('bandpass',nz*1.3,nz*.6,1.4,.14,.1),o(w,f*1.6,f*.9,.16*len,.08,0,c),o('sine',f*.8,f*.4,.12,.1));
 T['grunt.'+k]=R(0,o(w,f*1.2,f*.8,.2*len,.09,0,c),n('bandpass',nz,nz*.7,2,.12,.04));
 T['death.'+k]=R(.25,o(w,f*1.2,f*.35,.8*len,.11,0,c),o(w,f*1.25,f*.36,.8*len,.08,0,c),n('lowpass',nz,120,.8,.7*len,.06),o('sine',f*.45,f*.2,.5,.12,.3*len));
}
const FAM={beast:'beast',wolf:'beast',boar:'beast',panther:'beast',bear:'beast',rhino:'beast',small:'small',rat:'small',bat:'small',spider:'small',beetle:'small',crab:'small',toad:'small',monkey:'small',
 skeleton:'undead',zombie:'undead',undead_mage:'undead',floating_wraith:'undead',death_god:'undead',snake:'reptile',serpent:'reptile',naga:'reptile',three_headed_hydra:'reptile',void_dragon:'reptile',
 golem:'giant',ape:'giant',titan_ape:'giant',demon_lord:'giant',treant:'giant',ancient_world_tree:'giant',colossus:'giant',chaos:'giant',humanoid:'human',centaur:'human',mirror:'human',
 solar_phoenix:'bird',void:'void',mecha:'mecha'};

// ---- telegraph warnings, boss phase/awaken/defeat ----
T['warn.mon']=R(.3,o('sine',440,440,.12,.08),o('sine',587,587,.16,.08,.14),o('sawtooth',70,110,.5,.05,0,300));
T['warn.colossus']=R(.35,o('sawtooth',55,82,.9,.1,0,300),o('sawtooth',55.7,82.5,.9,.1,0,300),o('sine',110,165,.9,.06),n('lowpass',300,150,.8,.8,.06));
T['warn.mirror']=R(.5,b(1568,.9,.07),b(2093,.8,.05,.2),o('sine',784,1568,.7,.04));
T['warn.void']=R(.4,o('sine',400,70,.9,.09),o('sine',404,72,.9,.08),n('bandpass',1200,200,2,.9,.05));
T['warn.chaos']=R(.35,o('sawtooth',220,233,.6,.06,0,1500),o('sawtooth',233,247,.6,.06,0,1500),o('sine',55,70,.7,.1),b(311,.6,.05));
T['warn.mecha']=R(.2,rep(3,.12,(i,at)=>o('square',1200+i*200,1200+i*200,.07,.04,at,3000)),o('sawtooth',80,160,.5,.05,.36,500));
for(const [k,f] of Object.entries({colossus:110,mirror:1568,void:220,chaos:311,mecha:880}))
 T['phase.'+k]=R(.45,o('sine',50,25,1.5,.3),n('lowpass',2000,150,.8,1.4,.14),o('sawtooth',100,400,.8,.05,0,1200),b(f,1.4,.08,.2));
T.awaken=R(.5,b(110,2,.14),o('sawtooth',40,90,1.6,.08,0,300),n('lowpass',1500,100,.8,1.6,.1),o('sine',45,30,1.8,.25));
T.ancientDown=R(.5,o('sine',90,25,1.6,.3),n('lowpass',1500,100,.7,1.5,.14),b(659,1.6,.07,.4),b(880,1.6,.06,.7),b(1318,1.6,.05,1));

// ---- 32 bot skills: release sound per skill id ----
const S={
 w_thunder_slash:R(.15,n('bandpass',1800,4200,1.2,.18,.12),n('highpass',5000,8000,.5,.12,.06,.03),o('sawtooth',900,200,.12,.04,0,2000),b(2400,.3,.05,.03)),
 w_shield_bash:R(.1,n('bandpass',400,900,1,.15,.08),o('sine',150,60,.18,.18,.1),b(600,.3,.07,.1,'triangle')),
 w_whirlwind:R(.1,n('bandpass',600,1800,1.5,.3,.12),n('highpass',3000,5000,.7,.28,.05),o('sine',300,500,.3,.04)),
 w_crushing_charge:R(.1,o('sine',70,40,.35,.16),n('lowpass',700,300,.8,.3,.1),n('bandpass',500,1400,1,.25,.07)),
 w_second_wind:R(.3,n('bandpass',600,900,1.5,.3,.05),o('sine',262,330,.45,.05,.1),o('sine',392,494,.45,.04,.1)),
 w_execution_cleave:R(.1,o('sine',100,30,.4,.22),n('lowpass',1800,300,.8,.3,.14),b(1000,.25,.05)),
 w_earthquake_stomp:R(.2,o('sine',60,28,.6,.3),n('lowpass',500,100,.7,.6,.14),n('bandpass',1200,500,2,.2,.07,.1)),
 w_iron_wall:R(.15,b(300,.5,.1,0,'triangle'),b(900,.4,.06),o('sine',120,90,.2,.1)),
 w_armor_piercer:R(.1,n('bandpass',1000,3200,2,.12,.1),b(2600,.35,.07,.06)),
 w_riposte:R(.15,b(1700,.3,.09),n('highpass',4000,6000,.7,.1,.06),n('bandpass',1500,3500,1.2,.12,.08,.1)),
 m_fireball:R(.15,n('lowpass',500,2500,.8,.3,.12),o('sawtooth',200,500,.25,.05,0,1200),n('highpass',3500,5000,.7,.1,.04)),
 m_frost_bolt:R(.3,b(2093,.45,.08),b(3136,.3,.04,.05),n('highpass',5000,7500,.7,.2,.05),o('sine',1200,2200,.2,.04)),
 m_blink:R(.25,o('sine',1800,300,.14,.07),o('sine',300,1600,.14,.07,.14),n('bandpass',3000,3000,3,.05,.05)),
 m_gravity_vortex:R(.3,o('sine',90,200,.7,.1),o('sine',93,210,.7,.08),n('bandpass',300,1200,2.5,.7,.07)),
 m_mana_shield:R(.35,o('sine',330,495,.5,.06),b(1320,.6,.06),o('triangle',660,990,.5,.03)),
 m_meteor_strike:R(.3,o('sine',2000,300,.35,.05),n('highpass',3000,800,.7,.35,.06),o('sine',70,28,.9,.3,.3),n('lowpass',800,100,.7,.8,.2,.3)),
 m_ice_block:R(.25,b(1500,.5,.08,0,'triangle'),n('highpass',3500,6000,.7,.15,.07),o('sine',500,200,.25,.1)),
 a_double_tap:R(.1,o('triangle',650,220,.12,.09),n('highpass',3500,5500,.7,.05,.04),o('sine',1300,500,.1,.03)),
 a_disengage_vault:R(.1,n('bandpass',500,1600,1.2,.16,.08),o('triangle',520,180,.14,.07,.1),n('highpass',3000,5000,.7,.04,.03,.1)),
 a_rain_of_arrows:R(.15,n('highpass',2500,6000,.7,.3,.07),o('sine',2400,1200,.3,.025),n('bandpass',900,500,2,.1,.06,.25)),
 a_snipe:R(.35,o('sine',400,70,.22,.14),n('bandpass',2500,800,1.5,.12,.14),b(1200,.5,.03)),
 a_windrunner:R(.1,n('bandpass',600,2400,1,.35,.09),o('sine',500,900,.3,.03)),
 as_shadowstep:R(.1,o('sine',700,120,.15,.07),n('bandpass',1500,300,1,.18,.09),n('highpass',4500,7000,.7,.06,.07,.1)),
 as_vanish:R(.3,o('sine',900,150,.5,.05),n('bandpass',2500,500,2,.5,.05),o('triangle',300,100,.5,.04)),
 as_throat_slit:R(0,n('highpass',4500,7500,.6,.07,.1),o('sine',700,250,.06,.05),o('sine',900,500,.05,.04,.06)),
 as_smoke_bomb:R(.1,o('sine',300,80,.1,.14),n('lowpass',1500,400,.8,.15,.12),n('bandpass',2500,1500,.8,.7,.04,.05)),
 as_assassinate:R(.2,n('highpass',3500,6000,.6,.05,.1),o('sine',150,40,.4,.18,.04),b(1500,.4,.05,.04)),
 h_armament_swap:R(.15,b(900,.3,.07),n('bandpass',2000,3500,3,.15,.05),o('square',400,800,.08,.02,0,1500)),
 h_enchanted_blade:R(.3,o('sine',440,880,.4,.05),b(1760,.5,.06),n('highpass',4000,7000,.7,.3,.04)),
 h_healing_aura:R(.45,o('sine',392,392,.9,.05,.05),o('sine',494,494,.9,.045,.1),o('sine',587,587,.9,.04,.15),b(1568,.8,.02,.2)),
 h_wind_form:R(.15,n('bandpass',400,2800,1.5,.5,.09),o('sine',350,700,.5,.04),b(1000,.4,.03)),
 h_chaos_bolt:R(.25,o('sawtooth',220,440,.3,.05,0,1500),o('sawtooth',233,466,.3,.05,0,1500),n('bandpass',1000,2500,2,.3,.06))
};
for(const [k,v] of Object.entries(S))T['skill.'+k]=v;
// element fallbacks for skills without their own recipe
T.skill=R(.2,o('sine',240,680,.23,.08),b(880,.3,.04));
T['skill.fire']=S.m_fireball;T['skill.ice']=S.m_frost_bolt;T['skill.void']=S.m_gravity_vortex;T['skill.steel']=S.w_armor_piercer;
T['skill.nature']=R(.15,n('bandpass',1500,900,1.2,.3,.06),o('sine',330,520,.25,.05));T['skill.earth']=S.w_earthquake_stomp;
T['impact.fire']=R(.3,o('sine',90,35,.5,.3),n('lowpass',2400,300,.8,.5,.16),n('highpass',3500,2000,.7,.12,.05));
T['impact.ice']=R(.35,b(1800,.5,.08),n('highpass',4000,7000,.7,.2,.09),o('sine',600,200,.2,.1));
T['impact.void']=R(.35,o('sine',200,45,.6,.2),o('sine',204,46,.6,.16),n('lowpass',600,120,.8,.5,.08));
T['impact.steel']=R(.2,n('bandpass',2000,800,1.5,.1,.12),b(1200,.3,.06),o('sine',150,60,.15,.14));
for(const k of ['nature','earth','magic'])T['impact.'+k]=T['impact.steel'];

// ---- monster skill modes (MonsterTactics) ----
const MN={
 line:R(.1,n('bandpass',500,1100,.9,.22,.12),o('sine',90,40,.3,.2),n('lowpass',900,200,.8,.3,.1,.08)),
 circle:R(.15,o('sine',70,35,.4,.22),n('lowpass',700,150,.8,.35,.12)),
 acid:R(.2,n('bandpass',800,2200,3,.4,.06),rep(3,.1,(i,at)=>o('sine',300+i*50,700+i*80,.1,.07,at))),
 cone:R(0,rep(3,.06,(i,at)=>n('bandpass',3000-i*500,1200,1.5,.08,.09,at))),
 charge:R(.15,S.w_crushing_charge.L,o('sawtooth',120,70,.4,.06,0,500)),
 projectile:R(.15,o('sine',500,1200,.15,.08),n('bandpass',1500,3000,2,.12,.07)),
 cage:R(.2,n('lowpass',500,200,.8,.5,.12),o('sine',80,50,.5,.2),b(500,.3,.05,.2,'triangle')),
 ring:R(.3,o('sine',200,40,.5,.2),n('bandpass',800,300,1,.4,.1),b(300,.5,.05)),
 pillars:R(.2,o('sine',70,40,.6,.2),n('lowpass',800,150,.8,.6,.12),rep(3,.18,(i,at)=>n('bandpass',1500,600,2,.1,.07,.1+at))),
 fissure:R(.2,n('bandpass',2500,500,1.5,.2,.14),o('sine',70,30,.5,.2)),
 leap:R(.2,n('bandpass',400,1500,1.2,.22,.08),o('sine',80,35,.35,.24,.24),n('lowpass',900,200,.8,.3,.12,.24)),
 flurry:R(0,rep(4,.07,(i,at)=>n('bandpass',2800+i*300,1500,1.5,.07,.09,at))),
 fan:R(.1,rep(3,.08,(i,at)=>n('bandpass',900+i*400,2400+i*400,1.2,.14,.08,at))),
 tether:R(.25,o('sine',200,260,.6,.06),o('sine',205,265,.6,.05),n('bandpass',2000,2400,6,.5,.03)),
 storm:R(.3,n('lowpass',1200,200,.7,.8,.14),n('highpass',4000,2000,.6,.15,.1),o('sine',60,35,.7,.12)),
 interrupt:R(.15,n('bandpass',2000,1000,1,.05,.2),b(1200,.25,.07)),
 beam:R(.2,o('sawtooth',300,900,.6,.05,0,2500),o('sine',150,160,.6,.1),n('bandpass',2500,4000,4,.6,.04)),
 vortex:S.m_gravity_vortex,
 freeze:R(.3,S.m_ice_block.L,b(2400,.6,.05,.1)),
 sea:R(.25,n('bandpass',400,1200,.8,.8,.1),n('lowpass',500,300,.7,.9,.08)),
 song:R(.5,b(523,.9,.07),b(622,.9,.06,.15),b(784,1,.05,.3),o('sine',262,262,1,.04)),
 nuke:R(.4,o('sine',2000,300,.35,.04),o('sine',60,24,1.2,.32,.3),n('lowpass',1000,80,.7,1,.2,.3)),
 spores:R(.15,n('lowpass',2000,500,.8,.25,.09),n('bandpass',3000,1500,2,.4,.03)),
 leech:R(.25,o('sine',600,200,.5,.06),o('sine',300,110,.5,.06),n('bandpass',1200,500,3,.4,.04)),
 mark:R(.4,b(220,1.2,.1),o('sine',110,100,.8,.08)),
 judgment:R(.45,b(180,1.4,.14),b(240,1.2,.07),o('sine',90,60,.6,.15)),
 ghost:R(.45,o('sine',500,900,.8,.07),o('sine',507,880,.8,.06),n('bandpass',1500,2500,5,.7,.03)),
 chains:R(.2,rep(5,.07,(i,at)=>b(1100+i*90,.15,.05,at)),n('bandpass',2500,2000,3,.4,.03))
};
for(const [k,v] of Object.entries(MN))T['skill.m_'+k]=v;

// ---- ancient boss skills (by effect) ----
const AN={
 meteor:R(.4,o('sine',2000,300,.5,.05),rep(5,.3,(i,at)=>[o('sine',70,28,.7,.28,.5+at),n('lowpass',800,100,.7,.6,.16,.5+at)])),
 devour:R(.3,n('bandpass',2500,300,2,.9,.09),o('sine',300,60,.9,.1)),
 lava:R(.3,n('lowpass',300,120,.7,.9,.1),rep(4,.2,(i,at)=>o('sine',140+i*20,300,.08,.08,at+.05))),
 mirror:R(.5,b(1319,.8,.07),b(1327,.8,.06,.05),o('sine',659,1319,.5,.04)),
 split:R(.5,b(1175,.8,.07),b(1568,.8,.06,.12),o('sine',880,440,.5,.05)),
 saw:R(.15,o('sawtooth',90,420,.5,.07,0,2500),o('sawtooth',92,430,.5,.06,0,2500),n('bandpass',3000,5000,3,.5,.05)),
 tentacles:R(.2,rep(4,.14,(i,at)=>[n('lowpass',900,300,1,.12,.12,at),o('sine',200,80,.1,.1,at)])),
 panic:R(.4,o('sawtooth',220,233,.8,.07,0,1500),o('sawtooth',311,330,.8,.07,0,1500),n('bandpass',1500,500,3,.7,.05)),
 homing:R(.3,rep(5,.08,(i,at)=>[o('sine',1800+i*150,900,.15,.04,at),n('highpass',3000,5500,.7,.1,.04,at)])),
 spear:R(.2,n('bandpass',900,2600,1.8,.2,.12),o('sine',300,520,.15,.05),o('sine',80,30,.4,.22,.15)),
 arrow:R(.25,n('highpass',2500,6000,.7,.4,.07),o('sine',2400,900,.4,.03),o('sine',70,30,.4,.15,.35)),
 net:R(.2,n('highpass',3000,7000,.5,.5,.08),rep(4,.09,(i,at)=>o('square',1800+i*100,800,.05,.03,at,3500)))
};
const ANC={meteor:AN.meteor,sweep:MN.line,pull:MN.vortex,devour:AN.devour,wall:MN.cage,spin_beam:MN.beam,lasers:MN.beam,lava:AN.lava,
 copy_first:AN.mirror,copy_second:AN.mirror,swap:AN.mirror,combo:AN.mirror,matrix:AN.mirror,split:AN.split,leap:MN.leap,saw:AN.saw,acid:MN.acid,
 tentacles:AN.tentacles,panic:AN.panic,collapse:MN.nuke,cross:MN.flurry,homing:AN.homing,spear:AN.spear,fissure:MN.fissure,map_arrow:AN.arrow,net:AN.net,nuclear:MN.nuke};
for(const [k,v] of Object.entries(ANC))T['ancient.'+k]=v;

// ---- rank bonus (skill tier 2/3) and distance/weight extras ----
const RANK={2:b(1319,.35,.03,.02),3:[...b(1319,.45,.035,.02),...b(1976,.5,.03,.06),o('sine',80,45,.25,.08)]};
const BLOCK_GROUP={sword:'blade',dagger:'blade',spear:'blade',axe:'heavy',hammer:'heavy',unarmed:'heavy',bow:'arrow',crossbow:'arrow',staff:'magic',tome:'magic',fire:'magic',ice:'magic',void:'magic'};
const LEGACY={cast:'skill',fire:'skill.fire',ice:'skill.ice',void:'skill.void',boss:'warn.mon',swim:'step.swim',attack:'swing.unarmed',charge:'skill'};
const PRIORITY=new Set(['death','level','phase','awaken','ancientDown','warn','roar','victory','ui']);
const UI=new Set(['ui','victory']);
const CHARGE={fire:R(.2,o('sawtooth',150,320,.35,.03,0,600),n('lowpass',500,1500,.8,.35,.04)),ice:R(.3,b(1600,.4,.03),o('sine',800,1400,.35,.03)),
 void:R(.3,o('sine',120,240,.4,.035),o('sine',123,247,.4,.03)),steel:R(.15,b(2000,.3,.025),n('highpass',4000,6000,.7,.2,.025)),
 nature:R(.15,n('bandpass',800,1500,1.5,.3,.03),o('sine',300,450,.3,.025)),earth:R(.1,o('sine',60,90,.35,.05),n('lowpass',400,700,.8,.3,.04))};
for(const [k,v] of Object.entries(CHARGE))T['charge.'+k]=v;
T.charge=CHARGE.steel;

window.GameEngine.Audio={
  enabled:true,volume:.3,voices:0,sources:0,last:new Map(),recipes:T,families:FAM,
  init(){
    if(this.bound)return;this.bound=true;
    try{this.enabled=localStorage.getItem('autobaro-sound')!=='off';this.volume=Number(localStorage.getItem('autobaro-volume')??.3);}catch{}
    this.volume=Math.max(0,Math.min(1,Number.isFinite(this.volume)?this.volume:.3));
    document.getElementById('sound-volume').value=Math.round(this.volume*100);this.refresh();
    const unlock=()=>this.unlock();window.addEventListener('pointerdown',unlock);window.addEventListener('keydown',unlock);
    document.addEventListener?.('visibilitychange',()=>this.sync());
  },
  async unlock(){
    if(!this.enabled)return;
    try{
      if(!this.ctx){
        const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;
        const ctx=this.ctx=new Context();this.master=ctx.createGain();
        const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-16;limiter.ratio.value=8;
        this.master.connect(limiter);limiter.connect(ctx.destination);
        this.sfx=ctx.createGain();this.ui=ctx.createGain();this.sfx.connect(this.master);this.ui.connect(this.master);
        // Shared echo "room": two feedback delays, reused by every recipe with rv>0.
        const fx=ctx.createGain(),wet=ctx.createGain();wet.gain.value=.55;
        for(const time of [.113,.171]){const d=ctx.createDelay(.5),fb=ctx.createGain(),lp=ctx.createBiquadFilter();d.delayTime.value=time;fb.gain.value=.34;lp.type='lowpass';lp.frequency.value=2600;fx.connect(d);d.connect(lp);lp.connect(fb);fb.connect(d);lp.connect(wet);}
        wet.connect(this.sfx);this.fx=fx;
        this.noise=ctx.createBuffer(1,Math.ceil(ctx.sampleRate),ctx.sampleRate);
        const data=this.noise.getChannelData(0);let s=8123;
        for(let i=0;i<data.length;i++){s=(Math.imul(s,1664525)+1013904223)>>>0;data[i]=s/2147483648-1;}
      }
      this.sync();if(this.ctx.state==='suspended')await this.ctx.resume();
    }catch{this.enabled=false;this.refresh();}
  },
  sync(){
    if(!this.master)return;const G=window.GameManager,t=this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.enabled&&!document.hidden?this.volume:0,t,.03);
    this.sfx?.gain.setTargetAtTime(G.isPaused||G.isGameOver?0:1,t,.03);
  },
  refresh(){const b=document.getElementById('btn-sound');b.innerText=this.enabled?'🔊 Âm thanh':'🔇 Âm thanh';b.setAttribute?.('aria-pressed',String(this.enabled));},
  toggle(){this.enabled=!this.enabled;this.save();this.refresh();this.sync();if(this.enabled)this.unlock().then(()=>this.play('ui',null,'on'));},
  setVolume(value){this.volume=Math.max(0,Math.min(1,Number(value)/100));this.save();this.sync();if(this.master)this.play('ui',null,'tick',{pi:.7+this.volume*.8});},
  save(){try{localStorage.setItem('autobaro-sound',this.enabled?'on':'off');localStorage.setItem('autobaro-volume',String(this.volume));}catch{}},
  fam(e){return FAM[e?.ancientKind]||FAM[e?.visual?.type]||'beast';},
  // Terrain under a point; MapTerrain is queried defensively so map changes cannot break audio.
  surface(x,y){
    const M=window.GameEngine.MapTerrain;
    try{
      if(M.ancientArena)return'stone';if(M.isInWater(x,y))return'swim';
      if(M.bridges?.some(by=>Math.abs(y-by)<28*M.scale&&Math.abs(x-M.riverX(by))<105*M.scale))return'bridge';
      if(M.isInBush(x,y))return'bush';if(M.inSettlement(x,y))return'stone';if(M.isOnCliff(x,y))return'rock';
    }catch{}
    return'grass';
  },
  // Recipe lookup: kind.style -> kind.element -> kind -> legacy alias. Returns [name, recipe] or null.
  find(kind,style,o){
    if(kind==='attack')kind='swing';
    if(kind==='block')style=BLOCK_GROUP[style]||style;
    for(const name of [style&&kind+'.'+style,o?.el&&kind+'.'+o.el,kind,LEGACY[kind]]){const r=name&&T[name];if(r)return[name,r];}
    return null;
  },
  attackRelease(e,a){return this.play(e.isMonster?'bite':'swing',e,e.isMonster?this.fam(e):a.style,{tier:e.tier});},
  // Cast start: telegraph warning for monsters/bosses, elemental charge for bots.
  castStart(e,skill,c,element){
    if(e.isMonster){
      if(e.tier>=3||e.isAncient)this.play('roar',e,this.fam(e),{tier:e.tier});
      return this.play('warn',e,e.ancientKind||'mon',{tier:e.tier});
    }
    return this.play('charge',e,element,{tier:skill.tier});
  },
  // Cast release: per-skill recipe (bot skill id or monster mode), per pulse for multi-hit skills.
  skill(e,skill,c){
    const id=c.monsterEffect?'m_'+c.monsterEffect:skill.id,pulse=c.isPulse?1+(c.pulseIndex||0):0;
    return this.play('skill',e,id,{tier:c.monsterEffect?0:skill.tier,el:c.element,vol:pulse?.8:1});
  },
  phase(m){this.play('phase',m,m.ancientKind);return this.play('roar',m,this.fam(m),{tier:5,vol:1.3});},
  awaken(m){this.play('awaken',m,m.ancientKind);return this.play('roar',m,this.fam(m),{tier:5,vol:1.3});},
  play(kind,e,style,o={}){
    const ctx=this.ctx,G=window.GameManager,ui=UI.has(kind);
    if(!ctx||!this.master||ctx.state!=='running'||!this.enabled||this.volume===0||document.hidden||(!ui&&(G.isPaused||G.isGameOver)))return false;
    const priority=PRIORITY.has(kind);if(this.voices>=(priority?20:16)||this.sources>(priority?84:64))return false;
    if(!style&&['death','roar','bite','grunt'].includes(kind))style=e?.isMonster?this.fam(e):kind==='death'?'pawn':'human';
    const found=this.find(kind,style,o);if(!found)return false;
    const [name,rec]=found,cam=window.GameEngine.Camera,dx=ui?0:(e?.x??cam.x)-cam.x,dy=ui?0:(e?.y??cam.y)-cam.y;
    const radius=Math.min(1100,Math.max(220,Math.max(cam.viewportWidth,cam.viewportHeight)/Math.max(.5,cam.zoom)*.65));
    const distance=Math.hypot(dx,dy);if(distance>radius)return false;
    const now=ctx.currentTime,key=(e?.id||'world')+':'+name,interval=kind==='step'||kind==='swim'?.28:kind==='hit'||kind==='grunt'?.06:.08;
    if(now-(this.last.get(key)??-100)<interval||now-(this.last.get('~'+name)??-100)<.02)return false;
    this.last.set(key,now);this.last.set('~'+name,now);if(this.last.size>800)this.last.clear();
    // Tier lowers pitch and adds weight for creature voices; rank adds a bright shimmer to skills.
    const tier=o.tier||0,heavy=o.heavy||(tier>=4&&(kind==='roar'||kind==='bite'||kind==='warn'));
    const pi=(o.pi||1)*(['roar','bite','grunt','death'].includes(kind)&&tier>1?1-.07*(tier-1):1);
    let layers=rec.L;
    if(kind==='skill'&&RANK[tier])layers=layers.concat(RANK[tier]);
    if(o.crit)layers=layers.concat(T.crit.L);
    if(o.heavy)layers=layers.concat(T.stomp.L);
    const amp=.55*(o.vol||1)*(1+(heavy?.15:0))*(1-distance/radius)**1.3;
    const env=ctx.createGain(),lp=ctx.createBiquadFilter(),pan=ctx.createStereoPanner(),bus=ui?this.ui:this.sfx||this.master;
    env.gain.value=amp;lp.type='lowpass';lp.frequency.value=16000-13500*distance/radius;pan.pan.value=Math.max(-1,Math.min(1,dx/radius));
    env.connect(lp);lp.connect(pan);pan.connect(bus);
    let send=null;if(rec.rv&&this.fx&&!ui){send=ctx.createGain();send.gain.value=rec.rv;pan.connect(send);send.connect(this.fx);}
    const jitter=1+(rnd()-.5)*.05;let left=layers.length;this.voices++;this.sources+=layers.length;
    for(const L of layers){
      const at=now+L.at,end=at+L.d,lg=ctx.createGain(),src=L.o?ctx.createOscillator():ctx.createBufferSource();let node=src,filter=null;
      lg.gain.setValueAtTime(.0001,at);lg.gain.linearRampToValueAtTime(L.g,at+Math.min(.012,L.d*.2));lg.gain.exponentialRampToValueAtTime(.0001,end);
      if(L.o){
        src.type=L.t;src.frequency.setValueAtTime(Math.min(18000,L.f0*pi*jitter),at);src.frequency.exponentialRampToValueAtTime(Math.min(18000,L.f1*pi*jitter),end);
        if(L.c){filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=L.c;src.connect(filter);node=filter;}
      }else{
        filter=ctx.createBiquadFilter();filter.type=L.f;filter.Q.value=L.q;filter.frequency.setValueAtTime(Math.min(18000,L.f0*pi),at);filter.frequency.exponentialRampToValueAtTime(Math.min(18000,L.f1*pi),end);
        src.buffer=this.noise;src.loop=L.d>.55;src.connect(filter);node=filter;
      }
      node.connect(lg);lg.connect(env);
      src.onended=()=>{this.sources--;lg.disconnect();filter?.disconnect();src.disconnect();if(--left===0){this.voices--;env.disconnect();lp.disconnect();pan.disconnect();send?.disconnect();}};
      if(L.o)src.start(at);else src.start(at,rnd()*.4);
      src.stop(end+.02);
    }
    if(kind==='hit'&&e?.isMonster&&o.big>.06)this.play('grunt',e,this.fam(e),{tier:e.tier});
    return true;
  },
  update(dt){
    this.sync();if(!this.ctx||!this.enabled)return;
    const cam=window.GameEngine.Camera;
    for(const e of [...window.GameManager.pawns,...window.GameManager.monsters]){
      if(!e.isAlive)continue;
      const previous=e.audioPosition;e.audioPosition={x:e.x,y:e.y};
      if(!previous||e.action||e.stunTimer>0||Math.abs(e.x-cam.x)>1100||Math.abs(e.y-cam.y)>1100)continue;
      const big=!!e.ancientKind||e.tier>=4;
      e.audioDistance=(e.audioDistance||0)+Math.hypot(e.x-previous.x,e.y-previous.y);
      if(e.audioDistance>(big?44:28)){e.audioDistance=0;this.play('step',e,this.surface(e.x,e.y),big?{vol:1.8,pi:.65,heavy:true}:undefined);}
    }
  }
};
})();
