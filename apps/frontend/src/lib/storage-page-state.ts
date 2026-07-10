import type { LocalSecret } from '@secred/shared';

type StorageItemsReader = {
	getAllItems<T>(prefix: string): Record<string, T>;
};

export function loadStorageItems(storage: StorageItemsReader) {
	return Object.values(storage.getAllItems<LocalSecret>('secret_')).sort(
		(a, b) => b.timestamp - a.timestamp,
	);
}
