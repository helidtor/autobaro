# AutoBaro — đặc tả hệ thống đang chạy

Tài liệu này mô tả luật đang có trong source, không phải bản thiết kế ban đầu. Dữ liệu quái, kỹ năng, trang bị và Thượng Cổ nằm ở [material-game.md](material-game.md). Số liệu chi tiết lấy từ `js/`.

Game chạy trên trình duyệt bằng JavaScript thuần, Canvas 2D và Vite. Không có backend, Phaser, Pixi hay Web Worker. Mọi module gắn vào `window` qua `js/main.js`. Vòng lặp, AI, combat và vẽ đều ở main thread. Spatial hash ô 64 px. Lưới đi đường ô 40 px.

## 1. Diễn biến một trận

1. Sinh 100 bot cấp 1, tay không, dọc rìa bản đồ 5200×5200, và 131 quái.
2. Bot farm, nhặt đồ và đánh nhau. Không có vòng bo.
3. Điện thờ Yêu Thần khóa cho đến khi mọi Yêu Vương còn sống bị hạ.
4. Khi còn 2–5 bot, chúng ưu tiên tìm nhau. Khi còn đúng 1 bot, trận pause và hiện popup.
5. Đóng popup (hoặc Escape) bắt đầu lượt farm cuối: quái từ Yêu Vương trở xuống bị thay bằng 5 Yêu Vương. Người sống sót phải lên cấp 15 và hạ hết 5 con này rồi mới được đánh Yêu Thần.
6. Hạ Yêu Thần mở đếm ngược 20 giây mô phỏng để loot. Hết giờ, nếu còn đúng một bot cấp 15 trở lên và không còn Yêu Vương, thế giới sụp trong 6 giây thành đấu trường 1500×1500.
7. Chuỗi 5 boss Thượng Cổ khi chưa có Quỷ Vương. Trận kết thúc khi hạ đủ 5 boss, hoặc khi người sống sót chết. Nếu Yêu Thần chết khi còn nhiều bot, chuỗi chờ đến khi điều kiện trên đủ.
8. Popup sau 5 Thượng Cổ, và popup sau khi hạ Quỷ Vương, có đúng hai nút: **Ván mới** và **Tiếm ngôi quỷ vương**. Popup còn một người sống sót ở Battle Royale không có quyền tiếm ngôi.
9. **Tiếm ngôi** chụp người thắng tại lúc bấm nút: cấp, EXP, điểm kỹ năng, chỉ số nền và chỉ số chiến đấu, HP/mana/thể lực hiện tại, kỹ năng, nội tại, tính cách, ngoại hình và trang bị. Bình máu được đặt thành đúng 3 bình thường. Rồi mở trận 100 bot mới. Quỷ Vương không nằm trong 100 bot và chưa xuất hiện ở Battle Royale, farm cuối hay lúc đánh Yêu Thần.
10. Ván đã có Quỷ Vương: Yêu Thần vẫn thưởng 10.000 EXP, nhưng rơi đúng 1 vũ khí Thượng Cổ, 1 giáp thân Thượng Cổ và 3 bình thường. Đấu trường chỉ mở sau 20 giây và sau khi hai món đã được nhặt hoặc bỏ vì yếu hơn món đang mặc, và 3 bình đã được nhặt. Bên trong chỉ có Quỷ Vương, không có boss Thượng Cổ, không sấm, không hai phase. Quỷ Vương dùng AI, hồi phục và một thanh máu của bot.
11. Hạ Quỷ Vương không rơi đồ, không cộng EXP và không thưởng kết liễu. Thua Quỷ Vương mở popup **Ván mới** hoặc **Khiêu chiến lại**. Khiêu chiến lại giữ bản chụp lúc lên ngôi, tạo 100 bot mới và vẫn phải qua farm cuối cùng Yêu Thần. HP đã mất và bình đã uống trong lần thua không ghi vào bản chụp.

Nút **Ván mới** trên popup thắng, popup thua hoặc thanh công cụ đều xóa bot, quái, đồ rơi, đấu trường, chuỗi Thượng Cổ và ngôi Quỷ Vương. Ngôi chỉ nằm trong bộ nhớ của phiên chơi. Tải lại trang là trận thường.

## 2. Bot

Chỉ số gốc: 160 HP, 16 tấn công, 5 giáp, 5% chí mạng, 95 tốc chạy, 100 thể lực, 100 mana, 0 sức kỹ năng. Mỗi cấp vẫn hồi đầy máu, cho 1 điểm kỹ năng, và cộng một ngân sách 21 điểm theo build đang có. Build lấy từ tính cách lúc chưa có điểm, rồi mỗi điểm đã chi cộng vào hướng của môn đó. Đổi vũ khí không viết lại phần đã cộng.

