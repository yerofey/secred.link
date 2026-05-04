import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import CryptoJS from 'crypto-js';
import { customAlphabet } from 'nanoid';
import {
	ACCESS_KEY_LENGTH,
	CRYPTO_V3_FILE_PREFIX,
	CRYPTO_V3_JSON_PREFIX,
	DEFAULT_TEST_STRING,
	DEFAULT_VERSION_PREFIX,
	HASH_LENGTH,
	PBKDF2_ITERATIONS,
} from './constants';
import type { CreateSecretRequest, LocalSecret } from './types';

const symbolsString =
	'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const nanoid = customAlphabet(symbolsString, 16);

export const hashString = (value: string) =>
	bytesToHex(sha256(new TextEncoder().encode(value)));

export const base64ToHex = (value: string) => {
	const bytes = Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
	return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const hexToBase64 = (value: string) => {
	const pairs = value.match(/.{1,2}/g) ?? [];
	const binary = pairs
		.map((pair) => String.fromCharCode(Number.parseInt(pair, 16)))
		.join('');
	return btoa(binary);
};

const bytesToBase64url = (bytes: Uint8Array): string => {
	let binary = '';
	const chunk = 0x8000;
	for (let i = 0; i < bytes.length; i += chunk) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
	}
	return btoa(binary)
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/u, '');
};

const base64urlToBytes = (s: string): Uint8Array => {
	const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
	const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
	const binary = atob(b64);
	const out = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		out[i] = binary.charCodeAt(i);
	}
	return out;
};

const randomBytes = (n: number): Uint8Array => {
	const b = new Uint8Array(n);
	crypto.getRandomValues(b);
	return b;
};

/** Web Crypto typings expect `ArrayBuffer`; avoid `Uint8Array<ArrayBufferLike>` from typed arrays. */
const copyBytes = (u: Uint8Array) => new Uint8Array(u);

export const makeAccessKey = (prefix = DEFAULT_VERSION_PREFIX) =>
	`${prefix}${nanoid()}`;

export const getSecretPrefix = (accessKey: string) => accessKey.slice(0, 1);

export const isLegacyAccessKey = (accessKey: string) =>
	accessKey.length === ACCESS_KEY_LENGTH;

export const getAccessKeyHashes = (accessKey: string) => {
	const accessKeyHash1 = hashString(accessKey);
	const accessKeyHash2 = hashString(accessKeyHash1);
	const sid = hashString(accessKeyHash2).slice(0, 20);
	return { accessKeyHash1, accessKeyHash2, sid };
};

export const getManageKeyHash = (manageKey: string) =>
	hashString(hashString(manageKey));

export const getContentEncryptionString = ({
	accessKey,
	password,
	prefix,
}: {
	accessKey: string;
	password: string;
	prefix?: string;
}) => {
	const accessKeyHash1 = hashString(accessKey);
	const passwordHash = hashString(password);
	const versionPrefix = prefix ?? getSecretPrefix(accessKey);
	return hashString(
		`${versionPrefix}${hashString(`${passwordHash}${accessKeyHash1}`)}`,
	);
};

type V3SecretEnvelope = {
	v: 3;
	s: string;
	i: number;
	t: { iv: string; d: string };
	b: { iv: string; d: string };
};

type V3FileEnvelope = {
	v: 3;
	s: string;
	i: number;
	b: { iv: string; d: string };
};

async function deriveAesGcmKey(
	password: string,
	accessKey: string,
	salt: Uint8Array,
	versionPrefix: string,
	iterations: number,
): Promise<CryptoKey> {
	const te = new TextEncoder();
	const vp = te.encode(versionPrefix);
	const pwDigest = sha256(te.encode(password));
	const akDigest = sha256(te.encode(accessKey));
	const ikm = new Uint8Array(vp.length + 32 + 32);
	ikm.set(vp, 0);
	ikm.set(pwDigest, vp.length);
	ikm.set(akDigest, vp.length + 32);

	const baseKey = await crypto.subtle.importKey(
		'raw',
		copyBytes(ikm),
		'PBKDF2',
		false,
		['deriveKey'],
	);

	return crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt: copyBytes(salt),
			iterations,
			hash: 'SHA-256',
		},
		baseKey,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt'],
	);
}

