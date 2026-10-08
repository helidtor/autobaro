window.GameData=window.GameData||{};
// Distances use the same world pixels as weapons and vision (one metre = 20px).
const ancientSkill=(id,name,effect,range,radius,cooldown=8,extra={})=>({id,name,type:'ancient_skill',effect,range,radius,cooldown,windup:.8,damageScale:1.2,desc:{meteor:'Tám thiên thạch rơi quanh vị trí đã đánh dấu.',sweep:'Quét nửa vòng trước mặt và hất văng.',pull:'Hút đối thủ vào tâm rồi gây sát thương.',wall:'Dựng tường đá có va chạm trong 5 giây.',spin_beam:'Tia địa lõi quét quanh thân theo từng nhịp.',lava:'Hai dải dung nham trong 5s, hành lang ở giữa an toàn.',copy_first:'Sao chép semantics kỹ năng thứ nhất, phạm vi +20%, có giới hạn sát thương.',copy_second:'Sao chép kỹ năng thứ hai với phạm vi +20% và ngân sách riêng.',leap:'Nhảy tới điểm đánh dấu, gây chấn động khi tiếp đất.',swap:'Đổi binh khí và cường hóa đòn đánh.',combo:'Lặp lại chuỗi đòn đã kết liễu Yêu Thần.',split:'Tách thành hai phân thân giữ trang bị, mỗi bản mang nửa chỉ số.',devour:'Hút theo đường thẳng rồi cắn mục tiêu.',acid:'Vũng axit giảm 25% giáp trong vùng, duy trì 3s.',tentacles:'Sáu xúc tu đập theo ba nhịp liên tiếp.',panic:'Uy áp ngắt nhịp ngắn, không cưỡng ép bỏ chạy.',collapse:'Cảnh báo 3s: ba hành lang sụp đổ, có khe thoát; không trừ % HP.',cross:'Bốn đường chém giao nhau.',homing:'Đạn sống tối đa 3s, mất tracking khi mục tiêu khuất tầm nhìn.',spear:'Thương khóa hướng, trói tối đa 0.65s.',fissure:'Búa xé mặt đất thành khe lửa.',map_arrow:'Mũi tên khóa hành lang 1200px trong đấu trường.',matrix:'Sáu vùng nổ theo nhịp 1s, có cửa di chuyển.',lasers:'Ba tia laser quét và đốt vùng trúng.',net:'Lưới điện silence 0.6s, tâm vòng an toàn.',saw:'Lao tới bằng máy cưa, phá công trình trên đường.',nuclear:'Cảnh báo 4 giây: vụ nổ lớn; dùng tường che chắn để tránh.'}[effect],...extra});
const ancientPassive=(name,desc)=>({name,desc,type:'ancient',cooldownTimer:0});
window.GameData.AncientBosses=[
 {id:'primordial_colossus',kind:'colossus',name:'Bàn Cổ Dị Hình — Thủy Tổ Cự Ma',color:'#d08c49',scale:4,
 passives:[ancientPassive('Căn Nguyên Đất Mẹ','Giảm đòn thường theo DEF; vẫn nhận ít nhất 80% sát thương.'),ancientPassive('Trọng Lực Hư Vô','Trong 300px: giảm 30% tốc độ.'),ancientPassive('Kháng Tính Tuyệt Đối','Giảm 25% sát thương chuẩn.'),ancientPassive('Chấn Động Mặt Đất','Bước chân gây rung và ngắt niệm chiêu ở gần.'),ancientPassive('Hóa Thạch Xung Quanh','Đứng trong 85px liên tục 5s: hóa đá 1.5s.'),ancientPassive('Nộ Khí Phase 2','Vỡ vỏ đá: tốc chạy và tốc đánh tăng 50%.')],
 skills:[ancientSkill('ac_meteor','Thiên Thạch Rơi Tự Do','meteor',420,65,10,{count:8}),ancientSkill('ac_punch','Cú Đấm Bẻ Gãy Không Gian','sweep',180,180,7,{knockback:110}),ancientSkill('ac_sink','Hố Tụt Tử Thần','pull',220,190,9),ancientSkill('ac_wall','Tường Đá Ngăn Cách','wall',320,140,10),ancientSkill('ac_beam','Tia Năng Lượng Địa Lõi','spin_beam',360,360,12),ancientSkill('ac_lava','Tận Thế Sụp Đổ','lava',650,320,18,{phase:2})]},
 {id:'primordial_mirror',kind:'mirror',name:'Phản Chiếu Nguyên Thủy — Bản Sao Hoàn Hảo',color:'#bd93f9',scale:3,
 passives:[ancientPassive('Gương Soi Bản Nguyện','Sao chép các nội tại đã học, giữ điều kiện kích hoạt và giới hạn hiệu lực.'),ancientPassive('Thân Xác Thượng Cổ','Máu phase 1 bằng máu tối đa bot, phase 2 gấp đôi; sao chép vũ khí nhưng ATK có giới hạn. Miễn khống chế.'),ancientPassive('Hao Tổn Nghịch Đảo','Giảm 15% sát thương từ vũ khí cùng tên.'),ancientPassive('Áp Lực Kẻ Thắng Cuộc','Trong 200px: giảm 20% tốc chạy.'),ancientPassive('Ký Ức Tiên Tri','Né hoàn toàn kỹ năng nhắm trúng đầu tiên.'),ancientPassive('Thức Tỉnh Bản Ngã','Phase 2: chạy +50%, cooldown chiêu giảm 50%.')],
 skills:[ancientSkill('am_original_1','Nguyên Bản Cường Hóa — Nhát Chém Tận Diệt','copy_first',360,150,8),ancientSkill('am_original_2','Nguyên Bản Cường Hóa — Ma Lực Tận Thế','copy_second',600,160,10),ancientSkill('am_dash','Địa Chấn Xung Kích','leap',320,110,8,{stun:1.5}),ancientSkill('am_swap','Vũ Trang Nghịch Chuyển','swap',360,60,7),ancientSkill('am_combo','Mô Phỏng Trảm Quyết','combo',400,75,12),ancientSkill('am_split','Gương Vỡ Tàn Bạo','split',500,100,18,{phase:2})]},
 {id:'void_behemoth',kind:'void',name:'Quy Khư Thôn Thiên Kỷ — Hố Đen Nguyên Thủy',color:'#9159b7',scale:3.4,
 passives:[ancientPassive('Ăn Mòn Quy Luật','Giảm 20% sát thương đạn; đổi cách tấn công để phá thế phòng thủ.'),ancientPassive('Hấp Thụ Năng Lượng','Hồi theo sát thương phép thực nhận, tối đa 20% lượng sát thương đó.'),ancientPassive('Xác Thịt Hư Không','Miễn chảy máu và độc.'),ancientPassive('Áp Lực Vực Thẳm','Trong 160px: rút thể lực, khóa lăn né.'),ancientPassive('Bào Tử Đói Khát','Ký sinh bò đến mục tiêu ít máu rồi nổ.'),ancientPassive('Bung Tỏa Miệng Vực','Phase 2 hút đồ trong đấu trường để hồi máu.')],
 skills:[ancientSkill('av_devour','Thôn Phệ Vạn Vật','devour',300,50,8),ancientSkill('av_acid','Nôn Mửa Axit Hư Không','acid',340,110,9),ancientSkill('av_dive','Lặn Vào Vực Sâu','leap',420,120,8),ancientSkill('av_tentacles','Xúc Tu Bóng Tối','tentacles',320,75,10,{count:6}),ancientSkill('av_howl','Tiếng Hú Đói Cào','panic',400,300,11),ancientSkill('av_collapse','Sự Sụp Đổ Không Gian','collapse',450,240,18,{phase:2,windup:3,trueHpPct:.8})]},
 {id:'chaos_progenitor',kind:'chaos',name:'Hỗn Độn Ma Tổ — La Hầu',color:'#e25373',scale:3.4,
 passives:[ancientPassive('Bốn Binh Khí Nguyên Thủy','Luân chuyển kiếm/thương/búa/cung khi đánh thường.'),ancientPassive('Tâm Ma Thao Túng','Sao chép chiêu mạnh nhất của bot cấp cao nhất nhìn thấy.'),ancientPassive('Hút Máu Cuồng Loạn','Hồi 1 + 3% sát thương trực tiếp, tối đa 4 máu mỗi đòn; không hút máu từ phản đòn hoặc độc/lửa.'),ancientPassive('Khí Phách Ma Tổ','Phản 10% damage nhận một lần; không phản lại phản sát thương.'),ancientPassive('Chiến Ý Vô Tận','Máu càng thấp đánh càng nhanh, tối đa +100%.'),ancientPassive('Ma Thần Bất Diệt','Phase 2: bốn linh hồn vũ khí đánh độc lập.')],
 skills:[ancientSkill('ah_cross','Tứ Hướng Trảm Tuyệt','cross',300,250,8),ancientSkill('ah_swords','Vạn Kiếm Quy Tông','homing',500,35,10,{count:12}),ancientSkill('ah_spear','Giáng Thương Đoạt Mệnh','spear',450,35,9,{stun:3}),ancientSkill('ah_hammer','Búa Tạ Xé Trời','fissure',400,55,10),ancientSkill('ah_arrow','Cung Ma Diệt Hồn','map_arrow',1200,24,12),ancientSkill('ah_matrix','Ma Trận Lục Đạo Luân Hồi','matrix',650,220,18,{phase:2,count:6})]},
 {id:'zero_protocol',kind:'mecha',name:'Tận Thế Cơ Thần — Zero Protocol',color:'#ff695f',scale:3.6,
 passives:[ancientPassive('Lớp Giáp Năng Lượng Nano','Giáp ảo bằng 50% máu tối đa bot; giáp bị phá mới mất máu. Phase 2 mất lớp giáp ảo.'),ancientPassive('Tính Toán Quỹ Đạo Hoàn Hảo','Giảm 35% sát thương đánh từ sau lưng.'),ancientPassive('Hệ Thống Phản Lực Siêu Tốc','Không chịu phạt tốc độ vì đầm lầy/dốc núi.'),ancientPassive('Tự Động Khóa Mục Tiêu','Súng phụ bắn tỉa đối thủ ở xa.'),ancientPassive('Xả Nhiệt Quá Tải','Nhận 10 đòn: xả hơi nóng quanh thân.'),ancientPassive('Chế Độ Khẩn Cấp Overclock','Phase 2: chạy x2, chiêu không cooldown riêng; nhịp chung vẫn 1s.')],
 skills:[ancientSkill('az_laser','Pháo Laser Quét Quỹ Đạo','lasers',500,30,9,{count:3}),ancientSkill('az_missiles','Mưa Tên Lửa Tầm Nhiệt','homing',650,40,10,{count:12}),ancientSkill('az_net','Lưới Điện Cao Áp','net',360,140,9,{silence:2.5,stun:.7}),ancientSkill('az_saw','Máy Cưa Động Cơ Hủy Diệt','saw',360,60,10),ancientSkill('az_slam','Cú Nện Thủy Lực','leap',400,160,10,{knockback:140}),ancientSkill('az_nuclear','Lệnh Tự Hủy Hoại Thức Tỉnh','nuclear',650,550,20,{phase:2,windup:4,damageScale:8})]}
];
// A full endgame build uses the ten already-supported combat passive behaviours.
window.GameData.EndgamePassives=[
 {
  "group": "Cơ động",
  "id": "p_rebound_step",
  "name": "Bước Chuyển Thế",
  "legacy": null,
  "trigger": "Né thành công một đòn đã nhìn thấy; CD 12s.",
  "ranks": [
   {
    "desc": "Né thành công một đòn đã nhìn thấy; CD 12s. Nạp một bước lướt ngắn trong 1,5s để chọn lại khoảng cách. Đối sách: Giữ chiêu chặn điểm đáp, nhử né sớm.",
    "tier": 1
   },
   {
    "desc": "Né thành công một đòn đã nhìn thấy; CD 12s. Bước lướt được đi chếch thay chỉ lùi, nhưng dừng ở va chạm. Đối sách: Giữ chiêu chặn điểm đáp, nhử né sớm.",
    "tier": 2
   },
   {
    "desc": "Né thành công một đòn đã nhìn thấy; CD 12s. Lướt đúng qua sườn mở một đòn thường trong di chuyển; chọn đánh thì mất phần tăng tốc thoát. Đối sách: Giữ chiêu chặn điểm đáp, nhử né sớm.",
    "tier": 3
   }
  ],
  "counter": "Giữ chiêu chặn điểm đáp, nhử né sớm.",
  "role": "mobility",
  "type": "progression",
  "cooldown": 12
 },
 {
  "group": "Cơ động",
  "id": "p_opening_stride",
  "name": "Lướt Theo Khe",
  "legacy": null,
  "trigger": "Ở gần một chiêu địch vừa hụt/hồi động tác, còn stamina ≥25%; CD 14s.",
  "ranks": [
   {
    "desc": "Ở gần một chiêu địch vừa hụt/hồi động tác, còn stamina ≥25%; CD 14s. Được một bước tiếp cận ngắn về phía khe hở đã quan sát. Đối sách: Hụt có chủ đích để dụ vào lane, giữ đòn đáp trả.",
    "tier": 1
   },
   {
    "desc": "Ở gần một chiêu địch vừa hụt/hồi động tác, còn stamina ≥25%; CD 14s. Có thể dùng bước đó vòng sườn thay tiến thẳng. Đối sách: Hụt có chủ đích để dụ vào lane, giữ đòn đáp trả.",
    "tier": 2
   },
   {
    "desc": "Ở gần một chiêu địch vừa hụt/hồi động tác, còn stamina ≥25%; CD 14s. Chọn mở cú đánh nối hoặc đổi hướng thoát; dùng một nhánh tiêu hết charge. Đối sách: Hụt có chủ đích để dụ vào lane, giữ đòn đáp trả.",
    "tier": 3
   }
  ],
  "counter": "Hụt có chủ đích để dụ vào lane, giữ đòn đáp trả.",
  "role": "mobility",
  "type": "progression",
  "cooldown": 14
 },
 {
  "group": "Cơ động",
  "id": "p_ambush_shadow",
  "name": "Ảnh Bộ Phục Kích",
  "legacy": "Phục Kích",
  "trigger": "Đã cắt tầm nhìn thật sau truy sát hoặc phục kích đúng luật; CD 18s.",
  "ranks": [
   {
    "desc": "Đã cắt tầm nhìn thật sau truy sát hoặc phục kích đúng luật; CD 18s. Nạp một bước áp sát/rút lui; không tự cho ẩn khi vẫn bị thấy. Đối sách: Dò/AoE/giữ mép bụi; nếu bị nhìn lại charge bị hủy.",
    "tier": 1
   },
   {
    "desc": "Đã cắt tầm nhìn thật sau truy sát hoặc phục kích đúng luật; CD 18s. Bước để dấu hướng giả, khiến địch tìm vị trí cuối thay bám tọa độ. Đối sách: Dò/AoE/giữ mép bụi; nếu bị nhìn lại charge bị hủy.",
    "tier": 2
   },
   {
    "desc": "Đã cắt tầm nhìn thật sau truy sát hoặc phục kích đúng luật; CD 18s. Xuất kích đúng phía sau mở một bước thoát sau đòn đầu; phải chọn đánh hay tiếp tục ẩn. Đối sách: Dò/AoE/giữ mép bụi; nếu bị nhìn lại charge bị hủy.",
    "tier": 3
   }
  ],
  "counter": "Dò/AoE/giữ mép bụi; nếu bị nhìn lại charge bị hủy.",
  "role": "mobility",
  "type": "progression",
  "cooldown": 18
 },
 {
  "group": "Cơ động",
  "id": "p_frost_trail",
  "name": "Dấu Chân Hàn Phong",
  "legacy": "Hàn Kích",
  "trigger": "Đòn trực tiếp đặt dấu Lạnh rồi chủ thể thực hiện một lần né/lùi hợp lệ; CD 16s.",
  "ranks": [
   {
    "desc": "Đòn trực tiếp đặt dấu Lạnh rồi chủ thể thực hiện một lần né/lùi hợp lệ; CD 16s. Để một vệt lạnh rất ngắn tại điểm cũ, giúp cắt bám. Đối sách: Đi vòng, lửa tiêu vệt; hiệu lực di chuyển cùng họ lấy mức mạnh nhất.",
    "tier": 1
   },
   {
    "desc": "Đòn trực tiếp đặt dấu Lạnh rồi chủ thể thực hiện một lần né/lùi hợp lệ; CD 16s. Vệt kéo dài theo một đoạn đường đã đi thật, có lối vòng. Đối sách: Đi vòng, lửa tiêu vệt; hiệu lực di chuyển cùng họ lấy mức mạnh nhất.",
    "tier": 2
   },
   {
    "desc": "Đòn trực tiếp đặt dấu Lạnh rồi chủ thể thực hiện một lần né/lùi hợp lệ; CD 16s. Địch cố dash qua vệt mất một phần quãng lao; không đóng băng và không đặt vệt mỗi frame. Đối sách: Đi vòng, lửa tiêu vệt; hiệu lực di chuyển cùng họ lấy mức mạnh nhất.",
    "tier": 3
   }
  ],
  "counter": "Đi vòng, lửa tiêu vệt; hiệu lực di chuyển cùng họ lấy mức mạnh nhất.",
  "role": "mobility",
  "type": "progression",
  "cooldown": 16
 },
 {
  "group": "Cơ động",
  "id": "p_tether_pivot",
  "name": "Tơ Chuyển Vị",
  "legacy": "Trói Chân",
  "trigger": "Ba hành động tấn công trực tiếp trúng cùng địch trong 5s; CD 18s.",
  "ranks": [
   {
    "desc": "Ba hành động tấn công trực tiếp trúng cùng địch trong 5s; CD 18s. Đặt dây mềm 1,2s, chỉ còn hiệu lực khi giữ tầm/cover thông. Đối sách: Cắt tầm nhìn/ra quá xa/phá neo; boss không bị lách miễn hard CC.",
    "tier": 1
   },
   {
    "desc": "Ba hành động tấn công trực tiếp trúng cùng địch trong 5s; CD 18s. Giữ dây được mở một bước xoay sang sườn hợp lệ. Đối sách: Cắt tầm nhìn/ra quá xa/phá neo; boss không bị lách miễn hard CC.",
    "tier": 2
   },
   {
    "desc": "Ba hành động tấn công trực tiếp trúng cùng địch trong 5s; CD 18s. Chọn cắt dây để kéo lệch nhẹ hoặc tự rút ra; không nhận cả hai và không root dài. Đối sách: Cắt tầm nhìn/ra quá xa/phá neo; boss không bị lách miễn hard CC.",
    "tier": 3
   }
  ],
  "counter": "Cắt tầm nhìn/ra quá xa/phá neo; boss không bị lách miễn hard CC.",
  "role": "mobility",
  "type": "progression",
  "cooldown": 18
 },
 {
  "group": "Cơ động",
  "id": "p_feint_afterimage",
  "name": "Dư Ảnh Đổi Hướng",
  "legacy": null,
  "trigger": "Đổi hướng một động tác né/lướt hợp lệ khi đang bị nhắm; CD 20s.",
  "ranks": [
   {
    "desc": "Đổi hướng một động tác né/lướt hợp lệ khi đang bị nhắm; CD 20s. Ảnh lưu ngắn gây nhiễu một lần cho đòn nhắm đơn cần tầm nhìn. Đối sách: Dùng vùng/lane và đạn trực tiếp; không kích từ xoay tại chỗ hay đổi WASD nhỏ.",
    "tier": 1
   },
   {
    "desc": "Đổi hướng một động tác né/lướt hợp lệ khi đang bị nhắm; CD 20s. Có thể để ảnh tại điểm xuất phát hoặc điểm chuyển hướng, chốt một lần. Đối sách: Dùng vùng/lane và đạn trực tiếp; không kích từ xoay tại chỗ hay đổi WASD nhỏ.",
    "tier": 2
   },
   {
    "desc": "Đổi hướng một động tác né/lướt hợp lệ khi đang bị nhắm; CD 20s. Ảnh giữ đòn tracking tới điểm cuối và mở bước tái định vị nhỏ; AoE/đạn không tracking vẫn trúng. Đối sách: Dùng vùng/lane và đạn trực tiếp; không kích từ xoay tại chỗ hay đổi WASD nhỏ.",
    "tier": 3
   }
  ],
  "counter": "Dùng vùng/lane và đạn trực tiếp; không kích từ xoay tại chỗ hay đổi WASD nhỏ.",
  "role": "mobility",
  "type": "progression",
  "cooldown": 20
 },
 {
  "group": "Sinh tồn",
  "id": "p_blood_reserve",
  "name": "Dưỡng Huyết",
  "legacy": "Hấp Huyết",
  "trigger": "Hai hành động trực tiếp trúng rồi giữ được khoảng trống 0,8s; CD 20s.",
  "ranks": [
   {
    "desc": "Hai hành động trực tiếp trúng rồi giữ được khoảng trống 0,8s; CD 20s. Tích một phần sát thương thật thành lượng hồi có trần, hụt làm mất nhịp tích. Đối sách: Giữ áp lực/cắt nhịp; không tích từ DoT/phản/dummy/clone cùng cast.",
    "tier": 1
   },
   {
    "desc": "Hai hành động trực tiếp trúng rồi giữ được khoảng trống 0,8s; CD 20s. Có thể giữ lượng đã tích để hồi sau khi thoát, hết 3s mất phần chưa dùng. Đối sách: Giữ áp lực/cắt nhịp; không tích từ DoT/phản/dummy/clone cùng cast.",
    "tier": 2
   },
   {
    "desc": "Hai hành động trực tiếp trúng rồi giữ được khoảng trống 0,8s; CD 20s. Chọn hồi hoặc đổi cùng lượng đó thành khiên ngắn; chỉ được dùng một lần. Đối sách: Giữ áp lực/cắt nhịp; không tích từ DoT/phản/dummy/clone cùng cast.",
    "tier": 3
   }
  ],
  "counter": "Giữ áp lực/cắt nhịp; không tích từ DoT/phản/dummy/clone cùng cast.",
  "role": "defense",
  "type": "progression",
  "cooldown": 20
 },
 {
  "group": "Sinh tồn",
  "id": "p_flexible_armor",
  "name": "Thiết Giáp Linh Hoạt",
  "legacy": "Thiết Giáp",
  "trigger": "Đỡ đúng hướng một đòn trực tiếp, không phải guard bị ép vỡ; CD 16s.",
  "ranks": [
   {
    "desc": "Đỡ đúng hướng một đòn trực tiếp, không phải guard bị ép vỡ; CD 16s. Để lại một mảnh giáp che cùng hướng cho một đòn kế. Đối sách: Bọc hậu, dùng nhiều nguồn đòn khác nhịp; không che mọi hướng.",
    "tier": 1
   },
   {
    "desc": "Đỡ đúng hướng một đòn trực tiếp, không phải guard bị ép vỡ; CD 16s. Có thể giữ mảnh để chống ngắt một hành động né/rút hợp lệ thay hấp damage. Đối sách: Bọc hậu, dùng nhiều nguồn đòn khác nhịp; không che mọi hướng.",
    "tier": 2
   },
   {
    "desc": "Đỡ đúng hướng một đòn trực tiếp, không phải guard bị ép vỡ; CD 16s. Mảnh vỡ tạo một bước lùi nhỏ; mất charge và vẫn chịu phần damage vượt ngân sách. Đối sách: Bọc hậu, dùng nhiều nguồn đòn khác nhịp; không che mọi hướng.",
    "tier": 3
   }
  ],
  "counter": "Bọc hậu, dùng nhiều nguồn đòn khác nhịp; không che mọi hướng.",
  "role": "defense",
  "type": "progression",
  "cooldown": 16
 },
 {
  "group": "Sinh tồn",
  "id": "p_recovery_cycle",
  "name": "Sinh Cơ",
  "legacy": "Sinh Cơ",
  "trigger": "Đứng/giữ hành động hồi 1,2s sau khi đã tạo khoảng trống; CD 24s.",
  "ranks": [
   {
    "desc": "Đứng/giữ hành động hồi 1,2s sau khi đã tạo khoảng trống; CD 24s. Hồi chậm ngắt được; không vừa chạy vừa hồi thêm từ nội tại. Đối sách: Đánh ngắt/đẩy khỏi vị trí; hồi 1 HP/s mặc định vẫn là nguồn riêng.",
    "tier": 1
   },
   {
    "desc": "Đứng/giữ hành động hồi 1,2s sau khi đã tạo khoảng trống; CD 24s. Hoàn thành giải một trạng thái nhẹ đang gây hại nhất. Đối sách: Đánh ngắt/đẩy khỏi vị trí; hồi 1 HP/s mặc định vẫn là nguồn riêng.",
    "tier": 2
   },
   {
    "desc": "Đứng/giữ hành động hồi 1,2s sau khi đã tạo khoảng trống; CD 24s. Hoàn thành nạp một lần giảm chi phí né; dùng né sẽ chấm dứt cửa hồi. Đối sách: Đánh ngắt/đẩy khỏi vị trí; hồi 1 HP/s mặc định vẫn là nguồn riêng.",
    "tier": 3
   }
  ],
  "counter": "Đánh ngắt/đẩy khỏi vị trí; hồi 1 HP/s mặc định vẫn là nguồn riêng.",
  "role": "defense",
  "type": "progression",
  "cooldown": 24
 },
 {
  "group": "Sinh tồn",
  "id": "p_protective_charge",
  "name": "Hộ Thể",
  "legacy": "Hộ Thể",
  "trigger": "Giữ một charge bảo vệ cho hành động hỗ trợ đang chuẩn bị, dựa đòn đã thấy; CD 22s.",
  "ranks": [
   {
    "desc": "Giữ một charge bảo vệ cho hành động hỗ trợ đang chuẩn bị, dựa đòn đã thấy; CD 22s. Chặn một nhịp ngắt từ chính diện, không miễn damage của đòn. Đối sách: Đánh sau lưng/AoE hoặc nhử tiêu charge rồi ngắt chiêu chính.",
    "tier": 1
   },
   {
    "desc": "Giữ một charge bảo vệ cho hành động hỗ trợ đang chuẩn bị, dựa đòn đã thấy; CD 22s. Chọn dùng charge để giảm một debuff nhẹ thay chống ngắt. Đối sách: Đánh sau lưng/AoE hoặc nhử tiêu charge rồi ngắt chiêu chính.",
    "tier": 2
   },
   {
    "desc": "Giữ một charge bảo vệ cho hành động hỗ trợ đang chuẩn bị, dựa đòn đã thấy; CD 22s. Cho đổi hướng che một lần lúc lấy đà; không tự xoay theo mọi đòn. Đối sách: Đánh sau lưng/AoE hoặc nhử tiêu charge rồi ngắt chiêu chính.",
    "tier": 3
   }
  ],
  "counter": "Đánh sau lưng/AoE hoặc nhử tiêu charge rồi ngắt chiêu chính.",
  "role": "defense",
  "type": "progression",
  "cooldown": 22
 },
 {
  "id": "p_blood_body",
  "name": "Huyết Thể",
  "group": "Sinh tồn",
  "trigger": "Trong giao tranh thật; bùng hồi có hồi chiêu 60s.",
  "ranks": [
   {
    "desc": "Trong giao tranh thật; bùng hồi có hồi chiêu 60s. Hồi thêm 0,5 HP + 0,5% HP/s trong giao tranh. Đối sách: Giảm hồi tối đa 50%; đòn kết liễu không kích hồi.",
    "tier": 1
   },
   {
    "desc": "Trong giao tranh thật; bùng hồi có hồi chiêu 60s. Hồi thêm 0,75 HP + 0,75% HP/s; xuống 35% HP hồi thêm 12% trong 4s. Đối sách: Giảm hồi tối đa 50%; đòn kết liễu không kích hồi.",
    "tier": 2
   },
   {
    "desc": "Trong giao tranh thật; bùng hồi có hồi chiêu 60s. Hồi thêm 1 HP + 1% HP/s; xuống 40% HP hồi thêm 24% trong 3s. Đối sách: Giảm hồi tối đa 50%; đòn kết liễu không kích hồi.",
    "tier": 3
   }
  ],
  "counter": "Giảm hồi tối đa 50%; đòn kết liễu không kích hồi.",
  "role": "defense",
  "type": "progression",
  "cooldown": 60
 },
 {
  "group": "Sinh tồn",
  "id": "p_last_exit",
  "name": "Đường Sống Cuối",
  "legacy": null,
  "trigger": "HP đi từ >35% xuống <25%, còn stamina ≥15%; CD 60s, chỉ tái nạp sau hồi >55% trong 8s.",
  "ranks": [
   {
    "desc": "HP đi từ >35% xuống <25%, còn stamina ≥15%; CD 60s, chỉ tái nạp sau hồi >55% trong 8s. Khiên rất ngắn cho một đòn và một hướng thoát được chốt, không chặn đòn kết liễu đã xảy ra. Đối sách: Dồn tường/cắt đường; damage vượt khiên vẫn giết, không bất tử hay hồi từ chết.",
    "tier": 1
   },
   {
    "desc": "HP đi từ >35% xuống <25%, còn stamina ≥15%; CD 60s, chỉ tái nạp sau hồi >55% trong 8s. Nếu còn điểm đến hợp lệ, có một bước rút tiêu stamina; khiên kết thúc khi rút. Đối sách: Dồn tường/cắt đường; damage vượt khiên vẫn giết, không bất tử hay hồi từ chết.",
    "tier": 2
   },
   {
    "desc": "HP đi từ >35% xuống <25%, còn stamina ≥15%; CD 60s, chỉ tái nạp sau hồi >55% trong 8s. Chọn rút hoặc giữ vị trí bằng guard ngắn để phản công; không tăng cả khiên lẫn cơ động. Đối sách: Dồn tường/cắt đường; damage vượt khiên vẫn giết, không bất tử hay hồi từ chết.",
    "tier": 3
   }
  ],
  "counter": "Dồn tường/cắt đường; damage vượt khiên vẫn giết, không bất tử hay hồi từ chết.",
  "role": "defense",
  "type": "progression",
  "cooldown": 60
 },
 {
  "group": "Tạo đột biến",
  "id": "p_counter_shock",
  "name": "Chấn Thế Phản Kích",
  "legacy": "Phản Chấn",
  "trigger": "Đỡ chính xác một đòn cận chiến trực tiếp; CD 18s.",
  "ranks": [
   {
    "desc": "Đỡ chính xác một đòn cận chiến trực tiếp; CD 18s. Gây mất thế ngắn cho đòn vừa bị đỡ, mở cửa đáp trả. Đối sách: Nhử đỡ chính xác, đánh từ sau hoặc đổi sang vùng.",
    "tier": 1
   },
   {
    "desc": "Đỡ chính xác một đòn cận chiến trực tiếp; CD 18s. Đòn thường đáp trả đúng cửa được dịch sang sườn một bước nhỏ. Đối sách: Nhử đỡ chính xác, đánh từ sau hoặc đổi sang vùng.",
    "tier": 2
   },
   {
    "desc": "Đỡ chính xác một đòn cận chiến trực tiếp; CD 18s. Chọn hất nhẹ hoặc đánh nối; một phản ứng mỗi đòn, không phản sát thương dây chuyền. Đối sách: Nhử đỡ chính xác, đánh từ sau hoặc đổi sang vùng.",
    "tier": 3
   }
  ],
  "counter": "Nhử đỡ chính xác, đánh từ sau hoặc đổi sang vùng.",
  "role": "control",
  "type": "progression",
  "cooldown": 18
 },
 {
  "group": "Tạo đột biến",
  "id": "p_exhausting_venom",
  "name": "Nọc Suy Kiệt",
  "legacy": "Độc Kích",
  "trigger": "Hai hành động trực tiếp trúng trong 4s, dấu cùng nguồn; CD 18s.",
  "ranks": [
   {
    "desc": "Hai hành động trực tiếp trúng trong 4s, dấu cùng nguồn; CD 18s. Dấu buộc đối thủ đổi vị trí để tránh nhịp nọc kế. Đối sách: Giải nọc/cắt tầm/đỡ đòn nối; không anti-heal mọi nguồn hay trừ %HP vô hạn.",
    "tier": 1
   },
   {
    "desc": "Hai hành động trực tiếp trúng trong 4s, dấu cùng nguồn; CD 18s. Đòn nối trúng trong lúc địch đang hồi/niệm có thể cắt phần channel chưa hoàn tất. Đối sách: Giải nọc/cắt tầm/đỡ đòn nối; không anti-heal mọi nguồn hay trừ %HP vô hạn.",
    "tier": 2
   },
   {
    "desc": "Hai hành động trực tiếp trúng trong 4s, dấu cùng nguồn; CD 18s. Chọn tiêu dấu để cắt channel hoặc để dấu thành vùng nhỏ cản lối; không đồng thời nhận cả hai. Đối sách: Giải nọc/cắt tầm/đỡ đòn nối; không anti-heal mọi nguồn hay trừ %HP vô hạn.",
    "tier": 3
   }
  ],
  "counter": "Giải nọc/cắt tầm/đỡ đòn nối; không anti-heal mọi nguồn hay trừ %HP vô hạn.",
  "role": "control",
  "type": "progression",
  "cooldown": 18
 },
 {
  "group": "Tạo đột biến",
  "id": "p_ember_reversal",
  "name": "Tàn Hỏa Bộc Phát",
  "legacy": "Hỏa Phản",
  "trigger": "Nhận hai đòn trực tiếp độc lập từ cùng địch rồi đỡ/né thành công; CD 22s.",
  "ranks": [
   {
    "desc": "Nhận hai đòn trực tiếp độc lập từ cùng địch rồi đỡ/né thành công; CD 22s. Nạp một xung lửa nhỏ ở điểm vừa bị ép để cắt bám. Đối sách: Đổi nhịp/cự ly, nhử xả trước; không có RNG nổ mỗi tick damage.",
    "tier": 1
   },
   {
    "desc": "Nhận hai đòn trực tiếp độc lập từ cùng địch rồi đỡ/né thành công; CD 22s. Có thể để vệt nóng khi lùi thay xả ngay. Đối sách: Đổi nhịp/cự ly, nhử xả trước; không có RNG nổ mỗi tick damage.",
    "tier": 2
   },
   {
    "desc": "Nhận hai đòn trực tiếp độc lập từ cùng địch rồi đỡ/né thành công; CD 22s. Chọn xung đẩy hoặc vùng nóng ngắn, tiêu sạch nhiệt; không tạo cả hai mỗi lần bị đánh. Đối sách: Đổi nhịp/cự ly, nhử xả trước; không có RNG nổ mỗi tick damage.",
    "tier": 3
   }
  ],
  "counter": "Đổi nhịp/cự ly, nhử xả trước; không có RNG nổ mỗi tick damage.",
  "role": "control",
  "type": "progression",
  "cooldown": 22
 },
 {
  "group": "Tạo đột biến",
  "id": "p_cornered_instinct",
  "name": "Bản Năng Đường Cùng",
  "legacy": null,
  "trigger": "Ba đòn độc lập trong 6s, đường thoát thực sự bế tắc, hèn nhát <85; CD 45s.",
  "ranks": [
   {
    "desc": "Ba đòn độc lập trong 6s, đường thoát thực sự bế tắc, hèn nhát <85; CD 45s. Nạp một cơ hội đỡ/đánh trả giúp chống cắt nhịp, không tự bảo đảm trúng. Đối sách: Rút nhịp để nhử charge, đừng spam cùng thế; không ép bot quá hèn nhát hóa chiến thần.",
    "tier": 1
   },
   {
    "desc": "Ba đòn độc lập trong 6s, đường thoát thực sự bế tắc, hèn nhát <85; CD 45s. Đỡ/né thành công trong cửa đó mở bước xoay về khe hợp lệ. Đối sách: Rút nhịp để nhử charge, đừng spam cùng thế; không ép bot quá hèn nhát hóa chiến thần.",
    "tier": 2
   },
   {
    "desc": "Ba đòn độc lập trong 6s, đường thoát thực sự bế tắc, hèn nhát <85; CD 45s. Chọn phá guard đã yếu hoặc mở đường thoát; không vừa burst damage vừa kéo dài CC. Đối sách: Rút nhịp để nhử charge, đừng spam cùng thế; không ép bot quá hèn nhát hóa chiến thần.",
    "tier": 3
   }
  ],
  "counter": "Rút nhịp để nhử charge, đừng spam cùng thế; không ép bot quá hèn nhát hóa chiến thần.",
  "role": "control",
  "type": "progression",
  "cooldown": 45
 },
 {
  "group": "Tạo đột biến",
  "id": "p_pattern_reading",
  "name": "Đọc Nhịp Đối Thủ",
  "legacy": null,
  "trigger": "Quan sát cùng kiểu đòn hai lần độc lập trong 12s rồi thấy lần chuẩn bị kế; CD 24s.",
  "ranks": [
   {
    "desc": "Quan sát cùng kiểu đòn hai lần độc lập trong 12s rồi thấy lần chuẩn bị kế; CD 24s. Nạp một cửa phản ứng cho kiểu đòn đã thấy, không biết trước kỹ năng mới. Đối sách: Đổi thứ tự/nhử/hủy niệm hợp lệ/cắt tầm; mỗi đối thủ chỉ giữ một mẫu đọc.",
    "tier": 1
   },
   {
    "desc": "Quan sát cùng kiểu đòn hai lần độc lập trong 12s rồi thấy lần chuẩn bị kế; CD 24s. Có thể dùng cửa để né vào sườn thay lùi. Đối sách: Đổi thứ tự/nhử/hủy niệm hợp lệ/cắt tầm; mỗi đối thủ chỉ giữ một mẫu đọc.",
    "tier": 2
   },
   {
    "desc": "Quan sát cùng kiểu đòn hai lần độc lập trong 12s rồi thấy lần chuẩn bị kế; CD 24s. Chọn đánh ngắt chiêu có cửa ngắt hoặc chiếm cover đã thấy; không auto-parry/hit. Đối sách: Đổi thứ tự/nhử/hủy niệm hợp lệ/cắt tầm; mỗi đối thủ chỉ giữ một mẫu đọc.",
    "tier": 3
   }
  ],
  "counter": "Đổi thứ tự/nhử/hủy niệm hợp lệ/cắt tầm; mỗi đối thủ chỉ giữ một mẫu đọc.",
  "role": "control",
  "type": "progression",
  "cooldown": 24
 },
 {
  "group": "Tạo đột biến",
  "id": "p_turning_momentum",
  "name": "Thừa Thế Đổi Nhịp",
  "legacy": null,
  "trigger": "Chính bot ngắt chiêu có thể ngắt, phá neo quan trọng hoặc kết liễu hợp lệ; CD 24s.",
  "ranks": [
   {
    "desc": "Chính bot ngắt chiêu có thể ngắt, phá neo quan trọng hoặc kết liễu hợp lệ; CD 24s. Nạp một bước chiếm vị trí/loot hữu ích thay đứng hồi ở chỗ cũ. Đối sách: Giữ khoảng cách/cover, ép mất tầm nhìn; không làm chuỗi thắng-kill-heal-proc vô hạn.",
    "tier": 1
   },
   {
    "desc": "Chính bot ngắt chiêu có thể ngắt, phá neo quan trọng hoặc kết liễu hợp lệ; CD 24s. Bước đó có thể tới cover hoặc sườn đối thủ đang nhìn thấy. Đối sách: Giữ khoảng cách/cover, ép mất tầm nhìn; không làm chuỗi thắng-kill-heal-proc vô hạn.",
    "tier": 2
   },
   {
    "desc": "Chính bot ngắt chiêu có thể ngắt, phá neo quan trọng hoặc kết liễu hợp lệ; CD 24s. Chọn chuyển mục tiêu hợp lệ hoặc bảo toàn nhịp để thoát; không reset cooldown/damage hay kéo thêm người vào combat. Đối sách: Giữ khoảng cách/cover, ép mất tầm nhìn; không làm chuỗi thắng-kill-heal-proc vô hạn.",
    "tier": 3
   }
  ],
  "counter": "Giữ khoảng cách/cover, ép mất tầm nhìn; không làm chuỗi thắng-kill-heal-proc vô hạn.",
  "role": "control",
  "type": "progression",
  "cooldown": 24
 }
];

