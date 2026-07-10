import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { Editor } from '@tiptap/core';
import { JSDOM } from 'jsdom';
import type { Root } from 'react-dom/client';

const dom = new JSDOM(
	'<!doctype html><html><body><div id="root"></div></body></html>',
	{
		url: 'http://localhost/',
	},
);

const browserGlobals = [
	'window',
	'document',
	'navigator',
	'Node',
	'Element',
	'HTMLElement',
	'HTMLBRElement',
	'ShadowRoot',
	'MutationObserver',
	'DOMParser',
	'getComputedStyle',
	'requestAnimationFrame',
	'cancelAnimationFrame',
] as const;

const originalDescriptors = new Map(
	browserGlobals.map((key) => [
		key,
		Object.getOwnPropertyDescriptor(globalThis, key),
	]),
);
const originalActEnvironment = Object.getOwnPropertyDescriptor(
	globalThis,
	'IS_REACT_ACT_ENVIRONMENT',
);

beforeAll(() => {
	dom.window.document.elementFromPoint = () =>
		dom.window.document.querySelector('.ProseMirror') ??
		dom.window.document.body;
	Object.defineProperties(dom.window.Range.prototype, {
		getBoundingClientRect: {
			configurable: true,
			value: () => new dom.window.DOMRect(),
		},
		getClientRects: {
			configurable: true,
			value: () => [],
		},
	});

	for (const key of browserGlobals) {
		const value =
			key === 'requestAnimationFrame'
				? (callback: FrameRequestCallback) =>
						dom.window.setTimeout(() => callback(performance.now()), 0)
				: key === 'cancelAnimationFrame'
					? (handle: number) => dom.window.clearTimeout(handle)
					: key === 'getComputedStyle'
						? dom.window.getComputedStyle.bind(dom.window)
						: dom.window[key];

		Object.defineProperty(globalThis, key, {
			configurable: true,
			writable: true,
			value,
		});
	}

	Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
		configurable: true,
		value: true,
	});
});

afterAll(() => {
	for (const key of browserGlobals) {
		const descriptor = originalDescriptors.get(key);
		if (descriptor) {
			Object.defineProperty(globalThis, key, descriptor);
		} else {
			Reflect.deleteProperty(globalThis, key);
		}
	}

	if (originalActEnvironment) {
		Object.defineProperty(
			globalThis,
			'IS_REACT_ACT_ENVIRONMENT',
			originalActEnvironment,
		);
	} else {
		Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
	}
	dom.window.close();
});

async function flushEffects(): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, 10));
}

describe('RichSecretEditor locale updates', () => {
	test('updates the placeholder without replacing or resetting the editor', async () => {
		const { act } = await import('react');
		const { createRoot } = await import('react-dom/client');
		const { RichSecretEditor } = await import(
			'../apps/frontend/src/components/RichSecretEditor'
		);
		const container = document.getElementById('root');
		expect(container).not.toBeNull();

		let editor: Editor | null = null;
		const onEditor = (nextEditor: Editor | null) => {
			if (nextEditor) {
				editor = nextEditor;
			}
		};
		const onChange = () => undefined;
		const root: Root = createRoot(container as HTMLElement);
		const renderEditor = (placeholder: string) => (
			<RichSecretEditor
				value=""
				onChange={onChange}
				placeholder={placeholder}
				maxLength={1_000}
				onEditor={onEditor}
			/>
		);

		try {
			await act(async () => {
				root.render(renderEditor('Write your secret'));
				await flushEffects();
			});
			expect(editor).not.toBeNull();
			const originalEditor = editor as Editor;

			await act(async () => {
				originalEditor.commands.focus();
				originalEditor.commands.insertContent('secret');
				originalEditor.commands.undo();
			});

			expect(originalEditor.getText()).toBe('');
			expect(originalEditor.can().redo()).toBe(true);
			expect(originalEditor.isFocused).toBe(true);
			expect(
				container
					?.querySelector('[data-placeholder]')
					?.getAttribute('data-placeholder'),
			).toBe('Write your secret');
			const selection = {
				from: originalEditor.state.selection.from,
				to: originalEditor.state.selection.to,
			};

			await act(async () => {
				root.render(renderEditor('Введите секрет'));
				await flushEffects();
			});

			expect(editor).toBe(originalEditor);
			expect(originalEditor.isDestroyed).toBe(false);
			expect(originalEditor.getText()).toBe('');
			expect(originalEditor.isFocused).toBe(true);
			expect(originalEditor.state.selection.from).toBe(selection.from);
			expect(originalEditor.state.selection.to).toBe(selection.to);
			expect(originalEditor.can().redo()).toBe(true);
			expect(
				container
					?.querySelector('[data-placeholder]')
					?.getAttribute('data-placeholder'),
			).toBe('Введите секрет');

			await act(async () => {
				originalEditor.commands.redo();
			});
			expect(originalEditor.getText()).toBe('secret');
		} finally {
			await act(async () => {
				root.unmount();
				await flushEffects();
			});
		}
	});
});
