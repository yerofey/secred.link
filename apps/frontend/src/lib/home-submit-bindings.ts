type SubmitAttempt = () => Promise<void>;

type HomeSubmitBindings = {
	onSubmit: SubmitAttempt;
	onRetrySubmit: SubmitAttempt;
};

export function createHomeSubmitBindings(
	submit: SubmitAttempt,
): HomeSubmitBindings {
	return {
		onSubmit: submit,
		onRetrySubmit: submit,
	};
}
