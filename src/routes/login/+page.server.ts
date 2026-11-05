import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getTodayISO } from '#lib/date';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const today = getTodayISO();
	if (locals.user) {
		throw redirect(303, `/day/${today}`);
	}

	return {
		clientId: platform?.env?.GG_Client_ID || '',
		today
	};
};
