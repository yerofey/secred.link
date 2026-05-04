import type { Env } from './env';
import { json } from './http';

/** Must match `ratelimits[].simple.period` in `wrangler.jsonc` (seconds). */
export const API_RATE_LIMIT_PERIOD_SEC = 60;

/** Prefer Cloudflare edge IP; fall back for local `wrangler dev`. */
export function rateLimitClientKey(request: Request): string {
	const cf = request.headers.get('CF-Connecting-IP');
	if (cf) {
		return cf.trim();
	}
	const xff = request.headers.get('X-Forwarded-For');
	if (xff) {
		const first = xff.split(',')[0]?.trim();
		if (first) {
			return first;
		}
	}
	return 'unknown';
}

/** Returns a 429 response when over limit; otherwise `null`. */
export async function enforceApiRateLimit(
	request: Request,
	env: Env,
): Promise<Response | null> {
	const { success } = await env.API_RATE_LIMITER.limit({
		key: rateLimitClientKey(request),
	});
	if (success) {
		return null;
	}
	return json(
		{ error: 'Too many requests' },
		{
			status: 429,
			headers: {
				'retry-after': String(API_RATE_LIMIT_PERIOD_SEC),
			},
		},
	);
}
