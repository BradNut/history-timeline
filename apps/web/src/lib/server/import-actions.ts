import { fetchOnThisDay } from '$lib/server/import/wikipedia';
import { upsertEvents } from '$lib/server/import/upsert';

export type ImportResult = { eventsUpserted: number; unmappedCount: number };
export type ImportError = { status: 403; message: string };
export type ImportActionResult = { ok: true; data: ImportResult } | { ok: false; error: ImportError };

type Deps = {
	fetchOnThisDay: typeof fetchOnThisDay;
	upsertEvents: typeof upsertEvents;
};

const defaultDeps: Deps = { fetchOnThisDay, upsertEvents };

export async function runDailyImport(
	role: string | null | undefined,
	deps: Deps = defaultDeps
): Promise<ImportActionResult> {
	if (role !== 'admin') {
		return { ok: false, error: { status: 403, message: 'Forbidden' } };
	}

	const now = new Date();
	const month = now.getMonth() + 1;
	const day = now.getDate();

	const wikiEvents = await deps.fetchOnThisDay(month, day);
	const result = await deps.upsertEvents(wikiEvents, month, day);
	return { ok: true, data: result };
}

export async function runFullImport(
	role: string | null | undefined,
	deps: Deps = defaultDeps
): Promise<ImportActionResult> {
	if (role !== 'admin') {
		return { ok: false, error: { status: 403, message: 'Forbidden' } };
	}

	let eventsUpserted = 0;
	let unmappedCount = 0;

	for (let month = 1; month <= 12; month++) {
		const daysInMonth = new Date(2000, month, 0).getDate();
		for (let day = 1; day <= daysInMonth; day++) {
			const wikiEvents = await deps.fetchOnThisDay(month, day);
			const result = await deps.upsertEvents(wikiEvents, month, day);
			eventsUpserted += result.eventsUpserted;
			unmappedCount += result.unmappedCount;
		}
	}

	return { ok: true, data: { eventsUpserted, unmappedCount } };
}
