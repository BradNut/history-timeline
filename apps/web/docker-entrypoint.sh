#!/bin/sh
set -e

echo "Running database migrations..."
DB_MIGRATING=true node dist/scripts/migrate.mjs

echo "Seeding database if empty..."
DB_SEEDING=true DB_SEED_ONLY_IF_EMPTY=true node dist/scripts/seed.mjs

echo "Starting application..."
exec node build
