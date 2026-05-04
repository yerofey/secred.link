import { Download, FileImage, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

function formatBytes(n: number): string {
	if (n < 1024) {
		return `${n} B`;
	}
	const kb = n / 1024;
	if (kb < 1024) {
		return kb < 10 ? `${kb.toFixed(1)} KB` : `${Math.round(kb)} KB`;
	}
	const mb = kb / 1024;
	return mb < 10 ? `${mb.toFixed(1)} MB` : `${Math.round(mb)} MB`;
}

function formatMimeLabel(mime: string): string {
	const parts = mime.split('/');
	if (parts.length !== 2) {
		return mime;
	}
	return parts[1].replace('+xml', '').toUpperCase();
}

export type SecretAttachmentCardProps = {
	name: string;
	mime: string;
	size: number;
	previewUrl: string | null;
	previewLoading: boolean;
	previewError: boolean;
	isImage: boolean;
	/** Burn-after-read image before the single allowed fetch */
	burnableImagePending: boolean;
	onDownload: () => void;
	disabled: boolean;
	downloading: boolean;
};

export function SecretAttachmentCard({
	name,
	mime,
	size,
	previewUrl,
	previewLoading,
	previewError,
	isImage,
	burnableImagePending,
	onDownload,
	disabled,
	downloading,
}: SecretAttachmentCardProps) {
	const { t } = useI18n();
	const FileIcon = isImage ? FileImage : FileText;
	const showPreviewRegion =
		isImage &&
		(previewLoading || previewUrl || previewError || burnableImagePending);

	return (
		<div
			className={cn(
				'overflow-hidden rounded-[1.4rem] border border-border/70',
				'bg-gradient-to-b from-surface-muted/55 to-surface-muted/25',
				'shadow-[inset_0_1px_0_hsl(var(--foreground)/0.04)]',
			)}
		>
			{showPreviewRegion ? (
				<div className="relative border-b border-border/45 bg-muted/10">
					{previewLoading ? (
						<div
							className="aspect-[16/10] max-h-80 w-full animate-pulse bg-muted/35"
							role="status"
							aria-live="polite"
							aria-busy="true"
						>
							<span className="sr-only">{t('view.preview_loading')}</span>
						</div>
					) : previewError ? (
						<div className="flex aspect-[16/10] max-h-80 items-center justify-center px-6 text-center text-sm text-destructive">
							{t('common.error')}
						</div>
					) : previewUrl ? (
						<img
							src={previewUrl}
							alt=""
							className="max-h-80 w-full object-contain object-center"
							decoding="async"
							loading="lazy"
						/>
					) : burnableImagePending ? (
						<div className="flex aspect-[16/10] max-h-80 flex-col items-center justify-center gap-2.5 px-6 text-center">
							<div className="flex size-14 items-center justify-center rounded-2xl bg-muted/45 text-muted-foreground ring-1 ring-border/55">
								<FileImage className="size-7 opacity-85" strokeWidth={1.5} />
							</div>
							<p className="max-w-[16rem] text-sm leading-relaxed text-muted-foreground">
								{t('view.image_preview_after_download')}
							</p>
						</div>
					) : null}
				</div>
			) : null}
			<div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
				<div className="flex min-w-0 flex-1 items-start gap-3">
					<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/65 text-accent-foreground shadow-[0_1px_0_hsl(var(--foreground)/0.05)]">
						<FileIcon className="size-5" strokeWidth={1.75} />
					</div>
					<div className="min-w-0 space-y-0.5">
						<span className="section-label">{t('view.attachment')}</span>
						<p className="truncate text-sm font-medium leading-snug text-foreground">
							{name}
						</p>
						<p className="text-xs text-muted-foreground">
							{formatMimeLabel(mime)} · {formatBytes(size)}
						</p>
					</div>
				</div>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							size="icon"
							variant="outline"
							className="size-10 shrink-0 rounded-xl border-border/75 bg-background/80 hover:bg-accent/25"
							disabled={disabled}
							onClick={onDownload}
							aria-label={t('view.download_attachment')}
						>
							<Download className="size-4" strokeWidth={2} />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="left">
						{downloading
							? `${t('common.loading')}…`
							: t('view.download_attachment')}
					</TooltipContent>
				</Tooltip>
			</div>
		</div>
	);
}
