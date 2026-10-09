# AutoBaro — dữ liệu đang có trong game

Danh mục này khớp `js/data/` và cách `entityManager` đưa vào trận. Máu, tấn công và giáp ở bảng quái là chỉ số sau hệ số sinh, không phải số gốc trong file. Luật trận, AI và loot nằm ở [requirement.md](requirement.md).

Hệ số sinh theo bậc: Lâu La máu ×0,5, tấn công ×0,45, giáp ×0,55. Yêu Thú máu ×0,5, tấn công ×0,4, giáp ×0,55. Yêu Tướng máu ×0,7, tấn công ×0,65. Yêu Vương máu ×0,65, tấn công và giáp giữ nguyên. Yêu Thần máu ×0,45, tấn công và giáp giữ nguyên, EXP trong trận là 10.000.

## 1. Quái

Đủ loài dưới đây xuất hiện mỗi trận. Không còn pool “chọn 8/10” hay “chọn 1/10 trong mười Yêu Thần”.

### Lâu La

Không có chiêu. Tám mươi con: tám bầy bốn con và mười sáu bầy ba con.

| Tên | Sinh cảnh | Máu | Tấn công | Giáp | EXP |
| --- | --- | ---: | ---: | ---: | ---: |
| Thỏ Gai | Đồng cỏ | 43 | 6 | 1 | 35 |
| Chuột Hầm Ngục | Làng | 45 | 5 | 2 | 30 |
| Goblin Cầm Gậy | Làng | 60 | 7 | 3 | 40 |
| Khỉ Đá Rừng Rậm | Rừng | 55 | 7 | 3 | 42 |
| Khung Xương Rỉ Sét | Phế tích | 65 | 8 | 4 | 45 |
| Nhện Đất Nhỏ | Núi | 48 | 8 | 2 | 38 |
| Bọ Cánh Cứng Bọc Giáp | Núi | 75 | 7 | 9 | 45 |
| Thây Ma Rách Rưới | Phế tích | 90 | 9 | 4 | 48 |
| Rắn Cỏ Đồng Cỏ | Đồng cỏ | 40 | 9 | 2 | 36 |
| Sói Hoang Đói Ăn | Rừng | 58 | 8 | 3 | 44 |

Rơi phẩm Thường.

### Yêu Thú

Một nội tại loài, không chiêu chủ động. Mỗi loài bốn con, đi một mình hoặc thành cặp. Rơi phẩm Hiếm.

| Tên | Sinh cảnh | Máu | Tấn công | Giáp | EXP | Nội tại |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Heo Rừng Gai Bọc Sắt | Rừng | 160 | 11 | 11 | 90 | Gai Phản Phệ |
| Mãng Xà Đầm Lầy | Đầm lầy | 130 | 13 | 7 | 95 | Vết Đớp Kịch Độc |
| Cóc Lửa Nham Thạch | Núi | 150 | 10 | 10 | 92 | Tàn Nham Bốc Cháy |
| Hắc Báo Ám Ảnh | Rừng | 120 | 15 | 8 | 100 | Săn Mồi Vô Tích |
| Gấu Băng Bắc Địa | Núi | 190 | 12 | 14 | 105 | Hàn Khí Cực Hạn |
| Dơi Quỷ Hút Máu | Phế tích | 110 | 14 | 6 | 92 | Hút Máu Tươi |
| Nhện Bẫy Cát | Đồng cỏ | 135 | 12 | 9 | 96 | Mạng Tơ Ràng Buộc |
| Cua Đá Cổ Đại | Đầm lầy | 210 | 9 | 19 | 100 | Vỏ Hóa Thạch |
| Sói Đầu Đàn Xám | Rừng | 155 | 14 | 10 | 105 | Tiếng Hú Thúc Ép |
| Ma Cây Rừng Già | Rừng | 225 | 10 | 13 | 110 | Hấp Thụ Thổ Nhưỡng |

Nội tại có cooldown, dấu tích và cửa hóa giải. Ví dụ nọc mãng xà tối đa ba dấu, tơ nhện đặt trên đất sau ba đòn và có thể cắt, báo săn mồi chỉ tính khi xuất kích từ bụi lúc chưa bị thấy. Text hiển thị lấy từ `speciesPassives` trong `monstersData.js`.

