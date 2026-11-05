import type { User, Session } from '#lib/types';

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function findOrCreateGoogleUser(
	db: D1Database,
	profile: { sub: string; email: string; name: string; picture?: string }
): Promise<User> {
	const existing = await db
		.prepare('SELECT * FROM users WHERE google_id = ? OR email = ? LIMIT 1')
		.bind(profile.sub, profile.email.toLowerCase())
		.first<User>();

	const now = Date.now();

	if (existing) {
		await db
			.prepare('UPDATE users SET google_id = ?, name = ?, picture = ? WHERE id = ?')
			.bind(
				profile.sub,
				profile.name || existing.name,
				profile.picture || existing.picture || '',
				existing.id
			)
			.run();

		return {
			...existing,
			google_id: profile.sub,
			name: profile.name || existing.name,
			picture: profile.picture || existing.picture || ''
		};
	}

	const newUser: User = {
		id: crypto.randomUUID(),
		google_id: profile.sub,
		email: profile.email.toLowerCase(),
		name: profile.name || profile.email.split('@')[0],
		picture: profile.picture || '',
		created_at: now
	};

	await db
		.prepare(
			'INSERT INTO users (id, google_id, email, name, picture, created_at) VALUES (?, ?, ?, ?, ?, ?)'
		)
		.bind(
			newUser.id,
			newUser.google_id || '',
			newUser.email,
			newUser.name,
			newUser.picture || '',
			newUser.created_at
		)
		.run();

	return newUser;
}

export async function createSession(db: D1Database, userId: string): Promise<Session> {
	const sessionId = crypto.randomUUID();
	const expiresAt = Date.now() + SESSION_DURATION_MS;

	const session: Session = {
		id: sessionId,
		user_id: userId,
		expires_at: expiresAt
	};

	await db
		.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
		.bind(session.id, session.user_id, session.expires_at)
		.run();

	return session;
}

export async function validateSession(
	db: D1Database,
	sessionId: string
): Promise<{ user: User; session: Session } | null> {
	if (!sessionId) return null;

	const row = await db
		.prepare(
			`
			SELECT 
				s.id AS session_id,
				s.user_id,
				s.expires_at,
				u.id AS u_id,
				u.google_id,
				u.email,
				u.name,
				u.picture,
				u.created_at AS user_created_at
			FROM sessions s
			JOIN users u ON s.user_id = u.id
			WHERE s.id = ?
			LIMIT 1
		`
		)
		.bind(sessionId)
		.first<{
			session_id: string;
			user_id: string;
			expires_at: number;
			u_id: string;
			google_id: string;
			email: string;
			name: string;
			picture: string;
			user_created_at: number;
		}>();

	if (!row) return null;

	if (Date.now() >= row.expires_at) {
		await deleteSession(db, sessionId);
		return null;
	}

	const session: Session = {
		id: row.session_id,
		user_id: row.user_id,
		expires_at: row.expires_at
	};

	const user: User = {
		id: row.u_id,
		google_id: row.google_id,
		email: row.email,
		name: row.name,
		picture: row.picture,
		created_at: row.user_created_at
	};

	return { user, session };
}

export async function deleteSession(db: D1Database, sessionId: string): Promise<void> {
	if (!sessionId) return;
	await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
}

