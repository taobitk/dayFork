<script lang="ts">
	import { enhance } from '$app/forms';
	import { Trash2 } from 'lucide-svelte';
	import type { OpportunityWithBranches, Branch } from '#lib/types';
	import { formatMoneyVi } from '#lib/date';

	let {
		opp,
		idx,
		isCollapsed,
		hasSelection,
		chosenBranch,
		onToggleCollapse,
		onDeleteOpportunity
	}: {
		opp: OpportunityWithBranches;
		idx: number;
		isCollapsed: boolean;
		hasSelection: boolean;
		chosenBranch?: Branch;
		onToggleCollapse: (id: string) => void;
		onDeleteOpportunity: (id: string, title: string) => void;
	} = $props();
</script>

{#if isCollapsed}
	<!-- Compact 1-line bar (Hình 4) -->
	<div
		class="opp-compact-bar"
		id="opp-hub-{opp.id}"
		onclick={() => onToggleCollapse(opp.id)}
		onkeydown={(e) => {
			if (e.key === 'Enter') onToggleCollapse(opp.id);
		}}
		role="button"
		tabindex="0"
	>
		<div class="flex min-w-0 items-center gap-2.5">
			<span
				class="h-2 w-2 rounded-full {hasSelection
					? 'bg-amber-500'
					: 'bg-stone-400 dark:bg-zinc-600'}"
			></span>
			<span class="truncate text-sm font-bold text-stone-900 dark:text-zinc-100">{opp.title}</span>
		</div>

		<div class="flex flex-shrink-0 items-center gap-2 font-mono text-xs">
			<span class="pill-resource">⏱ {opp.time_minutes}p • 💵 {formatMoneyVi(opp.money_amount)}</span>
			{#if opp.other_text}
				<span
					class="rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 font-sans text-[11px] text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-200"
				>
					📌 {opp.other_text}
				</span>
			{/if}
			{#if chosenBranch}
				<span
					class="hidden font-sans text-xs font-semibold text-amber-700 sm:inline dark:text-amber-400"
				>
					✓ {chosenBranch.name}
				</span>
			{/if}
			<span
				class="px-1 text-xs text-stone-400 hover:text-stone-800 dark:text-zinc-500 dark:hover:text-zinc-200"
				>▼</span
			>
			<button
				type="button"
				onclick={(e) => {
					e.stopPropagation();
					onDeleteOpportunity(opp.id, opp.title);
				}}
				class="flex cursor-pointer items-center rounded-md p-1.5 text-xs text-stone-400 transition hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
				title="Xóa cơ hội này"
			>
				<Trash2 size={13} />
			</button>
			<form
				id="del-opp-form-{opp.id}"
				method="POST"
				action="?/deleteOpportunity"
				use:enhance
				class="hidden"
			>
				<input type="hidden" name="id" value={opp.id} />
			</form>
		</div>
	</div>
{:else}
	<!-- Full Expanded Unified Note (Hình 1) -->
	<div class="unified-note opp-parent-card" id="opp-hub-{opp.id}">
		<div class="note-badge-tag">#{idx + 1}</div>

		<div class="note-header-row">
			<div class="note-icon-circle">⏱</div>
			<div class="note-title-text">{opp.title}</div>
		</div>

		{#if opp.other_text}
			<div class="note-subtitle-text">"{opp.other_text}"</div>
		{/if}

		<div class="note-dashed-divider"></div>

		<div class="note-footer-row">
			<span class="pill-resource">{opp.time_minutes}p • {formatMoneyVi(opp.money_amount)}</span>
			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={() => onToggleCollapse(opp.id)}
					class="text-action-link mr-1 cursor-pointer text-xs hover:text-stone-900 dark:hover:text-zinc-200"
					title="Thu gọn"
				>
					▲
				</button>
				<button
					type="button"
					onclick={() => onDeleteOpportunity(opp.id, opp.title)}
					class="flex cursor-pointer items-center rounded-md p-1.5 text-xs text-stone-400 transition hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
					title="Xóa cơ hội này"
				>
					<Trash2 size={13} />
				</button>
				<form
					id="del-opp-form-{opp.id}"
					method="POST"
					action="?/deleteOpportunity"
					use:enhance
					class="hidden"
				>
					<input type="hidden" name="id" value={opp.id} />
				</form>
			</div>
		</div>
	</div>
{/if}
