<script lang="ts">
	import { enhance } from '$app/forms';
	import { Plus } from 'lucide-svelte';

	let newOppTitle = $state('');
	let newOppTime = $state<number>(90);
	let newOppMoney = $state<number>(50000);
	let newOppOtherText = $state('');

	function setQuickTime(mins: number) {
		newOppTime = mins;
	}
	function setQuickMoney(amount: number) {
		newOppMoney = amount;
	}
</script>

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
