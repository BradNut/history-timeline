import { db } from '$lib/server/db';
import { events, eventTopics, topics, subtopics } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id) || id < 1) error(400, 'Invalid id');

	const event = await db.query.events.findFirst({ where: eq(events.id, id) });
	if (!event) error(404, 'Event not found');

	const allTopics = await db.select().from(topics).orderBy(topics.name);
	const allSubtopics = await db.select().from(subtopics).orderBy(subtopics.name);

	const currentTopics = await db
		.select({ topicId: eventTopics.topicId, subtopicId: eventTopics.subtopicId })
		.from(eventTopics)
		.where(eq(eventTopics.eventId, id));

	return { event, topics: allTopics, subtopics: allSubtopics, currentTopics };
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const id = Number(params.id);
		const form = await request.formData();

		const title = String(form.get('title')).trim();
		const description = form.get('description') ? String(form.get('description')).trim() : null;
		const imageUrl = form.get('imageUrl') ? String(form.get('imageUrl')).trim() : null;
		const sourceUrl = form.get('sourceUrl') ? String(form.get('sourceUrl')).trim() : null;

		if (!title) return fail(400, { error: 'Title required' });

		await db
			.update(events)
			.set({ title, description, imageUrl, sourceUrl, updatedAt: new Date() })
			.where(eq(events.id, id));

		redirect(303, `/admin/events/${id}`);
	}
};
