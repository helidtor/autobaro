DỰ ÁN: AI SANDBOX BATTLE ROYALE (RIMWORLD CARTOON STYLE - WEB BASED)
BẢN ĐẶC TẢ TÍCH HỢP HỆ THỐNG VÀ LIÊN KẾT DỮ LIỆU ĐỒNG BỘ

======================================================================

KIẾN TRÚC TRÍ TUỆ NHÂN TẠO (AI DECISION-MAKING ENGINE)
======================================================================

AI vận hành theo mô hình 3 lớp động khép kín:
Tính Cách Cố Định (Traits) -> Trạng Thái Cảm Xúc (Emotions) -> Quyết Định Hành Vi (Utility Behavior).

1.1. Hệ thống tính cách cố định (Fixed Traits)
Mỗi bot khi sinh ra ngẫu nhiên nhận 1 tính cách chủ đạo và 1 tính cách phụ, định hình trực tiếp nhánh build kỹ năng và phong cách chọn trang bị:

Can đảm:

Giảm 60% tốc độ tích lũy Sợ Hãi. Khi HP dưới 25%, tăng 20% sát thương thay vì bỏ chạy.

Xu hướng Build & Đồ: Ưu tiên nhánh Đấu Sĩ hoặc các trang bị đòn nặng (Rìu Gai, Búa Sắt, Giáp Gai). Sẵn sàng lao vào cướp boss Yêu Vương/Yêu Thần khi thấy đối thủ đang ăn dở.

Visual Mote (RimWorld): Icon nắm đấm đỏ hoặc ngọn lửa cháy rực trên đầu khi bước vào combat.

Hèn nhát:

Tốc độ tích lũy Sợ Hãi tăng 100%. Luôn ưu tiên tránh tiếng động, nấp bụi rậm khi có giao tranh trong bán kính 15 mét.

Xu hướng Build & Đồ: Ưu tiên nhánh Sát Thủ hoặc Cung Thủ lấy kỹ năng cơ động (Bước Chân Không Vết, Ngụy Trang Bụi Rậm, Nhảy Lùi Thoát Cương, Bốt Lụa Gió Lướt).

Visual Mote (RimWorld): Icon giọt mồ hôi bắn ra xung quanh khi nghe tiếng động lớn.

Khôn ngoan:

Tính toán chi tiết chỉ số trang bị (DPS vũ khí, chỉ số Giáp/Kháng phép, % Máu còn lại). Không bao giờ giao tranh nếu tỷ lệ thắng tính toán dưới 55%.

Xu hướng Build & Đồ: Ưu tiên nhánh Thuật Sĩ (Hybrid) hoặc Pháp Sư khống chế; luôn gom đủ 1 vũ khí tầm gần và 1 tầm xa để hoán đổi linh hoạt theo tầm đánh của đối thủ.

Visual Mote (RimWorld): Icon bóng đèn sáng hoặc kính lúp khi đang soi xét đối thủ.

Tham lam:

Chỉ số Hưng Phấn tăng vọt khi thấy trang bị bậc Siêu Hiếm, Cực Phẩm, Thần Khí rơi ra đất.

Xu hướng Build & Đồ: Bỏ qua an toàn bản thân, sẵn sàng dùng tốc biến/lướt (Hư Không Nhấp Nháy, Ám Đột) chỉ để nhặt đồ; dễ bị bẫy bởi Bẫy Thú hoặc Bẫy Dây Tơ Cắt Thịt đặt quanh bãi loot.

Visual Mote (RimWorld): Icon đồng tiền vàng hoặc hai mắt hình đồng xu lóe sáng.

Xảo quyệt:

Luôn di chuyển bọc sườn/sau lưng mục tiêu; chủ động bắt tay liên minh để mượn sức diệt quái lớn rồi đâm lén.

Xu hướng Build & Đồ: Ưu tiên nhánh Sát Thủ thuần sát thương sau lưng (Đâm Lén Độc Hiểm, Cắt Cổ Đoạt Mệnh, Lưỡi Dao Hư Vô Thôn Phệ).

