// Svelte 5 reactive Confirm Dialog store for DayFork

export interface ConfirmOptions {
	title?: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	variant?: 'danger' | 'warning' | 'info';
}

class ConfirmManager {
	isOpen = $state(false);
	title = $state('Xác nhận');
	message = $state('');
	confirmText = $state('Xác nhận');
	cancelText = $state('Hủy');
	variant = $state<'danger' | 'warning' | 'info'>('danger');

	private resolvePromise: ((value: boolean) => void) | null = null;

	confirm(options: ConfirmOptions): Promise<boolean> {
		this.title = options.title ?? 'Xác nhận';
		this.message = options.message;
		this.confirmText = options.confirmText ?? (options.variant === 'danger' ? 'Xóa bỏ' : 'Đồng ý');
		this.cancelText = options.cancelText ?? 'Hủy';
		this.variant = options.variant ?? 'danger';
		this.isOpen = true;

		return new Promise((resolve) => {
			this.resolvePromise = resolve;
		});
	}

	onConfirm() {
		this.isOpen = false;
		if (this.resolvePromise) {
			this.resolvePromise(true);
			this.resolvePromise = null;
		}
	}

	onCancel() {
		this.isOpen = false;
		if (this.resolvePromise) {
			this.resolvePromise(false);
			this.resolvePromise = null;
		}
	}
}

export const confirmStore = new ConfirmManager();
export const confirmModal = (options: ConfirmOptions) => confirmStore.confirm(options);

