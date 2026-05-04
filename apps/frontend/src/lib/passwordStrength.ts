/** Rough passphrase strength for UX hints only — not a cryptographic guarantee. */
export type PasswordStrengthTier = 'weak' | 'fair' | 'strong';

export function getPasswordStrength(
	password: string,
): PasswordStrengthTier | null {
	if (!password) {
		return null;
	}
	let score = 0;
	if (password.length >= 12) {
		score += 2;
	} else if (password.length >= 8) {
		score += 1;
	}
	if (/[a-z]/u.test(password) && /[A-Z]/u.test(password)) {
		score += 1;
	}
	if (/\d/u.test(password)) {
		score += 1;
	}
	if (/[^a-zA-Z0-9\s]/u.test(password)) {
		score += 1;
	}
	if (score <= 2) {
		return 'weak';
	}
	if (score <= 4) {
		return 'fair';
	}
	return 'strong';
}