Năm hướng thuần, mỗi cấp: Chống chịu +40 HP, +1 tấn công, +4 giáp. Sát thủ +12 HP, +4 tấn công, +1,5% chí mạng. Cung thủ +32 HP, +3 tấn công, +1 giáp, +1% chí mạng. Pháp sư +16 HP, +1 tấn công, +15 mana, +4 sức kỹ năng. Hồi phục +20 HP, +2 tấn công, +1 giáp, +5 mana, +0,15 HP/giây. Bot lai lấy trung bình có trọng số. Phòng thủ và phản đòn vào Chống chịu. Đòn kết liễu và môn ám sát vào Sát thủ. Môn cung vào Cung thủ. Môn phép vào Pháp sư. Hồi máu vào Hồi phục. Đòn cận chiến còn lại chia đôi Chống chịu và Sát thủ.

EXP tích lũy để lên cấp 2→15: 80, 180, 320, 500, 750, 1050, 1400, 1800, 2300, 2900, 3600, 4400, 5300, 6400. Từ 15 lên 16 cần thêm 1200 EXP; mỗi cấp sau cộng thêm 200 so với mức tăng của cấp trước. Không có trần cấp.

Hồi máu nền 1 HP/giây, kể cả trong giao tranh, cộng thêm hồi từ build và từ đồ đang mặc. Bình thường hồi 35% HP tối đa, trần 220, hồi chiêu 8 giây, phải ngắt động tác để uống. Bình toàn phần chỉ rơi từ Thượng Cổ và hồi đầy máu. Thể lực bot hồi 6 điểm/giây, quái hồi 4 điểm/giây, cộng thêm hồi từ trang bị.

Khi máu dưới 30% và bot không đang giao tranh, bot có thể thiền định: đứng yên, không di chuyển, hồi 8% máu tối đa mỗi giây cho đến 75%. Đòn, khống chế, cụm combat hoặc kẻ địch đang lấy bot làm mục tiêu sẽ ngắt thiền. Máu đã hồi được giữ lại.

Mỗi bot có một tính cách chính và một tính cách phụ trong năm nhóm Can Đảm, Hèn Nhát, Khôn Ngoan, Tham Lam, Xảo Quyệt. Tám trục 5–95 được trộn từ hai nhóm rồi cộng nhiễu: hiếu chiến, thận trọng, tham vọng, trung thành, kiên nhẫn, khám phá, hèn nhát, bình tĩnh. Nhóm chính chiếm 80%, nhóm phụ 20%.

Nhặt món mới vào một ô đang có đồ thì món cũ rơi xuống đất. Bot lấy món có điểm hợp build cao hơn, nên giáp nhiều máu có thể thua áo pháp trên bot phép. Nhặt vũ khí gán `classId` theo loại vũ khí để chọn kiểu né và màu đạn. Hệ số máu/giáp/tấn công của năm lớp trong dữ liệu chỉ để hiển thị, không nhân chỉ số. Không khóa nhánh kỹ năng.

### Cảm xúc

Cảm xúc cập nhật khoảng 10 lần mỗi giây khi có mục tiêu trong tầm nhìn.

- Sợ hãi tăng theo tỷ lệ máu mất và độ hèn nhát, giảm theo thời gian và độ bình tĩnh.
- Giận tăng khi bị đánh. Ba đòn độc lập từ cùng kẻ trong 6 giây đặt mục tiêu phản kháng 6 giây.
- Chiến ý tăng khi thấy đối thủ cùng cấp hoặc yếu hơn, giảm dần theo thời gian.
- Tự tin trôi về mốc nền của tính cách. Giết hoặc nhặt đồ tốt làm tăng tự tin.
- Tuyệt vọng tăng khi đang bị đe dọa mà mana và thể lực cùng cạn, hoặc máu dưới 20% và thể lực dưới 15.

Ngưỡng sợ 80, tự tin 85 và tuyệt vọng 90 trong dữ liệu cũ không còn là công tắc bỏ chạy. Bot hèn nhát từ 85 từ chối nhiều trận đấu. Tự tin trên 85 làm bot hiếm khi đỡ hoặc né đòn đang lấy đà. Quyền năng đạo diễn **Cuồng Nộ** ép bot gần nhất vào cuồng nộ 5 giây: hút 15% sát thương gây ra, choáng không hủy động tác đang thực hiện. Không có tỷ lệ tự động cuồng nộ hay miễn sát thương thoát thân.

