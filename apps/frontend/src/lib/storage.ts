import { ExpiringLocalStorage, type LocalSecret } from '@secred/shared';

export const secretStorage = () => new ExpiringLocalStorage(localStorage);

export const getSecretStorageKey = (sid: string) => `secret_${sid}`;

export const saveLocalSecret = (secret: LocalSecret, ttlSeconds: number) => {
	secretStorage().setItem(
		getSecretStorageKey(secret.sid),
		secret,
		ttlSeconds * 1000,
	);
};

export const readLocalSecret = (sid: string) =>
	secretStorage().getItem<LocalSecret>(getSecretStorageKey(sid));
