<script lang="ts">
	import { enhance } from '$app/forms';
	import type { OpportunityWithBranches } from '#lib/types';

	let {
		opp,
		isAdding,
		onOpen,
		onClose
	}: {
		opp: OpportunityWithBranches;
		isAdding: boolean;
		onOpen: () => void;
		onClose: () => void;
	} = $props();
</script>

{#if isAdding}
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
					onClose();
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
						onclick={onClose}
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
					onclick={onClose}
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
		onclick={onOpen}
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
