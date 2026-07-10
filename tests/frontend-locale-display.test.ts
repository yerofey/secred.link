import { describe, expect, test } from 'bun:test';
import {
	localeDisplay,
	supportedLocales,
} from '../apps/frontend/src/lib/locale-display';
import en from '../apps/frontend/src/locales/en.json';
import ru from '../apps/frontend/src/locales/ru.json';

describe('locale display metadata', () => {
	test('defines the compact code, label key, and language tag for every locale', () => {
		expect(supportedLocales).toEqual(['en', 'ru']);
		expect(localeDisplay.en).toEqual({
			code: 'EN',
			labelKey: 'common.locale_en',
			lang: 'en',
		});
		expect(localeDisplay.ru).toEqual({
			code: 'RU',
			labelKey: 'common.locale_ru',
			lang: 'ru',
		});
	});

	test('uses language autonyms in both dictionaries', () => {
		expect(en.common.locale_en).toBe('English');
		expect(en.common.locale_ru).toBe('Русский');
		expect(ru.common.locale_en).toBe('English');
		expect(ru.common.locale_ru).toBe('Русский');
	});
});
