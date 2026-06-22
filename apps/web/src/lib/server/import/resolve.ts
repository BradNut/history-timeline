import { db as defaultDb } from '$lib/server/db';
import { taxonomyMappings, unmappedCategories, events, eventTopics } from '$lib/server/db/schema';
import { eq, arrayContains } from 'drizzle-orm';

export type ResolveParams = {
	unmappedId: number;
	rawCategory: string;
	topicId: number;
	subtopicId: number | null;
};

type Deps = {
	insertMapping: (data: { rawCategory: string; topicId: number; subtopicId: number | null }) => Promise<void>;
	markResolved: (unmappedId: number) => Promise<void>;
	findAffectedEventIds: (rawCategory: string) => Promise<number[]>;
	insertEventTopic: (data: { eventId: number; topicId: number; subtopicId: number | null }) => Promise<void>;
};

const defaultDeps: Deps = {
	insertMapping: async (data) => {
		await defaultDb.insert(taxonomyMappings).values(data).onConflictDoNothing();
	},
	markResolved: async (unmappedId) => {
		await defaultDb.update(unmappedCategories).set({ resolved: true }).where(eq(unmappedCategories.id, unmappedId));
	},
	findAffectedEventIds: async (rawCategory) => {
		const rows = await defaultDb
			.select({ id: events.id })
			.from(events)
			.where(arrayContains(events.rawCategories, [rawCategory]));
		return rows.map((r) => r.id);
	},
	insertEventTopic: async (data) => {
		await defaultDb.insert(eventTopics).values(data).onConflictDoNothing();
	}
};

export async function resolveUnmappedCategory(
	params: ResolveParams,
	deps: Deps = defaultDeps
): Promise<{ backfilledCount: number }> {
	await deps.insertMapping({
		rawCategory: params.rawCategory,
		topicId: params.topicId,
		subtopicId: params.subtopicId
	});

	await deps.markResolved(params.unmappedId);

	const eventIds = await deps.findAffectedEventIds(params.rawCategory);

	for (const eventId of eventIds) {
		await deps.insertEventTopic({
			eventId,
			topicId: params.topicId,
			subtopicId: params.subtopicId
		});
	}

	return { backfilledCount: eventIds.length };
}
