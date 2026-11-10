#!/bin/sh
set -e

echo "Running database migrations..."
DB_MIGRATING=true node dist/scripts/migrate.mjs

echo "Running database seed..."
DB_SEEDING=true node dist/scripts/seed.mjs

echo "Starting application..."
exec node build
