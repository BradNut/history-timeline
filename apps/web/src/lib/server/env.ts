import { z } from 'zod';

export const envSchema = z.object({
	DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid URL' }),
	ORIGIN: z.string().url({ message: 'ORIGIN must be a valid URL' }),
	BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
	CRON_SECRET: z.string().min(16, 'CRON_SECRET must be at least 16 characters'),
	USE_REDIS_CACHE: z.string().default('false'),
	REDIS_URI: z.string().url({ message: 'REDIS_URI must be a valid URL' }).optional(),
	ADMIN_SEED_EMAIL: z.string().email({ message: 'ADMIN_SEED_EMAIL must be a valid email' }),
	ADMIN_SEED_PASSWORD: z.string().min(8, 'ADMIN_SEED_PASSWORD must be at least 8 characters')
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
	const env = {
		DATABASE_URL: process.env.DATABASE_URL,
		ORIGIN: process.env.ORIGIN,
		BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
		CRON_SECRET: process.env.CRON_SECRET,
		USE_REDIS_CACHE: process.env.USE_REDIS_CACHE,
		REDIS_URI: process.env.REDIS_URI,
		ADMIN_SEED_EMAIL: process.env.ADMIN_SEED_EMAIL,
		ADMIN_SEED_PASSWORD: process.env.ADMIN_SEED_PASSWORD
	};

	const parsed = envSchema.safeParse(env);
	if (!parsed.success) {
		console.error('Environment validation failed:');
		for (const error of parsed.error.issues) {
			console.error(`  - ${error.path.join('.')}: ${error.message}`);
		}
		throw new Error('Invalid environment variables');
	}

	return parsed.data;
}
