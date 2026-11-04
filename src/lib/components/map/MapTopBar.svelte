<script lang="ts">
	import { enhance } from '$app/forms';
	import { ChevronLeft, ChevronRight, Trash2, ArrowRight } from 'lucide-svelte';
	import { formatDateVi } from '#lib/date';

	let {
		currentDate,
		prevDate,
		nextDate,
		totalChosen,
		totalOpportunities,
		totalBranches,
		onClearDay
	}: {
		currentDate: string;
		prevDate: string;
		nextDate: string;
		totalChosen: number;
		totalOpportunities: number;
		totalBranches: number;
		onClearDay: () => void;
	} = $props();
</script>

<div
	class="flex flex-col justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-800/90"
>
	<div class="flex items-center gap-3">
		<a
			href="/day/{prevDate}"
			class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-stone-100 font-bold text-stone-700 transition hover:bg-stone-200 hover:text-stone-900 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600 dark:hover:text-white"
			title="Ngày trước"
		>
			<ChevronLeft size={18} />
		</a>
		<div>
			<h1
				class="flex items-center gap-2 font-serif text-xl font-bold text-stone-900 dark:text-zinc-100"
			>
				<span>{formatDateVi(currentDate)}</span>
			</h1>
			<p class="mt-0.5 font-mono text-xs text-stone-500 dark:text-zinc-400">{currentDate}</p>
		</div>
		<a
			href="/day/{nextDate}"
			class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-stone-100 font-bold text-stone-700 transition hover:bg-stone-200 hover:text-stone-900 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600 dark:hover:text-white"
			title="Ngày sau"
		>
			<ChevronRight size={18} />
		</a>
	</div>

	<!-- Action Links / Stats pill -->
	<div class="flex flex-wrap items-center gap-2.5">
		<div
			class="rounded-lg border border-stone-200 bg-stone-100 px-2.5 py-1.5 font-mono text-xs text-stone-700 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300"
		>
			<span class="font-bold text-amber-700 dark:text-amber-400">{totalChosen}</span>/{totalOpportunities}
			<span class="mx-1 text-stone-400 dark:text-zinc-500">•</span>
			<span class="font-semibold text-stone-800 dark:text-zinc-200">{totalBranches}</span>
		</div>

		{#if totalOpportunities > 0}
			<button
				type="button"
				onclick={onClearDay}
				class="flex cursor-pointer items-center justify-center rounded-lg border border-stone-200 p-2 text-stone-400 transition hover:bg-rose-50 hover:text-rose-600 dark:border-zinc-700 dark:text-zinc-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
				title="Dọn sạch ngày"
			>
				<Trash2 size={13} />
			</button>
			<form
				id="clear-day-page-form"
				method="POST"
				action="?/clearDay"
				use:enhance
				class="hidden"
			></form>
		{/if}

		<a
			href="/day/{currentDate}/review"
			class="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700"
			title="Ngã Rẽ"
		>
			<span>Ngã Rẽ</span>
			<ArrowRight size={14} />
		</a>
	</div>
</div>
