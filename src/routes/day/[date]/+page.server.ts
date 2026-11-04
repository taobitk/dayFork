import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { isValidISODate, getTodayISO } from '#lib/date';
import {
	getDayData,
	createOpportunity,
	deleteOpportunity,
	createBranch,
	deleteBranch,
	chooseBranch
} from '#lib/server/db';
import {
	CreateOpportunitySchema,
	CreateBranchSchema,
	ChooseBranchSchema
} from '#lib/server/validation';
import * as v from 'valibot';

export const load: PageServerLoad = async ({ params, platform }) => {
	const { date } = params;
	if (!isValidISODate(date)) {
		throw redirect(307, `/day/${getTodayISO()}`);
	}

	if (!platform?.env?.DB) {
		throw error(500, 'Cloudflare D1 Database binding "DB" is not available.');
	}

	const dayData = await getDayData(platform.env.DB, date);
	return {
		dayData
	};
};

export const actions: Actions = {
	addOpportunity: async ({ request, params, platform }) => {
		if (!platform?.env?.DB) return fail(500, { message: 'Database not available' });

		const formData = await request.formData();
		const title = String(formData.get('title') || '').trim();
		const time_minutes = Number(formData.get('time_minutes') || 0);
		const money_amount = Number(formData.get('money_amount') || 0);
		const other_text = String(formData.get('other_text') || '').trim();

		const parsed = v.safeParse(CreateOpportunitySchema, {
			date: params.date,
			title,
			time_minutes,
			money_amount,
			other_text
		});

		if (!parsed.success) {
			const errorMsg = parsed.issues[0]?.message || 'Dữ liệu không hợp lệ';
			return fail(400, { message: errorMsg, formType: 'addOpportunity' });
		}

		await createOpportunity(platform.env.DB, parsed.output);
		return { success: true };
	},

	deleteOpportunity: async ({ request, platform }) => {
		if (!platform?.env?.DB) return fail(500, { message: 'Database not available' });

		const formData = await request.formData();
		const id = String(formData.get('id') || '');
		if (!id) return fail(400, { message: 'ID cơ hội không được trống' });

		await deleteOpportunity(platform.env.DB, id);
		return { success: true };
	},

	addBranch: async ({ request, platform }) => {
		if (!platform?.env?.DB) return fail(500, { message: 'Database not available' });

		const formData = await request.formData();
		const opportunity_id = String(formData.get('opportunity_id') || '');
		const name = String(formData.get('name') || '').trim();
		const cost_time = Number(formData.get('cost_time') || 0);
		const cost_money = Number(formData.get('cost_money') || 0);
		const outcome = String(formData.get('outcome') || '').trim();

		const parsed = v.safeParse(CreateBranchSchema, {
			opportunity_id,
			name,
			cost_time,
			cost_money,
			outcome
		});

		if (!parsed.success) {
			const errorMsg = parsed.issues[0]?.message || 'Dữ liệu nhánh không hợp lệ';
			return fail(400, { message: errorMsg, formType: 'addBranch', opportunity_id });
		}

		await createBranch(platform.env.DB, parsed.output);
		return { success: true, addedFor: opportunity_id };
	},

	deleteBranch: async ({ request, platform }) => {
		if (!platform?.env?.DB) return fail(500, { message: 'Database not available' });

		const formData = await request.formData();
		const id = String(formData.get('id') || '');
		if (!id) return fail(400, { message: 'ID nhánh không được trống' });

		await deleteBranch(platform.env.DB, id);
		return { success: true };
	},

	chooseBranch: async ({ request, platform }) => {
		if (!platform?.env?.DB) return fail(500, { message: 'Database not available' });

		const formData = await request.formData();
		const opportunity_id = String(formData.get('opportunity_id') || '');
		const branch_id = String(formData.get('branch_id') || '');

		const parsed = v.safeParse(ChooseBranchSchema, { opportunity_id, branch_id });
		if (!parsed.success) {
			return fail(400, { message: 'Dữ liệu lựa chọn không hợp lệ' });
		}

		await chooseBranch(platform.env.DB, opportunity_id, branch_id);
		return { success: true };
	}
};
