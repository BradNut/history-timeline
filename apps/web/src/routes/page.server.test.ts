import { describe, it, expect, vi } from 'vitest';
import { _createLoad } from './+page.server';
import type { EventWithTopics } from './+page.server';

const TODAY_MONTH = new Date().getMonth() + 1;
const TODAY_DAY = new Date().getDate();

const FRESH_EVENTS: EventWithTopics[] = [
	{
		id: 1,
		title: 'Moon landing',
		description: null,
		eventDate: '1969-07-20',
		year: 1969,
		month: TODAY_MONTH,
		day: TODAY_DAY,
		imageUrl: null,
		sourceUrl: null,
		sourceType: 'event',
		topics: []
	}
];

function makeUrl(params: Record<string, string> = {}) {
	const url = new URL('http://localhost/');
	for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
	return url;
}

function makeDeps(overrides: Partial<Parameters<typeof _createLoad>[0]> = {}) {
	return {
		getTopics: vi.fn().mockResolvedValue([]),
		getEvents: vi.fn().mockResolvedValue([]),
		getRunningImportCount: vi.fn().mockResolvedValue(0),
		runImportForDate: vi.fn().mockResolvedValue({ eventsUpserted: 1, unmappedCount: 0 }),
		...overrides
	};
}

describe('load — auto-import behaviour', () => {
	it('triggers an import and returns fresh events when today has no events and no import is running', async () => {
		const deps = makeDeps({
			getEvents: vi
				.fn()
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce(FRESH_EVENTS)
		});

		const load = _createLoad(deps);
		const result = await load({ url: makeUrl() } as never);

		const data = result as { events: EventWithTopics[] };
		expect(deps.runImportForDate).toHaveBeenCalledWith(TODAY_MONTH, TODAY_DAY);
		expect(data.events).toEqual(FRESH_EVENTS);
	});

	it('skips the import when a running import already exists', async () => {
		const deps = makeDeps({
			getRunningImportCount: vi.fn().mockResolvedValue(1)
		});

		const load = _createLoad(deps);
		await load({ url: makeUrl() } as never);

		expect(deps.runImportForDate).not.toHaveBeenCalled();
	});

	it('does not trigger an import when events already exist for today', async () => {
		const deps = makeDeps({
			getEvents: vi.fn().mockResolvedValue(FRESH_EVENTS)
		});

		const load = _createLoad(deps);
		await load({ url: makeUrl() } as never);

		expect(deps.runImportForDate).not.toHaveBeenCalled();
	});

	it('does not trigger an import when granularity is not today', async () => {
		const deps = makeDeps();

		const load = _createLoad(deps);
		await load({ url: makeUrl({ granularity: 'week' }) } as never);

		expect(deps.runImportForDate).not.toHaveBeenCalled();
	});
});
