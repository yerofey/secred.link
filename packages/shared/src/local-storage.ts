export type ExpiringValue<T> = {
	value: T;
	expire: number;
};

export type KeyValueStorage = {
	readonly length: number;
	getItem: (key: string) => string | null;
	key: (index: number) => string | null;
	removeItem: (key: string) => void;
	setItem: (key: string, value: string) => void;
};

export class ExpiringLocalStorage {
	constructor(private readonly storage: KeyValueStorage) {}

	getItem<T>(key: string): T | null {
		const itemStr = this.storage.getItem(key);
		if (!itemStr) {
			return null;
		}

		try {
			const item = JSON.parse(itemStr) as ExpiringValue<T>;
			if (Date.now() > item.expire) {
				this.removeItem(key);
				return null;
			}
			return item.value;
		} catch {
			this.removeItem(key);
			return null;
		}
	}

	setItem<T>(key: string, value: T, ttlMs: number) {
		const item: ExpiringValue<T> = {
			value,
			expire: Date.now() + ttlMs,
		};
		this.storage.setItem(key, JSON.stringify(item));
	}

	removeItem(key: string) {
		this.storage.removeItem(key);
	}

	hasKey(key: string) {
		return this.getItem(key) !== null;
	}

	getAllKeys(prefix = '') {
		const keys: string[] = [];
		for (let index = 0; index < this.storage.length; index += 1) {
			const key = this.storage.key(index);
			if (
				key &&
				(prefix === '' || key.includes(prefix)) &&
				this.getItem(key) !== null
			) {
				keys.push(key);
			}
		}
		return keys;
	}

	getAllItems<T>(prefix = '') {
		const items: Record<string, T> = {};
		for (const key of this.getAllKeys(prefix)) {
			const item = this.getItem<T>(key);
			if (item !== null) {
				items[key] = item;
			}
		}
		return items;
	}

	removeAllItems(prefix = '') {
		for (const key of this.getAllKeys(prefix)) {
			this.removeItem(key);
		}
	}
}
