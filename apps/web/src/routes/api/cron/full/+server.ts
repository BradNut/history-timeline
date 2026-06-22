import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { fetchOnThisDay } from '$lib/server/import/wikipedia';
import { upsertEvents } from '$lib/server/import/upsert';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const auth = request.headers.get('authorization');
	if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
		error(401, 'Unauthorized');
	}

	let totalUpserted = 0;
	let totalUnmapped = 0;

	const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

	for (let month = 1; month <= 12; month++) {
		const daysInMonth = DAYS_IN_MONTH[month - 1];
		for (let day = 1; day <= daysInMonth; day++) {
			const wikiEvents = await fetchOnThisDay(month, day);
			const result = await upsertEvents(wikiEvents, month, day);
			totalUpserted += result.eventsUpserted;
			totalUnmapped += result.unmappedCount;
			await new Promise((r) => setTimeout(r, 500));
		}
	}

	return json({ eventsUpserted: totalUpserted, unmappedCount: totalUnmapped });
};
