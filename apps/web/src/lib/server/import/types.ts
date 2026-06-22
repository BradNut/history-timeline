export interface WikipediaPage {
	pageid: number;
	title: string;
	extract?: string;
	thumbnail?: { source: string };
	content_urls?: { desktop?: { page?: string } };
	categories?: Array<{ title: string }>;
}

export interface WikipediaEvent {
	year: number;
	text: string;
	sourceType: 'event' | 'birth' | 'death';
	pages: WikipediaPage[];
}

export interface WikipediaApiResponse {
	events?: Array<{ year: number; text: string; pages: WikipediaPage[] }>;
	births?: Array<{ year: number; text: string; pages: WikipediaPage[] }>;
	deaths?: Array<{ year: number; text: string; pages: WikipediaPage[] }>;
}
