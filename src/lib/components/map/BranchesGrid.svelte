<script lang="ts">
	import type { Branch, OpportunityWithBranches, SlotItem, OpportunityLayout } from '#lib/types';
	import BranchCard from './BranchCard.svelte';
	import AddBranchCard from './AddBranchCard.svelte';

	let {
		opp,
		layout,
		addingBranchOppId,
		onOpenAdd,
		onCloseAdd,
		onChoose,
		onDeleteBranch
	}: {
		opp: OpportunityWithBranches;
		layout: OpportunityLayout;
		addingBranchOppId: string | null;
		onOpenAdd: (oppId: string) => void;
		onCloseAdd: () => void;
		onChoose: (branchId: string) => void;
		onDeleteBranch: (id: string, name: string) => void;
	} = $props();
</script>

{#snippet slotRender(item: SlotItem | undefined)}
	{#if item}
		{#if item.type === 'branch'}
			<BranchCard
				branch={item.branch}
				{opp}
				isChosen={false}
				{onChoose}
				{onDeleteBranch}
			/>
		{:else}
			<AddBranchCard
				{opp}
				isAdding={addingBranchOppId === opp.id}
				onOpen={() => onOpenAdd(opp.id)}
				onClose={onCloseAdd}
			/>
		{/if}
	{/if}
{/snippet}

<!-- Branches Grid with CENTERED chosen branch -->
<div class="branches-grid {layout.hasChosen ? 'has-selection' : ''} w-full" id="grid-{opp.id}">
	{#if layout.hasChosen}
		<!-- Row 1: Left | CHOSEN (Center) | Right -->
		<!-- Col 1: Left item -->
		<div class="col-start-1 h-full">
			{@render slotRender(layout.row1Left)}
		</div>

		<!-- Col 2: CHOSEN BRANCH (Thực Tế - ALWAYS CENTER) -->
		<div class="col-start-2 h-full">
			{#if layout.chosenBranch}
				<BranchCard
					branch={layout.chosenBranch}
					{opp}
					isChosen={true}
					{onChoose}
					{onDeleteBranch}
				/>
			{/if}
		</div>

		<!-- Col 3: Right item -->
		<div class="col-start-3 h-full">
			{@render slotRender(layout.row1Right)}
		</div>

		<!-- Extra Rows for Branches 4, 5, 6... (Center is an EMPTY Corridor with the vertical wire!) -->
		{#if layout.extraRows}
			{#each layout.extraRows as extraRow}
				<!-- Left side (Col 1) -->
				<div class="col-start-1 h-full">
					{@render slotRender(extraRow.left)}
				</div>

				<!-- Center Corridor (Col 2: Wire passes straight down through here!) -->
				<div
					class="pointer-events-none col-start-2 flex h-full min-h-[60px] items-center justify-center"
				>
					<div class="h-full w-[3.5px] rounded-full bg-amber-600 shadow-xs"></div>
				</div>

				<!-- Right side (Col 3) -->
				<div class="col-start-3 h-full">
					{@render slotRender(extraRow.right)}
				</div>
			{/each}
		{/if}
	{:else if layout.flatItems}
		<!-- No chosen branch yet: standard sequential layout -->
		{#each layout.flatItems as item}
			<div class="h-full">
				{@render slotRender(item)}
			</div>
		{/each}
	{/if}
</div>
