# Sinh cảnh, sào huyệt, tính cách và lượt farm cuối — 07/10/2026

## Luật hiện tại

- Khởi đầu: 100 bot quanh rìa bản đồ; 40 Lâu La chia 16 bầy (8 bầy 3, 8 bầy 2), 20 Yêu Thú đơn lẻ, 6 Yêu Tướng, 4 Yêu Vương, 1 Yêu Thần.
- Loài quái có sinh cảnh cố định: đồng cỏ, rừng già, núi đá, phế tích, làng mạc hoặc đầm lầy. Không sinh vị trí tự do rồi đuổi xuyên bản đồ; di chuyển và gây sát thương đều bị giới hạn theo lãnh địa.
- Bốn sào huyệt đối xứng: Viêm Ma Điện, Kim Cương Sơn, Thanh Xà Đầm, Vong Hồn Thành. Sáu Yêu Tướng canh bên ngoài, phân bổ 1–2 chốt mỗi sào huyệt. Trong điện thờ chỉ có Yêu Thần.
- Mỗi bot chỉ giao chiến với tối đa một Yêu Tướng tại một thời điểm. Khóa kiểm tra ở lúc giữ chỗ combat, đánh thường, dùng phép và gây sát thương; hết giữ chỗ khi ngừng giao chiến.
- Quái có nhịp phép chung tối thiểu 3 giây, đồng thời vẫn giữ cooldown riêng từng kỹ năng.
- Bản đồ có cổng, tường, trụ, kiến trúc sào huyệt, điện thờ, phố chợ, chốt gác và sinh cảnh dã ngoại. Tường/trụ/cây/đá chặn di chuyển và đường đánh; bụi giảm 15% sát thương từ xa; địa hình cao tăng 10% sát thương xuống thấp và giảm tốc; đầm lầy giảm tốc 20%. Sông giữ luật không combat, bơi chậm và ưu tiên cầu.
- Bot có tính cách chính/phụ và sáu chỉ số riêng 5–95: hiếu chiến, thận trọng, tham vọng, trung thành, kiên nhẫn, khám phá. Các chỉ số ảnh hưởng lựa chọn con mồi, cơ hội PvP, loot, phản ứng phòng thủ, bọc sườn, liên minh/phản bội và thời gian giữ kế hoạch.
- AI dự đoán lợi thế từ HP, ATK, DEF, vũ khí, kỹ năng và bình máu; chỉ săn bậc phù hợp. Bot yếu tìm đường tránh sào huyệt và điện thờ. Rút lui tốn thể lực để không chạy mãi.
- Bảng thông tin có ATK/DEF thực chiến, tốc độ, tầm đánh, chí mạng, sáu chỉ số tính cách, suy nghĩ, mục tiêu, EXP và cooldown.
- Bot hạ bot: luôn một món. 75% vũ khí đang cầm, 25% ngẫu nhiên cao hơn một bậc; không có vũ khí dùng giáp/mũ, tay không nhận Thường/Hiếm; tối đa Thần Khí. EXP bằng 60 × cấp nạn nhân; không tặng một cấp tự động. Quái hoặc người chơi điều khiển không tạo món thưởng này.
- Đóng popup người sống sót: xóa quái bậc 1–4, sinh năm Yêu Vương khác loài ở năm nơi (bốn sào huyệt và Thiết Giáp Đài). Có Thiết Giáp Tê Ngưu Vương với hình vẽ và bộ chiêu riêng. Chúng tăng sức theo thứ tự và sức người sống sót; tổng EXP của năm con đủ đạt cấp 15 khi hạ hết.
- Người sống sót chỉ chủ động chọn Yêu Thần từ cấp 15. Sào huyệt đã hạ boss mở đường nhặt đồ; đồ rơi nằm trên ô đứng được. Ván mới phục hồi đúng trạng thái ban đầu, không giữ lượt farm cũ.

## Kiểm chứng

- Bộ test Node.js: 38 bài, gồm cả mô phỏng trận đủ, combat farm cuối thật, giới hạn bầy/sinh cảnh, ba seed khởi tạo, khóa Yêu Tướng, nhịp phép chung và lỗi loot trong sào huyệt trống. Kết quả chạy cuối: **38/38 passed**, không bài thất bại.
- Build Vite production thành công.
- Microsoft Edge production, seed 42: một người sống sót sau khoảng 295 giây mô phỏng; không lỗi JavaScript, không xuyên vật cản, không quái ra khỏi sinh cảnh, cụm thường tối đa 3.
- Khoảng cách nhỏ nhất giữa hai lần dùng phép quái được quan sát là 3,5 giây. Các điểm biên 3 giây có kiểm thử riêng.
- Người sống sót Hải Yến #49 từ cấp 6 đã hạ cả năm Yêu Vương farm, đạt cấp 15, rồi mới chọn Yêu Thần. Không chọn Yêu Thần sớm. Sau đó hạ được Yêu Thần trong trận mẫu này.
- Click nút Ván mới thật trên trình duyệt reset về 100 bot, 71 quái, 4 sào huyệt, lượt farm chưa bắt đầu.
- Đo logic trong lượt chạy mẫu: p95 khoảng 25,7 ms và p99 51,8 ms. Đây không phải FPS render; vẫn có khung xử lý tìm đường chậm, đặc biệt khi nhiều bot đổi đường cùng lúc.

## Giới hạn kiểm chứng

Kết quả combat phụ thuộc seed, cảm xúc, đồ rơi và tình huống. Một trận production đầy đủ xác nhận được cả tiến trình farm và hạ Yêu Thần; không bảo đảm mọi người sống sót đều thắng. Tường và công trình có va chạm, chưa có phá hủy kiến trúc.

## Bằng chứng

- [Dữ liệu chạy thật](habitat-ai-evidence-2026-10-07.json)
- [Map và phân bố quái](habitat-map-2026-10-07.png)
- [Lượt farm năm Yêu Vương](final-hunt-map-2026-10-07.png)
- [Chỉ số và tính cách bot](bot-personality-stats-2026-10-07.png)
