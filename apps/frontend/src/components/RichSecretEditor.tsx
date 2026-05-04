import type { Editor } from '@tiptap/core';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';
import { useEffect, useRef } from 'react';
import TurndownService from 'turndown';
import { cn } from '@/lib/utils';

const turndown = new TurndownService({
	headingStyle: 'atx',
	codeBlockStyle: 'fenced',
	bulletListMarker: '-',
});

function markdownToHtml(markdown: string): string {
	const raw = marked.parse(markdown || '', { async: false }) as string;
	return DOMPurify.sanitize(raw);
}

type RichSecretEditorProps = {
	value: string;
	onChange: (markdown: string) => void;
	placeholder: string;
	maxLength: number;
	disabled?: boolean;
	onEditor: (editor: Editor | null) => void;
	className?: string;
};

export function RichSecretEditor({
	value,
	onChange,
	placeholder,
	maxLength,
	disabled,
	onEditor,
	className,
}: RichSecretEditorProps) {
	const lastEmitted = useRef(value);
	const onChangeRef = useRef(onChange);
	const maxLengthRef = useRef(maxLength);

	onChangeRef.current = onChange;
	maxLengthRef.current = maxLength;

	const editor = useEditor(
		{
			immediatelyRender: false,
			editable: !disabled,
			extensions: [
				StarterKit.configure({
					heading: { levels: [2, 3] },
					link: {
						openOnClick: false,
						autolink: true,
						HTMLAttributes: {
							class: 'text-primary underline underline-offset-2',
						},
					},
					codeBlock: {
						HTMLAttributes: {
							class:
								'rounded-md bg-muted p-3 font-mono text-sm text-foreground',
						},
					},
				}),
				Placeholder.configure({
					placeholder,
					emptyEditorClass: 'is-editor-empty',
				}),
			],
			content: markdownToHtml(value),
			editorProps: {
				attributes: {
					class: cn(
						'rich-secret-prose min-h-[min(48dvh,20rem)] w-full px-4 py-4 text-base leading-relaxed text-foreground outline-none md:min-h-[20rem] md:px-5 md:py-5 md:text-sm',
						'[&_a]:break-all [&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/40 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground',
						'[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em]',
						'[&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold',
						'[&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5',
						'[&_p]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:font-mono',
					),
				},
			},
			onUpdate: ({ editor: ed }) => {
				const md = turndown.turndown(ed.getHTML()).trim();
				if (md.length > maxLengthRef.current) {
					ed.commands.undo();
					return;
				}
				lastEmitted.current = md;
				onChangeRef.current(md);
			},
		},
		[],
	);

	useEffect(() => {
		if (!editor || editor.isDestroyed) {
			return;
		}
		editor.setEditable(!disabled);
	}, [disabled, editor]);

	useEffect(() => {
		onEditor(editor ?? null);
		return () => {
			onEditor(null);
		};
	}, [editor, onEditor]);

	useEffect(() => {
		if (!editor || editor.isDestroyed) {
			return;
		}
		if (value === lastEmitted.current) {
			return;
		}
		lastEmitted.current = value;
		editor.commands.setContent(markdownToHtml(value));
	}, [value, editor]);

	if (!editor) {
		return (
			<div
				className={cn(
					'min-h-[min(48dvh,20rem)] w-full animate-pulse rounded-b-[inherit] bg-muted/30',
					className,
				)}
				aria-hidden
			/>
		);
	}

	return (
		<EditorContent
			editor={editor}
			className={cn('rich-secret-editor-content', className)}
		/>
	);
}