### Quyết định

Mỗi khoảng khoảng 0,3 giây, bot chấm các việc nhìn thấy: nhặt đồ, farm quái, đấu bot, phục kích. Kế hoạch đang chạy được giữ nếu chưa kém phương án mới quá 30 điểm. Ước lượng thắng là thời gian sống sót tương đối, dựa trên DPS đã tính chiêu sẵn sàng, thể lực, tầm đánh, địa hình và trang bị. Đây là heuristic, không phải xác suất thống kê.

- Săn quái khi ước lượng từ 50% và tính cách chịu đánh. Ngưỡng cấp tối thiểu theo bậc quái là 1, 3, 6, 10, 15.
- Phút đầu, tính theo thời gian trận, bot không chủ động đánh bot khác. Chúng farm và nhặt đồ.
- Sau phút đầu, bot thấp hơn mức trung bình của bot còn sống từ 2 cấp trở lên cũng không chủ động tìm bot. Chúng ưu tiên farm để đuổi cấp. Bot còn lại vẫn có thể chủ động giao tranh.
- Bị nhắm, bị ra đòn, bị đánh, hết đường hoặc đang ở vòng quyết đấu cuối thì vẫn đánh theo luật cũ. Hết phút đầu và không còn thấp hơn mặt bằng, bot lại kết liễu người ít máu và trả thù như trước.
- Chủ động tìm người vẫn cần ước lượng từ 50%. Chênh cấp không phải lệnh cấm khi bot không nằm trong hai giới hạn trên.
- Bị đánh, bị cướp mạng quái, bị cướp đồ đang đi nhặt, bị đánh lén, hoặc thấy bot còn từ 30% máu: vào trận dù hơn nhiều cấp. Bot hèn nhát từ 85 không chủ động lao vào người ít máu, nhưng vẫn đánh khi bị ép hoặc hết đường.
- Đang combat và ước lượng còn từ 50%, hoặc chưa mất 25% HP tối đa của trận đó: không đổi mục tiêu. Bot ít máu và kẻ gây hận được ghi vào lượt sau. Ngoại lệ: mục tiêu khác đang tấn công mình thì đổi sang đánh trả người đó. Kẻ ra đòn sau được giữ, không nhảy mục tiêu mỗi khung hình.
- Đã mất từ 25% HP tối đa và ước lượng dưới 40%: rút nếu còn đường lui. Hết đường thì đánh đến chết.
- Truy đuổi có giới hạn thời gian và khoảng cách. Mất dấu chỉ tìm quanh vị trí cuối trong 3 giây, rồi bỏ và không đuổi lại cùng con mồi trong 20 giây.
- Khi chưa có mục tiêu, bot đi các ô bản đồ và, lúc còn ít người, các ngã tư. Không đứng yên.
- Nhặt đồ ngay dưới chân, kể cả đang ra đòn. Đuổi vũ khí mạnh hơn trong 220 px nếu đường khô thông và tới nơi trong 3 giây. Đổi mọi loại vũ khí mạnh hơn vẫn giữ kỹ năng đã học. Thượng Bảo không bị thay bằng đồ bậc thấp.
- Trong combat, bot thăm dò, gây áp lực, giữ chiêu, lùi hoặc phản công sau đỡ, né, hoặc khi địch hồi động tác. Tối đa một kỹ năng mỗi 1,8 giây, ngoài cooldown riêng.
- Núp bụi chỉ sau khi đã cắt tầm nhìn của kẻ truy sát và hết combat, hoặc khi rình một trận đã đủ người. Phục kích có hạn giờ.

### Liên minh

Hai kiểu bắt tay, cùng tắt sát thương giữa hai bot:

- Trước Yêu Vương: hai bot cấp 8 trở lên, trung thành đủ, cùng không chắc ăn boss một mình, và cụm combat còn chỗ.
- Chống bot hạ ít nhất hai bot trong 60 giây, khi có người chứng kiến, hoặc khi hai bot cùng nhìn thấy một đối thủ mạnh hơn cả hai. Cả cặp phải đạt ước lượng từ 40%. Cặp chia sẻ vị trí cuối đã thấy, không chia sẻ tọa độ toàn bản đồ. Giải tán khi mất dấu, quá hạn, máu quá thấp hoặc ước lượng dưới 35%. Không giải tán khi đang ở giữa ngoại lệ combat bốn người.

Sau khi boss liên minh chết, bot ít trung thành có thể phản bội đồng minh còn máu. Cặp trung thành có thể giữ liên minh cho đến khi trận chỉ còn hai bot.

