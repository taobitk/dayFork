import type { Handle } from '@sveltejs/kit/hooks';
import { env } from 'cloudflare:workers';

export const handle: Handle = async ({ event, resolve }) => {
	// In Cloudflare Workers / Pages, bindings come from cloudflare:workers
	// In local Vite dev, it comes from globalThis.__sveltekit_cloudflare_platform
	const cfPlatform = (globalThis as unknown as { __sveltekit_cloudflare_platform?: App.Platform }).__sveltekit_cloudflare_platform;
	const activeEnv = (event.platform?.env?.DB ? event.platform.env : undefined) ?? (env?.DB ? (env as unknown as Env) : undefined) ?? cfPlatform?.env;

	if (activeEnv) {
		(event as { platform?: App.Platform }).platform = {
			...event.platform,
			env: activeEnv
		};
	}

	return resolve(event);
};
