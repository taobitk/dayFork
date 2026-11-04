<script lang="ts">
	import { confirmStore } from '#lib/confirm.svelte';
	import { AlertTriangle, Trash2, Info, X } from 'lucide-svelte';

	function handleKeydown(e: KeyboardEvent) {
		if (!confirmStore.isOpen) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			confirmStore.onCancel();
		} else if (e.key === 'Enter') {
			e.preventDefault();
			confirmStore.onConfirm();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if confirmStore.isOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/45 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
		role="dialog"
		aria-modal="true"
		aria-labelledby="confirm-dialog-title"
	>
		<!-- Backdrop click to close -->
		<button
			type="button"
			class="absolute inset-0 w-full h-full cursor-default focus:outline-none"
			onclick={() => confirmStore.onCancel()}
			tabindex="-1"
			aria-label="Đóng hộp thoại"
		></button>

		<!-- Dialog Modal Card -->
		<div
			class="relative w-full max-w-sm sm:max-w-md rounded-2xl bg-[#FAF8F5] dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-150"
		>
			<!-- Top-right close button -->
			<button
				type="button"
				onclick={() => confirmStore.onCancel()}
				class="absolute top-4 right-4 p-1.5 rounded-xl text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-200/50 dark:hover:bg-zinc-800 transition cursor-pointer"
				title="Đóng (Esc)"
			>
				<X size={16} />
			</button>

			<div class="flex items-start gap-4">
				<!-- Icon badge -->
				<div class="flex-shrink-0">
					{#if confirmStore.variant === 'danger'}
						<div
							class="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs"
						>
							<Trash2 size={20} />
						</div>
					{:else if confirmStore.variant === 'warning'}
						<div
							class="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs"
						>
							<AlertTriangle size={20} />
						</div>
					{:else}
						<div
							class="w-11 h-11 rounded-2xl bg-sky-100 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-xs"
						>
							<Info size={20} />
						</div>
					{/if}
				</div>

				<!-- Content -->
				<div class="flex-1 min-w-0 pr-4">
					<h3
						id="confirm-dialog-title"
						class="text-base font-bold text-stone-900 dark:text-zinc-100 font-serif leading-snug"
					>
						{confirmStore.title}
					</h3>
					<p class="text-xs text-stone-600 dark:text-zinc-400 mt-2 leading-relaxed">
						{confirmStore.message}
					</p>
				</div>
			</div>

			<!-- Actions Footer -->
			<div class="mt-6 flex items-center justify-end gap-2.5">
				<button
					type="button"
					onclick={() => confirmStore.onCancel()}
					class="px-4 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-medium text-xs hover:bg-stone-100 dark:hover:bg-zinc-700 transition cursor-pointer shadow-2xs"
				>
					{confirmStore.cancelText}
				</button>

				<button
					type="button"
					onclick={() => confirmStore.onConfirm()}
					class="px-4 py-2 rounded-xl text-white font-semibold text-xs shadow-xs transition cursor-pointer {confirmStore.variant ===
					'danger'
						? 'bg-rose-600 hover:bg-rose-700'
						: 'bg-amber-600 hover:bg-amber-700'}"
				>
					{confirmStore.confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}

