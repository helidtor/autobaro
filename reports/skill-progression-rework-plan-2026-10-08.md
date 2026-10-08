# Plan rework toàn bộ kỹ năng: tăng tiến sức mạnh và thay đổi combat

Ngày: 08/10/2026. Đây là **đề xuất thiết kế và triển khai**, chưa áp dụng vào runtime. Không commit/push.

## 1. Kết quả cần đạt và phạm vi

Mỗi lần đầu tư điểm phải mở thêm điều bot có thể làm trong combat: kiểm soát vị trí, giữ/phá thế thủ, cắt nhịp đối phương, chuẩn bị combo, tạo cửa hồi hoặc biến một cuộc tháo chạy thành phản công. Damage vẫn cần tăng vừa phải, nhưng không phải bằng chứng duy nhất của sức mạnh.

Rà source hiện tại xác định **107 kỹ năng chủ động**: 32 bot, 42 trong danh mục quái chính, 3 của Thiết Giáp Tê Ngưu Vương farm cuối và 30 Thượng Cổ. Source hiện có **85 mục nội tại**: 10 bot cuối game, 45 quái kể cả Yêu Vương farm cuối và 30 Thượng Cổ. Kho rework đề xuất **93 mục nội tại**, với 18 bot (rework 10 cũ + thêm 8), giữ 45 quái và 30 Thượng Cổ; tổng catalogue mục tiêu 200 kỹ năng chủ động/bị động. Tất cả có thiết kế dưới đây; các kiểu tái sử dụng phải có ID/trigger rõ. Lâu La không tự nhiên được thêm hàng loạt chiêu: giữ đòn cơ bản dễ đọc để bot mới farm được.

Phạm vi gồm dữ liệu, thực thi effect, AI sử dụng/khắc chế, animation/VFX/âm thanh, bảng kỹ năng và kiểm thử. Hiệu ứng 10 Thượng Bảo được kiểm tra tương thích; không mở rộng danh sách trang bị ở lượt này.

Giữ: cấp bot vô hạn; AI không bị khóa vũ khí/build hay giới hạn bốn kỹ năng đã học; luật combat ba thực thể/bốn khi đúng hai cặp liên minh; Yêu Tướng không đánh hội đồng; nước không combat; địa hình có va chạm; chuỗi năm Thượng Cổ và room 1500×1500; countdown 20s/10s; loot và hồi máu hiện tại. Mọi thay đổi riêng dưới đây là đề xuất mới có chủ đích.

## 2. Điểm yếu thấy trong source

- Nhiều t1/t2/t3 trong skillsData chỉ đổi hệ số, bán kính, thời lượng. Bot biết nhiều chiêu nhưng nâng cấp chưa thay đổi rõ cách đánh.
- makePassive suy loại từ vài trường số; nội tại chỉ có tên/mô tả, gồm nhiều Yêu Vương/Yêu Thần, bị rơi về guard. Không thể coi tên khác nhau là hiệu lực khác nhau.
- tickFields đang yêu cầu có damage thực tế trước một số hiệu ứng. Vùng thuần cản đường/khống chế cần tác dụng ngay cả khi không gây damage; hấp thụ damage không mặc định xóa mọi effect.
- Nội tại bot lv15 đang được gắn đồng loạt, dễ khiến mọi cá thể có cùng bộ phản/độc/hút/guard. Đề xuất cập nhật: mở kho 18 nội tại từ lv3, tặng một nội tại B1 hợp tính cách; bot dùng điểm kỹ năng hiện có để học/nâng các nội tại khác. Không thêm loại tiền hay khóa nhánh.
- AI chọn chiêu phần lớn theo vai trò/HP/cự ly. Cần đọc cửa ngắt, hướng đỡ, dấu, vật cản, lane và phần tài nguyên dành cho chiêu tiếp theo.

## 3. Thang tăng tiến

| Bậc | Giá trị bắt buộc | Ví dụ |
| --- | --- | --- |
| 1 — Nền tảng | Một công dụng hoàn chỉnh, đơn giản, có cách đối phó | Blink tới điểm hợp lệ; đạn băng đặt Lạnh |
| 2 — Phối hợp | Thêm điều kiện/địa hình/cửa nối giúp chủ động tạo lợi thế | Blink để ảnh giả; băng tạo mặt băng sau hai dấu |
| 3 — Làm chủ | Thêm lựa chọn, chuyển đổi tài nguyên hoặc biến thể đặc trưng | Quay lại ảnh; tiêu khiên mana để đẩy địch |

Giữ ba bậc và điểm kỹ năng hiện có. Bậc cao kế thừa công dụng trước, nhưng lựa chọn đánh/thoát, giữ/xả thường loại trừ nhau. Học ít rồi nâng sâu và học nhiều bậc thấp đều phải là phương án có giá trị. Cấp cao tăng sức nền/khả năng đầu tư; không kéo dài stun, bán kính và số projectile vô hạn theo level.

Ngân sách khởi điểm để prototype, sẽ hiệu chỉnh bằng duel: skill thường tổng 0,7–1,2 ATK ở B1, 0,9–1,4 ở B2, 1,1–1,7 ở B3. Chiêu nặng/finisher có điều kiện tối đa khoảng 2,2 ATK, lấy đà/hồi dài hơn. Damage nhiều hit, DoT, ảnh nổ và nối đòn chia **một ngân sách**, không mỗi nhịp nhận trọn hệ số. Bậc thêm hiệu ứng mạnh có thể tăng ít damage hoặc giữ nguyên damage.

Một skill chỉ lấy một hiệu ứng chính mạnh và một hiệu ứng phụ nhẹ; không đóng gói stun + hút + phá khiên + hồi vào mọi chiêu. Hoàn lại cooldown/chi phí chỉ một phần, tối đa một lần mỗi cast; không reset toàn bộ hay miễn nhiễm ngẫu nhiên.

## 4. Ngôn ngữ combat chung

Tái dùng HP/mana/stamina, guard, điểm ngắm, castId, trạng thái và field hiện có. **Không thêm một thanh posture toàn cục**: áp lực guard dùng stamina và độ bền khiên đang có.

| Cơ chế | Ảnh hưởng hành vi | Cách đối phó |
| --- | --- | --- |
| Sơ hở | Cửa hồi/đổi hướng guard ngắn sau hụt, phá guard hoặc niệm bị ngắt; không auto crit hay auto hit | Dùng né/cover, đồng minh che, tránh đầu tư hết stamina |
| Giáp nứt theo hướng | Đánh cùng phía tạo lợi thế cho đòn sau, khác phá %giáp vĩnh viễn | Xoay thế, đổi vị trí, chờ dấu hết |
| Dấu/charge có nguồn | Lạnh, nọc, huyết ấn… tối đa 2–3; đánh/cắt đúng điều kiện để tiêu | Giải/rời vùng/cắt tầm nhìn; hết thời hạn tự giảm |
| Lane/vùng tồn tại | Lửa, băng, tơ, hố, neo làm thay đổi đường tiếp cận và chỗ hồi | Đi vòng, phá neo, đốt tơ, dùng cover |
| Channel/đỡ chính xác | Giữ hồi/niệm có rủi ro; đỡ đúng có thể mở phản công | Đánh ngắt, nhử, vòng sau |
| Hấp thụ rồi chuyển đổi | Khiên/charge được đổi thành đẩy, lá chắn hoặc nhịp di chuyển | Ép xả sớm, đánh sau cửa xả |
| Thông tin bị che | Khói/ảnh giả cắt tracking thật; AI tìm điểm cuối nhìn thấy | AoE có dự đoán, dò vùng, đổi góc nhìn |

Chỉ định bốn tương tác cần làm đầu: lửa đốt bụi/tơ; lửa gặp vùng lạnh thành hơi nước; áp lực guard mở sơ hở; dấu hợp lệ được tiêu bởi một chiêu nối. Không xây một hệ phản ứng nguyên tố tổng quát cho mọi tổ hợp.

Luật khống chế: hard CC bot thông thường 0,25–0,7s/lần; miễn hard CC chung 3s sau tác dụng thành công. Slow lấy mức mạnh nhất, trần khởi điểm 35%; không nhân cộng mọi nguồn. Hất/kéo tôn trọng va chạm, phòng, địa phận và nhóm combat. Boss miễn hard CC vẫn miễn; skill có giá trị qua cản vị trí, ngắt các cửa niệm được đánh dấu, tạo điểm yếu hoặc tiêu charge, không lách miễn CC bằng tên trạng thái mới.

Giữ cadence: bot ≥1,8s giữa cast mới; Yêu Tướng/Yêu Vương ≥3s; Yêu Thần ≥2s; Thượng Cổ ≥1s. Hành động thứ hai của Blink/xả khiên thuộc cùng cast, có cửa thời gian, chi phí và budget đã tính; không tính như cast miễn phí mới và không bỏ cadence.

Địa hình kỹ năng tối đa hai vật cản lớn mỗi chủ thể, luôn chừa cửa thoát; hủy theo thời gian/chủ thể chết/new match. Không phá nhà/tường bản đồ vĩnh viễn, không lấp kín điện thờ/room. Quỷ binh/linh hồn vũ khí là hiệu ứng gắn chủ sở hữu, không tạo thành viên mới để lách rule. Riêng Phản Chiếu giữ hai phân thân có thể bị đánh như hiện tại: hai phân thân + một bot tính đủ ba thành viên; HP phase và ngân sách chiêu dùng chung, không nhận thêm người vào cụm.

## 5. Danh mục 32 kỹ năng bot

B2/B3 kế thừa bậc trước trừ khi bảng ghi chuyển đổi/đổi lựa chọn. Mỗi hàng đều phải có regression cho cơ chế được thêm, không chỉ so damage.
### Cận chiến

| Kỹ năng | B1 | B2 thêm | B3 thêm | Khắc chế |
| --- | --- | --- | --- | --- |
| **Chém Sấm Sét** (`w_thunder_slash`) | Chém khóa hướng, để lại một vệt dẫn điện ngắn. | Chém trúng mục tiêu đang niệm sẽ ngắt chiêu có thể ngắt; vệt dẫn điện báo rõ. | Chém qua vệt của chính mình tạo một nhịp sét phụ trễ, buộc địch chọn né nhát chém hay rời vệt. | Né ngang; không đứng trên vệt. |
| **Khiên Chắn Cương Bộc** (`w_shield_bash`) | Lao khiên ngắn, đỡ chính diện lúc chuẩn bị. | Đỡ trúng trong lấy đà khiến cú lao hất lệch đối thủ khỏi vị trí phòng thủ. | Lao khiên phá thế đỡ đã suy kiệt; hụt sẽ mất thế thủ và chịu hồi động tác. | Né ngang hoặc đánh sau lưng; không phá guard còn đầy tài nguyên. |
| **Lốc Kiếm** (`w_whirlwind`) | Ba nhịp quét có điểm dừng, tiêu thể lực theo nhịp. | Có thể dịch chuyển chậm giữa các nhịp, điều khiển vòng ép. | Nhịp cuối hất đối thủ ra rìa và tạo cửa thoát; không hút kẻ đã ra khỏi vòng. | Ra ngoài vòng giữa hai nhịp; đỡ đầu rồi phản công lúc kết thúc. |
| **Xung Phong Phá Trận** (`w_crushing_charge`) | Lao thẳng có va chạm và vùng báo hướng. | Địch bị đẩy va tường sẽ rơi vào sơ hở ngắn; không gây stun dài. | Va trúng mở một đòn đâm tiếp nối tùy chọn; bot chọn dùng hay giữ thể lực. | Né ngang; không đứng giữa địch và tường. |
| **Hơi Thở Thứ Hai** (`w_second_wind`) | Lùi một nhịp và hồi ngắt được, đòn trúng chấm dứt phần hồi còn lại. | Hoàn thành hồi giải một trạng thái nhẹ: độc hoặc chậm, theo ưu tiên nguy hiểm. | Hoàn thành hồi nạp một lần giảm chi phí đỡ/né; mất nếu bị ngắt. | Áp sát/ngắt; người dùng cần tạo khoảng trống trước. |
| **Bổ Kết Liễu** (`w_execution_cleave`) | Bổ xuống chậm; hiệu quả kết liễu cần mục tiêu ít máu. | Đánh trúng kẻ đang sơ hở khóa khả năng đỡ lại trong cửa sổ rất ngắn. | Kết liễu thành công trả một phần thể lực và mở lùi chiến thuật; hụt vẫn chịu hồi động tác đầy đủ. | Rời điểm khóa; không cho đối thủ tạo sơ hở trước. |
| **Địa Chấn** (`w_earthquake_stomp`) | Vòng chấn động lan từ tâm ra ngoài, có vùng an toàn rõ. | Vòng chấn động cắt một đường băng/tơ của địch đi qua. | Địch cố dash xuyên vòng trong đúng nhịp sẽ mất phần dash còn lại; không khóa né sau đó. | Chờ vòng đi qua hoặc tìm khe; không dash mù vào vòng. |
| **Bức Tường Sắt** (`w_iron_wall`) | Đỡ hướng cố định, ngân sách và thể lực hữu hạn. | Giữ nguyên hướng đủ lâu mở cửa đỡ chính xác; đỡ chính xác gây sơ hở cho đòn cận chiến tới. | Có thể tiến chậm khi đỡ; chủ động hạ khiên mở một đòn đáp trả, không miễn sát thương. | Bọc hậu, nhử cửa đỡ chính xác hoặc ép cạn thể lực. |
| **Đâm Xuyên Giáp** (`w_armor_piercer`) | Đâm hẹp để lại điểm giáp nứt ở hướng trúng. | Đòn thường sau đó trúng từ cùng phía kéo dài một lần điểm nứt. | Đánh trúng giáp nứt khi địch đang đỡ làm vỡ phần khiên còn yếu, tạo sơ hở. | Đổi mặt phòng thủ, né ngang; chỉ một điểm nứt mỗi nguồn. |
| **Phản Kiếm** (`w_riposte`) | Cửa phản một đòn chính diện, thất bại phải hồi động tác. | Phản thành công giữ cự ly bằng một bước xoay sang sườn hợp lệ. | Cho chọn phản đòn hoặc giải một trói mềm để thoát; không được nhận cả hai. | Nhử phản rồi đánh, dùng vùng sát thương thay đòn trực diện. |

