import { fail, redirect } from '@sveltejs/kit';
import { signIn } from '$lib/server/auth-actions';
import { resolveSafeRedirect } from '$lib/server/auth-redirect';
import { isRegistrationEnabled } from '$lib/server/registration';
import type { Actions, PageServerLoad } from './$types';

type SignInDeps = {
	signIn: typeof signIn;
};

type SignInLoadDeps = {
	isRegistrationEnabled?: typeof isRegistrationEnabled;
};

const defaultDeps: SignInDeps = { signIn };
const defaultLoadDeps: SignInLoadDeps = { isRegistrationEnabled };

export function _createLoad(deps: SignInLoadDeps = defaultLoadDeps): PageServerLoad {
	return ({ url, locals }) => {
		const redirectTo = resolveSafeRedirect(url.searchParams.get('redirectTo'));

		if (locals.user) {
			redirect(303, redirectTo);
		}

		const registrationEnabled = (deps.isRegistrationEnabled ?? isRegistrationEnabled)();

		return registrationEnabled ? { redirectTo, registrationEnabled: true } : { redirectTo };
	};
}

export function _createActions(deps: SignInDeps = defaultDeps): Actions {
	return {
		default: async ({ request, url }) => {
			const data = await request.formData();
			const email = String(data.get('email') ?? '');
			const password = String(data.get('password') ?? '');
			const redirectTo = resolveSafeRedirect(
				String(data.get('redirectTo') ?? url.searchParams.get('redirectTo') ?? '')
			);

			const result = await deps.signIn(email, password, redirectTo);

			if (result.type === 'error') {
				return fail(400, { error: result.message });
			}

			redirect(303, result.location);
		}
	};
}

export const load: PageServerLoad = _createLoad();
export const actions: Actions = _createActions();
