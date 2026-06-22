#!/bin/sh
set -e

echo "Running database migrations..."
node_modules/.bin/tsx src/lib/server/db/migrate.ts

echo "Running database seed..."
node_modules/.bin/tsx src/lib/server/db/seed.ts

echo "Starting application..."
exec node build
