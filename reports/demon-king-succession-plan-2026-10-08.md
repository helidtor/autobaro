# Plan cơ chế Tiếm ngôi Quỷ Vương — 08/10/2026

Trạng thái: plan đã cập nhật theo xác nhận mới nhất — tách vai trò Quỷ Vương, dùng chung logic bot; chưa triển khai tính năng.

Hướng đã chốt: Quỷ Vương là đối thủ cuối riêng về luật trận đấu, nhưng giữ cơ chế chiến đấu, trang bị, tính cách và bình máu của bot. Không chuyển sang AI boss. Phần thưởng Yêu Thần mới chỉ áp dụng trong ván có Quỷ Vương. Hạ Quỷ Vương không nhận bất kỳ chiến lợi phẩm/EXP nào; chọn Tiếm ngôi chỉ thay vua cũ bằng người thắng. Khi thua có Ván mới hoặc Khiêu chiến lại với 100 bot mới và giữ vua cũ. Các quy ước bổ sung ở mục 2 vẫn là mặc định đề xuất.

## 1. Luật chơi cần đạt

1. Trận thường bắt đầu với 100 bot mới và hệ quái hiện tại.
2. Người sống sót cuối cùng tiếp tục lượt farm cuối, hạ Yêu Thần, rồi chinh phục đủ 5 boss Thượng Cổ như hiện tại.
3. Sau chiến thắng cuối, popup có đúng hai lựa chọn: **Ván mới** và **Tiếm ngôi quỷ vương**.
4. **Ván mới** xóa Quỷ Vương và chuỗi kế vị, bắt đầu trận thường mới.
5. **Tiếm ngôi quỷ vương** giữ bot chiến thắng làm Quỷ Vương, rồi bắt đầu trận có đúng 100 bot mới. Quỷ Vương là đối thủ riêng, không phải bot thứ 101 tham gia Battle Royale.
6. Quỷ Vương chưa xuất hiện hoặc được cập nhật trong giai đoạn Battle Royale/lượt farm/Yêu Thần. Ở ván có Quỷ Vương, Yêu Thần khi chết rơi đúng **1 vũ khí Thượng Cổ, 1 giáp Thượng Cổ và 3 bình máu**, thay toàn bộ bộ vật phẩm thường. Người sống sót thu thập, trang bị và chuẩn bị trước khi đấu trường mở với duy nhất Quỷ Vương, không sinh bất kỳ boss Thượng Cổ nào.
7. Người sống sót hạ Quỷ Vương không nhận loot, EXP hoặc phần thưởng kết liễu; nhận lại popup **Ván mới** / **Tiếm ngôi quỷ vương**. Chọn Tiếm ngôi chỉ thay Quỷ Vương cũ bằng chính người chiến thắng mới với build của nó; chuỗi có thể lặp lại nhiều đời.
8. Khi người thách đấu bị Quỷ Vương hạ, popup thất bại có đúng hai nút: **Ván mới** (xóa vua, bắt đầu trận thường) và **Khiêu chiến lại** (tạo 100 bot mới, giữ Quỷ Vương đương nhiệm làm đối thủ cuối). Khiêu chiến lại vẫn phải qua Battle Royale, farm cuối và Yêu Thần; không vào đánh vua ngay.

Luồng:

```text
100 bot → người sống sót → farm cuối → Yêu Thần
  → chưa có Quỷ Vương: 5 boss Thượng Cổ
  → đã có Quỷ Vương: nhặt 1 vũ khí + 1 giáp Thượng Cổ + 3 bình
    → đấu Quỷ Vương duy nhất
  → chiến thắng → popup
      Ván mới: xóa ngôi → 100 bot → 5 Thượng Cổ
      Tiếm ngôi: lưu người thắng → 100 bot → Quỷ Vương mới
  → thua Quỷ Vương → popup
      Ván mới: xóa ngôi → 100 bot → 5 Thượng Cổ
      Khiêu chiến lại: giữ vua cũ → 100 bot → Yêu Thần → vua cũ
```

