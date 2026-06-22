# History Timeline

A SvelteKit web application that displays historical events on an interactive timeline, sourced from the Wikipedia "On This Day" API.

## Overview

Browse history by calendar date — pick any date, choose a granularity window (Today / This Week / This Month), and explore events, births, and deaths across all of recorded history. Events are classified into topics and subtopics (Musical, Historical, Scientific, Cultural, Political, Sporting) via an automated taxonomy mapping system.

## Tech Stack

- **Framework**: SvelteKit 2 + Svelte 5 (runes API)
- **Database**: PostgreSQL via Drizzle ORM + `postgres.js`
- **Auth**: Better Auth (email/password, admin role)
- **Styling**: TailwindCSS v4 + shadcn-svelte components
- **Runtime**: Node.js via `@sveltejs/adapter-node`

## Prerequisites

- Node.js v20+
- pnpm v9+
- Docker (for local PostgreSQL)

## Local Development

### 1. Install dependencies

```sh
pnpm install
```

### 2. Configure environment

```sh
cp apps/web/.env.example apps/web/.env
```

Edit `apps/web/.env` and set your values.

### 3. Start the database

```sh
pnpm --filter history-timeline-web db:start
```

### 4. Run migrations

```sh
pnpm --filter history-timeline-web db:migrate
```

### 5. Seed the database

```sh
pnpm --filter history-timeline-web db:seed
```

This creates topics, subtopics, and an admin user (`admin@historytimeline.local` / `changeme-admin-2025`).

### 6. Start the dev server

```sh
pnpm --filter history-timeline-web dev
```

Open [http://localhost:5173](http://localhost:5173).

## Admin

Navigate to [http://localhost:5173/admin/login](http://localhost:5173/admin/login).

From the admin dashboard you can:
- Trigger a **Daily Import** (fetches today's Wikipedia events)
- Trigger a **Full Import** (all 366 calendar days — slow)
- Manage taxonomy mappings
- Edit events

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build |
| `pnpm db:start` | Start PostgreSQL container |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:seed` | Seed topics and admin user |
| `pnpm db:generate` | Generate new migration from schema changes |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm test` | Run tests |

## Docker

To run the full app in Docker:

```sh
pnpm --filter history-timeline-web docker:up
```

This builds the image and starts both the database and app containers. Environment variables are configured in `docker-compose.yml`.
