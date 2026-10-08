# AI cuối trận và tiến cấp người sống sót — 08/10/2026

- Khi còn 2–5 người: ưu tiên săn bot. Nếu mọi đối thủ hơn ít nhất 5 cấp, bot farm quái vừa sức để bắt kịp; khi chênh dưới 5 cấp, quay lại săn. Liên minh hai bot vẫn có thể săn đối thủ mạnh nếu ước lượng cả cặp đạt 40%.
- Combat PvP đã bắt đầu giữ đối thủ đến khi một bên chết. Không thoát vì fear, HP thấp hoặc hết thời gian truy đuổi; vẫn uống bình, dùng kỹ năng, đỡ/né và lùi ngắn để hồi thể lực. Giữ nguyên giới hạn 3 thực thể / 4 khi đúng hai cặp liên minh, va chạm và luật sông. Hai người cuối giải tán liên minh để quyết đấu.
- Người sống sót duy nhất được vượt cấp 15. Từ 15 lên 16 cần 1.200 EXP; mỗi cấp tiếp theo tăng thêm 200 EXP cần thiết. EXP tích lũy, tăng HP/ATK/DEF, hồi đầy khi lên cấp và điểm kỹ năng tiếp tục hoạt động. Bảng thông tin hiển thị EXP cần cho các cấp mới.
- Yêu Tướng / Yêu Vương / Yêu Thần ngoài combat hồi lần lượt 1% / 3% / 5% HP tối đa mỗi giây. Trong combat hồi 1 HP/giây. Combat vẫn được giữ 6 giây sau lần tấn công cuối; hồi máu tính đúng phần thời gian khi thời hạn này hết giữa một bước cập nhật. Không hồi vượt HP tối đa, khi chết hoặc khi game tạm dừng.
- Yêu Thần thưởng 10.000 EXP và rơi đủ vũ khí, giáp, mũ Thần Khí; giữ một bình máu theo luật trước đó. Bổ sung Thiên Miện Thần Vương ở ô mũ. Thượng Cổ vẫn thức tỉnh và kết thúc trận khi bị hạ.

## Kiểm tra

- npm test: 92/92 đạt, gồm mô phỏng đầy đủ 100 bot, giới hạn combat, farm bắt kịp, giữ quyết đấu, vượt cấp, hồi máu theo thời gian và thưởng boss.
- npm run build: thành công.
- Bản production chạy bằng Edge headless tại http://127.0.0.1:4173/: seed 42 bắt đầu còn 5 bot ở giây 833,1; xác định người sống sót ở giây 877,8. Sampling mỗi giây ghi nhận 0 vi phạm cap, 0 tụ đám quá giới hạn và 1 lần đổi mục tiêu săn còn sống trong giai đoạn cuối, không đổi qua lại liên tục.
- Tiếp tục lượt farm cuối: hạ cả 5 Yêu Vương, hạ Yêu Thần ở giây 1093, đạt cấp 21, rơi đủ ba ô Thần Khí; Phản Chiếu thức tỉnh. Bot tử trận trước Phản Chiếu ở giây 1138,9, game kết thúc đúng logic.
- Không có lỗi JavaScript trình duyệt; trạng thái vị trí, HP, mana và stamina hữu hạn.
- Không stage, commit hoặc push.
