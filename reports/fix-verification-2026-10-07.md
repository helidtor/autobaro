# Kết quả sửa source và kiểm tra lại — 07/10/2026

## Kết quả

Game đã chạy được trên bản dev và bản production trong các ca kiểm tra Edge headless. Không ghi nhận exception JavaScript hoặc HTTP 404 khi nạp game. Ba trận production có seed kết thúc với một người thắng và hiển thị story card.

| Seed | Thời gian trong game | Người thắng | Pawn từng có vũ khí | Tổng lần dùng kỹ năng |
|---|---:|---|---:|---:|
| 42 | 214.5s | Hữu Thắng #35 | 36 | 123 |
| 123 | 126.1s | Khánh Linh #45 | 30 | 57 |
| 987 | 318.3s | Quang Hải #98 | 19 | 76 |

Các trận chạy bằng `GameManager.update(0.1)` trên trình duyệt production, render/HUD mỗi 10 bước để kiểm tra logic và renderer. Đây là thời gian mô phỏng, không phải thời gian chơi thực hoặc phép đo FPS. Mọi tọa độ, HP, stamina và mana của pawn đều hữu hạn, không có NaN. Bản cuối được smoke-test lại trên dev và preview, gồm render vòng bo bán kính 0 và ép Cuồng Nộ.

## Đã sửa

- Thêm entry module `js/main.js`, để Vite bundle toàn bộ script theo thứ tự phụ thuộc. Build cuối tạo JS bundle ~126 kB; không còn cảnh báo classic script không được bundle.
- Bổ sung renderer Nhân Mã; kiểm tra mọi definition quái hiện có không ném exception.
- AI không combat với mục tiêu rỗng/đã chết/đồng minh; không fallback săn boss vượt cấp khi thiếu quái phù hợp.
- Giữ một mảng đồ rơi chung giữa game và EntityManager. Một item chỉ được nhặt một lần, cả player và bot dùng chung hàm loot.
- Không học skill warrior khi chưa khóa class. Mở đủ bốn slot Q/E/R/F; điểm không có nâng cấp được giữ lại thay vì bị mất.
- Dùng chung xử lý kỹ năng cho player và bot: resource cost mặc định 0 nếu không dùng tài nguyên đó, cooldown nhất quán; đọc thông số Tier cho damage, heal, dịch chuyển, buff và một số trạng thái cơ bản. AI đã thực sự gọi skill.
- Liên minh giữ reference đến boss thực tế, không phản bội chỉ vì boss ra khỏi tầm nhìn; kết thúc pact khi boss/ally chết. Tầng damage chặn ally damage.
- Giáp mũ/vũ khí được cộng vào defense; HP/mana trang bị tính theo chênh lệch khi thay đồ. Áo Choàng Niết Bàn hồi sinh một lần qua hàm xử lý death chung.
- Cảm xúc cập nhật một lần khoảng mỗi 0.1s, có chạy cho player; breakthrough ngẫu nhiên 2% cho một lần thử, clutch kéo dài 3s. Nút Cuồng Nộ luôn ép berserk.
- Chậm khi bơi/leo núi; cấm attack/skill khi bơi; timer stun/slow/silence/buff được cập nhật. Tọa độ di chuyển nằm trong giới hạn map.
- Pause ngừng update và thao tác chiến đấu của player. Đồng hồ ngừng sau kết thúc trận. Không còn survivor cũng kết thúc trận và có màn hình chơi lại.
- Bo cuối vẫn gây damage và tiếp tục thu để tránh stalemate; tôn trọng invincible; không render radius âm khi bo nhỏ hơn 4px.

## Kiểm tra tự động có thể chạy lại

```powershell
rtk npm test
rtk npm run build
rtk npm run dev -- --host 127.0.0.1
# Hoặc kiểm tra bản build:
rtk npm run preview -- --host 127.0.0.1
```

`npm test` dùng Node test runner có sẵn, không thêm dependency. **7/7 ca pass**, gồm renderer, loot, class/skill/resource/cooldown/EXP, alliance, equipment/revival, water/pause/emotions/terminal storm, và trận đấu hoàn chỉnh với seed cố định. DOM/Canvas được stub trong các ca Node; browser test độc lập kiểm tra phần UI/render thực tế.

Thao tác production qua Playwright UI đã thử: pause/resume, đổi sang player mode, WASD, Space, Q và thả thính. Thả thính tăng số item 0 → 1; WASD đổi tọa độ; Q giảm stamina, giữ mana hữu hạn và gây damage. Kiểm tra cuối cũng xác nhận Cuồng Nộ và vòng bo radius 0 không gây exception.

## Giới hạn còn lại so với hai file MD

Đợt sửa này khắc phục lỗi vận hành và nối các cơ chế gameplay cơ bản; chưa hoàn thiện toàn bộ nội dung đặc tả. Danh mục vẫn là 33 loại quái, 49 kỹ năng, 23 vũ khí và 9 phòng thủ; chưa có đủ passive runtime, giày/vũ khí kép, combo boss, toàn bộ nội tại vật phẩm và trạng thái nâng cao.

Kỹ năng nhiều nhịp/channel hiện giải quyết thành burst; projectile skill chưa có đầy đủ đường bay/va chạm cây, wind-up, Risk vs Reward, stealth/detection và chuỗi hiệu ứng theo thời gian như MD. Một số skill type ngoài bốn slot đầu chưa hỗ trợ và không tiêu resource khi không thực thi. Điểm vượt khả năng nâng bốn slot được giữ lại, chưa chuyển sang passive.

Chưa triển khai Worker, A*, atlas/pooling hoặc đo đạt 60 FPS. Các ca đã pass xác nhận game hoạt động ở phạm vi kiểm tra, không chứng minh đã hoàn tất toàn bộ đặc tả.

Bằng chứng máy đọc: `fix-test-evidence-2026-10-07.json`. Ảnh chụp production trong ca UI: `game-after-fix.png`. Báo cáo audit cũ được giữ nguyên để đối chiếu trạng thái trước sửa.
