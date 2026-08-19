#!/bin/sh
set -e

echo "Running database migrations..."
DB_MIGRATING=true node_modules/.bin/tsx src/lib/server/databases/postgres/migrate.ts

echo "Running database seed..."
DB_SEEDING=true node_modules/.bin/tsx src/lib/server/databases/postgres/seed.ts

echo "Starting application..."
exec node build
