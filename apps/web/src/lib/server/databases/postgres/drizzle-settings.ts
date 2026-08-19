export const drizzleSettings = {
  migrationsOut: './drizzle',
  schemaPath: './src/lib/server/api/databases/postgres/drizzle-schema.ts',
  dialect: 'postgresql',
  casing: 'snake_case',
  migrations: {
    table: 'migrations',
    schema: 'public',
  },
  defaults: {
    databaseHost: 'localhost',
    databasePort: 5432,
    databaseName: 'acme',
  },
} as const;