## 2. Quy ước đề xuất cho các chi tiết chưa xác định

- **Giữ mọi chỉ số:** giữ cấp, EXP, điểm kỹ năng, chỉ số nền/tối đa, HP/mana/stamina hiện tại tại thời điểm xác nhận Tiếm ngôi. Không tự tăng sức mạnh hoặc nhân HP theo người thách đấu.
- **Giữ build:** kỹ năng và cấp kỹ năng, nội tại, tiến trình nâng cấp lâu dài, vũ khí chính/phụ, giáp, mũ, giày và hiệu ứng trang bị. Giữ tên, ngoại hình, tính cách chính/phụ, tám trục tính cách và sở thích học kỹ năng.
- **Ba bình máu:** mặc định đúng 3 Bình Hồi Máu thường (`healthPotions = 3`, `fullHealthPotions = 0`), thay số bình cũ, không cộng thêm 3. Đây là giả định cần ghi rõ khi triển khai vì game đang có cả bình thường và Bình Máu Toàn Phần.
- **Loot Yêu Thần ở ván có vua:** rơi 1 vũ khí thuộc ô `weapon`, 1 giáp thuộc ô `body`, cả hai phẩm chất `ancient`, và 3 Bình Hồi Máu thường riêng biệt. Không rơi thêm mũ/giáp/vũ khí Thần Khí hay bình từ nhánh cũ. Ba bình này được nhặt cộng vào túi người thách đấu, không ghi đè số bình đã có; có thể được dùng trong giai đoạn chuẩn bị.
- **EXP Yêu Thần:** giữ thưởng 10.000 EXP hiện tại, vì yêu cầu mới chỉ thay vật phẩm. Ván chưa có Quỷ Vương giữ nguyên loot Yêu Thần cũ.
- **Bắt đầu một trận mới:** xóa hành động dang dở, mục tiêu, liên minh, đường đi, đạn/bẫy cũ, trạng thái khống chế/buff tạm thời và đồng hồ của trận trước. Đưa cooldown về trạng thái sẵn sàng, nhưng giữ các dấu đã tiêu hao có tác dụng cả đời nhân vật như `hasRevived`; không tặng lại hồi sinh chỉ vì đổi ván.
- **Quỷ Vương vẫn là bot:** một thanh HP theo build của nó, không tự nhận hai phase, miễn khống chế hay kỹ năng của boss Thượng Cổ. Tính cách tiếp tục ảnh hưởng nhịp đánh, đỡ/né, chọn chiêu và dùng bình; mục tiêu cuối trận cố định là người thách đấu.
- **Hạ Quỷ Vương:** không rơi vật phẩm/bình máu, không cộng EXP, không tặng chỉ số/kỹ năng hay chuyển đồ của vua cũ. Sau khi xác nhận người thắng còn sống, mở popup chiến thắng; chọn Tiếm ngôi lưu chính build người thắng hiện có và cấp ba bình theo luật kế vị. Không có lượt chờ nhặt loot sau trận vua.
- **Thua Quỷ Vương:** kết thúc trận thất bại, không cấp quyền Tiếm ngôi cho người chết. Popup có Ván mới và Khiêu chiến lại theo luật tại mục 1.
- **Trạng thái vua khi Khiêu chiến lại:** mặc định dùng lại bản chụp vua đã lưu lúc lên ngôi, tạo bản sao hoạt động mới cho trận sau. Không mang HP đã mất, bình đã uống, cooldown, EXP hoặc tham chiếu mục tiêu từ trận khiêu chiến thất bại sang. Vua bắt đầu mỗi lượt khiêu chiến với cùng build/tài nguyên đã lưu và ba bình; không nhân thêm chỉ số. Đây là quy ước để nút thử lại không làm vua yếu hoặc mạnh dần ngoài ý muốn.
- **Lưu giữa các ván:** giữ trong bộ nhớ của phiên chơi. Tải lại trang khởi đầu trận thường; lưu qua reload bằng localStorage là phần mở rộng riêng nếu cần.

