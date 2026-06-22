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

### UI Stack
TailwindCSS + shadcn-svelte components. Dark editorial visual aesthetic. `shadcn-svelte-timeline` for the Timeline View. Svelte 5 runes API throughout.

### Event Cache
A Redis-backed read-through cache for the Event query results returned by the Timeline View. Keyed by the composite of `(months, days, topicIdFilter)` derived from the **Anchor Date** and **Granularity**. TTL is 24 hours. Gracefully degrades to direct database queries when Redis is unavailable.

### Auto-Import
An Import Run triggered automatically by the Timeline View when the `Today` granularity returns zero Events for the queried date. Runs synchronously before the page responds, then re-queries the database so Events appear immediately. Guarded against concurrent runs by checking `importLogs` for a `running` entry within the last 5 minutes. Recorded with `type = 'auto'` to distinguish from admin-triggered runs. Only fires on the `Today` granularity — broader date ranges do not trigger it.

### Detail View
A modal/drawer that opens when a user clicks an Event on the timeline. Shows the full Event content including description, topic tags, source link, image (if available), and a "related events" section (other Events on the same Anchor Date).
