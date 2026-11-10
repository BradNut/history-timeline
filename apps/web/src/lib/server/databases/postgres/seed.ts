import './load-env';

import { getTableName, sql, type Table } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { closeScriptDb, createScriptDb } from './create-script-db';
import * as schema from './drizzle-schema';
import * as seeds from './seeds';

if (!process.env.DB_SEEDING) {
  throw new Error('You must set DB_SEEDING to "true" when running seeds');
}

async function resetTable(db: NodePgDatabase<typeof schema>, table: Table) {
  return db.execute(sql.raw(`TRUNCATE TABLE "public"."${getTableName(table)}" RESTART IDENTITY CASCADE`));
}

const db = createScriptDb();

// The container entrypoint sets DB_SEED_ONLY_IF_EMPTY so deploys/restarts only seed a
// new database. `pnpm db:seed` leaves it unset and always resets.
if (process.env.DB_SEED_ONLY_IF_EMPTY) {
  const [existing] = await db.select({ id: schema.topics.id }).from(schema.topics).limit(1);
  if (existing) {
    console.log('Database already seeded; skipping seed');
    await closeScriptDb(db);
  }
}

for (const table of [
  schema.eventTopics,
  schema.taxonomyMappings,
  schema.unmappedCategories,
  schema.events,
  schema.subtopics,
  schema.topics,
  schema.importLogs,
  schema.account,
  schema.session,
  schema.verification,
  schema.user,
]) {
  await resetTable(db, table);
}

await seeds.topics(db);
await seeds.admin(db);

await closeScriptDb(db);
