import { db } from '$lib/server/db';
import { topics, subtopics, taxonomyMappings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const allTopics = await db.select().from(topics).orderBy(topics.name);
	const allSubtopics = await db.select().from(subtopics).orderBy(subtopics.name);
	const mappings = await db
		.select({
			id: taxonomyMappings.id,
			rawCategory: taxonomyMappings.rawCategory,
			topicName: topics.name,
			subtopicName: subtopics.name
		})
		.from(taxonomyMappings)
		.leftJoin(topics, eq(topics.id, taxonomyMappings.topicId))
		.leftJoin(subtopics, eq(subtopics.id, taxonomyMappings.subtopicId))
		.orderBy(taxonomyMappings.rawCategory);

	return { topics: allTopics, subtopics: allSubtopics, mappings };
};

export const actions: Actions = {
	addTopic: async ({ request }) => {
		const form = await request.formData();
		const name = String(form.get('name')).trim();
		if (!name) return fail(400, { error: 'Name required' });
		const slug = name.toLowerCase().replaceAll(' ', '-');
		await db.insert(topics).values({ name, slug }).onConflictDoNothing();
		redirect(303, '/admin/taxonomy');
	},

	addSubtopic: async ({ request }) => {
		const form = await request.formData();
		const name = String(form.get('name')).trim();
		const topicId = Number(form.get('topicId'));
		if (!name || !topicId) return fail(400, { error: 'Missing fields' });
		const slug = name.toLowerCase().replaceAll(' ', '-');
		await db.insert(subtopics).values({ topicId, name, slug }).onConflictDoNothing();
		redirect(303, '/admin/taxonomy');
	},

	deleteMapping: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!id) return fail(400, { error: 'ID required' });
		await db.delete(taxonomyMappings).where(eq(taxonomyMappings.id, id));
		redirect(303, '/admin/taxonomy');
	}
};
