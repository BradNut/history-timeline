# Build context is the repo root (Coolify: Base Directory = /, Dockerfile Location = /Dockerfile)
FROM node:24-alpine AS base
WORKDIR /app
# pnpm version comes from `packageManager` in the root package.json
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# Workspace manifests only, for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json

# ---- Build stage: full install, build app + bundle migrate/seed scripts ----
FROM base AS builder
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter history-timeline-web build

# ---- Production dependencies only (no build tools, no devDependencies) ----
FROM base AS prod-deps
RUN pnpm install --frozen-lockfile --prod --no-optional --ignore-scripts

# ---- Runtime stage ----
FROM node:24-alpine AS runtime

# Pick up Alpine security fixes newer than the base image, and drop the bundled
# package managers (npm, corepack, yarn): nothing at runtime installs packages.
RUN apk upgrade --no-cache && \
    rm -rf /usr/local/lib/node_modules /opt/yarn-* \
      /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
      /usr/local/bin/yarn /usr/local/bin/yarnpkg && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app/apps/web

ENV NODE_ENV=production
# Bind dual-stack: Docker's /etc/hosts resolves `localhost` to ::1 first, and the
# platform healthcheck probes localhost with busybox wget, which does not fall back
# to the A record. Binding 0.0.0.0 (IPv4-only) makes that probe fail with ECONNREFUSED.
ENV HOST=::
ENV PORT=3000

# pnpm's symlinked layout: root virtual store + the app's node_modules links
COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules /app/node_modules
COPY --from=prod-deps --chown=nodejs:nodejs /app/apps/web/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/build ./build
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/dist/scripts ./dist/scripts
COPY --from=builder --chown=nodejs:nodejs /app/apps/web/drizzle ./drizzle
COPY --from=builder --chown=nodejs:nodejs --chmod=755 /app/apps/web/docker-entrypoint.sh ./docker-entrypoint.sh

USER nodejs

EXPOSE 3000

# curl is not present in node:*-alpine; busybox wget is. Probe the literal IPv4
# loopback so the check never depends on localhost resolution order.
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
  CMD wget -q --spider http://127.0.0.1:3000/api/health || exit 1

# Runs bundled migrate + seed scripts, then starts the SvelteKit node server
ENTRYPOINT ["./docker-entrypoint.sh"]
