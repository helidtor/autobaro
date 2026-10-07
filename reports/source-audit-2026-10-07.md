# Đối chiếu đặc tả và kiểm tra source AutoBaro

Ngày kiểm tra: 07/10/2026. Phạm vi: `requirement.md`, `material-game.md`, toàn bộ 21 file JavaScript, HTML, cấu hình npm và bản build.

## Kết luận

Source có bộ khung mô phỏng Canvas 2D, AI, combat, renderer và UI. Tuy nhiên chưa đáp ứng đầy đủ hai đặc tả và hiện có lỗi chặn cả dev lẫn production. Nhiều thuộc tính trong dữ liệu chưa được thực thi trong gameplay. Báo cáo này không sửa source.

## Các bước đã chạy

| Kiểm tra | Kết quả |
|---|---|
| Parse 21 file JS bằng `vm.Script` | Đạt; không có lỗi cú pháp |
| `npm run build` | Exit 0, Vite 5.4.21; cảnh báo cả 21 script không được bundle vì không có `type="module"` |
| `npm run dev -- --host 127.0.0.1` và mở bằng Edge headless, viewport 1366×768 | Khởi tạo 100 pawn, 190 quái; vòng lặp dừng với `this.renderCentaur is not a function` |
| `npm run preview -- --host 127.0.0.1` và mở trên Edge | Toàn bộ 21 URL `/js/...` trả 404; `window.GameManager` không tồn tại |
| Thử render riêng từng definition quái | Nhân Mã gây exception; các definition còn lại không ném exception trong ca thử này |
| Mô phỏng logic với bước 0.1s, dự kiến 6000 bước | Không hoàn tất: lần chạy ghi nhận lỗi AI tại 0.2s; thời điểm phụ thuộc spawn ngẫu nhiên |
| Ca kiểm tra trực tiếp các hàm gameplay | Tái hiện các lỗi loot, mana, kỹ năng/class, liên minh, giáp mũ và kết thúc trận bên dưới |

Trong ca mô phỏng logic, `requestAnimationFrame` bị vô hiệu hóa **chỉ trong trang thử nghiệm** để chạy `GameManager.update()` có kiểm soát. Không sửa file game. Đây không phải phép đo FPS. Chưa xác nhận được trận đấu hoàn chỉnh hoặc yêu cầu 60 FPS.

## Lỗi đã xác nhận, theo thứ tự ưu tiên

### P0 — Bản production thiếu toàn bộ JavaScript

- Vị trí: `index.html:102` trở đi và `package.json` script build.
- Các script được nạp như classic script. Vite báo không thể bundle và `dist` chỉ chứa HTML/CSS, không chứa cây `js`.
- Thực nghiệm: 21 request JS trả 404; game không khởi tạo.
- Hướng sửa: tạo entry module import các file theo thứ tự phụ thuộc và để Vite đóng gói, hoặc thiết lập sao chép static scripts đúng cách. Cần kiểm tra lại bằng preview sau build.

### P0 — Renderer gọi hàm Nhân Mã không tồn tại

- Vị trí: `js/renderer/monsterRenderer.js:77`.
- Nhánh `centaur` gọi `this.renderCentaur(...)`, nhưng object renderer không định nghĩa hàm này.
- Quái `centaur_warlord` nằm trong pool spawn nên dễ gặp ngay khi render trận.
- Exception thoát khỏi `gameLoop` trước khi lên lịch frame tiếp theo, làm game đứng.

### P0 — AI đánh mục tiêu undefined khi không có quái

- Vị trí: `js/ai/aiBrain.js:77–81`, `:234–256`.
- Khi có ít nhất 3 enemy pawn, bot hèn nhát/khôn ngoan gọi `huntSuitableMonster` dù mảng monsters có thể rỗng.
- Hàm lấy `monsters[0]` rồi gọi `engageCombat`, đọc `target.x`.
- Tái hiện: `huntSuitableMonster(pawn, [], 0.1)` ném `Cannot read properties of undefined (reading 'x')`; mô phỏng logic cũng gặp cùng stack.
- Hướng sửa: kiểm tra mục tiêu hợp lệ và có hành vi dự phòng khi không có bãi farm.

