export type Locale = 'en' | 'ru';

export type CreateSecretRequest = {
	accessKey: string;
	manageKey: string;
	ciphertext: string;
	testCiphertext: string;
	isProtected: boolean;
	isBurnable: boolean;
	lifetime: number;
	v: number;
	attachmentUploadTokenHash?: string;
};

export type CreateSecretResponse = {
	data: {
		success: true;
	};
};

export type SecretResponseData = {
	content: string;
	test: string;
	isProtected: boolean;
	isBurnable: boolean;
	expirationDate: string;
	creationDate: string;
	v: number;
};

export type GetSecretResponse = {
	data: SecretResponseData;
	isBurned?: boolean;
	attachmentBurnToken?: string;
};

export type DeleteSecretResponse = {
	data: {
		success: true;
	};
};

export type HealthResponse = {
	status: 'ok';
	timestamp: string;
	version: number;
	environment: string;
};

export type MetricsCounter =
	| 'created'
	| 'requested'
	| 'burned'
	| 'deleted'
	| 'expired'
	| 'migration_imported';

export type MetricsResponse = {
	data: {
		counters: Partial<Record<MetricsCounter, number>>;
	};
	meta: {
		elapsed: number;
		timestamp: number;
	};
};

/** Response from `POST /api/metrics` (seed historical counters). */
export type SeedMetricsResponse = {
	data: {
		counters: Partial<Record<MetricsCounter, number>>;
	};
};

export type StoredSecret = {
	access_key: string;
	manage_key: string;
	test_hash: string;
	content: string;
	expires_at: string;
	created_at: string;
	updated_at: string;
	is_protected: boolean;
	is_burnable: boolean;
	v: number;
	attachment_r2_key?: string | null;
	attachment_upload_token_hash?: string | null;
	attachment_burn_token_hash?: string | null;
	attachment_burn_pending_until?: string | null;
};

export type LocalSecret = {
	sid: string;
	hash?: string;
	keys: {
		accessKey: string;
		manageKey?: string;
	};
	isOwner: boolean;
	hasPassword: boolean;
	isBurnable?: boolean;
	attachmentCount?: number;
	timestamp: number;
	v: string | number;
};
