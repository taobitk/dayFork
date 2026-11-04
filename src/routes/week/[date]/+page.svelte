<script lang="ts">
	import type { PageProps } from './$types';
	import { formatMoneyVi, formatTimeVi, addDays } from '#lib/date';

	let { data }: PageProps = $props();

	let stats = $derived(data.stats);
	let week = $derived(data.week);

	let prevWeekDate = $derived(addDays(week.start, -7));
	let nextWeekDate = $derived(addDays(week.start, 7));

	let savedTime = $derived(Math.max(0, stats.totalTimeAvailable - stats.totalTimeSpent));
	let savedMoney = $derived(Math.max(0, stats.totalMoneyAvailable - stats.totalMoneySpent));
</script>

<div class="space-y-6 max-w-5xl mx-auto">
	<!-- Week Navigator -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
		<div class="flex items-center gap-3">
			<a
				href="/week/{prevWeekDate}"
				class="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 hover:text-stone-900 transition font-bold"
				title="Tuần trước"
			>
				←
			</a>
			<div>
				<h1 class="text-xl font-bold text-stone-900 font-serif">
					Tuần: {week.start} → {week.end}
				</h1>
				<p class="text-xs text-stone-500 mt-0.5">Tổng hợp 7 ngày (Thứ 2 đến Chủ nhật)</p>
			</div>
			<a
				href="/week/{nextWeekDate}"
				class="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 hover:text-stone-900 transition font-bold"
				title="Tuần sau"
			>
				→
			</a>
		</div>

		<a
			href="/day/{data.date}"
			class="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold border border-stone-200 transition"
		>
			Quay lại ngày {data.date}
		</a>
	</div>

	<!-- KPI Overview Cards -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<!-- Card 1: Best Match Rate -->
		<div class="p-4 rounded-2xl bg-white border border-stone-200 space-y-1 shadow-xs">
			<span class="text-xs font-semibold text-stone-600 flex items-center gap-1.5">
				<span>🟢</span> Trùng Hiệu Quả
			</span>
			<div class="text-2xl font-bold text-emerald-700 font-mono">
				{stats.bestMatchRate}%
			</div>
			<p class="text-[11px] text-stone-500 font-mono">
				{stats.bestMatchCount}/{stats.totalChosenCount} cơ hội trùng lối tối ưu
			</p>
		</div>

		<!-- Card 2: Comfort Match Rate -->
		<div class="p-4 rounded-2xl bg-white border border-stone-200 space-y-1 shadow-xs">
			<span class="text-xs font-semibold text-stone-600 flex items-center gap-1.5">
				<span>🔵</span> Trùng Thả Lỏng
			</span>
			<div class="text-2xl font-bold text-sky-700 font-mono">
				{stats.comfortMatchRate}%
			</div>
			<p class="text-[11px] text-stone-500 font-mono">
				{stats.comfortMatchCount}/{stats.totalChosenCount} cơ hội chọn chiều chuộng bản thân
			</p>
		</div>

		<!-- Card 3: Time Spent & Remaining -->
		<div class="p-4 rounded-2xl bg-white border border-stone-200 space-y-1 shadow-xs">
			<span class="text-xs font-semibold text-stone-600 flex items-center gap-1.5">
				<span>⏱</span> Thời Gian Sử Dụng
			</span>
			<div class="text-xl font-bold text-stone-900 font-mono">
				{formatTimeVi(stats.totalTimeSpent)}
			</div>
			<p class="text-[11px] text-emerald-700 font-mono font-medium">
				Dư {formatTimeVi(savedTime)} / {formatTimeVi(stats.totalTimeAvailable)}
			</p>
		</div>

		<!-- Card 4: Money Spent & Remaining -->
		<div class="p-4 rounded-2xl bg-white border border-stone-200 space-y-1 shadow-xs">
			<span class="text-xs font-semibold text-stone-600 flex items-center gap-1.5">
				<span>💵</span> Chi Tiêu Tuần
			</span>
			<div class="text-xl font-bold text-stone-900 font-mono">
				{formatMoneyVi(stats.totalMoneySpent)}
			</div>
			<p class="text-[11px] text-emerald-700 font-mono font-medium">
				Dôi {formatMoneyVi(savedMoney)} / {formatMoneyVi(stats.totalMoneyAvailable)}
			</p>
		</div>
	</div>

	<!-- 7 Days Grid Breakdown -->
	<section class="bg-white rounded-2xl border border-stone-200 p-5 space-y-4 shadow-xs">
		<h2 class="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-2 font-mono">
			<span>📅</span> Diễn Biến 7 Ngày Trong Tuần
		</h2>

		<div class="grid grid-cols-1 sm:grid-cols-7 gap-2.5">
			{#each week.days as d}
				{@const dayData = stats.dailyBreakdown.find((item: import('#lib/types').DailySummaryItem) => item.date === d)}
				<a
					href="/day/{d}"
					class="p-3 rounded-xl border transition flex flex-col justify-between min-h-[90px] {dayData && dayData.opportunityCount > 0
						? 'bg-amber-50/40 border-amber-200 hover:border-amber-400 hover:bg-amber-50/70'
						: 'bg-stone-50 border-stone-200 text-stone-400 hover:border-stone-300'}"
				>
					<div class="flex items-center justify-between text-xs font-mono">
						<span class="font-bold {dayData && dayData.opportunityCount > 0 ? 'text-amber-800' : 'text-stone-400'}">
							{d.slice(8)}/{d.slice(5, 7)}
						</span>
						{#if dayData && dayData.opportunityCount > 0}
							<span class="w-2 h-2 rounded-full bg-amber-600"></span>
						{/if}
					</div>

					<div class="mt-2 text-[11px] space-y-0.5">
						{#if dayData && dayData.opportunityCount > 0}
							<div class="text-stone-800 font-semibold">{dayData.opportunityCount} cơ hội</div>
							<div class="text-[10px] text-stone-500 font-mono">
								🟢 {dayData.bestMatchCount} • 🔵 {dayData.comfortMatchCount}
							</div>
						{:else}
							<div class="text-stone-400 italic">Trống</div>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	</section>

	<!-- Divergent Opportunities -->
	{#if stats.divergentOpportunities.length > 0}
		<section class="bg-white rounded-2xl border border-stone-200 p-5 space-y-3 shadow-xs">
			<div class="flex items-center justify-between">
				<h2 class="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-2 font-mono">
					<span>⚡</span> Ngã Rẽ Bất Ngờ (Lệch Khỏi Cả 2 Góc Nhìn AI)
				</h2>
				<span class="text-xs text-stone-500 font-mono">{stats.divergentOpportunities.length} lựa chọn độc lập</span>
			</div>
			<p class="text-xs text-stone-500">
				Những cơ hội mà bạn chọn một lối đi riêng biệt, không trùng với góc nhìn "Hiệu Quả" lẫn "Thả Lỏng":
			</p>

			<div class="divide-y divide-stone-200 text-xs">
				{#each stats.divergentOpportunities as div}
					<div class="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
						<div>
							<div class="font-bold text-stone-900">
								{div.opportunityTitle}
								<span class="text-[11px] text-stone-400 font-mono ml-1.5">({div.date})</span>
							</div>
							<div class="text-stone-600 mt-0.5">
								Bạn đã chọn: <span class="text-amber-700 font-bold">{div.actualBranchName}</span>
							</div>
						</div>
						<div class="flex items-center gap-3 text-stone-500 text-[11px]">
							<span>🟢 Hiệu Quả: <span class="text-stone-800 font-medium">{div.bestBranchName}</span></span>
							<span>•</span>
							<span>🔵 Thả Lỏng: <span class="text-stone-800 font-medium">{div.comfortBranchName}</span></span>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}
</div>
