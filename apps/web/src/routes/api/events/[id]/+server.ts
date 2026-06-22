import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { events, eventTopics, topics, subtopics } from '$lib/server/db/schema';
import { and, eq, ne } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id) || id < 1) error(400, 'Invalid id');

	const rows = await db
		.select({
			id: events.id,
			title: events.title,
			description: events.description,
			eventDate: events.eventDate,
			year: events.year,
			month: events.month,
			day: events.day,
			imageUrl: events.imageUrl,
			sourceUrl: events.sourceUrl,
			sourceType: events.sourceType,
			topicId: topics.id,
			topicName: topics.name,
			topicSlug: topics.slug,
			subtopicName: subtopics.name
		})
		.from(events)
		.leftJoin(eventTopics, eq(eventTopics.eventId, events.id))
		.leftJoin(topics, eq(topics.id, eventTopics.topicId))
		.leftJoin(subtopics, eq(subtopics.id, eventTopics.subtopicId))
		.where(eq(events.id, id));

	if (rows.length === 0) error(404, 'Event not found');

	const base = rows[0];
	const eventTopicsList = rows
		.filter((r) => r.topicId)
		.map((r) => ({ topicId: r.topicId!, topicName: r.topicName!, topicSlug: r.topicSlug!, subtopicName: r.subtopicName ?? null }));

	const relatedRows = await db
		.select({ id: events.id, title: events.title, year: events.year, sourceType: events.sourceType })
		.from(events)
		.where(and(eq(events.month, base.month), eq(events.day, base.day), ne(events.id, id)))
		.limit(5);

	return json({
		id: base.id,
		title: base.title,
		description: base.description,
		eventDate: base.eventDate,
		year: base.year,
		month: base.month,
		day: base.day,
		imageUrl: base.imageUrl,
		sourceUrl: base.sourceUrl,
		sourceType: base.sourceType,
		topics: eventTopicsList,
		related: relatedRows
	});
};
