import { env as defaultEnv } from '$env/dynamic/private';
import { auth as defaultAuth } from '$lib/server/auth';
import { db as defaultDb } from '$lib/server/db';
import { user as userTable } from '$lib/server/databases/postgres/drizzle-schema';
import { eq, sql } from 'drizzle-orm';

export type SignInResult =
	| { type: 'redirect'; location: string; headers: Headers }
	| { type: 'error'; status: 400 | 403; message: string };

type AdminAuthApi = {
	signInEmail: (opts: { body: { email: string; password: string }; asResponse: true }) => Promise<Response>;
	signOut: (opts: { headers: Headers }) => Promise<unknown>;
};

const defaultAdminAuthApi: AdminAuthApi = {
	signInEmail: (opts) =>
		(defaultAuth.api.signInEmail as unknown as (o: typeof opts) => Promise<Response>)(opts),
	signOut: (opts) =>
		(defaultAuth.api.signOut as unknown as (o: typeof opts) => Promise<unknown>)(opts)
};

export async function signInAdmin(
	email: string,
	password: string,
	authApi: AdminAuthApi = defaultAdminAuthApi
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

// Advisory lock key used to serialise the "is there already an admin?" check
// around registration, so two concurrent first-time registrations can't both
// be promoted to admin.
const ADMIN_PROMOTION_LOCK_KEY = 8_675_309;

type PromotionDb = {
	transaction: typeof defaultDb.transaction;
};

export type PromotionDeps = {
	db: PromotionDb;
	env: { ADMIN_SEED_EMAIL?: string; ADMIN_SEED_PASSWORD?: string };
};

const defaultPromotionDeps: PromotionDeps = {
	db: defaultDb,
	env: {
		ADMIN_SEED_EMAIL: defaultEnv.ADMIN_SEED_EMAIL,
		ADMIN_SEED_PASSWORD: defaultEnv.ADMIN_SEED_PASSWORD
	}
};

/**
 * Promotes a newly registered user to admin when no ADMIN_SEED_EMAIL/
 * ADMIN_SEED_PASSWORD are configured and no admin exists yet. Always marks
 * the user's email as verified, since self-hosted instances won't have SMTP
 * configured by default.
 *
 * The admin count check and promotion happen inside a single transaction
 * guarded by a Postgres advisory lock, so two concurrent first registrations
 * can't race each other into both becoming admin.
 */
export async function maybePromoteFirstRegistrantToAdmin(
	userId: string,
	deps: PromotionDeps = defaultPromotionDeps
): Promise<void> {
	const seedConfigured = Boolean(deps.env.ADMIN_SEED_EMAIL && deps.env.ADMIN_SEED_PASSWORD);

	await deps.db.transaction(async (tx) => {
		await tx.execute(sql`select pg_advisory_xact_lock(${ADMIN_PROMOTION_LOCK_KEY})`);

		const [{ count }] = await tx
			.select({ count: sql<number>`count(*)::int` })
			.from(userTable)
			.where(eq(userTable.role, 'admin'));

		const shouldPromote = !seedConfigured && count === 0;

		await tx
			.update(userTable)
			.set(shouldPromote ? { role: 'admin', emailVerified: true } : { emailVerified: true })
			.where(eq(userTable.id, userId));
	});
}

type SignUpDeps = {
	authApi: SignUpApi;
	promote: typeof maybePromoteFirstRegistrantToAdmin;
};

const defaultSignUpDeps: SignUpDeps = {
	authApi: defaultSignUpApi,
	promote: maybePromoteFirstRegistrantToAdmin
};

export async function signUp(
	name: string,
	email: string,
	password: string,
	redirectTo: string,
	deps: SignUpDeps = defaultSignUpDeps
): Promise<AuthFlowResult> {
	if (!name || !email || !password) {
		return { type: 'error', message: 'Name, email, and password are required' };
	}

	let result: unknown;
	try {
		result = await deps.authApi.signUpEmail({ body: { name, email, password } });
	} catch {
		return { type: 'error', message: 'Unable to create account' };
	}

	const userId = (result as { user?: { id?: string } })?.user?.id;
	if (userId) {
		await deps.promote(userId);
	}

	return { type: 'redirect', location: redirectTo };
}
