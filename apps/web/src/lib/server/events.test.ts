import { describe, expect, it, vi } from 'vitest';
import type { EventWithTopics } from '../../routes/+page.server';
import { getEventCount, getEvents, getTopicsInWindow } from './events';

const CACHED_EVENTS: EventWithTopics[] = [
	{
		id: 1,
		title: 'Cached Event',
		description: 'from cache',
		eventDate: '2024-06-21',
		year: 2024,
		month: 6,
		day: 21,
		imageUrl: null,
		sourceUrl: null,
		sourceType: null,
		topics: []
	}
];

const DB_EVENTS: EventWithTopics[] = [
	{
		id: 2,
		title: 'DB Event',
		description: 'from db',
		eventDate: '2024-06-21',
		year: 2024,
		month: 6,
		day: 21,
		imageUrl: null,
		sourceUrl: null,
		sourceType: null,
		topics: []
	}
];

function makeParams(overrides: Partial<Parameters<typeof getEvents>[0]> = {}) {
	return { dates: [{ month: 6, day: 21 }], topicIdFilter: undefined, ...overrides };
}

function makeCacheMissDeps(dbResult: EventWithTopics[] = DB_EVENTS) {
	return {
		cache: {
			get: vi.fn().mockResolvedValue(null),
			setWithExpiry: vi.fn().mockResolvedValue(undefined)
		},
		db: { query: vi.fn().mockResolvedValue(dbResult) }
	};
}

async function runGetEventsCacheMiss(deps: ReturnType<typeof makeCacheMissDeps>) {
	const result = await getEvents(makeParams(), { cache: deps.cache, db: deps.db as never });
	expect(result).toEqual(DB_EVENTS);
	expect(deps.db.query).toHaveBeenCalledOnce();
	return result;
}

describe('getEvents', () => {
	it('returns cached events without querying the DB on a cache hit', async () => {
		const cache = {
			get: vi.fn().mockResolvedValue(JSON.stringify(CACHED_EVENTS)),
			setWithExpiry: vi.fn()
		};
		const db = { query: vi.fn() };

		const result = await getEvents(makeParams(), { cache, db: db as never });

		expect(result).toEqual(CACHED_EVENTS);
		expect(db.query).not.toHaveBeenCalled();
		expect(cache.setWithExpiry).not.toHaveBeenCalled();
	});

	it('queries the DB, caches the result, and returns events on a cache miss', async () => {
		const deps = makeCacheMissDeps();

		await runGetEventsCacheMiss(deps);

		expect(deps.cache.setWithExpiry).toHaveBeenCalledOnce();
		const setCall = deps.cache.setWithExpiry.mock.calls[0][0];
		expect(setCall.value).toBe(JSON.stringify(DB_EVENTS));
		expect(setCall.expiry).toBe(86400);
	});

	it('falls through to the DB and returns events when the cache is unavailable', async () => {
		const deps = makeCacheMissDeps();

		await runGetEventsCacheMiss(deps);
	});
});

describe('getEventCount', () => {
	it('returns the number of events matching the month/day set', async () => {
		const db = { count: vi.fn().mockResolvedValue(5) };

		const result = await getEventCount({ dates: [{ month: 6, day: 21 }] }, { db });

		expect(result).toBe(5);
		expect(db.count).toHaveBeenCalledWith({ dates: [{ month: 6, day: 21 }] });
	});

	it('returns zero when no events match', async () => {
		const db = { count: vi.fn().mockResolvedValue(0) };

		const result = await getEventCount({ dates: [{ month: 6, day: 21 }] }, { db });

		expect(result).toBe(0);
	});
});

const TOPIC_A = { id: 1, name: 'Topic A', slug: 'topic-a' };
const TOPIC_B = { id: 2, name: 'Topic B', slug: 'topic-b' };
const TOPIC_C = { id: 3, name: 'Topic C', slug: 'topic-c' };

const ALL_TOPICS = [TOPIC_A, TOPIC_B, TOPIC_C];

const TOPIC_EVENTS = [
	{ topicId: 1, month: 6, day: 19 },
	{ topicId: 1, month: 6, day: 20 },
	{ topicId: 2, month: 6, day: 21 },
	{ topicId: 3, month: 6, day: 25 }
];

function createMockTopicsDb() {
	return {
		query: vi.fn(async (params: { dates: Array<{ month: number; day: number }> }) => {
			const dateSet = new Set(params.dates.map((d) => `${d.month}-${d.day}`));
			const topicIds = new Set(
				TOPIC_EVENTS.filter((e) => dateSet.has(`${e.month}-${e.day}`)).map((e) => e.topicId)
			);
			return ALL_TOPICS.filter((t) => topicIds.has(t.id));
		})
	};
}

describe('getTopicsInWindow', () => {
	it('returns only topics that have events inside the window', async () => {
		const db = createMockTopicsDb();
		const result = await getTopicsInWindow(
			{ dates: [{ month: 6, day: 20 }, { month: 6, day: 21 }, { month: 6, day: 22 }] },
			{ db }
		);
		expect(result.map((t) => t.id)).toEqual([1, 2]);
	});

	it('excludes topics whose events fall outside the window', async () => {
		const db = createMockTopicsDb();
		const result = await getTopicsInWindow({ dates: [{ month: 6, day: 21 }] }, { db });
		expect(result).toEqual([TOPIC_B]);
	});

	it('deduplicates topics when multiple events match', async () => {
		const db = createMockTopicsDb();
		const result = await getTopicsInWindow(
			{ dates: [{ month: 6, day: 19 }, { month: 6, day: 20 }, { month: 6, day: 21 }] },
			{ db }
		);
		const ids = result.map((t) => t.id);
		expect(ids).toEqual([...new Set(ids)]);
		expect(ids).toContain(1);
	});
});
