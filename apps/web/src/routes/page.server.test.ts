import { describe, expect, it, vi } from 'vitest';
import type { EventWithTopics } from './+page.server';
import { _createLoad } from './+page.server';

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

const STUB_USER = { id: 'user-1', email: 'test@example.com' };

function makeUrl(params: Record<string, string> = {}) {
	const url = new URL('http://localhost/');
	for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
	return url;
}

function makeDeps(overrides: Partial<Parameters<typeof _createLoad>[0]> = {}): Parameters<typeof _createLoad>[0] {
	return {
		getTopics: vi.fn().mockResolvedValue([]),
		getEvents: vi.fn().mockResolvedValue([]),
		getEventCount: vi.fn().mockResolvedValue(0),
		getRunningImportCount: vi.fn().mockResolvedValue(0),
		runImportForDate: vi.fn().mockResolvedValue({ eventsUpserted: 1, unmappedCount: 0 }),
		...overrides
	};
}

function makeLocals(user?: typeof STUB_USER) {
	return { user } as App.Locals;
}

describe('load — authentication branch', () => {
	it('returns timeline-shaped data when locals.user is present', async () => {
		const deps = makeDeps({
			getEvents: vi.fn().mockResolvedValue(FRESH_EVENTS)
		});

		const load = _createLoad(deps);
		const result = await load({ url: makeUrl(), locals: makeLocals(STUB_USER) } as never);

		expect(result).toMatchObject({
			view: 'timeline',
			events: FRESH_EVENTS,
			granularity: 'today',
			topicSlug: null,
			topics: []
		});
		expect(deps.getEvents).toHaveBeenCalled();
	});

	it('returns landing-shaped data when locals.user is absent', async () => {
		const deps = makeDeps();

		const load = _createLoad(deps);
		const result = await load({ url: makeUrl(), locals: makeLocals() } as never);

		expect(result).toEqual({
			view: 'landing',
			redirectTo: '/',
			date: null,
			granularity: 'today',
			topicSlug: null
		});
		expect(deps.getTopics).not.toHaveBeenCalled();
		expect(deps.getEvents).not.toHaveBeenCalled();
		expect(deps.getRunningImportCount).not.toHaveBeenCalled();
		expect(deps.runImportForDate).not.toHaveBeenCalled();
	});

	it('preserves incoming timeline query params on the landing view', async () => {
		const deps = makeDeps();

		const load = _createLoad(deps);
		const result = await load({
			url: makeUrl({ date: '2024-07-20', granularity: 'week', topic: 'historical' }),
			locals: makeLocals()
		} as never);

		expect(result).toEqual({
			view: 'landing',
			redirectTo: '/?date=2024-07-20&granularity=week&topic=historical',
			date: '2024-07-20',
			granularity: 'week',
			topicSlug: 'historical'
		});
		expect(deps.getTopics).not.toHaveBeenCalled();
		expect(deps.getEvents).not.toHaveBeenCalled();
		expect(deps.getRunningImportCount).not.toHaveBeenCalled();
		expect(deps.runImportForDate).not.toHaveBeenCalled();
	});
});

describe('load — auto-import behaviour', () => {
	it('triggers an import and returns fresh events when today has no events and no import is running', async () => {
		const deps = makeDeps({
			getEvents: vi
				.fn()
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce(FRESH_EVENTS),
			getEventCount: vi.fn().mockResolvedValue(0)
		});

		const load = _createLoad(deps);
		const result = await load({ url: makeUrl(), locals: makeLocals(STUB_USER) } as never);

		expect(deps.getEventCount).toHaveBeenCalledWith({ months: [TODAY_MONTH], days: [TODAY_DAY] });
		expect(deps.runImportForDate).toHaveBeenCalledWith(TODAY_MONTH, TODAY_DAY);
		expect(result).toMatchObject({ view: 'timeline', events: FRESH_EVENTS });
	});

	it('skips the import when a running import already exists', async () => {
		const deps = makeDeps({
			getRunningImportCount: vi.fn().mockResolvedValue(1)
		});

		const load = _createLoad(deps);
		await load({ url: makeUrl(), locals: makeLocals(STUB_USER) } as never);

		expect(deps.runImportForDate).not.toHaveBeenCalled();
	});

	it('does not trigger an import when events already exist for today', async () => {
		const deps = makeDeps({
			getEvents: vi.fn().mockResolvedValue(FRESH_EVENTS),
			getEventCount: vi.fn().mockResolvedValue(3)
		});

		const load = _createLoad(deps);
		await load({ url: makeUrl(), locals: makeLocals(STUB_USER) } as never);

		expect(deps.getEventCount).toHaveBeenCalledWith({ months: [TODAY_MONTH], days: [TODAY_DAY] });
		expect(deps.runImportForDate).not.toHaveBeenCalled();
	});

	it('does not trigger an import when the unfiltered day has events but the selected topic is empty', async () => {
		const deps = makeDeps({
			getTopics: vi.fn().mockResolvedValue([{ id: 7, name: 'Filtered Topic', slug: 'filtered' }]),
			getEvents: vi.fn().mockResolvedValue([]),
			getEventCount: vi.fn().mockResolvedValue(5)
		});

		const load = _createLoad(deps);
		await load({ url: makeUrl({ topic: 'filtered' }), locals: makeLocals(STUB_USER) } as never);

		expect(deps.runImportForDate).not.toHaveBeenCalled();
	});

	it('does not trigger an import when granularity is not today', async () => {
		const deps = makeDeps();

		const load = _createLoad(deps);
		await load({ url: makeUrl({ granularity: 'week' }), locals: makeLocals(STUB_USER) } as never);

		expect(deps.runImportForDate).not.toHaveBeenCalled();
	});
});