for(const d of window.GameData.AncientBosses)for(const s of d.skills)s.desc={"ac_meteor":"P1 các dấu đá thưa, đá rơi làm cover tạm; P2 loạt sau khóa đường vòng quanh cover nhưng luôn chừa lane.","ac_punch":"P1 đấm đẩy có vùng bên hông an toàn; P2 đấm vỡ cover kỹ năng của chính boss, báo mảnh vỡ trước.","ac_sink":"P1 hút theo nhịp về hố; P2 boss có thể đấm địch mắc hố nhưng xung hút cuối đẩy ra, mở cơ hội thoát.","ac_wall":"P1 dựng tường có hai đầu đi vòng; P2 đổi một đoạn thành cổng sập trễ, không khóa mọi đường.","ac_beam":"P1 tia địa lõi quét có tốc độ quay hữu hạn; P2 tia phản khỏi một tường do boss tạo, hiển thị cả đường phản.","ac_lava":"P1 chưa dùng; P2 dung nham mở/đóng hai hành lang theo nhịp, bot đọc vị trí an toàn kế tiếp.","am_original_1":"Sao chép mechanics bậc hiện có, giới hạn charge/dấu/cooldown giống bản gốc; P2 phản chiếu hướng tiếp cận thay chỉ nhân damage.","am_original_2":"Sao chép một chiêu thuộc vai trò khác để bổ trợ chiêu đầu; P2 mở nhánh phối hợp nhưng không sao chép cùng chiêu hai lần.","am_dash":"P1 nhảy khóa điểm; P2 ảnh đáp giả xuất hiện trước điểm đáp thật với ký hiệu phân biệt, vẫn có cửa đọc.","am_swap":"P1 đọc vũ khí đang dùng và đổi thế tương ứng; P2 có nhánh nhử đổi thế, giữ thời gian cam kết tối thiểu.","am_combo":"P1 dùng chuỗi đã quan sát lúc hạ Yêu Thần; P2 thêm một biến thể vị trí, giữa các đòn vẫn có khoảng phản ứng.","am_split":"P1 chưa dùng; P2 hai bản một ép gần/một giữ lane, dùng chung ngân sách chiêu/HP phase; hai bản + bot tính đủ ba thành viên combat.","av_devour":"P1 hút đường thẳng rồi cắn; P2 hút projectile/vùng do bot tạo trong đúng lane để sạc miệng, bot nhử sạc sai hướng.","av_acid":"P1 vùng axit có thể chạy ra; P2 tiêu axit của chính boss để mở một đường hút, không nhân vô hạn số vũng.","av_dive":"P1 lặn tới dấu đất; P2 đổi vị trí từ vùng axit còn tồn tại, luôn báo điểm lên trước.","av_tentacles":"P1 các cặp xúc tu khóa lane xen kẽ; P2 một cặp chắn và một cặp quét, phá mấu xúc tu mở lane.","av_howl":"P1 phá ngắm gần theo nón; P2 làm dao động một vùng hút sẵn, không cưỡng ép AI bỏ mọi kế hoạch.","av_collapse":"P1 chưa dùng; P2 sụp ba hành lang có trình tự, dấu nứt báo lane tiếp; không trừ thẳng 80% HP.","ah_cross":"P1 bốn đường chém với các góc an toàn; P2 đổi thứ tự hai trục nhưng giữ dấu hướng và quãng nghỉ.","ah_swords":"P1 đạn bám mất dấu khi bị che; P2 chia loạt khóa điểm cũ và loạt bám, có màu phân biệt.","ah_spear":"P1 thương cắm tạo neo; P2 nối một dây với neo trước, phá neo giải kéo và mở cửa áp sát.","ah_hammer":"P1 rãnh địa chấn lan theo đường; P2 có thể đập neo thương để chuyển rãnh, chỗ neo bị mất phải mở lối.","ah_arrow":"P1 ngắm hành lang xuyên đấu trường, cover chặn; P2 một phản xạ vào tường kỹ năng được vẽ trước.","ah_matrix":"P1 chưa dùng; P2 sáu vùng đổi theo nhịp, hạ neo linh hồn tắt một vùng; linh hồn không trở thành sáu quái độc lập.","az_laser":"P1 tia quay bị cover chặn; P2 có chu kỳ nóng/nguội, lúc xả nhiệt lộ giáp và giảm khả năng xoay.","az_missiles":"P1 tên lửa theo loạt, mất tracking khi cắt tầm; P2 chia đạn nhử/đạn thật bằng hiệu ứng rõ, bot chọn cover.","az_net":"P1 lưới với tâm/khe an toàn; P2 có cột nguồn phá được để tắt một cạnh, không khóa cả room.","az_saw":"P1 lao cưa phá cover kỹ năng trên lane; P2 va cover đủ dày làm nóng cưa và lộ sườn, bot nhử được.","az_slam":"P1 nện thủy lực lan vòng; P2 tiêu mức nhiệt để thêm một xung và sau đó buộc hồi động tác dài.","az_nuclear":"P1 chưa dùng; P2 mở lõi đếm ngược, bot chọn cover hoặc phá lõi đúng ngưỡng; đủ phá sẽ ngắt và mở cửa phản công."}[s.id]||s.desc;

