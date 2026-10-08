# Đợt triển khai skill progression — 08/10/2026

## Trạng thái

Đã triển khai phần lõi và các cơ chế combat dưới đây. Đây là báo cáo tiến độ, **chưa xác nhận mọi nhánh trong toàn bộ plan đã hoàn tất**. Bản thiết kế được duyệt vẫn là skill-progression-rework-plan-2026-10-08.md.

## Đã làm

- Kho 18 nội tại, mỗi nội tại có ba bậc; mở ở cấp 3, một nội tại B1 miễn phí, dùng chung điểm học/nâng với kỹ năng chủ động. Không tự cấp cả bộ ở cấp 15.
- Huyết Thể: hồi combat 0,50/0,75/1,00% HP/s; bùng phát B2 12%/4s dưới 35% HP, B3 24%/3s dưới 40% HP; cooldown 60s, tái nạp sau >60% HP liên tục 8s. Không cứu đòn chí tử, dừng ngoài combat/trong nước, ngân sách clone dùng chung.
- Charge/nhịp riêng cho cơ động, reserve hồi/khiên, giáp một hướng, đọc mẫu đòn, phản công, thoát đường cùng. Thừa Thế kích từ ngắt niệm/phá neo/kết liễu thật; Đọc Nhịp chờ đòn chuẩn bị thứ ba đã quan sát.
- Nối hiệu ứng bậc cao vào gameplay: giáp nứt theo góc, đòn cường hóa hữu hạn charge, lửa/băng có dấu/vùng, bắn thường khi di chuyển sau né, khóa quay guard ngắn khi bị đánh sau lưng, đổi phần hồi chưa dùng thành khiên. Pulse một cast không tiêu nhiều charge.
- Bot có combo ngắn với mục tiêu và hạn thời gian; lý do đầu tư kỹ năng/nội tại và combo hiện trong bảng thông tin. Bot nhìn thấy bình máu hữu ích ngoài combat sẽ tới nhặt và dùng.
- Nhận diện riêng 45 nội tại quái; vùng không gây damage vẫn áp tác dụng slow/pull hợp lệ, không miễn phí vượt giới hạn combat.
- Phượng Hoàng có trứng Niết Bàn một lần: 80 độ bền, countdown 4s, hồi 30% HP nếu trứng sống; phá trứng giết thật, chỉ khi chết thật mới bắt đầu countdown Thượng Cổ.
- Thượng Cổ có HP/ATK/DEF riêng theo hai phase, không còn tăng HP 15 lần cho Mirror. Có neo phá được, tường tạm giới hạn, biến thể acid/lane, phân vai clone, cửa xả nhiệt và lõi Mecha có thể ngắt.

| Boss | HP P1/P2 | ATK P1/P2 | DEF P1/P2 |
| --- | ---: | ---: | ---: |
| Colossus | 650/1700 | 52/78 | 30/15 |
| Mirror | 450/1350 | 44/65 | 12/8 |
| Void | 550/1550 | 48/72 | 18/10 |
| Chaos | 450/1400 | 56/84 | 10/6 |
| Mecha | 500/1500 | 50/75 | 20/10 |

## Lỗi thực tế đã sửa

- Bot giữ đối tượng vừa thành đồng minh trong survival/final-duel khiến nó định đánh nhưng damage bị từ chối.
- Bot giữ chủ Mirror đã phân thân thay vì clone sống còn nhìn thấy.
- Mục tiêu khám phá không tới được bị giữ mãi; nay chọn lại sau số lần phục hồi navigation có giới hạn.
- Acid P2 thêm phần tử vào cùng danh sách đang duyệt, gây vòng lặp/tăng bộ nhớ: xử lý snapshot vùng đang sống và phân biệt acid_pull.
- Các field utility damage=0 bị bỏ qua toàn bộ tác dụng.
- Cast/pulse chưa có ID bị so với cancelledCastId undefined và bị bỏ nhầm; chỉ kiểm tra hủy khi ID có giá trị.

## Kiểm chứng

- Test tự động kiểm tra tiến trình, toàn bộ 32 active ở ba bậc, giới hạn encounter/terrain/resource, countdown, loot, HP phase, 18 nội tại và các regression mới. npm test: 117/117 pass, 0 fail, gồm trận đấu đầy đủ; npm run build thành công; git diff --check không lỗi whitespace.
- Gauntlet source hiện tại: 10 loadout cấp 15/20, 7 thắng đủ năm boss, 3 chết sau hai/ba boss; không stall, không timeout 900s. Các lượt thắng mất 388,2–528,5 giây mô phỏng, gồm thời gian chờ boss. Chi tiết: ancient-rework-loadouts.json.
- Ba seed ở phiên bản trước các chỉnh sửa trigger cuối đều kết thúc, không nhóm combat sai giới hạn. Seed 17 có một cảnh báo: actor đứng đỡ/ra đòn với hai đối thủ, không bị kẹt di chuyển; không gọi đó là lỗi stuck.
- Seed 67 trên source cuối: kết thúc ở 830,5 giây mô phỏng, một bot sống, 0 cảnh báo stuck/dao động và 0 nhóm combat sai luật. Fingerprint SHA-256: ddd12e5006d8287ca4ff22bd2fb3d1cf9318ca263affcf92db8c2c2101f616b7. Chi tiết: match-rework-67.json.
- Trình duyệt Edge chạy source thật, khởi tạo 100 bot/71 quái, không pageerror trong lượt quan sát; ảnh skill-progression-browser.png.
- Mô phỏng hữu hạn không chứng minh mọi seed đều không stuck và kiểm tra catalogue không chứng minh mọi mô tả bậc đều đúng.

## Phần còn phải hoàn thiện/đối chiếu trước khi đóng toàn bộ plan

- Các nhánh B2/B3 của nội tại chưa có đủ mọi lựa chọn trong bảng: cắt dây Tơ Chuyển Vị, Dấu Chân Hàn Phong làm giảm quãng dash, một số charge phản ứng theo cover/đổi mục tiêu.
- Nội tại riêng của từng loài chưa khớp đầy đủ 45 mô tả: neo hồn của lich, cơ chế vỏ cây hấp projectile theo nhịp, nghi lễ/hồn cục bộ của Yêu Thần và các nhánh đặc trưng khác. Không dùng số lượng định nghĩa để coi phần runtime này đã hoàn tất.
- Một số biến thể phase 2 trong plan chưa đủ: ảnh đáp giả Mirror, chuyển rãnh bằng neo thương Chaos, cổng sập trễ/two-lane lava Colossus; các nội tại Thượng Cổ vẫn còn vài tác dụng dùng modifier nền thay cơ chế charge/hướng/nhịp mới.
- Mô tả data đã cập nhật theo thiết kế; cần tiếp tục khớp từng mô tả với runtime và test đối kháng đúng điều kiện, không chỉ test cast có chạy.

Không stage, commit hay push.
