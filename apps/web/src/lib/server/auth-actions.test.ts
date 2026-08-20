import { describe, expect, it, vi } from 'vitest';
import {
	maybePromoteFirstRegistrantToAdmin,
	signIn,
	signInAdmin,
	signUp,
	type PromotionDeps
} from './auth-actions';

function makeOkResponse(role: string) {
	const body = JSON.stringify({ user: { role } });
	return new Response(body, {
		status: 200,
		headers: { 'Content-Type': 'application/json', 'Set-Cookie': 'session=abc; Path=/' }
	});
}

function makeErrorResponse(status = 401) {
	return new Response(JSON.stringify({ error: 'Invalid' }), { status });
}

type MockTx = {
	execute: ReturnType<typeof vi.fn>;
	select: ReturnType<typeof vi.fn>;
	update: ReturnType<typeof vi.fn>;
};

function createMockDb(adminCount: number) {
	const updates: Array<{ role?: string; emailVerified?: boolean }> = [];

	const tx: MockTx = {
		execute: vi.fn().mockResolvedValue(undefined),
		select: vi.fn(() => ({
			from: vi.fn(() => ({
				where: vi.fn().mockResolvedValue([{ count: adminCount }])
			}))
		})),
		update: vi.fn(() => ({
			set: vi.fn((values: { role?: string; emailVerified?: boolean }) => {
				updates.push(values);
				return { where: vi.fn().mockResolvedValue(undefined) };
			})
		}))
	};

	const db = {
		transaction: vi.fn(async (callback: (tx: MockTx) => Promise<unknown>) => callback(tx))
	};

	return { db: db as unknown as PromotionDeps['db'], tx, getUpdates: () => updates };
}

describe('signInAdmin', () => {
	it('returns redirect with session headers for valid admin credentials', async () => {
		const authApi = {
			signInEmail: vi.fn().mockResolvedValue(makeOkResponse('admin')),
			signOut: vi.fn()
		};

		const result = await signInAdmin('admin@example.com', 'correct', authApi);

		expect(result.type).toBe('redirect');
		if (result.type === 'redirect') {
			expect(result.location).toBe('/admin');
			expect(result.headers.get('set-cookie')).toContain('session=abc');
		}
	});

	it('returns 400 error for invalid credentials', async () => {
		const authApi = {
			signInEmail: vi.fn().mockResolvedValue(makeErrorResponse(401)),
			signOut: vi.fn()
		};

		const result = await signInAdmin('bad@example.com', 'wrong', authApi);

		expect(result.type).toBe('error');
		if (result.type === 'error') {
			expect(result.status).toBe(400);
			expect(result.message).toBe('Invalid credentials');
		}
	});

	it('returns 400 error when signInEmail throws', async () => {
		const authApi = {
			signInEmail: vi.fn().mockRejectedValue(new Error('network error')),
			signOut: vi.fn()
		};

		const result = await signInAdmin('admin@example.com', 'pass', authApi);

		expect(result.type).toBe('error');
		if (result.type === 'error') {
			expect(result.status).toBe(400);
		}
	});

	it('returns 403 and signs out when credentials are valid but role is not admin', async () => {
		const signOut = vi.fn().mockResolvedValue({ success: true });
		const authApi = {
			signInEmail: vi.fn().mockResolvedValue(makeOkResponse('user')),
			signOut
		};

		const result = await signInAdmin('user@example.com', 'correct', authApi);

		expect(result.type).toBe('error');
		if (result.type === 'error') {
			expect(result.status).toBe(403);
			expect(result.message).toBe('Not authorised');
		}
		expect(signOut).toHaveBeenCalled();
	});
});

