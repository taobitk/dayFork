import type {
	Opportunity,
	Branch,
	AiPath,
	PeriodStats,
	DailySummaryItem,
	DivergentOpportunity
} from '#lib/types';

export function computePeriodStats(
	opportunities: Opportunity[],
	branches: Branch[],
	aiPaths: AiPath[],
	startDate: string,
	endDate: string
): PeriodStats {
	const oppsById = new Map<string, Opportunity>();
	for (const o of opportunities) {
		oppsById.set(o.id, o);
	}

	const branchesByOppId = new Map<string, Branch[]>();
	for (const b of branches) {
		const list = branchesByOppId.get(b.opportunity_id) || [];
		list.push(b);
		branchesByOppId.set(b.opportunity_id, list);
	}

	const bestSelectionsByDateAndOpp = new Map<string, string>(); // date:oppId -> branchId
	const comfortSelectionsByDateAndOpp = new Map<string, string>();

	for (const p of aiPaths) {
		for (const sel of p.branch_selections) {
			const key = `${p.date}:${sel.opportunity_id}`;
			if (p.perspective === 'best') {
				bestSelectionsByDateAndOpp.set(key, sel.branch_id);
			} else if (p.perspective === 'comfort') {
				comfortSelectionsByDateAndOpp.set(key, sel.branch_id);
			}
		}
	}

	let totalTimeAvailable = 0;
	let totalTimeSpent = 0;
	let totalMoneyAvailable = 0;
	let totalMoneySpent = 0;
	let totalChosenCount = 0;
	let bestMatchCount = 0;
	let comfortMatchCount = 0;
	const divergentOpportunities: DivergentOpportunity[] = [];

	const dailyMap = new Map<
		string,
		{ oppCount: number; chosenCount: number; bestMatches: number; comfortMatches: number }
	>();

	for (const opp of opportunities) {
		totalTimeAvailable += opp.time_minutes;
		totalMoneyAvailable += opp.money_amount;

		const dayEntry = dailyMap.get(opp.date) || {
			oppCount: 0,
			chosenCount: 0,
			bestMatches: 0,
			comfortMatches: 0
		};
		dayEntry.oppCount += 1;

		const oppBranches = branchesByOppId.get(opp.id) || [];
		const actualBranch = oppBranches.find((b) => b.is_chosen === 1);

		if (actualBranch) {
			totalChosenCount += 1;
			dayEntry.chosenCount += 1;
			totalTimeSpent += actualBranch.cost_time;
			totalMoneySpent += actualBranch.cost_money;

			const bestBranchId = bestSelectionsByDateAndOpp.get(`${opp.date}:${opp.id}`);
			const comfortBranchId = comfortSelectionsByDateAndOpp.get(`${opp.date}:${opp.id}`);

			const matchesBest = bestBranchId !== undefined && actualBranch.id === bestBranchId;
			const matchesComfort =
				comfortBranchId !== undefined && actualBranch.id === comfortBranchId;

			if (matchesBest) {
				bestMatchCount += 1;
				dayEntry.bestMatches += 1;
			}
			if (matchesComfort) {
				comfortMatchCount += 1;
				dayEntry.comfortMatches += 1;
			}

			// Divergent: AI had proposals for both perspectives, and user picked neither
			if (
				bestBranchId &&
				comfortBranchId &&
				!matchesBest &&
				!matchesComfort
			) {
				const branchMap = new Map(oppBranches.map((b) => [b.id, b.name]));
				divergentOpportunities.push({
					date: opp.date,
					opportunityTitle: opp.title,
					actualBranchName: actualBranch.name,
					bestBranchName: branchMap.get(bestBranchId) || 'Không xác định',
					comfortBranchName: branchMap.get(comfortBranchId) || 'Không xác định'
				});
			}
		}

		dailyMap.set(opp.date, dayEntry);
	}

	// Calculate match rates against chosen opportunities
	const bestMatchRate =
		totalChosenCount > 0 ? Math.round((bestMatchCount / totalChosenCount) * 100) : 0;
	const comfortMatchRate =
		totalChosenCount > 0 ? Math.round((comfortMatchCount / totalChosenCount) * 100) : 0;

	// Build daily breakdown
	const dailyBreakdown: DailySummaryItem[] = [];
	for (const [d, entry] of dailyMap.entries()) {
		dailyBreakdown.push({
			date: d,
			opportunityCount: entry.oppCount,
			chosenCount: entry.chosenCount,
			bestMatchCount: entry.bestMatches,
			comfortMatchCount: entry.comfortMatches
		});
	}
	dailyBreakdown.sort((a, b) => a.date.localeCompare(b.date));

	const totalDays = dailyBreakdown.length;

	return {
		startDate,
		endDate,
		totalDays,
		totalOpportunities: opportunities.length,
		totalBranches: branches.length,
		totalChosenCount,
		totalTimeAvailable,
		totalTimeSpent,
		totalMoneyAvailable,
		totalMoneySpent,
		bestMatchCount,
		bestMatchRate,
		comfortMatchCount,
		comfortMatchRate,
		divergentOpportunities,
		dailyBreakdown
	};
}
