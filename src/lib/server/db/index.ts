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

export async function getDayData(db: D1Database, date: string): Promise<DayData> {
	const oppsResult = await db
		.prepare('SELECT * FROM opportunities WHERE date = ? ORDER BY created_at ASC')
		.bind(date)
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
		.prepare(`SELECT * FROM branches WHERE opportunity_id IN (${placeholders}) ORDER BY created_at ASC`)
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
		branches: branchesByOppId.get(o.id) || []
	}));

	// Fetch cached AI paths
	const aiPathsResult = await db
		.prepare('SELECT * FROM ai_paths WHERE date = ?')
		.bind(date)
		.all<{
			id: string;
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
	input: { date: string; title: string; time_minutes: number; money_amount: number }
): Promise<Opportunity> {
	const id = generateId();
	const created_at = Date.now();
	await db
		.prepare(
			'INSERT INTO opportunities (id, date, title, time_minutes, money_amount, created_at) VALUES (?, ?, ?, ?, ?, ?)'
		)
		.bind(id, input.date, input.title.trim(), input.time_minutes, input.money_amount, created_at)
		.run();

	// Invalidate AI paths for this date
	await db.prepare('DELETE FROM ai_paths WHERE date = ?').bind(input.date).run();

	return {
		id,
		date: input.date,
		title: input.title.trim(),
		time_minutes: input.time_minutes,
		money_amount: input.money_amount,
		created_at
	};
}

export async function deleteOpportunity(db: D1Database, id: string): Promise<void> {
	// Find date first to invalidate AI path
	const opp = await db
		.prepare('SELECT date FROM opportunities WHERE id = ?')
		.bind(id)
		.first<{ date: string }>();

	if (opp) {
		await db.batch([
			db.prepare('DELETE FROM opportunities WHERE id = ?').bind(id),
			db.prepare('DELETE FROM branches WHERE opportunity_id = ?').bind(id),
			db.prepare('DELETE FROM ai_paths WHERE date = ?').bind(opp.date)
		]);
	}
}

export async function createBranch(
	db: D1Database,
	input: {
		opportunity_id: string;
		name: string;
		cost_time: number;
		cost_money: number;
		outcome: string;
	}
): Promise<Branch> {
	const id = generateId();
	const created_at = Date.now();

	// Check if this is the first branch of the opportunity.
	// We don't auto-choose, let user choose explicitly or default to 0
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

	// Find date to invalidate AI path
	const opp = await db
		.prepare('SELECT date FROM opportunities WHERE id = ?')
		.bind(input.opportunity_id)
		.first<{ date: string }>();
	if (opp) {
		await db.prepare('DELETE FROM ai_paths WHERE date = ?').bind(opp.date).run();
	}

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

export async function deleteBranch(db: D1Database, id: string): Promise<void> {
	const branch = await db
		.prepare(
			'SELECT b.opportunity_id, o.date FROM branches b JOIN opportunities o ON b.opportunity_id = o.id WHERE b.id = ?'
		)
		.bind(id)
		.first<{ opportunity_id: string; date: string }>();

	if (branch) {
		await db.batch([
			db.prepare('DELETE FROM branches WHERE id = ?').bind(id),
			db.prepare('DELETE FROM ai_paths WHERE date = ?').bind(branch.date)
		]);
	}
}

export async function chooseBranch(
	db: D1Database,
	opportunity_id: string,
	branch_id: string
): Promise<void> {
	// Set all branches in this opportunity to is_chosen = 0, then set target branch to 1
	await db.batch([
		db.prepare('UPDATE branches SET is_chosen = 0 WHERE opportunity_id = ?').bind(opportunity_id),
		db.prepare('UPDATE branches SET is_chosen = 1 WHERE id = ? AND opportunity_id = ?').bind(branch_id, opportunity_id)
	]);
}

export async function saveAiPaths(
	db: D1Database,
	date: string,
	paths: Array<{
		perspective: 'best' | 'comfort';
		branch_selections: Array<{ opportunity_id: string; branch_id: string; reflection: string }>;
		summary: string;
	}>
): Promise<void> {
	const statements = paths.map((p) => {
		const id = generateId();
		const now = Date.now();
		return db
			.prepare(
				`INSERT INTO ai_paths (id, date, perspective, branch_selections, summary, created_at)
				 VALUES (?, ?, ?, ?, ?, ?)
				 ON CONFLICT(date, perspective) DO UPDATE SET
				 branch_selections = excluded.branch_selections,
				 summary = excluded.summary,
				 created_at = excluded.created_at`
			)
			.bind(id, date, p.perspective, JSON.stringify(p.branch_selections), p.summary, now);
	});

	if (statements.length > 0) {
		await db.batch(statements);
	}
}

export async function getRangeData(
	db: D1Database,
	startDate: string,
	endDate: string
): Promise<{
	opportunities: Opportunity[];
	branches: Branch[];
	aiPaths: AiPath[];
}> {
	const opps = await db
		.prepare('SELECT * FROM opportunities WHERE date >= ? AND date <= ? ORDER BY date ASC, created_at ASC')
		.bind(startDate, endDate)
		.all<Opportunity>();

	const oppList = opps.results || [];
	if (oppList.length === 0) {
		return { opportunities: [], branches: [], aiPaths: [] };
	}

	const oppIds = oppList.map((o) => o.id);
	const placeholders = oppIds.map(() => '?').join(',');
	const branches = await db
		.prepare(`SELECT * FROM branches WHERE opportunity_id IN (${placeholders}) ORDER BY created_at ASC`)
		.bind(...oppIds)
		.all<Branch>();

	const aiPaths = await db
		.prepare('SELECT * FROM ai_paths WHERE date >= ? AND date <= ?')
		.bind(startDate, endDate)
		.all<{
			id: string;
			date: string;
			perspective: 'best' | 'comfort';
			branch_selections: string;
			summary: string;
			created_at: number;
		}>();

	const parsedAiPaths: AiPath[] = (aiPaths.results || []).map((row) => ({
		id: row.id,
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
