import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import {
	type ApiStatus,
	getSecretCreateViewState,
	type SubmitPhase,
} from '@/lib/secret-create-view-state';
import { cn } from '@/lib/utils';

type SecretCreateActionProps = {
	apiStatus: ApiStatus;
	hasPayload: boolean;
	isSubmitting: boolean;
	submitPhase: SubmitPhase;
	attachmentTooLarge: boolean;
	hasSubmitError: boolean;
	summary: string;
	onRetryHealth: () => void;
	onRetrySubmit: () => void;
};

export function SecretCreateAction({
	apiStatus,
	hasPayload,
	isSubmitting,
	submitPhase,
	attachmentTooLarge,
	hasSubmitError,
	summary,
	onRetryHealth,
	onRetrySubmit,
}: SecretCreateActionProps) {
	const { t } = useI18n();
	const viewState = getSecretCreateViewState({
		apiStatus,
		hasPayload,
		isSubmitting,
		attachmentTooLarge,
		hasSubmitError,
	});
	const hint = t(viewState.hintKey);
	const actionLabel = !isSubmitting
		? t('home.form.create')
		: submitPhase === 'encrypt'
			? `${t('home.form.phase_encrypting')}…`
			: submitPhase === 'save'
				? `${t('home.form.phase_saving')}…`
				: submitPhase === 'file'
					? `${t('home.form.phase_uploading_file')}…`
					: `${t('home.form.creating')}…`;
	const statusText = isSubmitting ? actionLabel : hint;
	const showSummary = hasPayload && !attachmentTooLarge && summary.length > 0;

	return (
		<div className="secret-create-action">
			{viewState.showHealthRetry ? (
				<div
					className="secret-create-action__alert status-banner"
					data-tone="danger"
					role="alert"
				>
					<p>{t('home.api.unavailable')}</p>
					<Button type="button" variant="outline" onClick={onRetryHealth}>
						{t('home.form.retry_service')}
					</Button>
				</div>
			) : null}
			{viewState.showSubmitRetry ? (
				<div
					className="secret-create-action__alert status-banner"
					data-tone="danger"
					role="alert"
				>
					<p>{t('home.form.submit_failed')}</p>
					<Button type="button" variant="outline" onClick={onRetrySubmit}>
						{t('home.form.retry_submit')}
					</Button>
				</div>
			) : null}
			<Button
				type="submit"
				size="default"
				className="secret-create-action__submit w-full"
				disabled={viewState.disabled}
			>
				<PlusCircle aria-hidden />
				{actionLabel}
			</Button>
			<p
				className={cn(
					'secret-create-action__status form-submit-note',
					attachmentTooLarge && 'form-submit-note--danger',
				)}
				role="status"
				aria-live="polite"
				aria-atomic="true"
			>
				{statusText}
				{showSummary ? ` · ${summary}` : ''}
			</p>
		</div>
	);
}
