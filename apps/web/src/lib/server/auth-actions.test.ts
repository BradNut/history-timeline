import { describe, expect, it, vi } from 'vitest';
import { signIn, signInAdmin, signUp } from './auth-actions';

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
	it('returns a redirect to the requested destination on success', async () => {
		const signInEmail = vi.fn().mockResolvedValue({ user: { id: 'user-1' } });

		const result = await signIn('user@example.com', 'correct', '/?date=2024-07-20', {
			signInEmail
		});

		expect(signInEmail).toHaveBeenCalledWith({
			body: { email: 'user@example.com', password: 'correct' }
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

		const result = await signUp('Ada Lovelace', 'ada@example.com', 'correct', '/', {
			signUpEmail
		});

		expect(signUpEmail).toHaveBeenCalledWith({
			body: { name: 'Ada Lovelace', email: 'ada@example.com', password: 'correct' }
		});
		expect(result).toEqual({ type: 'redirect', location: '/' });
	});

	it('returns an error when the account cannot be created', async () => {
		const signUpEmail = vi.fn().mockRejectedValue(new Error('email already exists'));

		const result = await signUp('Ada Lovelace', 'ada@example.com', 'correct', '/', {
			signUpEmail
		});

		expect(result).toEqual({ type: 'error', message: 'Unable to create account' });
	});

	it('returns an error without calling the API when required fields are missing', async () => {
		const signUpEmail = vi.fn();

		const result = await signUp('', '', '', '/', { signUpEmail });

		expect(result).toEqual({ type: 'error', message: 'Name, email, and password are required' });
		expect(signUpEmail).not.toHaveBeenCalled();
	});
});