### Yêu Tướng

Năm loài, sáu con canh ngoài sào huyệt. Một nội tại và hai chiêu. Nhịp chung 3 giây. Rơi phẩm Siêu Hiếm.

| Tên | Sinh cảnh | Máu | Tấn công | Giáp | EXP | Chiêu |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Đao Phủ Đoạt Mệnh | Núi | 630 | 36 | 35 | 250 | Chém Bổ Đầu, Xoay Rìu Cuồng Bạo |
| Xà Tinh Đầm Lầy | Đầm lầy | 525 | 39 | 28 | 240 | Phun Axit Ăn Mòn, Đuôi Quét Sấm Sét |
| Thống Lĩnh Nhân Mã | Đồng cỏ | 616 | 34 | 32 | 260 | Mũi Tên Xuyên Phá, Xung Phong Rung Chuyển |
| Hắc Vu Cốt Tinh | Phế tích | 476 | 44 | 22 | 250 | Cầu Lửa Hắc Ám, Vòng Khống Chế Địa Ngục |
| Tướng Quân Khỉ Đột | Rừng | 735 | 38 | 40 | 270 | Đập Đất Liên Hoàn, Ném Tảng Đá Lớn |

Nội tại lần lượt: Lưỡi Đao Tàn Tạ, Thân Thể Trơn Trượt, Chiến Ý Bất Bại, Linh Hồn Hộ Mệnh, Da Dày Thịt Béo. Chiêu đi qua hình thật trong combat: đường, nón, vòng, đạn, lướt, hố. Có báo vùng trước khi trúng.

### Yêu Vương

Đúng bốn con, mỗi con một sào huyệt. Nhịp chung 3 giây. Rơi một bình và một món Cực Phẩm.

| Tên | Sào huyệt | Máu | Tấn công | Giáp | EXP | Chiêu |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Viêm Ma Bạo Chúa | Viêm Ma Điện | 1560 | 90 | 50 | 600 | Hỏa Trụ Tận Thế, Đập Búa Nham Thạch, Gầm Thét Hủy Diệt |
| Cuồng Bạo Kim Cương Vương | Kim Cương Sơn | 1820 | 95 | 55 | 620 | Ném Cự Thạch Hủy Diệt, Nhảy Bổ Nghiền Nát, Đấm Loạn Xạ 8 Nhịp |
| Thanh Xà Đế Vương | Thanh Xà Đầm | 1430 | 85 | 45 | 590 | Tam Đầu Phun Nọc, Quấn Quít Bóp Nghẹt, Độn Thổ Xuất Kích |
| Lãnh Chúa Xương Vong Hồn | Vong Hồn Thành | 1300 | 105 | 40 | 610 | Băng Phong Bão Tố, Xiềng Xích Linh Hồn, Tiếng Thét Đoạt Mệnh |

Mỗi con còn hai nội tại cùng tên với dữ liệu gốc. Combo ghi trong data là gợi ý chọn chiêu của boss, không phải script cưỡng bức ba chiêu liên tiếp.

### Yêu Vương lượt farm cuối

Thiết Giáp Tê Ngưu Vương chỉ xuất hiện ở lượt này, cùng bốn Yêu Vương ở trên. Chiêu: Thiết Giáp Xung Phong, Địa Chấn Thiết Đề, Gầm Thét Sơn Hà. Nội tại: Thiết Giáp Hộ Thể, Ý Chí Sơn Vương. Máu, tấn công và EXP bị chỉnh lại theo người sống sót trước khi trận farm bắt đầu. Tấn công các Yêu Vương lượt này bị kẹp trong khoảng 60–80.

### Yêu Thần

Mỗi trận một con ngẫu nhiên trong bốn loài sau, tại điện thờ. Nhịp chung 2 giây. Hạ gục thưởng 10.000 EXP. Trận chưa có Quỷ Vương rơi một bình, vũ khí Thần Khí của loài, một thân Thần Khí và một mũ Thần Khí. Thân và mũ rút trong ba hướng nặng, pháp và nhẹ. Trận đã có Quỷ Vương thay bộ đó bằng một vũ khí Thượng Cổ, một giáp thân Thượng Cổ và ba bình thường.

