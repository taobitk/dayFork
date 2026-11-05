import { redirect, type RequestHandler } from '@sveltejs/kit';
import { deleteSession } from '#lib/server/db/auth';

export const POST: RequestHandler = async ({ platform, cookies }) => {
	const sessionId = cookies.get('session_id');
	if (sessionId && platform?.env?.DB) {
		await deleteSession(platform.env.DB, sessionId);
	}

	cookies.delete('session_id', { path: '/' });
	throw redirect(303, '/login');
};