### Phép thuật

| Kỹ năng | B1 | B2 thêm | B3 thêm | Khắc chế |
| --- | --- | --- | --- | --- |
| **Hỏa Cầu** (`m_fireball`) | Đạn nổ để lại vũng lửa nhỏ, chặn đứng một vị trí. | Lửa đốt bụi/tơ kỹ năng có thời hạn, mở đường tiếp cận. | Chạm vùng lạnh tạo hơi nước che tầm nhìn ngắn, tiêu thụ vùng lạnh/lửa liên quan. | Cover; không trú mãi một bụi; cả hai bên đều bị hơi nước che. |
| **Băng Tiễn** (`m_frost_bolt`) | Đạn tích một dấu Lạnh, làm khó đổi hướng ngắn. | Dấu Lạnh thứ hai tạo mặt băng ngắn dưới chân, phải thoát để tránh đóng băng. | Đánh vào kẻ đang trên băng gây đóng băng ngắn; nếu miễn CC thì chỉ cản di chuyển nhẹ. | Rời băng trước phát tiếp; không tăng slow vô hạn. |
| **Thiểm Di** (`m_blink`) | Dịch đến điểm hợp lệ, dừng trước vật cản. | Để lại ảnh giả làm đòn nhắm đơn đã khóa mất tracking; AoE vẫn trúng. | Trong cửa sổ ngắn có thể quay lại ảnh bằng lần kích hoạt thứ hai, chung cooldown/tài nguyên. | Canh cả hai đầu; bot không được biết điểm hạ cánh qua tường. |
| **Vòng Xoáy Trọng Lực** (`m_gravity_vortex`) | Vùng kéo nhịp, khe giữa các nhịp cho phép chạy thoát. | Tác động quỹ đạo projectile đi qua vùng, không hút xuyên cover. | Có thể chủ động kết thúc vùng bằng một xung đẩy ra ngoài, đổi khống chế lấy mở khoảng cách. | Rời vùng hoặc ép chủ chiêu phải tự kết thúc; không tự tiêu mọi projectile. |
| **Khiên Năng Lượng** (`m_mana_shield`) | Mana đổi lấy lá chắn hữu hạn, vẫn có thể vỡ. | Chủ động hạ khiên đúng trước đòn cho phép đỡ chính xác bằng mana. | Năng lượng đã hấp thụ được xả thành xung đẩy ngắn; xả tiêu khiên và mana còn dành cho khiên. | Cấu rỉa để cạn mana, nhử xả rồi áp sát; lượng xả có trần. |
| **Thiên Thạch** (`m_meteor_strike`) | Khóa điểm chậm, thiên thạch tạo hố cản ngắn có đường vòng. | Hố giữ nhiệt; đối thủ chọn vòng xa hoặc chịu rủi ro đi nhanh qua. | Có thể đánh sập tường kỹ năng phá hủy được; địch sát tường có thể dùng chính tường che va chạm đầu. | Ngắt niệm, rời dấu, dùng cover; không phá công trình bản đồ vĩnh viễn. |
| **Giáp Băng** (`m_ice_block`) | Đóng giáp tự hạn chế hành động, đỡ được đòn nhưng vẫn có thể vỡ. | Khi kết thúc đúng nhịp tạo mảnh băng cản một projectile trước mặt. | Giáp vỡ/kết thúc sinh vòng băng ngắn để rút lui; người dùng không tự hồi đầy tài nguyên. | Giữ cự ly rồi đánh cửa kết thúc; phá giáp từ bên hông. |

### Xạ kích

| Kỹ năng | B1 | B2 thêm | B3 thêm | Khắc chế |
| --- | --- | --- | --- | --- |
| **Liên Tiễn** (`a_double_tap`) | Hai phát có quãng ngắt, từng mũi tên né được. | Phát một trúng đánh dấu hướng né; phát hai chỉ điều chỉnh một lần theo hướng quan sát. | Nếu hai phát cùng trúng, đánh dấu mở cửa cho phát thường tiếp theo ép bước né; không bắn trúng tự động. | Đổi nhịp né hoặc dùng cover giữa hai phát. |
| **Lùi Bắn** (`a_disengage_vault`) | Nhảy lùi có va chạm và bắn trả. | Để lại dây cản rất ngắn ở điểm cũ, địch dash qua bị cắt quãng lao. | Có thể lùi chếch sang bên thay vì thẳng; trúng phát trả mở một lần né giá thấp. | Ép góc/tường, vòng dây; không luôn lùi xa hơn qua từng bậc. |
| **Mưa Tên** (`a_rain_of_arrows`) | Ba đợt tại vùng cố định, nhìn được khoảng ngắt. | Có thể bố trí hình quạt thay vòng để khóa một lối đi. | Một đợt cuối bắn vào vành ngoài, buộc địch quyết định ở tâm hay thoát sớm. | Đọc hình cảnh báo; tránh cả tâm lẫn vành theo thứ tự. |
| **Ngắm Bắn** (`a_snipe`) | Niệm có thể ngắt, đường ngắm hiển thị thật. | Chờ đủ thời gian khi có tầm nhìn tạo dấu điểm yếu, mất dấu nếu địch vào cover. | Trúng điểm yếu ngắt một chiêu đang niệm hoặc phá một khiên yếu; không đồng thời nhận mọi bonus. | Ngắt ngắm, cắt tầm nhìn; không khóa tọa độ địch vô hình. |
| **Bước Chân Gió** (`a_windrunner`) | Tăng khả năng đổi vị trí trong thời hạn. | Một lần đổi hướng nhanh tạo ảnh nhiễu ngắm, không miễn projectile vùng. | Sau né thành công mở cửa bắn một phát thường trong di chuyển rồi hết nhịp linh hoạt. | Ép lối hẹp, giữ chiêu chặn đường hạ cánh. |

### Ám sát

| Kỹ năng | B1 | B2 thêm | B3 thêm | Khắc chế |
| --- | --- | --- | --- | --- |
| **Ảnh Bộ** (`as_shadowstep`) | Lướt vật lý tới sườn, thưởng đúng hướng sau lưng. | Có thể bám theo địch vừa dash, chỉ tới điểm nhìn thấy và hợp lệ. | Đánh từ sau gây Mất thế: địch không thể quay guard tức thời trong cửa sổ ngắn. | Canh lưng/cover; địch vẫn né/đánh trả được. |
| **Biến Mất** (`as_vanish`) | Ẩn sau khoảng chuẩn bị; đánh/bị đánh sẽ lộ. | Để lại dấu chân giả ngắn; AI địch tìm dấu cuối đã thấy. | Sau khi cắt tầm nhìn thật có thể đổi một hướng giả để thoát hoặc tái tiếp cận. | AoE/đèn kỹ năng phát hiện; đang được nhìn trực tiếp không được biến mất tức thời. |
| **Cắt Yết Hầu** (`as_throat_slit`) | Đánh hẹp; chỉ ngắt/silence khi đúng lúc địch đang niệm. | Ngắt thành công cắt một hiệu ứng channel/hồi do chiêu đó tạo ra. | Đánh vào kẻ đã được chính mình đánh dấu mở lối thoát qua sườn; hồi chiêu không reset. | Nhử ngắt bằng chiêu rẻ rồi dùng chiêu chính; giáp/guard chính diện. |
| **Bom Khói** (`as_smoke_bomb`) | Khói cắt tầm nhìn thật, cả hai phía đều chịu tác động. | Khói làm đòn tracking đang bay tìm tới điểm cuối, không tự hủy đạn hay AoE. | Được chọn khói đặc ở tâm hoặc màn khói kéo dài theo lối đi, đổi mật độ lấy phạm vi. | Rời khói/bao vây mép; không mặc định miễn nhiễm vì đã ở trong khói. |
| **Ám Sát** (`as_assassinate`) | Đòn kết liễu cần HP thấp, chuẩn bị nhìn thấy được. | Xuất kích sau cắt tầm nhìn hoặc từ sau lưng tạo cửa tiếp cận hợp lệ. | Nếu không kết liễu nhưng trúng, có một bước rút nhỏ; chỉ kết liễu mới thu hồi một phần chi phí. | Giữ tầm nhìn, xoay lưng vào cover, chủ động đỡ lúc lấy đà. |

### Hỗ trợ

| Kỹ năng | B1 | B2 thêm | B3 thêm | Khắc chế |
| --- | --- | --- | --- | --- |
| **Chuyển Thế Vũ Trang** (`h_armament_swap`) | Chuyển thế công/thủ thật; thế thủ bỏ hiệu ứng công. | Chuyển thế đúng lúc đòn tới mở cửa phản công; bấm qua lại không liên tục nạp hiệu ứng. | Chuyển thế sau một đòn thường trúng được nối một động tác tương ứng công/thủ. | Nhử sai thế; tối thiểu một nhịp khóa thế trước khi chuyển lại. |
| **Lưỡi Kiếm Linh Lực** (`h_enchanted_blade`) | Nạp hữu hạn đòn cường hóa, hao một charge mỗi hành động. | Chọn hệ theo sở thích: lửa đặt vùng nhỏ hoặc băng tích Lạnh, không ngẫu nhiên mỗi frame. | Đòn charge cuối tiêu dấu cùng hệ để tạo xung kết hợp; không kích lại trên mọi pulse. | Né đòn charge cuối hoặc tách khỏi vùng; nhận biết hệ trên vũ khí. |
| **Linh Khí Hồi Phục** (`h_healing_aura`) | Vùng hồi cố định cần giữ vị trí; rời vùng mất hồi. | Đứng đủ một nhịp giải một trạng thái nhẹ cho mình/đồng minh. | Chủ động kết thúc vùng để đổi phần hồi chưa dùng thành lá chắn ngắn có trần. | Đẩy khỏi vùng, áp lực liên tục; không hồi và đổi khiên từ cùng một lượng hai lần. |
| **Phong Thể** (`h_wind_form`) | Đổi vị trí và giải chậm nhẹ; trên sông vẫn chỉ bơi. | Một lần lướt qua vùng tơ/lạnh được cắt ảnh hưởng di chuyển của vùng đó, không bỏ va chạm tường. | Cho một pha xoay xuyên sườn đối thủ tại chỗ trống, mở lựa chọn áp sát hoặc tháo chạy. | Khóa đường ra bằng vật cản; không được đi xuyên kiến trúc hay combat trên nước. |
| **Hỗn Mang Tiễn** (`h_chaos_bolt`) | Đạn ảnh hưởng trạng thái địch: đang đỡ gây áp lực guard, đang niệm gây nhiễu. | Có thể tiêu một dấu nguyên tố của chính mình để đổi nhiễu thành kéo lệch ngắn. | Đòn tới mục tiêu đủ điều kiện tạo vùng bất ổn trễ, buộc đổi vị trí sau khi đỡ. | Cover, không gom nhiều dấu; chỉ một kết quả chính mỗi lần trúng. |

## 6. Quái: tăng tiến theo cấp bậc đối thủ

Quái không tiêu điểm kỹ năng như bot. Yêu Thú dạy một cơ chế nhận biết được; Yêu Tướng kết hợp hai chiêu với nội tại; Yêu Vương khống chế một phần sào huyệt và có biến thể khi ít máu; Yêu Thần là bài kiểm tra phối hợp cơ chế. Không bê toàn bộ bộ ba bậc bot vào từng quái. Mức khó tăng bằng tổ hợp và khả năng chọn tình huống, giữ warning/cadence và đường thoát.

### Đao Phủ Đoạt Mệnh

| Kỹ năng | Công dụng chiến thuật | Tiến triển/chuỗi và cửa phản công |
| --- | --- | --- |
| Chém Bổ Đầu (`cleave_smash`) | Bổ điểm đã khóa; chém trượt cắm rìu, mở cửa đánh sườn. | Chém kẻ mất thế kéo hắn ra khỏi vị trí che chắn; không trừ HP theo %. |
| Xoay Rìu Cuồng Bạo (`axe_spin`) | Hai nhịp quét có quãng nghỉ, đẩy ra mép thay xoay liên tục. | Dùng để cắt đường lùi sau nhát bổ; bot có thể chui qua khe đúng nhịp. |

