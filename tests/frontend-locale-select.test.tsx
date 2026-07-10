import { afterAll, describe, expect, test } from 'bun:test';
import type { Locale } from '@secred/shared';
import { renderToStaticMarkup } from 'react-dom/server';
import { LocaleSelect } from '../apps/frontend/src/components/LocaleSelect';
import { I18nProvider } from '../apps/frontend/src/lib/i18n';

const originalLocalStorage = Object.getOwnPropertyDescriptor(
	globalThis,
	'localStorage',
);

function renderLocaleSelect(locale: Locale): string {
	Object.defineProperty(globalThis, 'localStorage', {
		configurable: true,
		value: {
			getItem: () => locale,
			setItem: () => undefined,
		},
	});

	return renderToStaticMarkup(
		<I18nProvider>
			<LocaleSelect />
		</I18nProvider>,
	);
}

afterAll(() => {
	if (originalLocalStorage) {
		Object.defineProperty(globalThis, 'localStorage', originalLocalStorage);
	} else {
		Reflect.deleteProperty(globalThis, 'localStorage');
	}
});

describe('LocaleSelect', () => {
	test('shows the active English code and native-name options', () => {
		const markup = renderLocaleSelect('en');

		expect(markup).toContain('>EN</span>');
		expect(markup).toContain('aria-label="Language"');
		expect(markup).toMatch(
			/<option[^>]*value="en"[^>]*lang="en"[^>]*>English<\/option>/,
		);
		expect(markup).toMatch(
			/<option[^>]*value="ru"[^>]*lang="ru"[^>]*>Русский<\/option>/,
		);
	});

	test('shows the active Russian code and translated accessible name', () => {
		const markup = renderLocaleSelect('ru');

		expect(markup).toContain('>RU</span>');
		expect(markup).toContain('aria-label="Язык"');
	});

	test('extends the native select across the bordered shell', () => {
		const markup = renderLocaleSelect('en');

		expect(markup).toContain('-inset-px');
		expect(markup).toContain('size-[calc(100%+2px)]');
	});
});
