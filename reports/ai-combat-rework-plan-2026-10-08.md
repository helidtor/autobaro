# Kế hoạch rework AI, combat, kỹ năng và boss — 08/10/2026

Trạng thái: kế hoạch để duyệt; chưa thay đổi source. Không commit hoặc push.

## 1. Phạm vi và hiện trạng đã đối chiếu

Source hiện có 32 kỹ năng chủ động bot, mỗi kỹ năng 3 bậc; 42 phép có tên của 5 loài Yêu Tướng, 4 Yêu Vương và 4 Yêu Thần; 30 phép của 5 boss Thượng Cổ. Có 10 loài Lâu La và 10 loài Yêu Thú: hiện không có phép chủ động, một số có nội tại. Số loài trong dữ liệu khác số quái được sinh trong trận.

Các vấn đề nền cần xử lý:
- AiBrain có nhiều nhánh return riêng cho sợ hãi, né đòn, lượt cuối, loot và boss; thứ tự nhánh có thể thắng ý định đã chọn.
- Loot dưới chân đã hoạt động; việc chạy đến vũ khí bị chặn bởi đánh giá nguy hiểm, ưu tiên duel/finalDuel và action đang diễn ra. Hàm chấm vũ khí còn giới hạn công 65 trong khi combat thật cho phép vũ khí Thượng Bảo vượt mức này.
- Cảm xúc chưa có chiến ý riêng. Tự giảm confidence về 20 và cách tăng despair do thiếu một trong hai tài nguyên có thể làm nhiều bot trở nên giống nhau.
- hasRetreatRoute chỉ kiểm tra ba điểm lùi gần: có thể báo còn đường dù bot không thực sự thoát được.
- BossBrain nhận danh sách mục tiêu còn nhìn thấy; hết danh sách thì trả về logic quái thường và có thể quay về home.
- Hạ Yêu Thần gọi awaken ngay, mở đấu trường và sinh boss đầu; chưa có khoảng loot 20 giây.
- Nhiều tên phép khác nhau vẫn được quy về một dạng sát thương/khống chế đơn giản. Rework cần thay đổi hiệu lực, cách chọn và phản ứng với phép, không chỉ mô tả/VFX.

Giữ các luật đã chốt: cấp bot không giới hạn; combat tối đa 3 thực thể, ngoại lệ đúng hai cặp liên minh là 4; sông không combat; sinh cảnh và sào huyệt; Yêu Tướng không đánh hội đồng một bot; đấu trường 1500 × 1500; chuỗi 5 Thượng Cổ, hai thanh HP mỗi boss, nghỉ 10 giây giữa boss, một Thượng Bảo không lặp; không thêm trang bị rải sẵn.

## 2. Các quyết định thiết kế mặc định

Các ngưỡng sau là đề xuất khởi điểm, sẽ chỉnh theo kết quả mô phỏng:
- Đối thủ hơn từ 2 cấp trở lên: ưu tiên farm, thay cho ngưỡng 5 cấp cũ. Đối thủ hơn 1 cấp: có thể đấu nếu trang bị, tài nguyên và cảm xúc ủng hộ.
- Cowardice từ 85/100: nhóm cực kỳ hèn nhát, không chuyển sang tử chiến do bị dồn góc.
- Bị cùng một đối thủ đánh ít nhất 3 lần trong 6 giây: coi là truy sát liên tục. Một phép nhiều đợt/DoT chỉ tính một lần khởi nguồn để tránh kích hoạt giả.
- Vũ khí gần: trong tầm nhìn và tối đa 220px; đường đi dự kiến không quá 3 giây. Vật phẩm dưới chân vẫn nhặt ngay khi hợp lệ.
- Quyết định chiến lược cập nhật mỗi 0,25–0,4 giây; phản ứng với đòn nguy hiểm cập nhật nhanh hơn. Giữ ý định ít nhất 2–4 giây, đổi sớm khi có sự kiện thực.
- Áp dụng luật cấp mới cả khi còn 2–5 bot: ngang/yếu thì săn nhau, kém từ 2 cấp thì farm để bắt kịp. Tử chiến vì bản năng sinh tồn là cam kết riêng. Liên minh hai bot chống mục tiêu mạnh với cơ hội thắng từ 40% vẫn là ngoại lệ có chủ đích của luật farm.
- Boss truy sát cả bot sống sót lẫn nhân vật điều khiển tay, trong giới hạn đấu trường.

## 3. Tính cách, cảm xúc và ra quyết định dứt khoát

### 3.1. Tính cách ổn định

Giữ sáu trục hiếu chiến, thận trọng, tham vọng, trung thành, kiên nhẫn, khám phá. Bổ sung cowardice (hèn nhát) và composure (bình tĩnh). Thận trọng là biết tính rủi ro; không đồng nghĩa hèn nhát. Không rút các trục từ một trait duy nhất: mỗi bot có sai lệch cá nhân có giới hạn, tránh các bot cùng nhãn hành xử giống nhau.

