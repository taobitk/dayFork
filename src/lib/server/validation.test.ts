import { describe, it, expect } from 'vitest';
import * as v from 'valibot';
import {
	CreateOpportunitySchema,
	CreateBranchSchema,
	ChooseBranchSchema,
	sanitizeAiSelections
} from './validation';

describe('Validation Layer', () => {
	it('validates opportunity creation inputs', () => {
		const valid = v.safeParse(CreateOpportunitySchema, {
			date: '2026-11-04',
			title: '2 tiếng buổi chiều',
			time_minutes: 120,
			money_amount: 50000
		});
		expect(valid.success).toBe(true);

		const invalidNegative = v.safeParse(CreateOpportunitySchema, {
			date: '2026-11-04',
			title: 'Tối',
			time_minutes: -10,
			money_amount: 0
		});
		expect(invalidNegative.success).toBe(false);
	});

	it('validates branch creation inputs', () => {
		const valid = v.safeParse(CreateBranchSchema, {
			opportunity_id: 'opp-123',
			name: 'Đi bộ công viên',
			cost_time: 45,
			cost_money: 0,
			outcome: 'Thoải mái'
		});
		expect(valid.success).toBe(true);
	});

	it('strictly prevents AI from fabricating non-existent branch IDs or mixing branches', () => {
		const validBranchMap = new Map<string, Set<string>>([
			['opp-1', new Set(['branch-1a', 'branch-1b'])],
			['opp-2', new Set(['branch-2a', 'branch-2b'])]
		]);

		const rawAiOutput = [
			// Valid
			{ opportunity_id: 'opp-1', branch_id: 'branch-1a', reflection: 'Tập trung học' },
			// Invalid branch ID for opp-2 (hallucination)
			{ opportunity_id: 'opp-2', branch_id: 'fake-branch-id', reflection: 'Ảo giác' },
			// Cross-pollination (opp-1 branch passed into opp-2)
			{ opportunity_id: 'opp-2', branch_id: 'branch-1a', reflection: 'Nhầm lẫn' }
		];

		const sanitized = sanitizeAiSelections(rawAiOutput, validBranchMap);
		expect(sanitized.length).toBe(1);
		expect(sanitized[0].opportunity_id).toBe('opp-1');
		expect(sanitized[0].branch_id).toBe('branch-1a');
		expect(sanitized[0].reflection).toBe('Tập trung học');
	});
});

