# Self-hosting History Timeline

This guide covers running the History Timeline app on your own server. It assumes you have already installed dependencies and can build the project locally.

## Environment variables

Copy `apps/web/.env.example` to `apps/web/.env` and set the values for your deployment.

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string used by Drizzle at runtime |
| `DATABASE_*` | Yes | — | Connection details used by `db:seed` and `db:bootstrap-admin` (must point to the same database) |
| `ORIGIN` | Yes | — | Public origin of the app, e.g. `https://history.example.com` |
| `BETTER_AUTH_SECRET` | Yes | — | 32+ character secret for Better Auth sessions |
| `CRON_SECRET` | Yes | — | 16+ character secret for the `/api/cron` endpoint |
| `REGISTRATION_ENABLED` | No | `true` | Set to `false` to disable public sign-up |
| `ADMIN_SEED_EMAIL` | No | — | Email of the pre-provisioned admin account |
| `ADMIN_SEED_PASSWORD` | No | — | Password for the pre-provisioned admin account |
| `USE_REDIS_CACHE` | No | `false` | Set to `true` to enable Redis caching |
| `REDIS_URI` | No | — | Redis connection string (required when `USE_REDIS_CACHE=true`) |

`ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` must both be set or both be left unset.

## Admin bootstrapping

Choose one of the following options before your first users sign in.

### Option A: automatic first registrant (simplest)

1. Leave `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` empty.
2. Start the app and register the first account.
3. That account is promoted to admin automatically.

Only the first person to register becomes an admin; later registrations get the default `user` role.

### Option B: provision an admin without destructive seeding

1. Set `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` in `.env`.
2. Run migrations if you have not already:

   ```sh
   pnpm --filter history-timeline-web db:migrate
   ```

3. Bootstrap the admin user without affecting existing data:

   ```sh
   pnpm --filter history-timeline-web db:bootstrap-admin
   ```

### Option C: destructive seed (development only)

Run the full seed script to reset data and create a default admin:

```sh
pnpm --filter history-timeline-web db:seed
```

This is useful for local development but should not be used on a populated production database.

## Sign in

The old `/admin/login` route has been retired. Everyone now signs in at:

```
/auth/sign-in
```

Admins are redirected to `/admin` automatically. Non-admin users are returned to the page they came from or the timeline.

## Public registration

Set `REGISTRATION_ENABLED=false` to prevent new accounts from being created. Existing accounts can still sign in.

## Health check

The app exposes a lightweight health endpoint at:

```
GET /api/health
```

It returns `200 OK` with the text `ok` and is safe to use for load-balancer or uptime-monitor health checks.

## Docker

For a self-contained local or production-like deployment:

```sh
pnpm --filter history-timeline-web docker:up
```

`docker-compose.yml` starts both the PostgreSQL container and the app container. Make sure the environment variables in the compose file match your intended deployment values.

## Coolify

A common production path is to deploy the Docker image with [Coolify](https://coolify.io):

1. Point Coolify at this repository.
2. Set the environment variables from `.env.example` in the Coolify service UI.
3. Run `db:migrate` as a one-off command before the first start.
4. (Optional) Run `db:bootstrap-admin` if you configured `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD`.
5. Add a scheduled task that hits `/api/cron` daily with the `Authorization: Bearer $CRON_SECRET` header.

See the `Coolify scheduled task setup` block in `apps/web/.env.example` for an example cron command.

## Security reminders

- Generate `BETTER_AUTH_SECRET` and `CRON_SECRET` with a cryptographically secure random source.
- Change the example `ADMIN_SEED_PASSWORD` before deploying to production.
- Use `ORIGIN` that matches the HTTPS URL users see; Better Auth rejects cross-origin requests otherwise.
- Keep `REGISTRATION_ENABLED=false` on private instances unless you want open sign-up.
