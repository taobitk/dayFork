import type {
	Opportunity,
	Branch,
	OpportunityWithBranches,
	AiPath,
	DayData
} from '#lib/types';

function generateId(): string {
	return crypto.randomUUID();
}

export async function getDayData(
	db: D1Database,
	date: string,
	userId: string
): Promise<DayData> {
	const oppsResult = await db
		.prepare(
			'SELECT * FROM opportunities WHERE date = ? AND user_id = ? ORDER BY created_at ASC'
		)
		.bind(date, userId)
		.all<Opportunity>();

	const opps = oppsResult.results || [];
	if (opps.length === 0) {
		return {
			date,
			opportunities: [],
			aiPaths: {}
		};
	}

	const oppIds = opps.map((o) => o.id);
	// Fetch all branches for these opportunities
	const placeholders = oppIds.map(() => '?').join(',');
	const branchesResult = await db
		.prepare(
			`SELECT * FROM branches WHERE opportunity_id IN (${placeholders}) ORDER BY created_at ASC`
		)
		.bind(...oppIds)
		.all<Branch>();

	const branches = branchesResult.results || [];
	const branchesByOppId = new Map<string, Branch[]>();
	for (const b of branches) {
		const list = branchesByOppId.get(b.opportunity_id) || [];
		list.push(b);
		branchesByOppId.set(b.opportunity_id, list);
	}

	const opportunitiesWithBranches: OpportunityWithBranches[] = opps.map((o) => ({
		...o,
		other_text: o.other_text || '',
		branches: branchesByOppId.get(o.id) || []
	}));

	// Fetch cached AI paths for this user and date
	const aiPathsResult = await db
		.prepare('SELECT * FROM ai_paths WHERE date = ? AND user_id = ?')
		.bind(date, userId)
		.all<{
			id: string;
			user_id: string;
			date: string;
			perspective: 'best' | 'comfort';
			branch_selections: string;
			summary: string;
			created_at: number;
		}>();

	const aiPathsMap: { best?: AiPath; comfort?: AiPath } = {};
	for (const row of aiPathsResult.results || []) {
		try {
			aiPathsMap[row.perspective] = {
				id: row.id,
				user_id: row.user_id,
				date: row.date,
				perspective: row.perspective,
				branch_selections: JSON.parse(row.branch_selections),
				summary: row.summary,
				created_at: row.created_at
			};
		} catch {
			// ignore malformed JSON cache
		}
	}

	return {
		date,
		opportunities: opportunitiesWithBranches,
		aiPaths: aiPathsMap
	};
}

export async function createOpportunity(
	db: D1Database,
	input: {
		date: string;
		title: string;
		time_minutes: number;
		money_amount: number;
		other_text?: string;
	},
	userId: string
): Promise<Opportunity> {
	const id = generateId();
	const created_at = Date.now();
	const other_text = (input.other_text || '').trim();
	await db
		.prepare(
			'INSERT INTO opportunities (id, user_id, date, title, time_minutes, money_amount, other_text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
		)
		.bind(
			id,
			userId,
			input.date,
			input.title.trim(),
			input.time_minutes,
			input.money_amount,
			other_text,
			created_at
		)
		.run();

	// Invalidate AI paths for this user and date
	await db
		.prepare('DELETE FROM ai_paths WHERE date = ? AND user_id = ?')
		.bind(input.date, userId)
		.run();

	return {
		id,
		user_id: userId,
		date: input.date,
		title: input.title.trim(),
		time_minutes: input.time_minutes,
		money_amount: input.money_amount,
		other_text,
		created_at
	};
}

export async function updateOpportunity(
	db: D1Database,
	input: {
		id: string;
		title: string;
		time_minutes: number;
		money_amount: number;
		other_text?: string;
	},
	userId: string
): Promise<Opportunity> {
	const opp = await db
		.prepare('SELECT date, created_at FROM opportunities WHERE id = ? AND user_id = ?')
		.bind(input.id, userId)
		.first<{ date: string; created_at: number }>();

	if (!opp) {
		throw new Error('Cơ hội không tồn tại hoặc bạn không có quyền thao tác');
	}

	const other_text = (input.other_text || '').trim();
	await db
		.prepare(
			'UPDATE opportunities SET title = ?, time_minutes = ?, money_amount = ?, other_text = ? WHERE id = ? AND user_id = ?'
		)
		.bind(
			input.title.trim(),
			input.time_minutes,
			input.money_amount,
			other_text,
			input.id,
			userId
		)
		.run();

	// Invalidate AI paths for this user and date
	await db
		.prepare('DELETE FROM ai_paths WHERE date = ? AND user_id = ?')
		.bind(opp.date, userId)
		.run();

	return {
		id: input.id,
		user_id: userId,
		date: opp.date,
		title: input.title.trim(),
		time_minutes: input.time_minutes,
		money_amount: input.money_amount,
		other_text,
		created_at: opp.created_at
	};
}

