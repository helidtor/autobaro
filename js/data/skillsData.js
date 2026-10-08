window.GameData = window.GameData || {};
// Three ranks share a bounded damage budget; all weapon styles may learn every active.
function botSkill(id,name,type,role,cooldown,range,resource,cost,ranks,extra={}){
  const skill={id,name,type,role,cooldown,range,...extra};
  ranks.forEach((rank,i)=>{
    const details=[];
    if(rank.dmgMultiplier)details.push(Math.round(rank.dmgMultiplier*100)+'% ATK tổng');
    if(rank.pulses)details.push(rank.pulses+' đợt, chia đều sát thương');
    if(rank.stunDur)details.push('Choáng '+rank.stunDur+'s');
    if(rank.slowPct)details.push('Chậm '+Math.round(rank.slowPct*100)+'%');
    if(rank.armorBreak)details.push('Phá '+Math.round(rank.armorBreak*100)+'% giáp trong 3s');
    if(rank.instantHealPct||rank.hotPct)details.push('Hồi '+Math.round((rank.instantHealPct||0)*100)+'% ngay + '+Math.round((rank.hotPct||0)*100)+'% trong 3s');
    if(rank.guardReduction)details.push('Giảm '+Math.round(rank.guardReduction*100)+'% sát thương chính diện');
    if(rank.speedBuff)details.push('Tăng tốc '+Math.round(rank.speedBuff*100)+'%');
    if(rank.distance||rank.backstep)details.push('Dịch chuyển '+(rank.distance||rank.backstep)+'px');
    if(rank.duration||rank.window)details.push('Duy trì '+(rank.duration||rank.window)+'s');
    skill['t'+(i+1)]={...rank,cooldown:Math.max(6,cooldown-i*.5),[resource+'Cost']:cost+i*2,desc:details.join(' • ')+(extra.note?' • '+extra.note:'')};
  });return skill;
}
window.GameData.Skills = {
warrior:{name:'Cận chiến',actives:[
botSkill('w_thunder_slash','Chém Sấm Sét','cone_slash','strike',8,60,'stamina',15,[{dmgMultiplier:1.05,slowPct:.1},{dmgMultiplier:1.2,slowPct:.15},{dmgMultiplier:1.35,slowPct:.25}]),
botSkill('w_shield_bash','Khiên Chắn Cương Bộc','dash_stun','control',10,95,'stamina',20,[{dmgMultiplier:.7,stunDur:.35,distance:50},{dmgMultiplier:.85,stunDur:.55,distance:60},{dmgMultiplier:1,stunDur:.7,distance:70}]),
botSkill('w_whirlwind','Lốc Kiếm','whirlwind_aoe','strike',12,75,'stamina',24,[{dmgMultiplier:1.3,pulses:3,radius:55},{dmgMultiplier:1.5,pulses:3,radius:65},{dmgMultiplier:1.7,pulses:3,radius:75}],{note:'Quét quanh người; địch có thể thoát vùng'}),
botSkill('w_crushing_charge','Xung Phong Phá Trận','linear_dash','strike',11,110,'stamina',22,[{dmgMultiplier:1.1,distance:55,knockback:20},{dmgMultiplier:1.25,distance:65,knockback:30},{dmgMultiplier:1.4,distance:75,knockback:40}]),
botSkill('w_second_wind','Hơi Thở Thứ Hai','self_heal','heal',22,0,'stamina',20,[{instantHealPct:.08,hotPct:.03},{instantHealPct:.11,hotPct:.04},{instantHealPct:.14,hotPct:.05}]),
botSkill('w_execution_cleave','Bổ Kết Liễu','finisher_slam','finisher',14,65,'stamina',24,[{dmgMultiplier:1.2,executeBonus:.2},{dmgMultiplier:1.4,executeBonus:.3},{dmgMultiplier:1.6,executeBonus:.4}],{note:'Bonus chỉ khi mục tiêu dưới 30% HP'}),
botSkill('w_earthquake_stomp','Địa Chấn','ground_slam','control',11,70,'stamina',20,[{dmgMultiplier:.7,slowPct:.25,radius:55},{dmgMultiplier:.85,slowPct:.3,radius:65},{dmgMultiplier:1,slowPct:.35,radius:70,breakGuard:true}],{selfArea:true}),
botSkill('w_iron_wall','Bức Tường Sắt','shield_stance','defense',16,0,'stamina',18,[{guardReduction:.4,duration:1},{guardReduction:.5,duration:1.3},{guardReduction:.6,duration:1.6}]),
botSkill('w_armor_piercer','Đâm Xuyên Giáp','thrust_pierce','strike',9,80,'stamina',18,[{dmgMultiplier:1,armorBreak:.15},{dmgMultiplier:1.15,armorBreak:.2},{dmgMultiplier:1.3,armorBreak:.25}]),
botSkill('w_riposte','Phản Kiếm','counter_stance','defense',13,0,'stamina',18,[{window:.6,counterMultiplier:.6,guardReduction:.4},{window:.8,counterMultiplier:.8,guardReduction:.5},{window:1,counterMultiplier:1,guardReduction:.6}],{note:'Phản 1 đòn chính diện; không phản sát thương phản lại'})
]},
mage:{name:'Phép thuật',actives:[
botSkill('m_fireball','Hỏa Cầu','projectile_explosion','strike',10,190,'mana',18,[{dmgMultiplier:1,radius:32},{dmgMultiplier:1.15,radius:42,dotFraction:.08,dotKind:'burn'},{dmgMultiplier:1.3,radius:52,dotFraction:.1,dotKind:'burn'}],{element:'fire',magic:true}),
botSkill('m_frost_bolt','Băng Tiễn','projectile_slow','control',9,190,'mana',16,[{dmgMultiplier:.8,slowPct:.15},{dmgMultiplier:1,slowPct:.25},{dmgMultiplier:1.1,slowPct:.3,conditionalFreeze:.45}],{element:'ice',magic:true}),
botSkill('m_blink','Thiểm Di','teleport','mobility',12,0,'mana',18,[{distance:65},{distance:80},{distance:95,afterimage:true}],{note:'Dừng trước tường; bậc 3 để lại ảnh nổ 60% ATK'}),
botSkill('m_gravity_vortex','Vòng Xoáy Trọng Lực','vortex_pull','control',14,150,'mana',24,[{dmgMultiplier:.8,radius:50,pull:30},{dmgMultiplier:1,radius:60,pull:40},{dmgMultiplier:1.15,radius:70,pull:50,slowPct:.2}],{element:'void',magic:true}),
botSkill('m_mana_shield','Khiên Năng Lượng','mana_shield_toggle','defense',17,0,'mana',12,[{manaAbsorb:.3,duration:2},{manaAbsorb:.4,duration:2},{manaAbsorb:.5,duration:2}],{note:'Hấp thụ sát thương bằng mana còn lại, không miễn nhiễm'}),
botSkill('m_meteor_strike','Thiên Thạch','ground_nuke','strike',18,180,'mana',30,[{dmgMultiplier:1.4,radius:60},{dmgMultiplier:1.6,radius:70},{dmgMultiplier:1.85,radius:80}],{element:'fire',magic:true,windup:1}),
botSkill('m_ice_block','Giáp Băng','stasis','defense',20,0,'mana',20,[{guardReduction:.65,duration:1},{guardReduction:.7,duration:1.2},{guardReduction:.75,duration:1.4}],{note:'Giảm tốc bản thân 40%, vẫn chịu sát thương',element:'ice'})
]},
archer:{name:'Xạ kích',actives:[
botSkill('a_double_tap','Liên Tiễn','burst_arrows','strike',9,210,'stamina',16,[{dmgMultiplier:1.05,pulses:2},{dmgMultiplier:1.2,pulses:2},{dmgMultiplier:1.4,pulses:2}],{element:'steel',note:'Hai mũi tên riêng, có thể né'}),
botSkill('a_disengage_vault','Lùi Bắn','backstep_shot','mobility',11,180,'stamina',18,[{dmgMultiplier:.65,backstep:35},{dmgMultiplier:.8,backstep:50},{dmgMultiplier:.95,backstep:60,cleanseSlow:true}]),
botSkill('a_rain_of_arrows','Mưa Tên','arrow_barrage','strike',15,200,'stamina',25,[{dmgMultiplier:1.2,pulses:3,radius:50},{dmgMultiplier:1.45,pulses:3,radius:60},{dmgMultiplier:1.65,pulses:3,radius:70}],{note:'Vùng cố định, thoát vùng để tránh các đợt sau'}),
botSkill('a_snipe','Ngắm Bắn','charged_snipe','strike',17,240,'stamina',25,[{dmgMultiplier:1.35,armorPierce:.1},{dmgMultiplier:1.6,armorPierce:.15},{dmgMultiplier:1.85,armorPierce:.2}],{windup:1}),
botSkill('a_windrunner','Bước Chân Gió','speed_buff','mobility',14,0,'stamina',15,[{speedBuff:.2,duration:2},{speedBuff:.25,duration:2.5},{speedBuff:.3,duration:3}])
]},
assassin:{name:'Ám sát',actives:[
botSkill('as_shadowstep','Ảnh Bộ','teleport_backstab','strike',13,130,'stamina',22,[{dmgMultiplier:.95,distance:70},{dmgMultiplier:1.1,distance:85},{dmgMultiplier:1.25,distance:100}]),
botSkill('as_vanish','Biến Mất','stealth','mobility',19,0,'stamina',20,[{duration:1.5,speedBuff:.1},{duration:2,speedBuff:.15},{duration:2.5,speedBuff:.2}],{note:'Bị đánh hoặc tấn công sẽ lộ diện'}),
botSkill('as_throat_slit','Cắt Yết Hầu','melee_bleed_silence','control',13,55,'stamina',20,[{dmgMultiplier:.9,dotFraction:.08,dotKind:'bleed',silenceDur:.25},{dmgMultiplier:1.05,dotFraction:.1,dotKind:'bleed',silenceDur:.4},{dmgMultiplier:1.2,dotFraction:.12,dotKind:'bleed',silenceDur:.55}]),
botSkill('as_smoke_bomb','Bom Khói','smoke_cloud','mobility',17,0,'stamina',20,[{duration:1.2,speedBuff:.1},{duration:1.6,speedBuff:.15},{duration:2,speedBuff:.2,interrupt:true}],{note:'Bậc 3 cắt lấy đà 1 kẻ đang nhắm mình; không tác dụng boss miễn khống chế'}),
botSkill('as_assassinate','Ám Sát','execution_strike','finisher',18,70,'stamina',25,[{dmgMultiplier:1.25,executeBonus:.2},{dmgMultiplier:1.4,executeBonus:.3},{dmgMultiplier:1.6,executeBonus:.4}],{note:'Bonus chỉ khi mục tiêu dưới 30% HP'})
]},
hybrid:{name:'Hỗ trợ',actives:[
botSkill('h_armament_swap','Chuyển Thế Vũ Trang','weapon_buff','buff',15,0,'stamina',16,[{magicOnHit:3,duration:3,guardReduction:.2},{magicOnHit:5,duration:3.5,guardReduction:.25},{magicOnHit:7,duration:4,guardReduction:.3}],{note:'Cường hóa và đỡ chính diện 0.8s, không cần vũ khí phụ'}),
botSkill('h_enchanted_blade','Lưỡi Kiếm Linh Lực','weapon_buff','buff',12,0,'mana',16,[{magicOnHit:4,duration:3},{magicOnHit:7,duration:3.5},{magicOnHit:10,duration:4}]),
botSkill('h_healing_aura','Linh Khí Hồi Phục','aura_heal','heal',20,120,'mana',24,[{hotPct:.06},{hotPct:.08},{hotPct:.1}],{note:'Đồng minh trong 120px nhận nửa hiệu lực'}),
botSkill('h_wind_form','Phong Thể','ethereal_speed','mobility',15,0,'mana',18,[{speedBuff:.15,duration:2},{speedBuff:.2,duration:2.5},{speedBuff:.25,duration:3,waterWalk:true}],{note:'Bậc 3 bơi nhanh; vẫn không được combat trên sông'}),
botSkill('h_chaos_bolt','Hỗn Mang Tiễn','chaos_projectile','control',11,190,'mana',20,[{dmgMultiplier:1},{dmgMultiplier:1.15,armorBreak:.1},{dmgMultiplier:1.3,armorBreak:.1,stunDur:.35}],{element:'void',magic:true})
]}
};

