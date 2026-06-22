import { db } from '$lib/server/db';
import { topics, importLogs } from '$lib/server/db/schema';
import { getEvents } from '$lib/server/events';
import { runImportForDate } from '$lib/server/import-actions';
import { and, eq, gt, count } from 'drizzle-orm';
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

type LoadDeps = {
	getTopics: () => Promise<Array<{ id: number; name: string; slug: string; createdAt: Date }>>;
	getEvents: typeof getEvents;
	getRunningImportCount: (month: number, day: number) => Promise<number>;
	runImportForDate: typeof runImportForDate;
};

const RUNNING_IMPORT_WINDOW_MS = 5 * 60 * 1000;

const defaultDeps: LoadDeps = {
	getTopics: () => db.select().from(topics).orderBy(topics.name),
	getEvents,
	getRunningImportCount: async (month, day) => {
		const since = new Date(Date.now() - RUNNING_IMPORT_WINDOW_MS);
		const rows = await db
			.select({ value: count() })
			.from(importLogs)
			.where(
				and(
					eq(importLogs.status, 'running'),
					gt(importLogs.startedAt, since)
				)
			);
		return rows[0]?.value ?? 0;
	},
	runImportForDate
};

export function _createLoad(deps: LoadDeps): PageServerLoad {
	return async ({ url }) => {
		const dateParam = url.searchParams.get('date');
		const granularity = (url.searchParams.get('granularity') ?? 'today') as 'today' | 'week' | 'month';
		const topicSlug = url.searchParams.get('topic');

		const anchorDate = dateParam ? new Date(dateParam) : new Date();
		const { months, days } = getDateRange(anchorDate, granularity);

		const allTopics = await deps.getTopics();

		let topicIdFilter: number | undefined;
		if (topicSlug) {
			const topic = allTopics.find((t) => t.slug === topicSlug);
			topicIdFilter = topic?.id;
		}

		let eventList = await deps.getEvents({ months, days, topicIdFilter });

		if (granularity === 'today' && eventList.length === 0) {
			const month = anchorDate.getMonth() + 1;
			const day = anchorDate.getDate();
			const runningCount = await deps.getRunningImportCount(month, day);
			if (runningCount === 0) {
				await deps.runImportForDate(month, day);
				eventList = await deps.getEvents({ months, days, topicIdFilter });
			}
		}

		return {
			events: eventList,
			anchorDate: anchorDate.toISOString().split('T')[0],
			granularity,
			topicSlug,
			topics: allTopics
		};
	};
}

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

export const load: PageServerLoad = _createLoad(defaultDeps);