| Tên | Máu | Tấn công | Giáp | Vũ khí rơi |
| --- | ---: | ---: | ---: | --- |
| Thái Cổ Hỗn Độn Ma Long | 2925 | 160 | 75 | Long Thương Hỗn Độn Tận Thế |
| Viêm Đế Phượng Hoàng | 2610 | 175 | 65 | Cung Thần Mặt Trời Thái Dương |
| Tru Tiên Thần Cây Cổ Đại | 3600 | 140 | 90 | Quyền Trượng Cổ Đại Yggdrasil |
| U Minh Diêm La Vương | 2790 | 165 | 70 | Sổ Sinh Tử Diêm La |

Năm chiêu của từng loài giữ tên trong data: Ma Long có Long Tức, Bão Tố Hư Vô, Thiên Thạch, Đóng Băng Thời Gian, Cánh Quạt. Phượng Hoàng có Biển Lửa, Lặn Lao, Tiếng Ca, Bão Cánh, Tự Bạo; chết lần đầu thành trứng 4 giây rồi sống lại 30% máu đúng một lần. Thần Cây có Rễ, Mưa Gai, Đập Cành, Bào Tử, Rút Sinh Lực. Diêm La có Trát Tử Hình, Phán Quyết, Quỷ Binh, Cầu Vồng Âm Ti, Xích Ngũ Mã. Sáu loài Yêu Thần khác trong bản thiết kế cũ không có trong trận.

## 2. Kỹ năng bot

Ba mươi hai kỹ năng chủ động, mỗi kỹ năng ba bậc. Mọi bot học được mọi kỹ năng. Không khóa năm nhánh và không giới hạn bốn kỹ năng cho AI. Bốn phím Q E R F của người chơi chỉ gọi bốn kỹ năng đầu trong danh sách đã học.

Điểm kỹ năng tiêu theo sở thích cá nhân: học rộng hoặc nâng sâu, xác suất lệch bởi khám phá và kiên nhẫn. Đến cấp 3, bot được tặng ngẫu nhiên một nội tại tiến trình, rồi có thể học và nâng nốt các nội tại còn lại.

Sát thương không còn là một hệ số nhân thẳng vào ATK. Mỗi bậc có nền cộng tỷ lệ một chỉ số, rồi bị trần. Một lần thi triển có ngân sách sát thương chung cho mọi nhịp. Cooldown giảm 0,5 giây mỗi bậc, không dưới 6 giây. Chi phí thể lực hoặc mana tăng 2 mỗi bậc.

### Cận chiến — thể lực

| Kỹ năng | Vai trò | Hồi chiêu | Tầm |
| --- | --- | ---: | ---: |
| Chém Sấm Sét | Đánh | 8s | 60 |
| Khiên Chắn Cương Bộc | Khống chế | 10s | 95 |
| Lốc Kiếm | Đánh | 12s | 75 |
| Xung Phong Phá Trận | Đánh | 11s | 110 |
| Hơi Thở Thứ Hai | Hồi máu | 22s | Bản thân |
| Bổ Kết Liễu | Kết liễu | 14s | 65 |
| Địa Chấn | Khống chế | 11s | 70 |
| Bức Tường Sắt | Phòng thủ | 16s | Bản thân |
| Đâm Xuyên Giáp | Đánh | 9s | 80 |
| Phản Kiếm | Phòng thủ | 13s | Bản thân |

### Phép — mana

| Kỹ năng | Vai trò | Hồi chiêu | Tầm |
| --- | --- | ---: | ---: |
| Hỏa Cầu | Đánh | 10s | 190 |
| Băng Tiễn | Khống chế | 9s | 190 |
| Thiểm Di | Cơ động | 12s | Bản thân |
| Vòng Xoáy Trọng Lực | Khống chế | 14s | 150 |
| Khiên Năng Lượng | Phòng thủ | 17s | Bản thân |
| Thiên Thạch | Đánh | 18s | 180 |
| Giáp Băng | Phòng thủ | 20s | Bản thân |

### Xạ kích — thể lực

