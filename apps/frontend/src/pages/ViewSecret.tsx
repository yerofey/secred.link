import {
	decryptAttachmentBytes,
	decryptSecretPayload,
	type GetSecretResponse,
	getAccessKeyHashes,
	getManageKeyHash,
	isLegacyAccessKey,
	type LocalSecret,
	type ParsedSecretPayload,
	parseDecryptedPayload,
} from '@secred/shared';
import {
	CheckCircle2,
	CloudOff,
	LockKeyhole,
	Trash2,
	XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MarkdownContent } from '@/components/MarkdownContent';
import { PasswordInput } from '@/components/PasswordInput';
import { SecretAttachmentCard } from '@/components/SecretAttachmentCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { api } from '@/lib/api';
import { isPreviewableImageMime } from '@/lib/attachmentPreview';
import { useI18n } from '@/lib/i18n';
import {
	getSecretStorageKey,
	readLocalSecret,
	saveLocalSecret,
	secretStorage,
} from '@/lib/storage';
import { formatDateTime } from '@/lib/time';
import { cn } from '@/lib/utils';

function ViewSecretSkeleton() {
	const { t } = useI18n();
	return (
		<div className="page-shell mx-auto max-w-5xl" aria-busy="true">
			<span className="sr-only">{t('common.loading')}</span>
			<div className="page-intro mx-auto max-w-2xl pt-2 sm:pt-6">
				<span className="page-kicker">Secred</span>
				<div className="skeleton-line mx-auto h-12 w-48 sm:h-14" />
				<div className="skeleton-line mx-auto h-5 w-56" />
			</div>
			<Card className="relative rounded-[2rem] text-left">
				<CardContent className="grid gap-5 px-5 py-6 sm:px-7 sm:py-7">
					<div className="grid gap-3">
						<div className="skeleton-line h-4 w-24" />
						<div className="skeleton-line h-4 w-3/4" />
						<div className="skeleton-line h-4 w-2/3" />
					</div>
					<div className="skeleton-attachment">
						<div className="skeleton-icon" />
						<div className="grid flex-1 gap-2">
							<div className="skeleton-line h-3 w-32" />
							<div className="skeleton-line h-4 w-48 max-w-full" />
						</div>
						<div className="skeleton-line hidden h-9 w-40 sm:block" />
					</div>
				</CardContent>
			</Card>
			<div className="flex justify-center border-t border-border/40 pt-6">
				<div className="skeleton-line h-11 w-[6.25rem] rounded-2xl" />
			</div>
		</div>
	);
}

