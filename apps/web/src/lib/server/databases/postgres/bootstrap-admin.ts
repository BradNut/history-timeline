import './load-env';

import { closeScriptDb, createScriptDb } from './create-script-db';
import seedAdmin from './seeds/admin';

if (!process.env.DB_BOOTSTRAPPING_ADMIN) {
  throw new Error('You must set DB_BOOTSTRAPPING_ADMIN to "true" when bootstrapping the admin user.');
}

if (!process.env.ADMIN_SEED_EMAIL || !process.env.ADMIN_SEED_PASSWORD) {
  throw new Error('ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set to bootstrap an admin.');
}

const db = createScriptDb();

await seedAdmin(db);
console.log('Admin bootstrap complete');

await closeScriptDb(db);
