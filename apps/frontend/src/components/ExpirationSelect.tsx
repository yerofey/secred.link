import { EXPIRATION_OPTIONS } from '@secred/shared';
import { Clock3 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';

export function ExpirationSelect({
	value,
	disabled,
	onChange,
}: {
	value: number;
	disabled?: boolean;
	onChange: (value: number) => void;
}) {
	const { t, timeUnit } = useI18n();
	const groups = [...new Set(EXPIRATION_OPTIONS.map((option) => option.group))];

	return (
		<div className="setup-field text-left">
			<div className="setup-field-label-row">
				<Clock3 className="size-4 shrink-0" aria-hidden />
				<Label
					htmlFor="expiration"
					className="text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-muted-foreground"
				>
					{t('home.form.expires')}
				</Label>
			</div>
			<Select
				id="expiration"
				value={String(value)}
				disabled={disabled}
				onChange={(event) => onChange(Number(event.target.value))}
			>
				{groups.map((group) => (
					<optgroup key={group} label={t(`expiration.${group}`)}>
						{EXPIRATION_OPTIONS.filter((option) => option.group === group).map(
							(option) => (
								<option key={option.value} value={option.value}>
									{option.count} {timeUnit(option.unit, option.count)}
								</option>
							),
						)}
					</optgroup>
				))}
			</Select>
		</div>
	);
}
