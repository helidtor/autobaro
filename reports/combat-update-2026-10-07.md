# Cập nhật combat và bản đồ — 07/10/2026

## Đã thực hiện

- 10 lối đánh: tay không, kiếm, rìu, búa, thương, dao găm, cung, nỏ, trượng và pháp thư. Lấy đà, ra đòn, thu thế đồng bộ với thời điểm sát thương. Không xoay vũ khí liên tục.
- Đỡ chính diện giảm sát thương; né có dịch chuyển và khoảng tránh sát thương. Đạn giữ hướng ngắm khi lấy đà, có thể trượt nếu đối thủ di chuyển.
- Kỹ năng bot và quái dùng chung bộ xử lý cooldown, tài nguyên và trạng thái. Giới hạn sát thương kỹ năng, chí mạng, thời gian khống chế, tốc độ, bán kính và hồi máu. Nội tại quái có cooldown riêng. Quái không đánh đồng loại.
- VFX: vùng báo đòn có tên kỹ năng, chém, phòng thủ, lướt, hỏa thuật, băng thuật, phép, hồi máu và đường đạn.
- Bản đồ có Thiền Viện Trúc Lâm, Rừng Già Hoang Vu, Dãy Núi Liên Sơn, Sông Hoàng Hà, Kinh Thành, Làng Trúc và Làng Hà. Có mái tầng, tam quan, tường thành, lầu canh, ruộng, giếng, chợ và cầu qua sông.
- Quái đầu trận đúng 20 lâu la / 10 yêu thú / 6 yêu tướng / 3 yêu vương / 1 yêu thần.
- Click quái xem kỹ năng, nội tại và cooldown. Bảng bot có suy nghĩ, mục tiêu, hành động và bình máu. Các số liệu mô tả kỹ năng phản ánh giới hạn đang dùng.
- Khi còn một bot: popup kết quả tạm dừng mô phỏng. Đóng popup hoặc Escape để tiếp tục. Vòng bo dừng; bot ưu tiên Yêu Thần nếu còn sống.
- Loot chỉ từ quái. Ba bậc đầu có xác suất 20% / 30% / 40%, mỗi lần đúng một bình hoặc một trang bị/vũ khí. Hai bậc cuối có xác suất 100%, đúng một bình và một trang bị/vũ khí.
- Bỏ hòm thính và đồ từ bot chết. Không có loot ngẫu nhiên đầu trận.
- Không hồi HP thụ động. Trang bị tăng HP tối đa không chữa HP hiện tại. Hồi bằng lên cấp, uống bình hoặc hiệu ứng kỹ năng/nội tại hồi máu.
- Điều khiển: WASD di chuyển, chuột trái đánh, Q/E/R/F kỹ năng, Shift đỡ, Space né, H uống bình, M bản đồ toàn cảnh.

## Kiểm chứng

- `npm test`: **17/17 passed**.
- `npm run build`: **passed** (Vite production).
- Microsoft Edge headless: click thật trên canvas xác nhận thông tin quái và bot; click thật nút đóng popup; thử bàn phím Shift / Space / H / M.
- Ba trận production với seed 42, 2026, 7: đều tìm được một người sống sót, đóng popup tiếp tục được, mục tiêu là Yêu Thần còn sống, không có lỗi JavaScript, trạng thái số hữu hạn.
- Thời gian tìm người sống sót lần lượt khoảng 256s, 294s, 276s mô phỏng.
- Kiểm tra hình ảnh bản đồ, bảng thông tin và tư thế chiến đấu từ renderer thật.

## Giới hạn kiểm chứng

Cân bằng hiện dựa trên giới hạn định lượng và các trận mô phỏng, chưa thay thế chơi thử dài hạn. Trong cả ba seed production, người sống sót tiếp tục hành trình nhưng bị hạ khi đối đầu lực lượng quái; Yêu Thần vẫn sống. Chiến thắng sinh tồn không bảo đảm chiến thắng boss. Loot thấp theo đúng yêu cầu khiến nhiều bot không kiếm được vũ khí.

Các kỹ năng quái được chuẩn hóa thành đòn theo vùng/hướng với thời gian báo đòn và hiệu ứng giới hạn; kỹ năng mang tên triệu hồi không sinh thêm quái, giữ cơ cấu số lượng đã yêu cầu.

## Bằng chứng

- [Dữ liệu test trình duyệt](combat-test-evidence-2026-10-07.json)
- [Bản đồ](combat-map-2026-10-07.png)
- [Kỹ năng quái](monster-skills-2026-10-07.png)
- [Popup kết quả](result-popup-2026-10-07.png)
