# History Timeline — Domain Glossary

## Core Terms

### Event
A historical occurrence with a **single point-in-time date** (`event_date`) and an optional `end_date` for occurrences that span a range (e.g., a war, a recording period). An Event has a title, description, source URL, and optional image URL. An Event belongs to one or more **Topic+Subtopic pairs** via a join table.

### Topic
A top-level fixed category for classifying Events (e.g., `Musical`, `Historical`, `Scientific`). The taxonomy is **admin-defined** — Topics are not user-created. Topics are managed via the admin area.

### Subtopic
A second-level fixed category nested under a Topic (e.g., `Musical > Jazz`, `Historical > Wars`). Maximum depth is two levels (Topic → Subtopic). Subtopics are **admin-defined**.

### Taxonomy Mapping
A rule that normalizes a raw **Wikidata/Wikipedia category string** to a canonical Topic + Subtopic pair (e.g., `"Jazz musicians"` → `Musical > Jazz`). Applied at import time. Unmapped categories land in a review queue. When an admin resolves an unmapped category, the mapping is created **and immediately backfilled** — all existing Events whose `rawCategories` contains that string receive the corresponding `eventTopics` row.

### Anchor Date
The reference calendar date the user has navigated to (defaults to today). The Anchor Date is a **calendar date** (month + day), not a specific year — it selects across all years of history.

### Granularity
The time window width applied around the Anchor Date. Fixed options: `Today`, `This Week`, `This Month`. Controls how many days around the anchor are included in the timeline query.

### Import Run
A triggered process that fetches `events`, `births`, and `deaths` from the Wikipedia "On This Day" REST API for one or more calendar dates, applies Taxonomy Mapping, and upserts the results into the database. A **Full Import** covers all 366 calendar days; a **Daily Import** covers only the current date (3 requests).

### Admin
A single authenticated user with elevated privileges. Admins can trigger Import Runs, manage the Taxonomy Mapping table, edit Events, and manage Topics/Subtopics.

### User
An authenticated regular user. User-facing features (e.g., bookmarking) are v2. The role is scaffolded in Better Auth from day one.

### Timeline View
The primary UI for browsing Events. A **vertical scroll layout** — year labels on the left, event cards on the right — built with `shadcn-svelte-timeline`. Controlled by two independent UI elements: an **Anchor Date** scrubber and a **Granularity** selector. Events are grouped by year in descending order.

### Landing Page
The anonymous entry point to the site. A minimal shell shown when a visitor is not authenticated. It does not query Events, run the Import pipeline, or hit Redis — it only renders the public landing UI.

### UI Stack
TailwindCSS + shadcn-svelte components. Dark editorial visual aesthetic. `shadcn-svelte-timeline` for the Timeline View. Svelte 5 runes API throughout.

### Event Cache
A Redis-backed read-through cache for the Event query results returned by the Timeline View. Keyed by the composite of `(months, days, topicIdFilter)` derived from the **Anchor Date** and **Granularity**. TTL is 24 hours. Gracefully degrades to direct database queries when Redis is unavailable.

### Auto-Import
An Import Run triggered automatically by the Timeline View when the `Today` granularity returns zero Events for the queried date. Runs synchronously before the page responds, then re-queries the database so Events appear immediately. Guarded against concurrent runs by checking `importLogs` for a `running` entry within the last 5 minutes. Recorded with `type = 'auto'` to distinguish from admin-triggered runs. Only fires on the `Today` granularity — broader date ranges do not trigger it.

### Detail View
A modal/drawer that opens when a user clicks an Event on the timeline. Shows the full Event content including description, topic tags, source link, image (if available), and a "related events" section (other Events on the same Anchor Date).

### Topic Window
The fixed Anchor Date **minus 1 day through plus 1 day** range used to scope which Topics appear in the Topic Filter. Independent of Granularity — even when the user has selected `Week` or `Month`, the Topic Filter only shows Topics with at least one Event in the 3-day Topic Window around the Anchor Date. Exists to avoid showing dead-end filters (Topics with zero nearby Events), not primarily as a performance optimization.

## SvelteKit & Workspace Triage

This section captures the ways `history-timeline` currently diverges from the SvelteKit/pnpm conventions in `secondchancepuzzles` and `personal-website-sveltekit`.

### Config style

- `apps/web/vite.config.ts` passes the SvelteKit config (`adapter`, `compilerOptions`, `typescript`) directly to the `sveltekit` Vite plugin. This is valid since SvelteKit 2.62.0 and matches `personal-website-sveltekit`; `secondchancepuzzles` uses a separate `svelte.config.js`. Both are acceptable, but the project is currently inconsistent with the split-config style.

### Dependencies / workspace hygiene

- `apps/web/package.json` puts `tsx`, `better-auth`, `drizzle-orm`, and `postgres` in `devDependencies`. These are runtime server packages and should be in `dependencies`.
- Root `package.json` lacks `type`, `engines`, and `packageManager` (the reference projects set all three).
- Root `pnpm-workspace.yaml` has `allowBuilds` entries for `@prisma/client` and `better-sqlite3` that are not used anywhere.

### Scripts / typecheck

- Root `typecheck` script fails because `apps/web` exposes `check`, not `typecheck`.

### SvelteKit specifics

- `app.html` uses a hardcoded `<html class="dark">` instead of a theme-detection script.
- `tsconfig.json` does not include `types: ["node"]` or `verbatimModuleSyntax`, which the reference projects set.
- `apps/web` uses Biome for linting and formatting (matching the reference projects).
- No Playwright / E2E test setup yet (the reference projects have it).
- `vitest.config.ts` aliases `$env/dynamic/private`, `$app/server`, and `$app/environment` to test mocks; this is a divergence from the reference test setups.

### Tooling decisions to keep in mind

- Do not create a `svelte.config.js` unless the project is intentionally migrating to the split-config style used by `secondchancepuzzles`.
- `src/lib/server/env.ts` validates `process.env` with Zod v4, while `src/lib/server/db/index.ts` reads `$env/dynamic/private` directly.