Visual Mote (RimWorld): Icon nụ cười quỷ hoặc mắt rắn hí hửng.

1.2. Hệ thống cảm xúc thay đổi (Dynamic Emotions)
Chỉ số dao động từ 0 đến 100 theo thời gian thực (Tick-rate: 10 lần/giây):

Sợ hãi (Fear): Tăng khi mất máu đột ngột (>25% HP trong 1 giây), bị dính hiệu ứng bất lợi kéo dài (độc của Mãng Xà Đầm Lầy, cháy của Cóc Lửa Nham Thạch), hoặc gặp Yêu Vương/Yêu Thần.

Ngưỡng 80: Kích hoạt trạng thái Hoảng Loạn (Fleeing), vứt bỏ ý định nhặt đồ, dùng toàn bộ kỹ năng lướt/chạy (Windrunner, Blink) để tháo chạy.

Tự tin (Confidence): Tăng khi tiêu diệt quái/bot khác, hoặc nhặt được vũ khí Siêu Hiếm/Cực Phẩm.

Ngưỡng 85: Bot có xu hướng chủ quan, giảm 50% tần suất thực hiện động tác Lăn Né (Roll/Dodge) và Đỡ Đòn (Parry), dễ trúng đòn khống chế cứng.

Tuyệt vọng (Despair): Tăng khi bị truy sát liên tục trên 6 giây, thanh Thể Lực (Stamina) hoặc Mana cạn kiệt (<10%), bị dồn vào góc cụt hoặc đường cùng sông nước.

1.3. Cơ chế đột biến bản năng (Adrenaline Breakthrough - Tỷ lệ 1-2%)
Chỉ kích hoạt trong tình cảnh Tuyệt Vọng > 90 và HP < 15%:

Cuồng nộ (Berserk):

Bot gầm lên (hiện icon đầu lâu đỏ rực), toàn thân hóa đỏ viền cartoon, miễn nhiễm mọi hiệu ứng khống chế trong 5 giây, tăng 50% tốc đánh và 35% hút máu.

Lao thẳng vào kẻ vừa gây sát thương lên nó, tự động spam toàn bộ kỹ năng sát thương dứt điểm (Trảm Quyết Tận Tuyệt, Đoạt Mạng Bất Ngờ).

Sinh tồn (Clutch Escape):

Hiện icon đôi cánh thiên thần xanh lơ, bot nhận 100% tốc độ di chuyển và miễn nhiễm sát thương trong 3 giây.

Tự động xả các kỹ năng khói/làm chậm (Bom Khói, Rải Bụi Mù Mắt) để thoát thân về vùng rừng rậm gần nhất.

1.4. Cơ chế điều tiết giao tranh (Crowd Combat Limiter)

Giới hạn ô giao tranh (Combat Slots): Mỗi bot chỉ mở tối đa 2 ô kẻ thù trực tiếp trong hệ thống logic.

Khóa cụm giao tranh tối đa 3 bot: Nếu tại một khu vực bán kính 8 mét đã có 3 bot đang giao tranh, hệ thống sẽ gán cờ Zone_Combat_Full = True.

Xử lý hành vi của bot tiếp cận thứ 4 trở đi:

Bot Hèn Nhát/Khôn Ngoan: Đổi góc di chuyển ngay lập tức, tản ra tìm bãi Lâu La hoặc Yêu Thú để farm an toàn.

Bot Tham Lam/Xảo Quyệt: Dừng lại ở rìa tầm nhìn (tận dụng bụi rậm hoặc vách đá), chuyển sang vũ khí tầm xa (Cung Bão Tố, Trượng Băng) hoặc nạp sẵn chiêu ám sát (Ám Đột Sau Lưng) để chờ bot yếu máu nhất rơi xuống dưới 20% HP mới nhảy vào ăn hôi.

1.5. Cơ chế liên minh tạm thời (Pact of Two)

