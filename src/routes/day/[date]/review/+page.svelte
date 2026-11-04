<script lang="ts">
	import type { PageProps } from './$types';
	import { formatDateVi, formatMoneyVi, formatTimeVi, addDays } from '#lib/date';
	import { invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { confirmModal } from '#lib/confirm.svelte';
	import {
		ChevronLeft,
		ChevronRight,
		Calendar,
		Sparkles,
		Trash2,
		AlertCircle,
		Check,
		Loader2
	} from 'lucide-svelte';

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

	async function handleDeleteOpportunity(id: string, title: string) {
		const ok = await confirmModal({
			title: 'Xóa cơ hội này?',
			message: `Cơ hội "${title}" và toàn bộ nhánh đối chiếu sẽ bị xóa vĩnh viễn.`,
			confirmText: 'Xóa bỏ',
			variant: 'danger'
		});
		if (ok) {
			const form = document.getElementById(`del-opp-review-${id}`) as HTMLFormElement;
			form?.requestSubmit();
		}
	}

	async function handleClearDay() {
		const ok = await confirmModal({
			title: 'Dọn sạch toàn bộ ngày?',
			message: `Bạn có chắc muốn xóa tất cả ${data.totalOpportunities} cơ hội của ngày ${currentDate}? Hành động này không thể hoàn tác.`,
			confirmText: 'Dọn sạch tất cả',
			variant: 'danger'
		});
		if (ok) {
			const form = document.getElementById('clear-day-review-form') as HTMLFormElement;
			form?.requestSubmit();
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
				class="w-9 h-9 rounded-xl bg-stone-100 dark:bg-zinc-700 hover:bg-stone-200 dark:hover:bg-zinc-600 flex items-center justify-center text-stone-700 dark:text-zinc-200 hover:text-stone-900 dark:hover:text-white transition cursor-pointer"
				title="Ngày trước"
			>
				<ChevronLeft size={18} />
			</a>
			<div>
				<h1 class="text-xl font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2 font-serif">
					<span>Ngã Rẽ</span>
				</h1>
				<p class="text-xs text-stone-500 dark:text-zinc-400 mt-0.5 font-mono">{formatDateVi(currentDate)}</p>
			</div>
			<a
				href="/day/{addDays(currentDate, 1)}/review"
				class="w-9 h-9 rounded-xl bg-stone-100 dark:bg-zinc-700 hover:bg-stone-200 dark:hover:bg-zinc-600 flex items-center justify-center text-stone-700 dark:text-zinc-200 hover:text-stone-900 dark:hover:text-white transition cursor-pointer"
				title="Ngày sau"
			>
				<ChevronRight size={18} />
			</a>
		</div>

		<div class="flex items-center gap-2 sm:gap-2.5 flex-wrap">
			<a
				href="/day/{currentDate}"
				class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 dark:bg-zinc-700 hover:bg-stone-200 dark:hover:bg-zinc-600 text-stone-700 dark:text-zinc-200 text-xs font-semibold border border-stone-200 dark:border-zinc-600 transition"
				title="Timeline"
			>
				<Calendar size={13} />
				<span>Timeline</span>
			</a>

			{#if data.totalOpportunities > 0}
				<button
					type="button"
					onclick={handleClearDay}
					class="cursor-pointer p-2 rounded-xl text-stone-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-stone-200 dark:border-zinc-700 transition flex items-center justify-center"
					title="Dọn sạch ngày"
				>
					<Trash2 size={13} />
				</button>
				<form id="clear-day-review-form" method="POST" action="?/clearDay" use:enhance class="hidden"></form>
			{/if}

			<button
				type="button"
				onclick={handleGenerateAi}
				disabled={isGeneratingAi || data.totalOpportunities === 0}
				class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-xs transition shadow-sm cursor-pointer"
				title="Phản tư AI"
			>
				{#if isGeneratingAi}
					<Loader2 size={14} class="animate-spin" />
				{:else}
					<Sparkles size={14} />
				{/if}
				<span>AI</span>
			</button>
		</div>
	</div>

	{#if aiError}
		<div class="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-sm">
			⚠️ {aiError}
		</div>
	{/if}

	{#if data.hasUnchosenOpps}
		<div class="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between">
			<span>⚠️ Chưa chọn nhánh.</span>
			<a href="/day/{currentDate}" class="underline font-semibold ml-2 hover:text-amber-950 dark:hover:text-amber-100">Chọn ngay</a>
		</div>
	{/if}

	<!-- AI Summary (if available) -->
	{#if aiPaths.best?.summary || aiPaths.comfort?.summary}
		<div class="bg-white dark:bg-zinc-800/90 border border-stone-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
			<h2 class="text-xs uppercase font-bold tracking-wider text-stone-600 dark:text-zinc-300 mb-2 flex items-center gap-1.5 font-mono">
				<Sparkles size={13} class="text-amber-600 dark:text-amber-400" />
				<span>Phản Tư</span>
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-stone-700 dark:text-zinc-300 leading-relaxed">
				{#if aiPaths.best?.summary}
					<div class="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
						<span class="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">Hiệu Quả:</span>
						{aiPaths.best.summary}
					</div>
				{/if}
				{#if aiPaths.comfort?.summary}
					<div class="p-3 bg-sky-50/60 dark:bg-sky-950/30 rounded-xl border border-sky-200 dark:border-sky-800/50">
						<span class="font-bold text-sky-800 dark:text-sky-300 block mb-1">Thả Lỏng:</span>
						{aiPaths.comfort.summary}
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Comparisons List -->
	{#if comparisons.length === 0}
		<div class="p-12 text-center rounded-2xl border border-dashed border-stone-300 dark:border-zinc-700 text-stone-500 dark:text-zinc-400 bg-white/60 dark:bg-zinc-800/40">
			<p class="text-sm font-medium text-stone-700 dark:text-zinc-300 font-serif">Chưa có dữ liệu.</p>
			<a href="/day/{currentDate}" class="inline-block mt-3 px-4 py-2 rounded-xl bg-stone-900 dark:bg-amber-600 text-white font-semibold text-xs">
				+ Ghim
			</a>
		</div>
	{:else}
		<div class="space-y-6">
			{#each comparisons as comp, i (comp.opportunity.id)}
				{@const isAllConverged = comp.actualBranch && comp.bestBranch && comp.comfortBranch && comp.actualBranch.id === comp.bestBranch.id && comp.actualBranch.id === comp.comfortBranch.id}

				<div class="bg-white dark:bg-zinc-800/90 rounded-2xl border border-stone-200 dark:border-zinc-800 overflow-hidden shadow-xs">
					<!-- Opportunity Header Bar -->
					<div class="p-3 bg-stone-50 dark:bg-zinc-900/60 border-b border-stone-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
						<div class="flex items-center gap-2">
							<span class="w-5 h-5 rounded-full bg-stone-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-[11px] text-stone-800 dark:text-zinc-200 font-mono">
								#{i + 1}
							</span>
							<h3 class="font-bold text-sm text-stone-900 dark:text-zinc-100">{comp.opportunity.title}</h3>
							{#if comp.opportunity.other_text}
								<span class="bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full text-[11px] font-sans border border-amber-200 dark:border-amber-800/60">
									📌 {comp.opportunity.other_text}
								</span>
							{/if}
						</div>
						<div class="flex items-center gap-2 text-xs font-mono text-stone-600 dark:text-zinc-400">
							<span class="pill-resource">{comp.opportunity.time_minutes}p • {formatMoneyVi(comp.opportunity.money_amount)}</span>
							<button
								type="button"
								onclick={() => handleDeleteOpportunity(comp.opportunity.id, comp.opportunity.title)}
								class="cursor-pointer p-1.5 rounded-lg text-stone-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex items-center justify-center"
								title="Xóa cơ hội này"
							>
								<Trash2 size={13} />
							</button>
							<form id="del-opp-review-{comp.opportunity.id}" method="POST" action="?/deleteOpportunity" use:enhance class="hidden">
								<input type="hidden" name="id" value={comp.opportunity.id} />
							</form>
						</div>
					</div>

					<!-- Convergence Special Banner -->
					{#if isAllConverged}
						<div class="bg-amber-50/70 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 p-1.5 text-center text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center justify-center">
							<span>✨</span>
						</div>
					{/if}

					<!-- 3 Columns Grid -->
					<div class="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-200 dark:divide-zinc-800 text-xs">
						<!-- Column 1: Thực Tế -->
						<div class="p-4 bg-amber-50/20 dark:bg-amber-950/10 space-y-2">
							<div class="flex items-center justify-between font-semibold uppercase tracking-wider text-[11px] pb-1 border-b border-amber-200 dark:border-amber-800/60">
								<span class="text-amber-800 dark:text-amber-300 font-bold">
									Thực Tế
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
									<div class="font-mono">{formatTimeVi(comp.actualBranch.cost_time)} • {formatMoneyVi(comp.actualBranch.cost_money)}</div>
									{#if comp.remainingTime > 0 || comp.remainingMoney > 0}
										<div class="text-emerald-700 dark:text-emerald-400 font-medium font-mono">
											{#if comp.remainingTime > 0}+{formatTimeVi(comp.remainingTime)}{/if}
											{#if comp.remainingMoney > 0} +{formatMoneyVi(comp.remainingMoney)}{/if}
										</div>
									{/if}
									{#if comp.actualBranch.outcome}
										<div class="italic text-stone-700 dark:text-zinc-300 pt-1">"{comp.actualBranch.outcome}"</div>
									{/if}
								</div>
							{:else}
								<p class="text-stone-400 dark:text-zinc-500 italic py-3">Chưa chọn nhánh.</p>
							{/if}
						</div>

						<!-- Column 2: Hiệu Quả -->
						<div class="p-4 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-2">
							<div class="flex items-center justify-between font-semibold uppercase tracking-wider text-[11px] pb-1 border-b border-emerald-200 dark:border-emerald-800/60">
								<span class="text-emerald-800 dark:text-emerald-300 font-bold">
									Hiệu Quả
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
									<div class="font-mono">{formatTimeVi(comp.bestBranch.cost_time)} • {formatMoneyVi(comp.bestBranch.cost_money)}</div>
									{#if comp.bestReflection}
										<div class="text-emerald-900 dark:text-emerald-300 italic pt-1 border-t border-emerald-100 dark:border-emerald-900/50 mt-1">
											"{comp.bestReflection}"
										</div>
									{/if}
								</div>
							{:else}
								<p class="text-stone-400 dark:text-zinc-500 italic py-3">Chưa có dữ liệu.</p>
							{/if}
						</div>

						<!-- Column 3: Thả Lỏng -->
						<div class="p-4 bg-sky-50/20 dark:bg-sky-950/10 space-y-2">
							<div class="flex items-center justify-between font-semibold uppercase tracking-wider text-[11px] pb-1 border-b border-sky-200 dark:border-sky-800/60">
								<span class="text-sky-800 dark:text-sky-300 font-bold">
									Thả Lỏng
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
									<div class="font-mono">{formatTimeVi(comp.comfortBranch.cost_time)} • {formatMoneyVi(comp.comfortBranch.cost_money)}</div>
									{#if comp.comfortReflection}
										<div class="text-sky-900 dark:text-sky-300 italic pt-1 border-t border-sky-100 dark:border-sky-900/50 mt-1">
											"{comp.comfortReflection}"
										</div>
									{/if}
								</div>
							{:else}
								<p class="text-stone-400 dark:text-zinc-500 italic py-3">Chưa có dữ liệu.</p>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
