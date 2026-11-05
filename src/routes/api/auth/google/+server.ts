import { json, type RequestHandler } from '@sveltejs/kit';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { findOrCreateGoogleUser, createSession } from '#lib/server/db/auth';

const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

export const POST: RequestHandler = async ({ request, platform, cookies, url }) => {
	if (!platform?.env?.DB) {
		return json({ error: 'Database not available' }, { status: 500 });
	}

	const clientId = platform.env.GG_Client_ID;
	if (!clientId) {
		return json({ error: 'Google Client ID not configured' }, { status: 500 });
	}

	try {
		const body = (await request.json()) as Record<string, unknown>;
		const credential = body?.credential;

		if (!credential || typeof credential !== 'string') {
			return json({ error: 'Missing credential' }, { status: 400 });
		}

		// Verify Google ID Token with Google JWKS
		const { payload } = await jwtVerify(credential, GOOGLE_JWKS, {
			issuer: ['https://accounts.google.com', 'accounts.google.com'],
			audience: clientId
		});

		const sub = payload.sub;
		const email = payload.email as string;
		const name = (payload.name as string) || (payload.given_name as string) || email.split('@')[0];
		const picture = (payload.picture as string) || '';

		if (!sub || !email) {
			return json({ error: 'Invalid Google profile in token' }, { status: 400 });
		}

		// Upsert user in Cloudflare D1
		const user = await findOrCreateGoogleUser(platform.env.DB, {
			sub,
			email,
			name,
			picture
		});

		// Create Session in D1 (30 days)
		const session = await createSession(platform.env.DB, user.id);

		// Set HTTP-only session cookie
		cookies.set('session_id', session.id, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: url.protocol === 'https:',
			maxAge: 30 * 24 * 60 * 60 // 30 days
		});

		return json({
			success: true,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				picture: user.picture
			}
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Invalid token';
		return json({ error: `Authentication failed: ${message}` }, { status: 401 });
	}
};