Vai trò từng trục:
- Hiếu chiến: tốc độ tích chiến ý, mức chủ động ép giao tranh.
- Thận trọng: dự trữ thể lực, lựa chọn điểm lùi và timing phòng thủ.
- Tham vọng: tranh loot, chọn con mồi nhiều EXP, sẵn sàng tận dụng cơ hội.
- Trung thành: cứu đồng minh, giữ liên minh hoặc phản bội khi điều kiện thật thay đổi.
- Kiên nhẫn: nhử đòn, chờ hồi chiêu, giữ kế hoạch săn.
- Khám phá: đổi tuyến tuần tra, thử mục tiêu/chiêu ít dùng.
- Hèn nhát: khuynh hướng buông giao tranh khi bị đe dọa; quyết định ngoại lệ tử chiến.
- Bình tĩnh: tốc độ phản ứng cảm xúc, ổn định khi bị đánh nhiều lần.

### 3.2. Cảm xúc theo sự kiện

Dùng chiến ý, sợ hãi, phẫn nộ, tự tin và áp lực/tuyệt vọng. Chỉ tăng mạnh theo sự kiện có cooldown: thấy con mồi mới, bị cùng kẻ đánh, vừa đỡ/né thành công, bị chặn đường, đồng minh chết, mất vật phẩm, chiêu hụt hoặc combo trúng. Không cộng chiến ý mỗi frame khi nhìn cùng một bot.

Chiến ý đề xuất tăng khoảng 30–45 khi thấy mục tiêu ngang/yếu lần đầu; các trục hiếu chiến và hèn nhát điều chỉnh mức tăng. Cảm xúc giảm về mức nền cá nhân; không kéo mọi bot về cùng confidence=20. Thiếu mana chỉ tăng áp lực rõ nếu các chiêu đang cần mana; không phạt bot thiên cận chiến còn đủ stamina.

Ghi nhớ hữu hạn: nguồn sát thương, số lần bị truy sát, điểm nhìn thấy cuối, vài lần thoát thất bại, mục tiêu đã gây thù và vật phẩm đang định lấy. Không xây hệ thống ký ức dài hạn hoặc học máy.

### 3.3. Luật quyết định theo tình huống

| Tình huống nhìn thấy | Ý định mặc định | Ngoại lệ hợp lệ |
| --- | --- | --- |
| Bot ngang hoặc thấp cấp hơn | Tăng mạnh chiến ý, chọn đấu/chặn đường | Đồng minh, combat đủ người, sông/tường, xử lý đòn chí mạng trước |
| Bot hơn 1 cấp | Thăm dò, chọn đấu theo trang bị và tài nguyên | Có thể bỏ qua để farm khi bất lợi rõ |
| Bot hơn từ 2 cấp, chưa đánh mình | Farm con mồi vừa sức, tránh tuyến của bot mạnh | Liên minh đã có mục tiêu đủ 40% cơ hội thắng |
| Bot mạnh đang truy sát, còn đường thoát | Dùng skill thoát, đường khuất, chạy tới vùng có lợi | Phản công ngắn để tạo khoảng cách |
| Bị đánh liên tục, không có khả năng thoát, cowardice dưới 85 | Thức tỉnh bản năng sinh tồn, khóa mục tiêu và tử chiến | Chỉ đổi khi đối thủ chết/biến mất khỏi trận hoặc bản thân chết |
| Bị dồn đường, cowardice từ 85 | Vẫn cố tháo chạy bằng công cụ di chuyển, đỡ/né và núp đúng luật | Không ép vào trạng thái tử chiến |

Bản năng sinh tồn là thay đổi quyết định có nguyên nhân, không phải roll 2% để có bất tử hoặc hồi đầy máu. Bot tử chiến vẫn biết đỡ, né, lùi ngắn, uống bình và loot; không tự hủy cam kết vì fear, HP thấp hoặc hết thời gian truy đuổi.

Đánh giá thoát thân bằng tuyến đi thật, tốc độ hai bên, thể lực/skill di chuyển, tầm nhìn, tường và lịch sử tiến bộ. Kiểm tra lại khoảng 0,6 giây, dùng kết quả ổn định của ít nhất hai lần kiểm tra; không quét nhiều đường mỗi frame.

### 3.4. Một thứ tự ưu tiên chung

1. Hoàn tất pha động tác không thể hủy; nếu còn pha cho phép hủy thì xét phản ứng.
2. Né/đỡ đòn sắp gây tử vong, uống bình hoặc dùng phòng thủ cần thiết.
3. Nhặt vũ khí mạnh hơn gần mình, kể cả đang combat, và Thượng Bảo theo luật ưu tiên riêng.
4. Thực hiện cam kết tử chiến hoặc chiến thuật đối đầu boss.
5. Phản công kẻ đang tấn công, săn bot ngang/yếu, liên minh, farm hoặc tuần tra theo luật tình huống.

Cam kết là ý định; loot và né là thao tác tạm thời. Nhặt xong tiếp tục mục tiêu còn hợp lệ, không xóa toàn bộ combat plan. Quyết định mới phải hơn kế hoạch cũ một biên điểm rõ hoặc có sự kiện bắt buộc. Ngẫu nhiên chỉ lấy một lần khi chọn giữa lựa chọn gần ngang, giữ kết quả tới lần đánh giá tiếp theo.