## 3. Những điểm đã xác minh trong source

- `js/entities/ancientSystem.js`: `awaken()` chờ 20 giây sau Yêu Thần, `openArena()` tạo đấu trường 1500×1500, `spawnNext()` sinh chuỗi 5 boss, `finish()` xử lý loot và `showVictory()` hiện popup. Popup hiện chỉ có nút bắt đầu ván mới.
- `showVictory()` hiện được gọi sau thời gian nhặt đồ/hồi phục cuối chuỗi, tối đa 15 giây. Cần chụp build khi người dùng chọn Tiếm ngôi để không mất trang bị cuối.
- `js/game.js`: `startNewMatch()` reset trận; `EntityManager.init()` lại gọi `AncientSystem.reset()`. Dữ liệu Quỷ Vương phải nằm ngoài trạng thái đấu trường bị reset.
- Số người sống, chiến thắng Battle Royale và bảng bot dựa trên `GameManager.pawns`. Không đưa Quỷ Vương vào mảng này.
- `AIBrain.update()` sau Battle Royale lấy `AncientSystem.boss` làm mục tiêu. Cho Quỷ Vương chạy nguyên nhánh đó sẽ có nguy cơ chọn chính mình.
- `CombatSystem.handleDeath()` áp dụng hồi sinh trang bị trước khi xác nhận tử trận, rồi cấp thưởng, gọi `AncientSystem.finish()` cho boss Thượng Cổ. Quỷ Vương cần nhánh kết thúc riêng sau khi thực sự chết.
- Do vua vẫn có `isPawn`, đường tử trận chung có thể cấp EXP và loot PvP. Phải chặn thưởng ở trận khiêu chiến trước các thao tác cấp thưởng/ghi chuỗi hạ bot, đồng thời kiểm tra event kết liễu sau `handleDeath()` để không vô tình tặng bonus ngoài luật mới.
- `CombatSystem.dropLootOnDeath()` đang rơi 1 bình và đủ vũ khí/giáp/mũ Thần Khí khi Yêu Thần chết. Nhánh có vua phải return sau bộ loot mới để không chạy thêm nhánh cũ. `ancientRelicsData.js` có sẵn 4 vũ khí và 2 giáp Thượng Cổ; có thể dùng ngay, không cần thêm dữ liệu vật phẩm.
- `AIBrain.lootValue()` không cho AI nhặt bình thường khi đã có từ 5 bình. Nếu cần thu đủ ba bình thưởng, chỉ ngoại lệ cho bộ phần thưởng chuẩn bị đấu vua; không bỏ giới hạn nhặt bình chung của game.
- Kỹ năng bot, cooldown chung, nhận damage và nhiều hiệu ứng dùng cờ `isPawn`/`isMonster`. Không đổi bot thắng thành monster rồi mặc nhiên kỳ vọng build và AI còn nguyên.
- `RelicSystem.render()` chỉ duyệt `pawns`; một số hiệu ứng chỉ nhận `isAncient`, `isAncientClone` hoặc `isMonster`. Cần kiểm tra riêng đối thủ Quỷ Vương để đồ không mất tác dụng/vẽ sai.
- ID bot thường được tạo lại từ `pawn_0` tới `pawn_99` mỗi ván. Quỷ Vương đang hoạt động phải có ID riêng, giữ ngoại hình cũ mà không sinh lại theo ID mới.
- Có sẵn test bằng `node:test`, DOM/Canvas stub và test chuỗi Thượng Cổ; không cần thêm thư viện kiểm thử.

## 4. Phương án dữ liệu và tích hợp

Giữ hai lớp dữ liệu nhỏ:

