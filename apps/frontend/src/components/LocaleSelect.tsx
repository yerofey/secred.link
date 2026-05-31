import type { Locale } from '@secred/shared';
import { Languages } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function LocaleSelect({ className }: { className?: string }) {
	const { locale, setLocale, t } = useI18n();

	return (
		<label
			className={cn(
				'locale-switch relative inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-border/70 bg-surface/80 text-muted-foreground shadow-sm transition-colors hover:bg-accent/70 hover:text-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-ring',
				className,
			)}
		>
			<Languages className="pointer-events-none size-4 shrink-0" aria-hidden />
			<select
				className="absolute inset-0 cursor-pointer opacity-0"
				aria-label={t('common.language')}
				value={locale}
				onChange={(event) => setLocale(event.target.value as Locale)}
			>
				<option value="en">{t('common.locale_en')}</option>
				<option value="ru">{t('common.locale_ru')}</option>
			</select>
		</label>
	);
}
