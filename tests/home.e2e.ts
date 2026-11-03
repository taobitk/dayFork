import { test, expect } from '@playwright/test';

test('Trang chủ phản hồi và chuyển hướng đến trang ngày hôm nay', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveTitle(/DayFork/);
	await expect(page.locator('header')).toContainText('DayFork');
	await expect(page.locator('header')).toContainText('Hôm nay');
	await expect(page.locator('header')).toContainText('3 Đường Đi');
});
