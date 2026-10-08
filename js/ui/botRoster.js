window.GameUI = window.GameUI || {};
window.GameUI.BotRoster = {
  rows: [], pawns: null, elapsed: 0,
  init(){
    this.container=document.getElementById('bot-roster-rows');
    this.count=document.getElementById('bot-roster-count');
    this.search=document.getElementById('bot-search');
    this.pawns=null;this.elapsed=0;this.render();
  },
  toggle(id,button){
    const panel=document.getElementById(id),hidden=panel.classList.toggle('hidden');
    button.setAttribute('aria-expanded',String(!hidden));
    button.textContent=(hidden?'Hiện ':'Ẩn ')+(id==='bot-roster'?'danh sách bot':'log');
  },
  focus(id){
    const G=window.GameManager,p=G.pawns.find(p=>p.id===id);
    if(!p)return;
    G.selectedEntity=p;window.GameUI.InspectModal.inspect(p);
    const camera=window.GameEngine.Camera;
    camera.autoDirector=false;camera.targetEntity=p.isAlive?p:null;
    camera.x=camera.targetX=p.x;camera.y=camera.targetY=p.y;
    this.render();
  },
  update(dt){this.elapsed+=dt;if(this.elapsed>=.25){this.elapsed=0;this.render();}},
  render(){
    if(!this.container)return;
    const G=window.GameManager;
    if(this.pawns!==G.pawns){
      this.pawns=G.pawns;this.container.innerHTML='';
      this.rows=G.pawns.map(p=>{
        const row=document.createElement('tr'),name=document.createElement('td'),button=document.createElement('button');
        button.type='button';button.textContent=p.name;button.addEventListener('click',()=>this.focus(p.id));name.appendChild(button);row.appendChild(name);
        const cells=Array.from({length:3},()=>{const cell=document.createElement('td');row.appendChild(cell);return cell;});
        this.container.appendChild(row);return {p,row,button,cells};
      });
    }
    this.count.textContent=G.pawns.filter(p=>p.isAlive).length+'/'+G.pawns.length+' sống';
    const ordered=[...this.rows].sort((a,b)=>Number(b.p.isAlive)-Number(a.p.isAlive)||b.p.level-a.p.level);
    if(ordered.some((r,i)=>this.order?.[i]!==r)){
      const scroll=this.container.parentElement?.scrollTop||0,focused=document.activeElement;
      for(const {row} of ordered)this.container.appendChild(row);
      if(this.container.parentElement)this.container.parentElement.scrollTop=scroll;
      if(this.container.contains?.(focused))focused.focus({preventScroll:true});
      this.order=ordered;
    }
    for(const {p,row,button,cells} of this.rows){
      row.hidden=!!this.search?.value&&!p.name.toLocaleLowerCase('vi').includes(this.search.value.trim().toLocaleLowerCase('vi'));
      cells[0].classList.toggle('hp-critical',p.isAlive&&p.currentHp/p.maxHp<.3);
      row.classList.toggle('bot-dead',!p.isAlive);row.classList.toggle('bot-selected',G.selectedEntity===p);
      button.setAttribute?.('aria-pressed',String(G.selectedEntity===p));
      button.title=p.isAlive?'Focus '+p.name:p.name+' — đã tử trận';
      cells[0].textContent=Math.ceil(p.currentHp)+'/'+Math.round(p.maxHp);
      cells[1].textContent=p.level;
      cells[2].textContent=Math.floor(p.currentExp)+'/'+window.GameData.LevelTable.expForLevel(p.level+1);
    }
  }
};
