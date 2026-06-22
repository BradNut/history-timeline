import { db } from '$lib/server/db';
import { events, eventTopics, importLogs } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { mapCategories } from './mapper';
import type { WikipediaEvent } from './types';

export async function upsertEvents(
	wikiEvents: WikipediaEvent[],
	month: number,
	day: number,
	type: string = 'daily'
): Promise<{ eventsUpserted: number; unmappedCount: number }> {
	const logEntry = await db
		.insert(importLogs)
		.values({ type, status: 'running', eventsUpserted: 0, unmappedCount: 0 })
		.returning();
	const logId = logEntry[0].id;

	let eventsUpserted = 0;
	let unmappedCount = 0;

	try {
		for (const evt of wikiEvents) {
			const page = evt.pages[0];
			if (!page) continue;

			const absYear = Math.abs(evt.year);
			const yearStr = String(absYear).padStart(4, '0');
			const mmdd = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
			const eventDate = evt.year < 0 ? `${yearStr}-${mmdd} BC` : `${yearStr}-${mmdd}`;
			const title = page.title.replaceAll('_', ' ');
			const description = page.extract ?? evt.text;
			const imageUrl = page.thumbnail?.source ?? null;
			const sourceUrl = page.content_urls?.desktop?.page ?? null;
			const rawCategories = (page.categories ?? []).map((c) => c.title.replace(/^Category:/, ''));

			const existing = await db.query.events.findFirst({
				where: (e, { and, eq: eqFn }) =>
					and(eqFn(e.title, title), eqFn(e.year, evt.year), eqFn(e.month, month), eqFn(e.day, day))
			});

			let upserted;
			if (existing) {
				[upserted] = await db
					.update(events)
					.set({ description, imageUrl, sourceUrl, rawCategories, updatedAt: new Date() })
					.where(eq(events.id, existing.id))
					.returning();
				await db.delete(eventTopics).where(eq(eventTopics.eventId, existing.id));
			} else {
				[upserted] = await db
					.insert(events)
					.values({ title, description, eventDate, year: evt.year, month, day, imageUrl, sourceUrl, sourceType: evt.sourceType, rawCategories })
					.returning();
			}

			eventsUpserted++;

			const taxonomies = await mapCategories(rawCategories, upserted.id);
			unmappedCount += rawCategories.length - taxonomies.length;

			for (const tax of taxonomies) {
				await db
					.insert(eventTopics)
					.values({ eventId: upserted.id, topicId: tax.topicId, subtopicId: tax.subtopicId })
					.onConflictDoNothing();
			}
		}

		await db
			.update(importLogs)
			.set({ status: 'done', eventsUpserted, unmappedCount, finishedAt: new Date() })
			.where(eq(importLogs.id, logId));
	} catch (err) {
		await db
			.update(importLogs)
			.set({
				status: 'error',
				errorMessage: String(err),
				eventsUpserted,
				unmappedCount,
				finishedAt: new Date()
			})
			.where(eq(importLogs.id, logId));
		throw err;
	}

	return { eventsUpserted, unmappedCount };
}
