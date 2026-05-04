import { describe, expect, test } from 'bun:test';
import {
	buildCreateSecretPayload,
	CRYPTO_V4_FILE_PREFIX,
	CRYPTO_V4_JSON_PREFIX,
	decryptAttachmentBytes,
	decryptSecretPayload,
	encryptAttachmentBytes,
	encryptAttachmentBytesLegacy,
	encryptSecretPayloadLegacy,
	getAccessKeyHashes,
	getManageKeyHash,
	hashString,
	LEGACY_VERSION_PREFIX,
	makeAccessKey,
	parseDecryptedPayload,
} from '@secred/shared';

describe('crypto helpers', () => {
	test('hashes strings with SHA-256 hex output', () => {
		expect(hashString('abc')).toBe(
			'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
		);
	});

	test('double-hashes access and manage keys in the legacy format', () => {
		const { accessKeyHash2, sid } = getAccessKeyHashes('0abcdefghijklmnop');
		expect(accessKeyHash2).toHaveLength(64);
		expect(sid).toHaveLength(20);
		expect(getManageKeyHash('0abcdefghijklmnop')).toHaveLength(64);
	});

	test('v3 encrypts and decrypts with test-string guard', async () => {
		const payload = await buildCreateSecretPayload({
			text: 'secret text',
			password: 'pass',
			lifetime: 60,
			isBurnable: false,
		});
		const result = await decryptSecretPayload({
			contentHex: payload.request.ciphertext,
			testHex: payload.request.testCiphertext,
			password: 'pass',
			accessKey: payload.accessKey,
		});
		expect(result).toEqual({ ok: true, content: 'secret text' });
		const failed = await decryptSecretPayload({
			contentHex: payload.request.ciphertext,
			testHex: payload.request.testCiphertext,
			password: 'wrong',
			accessKey: payload.accessKey,
		});
		expect(failed.ok).toBe(false);
	});

	test('legacy CryptoJS ciphertext still decrypts', async () => {
		const accessKey = makeAccessKey(LEGACY_VERSION_PREFIX);
		const { encryptedContent, encryptedTest } = encryptSecretPayloadLegacy({
			content: 'legacy hello',
			password: 'pw',
			accessKey,
		});
		const ok = await decryptSecretPayload({
			contentHex: encryptedContent,
			testHex: encryptedTest,
			password: 'pw',
			accessKey,
		});
		expect(ok).toEqual({ ok: true, content: 'legacy hello' });
	});

	test('parseDecryptedPayload treats plain strings as legacy markdown', () => {
		expect(parseDecryptedPayload('# hi')).toEqual({
			kind: 'legacy',
			text: '# hi',
			attachment: undefined,
		});
	});

	test('encryptAttachmentBytes round-trips with decryptAttachmentBytes', async () => {
		const payload = await buildCreateSecretPayload({
			text: '',
			password: 'p',
			lifetime: 60,
			isBurnable: false,
		});
		const bytes = new Uint8Array([1, 2, 3, 255]);
		const enc = await encryptAttachmentBytes(bytes, 'p', payload.accessKey);
		const dec = await decryptAttachmentBytes(enc, 'p', payload.accessKey);
		expect(dec).toEqual(bytes);
	});

	test('legacy attachment ciphertext round-trips', async () => {
		const accessKey = makeAccessKey(LEGACY_VERSION_PREFIX);
		const bytes = new Uint8Array([9, 8, 7]);
		const enc = encryptAttachmentBytesLegacy(bytes, 'p', accessKey);
		const dec = await decryptAttachmentBytes(enc, 'p', accessKey);
		expect(dec).toEqual(bytes);
	});

	test('marks local secrets that include an attachment', async () => {
		const payload = await buildCreateSecretPayload({
			text: '',
			password: '',
			lifetime: 60,
			isBurnable: false,
			attachment: {
				bytes: new Uint8Array([1, 2, 3]),
				name: 'note.txt',
				mime: 'text/plain',
			},
		});

		expect(payload.localSecret.attachmentCount).toBe(1);
	});

	test('v4 envelope: create with attachment uses one KDF bundle (prefixes + round-trip)', async () => {
		const payload = await buildCreateSecretPayload({
			text: 'body text',
			password: 'secret-pw',
			lifetime: 3600,
			isBurnable: false,
			attachment: {
				bytes: new Uint8Array([10, 20, 30]),
				name: 'blob.bin',
				mime: 'application/octet-stream',
			},
		});

		expect(payload.request.ciphertext.startsWith(CRYPTO_V4_JSON_PREFIX)).toBe(
			true,
		);
		const attachmentCipher = payload.attachmentCipher;
		if (!attachmentCipher) {
			throw new Error('expected attachment cipher');
		}
		expect(
			new TextDecoder()
				.decode(attachmentCipher)
				.startsWith(CRYPTO_V4_FILE_PREFIX),
		).toBe(true);

		const secret = await decryptSecretPayload({
			contentHex: payload.request.ciphertext,
			testHex: payload.request.testCiphertext,
			password: 'secret-pw',
			accessKey: payload.accessKey,
		});
		expect(secret.ok).toBe(true);
		if (secret.ok) {
			const parsed = parseDecryptedPayload(secret.content);
			expect(parsed.kind).toBe('v2');
			if (parsed.kind === 'v2') {
				expect(parsed.text).toBe('body text');
				expect(parsed.attachment?.name).toBe('blob.bin');
			}
		}

		const plainFile = await decryptAttachmentBytes(
			attachmentCipher as Uint8Array,
			'secret-pw',
			payload.accessKey,
		);
		expect(plainFile).toEqual(new Uint8Array([10, 20, 30]));
	});
});
