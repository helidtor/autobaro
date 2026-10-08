# Chuỗi Thượng Cổ, Thượng Bảo và hào quang — 08/10/2026

## Đã triển khai

- Hạ Yêu Thần mở chuỗi đủ 5 boss riêng biệt, boss đầu ngẫu nhiên. Mỗi boss giữ hai thanh HP; sau thanh thứ hai rơi đúng một Thượng Bảo không lặp. Boss kế tiếp xuất hiện sau 10 giây mô phỏng; pause dừng đếm. Kết thúc khi vượt đủ năm boss hoặc người sống sót tử trận.
- Thế giới sụp đổ trong 6 giây, còn đấu trường **1500 × 1500** theo yêu cầu mới nhất, thay cho 500 × 500. Biên di chuyển, đường đi, sấm sét, vùng cảnh báo và camera dùng kích thước mới. Có tám tàn tích vật lý để chắn đòn; không còn chịu nước, bụi hay tường điện thờ cũ. Phân thân và lướt vẫn bị chặn ở biên; giữ giới hạn combat.
- Đủ 10 Thượng Bảo từ [bản thiết kế](ancient-relics-design-2026-10-08.md): thêm ô giày, kháng phép, hiệu ứng có điều kiện và cooldown; khiên, lướt, ảo ảnh, đổi nguyên tố, bẫy lửa, điểm yếu, tia phép bám đuổi, giảm khống chế, hồi phục nano và nhẫn tích năng lượng tác động lên combat thật.
- AI ưu tiên nhặt Thượng Bảo, dành tối thiểu 1,5 giây thích ứng; không thay bằng đồ bậc thấp hơn. Giày phản lực tăng lựa chọn né, giáp đá hỗ trợ áp sát; giữ kỹ năng đã học khi đổi vũ khí. Trang bị/vũ khí có viền vàng, hạt sáng và vệt đánh riêng.
- Hào quang cấp 10 là các dải năng lượng vàng cong với lõi trắng; cấp 15 trở lên thêm tím bạc, cyan và điện zíc zắc theo ảnh mẫu. Vẽ bằng Canvas, không thêm thư viện hay ảnh nền caro.
- Yêu Thần chết sớm khi còn nhiều bot không kéo cả trận vào đấu trường: đợi người sống sót đạt cấp 15 và dọn hết Yêu Vương lượt farm cuối. Ván mới xóa trạng thái đấu trường, chuỗi và danh sách đồ đã rơi.

## Diễn giải thông số

Nhẫn chiếm ô mũ (thiết kế cho phép mũ hoặc giày). Ba tia phép Thiên Thư gây tổng 150% ATK trước kháng phép để hạn chế dồn sát thương quá mức; hệ thống dùng ATK chung cho vũ khí và pháp khí. Một mét tương ứng 20 đơn vị bản đồ. Không thêm miễn nhiễm vĩnh viễn hoặc hồi phục vô hạn.

## Kiểm chứng

- `npm test`: **96/96 pass**, gồm một trận seed hoàn chỉnh, 30 chiêu Thượng Cổ, hai phase, năm boss không lặp, thời gian nghỉ, số lượng loot, mười hiệu ứng trang bị, biên 1500 × 1500 và phân thân tối đa ba thực thể cùng bot.
- Test tập trung sau tinh chỉnh hào quang cuối: **5/5 pass**. `npm run build` thành công; `git diff --check` sạch.
- Edge headless chạy bản production: test luồng có chủ động kết liễu từng thanh HP và hồi HP bot giữa lượt, nhưng AI tự di chuyển và nhặt đồ. Đủ năm boss, năm món khác nhau đều nhặt được, popup thắng đúng; không NaN, vượt biên, vi phạm giới hạn combat hay lỗi JavaScript. Đây là kiểm chứng tiến trình, **không chứng minh bot tự thắng chuỗi boss**.
- Đã chạy combat thực với bot cấp 24/trang bị Yêu Thần trước đó: bot có thể thua Zero Protocol; chưa đo tỷ lệ thắng tự nhiên qua nhiều seed. Giữ sức mạnh nền của các boss, không bảo đảm mọi người sống sót đều chinh phục được chuỗi.
- Đã xem trực tiếp [ảnh đấu trường](ancient-gauntlet-2026-10-08.png) và [ảnh hào quang](ancient-energy-auras-2026-10-08.png).

Không stage, commit hoặc push source.
