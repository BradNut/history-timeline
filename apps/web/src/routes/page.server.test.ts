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
		getTopicsInWindow: vi.fn().mockResolvedValue([]),
		getEvents: vi.fn().mockResolvedValue([]),
		getEventCount: vi.fn().mockResolvedValue(0),
		invalidateEventsCache: vi.fn().mockResolvedValue(undefined),
		getRunningImportCount: vi.fn().mockResolvedValue(0),
		runImportForDate: vi.fn().mockResolvedValue({ eventsUpserted: 1, unmappedCount: 0 }),
		...overrides
	};
}

function makeLocals(user?: typeof STUB_USER) {
	return { user } as App.Locals;
}

function expectNoTimelineWork(deps: ReturnType<typeof makeDeps>) {
	expect(deps.getTopicsInWindow).not.toHaveBeenCalled();
	expect(deps.getEvents).not.toHaveBeenCalled();
	expect(deps.getEventCount).not.toHaveBeenCalled();
	expect(deps.invalidateEventsCache).not.toHaveBeenCalled();
	expect(deps.getRunningImportCount).not.toHaveBeenCalled();
	expect(deps.runImportForDate).not.toHaveBeenCalled();
}

async function loadAsTimeline(
	deps: ReturnType<typeof makeDeps> = makeDeps(),
	params: Record<string, string> = {}
) {
	const load = _createLoad(deps);
	const result = await load({ url: makeUrl(params), locals: makeLocals(STUB_USER) } as never);
	if (!result) throw new Error('load returned void');
	return result;
}

async function expectAutoImportResult(
	deps: ReturnType<typeof makeDeps>,
	expectedEvents: EventWithTopics[],
	shouldImport: boolean
) {
	const result = await loadAsTimeline(deps);
	await expect(result.events).resolves.toEqual(expectedEvents);
	expect(deps.getEventCount).toHaveBeenCalledWith({ dates: [{ month: TODAY_MONTH, day: TODAY_DAY }] });
	if (shouldImport) {
		expect(deps.runImportForDate).toHaveBeenCalledWith(TODAY_MONTH, TODAY_DAY);
	} else {
		expect(deps.runImportForDate).not.toHaveBeenCalled();
	}
}

describe('load — authentication branch', () => {
	it('returns timeline-shaped data when locals.user is present', async () => {
		const deps = makeDeps({
			getEvents: vi.fn().mockResolvedValue(FRESH_EVENTS)
		});

		const result = await loadAsTimeline(deps);

		expect(result.view).toBe('timeline');
		expect(result).toMatchObject({
			granularity: 'today',
			topicSlug: null,
			topics: []
		});
		await expect(result.events).resolves.toEqual(FRESH_EVENTS);
		expect(deps.getEvents).toHaveBeenCalled();
	});

	it('parses and serializes the date param as a local calendar date', async () => {
		const deps = makeDeps();

		const result = await loadAsTimeline(deps, { date: '2024-06-15' });

		expect(result.anchorDate).toBe('2024-06-15');
		const eventsCall = vi.mocked(deps.getEvents).mock.calls[0][0];
		expect(eventsCall.dates).toEqual([{ month: 6, day: 15 }]);
		const topicsCall = vi.mocked(deps.getTopicsInWindow).mock.calls[0][0];
		expect(topicsCall.dates).toEqual([
			{ month: 6, day: 14 },
			{ month: 6, day: 15 },
			{ month: 6, day: 16 }
		]);
	});

	it('returns topics scoped to the anchor date ±1 day window', async () => {
		const windowedTopics = [{ id: 5, name: 'Scoped Topic', slug: 'scoped-topic' }];
		const deps = makeDeps({
			getTopicsInWindow: vi.fn().mockResolvedValue(windowedTopics)
		});

		const result = await loadAsTimeline(deps, { date: '2024-07-20' });

		expect(deps.getTopicsInWindow).toHaveBeenCalledOnce();
		const call = vi.mocked(deps.getTopicsInWindow).mock.calls[0][0];
		expect(call).toHaveProperty('dates');
		expect(call.dates).toHaveLength(3);
		expect(result).toMatchObject({
			view: 'timeline',
			topics: windowedTopics
		});
	});

	it('uses exact month-day pairs when the topic window spans a month boundary', async () => {
		const deps = makeDeps();

		await loadAsTimeline(deps, { date: '2024-01-31' });

		const call = vi.mocked(deps.getTopicsInWindow).mock.calls[0][0];
		expect(call.dates).toEqual([
			{ month: 1, day: 30 },
			{ month: 1, day: 31 },
			{ month: 2, day: 1 }
		]);
	});

	it('uses exact month-day pairs when the week window spans a month boundary', async () => {
		const deps = makeDeps();

		await loadAsTimeline(deps, { date: '2024-01-31', granularity: 'week' });

		const call = vi.mocked(deps.getEvents).mock.calls[0][0];
		expect(call.dates).toEqual([
			{ month: 1, day: 28 },
			{ month: 1, day: 29 },
			{ month: 1, day: 30 },
			{ month: 1, day: 31 },
			{ month: 2, day: 1 },
			{ month: 2, day: 2 },
			{ month: 2, day: 3 }
		]);
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
		expectNoTimelineWork(deps);
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
		expectNoTimelineWork(deps);
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

		await expectAutoImportResult(deps, FRESH_EVENTS, true);
	});

	it('skips the import when a running import already exists', async () => {
		const deps = makeDeps({
			getRunningImportCount: vi.fn().mockResolvedValue(1)
		});

		const result = await loadAsTimeline(deps);

		await expect(result.events).resolves.toEqual([]);
		expect(deps.runImportForDate).not.toHaveBeenCalled();
	});

	it('does not trigger an import when events already exist for today', async () => {
		const deps = makeDeps({
			getEvents: vi.fn().mockResolvedValue(FRESH_EVENTS),
			getEventCount: vi.fn().mockResolvedValue(3)
		});

		await expectAutoImportResult(deps, FRESH_EVENTS, false);
	});

	it('invalidates the event cache after importing so the second query is fresh', async () => {
		const deps = makeDeps({
			getEvents: vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce(FRESH_EVENTS),
			getEventCount: vi.fn().mockResolvedValue(0)
		});

		const result = await loadAsTimeline(deps);
		await expect(result.events).resolves.toEqual(FRESH_EVENTS);

		expect(deps.invalidateEventsCache).toHaveBeenCalledWith({
			dates: [{ month: TODAY_MONTH, day: TODAY_DAY }],
			topicIdFilter: undefined
		});
	});

	it('does not trigger an import when the unfiltered day has events but the selected topic is empty', async () => {
		const deps = makeDeps({
			getTopicsInWindow: vi.fn().mockResolvedValue([{ id: 7, name: 'Filtered Topic', slug: 'filtered' }]),
			getEvents: vi.fn().mockResolvedValue([]),
			getEventCount: vi.fn().mockResolvedValue(5)
		});

		const result = await loadAsTimeline(deps, { topic: 'filtered' });

		await expect(result.events).resolves.toEqual([]);
		expect(deps.runImportForDate).not.toHaveBeenCalled();
	});

	it('does not trigger an import when granularity is not today', async () => {
		const deps = makeDeps();

		const result = await loadAsTimeline(deps, { granularity: 'week' });

		await expect(result.events).resolves.toEqual([]);
		expect(deps.runImportForDate).not.toHaveBeenCalled();
	});
});
