import { and, count, eq, gt } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { importLogs } from '$lib/server/db/schema';
import type { DateWindow } from '$lib/server/events';
import { getEventCount, getEvents, getTopicsInWindow } from '$lib/server/events';
import { runImportForDate } from '$lib/server/import-actions';
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
	getTopicsInWindow: typeof getTopicsInWindow;
	getEvents: typeof getEvents;
	getEventCount: typeof getEventCount;
	getRunningImportCount: (month: number, day: number) => Promise<number>;
	runImportForDate: typeof runImportForDate;
};

const RUNNING_IMPORT_WINDOW_MS = 5 * 60 * 1000;

const defaultDeps: LoadDeps = {
	getTopicsInWindow,
	getEvents,
	getEventCount,
	getRunningImportCount: async (_month, _day) => {
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
	return async ({ url, locals }) => {
		const dateParam = url.searchParams.get('date');
		const rawGranularity = url.searchParams.get('granularity') ?? 'today';
		const validGranularity: 'today' | 'week' | 'month' =
			rawGranularity === 'week' || rawGranularity === 'month' ? rawGranularity : 'today';
		const topicSlug = url.searchParams.get('topic');

		if (!locals.user) {
			const redirectTo = `${url.pathname}${url.search}`;
			return { view: 'landing', redirectTo, date: dateParam, granularity: validGranularity, topicSlug };
		}

		const anchorDate = dateParam ? new Date(dateParam) : new Date();
		const dateRange = getDateRange(anchorDate, validGranularity);
		const topicWindow = getTopicWindow(anchorDate);

		const allTopics = await deps.getTopicsInWindow(topicWindow);

		let topicIdFilter: number | undefined;
		if (topicSlug) {
			const topic = allTopics.find((t) => t.slug === topicSlug);
			topicIdFilter = topic?.id;
		}

		const eventsPromise = (async () => {
			const unfilteredEventCount =
				validGranularity === 'today' ? await deps.getEventCount(dateRange) : 0;

			let eventList = await deps.getEvents({ ...dateRange, topicIdFilter });

			if (validGranularity === 'today' && unfilteredEventCount === 0) {
				const month = anchorDate.getMonth() + 1;
				const day = anchorDate.getDate();
				const runningCount = await deps.getRunningImportCount(month, day);
				if (runningCount === 0) {
					await deps.runImportForDate(month, day);
					eventList = await deps.getEvents({ ...dateRange, topicIdFilter });
				}
			}

			return eventList;
		})();

		return {
			view: 'timeline',
			events: eventsPromise,
			anchorDate: anchorDate.toISOString().split('T')[0],
			granularity: validGranularity,
			topicSlug,
			topics: allTopics
		};
	};
}

function datesToWindow(dates: Array<{ month: number; day: number }>): DateWindow {
	return { dates: [...dates] };
}

function getDateRange(
	anchorDate: Date,
	granularity: 'today' | 'week' | 'month'
): DateWindow {
	const month = anchorDate.getMonth() + 1;
	const day = anchorDate.getDate();

	if (granularity === 'today') {
		return { dates: [{ month, day }] };
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

	return datesToWindow(dates);
}

function getTopicWindow(anchorDate: Date): DateWindow {
	const dates: Array<{ month: number; day: number }> = [];
	for (const offset of [-1, 0, 1]) {
		const d = new Date(anchorDate);
		d.setDate(d.getDate() + offset);
		dates.push({ month: d.getMonth() + 1, day: d.getDate() });
	}
	return datesToWindow(dates);
}

export const load: PageServerLoad = _createLoad(defaultDeps);
