import type { MetricsObject, SecretObject } from './durable-objects';

export type Env = {
	ASSETS: Fetcher;
	ATTACHMENTS: R2Bucket;
	/** Workers Rate Limiting binding — see `ratelimits` in `wrangler.jsonc`. */
	API_RATE_LIMITER: RateLimit;
	SECRETS: DurableObjectNamespace<SecretObject>;
	METRICS: DurableObjectNamespace<MetricsObject>;
	APP_URL: string;
	ENVIRONMENT: string;
	VERSION_PREFIX: string;
	TEST_STRING: string;
	MIGRATION_TOKEN?: string;
	/** Required for `GET /api/metrics`: send `Authorization: Bearer <token>`. */
	METRICS_TOKEN?: string;
};
