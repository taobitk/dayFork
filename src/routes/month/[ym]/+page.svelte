<script lang="ts">
	import type { PageProps } from './$types';
	import { formatMoneyVi, formatTimeVi } from '#lib/date';

	let { data }: PageProps = $props();

	let stats = $derived(data.stats);
	let monthRange = $derived(data.monthRange);
	let ym = $derived(data.ym);

	let [year, month] = $derived(ym.split('-').map(Number));

	let prevYm = $derived.by(() => {
		const d = new Date(year, month - 2, 1);
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		return `${y}-${m}`;
	});

	let nextYm = $derived.by(() => {
		const d = new Date(year, month, 1);
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		return `${y}-${m}`;
	});

	let savedTime = $derived(Math.max(0, stats.totalTimeAvailable - stats.totalTimeSpent));
	let savedMoney = $derived(Math.max(0, stats.totalMoneyAvailable - stats.totalMoneySpent));

	// First day of month offset for calendar grid (0 = Sun, 1 = Mon ... 6 = Sat)
	let firstDayOffset = $derived.by(() => {
		const firstDate = new Date(year, month - 1, 1);
		const day = firstDate.getDay();
		// Convert to Monday start: Mon=0, Tue=1 ... Sun=6
		return day === 0 ? 6 : day - 1;
	});
</script>

<div class="mx-auto max-w-5xl space-y-6">
	<!-- Month Navigator -->
	<div
		class="flex flex-col justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
	>
		<div class="flex items-center gap-3">
			<a
				href="/month/{prevYm}"
				class="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 font-bold text-stone-700 transition hover:bg-stone-200 hover:text-stone-900"
				title="Tháng trước"
			>
				←
			</a>
			<div>
				<h1 class="font-serif text-xl font-bold text-stone-900">
					Tháng {month}/{year}
				</h1>
				<p class="mt-0.5 text-xs text-stone-500">Tổng quan diễn biến toàn tháng</p>
			</div>
			<a
				href="/month/{nextYm}"
				class="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 font-bold text-stone-700 transition hover:bg-stone-200 hover:text-stone-900"
				title="Tháng sau"
			>
				→
			</a>
		</div>

		<div
			class="rounded-xl border border-stone-200 bg-stone-100 px-3.5 py-2 font-mono text-xs text-stone-700"
		>
			{stats.totalOpportunities} cơ hội ghi nhận • {stats.totalDays} ngày có hoạt động
		</div>
	</div>

	<!-- Month KPIs -->
	<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
		<div class="space-y-1 rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
			<span class="flex items-center gap-1.5 text-xs font-semibold text-stone-600">
				<span>🟢</span> Trùng Hiệu Quả
			</span>
			<div class="font-mono text-2xl font-bold text-emerald-700">
				{stats.bestMatchRate}%
			</div>
			<p class="font-mono text-[11px] text-stone-500">{stats.bestMatchCount} lựa chọn</p>
		</div>

		<div class="space-y-1 rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
			<span class="flex items-center gap-1.5 text-xs font-semibold text-stone-600">
				<span>🔵</span> Trùng Thả Lỏng
			</span>
			<div class="font-mono text-2xl font-bold text-sky-700">
				{stats.comfortMatchRate}%
			</div>
			<p class="font-mono text-[11px] text-stone-500">{stats.comfortMatchCount} lựa chọn</p>
		</div>

		<div class="space-y-1 rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
			<span class="flex items-center gap-1.5 text-xs font-semibold text-stone-600">
				<span>⏱</span> Thời Gian Dư Dôi
			</span>
			<div class="font-mono text-xl font-bold text-stone-900">
				{formatTimeVi(savedTime)}
			</div>
			<p class="font-mono text-[11px] text-stone-500">
				Trên tổng {formatTimeVi(stats.totalTimeAvailable)}
			</p>
		</div>

		<div class="space-y-1 rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
			<span class="flex items-center gap-1.5 text-xs font-semibold text-stone-600">
				<span>💵</span> Tiền Dôi Dư
			</span>
			<div class="font-mono text-xl font-bold text-stone-900">
				{formatMoneyVi(savedMoney)}
			</div>
			<p class="font-mono text-[11px] text-stone-500">
				Trên tổng {formatMoneyVi(stats.totalMoneyAvailable)}
			</p>
		</div>
	</div>

	<!-- Calendar Heatmap Grid -->
	<section class="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
		<h2
			class="flex items-center gap-2 font-mono text-xs font-bold tracking-wider text-stone-600 uppercase"
		>
			<span>🗓</span> Lịch Hoạt Động Trong Tháng
		</h2>

		<!-- Day of week headers -->
		<div
			class="grid grid-cols-7 gap-2 border-b border-stone-200 pb-1 text-center text-xs font-bold text-stone-500"
		>
			<span>T2</span>
			<span>T3</span>
			<span>T4</span>
			<span>T5</span>
			<span>T6</span>
			<span>T7</span>
			<span>CN</span>
		</div>

		<!-- Grid cells -->
		<div class="grid grid-cols-7 gap-2">
			<!-- Empty leading cells for weekday offset -->
			{#each Array(firstDayOffset) as _}
				<div class="min-h-[70px] rounded-xl border border-stone-100 bg-stone-50/50"></div>
			{/each}

			<!-- Days of month -->
			{#each monthRange.days as d}
				{@const dayData = stats.dailyBreakdown.find(
					(item: import('#lib/types').DailySummaryItem) => item.date === d
				)}
				{@const hasData = dayData && dayData.opportunityCount > 0}
				<a
					href="/day/{d}"
					class="flex min-h-[70px] flex-col justify-between rounded-xl border p-2 transition {hasData
						? 'border-amber-200 bg-amber-50/50 hover:border-amber-400 hover:bg-amber-50/80'
						: 'border-stone-200 bg-stone-50 text-stone-400 hover:border-stone-300'}"
				>
					<div class="flex items-center justify-between font-mono text-xs">
						<span class="font-bold {hasData ? 'text-amber-800' : 'text-stone-400'}">
							{d.slice(8)}
						</span>
						{#if hasData}
							<span class="h-1.5 w-1.5 rounded-full bg-amber-600"></span>
						{/if}
					</div>

					{#if hasData}
						<div class="font-mono text-[10px] leading-tight text-stone-600">
							<div>{dayData.opportunityCount} cơ hội</div>
						</div>
					{/if}
				</a>
			{/each}
		</div>
	</section>
</div>
