# SvelteKit & UI Architecture Standards

## 1. Kiến Trúc & Chia Tách Component (Anti-Monolith)
- **Không để file route quá tải**: Tuyệt đối không để các file route (`+page.svelte`) phình to vượt quá 250 dòng.
- **Module hóa theo tính năng**: Bóc tách giao diện thành các sub-components độc lập đặt trong `$lib/components/<feature>/` (ví dụ: `$lib/components/map/`, `$lib/components/dashboard/`).
- **Phân công trách nhiệm rõ ràng**:
  - `+page.svelte`: Chỉ điều phối luồng dữ liệu, state tổng, trigger modal và bố cục grid chính.
  - Sub-components: Chuyên biệt hiển thị thẻ, form, thanh điều hướng.
  - Server actions (`+page.server.ts`): Xử lý validate và ghi DB.

## 2. Tiêu Chuẩn UI/UX & Tối Giản Hóa (Paper Map Philosophy)
- **Tối giản hóa câu chữ**: Cắt bỏ triệt để các đoạn giải thích dài dòng, văn mẫu hướng dẫn ("Đặt bối cảnh...", "Chưa có ghi chú...", "Dôi dư:", "Tốn:"). Ưu tiên dùng Icon kèm tooltip hoặc nhãn xúc tích 1-2 từ (vd: `AI`, `✨`, `Timeline`).
- **Nghiêm cấm `window.confirm()` trình duyệt**:
  - Tuyệt đối KHÔNG dùng hàm `window.confirm()` hay `alert()` mặc định xấu xí của browser.
  - Bắt buộc dùng Custom Dialog Modal với hiệu ứng bo góc `rounded-2xl` và mờ nền `backdrop-blur`.
- **Quy chuẩn Form & Điền dữ liệu**:
  - **Không điền sẵn số mặc định**: Các ô thời gian, tiền, số lượng phải để trống kèm placeholder mờ gợi ý (tránh bắt người dùng phải bấm xóa số cũ).
  - Tự động reset input về trống sau khi submit thành công.
- **Xử lý tiền tệ Việt Nam (Currency UX)**:
  - Hiển thị tiền luôn có dấu chấm phân cách hàng nghìn (ví dụ: `50.000`, `100.000`).
  - Input nhập tiền phải tự động format dấu chấm khi người dùng gõ hoặc bấm nút chọn nhanh.
  - **Khử chấm ở Backend**: Tại các server actions, luôn luôn dùng `.replace(/\./g, '')` trước khi ép kiểu `Number()` để dữ liệu lưu vào DB luôn chính xác.

## 3. Svelte 5 & State Management
- Tuân thủ cú pháp Svelte 5 runes (`$state`, `$derived`, `$props`).
- Đối với các thao tác chọn nhanh, ưu tiên dùng Optimistic UI (cập nhật state hiển thị 0ms trước, revert nếu server trả về lỗi).

## 4. Kiểm Thử & Triển Khai
- Luôn kiểm tra `npm run check` (0 errors, 0 warnings) và `npm run test:unit` trước khi deploy.
- Sau khi deploy Cloudflare Pages, luôn chạy kiểm thử E2E Playwright trực tiếp trên production (`npx playwright test tests/live.e2e.ts`).
