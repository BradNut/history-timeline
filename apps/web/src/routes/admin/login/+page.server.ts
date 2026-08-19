import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export function _createLoad(): PageServerLoad {
	return () => {
		redirect(303, '/auth/sign-in');
	};
}

export const load: PageServerLoad = _createLoad();
