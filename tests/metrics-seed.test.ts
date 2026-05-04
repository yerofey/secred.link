import { describe, expect, test } from 'bun:test';
import { metricsSeedSchema } from '@secred/shared';

describe('metricsSeedSchema', () => {
	test('accepts partial counters', () => {
		const p = metricsSeedSchema.safeParse({ created: 1, requested: 2 });
		expect(p.success).toBe(true);
		if (p.success) {
			expect(p.data.created).toBe(1);
			expect(p.data.requested).toBe(2);
		}
	});

	test('rejects empty object', () => {
		const p = metricsSeedSchema.safeParse({});
		expect(p.success).toBe(false);
	});

	test('rejects negative and unknown keys', () => {
		expect(metricsSeedSchema.safeParse({ created: -1 }).success).toBe(false);
		expect(metricsSeedSchema.safeParse({ created: 0, extra: 1 }).success).toBe(
			false,
		);
	});
});