const ancientPassiveDescriptions={"colossus":["Lớp đá trước mặt có độ bền; phá lớp tạo cửa đánh, không giảm damage cố định vô hạn.","Trọng lực đổi từng vòng có khe, tránh đứng mãi trong vòng; không phủ toàn room.","Kháng sát thương chuẩn hữu hạn, đánh đúng điểm nứt vẫn có giá trị; không tạo đường build bắt buộc.","Bước chân chỉ chấn khi dồn lực, có âm/đất nứt báo trước; không mỗi tick đều ngắt niệm.","Hóa thạch tích phơi nhiễm gần, rời vùng giảm tích; đủ ngưỡng báo trước và cho giải.","P2 mất đá nhưng mở nhịp truy đuổi/đổi địa hình; hồi động tác vẫn giữ cửa phản công."],"mirror":["Sao chép nội tại theo trigger/charge thật; hệ số sao chép có trần tài nguyên, không nhân đôi mọi control/thời lượng.","Hai phase 450/1350 HP, sao chép kỹ năng ở bậc hiện có; phân thân dùng chung ngân sách chiêu.","Kháng vũ khí cùng tên được phá bằng đổi nhịp/hiệu ứng thay yêu cầu tìm loại vũ khí khác trong room.","Vùng áp lực có hướng và quãng tắt sau chiêu; bot lợi dụng cửa đó để quay vị trí.","Dự báo chỉ một đòn đã nhìn thấy; dùng đòn rẻ nhử, không né tuyệt đối chiêu đang bị smoke che.","P2 đổi thế/phân vai hai bản, chung ngân sách chiêu; không cắt cooldown tới spam."],"void":["Bẻ đạn trong một vành có khe; cận chiến/đổi góc hoặc bắn đúng quãng tắt đều hợp lệ.","Hấp magic nạp charge miệng, xả charge có hồi động tác; hồi HP có trần, không triệt pháp sư.","Miễn bleed/poison, nhưng hai hiệu ứng chuyển thành ăn mòn lớp da với trần để skill không thành vô dụng.","Rút stamina theo nhịp trong vùng, không cấm né tuyệt đối; bot chọn ra vùng hoặc đánh ngắt nhịp.","Ký sinh là đạn/neo phá được, không quái mới và không tracking xuyên cover.","P2 nuốt đồ chỉ sau dấu hút/niệm; ưu tiên giữ đồ Yêu Thần/Thượng Bảo, không xóa chiến lợi phẩm vĩnh viễn."],"chaos":["Đổi binh khí theo chuỗi công khai, mỗi kiểu có thế mạnh và cửa hồi riêng.","Sao chép chiêu đã thấy, có cooldown/budget, không biết cả bộ kỹ năng người chưa lộ mặt.","Hút máu sau kết thúc một chuỗi hợp lệ; ngắt chuỗi chặn hồi, không từ phản/DoT.","Phản chỉ khi đang thế kiếm phòng thủ và dùng một charge; bọc hậu/nhử charge khắc chế.","Ít máu mở chuỗi mới với quãng ngắt, không tăng attack speed vô hạn khiến né bất khả thi.","P2 linh hồn là lane gắn boss, phá neo tắt một lane; chung encounter và CC budget."],"mecha":["Giáp nano có đoạn/thời hạn; phá một đoạn mở điểm yếu, nhiệt cao làm tái tạo chậm.","Rear guard chỉ bật lúc boss khóa mục tiêu trước; nhử đổi khóa tạo cửa bọc hậu, không miễn đòn sau lưng.","Phản lực đổi vị trí theo nhịp và có điểm đáp, vẫn va tường/room; không bỏ luật sông ở thế giới ngoài.","Súng phụ có lane/laser ngắm, cover chặn và có cadence riêng trong ngân sách boss.","Tích nhiệt theo số hành động/đòn nhận; nóng buộc xả và lộ lõi, bot chủ động ép quá nhiệt.","P2 Overclock tiêu nhiệt; sau một chuỗi phải nguội, giữ nhịp chung tối thiểu 1s và hồi động tác."]};
for(const d of window.GameData.AncientBosses)d.passives.forEach((p,i)=>{p.id=d.id+"_passive_"+i;p.desc=ancientPassiveDescriptions[d.kind][i]||p.desc;});