- `GameManager.demonKing`: bản chụp build để mang sang ván sau, không cập nhật khi 100 bot đang sinh tồn.
- `AncientSystem.boss`: thực thể đối thủ đang hoạt động trong đấu trường. Khi có vua, tạo bản sao từ dữ liệu lưu và gắn `isDemonKing`, `title: 'Quỷ Vương'`.

Bản chụp chỉ chứa dữ liệu nhân vật lâu dài và tài nguyên cần giữ. Sao chép sâu các phần có thể thay đổi; không sao chép toàn bộ object bot đang chạy vì có target, nhóm combat, callback của hành động và tham chiếu vòng. Không dùng lại tham chiếu skills/equipment/personality của trận cũ.

Giữ bản chụp vua độc lập với thực thể đang giao chiến. Khiêu chiến lại tái sử dụng bản chụp này; Tiếm ngôi thay bằng bản chụp người thắng; Ván mới xóa nó. Không ghi ngược thay đổi của lượt khiêu chiến thất bại vào bản chụp.

Giữ `isPawn: true` và dùng `isDemonKing` để phân biệt vai trò; không gắn `isMonster` hay `isAncient` cho Quỷ Vương. Đăng ký thực thể này ở danh sách đối thủ hiện có (`monsters`) khi đấu trường mở, để được spatial grid và các phép diện rộng hiện tại tìm thấy; thêm nhánh cập nhật/vẽ theo bot trước nhánh monster. Danh sách người dự Battle Royale (`pawns`) vẫn chứa đúng 100 bot mới. Kiểm tra các nơi duyệt `monsters` nhưng ngầm coi tất cả phần tử là monster, nhất là HUD, AI và hiệu ứng Thượng Bảo.

Không thêm hệ thống boss hoặc AI mới. Thêm nhánh vai trò Quỷ Vương vào AI hiện tại, dùng lại `engageCombat()`, chọn kỹ năng, phản ứng phòng thủ và `usePotion()`. Nhánh này chọn `AncientSystem.original` làm đối thủ, không chọn chính `boss`, không farm hoặc liên minh trong đấu trường. Đồng thời mở rộng nhận diện quyết đấu cuối cho cả hai phía để không bỏ trận sau timeout truy đuổi PvP.

Đặt nhánh chọn đối thủ Quỷ Vương trước nhánh hậu Battle Royale hiện tại, nhưng sau các xử lý chung cần thiết như trạng thái, né vùng nguy hiểm và dùng bình. Khi lấy mục tiêu, xác minh mục tiêu còn sống, khác chính mình và là đối thủ hợp lệ qua `CombatSystem.isEnemy()`. Không duy trì thêm bộ luật sát thương/kỹ năng cho vua.

Để tránh update hai lần và sai tốc độ hồi phục, chỉ tách đoạn cập nhật bot hiện tại thành một hàm nhỏ dùng tại hai nơi: bot trong `pawns` và Quỷ Vương trong danh sách đối thủ. Nhánh vua phải kết thúc trước xử lý monster; không đưa vua vào cả hai mảng. Spatial grid đăng ký mỗi thực thể đúng một lần mỗi frame. Không mở rộng thành hệ thống entity/role tổng quát.

## 5. Thứ tự triển khai

### Bước 1 — Dữ liệu kế vị và reset

File chính: `js/game.js`; dùng dữ liệu bot hiện có trong `js/entities/entityManager.js` làm chuẩn.

