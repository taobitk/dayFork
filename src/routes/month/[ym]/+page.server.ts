import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getMonthRange, getTodayISO } from '#lib/date';
import { getRangeData } from '#lib/server/db';
import { computePeriodStats } from '#lib/server/stats';

export const load: PageServerLoad = async ({ params, platform, locals }) => {
	const { ym } = params;
	if (!/^\d{4}-\d{2}$/.test(ym)) {
		const todayYm = getTodayISO().slice(0, 7);
		throw redirect(307, `/month/${todayYm}`);
	}

	if (!locals.user) {
		throw redirect(303, '/login');
	}

	if (!platform?.env?.DB) {
		throw error(500, 'Database binding "DB" is not available.');
	}

	const monthRange = getMonthRange(ym);
	const rangeData = await getRangeData(platform.env.DB, monthRange.start, monthRange.end, locals.user.id);
	const stats = computePeriodStats(
		rangeData.opportunities,
		rangeData.branches,
		rangeData.aiPaths,
		monthRange.start,
		monthRange.end
	);

	return {
		ym,
		monthRange,
		stats
	};
};
