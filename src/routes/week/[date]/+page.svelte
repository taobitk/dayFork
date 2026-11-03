<script lang="ts">
	import type { PageProps } from './$types';
	import { formatDateVi, formatMoneyVi, formatTimeVi, addDays } from '#lib/date';

	let { data }: PageProps = $props();

	let stats = $derived(data.stats);
	let week = $derived(data.week);

	let prevWeekDate = $derived(addDays(week.start, -7));
	let nextWeekDate = $derived(addDays(week.start, 7));

	let savedTime = $derived(Math.max(0, stats.totalTimeAvailable - stats.totalTimeSpent));
	let savedMoney = $derived(Math.max(0, stats.totalMoneyAvailable - stats.totalMoneySpent));
</script>

<div class="space-y-6">
	<!-- Week Navigator -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
		<div class="flex items-center gap-3">
			<a
				href="/week/{prevWeekDate}"
				class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition"
				title="Tuần trước"
			>
				←
			</a>
			<div>
				<h1 class="text-xl font-bold text-slate-100">
					Tuần: {week.start} → {week.end}
				</h1>
				<p class="text-xs text-slate-400 mt-0.5">Tổng hợp 7 ngày (Thứ 2 đến Chủ nhật)</p>
			</div>
			<a
				href="/week/{nextWeekDate}"
				class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition"
				title="Tuần sau"
			>
				→
			</a>
		</div>

		<a
			href="/day/{data.date}"
			class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
		>
			Quay lại ngày {data.date}
		</a>
	</div>

	<!-- KPI Overview Cards -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<!-- Card 1: Best Match Rate -->
		<div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
			<span class="text-xs font-medium text-slate-400 flex items-center gap-1.5">
				<span>🎯</span> Trùng Đề Xuất Tốt Nhất
			</span>
			<div class="text-2xl font-bold text-emerald-400 font-mono">
				{stats.bestMatchRate}%
			</div>
			<p class="text-[11px] text-slate-500">
				{stats.bestMatchCount}/{stats.totalChosenCount} cơ hội trùng đường tối ưu
			</p>
		</div>

		<!-- Card 2: Comfort Match Rate -->
		<div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
			<span class="text-xs font-medium text-slate-400 flex items-center gap-1.5">
				<span>☕</span> Trùng Đường Thoải Mái
			</span>
			<div class="text-2xl font-bold text-sky-400 font-mono">
				{stats.comfortMatchRate}%
			</div>
			<p class="text-[11px] text-slate-500">
				{stats.comfortMatchCount}/{stats.totalChosenCount} cơ hội chọn chiều chuộng bản thân
			</p>
		</div>

		<!-- Card 3: Time Spent & Remaining -->
		<div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
			<span class="text-xs font-medium text-slate-400 flex items-center gap-1.5">
				<span>⏱</span> Thời Gian Sử Dụng
			</span>
			<div class="text-xl font-bold text-slate-200 font-mono">
				{formatTimeVi(stats.totalTimeSpent)}
			</div>
			<p class="text-[11px] text-emerald-400">
				Dư {formatTimeVi(savedTime)} / {formatTimeVi(stats.totalTimeAvailable)}
			</p>
		</div>

		<!-- Card 4: Money Spent & Remaining -->
		<div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
			<span class="text-xs font-medium text-slate-400 flex items-center gap-1.5">
				<span>💵</span> Chi Tiêu Tuần
			</span>
			<div class="text-xl font-bold text-slate-200 font-mono">
				{formatMoneyVi(stats.totalMoneySpent)}
			</div>
			<p class="text-[11px] text-emerald-400">
				Dôi {formatMoneyVi(savedMoney)} / {formatMoneyVi(stats.totalMoneyAvailable)}
			</p>
		</div>
	</div>

	<!-- 7 Days Grid Breakdown -->
	<section class="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-4">
		<h2 class="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
			<span>📅</span> Diễn Biến 7 Ngày Trong Tuần
		</h2>

		<div class="grid grid-cols-1 sm:grid-cols-7 gap-2.5">
			{#each week.days as d}
				{@const dayData = stats.dailyBreakdown.find((item: import('#lib/types').DailySummaryItem) => item.date === d)}
				<a
					href="/day/{d}"
					class="p-3 rounded-xl border transition flex flex-col justify-between min-h-[90px] {dayData && dayData.opportunityCount > 0
						? 'bg-slate-950/80 border-slate-700/80 hover:border-amber-500/50 hover:bg-slate-900'
						: 'bg-slate-950/30 border-slate-800/40 text-slate-600 hover:border-slate-700'}"
				>
					<div class="flex items-center justify-between text-xs font-mono">
						<span class="font-bold {dayData && dayData.opportunityCount > 0 ? 'text-amber-300' : 'text-slate-500'}">
							{d.slice(8)}/{d.slice(5, 7)}
						</span>
						{#if dayData && dayData.opportunityCount > 0}
							<span class="w-2 h-2 rounded-full bg-emerald-400"></span>
						{/if}
					</div>

					<div class="mt-2 text-[11px] space-y-0.5">
						{#if dayData && dayData.opportunityCount > 0}
							<div class="text-slate-300 font-semibold">{dayData.opportunityCount} cơ hội</div>
							<div class="text-[10px] text-slate-400">
								🎯 {dayData.bestMatchCount} • ☕ {dayData.comfortMatchCount}
							</div>
						{:else}
							<div class="text-slate-600 italic">Trống</div>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	</section>

	<!-- Divergent Opportunities -->
	{#if stats.divergentOpportunities.length > 0}
		<section class="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-3">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-2">
					<span>⚡</span> Ngã Rẽ Bất Ngờ (Lệch Khỏi Cả 2 Đường AI)
				</h2>
				<span class="text-xs text-slate-400 font-mono">{stats.divergentOpportunities.length} lựa chọn độc lập</span>
			</div>
			<p class="text-xs text-slate-400">
				Những cơ hội mà bạn chọn một lối đi riêng, không nằm trong đường "tối ưu kỷ luật" lẫn đường "thoải mái cảm xúc" của AI:
			</p>

			<div class="divide-y divide-slate-800 text-xs">
				{#each stats.divergentOpportunities as div}
					<div class="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
						<div>
							<div class="font-bold text-slate-200">
								{div.opportunityTitle}
								<span class="text-[11px] text-slate-500 font-mono ml-1.5">({div.date})</span>
							</div>
							<div class="text-slate-400 mt-0.5">
								Bạn đã chọn: <span class="text-amber-300 font-medium">{div.actualBranchName}</span>
							</div>
						</div>
						<div class="flex items-center gap-3 text-slate-400 text-[11px]">
							<span>🎯 Tối ưu: <span class="text-slate-300">{div.bestBranchName}</span></span>
							<span>•</span>
							<span>☕ Thoải mái: <span class="text-slate-300">{div.comfortBranchName}</span></span>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}
</div>