const encryptSecretPayloadV3 = async ({
	content,
	password,
	accessKey,
	testString,
}: {
	content: string;
	password: string;
	accessKey: string;
	testString: string;
}) => {
	const versionPrefix = getSecretPrefix(accessKey);
	const salt = randomBytes(16);
	const ivTest = randomBytes(12);
	const ivBody = randomBytes(12);
	const key = await deriveAesGcmKey(
		password,
		accessKey,
		salt,
		versionPrefix,
		PBKDF2_ITERATIONS,
	);
	const te = new TextEncoder();
	const ctTest = new Uint8Array(
		await crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv: copyBytes(ivTest) },
			key,
			te.encode(testString),
		),
	);
	const ctBody = new Uint8Array(
		await crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv: copyBytes(ivBody) },
			key,
			te.encode(content),
		),
	);
	const envelope: V3SecretEnvelope = {
		v: 3,
		s: bytesToBase64url(salt),
		i: PBKDF2_ITERATIONS,
		t: { iv: bytesToBase64url(ivTest), d: bytesToBase64url(ctTest) },
		b: { iv: bytesToBase64url(ivBody), d: bytesToBase64url(ctBody) },
	};
	const json = JSON.stringify(envelope);
	const combined =
		CRYPTO_V3_JSON_PREFIX + bytesToBase64url(new TextEncoder().encode(json));
	return { encryptedContent: combined, encryptedTest: combined };
};

const decryptSecretPayloadV3 = async ({
	contentHex,
	password,
	accessKey,
	testString,
}: {
	contentHex: string;
	password: string;
	accessKey: string;
	testString: string;
}) => {
	if (!contentHex.startsWith(CRYPTO_V3_JSON_PREFIX)) {
		return { ok: false as const, content: '' };
	}
	let envelope: V3SecretEnvelope;
	try {
		const raw = new TextDecoder().decode(
			base64urlToBytes(contentHex.slice(CRYPTO_V3_JSON_PREFIX.length)),
		);
		envelope = JSON.parse(raw) as V3SecretEnvelope;
	} catch {
		return { ok: false as const, content: '' };
	}
	if (
		envelope.v !== 3 ||
		typeof envelope.s !== 'string' ||
		typeof envelope.i !== 'number' ||
		envelope.i !== PBKDF2_ITERATIONS
	) {
		return { ok: false as const, content: '' };
	}
	const salt = base64urlToBytes(envelope.s);
	const versionPrefix = getSecretPrefix(accessKey);
	let key: CryptoKey;
	try {
		key = await deriveAesGcmKey(
			password,
			accessKey,
			copyBytes(salt),
			versionPrefix,
			envelope.i,
		);
	} catch {
		return { ok: false as const, content: '' };
	}
	try {
		const ivT = base64urlToBytes(envelope.t.iv);
		const ctT = base64urlToBytes(envelope.t.d);
		const ptTest = await crypto.subtle.decrypt(
			{ name: 'AES-GCM', iv: copyBytes(ivT) },
			key,
			copyBytes(ctT),
		);
		const decryptedTest = new TextDecoder().decode(ptTest);
		if (decryptedTest !== testString) {
			return { ok: false as const, content: '' };
		}
		const ivB = base64urlToBytes(envelope.b.iv);
		const ctB = base64urlToBytes(envelope.b.d);
		const ptBody = await crypto.subtle.decrypt(
			{ name: 'AES-GCM', iv: copyBytes(ivB) },
			key,
			copyBytes(ctB),
		);
		return { ok: true as const, content: new TextDecoder().decode(ptBody) };
	} catch {
		return { ok: false as const, content: '' };
	}
};