### Giới hạn combat

Một cụm giao tranh liên thông tối đa 3 thực thể. Ngoại lệ đúng hai cặp liên minh thì được 4. Bot thứ tư không được áp vào. Hai Yêu Tướng không cùng đánh một bot. Trên sông không combat và không dùng chiêu.

## 3. Quái

Mỗi trận có đủ các loài trong dữ liệu, không bốc một tập con.

| Bậc | Số lượng | Cách bố trí |
| --- | --- | --- |
| Lâu La | 80 | 8 bầy 4 con và 16 bầy 3 con, cùng loài trong bầy |
| Yêu Thú | 40 | 10 cặp và 20 con đi một mình; mỗi loài bốn con |
| Yêu Tướng | 6 | Canh ngoài bốn sào huyệt; 5 loài nên một loài lặp |
| Yêu Vương | 4 | Mỗi con một sào huyệt: Viêm Ma Điện, Kim Cương Sơn, Thanh Xà Đầm, Vong Hồn Thành |
| Yêu Thần | 1 | Ngẫu nhiên trong 4 loài, đứng giữa điện thờ |

Lâu La không có chiêu. Yêu Thú có nội tại loài. Yêu Tướng trở lên do `bossBrain` đọc đòn, chọn chiêu, bọc sườn và giữ cự ly. Nhịp chiêu chung, ngoài cooldown riêng: Yêu Tướng và Yêu Vương 3 giây, Yêu Thần 2 giây, Thượng Cổ 1 giây.

Quái nhìn qua tường và khói như bot. Tầm nhìn quái thường 220 px, Yêu Vương trở lên 300 px. Bot nhìn 230 px cộng độ khám phá. Lâu La, Yêu Thú và Yêu Tướng chủ động đuổi bot còn trong tầm nhìn, kể cả khi phải rời vòng sinh cảnh. Chúng không vào điện thờ, sào huyệt khác, hoặc dưới nước. Mất tầm nhìn thì quay về chỗ cũ. Lâu La và Yêu Thú đi cặp thì bám con đầu đàn. Một con trong bầy bị tấn công thì mọi con còn sống cùng bầy vào trận đó; chúng không tính vào giới hạn 3 người. Bot thứ tư vẫn không chen vào. Yêu Vương và Yêu Thần vẫn ở lãnh địa của mình.

Yêu Thú hoặc Yêu Tướng bị diệt sạch cả bậc thì bậc đó hồi sinh sau 10 giây, đúng loài và sinh cảnh. Không hồi sinh sau khi đã có người sống sót cuối cùng.

Hồi máu: bot, Lâu La, Yêu Thú và Thượng Cổ hồi 1 HP/giây. Yêu Tướng, Yêu Vương, Yêu Thần ngoài giao tranh hồi 1%, 3%, 5% HP tối đa mỗi giây; trong giao tranh vẫn 1 HP/giây. Tạm dừng cũng dừng hồi.

Lượt farm cuối xóa quái bậc 4 trở xuống và sinh lại bốn Yêu Vương cộng Thiết Giáp Tê Ngưu Vương. Máu và sức của năm con này được chỉnh theo người sống sót; EXP chia phần còn thiếu để lên cấp 15. Thứ tự săn đi từ con dễ hơn.

## 4. Phần thưởng

Chỉ bot AI kết liễu bot khác mới rơi đồ PvP: 75% món nạn nhân đang cầm, 25% một món ngẫu nhiên cao hơn một bậc, tối đa Thần Khí. Không có vũ khí thì lấy giáp hoặc mũ. Không có trang bị thì sinh món Thường hoặc Hiếm. EXP PvP bằng 60 nhân cấp nạn nhân, không tặng thêm một cấp. Quái hoặc người chơi điều khiển kết liễu không tạo món này.

Tỷ lệ rơi khi quái chết: Lâu La 20%, Yêu Thú 30%, Yêu Tướng 40%, Yêu Vương và Yêu Thần 100%. Lâu La đến Yêu Tướng rơi một bình hoặc một món trang bị. Yêu Vương rơi một bình và một món Cực Phẩm. Yêu Thần thưởng 10.000 EXP và, ở trận chưa có Quỷ Vương, rơi một bình, vũ khí Thần Khí riêng của loài, một thân Thần Khí và một mũ Thần Khí. Thân và mũ được rút trong ba hướng nặng, pháp và nhẹ. Ở trận đã có Quỷ Vương, Yêu Thần vẫn thưởng 10.000 EXP nhưng chỉ rơi một vũ khí Thượng Cổ, một giáp thân Thượng Cổ và ba bình thường. Không có đồ rải sẵn trên bản đồ.

