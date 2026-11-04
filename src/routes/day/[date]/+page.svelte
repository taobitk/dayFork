<script lang="ts">
	import type { PageProps } from './$types';
	import type { OpportunityWithBranches, SlotItem, OpportunityLayout } from '#lib/types';
	import { addDays } from '#lib/date';
	import { confirmModal } from '#lib/confirm.svelte';
	import { Compass } from 'lucide-svelte';

	import MapTopBar from '#lib/components/map/MapTopBar.svelte';
	import OpportunityForm from '#lib/components/map/OpportunityForm.svelte';
	import OpportunityCard from '#lib/components/map/OpportunityCard.svelte';
	import BranchesGrid from '#lib/components/map/BranchesGrid.svelte';

	let { data, form }: PageProps = $props();

	let opportunities = $derived(data.dayData.opportunities);
	let currentDate = $derived(data.dayData.date);

	let prevDate = $derived(addDays(currentDate, -1));
	let nextDate = $derived(addDays(currentDate, 1));

	let totalOpportunities = $derived(opportunities.length);
	let totalBranches = $derived(opportunities.reduce((acc, o) => acc + o.branches.length, 0));

	// Optimistic selection map: oppId -> branchId (0ms instant UI update)
	let optimisticChosen = $state<Record<string, string>>({});

	let totalChosen = $derived(
		opportunities.filter((o) => {
			const optId = optimisticChosen[o.id];
			if (optId) return true;
			return o.branches.some((b) => b.is_chosen === 1);
		}).length
	);

	// Collapsed state map: opp.id -> boolean (false = expanded, true = collapsed)
	let collapsedMap = $state<Record<string, boolean>>({});

	// In-place Add Branch card state: opp.id -> boolean
	let addingBranchOppId = $state<string | null>(null);

	function toggleCollapse(id: string) {
		collapsedMap[id] = !collapsedMap[id];
	}

	function openAddBranch(oppId: string) {
		addingBranchOppId = oppId;
	}

	function closeAddBranch() {
		addingBranchOppId = null;
	}

	function handleChooseBranch(oppId: string, branchId: string) {
		optimisticChosen[oppId] = branchId;
	}

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

	// Layout calculator: places Chosen Branch at CENTER (Col 2), others at Col 1 & 3
	function getOpportunityLayout(opp: OpportunityWithBranches): OpportunityLayout {
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

<div class="mx-auto max-w-4xl space-y-6">
	<!-- Top Bar -->
	<MapTopBar
		{currentDate}
		{prevDate}
		{nextDate}
		{totalChosen}
		{totalOpportunities}
		{totalBranches}
		onClearDay={handleClearDay}
	/>

	{#if form?.message}
		<div
			class="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
		>
			<span>⚠️ {form.message}</span>
		</div>
	{/if}

	<!-- Creator Panel -->
	<OpportunityForm />

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
					<!-- Opportunity Card (Compact bar or Expanded Hub) -->
					<OpportunityCard
						{opp}
						{idx}
						{isCollapsed}
						{hasSelection}
						{chosenBranch}
						onToggleCollapse={toggleCollapse}
						onDeleteOpportunity={handleDeleteOpportunity}
					/>

					{#if !isCollapsed}
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
						<BranchesGrid
							{opp}
							{layout}
							{addingBranchOppId}
							onOpenAdd={openAddBranch}
							onCloseAdd={closeAddBranch}
							onChoose={(branchId) => handleChooseBranch(opp.id, branchId)}
							onDeleteBranch={handleDeleteBranch}
						/>

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
