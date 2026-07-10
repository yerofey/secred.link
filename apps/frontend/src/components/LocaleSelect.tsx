import type { Locale } from '@secred/shared';
import { useI18n } from '@/lib/i18n';
import { localeDisplay, supportedLocales } from '@/lib/locale-display';
import { cn } from '@/lib/utils';

export function LocaleSelect({ className }: { className?: string }) {
	const { locale, setLocale, t } = useI18n();
	const currentLocale = localeDisplay[locale];

	return (
		<label
			className={cn(
				'locale-switch relative inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-border/70 bg-surface/80 text-foreground shadow-sm transition-colors hover:bg-accent/70 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring',
				className,
			)}
		>
			<span
				className="pointer-events-none text-[0.7rem] font-extrabold tracking-[0.08em]"
				aria-hidden
			>
				{currentLocale.code}
			</span>
			<select
				className="absolute -inset-px size-[calc(100%+2px)] cursor-pointer opacity-0"
				aria-label={t('common.language')}
				value={locale}
				onChange={(event) => setLocale(event.target.value as Locale)}
			>
				{supportedLocales.map((optionLocale) => {
					const option = localeDisplay[optionLocale];
					return (
						<option key={optionLocale} value={optionLocale} lang={option.lang}>
							{t(option.labelKey)}
						</option>
					);
				})}
			</select>
		</label>
	);
}
