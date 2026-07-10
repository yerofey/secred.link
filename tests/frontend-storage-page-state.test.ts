import { describe, expect, test } from 'bun:test';
import type { LocalSecret } from '@secred/shared';
import { loadStorageItems } from '../apps/frontend/src/lib/storage-page-state';

const localSecret = (sid: string, timestamp: number): LocalSecret => ({
	sid,
	keys: { accessKey: `${sid}-access-key` },
	isOwner: true,
	hasPassword: false,
	timestamp,
	v: 3,
});

describe('storage page presentation', () => {
	test('loads saved secrets synchronously and newest first', () => {
		const older = localSecret('older', 100);
		const newer = localSecret('newer', 200);
		let callCount = 0;
		let requestedPrefix = '';
		const storage = {
			getAllItems<T>(prefix: string) {
				callCount += 1;
				requestedPrefix = prefix;
				return { secret_older: older, secret_newer: newer } as Record<
					string,
					T
				>;
			},
		};

		const items = loadStorageItems(storage);

		expect(callCount).toBe(1);
		expect(requestedPrefix).toBe('secret_');
		expect(items).toEqual([newer, older]);
	});
});