### Xà Tinh Đầm Lầy

| Kỹ năng | Công dụng chiến thuật | Tiến triển/chuỗi và cửa phản công |
| --- | --- | --- |
| Phun Axit Ăn Mòn (`acid_spit`) | Đặt vũng axit cản lối và phủ dấu ăn mòn. | Đuôi quét đẩy vào vũng; thoát/giải độc cắt tích lũy, không mất giáp vĩnh viễn. |
| Đuôi Quét Sấm Sét (`tail_sweep`) | Quét nửa vòng, đẩy theo hướng đầu đuôi. | Chọn hướng đẩy về axit khi nhìn thấy đường hợp lệ; bọc phía đầu để né. |

### Thống Lĩnh Nhân Mã

| Kỹ năng | Công dụng chiến thuật | Tiến triển/chuỗi và cửa phản công |
| --- | --- | --- |
| Mũi Tên Xuyên Phá (`piercing_arrow`) | Ngắm đường thẳng; xuyên một khiên yếu, dừng bởi kiến trúc. | Đánh dấu hành lang để chặn chạy; ép vào cover rồi áp sát từ góc khác. |
| Xung Phong Rung Chuyển (`gallop_charge`) | Nhân mã chạy một hành lang có điểm dừng rõ. | Dồn kẻ đang ngắm vào cover; va tường làm chính boss mất thế. |

### Hắc Vu Cốt Tinh

| Kỹ năng | Công dụng chiến thuật | Tiến triển/chuỗi và cửa phản công |
| --- | --- | --- |
| Cầu Lửa Hắc Ám (`dark_fireball`) | Hỏa cầu để lại vùng hắc hỏa nhỏ, giảm hiệu quả hồi trong vùng có trần. | Chỉ phủ một lối ra của lồng, luôn để lối thoát khác. |
| Vòng Khống Chế Địa Ngục (`bone_cage`) | Lồng có hai đầu mở, tường kỹ năng phá được. | Boss khóa một lối bằng cầu lửa sau quãng đọc; không tạo vòng nhốt kín. |

### Tướng Quân Khỉ Đột

| Kỹ năng | Công dụng chiến thuật | Tiến triển/chuỗi và cửa phản công |
| --- | --- | --- |
| Đập Đất Liên Hoàn (`ground_pound`) | Sóng đất nối nhau, vùng an toàn đổi vị trí giữa các nhịp. | Nhịp cuối làm rơi guard yếu nếu địch cố đứng đỡ mọi nhịp; không stun liên hoàn. |
| Ném Tảng Đá Lớn (`throw_boulder`) | Ném đá đọc hướng; cover chặn được và đá vụn tồn tại ngắn. | Có thể dùng đá vụn làm chỗ che khi hồi động tác; địch đổi góc phá thế thủ. |

### Viêm Ma Bạo Chúa

| Kỹ năng | Công dụng chiến thuật | Tiến triển/chuỗi và cửa phản công |
| --- | --- | --- |
| Hỏa Trụ Tận Thế (`fire_pillars`) | Ba cột mọc lần lượt khóa các điểm cũ, luôn có khe. | Cột để nền nóng; nhịp cuối mở đường cho đập búa. |
| Đập Búa Nham Thạch (`magma_hammer`) | Bổ búa hướng cố định, tạo rãnh lửa ngắn. | Va nền nóng gây xung hất khỏi nền, không cộng hai lần toàn bộ sát thương. |
| Gầm Thét Hủy Diệt (`destroyer_roar`) | Hô có lấy đà; vòng đẩy phá ngắm/chuẩn bị ở gần. | Dùng khi bị áp sát hoặc bị ngắt liên tiếp; né ra rìa rồi phản công. |

### Cuồng Bạo Kim Cương Vương

| Kỹ năng | Công dụng chiến thuật | Tiến triển/chuỗi và cửa phản công |
| --- | --- | --- |
| Ném Cự Thạch Hủy Diệt (`mega_boulder`) | Đá lớn chia lane thành hai đường vòng, không chặn mọi cửa. | Boss có thể đập đá của chính mình tạo vụn có cảnh báo. |
| Nhảy Bổ Nghiền Nát (`crater_leap`) | Nhảy tới vị trí đã thấy; hố có cửa chạy qua giữa các sóng. | Nhảy dùng để cắt đường bắn, không cập nhật tọa độ tàng hình giữa không trung. |
| Đấm Loạn Xạ 8 Nhịp (`fury_punches`) | Tám đấm chia thành các cặp; chỉ xoay giữa cặp, cho đối thủ bọc sau. | Khi địch vỡ guard, boss tiếp tục cặp kế thay tự động kết liễu; hụt cuối lộ lưng. |

### Thanh Xà Đế Vương

| Kỹ năng | Công dụng chiến thuật | Tiến triển/chuỗi và cửa phản công |
| --- | --- | --- |
| Tam Đầu Phun Nọc (`triple_spray`) | Ba luồng nọc có khe khô; vị trí phủ khác nhau. | Quấn địch có nọc mở hút nhẹ, nhưng nọc không gây trừ giáp vô hạn. |
| Quấn Quít Bóp Nghẹt (`constrict`) | Dây/quấn theo đường nhìn thấy, đứt bởi cover hoặc khoảng cách. | Tích áp lực trước bóp; bot đánh cắt/né/giải trói được trước khi hoàn tất. |
| Độn Thổ Xuất Kích (`burrow_strike`) | Dấu đất chạy tới vị trí cuối, chui lên có cảnh báo. | Bỏ vùng bị áp sát rồi tái xuất ở sườn; không xuyên tường, sào huyệt khác hay sông. |

### Lãnh Chúa Xương Vong Hồn

| Kỹ năng | Công dụng chiến thuật | Tiến triển/chuỗi và cửa phản công |
| --- | --- | --- |
| Băng Phong Bão Tố (`blizzard_storm`) | Vùng bão có mắt bão, tích Lạnh thay đóng băng tức thời. | Xiềng kéo về vành bão; cắt xiềng trước nhịp lạnh cuối để thoát. |
| Xiềng Xích Linh Hồn (`soul_chains`) | Xích cần tầm nhìn và có điểm neo phá được. | Kéo một nhịp sau delay; cắt neo hoặc vòng cover để phá combo. |
| Tiếng Thét Đoạt Mệnh (`death_scream`) | Tiếng thét vùng nón ngắt kỹ năng đang niệm. | Dùng khi bị ép cận hoặc thấy địch đứng hồi; không ép mọi bot chạy vì sợ. |

### Thái Cổ Hỗn Độn Ma Long

| Kỹ năng | Công dụng chiến thuật | Tiến triển/chuỗi và cửa phản công |
| --- | --- | --- |
| Long Tức Hủy Diệt (`void_breath`) | Long tức quét một hành lang, boss chỉ xoay với tốc độ hữu hạn. | Trải tàn dư hư không; đổi phía trước khi bắt đầu quét, không bám đầu chính xác từng frame. |
| Bão Tố Hư Vô (`void_vortex`) | Hút theo nhịp có khe, không kéo xuyên kiến trúc. | Long tức hướng về cạnh vortex thay phủ toàn vùng cùng lúc. |
| Thiên Thạch Rơi Tự Do (`meteor_rain`) | Thiên thạch khóa vị trí theo từng loạt, không rải kín điện thờ. | Các loạt hình khác nhau; bot có thể dùng hố tàn dư để che long tức. |
| Đóng Băng Thời Gian (`time_freeze`) | Vùng thời gian cần tích phơi nhiễm; mép chạy ra được. | Chỉ đóng băng ngắn sau đủ tích lũy; boss cũng hồi động tác dài sau xả. |
| Cánh Quạt Chấn Động (`wing_gale`) | Quạt đẩy theo hướng; có khe sát sườn. | Xua địch khỏi cover để nối long tức nhưng không ép vào nước để đánh. |

### Viêm Đế Phượng Hoàng

| Kỹ năng | Công dụng chiến thuật | Tiến triển/chuỗi và cửa phản công |
| --- | --- | --- |
| Biển Lửa Thái Dương (`solar_sea`) | Biển lửa có đảo/khe an toàn được báo trước. | Đảo thay đổi từng nhịp; không khiến cả điện thờ đồng thời bắt buộc chịu damage. |
| Lặn Lao Thiêu Rụi (`dive_bomb`) | Lao xuống điểm cũ, để lông cháy trên đường bay. | Thả lông khóa một đường thoát; điểm đáp hụt làm lộ lõi. |
| Tiếng Ca Bỏng Rát (`scorching_song`) | Channel theo nhịp, vòng nhiệt đi ra ngoài. | Ngắt đúng nhịp dừng các vòng chưa phát; boss giữ lửa đã tạo, không mất hết chiêu. |
| Bão Cánh Mặt Trời (`wing_flare`) | Quạt lông lửa theo các quạt tách biệt. | Khi gặp vùng lạnh, lông tạo hơi nước có lợi/hại cho cả hai phía. |
| Tự Bạo Hạt Nhân (`supernova`) | Tích lực dài, lõi hiện rõ; có cách ngắt hoặc chạy tới cover đúng điều kiện. | Niết bàn chỉ kích sau tử trận thật của lần đầu, không cộng thêm hồi trong lấy đà. |

### Tru Tiên Thần Cây Cổ Đại

| Kỹ năng | Công dụng chiến thuật | Tiến triển/chuỗi và cửa phản công |
| --- | --- | --- |
| Rễ Cây Xuyên Tim (`heart_roots`) | Rễ theo đường, đầu rễ là neo phá được. | Nối vào vùng bào tử để ép chọn cắt rễ hay bỏ vị trí. |
| Mưa Hạt Gai Nhọn (`thorn_rain`) | Mưa gai tạo bãi gai tạm có khoảng hở. | Cắt bãi gai bằng lửa/địa chấn; đòn thường đi qua vẫn có lối vòng. |
| Đập Cành Trời Giáng (`branch_slam`) | Đập cành khóa hướng, nhịp thu cành tạo sơ hở. | Đập lên bãi gai đẩy gai một đoạn, không tạo sát thương kép tức thời. |
| Bão Bào Tử Ngủ Say (`sleep_spores`) | Phơi nhiễm liên tục mới ngủ, rời vùng làm giảm tích lũy. | Lửa tiêu vùng bào tử; ngủ chỉ một lần trong cửa miễn CC. |
| Rút Cạn Sinh Lực (`drain_vitality`) | Kênh hút có dây nhìn thấy, dừng khi cắt cover/tầm hoặc phá neo. | Boss dùng khi bot đang bị rễ; bot vẫn có một cửa hành động trước hút. |

### U Minh Diêm La Vương

| Kỹ năng | Công dụng chiến thuật | Tiến triển/chuỗi và cửa phản công |
| --- | --- | --- |
| Trát Tử Hình (`death_warrant`) | Dấu truy nã có thời gian và điều kiện, không phải án chết chắc. | Đỡ đúng/giải dấu tại điểm neo làm án bị hủy hoặc giảm cấp. |
| Phán Quyết Luân Hồi (`reincarnation_doom`) | Phán quyết cần dấu còn hiệu lực, lấy đà nhìn thấy. | Địch đã hủy dấu khiến boss hụt nghi lễ và lộ lõi; không bỏ qua mọi khiên/HP. |
| Triệu Hồi Quỷ Binh (`summon_ghost_army`) | Quỷ binh là hiệu ứng lane/vật chắn kỹ năng, không thêm thực thể tham chiến. | Bot phá banner/neo để dẹp một lane; tránh biến trận ba người thành đánh hội đồng. |
| Cầu Vồng Âm Ti (`underworld_rainbow`) | Đường quét theo màu/nhịp, tác dụng cắt đường. | Boss chọn đường đối thủ đã lộ, mỗi lần chỉ một hiệu ứng khống chế chính. |
| Xích Trói Ngũ Mã (`five_horse_chains`) | Các neo xích phát sáng, dây đứt theo khoảng cách/cover. | Phá một neo mở cửa thoát; boss không kéo xuyên tường hay giữ stun dài. |

### Thiết Giáp Tê Ngưu Vương — farm cuối

| Kỹ năng | Công dụng chiến thuật | Tiến triển/chuỗi |
| --- | --- | --- |
| Thiết Giáp Xung Phong (`rhino_charge`) | Lao thiết giáp khóa hướng, va tường kỹ năng làm vỡ lớp giáp ngoài. | Đổi nhịp đầu trận/giữa trận; bot nhử lao vào cover để mở điểm yếu. |
| Địa Chấn Thiết Đề (`rhino_slam`) | Sóng chân vòng ngoài, phần sau lưng có khe. | Địch đứng đỡ liên tiếp bị áp lực stamina; hụt mở cửa loot/đánh trả. |
| Gầm Thét Sơn Hà (`rhino_roar`) | Gầm nạp giáp nhìn thấy được, có thể ngắt đúng nhịp. | Chỉ phục hồi lớp giáp tạm nếu không bị ngắt, không hồi HP vô hạn. |

## 7. Thượng Cổ: phase 2 đổi cách chơi

