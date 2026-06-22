import { describe, it, expect, vi } from 'vitest';
import { resolveUnmappedCategory } from './resolve';

function makeDeps(overrides: Partial<Parameters<typeof resolveUnmappedCategory>[1]> = {}) {
	return {
		insertMapping: vi.fn().mockResolvedValue(undefined),
		markResolved: vi.fn().mockResolvedValue(undefined),
		findAffectedEventIds: vi.fn().mockResolvedValue([]),
		insertEventTopic: vi.fn().mockResolvedValue(undefined),
		...overrides
	};
}

const BASE_PARAMS = {
	unmappedId: 1,
	rawCategory: 'Jazz musicians',
	topicId: 10,
	subtopicId: null
};

describe('resolveUnmappedCategory', () => {
	it('inserts a taxonomy mapping for the resolved category', async () => {
		const deps = makeDeps();
		await resolveUnmappedCategory(BASE_PARAMS, deps);
		expect(deps.insertMapping).toHaveBeenCalledOnce();
		expect(deps.insertMapping).toHaveBeenCalledWith({
			rawCategory: 'Jazz musicians',
			topicId: 10,
			subtopicId: null
		});
	});

	it('marks the unmapped category as resolved', async () => {
		const deps = makeDeps();
		await resolveUnmappedCategory(BASE_PARAMS, deps);
		expect(deps.markResolved).toHaveBeenCalledOnce();
		expect(deps.markResolved).toHaveBeenCalledWith(1);
	});

	it('backfills eventTopics for all events carrying that raw category', async () => {
		const deps = makeDeps({ findAffectedEventIds: vi.fn().mockResolvedValue([42, 99]) });
		await resolveUnmappedCategory(BASE_PARAMS, deps);
		expect(deps.insertEventTopic).toHaveBeenCalledTimes(2);
		expect(deps.insertEventTopic).toHaveBeenCalledWith({ eventId: 42, topicId: 10, subtopicId: null });
		expect(deps.insertEventTopic).toHaveBeenCalledWith({ eventId: 99, topicId: 10, subtopicId: null });
	});

	it('does not call insertEventTopic when no events carry that raw category', async () => {
		const deps = makeDeps({ findAffectedEventIds: vi.fn().mockResolvedValue([]) });
		await resolveUnmappedCategory(BASE_PARAMS, deps);
		expect(deps.insertEventTopic).not.toHaveBeenCalled();
	});

	it('returns the count of backfilled events', async () => {
		const deps = makeDeps({ findAffectedEventIds: vi.fn().mockResolvedValue([42, 99]) });
		const result = await resolveUnmappedCategory(BASE_PARAMS, deps);
		expect(result.backfilledCount).toBe(2);
	});
});
