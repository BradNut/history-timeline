import { describe, it, expect } from 'vitest';
import { classifyCategory } from './classify';

const TOPICS = [
	{ id: 1, name: 'Musical', slug: 'musical' },
	{ id: 2, name: 'Scientific', slug: 'scientific' },
	{ id: 3, name: 'Historical', slug: 'historical' },
	{ id: 4, name: 'Cultural', slug: 'cultural' },
	{ id: 5, name: 'Political', slug: 'political' },
	{ id: 6, name: 'Sporting', slug: 'sporting' }
];

const SUBTOPICS = [
	{ id: 10, topicId: 1, slug: 'jazz' },
	{ id: 11, topicId: 1, slug: 'classical' },
	{ id: 12, topicId: 1, slug: 'rock' },
	{ id: 13, topicId: 1, slug: 'pop' },
	{ id: 20, topicId: 2, slug: 'physics' },
	{ id: 21, topicId: 2, slug: 'biology' },
	{ id: 22, topicId: 2, slug: 'chemistry' },
	{ id: 23, topicId: 2, slug: 'astronomy' },
	{ id: 30, topicId: 3, slug: 'wars' },
	{ id: 31, topicId: 3, slug: 'politics' },
	{ id: 32, topicId: 3, slug: 'exploration' },
	{ id: 33, topicId: 3, slug: 'revolution' },
	{ id: 40, topicId: 4, slug: 'art' },
	{ id: 41, topicId: 4, slug: 'literature' },
	{ id: 42, topicId: 4, slug: 'film' },
	{ id: 43, topicId: 4, slug: 'theatre' },
	{ id: 50, topicId: 5, slug: 'elections' },
	{ id: 51, topicId: 5, slug: 'treaties' },
	{ id: 52, topicId: 5, slug: 'legislation' },
	{ id: 53, topicId: 5, slug: 'diplomacy' },
	{ id: 60, topicId: 6, slug: 'football' },
	{ id: 61, topicId: 6, slug: 'athletics' },
	{ id: 62, topicId: 6, slug: 'tennis' },
	{ id: 63, topicId: 6, slug: 'olympics' }
];

describe('classifyCategory', () => {
	it('returns the correct topic and subtopic when a subtopic keyword matches', () => {
		const result = classifyCategory('American jazz musicians', TOPICS, SUBTOPICS);
		expect(result).toEqual({ topicId: 1, subtopicId: 10 });
	});

	it('returns the topic with null subtopicId when only a topic keyword matches', () => {
		const result = classifyCategory('20th-century musicians', TOPICS, SUBTOPICS);
		expect(result).toEqual({ topicId: 1, subtopicId: null });
	});

	it('returns null when the category matches nothing', () => {
		const result = classifyCategory('Fictional characters from Vermont', TOPICS, SUBTOPICS);
		expect(result).toBeNull();
	});

	it('matches case-insensitively', () => {
		const result = classifyCategory('JAZZ MUSICIANS', TOPICS, SUBTOPICS);
		expect(result).toEqual({ topicId: 1, subtopicId: 10 });
	});

	it('maps composer to Classical music subtopic', () => {
		const result = classifyCategory('German composers', TOPICS, SUBTOPICS);
		expect(result).toEqual({ topicId: 1, subtopicId: 11 });
	});

	it('maps astronomer to Astronomy subtopic', () => {
		const result = classifyCategory('20th-century astronomers', TOPICS, SUBTOPICS);
		expect(result).toEqual({ topicId: 2, subtopicId: 23 });
	});

	it('maps war-related category to Historical > Wars', () => {
		const result = classifyCategory('World War II', TOPICS, SUBTOPICS);
		expect(result).toEqual({ topicId: 3, subtopicId: 30 });
	});

	it('maps film director to Cultural > Film', () => {
		const result = classifyCategory('American film directors', TOPICS, SUBTOPICS);
		expect(result).toEqual({ topicId: 4, subtopicId: 42 });
	});

	it('maps politician to Political topic', () => {
		const result = classifyCategory('American politicians', TOPICS, SUBTOPICS);
		expect(result).toEqual({ topicId: 5, subtopicId: null });
	});

	it('maps Olympic athlete to Sporting > Olympics', () => {
		const result = classifyCategory('Olympic gold medalists', TOPICS, SUBTOPICS);
		expect(result).toEqual({ topicId: 6, subtopicId: 63 });
	});

	it('maps football player to Sporting > Football', () => {
		const result = classifyCategory('NFL players', TOPICS, SUBTOPICS);
		expect(result).toEqual({ topicId: 6, subtopicId: 60 });
	});

	it('returns null when topics list is empty', () => {
		const result = classifyCategory('Jazz musicians', [], SUBTOPICS);
		expect(result).toBeNull();
	});
});
