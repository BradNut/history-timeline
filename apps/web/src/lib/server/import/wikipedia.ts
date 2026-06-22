import type { WikipediaApiResponse, WikipediaEvent } from './types';

const BASE_URL = 'https://en.wikipedia.org/api/rest_v1/feed/onthisday';
const USER_AGENT = 'HistoryTimeline/1.0 (contact@historytimeline.local)';
const TYPES = ['events', 'births', 'deaths'] as const;

async function fetchWithRetry(url: string, attempt = 0): Promise<Response> {
	const res = await fetch(url, {
		headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' }
	});

	if ((res.status === 429 || res.status === 503) && attempt < 3) {
		const delay = 1000 * Math.pow(2, attempt);
		await new Promise((r) => setTimeout(r, delay));
		return fetchWithRetry(url, attempt + 1);
	}

	return res;
}

export async function fetchOnThisDay(month: number, day: number): Promise<WikipediaEvent[]> {
	const mm = String(month).padStart(2, '0');
	const dd = String(day).padStart(2, '0');
	const results: WikipediaEvent[] = [];

	for (const type of TYPES) {
		const url = `${BASE_URL}/${type}/${mm}/${dd}`;
		const res = await fetchWithRetry(url);

		if (!res.ok) {
			console.warn(`Wikipedia ${type} ${mm}/${dd} returned ${res.status}, skipping`);
			continue;
		}

		const data: WikipediaApiResponse = await res.json();
		const items = data[type] ?? [];

		const sourceType =
			type === 'events' ? ('event' as const) : type === 'births' ? ('birth' as const) : ('death' as const);

		for (const item of items) {
			results.push({ year: item.year, text: item.text, sourceType, pages: item.pages });
		}

		await new Promise((r) => setTimeout(r, 500));
	}

	return results;
}
