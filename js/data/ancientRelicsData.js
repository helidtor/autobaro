window.GameData.Equipments.TIER_COLORS.ancient='#ffd166';
window.GameData.Equipments.TIER_NAMES.ancient='Thượng Bảo';
window.GameData.Equipments.relics={
 core:{id:'relic_core',name:'Bàn Cổ Hộ Tâm Giáp',slot:'body',hp:350,defense:45,magicDefense:30,effect:'core',color:'#e9bb57',desc:'Giảm 25% sát thương nổ/thiên thạch. Dưới 30% HP: khiên 25% HP trong 4s, miễn đẩy lùi, hồi 45s.'},
 voidblade:{id:'relic_voidblade',name:'Truy Hồn Đoản Đao Quy Khư',slot:'weapon',type:'dagger',attack:65,speed:1.2,range:42,critChance:.15,effect:'voidblade',color:'#b782ff',desc:'Mỗi chém lấy 2% giáp/kháng thành ATK, tối đa 10 tầng trong 5s. Lướt 120px, miễn sát thương 0.4s, xóa chậm; hồi 12s.'},
 prism:{id:'relic_prism',name:'Kính Vạn Hoa Nguyên Bản',slot:'head',hp:200,manaMax:150,cooldownReduction:.15,effect:'prism',color:'#ffe69a',desc:'Đòn trên 20% HP tạo ảo ảnh hút chú ý 2s, hồi 30s. +20% sát thương nếu đối thủ có kỹ năng trùng.'},
 halberd:{id:'relic_halberd',name:'Hỗn Nguyên Tứ Phương Kích',slot:'weapon',type:'spear',attack:75,speed:1,range:68,lifeSteal:.15,effect:'halberd',color:'#f8b05b',desc:'Mỗi đòn thứ 4 đổi nguyên tố: Băng chậm 30%/2s, Hỏa đốt 4% HP hiện tại/3s, Lôi ngắt chiêu 0.2s, Phong tăng tốc 30%/2s.'},
 treads:{id:'relic_treads',name:'Phản Lực Động Cơ Zero',slot:'feet',moveBonus:.35,staminaMax:50,effect:'treads',color:'#ff8758',desc:'Bỏ phạt tốc độ địa hình. Né phản lực 140px, giảm 30% thể lực né, để lại lửa 3s.'},
 greatbow:{id:'relic_greatbow',name:'Nhật Nguyệt Tinh Thần Cung',slot:'weapon',type:'bow',attack:70,speed:1,range:175,effect:'greatbow',color:'#ffe0a3',desc:'Luân phiên: Thái Dương nổ và xóa bẫy/độc trong 40px; Thái Âm đánh dấu tăng 20% sát thương tiếp theo/4s.'},
 tome:{id:'relic_tome',name:'Thiên Thư Tận Thế La Hầu',slot:'weapon',type:'tome',magicPower:85,speed:1,range:150,manaRegen:.25,armorPierce:.1,effect:'tome',color:'#d7a0ff',desc:'Kỹ năng bậc 3 thêm 3 tia bám đuổi, tổng 150% ATK phép. Đòn phép có 20% làm chậm tốc đánh 15%/3s, tối đa 2 tầng.'},
 crown:{id:'relic_crown',name:'Vương Miện Huyết Tộc Chúc Long',slot:'head',hp:250,magicDefense:35,lifeSteal:.1,effect:'crown',color:'#f4a478',desc:'Giảm 30% Độc/Hỏa/Băng. Khống chế cứng từ boss: giảm nửa thời gian, đẩy vật thể nhỏ; hồi 25s.'},
 nano:{id:'relic_nano',name:'Huy Hiệu Nano Tái Thiết',slot:'body',hp:280,defense:35,staminaRegen:20,effect:'nano',color:'#97efcb',desc:'Không nhận sát thương 3s: hồi 1.5% HP/s. Despair >90: hồi 50% thể lực, tăng tốc 25%/4s; hồi 40s.'},
 ring:{id:'relic_ring',name:'Nhẫn Vực Sâu Thôn Tích',slot:'head',attack:15,magicPower:15,defense:15,magicDefense:15,hp:15,manaMax:15,effect:'ring',color:'#c5acff',desc:'Chiếm ô mũ. Gây sát thương Thượng Cổ tích tối đa 50 điểm; đòn kế hút 10% sát thương thành HP và lùi 80px.'}
};
for(const relic of Object.values(window.GameData.Equipments.relics)){relic.tier='ancient';relic.classReq='all';}
