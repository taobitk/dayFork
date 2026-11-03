import type { DayData, Perspective } from '#lib/types';
import { sanitizeAiSelections } from '#lib/server/validation';

export interface GeneratedPathsResult {
	paths: Array<{
		perspective: Perspective;
		branch_selections: Array<{ opportunity_id: string; branch_id: string; reflection: string }>;
		summary: string;
	}>;
	source: 'groq' | 'fallback';
}

/**
 * Heuristic fallback when AI API is unavailable or returns an error.
 * Selects best (lowest money cost) and comfort (lowest time cost) deterministically.
 */
function generateFallbackPaths(dayData: DayData): GeneratedPathsResult['paths'] {
	const bestSelections: Array<{ opportunity_id: string; branch_id: string; reflection: string }> = [];
	const comfortSelections: Array<{ opportunity_id: string; branch_id: string; reflection: string }> = [];

	for (const opp of dayData.opportunities) {
		if (opp.branches.length === 0) continue;

		// Best: prefer branch with lowest money cost and non-zero outcome if possible
		const sortedForBest = [...opp.branches].sort((a, b) => a.cost_money - b.cost_money || a.cost_time - b.cost_time);
		const bestBranch = sortedForBest[0];
		bestSelections.push({
			opportunity_id: opp.id,
			branch_id: bestBranch.id,
			reflection: `Nếu chọn ${bestBranch.name}, bạn sẽ tiết kiệm tài nguyên và giữ được sự tập trung kỷ luật.`
		});

		// Comfort: prefer branch with lowest time cost or most relaxing feel
		const sortedForComfort = [...opp.branches].sort((a, b) => a.cost_time - b.cost_time);
		const comfortBranch = sortedForComfort[0];
		comfortSelections.push({
			opportunity_id: opp.id,
			branch_id: comfortBranch.id,
			reflection: `Nếu chọn ${comfortBranch.name}, bạn sẽ có nhiều khoảng lặng để nạp lại năng lượng và cảm thấy dễ chịu.`
		});
	}

	return [
		{
			perspective: 'best',
			branch_selections: bestSelections,
			summary: 'Hành trình tối ưu kỷ luật, ưu tiên bảo toàn tài nguyên và duy trì sự cân bằng dài hạn.'
		},
		{
			perspective: 'comfort',
			branch_selections: comfortSelections,
			summary: 'Hành trình nhẹ nhàng, lắng nghe cảm xúc để bạn cảm thấy thảnh thơi và thoải mái nhất.'
		}
	];
}