Giữ hai thanh HP. Chiêu vốn chỉ mở phase 2 tiếp tục chỉ mở phase 2. Các chiêu còn lại có biến thể đọc được, không đơn giản tăng tốc/damage/xóa cooldown. P1 dạy pattern, P2 yêu cầu vận dụng nó trong tổ hợp mới. Mỗi boss có một khoảng hồi lớn sau chuỗi; AI có thể chủ động tạo khoảng đó bằng nhử, phá neo hoặc ép tài nguyên. Truy sát tới chết tiếp tục áp dụng, nhưng truy sát vẫn bị cover/tầm nhìn và hụt chiêu.

### Bàn Cổ Dị Hình — Thủy Tổ Cự Ma

| Kỹ năng | P1 → P2 và cách đối phó |
| --- | --- |
| Thiên Thạch Rơi Tự Do (`ac_meteor`) | P1 các dấu đá thưa, đá rơi làm cover tạm; P2 loạt sau khóa đường vòng quanh cover nhưng luôn chừa lane. |
| Cú Đấm Bẻ Gãy Không Gian (`ac_punch`) | P1 đấm đẩy có vùng bên hông an toàn; P2 đấm vỡ cover kỹ năng của chính boss, báo mảnh vỡ trước. |
| Hố Tụt Tử Thần (`ac_sink`) | P1 hút theo nhịp về hố; P2 boss có thể đấm địch mắc hố nhưng xung hút cuối đẩy ra, mở cơ hội thoát. |
| Tường Đá Ngăn Cách (`ac_wall`) | P1 dựng tường có hai đầu đi vòng; P2 đổi một đoạn thành cổng sập trễ, không khóa mọi đường. |
| Tia Năng Lượng Địa Lõi (`ac_beam`) | P1 tia địa lõi quét có tốc độ quay hữu hạn; P2 tia phản khỏi một tường do boss tạo, hiển thị cả đường phản. |
| Tận Thế Sụp Đổ (`ac_lava`) | P1 chưa dùng; P2 dung nham mở/đóng hai hành lang theo nhịp, bot đọc vị trí an toàn kế tiếp. |

### Phản Chiếu Nguyên Thủy — Bản Sao Hoàn Hảo

| Kỹ năng | P1 → P2 và cách đối phó |
| --- | --- |
| Nguyên Bản Cường Hóa — Nhát Chém Tận Diệt (`am_original_1`) | Sao chép mechanics bậc hiện có, giới hạn charge/dấu/cooldown giống bản gốc; P2 phản chiếu hướng tiếp cận thay chỉ nhân damage. |
| Nguyên Bản Cường Hóa — Ma Lực Tận Thế (`am_original_2`) | Sao chép một chiêu thuộc vai trò khác để bổ trợ chiêu đầu; P2 mở nhánh phối hợp nhưng không sao chép cùng chiêu hai lần. |
| Địa Chấn Xung Kích (`am_dash`) | P1 nhảy khóa điểm; P2 ảnh đáp giả xuất hiện trước điểm đáp thật với ký hiệu phân biệt, vẫn có cửa đọc. |
| Vũ Trang Nghịch Chuyển (`am_swap`) | P1 đọc vũ khí đang dùng và đổi thế tương ứng; P2 có nhánh nhử đổi thế, giữ thời gian cam kết tối thiểu. |
| Mô Phỏng Trảm Quyết (`am_combo`) | P1 dùng chuỗi đã quan sát lúc hạ Yêu Thần; P2 thêm một biến thể vị trí, giữa các đòn vẫn có khoảng phản ứng. |
| Gương Vỡ Tàn Bạo (`am_split`) | P1 chưa dùng; P2 hai bản một ép gần/một giữ lane, dùng chung ngân sách chiêu/HP phase; hai bản + bot tính đủ ba thành viên combat. |

### Quy Khư Thôn Thiên Kỷ — Hố Đen Nguyên Thủy

| Kỹ năng | P1 → P2 và cách đối phó |
| --- | --- |
| Thôn Phệ Vạn Vật (`av_devour`) | P1 hút đường thẳng rồi cắn; P2 hút projectile/vùng do bot tạo trong đúng lane để sạc miệng, bot nhử sạc sai hướng. |
| Nôn Mửa Axit Hư Không (`av_acid`) | P1 vùng axit có thể chạy ra; P2 tiêu axit của chính boss để mở một đường hút, không nhân vô hạn số vũng. |
| Lặn Vào Vực Sâu (`av_dive`) | P1 lặn tới dấu đất; P2 đổi vị trí từ vùng axit còn tồn tại, luôn báo điểm lên trước. |
| Xúc Tu Bóng Tối (`av_tentacles`) | P1 các cặp xúc tu khóa lane xen kẽ; P2 một cặp chắn và một cặp quét, phá mấu xúc tu mở lane. |
| Tiếng Hú Đói Cào (`av_howl`) | P1 phá ngắm gần theo nón; P2 làm dao động một vùng hút sẵn, không cưỡng ép AI bỏ mọi kế hoạch. |
| Sự Sụp Đổ Không Gian (`av_collapse`) | P1 chưa dùng; P2 sụp ba hành lang có trình tự, dấu nứt báo lane tiếp; không trừ thẳng 80% HP. |

### Hỗn Độn Ma Tổ — La Hầu

| Kỹ năng | P1 → P2 và cách đối phó |
| --- | --- |
| Tứ Hướng Trảm Tuyệt (`ah_cross`) | P1 bốn đường chém với các góc an toàn; P2 đổi thứ tự hai trục nhưng giữ dấu hướng và quãng nghỉ. |
| Vạn Kiếm Quy Tông (`ah_swords`) | P1 đạn bám mất dấu khi bị che; P2 chia loạt khóa điểm cũ và loạt bám, có màu phân biệt. |
| Giáng Thương Đoạt Mệnh (`ah_spear`) | P1 thương cắm tạo neo; P2 nối một dây với neo trước, phá neo giải kéo và mở cửa áp sát. |
| Búa Tạ Xé Trời (`ah_hammer`) | P1 rãnh địa chấn lan theo đường; P2 có thể đập neo thương để chuyển rãnh, chỗ neo bị mất phải mở lối. |
| Cung Ma Diệt Hồn (`ah_arrow`) | P1 ngắm hành lang xuyên đấu trường, cover chặn; P2 một phản xạ vào tường kỹ năng được vẽ trước. |
| Ma Trận Lục Đạo Luân Hồi (`ah_matrix`) | P1 chưa dùng; P2 sáu vùng đổi theo nhịp, hạ neo linh hồn tắt một vùng; linh hồn không trở thành sáu quái độc lập. |

### Tận Thế Cơ Thần — Zero Protocol

| Kỹ năng | P1 → P2 và cách đối phó |
| --- | --- |
| Pháo Laser Quét Quỹ Đạo (`az_laser`) | P1 tia quay bị cover chặn; P2 có chu kỳ nóng/nguội, lúc xả nhiệt lộ giáp và giảm khả năng xoay. |
| Mưa Tên Lửa Tầm Nhiệt (`az_missiles`) | P1 tên lửa theo loạt, mất tracking khi cắt tầm; P2 chia đạn nhử/đạn thật bằng hiệu ứng rõ, bot chọn cover. |
| Lưới Điện Cao Áp (`az_net`) | P1 lưới với tâm/khe an toàn; P2 có cột nguồn phá được để tắt một cạnh, không khóa cả room. |
| Máy Cưa Động Cơ Hủy Diệt (`az_saw`) | P1 lao cưa phá cover kỹ năng trên lane; P2 va cover đủ dày làm nóng cưa và lộ sườn, bot nhử được. |
| Cú Nện Thủy Lực (`az_slam`) | P1 nện thủy lực lan vòng; P2 tiêu mức nhiệt để thêm một xung và sau đó buộc hồi động tác dài. |
| Lệnh Tự Hủy Hoại Thức Tỉnh (`az_nuclear`) | P1 chưa dùng; P2 mở lõi đếm ngược, bot chọn cover hoặc phá lõi đúng ngưỡng; đủ phá sẽ ngắt và mở cửa phản công. |

## 8. Nội tại: hành vi thật, không cùng tên khác chỉ số

### 8.1. Bộ 18 kỹ năng bị động cho bot

Bổ sung theo yêu cầu: nội tại tập trung vào **cơ động, sinh tồn và tạo đột biến**. Rework mười nội tại hiện có thành mười chức năng mới/được làm rõ và thêm tám nội tại; không giữ phiên bản cũ song song để proc hai lần. Kho đề xuất có 18 mục, sáu ở mỗi nhóm. Nhóm chỉ phục vụ đọc và chấm sở thích, không khóa build hay yêu cầu bot chọn đủ mỗi nhóm.

**Điều chỉnh mốc học so với plan trước:** đề xuất mở kho ở lv3 và tặng một nội tại B1 theo tính cách/sở thích; học/nâng các mục tiếp theo dùng điểm kỹ năng hiện có. Lv15 tiếp tục là mốc sức mạnh/hiệu ứng đã có, nhưng không tự gắn cả bộ nội tại. Lý do mở sớm: phần lớn các đụng độ bot-bot diễn ra trước lv15, nội tại phải giúp những trận này có cơ hội thoát và phản công. Đây là thay đổi được đề xuất, chưa phải hành vi source hiện tại.

Không giới hạn số nội tại được học; bot tự cân nhắc học rộng/nâng sâu và đầu tư active/passive. Không thêm nút cast nội tại. Trigger tự nạp cửa/charge; nhánh B2/B3 được chọn theo **hành động bình thường kế tiếp** (né, đi, đánh, giữ guard hoặc hồi) và tình huống. Người điều khiển dùng các thao tác hiện có; AI chọn nhánh một lần, giữ tới khi dùng/hết cửa. Charge không phải một phép mới được spam miễn phí.

#### Ba hướng bổ trợ

| Nhóm | Giá trị chính | Tình tiết tạo ra |
| --- | --- | --- |
| Cơ động | Đổi góc, cắt bám, chiếm cover, chọn áp sát hoặc thoát | Kẻ bị săn có thể cắt dấu; kẻ săn có thể chiếm sườn sau đòn hụt |
| Sinh tồn | Vượt một nhịp nguy hiểm bằng điều kiện đúng và tài nguyên còn lại | Đỡ đúng mở đường sống, hồi bị ngắt, khiên vỡ vẫn chết nếu đòn đủ mạnh |
| Tạo đột biến | Trừng phạt đòn lặp, nhử hụt, chống trả khi bị dồn, tận dụng ngắt/neo | Địch đang áp đảo có thể mất thế; đột biến đến từ diễn biến đã quan sát |

B1 cho một cơ hội dùng được; B2 mở phối hợp; B3 mở một nhánh đổi lợi ích lấy rủi ro. Không nâng bằng tăng tỷ lệ proc vô điều kiện hoặc miễn nhiễm dài hơn. Các cooldown dưới đây là mức khởi điểm để test, không tự giảm về 0 theo rank/level.

#### Cơ động — sáu nội tại

| Nội tại | Trigger và cooldown | B1 | B2 thêm | B3 thêm | Cách khắc chế |
| --- | --- | --- | --- | --- | --- |
| **Bước Chuyển Thế** (`p_rebound_step`; mới) | Né thành công một đòn đã nhìn thấy; CD 12s. | Nạp một bước lướt ngắn trong 1,5s để chọn lại khoảng cách. | Bước lướt được đi chếch thay chỉ lùi, nhưng dừng ở va chạm. | Lướt đúng qua sườn mở một đòn thường trong di chuyển; chọn đánh thì mất phần tăng tốc thoát. | Giữ chiêu chặn điểm đáp, nhử né sớm. |
| **Lướt Theo Khe** (`p_opening_stride`; mới) | Ở gần một chiêu địch vừa hụt/hồi động tác, còn stamina ≥25%; CD 14s. | Được một bước tiếp cận ngắn về phía khe hở đã quan sát. | Có thể dùng bước đó vòng sườn thay tiến thẳng. | Chọn mở cú đánh nối hoặc đổi hướng thoát; dùng một nhánh tiêu hết charge. | Hụt có chủ đích để dụ vào lane, giữ đòn đáp trả. |
| **Ảnh Bộ Phục Kích** (`p_ambush_shadow`; thay Phục Kích) | Đã cắt tầm nhìn thật sau truy sát hoặc phục kích đúng luật; CD 18s. | Nạp một bước áp sát/rút lui; không tự cho ẩn khi vẫn bị thấy. | Bước để dấu hướng giả, khiến địch tìm vị trí cuối thay bám tọa độ. | Xuất kích đúng phía sau mở một bước thoát sau đòn đầu; phải chọn đánh hay tiếp tục ẩn. | Dò/AoE/giữ mép bụi; nếu bị nhìn lại charge bị hủy. |
| **Dấu Chân Hàn Phong** (`p_frost_trail`; thay Hàn Kích) | Đòn trực tiếp đặt dấu Lạnh rồi chủ thể thực hiện một lần né/lùi hợp lệ; CD 16s. | Để một vệt lạnh rất ngắn tại điểm cũ, giúp cắt bám. | Vệt kéo dài theo một đoạn đường đã đi thật, có lối vòng. | Địch cố dash qua vệt mất một phần quãng lao; không đóng băng và không đặt vệt mỗi frame. | Đi vòng, lửa tiêu vệt; hiệu lực di chuyển cùng họ lấy mức mạnh nhất. |
| **Tơ Chuyển Vị** (`p_tether_pivot`; thay Trói Chân) | Ba hành động tấn công trực tiếp trúng cùng địch trong 5s; CD 18s. | Đặt dây mềm 1,2s, chỉ còn hiệu lực khi giữ tầm/cover thông. | Giữ dây được mở một bước xoay sang sườn hợp lệ. | Chọn cắt dây để kéo lệch nhẹ hoặc tự rút ra; không nhận cả hai và không root dài. | Cắt tầm nhìn/ra quá xa/phá neo; boss không bị lách miễn hard CC. |
| **Dư Ảnh Đổi Hướng** (`p_feint_afterimage`; mới) | Đổi hướng một động tác né/lướt hợp lệ khi đang bị nhắm; CD 20s. | Ảnh lưu ngắn gây nhiễu một lần cho đòn nhắm đơn cần tầm nhìn. | Có thể để ảnh tại điểm xuất phát hoặc điểm chuyển hướng, chốt một lần. | Ảnh giữ đòn tracking tới điểm cuối và mở bước tái định vị nhỏ; AoE/đạn không tracking vẫn trúng. | Dùng vùng/lane và đạn trực tiếp; không kích từ xoay tại chỗ hay đổi WASD nhỏ. |

