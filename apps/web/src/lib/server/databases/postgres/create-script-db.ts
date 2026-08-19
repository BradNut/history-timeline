import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { drizzle } from 'drizzle-orm/node-postgres';
import Pool from 'pg-pool';
import pino from 'pino';
import * as drizzleSchema from './drizzle-schema';
import { drizzleSettings } from './drizzle-settings';

export type ScriptDb = NodePgDatabase<typeof drizzleSchema> & { $client: InstanceType<typeof Pool> };

type DatabaseConfig = {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
};

function getDatabaseConfig(): DatabaseConfig {
  const url = process.env.DATABASE_URL;
  if (url) {
    const parsed = new URL(url);
    return {
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      host: parsed.hostname,
      port: Number(parsed.port) || drizzleSettings.defaults.databasePort,
      database: decodeURIComponent(parsed.pathname.slice(1)),
    };
  }

  if (!process.env.DATABASE_USER) {
    throw new Error('DATABASE_URL or individual DATABASE_* variables must be set');
  }

  return {
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD ?? '',
    host: process.env.DATABASE_HOST ?? drizzleSettings.defaults.databaseHost,
    port: Number(process.env.DATABASE_PORT) || drizzleSettings.defaults.databasePort,
    database: process.env.DATABASE_DB ?? '',
  };
}

function createLogger() {
  if (process.env.ENV === 'prod') {
    return false;
  }

  const logger = pino({
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  });

  return {
    logQuery: (query: string, params: unknown[]) => {
      logger.info({ query, params });
    },
  };
}

export function createScriptDb(): ScriptDb {
  const config = getDatabaseConfig();

  return drizzle(
    new Pool({
      ...config,
      ssl: false,
      max: 1,
    }),
    {
      casing: drizzleSettings.casing,
      schema: drizzleSchema,
      logger: createLogger(),
    },
  ) as ScriptDb;
}

export async function closeScriptDb(db: ScriptDb): Promise<never> {
  await db.$client.end();
  process.exit();
}
