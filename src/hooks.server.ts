import type { Handle } from '@sveltejs/kit/hooks';
import { env } from 'cloudflare:workers';
import { validateSession } from '#lib/server/db/auth';

export const handle: Handle = async ({ event, resolve }) => {
	// In Cloudflare Workers / Pages, bindings come from cloudflare:workers
	// In local Vite dev, it comes from globalThis.__sveltekit_cloudflare_platform
	const cfPlatform = (
		globalThis as unknown as { __sveltekit_cloudflare_platform?: App.Platform }
	).__sveltekit_cloudflare_platform;
	const activeEnv =
		(event.platform?.env?.DB ? event.platform.env : undefined) ??
		(env?.DB ? (env as unknown as Env) : undefined) ??
		cfPlatform?.env;

	if (activeEnv) {
		(event as { platform?: App.Platform }).platform = {
			...event.platform,
			env: activeEnv
		};
	}

	event.locals.user = null;
	event.locals.session = null;

	const sessionId = event.cookies.get('session_id');
	if (sessionId && event.platform?.env?.DB) {
		try {
			const authResult = await validateSession(event.platform.env.DB, sessionId);
			if (authResult) {
				event.locals.user = authResult.user;
				event.locals.session = authResult.session;
			} else {
				event.cookies.delete('session_id', { path: '/' });
			}
		} catch (err) {
			console.error('Error validating session in hook:', err);
		}
	}

	return resolve(event);
};
