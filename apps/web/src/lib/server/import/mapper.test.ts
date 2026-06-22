import { describe, it, expect, vi } from 'vitest';
import { mapCategories } from './mapper';

const TOPICS = [{ id: 1, name: 'Musical', slug: 'musical' }];
const SUBTOPICS = [{ id: 10, topicId: 1, slug: 'jazz' }];

function makeDeps(overrides: Partial<Parameters<typeof mapCategories>[2]> = {}) {
	return {
		findMapping: vi.fn().mockResolvedValue(null),
		insertMapping: vi.fn().mockResolvedValue(undefined),
		insertUnmapped: vi.fn().mockResolvedValue(undefined),
		loadTopics: vi.fn().mockResolvedValue(TOPICS),
		loadSubtopics: vi.fn().mockResolvedValue(SUBTOPICS),
		...overrides
	};
}

describe('mapCategories', () => {
	it('returns the stored mapping when an exact match exists in taxonomyMappings', async () => {
		const deps = makeDeps({
			findMapping: vi.fn().mockResolvedValue({ topicId: 1, subtopicId: 10 })
		});
		const result = await mapCategories(['Jazz musicians'], undefined, deps);
		expect(result).toEqual([{ topicId: 1, subtopicId: 10 }]);
		expect(deps.insertMapping).not.toHaveBeenCalled();
		expect(deps.insertUnmapped).not.toHaveBeenCalled();
	});

	it('auto-classifies an unknown category and persists a new taxonomyMapping', async () => {
		const deps = makeDeps();
		const result = await mapCategories(['American jazz musicians'], undefined, deps);
		expect(result).toEqual([{ topicId: 1, subtopicId: 10 }]);
		expect(deps.insertMapping).toHaveBeenCalledOnce();
		expect(deps.insertMapping).toHaveBeenCalledWith({
			rawCategory: 'American jazz musicians',
			topicId: 1,
			subtopicId: 10
		});
		expect(deps.insertUnmapped).not.toHaveBeenCalled();
	});

	it('falls through to unmappedCategories when auto-classify also fails', async () => {
		const deps = makeDeps();
		const result = await mapCategories(['Fictional characters from Vermont'], undefined, deps);
		expect(result).toEqual([]);
		expect(deps.insertUnmapped).toHaveBeenCalledOnce();
		expect(deps.insertMapping).not.toHaveBeenCalled();
	});

	it('handles a mix of mapped, auto-classified, and unclassifiable categories', async () => {
		const deps = makeDeps({
			findMapping: vi.fn().mockImplementation(async (raw: string) => {
				if (raw === 'Existing mapped') return { topicId: 1, subtopicId: null };
				return null;
			})
		});
		const result = await mapCategories(
			['Existing mapped', 'American jazz musicians', 'Fictional characters from Vermont'],
			42,
			deps
		);
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({ topicId: 1, subtopicId: null });
		expect(result[1]).toEqual({ topicId: 1, subtopicId: 10 });
		expect(deps.insertMapping).toHaveBeenCalledOnce();
		expect(deps.insertUnmapped).toHaveBeenCalledOnce();
		expect(deps.insertUnmapped).toHaveBeenCalledWith('Fictional characters from Vermont', 42);
	});
});
