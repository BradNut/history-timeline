import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const client = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(client);

await migrate(db, {
	migrationsFolder: resolve(__dirname, '../../../../drizzle')
});

await client.end();
console.log('Migrations applied successfully.');
