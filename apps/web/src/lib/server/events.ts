import { and, eq, inArray } from 'drizzle-orm';
import { db as defaultDb } from '$lib/server/databases/postgres';
import { events, eventTopics, subtopics, topics } from '$lib/server/databases/postgres/drizzle-schema';
import { REDIS_PREFIXES, redisService } from '$lib/server/databases/redis/redis';
import type { EventWithTopics } from '../../routes/+page.server';

const CACHE_PREFIX = REDIS_PREFIXES.EVENTS;
const CACHE_TTL_SECONDS = 86400;

export type GetEventsParams = {
  months: number[];
  days: number[];
  topicIdFilter: number | undefined;
};

export type GetTopicsInWindowParams = {
  months: number[];
  days: number[];
};

type CacheDep = {
  get: (data: { prefix: string; key: string }) => Promise<string | null>;
  setWithExpiry: (data: { prefix: string; key: string; value: string; expiry: number }) => Promise<void>;
};

type DbDep = {
  query: (params: GetEventsParams) => Promise<EventWithTopics[]>;
};

type Deps = {
  cache: CacheDep;
  db: DbDep;
};

type TopicsInWindowDbDep = {
  query: (params: GetTopicsInWindowParams) => Promise<Array<{ id: number; name: string; slug: string }>>;
};

type TopicsInWindowDeps = {
  db: TopicsInWindowDbDep;
};

function buildCacheKey(params: GetEventsParams): string {
  const months = params.months.join(',');
  const days = params.days.join(',');
  const topic = params.topicIdFilter ?? 'null';
  return `${months}-${days}-${topic}`;
}

export function eventsWithTopicsQuery() {
  return defaultDb
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      eventDate: events.eventDate,
      year: events.year,
      month: events.month,
      day: events.day,
      imageUrl: events.imageUrl,
      sourceUrl: events.sourceUrl,
      sourceType: events.sourceType,
      topicId: topics.id,
      topicName: topics.name,
      topicSlug: topics.slug,
      subtopicName: subtopics.name,
    })
    .from(events)
    .leftJoin(eventTopics, eq(eventTopics.eventId, events.id))
    .leftJoin(topics, eq(topics.id, eventTopics.topicId))
    .leftJoin(subtopics, eq(subtopics.id, eventTopics.subtopicId));
}

async function queryEvents(params: GetEventsParams): Promise<EventWithTopics[]> {
  const rows = await eventsWithTopicsQuery()
    .where(
      and(
        inArray(events.month, params.months),
        inArray(events.day, params.days),
        params.topicIdFilter ? eq(eventTopics.topicId, params.topicIdFilter) : undefined,
      ),
    )
    .orderBy(events.year);

  const eventsMap = new Map<number, EventWithTopics>();
  for (const row of rows) {
    if (!eventsMap.has(row.id)) {
      eventsMap.set(row.id, {
        id: row.id,
        title: row.title,
        description: row.description,
        eventDate: row.eventDate,
        year: row.year,
        month: row.month,
        day: row.day,
        imageUrl: row.imageUrl,
        sourceUrl: row.sourceUrl,
        sourceType: row.sourceType,
        topics: [],
      });
    }
    if (row.topicId && row.topicName && row.topicSlug) {
      const event = eventsMap.get(row.id);
      if (event) {
        event.topics.push({
          topicId: row.topicId,
          topicName: row.topicName,
          topicSlug: row.topicSlug,
          subtopicName: row.subtopicName ?? null,
        });
      }
    }
  }

  return [...eventsMap.values()].sort((a, b) => b.year - a.year);
}

async function queryTopicsInWindow(
  params: GetTopicsInWindowParams,
): Promise<Array<{ id: number; name: string; slug: string }>> {
  return defaultDb
    .select({
      id: topics.id,
      name: topics.name,
      slug: topics.slug,
    })
    .from(events)
    .innerJoin(eventTopics, eq(eventTopics.eventId, events.id))
    .innerJoin(topics, eq(topics.id, eventTopics.topicId))
    .where(
      and(
        inArray(events.month, params.months),
        inArray(events.day, params.days),
      ),
    )
    .groupBy(topics.id, topics.name, topics.slug)
    .orderBy(topics.name);
}

export async function getTopicsInWindow(
  params: GetTopicsInWindowParams,
  deps?: TopicsInWindowDeps,
): Promise<Array<{ id: number; name: string; slug: string }>> {
  const resolvedDeps = deps ?? { db: { query: queryTopicsInWindow } };
  return resolvedDeps.db.query(params);
}

export async function getEvents(params: GetEventsParams, deps?: Deps): Promise<EventWithTopics[]> {
  const resolvedDeps = deps ?? {
    cache: redisService,
    db: { query: queryEvents },
  };

  const key = buildCacheKey(params);

  const cached = await resolvedDeps.cache.get({ prefix: CACHE_PREFIX, key });
  if (cached) {
    return JSON.parse(cached) as EventWithTopics[];
  }

  const result = await resolvedDeps.db.query(params);

  await resolvedDeps.cache.setWithExpiry({
    prefix: CACHE_PREFIX,
    key,
    value: JSON.stringify(result),
    expiry: CACHE_TTL_SECONDS,
  });

  return result;
}