- Thêm dữ liệu vua và thao tác Tiếm ngôi, kiểm tra chỉ được gọi khi có người thắng còn sống ở kết quả cuối.
- Chụp build trước reset; chỉ sau khi tạo bản chụp thành công mới khởi tạo ván kế tiếp.
- Sao chép các chỉ số đã có hiệu lực một lần; không chạy lại thao tác mặc trang bị/lên cấp để cộng HP, mana hoặc ATK lần thứ hai. Kiểm tra cả chỉ số nền và chỉ số chiến đấu thực tế trước/sau chuyển ván.
- Phân biệt reset thường (xóa vua) với reset giữ vua. Tiếm ngôi thay bản chụp bằng người thắng rồi reset giữ vua; Khiêu chiến lại giữ bản chụp đương nhiệm rồi reset giữ vua. Dùng cùng một luồng `startNewMatch()`, không nhân đôi khởi tạo bản đồ/trận đấu.
- Thao tác Khiêu chiến lại chỉ hợp lệ tại kết quả thất bại khi có vua đương nhiệm; không tái sử dụng người thách đấu đã chết. Mọi bot của ván mới được tạo lại.
- Sinh 100 bot mới như hiện tại; vua chỉ là dữ liệu chờ. Xóa selection, camera target và input của trận trước.
- Bảo đảm hai lần reset của AncientSystem không làm mất vua; chặn click hai lần tạo hai trận/bản sao.

Hoàn thành khi: Tiếm ngôi/Khiêu chiến lại giữ đúng bản chụp tương ứng, độc lập với object cũ, đúng 3 bình, 100 bot mới và không có vua hoạt động ngoài đấu trường; Ván mới xóa ngôi.

### Bước 2 — Nhánh đối thủ cuối

File chính: `js/entities/ancientSystem.js`, `js/game.js`.

- Giữ điều kiện người sống sót/cấp 15/farm cuối và 20 giây chuẩn bị sau Yêu Thần.
- Thời gian chuẩn bị là tối thiểu: chưa mở trận vua khi hai món thưởng chưa được xử lý hoặc bình thưởng vẫn chưa được thu thập. Dùng lại luồng ưu tiên loot; trạng thái kết thúc chuẩn bị phải xét món đã nhặt/dùng, không yêu cầu còn nguyên ba bình trong túi. Nếu người thách đấu đang mặc món cùng ô mạnh hơn, giữ món mạnh hơn thay vì ép đổi yếu đi.
- Nếu không có vua, giữ chuỗi Thượng Cổ nguyên trạng.
- Nếu có vua, dùng lại `openArena()`, đặt người thách đấu và vua ở hai vị trí hợp lệ; bỏ hàng đợi 5 boss và các cơ chế riêng của chúng.
- Chặn tick nội tại/phase/sinh boss kế tiếp của Thượng Cổ đối với vua. Mặc định trận vua không có sấm ngẫu nhiên của boss Thượng Cổ để kết quả do hai bot quyết định.
- Vua dùng tốc độ hồi mana/stamina, HP và cooldown của bot; không rơi vào nhịp hồi phục của monster trong `updateMonsters()`.
- Dùng chung hàm update bot cho vua, gọi đúng một lần mỗi frame; bỏ qua toàn bộ `BossBrain`, giới hạn sát thương boss và tick phase của Thượng Cổ.

Hoàn thành khi: Yêu Thần chết mở đúng một Quỷ Vương, không boss cũ, không lần sinh lại sau 10 giây.

### Bước 3 — AI và kết quả chiến đấu

File chính: `js/ai/aiBrain.js`, `js/entities/combatSystem.js`, `js/entities/relicSystem.js`.

