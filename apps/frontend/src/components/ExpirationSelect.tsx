import { EXPIRATION_PRESETS } from '@secred/shared';
import { Clock3 } from 'lucide-react';
import { SegmentedControlIndicator } from '@/components/SegmentedControlIndicator';
import { Label } from '@/components/ui/label';
import { useSlidingSegmentIndicator } from '@/hooks/use-sliding-segment-indicator';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

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

	const presetIndex = EXPIRATION_PRESETS.findIndex(
		(option) => option.value === value,
	);
	const selectedIndex =
		presetIndex >= 0 ? presetIndex : EXPIRATION_PRESETS.length - 1;

	const { groupRef, segmentRefs, indicator, indicatorReady } =
		useSlidingSegmentIndicator(selectedIndex);

	return (
		<div className="setup-field text-left">
			<div className="setup-field-label-row">
				<Clock3 className="size-4 shrink-0" aria-hidden />
				<Label
					id="expiration-label"
					className="text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-muted-foreground"
				>
					{t('home.form.expires')}
				</Label>
			</div>
			{/* biome-ignore lint/a11y/useSemanticElements: segmented preset control */}
			<div
				ref={groupRef}
				className="expiration-preset-group"
				role="group"
				aria-label={t('home.form.expires')}
			>
				<SegmentedControlIndicator
					indicator={indicator}
					indicatorReady={indicatorReady}
				/>
				{EXPIRATION_PRESETS.map((option, index) => {
					const label = `${option.count} ${timeUnit(option.unit, option.count)}`;
					const selected = value === option.value;
					return (
						<button
							key={option.value}
							ref={(element) => {
								segmentRefs.current[index] = element;
							}}
							type="button"
							aria-pressed={selected}
							disabled={disabled}
							className={cn(
								'expiration-preset-group__segment',
								selected && 'expiration-preset-group__segment--active',
							)}
							onClick={() => onChange(option.value)}
						>
							{label}
						</button>
					);
				})}
			</div>
		</div>
	);
}
