import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import {
	Bold,
	Code2,
	FileCode2,
	Heading2,
	Italic,
	Link2,
	List,
	ListOrdered,
	Quote,
	Strikethrough,
} from 'lucide-react';
import type { RefObject } from 'react';
import { useI18n } from '@/lib/i18n';
import {
	applyMarkdownInsert,
	type MarkdownInsertKind,
} from '@/lib/markdownInsert';
import { cn } from '@/lib/utils';

type ToolbarActiveMap = {
	bold: boolean;
	italic: boolean;
	strike: boolean;
	code: boolean;
	link: boolean;
	h2: boolean;
	bullet: boolean;
	ordered: boolean;
	quote: boolean;
	fence: boolean;
};

const INACTIVE_TOOLBAR: ToolbarActiveMap = {
	bold: false,
	italic: false,
	strike: false,
	code: false,
	link: false,
	h2: false,
	bullet: false,
	ordered: false,
	quote: false,
	fence: false,
};

const ACTIVE_BY_KIND: Record<MarkdownInsertKind, keyof ToolbarActiveMap> = {
	bold: 'bold',
	italic: 'italic',
	strike: 'strike',
	code: 'code',
	link: 'link',
	h2: 'h2',
	bullet: 'bullet',
	ordered: 'ordered',
	quote: 'quote',
	fence: 'fence',
};

function applyRichEditor(editor: Editor, kind: MarkdownInsertKind): void {
	const chain = editor.chain().focus();
	switch (kind) {
		case 'bold':
			chain.toggleBold().run();
			break;
		case 'italic':
			chain.toggleItalic().run();
			break;
		case 'strike':
			chain.toggleStrike().run();
			break;
		case 'code':
			chain.toggleCode().run();
			break;
		case 'link': {
			const prev = editor.getAttributes('link').href as string | undefined;
			const url = window.prompt('URL', prev ?? 'https://');
			if (url === null) {
				return;
			}
			if (url === '') {
				chain.extendMarkRange('link').unsetLink().run();
				return;
			}
			chain.extendMarkRange('link').setLink({ href: url }).run();
			break;
		}
		case 'h2':
			chain.toggleHeading({ level: 2 }).run();
			break;
		case 'bullet':
			chain.toggleBulletList().run();
			break;
		case 'ordered':
			chain.toggleOrderedList().run();
			break;
		case 'quote':
			chain.toggleBlockquote().run();
			break;
		case 'fence':
			chain.toggleCodeBlock().run();
			break;
	}
}

type MarkdownEditorToolbarProps = {
	textareaRef: RefObject<HTMLTextAreaElement | null>;
	richEditor: Editor | null;
	variant: 'markdown' | 'rich';
	value: string;
	onChange: (next: string) => void;
	maxLength: number;
	disabled?: boolean;
	/** Flat chrome strip inside the editor frame (no outer toolbar frame). */
	embedded?: boolean;
};

const ACTIONS: {
	kind: MarkdownInsertKind;
	icon: typeof Bold;
	labelKey: string;
}[] = [
	{ kind: 'bold', icon: Bold, labelKey: 'toolbar_bold' },
	{ kind: 'italic', icon: Italic, labelKey: 'toolbar_italic' },
	{ kind: 'strike', icon: Strikethrough, labelKey: 'toolbar_strike' },
	{ kind: 'code', icon: Code2, labelKey: 'toolbar_code' },
	{ kind: 'link', icon: Link2, labelKey: 'toolbar_link' },
	{ kind: 'h2', icon: Heading2, labelKey: 'toolbar_heading' },
	{ kind: 'bullet', icon: List, labelKey: 'toolbar_bullet' },
	{ kind: 'ordered', icon: ListOrdered, labelKey: 'toolbar_numbered' },
	{ kind: 'quote', icon: Quote, labelKey: 'toolbar_quote' },
	{ kind: 'fence', icon: FileCode2, labelKey: 'toolbar_fence' },
];

const ACTION_MAP = Object.fromEntries(
	ACTIONS.map((a) => [a.kind, a]),
) as Record<
	MarkdownInsertKind,
	{ kind: MarkdownInsertKind; icon: typeof Bold; labelKey: string }
>;

/** Visual groups: inline marks · links/structure · lists · blocks */
const TOOLBAR_GROUPS: MarkdownInsertKind[][] = [
	['bold', 'italic', 'strike', 'code'],
	['link', 'h2'],
	['bullet', 'ordered'],
	['quote', 'fence'],
];

export function MarkdownEditorToolbar({
	textareaRef,
	richEditor,
	variant,
	value,
	onChange,
	maxLength,
	disabled,
	embedded = false,
}: MarkdownEditorToolbarProps) {
	const { t } = useI18n();

	const richToolbarActive = useEditorState({
		editor: variant === 'rich' ? richEditor : null,
		selector: ({ editor }) => {
			if (!editor || editor.isDestroyed) {
				return INACTIVE_TOOLBAR;
			}
			return {
				bold: editor.isActive('bold'),
				italic: editor.isActive('italic'),
				strike: editor.isActive('strike'),
				code: editor.isActive('code'),
				link: editor.isActive('link'),
				h2: editor.isActive('heading', { level: 2 }),
				bullet: editor.isActive('bulletList'),
				ordered: editor.isActive('orderedList'),
				quote: editor.isActive('blockquote'),
				fence: editor.isActive('codeBlock'),
			};
		},
	});

	const activeMap: ToolbarActiveMap =
		variant === 'rich' && richToolbarActive
			? richToolbarActive
			: INACTIVE_TOOLBAR;

	const apply = (kind: MarkdownInsertKind) => {
		if (disabled) {
			return;
		}
		if (variant === 'rich') {
			if (!richEditor || richEditor.isDestroyed) {
				return;
			}
			applyRichEditor(richEditor, kind);
			return;
		}
		const el = textareaRef.current;
		if (!el) {
			return;
		}
		const start = el.selectionStart;
		const end = el.selectionEnd;
		const { next, selStart, selEnd } = applyMarkdownInsert(
			value,
			start,
			end,
			kind,
		);
		if (next.length > maxLength) {
			return;
		}
		onChange(next);
		requestAnimationFrame(() => {
			el.focus();
			el.setSelectionRange(selStart, selEnd);
		});
	};

	return (
		<div
			className={cn(
				'markdown-toolbar',
				embedded && 'markdown-toolbar--embedded',
			)}
			role="toolbar"
			aria-label={t('home.form.toolbar_label')}
		>
			{TOOLBAR_GROUPS.map((group, groupIndex) => (
				<div
					key={`toolbar-g-${groupIndex}`}
					className="markdown-toolbar__group"
				>
					{groupIndex > 0 ? (
						<span className="markdown-toolbar__divider" aria-hidden />
					) : null}
					{group.map((kind) => {
						const { icon: Icon, labelKey } = ACTION_MAP[kind];
						const isOn = variant === 'rich' && activeMap[ACTIVE_BY_KIND[kind]];
						return (
							<button
								key={kind}
								type="button"
								disabled={disabled}
								className="markdown-toolbar__btn"
								data-active={isOn ? 'true' : 'false'}
								aria-pressed={variant === 'rich' ? Boolean(isOn) : undefined}
								aria-label={t(`home.form.${labelKey}`)}
								title={t(`home.form.${labelKey}`)}
								onClick={() => apply(kind)}
							>
								<Icon
									className="size-[15px] md:size-4"
									strokeWidth={isOn ? 2.35 : 1.7}
									aria-hidden
								/>
							</button>
						);
					})}
				</div>
			))}
		</div>
	);
}
