import { isRedirect } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';
import { _createActions, _createLoad } from './+page.server';

function makeUrl(params: Record<string, string> = {}) {
	const url = new URL('http://localhost/auth/sign-in');
	for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
	return url;
}

function makeFormData(fields: Record<string, string>) {
	const form = new FormData();
	for (const [k, v] of Object.entries(fields)) form.set(k, v);
	return form;
}

async function catchRedirect(fn: () => unknown) {
	try {
		await fn();
	} catch (e) {
		if (isRedirect(e)) return e;
		throw e;
	}
	throw new Error('expected a redirect');
}

describe('sign-in load', () => {
	it('redirects already-authenticated users to the requested destination', async () => {
		const load = _createLoad();
		const err = await catchRedirect(() =>
			load({
				url: makeUrl({ redirectTo: '/?date=2024-07-20' }),
				locals: { user: { id: 'user-1' } }
			} as never)
		);

		expect(err.status).toBe(303);
		expect(err.location).toBe('/?date=2024-07-20');
	});

	it('returns the sanitised redirect target for anonymous visitors', async () => {
		const load = _createLoad();
		const result = await load({
			url: makeUrl({ redirectTo: '//evil.com' }),
			locals: {}
		} as never);

		expect(result).toEqual({ redirectTo: '/', registrationEnabled: true });
	});
});

describe('sign-in load registration flag', () => {
	it('includes registrationEnabled: true when registration is enabled', async () => {
		const load = _createLoad({ isRegistrationEnabled: () => true });
		const result = await load({ url: makeUrl(), locals: {} } as never);

		expect(result).toEqual({ redirectTo: '/', registrationEnabled: true });
	});

	it('omits the registrationEnabled flag when registration is disabled', async () => {
		const load = _createLoad({ isRegistrationEnabled: () => false });
		const result = await load({ url: makeUrl(), locals: {} } as never);

		expect(result).toEqual({ redirectTo: '/' });
		expect(result).not.toHaveProperty('registrationEnabled');
	});
});

describe('sign-in actions', () => {
	it('redirects to "/" by default when sign-in succeeds', async () => {
		const signIn = vi.fn().mockResolvedValue({ type: 'redirect', location: '/' });
		const actions = _createActions({ signIn });

		const request = new Request('http://localhost/auth/sign-in', {
			method: 'POST',
			body: makeFormData({ email: 'user@example.com', password: 'correct' })
		});

		const err = await catchRedirect(() =>
			actions.default({ request, url: makeUrl() } as never)
		);

		expect(signIn).toHaveBeenCalledWith('user@example.com', 'correct', '/');
		expect(err.status).toBe(303);
		expect(err.location).toBe('/');
	});

	it('redirects back to the requested timeline view when sign-in succeeds', async () => {
		const signIn = vi
			.fn()
			.mockResolvedValue({ type: 'redirect', location: '/?date=2024-07-20&granularity=week' });
		const actions = _createActions({ signIn });

		const request = new Request('http://localhost/auth/sign-in', {
			method: 'POST',
			body: makeFormData({
				email: 'user@example.com',
				password: 'correct',
				redirectTo: '/?date=2024-07-20&granularity=week'
			})
		});

		const err = await catchRedirect(() =>
			actions.default({ request, url: makeUrl() } as never)
		);

		expect(signIn).toHaveBeenCalledWith(
			'user@example.com',
			'correct',
			'/?date=2024-07-20&granularity=week'
		);
		expect(err.location).toBe('/?date=2024-07-20&granularity=week');
	});

	it('ignores unsafe redirect targets and falls back to "/"', async () => {
		const signIn = vi.fn().mockResolvedValue({ type: 'redirect', location: '/' });
		const actions = _createActions({ signIn });

		const request = new Request('http://localhost/auth/sign-in', {
			method: 'POST',
			body: makeFormData({
				email: 'user@example.com',
				password: 'correct',
				redirectTo: '//evil.com'
			})
		});

		await catchRedirect(() => actions.default({ request, url: makeUrl() } as never));

		expect(signIn).toHaveBeenCalledWith('user@example.com', 'correct', '/');
	});

	it('returns a form error and does not redirect when sign-in fails', async () => {
		const signIn = vi.fn().mockResolvedValue({ type: 'error', message: 'Invalid email or password' });
		const actions = _createActions({ signIn });

		const request = new Request('http://localhost/auth/sign-in', {
			method: 'POST',
			body: makeFormData({ email: 'user@example.com', password: 'wrong' })
		});

		const result = (await actions.default({ request, url: makeUrl() } as never)) as {
			status: number;
			data: { error: string };
		};

		expect(result.status).toBe(400);
		expect(result.data).toEqual({ error: 'Invalid email or password' });
	});
});
