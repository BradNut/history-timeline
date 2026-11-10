import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { betterAuth } from 'better-auth/minimal';
import { admin } from 'better-auth/plugins';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/databases/postgres';
import { resolveIpAddressOptions } from '$lib/server/ip-address';

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: { enabled: true },
	advanced: {
		ipAddress: resolveIpAddressOptions({
			AUTH_IP_ADDRESS_HEADERS: env.AUTH_IP_ADDRESS_HEADERS,
			AUTH_TRUSTED_PROXIES: env.AUTH_TRUSTED_PROXIES
		})
	},
	plugins: [
		admin(),
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});
