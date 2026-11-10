import { describe, expect, it } from 'vitest';
import { resolveIpAddressOptions } from './ip-address';

describe('resolveIpAddressOptions', () => {
	it('leaves better-auth defaults in place when nothing is configured', () => {
		expect(resolveIpAddressOptions({})).toEqual({});
	});

	it('reads trusted proxies from a comma-separated list, ignoring whitespace and blanks', () => {
		expect(resolveIpAddressOptions({ AUTH_TRUSTED_PROXIES: ' 10.0.1.5, 10.0.2.0/24 ,, ' })).toEqual({
			trustedProxies: ['10.0.1.5', '10.0.2.0/24']
		});
	});

	it('reads IP headers in priority order, normalised to lowercase', () => {
		expect(
			resolveIpAddressOptions({ AUTH_IP_ADDRESS_HEADERS: 'CF-Connecting-IP, X-Forwarded-For' })
		).toEqual({ ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for'] });
	});

	it('treats a blank value as unset', () => {
		expect(resolveIpAddressOptions({ AUTH_IP_ADDRESS_HEADERS: ' ', AUTH_TRUSTED_PROXIES: '' })).toEqual(
			{}
		);
	});
});
