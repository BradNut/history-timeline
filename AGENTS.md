# AGENTS

SvelteKit web app in a pnpm workspace. `apps/web` is the only app right now.

## Stack Snapshot

- **Web**: SvelteKit 2, Svelte 5 runes, TypeScript strict, Tailwind CSS v4, shadcn-svelte, Lucide, Better Auth, Drizzle ORM, Redis, Node.js via `@sveltejs/adapter-node`.
- **Repo**: pnpm, TypeScript 5.6+, Biome, Vitest, no Playwright yet.

## Essentials

- **Dev**: `pnpm dev` or `pnpm --filter history-timeline-web dev`
- **Typecheck**: `pnpm --filter history-timeline-web check` (do **not** use `pnpm typecheck` at root; it fails)
- **Unit tests**: `pnpm --filter history-timeline-web test`
- **Lint**: `pnpm --filter history-timeline-web lint`
- **Build**: `pnpm build` or `pnpm --filter history-timeline-web build`
- **DB seed**: `pnpm --filter history-timeline-web db:seed`

## Read Only What You Need

- **Domain terms**: `CONTEXT.md`
- **Routes/pages/layouts**: `apps/web/src/routes/**`
- **Components**: `apps/web/src/lib/components/**`
- **UI primitives (shadcn)**: `apps/web/src/lib/components/ui/**`
- **Server-only code**: `apps/web/src/lib/server/**`, `+page.server.ts`, `+server.ts`
- **DB schema**: `apps/web/src/lib/server/db/schema.ts`
- **Env/schema**: `apps/web/src/lib/server/env.ts` and `apps/web/.env.example`
- **Import logic**: `apps/web/src/lib/server/import/**`
- **Migrations**: `apps/web/drizzle/` and `apps/web/drizzle.config.ts`

## Non-Negotiable Rules

- **Svelte 5 runes only**: `$state`, `$derived`, `$effect`, `$props`, `$bindable`.
- **Server/client boundary**: never import `src/lib/server/**` modules into client components or `+page.svelte`.
- **No client secrets**: only sanitized values reach the browser via `load`, form actions, or API responses.
- **No suppressions**: no `@ts-ignore`, `svelte-ignore`, or `eslint-disable` without explicit approval.
- **Constants before literals**: reuse domain constants from `src/lib/server/env.ts` and `src/lib/server/db/schema.ts`.
- **Prefer root causes**: fix upstream issues rather than adding workarounds.
- **Run checks before committing**: `pnpm --filter history-timeline-web check` and `pnpm --filter history-timeline-web lint`.

## Local Map

- `apps/web/src/app.html` — page template (hardcoded `class="dark"`)
- `apps/web/src/app.d.ts` — global `App` types (Better Auth `User`/`Session` in `Locals`)
- `apps/web/src/hooks.server.ts` — Better Auth session handler
- `apps/web/src/routes/+layout.svelte` — root layout, imports `layout.css`
- `apps/web/src/routes/+page.server.ts` — timeline `load`
- `apps/web/src/lib/server/auth.ts` — Better Auth setup
- `apps/web/src/lib/server/db/index.ts` — Drizzle + postgres client
- `apps/web/src/lib/server/events.ts` — cached event query
- `apps/web/src/lib/server/import/` — Wikipedia import pipeline
- `apps/web/src/lib/server/redis.ts` — Redis cache client
- `apps/web/src/lib/utils.ts` — `cn` + `bits-ui` type re-exports

## SvelteKit & Workspace Notes

- **SvelteKit config is inline in `vite.config.ts`**: adapter, `compilerOptions.runes`, and `typescript.config` are passed to the `sveltekit` Vite plugin. This is valid since SvelteKit 2.62.0 and matches `personal-website-sveltekit`; `secondchancepuzzles` uses a separate `svelte.config.js`. Do not create a `svelte.config.js` unless you intend to migrate.
- **No `svelte.config.js`**: fine, but the `sveltekit` plugin is carrying all config. If you want editor tooling and `sv` to be happy, a separate `svelte.config.js` is more conventional.
- **Environment**: `apps/web/src/lib/server/env.ts` validates `process.env` with Zod v4. `apps/web/src/lib/server/db/index.ts` uses `$env/dynamic/private` instead.
- **Testing**: `vitest.config.ts` aliases `$env/dynamic/private`, `$app/server`, and `$app/environment` to test mocks. This works but is a divergence from the reference projects.

## Triage Differences vs. Reference Projects

- **Root `package.json`**: missing `type`, `engines`, and `packageManager` (other projects set these).
- **Root `typecheck` script**: references `pnpm -r typecheck`, but `apps/web` has `check`, not `typecheck`. `pnpm typecheck` at root fails.
- **Dependencies**: `apps/web/package.json` puts `tsx`, `better-auth`, `drizzle-orm`, and `postgres` in `devDependencies`. These are runtime server packages and should be in `dependencies`.
- **pnpm-workspace.yaml**: `allowBuilds` lists `@prisma/client` and `better-sqlite3`, which are not used anywhere.
- **Build tool**: Biome is used for linting and formatting, matching `secondchancepuzzles` and `personal-website-sveltekit`.
- **E2E tests**: no Playwright setup yet; reference projects use Playwright.
- **tsconfig**: `apps/web/tsconfig.json` does not include `types: ["node"]` or `verbatimModuleSyntax` (both reference projects differ here).
- **app.html**: hardcoded `<html class="dark">` rather than a `data-theme` script that reads localStorage / `prefers-color-scheme`.
- **styles**: `layout.css` is imported from `routes/+layout.svelte`; no `src/app.css`.

## When in Doubt

- Use the Svelte MCP server for Svelte/SvelteKit questions.
- Keep fixes minimal and aligned with the existing codebase.
- Do not migrate config styles or tooling without explicit direction.