### 3.5. Sự kiện giúp trận đấu khó đoán nhưng có lý do

Kẻ vừa né thành công có thể chuyển sang ép đòn; bot tham vọng tranh vũ khí giữa duel; bot thận trọng nhử đối thủ dùng dash trước; bot bị truy sát quyết liệt quay lại tử chiến; đồng minh trung thành chặn đường cứu bạn; kẻ ít trung thành tận dụng đồng minh kiệt sức. Tất cả đi qua kiểm tra combat admission và tầm nhìn thật.

Bảng thông tin hiển thị tám trục tính cách, cảm xúc, ý định, lý do chọn, đối tượng cam kết và thời gian giữ quyết định. Nhật ký chỉ ghi chuyển trạng thái có ý nghĩa, không log mỗi frame.

## 4. Rework kỹ năng bot

### 4.1. Quy tắc chung

Mọi phép có chuẩn bị → tác dụng → hồi động tác, vùng/hướng đánh thật, điều kiện chọn và cách khắc chế. AI nhìn dấu hiệu, cooldown đã quan sát và vị trí địch, không đọc quyết định tương lai. Combo là chuỗi lựa chọn có điều kiện, không tự chạy nguyên chuỗi bất chấp đối thủ đã né.

Giữ 32 phép và 3 bậc, không khóa build hoặc buộc theo vũ khí. Tier cao tăng công dụng hoặc độ tin cậy có giới hạn; không chỉ nhân sát thương. Giữ cooldown riêng và nhịp bot tối thiểu 1,8 giây/chiêu. Mỗi bước combo tôn trọng nhịp chung; nhiều pulse không được xem là nhiều phép mới.

Ngân sách đề xuất: chiêu thông thường khoảng 0,6–1,5 ATK tổng; chiêu dài/finisher có điều kiện khoảng 1,5–2 ATK tổng; damage phụ chia cùng ngân sách. Khống chế bot thường 0,3–0,8 giây, có khoảng kháng khống chế sau đó. Kỹ năng phòng thủ mạnh đánh đổi tài nguyên, tốc di chuyển hoặc cơ hội tấn công. Mọi mức này cần thử nghiệm trước khi chốt.

### 4.2. Ma trận đủ 32 kỹ năng