export async function generateDayPaths(
	dayData: DayData,
	groqApiKey?: string
): Promise<GeneratedPathsResult> {
	const oppsWithBranches = dayData.opportunities.filter((o) => o.branches.length > 0);
	if (oppsWithBranches.length === 0) {
		return {
			paths: [
				{ perspective: 'best', branch_selections: [], summary: 'Chưa có cơ hội nào có nhánh.' },
				{ perspective: 'comfort', branch_selections: [], summary: 'Chưa có cơ hội nào có nhánh.' }
			],
			source: 'fallback'
		};
	}

	// Prepare map of valid branches for strict validation
	const validBranchesMap = new Map<string, Set<string>>();
	for (const opp of oppsWithBranches) {
		validBranchesMap.set(opp.id, new Set(opp.branches.map((b) => b.id)));
	}

	// If no API key is provided, return fallback immediately
	if (!groqApiKey || groqApiKey.trim() === '') {
		return {
			paths: generateFallbackPaths(dayData),
			source: 'fallback'
		};
	}

	// Format data for the prompt
	const opportunitiesPrompt = oppsWithBranches
		.map((opp, idx) => {
			const branchesText = opp.branches
				.map(
					(b) =>
						`    - ID: "${b.id}" | Tên: "${b.name}" | Tốn: ${b.cost_time} phút, ${b.cost_money} đ | Nhận lại: "${b.outcome || 'Không ghi'}"`
				)
				.join('\n');
			return `Cơ hội ${idx + 1} (ID: "${opp.id}"): "${opp.title}" (Tài nguyên: ${opp.time_minutes} phút, ${opp.money_amount} đ)\n  Nhánh có thể chọn:\n${branchesText}`;
		})
		.join('\n\n');

	const systemPrompt = `Bạn là cố vấn phản tư DayFork. Nhiệm vụ của bạn là xem xét các cơ hội và các nhánh lựa chọn của người dùng trong một ngày, sau đó dựng nên 2 HÀNH TRÌNH ĐỘC LẬP:
1. "best" (Tối ưu nhất): Chọn nhánh mang lại giá trị tiến bộ, sức khỏe, tri thức hoặc tiết kiệm tài nguyên tốt nhất. Tránh sa đà.
2. "comfort" (Thoải mái nhất): Chọn nhánh đem lại cảm xúc tích cực, giảm căng thẳng và thư giãn nhất.

QUY TẮC BẮT BUỘC:
- CHỈ ĐƯỢC CHỌN ID NHÁNH CÓ SẴN trong từng cơ hội (tuyệt đối không bịa ID hoặc tự đặt nhánh mới).
- Mỗi cơ hội phải chọn đúng 1 nhánh.
- Với mỗi nhánh được chọn, viết câu "reflection" ngắn (1-2 câu, bắt đầu bằng "Nếu chọn thì hôm đó tôi sẽ...").
- Viết 1 câu "summary" đúc kết cho cả ngày với từng góc nhìn.
- Trả về DUY NHẤT một JSON hợp lệ theo cấu trúc:
{
  "best": {
    "branch_selections": [
      { "opportunity_id": "string", "branch_id": "string", "reflection": "string" }
    ],
    "summary": "string"
  },
  "comfort": {
    "branch_selections": [
      { "opportunity_id": "string", "branch_id": "string", "reflection": "string" }
    ],
    "summary": "string"
  }
}`;

	try {
		const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${groqApiKey.trim()}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: 'llama-3.3-70b-versatile',
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: `Dưới đây là các cơ hội và nhánh trong ngày ${dayData.date}:\n\n${opportunitiesPrompt}` }
				],
				response_format: { type: 'json_object' },
				temperature: 0.3
			})
		});

		if (!response.ok) {
			const errText = await response.text();
			console.error(`Groq API error (${response.status}):`, errText);
			return {
				paths: generateFallbackPaths(dayData),
				source: 'fallback'
			};
		}

		const data = (await response.json()) as {
			choices?: Array<{ message?: { content?: string } }>;
		};
		const content = data.choices?.[0]?.message?.content || '{}';
		const parsed = JSON.parse(content) as {
			best?: {
				branch_selections?: unknown;
				summary?: string;
			};
			comfort?: {
				branch_selections?: unknown;
				summary?: string;
			};
		};

		// Strictly sanitize selections against valid IDs
		let bestSelections = sanitizeAiSelections(parsed.best?.branch_selections, validBranchesMap);
		let comfortSelections = sanitizeAiSelections(parsed.comfort?.branch_selections, validBranchesMap);

		// If AI missed any opportunity, fill with fallback for that specific opportunity
		const fallbackPaths = generateFallbackPaths(dayData);
		const fallbackBestMap = new Map(fallbackPaths[0].branch_selections.map((s) => [s.opportunity_id, s]));
		const fallbackComfortMap = new Map(fallbackPaths[1].branch_selections.map((s) => [s.opportunity_id, s]));

		for (const opp of oppsWithBranches) {
			if (!bestSelections.some((s) => s.opportunity_id === opp.id)) {
				const fallbackItem = fallbackBestMap.get(opp.id);
				if (fallbackItem) bestSelections.push(fallbackItem);
			}
			if (!comfortSelections.some((s) => s.opportunity_id === opp.id)) {
				const fallbackItem = fallbackComfortMap.get(opp.id);
				if (fallbackItem) comfortSelections.push(fallbackItem);
			}
		}

		return {
			paths: [
				{
					perspective: 'best',
					branch_selections: bestSelections,
					summary: parsed.best?.summary?.slice(0, 300) || fallbackPaths[0].summary
				},
				{
					perspective: 'comfort',
					branch_selections: comfortSelections,
					summary: parsed.comfort?.summary?.slice(0, 300) || fallbackPaths[1].summary
				}
			],
			source: 'groq'
		};
	} catch (err) {
		console.error('Failed to call Groq API:', err);
		return {
			paths: generateFallbackPaths(dayData),
			source: 'fallback'
		};
	}
}
