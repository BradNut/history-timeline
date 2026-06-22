# ADR 0001: SvelteKit-only with monorepo-ready structure

## Status
Accepted

## Context
The app needs a backend to query the database and expose data to the UI. Options considered:
- SvelteKit server routes only (one deployable)
- SvelteKit + separate Hono API (two deployables, monorepo)

A separate Hono API is justified if a mobile app, public API consumers, or independent API scaling are needed. None of these are in scope for v1.

## Decision
Use SvelteKit server routes (`+server.ts`, `load` functions) as the sole backend. All DB access goes through an internal `packages/db` package (Drizzle ORM + Postgres schema). If a Hono API is needed in future, `packages/db` is extracted into it without rewriting the data layer.

## Consequences
- One deployable on Coolify — simpler ops
- `packages/db` must remain framework-agnostic (no SvelteKit imports) to allow future Hono extraction
- If a public API or mobile client is needed, a Hono service is added to the monorepo and `packages/db` is shared