#### Sinh tồn — sáu nội tại

| Nội tại | Trigger và cooldown | B1 | B2 thêm | B3 thêm | Cách khắc chế |
| --- | --- | --- | --- | --- | --- |
| **Dưỡng Huyết** (`p_blood_reserve`; thay Hấp Huyết) | Hai hành động trực tiếp trúng rồi giữ được khoảng trống 0,8s; CD 20s. | Tích một phần sát thương thật thành lượng hồi có trần, hụt làm mất nhịp tích. | Có thể giữ lượng đã tích để hồi sau khi thoát, hết 3s mất phần chưa dùng. | Chọn hồi hoặc đổi cùng lượng đó thành khiên ngắn; chỉ được dùng một lần. | Giữ áp lực/cắt nhịp; không tích từ DoT/phản/dummy/clone cùng cast. |
| **Thiết Giáp Linh Hoạt** (`p_flexible_armor`; thay Thiết Giáp) | Đỡ đúng hướng một đòn trực tiếp, không phải guard bị ép vỡ; CD 16s. | Để lại một mảnh giáp che cùng hướng cho một đòn kế. | Có thể giữ mảnh để chống ngắt một hành động né/rút hợp lệ thay hấp damage. | Mảnh vỡ tạo một bước lùi nhỏ; mất charge và vẫn chịu phần damage vượt ngân sách. | Bọc hậu, dùng nhiều nguồn đòn khác nhịp; không che mọi hướng. |
| **Sinh Cơ** (`p_recovery_cycle`; thay Sinh Cơ) | Đứng/giữ hành động hồi 1,2s sau khi đã tạo khoảng trống; CD 24s. | Hồi chậm ngắt được; không vừa chạy vừa hồi thêm từ nội tại. | Hoàn thành giải một trạng thái nhẹ đang gây hại nhất. | Hoàn thành nạp một lần giảm chi phí né; dùng né sẽ chấm dứt cửa hồi. | Đánh ngắt/đẩy khỏi vị trí; hồi 1 HP/s mặc định vẫn là nguồn riêng. |
| **Hộ Thể** (`p_protective_charge`; thay Hộ Thể) | Giữ một charge bảo vệ cho hành động hỗ trợ đang chuẩn bị, dựa đòn đã thấy; CD 22s. | Chặn một nhịp ngắt từ chính diện, không miễn damage của đòn. | Chọn dùng charge để giảm một debuff nhẹ thay chống ngắt. | Cho đổi hướng che một lần lúc lấy đà; không tự xoay theo mọi đòn. | Đánh sau lưng/AoE hoặc nhử tiêu charge rồi ngắt chiêu chính. |
| **Huyết Thể** (`p_blood_body`; mới, thay Kiên Tâm trong plan) | Hồi bổ sung khi đang giao tranh thật; B2/B3 kích bùng phát khi HP bị sát thương địch làm đi từ trên xuống ngưỡng và bot còn sống. CD bùng phát 60s; chỉ tái nạp sau hồi >60% HP trong 8s. | Thêm 0,50% HP tối đa/giây trong giao tranh, ngoài 1 HP/s mặc định. | Thêm 0,75%/giây; HP tụt xuống ≤35% kích hồi thêm tổng 12% HP tối đa trong 4s. | Thêm 1,00%/giây; HP tụt xuống ≤40% kích hồi thêm tổng 24% HP tối đa trong 3s, thay phiên bản B2. | Dồn sát thương nhanh, hắc hỏa/hiệu ứng giảm hồi có mô tả rõ; đòn thường không tự ngắt hồi. Không miễn chết hoặc hồi sinh. |
| **Đường Sống Cuối** (`p_last_exit`; mới) | HP đi từ >35% xuống <25%, còn stamina ≥15%; CD 60s, chỉ tái nạp sau hồi >55% trong 8s. | Khiên rất ngắn cho một đòn và một hướng thoát được chốt, không chặn đòn kết liễu đã xảy ra. | Nếu còn điểm đến hợp lệ, có một bước rút tiêu stamina; khiên kết thúc khi rút. | Chọn rút hoặc giữ vị trí bằng guard ngắn để phản công; không tăng cả khiên lẫn cơ động. | Dồn tường/cắt đường; damage vượt khiên vẫn giết, không bất tử hay hồi từ chết. |

#### Huyết Thể — hồi máu trong giao tranh

Thay hoàn toàn Kiên Tâm; ID dùng trong thiết kế là `p_blood_body`, không còn cơ chế kích sau hard CC. Huyết Thể là hồi tự động của cơ thể, không phải hút máu hoặc một channel cần đứng yên. Đánh/di chuyển/né hợp lệ không tắt hồi; bị đánh thường cũng không hủy đợt bùng phát.

| Bậc | Hồi bổ sung thường trực trong combat | Ngưỡng bùng phát | Hồi bùng phát bổ sung |
| --- | --- | --- | --- |
| B1 | 0,50% HP tối đa/giây | Chưa có | — |
| B2 | 0,75% HP tối đa/giây | Từ trên xuống ≤35% HP | Tổng 12% HP tối đa trong 4s (3%/giây) |
| B3 | 1,00% HP tối đa/giây | Từ trên xuống ≤40% HP | Tổng 24% HP tối đa trong 3s (8%/giây), thay đợt B2 |

Thông số là đề xuất để cân bằng. Công thức khi đủ điều kiện: **1 HP/s mặc định + hồi combat của bậc hiện tại + phần hồi bùng phát còn hiệu lực**. B3 kế thừa cơ chế B2 với ngưỡng/tốc độ/định lượng mới; không cộng hồi thường trực hay đợt bùng phát của cả hai bậc. Ví dụ 1.000 HP ở B3: bình thường hồi tổng 11 HP/s; khi bùng phát hồi tổng 91 HP/s trong tối đa 3s, phần bùng phát riêng là 240 HP. Luôn chặn ở maxHp thực tế; phần dư không biến thành khiên.

Điều kiện và giới hạn:

- Combat phải có giao tranh hợp lệ với địch và trạng thái/nhịp tấn công hoặc nhận sát thương được xác nhận trong 6s gần nhất. Chỉ đi săn/chạy tới mục tiêu hoặc tự dùng chiêu hỗ trợ không đủ để bật hồi combat. Hết combat hoặc xuống sông dừng phần hồi bổ sung/bùng phát; nguồn hồi mặc định giữ luật cũ.
- Sát thương địch, kể cả DoT, có thể đưa HP qua ngưỡng; **giải quyết đòn trước rồi xét bot còn sống**. Đòn chí tử không được cứu hồi tố. Chỉ một lần kích từ trên xuống ngưỡng; đứng sẵn dưới ngưỡng, nâng bậc giữa trận hoặc mỗi tick DoT tiếp theo không tự mở thêm một đợt.
- CD 60s tính từ lúc bắt đầu bùng phát, pause dừng mọi đồng hồ. Hết CD vẫn phải từng hồi >60% HP liên tục 8s để tái nạp, rồi nhận sát thương đi qua ngưỡng một lần nữa. Không tái kích chỉ vì lắc HP quanh 35%/40%; một đợt đang chạy không gia hạn/refresh bởi đòn mới.
- Hồi thường trực không tiêu charge hay chiếm slot phản ứng mỗi giây. Kích bùng phát là một nội tại chính, chịu luật chọn proc theo sự kiện; lượng hồi được phân phối theo dt, không tạo thêm sự kiện proc trên từng nhịp hồi. Hai điều kiện sống còn trùng cùng đòn chỉ chọn một đợt mới, không bắn đồng thời Huyết Thể và Đường Sống Cuối.
- Bùng phát là ngoại lệ có budget riêng so với trần hồi 3–5% của các proc khác; CD/tái nạp là cái giá của lượng hồi lớn. Các nguồn hồi độc lập có thể cùng hoạt động, nhưng không nhân chéo hoặc làm hồi Huyết Thể kích nội tại hồi khác. Hiệu ứng giảm hồi được chỉ định, như hắc hỏa, áp vào nguồn hồi chịu ảnh hưởng một lần; tổng giảm hồi có trần khởi điểm 50%, không nhân nhiều nguồn tới khóa hồi hoàn toàn.
- Dùng trạng thái/đồng hồ riêng, không ghi đè healTimer của Hơi Thở Thứ Hai/Sinh Cơ. Việc ngắt channel của các chiêu đó không vô tình hủy Huyết Thể; hủy Huyết Thể chỉ theo luật combat, thời hạn, tử trận/reset.
- Phản Chiếu/các clone tính phần trăm theo HP bot gốc đã sao chép, không theo HP boss 15×; vẫn chịu trần hồi của boss trong plan và dùng chung CD/ngân sách của chủ. Không nhận một bùng phát mới trên mỗi clone.

Vai trò: bù sát thương cấu rỉa để bot còn cửa giữ thế hoặc đánh trả; B2/B3 tạo một khoảng sống còn ngắn cho phản công/chuyển vị. Địch vẫn thắng bằng burst vượt HP, giữ áp lực hoặc đặt giảm hồi đúng thời điểm. Huyết Thể không buộc mọi bot phải bỏ chạy hay xóa tính cách hèn nhát.

Hiển thị: icon giọt máu có thanh cooldown/tái nạp; bảng bot ghi tốc độ hồi combat, ngưỡng và lượng/thời gian bùng phát còn lại. Bùng phát dùng vân máu đỏ sẫm và nhịp sáng hồi máu gọn quanh cơ thể, âm kích riêng; không che aura level, warning hoặc HP.

#### Đối chiếu sức mạnh và điều chỉnh hồi thường trực

Đánh giá lại theo source hiện tại: B1 cũ quá nhẹ cho một điểm đầu tư ở đầu game; B2/B3 có hồi bùng phát 12%/24% nên không thể kết luận toàn bộ nội tại yếu chỉ từ % hồi/giây. Điều chỉnh hồi thường trực từ **0,25/0,40/0,60% → 0,50/0,75/1,00% HP tối đa/giây**; giữ lượng bùng phát, ngưỡng và CD 60s để tách tác động khi test.

Fixture tính HP và một đòn trực tiếp bằng CombatSystem của source, seed 42, cùng cấp, bỏ trang bị/skill/passive, crit=0. Hồi trong bảng là **phần Huyết Thể riêng trong 10s**, chưa cộng 1 HP/s mặc định hoặc đợt bùng phát, giả định vẫn combat và thiếu đủ HP:

| Bot | HP tối đa | Một đòn ngang cấp sau giáp nền | Bậc so sánh | Hồi thường cũ/10s | Hồi thường mới/10s |
| --- | ---: | ---: | --- | ---: | ---: |
| Lv3 | 208 | 20 HP | B1 | 5,20 HP | 10,40 HP |
| Lv8 | 328 | 31 HP | B2 | 13,12 HP | 24,60 HP |
| Lv15 | 496 | 44 HP | B3 | 29,76 HP | 49,60 HP |

B1 cũ chỉ bù khoảng một phần tư đòn cơ bản trong 10s; một lần né/đỡ đúng thường cứu nhiều HP và có giá trị tức thời hơn. B1 mới bù khoảng nửa đòn trong fixture đầu game, là lợi thế duy trì dễ nhận thấy. B3 mới bù khoảng một đòn trong 10s; đợt bùng phát riêng còn hồi 119,04 HP ở fixture lv15 nếu hoàn thành đủ ba giây, vì vậy bậc cao đã có cửa đổi tình thế đáng kể.

So với Dưỡng Huyết, Huyết Thể không cần đánh trúng hay lấy khoảng trống, nhưng chỉ làm việc trong combat và hồi cần thời gian. So với Đường Sống Cuối/Thiết Giáp, Huyết Thể không đỡ ngay một đòn chí tử. So với Sinh Cơ, Huyết Thể không giải trạng thái hay nạp né. Các điểm này giữ bản sắc riêng; không ép mọi nội tại phải hồi cùng số HP.

