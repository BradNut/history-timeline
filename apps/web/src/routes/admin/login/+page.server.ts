import { redirect, fail } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user?.role === 'admin') {
		redirect(303, '/admin');
	}
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '');
		const password = String(data.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required' });
		}

		let signInData: Awaited<ReturnType<typeof auth.api.signInEmail>>;
		try {
			signInData = await auth.api.signInEmail({ body: { email, password } });
		} catch {
			return fail(400, { error: 'Invalid credentials' });
		}

		if (!signInData?.user) {
			return fail(400, { error: 'Invalid credentials' });
		}

		if (signInData.user.role !== 'admin') {
			await auth.api.signOut({ headers: request.headers }).catch(() => {});
			return fail(403, { error: 'Not authorised' });
		}

		redirect(303, '/admin');
	}
};
