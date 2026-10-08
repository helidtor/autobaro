/**
 * traitsData.js - Đặc tả tính cách, cảm xúc động và tiến trình cấp độ
 */
// Polyfill cho CanvasRenderingContext2D.prototype.roundRect nếu trình duyệt cũ chưa hỗ trợ
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
    if (!radii) radii = 0;
    const r = Array.isArray(radii) ? (radii[0] || 0) : (typeof radii === 'number' ? radii : 0);
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    return this;
  };
}

window.GameData = window.GameData || {};

window.GameData.Traits = {
  brave: {
    id: 'brave',
    name: 'Can Đảm',
    nameEn: 'Brave',
    description: 'Giảm 60% tốc độ tích lũy Sợ Hãi. Khi HP < 25%, tăng 20% sát thương thay vì bỏ chạy.',
    preferredClass: 'warrior',
    fearGainMultiplier: 0.4,
    lowHpDamageBonus: 0.2,
    moteIcon: '🔥', // Hoặc nắm đấm đỏ
    moteColor: '#e74c3c',
    behaviorTendency: 'Lao vào combat, sẵn sàng ks boss Yêu Vương/Yêu Thần'
  },
  coward: {
    id: 'coward',
    name: 'Hèn Nhát',
    nameEn: 'Coward',
    description: 'Tốc độ tích lũy Sợ Hãi tăng 100%. Luôn ưu tiên tránh tiếng động, nấp bụi rậm khi có giao tranh trong bán kính 15 mét.',
    preferredClass: 'assassin', // hoặc archer
    fearGainMultiplier: 2.0,
    lowHpDamageBonus: 0.0,
    moteIcon: '💧', // Giọt mồ hôi
    moteColor: '#3498db',
    behaviorTendency: 'Tránh né, rình rập, bỏ chạy nhanh khi nguy hiểm'
  },
  wise: {
    id: 'wise',
    name: 'Khôn Ngoan',
    nameEn: 'Wise',
    description: 'Tính toán chi tiết chỉ số. Không giao tranh nếu tỷ lệ thắng dưới 55%. Ưu tiên đổi vũ khí linh hoạt.',
    preferredClass: 'hybrid', // hoặc mage
    fearGainMultiplier: 0.8,
    lowHpDamageBonus: 0.0,
    moteIcon: '💡', // Bóng đèn
    moteColor: '#f1c40f',
    behaviorTendency: 'Tính toán chiến thuật, giữ cự ly, hoán đổi cận chiến / tầm xa'
  },
  greedy: {
    id: 'greedy',
    name: 'Tham Lam',
    nameEn: 'Greedy',
    description: 'Chỉ số Hưng Phấn tăng vọt khi thấy đồ Siêu Hiếm/Cực Phẩm. Dễ dính bẫy khi mải nhặt đồ.',
    preferredClass: 'archer', // ngẫu nhiên
    fearGainMultiplier: 1.0,
    lowHpDamageBonus: 0.0,
    moteIcon: '💰', // Đồng xu vàng
    moteColor: '#f39c12',
    behaviorTendency: 'Lao vào nhặt đồ rơi, chấp nhận rủi ro bị phục kích'
  },
  cunning: {
    id: 'cunning',
    name: 'Xảo Quyệt',
    nameEn: 'Cunning',
    description: 'Luôn di chuyển sau lưng/bọc sườn mục tiêu. Chủ động liên minh tạm thời rồi đâm lén sau khi ăn boss.',
    preferredClass: 'assassin',
    fearGainMultiplier: 0.7,
    lowHpDamageBonus: 0.1,
    moteIcon: '😈', // Mặt quỷ
    moteColor: '#9b59b6',
    behaviorTendency: 'Bọc sườn, đâm lén, chờ bot yếu máu ăn hôi'
  }
};

window.GameData.Emotions = {
  FEAR_FLEE_THRESHOLD: 80,
  CONFIDENCE_OVERCONFIDENT_THRESHOLD: 85,
  DESPAIR_BREAKTHROUGH_THRESHOLD: 90,
  LOW_HP_THRESHOLD: 0.15,

  // Tốc độ hồi cảm xúc tự nhiên
  DECAY_RATE: 2.5 // điểm mỗi giây
};

