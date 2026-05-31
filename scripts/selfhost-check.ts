import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseWranglerJsonc } from './parse-wrangler-jsonc';
import {
	API_RATE_LIMIT_PERIOD_SEC,
	EXPECTED_TEST_STRING,
	UPSTREAM_R2_BUCKET_NAMES,
	UPSTREAM_RATE_LIMIT_NAMESPACE_IDS,
	UPSTREAM_WORKER_NAME,
} from './selfhost-upstream';

export type SelfhostIssueLevel = 'error' | 'warn';

export type SelfhostIssue = {
	level: SelfhostIssueLevel;
	message: string;
};

type WranglerR2Bucket = {
	bucket_name?: string;
	preview_bucket_name?: string;
};

type WranglerRateLimit = {
	namespace_id?: string;
	simple?: { period?: number };
};

type WranglerConfig = {
	name?: string;
	r2_buckets?: WranglerR2Bucket[];
	ratelimits?: WranglerRateLimit[];
	vars?: { TEST_STRING?: string };
	env?: Record<
		string,
		{
			r2_buckets?: WranglerR2Bucket[];
			ratelimits?: WranglerRateLimit[];
			vars?: { TEST_STRING?: string };
		}
	>;
};

function collectR2BucketNames(config: WranglerConfig): string[] {
	const names: string[] = [];
	for (const bucket of config.r2_buckets ?? []) {
		if (bucket.bucket_name) {
			names.push(bucket.bucket_name);
		}
		if (bucket.preview_bucket_name) {
			names.push(bucket.preview_bucket_name);
		}
	}
	for (const envBlock of Object.values(config.env ?? {})) {
		for (const bucket of envBlock.r2_buckets ?? []) {
			if (bucket.bucket_name) {
				names.push(bucket.bucket_name);
			}
			if (bucket.preview_bucket_name) {
				names.push(bucket.preview_bucket_name);
			}
		}
	}
	return names;
}

function collectRateLimitNamespaces(config: WranglerConfig): string[] {
	const ids: string[] = [];
	for (const limit of config.ratelimits ?? []) {
		if (limit.namespace_id) {
			ids.push(limit.namespace_id);
		}
	}
	for (const envBlock of Object.values(config.env ?? {})) {
		for (const limit of envBlock.ratelimits ?? []) {
			if (limit.namespace_id) {
				ids.push(limit.namespace_id);
			}
		}
	}
	return ids;
}

function collectRateLimitPeriods(config: WranglerConfig): number[] {
	const periods: number[] = [];
	for (const limit of config.ratelimits ?? []) {
		if (limit.simple?.period != null) {
			periods.push(limit.simple.period);
		}
	}
	for (const envBlock of Object.values(config.env ?? {})) {
		for (const limit of envBlock.ratelimits ?? []) {
			if (limit.simple?.period != null) {
				periods.push(limit.simple.period);
			}
		}
	}
	return periods;
}

function collectTestStrings(config: WranglerConfig): string[] {
	const values: string[] = [];
	if (config.vars?.TEST_STRING) {
		values.push(config.vars.TEST_STRING);
	}
	for (const envBlock of Object.values(config.env ?? {})) {
		if (envBlock.vars?.TEST_STRING) {
			values.push(envBlock.vars.TEST_STRING);
		}
	}
	return values;
}

export function checkWranglerConfig(
	config: WranglerConfig,
	options: { allowProdNames?: boolean } = {},
): SelfhostIssue[] {
	const issues: SelfhostIssue[] = [];
	const allowProd = options.allowProdNames === true;

	if (!config.name?.trim()) {
		issues.push({
			level: 'error',
			message: 'wrangler.jsonc: "name" must be non-empty',
		});
	} else if (config.name === UPSTREAM_WORKER_NAME && !allowProd) {
		issues.push({
			level: 'error',
			message: `wrangler.jsonc: "name" is still "${UPSTREAM_WORKER_NAME}" — pick a unique worker name for your account`,
		});
	}

	for (const bucketName of collectR2BucketNames(config)) {
		if (
			(UPSTREAM_R2_BUCKET_NAMES as readonly string[]).includes(bucketName) &&
			!allowProd
		) {
			issues.push({
				level: 'error',
				message: `wrangler.jsonc: R2 bucket "${bucketName}" matches upstream production — create your own buckets`,
			});
		}
	}

	for (const namespaceId of collectRateLimitNamespaces(config)) {
		if (
			(UPSTREAM_RATE_LIMIT_NAMESPACE_IDS as readonly string[]).includes(
				namespaceId,
			) &&
			!allowProd
		) {
			issues.push({
				level: 'error',
				message: `wrangler.jsonc: ratelimits namespace_id "${namespaceId}" matches upstream — use a new id per Cloudflare account`,
			});
		}
	}

	for (const period of collectRateLimitPeriods(config)) {
		if (period !== API_RATE_LIMIT_PERIOD_SEC) {
			issues.push({
				level: 'error',
				message: `wrangler.jsonc: ratelimits period ${period}s does not match API_RATE_LIMIT_PERIOD_SEC (${API_RATE_LIMIT_PERIOD_SEC}) in apps/backend/src/rate-limit.ts`,
			});
		}
	}

	for (const testString of collectTestStrings(config)) {
		if (testString !== EXPECTED_TEST_STRING) {
			issues.push({
				level: 'error',
				message: `wrangler.jsonc: vars.TEST_STRING must match DEFAULT_TEST_STRING in packages/shared (${EXPECTED_TEST_STRING})`,
			});
		}
	}

	return issues;
}

export function checkWranglerFile(
	wranglerPath: string,
	options: { allowProdNames?: boolean } = {},
): SelfhostIssue[] {
	const raw = readFileSync(wranglerPath, 'utf8');
	const config = parseWranglerJsonc(raw) as WranglerConfig;
	return checkWranglerConfig(config, options);
}

export function runSelfhostPreflight(repoRoot = process.cwd()): number {
	const wranglerPath = resolve(repoRoot, 'wrangler.jsonc');
	const allowProd = process.env.ALLOW_PROD_NAMES === '1';
	const issues = checkWranglerFile(wranglerPath, { allowProdNames: allowProd });
	const errors = issues.filter((i) => i.level === 'error');
	const warns = issues.filter((i) => i.level === 'warn');

	for (const issue of warns) {
		console.warn(`[selfhost:check] ${issue.message}`);
	}
	for (const issue of errors) {
		console.error(`[selfhost:check] ${issue.message}`);
	}

	if (errors.length > 0) {
		console.error(
			`[selfhost:check] failed with ${errors.length} error(s). See SELF_HOSTING.md.`,
		);
		return 1;
	}

	console.log(
		'[selfhost:check] OK (static checks only — create R2/DO in Cloudflare before deploy)',
	);
	return 0;
}