- Thêm nhánh loot Yêu Thần khi có vua: chọn ngẫu nhiên đúng một món trong nhóm 4 vũ khí và một món trong nhóm 2 giáp Thượng Cổ hiện có, cộng 3 bình thường; giữ EXP, bỏ loot Thần Khí cũ. Gắn các món vào bộ chiến lợi phẩm chuẩn bị để AI ưu tiên và điều kiện mở đấu trường nhận biết được. Xử lý cả Yêu Thần chết sớm và death bị gọi lại, không cấp hai lần hoặc chờ món đã mất vĩnh viễn.
- Hai phía dùng combat bot hiện có, tính cách, kỹ năng, trang bị và bình máu thật.
- Vua chọn người thách đấu; người thách đấu chọn vua. Bảo đảm không tự đánh, không liên minh, không bỏ mục tiêu vĩnh viễn khi mất tầm nhìn sau tàn tích.
- Kiểm tra Thượng Bảo khi một bot giữ vai trò boss, nhất là Nhẫn Vực Sâu có điều kiện đánh Thượng Cổ và hình ảnh/ảo ảnh hiện chỉ duyệt `pawns`. Bổ sung điều kiện theo vai trò nơi cần, không gắn `isAncient` để lách.
- Kiểm tra hiệu ứng của trang bị theo cả hai chiều: bẫy của vua phải đánh được người thách đấu, bẫy người thách đấu phải đánh được vua; nổ lan không tự gây sát thương cho chủ chỉ vì chủ nằm trong `monsters`. Duyệt hai danh sách thực thể hiện có và lọc bằng `isEnemy()` ở những hiệu ứng cần nhiều mục tiêu; không tạo một bản sao hệ thống trang bị cho vua.
- Chỉ công nhận thắng sau hồi sinh trang bị nếu có. Nhánh tử trận trong khiêu chiến không cấp thưởng PvP cho cả người thách đấu lẫn vua, không rơi đồ/bình và không chạy thưởng chuỗi Thượng Cổ; dọn đạn/effect nguy hiểm sau kết liễu để kết quả ổn định.
- Khi vua chết và người thách đấu còn sống, mở popup chiến thắng ngay sau khi xử lý tử trận xong; không chờ loot/hồi phục 15 giây hoặc yêu cầu các trường loot riêng của chuỗi cũ. Chụp build khi chọn Tiếm ngôi, không tự hồi đầy HP hay cộng EXP do kết liễu.
- Người thách đấu chết phải mở popup thất bại Ván mới/Khiêu chiến lại dù vua còn sống ở danh sách đối thủ. Chỉ cho Khiêu chiến lại dùng bản chụp vua đương nhiệm; không ghi trạng thái vua sau cuộc đấu vào đó.

Hoàn thành khi: có thắng/thua rõ ràng, dùng tối đa 3 bình được cấp, giữ build và kế vị nhiều đời không sinh tham chiếu cũ.

### Bước 4 — Popup và hiển thị

File chính: `js/ui/directorControls.js`, `js/ui/inspectModal.js`, `js/game.js`, `js/entities/ancientSystem.js`; chỉnh `css/game.css` nếu bố cục cần.

- Một popup kết quả cuối dùng lại cho thắng 5 Thượng Cổ và hạ Quỷ Vương, với đúng hai nút **Ván mới** / **Tiếm ngôi quỷ vương**.
- Popup thua khiêu chiến có đúng hai nút **Ván mới** / **Khiêu chiến lại**. Nội dung nêu rõ Khiêu chiến lại tạo 100 bot mới, vẫn phải hạ Yêu Thần và đối đầu cùng Quỷ Vương.
- Nội dung phân biệt chinh phục đủ 5 boss với hạ tên Quỷ Vương đương nhiệm; không hiện quyền Tiếm ngôi ở popup chỉ còn một người sống sót.
- Giữ ngoại hình bot; thêm danh hiệu Quỷ Vương ở tên trên sân, inspect và HUD. Dùng renderer bot hiện có thay vì monster art.
- HUD không hiện `Phase undefined` hoặc `1/5` khi đấu vua; roster/số bot sống chỉ tính 100 người tham gia mới.
- Dùng nút thật, hỗ trợ bàn phím và bố cục hai nút trên màn hình nhỏ.

### Bước 5 — Kiểm chứng và mô phỏng

Mở rộng `tests/game.test.cjs`, tái sử dụng harness và các kịch bản cổ đại hiện có. Chỉ thêm kiểm tra cho hành vi mới:

