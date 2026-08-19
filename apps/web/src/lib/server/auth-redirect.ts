/**
 * Only ever redirect to a same-origin, relative path after auth. This blocks
 * open-redirect attempts via absolute URLs (`https://evil.com`) and
 * protocol-relative URLs (`//evil.com`).
 */
const SAFE_REDIRECT_PATTERN = /^\/(?![/\\])/;

export function resolveSafeRedirect(target: string | null | undefined, fallback = '/'): string {
	if (!target || !SAFE_REDIRECT_PATTERN.test(target)) {
		return fallback;
	}
	return target;
}
