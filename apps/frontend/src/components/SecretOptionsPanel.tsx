import { MAX_PASSWORD_LENGTH } from '@secred/shared';
import { ChevronDown, Flame, KeyRound, ShieldCheck } from 'lucide-react';
import { useId, useState } from 'react';
import { ExpirationSelect } from '@/components/ExpirationSelect';
import { PasswordInput } from '@/components/PasswordInput';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/lib/i18n';
import { getPasswordStrength } from '@/lib/passwordStrength';
import { cn } from '@/lib/utils';

type SecretOptionsPanelProps = {
	password: string;
	onPasswordChange: (value: string) => void;
	lifetime: number;
	onLifetimeChange: (value: number) => void;
	isBurnable: boolean;
	onBurnableChange: (value: boolean) => void;
	summary: string;
};

export function SecretOptionsPanel({
	password,
	onPasswordChange,
	lifetime,
	onLifetimeChange,
	isBurnable,
	onBurnableChange,
	summary,
}: SecretOptionsPanelProps) {
	const { t } = useI18n();
	const [isOpen, setIsOpen] = useState(false);
	const bodyId = useId();
	const strength = getPasswordStrength(password);
	const strengthHint =
		strength === 'weak'
			? t('home.form.password_strength_weak')
			: strength === 'fair'
				? t('home.form.password_strength_fair')
				: strength === 'strong'
					? t('home.form.password_strength_strong')
					: null;

	return (
		<section className="rail-card secret-options-panel" data-open={isOpen}>
			<button
				type="button"
				className="secret-options-panel__mobile-toggle min-h-11"
				aria-expanded={isOpen}
				aria-controls={bodyId}
				onClick={() => setIsOpen((open) => !open)}
			>
				<ShieldCheck aria-hidden />
				<span className="secret-options-panel__heading-copy">
					<span className="secret-options-panel__title">
						{t('home.form.optional')}
					</span>
					<span className="secret-options-panel__summary">{summary}</span>
				</span>
				<ChevronDown
					className={cn(
						'secret-options-panel__chevron',
						isOpen && 'rotate-180',
					)}
					aria-hidden
				/>
			</button>

			<div className="secret-options-panel__desktop-heading">
				<ShieldCheck aria-hidden />
				<div className="secret-options-panel__heading-copy">
					<h2 className="secret-options-panel__title">
						{t('home.form.optional')}
					</h2>
					<p className="secret-options-panel__summary">{summary}</p>
				</div>
			</div>

			<div id={bodyId} className="secret-options-panel__body setup-controls">
				<div className="setup-field">
					<div className="setup-field-label-row">
						<KeyRound className="size-4 shrink-0" aria-hidden />
						<Label
							htmlFor="password"
							className="text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-muted-foreground"
						>
							{t('home.form.password')}
						</Label>
					</div>
					<PasswordInput
						id="password"
						placeholder={t('home.form.passphrase')}
						autoComplete="new-password"
						maxLength={MAX_PASSWORD_LENGTH}
						value={password}
						onChange={(event) => onPasswordChange(event.target.value)}
						aria-describedby={password ? 'password-strength-hint' : undefined}
					/>
					{strengthHint ? (
						<p
							id="password-strength-hint"
							className={cn(
								'text-xs leading-relaxed text-muted-foreground',
								strength === 'weak' && 'text-amber-700 dark:text-amber-400',
							)}
						>
							{strengthHint}
						</p>
					) : null}
				</div>
				<ExpirationSelect value={lifetime} onChange={onLifetimeChange} />
				<label className="setup-field setup-field--switch" htmlFor="burnable">
					<span className="setup-switch-main">
						<Flame className="size-4 shrink-0" aria-hidden />
						<span>{t('home.form.burnable')}</span>
					</span>
					<input
						id="burnable"
						type="checkbox"
						className="switch-control"
						checked={isBurnable}
						onChange={(event) => onBurnableChange(event.currentTarget.checked)}
					/>
				</label>
			</div>
		</section>
	);
}
