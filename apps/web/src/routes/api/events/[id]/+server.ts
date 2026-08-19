import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { events } from '$lib/server/db/schema';
import { eventsWithTopicsQuery } from '$lib/server/events';
import { and, eq, ne } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id) || id < 1) error(400, 'Invalid id');

	const rows = await eventsWithTopicsQuery().where(eq(events.id, id));

	if (rows.length === 0) error(404, 'Event not found');

	const base = rows[0];
	const eventTopicsList = rows
		.filter((r) => r.topicId)
		.map((r) => ({
			topicId: r.topicId as number,
			topicName: r.topicName as string,
			topicSlug: r.topicSlug as string,
			subtopicName: r.subtopicName ?? null
		}));

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
