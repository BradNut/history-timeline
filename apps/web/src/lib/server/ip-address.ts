import type { BetterAuthOptions } from 'better-auth';
import type { Env } from './env';

type IpAddressEnv = Partial<Pick<Env, 'AUTH_IP_ADDRESS_HEADERS' | 'AUTH_TRUSTED_PROXIES'>>;

type IpAddressOptions = NonNullable<NonNullable<BetterAuthOptions['advanced']>['ipAddress']>;

function parseList(value: string | undefined): string[] {
	return (value ?? '')
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean);
}

/**
 * Better Auth `advanced.ipAddress` options from env. Unset or blank values are
 * omitted so Better Auth keeps its defaults (single-value X-Forwarded-For).
 */
export function resolveIpAddressOptions(env: IpAddressEnv): IpAddressOptions {
	const options: IpAddressOptions = {};
	const ipAddressHeaders = parseList(env.AUTH_IP_ADDRESS_HEADERS).map((header) => header.toLowerCase());
	if (ipAddressHeaders.length > 0) {
		options.ipAddressHeaders = ipAddressHeaders;
	}
	const trustedProxies = parseList(env.AUTH_TRUSTED_PROXIES);
	if (trustedProxies.length > 0) {
		options.trustedProxies = trustedProxies;
	}
	return options;
}