Điều kiện kích hoạt: Hai bot không mang tính thù địch chạm trán nhau trước cửa hang Yêu Vương (ví dụ Viêm Ma Bạo Chúa, Cuồng Bạo Kim Cương Vương) hoặc trước mặt Yêu Thần. Cả hai đều không đủ 100% tỷ lệ tự ăn boss.

Hiển thị: Xuất hiện icon bắt tay cartoon trên đầu 2 bot, màu viền nhân vật chuyển sang vàng nhạt, tắt cơ chế gây sát thương lên nhau.

Cơ chế phản bội: Sau khi boss chết, trang bị Cực Phẩm hoặc Thần Khí rơi ra đất.

Hệ thống chạy công thức: Điểm Phản Bội = (Phẩm cấp vật phẩm * Trọng số Tham Lam) - (Máu hiện tại của đồng minh).

Nếu Điểm Phản Bội vượt ngưỡng an toàn: Bot phản bội hiện icon mặt quỷ cười gian, lập tức dùng đòn đánh chí mạng (Đâm Lén, Cắt Cổ, Ngắm Bắn Tử Thần) kết liễu đồng minh đang yếu máu để độc chiếm chiến lợi phẩm.

======================================================================
2. TÍCH HỢP QUÁI VẬT - TÀI NGUYÊN VÀ CƠ CHẾ SĂN BẮT CỦA AI
Quái vật là tài nguyên hữu hạn (không hồi sinh). Càng về cuối trận, nguồn exp và trang bị cạn dần, buộc bot phải dịch chuyển từ lối chơi PvE sang PvP sinh tồn.

2.1. Phân cấp bậc quái và hành vi tương tác của Bot

Lâu la (20-30 con, bầy 2-3 con, thuần vật lý):

Đối tượng săn bắt bắt buộc của tất cả bot ở Level 1 (tay không).

Bot dùng nắm đấm đánh thường để tiêu diệt các quái như Chuột Hầm Ngục, Goblin Cầm Gậy, Khung Xương Rỉ Sét.

Mục tiêu: Lên Level 2 mở khóa kỹ năng đầu tiên và nhặt vũ khí Bậc Thường (Rìu Gỗ Gãy, Kiếm Sắt Rỉ Sét, Que Đũa Phép Tre...).

Yêu thú (15-20 con, có 1 nội tại đặc thù):

Bot cấp độ 3 - 6 bắt đầu tìm kiếm Yêu Thú.

AI Khôn Ngoan sẽ tránh đánh Mãng Xà Đầm Lầy nếu chưa có kỹ năng giải độc (Bùa Chú Thanh Tẩy), tránh Heo Rừng Gai Bọc Sắt nếu đang chơi Sát Thủ máu mỏng vì sợ phản sát thương.

Thu hoạch: Kiếm Thép Luyện Rắn, Trượng Thủy Tinh Xanh, Giáp Da Bọc Đinh Sắt (Bậc Hiếm).

Yêu tướng (10 con, 1 nội tại + 2 kỹ năng chủ động):

Bot cấp độ 7 - 10 mới dám đơn đấu.

Bot phải đọc khung hình ra đòn (Wind-up): Khi thấy Đao Phủ Đoạt Mệnh nhấc rìu chuẩn bị "Chém Bổ Đầu", bot sẽ thực hiện Procedural Dodge (lăn né) sang bên hông.

Thu hoạch: Rìu Chiến Chém Thép, Gậy Băng Trụ Vĩnh Cửu, Cung Bão Tố Tật Phong (Bậc Siêu Hiếm).

Yêu Vương (Đúng 4 con trấn giữ 4 góc lãnh địa):

Bot cấp 11 trở lên hoặc liên minh 2 bot mới tiếp cận.

AI phải nhận diện combo: Khi Viêm Ma Bạo Chúa dựng Hỏa Trụ Tận Thế, bot phải lùi ra khỏi vệt nứt để không dính trọn cú Đập Búa Nham Thạch tiếp theo.

Thu hoạch: Vũ khí Bậc Cực Phẩm (Rìu Viêm Ma, Trượng Hắc Báo Phẫn Nộ, Cung Bão Tố Ưng Vương, Dao Găm Huyết Ma Vương).

