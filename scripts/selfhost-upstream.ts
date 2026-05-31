/** Keep in sync with `apps/backend/src/rate-limit.ts`. */
export const API_RATE_LIMIT_PERIOD_SEC = 60;

/** Keep in sync with `packages/shared/src/constants.ts` (`DEFAULT_TEST_STRING`). */
export const EXPECTED_TEST_STRING = 'w4KPFgvgr4';

/** Upstream secred.link values — self-hosters should replace these in `wrangler.jsonc`. */
export const UPSTREAM_WORKER_NAME = 'secred-link';
export const UPSTREAM_R2_BUCKET_NAMES = [
	'secred-attachments',
	'secred-attachments-preview',
] as const;
export const UPSTREAM_RATE_LIMIT_NAMESPACE_IDS = ['1001', '1002'] as const;