describe('signIn', () => {
	it('redirects an admin to /admin on success', async () => {
		const signInEmail = vi.fn().mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });

		const result = await signIn('admin@example.com', 'correct', '/', { signInEmail });

		expect(signInEmail).toHaveBeenCalledWith({
			body: { email: 'admin@example.com', password: 'correct' }
		});
		expect(result).toEqual({ type: 'redirect', location: '/admin' });
	});

	it('redirects a non-admin to the requested destination on success', async () => {
		const signInEmail = vi.fn().mockResolvedValue({ user: { id: 'user-1', role: 'user' } });

		const result = await signIn('user@example.com', 'correct', '/?date=2024-07-20', {
			signInEmail
		});

		expect(signInEmail).toHaveBeenCalledWith({
			body: { email: 'user@example.com', password: 'correct' }
		});
		expect(result).toEqual({ type: 'redirect', location: '/?date=2024-07-20' });
	});

	it('redirects to the requested destination when the user has no explicit role', async () => {
		const signInEmail = vi.fn().mockResolvedValue({ user: { id: 'user-1' } });

		const result = await signIn('user@example.com', 'correct', '/?date=2024-07-20', {
			signInEmail
		});

		expect(result).toEqual({ type: 'redirect', location: '/?date=2024-07-20' });
	});

	it('returns an error when credentials are invalid', async () => {
		const signInEmail = vi.fn().mockRejectedValue(new Error('invalid credentials'));

		const result = await signIn('user@example.com', 'wrong', '/', { signInEmail });

		expect(result).toEqual({ type: 'error', message: 'Invalid email or password' });
	});

	it('returns an error without calling the API when email or password is missing', async () => {
		const signInEmail = vi.fn();

		const result = await signIn('', '', '/', { signInEmail });

		expect(result).toEqual({ type: 'error', message: 'Email and password are required' });
		expect(signInEmail).not.toHaveBeenCalled();
	});
});

describe('signUp', () => {
	it('returns a redirect to the requested destination on success', async () => {
		const signUpEmail = vi.fn().mockResolvedValue({ user: { id: 'user-1' } });
		const promote = vi.fn().mockResolvedValue(undefined);

		const result = await signUp('Ada Lovelace', 'ada@example.com', 'correct', '/', {
			authApi: { signUpEmail },
			promote
		});

		expect(signUpEmail).toHaveBeenCalledWith({
			body: { name: 'Ada Lovelace', email: 'ada@example.com', password: 'correct' }
		});
		expect(promote).toHaveBeenCalledWith('user-1');
		expect(result).toEqual({ type: 'redirect', location: '/' });
	});

	it('returns an error when the account cannot be created', async () => {
		const signUpEmail = vi.fn().mockRejectedValue(new Error('email already exists'));
		const promote = vi.fn();

		const result = await signUp('Ada Lovelace', 'ada@example.com', 'correct', '/', {
			authApi: { signUpEmail },
			promote
		});

		expect(result).toEqual({ type: 'error', message: 'Unable to create account' });
		expect(promote).not.toHaveBeenCalled();
	});

	it('returns an error without calling the API when required fields are missing', async () => {
		const signUpEmail = vi.fn();
		const promote = vi.fn();

		const result = await signUp('', '', '', '/', { authApi: { signUpEmail }, promote });

		expect(result).toEqual({ type: 'error', message: 'Name, email, and password are required' });
		expect(signUpEmail).not.toHaveBeenCalled();
		expect(promote).not.toHaveBeenCalled();
	});
});

describe('maybePromoteFirstRegistrantToAdmin', () => {
	it('promotes the first registrant to admin when no seed vars and no admin exists', async () => {
		const { db, tx, getUpdates } = createMockDb(0);

		await maybePromoteFirstRegistrantToAdmin('user-1', { db, env: {} });

		expect(tx.execute).toHaveBeenCalledOnce();
		expect(getUpdates()).toEqual([{ role: 'admin', emailVerified: true }]);
	});

	it('does not promote a later registrant when an admin already exists', async () => {
		const { db, tx, getUpdates } = createMockDb(1);

		await maybePromoteFirstRegistrantToAdmin('user-2', { db, env: {} });

		expect(tx.execute).toHaveBeenCalledOnce();
		expect(getUpdates()).toEqual([{ emailVerified: true }]);
	});

	it('does not promote a registrant when seed vars are set even if no admin exists yet', async () => {
		const { db, getUpdates } = createMockDb(0);

		await maybePromoteFirstRegistrantToAdmin('user-1', {
			db,
			env: { ADMIN_SEED_EMAIL: 'admin@example.com', ADMIN_SEED_PASSWORD: 'supersecret' }
		});

		expect(getUpdates()).toEqual([{ emailVerified: true }]);
	});
});