/** Legacy CryptoJS encrypt — use only for tests and backwards-compat tooling. */
export const encryptSecretPayloadLegacy = ({
	content,
	password,
	accessKey,
	testString = DEFAULT_TEST_STRING,
}: {
	content: string;
	password: string;
	accessKey: string;
	testString?: string;
}) => {
	const encryptionKey = getContentEncryptionString({ accessKey, password });
	const encryptedContent = base64ToHex(
		CryptoJS.AES.encrypt(content, encryptionKey).toString(),
	);
	const encryptedTest = base64ToHex(
		CryptoJS.AES.encrypt(testString, encryptionKey).toString(),
	);
	return { encryptedContent, encryptedTest };
};

const decryptSecretPayloadLegacy = ({
	contentHex,
	testHex,
	password,
	accessKey,
	testString = DEFAULT_TEST_STRING,
}: {
	contentHex: string;
	testHex: string;
	password: string;
	accessKey: string;
	testString?: string;
}) => {
	const encryptionKey = getContentEncryptionString({ accessKey, password });
	let decryptedTest = '';
	try {
		decryptedTest = CryptoJS.AES.decrypt(
			hexToBase64(testHex),
			encryptionKey,
		).toString(CryptoJS.enc.Utf8);
	} catch {
		return { ok: false as const, content: '' };
	}
	if (decryptedTest !== testString) {
		return { ok: false as const, content: '' };
	}
	const content = CryptoJS.AES.decrypt(
		hexToBase64(contentHex),
		encryptionKey,
	).toString(CryptoJS.enc.Utf8);
	return { ok: true as const, content };
};

export const encryptSecretPayload = async ({
	content,
	password,
	accessKey,
	testString = DEFAULT_TEST_STRING,
}: {
	content: string;
	password: string;
	accessKey: string;
	testString?: string;
}) => encryptSecretPayloadV3({ content, password, accessKey, testString });

export const decryptSecretPayload = async ({
	contentHex,
	testHex: _testHex,
	password,
	accessKey,
	testString = DEFAULT_TEST_STRING,
}: {
	contentHex: string;
	testHex: string;
	password: string;
	accessKey: string;
	testString?: string;
}) => {
	if (contentHex.startsWith(CRYPTO_V3_JSON_PREFIX)) {
		return decryptSecretPayloadV3({
			contentHex,
			password,
			accessKey,
			testString,
		});
	}
	return decryptSecretPayloadLegacy({
		contentHex,
		testHex: _testHex,
		password,
		accessKey,
		testString,
	});
};

export type SecretAttachmentMeta = {
	storage: 'r2';
	name: string;
	mime: string;
	size: number;
};

export type ParsedSecretPayload =
	| { kind: 'legacy'; text: string; attachment?: undefined }
	| {
			kind: 'v2';
			text: string;
			attachment?: SecretAttachmentMeta;
	  };

export const buildSecretPlaintext = (
	text: string,
	attachment?: SecretAttachmentMeta,
): string => {
	if (attachment) {
		return JSON.stringify({
			v: 2,
			text,
			attachment,
		});
	}
	return text;
};

export const parseDecryptedPayload = (
	decrypted: string,
): ParsedSecretPayload => {
	try {
		const parsed = JSON.parse(decrypted) as Record<string, unknown>;
		if (parsed?.v === 2 && typeof parsed.text === 'string') {
			const rawAtt = parsed.attachment;
			if (
				rawAtt &&
				typeof rawAtt === 'object' &&
				(rawAtt as Record<string, unknown>).storage === 'r2'
			) {
				const raw = rawAtt as Record<string, unknown>;
				return {
					kind: 'v2',
					text: parsed.text,
					attachment: {
						storage: 'r2',
						name: typeof raw.name === 'string' ? raw.name : 'file',
						mime:
							typeof raw.mime === 'string'
								? raw.mime
								: 'application/octet-stream',
						size: typeof raw.size === 'number' ? raw.size : 0,
					},
				};
			}
			return { kind: 'v2', text: parsed.text, attachment: undefined };
		}
	} catch {
		/* legacy plaintext / markdown */
	}
	return { kind: 'legacy', text: decrypted, attachment: undefined };
};

