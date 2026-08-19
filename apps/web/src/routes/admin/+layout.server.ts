import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export function _createLoad(): LayoutServerLoad {
	return ({ locals }) => {
		if (locals.user?.role !== 'admin') {
			redirect(303, '/auth/sign-in');
		}
		return { user: locals.user };
	};
}

export const load: LayoutServerLoad = _createLoad();
