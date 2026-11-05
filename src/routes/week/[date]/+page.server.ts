import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { isValidISODate, getWeekRange, getTodayISO } from '#lib/date';
import { getRangeData } from '#lib/server/db';
import { computePeriodStats } from '#lib/server/stats';

export const load: PageServerLoad = async ({ params, platform, locals }) => {
	const { date } = params;
	if (!isValidISODate(date)) {
		throw redirect(307, `/week/${getTodayISO()}`);
	}

	if (!locals.user) {
		throw redirect(303, '/login');
	}

	if (!platform?.env?.DB) {
		throw error(500, 'Database binding "DB" is not available.');
	}

	const week = getWeekRange(date);
	const rangeData = await getRangeData(platform.env.DB, week.start, week.end, locals.user.id);
	const stats = computePeriodStats(
		rangeData.opportunities,
		rangeData.branches,
		rangeData.aiPaths,
		week.start,
		week.end
	);

	return {
		date,
		week,
		stats
	};
};
