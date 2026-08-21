# ---- Build stage ----
# Build context is the repo root (Coolify: Base Directory = /, Dockerfile Location = /Dockerfile)
FROM node:24-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.26.0 --activate

# Copy workspace manifests first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter history-timeline-web build

# ---- Runtime stage ----
FROM node:24-alpine AS runtime
WORKDIR /app/apps/web

RUN corepack enable && corepack prepare pnpm@10.26.0 --activate

ENV NODE_ENV=production
# Bind dual-stack: Docker's /etc/hosts resolves `localhost` to ::1 first, and the
# platform healthcheck probes localhost with busybox wget, which does not fall back
# to the A record. Binding 0.0.0.0 (IPv4-only) makes that probe fail with ECONNREFUSED.
ENV HOST=::
ENV PORT=3000

# Copy the full built workspace; preserves pnpm's symlinked node_modules and keeps
# devDependencies (drizzle-orm, postgres, tsx) needed by docker-entrypoint.sh at startup
COPY --from=builder /app /app

# Create non-root user and make entrypoint executable
RUN chmod +x docker-entrypoint.sh && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

# curl is not present in node:*-alpine; busybox wget is. Probe the literal IPv4
# loopback so the check never depends on localhost resolution order.
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
  CMD wget -q --spider http://127.0.0.1:3000/api/health || exit 1

# Runs migrate.ts + seed.ts (via tsx), then starts the SvelteKit node server
ENTRYPOINT ["./docker-entrypoint.sh"]
