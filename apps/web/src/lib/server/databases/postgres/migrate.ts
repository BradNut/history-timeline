import './load-env';

import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { closeScriptDb, createScriptDb } from './create-script-db';
import { drizzleSettings } from './drizzle-settings';

const migrationsFolder = drizzleSettings.migrationsOut.replace(/^\.\//, '');

if (!process.env.DB_MIGRATING) {
  throw new Error('You must set DB_MIGRATING to "true" when running migrations.');
}

const db = createScriptDb();

await migrate(db, { migrationsFolder });
console.log('Migrations complete');

await closeScriptDb(db);