| Kỹ năng | Vai trò | Hồi chiêu | Tầm |
| --- | --- | ---: | ---: |
| Liên Tiễn | Đánh | 9s | 210 |
| Lùi Bắn | Cơ động | 11s | 180 |
| Mưa Tên | Đánh | 15s | 200 |
| Ngắm Bắn | Đánh | 17s | 240 |
| Bước Chân Gió | Cơ động | 14s | Bản thân |

### Ám sát — thể lực

| Kỹ năng | Vai trò | Hồi chiêu | Tầm |
| --- | --- | ---: | ---: |
| Ảnh Bộ | Đánh | 13s | 130 |
| Biến Mất | Cơ động | 19s | Bản thân |
| Cắt Yết Hầu | Khống chế | 13s | 55 |
| Bom Khói | Cơ động | 17s | Bản thân |
| Ám Sát | Kết liễu | 18s | 70 |

### Hỗ trợ

| Kỹ năng | Tài nguyên | Vai trò | Hồi chiêu | Tầm |
| --- | --- | --- | --- | ---: |
| Chuyển Thế Vũ Trang | Thể lực | Cường hóa | 15s | Bản thân |
| Lưỡi Kiếm Linh Lực | Mana | Cường hóa | 12s | Bản thân |
| Linh Khí Hồi Phục | Mana | Hồi máu | 20s | 120 |
| Phong Thể | Mana | Cơ động | 15s | Bản thân |
| Hỗn Mang Tiễn | Mana | Khống chế | 11s | 190 |

Bậc 2 và 3 thêm hiệu ứng có cửa hóa giải: ngắt niệm, phá giáp, vệt chậm, ảnh giả, khói cắt tầm nhìn, bonus kết liễu chỉ khi mục tiêu dưới 30% máu. Mô tả từng bậc nằm trong `skillsData.js`.

### Nội tại tiến trình

Mười tám nội tại, ba bậc. Engine có trigger cho cả mười tám.

- Cơ động: Bước Chuyển Thế, Lướt Theo Khe, Ảnh Bộ Phục Kích, Dấu Chân Hàn Phong, Tơ Chuyển Vị, Dư Ảnh Đổi Hướng.
- Sinh tồn: Dưỡng Huyết, Thiết Giáp Linh Hoạt, Sinh Cơ, Hộ Thể, Huyết Thể, Đường Sống Cuối.
- Đột biến: Chấn Thế Phản Kích, Nọc Suy Kiệt, Tàn Hỏa Bộc Phát, Bản Năng Đường Cùng, Đọc Nhịp Đối Thủ, Thừa Thế Đổi Nhịp.

## 3. Trang bị thường

Năm bậc: Thường, Hiếm, Siêu Hiếm (`super_rare`), Cực Phẩm, Thần Khí. Mỗi bậc vũ khí giữ một loại hình. Mỗi bậc giáp có thân và mũ nặng, pháp, nhẹ. Áo Choàng Niết Bàn là thân hồi phục bậc Cực Phẩm. Không có bộ 50 món hay giày theo bậc. Ô giày chỉ xuất hiện ở Thượng Bảo.

Combat cộng `attack` của vũ khí thường. Không còn trần 65. `skillPower` chỉ vào phép, không vào đòn thường. Thượng Cổ vẫn cộng đủ `attack` hoặc `magicPower` vào đòn thường, và `magicPower` vào sức kỹ năng. Chí mạng trần 50%, sát thương chí mạng ×1,35. Hồi chiêu đánh thường vẫn sàn 0,7 giây. `moveBonus` trên mọi ô đổi tốc chạy. `ccImmunity` trên Long Thương chặn khống chế. Áo Choàng Niết Bàn sống lại một lần với 20% máu và hồi thêm 1,4 HP/giây.

### Vũ khí

