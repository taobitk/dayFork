import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getTodayISO } from '#lib/date';
import { env } from 'cloudflare:workers';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const today = getTodayISO();
	if (locals.user) {
		throw redirect(303, `/day/${today}`);
	}

	const cfEnv = env as unknown as Record<string, string>;
	const clientId = platform?.env?.GG_Client_ID || cfEnv?.GG_Client_ID || '';

	return {
		clientId,
		today
	};
};

