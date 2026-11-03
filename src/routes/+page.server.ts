import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getTodayISO } from '#lib/date';

export const load: PageServerLoad = async () => {
	const today = getTodayISO();
	throw redirect(307, `/day/${today}`);
};