export function ViewSecret() {
	const { t } = useI18n();
	const location = useLocation();
	const accessKey = location.hash.slice(1);
	const keyData = useMemo(
		() => (isLegacyAccessKey(accessKey) ? getAccessKeyHashes(accessKey) : null),
		[accessKey],
	);
	const [item, setItem] = useState<GetSecretResponse['data'] | null>(null);
	const [localItem, setLocalItem] = useState<LocalSecret | null>(null);
	const [password, setPassword] = useState('');
	const [parsed, setParsed] = useState<ParsedSecretPayload | null>(null);
	const [passwordStatus, setPasswordStatus] = useState<
		'idle' | 'valid' | 'invalid'
	>('idle');
	const [isDeleted, setIsDeleted] = useState(false);
	const [isFound, setIsFound] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isDecrypting, setIsDecrypting] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);
	const [attachmentBurnToken, setAttachmentBurnToken] = useState<
		string | undefined
	>();
	const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<
		string | null
	>(null);
	const [attachmentPreviewState, setAttachmentPreviewState] = useState<
		'idle' | 'loading' | 'ready' | 'error'
	>('idle');
	const attachmentBytesRef = useRef<Uint8Array | null>(null);
	const attachmentFetchRef = useRef<Promise<Uint8Array> | null>(null);
	const previewUrlForUnmountRef = useRef<string | null>(null);
	previewUrlForUnmountRef.current = attachmentPreviewUrl;

	useEffect(() => {
		if (!keyData) {
			setIsLoading(false);
			return;
		}
		const local = readLocalSecret(keyData.sid);
		setLocalItem(local);
		api
			.getSecret(keyData.accessKeyHash2)
			.then((response) => {
				setItem(response.data);
				setAttachmentBurnToken(response.attachmentBurnToken);
				setIsFound(true);
				if (!local) {
					saveLocalSecret(
						{
							sid: keyData.sid,
							keys: { accessKey },
							isOwner: false,
							hasPassword: response.data.isProtected,
							isBurnable: response.data.isBurnable,
							timestamp: Date.now(),
							v: accessKey.slice(0, 1),
						},
						30 * 24 * 60 * 60,
					);
				}
			})
			.catch(() => {
				setIsFound(false);
				secretStorage().removeItem(getSecretStorageKey(keyData.sid));
			})
			.finally(() => setIsLoading(false));
	}, [accessKey, keyData]);

	useEffect(() => {
		attachmentBytesRef.current = null;
		attachmentFetchRef.current = null;
		setAttachmentPreviewUrl((prev) => {
			if (prev) {
				URL.revokeObjectURL(prev);
			}
			return null;
		});
		setAttachmentPreviewState('idle');
	}, [accessKey]);

	useEffect(() => {
		return () => {
			const u = previewUrlForUnmountRef.current;
			if (u) {
				URL.revokeObjectURL(u);
			}
		};
	}, []);

	const fetchDecryptedAttachment =
		useCallback(async (): Promise<Uint8Array> => {
			if (!keyData || !parsed?.attachment || !item) {
				throw new Error('missing');
			}
			if (attachmentBytesRef.current) {
				return attachmentBytesRef.current;
			}
			if (attachmentFetchRef.current) {
				return attachmentFetchRef.current;
			}
			const p = (async () => {
				try {
					const att = parsed.attachment;
					if (!att) {
						setAttachmentPreviewState('error');
						throw new Error('missing');
					}
					setAttachmentPreviewState('loading');
					const buf = await api.getSecretAttachment(
						keyData.accessKeyHash2,
						attachmentBurnToken,
					);
					const decrypted = await decryptAttachmentBytes(
						new Uint8Array(buf),
						item.isProtected ? password : '',
						accessKey,
					);
					setAttachmentBurnToken(undefined);
					const copy = new Uint8Array(decrypted.byteLength);
					copy.set(decrypted);
					attachmentBytesRef.current = copy;
					if (isPreviewableImageMime(att.mime)) {
						setAttachmentPreviewUrl((prev) => {
							if (prev) {
								URL.revokeObjectURL(prev);
							}
							return URL.createObjectURL(
								new Blob([new Uint8Array(copy)], { type: att.mime }),
							);
						});
					}
					setAttachmentPreviewState('ready');
					return copy;
				} catch {
					setAttachmentPreviewState('error');
					throw new Error('attachment_fetch_failed');
				} finally {
					attachmentFetchRef.current = null;
				}
			})();
			attachmentFetchRef.current = p;
			return p;
		}, [keyData, parsed, item, attachmentBurnToken, password, accessKey]);

	useEffect(() => {
		if (!parsed?.attachment || !item || !keyData) {
			return;
		}
		if (item.isBurnable) {
			return;
		}
		if (!isPreviewableImageMime(parsed.attachment.mime)) {
			return;
		}
		void fetchDecryptedAttachment().catch(() => {
			/* state set in fetch */
		});
	}, [
		parsed?.attachment?.mime,
		parsed?.attachment?.name,
		parsed?.attachment?.size,
		item,
		keyData,
		fetchDecryptedAttachment,
	]);

	const runUnlock = useCallback(
		async (inputPassword: string) => {
			if (!item) {
				return;
			}
			setIsDecrypting(true);
			try {
				const result = await decryptSecretPayload({
					contentHex: item.content,
					testHex: item.test,
					password: inputPassword,
					accessKey,
				});
				if (!result.ok) {
					setPasswordStatus('invalid');
					setParsed(null);
					return;
				}
				setPasswordStatus('valid');
				setParsed(parseDecryptedPayload(result.content));
			} finally {
				setIsDecrypting(false);
			}
		},
		[item, accessKey],
	);

	useEffect(() => {
		if (item && !item.isProtected) {
			void runUnlock('');
		}
	}, [item, runUnlock]);

	useEffect(() => {
		if (!keyData || !parsed?.attachment) {
			return;
		}
		const current = readLocalSecret(keyData.sid);
		if (!current || current.attachmentCount === 1) {
			return;
		}
		saveLocalSecret({ ...current, attachmentCount: 1 }, 30 * 24 * 60 * 60);
		setLocalItem({ ...current, attachmentCount: 1 });
	}, [keyData, parsed]);

	const downloadAttachment = async () => {
		if (!parsed?.attachment || !item) {
			return;
		}
		setIsDownloading(true);
		try {
			const bytes = await fetchDecryptedAttachment();
			const blob = new Blob([new Uint8Array(bytes)], {
				type: parsed.attachment.mime,
			});
			const url = URL.createObjectURL(blob);
			const anchor = document.createElement('a');
			anchor.href = url;
			anchor.download = parsed.attachment.name;
			anchor.click();
			URL.revokeObjectURL(url);
		} catch {
			/* surfaced via attachmentPreviewState */
		} finally {
			setIsDownloading(false);
		}
	};

	const deleteFromDevice = () => {
		if (keyData) {
			secretStorage().removeItem(getSecretStorageKey(keyData.sid));
		}
		setIsDeleted(true);
	};

	const deleteFromCloud = async () => {
		if (!keyData || !localItem?.keys.manageKey) {
			return;
		}
		if (!window.confirm(t('view.burn_confirm'))) {
			return;
		}
		await api.deleteSecret(
			keyData.accessKeyHash2,
			getManageKeyHash(localItem.keys.manageKey),
		);
		deleteFromDevice();
	};

	const showPreloadSkeleton =
		isLoading ||
		isDecrypting ||
		(item !== null &&
			!item.isProtected &&
			!parsed &&
			passwordStatus === 'idle');

	if (showPreloadSkeleton) {
		return <ViewSecretSkeleton />;
	}

	if (isDeleted) {
		return (
			<div className="page-shell mx-auto max-w-lg pb-12 pt-2 sm:pt-6">
				<div className="page-intro mx-auto max-w-md">
					<span className="page-kicker">Secred</span>
					<h1 className="page-title">{t('view.deleted_title')}</h1>
					<p className="page-subtitle">{t('view.deleted_subtitle')}</p>
				</div>
				<Card
					className={cn(
						'mx-auto mt-8 w-full overflow-hidden rounded-[1.75rem] border-border/80',
						'shadow-[0_22px_48px_hsl(var(--shadow-color)/0.08)]',
					)}
				>
					<div
						className="h-1 w-full bg-gradient-to-r from-primary/50 via-primary to-primary/60"
						aria-hidden
					/>
					<CardContent className="flex flex-col items-center gap-8 px-6 py-12 sm:px-10">
						<div className="flex size-16 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20">
							<CheckCircle2 className="size-9" strokeWidth={1.75} />
						</div>
						<Button variant="outline" className="rounded-xl" asChild>
							<Link to="/">{t('view.not_found_cta')}</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!isFound || !item) {
		return (
			<div className="page-shell mx-auto max-w-lg pb-12 pt-2 sm:pt-6">
				<div className="page-intro mx-auto max-w-md">
					<span className="page-kicker">Secred</span>
					<h1 className="page-title">{t('view.not_found_title')}</h1>
					<p className="page-subtitle">{t('view.not_found_subtitle')}</p>
				</div>
				<Card
					className={cn(
						'mx-auto mt-8 w-full overflow-hidden rounded-[1.75rem] border-border/80',
						'shadow-[0_22px_48px_hsl(var(--shadow-color)/0.08)]',
					)}
				>
					<div
						className="h-1 w-full bg-gradient-to-r from-muted-foreground/25 via-border to-muted-foreground/20"
						aria-hidden
					/>
					<CardContent className="flex flex-col items-center gap-8 px-6 py-12 sm:px-10">
						<div className="flex size-16 items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground ring-1 ring-border/80">
							<CloudOff className="size-8" strokeWidth={1.5} />
						</div>
						<Button className="rounded-xl" asChild>
							<Link to="/">{t('view.not_found_cta')}</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	const showSecretBody =
		parsed && (parsed.text.trim().length > 0 || parsed.attachment);
	const hasSecretText = Boolean(parsed?.text.trim().length);

	return (
		<div className="page-shell mx-auto max-w-5xl">
			<div className="page-intro mx-auto max-w-2xl pt-2 sm:pt-6">
				<span className="page-kicker">Secred</span>
				<h1 className="page-title">{t('common.secret')}</h1>
				<p className="page-subtitle">
					{t('view.created_at')}: {formatDateTime(item.creationDate)}
				</p>
			</div>
			{showSecretBody ? (
				<div className="view-secret-stack">
					{item.isBurnable ? (
						<span className="view-burn-badge">{t('view.burned')}!</span>
					) : null}
					{hasSecretText ? (
						<Card className="view-note-card text-left">
							<CardContent className="px-5 py-6 sm:px-7 sm:py-7">
								<MarkdownContent>{parsed.text}</MarkdownContent>
							</CardContent>
						</Card>
					) : null}
					{parsed?.attachment ? (
						<section
							className={cn(
								'view-attachment-island',
								!hasSecretText && 'view-attachment-island--solo',
							)}
							aria-label={t('view.attachment')}
						>
							<SecretAttachmentCard
								name={parsed.attachment.name}
								mime={parsed.attachment.mime}
								size={parsed.attachment.size}
								previewUrl={attachmentPreviewUrl}
								previewLoading={attachmentPreviewState === 'loading'}
								previewError={attachmentPreviewState === 'error'}
								isImage={isPreviewableImageMime(parsed.attachment.mime)}
								burnableImagePending={
									item.isBurnable &&
									isPreviewableImageMime(parsed.attachment.mime) &&
									!attachmentPreviewUrl &&
									attachmentPreviewState !== 'loading' &&
									attachmentPreviewState !== 'error'
								}
								onDownload={() => void downloadAttachment()}
								disabled={isDownloading}
								downloading={isDownloading}
							/>
						</section>
					) : null}
				</div>
			) : (
				<Card className="mx-auto w-full max-w-3xl rounded-[2rem]">
					<CardHeader className="gap-4">
						<div className="flex items-center gap-3">
							<div className="flex size-12 items-center justify-center rounded-[1.4rem] bg-accent/75 text-accent-foreground">
								<LockKeyhole className="size-5" />
							</div>
							<div className="grid gap-1">
								<span className="section-label">{t('view.unlock')}</span>
								<CardTitle className="text-2xl">
									{t('view.passphrase')}
								</CardTitle>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<form
							className="grid gap-3"
							onSubmit={(event) => {
								event.preventDefault();
								void runUnlock(password);
							}}
						>
							<div className="flex flex-col gap-3 sm:flex-row">
								<PasswordInput
									className="min-w-0 flex-1"
									autoFocus
									autoComplete="current-password"
									placeholder={t('view.passphrase')}
									value={password}
									aria-invalid={passwordStatus === 'invalid'}
									onChange={(event) => {
										setPassword(event.target.value);
										setPasswordStatus('idle');
									}}
								/>
								<Button type="submit" className="sm:min-w-36">
									{t('view.unlock')}
								</Button>
							</div>
							{passwordStatus === 'invalid' ? (
								<p className="text-left text-sm text-destructive">
									{t('common.error')}
								</p>
							) : null}
						</form>
					</CardContent>
				</Card>
			)}
			<footer className="mx-auto mt-8 flex max-w-5xl justify-center border-t border-border/40 pt-6 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
				<div className="inline-flex items-center gap-0.5 rounded-2xl border border-border/70 bg-muted/25 p-1 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.04)] backdrop-blur-[2px]">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								className="h-10 w-10 rounded-[0.65rem] p-0 text-muted-foreground hover:bg-background/90 hover:text-foreground [&_svg]:size-[1.15rem]"
								onClick={deleteFromDevice}
								aria-label={t('view.delete')}
							>
								<XCircle aria-hidden />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="top">{t('view.delete')}</TooltipContent>
					</Tooltip>
					{localItem?.keys.manageKey ? (
						<>
							<span
								className="mx-0.5 h-5 w-px shrink-0 bg-border/70"
								aria-hidden
							/>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										type="button"
										variant="ghost"
										className="h-10 w-10 rounded-[0.65rem] p-0 text-muted-foreground hover:bg-destructive/12 hover:text-destructive [&_svg]:size-[1.15rem]"
										onClick={() => void deleteFromCloud()}
										aria-label={t('view.burn')}
									>
										<Trash2 aria-hidden />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="top">{t('view.burn')}</TooltipContent>
							</Tooltip>
						</>
					) : null}
				</div>
			</footer>
		</div>
	);
}
