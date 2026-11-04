// Svelte 5 reactive Theme Store for DayFork (Light / Dark / System)

export type ThemeMode = 'light' | 'dark' | 'system';

class ThemeManager {
	mode = $state<ThemeMode>('system');
	isDark = $state<boolean>(false);
	private initialized = false;

	init() {
		if (typeof window === 'undefined') return;

		// Read stored mode or default to system
		const stored = localStorage.getItem('theme') as ThemeMode | null;
		if (stored === 'light' || stored === 'dark' || stored === 'system') {
			this.mode = stored;
		} else {
			this.mode = 'system';
		}

		this.apply();

		if (!this.initialized) {
			this.initialized = true;
			window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
				if (this.mode === 'system') {
					this.apply();
				}
			});
		}
	}

	setMode(newMode: ThemeMode) {
		this.mode = newMode;
		if (typeof window !== 'undefined') {
			localStorage.setItem('theme', newMode);
			this.apply();
		}
	}

	toggle() {
		if (typeof document === 'undefined') return;
		const isCurrentlyDark = document.documentElement.classList.contains('dark');
		const nextMode: ThemeMode = isCurrentlyDark ? 'light' : 'dark';
		this.setMode(nextMode);
	}

	private apply() {
		if (typeof window === 'undefined') return;

		let dark = false;
		if (this.mode === 'dark') {
			dark = true;
		} else if (this.mode === 'light') {
			dark = false;
		} else {
			dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		}

		this.isDark = dark;
		if (dark) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}
}

export const theme = new ThemeManager();
