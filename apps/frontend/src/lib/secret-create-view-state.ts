export type ApiStatus = 'pending' | 'ok' | 'error';
export type SubmitPhase = 'idle' | 'encrypt' | 'save' | 'file';

type Input = {
	apiStatus: ApiStatus;
	hasPayload: boolean;
	isSubmitting: boolean;
	attachmentTooLarge: boolean;
	hasSubmitError: boolean;
};

export function getSecretCreateViewState(input: Input) {
	const disabled =
		input.apiStatus !== 'ok' ||
		!input.hasPayload ||
		input.isSubmitting ||
		input.attachmentTooLarge;

	if (input.apiStatus === 'pending') {
		return {
			disabled,
			hintKey: 'home.form.checking_service',
			showHealthRetry: false,
			showSubmitRetry: false,
		};
	}
	if (input.apiStatus === 'error') {
		return {
			disabled,
			hintKey: 'home.form.submit_api_unavailable',
			showHealthRetry: true,
			showSubmitRetry: false,
		};
	}
	if (input.attachmentTooLarge) {
		return {
			disabled,
			hintKey: 'home.form.submit_file_too_large',
			showHealthRetry: false,
			showSubmitRetry: false,
		};
	}
	if (!input.hasPayload) {
		return {
			disabled,
			hintKey: 'home.form.submit_empty',
			showHealthRetry: false,
			showSubmitRetry: false,
		};
	}
	return {
		disabled,
		hintKey: 'home.form.submit_ready',
		showHealthRetry: false,
		showSubmitRetry: input.hasSubmitError && !input.isSubmitting,
	};
}
