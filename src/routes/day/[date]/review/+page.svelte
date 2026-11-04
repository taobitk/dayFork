<script lang="ts">
	import type { PageProps } from './$types';
	import { formatDateVi, formatMoneyVi, formatTimeVi, addDays } from '#lib/date';
	import { invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';

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
	<div
		class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-800/90 p-4 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-sm"
	>
		<div class="flex items-center gap-3">
			<a
				href="/day/{addDays(currentDate, -1)}/review"
				class="w-9 h-9 rounded-xl bg-stone-100 dark:bg-zinc-700 hover:bg-stone-200 dark:hover:bg-zinc-600 flex items-center justify-center text-stone-700 dark:text-zinc-200 hover:text-stone-900 dark:hover:text-white transition font-bold"
				title="Ngày trước"
			>
				←
			</a>
			<div>
				<h1 class="text-xl font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2 font-serif">
					<span>Ngã Rẽ Cuộc Sống</span>
				</h1>
				<p class="text-xs text-stone-500 dark:text-zinc-400 mt-0.5 font-mono">{formatDateVi(currentDate)}</p>
			</div>
			<a
				href="/day/{addDays(currentDate, 1)}/review"
				class="w-9 h-9 rounded-xl bg-stone-100 dark:bg-zinc-700 hover:bg-stone-200 dark:hover:bg-zinc-600 flex items-center justify-center text-stone-700 dark:text-zinc-200 hover:text-stone-900 dark:hover:text-white transition font-bold"
				title="Ngày sau"
			>
				→
			</a>
		</div>

		<div class="flex items-center gap-3 flex-wrap">
			<a
				href="/day/{currentDate}"
				class="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-zinc-700 hover:bg-stone-200 dark:hover:bg-zinc-600 text-stone-700 dark:text-zinc-200 text-xs font-semibold border border-stone-200 dark:border-zinc-600 transition"
			>
				✏️ Xem Timeline
			</a>

			{#if data.totalOpportunities > 0}
				<form method="POST" action="?/clearDay" use:enhance class="inline">
					<button
						type="submit"
						onclick={(e) => {
							if (!confirm(`Bạn có chắc muốn xóa tất cả ${data.totalOpportunities} cơ hội của ngày ${currentDate}?`)) {
								e.preventDefault();
							}
						}}
						class="cursor-pointer px-3.5 py-2 rounded-xl text-stone-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold border border-stone-200 dark:border-zinc-700 transition"
						title="Xóa toàn bộ cơ hội trong ngày này"
					>
						🗑️ Dọn sạch ngày
					</button>
				</form>
			{/if}

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
		<div class="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-sm">
			⚠️ {aiError}
		</div>
	{/if}

	{#if data.hasUnchosenOpps}
		<div class="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between">
			<span>⚠️ Bạn vẫn còn cơ hội chưa chọn nhánh thực tế. Hãy chọn nhánh để đối chiếu đầy đủ.</span>
			<a href="/day/{currentDate}" class="underline font-semibold ml-2 hover:text-amber-950 dark:hover:text-amber-100">Vào chọn ngay</a>
		</div>
	{/if}

	<!-- AI Summary (if available) -->
	{#if aiPaths.best?.summary || aiPaths.comfort?.summary}
		<div class="bg-white dark:bg-zinc-800/90 border border-stone-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
			<h2 class="text-xs uppercase font-bold tracking-wider text-stone-600 dark:text-zinc-300 mb-3 flex items-center gap-2 font-mono">
				<span>💭</span> Tổng Kết Góc Nhìn Phản Tư
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-stone-700 dark:text-zinc-300 leading-relaxed">
				{#if aiPaths.best?.summary}
					<div class="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
						<span class="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">🟢 Góc nhìn Hiệu Quả:</span>
						{aiPaths.best.summary}
					</div>
				{/if}
				{#if aiPaths.comfort?.summary}
					<div class="p-3.5 bg-sky-50/60 dark:bg-sky-950/30 rounded-xl border border-sky-200 dark:border-sky-800/50">
						<span class="font-bold text-sky-800 dark:text-sky-300 block mb-1">🔵 Góc nhìn Thả Lỏng:</span>
						{aiPaths.comfort.summary}
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Comparisons List -->
	{#if comparisons.length === 0}
		<div class="p-12 text-center rounded-2xl border border-dashed border-stone-300 dark:border-zinc-700 text-stone-500 dark:text-zinc-400 bg-white/60 dark:bg-zinc-800/40">
			<p class="text-sm font-medium text-stone-700 dark:text-zinc-300 font-serif">Chưa có cơ hội nào trong ngày {currentDate}.</p>
			<a href="/day/{currentDate}" class="inline-block mt-3 px-4 py-2 rounded-xl bg-stone-900 dark:bg-amber-600 text-white font-semibold text-xs">
				+ Ghim cơ hội đầu tiên
			</a>
		</div>
	{:else}
		<div class="space-y-6">
			{#each comparisons as comp, i (comp.opportunity.id)}
				{@const isAllConverged = comp.actualBranch && comp.bestBranch && comp.comfortBranch && comp.actualBranch.id === comp.bestBranch.id && comp.actualBranch.id === comp.comfortBranch.id}

				<div class="bg-white dark:bg-zinc-800/90 rounded-2xl border border-stone-200 dark:border-zinc-800 overflow-hidden shadow-xs">
					<!-- Opportunity Header Bar -->
					<div class="p-3.5 bg-stone-50 dark:bg-zinc-900/60 border-b border-stone-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
						<div class="flex items-center gap-2.5">
							<span class="w-6 h-6 rounded-full bg-stone-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-xs text-stone-800 dark:text-zinc-200 font-mono">
								#{i + 1}
							</span>
							<h3 class="font-bold text-sm text-stone-900 dark:text-zinc-100">{comp.opportunity.title}</h3>
							{#if comp.opportunity.other_text}
								<span class="bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full text-[11px] font-sans border border-amber-200 dark:border-amber-800/60">
									📌 {comp.opportunity.other_text}
								</span>
							{/if}
						</div>
						<div class="flex items-center gap-2.5 text-xs font-mono text-stone-600 dark:text-zinc-400">
							<span class="pill-resource">⏱ {comp.opportunity.time_minutes}p • 💵 {formatMoneyVi(comp.opportunity.money_amount)}</span>
							<form method="POST" action="?/deleteOpportunity" use:enhance class="inline">
								<input type="hidden" name="id" value={comp.opportunity.id} />
								<button
									type="submit"
									onclick={(e) => {
										if (!confirm(`Xóa cơ hội "${comp.opportunity.title}" và toàn bộ nhánh?`)) {
											e.preventDefault();
										}
									}}
									class="cursor-pointer p-1.5 rounded-lg text-stone-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex items-center justify-center"
									title="Xóa cơ hội này"
								>
									<span class="text-xs">🗑️</span>
								</button>
							</form>
						</div>
					</div>

					<!-- Convergence Special Banner -->
					{#if isAllConverged}
						<div class="bg-amber-50/70 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 p-2.5 text-center text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center justify-center gap-2">
							<span>✨ 3 Lối Hội Tụ:</span>
							<span>Thực tế của bạn hoàn toàn đồng điệu với cả 2 góc nhìn Hiệu Quả và Thả Lỏng!</span>
						</div>
					{/if}

					<!-- 3 Columns Grid -->
					<div class="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-200 dark:divide-zinc-800 text-xs">
						<!-- Column 1: Thực Tế -->
						<div class="p-4 bg-amber-50/20 dark:bg-amber-950/10 space-y-2">
							<div class="flex items-center justify-between font-semibold uppercase tracking-wider text-[11px] pb-1 border-b border-amber-200 dark:border-amber-800/60">
								<span class="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold">
									<span>🟠</span> Thực Tế
								</span>
								{#if comp.actualBranch}
									<span class="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded font-mono font-bold">Đã chốt</span>
								{/if}
							</div>

							{#if comp.actualBranch}
								<div class="font-bold text-sm text-stone-900 dark:text-zinc-100">
									{comp.actualBranch.name}
								</div>
								<div class="space-y-1 text-stone-600 dark:text-zinc-400">
									<div class="font-mono">Tốn: {formatTimeVi(comp.actualBranch.cost_time)} • {formatMoneyVi(comp.actualBranch.cost_money)}</div>
									{#if comp.remainingTime > 0 || comp.remainingMoney > 0}
										<div class="text-emerald-700 dark:text-emerald-400 font-medium font-mono">
											Dôi dư:
											{#if comp.remainingTime > 0}+{formatTimeVi(comp.remainingTime)}{/if}
											{#if comp.remainingMoney > 0} +{formatMoneyVi(comp.remainingMoney)}{/if}
										</div>
									{/if}
									{#if comp.actualBranch.outcome}
										<div class="italic text-stone-700 dark:text-zinc-300 pt-1">"{comp.actualBranch.outcome}"</div>
									{/if}
								</div>
							{:else}
								<p class="text-stone-400 dark:text-zinc-500 italic py-3">Chưa chọn nhánh nào.</p>
							{/if}
						</div>

						<!-- Column 2: Hiệu Quả -->
						<div class="p-4 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-2">
							<div class="flex items-center justify-between font-semibold uppercase tracking-wider text-[11px] pb-1 border-b border-emerald-200 dark:border-emerald-800/60">
								<span class="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold">
									<span>🟢</span> Hiệu Quả
								</span>
								{#if comp.bestBranch && comp.actualBranch && comp.bestBranch.id === comp.actualBranch.id}
									<span class="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold font-mono">Trùng bạn ✓</span>
								{/if}
							</div>

							{#if comp.bestBranch}
								<div class="font-bold text-sm text-stone-900 dark:text-zinc-100">
									{comp.bestBranch.name}
								</div>
								<div class="space-y-1 text-stone-600 dark:text-zinc-400">
									<div class="font-mono">Tốn: {formatTimeVi(comp.bestBranch.cost_time)} • {formatMoneyVi(comp.bestBranch.cost_money)}</div>
									{#if comp.bestReflection}
										<div class="text-emerald-900 dark:text-emerald-300 italic pt-1 border-t border-emerald-100 dark:border-emerald-900/50 mt-1">
											"{comp.bestReflection}"
										</div>
									{/if}
								</div>
							{:else}
								<p class="text-stone-400 dark:text-zinc-500 italic py-3">Chưa có đề xuất AI. Bấm "Kích hoạt Phản tư AI".</p>
							{/if}
						</div>

						<!-- Column 3: Thả Lỏng -->
						<div class="p-4 bg-sky-50/20 dark:bg-sky-950/10 space-y-2">
							<div class="flex items-center justify-between font-semibold uppercase tracking-wider text-[11px] pb-1 border-b border-sky-200 dark:border-sky-800/60">
								<span class="flex items-center gap-1.5 text-sky-800 dark:text-sky-300 font-bold">
									<span>🔵</span> Thả Lỏng
								</span>
								{#if comp.comfortBranch && comp.actualBranch && comp.comfortBranch.id === comp.actualBranch.id}
									<span class="text-[10px] bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 px-1.5 py-0.5 rounded font-bold font-mono">Trùng bạn ✓</span>
								{/if}
							</div>

							{#if comp.comfortBranch}
								<div class="font-bold text-sm text-stone-900 dark:text-zinc-100">
									{comp.comfortBranch.name}
								</div>
								<div class="space-y-1 text-stone-600 dark:text-zinc-400">
									<div class="font-mono">Tốn: {formatTimeVi(comp.comfortBranch.cost_time)} • {formatMoneyVi(comp.comfortBranch.cost_money)}</div>
									{#if comp.comfortReflection}
										<div class="text-sky-900 dark:text-sky-300 italic pt-1 border-t border-sky-100 dark:border-sky-900/50 mt-1">
											"{comp.comfortReflection}"
										</div>
									{/if}
								</div>
							{:else}
								<p class="text-stone-400 dark:text-zinc-500 italic py-3">Chưa có đề xuất AI. Bấm "Kích hoạt Phản tư AI".</p>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<div class="text-center text-xs text-stone-500 dark:text-zinc-500 py-3 font-mono">
		💡 Các góc nhìn do AI phản tư chỉ mang tính chất tham chiếu và đối chiếu, không mang tính phán xét hay chấm điểm.
	</div>
</div>
