import { describe, expect, test } from 'bun:test';
import {
	ALL_TOOLBAR_ACTIONS,
	MOBILE_OVERFLOW_ACTIONS,
	MOBILE_PRIMARY_ACTIONS,
} from '../apps/frontend/src/lib/markdown-toolbar-actions';

const styles = await Bun.file(
	new URL('../apps/frontend/src/styles.css', import.meta.url),
).text();

describe('mobile formatting actions', () => {
	test('keeps the four core actions visible', () => {
		expect(MOBILE_PRIMARY_ACTIONS).toEqual([
			'bold',
			'italic',
			'link',
			'bullet',
		]);
	});

	test('places every remaining action in More exactly once', () => {
		expect(MOBILE_OVERFLOW_ACTIONS).toEqual([
			'strike',
			'code',
			'h2',
			'ordered',
			'quote',
			'fence',
		]);
		expect(
			new Set([...MOBILE_PRIMARY_ACTIONS, ...MOBILE_OVERFLOW_ACTIONS]),
		).toEqual(new Set(ALL_TOOLBAR_ACTIONS));
	});

	test('stacks narrow editor chrome before controls can overlap', () => {
		expect(styles).toContain(`@media (max-width: 399px) {
	.secret-editor-field__chrome {
		grid-template-columns: minmax(0, 1fr);
	}

	.editor-mode-switch {
		justify-self: end;
	}
}`);
	});
});
