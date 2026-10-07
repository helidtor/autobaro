# Luật PvP, địa hình và AI — 07/10/2026

## Đã cập nhật

- Bot hạ bot: 50% lên ngay một cấp, 50% rơi đúng một trang bị/vũ khí. Bot cấp 15 luôn rơi đồ. Quái hoặc người chơi điều khiển kết liễu không nhận phần thưởng đặc biệt này.
- Khi rơi đồ: 80% cùng bậc, 20% cao hơn một bậc; bậc Thần Khí giữ nguyên khi đã chạm trần. Lấy bậc cao nhất trong vũ khí, giáp và mũ hiện có của người tử trận; tay không, không trang bị tính là bậc Thường.
- Các cuộc đấu sát nhau cùng chịu giới hạn tối đa 3 thành viên. Chỉ hai cặp liên minh hai chiều được tạo nhóm 4 thành viên. Giới hạn kiểm tra tại lúc bắt đầu đòn và gây sát thương, gồm cả kỹ năng diện rộng.
- Bản đồ từ 2600×2600 thành 5200×5200. Nhà, tường thành, tường thiền viện, cột cổng, hàng rào, giếng, thân cây và mặt đá có vùng va chạm. Vẽ và va chạm dùng cùng hệ tọa độ.
- Đi bộ, truy đuổi, di chuyển người chơi, né/lướt và đạn đều kiểm tra vật cản. AI tìm đường trên lưới, không cắt góc qua tường; ưu tiên đường đất và cầu, chỉ tìm đường có nước nếu đường khô không tồn tại.
- Trong sông không đánh, thi triển kỹ năng, đỡ, né hoặc uống bình; không gây sát thương lên người đang bơi. Tốc độ bơi là 45% tốc độ di chuyển; cầu tính là đường khô.
- Bỏ giai đoạn theo thời gian. Còn 20/10/5 bot thì vùng an toàn thu còn 50%/25%/10% diện tích toàn bản đồ, nội suy trong 15 giây. Không thu thêm khi chờ lâu; sau kết quả sinh tồn vẫn dừng bo như trước.
- Camera: kéo chuột trái hoặc WASD/phím mũi tên trong chế độ quan sát, hoạt động cả lúc tạm dừng. Click không kéo vẫn mở thông tin. Trong chế độ người chơi, WASD điều khiển bot.
- Thanh công cụ có nút Ván mới: reset trận ngay tại chỗ, gồm bot, quái, loot, bo, camera, hiệu ứng, bảng thông tin, popup và chế độ điều khiển.
- Bảng bot hiển thị EXP trong cấp, EXP cần thiết và EXP còn thiếu; cấp 15 hiển thị đã đạt cấp tối đa.
- Giảm HP, sát thương và giáp lâu la/yêu thú. Kiểm tra đối đầu xác nhận bot tay không cấp 1 hạ được tất cả lâu la, bot tay không cấp 3 hạ được tất cả yêu thú trong điều kiện đấu kiểm soát.
- Cấp 10 có hào quang vàng; cấp 15 đổi tím bạc với tia điện. Có biểu cảm đau, tập trung, sợ, tuyệt vọng, tự tin và biểu tượng cảm xúc.
- AI dùng mục tiêu di chuyển bền vững, tìm mục tiêu sống để tiếp cận, làm mới đường khi bị chặn và giới hạn việc trốn tại một chỗ. Liên minh không phản bội có thể tồn tại sau khi hạ boss để đấu cặp khác; liên minh hai người cuối cùng giải tán để trận sinh tồn có kết quả.
- Người sống sót giữ mục tiêu Yêu Thần ngay cả khi cần chờ cụm combat mở chỗ.

## Kiểm chứng

- `npm test`: **29/29 passed**.
- `npm run build`: **passed**.
- Microsoft Edge headless, bản production: thử kéo chuột thật, WASD, click thông tin EXP và click Ván mới.
- Ba seed 42 / 2026 / 7: tìm được một người sống sót sau khoảng 118 / 92 / 156 giây mô phỏng; không lỗi JavaScript, không có thực thể sống xuyên vào vật cản, dữ liệu số hữu hạn.
- Nhóm giao tranh thường không vượt 3. Tình huống dựng hai cặp liên minh: cả bốn ra đòn được, cùng nhóm 4 và đều nhận sát thương thật.
- Thời gian xử lý logic ở 95% lượt cập nhật khoảng 6–7,2 ms trong các lượt đo. Đây là thời gian cập nhật logic, không phải số đo FPS toàn bộ render.
- Đóng popup vẫn tiếp tục trận và giữ mục tiêu Yêu Thần.

## Giới hạn

Các bài đối đầu quái kiểm soát không mô phỏng mọi tình huống né, địa hình và cảm xúc. Ba người sống sót trong các seed được thử vẫn bị hạ trong phần tiếp diễn, Yêu Thần còn sống. Các trận mẫu đạt cấp cao nhất 5–6; hào quang cấp 10/15 đã kiểm tra riêng bằng renderer thật.

## Bằng chứng

- [Dữ liệu kiểm chứng](world-rules-evidence-2026-10-07.json)
- [Bản đồ mở rộng](physical-map-2026-10-07.png)
- [Hào quang và biểu cảm](level-auras-2026-10-07.png)
