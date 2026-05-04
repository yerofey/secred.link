import { describe, expect, test } from 'bun:test';
import {
	apiUrl,
	createStoredSecretFromRequest,
	getApiInnerPath,
	matchesApiMount,
	parseAttachmentRoute,
	parseSecretDeleteRoute,
	parseSecretGetRoute,
	storedSecretToResponseData,
} from '@secred/shared';

describe('api routes', () => {
	test('getApiInnerPath strips /api prefix', () => {
		expect(getApiInnerPath('/api/health')).toBe('/health');
		expect(getApiInnerPath('/api/secrets/abc')).toBe('/secrets/abc');
		expect(getApiInnerPath('/api')).toBe('/');
	});

	test('matchesApiMount', () => {
		expect(matchesApiMount('/api/health')).toBe(true);
		expect(matchesApiMount('/api')).toBe(true);
		expect(matchesApiMount('/v1/api/x')).toBe(false);
	});

	test('apiUrl builds stable paths', () => {
		expect(apiUrl.health()).toBe('/api/health');
		expect(apiUrl.secret('a'.repeat(64))).toBe(
			`/api/secrets/${'a'.repeat(64)}`,
		);
		expect(apiUrl.attachment('h', 'burn')).toBe(
			'/api/secrets/h/attachment?burnToken=burn',
		);
	});

	test('parse routes', () => {
		expect(parseAttachmentRoute('/secrets/x/attachment')).toEqual({
			accessKeyHash: 'x',
		});
		expect(parseSecretGetRoute('/secrets/only')).toEqual({
			accessKeyHash: 'only',
		});
		expect(parseSecretDeleteRoute('/secrets/ak/mk')).toEqual({
			accessKeyHash: 'ak',
			manageKeyHash: 'mk',
		});
		expect(parseSecretGetRoute('/secrets/x/attachment')).toBeNull();
	});

	test('createStoredSecretFromRequest / storedSecretToResponseData round-trip shape', () => {
		const req = {
			accessKey: 'a'.repeat(64),
			manageKey: 'b'.repeat(64),
			ciphertext: 'cipher',
			testCiphertext: 'test',
			isProtected: true,
			isBurnable: false,
			lifetime: 3600,
			v: 1,
		};
		const stored = createStoredSecretFromRequest(req, 1_700_000_000_000);
		expect(stored.access_key).toBe(req.accessKey);
		expect(stored.content).toBe('cipher');
		const view = storedSecretToResponseData(stored);
		expect(view.content).toBe('cipher');
		expect(view.test).toBe('test');
		expect(view.isProtected).toBe(true);
	});
});
