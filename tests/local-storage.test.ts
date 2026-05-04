import { describe, expect, test } from 'bun:test';
import { ExpiringLocalStorage } from '@secred/shared';

class MemoryStorage implements Storage {
	private readonly values = new Map<string, string>();
	get length() {
		return this.values.size;
	}
	clear() {
		this.values.clear();
	}
	getItem(key: string) {
		return this.values.get(key) ?? null;
	}
	key(index: number) {
		return [...this.values.keys()][index] ?? null;
	}
	removeItem(key: string) {
		this.values.delete(key);
	}
	setItem(key: string, value: string) {
		this.values.set(key, value);
	}
}

describe('ExpiringLocalStorage', () => {
	test('returns unexpired values and removes expired ones', async () => {
		const store = new ExpiringLocalStorage(new MemoryStorage());
		store.setItem('secret_a', { id: 1 }, 20);
		expect(store.getItem('secret_a')).toEqual({ id: 1 });
		await Bun.sleep(25);
		expect(store.getItem('secret_a')).toBeNull();
		expect(store.hasKey('secret_a')).toBe(false);
	});

	test('filters keys by prefix', () => {
		const store = new ExpiringLocalStorage(new MemoryStorage());
		store.setItem('secret_a', 1, 1000);
		store.setItem('other', 2, 1000);
		expect(store.getAllItems<number>('secret_')).toEqual({ secret_a: 1 });
	});
});
