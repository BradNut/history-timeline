import { describe, expect, it } from 'vitest';
import { resolveSafeRedirect } from './auth-redirect';

describe('resolveSafeRedirect', () => {
	it('returns the target when it is a safe relative path', () => {
		expect(resolveSafeRedirect('/')).toBe('/');
		expect(resolveSafeRedirect('/?date=2024-07-20&granularity=week')).toBe(
			'/?date=2024-07-20&granularity=week'
		);
	});

	it('falls back to "/" when the target is missing', () => {
		expect(resolveSafeRedirect(null)).toBe('/');
		expect(resolveSafeRedirect(undefined)).toBe('/');
		expect(resolveSafeRedirect('')).toBe('/');
	});

	it('falls back when the target is a protocol-relative URL', () => {
		expect(resolveSafeRedirect('//evil.com')).toBe('/');
	});

	it('falls back when the target is an absolute URL', () => {
		expect(resolveSafeRedirect('https://evil.com')).toBe('/');
		expect(resolveSafeRedirect('http://evil.com/path')).toBe('/');
	});

	it('falls back when the target does not start with a slash', () => {
		expect(resolveSafeRedirect('evil.com')).toBe('/');
	});

	it('supports a custom fallback', () => {
		expect(resolveSafeRedirect(null, '/admin')).toBe('/admin');
	});
});
