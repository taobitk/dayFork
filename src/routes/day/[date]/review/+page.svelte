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

<div class="space-y-6">
	<!-- Top Bar -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
		<div class="flex items-center gap-3">
			<a
				href="/day/{addDays(currentDate, -1)}/review"
				class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition"
				title="Ngày trước"
			>
				←
			</a>
			<div>
				<h1 class="text-xl font-bold text-slate-100 flex items-center gap-2">
					<span>Đối Chiếu 3 Đường Đi</span>
				</h1>
				<p class="text-xs text-slate-400 mt-0.5">{formatDateVi(currentDate)}</p>
			</div>
			<a
				href="/day/{addDays(currentDate, 1)}/review"
				class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition"
				title="Ngày sau"
			>
				→
			</a>
		</div>

		<div class="flex items-center gap-3">
			<a
				href="/day/{currentDate}"
				class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition"
			>
				✏️ Chỉnh sửa cơ hội
			</a>

			<button
				type="button"
				onclick={handleGenerateAi}
				disabled={isGeneratingAi || data.totalOpportunities === 0}
				class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-semibold text-xs transition shadow-md shadow-amber-500/10"
			>
				{#if isGeneratingAi}
					<span class="animate-spin">⏳</span>
					<span>Đang suy ngẫm...</span>
				{:else if aiPaths.best || aiPaths.comfort}
					<span>✨ Tạo lại góc nhìn AI</span>
				{:else}
					<span>✨ Kích hoạt 2 Góc nhìn AI</span>
				{/if}
			</button>
		</div>
	</div>

	{#if aiError}
		<div class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
			⚠️ {aiError}
		</div>
	{/if}

	{#if data.hasUnchosenOpps}
		<div class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
			<span>⚠️ Bạn vẫn còn cơ hội chưa chọn nhánh thực tế. Hãy chọn nhánh để số liệu đối chiếu chính xác nhất.</span>
			<a href="/day/{currentDate}" class="underline font-semibold ml-2">Vào chọn ngay</a>
		</div>
	{/if}

	<!-- AI Summary (if available) -->
	{#if aiPaths.best?.summary || aiPaths.comfort?.summary}
		<div class="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-lg shadow-amber-500/5">
			<h2 class="text-xs uppercase font-bold tracking-wider text-amber-400 mb-2 flex items-center gap-2">
				<span>💭</span> Lời Nhắn Của AI Cho Ngày Này
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed">
				{#if aiPaths.best?.summary}
					<div class="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
						<span class="font-bold text-amber-300 block mb-1">Hành trình Tối ưu (Best):</span>
						{aiPaths.best.summary}
					</div>
				{/if}
				{#if aiPaths.comfort?.summary}
					<div class="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
						<span class="font-bold text-sky-300 block mb-1">Hành trình Thoải mái (Comfort):</span>
						{aiPaths.comfort.summary}
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- 3 Columns Comparison View -->
	{#if comparisons.length === 0}
		<div class="p-10 text-center rounded-2xl border border-dashed border-slate-800 text-slate-500 bg-slate-900/20">
			<p class="text-sm font-medium text-slate-400">Chưa có cơ hội nào trong ngày {currentDate}.</p>
			<a href="/day/{currentDate}" class="inline-block mt-3 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-semibold text-xs">
				+ Thêm cơ hội đầu tiên
			</a>
		</div>
	{:else}
		<div class="space-y-6">
			{#each comparisons as comp, i (comp.opportunity.id)}
				<div class="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
					<!-- Opportunity Header -->
					<div class="p-3.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between">
						<div class="flex items-center gap-2.5">
							<span class="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-amber-400 font-mono">
								#{i + 1}
							</span>
							<h3 class="font-bold text-sm text-slate-100">{comp.opportunity.title}</h3>
						</div>
						<div class="flex items-center gap-2 text-xs font-mono text-slate-400">
							<span>⏱ {formatTimeVi(comp.opportunity.time_minutes)}</span>
							{#if comp.opportunity.money_amount > 0}
								<span>• 💵 {formatMoneyVi(comp.opportunity.money_amount)}</span>
							{/if}
						</div>
					</div>

					<!-- 3 Columns Grid -->
					<div class="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800 text-xs">
						<!-- Column 1: Actual Choice -->
						<div class="p-4 bg-slate-950/40 space-y-2">
							<div class="flex items-center justify-between text-slate-400 font-semibold uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800/60">
								<span class="flex items-center gap-1.5 text-amber-300">
									<span>👤</span> Thực tế bạn đã chọn
								</span>
							</div>

							{#if comp.actualBranch}
								<div class="font-bold text-sm text-slate-100">
									{comp.actualBranch.name}
								</div>
								<div class="space-y-1 text-slate-400">
									<div>Tốn: {formatTimeVi(comp.actualBranch.cost_time)} • {formatMoneyVi(comp.actualBranch.cost_money)}</div>
									{#if comp.remainingTime > 0 || comp.remainingMoney > 0}
										<div class="text-emerald-400 font-medium">
											Dư dôi:
											{#if comp.remainingTime > 0} +{formatTimeVi(comp.remainingTime)}{/if}
											{#if comp.remainingMoney > 0} +{formatMoneyVi(comp.remainingMoney)}{/if}
										</div>
									{/if}
									{#if comp.actualBranch.outcome}
										<div class="italic text-slate-300 pt-1">"{comp.actualBranch.outcome}"</div>
									{/if}
								</div>
							{:else}
								<p class="text-slate-500 italic py-3">Chưa chọn nhánh nào.</p>
							{/if}
						</div>

						<!-- Column 2: AI Best Perspective -->
						<div class="p-4 bg-slate-950/60 space-y-2">
							<div class="flex items-center justify-between text-slate-400 font-semibold uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800/60">
								<span class="flex items-center gap-1.5 text-emerald-400">
									<span>🎯</span> Tốt nhất (Best)
								</span>
								{#if comp.bestBranch && comp.actualBranch && comp.bestBranch.id === comp.actualBranch.id}
									<span class="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">Trùng bạn 🎉</span>
								{/if}
							</div>

							{#if comp.bestBranch}
								<div class="font-bold text-sm text-slate-100">
									{comp.bestBranch.name}
								</div>
								<div class="space-y-1 text-slate-400">
									<div>Tốn: {formatTimeVi(comp.bestBranch.cost_time)} • {formatMoneyVi(comp.bestBranch.cost_money)}</div>
									{#if comp.bestReflection}
										<div class="text-emerald-300/90 italic pt-1 border-t border-slate-800/50 mt-1">
											"{comp.bestReflection}"
										</div>
									{/if}
								</div>
							{:else}
								<p class="text-slate-500 italic py-3">Chưa có đề xuất AI. Bấm "Kích hoạt AI" ở trên.</p>
							{/if}
						</div>

						<!-- Column 3: AI Comfort Perspective -->
						<div class="p-4 bg-slate-950/40 space-y-2">
							<div class="flex items-center justify-between text-slate-400 font-semibold uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800/60">
								<span class="flex items-center gap-1.5 text-sky-400">
									<span>☕</span> Thoải mái nhất (Comfort)
								</span>
								{#if comp.comfortBranch && comp.actualBranch && comp.comfortBranch.id === comp.actualBranch.id}
									<span class="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded font-bold">Trùng bạn ☕</span>
								{/if}
							</div>

							{#if comp.comfortBranch}
								<div class="font-bold text-sm text-slate-100">
									{comp.comfortBranch.name}
								</div>
								<div class="space-y-1 text-slate-400">
									<div>Tốn: {formatTimeVi(comp.comfortBranch.cost_time)} • {formatMoneyVi(comp.comfortBranch.cost_money)}</div>
									{#if comp.comfortReflection}
										<div class="text-sky-300/90 italic pt-1 border-t border-slate-800/50 mt-1">
											"{comp.comfortReflection}"
										</div>
									{/if}
								</div>
							{:else}
								<p class="text-slate-500 italic py-3">Chưa có đề xuất AI. Bấm "Kích hoạt AI" ở trên.</p>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<div class="text-center text-xs text-slate-500 py-3">
		💡 Lưu ý: Các đường đi do AI đề xuất chỉ mang tính chất tham chiếu và mở rộng góc nhìn, không mang tính phán xét.
	</div>
</div>