window.GameData.BotTactics={
  "w_thunder_slash": "Quét cung khóa hướng; né ngang hoặc vòng sau.",
  "w_shield_bash": "Chặn chính diện lúc lấy đà rồi lao khiên; hụt để lộ sườn.",
  "w_whirlwind": "Ba nhịp quanh người, chia tổng damage; thoát vòng giữa các nhịp.",
  "w_crushing_charge": "Dash thẳng dừng trước tường; né ngang rồi phản công.",
  "w_second_wind": "Hồi nhỏ ngay; đòn trúng ngắt phần hồi theo thời gian.",
  "w_execution_cleave": "Bổ khóa điểm, bonus dưới 30% HP; hồi động tác dài.",
  "w_earthquake_stomp": "Chấn quanh người, tâm 18px an toàn; bậc 3 phá guard.",
  "w_iron_wall": "Guard hướng cố định và ngân sách hữu hạn; bọc hậu.",
  "w_armor_piercer": "Thrust hẹp đặt phá giáp 3s; né ngang.",
  "w_riposte": "Phản một đòn chính diện; nhử rồi đánh lúc cửa sổ hết.",
  "m_fireball": "Đạn nổ và vùng nóng 1.5s; dùng cover hoặc rời vùng.",
  "m_frost_bolt": "Slow ngắn; chỉ freeze mục tiêu đã bị lạnh, miễn CC 3s.",
  "m_blink": "Đổi góc tới điểm hợp lệ, ảnh giả có delay ở bậc cao.",
  "m_gravity_vortex": "Vùng cố định kéo bốn nhịp; dash khỏi vùng.",
  "m_mana_shield": "Tiêu mana để hấp thụ hữu hạn; cấu rỉa rồi ép khi hết.",
  "m_meteor_strike": "Khóa điểm cũ, niệm dài; rời dấu hoặc ngắt niệm.",
  "m_ice_block": "Guard mạnh, tự hạn chế chạy và không tấn công trong stasis.",
  "a_double_tap": "Hai đạn riêng khóa điểm ngắm; có thể né từng phát.",
  "a_disengage_vault": "Lùi theo đường hợp lệ và bắn trả; dồn tường để khắc chế.",
  "a_rain_of_arrows": "Ba nhịp tại vùng khóa sẵn; thoát vùng.",
  "a_snipe": "Ngắm 1s, chịu đòn trước khi bắn mất ngắm.",
  "a_windrunner": "Tăng tốc đổi vị trí; không tăng sát thương.",
  "as_shadowstep": "Lướt vật lý, bonus khi thật sự đánh từ sau lưng.",
  "as_vanish": "Ẩn ngắn, tấn công hoặc bị đánh sẽ lộ; AoE vẫn trúng.",
  "as_throat_slit": "Bleed hữu hạn; silence chỉ khi bắt địch niệm phép.",
  "as_smoke_bomb": "Vùng khói cắt tầm nhìn thật, vẫn chịu AoE.",
  "as_assassinate": "Finisher dưới 30% HP; hụt phải hồi động tác dài.",
  "h_armament_swap": "Chuyển thế công/thủ, không cần vũ khí phụ.",
  "h_enchanted_blade": "Nạp 3–5 đòn trong thời hạn; pulse không nạp vô hạn.",
  "h_healing_aura": "Vùng hồi 3s cố định; rời vùng sẽ mất hồi.",
  "h_wind_form": "Tăng tốc, giải slow; trên sông vẫn không combat.",
  "h_chaos_bolt": "Phá guard hoặc ngắt niệm theo trạng thái mục tiêu."
};
for(const group of Object.values(window.GameData.Skills))for(const s of group.actives)for(let tier=1;tier<=3;tier++)s["t"+tier].desc+=" • "+window.GameData.BotTactics[s.id];
