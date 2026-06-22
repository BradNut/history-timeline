# ADR 0003: Redis-backed Event Cache

## Status

Accepted

## Context

The Timeline View's `load` function executes a multi-join Postgres query on every page request. The query parameters are `(months, days, topicIdFilter)` — all derived from the **Anchor Date** and **Granularity** URL params. Events are only written during Import Runs (triggered manually or via daily cron), so the result set for any given parameter combination is stable between imports.

## Decision

Add a Redis-backed read-through **Event Cache** in front of the event query. Cache keys are the composite `{months}-{days}-{topicIdFilter}` under the `history-timeline:events:` namespace. TTL is 24 hours (a safety net; the daily import schedule means data is never more than one day stale). Redis is opt-in via `USE_REDIS_CACHE=true` + `REDIS_URI` env vars — the app degrades gracefully to direct DB queries when Redis is unavailable.

The cache logic is extracted into `src/lib/server/events.ts` (`getEvents` function) with injectable `cache` and `db` dependencies for testability. `ioredis` is used as the client, consistent with the personal-website project.

## Alternatives Considered

- **TTL + explicit invalidation on import** — adds correctness on import at the cost of coupling the import path to cache management. Deferred since 24h TTL is acceptable for the current use case.
- **In-process memory cache** — no Redis dependency, but doesn't survive restarts or scale across instances.
- **Required Redis (fail-fast)** — maximises cache guarantees but breaks local dev without Docker. Opt-in is preferable given the single-admin, low-traffic nature of the app.
