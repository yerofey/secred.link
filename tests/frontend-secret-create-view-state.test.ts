import { describe, expect, test } from 'bun:test';
import { getSecretCreateViewState } from '../apps/frontend/src/lib/secret-create-view-state';

const readyInput = {
	apiStatus: 'ok' as const,
	hasPayload: true,
	isSubmitting: false,
	attachmentTooLarge: false,
	hasSubmitError: false,
};

describe('secret create view state', () => {
	test('waits for the health check without blocking editing', () => {
		expect(
			getSecretCreateViewState({ ...readyInput, apiStatus: 'pending' }),
		).toMatchObject({ disabled: true, hintKey: 'home.form.checking_service' });
	});

	test('offers health recovery when the API is unavailable', () => {
		expect(
			getSecretCreateViewState({ ...readyInput, apiStatus: 'error' }),
		).toMatchObject({
			disabled: true,
			hintKey: 'home.form.submit_api_unavailable',
			showHealthRetry: true,
		});
	});

	test('explains empty and oversized payloads', () => {
		expect(
			getSecretCreateViewState({ ...readyInput, hasPayload: false }).hintKey,
		).toBe('home.form.submit_empty');
		expect(
			getSecretCreateViewState({
				...readyInput,
				attachmentTooLarge: true,
			}).hintKey,
		).toBe('home.form.submit_file_too_large');
	});

	test('enables valid content and exposes retry after a failed submit', () => {
		expect(getSecretCreateViewState(readyInput)).toMatchObject({
			disabled: false,
			hintKey: 'home.form.submit_ready',
		});
		expect(
			getSecretCreateViewState({ ...readyInput, hasSubmitError: true }),
		).toMatchObject({ disabled: false, showSubmitRetry: true });
	});
});