Yêu Thần (1 World Boss độc nhất ngự tại đền cổ trung tâm):

Đích đến cuối cùng của các bot top đầu (Level 13 - 15).

Boss có hào quang phát hiện tàng hình (Ám Thị Toàn Tri) nên các bot Sát Thủ bị tước đi lợi thế nấp bóng, buộc phải hợp lực tầm xa với Cung Thủ/Pháp Sư.

Rơi ra 1 món Thần Khí duy nhất của trận đấu (ví dụ Long Thương Hỗn Độn Tận Thế, Sổ Sinh Tử Diêm La). Kẻ nào nhặt được sẽ trở thành "Raid Boss" của toàn bộ các bot còn lại.

======================================================================
3. TÍCH HỢP TRANG BỊ VÀ ĐƯỜNG HƯỚNG PHÁT TRIỂN CỦA BOT
3.1. Thuật toán tự định hình Nhánh Build (Dynamic Class Adoption)
Mỗi bot bắt đầu vô định hình (Level 1, tay không). Quyết định chọn 1 trong 5 nhánh build dựa trên 2 yếu tố:
Nhánh Lựa Chọn = Max(Điểm Tính Cách Tương Đồng + Hệ Số Trang Bị Nhặt Đầu Tiên)

Nhặt được Rìu Gỗ/Kiếm Rỉ Sét + Tính Can Đảm -> Khóa nhánh Đấu Sĩ (Warrior).

Nhặt được Que Đũa Phép Tre/Nhánh Khô -> Khóa nhánh Pháp Sư (Mage).

Nhặt được Cung Dây Dừa/Nỏ Gỗ -> Khóa nhánh Cung Thủ (Archer).

Nhặt được Dao Găm Rỉ/Mũi Dao Sứt + Tính Xảo Quyệt/Hèn Nhát -> Khóa nhánh Sát Thủ (Assassin).

Nhặt được vũ khí hỗn hợp hoặc mang tính Khôn Ngoan -> Khóa nhánh Thuật Sĩ (All-Rounder).

3.2. Cây tiến trình cấp độ (Level 1 -> 15) và phân bổ 15 điểm kỹ năng
Mỗi khi lên 1 cấp, bot nhận 1 điểm kỹ năng để phân bổ:

Cấp 1 - 5 (Early Game): Mở khóa 3 kỹ năng chủ động cơ bản và 2 nội tại cấp 1.

Cấp 6 - 10 (Mid Game): Nâng cấp các kỹ năng chủ lực lên Tier 2 để giảm thời gian hồi chiêu và tiêu hao năng lượng.

Cấp 11 - 15 (Late Game): Tối đa hóa 2-3 kỹ năng chủ chốt lên Tier 3 để mở khóa cơ chế Đánh Đổi (Risk vs Reward).

Đấu Sĩ: Lên Tier 3 [Trảm Quyết Tận Tuyệt] để hồi chiêu liên tục khi dọn lính/bot yếu.

Pháp Sư: Lên Tier 3 [Hư Không Nhấp Nháy] để để lại ảo ảnh bẫy nổ khi bị áp sát.

Cung Thủ: Lên Tier 3 [Ngắm Bắn Tử Thần] để kết liễu mục tiêu từ ngoài tầm nhìn.

Sát Thủ: Lên Tier 3 [Ám Đột Sau Lưng] đảm bảo 100% chí mạng khi đâm lén.

Thuật Sĩ: Lên Tier 3 [Chuyển Đổi Vũ Trang] để nhận khiên chắn khi đổi sang cận chiến và làm chậm khi đổi sang tầm xa.

3.3. Cơ chế trang bị trực quan (RimWorld Paperdoll System)

Khi bot nhặt hoặc đổi trang bị từ bãi quái, Sprite của bot cập nhật ngay lập tức:

Đầu: Hiển thị Mũ Nồi Thép, Khăn Trùm Sát Thủ, hoặc Vương Miện Viêm Đế đỏ rực.

