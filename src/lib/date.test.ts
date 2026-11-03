import { describe, it, expect } from 'vitest';
import {
	getTodayISO,
	isValidISODate,
	addDays,
	getWeekRange,
	getMonthRange,
	formatTimeVi,
	formatMoneyVi
} from './date';

describe('Date Utilities', () => {
	it('validates ISO date correctly', () => {
		expect(isValidISODate('2026-11-04')).toBe(true);
		expect(isValidISODate('2026-02-29')).toBe(false); // 2026 is not a leap year
		expect(isValidISODate('invalid')).toBe(false);
		expect(isValidISODate('2026-13-01')).toBe(false);
	});

	it('adds days accurately across months and years', () => {
		expect(addDays('2026-11-04', 1)).toBe('2026-11-05');
		expect(addDays('2026-11-04', -4)).toBe('2026-10-31');
		expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
	});

	it('computes Monday-Sunday week range', () => {
		// 2026-11-04 is a Wednesday
		const week = getWeekRange('2026-11-04');
		expect(week.start).toBe('2026-11-02'); // Monday
		expect(week.end).toBe('2026-11-08'); // Sunday
		expect(week.days.length).toBe(7);
		expect(week.days[2]).toBe('2026-11-04');
	});

	it('computes month range', () => {
		const month = getMonthRange('2026-11');
		expect(month.start).toBe('2026-11-01');
		expect(month.end).toBe('2026-11-30');
		expect(month.days.length).toBe(30);
	});

	it('formats time and money nicely in Vietnamese', () => {
		expect(formatTimeVi(90)).toBe('1h 30p');
		expect(formatTimeVi(120)).toBe('2 tiếng');
		expect(formatTimeVi(45)).toBe('45 phút');
		expect(formatMoneyVi(50000)).toBe('50.000 đ');
	});
});

