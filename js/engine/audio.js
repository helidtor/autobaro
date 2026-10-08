window.GameEngine=window.GameEngine||{};
// Procedural Web Audio: no downloads, no dependency and no gameplay RNG consumption.
window.GameEngine.Audio={
  enabled:true,volume:.3,voices:0,last:new Map(),
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
        this.ctx=new Context();this.master=this.ctx.createGain();
        const limiter=this.ctx.createDynamicsCompressor();limiter.threshold.value=-16;limiter.ratio.value=8;
        this.master.connect(limiter);limiter.connect(this.ctx.destination);
        this.noise=this.ctx.createBuffer(1,Math.ceil(this.ctx.sampleRate*.5),this.ctx.sampleRate);
        const data=this.noise.getChannelData(0);let seed=8123;
        for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=seed/2147483648-1;}
      }
      this.sync();if(this.ctx.state==='suspended')await this.ctx.resume();
    }catch{this.enabled=false;this.refresh();}
  },
  sync(){if(this.master)this.master.gain.setTargetAtTime(this.enabled&&!document.hidden&&!window.GameManager.isPaused&&!window.GameManager.isGameOver?this.volume:0,this.ctx.currentTime,.03);},
  refresh(){const b=document.getElementById('btn-sound');b.innerText=this.enabled?'🔊 Âm thanh':'🔇 Âm thanh';b.setAttribute?.('aria-pressed',String(this.enabled));},
  toggle(){this.enabled=!this.enabled;this.save();this.refresh();this.sync();if(this.enabled)this.unlock();},
  setVolume(value){this.volume=Math.max(0,Math.min(1,Number(value)/100));this.save();this.sync();},
  save(){try{localStorage.setItem('autobaro-sound',this.enabled?'on':'off');localStorage.setItem('autobaro-volume',String(this.volume));}catch{}},
  play(kind,e,style){
    const ctx=this.ctx,G=window.GameManager;if(!ctx||ctx.state!=='running'||!this.enabled||this.volume===0||document.hidden||G.isPaused||G.isGameOver||this.voices>=16)return false;
    const cam=window.GameEngine.Camera,dx=(e?.x??cam.x)-cam.x,dy=(e?.y??cam.y)-cam.y;
    const radius=Math.min(1100,Math.max(220,Math.max(cam.viewportWidth,cam.viewportHeight)/Math.max(.5,cam.zoom)*.65));
    const distance=Math.hypot(dx,dy);if(distance>radius)return false;
    const now=ctx.currentTime,key=(e?.id||'world')+':'+kind;
    const interval=kind==='step'||kind==='swim'?.3:kind==='hit'?.07:.1;if(now-(this.last.get(key)??-100)<interval)return false;
    this.last.set(key,now);if(this.last.size>800)this.last.clear();
    const signatures={
      attack:[180,80,.13,.14,true],sword:[650,160,.15,.13,true],dagger:[920,240,.09,.1,true],spear:[420,100,.17,.12,true],
      axe:[180,45,.22,.19,true],hammer:[100,30,.25,.22,true],unarmed:[120,45,.1,.16,true],
      bow:[900,180,.1,.12,false],crossbow:[1200,280,.09,.12,true],staff:[480,140,.25,.12,false],tome:[520,180,.3,.1,false],
      cast:[240,680,.23,.08,false],fire:[220,65,.32,.18,true],ice:[1200,460,.3,.12,true],void:[150,600,.35,.1,false],
      hit:[130,45,.1,.16,true],block:[1900,650,.16,.12,false],dodge:[650,200,.17,.07,true],drink:[380,500,.2,.09,false],
      heal:[440,880,.35,.09,false],loot:[740,1120,.18,.09,false],level:[520,1040,.5,.11,false],death:[160,35,.4,.15,true],
      step:[85,45,.05,.035,true],swim:[250,70,.15,.05,true],boss:[80,220,.6,.16,false]
    };
    const spec=signatures[kind==='attack'?(style||'unarmed'):kind]||signatures.cast,[from,to,duration,volume,noise]=spec;
    const envelope=ctx.createGain(),pan=ctx.createStereoPanner();pan.pan.value=Math.max(-1,Math.min(1,dx/radius));
    envelope.connect(pan);pan.connect(this.master);
    envelope.gain.setValueAtTime(.0001,now);envelope.gain.exponentialRampToValueAtTime(Math.max(.0001,volume*(1-distance/radius)**1.3),now+.01);envelope.gain.exponentialRampToValueAtTime(.0001,now+duration);
    const osc=ctx.createOscillator();osc.type=['block','ice','loot','level'].includes(kind)?'triangle':'sine';osc.frequency.setValueAtTime(from,now);osc.frequency.exponentialRampToValueAtTime(to,now+duration);
    osc.connect(envelope);osc.start(now);osc.stop(now+duration);
    if(noise){const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter();source.buffer=this.noise;filter.type='bandpass';filter.frequency.value=kind==='step'?180:kind==='block'?2200:kind==='swim'?650:1200;filter.Q.value=.6;source.connect(filter);filter.connect(envelope);source.start(now);source.stop(now+Math.min(duration,.5));source.onended=()=>{source.disconnect();filter.disconnect();};}
    this.voices++;osc.onended=()=>{this.voices--;osc.disconnect();envelope.disconnect();pan.disconnect();};return true;
  },
  update(dt){
    this.sync();if(!this.ctx||!this.enabled)return;
    for(const e of [...window.GameManager.pawns,...window.GameManager.monsters]){
      if(!e.isAlive)continue;
      const previous=e.audioPosition;e.audioPosition={x:e.x,y:e.y};
      if(!previous||e.action||e.stunTimer>0)continue;
      e.audioDistance=(e.audioDistance||0)+Math.hypot(e.x-previous.x,e.y-previous.y);
      if(e.audioDistance>28){e.audioDistance=0;this.play(window.GameEngine.MapTerrain.isInWater(e.x,e.y)?'swim':'step',e);}
    }
  }
};