## 5. Địa hình

Bản đồ 5200×5200, một mét bằng 20 px. Có Thiền Viện Trúc Lâm, Rừng Già Hoang Vu, Dãy Núi Liên Sơn, sông Hoàng Hà, Kinh Thành, Làng Trúc và Làng Hà. Nhà, tường, hàng rào, thân cây và đá chặn di chuyển. Bụi che tầm nhìn khi núp. Hai cầu bắc sông. Trong sông tốc độ còn 45% và cấm combat. Trên núi tốc độ còn 70%. Đầm lầy sinh cảnh còn 80%. Giày Phản Lực bỏ các phạt này.

Điện thờ có bán kính phong ấn. Còn Yêu Vương sống thì không ai đi sâu vào, trừ chính Yêu Thần. Người đã lỡ bên trong vẫn đi ra được.

## 6. Thượng Cổ

Sau 20 giây loot, đấu trường 1500×1500 mở ở phía nam tâm bản đồ. Tám tàn tích có va chạm. Nước, bụi và tường điện thờ cũ không còn tác dụng. Chuỗi Thượng Cổ có sấm đánh ngẫu nhiên mỗi 4 giây. Trận Quỷ Vương dùng cùng đấu trường nhưng không sinh năm boss và không có sấm.

Năm boss theo thứ tự ngẫu nhiên, không lặp: Bàn Cổ, Phản Chiếu, Quy Khư, La Hầu, Zero Protocol. Mỗi boss có 6 nội tại, 6 chiêu và hai thanh máu. Thanh một bằng HP tối đa của người sống sót, thanh hai gấp đôi. Hạ thanh một chuyển phase, không chết. Hạ thanh hai rơi đúng một Thượng Bảo chưa rơi trong trận, cộng một bình hồi đầy. Boss kế xuất hiện sau 10 giây. Trong lúc chờ, người sống sót ưu tiên nhặt bảo vật, uống bình và đứng yên ít nhất 1,5 giây để thích ứng.

Phản Chiếu sao chép kỹ năng và nội tại đã học. Hồi máu sao chép tính trên HP gốc của bot. Phân thân phase 2 dùng chung ngân sách máu và chiêu; hai phân thân cộng bot là đủ ba chỗ combat. Thượng Cổ miễn khống chế.

Chiến thắng hiện popup riêng. Chết giữa chuỗi thì thua, không có người thắng thay thế.

## 7. Người chơi và đạo diễn

Chế độ đạo diễn quan sát 100 bot. Chế độ người chơi điều khiển bot đang được soi. Nếu chưa soi bot nào, điều khiển bot số 0. Khi vào chế độ này, hành động AI đang dở được hủy để phím điều khiển có hiệu lực ngay.

| Thao tác | Đạo diễn | Người chơi |
| --- | --- | --- |
| Kéo chuột trái | Đổi camera | — |
| WASD hoặc mũi tên | Đổi camera | Di chuyển |
| Click trái | Soi bot hoặc quái | Đánh |
| Cuộn chuột | Zoom | Zoom |
| Q E R F | — | Bốn kỹ năng đầu đã học |
| Shift | — | Đỡ |
| V | — | Né |
| Space | Tạm dừng hoặc tiếp tục | Tạm dừng hoặc tiếp tục |
| P | Bật tắt camera tự động | — |
| H | — | Uống bình |
| M | Bản đồ tổng | Bản đồ tổng |

Đạo diễn có Thiên Lôi (250 sát thương trong 60 px), Hỏa Thần (đốt bụi) và Cuồng Nộ. Tốc độ 0, 1x, 2x, 5x, 10x. Tạm dừng đóng băng thời gian mô phỏng, kể cả đếm Thượng Cổ. Âm thanh Web Audio, tối đa 16 tiếng, ưu tiên gần camera, bật sau tương tác đầu tiên.

## 8. Hiển thị

Nhân vật, vũ khí, quái, kiến trúc và hiệu ứng vẽ bằng code. Vũ khí có lấy đà, ra đòn và hồi chiêu theo loại. Bot cấp 10 có hào quang vàng. Từ cấp 15, hào quang chuyển tím bạc, viền cyan và tia điện. Thượng Bảo có viền vàng và màu riêng.

Biểu cảm nổi trên đầu theo sợ, giận, chiến ý, tự tin, sinh tồn hoặc đang nhặt đồ. Khi focus một thực thể, vòng xanh là tầm nhìn và vòng vàng là tầm đánh.
