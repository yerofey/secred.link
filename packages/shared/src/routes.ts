import type {
	CreateSecretRequest,
	SecretResponseData,
	StoredSecret,
} from './types';

/** Public HTTP API mount path (Worker serves `/api/*`). */
export const API_PREFIX = '/api';

/** Whether this pathname is handled by the Worker API (`/api` or `/api/...`). */
export function matchesApiMount(pathname: string): boolean {
	return pathname === API_PREFIX || pathname.startsWith(`${API_PREFIX}/`);
}

export const HttpHeader = {
	UploadToken: 'X-Upload-Token',
	Authorization: 'Authorization',
} as const;

/** Fixed paths relative to `API_PREFIX` (leading slash, Worker strips `/api`). */
export const ApiInner = {
	health: '/health',
	secrets: '/secrets',
	metrics: '/metrics',
	migrationSecrets: '/migration/secrets',
} as const;

/**
 * Normalizes `URL.pathname` to the route shape used by the Worker
 * (pathname with `/api` removed).
 */
export function getApiInnerPath(pathname: string): string {
	const p = pathname.replace(/^\/api/, '') || '/';
	return p.startsWith('/') ? p : `/${p}`;
}

/** Full paths for browser `fetch` against the site origin. */
export const apiUrl = {
	health: () => `${API_PREFIX}${ApiInner.health}`,
	secrets: () => `${API_PREFIX}${ApiInner.secrets}`,
	secret: (accessKeyHash: string) => `${API_PREFIX}/secrets/${accessKeyHash}`,
	attachment: (accessKeyHash: string, burnToken?: string) => {
		const base = `${API_PREFIX}/secrets/${accessKeyHash}/attachment`;
		return burnToken != null && burnToken !== ''
			? `${base}?burnToken=${encodeURIComponent(burnToken)}`
			: base;
	},
	deleteSecret: (accessKeyHash: string, manageKeyHash: string) =>
		`${API_PREFIX}/secrets/${accessKeyHash}/${manageKeyHash}`,
	metrics: () => `${API_PREFIX}${ApiInner.metrics}`,
	migrationSecrets: () => `${API_PREFIX}${ApiInner.migrationSecrets}`,
} as const;

export function parseAttachmentRoute(
	innerPath: string,
): { accessKeyHash: string } | null {
	const m = innerPath.match(/^\/secrets\/([^/]+)\/attachment$/);
	return m ? { accessKeyHash: m[1] } : null;
}

export function parseSecretGetRoute(
	innerPath: string,
): { accessKeyHash: string } | null {
	const m = innerPath.match(/^\/secrets\/([^/]+)$/);
	return m ? { accessKeyHash: m[1] } : null;
}

export function parseSecretDeleteRoute(
	innerPath: string,
): { accessKeyHash: string; manageKeyHash: string } | null {
	const m = innerPath.match(/^\/secrets\/([^/]+)\/([^/]+)$/);
	return m ? { accessKeyHash: m[1], manageKeyHash: m[2] } : null;
}

export function createStoredSecretFromRequest(
	input: CreateSecretRequest,
	nowMs: number = Date.now(),
): StoredSecret {
	const now = new Date(nowMs);
	const expiresAt = new Date(now.getTime() + input.lifetime * 1000);
	return {
		access_key: input.accessKey,
		manage_key: input.manageKey,
		test_hash: input.testCiphertext,
		content: input.ciphertext,
		expires_at: expiresAt.toISOString(),
		created_at: now.toISOString(),
		updated_at: now.toISOString(),
		is_protected: input.isProtected,
		is_burnable: input.isBurnable,
		v: input.v,
		attachment_r2_key: null,
		attachment_upload_token_hash: input.attachmentUploadTokenHash ?? null,
		attachment_burn_token_hash: null,
		attachment_burn_pending_until: null,
	};
}

export function storedSecretToResponseData(
	secret: StoredSecret,
): SecretResponseData {
	return {
		content: secret.content,
		test: secret.test_hash,
		isProtected: secret.is_protected,
		isBurnable: secret.is_burnable,
		expirationDate: secret.expires_at,
		creationDate: secret.created_at,
		v: secret.v,
	};
}
