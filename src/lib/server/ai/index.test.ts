import { describe, it, expect } from 'vitest';
import { generateDayPaths } from './index';
import type { DayData } from '#lib/types';

describe('AI Path Generator & Constraints', () => {
	const sampleDayData: DayData = {
		date: '2026-11-04',
		opportunities: [
			{
				id: 'opp-1',
				date: '2026-11-04',
				title: 'Chiều rảnh rỗi',
				time_minutes: 120,
				money_amount: 50000,
				other_text: '',
				created_at: 1000,
				branches: [
					{
						id: 'b-game',
						opportunity_id: 'opp-1',
						name: 'Chơi game',
						cost_time: 120,
						cost_money: 0,
						outcome: 'Vui vẻ',
						is_chosen: 1,
						created_at: 100
					},
					{
						id: 'b-walk',
						opportunity_id: 'opp-1',
						name: 'Đi bộ công viên',
						cost_time: 45,
						cost_money: 0,
						outcome: 'Khỏe khoắn',
						is_chosen: 0,
						created_at: 101
					},
					{
						id: 'b-cafe',
						opportunity_id: 'opp-1',
						name: 'Ngồi cafe đọc sách',
						cost_time: 90,
						cost_money: 45000,
						outcome: 'Tập trung',
						is_chosen: 0,
						created_at: 102
					}
				]
			}
		],
		aiPaths: {}
	};

	it('returns fallback paths deterministically when no API key is provided', async () => {
		const result = await generateDayPaths(sampleDayData, '');
		expect(result.source).toBe('fallback');
		expect(result.paths.length).toBe(2);

		const bestPath = result.paths.find((p) => p.perspective === 'best');
		const comfortPath = result.paths.find((p) => p.perspective === 'comfort');

		expect(bestPath).toBeDefined();
		expect(comfortPath).toBeDefined();

		// Each perspective selects exactly 1 branch for opp-1
		expect(bestPath?.branch_selections.length).toBe(1);
		expect(comfortPath?.branch_selections.length).toBe(1);

		// The selected branch ID must be one of the 3 existing branches
		const validBranchIds = new Set(['b-game', 'b-walk', 'b-cafe']);
		expect(validBranchIds.has(bestPath!.branch_selections[0].branch_id)).toBe(true);
		expect(validBranchIds.has(comfortPath!.branch_selections[0].branch_id)).toBe(true);
	});

	it('handles days with zero opportunities gracefully', async () => {
		const emptyDay: DayData = {
			date: '2026-11-04',
			opportunities: [],
			aiPaths: {}
		};
		const result = await generateDayPaths(emptyDay);
		expect(result.paths.length).toBe(2);
		expect(result.paths[0].branch_selections.length).toBe(0);
	});
});