export async function deleteOpportunity(
	db: D1Database,
	id: string,
	userId: string
): Promise<void> {
	const opp = await db
		.prepare('SELECT date FROM opportunities WHERE id = ? AND user_id = ?')
		.bind(id, userId)
		.first<{ date: string }>();

	if (opp) {
		await db.batch([
			db.prepare('DELETE FROM opportunities WHERE id = ? AND user_id = ?').bind(id, userId),
			db.prepare('DELETE FROM branches WHERE opportunity_id = ?').bind(id),
			db
				.prepare('DELETE FROM ai_paths WHERE date = ? AND user_id = ?')
				.bind(opp.date, userId)
		]);
	}
}

export async function clearDay(
	db: D1Database,
	date: string,
	userId: string
): Promise<void> {
	await db.batch([
		db
			.prepare(
				'DELETE FROM branches WHERE opportunity_id IN (SELECT id FROM opportunities WHERE date = ? AND user_id = ?)'
			)
			.bind(date, userId),
		db
			.prepare('DELETE FROM opportunities WHERE date = ? AND user_id = ?')
			.bind(date, userId),
		db
			.prepare('DELETE FROM ai_paths WHERE date = ? AND user_id = ?')
			.bind(date, userId)
	]);
}

export async function createBranch(
	db: D1Database,
	input: {
		opportunity_id: string;
		name: string;
		cost_time: number;
		cost_money: number;
		outcome: string;
	},
	userId: string
): Promise<Branch> {
	// Verify user owns the opportunity
	const opp = await db
		.prepare('SELECT date FROM opportunities WHERE id = ? AND user_id = ?')
		.bind(input.opportunity_id, userId)
		.first<{ date: string }>();

	if (!opp) {
		throw new Error('Cơ hội không tồn tại hoặc bạn không có quyền thao tác');
	}

	const id = generateId();
	const created_at = Date.now();

	await db
		.prepare(
			'INSERT INTO branches (id, opportunity_id, name, cost_time, cost_money, outcome, is_chosen, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)'
		)
		.bind(
			id,
			input.opportunity_id,
			input.name.trim(),
			input.cost_time,
			input.cost_money,
			input.outcome.trim(),
			created_at
		)
		.run();

	// Invalidate AI path
	await db
		.prepare('DELETE FROM ai_paths WHERE date = ? AND user_id = ?')
		.bind(opp.date, userId)
		.run();

	return {
		id,
		opportunity_id: input.opportunity_id,
		name: input.name.trim(),
		cost_time: input.cost_time,
		cost_money: input.cost_money,
		outcome: input.outcome.trim(),
		is_chosen: 0,
		created_at
	};
}

export async function updateBranch(
	db: D1Database,
	input: {
		id: string;
		name: string;
		cost_time: number;
		cost_money: number;
		outcome: string;
	},
	userId: string
): Promise<Branch> {
	const branch = await db
		.prepare(
			`SELECT b.id, b.opportunity_id, b.is_chosen, b.created_at, o.date 
			 FROM branches b 
			 JOIN opportunities o ON b.opportunity_id = o.id 
			 WHERE b.id = ? AND o.user_id = ?`
		)
		.bind(input.id, userId)
		.first<{
			id: string;
			opportunity_id: string;
			is_chosen: number;
			created_at: number;
			date: string;
		}>();

	if (!branch) {
		throw new Error('Nhánh rẽ không tồn tại hoặc bạn không có quyền thao tác');
	}

	await db
		.prepare(
			'UPDATE branches SET name = ?, cost_time = ?, cost_money = ?, outcome = ? WHERE id = ?'
		)
		.bind(
			input.name.trim(),
			input.cost_time,
			input.cost_money,
			input.outcome.trim(),
			input.id
		)
		.run();

	// Invalidate AI paths for this user and date
	await db
		.prepare('DELETE FROM ai_paths WHERE date = ? AND user_id = ?')
		.bind(branch.date, userId)
		.run();

	return {
		id: input.id,
		opportunity_id: branch.opportunity_id,
		name: input.name.trim(),
		cost_time: input.cost_time,
		cost_money: input.cost_money,
		outcome: input.outcome.trim(),
		is_chosen: branch.is_chosen,
		created_at: branch.created_at
	};
}

