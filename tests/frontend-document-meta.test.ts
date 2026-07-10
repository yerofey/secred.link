import { describe, expect, test } from 'bun:test';
import {
	getRouteTitleKey,
	syncDocumentMeta,
} from '../apps/frontend/src/lib/document-meta';

describe('document metadata', () => {
	test('maps known and unknown routes to translated title keys', () => {
		expect(getRouteTitleKey('/')).toBe('meta.home_title');
		expect(getRouteTitleKey('/manage')).toBe('meta.manage_title');
		expect(getRouteTitleKey('/storage')).toBe('meta.storage_title');
		expect(getRouteTitleKey('/view')).toBe('meta.view_title');
		expect(getRouteTitleKey('/missing')).toBe('meta.not_found_title');
	});

	test('normalizes accepted trailing slashes without changing root', () => {
		expect(getRouteTitleKey('/')).toBe('meta.home_title');
		expect(getRouteTitleKey('///')).toBe('meta.home_title');
		expect(getRouteTitleKey('/manage/')).toBe('meta.manage_title');
		expect(getRouteTitleKey('/storage/')).toBe('meta.storage_title');
		expect(getRouteTitleKey('/view/')).toBe('meta.view_title');
	});

	test('synchronizes the translated title and html language', () => {
		const target = { title: '', documentElement: { lang: 'en' } };
		syncDocumentMeta(target, '/storage', 'ru', (key) => `translated:${key}`);
		expect(target.title).toBe('translated:meta.storage_title');
		expect(target.documentElement.lang).toBe('ru');
	});
});