| Kỹ năng | Tác dụng chiến thuật dự kiến | Cách chống lại |
| --- | --- | --- |
| Chém Sấm Sét | Quét cung có hướng, phạt địch vừa dash hụt, chậm ngắn | Lùi ngoài cung hoặc vòng sau |
| Khiên Chắn Cương Bộc | Chặn chính diện ngắn rồi lao khiên; mất khả năng quay nhanh | Bọc sườn, giữ cự ly, ép hụt |
| Lốc Kiếm | Ba nhịp quét, giữ vùng và đẩy địch khỏi loot | Thoát vòng giữa các nhịp, bắn từ ngoài |
| Xung Phong Phá Trận | Dash đường thẳng; ép địch rời góc tốt, dừng trước tường | Né ngang, phản công lúc hồi |
| Hơi Thở Thứ Hai | Hồi ban đầu nhỏ, phần còn lại cần nhịp thở; chịu đánh giảm phần hồi sau | Gây áp lực hoặc ngắt trước khi hồi đủ |
| Bổ Kết Liễu | Bổ nặng có dấu hiệu; bonus chỉ dưới ngưỡng HP, hụt bị phạt | Né, đỡ đúng hướng, hồi HP trước khi trúng |
| Địa Chấn | Vòng chấn có khoảng an toàn, cắt tiếp cận; bậc cao làm suy yếu guard | Chọn vùng an toàn, lùi sớm |
| Bức Tường Sắt | Phòng thủ hướng cố định, hấp thụ hữu hạn và tốn stamina | Bọc hậu, dùng xuyên giáp, chờ hết |
| Đâm Xuyên Giáp | Thrust hẹp, đặt dấu phá giáp ngắn cho đòn tiếp theo | Né ngang, reset khoảng cách |
| Phản Kiếm | Một cửa sổ phản đòn chính diện, sai timing mất tài nguyên | Nhử parry rồi đánh lúc hồi |
| Hỏa Cầu | Đạn va chạm, nổ nhỏ tạo vùng nóng ngắn để ép đường | Dùng vật cản, đổi đường |
| Băng Tiễn | Slow theo tích lạnh có giới hạn; đóng băng chỉ khi đủ điều kiện | Né đạn thứ hai, thoát combo |
| Thiểm Di | Dịch tới điểm hợp lệ để đổi góc; hồi đủ lâu, bậc cao có ảnh giả | Đoán điểm đáp, giữ chiêu bắt lại |
| Vòng Xoáy Trọng Lực | Vùng kéo cảnh báo, dùng giữ địch trong nguy cơ có sẵn | Bước ra trước kích hoạt, dash đúng lúc |
| Khiên Năng Lượng | Đổi mana thành khả năng chịu đòn, giới hạn lượng hấp thụ | Cấu rỉa cạn mana, tấn công lúc hết |
| Thiên Thạch | Nổ chậm tại điểm đã khóa, phạt mục tiêu đứng lâu | Rời dấu, ngắt niệm khi còn cửa sổ |
| Giáp Băng | Phòng thủ có thời hạn, tự hạn chế di chuyển/tấn công | Chờ tan, giữ chiêu kết liễu |
| Liên Tiễn | Hai đạn độc lập, đổi góc nhẹ giữa hai phát theo tier | Vật cản hoặc né theo nhịp |
| Lùi Bắn | Bắn và lùi theo hướng hợp lệ, tạo khoảng cách thật | Dồn tường, giữ dash đuổi |
| Mưa Tên | Ba đợt tại vùng cố định, kiểm soát loot/lối hẹp | Thoát vùng, tiến từ hướng khác |
| Ngắm Bắn | Tia ngắm rõ, tăng sát thương khi ngắm đủ; chịu áp lực làm mất ngắm | Vật cản, ép sát, đổi hướng |
| Bước Chân Gió | Tăng cơ động để đổi vị trí hoặc đuổi, không tăng burst | Đón đường, ép tiêu stamina |
| Ảnh Bộ | Lướt tới góc đánh sườn; bonus yêu cầu góc thật | Quay mặt, né, chặn điểm đến |
| Biến Mất | Cắt khóa mục tiêu sau một khoảng ngắn; hành động tấn công/đòn trúng làm lộ | AoE, theo vị trí cuối; không biết tọa độ ẩn |
| Cắt Yết Hầu | Đánh hẹp, bleed hữu hạn và silence ngắn nếu bắt lúc địch niệm | Guard, giữ khoảng cách, dùng đòn thường |
| Bom Khói | Vùng che tầm nhìn thật, tạo cơ hội đổi hướng; đứng trong không miễn damage | AoE, vòng ngoài, chặn lối ra |
| Ám Sát | Kết liễu cần mục tiêu yếu và cửa sổ có lợi, có hồi động tác lớn | Đỡ/né, tránh đứng quay lưng khi ít HP |
| Chuyển Thế Vũ Trang | Đổi thế công/thủ, không ép cần vũ khí phụ; thưởng cho timing chuyển | Ép đổi thế sớm rồi đổi nhịp đánh |
| Lưỡi Kiếm Linh Lực | Nạp hữu hạn vài đòn phối hợp phép/vật lý | Câu hết lượt nạp, phòng thủ lúc cường hóa |
| Linh Khí Hồi Phục | Vùng hồi có thời hạn cho bản thân/đồng minh, nhạy với bị áp lực | Ép rời vùng hoặc ngắt pha chuẩn bị |
| Phong Thể | Cơ động, thoát slow có điều kiện; qua sông vẫn không combat | Đón điểm thoát, dùng chặn đường |
| Hỗn Mang Tiễn | Chọn hiệu ứng theo trạng thái mục tiêu: phá guard hoặc ngắt niệm; không roll CC tùy ý | Né đạn, thay thế đứng, dùng cửa sổ miễn CC |

Rà lại 10 nội tại cấp 15 và Thượng Bảo để không nhân lại damage/heal nhiều lần trên pulse, phản sát thương không tạo vòng lặp, và sao chép Mirror có ngân sách riêng. Giữ điểm học theo tính cách, cả lựa chọn học rộng lẫn nâng sâu.

## 5. Rework toàn bộ quái và phép boss

### 5.1. Các bậc thấp

Lâu La giữ dễ đọc, không thêm chuỗi phép phức tạp. Tạo khác biệt ở đòn thường có chuẩn bị, di chuyển và hồi đòn: thỏ/rắn/nhện lao cắn; chuột/zombie áp sát chậm; goblin vung gậy; khỉ ném đá có va chạm; xương dùng kiếm; bọ húc; sói lượn sườn. Bầy không vượt giới hạn tham gia combat.

Yêu Thú mỗi loài có một đặc tính rõ, ưu tiên tái sử dụng đòn/field sẵn có: heo húc có đà; mãng xà quét đuôi; cóc tạo vệt nóng ngắn; báo vồ từ sườn; gấu vung nặng; dơi lao hút máu hữu hạn; nhện giăng chậm có dấu; cua thủ giáp rồi mở sườn khi đánh; sói rình góc cắn; ma cây đánh rễ có chuẩn bị. Nếu cần chuyển một đặc tính thành active, phải có cooldown 6–10 giây, nhịp chung tối thiểu 3 giây. Nội tại của cả 10 Yêu Thú được đối chiếu hiệu lực thật. Bot cấp 1/cấp 3 vẫn có thể hạ Lâu La/Yêu Thú trong duel hợp lý.

### 5.2. Yêu Tướng — đủ 10 phép

