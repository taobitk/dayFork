import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getTodayISO } from '#lib/date';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}
	const today = getTodayISO();
	throw redirect(303, `/day/${today}`);
};
