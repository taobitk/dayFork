import { describe, it, expect } from 'vitest';
import { computePeriodStats } from './stats';
import type { Opportunity, Branch, AiPath } from '#lib/types';

describe('Period Statistics Engine', () => {
	const opps: Opportunity[] = [
		{
			id: 'opp-1',
			date: '2026-11-04',
			title: '2 tiếng rảnh',
			time_minutes: 120,
			money_amount: 50000,
			created_at: 1000
		},
		{
			id: 'opp-2',
			date: '2026-11-04',
			title: 'Tối',
			time_minutes: 60,
			money_amount: 0,
			created_at: 2000
		}
	];

	const branches: Branch[] = [
		// opp-1 branches: user chose b-1a ("Đi bộ")
		{
			id: 'b-1a',
			opportunity_id: 'opp-1',
			name: 'Đi bộ',
			cost_time: 45,
			cost_money: 0,
			outcome: 'Khỏe',
			is_chosen: 1,
			created_at: 100
		},
		{
			id: 'b-1b',
			opportunity_id: 'opp-1',
			name: 'Chơi game',
			cost_time: 120,
			cost_money: 0,
			outcome: 'Vui',
			is_chosen: 0,
			created_at: 101
		},
		// opp-2 branches: user chose b-2b ("Xem phim")
		{
			id: 'b-2a',
			opportunity_id: 'opp-2',
			name: 'Học bài',
			cost_time: 60,
			cost_money: 0,
			outcome: 'Tiến bộ',
			is_chosen: 0,
			created_at: 200
		},
		{
			id: 'b-2b',
			opportunity_id: 'opp-2',
			name: 'Xem phim',
			cost_time: 60,
			cost_money: 0,
			outcome: 'Thư giãn',
			is_chosen: 1,
			created_at: 201
		}
	];

	const aiPaths: AiPath[] = [
		// 'best': selects b-1a (matches user!), selects b-2a (differs from user)
		{
			id: 'path-best',
			date: '2026-11-04',
			perspective: 'best',
			branch_selections: [
				{ opportunity_id: 'opp-1', branch_id: 'b-1a', reflection: 'Tốt' },
				{ opportunity_id: 'opp-2', branch_id: 'b-2a', reflection: 'Học hỏi' }
			],
			summary: 'Ngày kỷ luật',
			created_at: 300
		},
		// 'comfort': selects b-1b (differs from user), selects b-2b (matches user!)
		{
			id: 'path-comfort',
			date: '2026-11-04',
			perspective: 'comfort',
			branch_selections: [
				{ opportunity_id: 'opp-1', branch_id: 'b-1b', reflection: 'Thư thả' },
				{ opportunity_id: 'opp-2', branch_id: 'b-2b', reflection: 'Nghỉ ngơi' }
			],
			summary: 'Ngày chill',
			created_at: 301
		}
	];

	it('computes resource aggregates correctly', () => {
		const stats = computePeriodStats(opps, branches, aiPaths, '2026-11-04', '2026-11-04');
		expect(stats.totalOpportunities).toBe(2);
		expect(stats.totalBranches).toBe(4);
		expect(stats.totalChosenCount).toBe(2);
		expect(stats.totalTimeAvailable).toBe(180);
		expect(stats.totalTimeSpent).toBe(105); // 45 + 60
		expect(stats.totalMoneyAvailable).toBe(50000);
		expect(stats.totalMoneySpent).toBe(0);
	});

	it('computes match rates with best and comfort perspectives', () => {
		const stats = computePeriodStats(opps, branches, aiPaths, '2026-11-04', '2026-11-04');
		// opp-1 matches best (1/2 = 50%)
		expect(stats.bestMatchCount).toBe(1);
		expect(stats.bestMatchRate).toBe(50);

		// opp-2 matches comfort (1/2 = 50%)
		expect(stats.comfortMatchCount).toBe(1);
		expect(stats.comfortMatchRate).toBe(50);
	});

	it('identifies divergent opportunities where user picked neither AI path', () => {
		// Create a 3rd opportunity where user picks branch 'c', best picks 'a', comfort picks 'b'
		const opp3: Opportunity = {
			id: 'opp-3',
			date: '2026-11-04',
			title: 'Ăn tối',
			time_minutes: 60,
			money_amount: 100000,
			created_at: 3000
		};
		const branch3a: Branch = {
			id: 'b-3a',
			opportunity_id: 'opp-3',
			name: 'Tự nấu',
			cost_time: 45,
			cost_money: 30000,
			outcome: 'Healthy',
			is_chosen: 0,
			created_at: 400
		};
		const branch3b: Branch = {
			id: 'b-3b',
			opportunity_id: 'opp-3',
			name: 'Ăn buffet',
			cost_time: 60,
			cost_money: 100000,
			outcome: 'No nê',
			is_chosen: 0,
			created_at: 401
		};
		const branch3c: Branch = {
			id: 'b-3c',
			opportunity_id: 'opp-3',
			name: 'Uống trà sữa trừ bữa',
			cost_time: 20,
			cost_money: 40000,
			outcome: 'Lạ miệng',
			is_chosen: 1, // Chosen by user
			created_at: 402
		};

		const extendedAiPaths: AiPath[] = [
			{
				...aiPaths[0],
				branch_selections: [
					...aiPaths[0].branch_selections,
					{ opportunity_id: 'opp-3', branch_id: 'b-3a', reflection: 'Tiết kiệm' }
				]
			},
			{
				...aiPaths[1],
				branch_selections: [
					...aiPaths[1].branch_selections,
					{ opportunity_id: 'opp-3', branch_id: 'b-3b', reflection: 'Ngon' }
				]
			}
		];

		const stats = computePeriodStats(
			[...opps, opp3],
			[...branches, branch3a, branch3b, branch3c],
			extendedAiPaths,
			'2026-11-04',
			'2026-11-04'
		);

		expect(stats.divergentOpportunities.length).toBe(1);
		expect(stats.divergentOpportunities[0].opportunityTitle).toBe('Ăn tối');
		expect(stats.divergentOpportunities[0].actualBranchName).toBe('Uống trà sữa trừ bữa');
		expect(stats.divergentOpportunities[0].bestBranchName).toBe('Tự nấu');
		expect(stats.divergentOpportunities[0].comfortBranchName).toBe('Ăn buffet');
	});
});
