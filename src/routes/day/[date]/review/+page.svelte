<script lang="ts">
	import type { PageProps } from './$types';
	import { formatDateVi, formatMoneyVi, formatTimeVi, addDays } from '#lib/date';
	import { invalidateAll } from '$app/navigation';

	let { data }: PageProps = $props();

	let comparisons = $derived(data.comparisons);
	let currentDate = $derived(data.date);
	let aiPaths = $derived(data.aiPaths);

	let isGeneratingAi = $state(false);
	let aiError = $state<string | null>(null);

	async function handleGenerateAi() {
		isGeneratingAi = true;
		aiError = null;
		try {
			const res = await fetch(`/api/day/${currentDate}/ai`, {
				method: 'POST'
			});
			const result = (await res.json()) as { message?: string };
			if (!res.ok) {
				throw new Error(result.message || 'Không thể tạo đường đi AI');
			}
			await invalidateAll();
		} catch (err: unknown) {
			aiError = err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi gọi AI';
		} finally {
			isGeneratingAi = false;
		}
	}
</script>

<div class="space-y-6 max-w-5xl mx-auto">
	<!-- Top Bar -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
		<div class="flex items-center gap-3">
			<a
				href="/day/{addDays(currentDate, -1)}/review"
				class="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 hover:text-stone-900 transition font-bold"
				title="Ngày trước"
			>
				←
			</a>
			<div>
				<h1 class="text-xl font-bold text-stone-900 flex items-center gap-2 font-serif">
					<span>Ngã Rẽ Cuộc Sống</span>
				</h1>
				<p class="text-xs text-stone-500 mt-0.5 font-mono">{formatDateVi(currentDate)}</p>
			</div>
			<a
				href="/day/{addDays(currentDate, 1)}/review"
				class="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 hover:text-stone-900 transition font-bold"
				title="Ngày sau"
			>
				→
			</a>
		</div>

		<div class="flex items-center gap-3 flex-wrap">
			<a
				href="/day/{currentDate}"
				class="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold border border-stone-200 transition"
			>
				✏️ Xem Timeline
			</a>

			<button
				type="button"
				onclick={handleGenerateAi}
				disabled={isGeneratingAi || data.totalOpportunities === 0}
				class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-xs transition shadow-sm cursor-pointer"
			>
				{#if isGeneratingAi}
					<span class="animate-spin">⏳</span>
					<span>Đang suy ngẫm...</span>
				{:else if aiPaths.best || aiPaths.comfort}
					<span>✨ Tạo lại Phản tư AI</span>
				{:else}
					<span>✨ Kích hoạt Phản tư AI</span>
				{/if}
			</button>
		</div>
	</div>

	{#if aiError}
		<div class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
			⚠️ {aiError}
		</div>
	{/if}

	{#if data.hasUnchosenOpps}
		<div class="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
			<span>⚠️ Bạn vẫn còn cơ hội chưa chọn nhánh thực tế. Hãy chọn nhánh để đối chiếu đầy đủ.</span>
			<a href="/day/{currentDate}" class="underline font-semibold ml-2 hover:text-amber-950">Vào chọn ngay</a>
		</div>
	{/if}

	<!-- AI Summary (if available) -->
	{#if aiPaths.best?.summary || aiPaths.comfort?.summary}
		<div class="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
			<h2 class="text-xs uppercase font-bold tracking-wider text-stone-600 mb-3 flex items-center gap-2 font-mono">
				<span>💭</span> Tổng Kết Góc Nhìn Phản Tư
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-stone-700 leading-relaxed">
				{#if aiPaths.best?.summary}
					<div class="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
						<span class="font-bold text-emerald-800 block mb-1">🟢 Góc nhìn Hiệu Quả:</span>
						{aiPaths.best.summary}
					</div>
				{/if}
				{#if aiPaths.comfort?.summary}
					<div class="p-3.5 bg-sky-50/60 rounded-xl border border-sky-200">
						<span class="font-bold text-sky-800 block mb-1">🔵 Góc nhìn Thả Lỏng:</span>
						{aiPaths.comfort.summary}
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Comparisons List -->
	{#if comparisons.length === 0}
		<div class="p-12 text-center rounded-2xl border border-dashed border-stone-300 text-stone-500 bg-white/60">
			<p class="text-sm font-medium text-stone-700 font-serif">Chưa có cơ hội nào trong ngày {currentDate}.</p>
			<a href="/day/{currentDate}" class="inline-block mt-3 px-4 py-2 rounded-xl bg-stone-900 text-white font-semibold text-xs">
				+ Ghim cơ hội đầu tiên
			</a>
		</div>
	{:else}
		<div class="space-y-6">
			{#each comparisons as comp, i (comp.opportunity.id)}
				{@const isAllConverged = comp.actualBranch && comp.bestBranch && comp.comfortBranch && comp.actualBranch.id === comp.bestBranch.id && comp.actualBranch.id === comp.comfortBranch.id}

				<div class="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
					<!-- Opportunity Header Bar -->
					<div class="p-3.5 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
						<div class="flex items-center gap-2.5">
							<span class="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center font-bold text-xs text-stone-800 font-mono">
								#{i + 1}
							</span>
							<h3 class="font-bold text-sm text-stone-900">{comp.opportunity.title}</h3>
							{#if comp.opportunity.other_text}
								<span class="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full text-[11px] font-sans border border-amber-200">
									📌 {comp.opportunity.other_text}
								</span>
							{/if}
						</div>
						<div class="flex items-center gap-2 text-xs font-mono text-stone-600">
							<span class="pill-resource">⏱ {comp.opportunity.time_minutes}p • 💵 {formatMoneyVi(comp.opportunity.money_amount)}</span>
						</div>
					</div>

					<!-- Convergence Special Banner -->
					{#if isAllConverged}
						<div class="bg-amber-50/70 border-b border-amber-200 p-2.5 text-center text-xs font-semibold text-amber-900 flex items-center justify-center gap-2">
							<span>✨ 3 Lối Hội Tụ:</span>
							<span>Thực tế của bạn hoàn toàn đồng điệu với cả 2 góc nhìn Hiệu Quả và Thả Lỏng!</span>
						</div>
					{/if}

					<!-- 3 Columns Grid -->
					<div class="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-200 text-xs">
						<!-- Column 1: Thực Tế -->
						<div class="p-4 bg-amber-50/20 space-y-2">
							<div class="flex items-center justify-between font-semibold uppercase tracking-wider text-[11px] pb-1 border-b border-amber-200">
								<span class="flex items-center gap-1.5 text-amber-800 font-bold">
									<span>🟠</span> Thực Tế
								</span>
								{#if comp.actualBranch}
									<span class="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">Đã chốt</span>
								{/if}
							</div>

							{#if comp.actualBranch}
								<div class="font-bold text-sm text-stone-900">
									{comp.actualBranch.name}
								</div>
								<div class="space-y-1 text-stone-600">
									<div class="font-mono">Tốn: {formatTimeVi(comp.actualBranch.cost_time)} • {formatMoneyVi(comp.actualBranch.cost_money)}</div>
									{#if comp.remainingTime > 0 || comp.remainingMoney > 0}
										<div class="text-emerald-700 font-medium font-mono">
											Dôi dư:
											{#if comp.remainingTime > 0}+{formatTimeVi(comp.remainingTime)}{/if}
											{#if comp.remainingMoney > 0} +{formatMoneyVi(comp.remainingMoney)}{/if}
										</div>
									{/if}
									{#if comp.actualBranch.outcome}
										<div class="italic text-stone-700 pt-1">"{comp.actualBranch.outcome}"</div>
									{/if}
								</div>
							{:else}
								<p class="text-stone-400 italic py-3">Chưa chọn nhánh nào.</p>
							{/if}
						</div>

						<!-- Column 2: Hiệu Quả -->
						<div class="p-4 bg-emerald-50/20 space-y-2">
							<div class="flex items-center justify-between font-semibold uppercase tracking-wider text-[11px] pb-1 border-b border-emerald-200">
								<span class="flex items-center gap-1.5 text-emerald-800 font-bold">
									<span>🟢</span> Hiệu Quả
								</span>
								{#if comp.bestBranch && comp.actualBranch && comp.bestBranch.id === comp.actualBranch.id}
									<span class="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold font-mono">Trùng bạn ✓</span>
								{/if}
							</div>

							{#if comp.bestBranch}
								<div class="font-bold text-sm text-stone-900">
									{comp.bestBranch.name}
								</div>
								<div class="space-y-1 text-stone-600">
									<div class="font-mono">Tốn: {formatTimeVi(comp.bestBranch.cost_time)} • {formatMoneyVi(comp.bestBranch.cost_money)}</div>
									{#if comp.bestReflection}
										<div class="text-emerald-900 italic pt-1 border-t border-emerald-100 mt-1">
											"{comp.bestReflection}"
										</div>
									{/if}
								</div>
							{:else}
								<p class="text-stone-400 italic py-3">Chưa có đề xuất AI. Bấm "Kích hoạt Phản tư AI".</p>
							{/if}
						</div>

						<!-- Column 3: Thả Lỏng -->
						<div class="p-4 bg-sky-50/20 space-y-2">
							<div class="flex items-center justify-between font-semibold uppercase tracking-wider text-[11px] pb-1 border-b border-sky-200">
								<span class="flex items-center gap-1.5 text-sky-800 font-bold">
									<span>🔵</span> Thả Lỏng
								</span>
								{#if comp.comfortBranch && comp.actualBranch && comp.comfortBranch.id === comp.actualBranch.id}
									<span class="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-bold font-mono">Trùng bạn ✓</span>
								{/if}
							</div>

							{#if comp.comfortBranch}
								<div class="font-bold text-sm text-stone-900">
									{comp.comfortBranch.name}
								</div>
								<div class="space-y-1 text-stone-600">
									<div class="font-mono">Tốn: {formatTimeVi(comp.comfortBranch.cost_time)} • {formatMoneyVi(comp.comfortBranch.cost_money)}</div>
									{#if comp.comfortReflection}
										<div class="text-sky-900 italic pt-1 border-t border-sky-100 mt-1">
											"{comp.comfortReflection}"
										</div>
									{/if}
								</div>
							{:else}
								<p class="text-stone-400 italic py-3">Chưa có đề xuất AI. Bấm "Kích hoạt Phản tư AI".</p>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<div class="text-center text-xs text-stone-500 py-3 font-mono">
		💡 Các góc nhìn do AI phản tư chỉ mang tính chất tham chiếu và đối chiếu, không mang tính phán xét hay chấm điểm.
	</div>
</div>
