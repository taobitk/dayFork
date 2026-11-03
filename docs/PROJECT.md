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
5. Nhìn lại: so sánh ngày thực tế với hai ngày do AI đề xuất.

## 3. Dữ liệu (chỉ có cơ hội và nhánh)
- **Cơ hội**: ngày, tài nguyên (cố định: thời gian, tiền).
- **Nhánh**: tên, tiêu hao, nhận lại (văn bản tự do, không cố định), cờ đã chọn.
- **Đường AI** (cache): ngày, góc nhìn, danh sách nhánh được chọn kèm câu "nếu chọn thì hôm đó tôi sẽ...".

Quy mô dự kiến: 5–7 cơ hội và 15–20 nhánh mỗi ngày.

## 4. Vai trò của AI
Mỗi ngày AI dựng **2 đường**, chỉ chọn trong các nhánh user đã nhập:
1. **Tốt nhất**: làm điều tốt, tránh sai lầm (có thể trùng với user).
2. **Thoải mái nhất**: ưu tiên cảm xúc và sự dễ chịu.

Cùng thực tế của user, mỗi ngày có đúng **3 đường**.

## 5. Thống kê
Ngày là đơn vị gốc. Tuần và tháng chỉ là gom các ngày theo khoảng ngày.
Ví dụ: tỉ lệ trùng với đường tốt nhất / thoải mái, cơ hội nào hay lệch khỏi cả hai.

## 6. Nguyên tắc (không phá vỡ)
- **Không** có nhãn nên / không nên do user gắn.
- **Không** đếm "chọn 1 bỏ lỡ 2". Mỗi ngày chỉ có 3 đường, không ghép tổ hợp.
- AI **chỉ trả về ID nhánh có sẵn**, server kiểm tra lại. AI không tự bịa nhánh hay hệ quả.
- Kết quả AI luôn ghi rõ là "góc nhìn của AI", không phải chân lý.
- Một lần gọi AI cho cả ngày, chạy bất đồng bộ, cache kết quả.
- Tài nguyên có cấu trúc, phần "nhận lại" là văn bản tự do.
- Nhập liệu phải nhanh (ưu tiên thao tác bàn phím).

## 7. Công nghệ
SvelteKit + TypeScript + Tailwind (shadcn-svelte, lucide) · Cloudflare Pages · D1 · Playwright (E2E).
API key AI để trong `.dev.vars` (local) và `wrangler secret` (production). Không đọc hay commit file secret.

## 8. Lộ trình
1. **MVP không AI**: nhập cơ hội và nhánh, chọn nhánh, xem lại theo ngày, thống kê tuần và tháng cơ bản.
2. **Gắn AI**: dựng 2 đường mỗi ngày, hiển thị cạnh ngày thực tế.
3. **Hoàn thiện**: thống kê trùng khớp theo tuần và tháng, tinh chỉnh trải nghiệm nhập liệu.

## 9. Ngoài phạm vi (hiện tại)
Nhãn đánh giá của user, điểm số, quy đổi tỉ giá giữa tài nguyên, mục tiêu cá nhân hóa, nhiều đường thay thế theo chủ đề, đa người dùng.

