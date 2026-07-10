type SecretOptionsSummaryInput = {
	expiration: string;
	passwordEnabled: boolean;
	burnEnabled: boolean;
	attachmentSize?: string;
};

type SecretOptionsSummaryLabels = {
	password: string;
	burn: string;
	on: string;
	off: string;
};

export function buildSecretOptionsSummary(
	input: SecretOptionsSummaryInput,
	labels: SecretOptionsSummaryLabels,
): string {
	const passwordState = input.passwordEnabled ? labels.on : labels.off;
	const burnState = input.burnEnabled ? labels.on : labels.off;
	return [
		input.expiration,
		`${labels.password} ${passwordState}`,
		`${labels.burn} ${burnState}`,
		input.attachmentSize,
	]
		.filter((part): part is string => Boolean(part))
		.join(' · ');
}