### P1 — Đồ rơi không vào danh sách đang chạy của game

- Vị trí: `js/game.js:64`, `:192–193`, `:285`; `js/entities/entityManager.js:162`.
- Ban đầu hai manager giữ chung mảng. Mỗi update dùng `filter()` gán mảng mới cho `GameManager.dropItems`; spawn vẫn push vào mảng của EntityManager.
- Tái hiện sau update: hai mảng khác nhau; đồ mới có trong EntityManager nhưng không có trong GameManager.
- Ảnh hưởng: loot quái chết, loot bot chết và thả thính không xuất hiện trong render/spatial grid/nhặt đồ. Cản tiến trình trang bị và phân nhánh class.

### P1 — Kỹ năng dùng stamina làm mana thành NaN

- Vị trí: `js/game.js:229–245`; `js/data/skillsData.js`.
- Player skill luôn kiểm tra/trừ `manaCost`. Nhiều kỹ năng Đấu Sĩ, Cung Thủ, Sát Thủ chỉ có `staminaCost`.
- Tái hiện với Chém Sấm Sét: mana 100 → NaN; stamina vẫn 100.
- Ảnh hưởng: tài nguyên và HUD mana sai; kiểm tra đủ năng lượng mất tác dụng.

### P1 — Kỹ năng không đồng bộ với class và mất điểm nâng cấp

- Vị trí: `js/ai/aiBrain.js:115–143`, `:174–176`.
- Bot chưa có class vẫn học kỹ năng warrior. Loot khóa class theo vũ khí nhưng không chuyển/reset bộ kỹ năng.
- Tái hiện: nhặt wand khóa thành mage nhưng kỹ năng vẫn `w_thunder_slash`.
- Với 15 điểm: chỉ 3 active đạt Tier 3; tất cả 15 điểm bị trừ, không học passive; 6 điểm cuối không tạo thêm nâng cấp.
- AI không có đường gọi thi triển các kỹ năng đã học; `performAttack` chỉ đánh thường.

### P1 — Liên minh phản bội sai thời điểm và không được bảo vệ ở tầng damage

- Vị trí: `js/ai/aiBrain.js:197–230`; `js/entities/combatSystem.js:7`, `:39`.
- Không giữ reference tới boss của liên minh. Chỉ cần boss rời vùng nhìn là `!boss` và xử lý như boss chết.
- Tái hiện: boss vẫn `isAlive=true`, bot tham lam và đồng minh 50 HP đã mất liên minh sau khi truyền danh sách boss rỗng.
- `executeAttack/applyDamage` không chặn ally damage. Tái hiện đồng minh vẫn nhận 15 damage. Lọc ally ở bước chọn mục tiêu không đủ bảo đảm miễn sát thương.
- Sau tạo liên minh, danh sách enemy đã quét trước đó vẫn có candidate; logic PvP có thể dùng lại danh sách này.

### P2 — Thuộc tính trang bị chưa áp dụng đủ

- Vị trí: `js/entities/combatSystem.js:42–57`; `js/ai/aiBrain.js:168–186`.
- Công thức defense tính giáp thân, bỏ giáp mũ; bonus HP, kháng nguyên tố, hồi sinh và phần lớn nội tại không được thực thi.
- Tái hiện: đội mũ defense 999 và không đội mũ đều nhận 15 damage trong cùng điều kiện không crit.
- Loot không so sánh với trang bị hiện có, có thể thay đồ tốt bằng đồ kém.
- Không có slot giày, vũ khí phụ hoặc cơ chế hoán đổi vũ khí kép.

### P2 — Cảm xúc cập nhật hai lần mỗi tick

- Vị trí: `js/game.js:328–329`; `js/ai/aiBrain.js:16`.
- Game gọi `updatePawnEmotions` → `update`, sau đó AIBrain lại gọi `update` cùng dt.
- Instrument ca thử: 2 lần cập nhật/pawn/update. Không có bộ tích lũy tick 10Hz như đặc tả; cảm xúc/timer breakthrough chạy theo frame và bị nhân đôi.

### P2 — Không kết thúc trận khi không còn bot sống

