import { db } from '$lib/server/db';
import { taxonomyMappings, unmappedCategories, topics, subtopics } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { classifyCategory } from './classify';

export interface MappedTaxonomy {
	topicId: number;
	subtopicId: number | null;
}

type TopicRow = { id: number; name: string; slug: string };
type SubtopicRow = { id: number; topicId: number; slug: string };

type Deps = {
	findMapping: (raw: string) => Promise<MappedTaxonomy | null>;
	insertMapping: (data: { rawCategory: string; topicId: number; subtopicId: number | null }) => Promise<void>;
	insertUnmapped: (raw: string, exampleEventId: number | undefined) => Promise<void>;
	loadTopics: () => Promise<TopicRow[]>;
	loadSubtopics: () => Promise<SubtopicRow[]>;
};

const defaultDeps: Deps = {
	findMapping: async (raw) => {
		const match = await db.query.taxonomyMappings.findFirst({
			where: eq(taxonomyMappings.rawCategory, raw)
		});
		return match ? { topicId: match.topicId, subtopicId: match.subtopicId ?? null } : null;
	},
	insertMapping: async (data) => {
		await db.insert(taxonomyMappings).values(data).onConflictDoNothing();
	},
	insertUnmapped: async (raw, exampleEventId) => {
		await db
			.insert(unmappedCategories)
			.values({ rawCategory: raw, exampleEventId: exampleEventId ?? null, resolved: false })
			.onConflictDoNothing();
	},
	loadTopics: async () => db.select({ id: topics.id, name: topics.name, slug: topics.slug }).from(topics),
	loadSubtopics: async () => db.select({ id: subtopics.id, topicId: subtopics.topicId, slug: subtopics.slug }).from(subtopics)
};

export async function mapCategories(
	rawCategories: string[],
	exampleEventId?: number,
	deps: Deps = defaultDeps
): Promise<MappedTaxonomy[]> {
	const mapped: MappedTaxonomy[] = [];

	const topicRows = await deps.loadTopics();
	const subtopicRows = await deps.loadSubtopics();

	for (const raw of rawCategories) {
		const existing = await deps.findMapping(raw);
		if (existing) {
			mapped.push(existing);
			continue;
		}

		const classified = classifyCategory(raw, topicRows, subtopicRows);
		if (classified) {
			await deps.insertMapping({ rawCategory: raw, topicId: classified.topicId, subtopicId: classified.subtopicId });
			mapped.push(classified);
			continue;
		}

		await deps.insertUnmapped(raw, exampleEventId);
	}

	return mapped;
}
