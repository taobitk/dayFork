# DayFork — Định hướng dự án

> Tài liệu "cam kết" để giữ đúng hướng. Muốn đổi hướng thì sửa file này trước, code sau.

## 1. Ý tưởng
Mỗi ngày user có vài **cơ hội** (tài nguyên: thời gian, tiền). Với mỗi cơ hội, user liệt kê các **nhánh** có thể làm rồi chọn một.
Khi nhìn lại, user thấy mình **đã chọn gì** và **ngày đó còn có thể đã sống thế nào**.

## 2. Luồng sử dụng
1. Vào web, chọn ngày.
2. Tạo cơ hội kèm tài nguyên (ví dụ: `2 tiếng`, `50k + 2 tiếng`).
3. Với mỗi cơ hội, tạo các nhánh (ví dụ: chơi game / đi bộ / ngồi học) và đánh dấu nhánh đã chọn.
4. Lặp lại đến hết ngày.
5. Nhìn lại ở trang **Ngã Rẽ**: so sánh ngày thực tế với hai ngày do AI đề xuất.

## 3. Dữ liệu (chỉ có cơ hội và nhánh)
- **Cơ hội**: ngày, tài nguyên (cố định: thời gian, tiền) + **ghi chú khác** (văn bản tự do, tùy chọn) cho những thứ không lượng hóa được (ví dụ: `đang mệt`, `trời mưa`, `chỉ rảnh một tay`).
- **Nhánh**: tên, tiêu hao, nhận lại (văn bản tự do, không cố định), cờ đã chọn.
- **Lối AI** (cache): ngày, góc nhìn, danh sách nhánh được chọn kèm câu "nếu chọn thì hôm đó tôi sẽ...".

Quy mô dự kiến: 5–7 cơ hội và 15–20 nhánh mỗi ngày.

## 4. Vai trò của AI
Mỗi ngày AI dựng **2 lối**, chỉ chọn trong các nhánh user đã nhập:
1. **Hiệu Quả**: tối ưu tài nguyên, hướng tới mục tiêu và lợi ích dài hạn (có thể trùng với user).
2. **Thả Lỏng**: ưu tiên nghỉ ngơi, giảm căng thẳng và phục hồi cảm xúc.

Cùng lối **Thực Tế** của user, mỗi ngày có đúng **3 lối** (hiển thị ở trang **Ngã Rẽ**).

> Tên gọi: trang "3 Đường Đi" đổi thành **Ngã Rẽ**. Ba lối hiển thị là **Thực Tế / Hiệu Quả / Thả Lỏng** (tối giản, trung tính, không phán xét đúng sai hay đạo đức). Giá trị nội bộ `best` / `comfort` trong code và D1 giữ nguyên.

## 5. Thống kê
Ngày là đơn vị gốc. Tuần và tháng chỉ là gom các ngày theo khoảng ngày.
Ví dụ: tỉ lệ trùng với lối Hiệu Quả / Thả Lỏng, cơ hội nào hay lệch khỏi cả hai.

## 6. Nguyên tắc (không phá vỡ)
- **Không** có nhãn nên / không nên do user gắn.
- **Không** đếm "chọn 1 bỏ lỡ 2". Mỗi ngày chỉ có 3 lối, không ghép tổ hợp.
- AI **chỉ trả về ID nhánh có sẵn**, server kiểm tra lại. AI không tự bịa nhánh hay hệ quả.
- Kết quả AI luôn ghi rõ là "góc nhìn của AI", không phải chân lý.
- Một lần gọi AI cho cả ngày, chạy bất đồng bộ, cache kết quả.
- Tài nguyên có cấu trúc (thời gian, tiền); phần "nhận lại" và "ghi chú khác" của cơ hội là văn bản tự do, không ép lượng hóa.
- Ghi chú khác chỉ là ngữ cảnh: AI được đọc để hiểu hoàn cảnh nhưng không quy ra điểm số hay tự suy diễn thêm.
- Nhập liệu phải nhanh (ưu tiên thao tác bàn phím).

## 7. Giao diện
**Phong cách**: nền sáng, giấy ngà (`#FAF8F5`), chữ mực đậm. Ưu tiên rõ ràng, dịu mắt, ít chữ.
Bản mẫu tham chiếu: `mock.html` ở gốc repo (mock tĩnh, không phải code chạy thật).