window.GameData.Classes = {
  warrior: {
    id: 'warrior',
    name: 'Đấu Sĩ',
    nameEn: 'Warrior',
    role: 'Cận chiến, Tanker, Sát thương bền bỉ',
    primaryColor: '#c0392b',
    baseHpBonus: 1.25,
    baseDefBonus: 1.2,
    baseAtkBonus: 1.0,
    staminaBonus: 1.3
  },
  mage: {
    id: 'mage',
    name: 'Pháp Sư',
    nameEn: 'Mage',
    role: 'Tầm xa, Phép thuật, Khống chế',
    primaryColor: '#2980b9',
    baseHpBonus: 0.85,
    baseDefBonus: 0.8,
    baseAtkBonus: 1.3,
    manaBonus: 1.6
  },
  archer: {
    id: 'archer',
    name: 'Cung Thủ',
    nameEn: 'Archer',
    role: 'Tầm xa, Sát thương duy trì, Thả diều',
    primaryColor: '#27ae60',
    baseHpBonus: 0.95,
    baseDefBonus: 0.9,
    baseAtkBonus: 1.15,
    moveSpeedBonus: 1.15
  },
  assassin: {
    id: 'assassin',
    name: 'Sát Thủ',
    nameEn: 'Assassin',
    role: 'Cận chiến, Dồn sát thương, Cơ động',
    primaryColor: '#8e44ad',
    baseHpBonus: 0.9,
    baseDefBonus: 0.85,
    baseAtkBonus: 1.4,
    critBonus: 0.25
  },
  hybrid: {
    id: 'hybrid',
    name: 'Thuật Sĩ',
    nameEn: 'Hybrid / All-Rounder',
    role: 'Linh hoạt, Buff, Vũ khí kép',
    primaryColor: '#d35400',
    baseHpBonus: 1.05,
    baseDefBonus: 1.05,
    baseAtkBonus: 1.1,
    adaptability: 1.3
  }
};

window.GameData.LevelTable = {
  expForLevel(level){
    if(level<=15)return this.expRequirements[Math.max(0,level-1)];
    const extra=level-15;
    return this.expRequirements[14]+1200*extra+100*extra*(extra-1);
  },
  // Điểm kinh nghiệm tích lũy để lên từng cấp
  expRequirements: [
    0,     // Lv 1
    80,    // Lv 2
    180,   // Lv 3
    320,   // Lv 4
    500,   // Lv 5
    750,   // Lv 6
    1050,  // Lv 7
    1400,  // Lv 8
    1800,  // Lv 9
    2300,  // Lv 10
    2900,  // Lv 11
    3600,  // Lv 12
    4400,  // Lv 13
    5300,  // Lv 14
    6400   // Lv 15; các cấp tiếp theo dùng công thức tăng dần
  ]
};

window.GameData.PersonalityAxes = {aggression:'Hiếu chiến',caution:'Thận trọng',greed:'Tham vọng',loyalty:'Trung thành',patience:'Kiên nhẫn',curiosity:'Khám phá',cowardice:'Hèn nhát',composure:'Bình tĩnh'};
window.GameData.PersonalityProfiles = {
 brave:{aggression:90,caution:25,greed:45,loyalty:65,patience:25,curiosity:70,cowardice:10,composure:70},
 coward:{aggression:15,caution:95,greed:30,loyalty:50,patience:80,curiosity:35,cowardice:95,composure:25},
 wise:{aggression:40,caution:85,greed:45,loyalty:70,patience:85,curiosity:65,cowardice:35,composure:90},
 greedy:{aggression:65,caution:40,greed:95,loyalty:20,patience:35,curiosity:80,cowardice:45,composure:40},
 cunning:{aggression:55,caution:65,greed:75,loyalty:15,patience:95,curiosity:60,cowardice:65,composure:75}
};
