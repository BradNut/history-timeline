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

	const now = new Date();
	const month = now.getMonth() + 1;
	const day = now.getDate();

	const wikiEvents = await fetchOnThisDay(month, day);
	const result = await upsertEvents(wikiEvents, month, day);

	return json(result);
};