export const makeUploadToken = () => {
	const bytes = new Uint8Array(HASH_LENGTH / 2);
	crypto.getRandomValues(bytes);
	return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
};

export const bytesToBase64 = (bytes: Uint8Array): string => {
	let binary = '';
	const chunk = 0x8000;
	for (let i = 0; i < bytes.length; i += chunk) {
		const sub = bytes.subarray(i, i + chunk);
		binary += String.fromCharCode(...sub);
	}
	return btoa(binary);
};

export const base64ToUint8 = (b64: string): Uint8Array => {
	const binary = atob(b64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
};

const encryptAttachmentBytesV3 = async (
	bytes: Uint8Array,
	password: string,
	accessKey: string,
): Promise<Uint8Array> => {
	const versionPrefix = getSecretPrefix(accessKey);
	const salt = randomBytes(16);
	const iv = randomBytes(12);
	const key = await deriveAesGcmKey(
		password,
		accessKey,
		salt,
		versionPrefix,
		PBKDF2_ITERATIONS,
	);
	const ct = new Uint8Array(
		await crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv: copyBytes(iv) },
			key,
			copyBytes(bytes),
		),
	);
	const envelope: V3FileEnvelope = {
		v: 3,
		s: bytesToBase64url(salt),
		i: PBKDF2_ITERATIONS,
		b: { iv: bytesToBase64url(iv), d: bytesToBase64url(ct) },
	};
	const json = JSON.stringify(envelope);
	const out =
		CRYPTO_V3_FILE_PREFIX + bytesToBase64url(new TextEncoder().encode(json));
	return new TextEncoder().encode(out);
};

const decryptAttachmentBytesV3 = async (
	cipherUtf8: Uint8Array,
	password: string,
	accessKey: string,
): Promise<Uint8Array> => {
	const encStr = new TextDecoder().decode(cipherUtf8);
	if (!encStr.startsWith(CRYPTO_V3_FILE_PREFIX)) {
		throw new Error('attachment_decrypt_failed');
	}
	let envelope: V3FileEnvelope;
	try {
		const raw = new TextDecoder().decode(
			base64urlToBytes(encStr.slice(CRYPTO_V3_FILE_PREFIX.length)),
		);
		envelope = JSON.parse(raw) as V3FileEnvelope;
	} catch {
		throw new Error('attachment_decrypt_failed');
	}
	if (
		envelope.v !== 3 ||
		envelope.i !== PBKDF2_ITERATIONS ||
		typeof envelope.s !== 'string'
	) {
		throw new Error('attachment_decrypt_failed');
	}
	const salt = base64urlToBytes(envelope.s);
	const versionPrefix = getSecretPrefix(accessKey);
	const key = await deriveAesGcmKey(
		password,
		accessKey,
		salt,
		versionPrefix,
		envelope.i,
	);
	const iv = base64urlToBytes(envelope.b.iv);
	const ct = base64urlToBytes(envelope.b.d);
	const plain = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv: copyBytes(iv) },
		key,
		copyBytes(ct),
	);
	return new Uint8Array(plain);
};

/** Legacy attachment encrypt — for tests only. */
export const encryptAttachmentBytesLegacy = (
	bytes: Uint8Array,
	password: string,
	accessKey: string,
): Uint8Array => {
	const encryptionKey = getContentEncryptionString({ accessKey, password });
	const b64 = bytesToBase64(bytes);
	const encStr = CryptoJS.AES.encrypt(b64, encryptionKey).toString();
	return new TextEncoder().encode(encStr);
};

