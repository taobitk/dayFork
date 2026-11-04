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

<div class="space-y-6 max-w-5xl mx-auto">
	<!-- Month Navigator -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
		<div class="flex items-center gap-3">
			<a
				href="/month/{prevYm}"
				class="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 hover:text-stone-900 transition font-bold"
				title="Tháng trước"
			>
				←
			</a>
			<div>
				<h1 class="text-xl font-bold text-stone-900 font-serif">
					Tháng {month}/{year}
				</h1>
				<p class="text-xs text-stone-500 mt-0.5">Tổng quan diễn biến toàn tháng</p>
			</div>
			<a
				href="/month/{nextYm}"
				class="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 hover:text-stone-900 transition font-bold"
				title="Tháng sau"
			>
				→
			</a>
		</div>

		<div class="text-xs bg-stone-100 px-3.5 py-2 rounded-xl border border-stone-200 text-stone-700 font-mono">
			{stats.totalOpportunities} cơ hội ghi nhận • {stats.totalDays} ngày có hoạt động
		</div>
	</div>

	<!-- Month KPIs -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="p-4 rounded-2xl bg-white border border-stone-200 space-y-1 shadow-xs">
			<span class="text-xs font-semibold text-stone-600 flex items-center gap-1.5">
				<span>🟢</span> Trùng Hiệu Quả
			</span>
			<div class="text-2xl font-bold text-emerald-700 font-mono">
				{stats.bestMatchRate}%
			</div>
			<p class="text-[11px] text-stone-500 font-mono">{stats.bestMatchCount} lựa chọn</p>
		</div>

		<div class="p-4 rounded-2xl bg-white border border-stone-200 space-y-1 shadow-xs">
			<span class="text-xs font-semibold text-stone-600 flex items-center gap-1.5">
				<span>🔵</span> Trùng Thả Lỏng
			</span>
			<div class="text-2xl font-bold text-sky-700 font-mono">
				{stats.comfortMatchRate}%
			</div>
			<p class="text-[11px] text-stone-500 font-mono">{stats.comfortMatchCount} lựa chọn</p>
		</div>

		<div class="p-4 rounded-2xl bg-white border border-stone-200 space-y-1 shadow-xs">
			<span class="text-xs font-semibold text-stone-600 flex items-center gap-1.5">
				<span>⏱</span> Thời Gian Dư Dôi
			</span>
			<div class="text-xl font-bold text-stone-900 font-mono">
				{formatTimeVi(savedTime)}
			</div>
			<p class="text-[11px] text-stone-500 font-mono">Trên tổng {formatTimeVi(stats.totalTimeAvailable)}</p>
		</div>

		<div class="p-4 rounded-2xl bg-white border border-stone-200 space-y-1 shadow-xs">
			<span class="text-xs font-semibold text-stone-600 flex items-center gap-1.5">
				<span>💵</span> Tiền Dôi Dư
			</span>
			<div class="text-xl font-bold text-stone-900 font-mono">
				{formatMoneyVi(savedMoney)}
			</div>
			<p class="text-[11px] text-stone-500 font-mono">Trên tổng {formatMoneyVi(stats.totalMoneyAvailable)}</p>
		</div>
	</div>

	<!-- Calendar Heatmap Grid -->
	<section class="bg-white rounded-2xl border border-stone-200 p-5 space-y-4 shadow-xs">
		<h2 class="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-2 font-mono">
			<span>🗓</span> Lịch Hoạt Động Trong Tháng
		</h2>

		<!-- Day of week headers -->
		<div class="grid grid-cols-7 gap-2 text-center text-xs font-bold text-stone-500 pb-1 border-b border-stone-200">
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
				<div class="min-h-[70px] rounded-xl bg-stone-50/50 border border-stone-100"></div>
			{/each}

			<!-- Days of month -->
			{#each monthRange.days as d}
				{@const dayData = stats.dailyBreakdown.find((item: import('#lib/types').DailySummaryItem) => item.date === d)}
				{@const hasData = dayData && dayData.opportunityCount > 0}
				<a
					href="/day/{d}"
					class="min-h-[70px] p-2 rounded-xl border transition flex flex-col justify-between {hasData
						? 'bg-amber-50/50 border-amber-200 hover:border-amber-400 hover:bg-amber-50/80'
						: 'bg-stone-50 border-stone-200 text-stone-400 hover:border-stone-300'}"
				>
					<div class="flex items-center justify-between text-xs font-mono">
						<span class="font-bold {hasData ? 'text-amber-800' : 'text-stone-400'}">
							{d.slice(8)}
						</span>
						{#if hasData}
							<span class="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
						{/if}
					</div>

					{#if hasData}
						<div class="text-[10px] text-stone-600 font-mono leading-tight">
							<div>{dayData.opportunityCount} cơ hội</div>
						</div>
					{/if}
				</a>
			{/each}
		</div>
	</section>
</div>
