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

<div class="space-y-6">
	<!-- Month Navigator -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
		<div class="flex items-center gap-3">
			<a
				href="/month/{prevYm}"
				class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition"
				title="Tháng trước"
			>
				←
			</a>
			<div>
				<h1 class="text-xl font-bold text-slate-100">
					Tháng {month}/{year}
				</h1>
				<p class="text-xs text-slate-400 mt-0.5">Tổng quan diễn biến toàn tháng</p>
			</div>
			<a
				href="/month/{nextYm}"
				class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition"
				title="Tháng sau"
			>
				→
			</a>
		</div>

		<div class="text-xs bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60 text-slate-300 font-mono">
			{stats.totalOpportunities} cơ hội ghi nhận • {stats.totalDays} ngày có hoạt động
		</div>
	</div>

	<!-- Month KPIs -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
			<span class="text-xs font-medium text-slate-400">🎯 Trùng Đường Tối Ưu</span>
			<div class="text-2xl font-bold text-emerald-400 font-mono">
				{stats.bestMatchRate}%
			</div>
			<p class="text-[11px] text-slate-500">{stats.bestMatchCount} lựa chọn</p>
		</div>

		<div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
			<span class="text-xs font-medium text-slate-400">☕ Trùng Đường Thoải Mái</span>
			<div class="text-2xl font-bold text-sky-400 font-mono">
				{stats.comfortMatchRate}%
			</div>
			<p class="text-[11px] text-slate-500">{stats.comfortMatchCount} lựa chọn</p>
		</div>

		<div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
			<span class="text-xs font-medium text-slate-400">⏱ Thời Gian Dư Dôi</span>
			<div class="text-xl font-bold text-slate-200 font-mono">
				{formatTimeVi(savedTime)}
			</div>
			<p class="text-[11px] text-slate-500">Trên tổng {formatTimeVi(stats.totalTimeAvailable)}</p>
		</div>

		<div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
			<span class="text-xs font-medium text-slate-400">💵 Tiền Dôi Dư</span>
			<div class="text-xl font-bold text-slate-200 font-mono">
				{formatMoneyVi(savedMoney)}
			</div>
			<p class="text-[11px] text-slate-500">Trên tổng {formatMoneyVi(stats.totalMoneyAvailable)}</p>
		</div>
	</div>

	<!-- Calendar Heatmap Grid -->
	<section class="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-4">
		<h2 class="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
			<span>🗓</span> Lịch Hoạt Động Trong Tháng
		</h2>

		<!-- Day of week headers -->
		<div class="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 pb-1 border-b border-slate-800/60">
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
				<div class="min-h-[70px] rounded-xl bg-slate-950/20 border border-slate-900/40"></div>
			{/each}

			<!-- Days of month -->
			{#each monthRange.days as d}
				{@const dayData = stats.dailyBreakdown.find((item: import('#lib/types').DailySummaryItem) => item.date === d)}
				{@const hasData = dayData && dayData.opportunityCount > 0}
				<a
					href="/day/{d}"
					class="min-h-[70px] p-2 rounded-xl border transition flex flex-col justify-between {hasData
						? 'bg-slate-950/80 border-slate-700/80 hover:border-amber-400/60 hover:bg-slate-900'
						: 'bg-slate-950/40 border-slate-800/40 text-slate-600 hover:border-slate-700'}"
				>
					<div class="flex items-center justify-between text-xs font-mono">
						<span class="font-bold {hasData ? 'text-amber-300' : 'text-slate-500'}">
							{d.slice(8)}
						</span>
						{#if hasData}
							<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
						{/if}
					</div>

					{#if hasData}
						<div class="text-[10px] text-slate-400 leading-tight">
							<div>{dayData.opportunityCount} cơ hội</div>
						</div>
					{/if}
				</a>
			{/each}
		</div>
	</section>
</div>