- Vị trí: `js/game.js:419–421`.
- Chỉ xử lý đúng 1 survivor. Tái hiện tất cả pawn chết: `isGameOver=false`.
- Cần quy định trường hợp không có người thắng; hiện chưa xử lý.

### P2 — Quy tắc địa hình chưa nối vào gameplay

- `MapTerrain.isInWater` và `isOnCliff` được định nghĩa nhưng không được dùng trong phần di chuyển/attack/skill.
- Tái hiện pawn ở tâm vùng nước đi 95 px trong 1s, bằng tốc độ thường 95 px/s; không giảm 50%.
- Combat/skill không kiểm tra cấm đánh khi bơi, đạn không va chạm cây, không cộng tầm nhìn/tầm bắn trên núi. Đốt bụi hiện chỉ được nối qua quyền năng Hỏa Thần, không qua kỹ năng lửa.

## Đối chiếu requirement.md

| Nhóm | Đã có trong source | Phần thiếu hoặc chưa đúng |
|---|---|---|
| Traits → Emotions → Behavior | 5 trait definition, fear/confidence/despair, chọn hành vi theo điều kiện | Chỉ 1 trait/bot thay vì chính + phụ; chưa có chấm điểm Utility đầy đủ; bonus damage brave và ưu tiên build chưa thực thi |
| Cảm xúc | Fear tăng khi nhận damage, confidence khi kill/loot, decay và ngưỡng flee | Thiếu tổng damage theo cửa sổ 1s, debuff kéo dài, truy đuổi >6s, đường cụt, confidence giảm dodge/parry; cập nhật hai lần/frame |
| Breakthrough | Cờ berserk/clutch, timer, mote; clutch tăng tốc và invincible trong damage thường | Kích hoạt chắc chắn khi đủ điều kiện thay vì 1–2%; thiếu +50% tốc đánh, 35% hút máu, CC immunity và spam skill; clutch 3.5s thay vì 3s; timer bị cập nhật kép; zone không kiểm tra invincible |
| Crowd limiter | Branch theo tính cách khi nhìn thấy ≥3 enemy | Đếm enemy trong vision, không đếm cụm 3 bot đang combat bán kính 8m; không có 2 combat slots; không thực hiện chờ HP <20% rồi ăn hôi; có crash mảng quái rỗng |
| Pact of Two | Reference ally, mote bắt tay, công thức phản bội đơn giản | Không kiểm tra khả năng solo boss; không theo dõi boss; không dùng phẩm cấp loot thực tế; thiếu delay cảnh báo 1.5s và cú đánh kết liễu; ally vẫn có thể nhận damage |
| PvE và progression | Spawn quái hữu hạn, death, EXP, tăng HP/attack/defense, level cap 15 | Ưu tiên PvP trước farm; fallback cho phép chọn boss vượt cấp; thiếu AI chống độc/phản damage và nhận diện wind-up/combo; `checkLevelUp` chỉ tăng 1 level/lần gọi dù EXP vượt nhiều ngưỡng |
| Dynamic class/build | Class khóa khi nhặt vũ khí đầu | Chỉ dùng classReq, không cộng điểm trait + equipment; skills ban đầu warrior không đồng bộ class; class stat bonuses chưa áp dụng |
| Paperdoll/animation | Pawn procedural, appearance, vẽ weapon/helmet/armor, animation và VFX | Không có vũ khí phụ/giày và AI đọc trang bị theo yêu cầu; damage cận chiến áp dụng ngay thay vì active frame; renderer Nhân Mã thiếu hàm |
| Terrain | Rừng/bụi, nước, núi, đền được vẽ; vision trong bụi ×0.6 | Thiếu phần lớn luật vật lý/tactical terrain nêu trên |
| Web engine | Canvas 2D và spatial hash cell 64px | Không có Worker, A*, texture atlas, Phaser/Pixi/WebGL; VFX push object mới và splice, không object pool; chưa kiểm chứng 60FPS/300 entities |

Số quái spawn thực tế là **190 = 120 lâu la + 50 yêu thú + 15 yêu tướng + 4 yêu vương + 1 world boss**. `requirement.md` phần gameplay nêu 20–30/15–20/10/4/1, nhưng phần performance lại yêu cầu tải 100 bot + 200 quái. Đây là hai mục tiêu khác nhau cần phân biệt khi chốt cấu hình spawn; source hiện chưa khớp cả số 200 lẫn số lượng gameplay cụ thể.

