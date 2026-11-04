<script lang="ts">
	import './layout.css';
	import type { LayoutProps } from './$types';
	import { page } from '$app/state';
	import { theme } from '#lib/theme.svelte';
	import { browser } from '$app/environment';

	let { data, children }: LayoutProps = $props();

	if (browser) {
		theme.init();
	}

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

<div
	class="min-h-screen bg-[#FAF8F5] dark:bg-[#141416] text-[#1C1917] dark:text-[#F4F4F5] flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-900 dark:selection:text-amber-200 transition-colors duration-200"
>
	<!-- Header Navigation -->
	<header
		class="border-b border-[#E7E5E4] dark:border-[#27272A] bg-[#FAF8F5]/90 dark:bg-[#141416]/90 backdrop-blur-md sticky top-0 z-40 transition-colors duration-200"
	>
		<div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
			<!-- Logo -->
			<a
				href="/day/{data.today}"
				class="flex items-center gap-2.5 font-bold text-lg tracking-tight hover:opacity-90 transition"
			>
				<div
					class="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center text-white shadow-sm font-bold text-base"
				>
					⑂
				</div>
				<span class="font-serif font-bold text-[#1C1917] dark:text-[#F4F4F5] tracking-normal text-lg">
					DayFork
				</span>
			</a>

			<!-- Nav items & Theme Toggle -->
			<div class="flex items-center gap-2 sm:gap-3">
				<nav class="flex items-center gap-1 sm:gap-2 text-sm font-medium">
					<a
						href="/day/{activeDate}"
						class="px-3 py-1.5 rounded-lg transition {page.url.pathname === `/day/${activeDate}`
							? 'bg-amber-100/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-700/60'
							: 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-800'}"
					>
						Hôm nay
					</a>
					<a
						href="/day/{activeDate}/review"
						class="px-3 py-1.5 rounded-lg transition {page.url.pathname.endsWith('/review')
							? 'bg-amber-100/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-700/60'
							: 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-800'}"
					>
						Ngã Rẽ
					</a>
					<a
						href="/week/{activeDate}"
						class="px-3 py-1.5 rounded-lg transition {page.url.pathname.startsWith('/week')
							? 'bg-amber-100/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-700/60'
							: 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-800'}"
					>
						Tuần
					</a>
					<a
						href="/month/{activeYm}"
						class="px-3 py-1.5 rounded-lg transition {page.url.pathname.startsWith('/month')
							? 'bg-amber-100/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-700/60'
							: 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-800'}"
					>
						Tháng
					</a>
				</nav>

				<!-- Dark Mode Toggle Button -->
				<div class="pl-1 sm:pl-2 border-l border-stone-200 dark:border-zinc-800 flex items-center">
					<button
						type="button"
						onclick={() => theme.toggle()}
						data-testid="theme-toggle"
						class="w-9 h-9 rounded-xl flex items-center justify-center text-stone-600 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-zinc-800 transition cursor-pointer"
						title={theme.isDark ? 'Chuyển sang nền sáng (Light mode)' : 'Chuyển sang nền tối (Dark mode)'}
						aria-label={theme.isDark ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'}
					>
						{#if theme.isDark}
							<!-- Sun Icon (Chuyển sang sáng) -->
							<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
							</svg>
						{:else}
							<!-- Moon Icon (Chuyển sang tối) -->
							<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-stone-600 hover:text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
							</svg>
						{/if}
					</button>
				</div>
			</div>
		</div>
	</header>

	<!-- Main Body -->
	<main class="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="border-t border-[#E7E5E4] dark:border-[#27272A] py-6 text-center text-xs text-stone-500 dark:text-zinc-500 transition-colors duration-200">
		DayFork — Mỗi ngã rẽ là một câu chuyện. Dữ liệu được bảo mật trên Edge SQLite (D1).
	</footer>
</div>
