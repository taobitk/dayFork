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

## 4. An Toàn Cơ Sở Dữ Liệu & Di Trú (D1 / SQLite Anti-Data Loss)
- **Tuyệt đối không tự ý xóa data mồ côi**: Khi chuyển từ Single-user sang Multi-user, KHÔNG ĐƯỢC chạy lệnh xóa hàng loạt (`DELETE WHERE user_id IS NULL`). Phải hỏi người dùng để gán data cũ cho tài khoản mới (`UPDATE ... SET user_id = ?`) hoặc sao lưu trước.
- **Thay đổi ràng buộc UNIQUE trong SQLite/D1**: SQLite không hỗ trợ `ALTER TABLE ... DROP/ADD CONSTRAINT UNIQUE`. Luôn áp dụng quy trình migrate: tạo bảng tạm `_new` -> chép dữ liệu -> drop bảng cũ -> đổi tên bảng mới.
- **Thực thi migration từ xa**: Khi lệnh `wrangler d1 migrations apply --remote` gặp lỗi cấp quyền (7403), chuyển sang dùng lệnh chạy trực tiếp file SQL: `npx wrangler d1 execute <db> --remote --file=<path.sql>`.
- **Cloudflare Pages Secrets**: Bất kỳ secret nào thêm qua `wrangler pages secret put` đều chỉ nạp vào Worker ở lần deploy kế tiếp. Luôn chạy lại quy trình build và deploy sau khi cập nhật secret.

## 5. Xác Thực (Auth) & Chuẩn Kiểm Thử E2E Playwright
- **Google Identity Services (GIS)**: Luôn khai báo `declare global { interface Window { google?: any; } }` trong `src/app.d.ts` để TypeScript không báo lỗi khi GIS gắn `window.google`.
- **E2E Testing với Auth Gate**: Tuyệt đối không automate luồng đăng nhập thật trên giao diện Google OAuth (sẽ dính CAPTCHA/2FA). Cần seed trực tiếp user test và session test vào D1 (`users`, `sessions`), sau đó nạp cookie `session_id` qua `browserContext.addCookies()`.
- **Tính Idempotent trong E2E**: Luôn đưa lệnh seed/upsert session test vào hook `test.beforeEach()` để kịch bản kiểm thử có thể chạy lặp lại liên tục mà không bị gãy khi có bước "Đăng xuất" (Logout).
- **Windows PowerShell CLI**: Khi nối chuỗi nhiều lệnh terminal trên Windows PowerShell, luôn dùng dấu chấm phẩy `;` thay vì `&&` để tránh lỗi cú pháp parse.

## 6. Kiểm Thử & Triển Khai
- Luôn kiểm tra `npm run check` (0 errors, 0 warnings) và `npm run test:unit` trước khi deploy.
- Sau khi deploy Cloudflare Pages, luôn chạy kiểm thử E2E Playwright trực tiếp trên production (`npx playwright test tests/live.e2e.ts`).
