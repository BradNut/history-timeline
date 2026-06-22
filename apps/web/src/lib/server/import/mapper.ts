import { db } from '$lib/server/db';
import { taxonomyMappings, unmappedCategories } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export interface MappedTaxonomy {
	topicId: number;
	subtopicId: number | null;
}

export async function mapCategories(
	rawCategories: string[],
	exampleEventId?: number
): Promise<MappedTaxonomy[]> {
	const mapped: MappedTaxonomy[] = [];

	for (const raw of rawCategories) {
		const match = await db.query.taxonomyMappings.findFirst({
			where: eq(taxonomyMappings.rawCategory, raw)
		});

		if (match) {
			mapped.push({ topicId: match.topicId, subtopicId: match.subtopicId ?? null });
		} else {
			await db
				.insert(unmappedCategories)
				.values({
					rawCategory: raw,
					exampleEventId: exampleEventId ?? null,
					resolved: false
				})
				.onConflictDoNothing();
		}
	}

	return mapped;
}
