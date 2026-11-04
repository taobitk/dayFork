<script lang="ts">
	import { enhance } from '$app/forms';
	import { Check, Trash2 } from 'lucide-svelte';
	import type { Branch, OpportunityWithBranches } from '#lib/types';
	import { formatMoneyVi } from '#lib/date';

	let {
		branch,
		opp,
		isChosen,
		onChoose,
		onDeleteBranch
	}: {
		branch: Branch;
		opp: OpportunityWithBranches;
		isChosen: boolean;
		onChoose: (branchId: string) => void;
		onDeleteBranch: (id: string, name: string) => void;
	} = $props();

	let remainTime = $derived(opp.time_minutes - branch.cost_time);
	let remainMoney = $derived(opp.money_amount - branch.cost_money);
</script>

{#if isChosen}
	<!-- Chosen Branch Card (Hình 3: THỰC TẾ) -->
	<div class="unified-note branch-card chosen h-full" id="branch-{branch.id}">
		<div class="note-badge-tag">THỰC TẾ</div>

		<div class="note-header-row">
			<div class="note-icon-circle flex items-center justify-center">
				<Check size={13} strokeWidth={3} />
			</div>
			<div class="note-title-text">{branch.name}</div>
		</div>

		{#if branch.outcome}
			<div class="note-subtitle-text">"{branch.outcome}"</div>
		{/if}

		<div class="note-dashed-divider"></div>

		<div class="note-footer-row">
			<span class="pill-resource font-mono">{branch.cost_time}p • {formatMoneyVi(branch.cost_money)}</span>

			<div class="flex items-center gap-2">
				{#if remainTime > 0 || remainMoney > 0}
					<span class="pill-surplus font-mono">
						{#if remainMoney > 0}+{formatMoneyVi(remainMoney)}{/if}
						{#if remainMoney > 0 && remainTime > 0}
							•
						{/if}
						{#if remainTime > 0}+{remainTime}p{/if}
					</span>
				{/if}

				<button
					type="button"
					onclick={() => onDeleteBranch(branch.id, branch.name)}
					class="ml-1 flex cursor-pointer items-center rounded-md p-1.5 text-xs text-stone-400 transition hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
					title="Xóa nhánh"
				>
					<Trash2 size={13} />
				</button>
				<form
					id="del-branch-{branch.id}"
					method="POST"
					action="?/deleteBranch"
					use:enhance
					class="hidden"
				>
					<input type="hidden" name="id" value={branch.id} />
				</form>
			</div>
		</div>
	</div>
{:else}
	<!-- Unchosen Branch Card -->
	<div class="unified-note branch-card h-full" id="branch-{branch.id}">
		<form
			method="POST"
			action="?/chooseBranch"
			use:enhance={() => {
				onChoose(branch.id);
				return async ({ update, result }) => {
					await update();
				};
			}}
			class="flex flex-1 flex-col justify-between gap-2"
		>
			<input type="hidden" name="opportunity_id" value={opp.id} />
			<input type="hidden" name="branch_id" value={branch.id} />

			<div>
				<div class="note-header-row">
					<button
						type="submit"
						class="note-icon-circle cursor-pointer transition hover:border-amber-600"
						title="Bấm để chọn nhánh này"
					></button>
					<button
						type="submit"
						class="note-title-text cursor-pointer text-left transition hover:text-amber-700"
					>
						{branch.name}
					</button>
				</div>

				{#if branch.outcome}
					<div class="note-subtitle-text">"{branch.outcome}"</div>
				{/if}
			</div>

			<div class="note-dashed-divider"></div>

			<div class="note-footer-row">
				<span class="pill-resource font-mono">{branch.cost_time}p • {formatMoneyVi(branch.cost_money)}</span>
				<div class="flex items-center gap-2">
					<button
						type="submit"
						class="text-action-link cursor-pointer font-semibold hover:text-amber-700"
					>
						Chọn &gt;
					</button>
					<button
						type="button"
						onclick={(e) => {
							e.stopPropagation();
							onDeleteBranch(branch.id, branch.name);
						}}
						class="ml-1 flex cursor-pointer items-center rounded-md p-1.5 text-xs text-stone-400 transition hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
						title="Xóa nhánh"
					>
						<Trash2 size={13} />
					</button>
				</div>
			</div>
		</form>

		<form
			id="del-branch-{branch.id}"
			method="POST"
			action="?/deleteBranch"
			use:enhance
			class="hidden"
		>
			<input type="hidden" name="id" value={branch.id} />
		</form>
	</div>
{/if}
