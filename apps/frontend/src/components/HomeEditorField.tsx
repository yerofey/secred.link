import { MAX_SECRET_LENGTH } from '@secred/shared';
import type { Editor } from '@tiptap/core';
import { AlignLeft, PenLine } from 'lucide-react';
import type { ReactNode, RefObject } from 'react';
import { MarkdownEditorToolbar } from '@/components/MarkdownEditorToolbar';
import { RichSecretEditor } from '@/components/RichSecretEditor';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export type HomeEditorFieldProps = {
	content: string;
	onContentChange: (value: string) => void;
	rawEditing: boolean;
	onRawEditingChange: (value: boolean) => void;
	richEditor: Editor | null;
	onRichEditor: (editor: Editor | null) => void;
	textareaRef: RefObject<HTMLTextAreaElement | null>;
	apiDisabled: boolean;
	t: (key: string) => string;
	footer?: ReactNode;
};

export function HomeEditorField({
	content,
	onContentChange,
	rawEditing,
	onRawEditingChange,
	richEditor,
	onRichEditor,
	textareaRef,
	apiDisabled,
	t,
	footer,
}: HomeEditorFieldProps) {
	return (
		<fieldset className="secret-editor-field m-0 min-h-[min(24rem,64dvh)] min-w-0 overflow-hidden rounded-[1.6rem] border border-input/80 bg-surface-muted/55 p-0 focus-within:border-input focus-within:ring-2 focus-within:ring-ring/40">
			<legend className="sr-only">{t('home.form.editor_legend')}</legend>
			<div className="secret-editor-field__chrome">
				<div className="secret-editor-field__toolbar">
					<MarkdownEditorToolbar
						embedded
						textareaRef={textareaRef}
						richEditor={richEditor}
						variant={rawEditing ? 'markdown' : 'rich'}
						value={content}
						onChange={onContentChange}
						maxLength={MAX_SECRET_LENGTH}
						disabled={apiDisabled}
					/>
				</div>
				{/* biome-ignore lint/a11y/useSemanticElements: segmented control styled as div */}
				<div
					className="editor-mode-switch"
					role="group"
					aria-label={t('home.form.editor_mode_label')}
				>
					<button
						type="button"
						disabled={apiDisabled}
						aria-pressed={!rawEditing}
						aria-label={t('home.form.mode_visual')}
						onClick={() => onRawEditingChange(false)}
						className={cn(
							'editor-mode-switch__segment',
							!rawEditing && 'editor-mode-switch__segment--active',
						)}
					>
						<PenLine
							className="size-[15px] shrink-0 md:size-4"
							strokeWidth={1.7}
							aria-hidden
						/>
					</button>
					<button
						type="button"
						disabled={apiDisabled}
						aria-pressed={rawEditing}
						aria-label={t('home.form.mode_plain')}
						onClick={() => onRawEditingChange(true)}
						className={cn(
							'editor-mode-switch__segment',
							rawEditing && 'editor-mode-switch__segment--active',
						)}
					>
						<AlignLeft
							className="size-[15px] shrink-0 md:size-4"
							strokeWidth={1.7}
							aria-hidden
						/>
					</button>
				</div>
			</div>
			{rawEditing ? (
				<Textarea
					ref={textareaRef}
					id="secret-body"
					maxLength={MAX_SECRET_LENGTH}
					className="min-h-[min(48dvh,20rem)] resize-y rounded-none border-0 bg-transparent px-4 py-4 shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 md:min-h-[20rem] md:px-5 md:py-5"
					aria-label={t('home.form.insert')}
					placeholder={t('home.form.insert')}
					autoCorrect="off"
					value={content}
					onChange={(event) => onContentChange(event.target.value)}
				/>
			) : (
				<RichSecretEditor
					value={content}
					onChange={onContentChange}
					placeholder={t('home.form.insert')}
					maxLength={MAX_SECRET_LENGTH}
					disabled={apiDisabled}
					onEditor={onRichEditor}
				/>
			)}
			{footer}
		</fieldset>
	);
}