Thân: Hiển thị Giáp Tấm Thép Cường Lực hoặc Áo Choàng Hư Không bồng bềnh.

Hai bên thân (Floating Weapons): Tay trái cầm Kiếm Lưỡi Răng Cưa Khổng Lồ, tay phải treo Cung Bão Tố Ưng Vương sau lưng.

AI đọc trực quan đối thủ: Trước khi lao vào combat, bot dùng logic quét Paperdoll của đối thủ. Nếu thấy đối phương đang mặc Giáp Gai Bạo Chúa và cầm Kiếm Titan Băng Hà, bot máu mỏng sẽ lập tức quay đầu rút lui.

======================================================================
4. MÔI TRƯỜNG ĐỊA HÌNH VÀ TƯƠNG TÁC CHIẾN THUẬT CỦA KỸ NĂNG
Bản đồ chia thành 4 địa hình chính, tương tác vật lý trực tiếp với bộ kỹ năng đã thiết kế:

4.1. Rừng rậm (Dense Forest)

Ảnh hưởng: Tầm nhìn giảm 40%, tán cây cản đường đạn thẳng.

Kỹ năng tương tác:

Cung thủ không thể dùng [Tên Xuyên Thấu Tinh Vân] hoặc [Ngắm Bắn Tử Thần] xuyên qua thân cây cổ thụ.

Pháp sư dùng [Hỏa Cầu Thuật] hoặc [Hỏa Tiễn Bùng Nổ] sẽ thiêu rụi các bụi rậm xung quanh, xóa sạch nơi ẩn náu của kẻ địch.

Sát thủ tận dụng nội tại [Rình Mồi Trong Bóng Râm] để hồi phục thể lực và áp sát bất ngờ.

4.2. Sông suối, đầm lầy (Waterways & Swamps)

Ảnh hưởng: Chuyển sang trạng thái bơi, giảm 50% tốc chạy, CẤM COMBAT và CẤM DÙNG CHIÊU.

Kỹ năng & Trang bị khắc chế:

Bot mang [Giày Thủy Thần Lướt Nước] (Bậc Cực Phẩm) hoặc kích hoạt kỹ năng [Hóa Thân Tật Phong] của Thuật Sĩ sẽ lướt trên mặt nước với tốc độ 100%, không bị cưỡng chế bơi.

Cung Thủ đứng trên bờ dốc dùng [Bắn Ghim Tường] hoặc [Bắn Đôi Thần Tốc] xả đạn thẳng vào các bot đang bì bõm dưới nước mà không sợ bị đánh trả.

4.3. Núi cao, vách đá (Highlands & Cliffs)

Ảnh hưởng: Giảm 30% tốc độ leo dốc, tăng 50% tầm nhìn, tăng 25% tầm bắn từ trên cao xuống.

Kỹ năng tương tác:

Cung Thủ và Pháp Sư chiếm cứ đỉnh dốc để thả [Mưa Tên Trút Xuống] hoặc [Thiên Thạch Rơi Tự Do] với tầm bao quát cực lớn.

Sát Thủ dùng chiêu [Bám Tường Nhảy Vồ] từ trên vách đá nhảy vồ xuống mục tiêu dưới chân dốc để gây choáng 1.5 giây và chí mạng 100%.

4.4. Tàn tích đền cổ (Ancient Temple Ruins)

Địa hình gạch đá bằng phẳng, không có bụi rậm ẩn nấp, nơi tọa lạc của Yêu Thần và 4 góc là Yêu Vương.

Nơi diễn ra các pha combat tổng lực cuối game. Các kỹ năng diện rộng hạng nặng như [Hủy Diệt Ma Pháp Trận], [Bão Tuyết Vĩnh Cửu] phát huy tối đa sức mạnh do không bị chướng ngại vật che chắn.

======================================================================
5. ĐẶC TẢ HOẠT HỌA RIMWORLD & TỐI ƯU WEB ENGINE
5.1. Khung chuyển động Procedural cho 5 Nhánh Vũ Khí
Không dùng spritesheet frame-by-frame nặng nề, toàn bộ chuyển động vũ khí được điều khiển bằng code góc xoay (Rotation) và độ co giãn (Squash & Stretch):