**Màu ba lối** (dùng thống nhất mọi nơi): Thực Tế = hổ phách `#D97706` · Hiệu Quả = xanh lá `#059669` · Thả Lỏng = xanh dương `#0284C7`. Cơ hội dùng tím nhạt (`#C7D2FE` / `#4F46E5`).

**Một khuôn note duy nhất** cho cả cơ hội lẫn nhánh:
- Nhãn ghim ở mép trên (`CƠ HỘI #1`, `THỰC TẾ`).
- Dòng 1: icon tròn + tiêu đề đậm. Dòng 2: ghi chú / nhận lại, in nghiêng.
- Kẻ nét đứt, rồi hàng chân: chip tài nguyên (thời gian • tiền) bên trái, thao tác hoặc phần dư bên phải.

**Máy tính — ưu tiên đẹp, trực quan, mượt**
- Một ngày chảy **dọc** từ trên xuống: note cơ hội ở giữa, bên dưới là các note nhánh **xếp song song hàng ngang**.
- **Dây nối chỉ đi theo lối đã chọn**: một dây hổ phách từ cơ hội uốn cong xuống đúng note nhánh đã chọn, rồi từ note đó đi tiếp xuống cơ hội sau. **Không** có dây phụ nối vào các nhánh không chọn. Đổi lựa chọn thì dây chuyển theo.
- Trục chỉ thể hiện thứ tự trong ngày, **không** ngụ ý chọn nhánh này dẫn tới cơ hội kia (các cơ hội độc lập).
- Khi đã chọn, các nhánh còn lại **bắt buộc làm mờ** (mờ + xám nhẹ) để tránh nhiễu mắt; rê chuột vào thì sáng lại để đổi ý.
- Bấm note cơ hội để **mở / gọn**. Khi gọn, dây nối thẳng từ cơ hội này sang cơ hội sau. Mặc định chỉ mở cơ hội đang làm.
- Trang **Ngã Rẽ**: đối chiếu ba lối theo từng cơ hội, cùng màu ba lối ở trên. Nếu cả ba chọn cùng nhánh thì gộp thành một.
- Tự vẽ bằng SVG và transition của Svelte, không dùng thư viện sơ đồ nặng.

**Điện thoại — ưu tiên nhanh, gọn, dễ nhập**
- Các note nhánh tự chuyển thành **danh sách dọc** (cùng khuôn note), không cuộn ngang.
- Vùng chạm tối thiểu 44px. Nhập liệu qua ngăn kéo nhập nhanh.
- Trang Ngã Rẽ ở điện thoại là chế độ xem lại, xếp dọc.

**Nhập liệu trên máy tính**: thêm nhánh bằng ô "+" ngay trong cơ hội, gõ tên rồi Tab sang thời gian và tiền (ưu tiên bàn phím).

**Đơn giản là trên hết**: cơ hội chỉ có thời lượng, tiền và ghi chú khác, **không** có giờ trong ngày, không thêm trường hay bước nhập nào nếu chưa thật cần.

## 8. Công nghệ
SvelteKit + TypeScript + Tailwind (shadcn-svelte, lucide) · Cloudflare Pages · D1 · Playwright (E2E).
API key AI để trong `.dev.vars` (local) và `wrangler secret` (production). Không đọc hay commit file secret.

## 9. Lộ trình
1. **MVP không AI**: nhập cơ hội và nhánh, chọn nhánh, xem lại theo ngày, thống kê tuần và tháng cơ bản.
2. **Gắn AI**: dựng 2 lối mỗi ngày, hiển thị cạnh ngày thực tế.
3. **Hoàn thiện**: thống kê trùng khớp theo tuần và tháng, tinh chỉnh trải nghiệm nhập liệu.
4. **Làm lại giao diện**: theo mục 7 và bản mẫu `mock.html` (khuôn note thống nhất, dây nối theo lối đã chọn, nhánh không chọn làm mờ).

## 10. Ngoài phạm vi (hiện tại)
Nhãn đánh giá của user, điểm số, quy đổi tỉ giá giữa tài nguyên, mục tiêu cá nhân hóa, nhiều lối thay thế theo chủ đề, đa người dùng, giờ trong ngày của cơ hội.

