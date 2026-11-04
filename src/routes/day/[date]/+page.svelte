<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import type { OpportunityWithBranches, Branch } from '#lib/types';
	import { formatDateVi, formatMoneyVi, formatTimeVi, addDays } from '#lib/date';
	import { confirmModal } from '#lib/confirm.svelte';
	import {
		ChevronLeft,
		ChevronRight,
		Trash2,
		Plus,
		Check,
		ArrowRight,
		Compass
	} from 'lucide-svelte';

	let { data, form }: PageProps = $props();

	let opportunities = $derived(data.dayData.opportunities);
	let currentDate = $derived(data.dayData.date);

	let prevDate = $derived(addDays(currentDate, -1));
	let nextDate = $derived(addDays(currentDate, 1));

	let totalOpportunities = $derived(opportunities.length);
	let totalBranches = $derived(opportunities.reduce((acc, o) => acc + o.branches.length, 0));

	async function handleDeleteOpportunity(id: string, title: string) {
		const ok = await confirmModal({
			title: 'Xóa cơ hội này?',
			message: `Cơ hội "${title}" và toàn bộ nhánh con sẽ bị xóa vĩnh viễn.`,
			confirmText: 'Xóa bỏ',
			variant: 'danger'
		});
		if (ok) {
			const delForm = document.getElementById(`del-opp-form-${id}`) as HTMLFormElement;
			delForm?.requestSubmit();
		}
	}

	async function handleDeleteBranch(id: string, name: string) {
		const ok = await confirmModal({
			title: 'Xóa nhánh này?',
			message: `Nhánh "${name}" sẽ bị xóa khỏi cơ hội.`,
			confirmText: 'Xóa bỏ',
			variant: 'danger'
		});
		if (ok) {
			const delForm = document.getElementById(`del-branch-${id}`) as HTMLFormElement;
			delForm?.requestSubmit();
		}
	}

	async function handleClearDay() {
		const ok = await confirmModal({
			title: 'Dọn sạch ngày?',
			message: `Bạn có chắc muốn xóa tất cả ${totalOpportunities} cơ hội của ngày ${currentDate}? Hành động này không thể hoàn tác.`,
			confirmText: 'Dọn sạch tất cả',
			variant: 'danger'
		});
		if (ok) {
			const delForm = document.getElementById('clear-day-page-form') as HTMLFormElement;
			delForm?.requestSubmit();
		}
	}

	// Optimistic selection map: oppId -> branchId (0ms instant UI update)
	let optimisticChosen = $state<Record<string, string>>({});

	let totalChosen = $derived(
		opportunities.filter((o) => {
			const optId = optimisticChosen[o.id];
			if (optId) return true;
			return o.branches.some((b) => b.is_chosen === 1);
		}).length
	);

	// Quick input state for new opportunity
	let newOppTitle = $state('');
	let newOppTime = $state<number>(90);
	let newOppMoney = $state<number>(50000);
	let newOppOtherText = $state('');

	// Collapsed state map: opp.id -> boolean (false = expanded, true = collapsed)
	let collapsedMap = $state<Record<string, boolean>>({});

	// In-place Add Branch card state: opp.id -> boolean
	let addingBranchOppId = $state<string | null>(null);

	function toggleCollapse(id: string) {
		collapsedMap[id] = !collapsedMap[id];
	}

	function setQuickTime(mins: number) {
		newOppTime = mins;
	}
	function setQuickMoney(amount: number) {
		newOppMoney = amount;
	}

	function openAddBranch(oppId: string) {
		addingBranchOppId = oppId;
	}

	function closeAddBranch() {
		addingBranchOppId = null;
	}

	// Layout calculator: places Chosen Branch at CENTER (Col 2), others at Col 1 & 3, leaving Col 2 empty on lower rows
	type SlotItem = { type: 'branch'; branch: Branch } | { type: 'add' };

	function getOpportunityLayout(opp: OpportunityWithBranches) {
		const chosenId = optimisticChosen[opp.id] ?? opp.branches.find((b) => b.is_chosen === 1)?.id;
		const chosenBranch = opp.branches.find((b) => b.id === chosenId);
		const otherBranches = opp.branches.filter((b) => b.id !== chosenId);

		if (!chosenBranch) {
			// No branch chosen yet: normal left-to-right filling
			const items: SlotItem[] = otherBranches.map((b) => ({ type: 'branch', branch: b }));
			items.push({ type: 'add' });
			return {
				hasChosen: false,
				chosenBranch: undefined,
				flatItems: items
			};
		}

		// Chosen branch exists: place chosen in Row 1 Col 2
		const sideItems: SlotItem[] = otherBranches.map((b) => ({ type: 'branch', branch: b }));
		sideItems.push({ type: 'add' });

		const row1Left = sideItems[0];
		const row1Right = sideItems[1];

		// Additional rows: left (Col 1) and right (Col 3), keeping Col 2 clear for the connecting wire
		const extraRows: { left?: SlotItem; right?: SlotItem }[] = [];
		for (let i = 2; i < sideItems.length; i += 2) {
			extraRows.push({
				left: sideItems[i],
				right: sideItems[i + 1]
			});
		}

		return {
			hasChosen: true,
			chosenBranch,
			row1Left,
			row1Right,
			extraRows
		};
	}
