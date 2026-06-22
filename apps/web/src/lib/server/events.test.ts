import { describe, it, expect, vi } from 'vitest';
import { getEvents } from './events';
import type { EventWithTopics } from '../../routes/+page.server';

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
	return { months: [6], days: [21], topicIdFilter: undefined, ...overrides };
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
		const cache = {
			get: vi.fn().mockResolvedValue(null),
			setWithExpiry: vi.fn().mockResolvedValue(undefined)
		};
		const db = { query: vi.fn().mockResolvedValue(DB_EVENTS) };

		const result = await getEvents(makeParams(), { cache, db: db as never });

		expect(result).toEqual(DB_EVENTS);
		expect(db.query).toHaveBeenCalledOnce();
		expect(cache.setWithExpiry).toHaveBeenCalledOnce();
		const setCall = cache.setWithExpiry.mock.calls[0][0];
		expect(setCall.value).toBe(JSON.stringify(DB_EVENTS));
		expect(setCall.expiry).toBe(86400);
	});

	it('falls through to the DB and returns events when the cache is unavailable', async () => {
		const cache = {
			get: vi.fn().mockResolvedValue(null),
			setWithExpiry: vi.fn().mockResolvedValue(undefined)
		};
		const db = { query: vi.fn().mockResolvedValue(DB_EVENTS) };

		const result = await getEvents(makeParams(), { cache, db: db as never });

		expect(result).toEqual(DB_EVENTS);
		expect(db.query).toHaveBeenCalledOnce();
	});
});
