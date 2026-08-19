import { isRedirect } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { _createLoad } from './+layout.server';

async function catchRedirect(fn: () => unknown) {
	try {
		await fn();
	} catch (e) {
		if (isRedirect(e)) return e;
		throw e;
	}
	throw new Error('expected a redirect');
}

describe('admin layout load', () => {
	it('redirects unauthenticated visitors to /auth/sign-in', async () => {
		const load = _createLoad();
		const err = await catchRedirect(() => load({ locals: {} } as never));

		expect(err.status).toBe(303);
		expect(err.location).toBe('/auth/sign-in');
	});

	it('redirects non-admin users to /auth/sign-in', async () => {
		const load = _createLoad();
		const err = await catchRedirect(() =>
			load({ locals: { user: { id: 'user-1', role: 'user' } } } as never)
		);

		expect(err.status).toBe(303);
		expect(err.location).toBe('/auth/sign-in');
	});

	it('returns the user for admin users', async () => {
		const load = _createLoad();
		const result = await load({
			locals: { user: { id: 'admin-1', role: 'admin' } }
		} as never);

		expect(result).toEqual({ user: { id: 'admin-1', role: 'admin' } });
	});
});