const decryptAttachmentBytesLegacy = (
	cipherUtf8: Uint8Array,
	password: string,
	accessKey: string,
): Uint8Array => {
	const encryptionKey = getContentEncryptionString({ accessKey, password });
	const encStr = new TextDecoder().decode(cipherUtf8);
	const decrypted = CryptoJS.AES.decrypt(encStr, encryptionKey).toString(
		CryptoJS.enc.Utf8,
	);
	if (!decrypted) {
		throw new Error('attachment_decrypt_failed');
	}
	return base64ToUint8(decrypted);
};

export const encryptAttachmentBytes = async (
	bytes: Uint8Array,
	password: string,
	accessKey: string,
): Promise<Uint8Array> => encryptAttachmentBytesV3(bytes, password, accessKey);

export const decryptAttachmentBytes = async (
	cipherUtf8: Uint8Array,
	password: string,
	accessKey: string,
): Promise<Uint8Array> => {
	const head = new TextDecoder().decode(cipherUtf8.slice(0, 64));
	if (head.startsWith(CRYPTO_V3_FILE_PREFIX)) {
		return decryptAttachmentBytesV3(cipherUtf8, password, accessKey);
	}
	return decryptAttachmentBytesLegacy(cipherUtf8, password, accessKey);
};

export const buildCreateSecretPayload = async ({
	text,
	password,
	lifetime,
	isBurnable,
	versionPrefix = DEFAULT_VERSION_PREFIX,
	testString = DEFAULT_TEST_STRING,
	attachment,
}: {
	text: string;
	password: string;
	lifetime: number;
	isBurnable: boolean;
	versionPrefix?: string;
	testString?: string;
	attachment?: { bytes: Uint8Array; name: string; mime: string };
}) => {
	const accessKey = makeAccessKey(versionPrefix);
	const manageKey = makeAccessKey(versionPrefix);
	const { accessKeyHash2, sid } = getAccessKeyHashes(accessKey);
	const manageKeyHash2 = getManageKeyHash(manageKey);

	let plainBody: string;
	let attachmentUploadToken: string | undefined;
	let attachmentCipher: Uint8Array | undefined;
	let attachmentUploadTokenHash: string | undefined;

	if (attachment) {
		const uploadToken = makeUploadToken();
		attachmentCipher = await encryptAttachmentBytes(
			attachment.bytes,
			password,
			accessKey,
		);
		plainBody = buildSecretPlaintext(text, {
			storage: 'r2',
			name: attachment.name,
			mime: attachment.mime,
			size: attachmentCipher.byteLength,
		});
		attachmentUploadToken = uploadToken;
		attachmentUploadTokenHash = hashString(uploadToken);
	} else {
		plainBody = buildSecretPlaintext(text, undefined);
	}

	const { encryptedContent, encryptedTest } = await encryptSecretPayload({
		content: plainBody,
		password,
		accessKey,
		testString,
	});
	const hasPassword = password.length > 0;
	const contentHexHash = hashString(encryptedContent);
	const dataHash = hashString(
		`${accessKeyHash2}${manageKeyHash2}${contentHexHash}${hasPassword}${lifetime}${isBurnable}`,
	);
	const request: CreateSecretRequest = {
		accessKey: accessKeyHash2,
		manageKey: manageKeyHash2,
		ciphertext: encryptedContent,
		testCiphertext: encryptedTest,
		isProtected: hasPassword,
		isBurnable,
		lifetime,
		v: Number.parseInt(versionPrefix, 10),
		...(attachmentUploadTokenHash ? { attachmentUploadTokenHash } : {}),
	};
	const localSecret: LocalSecret = {
		sid,
		hash: dataHash,
		keys: { accessKey, manageKey },
		isOwner: true,
		hasPassword,
		isBurnable,
		...(attachment ? { attachmentCount: 1 } : {}),
		timestamp: Date.now(),
		v: versionPrefix,
	};
	return {
		request,
		accessKey,
		manageKey,
		sid,
		localSecret,
		attachmentUploadToken,
		attachmentCipher,
	};
};
