import { db } from '$lib/server/db';
import { unmappedCategories, topics, subtopics, events } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { resolveUnmappedCategory } from '$lib/server/import/resolve';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const unresolved = await db
		.select({
			id: unmappedCategories.id,
			rawCategory: unmappedCategories.rawCategory,
			exampleTitle: events.title
		})
		.from(unmappedCategories)
		.leftJoin(events, eq(events.id, unmappedCategories.exampleEventId))
		.where(eq(unmappedCategories.resolved, false))
		.limit(50);

	const allTopics = await db.select().from(topics).orderBy(topics.name);
	const allSubtopics = await db.select().from(subtopics).orderBy(subtopics.name);

	return { unresolved, topics: allTopics, subtopics: allSubtopics };
};

export const actions: Actions = {
	resolve: async ({ request }) => {
		const form = await request.formData();
		const unmappedId = Number(form.get('unmappedId'));
		const topicId = Number(form.get('topicId'));
		const subtopicId = form.get('subtopicId') ? Number(form.get('subtopicId')) : null;
		const rawCategory = String(form.get('rawCategory'));

		if (!unmappedId || !topicId || !rawCategory) return fail(400, { error: 'Missing fields' });

		await resolveUnmappedCategory({ unmappedId, rawCategory, topicId, subtopicId });

		redirect(303, '/admin/unmapped');
	}
};
