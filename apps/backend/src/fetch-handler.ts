import { matchesApiMount } from '@secred/shared';
import { handleApi } from './api/handler';
import type { Env } from './env';
import { enforceApiRateLimit } from './rate-limit';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);
		if (matchesApiMount(url.pathname)) {
			const rateLimited = await enforceApiRateLimit(request, env);
			if (rateLimited) {
				return rateLimited;
			}
			return handleApi(request, env, ctx);
		}
		return env.ASSETS.fetch(request);
	},
} satisfies ExportedHandler<Env>;
