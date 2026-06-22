import { describe, it, expect, vi } from 'vitest';
import { signInAdmin } from './auth-actions';

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