| Bậc | Tên | Dạng | Công | Sức kỹ năng | Chí mạng | Tốc | Tầm |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| Thường | Rìu Gỗ Gãy | Rìu | 17 | 0 | 0 | 0,75 | 42 |
| Thường | Kiếm Sắt Rỉ Sét | Kiếm | 13 | 0 | 5% | 1,00 | 40 |
| Thường | Que Đũa Phép Tre | Trượng | 6 | 14 | 0 | 0,95 | 100 |
| Thường | Cung Cành Tre | Cung | 12 | 0 | 8% | 1,10 | 130 |
| Thường | Dao Găm Rỉ Sét | Dao | 8 | 0 | 22% | 1,35 | 28 |
| Thường | Gậy Ngắn Đa Năng | Hỗn hợp | 8 | 8 | 0 | 1,05 | 35 |
| Hiếm | Kiếm Thép Luyện Rắn | Kiếm | 24 | 0 | 5% | 1,00 | 40 |
| Hiếm | Trượng Thủy Tinh Xanh | Trượng | 11 | 25 | 0 | 0,95 | 108 |
| Hiếm | Cung Sừng Hươu Nặng | Cung | 20 | 0 | 8% | 1,10 | 150 |
| Hiếm | Dao Găm Răng Cưa | Dao | 15 | 0 | 22% | 1,35 | 28 |
| Hiếm | Kiếm Ngắn Phép Thuật | Kiếm | 13 | 13 | 0 | 1,10 | 36 |
| Siêu Hiếm | Rìu Chiến Chém Thép | Rìu | 48 | 0 | 0 | 0,75 | 42 |
| Siêu Hiếm | Gậy Băng Trụ Vĩnh Cửu | Trượng | 17 | 39 | 0 | 0,95 | 112 |
| Siêu Hiếm | Cung Bão Tố Tật Phong | Cung | 32 | 0 | 8% | 1,10 | 170 |
| Siêu Hiếm | Dao Găm Răng Rắn Kịch Độc | Dao | 23 | 0 | 22% | 1,35 | 28 |
| Cực Phẩm | Rìu Hủy Diệt Của Viêm Ma | Rìu | 69 | 0 | 0 | 0,75 | 42 |
| Cực Phẩm | Trượng Hắc Báo Phẫn Nộ | Trượng | 24 | 56 | 0 | 0,95 | 116 |
| Cực Phẩm | Cung Bão Tố Ưng Vương | Cung | 46 | 0 | 8% | 1,10 | 185 |
| Cực Phẩm | Dao Găm Huyết Ma Vương | Dao | 33 | 0 | 22% | 1,35 | 28 |
| Thần Khí | Long Thương Hỗn Độn Tận Thế | Thương | 78, miễn khống chế | 0 | 4% | 1,00 | 72 |
| Thần Khí | Cung Thần Mặt Trời Thái Dương | Cung | 64 | 0 | 8% | 1,10 | 200 |
| Thần Khí | Quyền Trượng Cổ Đại Yggdrasil | Trượng | 34 | 78 | 0 | 0,95 | 120 |
| Thần Khí | Sổ Sinh Tử Diêm La | Sách | 28 | 90 | 0 | 0,95 | 150 |

### Giáp và mũ

