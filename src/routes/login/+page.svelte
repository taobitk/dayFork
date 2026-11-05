<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import { theme } from '#lib/theme.svelte';
	import { Loader2, Compass, ShieldCheck } from 'lucide-svelte';

	let { data }: PageProps = $props();

	let isSubmitting = $state(false);
	let errorMessage = $state('');
	let googleLoaded = $state(false);

	async function handleCredentialResponse(response: { credential?: string }) {
		if (!response.credential) return;

		isSubmitting = true;
		errorMessage = '';

		try {
			const res = await fetch('/api/auth/google', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ credential: response.credential })
			});

			const result = (await res.json()) as { success?: boolean; error?: string };

			if (!res.ok || !result.success) {
				errorMessage = result.error || 'Đăng nhập không thành công. Vui lòng thử lại.';
				isSubmitting = false;
				return;
			}

			// Redirect to today's timeline
			window.location.href = `/day/${data.today}`;
		} catch (err) {
			errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.';
			isSubmitting = false;
		}
	}

	function renderGoogleButton() {
		const target = document.getElementById('google-btn-container');
		if (!target || !window.google?.accounts?.id || !data.clientId) return;

		window.google.accounts.id.initialize({
			client_id: data.clientId,
			callback: handleCredentialResponse,
			auto_select: false,
			itp_support: true
		});

		window.google.accounts.id.renderButton(target, {
			type: 'standard',
			theme: theme.isDark ? 'filled_black' : 'outline',
			size: 'large',
			shape: 'pill',
			text: 'signin_with',
			logo_alignment: 'left',
			width: 280
		});

		googleLoaded = true;
	}

	onMount(() => {
		if (!data.clientId) {
			errorMessage = 'Chưa cấu hình Google Client ID trong biến môi trường GG_Client_ID.';
			return;
		}

		if (window.google?.accounts?.id) {
			renderGoogleButton();
			return;
		}

		const script = document.createElement('script');
		script.src = 'https://accounts.google.com/gsi/client';
		script.async = true;
		script.defer = true;
		script.onload = () => {
			renderGoogleButton();
		};
		script.onerror = () => {
			errorMessage = 'Không thể tải Google Identity Services SDK.';
		};
		document.head.appendChild(script);

		return () => {
			// cleanup
		};
	});
</script>

<svelte:head>
	<title>Đăng nhập • DayFork</title>
</svelte:head>

<div class="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-4 py-8">
	<div
		class="unified-note w-full rounded-3xl border border-stone-200 bg-white/90 p-6 text-center shadow-lg backdrop-blur-md sm:p-8 dark:border-zinc-800 dark:bg-zinc-850/90"
	>
		<!-- Icon / Header -->
		<div
			class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
		>
			<Compass size={28} />
		</div>

		<h1 class="font-serif text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">
			DayFork
		</h1>
		<p class="mt-1 text-xs text-stone-500 dark:text-zinc-400">
			Ghi lại ngã rẽ và các quyết định mỗi ngày
		</p>

		<div class="my-6 border-t border-dashed border-stone-200 dark:border-zinc-800"></div>

		<!-- Error Message Alert -->
		{#if errorMessage}
			<div
				class="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-left text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
			>
				⚠️ {errorMessage}
			</div>
		{/if}

		<!-- Google Button Container -->
		<div class="flex flex-col items-center justify-center space-y-3">
			{#if isSubmitting}
				<div
					class="flex h-11 w-[280px] items-center justify-center gap-2 rounded-full border border-stone-200 bg-stone-100 text-xs font-semibold text-stone-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
				>
					<Loader2 size={16} class="animate-spin text-amber-600" />
					<span>Đang xác thực...</span>
				</div>
			{:else}
				<div id="google-btn-container" class="min-h-[44px]"></div>

				{#if !googleLoaded && !errorMessage}
					<div
						class="flex h-11 w-[280px] items-center justify-center gap-2 rounded-full border border-stone-200 bg-stone-50 text-xs text-stone-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500"
					>
						<Loader2 size={14} class="animate-spin" />
						<span>Đang tải Google SDK...</span>
					</div>
				{/if}
			{/if}
		</div>

		<div
			class="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-stone-400 dark:text-zinc-500"
		>
			<ShieldCheck size={13} class="text-emerald-600 dark:text-emerald-400" />
			<span>Bảo mật an toàn qua Google OAuth</span>
		</div>
	</div>
</div>
