/**
 * Date and formatting utilities for DayFork
 */

export function getTodayISO(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function isValidISODate(dateStr: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
	const [y, m, d] = dateStr.split('-').map(Number);
	const date = new Date(y, m - 1, d);
	return (
		date.getFullYear() === y &&
		date.getMonth() === m - 1 &&
		date.getDate() === d
	);
}

export function addDays(dateStr: string, days: number): string {
	const [y, m, d] = dateStr.split('-').map(Number);
	const date = new Date(y, m - 1, d);
	date.setDate(date.getDate() + days);
	const nextY = date.getFullYear();
	const nextM = String(date.getMonth() + 1).padStart(2, '0');
	const nextD = String(date.getDate()).padStart(2, '0');
	return `${nextY}-${nextM}-${nextD}`;
}

export function getWeekRange(dateStr: string): {
	start: string;
	end: string;
	days: string[];
} {
	const [y, m, d] = dateStr.split('-').map(Number);
	const date = new Date(y, m - 1, d);
	// In JS: 0 is Sunday, 1 is Monday ... 6 is Saturday
	const dayOfWeek = date.getDay();
	// Distance to Monday (if dayOfWeek === 0 -> -6, else 1 - dayOfWeek)
	const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
	
	const monday = new Date(y, m - 1, d + diffToMonday);
	const days: string[] = [];
	for (let i = 0; i < 7; i++) {
		const cur = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
		const curY = cur.getFullYear();
		const curM = String(cur.getMonth() + 1).padStart(2, '0');
		const curD = String(cur.getDate()).padStart(2, '0');
		days.push(`${curY}-${curM}-${curD}`);
	}

	return {
		start: days[0],
		end: days[6],
		days
	};
}

export function getMonthRange(ymStr: string): {
	start: string;
	end: string;
	year: number;
	month: number;
	days: string[];
} {
	const [y, m] = ymStr.split('-').map(Number);
	const lastDate = new Date(y, m, 0).getDate();
	const days: string[] = [];
	for (let i = 1; i <= lastDate; i++) {
		const dayStr = String(i).padStart(2, '0');
		const mStr = String(m).padStart(2, '0');
		days.push(`${y}-${mStr}-${dayStr}`);
	}

	return {
		start: days[0],
		end: days[days.length - 1],
		year: y,
		month: m,
		days
	};
}

export function formatDateVi(dateStr: string): string {
	if (!isValidISODate(dateStr)) return dateStr;
	const [y, m, d] = dateStr.split('-').map(Number);
	const date = new Date(y, m - 1, d);
	const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
	const dayName = days[date.getDay()];
	return `${dayName}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

export function formatMoneyVi(amount: number): string {
	if (amount === 0) return '0 đ';
	return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

export function formatTimeVi(minutes: number): string {
	if (minutes <= 0) return '0 phút';
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	if (h > 0 && m > 0) return `${h}h ${m}p`;
	if (h > 0) return `${h} tiếng`;
	return `${m} phút`;
}

