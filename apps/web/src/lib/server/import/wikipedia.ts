import type { WikipediaApiResponse, WikipediaEvent, WikipediaPage } from './types';

const BASE_URL = 'https://en.wikipedia.org/api/rest_v1/feed/onthisday';
const MW_API = 'https://en.wikipedia.org/w/api.php';
const USER_AGENT = 'HistoryTimeline/1.0 (contact@historytimeline.local)';
const TYPES = ['events', 'births', 'deaths'] as const;
const CATEGORY_BATCH_SIZE = 50;

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

async function fetchCategoriesForTitles(titles: string[]): Promise<Map<string, string[]>> {
	const result = new Map<string, string[]>();

	for (let i = 0; i < titles.length; i += CATEGORY_BATCH_SIZE) {
		const batch = titles.slice(i, i + CATEGORY_BATCH_SIZE);
		const params = new URLSearchParams({
			action: 'query',
			titles: batch.join('|'),
			prop: 'categories',
			cllimit: '500',
			format: 'json',
			formatversion: '2'
		});

		try {
			const res = await fetch(`${MW_API}?${params}`, {
				headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' }
			});

			if (!res.ok) continue;

			const data = await res.json();
			const pages: Array<{ title: string; categories?: Array<{ title: string }> }> =
				data?.query?.pages ?? [];

			for (const page of pages) {
				result.set(page.title, (page.categories ?? []).map((c: { title: string }) => c.title));
			}
		} catch {
			// Non-fatal — pages fall through with empty categories
		}

		if (i + CATEGORY_BATCH_SIZE < titles.length) {
			await new Promise((r) => setTimeout(r, 200));
		}
	}

	return result;
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

		const allPages: WikipediaPage[] = items.flatMap((item) => item.pages);
		const categoryMap = await fetchCategoriesForTitles(allPages.map((p) => p.title));

		for (const item of items) {
			const enrichedPages = item.pages.map((page) => ({
				...page,
				categories: (categoryMap.get(page.title.replaceAll('_', ' ')) ?? []).map((t) => ({ title: t }))
			}));
			results.push({ year: item.year, text: item.text, sourceType, pages: enrichedPages });
		}

		await new Promise((r) => setTimeout(r, 500));
	}

	return results;
}
