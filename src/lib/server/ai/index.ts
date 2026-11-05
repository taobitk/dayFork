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

		// Best: prefer branch with substantive outcome / achievements
		const sortedForBest = [...opp.branches].sort((a, b) => (b.outcome?.length || 0) - (a.outcome?.length || 0));
		const bestBranch = sortedForBest[0];
		bestSelections.push({
			opportunity_id: opp.id,
			branch_id: bestBranch.id,
			reflection: `Nếu chọn ${bestBranch.name}, bạn sẽ tạo ra kết quả thực chất và giữ vững tiến độ dài hạn.`
		});

		// Comfort: prefer relaxing / soothing outcome
		const comfortBranch = opp.branches[opp.branches.length - 1];
		comfortSelections.push({
			opportunity_id: opp.id,
			branch_id: comfortBranch.id,
			reflection: `Nếu chọn ${comfortBranch.name}, bạn sẽ có khoảng lặng thả lỏng để nạp lại năng lượng và cảm thấy dễ chịu.`
		});
	}

	return [
		{
			perspective: 'best',
			branch_selections: bestSelections,
			summary: 'Hành trình Hiệu Quả: Ưu tiên giá trị thực chất và duy trì tiến độ hoàn thành mục tiêu.'
		},
		{
			perspective: 'comfort',
			branch_selections: comfortSelections,
			summary: 'Hành trình Thả Lỏng: Lắng nghe cảm xúc để bạn cảm thấy thảnh thơi và tái tạo năng lượng.'
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
			const contextNote = opp.other_text?.trim() ? ` | Ngữ cảnh/Ghi chú: "${opp.other_text.trim()}"` : '';
			return `Cơ hội ${idx + 1} (ID: "${opp.id}"): "${opp.title}" (Tài nguyên: ${opp.time_minutes} phút, ${opp.money_amount} đ${contextNote})\n  Nhánh có thể chọn:\n${branchesText}`;
		})
		.join('\n\n');

	const systemPrompt = `Bạn là bộ máy giả lập và phản tư DayFork. Nhiệm vụ DUY NHẤT của bạn là phân tích các cơ hội và các nhánh lựa chọn trong ngày, sau đó xuất ra ĐÚNG 1 JSON chứa 2 góc nhìn độc lập ("best" và "comfort").

TIÊU CHÍ ƯU TIÊN KHI CHỌN NHÁNH:
1. Góc nhìn "best" (Hiệu Quả):
   - ƯU TIÊN GIÁ TRỊ THỰC CHẤT & KẾT QUẢ DÀI HẠN: Đọc kỹ tên nhánh và phần "Nhận lại" (outcome). Ưu tiên nhánh tạo ra thành quả cụ thể (hoàn thành sản phẩm, học tri thức mới, giải quyết dứt điểm công việc, rèn luyện sức khỏe).
   - TUYỆT ĐỐI KHÔNG SO SÁNH SỐ HỌC CƠ HỌC: Không được coi việc tốn ít phút hơn là tốt hơn (90 phút học bài hay 60 phút ngồi code tạo ra giá trị lớn hơn nhiều so với việc chỉ ngồi không tiết kiệm thời gian).
   - TÔN TRỌNG NGỮ CẢNH: Nếu người dùng ghi chú "đang kiệt sức, ốm, mệt...", hiệu quả là chọn nhánh vừa sức để phục hồi bền vững thay vì gượng ép.

2. Góc nhìn "comfort" (Thả Lỏng):
   - ƯU TIÊN PHỤC HỒI NĂNG LƯỢNG & TÂM TRÍ: Chọn nhánh giúp giảm stress, nhẹ đầu, nuôi dưỡng cảm xúc tích cực (nghỉ ngơi, ngủ đủ, đi dạo, kết nối bạn bè, giải trí lành mạnh).
   - Bỏ qua hoàn toàn áp lực về năng suất hay thời gian.

3. Lời phản tư (reflection):
   - 1-2 câu ngắn, bắt đầu bằng "Nếu chọn thì hôm đó tôi sẽ...".
   - Phân tích sâu sắc sự đánh đổi thực tế giữa các lựa chọn, cấm trả lời máy móc kiểu "tiết kiệm được X phút".

QUY TẮC CẤU TRÚC JSON (BẮT BUỘC):
- CHỈ ĐƯỢC CHỌN ID NHÁNH CÓ SẴN trong từng cơ hội (tuyệt đối không bịa ID hoặc tự đặt nhánh mới).
- Mỗi cơ hội phải chọn đúng 1 nhánh.
- Xuất ra DUY NHẤT một JSON hợp lệ theo đúng cấu trúc sau (không kèm markdown giải thích):
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
				model: 'qwen/qwen3.8-27b',
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