for(const d of window.GameData.EndgamePassives)d.ranks.forEach((r,i)=>{
 const F=window.GameData.SkillScaling.formula;r.scaling=['p_rebound_step','p_opening_stride','p_ambush_shadow','p_tether_pivot','p_feint_afterimage','p_counter_shock','p_cornered_instinct','p_pattern_reading','p_turning_momentum','p_protective_charge'].includes(d.id)?{distance:F(20+i*10,.04,'speed')}:{};
 if(d.id==='p_blood_body'){r.scaling={regen:F([.5,.75,1][i],[.005,.0075,.01][i],'hp'),burst:F([0,10,15][i],[0,.12,.18][i],'hp',.2)};r.desc=r.desc.replace('24%','20%');}
 if(d.id==='p_recovery_cycle')r.scaling.heal=F([8,12,16][i],[.025,.03,.035][i],'hp',.08);
 if(d.id==='p_flexible_armor')r.scaling.shield=F([10,15,20][i],[.5,.65,.8][i],'defense',.1);
 if(d.id==='p_last_exit')r.scaling.shield=F([15,20,25][i],[.7,.85,1][i],'defense',.12);
 if(d.id==='p_protective_charge')r.scaling.shield=F([5,8,12][i],[.15,.2,.25][i],'defense',.04);
 if(d.id==='p_blood_reserve')r.scaling.reserve=F([5,10,15][i],[.03,.04,.05][i],'hp',.08);
 if(d.id==='p_ember_reversal')r.scaling.damage=F([3,5,7][i],[.1,.12,.15][i],'attack');
 if(['p_frost_trail','p_tether_pivot','p_exhausting_venom'].includes(d.id))r.scaling.radius=F(d.id==='p_frost_trail'?28+i*8:d.id==='p_tether_pivot'?45:30,.04,'speed');
});
