import type { LayoutServerLoad } from './$types';
import { getTodayISO } from '#lib/date';

export const load: LayoutServerLoad = async () => {
	const today = getTodayISO();
	const currentYm = today.slice(0, 7);
	return {
		today,
		currentYm
	};
};
