import { DurableObject } from 'cloudflare:workers';
import {
	type CreateSecretRequest,
	createStoredSecretFromRequest,
	hashString,
	MAX_ATTACHMENT_BYTES,
	type MetricsCounter,
	type StoredSecret,
	storedSecretToResponseData,
} from '@secred/shared';
import type { Env } from './env';

export const SECRET_STORAGE_KEY = 'secret';
export const METRICS_STORAGE_KEY = 'counters';
export const BURN_ATTACHMENT_PENDING_SECONDS = 5 * 60;

export class SecretObject extends DurableObject<Env> {
	private async deleteStoredAttachment(secret: StoredSecret | undefined) {
		const key = secret?.attachment_r2_key;
		if (key) {
			await this.env.ATTACHMENTS.delete(key).catch(() => undefined);
		}
	}

	async create(input: CreateSecretRequest) {
		const existing =
			await this.ctx.storage.get<StoredSecret>(SECRET_STORAGE_KEY);
		if (existing) {
			return { status: 'exists' as const };
		}

		const secret = createStoredSecretFromRequest(input);

		await this.ctx.storage.put(SECRET_STORAGE_KEY, secret);
		await this.ctx.storage.setAlarm(new Date(secret.expires_at).getTime());
		return { status: 'created' as const };
	}

	async uploadAttachment(token: string, body: ArrayBuffer) {
		const secret = await this.ctx.storage.get<StoredSecret>(SECRET_STORAGE_KEY);
		if (!secret) {
			return { status: 'missing' as const };
		}
		if (!secret.attachment_upload_token_hash) {
			return { status: 'bad_request' as const };
		}
		if (hashString(token) !== secret.attachment_upload_token_hash) {
			return { status: 'unauthorized' as const };
		}
		if (body.byteLength === 0 || body.byteLength > MAX_ATTACHMENT_BYTES) {
			return { status: 'bad_request' as const };
		}
		const key = crypto.randomUUID();
		await this.env.ATTACHMENTS.put(key, body);
		const next: StoredSecret = {
			...secret,
			attachment_r2_key: key,
			attachment_upload_token_hash: null,
			attachment_burn_token_hash: null,
			attachment_burn_pending_until: null,
			updated_at: new Date().toISOString(),
		};
		await this.ctx.storage.put(SECRET_STORAGE_KEY, next);
		return { status: 'ok' as const };
	}

	async getAttachment(burnToken?: string) {
		const secret = await this.ctx.storage.get<StoredSecret>(SECRET_STORAGE_KEY);
		if (!secret?.attachment_r2_key) {
			return { status: 'missing' as const };
		}
		const needsBurnToken =
			secret.is_burnable &&
			typeof secret.attachment_burn_token_hash === 'string' &&
			secret.attachment_burn_token_hash.length > 0;
		if (needsBurnToken) {
			if (!burnToken) {
				return { status: 'unauthorized' as const };
			}
			if (hashString(burnToken) !== secret.attachment_burn_token_hash) {
				return { status: 'unauthorized' as const };
			}
		}
		const obj = await this.env.ATTACHMENTS.get(secret.attachment_r2_key);
		if (!obj?.body) {
			return { status: 'missing' as const };
		}
		if (needsBurnToken) {
			await this.deleteStoredAttachment(secret);
			await this.ctx.storage.deleteAll();
			return { status: 'ok_burned' as const, body: obj.body };
		}
		return { status: 'ok' as const, body: obj.body };
	}

	async importSecret(secret: StoredSecret) {
		const existing =
			await this.ctx.storage.get<StoredSecret>(SECRET_STORAGE_KEY);
		if (existing) {
			return { status: 'exists' as const };
		}
		await this.ctx.storage.put(SECRET_STORAGE_KEY, secret);
		await this.ctx.storage.setAlarm(new Date(secret.expires_at).getTime());
		return { status: 'imported' as const };
	}

	async get() {
		const secret = await this.ctx.storage.get<StoredSecret>(SECRET_STORAGE_KEY);
		if (!secret) {
			return { status: 'missing' as const };
		}

		if (new Date(secret.expires_at).getTime() <= Date.now()) {
			await this.deleteStoredAttachment(secret);
			await this.ctx.storage.deleteAll();
			return { status: 'expired' as const };
		}
		if (
			secret.is_burnable &&
			secret.attachment_burn_pending_until &&
			new Date(secret.attachment_burn_pending_until).getTime() <= Date.now()
		) {
			await this.deleteStoredAttachment(secret);
			await this.ctx.storage.deleteAll();
			return { status: 'expired' as const };
		}

		const data = storedSecretToResponseData(secret);
		if (secret.is_burnable && secret.attachment_r2_key) {
			const burnToken = crypto.randomUUID();
			const now = Date.now();
			const burnPendingUntil = new Date(
				now + BURN_ATTACHMENT_PENDING_SECONDS * 1000,
			).toISOString();
			const next: StoredSecret = {
				...secret,
				attachment_burn_token_hash: hashString(burnToken),
				attachment_burn_pending_until: burnPendingUntil,
				updated_at: new Date(now).toISOString(),
			};
			await this.ctx.storage.put(SECRET_STORAGE_KEY, next);
			const expiryTs = new Date(secret.expires_at).getTime();
			await this.ctx.storage.setAlarm(
				Math.min(expiryTs, new Date(burnPendingUntil).getTime()),
			);
			return {
				status: 'found' as const,
				data,
				isBurned: false,
				attachmentBurnToken: burnToken,
			};
		}
		if (secret.is_burnable) {
			await this.deleteStoredAttachment(secret);
			await this.ctx.storage.deleteAll();
			return { status: 'found' as const, data, isBurned: true };
		}

		return { status: 'found' as const, data, isBurned: false };
	}

	async delete(manageKey: string) {
		const secret = await this.ctx.storage.get<StoredSecret>(SECRET_STORAGE_KEY);
		if (!secret) {
			return { status: 'missing' as const };
		}
		if (secret.manage_key !== manageKey) {
			return { status: 'missing' as const };
		}
		await this.deleteStoredAttachment(secret);
		await this.ctx.storage.deleteAll();
		return { status: 'deleted' as const };
	}

	async alarm() {
		const secret = await this.ctx.storage.get<StoredSecret>(SECRET_STORAGE_KEY);
		if (
			!secret ||
			new Date(secret.expires_at).getTime() <= Date.now() ||
			(secret.attachment_burn_pending_until &&
				new Date(secret.attachment_burn_pending_until).getTime() <= Date.now())
		) {
			await this.deleteStoredAttachment(secret);
			await this.ctx.storage.deleteAll();
		}
	}
}

export class MetricsObject extends DurableObject<Env> {
	async increment(key: MetricsCounter) {
		const counters =
			(await this.ctx.storage.get<Record<string, number>>(
				METRICS_STORAGE_KEY,
			)) ?? {};
		counters[key] = (counters[key] ?? 0) + 1;
		await this.ctx.storage.put(METRICS_STORAGE_KEY, counters);
		return counters[key];
	}

	async all() {
		return (
			(await this.ctx.storage.get<Partial<Record<MetricsCounter, number>>>(
				METRICS_STORAGE_KEY,
			)) ?? {}
		);
	}
}