</script>

<!-- SNIPPET: Branch Card Item -->
{#snippet branchCard(branch: Branch, opp: OpportunityWithBranches, isChosen: boolean)}
	{@const remainTime = opp.time_minutes - branch.cost_time}
	{@const remainMoney = opp.money_amount - branch.cost_money}

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
				<span class="pill-resource font-mono"
					>{branch.cost_time}p • {formatMoneyVi(branch.cost_money)}</span
				>

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
						onclick={() => handleDeleteBranch(branch.id, branch.name)}
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
					// 0ms instant optimistic update
					optimisticChosen[opp.id] = branch.id;
					return async ({ update, result }) => {
						await update();
						if (result.type === 'failure') {
							delete optimisticChosen[opp.id];
						}
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
					<span class="pill-resource font-mono"
						>{branch.cost_time}p • {formatMoneyVi(branch.cost_money)}</span
					>
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
								handleDeleteBranch(branch.id, branch.name);
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
{/snippet}

<!-- SNIPPET: In-place Add Branch Card or Ghost '+' Card -->
{#snippet addBranchSlot(opp: OpportunityWithBranches)}
	{#if addingBranchOppId === opp.id}
		<!-- In-place White Form Card -->
		<div
			class="unified-note animate-in fade-in zoom-in-95 flex min-h-[140px] flex-col justify-between gap-2.5 rounded-2xl border-2 border-amber-500 bg-white p-4 shadow-md duration-150 dark:bg-zinc-800"
		>
			<form
				method="POST"
				action="?/addBranch"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						addingBranchOppId = null;
					};
				}}
				class="flex h-full flex-col justify-between gap-2"
			>
				<input type="hidden" name="opportunity_id" value={opp.id} />

				<div>
					<div class="mb-1 flex items-center justify-between">
						<span
							class="font-mono text-[10px] font-bold tracking-wider text-amber-700 uppercase dark:text-amber-400"
							>Nhánh mới</span
						>
						<button
							type="button"
							onclick={closeAddBranch}
							class="cursor-pointer text-xs font-bold text-stone-400 hover:text-stone-700 dark:text-zinc-500 dark:hover:text-zinc-200"
							title="Đóng"
						>
							✕
						</button>
					</div>

					<input
						type="text"
						name="name"
						required
						placeholder="Tên nhánh mới (vd: Đi bộ, Đọc sách...)"
						class="w-full rounded-lg border border-stone-300 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-900 placeholder-stone-400 focus:border-amber-600 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:bg-zinc-900"
					/>
				</div>

				<div class="grid grid-cols-2 gap-2 text-xs">
					<div>
						<label
							for="branch-time-{opp.id}"
							class="mb-0.5 block text-[10px] text-stone-500 dark:text-zinc-400">Thời gian</label
						>
						<div class="flex items-center gap-1">
							<input
								id="branch-time-{opp.id}"
								type="number"
								name="cost_time"
								min="0"
								step="5"
								defaultValue={opp.time_minutes}
								class="w-full rounded-md border border-stone-200 bg-stone-50 px-2 py-1 font-mono text-xs text-stone-900 focus:border-amber-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
							/>
							<span class="text-[10px] text-stone-400 dark:text-zinc-500">p</span>
						</div>
					</div>
					<div>
						<label
							for="branch-money-{opp.id}"
							class="mb-0.5 block text-[10px] text-stone-500 dark:text-zinc-400">Tiền tiêu</label
						>
						<div class="flex items-center gap-1">
							<input
								id="branch-money-{opp.id}"
								type="number"
								name="cost_money"
								min="0"
								step="1000"
								defaultValue={0}
								class="w-full rounded-md border border-stone-200 bg-stone-50 px-2 py-1 font-mono text-xs text-stone-900 focus:border-amber-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
							/>
							<span class="text-[10px] text-stone-400 dark:text-zinc-500">đ</span>
						</div>
					</div>
				</div>

				<div>
					<input
						type="text"
						name="outcome"
						placeholder="Cảm xúc / Kết quả nhận lại..."
						class="w-full rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-800 placeholder-stone-400 focus:border-amber-600 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:bg-zinc-900"
					/>
				</div>

				<div
					class="flex items-center justify-end gap-2 border-t border-stone-100 pt-1 dark:border-zinc-700/60"
				>
					<button
						type="button"
						onclick={closeAddBranch}
						class="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium text-stone-500 hover:text-stone-800 dark:text-zinc-400 dark:hover:text-zinc-200"
					>
						Hủy
					</button>
					<button
						type="submit"
						class="cursor-pointer rounded-lg bg-amber-600 px-3.5 py-1 text-xs font-semibold text-white shadow-xs transition hover:bg-amber-700"
					>
						Lưu nhánh
					</button>
				</div>
			</form>
		</div>
	{:else}
		<!-- Ghost Card '+' with dashed border -->
		<button
			type="button"
			onclick={() => openAddBranch(opp.id)}
			class="unified-note add-branch-ghost-card group flex h-full min-h-[120px] cursor-pointer items-center justify-center"
			title="Thêm nhánh"
		>
			<div
				class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-stone-300 text-xl font-bold text-stone-400 transition group-hover:scale-110 group-hover:border-amber-600 group-hover:text-amber-600 dark:border-zinc-700 dark:text-zinc-500"
			>
				+
			</div>
		</button>
	{/if}
{/snippet}

<!-- MAIN PAGE VIEW -->
<div class="mx-auto max-w-4xl space-y-6">
	<!-- Top Bar: Date Navigator & Status -->
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
				<span class="font-bold text-amber-700 dark:text-amber-400">{totalChosen}</span
				>/{totalOpportunities}
				<span class="mx-1 text-stone-400 dark:text-zinc-500">•</span>
				<span class="font-semibold text-stone-800 dark:text-zinc-200">{totalBranches}</span>
			</div>

			{#if totalOpportunities > 0}
				<button
					type="button"
					onclick={handleClearDay}
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

	{#if form?.message}
		<div
			class="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
		>
			<span>⚠️ {form.message}</span>
		</div>
	{/if}

	<!-- Creator Panel -->
	<section
		class="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-800/90"
	>
		<div class="mb-3 flex items-center justify-between">
			<h2
				class="flex items-center gap-1.5 text-xs font-bold tracking-wider text-stone-600 uppercase dark:text-zinc-300"
			>
				<Plus size={14} class="text-amber-600 dark:text-amber-400" />
				<span>Cơ Hội Mới</span>
			</h2>
		</div>

		<form
			method="POST"
			action="?/addOpportunity"
			use:enhance={() => {
				return async ({ update }) => {
					await update();
					newOppTitle = '';
					newOppOtherText = '';
				};
			}}
			class="space-y-3"
		>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-12">
				<div class="sm:col-span-5">
					<label
						for="opp-title"
						class="mb-1 block text-xs font-medium text-stone-600 dark:text-zinc-400">Bối cảnh</label
					>
					<input
						id="opp-title"
						type="text"
						name="title"
						bind:value={newOppTitle}
						required
						placeholder="vd: Sáng cuối tuần..."
						class="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-amber-600 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:bg-zinc-900"
					/>
				</div>

				<div class="sm:col-span-2">
					<label
						for="opp-time"
						class="mb-1 block text-xs font-medium text-stone-600 dark:text-zinc-400"
						>Thời gian</label
					>
					<div class="flex items-center gap-1">
						<input
							id="opp-time"
							type="number"
							name="time_minutes"
							bind:value={newOppTime}
							min="0"
							step="15"
							class="w-full rounded-xl border border-stone-300 bg-stone-50 px-2.5 py-2 font-mono text-sm text-stone-900 focus:border-amber-600 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-900"
						/>
						<span class="text-xs text-stone-500 dark:text-zinc-400">p</span>
					</div>
					<div class="mt-1 flex items-center gap-1 text-[10px]">
						<button
							type="button"
							onclick={() => setQuickTime(45)}
							class="cursor-pointer rounded bg-stone-100 px-1.5 py-0.5 text-stone-600 hover:text-amber-700 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:text-amber-400"
							>45p</button
						>
						<button
							type="button"
							onclick={() => setQuickTime(90)}
							class="cursor-pointer rounded bg-stone-100 px-1.5 py-0.5 text-stone-600 hover:text-amber-700 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:text-amber-400"
							>90p</button
						>
						<button
							type="button"
							onclick={() => setQuickTime(120)}
							class="cursor-pointer rounded bg-stone-100 px-1.5 py-0.5 text-stone-600 hover:text-amber-700 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:text-amber-400"
							>2h</button
						>
					</div>
				</div>

				<div class="sm:col-span-2">
					<label
						for="opp-money"
						class="mb-1 block text-xs font-medium text-stone-600 dark:text-zinc-400">Tiền</label
					>
					<div class="flex items-center gap-1">
						<input
							id="opp-money"
							type="number"
							name="money_amount"
							bind:value={newOppMoney}
							min="0"
							step="5000"
							class="w-full rounded-xl border border-stone-300 bg-stone-50 px-2.5 py-2 font-mono text-sm text-stone-900 focus:border-amber-600 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-900"
						/>
						<span class="text-xs text-stone-500 dark:text-zinc-400">đ</span>
					</div>
					<div class="mt-1 flex items-center gap-1 text-[10px]">
						<button
							type="button"
							onclick={() => setQuickMoney(0)}
							class="cursor-pointer rounded bg-stone-100 px-1.5 py-0.5 text-stone-600 hover:text-amber-700 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:text-amber-400"
							>0đ</button
						>
						<button
							type="button"
							onclick={() => setQuickMoney(50000)}
							class="cursor-pointer rounded bg-stone-100 px-1.5 py-0.5 text-stone-600 hover:text-amber-700 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:text-amber-400"
							>50k</button
						>
						<button
							type="button"
							onclick={() => setQuickMoney(100000)}
							class="cursor-pointer rounded bg-stone-100 px-1.5 py-0.5 text-stone-600 hover:text-amber-700 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:text-amber-400"
							>100k</button
						>
					</div>
				</div>

				<div class="sm:col-span-3">
					<label
						for="opp-other"
						class="mb-1 block text-xs font-medium text-stone-600 dark:text-zinc-400">Ghi chú</label
					>
					<input
						id="opp-other"
						type="text"
						name="other_text"
						bind:value={newOppOtherText}
						placeholder="vd: Trời mưa, mệt..."
						class="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-amber-600 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:bg-zinc-900"
					/>
				</div>
			</div>

			<div class="flex justify-end pt-1">
				<button
					type="submit"
					class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-stone-800 dark:bg-amber-600 dark:hover:bg-amber-700"
				>
					<Plus size={14} />
					<span>Ghim</span>
				</button>
			</div>
		</form>
	</section>

	<!-- Timeline Stream -->
	{#if opportunities.length === 0}
		<div
			class="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-10 text-center text-stone-400 dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-500"
		>
			<Compass size={36} class="mx-auto mb-2 text-amber-600/70 dark:text-amber-400/70" />
			<p class="font-serif text-sm font-medium text-stone-700 dark:text-zinc-300">
				Chưa có dữ liệu
			</p>
		</div>
	{:else}
		<div class="flex w-full flex-col items-center space-y-0">
			{#each opportunities as opp, idx (opp.id)}
				{@const isCollapsed = !!collapsedMap[opp.id]}
				{@const layout = getOpportunityLayout(opp)}
				{@const hasSelection = layout.hasChosen}
				{@const chosenBranch = layout.chosenBranch}

				<div class="flex w-full flex-col items-center" id="block-{opp.id}">
					<!-- Opportunity Card -->
					{#if isCollapsed}
						<!-- Compact 1-line bar (Hình 4) -->
						<div
							class="opp-compact-bar"
							id="opp-hub-{opp.id}"
							onclick={() => toggleCollapse(opp.id)}
							onkeydown={(e) => {
								if (e.key === 'Enter') toggleCollapse(opp.id);
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
								<span class="truncate text-sm font-bold text-stone-900 dark:text-zinc-100"
									>{opp.title}</span
								>
							</div>

							<div class="flex flex-shrink-0 items-center gap-2 font-mono text-xs">
								<span class="pill-resource"
									>⏱ {opp.time_minutes}p • 💵 {formatMoneyVi(opp.money_amount)}</span
								>
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
										handleDeleteOpportunity(opp.id, opp.title);
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
								<span class="pill-resource"
									>{opp.time_minutes}p • {formatMoneyVi(opp.money_amount)}</span
								>
								<div class="flex items-center gap-2">
									<button
										type="button"
										onclick={() => toggleCollapse(opp.id)}
										class="text-action-link mr-1 cursor-pointer text-xs hover:text-stone-900 dark:hover:text-zinc-200"
										title="Thu gọn"
									>
										▲
									</button>
									<button
										type="button"
										onclick={() => handleDeleteOpportunity(opp.id, opp.title)}
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

						<!-- TOP WIRE (Parent Opp -> Chosen Branch Center) -->
						{#if hasSelection}
							<div class="my-0.5 flex justify-center">
								<div class="wire-spine relative h-9 w-[3.5px] rounded-full bg-amber-600 shadow-xs">
									<span
										class="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-amber-600"
									></span>
									<span
										class="absolute -bottom-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-amber-600"
									></span>
								</div>
							</div>
						{:else}
							<div class="straight-stem-line my-2"></div>
						{/if}

						<!-- Branches Grid with CENTERED chosen branch -->
						<div
							class="branches-grid {hasSelection ? 'has-selection' : ''} w-full"
							id="grid-{opp.id}"
						>
							{#if layout.hasChosen}
								<!-- Row 1: Left | CHOSEN (Center) | Right -->
								<!-- Col 1: Left item -->
								<div class="col-start-1 h-full">
									{#if layout.row1Left}
										{#if layout.row1Left.type === 'branch'}
											{@render branchCard(layout.row1Left.branch, opp, false)}
										{:else}
											{@render addBranchSlot(opp)}
										{/if}
									{/if}
								</div>

								<!-- Col 2: CHOSEN BRANCH (Thực Tế - ALWAYS CENTER) -->
								<div class="col-start-2 h-full">
									{#if layout.chosenBranch}
										{@render branchCard(layout.chosenBranch, opp, true)}
									{/if}
								</div>

								<!-- Col 3: Right item -->
								<div class="col-start-3 h-full">
									{#if layout.row1Right}
										{#if layout.row1Right.type === 'branch'}
											{@render branchCard(layout.row1Right.branch, opp, false)}
										{:else}
											{@render addBranchSlot(opp)}
										{/if}
									{/if}
								</div>

								<!-- Extra Rows for Branches 4, 5, 6... (Center is an EMPTY Corridor with the vertical wire!) -->
								{#each layout.extraRows as extraRow}
									<!-- Left side (Col 1) -->
									<div class="col-start-1 h-full">
										{#if extraRow.left}
											{#if extraRow.left.type === 'branch'}
												{@render branchCard(extraRow.left.branch, opp, false)}
											{:else}
												{@render addBranchSlot(opp)}
											{/if}
										{/if}
									</div>

									<!-- Center Corridor (Col 2: Wire passes straight down through here!) -->
									<div
										class="pointer-events-none col-start-2 flex h-full min-h-[60px] items-center justify-center"
									>
										<div class="h-full w-[3.5px] rounded-full bg-amber-600 shadow-xs"></div>
									</div>

									<!-- Right side (Col 3) -->
									<div class="col-start-3 h-full">
										{#if extraRow.right}
											{#if extraRow.right.type === 'branch'}
												{@render branchCard(extraRow.right.branch, opp, false)}
											{:else}
												{@render addBranchSlot(opp)}
											{/if}
										{/if}
									</div>
								{/each}
							{:else}
								<!-- No chosen branch yet: standard sequential layout -->
								{#each layout.flatItems as item}
									<div class="h-full">
										{#if item.type === 'branch'}
											{@render branchCard(item.branch, opp, false)}
										{:else}
											{@render addBranchSlot(opp)}
										{/if}
									</div>
								{/each}
							{/if}
						</div>

						<!-- BOTTOM WIRE down to Next Opportunity (if not the last one) -->
						{#if idx < opportunities.length - 1}
							{#if hasSelection}
								<div class="my-0.5 flex justify-center">
									<div
										class="wire-spine relative h-9 w-[3.5px] rounded-full bg-amber-600 shadow-xs"
									>
										<span
											class="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-amber-600"
										></span>
										<span
											class="absolute -bottom-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-amber-600"
										></span>
									</div>
								</div>
							{:else}
								<div class="straight-stem-line my-3"></div>
							{/if}
						{/if}
					{/if}

					<!-- Spacer between blocks when collapsed -->
					{#if isCollapsed && idx < opportunities.length - 1}
						<div class="straight-stem-line my-3"></div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
