import { test, expect } from '@playwright/test';

test.describe('DayFork Live Production E2E Suite', () => {
	const BASE_URL = 'https://dayfork.pages.dev';

	test('Full live user journey on real Cloudflare Pages & D1', async ({ page }) => {
		page.on('console', (msg) => console.log('BROWSER LOG:', msg.text()));
		page.on('pageerror', (err) => console.log('BROWSER ERROR:', err.message));
		page.on('requestfailed', (req) => console.log('REQ FAILED:', req.url(), req.failure()?.errorText));
		page.on('response', (res) => {
			console.log(`RESP: ${res.status()} ${res.request().method()} ${res.url()}`);
		});

		// 1. Visit root page and verify redirection to today
		await page.goto(BASE_URL);
		await expect(page).toHaveTitle(/DayFork/);
		await expect(page.locator('header')).toContainText('DayFork');
		await expect(page.locator('header')).toContainText('Hôm nay');
		await expect(page.locator('header')).toContainText('3 Đường Đi');

		const todayUrl = page.url();
		expect(todayUrl).toMatch(/\/day\/\d{4}-\d{2}-\d{2}/);

		// 2. Create a test opportunity
		const uniqueTitle = `Live E2E ${Date.now()}`;
		await page.fill('#opp-title', uniqueTitle);
		await page.fill('#opp-time', '90');
		await page.fill('#opp-money', '50000');
		await page.click('button[type="submit"]:has-text("Tạo Cơ Hội")');

		// 3. Verify opportunity card appears
		const oppCard = page.locator('.bg-slate-900\\/50', { hasText: uniqueTitle });
		await expect(oppCard).toBeVisible({ timeout: 15000 });
		await expect(oppCard).toContainText('1h 30p');
		await expect(oppCard).toContainText('50.000 đ');

		// 4. Add Branch 1: "Chạy bộ công viên"
		const addBranchForm1 = oppCard.locator('form[action="?/addBranch"]');
		await addBranchForm1.locator('input[name="name"]').fill('Chạy bộ công viên');
		await addBranchForm1.locator('input[name="cost_time"]').fill('45');
		await addBranchForm1.locator('input[name="cost_money"]').fill('0');
		await addBranchForm1.locator('input[name="outcome"]').fill('Sức khỏe dồi dào');
		
		const respPromise1 = page.waitForResponse(
			(r) => r.url().includes('addBranch') && (r.status() === 200 || r.status() === 204),
			{ timeout: 15000 }
		);
		await addBranchForm1.locator('button[type="submit"]').click();
		await respPromise1;

		await expect(oppCard).toContainText('Chạy bộ công viên', { timeout: 15000 });
		await page.waitForTimeout(1000);

		// 5. Add Branch 2: "Ngồi cafe máy lạnh"
		const addBranchForm2 = oppCard.locator('form[action="?/addBranch"]');
		await addBranchForm2.locator('input[name="name"]').fill('Ngồi cafe máy lạnh');
		await addBranchForm2.locator('input[name="cost_time"]').fill('90');
		await addBranchForm2.locator('input[name="cost_money"]').fill('35000');
		await addBranchForm2.locator('input[name="outcome"]').fill('Thư giãn');

		const respPromise2 = page.waitForResponse(
			(r) => r.url().includes('addBranch') && (r.status() === 200 || r.status() === 204),
			{ timeout: 15000 }
		);
		await addBranchForm2.locator('button[type="submit"]').click();
		await respPromise2;

		await expect(oppCard).toContainText('Ngồi cafe máy lạnh', { timeout: 15000 });
		await page.waitForTimeout(1000);

		// 6. Choose Branch 1
		const branch1Row = oppCard.locator('.flex.items-center.justify-between', {
			hasText: 'Chạy bộ công viên'
		});
		await branch1Row.locator('button[type="submit"]').first().click();

		// Verify "Đã chọn thực tế" appears
		await expect(branch1Row).toContainText('Đã chọn thực tế', { ignoreCase: true, timeout: 15000 });
		// Verify remaining calculation
		await expect(branch1Row).toContainText('Thừa: 50.000 đ');
		await expect(branch1Row).toContainText('Dư: 45 phút');

		// 7. Go to 3 Paths Review page
		await page.click('a:has-text("Xem 3 Đường Đi")');
		await expect(page).toHaveURL(/.*\/review/);
		await expect(page.locator('h1')).toContainText('Đối Chiếu 3 Đường Đi');

		// Check Column 1 (Actual) contains the chosen branch
		const compCard = page.locator('.bg-slate-900\\/60', { hasText: uniqueTitle });
		await expect(compCard).toContainText('Chạy bộ công viên');
		await expect(compCard).toContainText('Dư dôi:');
		await expect(compCard).toContainText('+45 phút');
		await expect(compCard).toContainText('+50.000 đ');

		// 8. Trigger AI Paths Generation
		const aiBtn = page.locator('button:has-text("Góc nhìn AI")');
		await aiBtn.click();

		// Wait for AI button spinner to settle (allow up to 25s for Groq LLM inference)
		await expect(page.locator('button:has-text("suy ngẫm")')).toBeHidden({ timeout: 25000 });

		// Verify Best and Comfort columns have proposals
		await expect(compCard.getByText('Tốt nhất (Best)')).toBeVisible();
		await expect(compCard.getByText('Thoải mái nhất (Comfort)')).toBeVisible();

		// 9. Check Week & Month navigation
		await page.click('header nav a:has-text("Tuần")');
		await expect(page).toHaveURL(/\/week\//);
		await expect(page.locator('h1')).toContainText('Tuần:');
		await expect(page.locator('text=Trùng Đề Xuất Tốt Nhất')).toBeVisible();

		await page.click('header nav a:has-text("Tháng")');
		await expect(page).toHaveURL(/\/month\//);
		await expect(page.locator('h1')).toContainText('Tháng');
		await expect(page.locator('text=Lịch Hoạt Động Trong Tháng')).toBeVisible();

		// 10. Clean up: go back to today and delete the test opportunity
		await page.goto(todayUrl);
		const cleanupCard = page.locator('.bg-slate-900\\/50', { hasText: uniqueTitle });
		page.on('dialog', (dialog) => dialog.accept());
		await cleanupCard.locator('button:has-text("✕ Xóa")').click();

		await expect(page.locator(`text=${uniqueTitle}`)).toBeHidden({ timeout: 15000 });
	});
});
