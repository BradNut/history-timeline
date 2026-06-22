import { db } from '$lib/server/db';
import { events, eventTopics, topics, subtopics } from '$lib/server/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export type EventWithTopics = {
	id: number;
	title: string;
	description: string | null;
	eventDate: string;
	year: number;
	month: number;
	day: number;
	imageUrl: string | null;
	sourceUrl: string | null;
	sourceType: string | null;
	topics: Array<{ topicId: number; topicName: string; topicSlug: string; subtopicName: string | null }>;
};

function getDateRange(
	anchorDate: Date,
	granularity: 'today' | 'week' | 'month'
): { months: number[]; days: number[] } {
	const month = anchorDate.getMonth() + 1;
	const day = anchorDate.getDate();

	if (granularity === 'today') {
		return { months: [month], days: [day] };
	}

	const dates: Array<{ month: number; day: number }> = [];

	if (granularity === 'week') {
		for (let i = -3; i <= 3; i++) {
			const d = new Date(anchorDate);
			d.setDate(d.getDate() + i);
			dates.push({ month: d.getMonth() + 1, day: d.getDate() });
		}
	} else {
		const year = anchorDate.getFullYear();
		const daysInMonth = new Date(year, month, 0).getDate();
		for (let d = 1; d <= daysInMonth; d++) {
			dates.push({ month, day: d });
		}
	}

	return {
		months: [...new Set(dates.map((d) => d.month))],
		days: [...new Set(dates.map((d) => d.day))]
	};
}

export const load: PageServerLoad = async ({ url }) => {
	const dateParam = url.searchParams.get('date');
	const granularity = (url.searchParams.get('granularity') ?? 'today') as 'today' | 'week' | 'month';
	const topicSlug = url.searchParams.get('topic');

	const anchorDate = dateParam ? new Date(dateParam) : new Date();
	const { months, days } = getDateRange(anchorDate, granularity);

	const allTopics = await db.select().from(topics).orderBy(topics.name);

	let topicIdFilter: number | undefined;
	if (topicSlug) {
		const topic = allTopics.find((t) => t.slug === topicSlug);
		topicIdFilter = topic?.id;
	}

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
		.where(
			and(
				inArray(events.month, months),
				inArray(events.day, days),
				topicIdFilter ? eq(eventTopics.topicId, topicIdFilter) : undefined
			)
		)
		.orderBy(events.year);

	const eventsMap = new Map<number, EventWithTopics>();
	for (const row of rows) {
		if (!eventsMap.has(row.id)) {
			eventsMap.set(row.id, {
				id: row.id,
				title: row.title,
				description: row.description,
				eventDate: row.eventDate,
				year: row.year,
				month: row.month,
				day: row.day,
				imageUrl: row.imageUrl,
				sourceUrl: row.sourceUrl,
				sourceType: row.sourceType,
				topics: []
			});
		}
		if (row.topicId && row.topicName && row.topicSlug) {
			eventsMap.get(row.id)!.topics.push({
				topicId: row.topicId,
				topicName: row.topicName,
				topicSlug: row.topicSlug,
				subtopicName: row.subtopicName ?? null
			});
		}
	}

	const eventList = [...eventsMap.values()].sort((a, b) => b.year - a.year);

	return {
		events: eventList,
		anchorDate: anchorDate.toISOString().split('T')[0],
		granularity,
		topicSlug,
		topics: allTopics
	};
};
