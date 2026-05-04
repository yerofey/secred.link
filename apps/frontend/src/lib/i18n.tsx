import type { Locale } from '@secred/shared';
import {
	createContext,
	type ReactNode,
	useContext,
	useMemo,
	useState,
} from 'react';
import en from '../locales/en.json';
import ru from '../locales/ru.json';

const dictionaries = { en, ru } as const;
const locales: Locale[] = ['en', 'ru'];

type I18nContextValue = {
	locale: Locale;
	setLocale: (locale: Locale) => void;
	t: (path: string) => string;
	timeUnit: (unit: string, count: number) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const detectLocale = (): Locale => {
	const saved = localStorage.getItem('locale');
	if (saved === 'en' || saved === 'ru') {
		return saved;
	}
	const browser = navigator.language.slice(0, 2);
	return locales.includes(browser as Locale) ? (browser as Locale) : 'en';
};

const readPath = (source: unknown, path: string) =>
	path.split('.').reduce<unknown>((value, key) => {
		if (value && typeof value === 'object' && key in value) {
			return (value as Record<string, unknown>)[key];
		}
		return undefined;
	}, source);

export function I18nProvider({ children }: { children: ReactNode }) {
	const [locale, setLocaleState] = useState<Locale>(() => detectLocale());

	const value = useMemo<I18nContextValue>(() => {
		const dictionary = dictionaries[locale];
		const t = (path: string) => {
			const value =
				readPath(dictionary, path) ?? readPath(dictionaries.en, path);
			return typeof value === 'string' ? value : path;
		};
		const setLocale = (nextLocale: Locale) => {
			localStorage.setItem('locale', nextLocale);
			setLocaleState(nextLocale);
		};
		const timeUnit = (unit: string, count: number) => {
			if (locale === 'ru') {
				const suffix = count % 10;
				const teen = count % 100;
				if (suffix === 1 && teen !== 11) {
					return t(`common.time_units.${unit}.one`);
				}
				if ([2, 3, 4].includes(suffix) && ![12, 13, 14].includes(teen)) {
					return t(`common.time_units.${unit}.few`);
				}
				return t(`common.time_units.${unit}.many`);
			}
			return count === 1
				? t(`common.time_units.${unit}.one`)
				: t(`common.time_units.${unit}.other`);
		};
		return { locale, setLocale, t, timeUnit };
	}, [locale]);

	return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => {
	const context = useContext(I18nContext);
	if (!context) {
		throw new Error('useI18n must be used inside I18nProvider');
	}
	return context;
};
