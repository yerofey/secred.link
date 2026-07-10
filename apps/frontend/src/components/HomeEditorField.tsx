import { MAX_SECRET_LENGTH } from '@secred/shared';
import type { Editor } from '@tiptap/core';
import type { ReactNode, RefObject } from 'react';
import { MarkdownEditorToolbar } from '@/components/MarkdownEditorToolbar';
import { RichSecretEditor } from '@/components/RichSecretEditor';
import { SegmentedControlIndicator } from '@/components/SegmentedControlIndicator';
import { Textarea } from '@/components/ui/textarea';
import { useSlidingSegmentIndicator } from '@/hooks/use-sliding-segment-indicator';
import { cn } from '@/lib/utils';

export type HomeEditorFieldProps = {
	content: string;
	onContentChange: (value: string) => void;
	rawEditing: boolean;
	onRawEditingChange: (value: boolean) => void;
	richEditor: Editor | null;
	onRichEditor: (editor: Editor | null) => void;
	textareaRef: RefObject<HTMLTextAreaElement | null>;
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
	t,
	footer,
}: HomeEditorFieldProps) {
	const selectedIndex = rawEditing ? 1 : 0;
	const { groupRef, segmentRefs, indicator, indicatorReady } =
		useSlidingSegmentIndicator(selectedIndex);

	return (
		<fieldset className="secret-editor-field m-0 min-h-0 min-w-0 flex-1 overflow-hidden rounded-[1.6rem] border border-input/80 bg-surface-muted/55 p-0 focus-within:border-input focus-within:ring-2 focus-within:ring-ring/40">
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
					/>
				</div>
				{/* biome-ignore lint/a11y/useSemanticElements: segmented control */}
				<div
					ref={groupRef}
					className="editor-mode-switch"
					role="group"
					aria-label={t('home.form.editor_mode_label')}
				>
					<SegmentedControlIndicator
						indicator={indicator}
						indicatorReady={indicatorReady}
					/>
					<button
						ref={(element) => {
							segmentRefs.current[0] = element;
						}}
						type="button"
						aria-pressed={!rawEditing}
						aria-label={t('home.form.mode_visual')}
						onClick={() => onRawEditingChange(false)}
						className={cn(
							'editor-mode-switch__segment',
							!rawEditing && 'editor-mode-switch__segment--active',
						)}
					>
						{t('home.form.mode_visual')}
					</button>
					<button
						ref={(element) => {
							segmentRefs.current[1] = element;
						}}
						type="button"
						aria-pressed={rawEditing}
						aria-label={t('home.form.mode_plain')}
						onClick={() => onRawEditingChange(true)}
						className={cn(
							'editor-mode-switch__segment',
							rawEditing && 'editor-mode-switch__segment--active',
						)}
					>
						{t('home.form.mode_plain')}
					</button>
				</div>
			</div>
			{rawEditing ? (
				<Textarea
					ref={textareaRef}
					id="secret-body"
					maxLength={MAX_SECRET_LENGTH}
					className="min-h-0 flex-1 resize-none rounded-none border-0 bg-transparent px-4 py-4 shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 md:px-5 md:py-5"
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
					onEditor={onRichEditor}
				/>
			)}
			{footer}
		</fieldset>
	);
}