export async function deleteBranch(
	db: D1Database,
	id: string,
	userId: string
): Promise<void> {
	const branch = await db
		.prepare(
			`SELECT b.opportunity_id, o.date 
			 FROM branches b 
			 JOIN opportunities o ON b.opportunity_id = o.id 
			 WHERE b.id = ? AND o.user_id = ?`
		)
		.bind(id, userId)
		.first<{ opportunity_id: string; date: string }>();

	if (branch) {
		await db.batch([
			db.prepare('DELETE FROM branches WHERE id = ?').bind(id),
			db
				.prepare('DELETE FROM ai_paths WHERE date = ? AND user_id = ?')
				.bind(branch.date, userId)
		]);
	}
}

export async function chooseBranch(
	db: D1Database,
	opportunity_id: string,
	branch_id: string,
	userId: string
): Promise<void> {
	// Verify user owns the opportunity
	const opp = await db
		.prepare('SELECT id FROM opportunities WHERE id = ? AND user_id = ?')
		.bind(opportunity_id, userId)
		.first<{ id: string }>();

	if (!opp) {
		throw new Error('Cơ hội không tồn tại hoặc bạn không có quyền thao tác');
	}

	await db.batch([
		db
			.prepare('UPDATE branches SET is_chosen = 0 WHERE opportunity_id = ?')
			.bind(opportunity_id),
		db
			.prepare('UPDATE branches SET is_chosen = 1 WHERE id = ? AND opportunity_id = ?')
			.bind(branch_id, opportunity_id)
	]);
}

export async function saveAiPaths(
	db: D1Database,
	date: string,
	paths: Array<{
		perspective: 'best' | 'comfort';
		branch_selections: Array<{ opportunity_id: string; branch_id: string; reflection: string }>;
		summary: string;
	}>,
	userId: string
): Promise<void> {
	const statements = paths.map((p) => {
		const id = generateId();
		const now = Date.now();
		return db
			.prepare(
				`INSERT INTO ai_paths (id, user_id, date, perspective, branch_selections, summary, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?)
				 ON CONFLICT(user_id, date, perspective) DO UPDATE SET
				 branch_selections = excluded.branch_selections,
				 summary = excluded.summary,
				 created_at = excluded.created_at`
			)
			.bind(
				id,
				userId,
				date,
				p.perspective,
				JSON.stringify(p.branch_selections),
				p.summary,
				now
			);
	});

	if (statements.length > 0) {
		await db.batch(statements);
	}
}

export async function getRangeData(
	db: D1Database,
	startDate: string,
	endDate: string,
	userId: string
): Promise<{
	opportunities: Opportunity[];
	branches: Branch[];
	aiPaths: AiPath[];
}> {
	const opps = await db
		.prepare(
			'SELECT * FROM opportunities WHERE date >= ? AND date <= ? AND user_id = ? ORDER BY date ASC, created_at ASC'
		)
		.bind(startDate, endDate, userId)
		.all<Opportunity>();

	const oppList = (opps.results || []).map((o) => ({
		...o,
		other_text: o.other_text || ''
	}));
	if (oppList.length === 0) {
		return { opportunities: [], branches: [], aiPaths: [] };
	}

	const oppIds = oppList.map((o) => o.id);
	const placeholders = oppIds.map(() => '?').join(',');
	const branches = await db
		.prepare(
			`SELECT * FROM branches WHERE opportunity_id IN (${placeholders}) ORDER BY created_at ASC`
		)
		.bind(...oppIds)
		.all<Branch>();

	const aiPaths = await db
		.prepare(
			'SELECT * FROM ai_paths WHERE date >= ? AND date <= ? AND user_id = ?'
		)
		.bind(startDate, endDate, userId)
		.all<{
			id: string;
			user_id: string;
			date: string;
			perspective: 'best' | 'comfort';
			branch_selections: string;
			summary: string;
			created_at: number;
		}>();

	const parsedAiPaths: AiPath[] = (aiPaths.results || []).map((row) => ({
		id: row.id,
		user_id: row.user_id,
		date: row.date,
		perspective: row.perspective,
		branch_selections: JSON.parse(row.branch_selections || '[]'),
		summary: row.summary,
		created_at: row.created_at
	}));

	return {
		opportunities: oppList,
		branches: branches.results || [],
		aiPaths: parsedAiPaths
	};
}
