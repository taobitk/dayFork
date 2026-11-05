<script lang="ts">
	import { enhance } from '$app/forms';
	import { Check, Trash2, Pencil } from 'lucide-svelte';
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

	let isEditing = $state(false);
	let editName = $state('');
	let editCostTime = $state(0);
	let editCostMoney = $state('');
	let editOutcome = $state('');
	let isSubmitting = $state(false);

	function startEditing() {
		editName = branch.name;
		editCostTime = branch.cost_time;
		editCostMoney = branch.cost_money > 0 ? branch.cost_money.toLocaleString('vi-VN') : '';
		editOutcome = branch.outcome || '';
		isEditing = true;
	}

	function cancelEditing() {
		isEditing = false;
	}

	function handleCostMoneyInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const raw = input.value.replace(/\D/g, '');
		editCostMoney = raw ? Number(raw).toLocaleString('vi-VN') : '';
	}
</script>

{#if isEditing}
	<!-- Inline Edit Form -->
	<form
		method="POST"
		action="?/updateBranch"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ update, result }) => {
				isSubmitting = false;
				if (result.type === 'success') {
					isEditing = false;
				}
				await update();
			};
		}}
		class="unified-note branch-card h-full p-4 border-2 border-amber-400 dark:border-amber-600 space-y-3 bg-amber-50/40 dark:bg-amber-950/20"
		id="branch-edit-{branch.id}"
	>
		<input type="hidden" name="id" value={branch.id} />
		<div class="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
			<span class="flex items-center gap-1.5"><Pencil size={13} /> Sửa nhánh rẽ</span>
		</div>

		<div>
			<label class="block text-xs font-semibold text-stone-700 dark:text-zinc-300 mb-1" for="edit-bname-{branch.id}">Tên nhánh</label>
			<input
				id="edit-bname-{branch.id}"
				type="text"
				name="name"
				bind:value={editName}
				required
				class="w-full rounded-md border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
			/>
		</div>

		<div class="grid grid-cols-2 gap-2">
			<div>
				<label class="block text-xs font-semibold text-stone-700 dark:text-zinc-300 mb-1" for="edit-btime-{branch.id}">Thời gian (p)</label>
				<input
					id="edit-btime-{branch.id}"
					type="number"
					name="cost_time"
					bind:value={editCostTime}
					min="0"
					required
					class="w-full rounded-md border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
				/>
			</div>
			<div>
				<label class="block text-xs font-semibold text-stone-700 dark:text-zinc-300 mb-1" for="edit-bmoney-{branch.id}">Tiền (đ)</label>
				<input
					id="edit-bmoney-{branch.id}"
					type="text"
					name="cost_money"
					value={editCostMoney}
					oninput={handleCostMoneyInput}
					class="w-full rounded-md border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
				/>
			</div>
		</div>

		<div>
			<label class="block text-xs font-semibold text-stone-700 dark:text-zinc-300 mb-1" for="edit-boutcome-{branch.id}">Cảm xúc / Kết quả</label>
			<input
				id="edit-boutcome-{branch.id}"
				type="text"
				name="outcome"
				bind:value={editOutcome}
				placeholder="vd: Hài lòng, thoải mái..."
				class="w-full rounded-md border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
			/>
		</div>

		<div class="flex items-center justify-end gap-2 pt-1">
			<button
				type="button"
				onclick={cancelEditing}
				disabled={isSubmitting}
				class="rounded-md border border-stone-300 dark:border-zinc-700 px-3 py-1 text-xs font-medium text-stone-600 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 transition"
			>
				Hủy
			</button>
			<button
				type="submit"
				disabled={isSubmitting}
				class="rounded-md bg-amber-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-amber-700 disabled:opacity-50 transition"
			>
				{isSubmitting ? 'Đang lưu...' : 'Lưu'}
			</button>
		</div>
	</form>
{:else if isChosen}
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
					onclick={startEditing}
					class="ml-1 flex cursor-pointer items-center rounded-md p-1.5 text-xs text-stone-400 transition hover:bg-amber-50 hover:text-amber-600 dark:text-zinc-500 dark:hover:bg-amber-950/40 dark:hover:text-amber-400"
					title="Sửa nhánh"
				>
					<Pencil size={13} />
				</button>
				<button
					type="button"
					onclick={() => onDeleteBranch(branch.id, branch.name)}
					class="flex cursor-pointer items-center rounded-md p-1.5 text-xs text-stone-400 transition hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
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
							startEditing();
						}}
						class="ml-1 flex cursor-pointer items-center rounded-md p-1.5 text-xs text-stone-400 transition hover:bg-amber-50 hover:text-amber-600 dark:text-zinc-500 dark:hover:bg-amber-950/40 dark:hover:text-amber-400"
						title="Sửa nhánh"
					>
						<Pencil size={13} />
					</button>
					<button
						type="button"
						onclick={(e) => {
							e.stopPropagation();
							onDeleteBranch(branch.id, branch.name);
						}}
						class="flex cursor-pointer items-center rounded-md p-1.5 text-xs text-stone-400 transition hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
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
