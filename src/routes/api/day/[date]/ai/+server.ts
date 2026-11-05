import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isValidISODate } from '#lib/date';
import { getDayData, saveAiPaths } from '#lib/server/db';
import { generateDayPaths } from '#lib/server/ai';

export const POST: RequestHandler = async ({ params, platform, locals }) => {
	const { date } = params;
	if (!isValidISODate(date)) {
		throw error(400, 'Định dạng ngày không hợp lệ');
	}

	if (!locals.user) {
		throw error(401, 'Vui lòng đăng nhập để sử dụng tính năng này');
	}

	if (!platform?.env?.DB) {
		throw error(500, 'Database binding "DB" không khả dụng');
	}

	const dayData = await getDayData(platform.env.DB, date, locals.user.id);
	if (dayData.opportunities.length === 0) {
		throw error(400, 'Ngày này chưa có cơ hội nào để phân tích.');
	}

	// Read Groq API key from platform env or process.env (for local dev with .dev.vars)
	const groqApiKey =
		platform.env.GROQ_API ||
		(typeof process !== 'undefined' ? process.env.GROQ_API : undefined);

	const result = await generateDayPaths(dayData, groqApiKey);

	// Persist generated paths to D1 cache
	await saveAiPaths(platform.env.DB, date, result.paths, locals.user.id);

	return json({
		success: true,
		source: result.source,
		paths: result.paths
	});
};
