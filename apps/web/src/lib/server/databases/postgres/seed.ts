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
