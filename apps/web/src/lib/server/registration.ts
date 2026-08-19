import { env } from '$env/dynamic/private';

/**
 * Whether public sign-up is currently enabled. Controlled by the
 * REGISTRATION_ENABLED env var (defaults to enabled), following the same
 * boolean-from-string convention used by USE_REDIS_CACHE in redis.ts.
 */
export function isRegistrationEnabled(): boolean {
	return env.REGISTRATION_ENABLED !== 'false';
}
