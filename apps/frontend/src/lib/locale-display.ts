import type { Locale } from '@secred/shared';

type LocaleLabelKey = 'common.locale_en' | 'common.locale_ru';

export type LocaleDisplay = {
	code: string;
	labelKey: LocaleLabelKey;
	lang: Locale;
};

export const localeDisplay = {
	en: {
		code: 'EN',
		labelKey: 'common.locale_en',
		lang: 'en',
	},
	ru: {
		code: 'RU',
		labelKey: 'common.locale_ru',
		lang: 'ru',
	},
} as const satisfies Record<Locale, LocaleDisplay>;

export const supportedLocales = Object.keys(localeDisplay) as Locale[];
