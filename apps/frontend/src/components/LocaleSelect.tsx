import type { Locale } from '@secred/shared';
import { Select } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function LocaleSelect({ className }: { className?: string }) {
	const { locale, setLocale } = useI18n();
	return (
		<Select
			aria-label="Language"
			className={cn(
				'h-11 min-h-11 w-[84px] text-base md:h-10 md:min-h-10 md:w-[78px] md:text-sm',
				className,
			)}
			value={locale}
			onChange={(event) => setLocale(event.target.value as Locale)}
		>
			<option value="en">EN</option>
			<option value="ru">RU</option>
		</Select>
	);
}