Đây là phép đối chiếu thông số và damage nền, **không phải kết quả duel của meta rework chưa implement**. Prototype phải đấu cùng tổng điểm đầu tư: ngắn/áp burst, dài/cấu rỉa, có cover/không cover, có/không giảm hồi và có trang bị phòng thủ. Theo dõi lượng hồi thật, phần tràn maxHp, thời gian sống, số lần bùng phát và trận không phân thắng bại. Chỉ tăng tiếp bùng phát nếu dữ liệu cho thấy nó hiếm khi cứu được một nhịp hành động; nếu tổ hợp hồi/phòng thủ kéo trận bế tắc thì điều chỉnh phần hồi duy trì hoặc stacking, không tăng thêm cả hai nguồn ngay lượt này.

#### Tạo đột biến — sáu nội tại

| Nội tại | Trigger và cooldown | B1 | B2 thêm | B3 thêm | Cách khắc chế |
| --- | --- | --- | --- | --- | --- |
| **Chấn Thế Phản Kích** (`p_counter_shock`; thay Phản Chấn) | Đỡ chính xác một đòn cận chiến trực tiếp; CD 18s. | Gây mất thế ngắn cho đòn vừa bị đỡ, mở cửa đáp trả. | Đòn thường đáp trả đúng cửa được dịch sang sườn một bước nhỏ. | Chọn hất nhẹ hoặc đánh nối; một phản ứng mỗi đòn, không phản sát thương dây chuyền. | Nhử đỡ chính xác, đánh từ sau hoặc đổi sang vùng. |
| **Nọc Suy Kiệt** (`p_exhausting_venom`; thay Độc Kích) | Hai hành động trực tiếp trúng trong 4s, dấu cùng nguồn; CD 18s. | Dấu buộc đối thủ đổi vị trí để tránh nhịp nọc kế. | Đòn nối trúng trong lúc địch đang hồi/niệm có thể cắt phần channel chưa hoàn tất. | Chọn tiêu dấu để cắt channel hoặc để dấu thành vùng nhỏ cản lối; không đồng thời nhận cả hai. | Giải nọc/cắt tầm/đỡ đòn nối; không anti-heal mọi nguồn hay trừ %HP vô hạn. |
| **Tàn Hỏa Bộc Phát** (`p_ember_reversal`; thay Hỏa Phản) | Nhận hai đòn trực tiếp độc lập từ cùng địch rồi đỡ/né thành công; CD 22s. | Nạp một xung lửa nhỏ ở điểm vừa bị ép để cắt bám. | Có thể để vệt nóng khi lùi thay xả ngay. | Chọn xung đẩy hoặc vùng nóng ngắn, tiêu sạch nhiệt; không tạo cả hai mỗi lần bị đánh. | Đổi nhịp/cự ly, nhử xả trước; không có RNG nổ mỗi tick damage. |
| **Bản Năng Đường Cùng** (`p_cornered_instinct`; mới) | Ba đòn độc lập trong 6s, đường thoát thực sự bế tắc, hèn nhát <85; CD 45s. | Nạp một cơ hội đỡ/đánh trả giúp chống cắt nhịp, không tự bảo đảm trúng. | Đỡ/né thành công trong cửa đó mở bước xoay về khe hợp lệ. | Chọn phá guard đã yếu hoặc mở đường thoát; không vừa burst damage vừa kéo dài CC. | Rút nhịp để nhử charge, đừng spam cùng thế; không ép bot quá hèn nhát hóa chiến thần. |
| **Đọc Nhịp Đối Thủ** (`p_pattern_reading`; mới) | Quan sát cùng kiểu đòn hai lần độc lập trong 12s rồi thấy lần chuẩn bị kế; CD 24s. | Nạp một cửa phản ứng cho kiểu đòn đã thấy, không biết trước kỹ năng mới. | Có thể dùng cửa để né vào sườn thay lùi. | Chọn đánh ngắt chiêu có cửa ngắt hoặc chiếm cover đã thấy; không auto-parry/hit. | Đổi thứ tự/nhử/hủy niệm hợp lệ/cắt tầm; mỗi đối thủ chỉ giữ một mẫu đọc. |
| **Thừa Thế Đổi Nhịp** (`p_turning_momentum`; mới) | Chính bot ngắt chiêu có thể ngắt, phá neo quan trọng hoặc kết liễu hợp lệ; CD 24s. | Nạp một bước chiếm vị trí/loot hữu ích thay đứng hồi ở chỗ cũ. | Bước đó có thể tới cover hoặc sườn đối thủ đang nhìn thấy. | Chọn chuyển mục tiêu hợp lệ hoặc bảo toàn nhịp để thoát; không reset cooldown/damage hay kéo thêm người vào combat. | Giữ khoảng cách/cover, ép mất tầm nhìn; không làm chuỗi thắng-kill-heal-proc vô hạn. |

#### Ngân sách và thứ tự kích hoạt

- Một đòn nhiều hit/DoT/phản/field định kỳ chỉ tính theo hành động hoặc castId gốc đúng điều kiện; không coi mỗi tick là một cơ hội mới. Mỗi nguồn chỉ giữ một charge của cùng nội tại, không vô hạn cộng dồn khi học nhiều.
- Mỗi sự kiện chọn tối đa **một nội tại chính gây hành động/phản ứng**; ưu tiên sống còn → bảo toàn niệm/guard → đổi vị trí → phản công, có điều chỉnh tính cách. Nội tại khác có thể ghi nhận điều kiện/charge nhưng không đồng thời bắn/dash/hồi mọi thứ. Trong một cửa 2s tối đa một dịch chuyển phụ và một bảo vệ phụ; không làm giảm cooldown từng mục. Đây là giới hạn proc, không giới hạn số kỹ năng học.
- Bước phụ trần khởi điểm 20/30/40 px theo bậc, cửa dùng 1–2s; phải có stamina và điểm đến hợp lệ. Bậc tăng trước hết bằng nhánh sử dụng/điều kiện, không bắt buộc mọi bước đều tăng quãng đường. Không đi xuyên tường, vượt room/địa phận, chen vào nhóm combat đầy hoặc lướt/đánh trên sông. Không thưởng cho đổi hướng nhỏ hay xoay vòng tại chỗ.
- Lượng hồi/khiên của nội tại dùng charge lấy từ nguồn đã nạp thật; Huyết Thể là nguồn hồi tự động riêng có ngân sách và điều kiện tái nạp. Hồi chủ động của một proc trần khởi điểm 3–5% HP tối đa, riêng Huyết Thể có budget bùng phát 12%/24% và điều kiện ở mục riêng; khiên thông thường 6–10%, Đường Sống Cuối tối đa 12%, sống ≤1,2s và một đòn. Các khiên bị động cùng họ lấy lớp mạnh nhất, không chồng tổng. Hồi 1 HP/s mặc định và kỹ năng hồi chủ động giữ luật riêng.
- Đường Sống Cuối xét **sau đòn hiện tại đã giải quyết và bot còn sống**, chỉ che đòn tiếp theo; không chặn hồi tố cú kết liễu, không hồi sinh hay giữ HP=1. Điều kiện tái nạp HP và thời gian phải đồng thời thỏa, kể cả đã qua cooldown.
- Hất/kéo/ngắt theo ngân sách khống chế chung. Sơ hở không đồng nghĩa stun, giảm giáp không vĩnh viễn, dấu không tự làm địch đánh hụt. Thừa Thế không nhận proc từ mỗi quỷ binh/clone cùng chủ hoặc tạo chuỗi kill-reset-heal.
- Sinh tồn không ép bot đổi tính cách: bot hèn nhát vẫn ưu tiên thoát; Bản Năng Đường Cùng không kích khi cowardice ≥85. Nội tại chỉ mở cơ hội, AI vẫn có thể dùng sai/hết stamina và bị hạ.
- Phản Chiếu sao chép đúng nội tại/bậc đã học, dùng cùng charge/cooldown/proc budget, tính hồi theo HP bot gốc với trần của boss. Không nhân đôi khoảng lướt, hard CC, thời gian bất khả xâm phạm hoặc cấp thêm cả 18 nội tại. Hai clone dùng chung ngân sách của chủ để không proc đôi.

#### Ví dụ tình tiết để nghiệm thu

1. Bot yếu bị truy sát: né thật → Bước Chuyển Thế đi tới cover → cắt tầm nhìn → Ảnh Bộ Phục Kích mở đường thoát hoặc vòng lại. Hai nội tại kích ở hai sự kiện riêng và tuân thủ cửa 2s, không dash liên tiếp miễn phí.
2. Bot đang bị cấu rỉa: quan sát nhịp bắn lặp → Đọc Nhịp mở cửa né vào sườn → ngắt chiêu có cửa ngắt → Thừa Thế giúp đổi vị trí. Địch đổi nhịp thì combo mất điều kiện.
3. Bot gần chết: còn sống sau đòn làm tụt HP → Đường Sống Cuối che một đòn kế → chọn rút hoặc đứng guard. Nếu bị dồn kín/không đủ stamina hoặc damage vượt khiên thì vẫn tử trận.
4. Bị dồn đường cùng: ba đòn độc lập + không có đường thoát → nội tại mở cửa chống trả. Đỡ thành công mới có bước xoay/phá guard yếu; không tự buff damage/miễn chết để lật kèo.
5. Bot có Huyết Thể B3 bị địch đánh qua 40% HP: còn sống thì hồi bùng phát trong 3s, có thể giữ thế/né hợp lệ rồi đánh trả. Địch burst đủ để hạ vẫn thắng; một nguồn hắc hỏa giảm hồi làm cửa sinh tồn yếu hơn. Trận không được tạo bùng phát liên tục do HP lắc quanh ngưỡng.
6. Bot đầu tư ít active B3 nhưng nhiều nội tại B1 có nhiều cách thích nghi; bot nâng sâu một nội tại B3 tận dụng đúng matchup mạnh hơn. Test trên cùng điểm đầu tư để tránh mặc định học nhiều luôn thắng.

#### Bổ sung đồng bộ cho quái và Thượng Cổ

Giữ catalogue 45 nội tại quái và 30 Thượng Cổ ở 8.2/8.3, rà từng mục theo ba hướng mới:

| Đối tượng | Cơ động | Sinh tồn | Tạo đột biến và cửa bot khai thác |
| --- | --- | --- | --- |
| Yêu Thú | Bọc sườn/thoát sau vồ hụt, giữ habitat | Mai/vảy/rễ cần đúng hướng hoặc đứng yên | Hú ở ít máu hoặc nhả nhiệt có lấy đà; bot ngắt/nhử được |
| Yêu Tướng | Đổi lane sau chiêu hụt, không dịch xuyên tường | Neo hộ mệnh/guard có độ bền | Đổi combo sau bị ngắt, nhưng phải chịu recovery và không hội đồng |
| Yêu Vương | Chọn đường ép quanh cover trong sào huyệt | Lột vảy/tái gồng có thể ngắt | Ít máu đổi nhịp, mở điểm yếu sau chuỗi mới |
| Yêu Thần | Đổi góc/đáp/chui theo dấu nhìn thấy | Hồn/trứng/rễ là charge/neo có cách phá | Tái sinh hoặc bộc phát có dấu và cooldown; chỉ chết thật mới khởi động countdown |
| Thượng Cổ | P2 đổi cách chiếm room, vẫn có hụt và mất dấu | Giáp/nhịp hấp tài nguyên không vô hạn | Bot có thể ép xả nhiệt/phá neo/nhử sao chép để tạo thời cơ thắng |

Không cho mọi boss cả ba ưu thế thường trực. Mỗi boss có một điểm trội và một cái giá có thể khai thác; miễn hard CC không mặc định miễn cắt tầm nhìn/va chạm/hụt đòn hay xóa mọi giá trị của skill bot.

### 8.2. Bốn mươi lăm nội tại quái

Giữ đúng tên danh mục nhưng mỗi mục có trigger riêng. Các đề xuất thay miễn nhiễm/giảm chỉ số tuyệt đối thành cửa phòng thủ có thể đọc được là thay đổi thiết kế có chủ đích.

**Heo Rừng Gai Bọc Sắt**

- Gai Phản Phệ: Gai dựng có thời gian, đánh trực diện sẽ bị đẩy nhẹ; vòng sau khi gai đang mở.

**Mãng Xà Đầm Lầy**

- Vết Đớp Kịch Độc: Nọc tích tối đa ba dấu; rời giao tranh hoặc dùng giải độc hạ dấu, không lấy %HP vô hạn.

**Cóc Lửa Nham Thạch**

- Tàn Nham Bốc Cháy: Bị đánh tích nhiệt; đủ ngưỡng nhả vũng lửa có báo trước, tạo quyết định đứng đánh hay đổi vị trí.

**Hắc Báo Ám Ảnh**

- Săn Mồi Vô Tích: Chỉ săn từ bụi khi chưa bị thấy; đòn xuất kích mở một bước bọc sườn, bị phát hiện thì mất lợi thế.

**Gấu Băng Bắc Địa**

