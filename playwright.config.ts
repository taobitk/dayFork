import { defineConfig } from '@playwright/test';

export default defineConfig({
	testMatch: '**/*.e2e.{ts,js}',
	timeout: 60000,
	use: {
		channel: 'chrome',
		headless: true,
		trace: 'on-first-retry'
	}
});
