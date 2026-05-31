import { describe, expect, test } from 'bun:test';
import { DEFAULT_TEST_STRING } from '@secred/shared';
import { stripJsoncComments } from '../scripts/parse-wrangler-jsonc';
import { checkWranglerConfig } from '../scripts/selfhost-check';
import {
	API_RATE_LIMIT_PERIOD_SEC,
	EXPECTED_TEST_STRING,
} from '../scripts/selfhost-upstream';

describe('selfhost constants', () => {
	test('stay aligned with app sources', () => {
		expect(EXPECTED_TEST_STRING).toBe(DEFAULT_TEST_STRING);
		expect(API_RATE_LIMIT_PERIOD_SEC).toBe(60);
	});
});

describe('stripJsoncComments', () => {
	test('removes line comments outside strings', () => {
		const input = `{
  "name": "test", // worker
  "x": "a//b"
}`;
		expect(stripJsoncComments(input)).toBe(`{
  "name": "test", 
  "x": "a//b"
}`);
	});
});

describe('checkWranglerConfig', () => {
	test('flags upstream worker and bucket names in strict mode', () => {
		const issues = checkWranglerConfig({
			name: 'secred-link',
			r2_buckets: [{ bucket_name: 'secred-attachments' }],
			ratelimits: [{ namespace_id: '1001', simple: { period: 60 } }],
			vars: { TEST_STRING: 'w4KPFgvgr4' },
		});
		expect(issues.some((i) => i.message.includes('name'))).toBe(true);
		expect(issues.some((i) => i.message.includes('R2 bucket'))).toBe(true);
		expect(issues.some((i) => i.message.includes('namespace_id'))).toBe(true);
	});

	test('allows upstream literals when allowProdNames is set', () => {
		const issues = checkWranglerConfig(
			{
				name: 'secred-link',
				r2_buckets: [{ bucket_name: 'my-attachments' }],
				ratelimits: [{ namespace_id: '9001', simple: { period: 60 } }],
				vars: { TEST_STRING: 'w4KPFgvgr4' },
			},
			{ allowProdNames: true },
		);
		expect(issues).toHaveLength(0);
	});

	test('flags TEST_STRING mismatch', () => {
		const issues = checkWranglerConfig({
			name: 'my-worker',
			ratelimits: [{ namespace_id: '9001', simple: { period: 60 } }],
			vars: { TEST_STRING: 'wrong' },
		});
		expect(issues.some((i) => i.message.includes('TEST_STRING'))).toBe(true);
	});

	test('flags rate limit period mismatch', () => {
		const issues = checkWranglerConfig({
			name: 'my-worker',
			ratelimits: [{ namespace_id: '9001', simple: { period: 10 } }],
			vars: { TEST_STRING: 'w4KPFgvgr4' },
		});
		expect(
			issues.some((i) => i.message.includes('API_RATE_LIMIT_PERIOD_SEC')),
		).toBe(true);
	});
});
