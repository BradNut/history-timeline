import { describe, expect, it } from 'vitest';
import { GET } from './+server';

describe('GET /api/health', () => {
	it('returns 200 with an ok status', async () => {
		const response = GET({} as Parameters<typeof GET>[0]);
		const resolved = await response;

		expect(resolved.status).toBe(200);
		expect(await resolved.json()).toEqual({ status: 'ok' });
	});
});
