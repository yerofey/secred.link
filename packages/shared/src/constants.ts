/** New secrets use this access-key prefix and v3 (PBKDF2 + AES-GCM) ciphertext. */
export const DEFAULT_VERSION_PREFIX = '1';
/** Prefix for legacy secrets created before v3 crypto (`0` + nanoid). */
export const LEGACY_VERSION_PREFIX = '0';

export const CRYPTO_V3_JSON_PREFIX = 'v3.j.';
export const CRYPTO_V3_FILE_PREFIX = 'v3.f.';
/** Attachments + JSON bundle: one PBKDF2, HKDF subkeys — see `encryptSecretWithAttachmentV4` in crypto. */
export const CRYPTO_V4_JSON_PREFIX = 'v4.j.';
export const CRYPTO_V4_FILE_PREFIX = 'v4.f.';
/**
 * PBKDF2-HMAC-SHA256 iterations for content key derivation (OWASP-aligned).
 * Changing this for new secrets requires a new envelope `i` / version and decrypt support; not done lightly.
 */
export const PBKDF2_ITERATIONS = 310_000;
export const DEFAULT_STORAGE_VERSION = '1.0';
export const DEFAULT_TEST_STRING = 'w4KPFgvgr4';
export const DEFAULT_SECRET_LIFETIME_SECONDS = 30 * 24 * 60 * 60;
export const MAX_SECRET_LENGTH = 8192;
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
export const MAX_PASSWORD_LENGTH = 64;
export const ACCESS_KEY_LENGTH = 17;
export const HASH_LENGTH = 64;

export const EXPIRATION_OPTIONS = [
	{ group: 'minutes', value: 5 * 60, count: 5, unit: 'minute' },
	{ group: 'minutes', value: 10 * 60, count: 10, unit: 'minute' },
	{ group: 'minutes', value: 30 * 60, count: 30, unit: 'minute' },
	{ group: 'hours', value: 60 * 60, count: 1, unit: 'hour' },
	{ group: 'hours', value: 3 * 60 * 60, count: 3, unit: 'hour' },
	{ group: 'hours', value: 6 * 60 * 60, count: 6, unit: 'hour' },
	{ group: 'hours', value: 12 * 60 * 60, count: 12, unit: 'hour' },
	{ group: 'hours', value: 24 * 60 * 60, count: 24, unit: 'hour' },
	{ group: 'days', value: 3 * 24 * 60 * 60, count: 3, unit: 'day' },
	{ group: 'weeks', value: 7 * 24 * 60 * 60, count: 1, unit: 'week' },
	{ group: 'weeks', value: 14 * 24 * 60 * 60, count: 2, unit: 'week' },
	{
		group: 'months',
		value: DEFAULT_SECRET_LIFETIME_SECONDS,
		count: 1,
		unit: 'month',
	},
] as const;
