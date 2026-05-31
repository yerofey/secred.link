import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function PasswordInput({
	className,
	disabled,
	...props
}: React.ComponentProps<typeof Input>) {
	const { t } = useI18n();
	const [visible, setVisible] = useState(false);

	return (
		<div className="password-input">
			<Input
				type={visible ? 'text' : 'password'}
				disabled={disabled}
				className={cn('password-input__field', className)}
				{...props}
			/>
			<button
				type="button"
				className="password-input__toggle"
				disabled={disabled}
				aria-pressed={visible}
				aria-label={
					visible ? t('common.hide_password') : t('common.show_password')
				}
				onClick={() => setVisible((on) => !on)}
			>
				{visible ? (
					<EyeOff className="size-[1.05rem]" aria-hidden />
				) : (
					<Eye className="size-[1.05rem]" aria-hidden />
				)}
			</button>
		</div>
	);
}
