import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { isValidISODate, getTodayISO } from '#lib/date';
import { getDayData } from '#lib/server/db';
import type { OpportunityComparison } from '#lib/types';

export const load: PageServerLoad = async ({ params, platform }) => {
	const { date } = params;
	if (!isValidISODate(date)) {
		throw redirect(307, `/day/${getTodayISO()}/review`);
	}

	if (!platform?.env?.DB) {
		throw error(500, 'Database binding "DB" is not available.');
	}

	const dayData = await getDayData(platform.env.DB, date);
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
