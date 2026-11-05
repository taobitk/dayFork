import { describe, it, expect, vi } from 'vitest';
import { updateOpportunity, updateBranch } from './index';

describe('DB Update Operations & Ownership Verification', () => {
	it('updates opportunity when owned by the user and invalidates ai_paths', async () => {
		const mockFirst = vi.fn().mockResolvedValue({ date: '2026-11-05', created_at: 1000 });
		const mockRun = vi.fn().mockResolvedValue({ success: true });
		const mockBind = vi.fn().mockReturnValue({ first: mockFirst, run: mockRun });
		const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
		const mockDb = { prepare: mockPrepare } as unknown as D1Database;

		const result = await updateOpportunity(
			mockDb,
			{
				id: 'opp-1',
				title: 'Cơ hội đã sửa',
				time_minutes: 90,
				money_amount: 100000,
				other_text: 'Ghi chú mới'
			},
			'user-123'
		);

		expect(result.id).toBe('opp-1');
		expect(result.title).toBe('Cơ hội đã sửa');
		expect(result.time_minutes).toBe(90);
		expect(result.money_amount).toBe(100000);
		expect(result.other_text).toBe('Ghi chú mới');
		expect(mockPrepare).toHaveBeenCalledWith(
			'UPDATE opportunities SET title = ?, time_minutes = ?, money_amount = ?, other_text = ? WHERE id = ? AND user_id = ?'
		);
		expect(mockPrepare).toHaveBeenCalledWith(
			'DELETE FROM ai_paths WHERE date = ? AND user_id = ?'
		);
	});

	it('throws error when user does not own the opportunity', async () => {
		const mockFirst = vi.fn().mockResolvedValue(null);
		const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
		const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
		const mockDb = { prepare: mockPrepare } as unknown as D1Database;

		await expect(
			updateOpportunity(
				mockDb,
				{
					id: 'opp-foreign',
					title: 'Hack',
					time_minutes: 10,
					money_amount: 0
				},
				'user-123'
			)
		).rejects.toThrow('Cơ hội không tồn tại hoặc bạn không có quyền thao tác');
	});

	it('updates branch when user owns the parent opportunity', async () => {
		const mockFirst = vi.fn().mockResolvedValue({
			id: 'b-1',
			opportunity_id: 'opp-1',
			is_chosen: 1,
			created_at: 2000,
			date: '2026-11-05'
		});
		const mockRun = vi.fn().mockResolvedValue({ success: true });
		const mockBind = vi.fn().mockReturnValue({ first: mockFirst, run: mockRun });
		const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
		const mockDb = { prepare: mockPrepare } as unknown as D1Database;

		const result = await updateBranch(
			mockDb,
			{
				id: 'b-1',
				name: 'Nhánh đã cập nhật',
				cost_time: 45,
				cost_money: 20000,
				outcome: 'Thấy vui hơn'
			},
			'user-123'
		);

		expect(result.name).toBe('Nhánh đã cập nhật');
		expect(result.cost_time).toBe(45);
		expect(result.cost_money).toBe(20000);
		expect(result.outcome).toBe('Thấy vui hơn');
		expect(mockPrepare).toHaveBeenCalledWith(
			'UPDATE branches SET name = ?, cost_time = ?, cost_money = ?, outcome = ? WHERE id = ?'
		);
		expect(mockPrepare).toHaveBeenCalledWith(
			'DELETE FROM ai_paths WHERE date = ? AND user_id = ?'
		);
	});

	it('throws error when user does not own the branch', async () => {
		const mockFirst = vi.fn().mockResolvedValue(null);
		const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
		const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
		const mockDb = { prepare: mockPrepare } as unknown as D1Database;

		await expect(
			updateBranch(
				mockDb,
				{
					id: 'b-foreign',
					name: 'Hack branch',
					cost_time: 0,
					cost_money: 0,
					outcome: ''
				},
				'user-123'
			)
		).rejects.toThrow('Nhánh rẽ không tồn tại hoặc bạn không có quyền thao tác');
	});
});
