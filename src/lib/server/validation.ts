import * as v from 'valibot';

export const CreateOpportunitySchema = v.object({
	date: v.pipe(
		v.string(),
		v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải theo định dạng YYYY-MM-DD')
	),
	title: v.pipe(
		v.string(),
		v.minLength(1, 'Tên cơ hội không được để trống'),
		v.maxLength(120, 'Tên cơ hội tối đa 120 ký tự')
	),
	time_minutes: v.pipe(
		v.number(),
		v.minValue(0, 'Thời gian không được âm')
	),
	money_amount: v.pipe(
		v.number(),
		v.minValue(0, 'Tiền không được âm')
	),
	other_text: v.optional(
		v.pipe(v.string(), v.maxLength(300, 'Ghi chú khác tối đa 300 ký tự')),
		''
	)
});

export const CreateBranchSchema = v.object({
	opportunity_id: v.pipe(
		v.string(),
		v.minLength(1, 'ID cơ hội không hợp lệ')
	),
	name: v.pipe(
		v.string(),
		v.minLength(1, 'Tên nhánh không được để trống'),
		v.maxLength(150, 'Tên nhánh tối đa 150 ký tự')
	),
	cost_time: v.pipe(
		v.number(),
		v.minValue(0, 'Thời gian tiêu hao không được âm')
	),
	cost_money: v.pipe(
		v.number(),
		v.minValue(0, 'Tiền tiêu hao không được âm')
	),
	outcome: v.pipe(
		v.string(),
		v.maxLength(300, 'Kết quả nhận lại tối đa 300 ký tự')
	)
});

export const UpdateOpportunitySchema = v.object({
	id: v.pipe(v.string(), v.minLength(1, 'ID cơ hội không hợp lệ')),
	title: v.pipe(
		v.string(),
		v.minLength(1, 'Tên cơ hội không được để trống'),
		v.maxLength(120, 'Tên cơ hội tối đa 120 ký tự')
	),
	time_minutes: v.pipe(
		v.number(),
		v.minValue(0, 'Thời gian không được âm')
	),
	money_amount: v.pipe(
		v.number(),
		v.minValue(0, 'Tiền không được âm')
	),
	other_text: v.optional(
		v.pipe(v.string(), v.maxLength(300, 'Ghi chú khác tối đa 300 ký tự')),
		''
	)
});

export const UpdateBranchSchema = v.object({
	id: v.pipe(v.string(), v.minLength(1, 'ID nhánh không hợp lệ')),
	name: v.pipe(
		v.string(),
		v.minLength(1, 'Tên nhánh không được để trống'),
		v.maxLength(150, 'Tên nhánh tối đa 150 ký tự')
	),
	cost_time: v.pipe(
		v.number(),
		v.minValue(0, 'Thời gian tiêu hao không được âm')
	),
	cost_money: v.pipe(
		v.number(),
		v.minValue(0, 'Tiền tiêu hao không được âm')
	),
	outcome: v.pipe(
		v.string(),
		v.maxLength(300, 'Kết quả nhận lại tối đa 300 ký tự')
	)
});

export const ChooseBranchSchema = v.object({
	opportunity_id: v.pipe(v.string(), v.minLength(1)),
	branch_id: v.pipe(v.string(), v.minLength(1))
});

/**
 * Validates AI response strictly against available opportunity and branch IDs.
 * Returns only valid selections where branch_id belongs to the opportunity_id.
 */
export function sanitizeAiSelections(
	rawSelections: unknown,
	validBranchIdsByOpp: Map<string, Set<string>>
): Array<{ opportunity_id: string; branch_id: string; reflection: string }> {
	if (!Array.isArray(rawSelections)) return [];

	const result: Array<{ opportunity_id: string; branch_id: string; reflection: string }> = [];
	const seenOpps = new Set<string>();

	for (const item of rawSelections) {
		if (
			typeof item === 'object' &&
			item !== null &&
			'opportunity_id' in item &&
			'branch_id' in item
		) {
			const oppId = String((item as { opportunity_id: unknown }).opportunity_id);
			const branchId = String((item as { branch_id: unknown }).branch_id);
			const reflection =
				typeof (item as { reflection?: unknown }).reflection === 'string'
					? String((item as { reflection?: unknown }).reflection).slice(0, 300)
					: '';

			const allowedBranches = validBranchIdsByOpp.get(oppId);
			if (allowedBranches && allowedBranches.has(branchId) && !seenOpps.has(oppId)) {
				result.push({
					opportunity_id: oppId,
					branch_id: branchId,
					reflection: reflection || 'Nếu chọn thì hôm đó tôi sẽ tận hưởng hướng đi này.'
				});
				seenOpps.add(oppId);
			}
		}
	}

	return result;
}

