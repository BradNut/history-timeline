import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		await auth.api.signOut({ headers: request.headers }).catch(() => {});
		cookies.delete('better-auth.session_token', { path: '/' });
		redirect(303, '/admin/login');
	}
};
