window.GameEntities = window.GameEntities || {};

window.GameEntities.CombatSystem = {
  potion: { id: 'health_potion', name: 'Bình Hồi Máu', tier: 'common', healPct: 0.35 },
  styles: {
    unarmed: { windup: 0.16, active: 0.09, recovery: 0.23 },
    sword: { windup: 0.22, active: 0.12, recovery: 0.28 },
    axe: { windup: 0.38, active: 0.14, recovery: 0.4 },
    hammer: { windup: 0.4, active: 0.14, recovery: 0.42 },
    spear: { windup: 0.22, active: 0.09, recovery: 0.25 },
    dagger: { windup: 0.14, active: 0.08, recovery: 0.22 },
    bow: { windup: 0.42, active: 0.07, recovery: 0.28 },
    crossbow: { windup: 0.28, active: 0.07, recovery: 0.36 },
    staff: { windup: 0.36, active: 0.12, recovery: 0.3 },
    tome: { windup: 0.4, active: 0.12, recovery: 0.32 }
  },

  makePassive(d) {
    if(typeof d==='string') d={name:d.split(' (')[0]};
    const type = d.reflectPercent ? 'reflect' : d.poisonDotPercent ? 'poison' : d.burnField ? 'burn' : d.ambushBonus ? 'ambush' : d.slowPercent ? 'slow' : d.lifeSteal || d.lowHpLifeStealBuff ? 'leech' : d.rootInterval ? 'root' : d.flatDamageReduction ? 'shell' : d.idleRegenPercent ? 'heal' : 'guard';
    const desc={reflect:'Phản 10% sát thương cận chiến (tối đa 8), hồi chiêu 8s.',poison:'Đòn trúng gây thêm 6 sát thương độc, hồi chiêu 8s.',burn:'Phản 6 sát thương lửa khi bị đánh cận chiến, hồi chiêu 8s.',ambush:'Đòn trúng tăng 20% sát thương khi xuất kích từ bụi, hồi chiêu 8s.',slow:'Đòn trúng làm chậm 15% trong 1s, hồi chiêu 8s.',leech:'Đòn trúng hút lại 15% sát thương thành máu, hồi chiêu 8s.',root:'Đòn trúng trói 0.4s, có miễn khống chế 3s, hồi chiêu 8s.',shell:'Giảm thêm tối đa 8 sát thương khi bị đánh, hồi chiêu 8s.',heal:'Khi bị đánh: hồi 4% máu trong 3s, hồi chiêu 12s.',guard:'Khi bị đánh: dựng thế phòng thủ chính diện 0.6s, hồi chiêu 12s.'}[type];
    return {...d,type,desc,cooldownTimer:0,cooldown:['heal','guard'].includes(type)?12:8};
  },
  triggerPassives(e,other,damage,incoming,c={}) {
    for(const p of e.passives || []){
      if(p.cooldownTimer>0)continue;
      if(incoming && ['reflect','burn'].includes(p.type)){
        if(Math.hypot(e.x-other.x,e.y-other.y)>65 || c.reflected)continue;
        p.cooldownTimer=p.cooldown;
        this.applyDamage(e,other,null,{baseDamage:p.type==='burn'?6:Math.min(8,damage*.1),reflected:true});
      } else if(incoming && p.type==='heal'){
        p.cooldownTimer=p.cooldown;e.healTimer=3;e.healPerSecond=e.maxHp*.04/3;
        window.GameRenderer.VfxManager.addEffect('heal',e.x,e.y,{radius:28,color:'#9fe6af',life:.7});
      } else if(incoming && p.type==='guard'){
        p.cooldownTimer=p.cooldown;e.guardTimer=.6;e.aimAngle=Math.atan2(other.y-e.y,other.x-e.x);
      } else if(!incoming && !c.reflected && ['poison','slow','root','leech'].includes(p.type)){
        p.cooldownTimer=p.cooldown;
        if(p.type==='poison')this.applyDamage(e,other,null,{baseDamage:6,reflected:true});
        if(p.type==='leech')e.currentHp=Math.min(e.maxHp,e.currentHp+damage*.15);
        if(p.type==='slow'){other.slowPct=.15;other.slowTimer=1;}
        if(p.type==='root' && !(other.controlImmunityTimer>0)){other.stunTimer=.4;other.controlImmunityTimer=3;}
      }
    }
  },

 groupMembers(e){
  const members=new Set([e]),G=window.GameManager,M=window.GameEngine.MapTerrain;
  const addGroup=g=>{
    if(!g)return;
    for(const p of g.members){
      if(!p.isAlive || !(p.combatLease>0)){g.members.delete(p);if(p.combatGroup===g)p.combatGroup=null;}
      else members.add(p);
    }
  };
  addGroup(e.combatGroup);
  // Nearby duels share a battle: starting a separate target pair cannot bypass the cap.
  for(const p of [...(G?.pawns||[]),...(G?.monsters||[])])
    if(p.isAlive&&p.combatLease>0&&Math.hypot(p.x-e.x,p.y-e.y)<120)addGroup(p.combatGroup);
  for(const p of [...members]){
    const ally=p.allyPawn;
    if(ally?.isAlive&&ally.allyPawn===p&&Math.hypot(p.x-ally.x,p.y-ally.y)<240&&!M.isInWater(ally.x,ally.y))members.add(ally);
  }
  return [...members];
 },
 canJoin(a,t){
  const members=new Set([...this.groupMembers(a),...this.groupMembers(t),a,t]);
  if(members.size<=3)return true;
  return members.size===4 && [...members].every(p=>p.allyPawn?.isAlive&&members.has(p.allyPawn)&&p.allyPawn.allyPawn===p);
 },
 reserveCombat(a,t){
  if(!this.canJoin(a,t))return false;
  const members=new Set([...this.groupMembers(a),...this.groupMembers(t),a,t]),g={members};
  for(const p of members){p.combatGroup=g;if(!(p.combatLease>0))p.combatLease=6;}
  a.combatLease=t.combatLease=6;
  return true;
 },
 canEngage(a,t){
  const M=window.GameEngine.MapTerrain;
  return this.isEnemy(a,t) && !M.isInWater(a.x,a.y) && !M.isInWater(t.x,t.y) && this.canJoin(a,t) && M.segmentClear(a.x,a.y,t.x,t.y,false,0);
 },
 grantLevel(p){
  if(p.level>=15)return false;
  p.currentExp=Math.max(p.currentExp,window.GameData.LevelTable.expRequirements[p.level]);
  this.checkLevelUp(p);return true;
 },
 rewardBotKill(killer,victim){
  if(!killer?.isPawn || killer.isPlayerControlled || !victim.isPawn)return false;
  if(killer.level<15 && Math.random()<.5){this.grantLevel(killer);return true;}
  const D=window.GameData.Equipments,tiers=['common','rare','super_rare','supreme','god'];
  const rank=Math.max(0,...[victim.weapon,victim.armor,victim.helmet].filter(Boolean).map(e=>tiers.indexOf(e.tier)));
  const tier=tiers[Math.min(4,rank+(Math.random()<.2?1:0))];
  const pool=[...Object.values(D.weapons),...Object.values(D.armors)].filter(e=>e.tier===tier);
  const item=pool[Math.floor(Math.random()*pool.length)];
  if(item)window.GameManager.spawnDropItem(victim.x,victim.y,item,item.slot||'weapon');
  return true;
 },

  canAttack(e) {
    return !!e?.isAlive && !e.action && !(e.stunTimer > 0) && !(e.pacifyTimer > 0) &&
      !window.GameEngine.MapTerrain.isInWater(e.x, e.y);
  },
  isEnemy(a, t) {
    return !!t?.isAlive && !(a?.isMonster && t.isMonster) && t !== a && t !== a?.allyPawn && t.allyPawn !== a && (t.isPawn || t.isMonster);
  },
  weaponStyle(e) {
    if (e.weapon) return this.styles[e.weapon.type] ? e.weapon.type : 'sword';
    if (!e.isMonster) return 'unarmed';
    if (['golem', 'titan_ape', 'demon_lord'].includes(e.visual?.type)) return 'hammer';
    if (e.visual?.type === 'centaur') return 'spear';
    return e.tier >= 4 ? 'staff' : 'unarmed';
  },
  startAction(e, kind, target, resolve, options = {}) {
    if (e.action || !e.isAlive) return false;
    if (target && ['attack','skill'].includes(kind) && (!this.canEngage(e,target)||!this.reserveCombat(e,target))) return false;
    const style = options.style || this.weaponStyle(e), timing = this.styles[style];
    const windup = options.windup ?? timing.windup;
    const duration = windup + (options.active ?? timing.active) + (options.recovery ?? timing.recovery);
    const angle = target ? Math.atan2(target.y - e.y, target.x - e.x) : e.aimAngle || 0;
    e.action = { kind, style, elapsed: 0, windup, duration, angle, target,
      targetX: target?.x ?? e.x, targetY: target?.y ?? e.y, originX: e.x, originY: e.y,
      released: false, resolve, ...options };
    e.aimAngle = angle;
    e.attackState = { isAttacking: true, progress: 0 };
    e.vx = e.vy = 0;
    return true;
  },
  executeAttack(a, target) {
    if (!this.canAttack(a) || a.attackCooldown > 0 || !this.isEnemy(a, target)) return false;
    const style = this.weaponStyle(a), ranged = ['bow', 'crossbow', 'staff', 'tome'].includes(style);
    const range = a.weapon?.range || (ranged ? 130 : 38);
    if (Math.hypot(target.x - a.x, target.y - a.y) > range + 8) return false;
    const ok = this.startAction(a, 'attack', target, () => {
      if (!this.isEnemy(a, target)) return;
      if (ranged) this.launchProjectile(a, target, a.weapon, {}, ['staff', 'tome'].includes(style) ? '#bba3ff' : '#ffde9a');
      else if (Math.hypot(target.x - a.x, target.y - a.y) <= range + 18) {
        this.applyDamage(a, target, a.weapon);
        window.GameRenderer.VfxManager.addEffect('slash', a.x, a.y, { angle: a.aimAngle, radius: range, color: '#ffe9b1', life: 0.25 });
      }
    }, { style });
    if (ok) a.attackCooldown = Math.max(0.7, 1 / ((a.weapon?.speed || 0.9) * (a.isBerserk ? 1.25 : 1)));
    return ok;
  },
  getSkillConfig(e, skill) {
    const d = skill.def;
    const c = { ...d, ...d.t1, ...(skill.tier >= 2 ? d.t2 : {}), ...(skill.tier >= 3 ? d.t3 : {}) };
    const power = (e.attack || 16) + Math.min(65, e.weapon?.attack || e.weapon?.magicPower || 0);
    c.cooldown = Math.max(e.isMonster ? 7 : 6, c.cooldown || 10);
    c.damage = Math.min(power * 2.1, c.baseDamage || c.magicDamage || c.nukeDamage || power * (c.dmgMultiplier || c.dmgPct || 1.3));
    if (c.hits || c.arrows || c.tickDmg) c.damage = Math.min(power*2.1,c.damage*1.15);
    c.radius = Math.min(100, c.radius || 50);
    c.range = Math.min(240, Math.max(c.range || 100, c.radius));
    c.stun = Math.min(e.isMonster ? 0.7 : 0.9, c.stunDur || c.freezeDuration || 0);
    c.slow = Math.min(0.45, c.slowPct || c.slow || 0);
    return c;
  },
  makeMonsterSkill(d, tier, index) {
    const type = d.type || '';
    const shape = /line|breath|beam|pierce|crack|charge/.test(type) ? 'line' : /fan|sweep|wave|gale|roar/.test(type) ? 'cone' : 'circle';
    const element = /fire|flam|solar|magma|heat|meteor|nuke/.test(type) ? 'fire' : /poison|acid|root|thorn|spore/.test(type) ? 'nature' : /freeze|ice|storm/.test(type) ? 'ice' : /void|dark|death|soul|ghost|judgment/.test(type) ? 'void' : 'earth';
    return { id: d.id, tier: 1, cooldownTimer: 2 + index * 1.4, def: {
      ...d, type: 'monster_skill', cooldown: Math.max(tier === 5 ? 11 + index * 2 : 7, d.cooldown || 11 + index * 2),
      element, shape, range: Math.min(220, d.length || d.lineDistance || 165), radius: Math.min(95, d.radius || 65),
      t1: { stunDur: Math.min(0.7, d.stunDuration || d.rootDuration || d.lockDuration || d.duration || 0),
        slowPct: Math.min(0.4, d.slowPercent || 0), desc: 'Báo vùng nguy hiểm trước khi ra đòn.' }
    }};
  },
  castSkill(e, skill, target) {
    if (!this.canAttack(e) || !skill?.def || skill.cooldownTimer > 0 || e.silenceTimer > 0) return false;
    const c = this.getSkillConfig(e, skill), type = c.type;
    const utility = ['teleport', 'speed_buff', 'ethereal_speed', 'stealth', 'smoke_cloud', 'weapon_swap', 'weapon_buff', 'self_heal', 'aura_heal', 'shield_stance', 'counter_stance', 'mana_shield_toggle', 'stasis'].includes(type);
    if (!utility && (!this.isEnemy(e, target) || Math.hypot(target.x - e.x, target.y - e.y) > c.range)) return false;
    if (['self_heal', 'aura_heal'].includes(type) && e.currentHp >= e.maxHp * 0.85) return false;
    if (type === 'weapon_swap' && !e.secondaryWeapon) return false;
    const mana = (c.manaCost || 0) + (c.extraManaPct || 0) * e.maxMana;
    const stamina = (c.staminaCost || 0) + (c.extraStaminaPct || 0) * e.maxStamina;
    if (e.currentMana < mana || e.currentStamina < stamina) return false;
    const element = c.element || (/fire|meteor/.test(skill.id) ? 'fire' : /frost|ice/.test(skill.id) ? 'ice' : e.classId === 'mage' ? 'void' : 'steel');
    const color = { fire: '#ff9b48', ice: '#8be6ff', nature: '#a9e76c', void: '#bd9cff', earth: '#ebc892', steel: '#ffe4a3' }[element];
    const area = /aoe|slam|barrage|whirlwind|vortex|nuke|monster_skill/.test(type);
    const projectile = /projectile|arrows|snipe|bolt/.test(type);
    const angle = target ? Math.atan2(target.y - e.y, target.x - e.x) : e.aimAngle || 0;
    const tx = target?.x ?? e.x, ty = target?.y ?? e.y;
    const windup = utility ? 0.28 : e.isMonster ? 0.85 : projectile ? 0.45 : 0.38;
    const hit = victim => {
      const damage = this.applyDamage(e, victim, e.weapon, { baseDamage: c.damage, skill: true });
      if (!damage) return;
      if (!victim.isAlive || victim.invincible || victim.isBerserk || victim.weapon?.ccImmunity) return;
      if (c.stun && !(victim.controlImmunityTimer > 0)) { victim.stunTimer = c.stun; victim.controlImmunityTimer = 3; }
      if (c.slow) { victim.slowPct = c.slow; victim.slowTimer = Math.min(2, c.slowDur || 2); }
      if (c.silenceDur) victim.silenceTimer = Math.min(1.5, c.silenceDur);
    };
    const ok = this.startAction(e, 'skill', utility ? null : target, () => {
      const V = window.GameRenderer.VfxManager;
      if (['teleport', 'teleport_backstab', 'backstep_shot', 'linear_dash', 'dash_stun'].includes(type)) {
        const distance = type === 'backstep_shot' ? -(c.backstep || 45) : Math.min(85, c.distance || c.range * 0.5);
        window.GameEngine.MapTerrain.moveEntity(e,Math.cos(angle)*distance,Math.sin(angle)*distance);
        V.addEffect('dash', e.action.originX, e.action.originY, { tx: e.x, ty: e.y, color, life: 0.45 });
      }
      if (['self_heal', 'aura_heal'].includes(type)) {
        e.healPerSecond = Math.min(e.maxHp * 0.04, c.hotTick || e.maxHp * 0.03);
        e.healTimer = Math.min(4, c.duration || 3);
        if (type === 'self_heal') e.currentHp = Math.min(e.maxHp, e.currentHp + e.maxHp * Math.min(0.2, c.instantHealPct || c.lowHpHealPct || 0.15));
        V.addEffect('heal', e.x, e.y, { radius: 40, color: '#86efb5', life: 0.9 });
      } else if (['speed_buff', 'ethereal_speed', 'stealth', 'smoke_cloud'].includes(type)) {
        e.speedBuff = Math.min(0.5, c.speedBuff || 0.25);
        e.speedBuffTimer = Math.min(3.5, c.duration || c.stealthDur || 3);
        if (c.waterWalk) e.waterWalkTimer = e.speedBuffTimer;
        if (c.pacify) e.pacifyTimer = e.speedBuffTimer;
        if (['stealth', 'smoke_cloud'].includes(type)) e.stealthTimer = e.speedBuffTimer;
        V.addEffect(type === 'smoke_cloud' ? 'smoke' : 'rune', e.x, e.y, { radius: 40, color, life: 0.8 });
      } else if (['weapon_buff', 'weapon_swap'].includes(type)) {
        if (type === 'weapon_swap') [e.weapon, e.secondaryWeapon] = [e.secondaryWeapon, e.weapon];
        e.magicOnHit = Math.min(18, c.magicOnHit || 8);
        e.weaponBuffTimer = 4;
        V.addEffect('rune', e.x, e.y, { radius: 28, color, life: 0.6 });
      } else if (['shield_stance', 'counter_stance', 'mana_shield_toggle', 'stasis'].includes(type)) {
        e.guardTimer = Math.min(1.5, c.duration || c.window || 1.2);
        V.addEffect('guard', e.x, e.y, { radius: 28, color: '#8be6ff', life: 0.8 });
      } else if (!utility) {
        if (projectile && !area) this.launchProjectile(e, target, { type: element === 'fire' ? 'fireball' : projectile && e.classId==='archer' ? 'arrow' : 'magic' }, { baseDamage: c.damage, skill: true, onImpact: victim => {
          if (type === 'projectile_explosion') {
            window.GameManager.spatialGrid.queryCircle(victim.x,victim.y,c.radius).filter(v=>this.isEnemy(e,v)).forEach(hit);
            V.addEffect(element==='fire'?'flame':'impact',victim.x,victim.y,{radius:c.radius,color,life:.6});
          } else hit(victim);
        } }, color);
        else {
          const directed = ['line', 'cone'].includes(c.shape) || type === 'cone_slash';
          const victims = window.GameManager.spatialGrid.queryCircle(directed || !area ? e.action.originX : tx, directed || !area ? e.action.originY : ty, directed || !area ? c.range : c.radius).filter(v => this.isEnemy(e, v));
          for (const v of victims) {
            const dx = v.x - e.action.originX, dy = v.y - e.action.originY;
            const delta = Math.atan2(Math.sin(Math.atan2(dy, dx) - angle), Math.cos(Math.atan2(dy, dx) - angle));
            if (c.shape === 'line' && (Math.abs(-Math.sin(angle) * dx + Math.cos(angle) * dy) > 25 || Math.cos(angle) * dx + Math.sin(angle) * dy < 0)) continue;
            if ((c.shape === 'cone' || type === 'cone_slash') && Math.abs(delta) > 0.75) continue;
            if (!area && !c.shape && v !== target) continue;
            hit(v);
          }
          V.addEffect(area ? element === 'fire' ? 'flame' : element === 'ice' ? 'frost' : 'impact' : 'slash', directed ? e.action.originX : tx, directed ? e.action.originY : ty, { radius: c.radius, angle, color, shape: c.shape, length:c.range, life: 0.7 });
        }
        if (element === 'fire') window.GameEngine.MapTerrain.bushes.forEach(b => { if (Math.hypot(b.x - tx, b.y - ty) < c.radius) b.isBurned = true; });
      }
    }, { style: this.weaponStyle(e), windup, recovery: 0.35, color, skillName: c.name });
    if (!ok) return false;
    e.currentMana -= mana; e.currentStamina -= stamina;
    skill.cooldownTimer = c.cooldown; e.attackCooldown = windup + 0.35;
    e.skillsCast = (e.skillsCast || 0) + 1;
    if (!utility && area) window.GameRenderer.VfxManager.addEffect('telegraph', ['line','cone'].includes(c.shape) ? e.x : tx, ['line','cone'].includes(c.shape) ? e.y : ty, { radius: c.radius, angle, shape: c.shape || 'circle', length: c.range, color, life: windup, label: c.name });
    else window.GameRenderer.VfxManager.addEffect('rune', e.x, e.y, { radius: 24, color, life: windup });
    return true;
  },
  launchProjectile(source, target, weapon, config, color) {
    if (!this.isEnemy(source, target)) return;
    window.GameRenderer.VfxManager.addProjectile(source, source.action?.targetX ?? target.x, source.action?.targetY ?? target.y, 330, { ...weapon, color }, (x, y) => {
      if (!target.isAlive) return true;
      if (Math.hypot(x - target.x, y - target.y) < 22) {
        if (config.onImpact) config.onImpact(target);
        else this.applyDamage(source, target, weapon, config);
        window.GameRenderer.VfxManager.addEffect('impact', x, y, { radius: 24, color, life: 0.3 });
        return true;
      }
      return false;
    });
  },
  defend(e, kind = 'block', angle = e.aimAngle || 0) {
    if (!e?.isAlive || window.GameEngine.MapTerrain.isInWater(e.x,e.y) || e.action || e.stunTimer > 0 || e.defenseCooldown > 0 || e.currentStamina < 18) return false;
    e.currentStamina -= 18; e.defenseCooldown = kind === 'dodge' ? 2.8 : 2.2; e.aimAngle = angle;
    return this.startAction(e, kind, null, () => {}, { style: this.weaponStyle(e), angle, windup: 0, active: 0.3, recovery: 0.22,
      dodgeX: Math.cos(angle) * 58, dodgeY: Math.sin(angle) * 58 });
  },
  tryReaction(e, threats) {
    if (e.action || e.defenseCooldown > 0 || e.currentStamina < 18) return false;
    const threat = threats.find(t => {
      const a=t.action;
      return a && !a.released && (a.target===e || (a.kind==='skill' && Math.hypot(e.x-a.targetX,e.y-a.targetY)<70)) && a.elapsed>a.windup*.35;
    });
    if (!threat || Math.random() > (e.confidence > 85 ? 0.18 : 0.4)) return false;
    const angle = Math.atan2(threat.y - e.y, threat.x - e.x);
    const dodge = ['archer', 'assassin'].includes(e.classId) || e.trait === 'coward';
    e.thought = dodge ? 'Thấy đối thủ lấy đà — né sang sườn!' : 'Đọc đòn, nâng vũ khí đỡ chính diện.';
    e.objective = dodge ? 'Né đòn' : 'Đỡ đòn';
    return this.defend(e, dodge ? 'dodge' : 'block', dodge ? angle + Math.PI / 2 : angle);
  },
  usePotion(e) {
    if (!e?.isAlive || window.GameEngine.MapTerrain.isInWater(e.x,e.y) || e.action || !e.healthPotions || e.potionCooldown > 0 || e.currentHp >= e.maxHp) return false;
    e.healthPotions--; e.potionCooldown = 8;
    return this.startAction(e, 'drink', null, () => {
      const hp = Math.min(220, e.maxHp * 0.35);
      e.currentHp = Math.min(e.maxHp, e.currentHp + hp);
      window.GameRenderer.VfxManager.addEffect('heal', e.x, e.y, { radius: 35, color: '#86efb5', life: 0.8 });
      window.GameRenderer.VfxManager.addDamageNumber(e.x, e.y - 20, '+' + Math.round(hp), 'heal');
    }, { windup: 0.65, active: 0.1, recovery: 0.15, style: 'unarmed' });
  },
  updateStatus(e, dt) {
    for (const k of ['combatLease', 'stunTimer', 'slowTimer', 'silenceTimer', 'speedBuffTimer', 'waterWalkTimer', 'pacifyTimer', 'weaponBuffTimer', 'stealthTimer', 'guardTimer', 'controlImmunityTimer', 'defenseCooldown', 'potionCooldown', 'attackCooldown', 'hitFlashTimer']) e[k] = Math.max(0, (e[k] || 0) - dt);
    for (const p of e.passives || []) p.cooldownTimer=Math.max(0,(p.cooldownTimer||0)-dt);
    for (const s of e.skills || []) s.cooldownTimer = Math.max(0, (s.cooldownTimer || 0) - dt);
    if (e.healTimer > 0) { const time = Math.min(dt, e.healTimer); e.currentHp = Math.min(e.maxHp, e.currentHp + e.healPerSecond * time); e.healTimer -= time; }
    const a = e.action;
    if (!a) return;
    if (['attack','skill'].includes(a.kind)&&window.GameEngine.MapTerrain.isInWater(e.x,e.y)) {e.action=null;e.attackState=null;return;}
    if (e.stunTimer > 0 && !e.isBerserk) { e.action = null; e.attackState = null; return; }
    a.elapsed += dt; e.attackState.progress = Math.min(1, a.elapsed / a.duration);
    if (a.kind === 'dodge') {
      const p = Math.min(1, a.elapsed / 0.3), ease = 1 - (1 - p) ** 2;
      window.GameEngine.MapTerrain.moveEntity(e,a.originX+a.dodgeX*ease-e.x,a.originY+a.dodgeY*ease-e.y);
    }
    if (!a.released && a.elapsed >= a.windup) { a.released = true; a.resolve(); }
    if (a.elapsed >= a.duration) { e.action = null; e.attackState = null; }
  },
  applyDamage(a, t, weapon, c = {}) {
    if (!a || !this.canEngage(a,t) || t.invincible || !this.reserveCombat(a,t)) return 0;
    if (t.action?.kind === 'dodge' && t.action.elapsed < 0.3) { window.GameRenderer.VfxManager.addDamageNumber(t.x, t.y - 15, 'NÉ', 'block'); return 0; }
    let raw = c.baseDamage ?? ((a.attack || 16) + Math.min(65, weapon?.attack || weapon?.magicPower || 0));
    if (a.weaponBuffTimer > 0) raw += a.magicOnHit || 0;
    if (a.currentHp < a.maxHp * 0.25) raw *= 1 + (window.GameData.Traits[a.trait]?.lowHpDamageBonus || 0);
    const crit = Math.random() < Math.min(0.35, (a.critChance || 0.05) + (weapon?.critChance || 0));
    if (crit) raw *= 1.35;
    const ambush=(a.passives||[]).find(p=>p.type==='ambush'&&p.cooldownTimer<=0);
    if(ambush&&window.GameEngine.MapTerrain.isInBush(a.x,a.y)){raw*=1.2;ambush.cooldownTimer=ambush.cooldown;}
    const armor = (t.defense || 0) + (t.armor?.defense || 0) + (t.helmet?.defense || 0) + (t.weapon?.defense || 0);
    let damage = raw * 100 / (100 + armor);
    if (t.action?.kind === 'block' || t.guardTimer > 0) {
      const incoming = Math.atan2(a.y - t.y, a.x - t.x);
      if (Math.cos(incoming - (t.action?.angle ?? t.aimAngle)) > 0.25) {
        damage *= 0.3;
        window.GameRenderer.VfxManager.addEffect('guard', t.x, t.y, { angle: incoming, radius: 30, color: '#8be6ff', life: 0.3 });
        window.GameRenderer.VfxManager.addDamageNumber(t.x, t.y - 20, 'ĐỠ', 'block');
      }
    }
    const shell=(t.passives||[]).find(p=>p.type==='shell'&&p.cooldownTimer<=0);
    if(shell){damage-=Math.min(8,damage*.25);shell.cooldownTimer=shell.cooldown;}
    damage = Math.max(1, Math.round(damage)); t.currentHp = Math.max(0, t.currentHp - damage);
    t.hitFlashTimer = 0.13; t.stealthTimer = 0; a.stealthTimer = 0;
    if (a.isBerserk) a.currentHp = Math.min(a.maxHp, a.currentHp + damage * 0.15);
    window.GameRenderer.VfxManager.addDamageNumber(t.x, t.y, damage, crit ? 'crit' : 'normal');
    window.GameRenderer.VfxManager.addEffect('hit', t.x, t.y - 15, { angle: a.aimAngle || 0, radius: 15, color: crit ? '#ffb38d' : '#fff2d6', life: 0.2 });
    if (t.isPawn) window.GameAI.EmotionEngine.onDamageTaken(t, damage, a);
    if (t.currentHp <= 0) this.handleDeath(a, t);
    if(a.isAlive && t.isAlive) {this.triggerPassives(a,t,damage,false,c);this.triggerPassives(t,a,damage,true,c);}
    return damage;
  },
  handleDeath(killer, victim) {
    if (!victim?.isAlive) return;
    if (victim.armor?.reviveOnce && !victim.hasRevived) { victim.hasRevived = true; victim.currentHp = victim.maxHp * 0.2; return; }
    victim.isAlive = false; victim.action = null;
    window.GameRenderer.VfxManager.addBurstParticles(victim.x, victim.y, '#d8c4a3', 12);
    if (killer?.isPawn) { if(!this.rewardBotKill(killer,victim)){killer.currentExp += victim.expReward || (victim.level || 1) * 60; this.checkLevelUp(killer);} killer.killCount = (killer.killCount || 0) + 1; window.GameAI.EmotionEngine.onKillOrLoot(killer, victim.dropTier || 'rare'); }
    this.dropLootOnDeath(victim);
    window.GameUI.CombatTicker.log('💀 ' + victim.name + ' bị hạ bởi ' + (killer?.name || 'Vòng Bo Độc') + '.');
  },
  checkLevelUp(p) {
    const table = window.GameData.LevelTable.expRequirements;
    while (p.level < 15 && p.currentExp >= table[p.level]) {
      p.level++; p.unspentSkillPoints++; p.maxHp += 24; p.currentHp = p.maxHp; p.attack += 3; p.defense += 2;
      window.GameRenderer.VfxManager.addEffect('heal', p.x, p.y, { radius: 36, color: '#ffe5a4', life: 0.8 });
      window.GameUI.CombatTicker.log('⭐ ' + p.name + ' lên cấp ' + p.level + ', hồi đầy máu.');
    }
  },
  dropLootOnDeath(v) {
    if (!v.isMonster) return;
    if (Math.random() >= [0, 0.2, 0.3, 0.4, 1, 1][v.tier]) return;
    const G = window.GameManager, D = window.GameData.Equipments;
    if (v.tier >= 4) G.spawnDropItem(v.x - 14, v.y, this.potion, 'potion');
    else if (Math.random() < 0.45) { G.spawnDropItem(v.x, v.y, this.potion, 'potion'); return; }
    const artifact = v.tier === 5 ? D.weapons[v.godArtifactId] : null;
    const pool = [...Object.values(D.weapons), ...Object.values(D.armors)].filter(e => e.tier === v.dropTier);
    const equipment = artifact || pool[Math.floor(Math.random() * pool.length)];
    if (equipment) G.spawnDropItem(v.x + (v.tier >= 4 ? 14 : 0), v.y, equipment, equipment.slot || 'weapon');
  }
};