- Hàn Khí Cực Hạn: Hai lần chạm liên tiếp tích Lạnh; bot rời cự ly để hạ dấu trước cú vồ kế.

**Dơi Quỷ Hút Máu**

- Hút Máu Tươi: Hút máu cần bám mục tiêu trong một nhịp; đẩy/né/cover cắt hút, không hồi trên mọi DoT.

**Nhện Bẫy Cát**

- Mạng Tơ Ràng Buộc: Đủ ba đòn thật đặt tơ trên đất, cắt/burn được; không choáng tự động không có cảnh báo.

**Cua Đá Cổ Đại**

- Vỏ Hóa Thạch: Mai chắn phía trước; kẹp hụt làm lộ bụng trong hồi động tác, không giảm damage mọi hướng.

**Sói Đầu Đàn Xám**

- Tiếng Hú Thúc Ép: Hú ở ít máu cần lấy đà, mở chạy bọc sườn nhưng hụt vồ sẽ mất nhịp săn.

**Ma Cây Rừng Già**

- Hấp Thụ Thổ Nhưỡng: Đứng yên mọc rễ hồi ngắt được; địch lựa chọn ngắt hoặc lợi dụng cây mất di chuyển.

**Đao Phủ Đoạt Mệnh**

- Lưỡi Đao Tàn Tạ: Tích huyết ấn khi chém thật trúng; tới ngưỡng mở nhát bổ kết liễu có cảnh báo, không auto crit.

**Xà Tinh Đầm Lầy**

- Thân Thể Trơn Trượt: Trượt theo sườn sau đỡ/né, có cooldown; không random miễn đạn, vẫn bị kéo/tơ theo điều kiện.

**Thống Lĩnh Nhân Mã**

- Chiến Ý Bất Bại: Hụt một đòn cho nhịp phi nước đại ngắn để đổi góc; lao sai hướng tạo sơ hở.

**Hắc Vu Cốt Tinh**

- Linh Hồn Hộ Mệnh: Hồn hộ mệnh là một neo/lá chắn phá được; neo vỡ tạm ngừng khả năng dựng lồng.

**Tướng Quân Khỉ Đột**

- Da Dày Thịt Béo: Chính diện tích lực đỡ, đòn cuối hụt/đánh sau lưng làm hết lực, không giáp mọi hướng.

**Viêm Ma Bạo Chúa**

- Thân Thể Dung Nham: Vỏ dung nham tích nhiệt và để vùng nóng có thời hạn; tới ngưỡng phải xả, lúc xả giảm thủ.
- Ý Chí Tro Tàn: Ít máu đổi nhịp combo sang nhanh/chậm xen kẽ; không chỉ cộng tốc đánh mãi.

**Cuồng Bạo Kim Cương Vương**

- Cơ Bắp Titan: Gồng chắn đạn trước mặt, đánh sườn/ngắt gồng tạo cửa cận chiến.
- Cuồng Chiến Đỉnh Điểm: Mất máu mở nối đòn thứ ba, nhưng tăng hồi động tác khi hụt chuỗi.

**Thanh Xà Đế Vương**

- Tái Sinh Vảy Rồng: Lột vảy hồi ngắt được, để lại xác vảy cover tạm; không cộng hồi phần trăm liên tục trong combat.
- Nọc Độc Ăn Mòn: Nọc làm suy yếu guard theo dấu có hạn; giải độc/rời vũng cắt chuỗi.

**Lãnh Chúa Xương Vong Hồn**

- Hào Quang Tử Khí: Tử khí là vùng cần thoát, chủ động tắt nó để gom lực niệm chiêu; không aura toàn phòng.
- Hồn Ma Bảo Vệ: Hai hồn chắn là hiệu ứng gắn boss, có charge chặn đạn và neo phá được, không hai thành viên combat mới.

**Thái Cổ Hỗn Độn Ma Long**

- Chân Thân Hư Không: Miễn hard CC; mỗi lần phản công đúng cửa niệm phá một lớp ổn định, lộ cửa ngắt chiêu được đánh dấu.
- Ám Thị Toàn Tri: Chỉ cảm nhận ẩn trong vùng đã dò có cảnh báo, không biết toàn bộ vị trí vô hình.
- Long Lân Bất Diệt: Vảy cường hóa theo hướng; đổi góc hoặc đánh vào phần vừa phóng long tức.
- Nhai Nuốt Sinh Linh: Chỉ nuốt hồn cục bộ nhìn thấy, có charge/trần và có thể bị cướp/cắt nghi lễ.
- Tận Thế Giáng Lâm: Ít máu mở sét theo lane báo trước quanh điện thờ, không đánh ngẫu nhiên mọi map.

**Viêm Đế Phượng Hoàng**

- Niết Bàn Tái Sinh: Tái sinh một lần cần trứng/nhân lửa có countdown và cách phá; chết thật mới chạy countdown Thượng Cổ.
- Tỏa Nhiệt Cực Hạn: Nhiệt tích theo vùng; có đảo nguội và cách giải nhiệt, không cháy toàn đền không tránh được.
- Lông Vũ Rực Lửa: Lông rụng dựng những vệt lửa ngắn có thể dùng lạnh để tắt.
- Bay Lượn Bất Khả Chạm: Bay đổi hướng theo nhịp, luôn có lúc đáp/niệm dễ bị đánh; không vô địch trước cận chiến.
- Tinh Thần Bất Diệt: Đỡ ngắt đúng nhịp làm phượng hoàng hao tinh thần, mở thời gian đáp thay miễn mọi ngắt.

**Tru Tiên Thần Cây Cổ Đại**

- Rễ Bám Căn Nguyên: Rễ nối theo neo; phá neo mở đường đi, cây cần tái bám mới hồi.
- Vỏ Gỗ Thần Thánh: Vỏ gỗ phân đoạn hướng, đánh liên tiếp cùng phía mở vết nứt có hồi lại hữu hạn.
- Hấp Thụ Phép Thuật: Hấp một projectile phép nạp vỏ; trộn đòn thường/phép phá nhịp, không hồi từ mọi magic hit.
- Bào Tử Độc Tố: Bào tử tích phơi nhiễm; rời vùng hoặc đốt vùng để giảm tích, không sleep ngay.
- Sinh Sôi Bất Tận: Mầm tái sinh là hiệu ứng neo giới hạn số lượng; phá mầm trước lượt hồi, không spawn thêm quái.

**U Minh Diêm La Vương**

- Sổ Sinh Tử: Dấu sổ cần hoàn tất hai điều kiện nhìn thấy; hủy một điều kiện làm yếu phán quyết.
- Thân Xác Linh Hồn: Linh hồn chuyển đặc/vô hình theo nhịp có báo; luôn có cửa nhận đòn, không bỏ toàn bộ sát thương.
- Trừ Hết Giáp Địch: Chỉ lột một lớp guard/khiên khi phán quyết đủ điều kiện, không trừ mọi giáp vĩnh viễn.
- Đoạt Hồn Tăng Máu: Hồn rơi trong vùng giao tranh là charge nghi lễ; cắt niệm ngăn hồi, không mỗi cái chết toàn map đều hồi.
- Ám Khí Tử Vong: Ám khí đi theo bóng lane, rời bóng hoặc dùng sáng/phép phá dấu để tránh.

**Thiết Giáp Tê Ngưu Vương**

- Thiết Giáp Hộ Thể: Giáp theo hướng, va cover đủ mạnh làm nứt và tạo cửa đánh vào thân.
- Ý Chí Sơn Vương: Giữ sào huyệt, gầm lấy lại thế khi ít máu; ngắt gầm sẽ giữ điểm yếu lâu hơn.

### 8.3. Ba mươi nội tại Thượng Cổ

**Bàn Cổ Dị Hình — Thủy Tổ Cự Ma**

- Căn Nguyên Đất Mẹ: Lớp đá trước mặt có độ bền; phá lớp tạo cửa đánh, không giảm damage cố định vô hạn.
- Trọng Lực Hư Vô: Trọng lực đổi từng vòng có khe, tránh đứng mãi trong vòng; không phủ toàn room.
- Kháng Tính Tuyệt Đối: Kháng sát thương chuẩn hữu hạn, đánh đúng điểm nứt vẫn có giá trị; không tạo đường build bắt buộc.
- Chấn Động Mặt Đất: Bước chân chỉ chấn khi dồn lực, có âm/đất nứt báo trước; không mỗi tick đều ngắt niệm.
- Hóa Thạch Xung Quanh: Hóa thạch tích phơi nhiễm gần, rời vùng giảm tích; đủ ngưỡng báo trước và cho giải.
- Nộ Khí Phase 2: P2 mất đá nhưng mở nhịp truy đuổi/đổi địa hình; hồi động tác vẫn giữ cửa phản công.

**Phản Chiếu Nguyên Thủy — Bản Sao Hoàn Hảo**

- Gương Soi Bản Nguyện: Sao chép nội tại theo trigger/charge thật; hệ số sao chép có trần tài nguyên, không nhân đôi mọi control/thời lượng.
- Thân Xác Thượng Cổ: Giữ hai thanh HP và bản sao; HP 15× hiện tại phải kiểm chứng riêng, không dùng thêm miễn nhiễm để che thời gian đấu quá dài.
- Hao Tổn Nghịch Đảo: Kháng vũ khí cùng tên được phá bằng đổi nhịp/hiệu ứng thay yêu cầu tìm loại vũ khí khác trong room.
- Áp Lực Kẻ Thắng Cuộc: Vùng áp lực có hướng và quãng tắt sau chiêu; bot lợi dụng cửa đó để quay vị trí.
- Ký Ức Tiên Tri: Dự báo chỉ một đòn đã nhìn thấy; dùng đòn rẻ nhử, không né tuyệt đối chiêu đang bị smoke che.
- Thức Tỉnh Bản Ngã: P2 đổi thế/phân vai hai bản, chung ngân sách chiêu; không cắt cooldown tới spam.

**Quy Khư Thôn Thiên Kỷ — Hố Đen Nguyên Thủy**

- Ăn Mòn Quy Luật: Bẻ đạn trong một vành có khe; cận chiến/đổi góc hoặc bắn đúng quãng tắt đều hợp lệ.
- Hấp Thụ Năng Lượng: Hấp magic nạp charge miệng, xả charge có hồi động tác; hồi HP có trần, không triệt pháp sư.
- Xác Thịt Hư Không: Miễn bleed/poison, nhưng hai hiệu ứng chuyển thành ăn mòn lớp da với trần để skill không thành vô dụng.
- Áp Lực Vực Thẳm: Rút stamina theo nhịp trong vùng, không cấm né tuyệt đối; bot chọn ra vùng hoặc đánh ngắt nhịp.
- Bào Tử Đói Khát: Ký sinh là đạn/neo phá được, không quái mới và không tracking xuyên cover.
- Bung Tỏa Miệng Vực: P2 nuốt đồ chỉ sau dấu hút/niệm; ưu tiên giữ đồ Yêu Thần/Thượng Bảo, không xóa chiến lợi phẩm vĩnh viễn.

**Hỗn Độn Ma Tổ — La Hầu**

- Bốn Binh Khí Nguyên Thủy: Đổi binh khí theo chuỗi công khai, mỗi kiểu có thế mạnh và cửa hồi riêng.
- Tâm Ma Thao Túng: Sao chép chiêu đã thấy, có cooldown/budget, không biết cả bộ kỹ năng người chưa lộ mặt.
- Hút Máu Cuồng Loạn: Hút máu sau kết thúc một chuỗi hợp lệ; ngắt chuỗi chặn hồi, không từ phản/DoT.
- Khí Phách Ma Tổ: Phản chỉ khi đang thế kiếm phòng thủ và dùng một charge; bọc hậu/nhử charge khắc chế.
- Chiến Ý Vô Tận: Ít máu mở chuỗi mới với quãng ngắt, không tăng attack speed vô hạn khiến né bất khả thi.
- Ma Thần Bất Diệt: P2 linh hồn là lane gắn boss, phá neo tắt một lane; chung encounter và CC budget.

**Tận Thế Cơ Thần — Zero Protocol**

- Lớp Giáp Năng Lượng Nano: Giáp nano có đoạn/thời hạn; phá một đoạn mở điểm yếu, nhiệt cao làm tái tạo chậm.
- Tính Toán Quỹ Đạo Hoàn Hảo: Rear guard chỉ bật lúc boss khóa mục tiêu trước; nhử đổi khóa tạo cửa bọc hậu, không miễn đòn sau lưng.
- Hệ Thống Phản Lực Siêu Tốc: Phản lực đổi vị trí theo nhịp và có điểm đáp, vẫn va tường/room; không bỏ luật sông ở thế giới ngoài.
- Tự Động Khóa Mục Tiêu: Súng phụ có lane/laser ngắm, cover chặn và có cadence riêng trong ngân sách boss.
- Xả Nhiệt Quá Tải: Tích nhiệt theo số hành động/đòn nhận; nóng buộc xả và lộ lõi, bot chủ động ép quá nhiệt.
- Chế Độ Khẩn Cấp Overclock: P2 Overclock tiêu nhiệt; sau một chuỗi phải nguội, giữ nhịp chung tối thiểu 1s và hồi động tác.

