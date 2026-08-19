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

export type AuthFlowResult = { type: 'redirect'; location: string } | { type: 'error'; message: string };

type SignInApi = {
	signInEmail: (opts: { body: { email: string; password: string } }) => Promise<unknown>;
};

type SignUpApi = {
	signUpEmail: (opts: { body: { email: string; password: string; name: string } }) => Promise<unknown>;
};

const defaultSignInApi: SignInApi = {
	signInEmail: (opts) => defaultAuth.api.signInEmail(opts)
};

const defaultSignUpApi: SignUpApi = {
	signUpEmail: (opts) => defaultAuth.api.signUpEmail(opts)
};

export async function signIn(
	email: string,
	password: string,
	redirectTo: string,
	authApi: SignInApi = defaultSignInApi
): Promise<AuthFlowResult> {
	if (!email || !password) {
		return { type: 'error', message: 'Email and password are required' };
	}

	try {
		await authApi.signInEmail({ body: { email, password } });
	} catch {
		return { type: 'error', message: 'Invalid email or password' };
	}

	return { type: 'redirect', location: redirectTo };
}

export async function signUp(
	name: string,
	email: string,
	password: string,
	redirectTo: string,
	authApi: SignUpApi = defaultSignUpApi
): Promise<AuthFlowResult> {
	if (!name || !email || !password) {
		return { type: 'error', message: 'Name, email, and password are required' };
	}

	try {
		await authApi.signUpEmail({ body: { name, email, password } });
	} catch {
		return { type: 'error', message: 'Unable to create account' };
	}

	return { type: 'redirect', location: redirectTo };
}
