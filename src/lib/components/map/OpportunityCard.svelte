<script lang="ts">
	import { enhance } from '$app/forms';
	import { Trash2, Pencil } from 'lucide-svelte';
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

	let isEditing = $state(false);
	let editTitle = $state('');
	let editTime = $state(0);
	let editMoney = $state('');
	let editOther = $state('');
	let isSubmitting = $state(false);

	function startEditing() {
		editTitle = opp.title;
		editTime = opp.time_minutes;
		editMoney = opp.money_amount > 0 ? opp.money_amount.toLocaleString('vi-VN') : '';
		editOther = opp.other_text || '';
		isEditing = true;
	}

	function cancelEditing() {
		isEditing = false;
	}

	function handleMoneyInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const raw = input.value.replace(/\D/g, '');
		editMoney = raw ? Number(raw).toLocaleString('vi-VN') : '';
	}
</script>

{#if isEditing}
	<!-- Inline Edit Form -->
	<form
		method="POST"
		action="?/updateOpportunity"
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
		class="unified-note p-4 border-2 border-amber-400 dark:border-amber-600 space-y-3 bg-amber-50/40 dark:bg-amber-950/20"
		id="opp-edit-{opp.id}"
	>
		<input type="hidden" name="id" value={opp.id} />
		<div class="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
			<span class="flex items-center gap-1.5"><Pencil size={13} /> Sửa cơ hội #{idx + 1}</span>
		</div>

		<div>
			<label class="block text-xs font-semibold text-stone-700 dark:text-zinc-300 mb-1" for="edit-title-{opp.id}">Bối cảnh</label>
			<input
				id="edit-title-{opp.id}"
				type="text"
				name="title"
				bind:value={editTitle}
				required
				class="w-full rounded-md border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
			/>
		</div>

		<div class="grid grid-cols-2 gap-2">
			<div>
				<label class="block text-xs font-semibold text-stone-700 dark:text-zinc-300 mb-1" for="edit-time-{opp.id}">Thời gian (phút)</label>
				<input
					id="edit-time-{opp.id}"
					type="number"
					name="time_minutes"
					bind:value={editTime}
					min="0"
					required
					class="w-full rounded-md border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
				/>
			</div>
			<div>
				<label class="block text-xs font-semibold text-stone-700 dark:text-zinc-300 mb-1" for="edit-money-{opp.id}">Tiền (đ)</label>
				<input
					id="edit-money-{opp.id}"
					type="text"
					name="money_amount"
					value={editMoney}
					oninput={handleMoneyInput}
					class="w-full rounded-md border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
				/>
			</div>
		</div>

		<div>
			<label class="block text-xs font-semibold text-stone-700 dark:text-zinc-300 mb-1" for="edit-other-{opp.id}">Ghi chú thêm</label>
			<input
				id="edit-other-{opp.id}"
				type="text"
				name="other_text"
				bind:value={editOther}
				placeholder="vd: Trời mưa, mệt..."
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
{:else if isCollapsed}
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
					startEditing();
				}}
				class="flex cursor-pointer items-center rounded-md p-1.5 text-xs text-stone-400 transition hover:bg-amber-50 hover:text-amber-600 dark:text-zinc-500 dark:hover:bg-amber-950/40 dark:hover:text-amber-400"
				title="Sửa cơ hội này"
			>
				<Pencil size={13} />
			</button>
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
					onclick={startEditing}
					class="flex cursor-pointer items-center rounded-md p-1.5 text-xs text-stone-400 transition hover:bg-amber-50 hover:text-amber-600 dark:text-zinc-500 dark:hover:bg-amber-950/40 dark:hover:text-amber-400"
					title="Sửa cơ hội này"
				>
					<Pencil size={13} />
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
