import { auth as defaultAuth } from '$lib/server/auth';

export type AuthFlowResult =
	| { type: 'redirect'; location: string }
	| { type: 'error'; message: string };

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

	let data: unknown;
	try {
		data = await authApi.signInEmail({ body: { email, password } });
	} catch {
		return { type: 'error', message: 'Invalid email or password' };
	}

	const role = (data as { user?: { role?: string } })?.user?.role;
	const location = role === 'admin' ? '/admin' : redirectTo;

	return { type: 'redirect', location };
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