| Loài | Rework moveset |
| --- | --- |
| Đao Phủ Đoạt Mệnh | Chém Bổ Đầu khóa hướng, vung rìu nặng có cửa sổ né; Xoay Rìu Cuồng Bạo dùng đẩy người áp sát, ít burst và hồi lâu. Tạo nhịp nhử đỡ → đổi sang bổ. |
| Xà Tinh Đầm Lầy | Phun Axit Ăn Mòn tạo vùng cắt đường ngắn; Đuôi Quét Sấm Sét chỉ dùng khi bị áp sát, có vùng trước/sau rõ. |
| Thống Lĩnh Nhân Mã | Mũi Tên Xuyên Phá khóa tuyến; Xung Phong Rung Chuyển áp lực lối ra, hụt thì lộ sườn. |
| Hắc Vu Cốt Tinh | Cầu Lửa Hắc Ám phạt mục tiêu ở trong vùng; Vòng Khống Chế Địa Ngục dựng rào ngắn có lối ra, không đóng kín vô nghiệm. |
| Tướng Quân Khỉ Đột | Đập Đất Liên Hoàn có nhịp và khoảng trống; Ném Tảng Đá Lớn phạt chạy thẳng, đá bị vật cản chặn. |

### 5.3. Yêu Vương — đủ 12 phép

| Loài | Rework moveset |
| --- | --- |
| Viêm Ma Bạo Chúa | Hỏa Trụ Tận Thế lần lượt khóa điểm, không cùng phủ mọi đường; Đập Búa Nham Thạch tạo khe nóng; Gầm Thét Hủy Diệt đẩy địch khỏi cự ly thuận lợi. AI dùng khe/trụ ép đường rồi bổ, không spam khi địch ngoài vùng. |
| Cuồng Bạo Kim Cương Vương | Ném Cự Thạch Hủy Diệt là đạn lăn va chạm; Nhảy Bổ Nghiền Nát khóa điểm đáp có cảnh báo; Đấm Loạn Xạ 8 Nhịp chia tổng damage, tracking giảm dần để người chơi né nhịp sau. |
| Thanh Xà Đế Vương | Tam Đầu Phun Nọc chia quạt có khe; Quấn Quít Bóp Nghẹt đòi áp sát và có cách thoát; Độn Thổ Xuất Kích khóa vị trí cũ, hụt thì mở cửa phản công. |
| Lãnh Chúa Xương Vong Hồn | Băng Phong Bão Tố tạo vùng ưu thế; Xiềng Xích Linh Hồn bị cắt bằng khoảng cách/vật cản; Tiếng Thét Đoạt Mệnh ngắt niệm trong phạm vi rõ, không khóa mọi hành động. |

### 5.4. Yêu Thần — đủ 20 phép

| Loài | Rework 5 phép và cách đối phó |
| --- | --- |
| Thái Cổ Hỗn Độn Ma Long | Long Tức Hủy Diệt khóa hướng rồi quét chậm; Bão Tố Hư Vô kéo có vùng thoát; Thiên Thạch Rơi Tự Do theo nhịp từng điểm; Đóng Băng Thời Gian chuyển thành vùng/mốc có cảnh báo thay vì stun toàn bản đồ không tránh được; Cánh Quạt Chấn Động đẩy theo hướng cánh, phạt đứng sát sườn. |
| Viêm Đế Phượng Hoàng | Biển Lửa Thái Dương có lối an toàn; Lặn Lao Thiêu Rụi khóa điểm đáp; Tiếng Ca Bỏng Rát có pha niệm có thể ngắt theo điều kiện; Bão Cánh Mặt Trời quạt lửa có khe; Tự Bạo Hạt Nhân là đòn lớn báo trước, có vùng/cover thoát và hồi động tác thật. |
| Tru Tiên Thần Cây Cổ Đại | Rễ Cây Xuyên Tim đánh theo đường báo trước; Mưa Hạt Gai Nhọn chặn vùng có nhịp; Đập Cành Trời Giáng khóa hướng; Bão Bào Tử Ngủ Say tích áp lực khi đứng lâu, ra ngoài thì giảm; Rút Cạn Sinh Lực là liên kết có thể cắt, không hút máu toàn bản đồ. |
| U Minh Diêm La Vương | Trát Tử Hình đặt dấu có thời gian; Phán Quyết Luân Hồi gây mạnh khi dấu còn; Triệu Hồi Quỷ Binh dùng field/đạn có va chạm theo luật để không thêm người thứ tư; Cầu Vồng Âm Ti là tia khóa hướng; Xích Trói Ngũ Mã có điểm né/đứt liên kết. Không tự động tử hình chỉ vì bị đánh dấu. |

Nhịp phép chung giữ Yêu Tướng/Yêu Vương 3 giây, Yêu Thần 2 giây. Nội tại giảm/hồi máu/miễn khống chế phải xét cùng bộ phép và cơ hội trừng phạt; không chỉnh active riêng rồi để nội tại xóa mọi tiến bộ.

### 5.5. Thượng Cổ — đủ 30 phép