| Bậc | Tên | Ô | Hướng | Giáp | Máu | Phần thêm |
| --- | --- | --- | --- | ---: | ---: | --- |
| Thường | Mũ Sắt Thô | Đầu | Nặng | 6 | 63 | tốc −1% |
| Thường | Mũ Vải Học Việc | Đầu | Pháp | 1 | 21 | +12 mana, +3 sức kỹ năng |
| Thường | Nón Rơm Rách | Đầu | Nhẹ | 2 | 27 | +1% chí mạng, tốc +1% |
| Thường | Giáp Gỗ Bọc Sắt | Thân | Nặng | 11 | 135 | tốc −2% |
| Thường | Áo Vải Gai Thô | Thân | Pháp | 3 | 42 | +18 mana, +5 sức kỹ năng, hồi chiêu −1,2% |
| Thường | Áo Da Mỏng | Thân | Nhẹ | 4 | 63 | +1,2% chí mạng, tốc +1,2% |
| Hiếm | Mũ Nồi Thép Lính Tuần | Đầu | Nặng | 13 | 126 | tốc −2% |
| Hiếm | Vòng Ngọc Học Giả | Đầu | Pháp | 2 | 42 | +24 mana, +7 sức kỹ năng |
| Hiếm | Mũ Trùm Thợ Săn | Đầu | Nhẹ | 4 | 54 | +1,8% chí mạng, tốc +1,8% |
| Hiếm | Giáp Đai Sắt | Thân | Nặng | 21 | 270 | tốc −4% |
| Hiếm | Áo Học Giả | Thân | Pháp | 5 | 84 | +36 mana, +11 sức kỹ năng, hồi chiêu −2,4% |
| Hiếm | Giáp Da Bọc Đinh Sắt | Thân | Nhẹ | 8 | 126 | +2,4% chí mạng, tốc +2,4% |
| Siêu Hiếm | Mũ Sắt Rồng Bay | Đầu | Nặng | 21 | 210 | tốc −3% |
| Siêu Hiếm | Vòng Rune | Đầu | Pháp | 4 | 70 | +40 mana, +11 sức kỹ năng |
| Siêu Hiếm | Mũ Trùm Ưng | Đầu | Nhẹ | 7 | 90 | +3% chí mạng, tốc +3% |
| Siêu Hiếm | Giáp Tấm Thép Cường Lực | Thân | Nặng | 35 | 450 | tốc −6% |
| Siêu Hiếm | Áo Lụa Phù Thủy | Thân | Pháp | 9 | 140 | +60 mana, +18 sức kỹ năng, hồi chiêu −4% |
| Siêu Hiếm | Áo Da Bóng | Thân | Nhẹ | 14 | 210 | +4% chí mạng, tốc +4% |
| Cực Phẩm | Vương Miện Viêm Đế | Đầu | Nặng | 30 | 302 | tốc −4% |
| Cực Phẩm | Miện Tiên Tri | Đầu | Pháp | 6 | 101 | +58 mana, +16 sức kỹ năng |
| Cực Phẩm | Mũ Trùm Cuồng Phong | Đầu | Nhẹ | 10 | 130 | +4,3% chí mạng, tốc +4,3% |
| Cực Phẩm | Giáp Bạo Chúa | Thân | Nặng | 50 | 648 | tốc −9% |
| Cực Phẩm | Áo Tinh Tú | Thân | Pháp | 13 | 202 | +86 mana, +26 sức kỹ năng, hồi chiêu −5,8% |
| Cực Phẩm | Áo Đêm | Thân | Nhẹ | 20 | 302 | +5,8% chí mạng, tốc +5,8% |
| Cực Phẩm | Áo Choàng Niết Bàn | Thân | Hồi phục | 26 | 340 | Sống lại với 20% HP một lần, +1,4 HP/giây |
| Thần Khí | Thiên Miện Thần Vương | Đầu | Nặng | 42 | 420 | tốc −6% |
| Thần Khí | Miện Pháp Thần | Đầu | Pháp | 8 | 140 | +80 mana, +22 sức kỹ năng |
| Thần Khí | Mặt Nạ Thần Hành | Đầu | Nhẹ | 14 | 180 | +6% chí mạng, tốc +6% |
| Thần Khí | Áo Giáp Hắc Ám Archdemon | Thân | Nặng | 70 | 900 | tốc −12% |
| Thần Khí | Pháp Bào Thần | Thân | Pháp | 18 | 280 | +120 mana, +36 sức kỹ năng, hồi chiêu −8% |
| Thần Khí | Áo Choàng Thần Tốc | Thân | Nhẹ | 28 | 420 | +8% chí mạng, tốc +8% |

Bình máu thường hồi 35% HP, trần 220. Không phải trang bị.

## 4. Thượng Cổ và Thượng Bảo

Năm boss, mỗi boss sáu nội tại và sáu chiêu. Thanh máu một bằng HP tối đa người sống sót, thanh hai gấp đôi. Boss đầu ngẫu nhiên, bốn boss sau không lặp. Nhịp chiêu chung 1 giây. Phase 2 mới mở chiêu cuối.