## Đối chiếu material-game.md

### Danh mục quái

| Pool | Yêu cầu definitions | Source definitions | Quy tắc chọn mỗi trận |
|---|---:|---:|---|
| Lâu la | 10 | 10 | Yêu cầu chọn 8/10; source lấy ngẫu nhiên từng spawn từ cả pool |
| Yêu thú | 10 | 10 | Yêu cầu chọn 6/10; source lấy ngẫu nhiên từng spawn từ cả pool |
| Yêu tướng | 10 | 5 | Yêu cầu chọn 5/10; source thiếu một nửa danh mục |
| Yêu vương | 10 | 4 | Yêu cầu chọn 3/10 loại; source dùng 4 definitions cố định ở 4 góc |
| Yêu thần | 10 | 4 | Có chọn đúng 1 boss/trận, nhưng thiếu 6 definitions |

Tổng **33/50 definitions quái**. SpawnMonster không chuyển passive/skill/combo definition vào entity runtime; updateMonsters dùng một logic chung đi bộ, chase và đánh thường. Vì vậy có tên/mô tả nội tại trong data không đồng nghĩa chúng đã chạy.

### Danh mục kỹ năng

| Nhánh | Active hiện có / 20 | Passive hiện có / 10 |
|---|---:|---:|
| Đấu Sĩ | 10 | 5 |
| Pháp Sư | 7 | 3 |
| Cung Thủ | 5 | 3 |
| Sát Thủ | 5 | 3 |
| Thuật Sĩ | 5 | 3 |
| Tổng | **32/100** | **17/50** |

Có **49/150 definitions kỹ năng**, chứa data Tier 1/2/3. Bot chỉ mở 3 active đầu và nâng chúng tối đa Tier 3. Không học passive, không thi triển active. Player Q/E/R/F hiện dùng chung hiệu ứng damage quanh người bán kính 110, không dispatch theo skill.type, Tier, baseDamage, healing, dash, stun hoặc Risk vs Reward. Slot F không được bộ phân điểm hiện tại mở khóa.

### Danh mục trang bị

| Phẩm cấp | Vũ khí hiện có | Phòng thủ hiện có |
|---|---:|---:|
| Thường | 6 | 2 |
| Hiếm | 5 | 2 |
| Siêu Hiếm | 4 | 2 |
| Cực Phẩm | 4 | 2 |
| Thần Khí | 4 | 1 |
| Tổng | **23** | **9** |

Quy tắc đầu phần 3 ghi 50 vũ khí + 50 phòng thủ **mỗi bậc**; danh sách sau đó gọi là danh mục đại diện và phần thần khí nêu 10 món đặc biệt. Dù diễn giải con số tổng thế nào, source vẫn chỉ là một tập nhỏ, thiếu hoàn toàn giày và nhiều cơ chế trang bị. Cả 4 boss hiện có đều trỏ đến artifact ID tồn tại. Tuy nhiên Archdemon armor bậc god không gắn với boss nào; fallback loot bậc god có thể rơi thêm một món nếu boss thiếu artifact mapping, cần ràng buộc quy tắc độc nhất khi mở rộng data.

## Thứ tự xử lý đề xuất

1. Sửa 3 lỗi P0: build thiếu JS, renderCentaur và AI target undefined; chạy lại dev + preview.
2. Sửa nguồn dữ liệu loot duy nhất, resource cost và đồng bộ class/skills.
3. Nối skill runtime/passive/status effects, ally protection, equipment stats và terrain rules.
4. Hoàn thiện pool tài nguyên theo MD; thống nhất những điểm đặc tả chưa nhất quán.
5. Khi trận chạy hoàn chỉnh mới đo hiệu năng và triển khai Worker/pathfinding/pooling theo nhu cầu thực tế.

Không có test script trong package.json. Không thực hiện kiểm tra lỗ hổng dependency, không cài thêm dependency, không thay đổi gameplay trong đợt audit này. Lệnh build tạo lại thư mục `dist`.