| Boss | Rework 6 phép và bản sắc chiến thuật |
| --- | --- |
| Bàn Cổ | Thiên Thạch Rơi Tự Do ép di chuyển theo nhịp; Cú Đấm Bẻ Gãy Không Gian có góc chết sau lưng; Hố Tụt Tử Thần tạo áp lực kéo; Tường Đá Ngăn Cách không khóa kín mọi đường và có thể dùng làm cover; Tia Năng Lượng Địa Lõi quét theo hướng đọc được; Tận Thế Sụp Đổ phase 2 tạo các dải dung nham có lối đi. Phạt đứng lâu, thưởng đổi vị trí. |
| Phản Chiếu | Hai chiêu Nguyên Bản Cường Hóa dùng đúng semantics của chiêu bot với ngân sách riêng, không nhân cả area/damage/CC vô hạn; Địa Chấn Xung Kích khóa điểm; Vũ Trang Nghịch Chuyển thể hiện đổi thế; Mô Phỏng Trảm Quyết có chuỗi và cửa phản công; Gương Vỡ Tàn Bạo vẫn chỉ hai clone cùng một bot, chia vai trò áp sát/khống chế và giữ HP chung. |
| Quy Khư | Thôn Phệ Vạn Vật có hành lang hút và khe né; Nôn Mửa Axit Hư Không tạo vùng giảm giáp hữu hạn; Lặn Vào Vực Sâu khóa điểm đã thấy; Xúc Tu Bóng Tối ba nhịp có khe; Tiếng Hú Đói Cào gây pressure nhưng không ép AI chạy xuyên vùng nguy hiểm; Sự Sụp Đổ Không Gian cảnh báo dài, cho đường thoát, bỏ damage chuẩn 80% maxHP không có đối sách. |
| La Hầu | Tứ Hướng Trảm Tuyệt giữ bốn vùng chém và khe; Vạn Kiếm Quy Tông có tracking/đời đạn hữu hạn; Giáng Thương Đoạt Mệnh phạt đường thẳng nhưng có thể né ngang; Búa Tạ Xé Trời để khe có thời hạn; Cung Ma Diệt Hồn dùng hành lang trong đấu trường thay chiều dài map cũ; Ma Trận Lục Đạo Luân Hồi có sáu nhịp với cửa di chuyển, không kéo và khóa liên tục. |
| Zero Protocol | Pháo Laser Quét Quỹ Đạo có hướng và tốc quét; Mưa Tên Lửa Tầm Nhiệt có khả năng cắt bằng cover; Lưới Điện Cao Áp tạo vùng có khe; Máy Cưa Động Cơ Hủy Diệt lao theo hướng và hồi khi hụt; Cú Nện Thủy Lực khóa điểm đáp; Lệnh Tự Hủy Hoại Thức Tỉnh giữ cảnh báo 4 giây, cover/out-of-range thực sự tránh được. Overclock phase 2 có thể bỏ cooldown riêng theo thiết kế cũ nhưng vẫn nhịp 1 giây và pha hồi động tác. |

Nội tại Thượng Cổ được rà hết cùng 30 phép: không giảm sát thương tới mức mọi vũ khí vô nghĩa, không hồi/reflect tạo vòng lặp, không sinh thêm thực thể làm vượt combat cap. Không đảm bảo mọi bot thắng boss; đảm bảo có cửa phản công và tránh đòn bằng quyết định đúng.

## 6. Thượng Cổ truy sát tới cùng

Khi đã aggro người sống sót, giữ một mục tiêu cho tới khi một bên chết. Không dùng timeout truy đuổi bot thường, không trở về home chỉ vì mục tiêu rời vision, không hồi/reset đầy HP do bỏ chạy.

Nếu nhìn thấy mục tiêu: áp sát hoặc giữ cự ly đúng moveset, dự đoán điểm chặn đường có giới hạn, dùng công cụ bắt chạy khi hợp lệ. Nếu mất dấu vì khói/stealth/tường: đi đến điểm cuối đã thấy, kiểm tra lối thoát rồi tìm từng vùng đấu trường; không đọc tọa độ hiện tại của nhân vật đang ẩn. Trạng thái truy sát vẫn giữ trong quá trình tìm.

Không teleport đuổi theo tức thời, xuyên tường hay vượt biên 1500 × 1500. Ngăn chạy vòng khai thác AI bằng replanning khi không tiến triển, chọn giao điểm thay vì luôn chạy sau đuôi. Tốc độ/skill cơ động cân bằng cùng vũ khí bot, để thả diều vẫn là chiến thuật có đánh đổi chứ không là thắng miễn phí.

Kết nối BossBrain và nhánh updateMonster để trạng thái này không bị logic quái thường ghi đè. Hai clone Mirror chia sẻ khóa mục tiêu và thông tin vị trí cuối, không tạo hai encounter độc lập.

## 7. Khoảng loot 20 giây sau Yêu Thần

Luồng mới: Yêu Thần chết → phát EXP và đồ ngay → đếm 20 giây mô phỏng → mở đấu trường/sụp đổ thế giới → sinh boss Thượng Cổ đầu. Không mở arena, dịch chuyển bot hoặc đốt loot trước khi hết 20 giây.

AncientSystem lưu pending countdown ngay lúc God chết, tick bằng dt mô phỏng; không dùng setTimeout thời gian thực. Pause dừng timer, tốc độ 2x/5x tác động như phần còn lại của game. HUD hiển thị Thượng Cổ thức tỉnh sau XX giây, cảnh báo 5 giây cuối.

