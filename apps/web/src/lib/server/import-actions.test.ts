import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runDailyImport, runFullImport } from './import-actions';

const mockFetch = vi.fn();
const mockUpsert = vi.fn();
const deps = { fetchOnThisDay: mockFetch, upsertEvents: mockUpsert };

beforeEach(() => {
	vi.clearAllMocks();
	mockFetch.mockResolvedValue([]);
	mockUpsert.mockResolvedValue({ eventsUpserted: 5, unmappedCount: 1 });
});

describe('runDailyImport', () => {
	it('returns 403 when role is not admin', async () => {
		const result = await runDailyImport('user', deps);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.status).toBe(403);
	});

	it('returns 403 when role is null', async () => {
		const result = await runDailyImport(null, deps);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.status).toBe(403);
	});

	it('calls fetchOnThisDay and upsertEvents for admin role', async () => {
		const result = await runDailyImport('admin', deps);
		expect(result.ok).toBe(true);
		expect(mockFetch).toHaveBeenCalledOnce();
		expect(mockUpsert).toHaveBeenCalledOnce();
	});

	it('returns import result data for admin', async () => {
		const result = await runDailyImport('admin', deps);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.data.eventsUpserted).toBe(5);
			expect(result.data.unmappedCount).toBe(1);
		}
	});
});

describe('runFullImport', () => {
	it('returns 403 when role is not admin', async () => {
		const result = await runFullImport('user', deps);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.status).toBe(403);
	});

	it('calls fetchOnThisDay 366 times (all calendar days) for admin', async () => {
		await runFullImport('admin', deps);
		expect(mockFetch).toHaveBeenCalledTimes(366);
	});

	it('accumulates totals across all days', async () => {
		mockUpsert.mockResolvedValue({ eventsUpserted: 1, unmappedCount: 0 });
		const result = await runFullImport('admin', deps);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.data.eventsUpserted).toBe(366);
		}
	});
});