## 9. AI sử dụng được sức mạnh mới

- Chấm điểm theo tác dụng **có khả năng thành công**: cắt niệm, ép lane, phá guard, tạo neo, bọc hậu, tạo thời gian hồi. Có một mục tiêu đứng trong phạm vi chưa đủ lý do tung mọi chiêu.
- Kế hoạch combo tối đa hai hoặc ba hành động, chốt mục tiêu/vị trí và lượng mana/stamina dành cho hành động sau. Mục tiêu đã thoát, dấu hết hoặc bị ngắt thì hủy combo hợp lý; không lặp thử lại mỗi frame.
- Tính cách quyết định nhánh: hiếu chiến thiên tạo sơ hở, kiên nhẫn chờ ngắt/đỡ đúng, hèn nhát dùng ảnh/khói thoát, tham lợi dùng bẫy/lane, trung thành dùng vùng hồi và che đồng minh. Đây là ưu tiên mềm, không build khóa. Tình huống sống còn vẫn được ưu tiên.
- Giữ nhịp đánh giá 0,3s và cam kết 2–4s hiện có cho chiến lược; động tác/điểm né được giữ tới khi xong hoặc nguy cơ thực sự đổi. Chọn nhánh B3 một lần, không random nhánh lại từng tick.
- Phản ứng dựa warning và kỹ năng đã quan sát; không biết trước nhánh chưa lộ, không đọc tọa độ trong smoke/stealth. Sau hụt, chịu đúng recovery; có phản ứng trễ để một bên không né hoàn hảo mọi chiêu.
- Readiness xét utility hợp tình huống, cooldown, charge và khả năng thoát/cover; không coi một skill B3 là luôn mạnh hơn ba skill B1 trong mọi matchup. Tôn trọng chiến ý ngang/yếu, farm trước đối thủ hơn ≥2 cấp và ngoại lệ quá hèn nhát/sinh tồn đã duyệt.
- Nội tại có nhánh dùng charge được AI chốt theo ý định hiện tại, hướng/tài nguyên/cover hợp lệ; không tự tiêu hết mọi charge chỉ vì đã proc. Học nâng nội tại theo trải nghiệm bị truy sát, hay bị ngắt, thường đỡ/né và sở thích tính cách; ghi rõ lý do đầu tư, không đổi sở thích mỗi tick.
- Combo hai đồng minh cùng dùng một cửa ngắt/CC phải dùng ngân sách miễn CC chung của mục tiêu, không kéo dài chain-lock.

## 10. Hiệu ứng quan sát và điều khiển

Một kỹ năng luôn có đủ chuẩn bị → ra hiệu lực → hậu quả tồn tại → kết thúc. Warning vẽ đúng shape và hướng hit; có ký hiệu khe an toàn, điểm neo, phần giáp nứt hoặc cửa ngắt.

B1 hiệu ứng đơn; B2 thêm dấu/đường nối có ý nghĩa; B3 thêm biểu tượng/biến thể đặc trưng, không phóng to toàn màn hình. Lửa cam, lạnh xanh, ảnh/khói tím-xám, guard vàng-trắng, độc xanh lá; dùng thêm hình nét/biểu tượng để không chỉ phân biệt bằng màu. Tách âm lấy đà, phá guard, ngắt niệm và hết vùng.

Tooltip từng bậc có: mới mở gì, điều kiện, tài nguyên, thời gian hiệu lực, cadence/cooldown, cách thoát. Khi chọn skill nâng cấp phải thấy phần thay đổi so với bậc trước. Bảng bot có phần nội tại riêng: bậc, trigger, charge/cửa dùng, cooldown và lý do chưa kích; icon trên đầu chỉ hiện proc/cửa quan trọng. Đồng thời hiển thị combo đang chuẩn bị, trạng thái liên quan và lý do đổi nhánh. Bảng boss hiển thị phase, dấu/neo/nhiệt và cửa có thể khắc chế, không lộ suy nghĩ AI qua tường.

Chiêu có kích hoạt thứ hai dùng lại cùng nút trong cửa thời gian; UI đổi biểu tượng rõ, hết cửa trở về cooldown. Bot dùng cùng đường thực thi với người điều khiển. Giữ mapping bốn nút thao tác hiện có cho người chơi; số skill AI được học không bị giới hạn bởi mapping này.

## 11. Thực thi trong source

| Vị trí | Công việc |
| --- | --- |
| js/data/skillsData.js | Mỗi rank có effect/điều kiện/nhánh/chi phí và mô tả riêng; bỏ các rank chỉ khác multiplier |
| js/data/monstersData.js, ancientBossesData.js | ID nội tại/trigger đầy đủ; moveset theo tier/phase và cửa hồi; bỏ fallback ngầm theo tên |
| js/entities/combatSystem.js | Chung pipeline validate hit/admission → damage tùy chọn → effect → trigger; status/charge đúng castId; ngắt/channel/chuyển đổi |
| js/entities/ancientSystem.js | Phase, ngân sách toàn boss/phân thân, nhiệt/neo, có cửa phản công và cleanup |
| js/entities/entityManager.js | Spawn đúng rank/passive; reset charge/dấu theo nguồn, không mang state từ trận trước |
| js/ai/aiBrain.js, bossBrain.js | Kế hoạch hai/ba bước, điều kiện dùng B2/B3, phản ứng hợp lý và giữ điểm điều hướng |
| js/renderer và js/ui | VFX/hướng/neo/điểm yếu, âm thanh, tooltip và thông tin nâng bậc |
| tests/game.test.cjs và runner hiện có | Regression từng cơ chế/bậc, duel, gauntlet, stuck, performance |

Tái dùng action, field, schedule, collision, spatialGrid và navigator. Chỉ thêm các helper nhỏ dùng chung cho trạng thái/điều kiện cần thiết; không tạo skill framework/DSL, event bus mới hoặc dependency. Effect không damage vẫn phải kiểm tra isEnemy, nhóm combat, nước, va chạm/tầm phù hợp. Damage bị khiên hấp thụ không mặc định làm mọi effect biến mất: effect quy định rõ cần xuyên guard hay chỉ cần va trúng.

Mỗi trạng thái có nguồn, hạn sống, trần stack và điều kiện gỡ. Cast có snapshot trang bị/ngắm, tổng budget, lần nối đã tiêu. Proc không kích lại do pulse, reflected damage, periodic field hoặc copied clone; không tạo vòng phản/hút máu/hoàn cooldown. Reset/chủ thể chết gỡ field, vật cản và trạng thái liên quan; pause dùng thời gian mô phỏng.

## 12. Thứ tự triển khai và điểm kiểm tra

| Chặng | Giao phẩm | Chỉ chuyển chặng khi |
| --- | --- | --- |
| 1. Chốt dữ liệu | Inventory baseline 107/85 → mục tiêu 107/93, schema rank, bảng budget, ID passive; xác định phần đang chỉ là mô tả | Không bỏ sót hoặc fallback nội tại về guard |
| 2. Prototype cơ chế | Sơ hở/guard pressure, dấu và tiêu dấu, field không damage, channel ngắt, kích hoạt hai lần, neo/vật cản | Sáu mẫu kiểm tra được: Iron Wall, Frost Bolt, Blink, Mana Shield, Bone Cage, laser/nhiệt Zero |
| 3. Toàn bộ bot | 32×3 rank, 18 nội tại×3 rank, học nâng theo tính cách | Mỗi B2/B3 có ít nhất một hành vi khác thật và counterplay |
| 4. Toàn bộ quái | 45 active/45 passive, tier/habitat/cadence và combo | Quái thấp vẫn farm được; boss không chain-lock hay gang-up |
| 5. Thượng Cổ | 30 active/30 passive, phase và lượt đấu năm boss | Có đường thoát/điểm yếu trong mọi tổ hợp, không chỉ x2 tốc |
| 6. AI và trình bày | AI chọn/nối/khắc chế, VFX/âm/inspect, điều khiển hai lần | Quan sát giải thích được bot dùng skill vì gì; không chỉ spam khi hết cooldown |
| 7. Cân bằng/test dài | Trận đủ 100 bot, loadout/gauntlet, telemetry và báo cáo | Sửa hết lỗi tái hiện được và chạy lại seed gặp lỗi trên source cuối |

AI tối thiểu cho prototype được làm ở chặng 2 để kiểm chứng cơ chế có dùng được. Chặng 6 hoàn thiện độ phân hóa và trình bày, không để tới cuối mới phát hiện AI không hiểu skill. Thông số ở plan là điểm khởi đầu; chốt số bằng test sau khi mechanics chạy thật.

## 13. Tiêu chí nghiệm thu

1. **Tăng tiến:** test đủ 32 active × 3 rank và 18 passive × 3 rank; B2/B3 chứng minh thêm effect/nhánh/cửa phối hợp cụ thể. Không pass chỉ vì damage hoặc radius lớn hơn. 45 active và 45 passive quái đều dispatch đúng ID; 30 active/30 passive Thượng Cổ thử cả phase được phép.
2. **Effect thật:** riêng test field damage=0, khiên hấp thụ, đúng/sai hướng, hết dấu, cắt cover, hủy channel, chất lửa/lạnh/tơ, neo bị phá, chủ thể chết/pause/reset. Tooltip phải khớp outcome.
3. **Không lạm dụng:** test hai đồng minh nối CC, Mirror copy, hai clone cùng proc, phản damage và hút máu, finisher hụt, hoàn cooldown, đổi weapon trong cast. Không có infinite heal/reflect/charge/reset hoặc boss stun-lock. Với Huyết Thể, test hồi thường trực chỉ trong combat, tổng phần trăm/giây theo từng bậc và dt, B3 thay B2, nhận DoT qua ngưỡng chỉ kích một lần, bị đánh không ngắt đợt đang chạy, pause/maxHp/tử trận/ra combat/xuống nước/reset, CD 60s + tái nạp HP 8s, giảm hồi không nhân chéo, không ghi đè channel và Mirror không hồi theo HP 15×. Với nội tại khác, test riêng HP ngưỡng đi xuống/tái nạp, không sống lại sau đòn chí tử, nhiều proc cùng sự kiện, né-lướt cùng cửa 2s, charge hết hạn, bản sao dùng chung budget và không kích bởi xoay tại chỗ.
4. **Matchup:** mỗi role đấu cận/tầm xa, hở/cover, giàu/nghèo stamina, nhiều B1/ít B3. Kỹ năng nâng sâu mạnh rõ trong đúng tình huống, nhưng vẫn có đối thủ/cách chơi khắc chế. Mục tiêu skill thường dùng 50–70% giá trị ngân sách nếu điều kiện không được chuẩn bị, tối đa giá trị đầy đủ khi phối hợp tốt; đây là tiêu chí thiết kế, không giả vờ là win rate đo sẵn.
5. **Farm và tiến trình:** giữ bot lv1 tay không đánh Lâu La, lv3 với đồ hợp lý có cửa thắng Yêu Thú. Bot hiểu khi cần farm và nhặt nâng cấp; không đứng đợi học đúng một hệ bắt buộc.
6. **Gauntlet:** thử năm boss đầu khác nhau × ít nhất hai loadout, giữ 15× HP Mirror như baseline để tách nguyên nhân difficulty. Chạy thêm một nhóm bot đã đầu tư kỹ năng/nội tại cấp cao thực tế qua chuỗi năm boss; phải quan sát được tiến triển damage/utility và khả năng khai thác cửa hồi. Nếu HP 15× vẫn tạo trận bế tắc dù đã chơi đúng mechanics, báo số liệu và đề xuất retune HP riêng; không thêm cheat cho AI để tạo kết quả thắng. Không cam kết mọi bot thắng cả năm.
7. **Trận dài/stuck:** chạy ít nhất mười seed tới người sống sót cuối; kiểm tra ba/bốn thành viên, đường bờ sông/sào huyệt, neo/lồng chặn đường, combo bị mất mục tiêu, giành loot và đổi chase/farm/escape. Detector đo tiến độ ròng và chuyển ý, giữ trace action/stun để phân biệt đứng đánh với stuck; xem lại mọi cảnh báo và chạy lại seed lỗi sau fix.
8. **Hiệu năng/nhìn rõ:** benchmark cùng seed/tick và điều kiện máy trước/sau, p95 tăng tối đa mục tiêu 20% ở cùng mật độ nếu không có lý do đã đo. Đặt trần field/particle/projectile tạm theo boss và cleanup, không cắt mechanics khi thấp FPS. Test browser ở zoom tổng/zoom gần; warning/khe/điểm yếu phải thấy dù ba người đang dùng chiêu.

## 14. Ranh giới của lượt rework

Không thêm lớp nhân vật, cây build khóa, tiền nâng skill hay một cơ chế bo mới. Chỉ thêm các trạng thái/tương tác trực tiếp phục vụ danh mục đã thiết kế. Thay nội tại lv15 đồng loạt bằng kho 18 mục học/nâng từ lv3 và thay miễn nhiễm tuyệt đối thành cửa phòng thủ ở các mục đã nêu là phần đề xuất cần áp dụng cùng rework, không phải tính năng đang có. Các kiểm thử trong plan **chưa chạy**; 104 test pass của lượt trước là baseline.
