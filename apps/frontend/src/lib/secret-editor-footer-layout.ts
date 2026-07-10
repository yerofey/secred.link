export type SecretEditorFooterLayout = 'single-row' | 'wrapped';

type SecretEditorFooterLayoutInput = {
	hasAttachment: boolean;
	hasError: boolean;
};

export function getSecretEditorFooterLayout(
	input: SecretEditorFooterLayoutInput,
): SecretEditorFooterLayout {
	return input.hasAttachment || input.hasError ? 'wrapped' : 'single-row';
}