1. Thắng boss thứ 5 mới mở hai lựa chọn; boss 1–4 và kết quả Battle Royale chưa cho Tiếm ngôi.
2. Tiếm ngôi giữ toàn bộ build/tính cách/ngoại hình đã liệt kê, đúng ba bình; không chia sẻ tham chiếu, không mang target/timer cũ hoặc cộng lại bonus trang bị. So sánh chỉ số chiến đấu thực tế trước/sau.
3. Trận kế tiếp đúng 100 bot; vua không bị tính vào số sống, spatial grid hoặc nhận update trước khi đấu trường mở.
4. Yêu Thần trong ván có vua rơi đúng 5 món: 1 vũ khí Thượng Cổ, 1 giáp Thượng Cổ và 3 bình; không rơi thêm đồ Thần Khí/mũ, EXP vẫn đúng 10.000. Ván thường giữ loot cũ. Death lặp không nhân phần thưởng.
5. Chờ bot xử lý hai món và thu bình trước khi mở trận vua; nhặt đủ bộ thưởng kể cả khi đã có 5 bình; pause dừng chuẩn bị, dùng bình không làm điều kiện bị kẹt. Sau đó có đúng một vua; không spawn năm boss, không áp hai phase/miễn khống chế/hồi phục monster.
6. Hai phía di chuyển, ra đòn, dùng kỹ năng, đỡ/né và dùng bình; không tự target, không kẹt sau vật cản, không NaN/vượt biên. Vua chỉ được update một lần, có nhịp hồi tài nguyên/cooldown của bot; bẫy/nổ lan/ảo ảnh hoạt động cả hai chiều và không tự đánh chủ.
7. Hồi sinh trang bị xảy ra trước thắng. Hạ vua không sinh drop mới, không tăng EXP/điểm kỹ năng hoặc nhận bonus kết liễu; popup mở không chờ nhặt loot. Death lặp không xử lý kết quả hai lần.
8. Người thách đấu thắng rồi Tiếm ngôi: vua mới là người thách đấu với build hiện có và ba bình, không nhận đồ/chỉ số của vua cũ; lặp ít nhất ba đời.
9. Người thách đấu thua: popup đúng Ván mới/Khiêu chiến lại, không được Tiếm ngôi. Khiêu chiến lại tạo đúng 100 bot mới, giữ vua cũ từ bản chụp độc lập, không giữ HP mất/bình đã dùng của cuộc đấu; qua Yêu Thần vẫn có bộ thưởng Thượng Cổ và chỉ mở một vua. Kiểm tra nhiều lần thất bại/thử lại và click lặp.
10. Pause không làm trôi đồng hồ chuẩn bị/chiến đấu; popup đóng băng update; HUD/inspect/render đúng cho vua cận chiến và vua đánh xa.
11. Ván mới từ popup thắng, popup thua hoặc toolbar đều xóa vua, khôi phục chuỗi năm Thượng Cổ và loot Yêu Thần thường.

Chạy `npm test`, `npm run build`, `git diff --check`. Kiểm tra popup/HUD/inspect ở desktop và mobile. Mô phỏng combat thật với vài build vua khác nhau (cận chiến, tầm xa, hồi phục/khống chế), ghi thời gian và nguyên nhân thắng/thua/kẹt. Test chủ động kết liễu chỉ xác minh luồng kế vị, không chứng minh cân bằng hay tỷ lệ thắng tự nhiên.

## 6. Giới hạn bản đầu

- Không thêm dependency, backend, bảng lịch sử triều đại, artwork boss mới hoặc hệ số tăng sức mạnh qua từng đời.
- Không tự cân bằng lại vua bằng cách sửa chỉ số: người thách đấu được vũ khí/giáp Thượng Cổ theo yêu cầu mới, nhưng vẫn có thể chênh lệch cấp, kỹ năng và các ô trang bị khác. Đo qua mô phỏng để xác minh cơ hội thắng; bộ loot mới không đồng nghĩa bảo đảm tỷ lệ thắng 50/50.
- Chưa triển khai lưu sau reload; Khiêu chiến lại sau thất bại thuộc phạm vi bản đầu.
- Tái sử dụng hệ thống hiện tại; chỉ tách vai trò người tham gia Battle Royale và đối thủ cuối ở các điểm thực sự cần.
