import { auth as defaultAuth } from '$lib/server/auth';

export type SignInResult =
	| { type: 'redirect'; location: string; headers: Headers }
	| { type: 'error'; status: 400 | 403; message: string };

type AuthApi = {
	signInEmail: (opts: { body: { email: string; password: string }; asResponse: true }) => Promise<Response>;
	signOut: (opts: { headers: Headers }) => Promise<unknown>;
};

const defaultAuthApi: AuthApi = {
	signInEmail: (opts) =>
		(defaultAuth.api.signInEmail as unknown as (o: typeof opts) => Promise<Response>)(opts),
	signOut: (opts) =>
		(defaultAuth.api.signOut as unknown as (o: typeof opts) => Promise<unknown>)(opts)
};

export async function signInAdmin(
	email: string,
	password: string,
	authApi: AuthApi = defaultAuthApi
): Promise<SignInResult> {
	let response: Response;
	try {
		response = await authApi.signInEmail({ body: { email, password }, asResponse: true });
	} catch {
		return { type: 'error', status: 400, message: 'Invalid credentials' };
	}

	if (!response.ok) {
		return { type: 'error', status: 400, message: 'Invalid credentials' };
	}

	const data = await response.clone().json();
	const role = (data as { user?: { role?: string } })?.user?.role;

	if (role !== 'admin') {
		await authApi.signOut({ headers: response.headers }).catch(() => {});
		return { type: 'error', status: 403, message: 'Not authorised' };
	}

	return { type: 'redirect', location: '/admin', headers: response.headers };
}
