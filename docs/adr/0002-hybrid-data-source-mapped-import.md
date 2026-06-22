# ADR 0002: Hybrid data source with mapped import

## Status
Accepted

## Context
Event data needs to come from somewhere. Options considered:
- Third-party API at runtime (Wikipedia REST API called on every page load)
- Fully internal curated database (manual data entry)
- Hybrid: seed from Wikipedia/Wikidata into owned Postgres, serve from own DB

Runtime dependency on Wikipedia means outages and rate limits affect the user-facing app. Manual curation doesn't scale. Raw Wikidata categories are too noisy for a clean UX.

## Decision
Seed from the Wikipedia "On This Day" REST API (events + births + deaths, all 366 days). At import time, a Taxonomy Mapping layer normalizes raw Wikipedia categories to the canonical Topic + Subtopic taxonomy. Unmapped events land in an admin review queue. The app serves data exclusively from its own Postgres DB at runtime. A nightly Daily Import (3 requests) keeps today's data fresh via a protected `/api/cron` endpoint triggered by Coolify's scheduler.

## Consequences
- Wikipedia API is only hit during import runs, not on user requests
- Rate limiting handled at import time: 500ms delay between requests, exponential backoff on 429/503, descriptive User-Agent header
- A Taxonomy Mapping table must be maintained by the admin as new Wikipedia categories are encountered
- Raw Wikipedia category strings are stored on each Event for auditability and re-mapping