Bot ưu tiên lấy vũ khí, giáp, mũ và bình máu Yêu Thần; uống bình/nâng skill trong thời gian còn lại. Nếu chưa nhặt hết ở mốc 20 giây, chỉ chuyển những món chưa nhặt thuộc gói God tới điểm an toàn gần bot trong đấu trường, không tự trang bị miễn phí và không kéo loot cả map vào.

Giữ điều kiện cũ khi God chết sớm lúc còn nhiều bot: timer vẫn bắt đầu từ lúc chết, nhưng khi hết 20 giây chỉ chờ tới khi có một người sống sót đạt ít nhất cấp 15 và hết Yêu Vương lượt farm cuối. Đủ điều kiện mới mở chuỗi, không đếm thêm 20 giây lần hai. Nghỉ giữa năm Ancient vẫn 10 giây.

Reset ván mới xóa pending/timer và danh sách item cần chuyển; gọi xử lý death trùng không đếm hai lần hoặc sinh hai boss.

## 8. Loot vũ khí mạnh hơn trong combat

Dùng chung giá trị trang bị thực với combatStats: sát thương, tốc đánh, crit, tầm hiệu quả, xuyên giáp/kháng, tài nguyên và hiệu ứng đang có trong engine. Loại bỏ giới hạn công 65 của evaluator đối với Thượng Bảo. Rarity là yếu tố phụ; một món bậc cao nhưng không cải thiện thực lực không tự động được chọn.

Trong vùng gần có vũ khí cải thiện: ưu tiên chạy đến lấy cả khi duel/farm/boss hoặc đang tử chiến. Có thể dùng dash/khói/guard để lấy đồ, không roll ngẫu nhiên mỗi frame. Đòn nguy hiểm sắp giết bot vẫn được né trước; sau né quay về item nếu còn hợp lệ. Không đi lấy đồ qua sông khi đang combat, xuyên tường hoặc vào cụm đã đủ người.

Không hủy skill đã ra đòn chỉ để loot: ghi ý định, nhặt ở pha hồi cho phép. Vũ khí dùng cho projectile/cast hiện tại được chụp lúc bắt đầu, vũ khí mới áp dụng từ đòn sau để không thay damage giữa đường. Có thể nhặt đồ hợp lệ dưới chân mà không ngắt animation.

Giữ targetEnemy/encounter trong khi nhặt; loot không xóa combat lease để lách giới hạn 3/4 người. Sau loot tiếp tục đánh hoặc chọn lại theo trạng thái. Khóa cùng item 1,5–3 giây; nếu bị lấy mất, đường đi hỏng hoặc vũ khí không còn nâng cấp thì hủy một lần và chọn lại. Không luân phiên loot/duel mỗi tick, không quay lại món đã đổi bỏ. Bảo vệ trường hợp Ancient không bị thay bằng món thấp hơn chỉ vì evaluator cũ hiểu sai effect.

## 9. Rework diện mạo hai quái

### Đao Phủ Đoạt Mệnh

Thân golem đá/thép có vai lệch, giáp hành quyết, mặt nạ trùm đầu, khe mắt đỏ; rìu lớn có lưỡi, sống, cán và xích thay tam giác đỏ hiện tại. Đi nặng, kéo rìu khi tuần tra. Khi bổ: nhấc rìu, dồn trọng tâm, chém theo arc thật, bụi va chạm, hồi tay nặng. Khi xoay: số vòng hữu hạn gắn từng nhịp hit, không quay vũ khí liên tục lúc idle.

### Thái Cổ Hỗn Độn Ma Long

Silhouette rồng rõ với đầu dài, hàm/răng, cổ uốn, thân vảy, móng, hai cánh có xương/màng và đuôi. Màu tím đen, vảy cyan/violet, lõi hư không ở ngực/họng. Long tức làm họng sáng rồi mở hàm; gió từ chuyển động cánh; thiên thạch gắn động tác ngẩng đầu; freeze có rune/ánh mắt riêng. Có pose bị đánh và tử trận rõ.

Dùng Canvas và renderer sẵn có. Tách đầu/cổ/thân/cánh/rìu để pose theo action, không đổi hitbox chỉ vì hình lớn hơn. HP/name/telegraph đọc được ở zoom 0,6/1/1,5 và không bị glow che. Không dùng flash trắng toàn màn hình để làm kỹ năng có vẻ mạnh.

## 10. Thứ tự triển khai và nghiệm thu từng chặng

