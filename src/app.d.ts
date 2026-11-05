import type { User, Session } from '#lib/types';

declare global {
	interface Window {
		google?: any;
	}
	namespace App {
		// interface Error {}
		interface Locals {
			user: User | null;
			session: Session | null;
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: Env;
		}
	}
}

export { };
