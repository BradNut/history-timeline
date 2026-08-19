import { isRedirect } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { _createLoad } from './+page.server';

async function catchRedirect(fn: () => unknown) {
	try {
		await fn();
	} catch (e) {
		if (isRedirect(e)) return e;
		throw e;
	}
	throw new Error('expected a redirect');
}

describe('admin login load', () => {
	it('redirects to /auth/sign-in', async () => {
		const load = _createLoad();
		const err = await catchRedirect(() => load({} as never));

		expect(err.status).toBe(303);
		expect(err.location).toBe('/auth/sign-in');
	});
});
