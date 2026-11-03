import type { Handle } from '@sveltejs/kit/hooks';

export const handle: Handle = async ({ event, resolve }) => {
	// Ensure platform.env is available during local Vite dev
	if (!event.platform?.env?.DB) {
		const cfPlatform = (globalThis as unknown as { __sveltekit_cloudflare_platform?: App.Platform }).__sveltekit_cloudflare_platform;
		if (cfPlatform?.env) {
			(event as { platform?: App.Platform }).platform = {
				...event.platform,
				env: cfPlatform.env
			};
		}
	}

	return resolve(event);
};
