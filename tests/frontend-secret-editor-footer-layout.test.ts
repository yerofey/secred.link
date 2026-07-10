import { describe, expect, test } from 'bun:test';
import { getSecretEditorFooterLayout } from '../apps/frontend/src/lib/secret-editor-footer-layout';

describe('secret editor footer layout', () => {
	test('keeps the empty footer on one row', () => {
		expect(
			getSecretEditorFooterLayout({
				hasAttachment: false,
				hasError: false,
			}),
		).toBe('single-row');
	});

	test('allows wrapping only for attachment details or an error', () => {
		expect(
			getSecretEditorFooterLayout({
				hasAttachment: true,
				hasError: false,
			}),
		).toBe('wrapped');
		expect(
			getSecretEditorFooterLayout({
				hasAttachment: false,
				hasError: true,
			}),
		).toBe('wrapped');
	});
});