| Boss | Phase 1, tấn công / giáp | Phase 2 | Chiêu |
| --- | --- | --- | --- |
| Bàn Cổ Dị Hình | 125 / 30 | 160 / 15, tốc +50% | Thiên Thạch, Cú Đấm, Hố Tụt, Tường Đá, Tia Địa Lõi, Tận Thế Sụp Đổ |
| Phản Chiếu Nguyên Thủy | 100 / 12 | 130 / 8, tốc và hồi chiêu nhanh hơn | Sao chép chiêu 1, sao chép chiêu 2, Địa Chấn, Đổi vũ khí, Mô phỏng combo, Gương vỡ |
| Quy Khư Thôn Thiên Kỷ | 110 / 18 | 140 / 10 | Thôn Phệ, Axit, Lặn, Xúc Tu, Tiếng Hú, Sụp Không Gian |
| Hỗn Độn Ma Tổ La Hầu | 130 / 10 | 165 / 6 | Tứ Hướng Trảm, Vạn Kiếm, Giáng Thương, Búa, Cung Ma, Ma Trận Lục Đạo |
| Zero Protocol | 105 / 20, khiên 50% HP bot | 135 / 10, mất khiên, tốc ×2 | Laser, Tên lửa, Lưới điện, Máy cưa, Nện thủy lực, Tự hủy |

Phản Chiếu chạy cùng tốc người sống sót và sao chép mana, thể lực, chí mạng, ngoại hình, kỹ năng. Phân thân phase 2 mang một nửa chỉ số và chia vai ép gần hoặc khống chế. Zero Protocol phase 2 bỏ cooldown riêng từng chiêu nhưng vẫn giữ nhịp 1 giây; sau ba chiêu phải xả nhiệt. Phá lõi lúc Tự Hủy đang niệm sẽ ngắt vụ nổ.

Mỗi boss rơi một Thượng Bảo chưa dùng trong trận. Không thay Thượng Bảo bằng đồ bậc thấp. Phần cộng chỉ số có hiệu lực thật. Vũ khí thường không còn trần 65.

| Món | Ô | Hiệu lực đang chạy |
| --- | --- | --- |
| Bàn Cổ Hộ Tâm Giáp | Thân | +350 HP, +45 giáp, +30 kháng phép. Giảm 25% nổ và thiên thạch. Dưới 30% HP: khiên 25% HP trong 4 giây, miễn đẩy lùi, hồi 45 giây. |
| Truy Hồn Đoản Đao Quy Khư | Vũ khí | Dao, 65 công, tốc 1,2, tầm 42, chí mạng 15%. Mỗi đòn thường cộng tầng giáp, tối đa 10 trong 5 giây. Lướt 120 px, miễn sát thương 0,4 giây, xóa chậm, hồi 12 giây. |
| Kính Vạn Hoa Nguyên Bản | Đầu | +200 HP, +150 mana. Đòn trên 20% HP tạo ảo ảnh 2 giây, hồi 30 giây. +20% sát thương nếu đối thủ có kỹ năng trùng. |
| Hỗn Nguyên Tứ Phương Kích | Vũ khí | Thương, 75 công, tầm 68, hút máu 15%. Đòn thường thứ tư xoay Băng, Hỏa, Lôi, Phong. |
| Phản Lực Động Cơ Zero | Giày | +35% tốc, +50 thể lực, bỏ phạt địa hình. Né để lại lửa 3 giây. |
| Nhật Nguyệt Tinh Thần Cung | Vũ khí | Cung, 70 công, tầm 175. Thái Dương nổ vùng 40 px. Thái Âm đánh dấu +20% sát thương trong 4 giây. |
| Thiên Thư Tận Thế La Hầu | Vũ khí | Sách, 85 phép, tầm 150, hồi mana +25%, xuyên giáp 10%. Kỹ năng bậc 3 bắn thêm ba tia. Đòn phép có 20% làm chậm tốc đánh. |
| Vương Miện Huyết Tộc Chúc Long | Đầu | +250 HP, +35 kháng phép, hút máu 10%. Giảm sát thương Độc, Hỏa, Băng. Khống chế từ quái giảm một nửa, hồi 25 giây. |
| Huy Hiệu Nano Tái Thiết | Thân | +280 HP, +35 giáp, hồi thể lực +20. Không dính đòn 3 giây thì hồi 1,5% HP/giây. Tuyệt vọng trên 90: hồi nửa thể lực và tăng tốc, hồi 40 giây. |
| Nhẫn Vực Sâu Thôn Tích | Đầu | +15 vào công, phép, giáp, kháng phép, máu và mana. Đánh Thượng Cổ tích đến 50, đòn kế hút 10% sát thương thành máu và lùi 80 px. |

Nhẫn chiếm ô mũ. Kính và Vương Miện cũng chiếm ô mũ, nên chỉ đội một món.
