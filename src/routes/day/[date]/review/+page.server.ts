import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { isValidISODate, getTodayISO } from '#lib/date';
import { getDayData, deleteOpportunity, clearDay } from '#lib/server/db';
import type { OpportunityComparison } from '#lib/types';

export const load: PageServerLoad = async ({ params, platform, locals }) => {
	const { date } = params;
	if (!isValidISODate(date)) {
		throw redirect(307, `/day/${getTodayISO()}/review`);
	}

	if (!locals.user) {
		throw redirect(303, '/login');
	}

	if (!platform?.env?.DB) {
		throw error(500, 'Database binding "DB" is not available.');
	}

	const dayData = await getDayData(platform.env.DB, date, locals.user.id);
	const bestSelections = new Map<string, { branch_id: string; reflection: string }>();
	for (const s of dayData.aiPaths.best?.branch_selections || []) {
		bestSelections.set(s.opportunity_id, s);
	}

	const comfortSelections = new Map<string, { branch_id: string; reflection: string }>();
	for (const s of dayData.aiPaths.comfort?.branch_selections || []) {
		comfortSelections.set(s.opportunity_id, s);
	}

	const comparisons: OpportunityComparison[] = dayData.opportunities.map((opp) => {
		const branchMap = new Map(opp.branches.map((b) => [b.id, b]));
		const actualBranch = opp.branches.find((b) => b.is_chosen === 1);

		const bestSelection = bestSelections.get(opp.id);
		const bestBranch = bestSelection ? branchMap.get(bestSelection.branch_id) : undefined;

		const comfortSelection = comfortSelections.get(opp.id);
		const comfortBranch = comfortSelection ? branchMap.get(comfortSelection.branch_id) : undefined;

		const costTime = actualBranch ? actualBranch.cost_time : 0;
		const costMoney = actualBranch ? actualBranch.cost_money : 0;

		return {
			opportunity: opp,
			actualBranch,
			bestBranch,
			bestReflection: bestSelection?.reflection,
			comfortBranch,
			comfortReflection: comfortSelection?.reflection,
			remainingTime: opp.time_minutes - costTime,
			remainingMoney: opp.money_amount - costMoney
		};
	});

	const hasUnchosenOpps = comparisons.some((c) => !c.actualBranch);

	return {
		date,
		comparisons,
		aiPaths: dayData.aiPaths,
		hasUnchosenOpps,
		totalOpportunities: dayData.opportunities.length
	};
};

export const actions: Actions = {
	deleteOpportunity: async ({ request, platform, locals }) => {
		if (!locals.user) return fail(401, { message: 'Vui lòng đăng nhập' });
		if (!platform?.env?.DB) return fail(500, { message: 'Database not available' });

		const formData = await request.formData();
		const id = String(formData.get('id') || '');
		if (!id) return fail(400, { message: 'ID cơ hội không được trống' });

		await deleteOpportunity(platform.env.DB, id, locals.user.id);
		return { success: true };
	},

	clearDay: async ({ params, platform, locals }) => {
		if (!locals.user) return fail(401, { message: 'Vui lòng đăng nhập' });
		if (!platform?.env?.DB) return fail(500, { message: 'Database not available' });
		await clearDay(platform.env.DB, params.date, locals.user.id);
		return { success: true };
	}
};
