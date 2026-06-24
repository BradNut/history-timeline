# Capture per-image author/license for Wikipedia thumbnails

**Type:** enhancement
**Area:** import pipeline, attribution / licensing

## Context

Events ingested from the Wikipedia "On This Day" API include thumbnail images
(`page.thumbnail.source`), stored as `events.imageUrl` and displayed in the
timeline and `EventDetailModal`.

Unlike Wikipedia article text (uniformly CC BY-SA 4.0), each image file carries
its **own** license — some are CC BY-SA, some public domain, and occasionally
non-free / fair-use. We currently only show a blanket disclaimer in
`SourceAttribution.svelte` ("Images retain their original licenses as listed on
their Wikipedia file pages").

## Problem

A blanket statement is a stopgap. Proper compliance (especially for CC BY and
CC BY-SA images) requires per-image attribution: the author/credit, the license
name + link, and a link to the file's description page. We don't capture any of
that today.

## Proposed approach

Extend the importer to fetch and persist image metadata:

1. During import, for each page with a thumbnail, query the MediaWiki
   `imageinfo` API (`prop=imageinfo`, `iiprop=extmetadata|url`) to retrieve
   `Artist`, `LicenseShortName`, `LicenseUrl`, and the file description page URL.
2. Add columns to the `events` table (or a dedicated `event_images` table if we
   later support multiple images): `imageAuthor`, `imageLicense`,
   `imageLicenseUrl`, `imageDescriptionUrl`.
3. Surface this metadata as an image caption/credit in `EventDetailModal` and,
   where space allows, in the timeline.
4. Consider **filtering out non-free / fair-use images** at import time, since
   reusing those on this site likely isn't covered by fair use.

## Acceptance criteria

- [ ] Importer captures author + license + license URL + file page URL per image.
- [ ] Schema migration adds the new fields.
- [ ] `EventDetailModal` shows an image credit with license link when present.
- [ ] Non-free images are either excluded or clearly flagged.
- [ ] Backfill strategy decided for already-imported events (re-import vs. one-off job).

## Notes

- The blanket disclaimer in `SourceAttribution.svelte` can stay as a fallback
  for images lacking metadata.
- Source of the original observation:
  `EventDetailModal` / `SourceAttribution` work for Wikipedia CC BY-SA compliance.
