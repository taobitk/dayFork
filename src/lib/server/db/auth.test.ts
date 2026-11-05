import { describe, it, expect, vi } from 'vitest';
import {
	findOrCreateGoogleUser,
	createSession,
	validateSession,
	deleteSession
} from './auth';

describe('Auth Helpers & Session Engine', () => {
	it('creates a new user when user does not exist', async () => {
		const mockFirst = vi.fn().mockResolvedValue(null);
		const mockRun = vi.fn().mockResolvedValue({ success: true });
		const mockBind = vi.fn().mockReturnValue({ first: mockFirst, run: mockRun });
		const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
		const mockDb = { prepare: mockPrepare } as unknown as D1Database;

		const user = await findOrCreateGoogleUser(mockDb, {
			sub: 'google-sub-123',
			email: 'test@example.com',
			name: 'Test User',
			picture: 'https://example.com/pic.jpg'
		});

		expect(user.google_id).toBe('google-sub-123');
		expect(user.email).toBe('test@example.com');
		expect(user.name).toBe('Test User');
		expect(mockPrepare).toHaveBeenCalled();
	});

	it('creates session with 30-day expiration', async () => {
		const mockRun = vi.fn().mockResolvedValue({ success: true });
		const mockBind = vi.fn().mockReturnValue({ run: mockRun });
		const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
		const mockDb = { prepare: mockPrepare } as unknown as D1Database;

		const before = Date.now();
		const session = await createSession(mockDb, 'user-id-123');
		const after = Date.now();

		expect(session.user_id).toBe('user-id-123');
		expect(session.expires_at).toBeGreaterThanOrEqual(before + 29 * 24 * 60 * 60 * 1000);
		expect(session.expires_at).toBeLessThanOrEqual(after + 31 * 24 * 60 * 60 * 1000);
	});

	it('rejects expired session and calls deleteSession', async () => {
		const expiredTime = Date.now() - 10000;
		const mockFirst = vi.fn().mockResolvedValue({
			session_id: 'sess-expired',
			user_id: 'u-1',
			expires_at: expiredTime,
			u_id: 'u-1',
			google_id: 'g-1',
			email: 'exp@example.com',
			name: 'Expired',
			picture: '',
			user_created_at: 1000
		});
		const mockRun = vi.fn().mockResolvedValue({ success: true });
		const mockBind = vi.fn().mockReturnValue({ first: mockFirst, run: mockRun });
		const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
		const mockDb = { prepare: mockPrepare } as unknown as D1Database;

		const result = await validateSession(mockDb, 'sess-expired');
		expect(result).toBeNull();
		// Should execute DELETE FROM sessions
		expect(mockPrepare).toHaveBeenCalledWith('DELETE FROM sessions WHERE id = ?');
	});

	it('validates active session successfully', async () => {
		const validTime = Date.now() + 100000;
		const mockFirst = vi.fn().mockResolvedValue({
			session_id: 'sess-valid',
			user_id: 'u-2',
			expires_at: validTime,
			u_id: 'u-2',
			google_id: 'g-2',
			email: 'valid@example.com',
			name: 'Valid User',
			picture: 'https://pic.jpg',
			user_created_at: 2000
		});
		const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
		const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
		const mockDb = { prepare: mockPrepare } as unknown as D1Database;

		const result = await validateSession(mockDb, 'sess-valid');
		expect(result).not.toBeNull();
		expect(result?.user.email).toBe('valid@example.com');
		expect(result?.session.id).toBe('sess-valid');
	});
});

