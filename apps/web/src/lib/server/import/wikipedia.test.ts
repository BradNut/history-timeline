import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchOnThisDay } from './wikipedia';

const FEED_EVENTS_RESPONSE = {
	events: [
		{
			year: 1969,
			text: 'Moon landing',
			pages: [
				{
					pageid: 1,
					title: 'Apollo_11',
					extract: 'Moon landing mission',
					content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Apollo_11' } }
				}
			]
		}
	]
};

const FEED_EMPTY_RESPONSE = { events: [], births: [], deaths: [] };

const MW_CATEGORIES_RESPONSE = {
	query: {
		pages: [
			{
				title: 'Apollo 11',
				categories: [
					{ title: 'Category:Space exploration' },
					{ title: 'Category:1969 in spaceflight' }
				]
			}
		]
	}
};

function makeFetchMock(handlers: Array<(url: string) => Response | null>) {
	return vi.fn().mockImplementation((url: string) => {
		for (const handler of handlers) {
			const result = handler(url);
			if (result) return Promise.resolve(result);
		}
		return Promise.resolve(new Response('not found', { status: 404 }));
	});
}

function jsonResponse(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
}

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe('fetchOnThisDay — category enrichment', () => {
	it('enriches pages with categories from the MediaWiki API', async () => {
		vi.stubGlobal(
			'fetch',
			makeFetchMock([
				(url) => (url.includes('onthisday/events') ? jsonResponse(FEED_EVENTS_RESPONSE) : null),
				(url) => (url.includes('onthisday/births') ? jsonResponse(FEED_EMPTY_RESPONSE) : null),
				(url) => (url.includes('onthisday/deaths') ? jsonResponse(FEED_EMPTY_RESPONSE) : null),
				(url) => (url.includes('w/api.php') ? jsonResponse(MW_CATEGORIES_RESPONSE) : null)
			])
		);

		const promise = fetchOnThisDay(7, 20);
		await vi.runAllTimersAsync();
		const results = await promise;

		expect(results).toHaveLength(1);
		expect(results[0].pages[0].categories).toEqual([
			{ title: 'Category:Space exploration' },
			{ title: 'Category:1969 in spaceflight' }
		]);
	});

	it('matches categories when feed title has underscores but MW API returns space-normalized title', async () => {
		const feedWithUnderscores = {
			events: [
				{
					year: 1969,
					text: 'Moon landing',
					pages: [
						{
							pageid: 1,
							title: 'Apollo_11',
							extract: 'Moon landing mission',
							content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Apollo_11' } }
						}
					]
				}
			]
		};

		const mwWithSpaces = {
			query: {
				pages: [
					{
						title: 'Apollo 11',
						categories: [
							{ title: 'Category:Space exploration' },
							{ title: 'Category:1969 in spaceflight' }
						]
					}
				]
			}
		};

		vi.stubGlobal(
			'fetch',
			makeFetchMock([
				(url) => (url.includes('onthisday/events') ? jsonResponse(feedWithUnderscores) : null),
				(url) => (url.includes('onthisday/births') ? jsonResponse(FEED_EMPTY_RESPONSE) : null),
				(url) => (url.includes('onthisday/deaths') ? jsonResponse(FEED_EMPTY_RESPONSE) : null),
				(url) => (url.includes('w/api.php') ? jsonResponse(mwWithSpaces) : null)
			])
		);

		const promise = fetchOnThisDay(7, 20);
		await vi.runAllTimersAsync();
		const results = await promise;

		expect(results).toHaveLength(1);
		expect(results[0].pages[0].categories).toEqual([
			{ title: 'Category:Space exploration' },
			{ title: 'Category:1969 in spaceflight' }
		]);
	});

	it('returns pages with empty categories when MediaWiki API fails', async () => {
		vi.stubGlobal(
			'fetch',
			makeFetchMock([
				(url) => (url.includes('onthisday/events') ? jsonResponse(FEED_EVENTS_RESPONSE) : null),
				(url) => (url.includes('onthisday/births') ? jsonResponse(FEED_EMPTY_RESPONSE) : null),
				(url) => (url.includes('onthisday/deaths') ? jsonResponse(FEED_EMPTY_RESPONSE) : null),
				(url) => (url.includes('w/api.php') ? new Response('error', { status: 500 }) : null)
			])
		);

		const promise = fetchOnThisDay(7, 20);
		await vi.runAllTimersAsync();
		const results = await promise;

		expect(results).toHaveLength(1);
		expect(results[0].pages[0].categories).toEqual([]);
	});

	it('makes multiple MediaWiki requests when there are more than 50 pages', async () => {
		const manyPages = Array.from({ length: 60 }, (_, i) => ({
			pageid: i + 1,
			title: `Page_${i + 1}`,
			extract: `Extract ${i + 1}`
		}));

		const feedResponse = {
			events: manyPages.map((page, i) => ({ year: 1900 + i, text: `Event ${i}`, pages: [page] }))
		};

		const fetchMock = vi.fn().mockImplementation((url: string) => {
			if (url.includes('onthisday/events')) return Promise.resolve(jsonResponse(feedResponse));
			if (url.includes('onthisday/births')) return Promise.resolve(jsonResponse(FEED_EMPTY_RESPONSE));
			if (url.includes('onthisday/deaths')) return Promise.resolve(jsonResponse(FEED_EMPTY_RESPONSE));
			if (url.includes('w/api.php'))
				return Promise.resolve(jsonResponse({ query: { pages: [] } }));
			return Promise.resolve(new Response('not found', { status: 404 }));
		});
		vi.stubGlobal('fetch', fetchMock);

		const promise = fetchOnThisDay(1, 1);
		await vi.runAllTimersAsync();
		await promise;

		const mwCalls = fetchMock.mock.calls.filter((args) => String(args[0]).includes('w/api.php'));
		expect(mwCalls.length).toBeGreaterThanOrEqual(2);
	});
});
