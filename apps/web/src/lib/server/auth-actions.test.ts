import { describe, expect, it, vi } from 'vitest';
import { signIn, signUp } from './auth-actions';

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