| Chặng | Việc cần làm | Đầu ra và kiểm chứng bắt buộc |
| --- | --- | --- |
| 1 | Chốt bảng kỹ năng, invariants, baseline seed; thêm fixture cho hành vi mới | Tài liệu rule và case trước sửa; kiểm kê 32/42/30 phép, nội tại và evaluator |
| 2 | Gộp ưu tiên quyết định, tính cách/cảm xúc, memory ngắn, cam kết sinh tồn | Bot ngang/yếu chủ động; +2 farm; bị dồn góc tử chiến/coward chạy đúng; không đổi ý từng frame |
| 3 | Countdown 20 giây và truy sát Ancient | Timer/pause/tốc độ/reset đúng; boss giữ mục tiêu khi mất vision và không quay home |
| 4 | Loot combat và evaluator chung | Vũ khí mạnh được lấy giữa duel/boss, damage cast cũ ổn định, không lách cap hoặc đảo trang bị |
| 5 | Chuẩn hóa vùng tác dụng, pha skill, CC, tài nguyên và chuỗi lựa chọn | Test các primitive thật; phát cảnh báo khớp damage/collision; không thêm framework |
| 6 | Rework 32 bot skills và AI chọn chiêu | 96 biến thể tier chạy được; tổ hợp công/thủ/cơ động rõ; không khóa build |
| 7 | Rework 42 phép quái/boss, hành vi bậc thấp, 30 phép Ancient và nội tại | Mỗi moveset có nhận diện và đối sách; cadence 3s/2s/1s, combo không bypass |
| 8 | Vẽ lại Đao Phủ/Ma Long, ghép pose và VFX, cân bằng nhiều seed | Ảnh/video ngắn các pose, trận thực, báo cáo metric và README cập nhật |

File chính: js/ai/aiBrain.js, js/ai/emotionEngine.js, js/ai/bossBrain.js, js/data/traitsData.js, js/data/skillsData.js, js/data/monstersData.js, js/data/ancientBossesData.js, js/entities/combatSystem.js, js/entities/ancientSystem.js, js/entities/entityManager.js, js/entities/relicSystem.js, js/game.js, js/renderer/monsterRenderer.js, js/renderer/weaponAnimations.js, js/renderer/vfxManager.js, js/ui/inspectModal.js, tests/game.test.cjs. Dùng file hiện có; chỉ tách helper khi thật sự có nhiều caller.

## 11. Ma trận test cuối

### Logic có thể kiểm chứng tự động

- Cùng một bot ngang/yếu ở vision không cộng chiến ý vô hạn; đồng minh và bot sau tường không thành mục tiêu.
- Bot +1 có đánh giá hợp lý; +2/+5 farm; đủ EXP lên cấp và đổi chiến lược sau một sự kiện ổn định.
- Ba hit độc lập trong 6 giây + không thoát + cowardice 84: tử chiến; cowardice 85: chạy. Một DoT ba tick không coi là ba lần truy sát.
- Tử chiến không bị fear/HP thấp, loot hoặc short dodge xóa target; đối thủ chết thì kết thúc cam kết.
- Luật mới chạy đúng khi còn nhiều bot, 2–5 bot, solo, player mode và khi có liên minh.
- Vũ khí tốt ở dưới chân, qua một góc tường, trong duel, trong boss, trong lúc niệm; đồ bị cướp hoặc unreachable không gây xoay vòng. Kiểm tra cast/projectile trước đổi đồ vẫn giữ thông số cũ.
- Timer God ở 19,99s chưa sinh; 20s đúng một boss; pause không tick; new match không mang timer cũ. Đồ God chưa nhặt không mất khi chuyển arena. God chết sớm giữ điều kiện cũ.
- Ancient mất vision, gặp khói, target vượt cự ly, đứng sau cover, clone Mirror: vẫn truy sát/tìm; không biết tọa độ ẩn và không vượt arena.
- Mọi tier của 32 bot skills; đủ 42 phép quái và 30 Ancient: geometry, warning, resource, cooldown, cancellation, damage/CC, hồi đòn và combo đều có hiệu lực thật.
- Trường hợp cùng cấp/trang bị, melee–ranged, ranged–ranged, coward–aggressive, thủ–counter, đồng minh–đồng minh; AoE/triệu hồi không tạo người thứ tư ngoài ngoại lệ hợp lệ.
- Giữ hồi HP, EXP vô hạn, sinh cảnh/respawn, nước, cap combat và năm Thượng Bảo đúng các luật trước.

### Mô phỏng và browser

Chạy duel kiểm soát để tách lỗi cơ chế khỏi cân bằng, sau đó batch ít nhất 10 seed Battle Royale và 10 loadout/seed gauntlet, tăng mẫu khi thấy chênh lệch bất thường. Đo tỷ lệ chọn duel/farm/flee/loot, số đổi ý, thời gian truy đuổi, loot bị bỏ, thời lượng trận, chiêu dùng/hụt và cửa phản công. Không lấy test chủ động kết liễu boss làm bằng chứng bot tự thắng.

Tiêu chí chống giật: không luân phiên hai ý định quá 2 lần trong 5 giây nếu không có sự kiện mới; mục tiêu lùi có thời gian giữ; đang cần di chuyển nhưng không tiến được trong 2 giây thì replan hữu hạn, không chạy pathfinding lặp mỗi frame. Giới hạn này không tính chuỗi attack/block/dodge hợp lý trong cùng ý định.

Profile CPU/FPS trước–sau với 100 bot và số quái thật; so p95 frame time ở cùng máy/tốc độ, mục tiêu không tăng quá 10% trước khi nghiệm thu. Cache perception/escape route, dùng spatial hash hiện có, không thêm AI framework hoặc backend. Kiểm tra browser production ở desktop và màn nhỏ; build, toàn bộ test và diff check đều phải sạch.

Kết thúc bằng báo cáo kết quả thực và phần còn cần tuning. Không tự commit/push và không cam kết trước tỷ lệ bot thắng cả năm boss.