Vũ khí Cận Chiến (Kiếm, Rìu, Chùy):

Wind-up: Vũ khí trôi nổi nghiêng góc -45 độ về phía sau trong 0.2s.

Active Frame: Vũ khí vụt chém xoay 120 độ về phía trước trong 0.08s, kèm một vệt chém cartoon (Slash Arc Sprite) mỏng màu trắng sáng.

Recovery: Vũ khí giật nhẹ trở về vị trí lơ lửng ban đầu bên cạnh thân hình viên nhộng.

Vũ khí Tầm Xa (Cung, Nỏ):

Kéo cung: Sprite cánh cung hơi co lại theo trục Y, mũi tên thò ra phía trước.

Bắn: Mũi tên bay đi với vận tốc tuyến tính, cánh cung giật lùi về sau 5 pixel (Recoil) rồi đàn hồi lại.

Gậy Phép & Sách Phép:

Gậy xoay tròn nhẹ trên không, đỉnh gậy nhấp nháy hạt ánh sáng cartoon (Particle) theo màu nguyên tố (Đỏ của Lửa, Xanh của Băng, Vàng của Sét) trước khi bắn đạn ma thuật.

5.2. Đồng bộ hiển thị cảm xúc (Emotional Feedback System)
Tích hợp trực tiếp các Emotion Motes hiển thị lơ lửng trên đỉnh đầu Pawn:

Sợ hãi > 80: Nổi icon 3 giọt mồ hôi xanh lơ bay chéo ra sau; thân mình bot nghiêng 15 độ về hướng đang chạy trốn.

Tự tin > 85: Nổi icon cặp kính râm đen hoặc mặt cười nhếch mép; bot di chuyển ưỡn ngực (nghiêng về trước).

Tuyệt vọng > 90: Nổi icon đám mây đen có sấm sét nhỏ trên đầu; thân bot nhấp nhô chậm chạp.

Chuẩn bị phản bội đồng minh: Nổi icon con dao găm nhỏ màu tím nhấp nháy trong 1.5 giây trước khi ra tay.

5.3. Tối ưu kỹ thuật chạy trên Trình Duyệt Web (Web Performance Pipeline)
Đảm bảo 100 bot + 200 quái vật + hiệu ứng kỹ năng chạy vững vàng 60 FPS trên Canvas/WebGL:

Xử lý Đồ họa (Phaser.js / Pixi.js Canvas):

Sử dụng Texture Atlas duy nhất (kích thước 2048x2048): Chứa toàn bộ bộ phận cơ thể (đầu, thân viên nhộng, 50 loại vũ khí, mũ, nón). Giảm Draw Calls xuống mức tối thiểu (dưới 10 draw calls toàn màn hình).

Object Pooling: Tái sử dụng tuyệt đối các đối tượng hạt đạn (Arrow, Fireball, Slash Trailing, Particle khói). Không khởi tạo mới (tránh Garbage Collection làm drop FPS).

Xử lý AI & Logic (Tách luồng Web Worker):

Main Thread: Chỉ làm 2 nhiệm vụ duy nhất: Lấy dữ liệu tọa độ từ Worker để vẽ Sprite lên màn hình và phát âm thanh.

Web Worker (Background Thread): Chạy toàn bộ logic ngầm bao gồm:

Thuật toán tìm đường A* trên lưới ô (Grid Map).

Bộ đếm cảm xúc (Fear, Confidence, Despair).

Cây quyết định chọn mục tiêu và cơ chế tính toán phản bội của 100 bot.

Spatial Hash Grid: Bản đồ chia thành các ô vuông 64x64 pixel. Bot chỉ tính toán va chạm và tìm mục tiêu với các thực thể nằm trong ô hiện tại và 8 ô lân cận, loại bỏ hoàn toàn tình trạng nghẽn CPU khi cả trăm bot cùng hoạt động.