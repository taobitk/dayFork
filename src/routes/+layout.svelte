<script lang="ts">
	import './layout.css';
	import type { LayoutProps } from './$types';
	import { page } from '$app/state';

	let { data, children }: LayoutProps = $props();

	// Extract active date from URL if inside /day/[date] or /week/[date]
	let activeDate = $derived.by(() => {
		const match = page.url.pathname.match(/\/(day|week)\/(\d{4}-\d{2}-\d{2})/);
		return match ? match[2] : data.today;
	});

	let activeYm = $derived.by(() => {
		const match = page.url.pathname.match(/\/month\/(\d{4}-\d{2})/);
		return match ? match[1] : activeDate.slice(0, 7);
	});
</script>

<svelte:head>
	<title>DayFork — Nhìn lại từng ngã rẽ cuộc sống</title>
	<meta name="description" content="Nhật ký ngã rẽ và các đường đi song song mỗi ngày" />
</svelte:head>

<div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
	<!-- Header Navigation -->
	<header class="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
		<div class="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
			<!-- Logo -->
			<a href="/day/{data.today}" class="flex items-center gap-2.5 font-bold text-lg tracking-tight hover:opacity-90 transition">
				<div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 font-black">
					⑂
				</div>
				<span class="bg-gradient-to-r from-amber-200 via-orange-300 to-amber-400 bg-clip-text text-transparent">
					DayFork
				</span>
			</a>

			<!-- Nav items -->
			<nav class="flex items-center gap-1 sm:gap-2 text-sm font-medium">
				<a
					href="/day/{activeDate}"
					class="px-3 py-1.5 rounded-lg transition {page.url.pathname === `/day/${activeDate}`
						? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
						: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}"
				>
					Hôm nay
				</a>
				<a
					href="/day/{activeDate}/review"
					class="px-3 py-1.5 rounded-lg transition {page.url.pathname.endsWith('/review')
						? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
						: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}"
				>
					3 Đường Đi
				</a>
				<a
					href="/week/{activeDate}"
					class="px-3 py-1.5 rounded-lg transition {page.url.pathname.startsWith('/week')
						? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
						: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}"
				>
					Tuần
				</a>
				<a
					href="/month/{activeYm}"
					class="px-3 py-1.5 rounded-lg transition {page.url.pathname.startsWith('/month')
						? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
						: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}"
				>
					Tháng
				</a>
			</nav>
		</div>
	</header>

	<!-- Main Body -->
	<main class="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
		DayFork — Mỗi ngã rẽ là một câu chuyện. Dữ liệu được bảo mật trên Edge SQLite (D1).
	</footer>
</div>
