import { test, expect } from '@playwright/test';

test.describe('DayFork Live Production E2E Suite', () => {
	const BASE_URL = 'https://dayfork.pages.dev';

	test('Full live user journey on Cloudflare Pages & D1 with Paper Map UI & other_text', async ({ page }) => {
		page.on('console', (msg) => console.log('BROWSER LOG:', msg.text()));
		page.on('pageerror', (err) => console.log('BROWSER ERROR:', err.message));
		page.on('requestfailed', (req) => console.log('REQ FAILED:', req.url(), req.failure()?.errorText));
		page.on('response', (res) => {
			if (res.status() >= 400) {
				console.log('HTTP ERROR RESP:', res.status(), res.url());
			}
		});

		// 1. Visit root page and verify redirection to today
		await page.goto(BASE_URL);
		await expect(page).toHaveTitle(/DayFork/);
		await expect(page.locator('header')).toContainText('DayFork');
		await expect(page.locator('header')).toContainText('Hôm nay');
		await expect(page.locator('header')).toContainText('Ngã Rẽ');

		const todayUrl = page.url();
		expect(todayUrl).toMatch(/\/day\/\d{4}-\d{2}-\d{2}/);

		// 1b. Test Dark Mode toggle and localStorage persistence
		const themeToggle = page.locator('button[data-testid="theme-toggle"]');
		await expect(themeToggle).toBeVisible();
		await page.waitForTimeout(500);

		// Click to switch to Dark Mode
		await themeToggle.click();
		await expect(page.locator('html')).toHaveClass(/dark/);
		const storedThemeDark = await page.evaluate(() => localStorage.getItem('theme'));
		expect(storedThemeDark).toBe('dark');

		// Reload page and verify dark mode persists without FOUC
		await page.reload();
		await expect(page.locator('html')).toHaveClass(/dark/);

		// Click again to switch back to Light Mode
		await page.locator('button[data-testid="theme-toggle"]').click();
		await expect(page.locator('html')).not.toHaveClass(/dark/);
		const storedThemeLight = await page.evaluate(() => localStorage.getItem('theme'));
		expect(storedThemeLight).toBe('light');

		// 2. Create a test opportunity with other_text
		const uniqueTitle = `E2E Map ${Date.now()}`;
		const contextNote = 'Trời se lạnh, tâm trạng phấn khởi';
		await page.fill('#opp-title', uniqueTitle);
		await page.fill('#opp-time', '90');
		await page.fill('#opp-money', '50000');
		await page.fill('#opp-other', contextNote);
		await page.click('button[type="submit"]:has-text("+ Ghim Cơ Hội")');

		// 3. Verify opportunity card appears with unified note design
		const oppCard = page.locator('.opp-parent-card', { hasText: uniqueTitle });
		await expect(oppCard).toBeVisible({ timeout: 15000 });
		await expect(oppCard).toContainText('90p • 50.000 đ');
		await expect(oppCard).toContainText(contextNote);
		await expect(oppCard.locator('.note-badge-tag')).toContainText('CƠ HỘI #');

		// 4. Add Branch 1: "Chạy bộ quanh hồ" via Ghost '+' Card
		const oppBlock = page.locator('[id^="block-"]', { hasText: uniqueTitle });
		await oppBlock.locator('button:has-text("+ Thêm nhánh")').click();
		const addBranchForm1 = oppBlock.locator('form[action="?/addBranch"]');
		await addBranchForm1.locator('input[name="name"]').fill('Chạy bộ quanh hồ');
		await addBranchForm1.locator('input[name="cost_time"]').fill('45');
		await addBranchForm1.locator('input[name="cost_money"]').fill('0');
		await addBranchForm1.locator('input[name="outcome"]').fill('Tỉnh táo, sảng khoái');

		const respPromise1 = page.waitForResponse(
			(r) => r.url().includes('addBranch') && (r.status() === 200 || r.status() === 204),
			{ timeout: 15000 }
		);
		await addBranchForm1.locator('button[type="submit"]:has-text("Lưu nhánh")').click();
		await respPromise1;

		await expect(oppBlock).toContainText('Chạy bộ quanh hồ', { timeout: 15000 });
		await page.waitForTimeout(500);

		// 5. Add Branch 2: "Ngồi cà phê đọc sách" via Ghost '+' Card
		await oppBlock.locator('button:has-text("+ Thêm nhánh")').click();
		const addBranchForm2 = oppBlock.locator('form[action="?/addBranch"]');
		await addBranchForm2.locator('input[name="name"]').fill('Ngồi cà phê đọc sách');
		await addBranchForm2.locator('input[name="cost_time"]').fill('90');
		await addBranchForm2.locator('input[name="cost_money"]').fill('35000');
		await addBranchForm2.locator('input[name="outcome"]').fill('Thư thái nạp tri thức');

		const respPromise2 = page.waitForResponse(
			(r) => r.url().includes('addBranch') && (r.status() === 200 || r.status() === 204),
			{ timeout: 15000 }
		);
		await addBranchForm2.locator('button[type="submit"]:has-text("Lưu nhánh")').click();
		await respPromise2;

		await expect(oppBlock).toContainText('Ngồi cà phê đọc sách', { timeout: 15000 });
		await page.waitForTimeout(500);

		// 6. Choose Branch 1: "Chạy bộ quanh hồ"
		const branch1Card = oppBlock.locator('.branch-card', { hasText: 'Chạy bộ quanh hồ' });
		await branch1Card.locator('button:has-text("Chọn >")').click();

		// Verify "THỰC TẾ" badge appears on Branch 1 (Hình 3) and it is centered in Col 2
		await expect(branch1Card.locator('.note-badge-tag')).toContainText('THỰC TẾ', { timeout: 15000 });
		await expect(oppBlock.locator('.col-start-2 .branch-card')).toContainText('Chạy bộ quanh hồ');
		// Verify surplus chip
		await expect(branch1Card).toContainText('+50.000 đ');
		await expect(branch1Card).toContainText('+45p');

		// Verify Branch 2 is dimmed (has-selection container)
		const branchesGrid = oppBlock.locator('.branches-grid');
		await expect(branchesGrid).toHaveClass(/has-selection/);

		// 6b. Add Branch 3 & Branch 4 to test multi-branch layout (Row 2 corridor)
		await oppBlock.locator('button:has-text("+ Thêm nhánh")').click();
		const addBranchForm3 = oppBlock.locator('form[action="?/addBranch"]');
		await addBranchForm3.locator('input[name="name"]').fill('Xem phim tại nhà');
		await addBranchForm3.locator('input[name="cost_time"]').fill('90');
		await addBranchForm3.locator('input[name="cost_money"]').fill('0');
		await addBranchForm3.locator('button[type="submit"]:has-text("Lưu nhánh")').click();
		await page.waitForTimeout(500);

		// Switch choice to "Xem phim tại nhà" and verify it instantly moves to center Col 2!
		const branch3Card = oppBlock.locator('.branch-card', { hasText: 'Xem phim tại nhà' });
		await branch3Card.locator('button:has-text("Chọn >")').click();
		await expect(oppBlock.locator('.col-start-2 .branch-card')).toContainText('Xem phim tại nhà', { timeout: 15000 });

		// Verify wire spine is rendered
		const wireTop = oppBlock.locator('.wire-spine');
		await expect(wireTop.first()).toBeVisible();

		// 7. Go to Ngã Rẽ review page
		await page.click('a:has-text("Xem Ngã Rẽ")');
		await expect(page).toHaveURL(/.*\/review/);
		await expect(page.locator('h1')).toContainText('Ngã Rẽ Cuộc Sống');

		// Check Column 1 (Thực Tế) contains the chosen branch ("Xem phim tại nhà") and context note
		const compCard = page.locator('.bg-white.rounded-2xl', { hasText: uniqueTitle });
		await expect(compCard).toContainText('Xem phim tại nhà');
		await expect(compCard).toContainText(contextNote);
		await expect(compCard).toContainText('Thực Tế');
		await expect(compCard).toContainText('Hiệu Quả');
		await expect(compCard).toContainText('Thả Lỏng');

		// 8. Trigger AI Paths Generation
		const aiBtn = page.locator('button:has-text("Phản tư AI")');
		await aiBtn.click();

		// Wait for AI spinner to settle (Groq LLM inference)
		await expect(page.locator('button:has-text("suy ngẫm")')).toBeHidden({ timeout: 25000 });

		// Verify Best and Comfort columns have proposals
		await expect(compCard.locator('text=🟢 Hiệu Quả')).toBeVisible();
		await expect(compCard.locator('text=🔵 Thả Lỏng')).toBeVisible();

		// 9. Check Week & Month navigation
		await page.click('header nav a:has-text("Tuần")');
		await expect(page).toHaveURL(/\/week\//);
		await expect(page.locator('h1')).toContainText('Tuần:');
		await expect(page.locator('text=Trùng Hiệu Quả')).toBeVisible();
		await expect(page.locator('text=Trùng Thả Lỏng')).toBeVisible();

		await page.click('header nav a:has-text("Tháng")');
		await expect(page).toHaveURL(/\/month\//);
		await expect(page.locator('h1')).toContainText('Tháng');
		await expect(page.locator('text=Lịch Hoạt Động Trong Tháng')).toBeVisible();

		// 10. Clean up: go back to today and delete the test opportunity
		await page.goto(todayUrl);
		const cleanupBlock = page.locator('[id^="block-"]', { hasText: uniqueTitle });
		page.on('dialog', (dialog) => dialog.accept());
		await cleanupBlock.locator('button[title="Xóa cơ hội này"]').first().click();

		await expect(page.locator(`text=${uniqueTitle}`)).toBeHidden({ timeout: 15000 });
	});
});
