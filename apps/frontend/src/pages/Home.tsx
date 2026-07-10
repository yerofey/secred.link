import {
	DEFAULT_SECRET_LIFETIME_SECONDS,
	DEFAULT_TEST_STRING,
	DEFAULT_VERSION_PREFIX,
	EXPIRATION_PRESETS,
	MAX_ATTACHMENT_BYTES,
	MAX_SECRET_LENGTH,
} from '@secred/shared';
import type { Editor } from '@tiptap/core';
import { FileText, Paperclip, X } from 'lucide-react';
import {
	lazy,
	Suspense,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { SecretCreateAction } from '@/components/SecretCreateAction';
import { SecretOptionsPanel } from '@/components/SecretOptionsPanel';
import { api } from '@/lib/api';
import { createHomeSubmitBindings } from '@/lib/home-submit-bindings';
import { useI18n } from '@/lib/i18n';
import { buildCreateSecretPayloadForSubmit } from '@/lib/secret-create-payload';
import type { ApiStatus, SubmitPhase } from '@/lib/secret-create-view-state';
import { getSecretEditorFooterLayout } from '@/lib/secret-editor-footer-layout';
import { buildSecretOptionsSummary } from '@/lib/secret-options-summary';
import { devMeasureAsync } from '@/lib/secret-submit-perf';
import { saveLocalSecret } from '@/lib/storage';
import { cn } from '@/lib/utils';

const HomeEditorField = lazy(() =>
	import('@/components/HomeEditorField').then((m) => ({
		default: m.HomeEditorField,
	})),
);

function formatBytes(n: number): string {
	if (n < 1024) {
		return `${n} B`;
	}
	if (n < 1024 * 1024) {
		return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`;
	}
	return `${(n / (1024 * 1024)).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

export function Home() {
	const { t, timeUnit } = useI18n();
	const navigate = useNavigate();
	const [apiStatus, setApiStatus] = useState<ApiStatus>('pending');
	const [rawEditing, setRawEditing] = useState(false);
	const [content, setContent] = useState('');
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [password, setPassword] = useState('');
	const [lifetime, setLifetime] = useState(DEFAULT_SECRET_LIFETIME_SECONDS);
	const [isBurnable, setIsBurnable] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitPhase, setSubmitPhase] = useState<SubmitPhase>('idle');
	const [hasSubmitError, setHasSubmitError] = useState(false);
	const submitInFlightRef = useRef(false);
	const [attachment, setAttachment] = useState<File | null>(null);
	const [richEditor, setRichEditor] = useState<Editor | null>(null);
	const attachmentInputRef = useRef<HTMLInputElement>(null);

	const checkHealth = useCallback(async () => {
		setApiStatus('pending');
		try {
			await api.health();
			setApiStatus('ok');
		} catch {
			setApiStatus('error');
		}
	}, []);

	useEffect(() => {
		void checkHealth();
	}, [checkHealth]);

	const submit = async () => {
		if (submitInFlightRef.current) {
			return;
		}
		const hasText = content.trim().length > 0;
		if (
			apiStatus !== 'ok' ||
			(!hasText && !attachment) ||
			(attachment !== null && attachment.size > MAX_ATTACHMENT_BYTES)
		) {
			return;
		}

		submitInFlightRef.current = true;
		setHasSubmitError(false);
		setIsSubmitting(true);
		setSubmitPhase('encrypt');
		try {
			let attachmentArg:
				| { bytes: Uint8Array; name: string; mime: string }
				| undefined;
			if (attachment) {
				const buffer = await attachment.arrayBuffer();
				attachmentArg = {
					bytes: new Uint8Array(buffer),
					name: attachment.name,
					mime: attachment.type || 'application/octet-stream',
				};
			}
			const payload = await devMeasureAsync('secret:build', () =>
				buildCreateSecretPayloadForSubmit(
					{
						text: content,
						password,
						lifetime,
						isBurnable,
						versionPrefix: DEFAULT_VERSION_PREFIX,
						testString: DEFAULT_TEST_STRING,
						attachment: attachmentArg,
					},
					{ attachmentFile: attachment },
				),
			);

			setSubmitPhase('save');
			await devMeasureAsync('secret:api:create', () =>
				api.createSecret(payload.request),
			);

			const attachmentCipher = payload.attachmentCipher;
			const attachmentUploadToken = payload.attachmentUploadToken;
			if (attachmentCipher && attachmentUploadToken) {
				setSubmitPhase('file');
				await devMeasureAsync('secret:upload', () =>
					api.uploadSecretAttachment(
						payload.request.accessKey,
						attachmentUploadToken,
						attachmentCipher,
					),
				);
			}
			saveLocalSecret(payload.localSecret, lifetime);
			navigate({ pathname: '/manage', hash: payload.sid });
		} catch {
			setHasSubmitError(true);
		} finally {
			submitInFlightRef.current = false;
			setIsSubmitting(false);
			setSubmitPhase('idle');
		}
	};

	const hasText = content.trim().length > 0;
	const hasAttachment = attachment !== null;
	const attachmentTooLarge =
		attachment !== null && attachment.size > MAX_ATTACHMENT_BYTES;
	const hasPayload = hasText || hasAttachment;
	const footerLayout = getSecretEditorFooterLayout({
		hasAttachment,
		hasError: attachmentTooLarge,
	});
	const submitBindings = createHomeSubmitBindings(submit);

	const isAtMaxLength = content.length >= MAX_SECRET_LENGTH;
	const isNearMaxLength = content.length >= Math.floor(MAX_SECRET_LENGTH * 0.9);
	const selectedLifetime =
		EXPIRATION_PRESETS.find((option) => option.value === lifetime) ??
		EXPIRATION_PRESETS[EXPIRATION_PRESETS.length - 1];
	const expirationLabel = selectedLifetime
		? `${selectedLifetime.count} ${timeUnit(
				selectedLifetime.unit,
				selectedLifetime.count,
			)}`
		: t('home.rail.none');
	const passwordEnabled = password.length > 0;
	const compactSummary = buildSecretOptionsSummary(
		{
			expiration: expirationLabel,
			passwordEnabled,
			burnEnabled: isBurnable,
			attachmentSize: attachment ? formatBytes(attachment.size) : undefined,
		},
		{
			password: t('home.form.summary_password'),
			burn: t('home.form.summary_burn'),
			on: t('home.form.summary_on'),
			off: t('home.form.summary_off'),
		},
	);

	return (
		<form
			className="page-shell home-page pb-6"
			onSubmit={(event) => {
				event.preventDefault();
				void submitBindings.onSubmit();
			}}
		>
			<div className="page-intro home-page-intro mx-auto max-w-3xl pt-2 sm:pt-4">
				<h1 className="page-title">{t('home.title')}</h1>
				<p className="page-subtitle">{t('home.reassurance')}</p>
			</div>
			<div className="home-form-surface mx-auto w-full">
				<div className="home-composer-grid">
					<div className="home-editor-column">
						<Suspense
							fallback={
								<div
									className="min-h-0 flex-1 animate-pulse rounded-[1.6rem] border border-input/40 bg-surface-muted/40"
									aria-hidden
								/>
							}
						>
							<HomeEditorField
								content={content}
								onContentChange={setContent}
								rawEditing={rawEditing}
								onRawEditingChange={setRawEditing}
								richEditor={richEditor}
								onRichEditor={setRichEditor}
								textareaRef={textareaRef}
								t={t}
								footer={
									<div
										className="secret-editor-footer"
										data-layout={footerLayout}
									>
										<input
											ref={attachmentInputRef}
											type="file"
											className="sr-only"
											id="secret-attachment"
											onChange={(event) => {
												const file = event.target.files?.[0];
												setAttachment(file ?? null);
											}}
										/>
										<div className="secret-editor-footer__main">
											<label
												htmlFor="secret-attachment"
												className="dock-action"
											>
												<Paperclip className="size-4" />
												<span>{t('home.form.attach')}</span>
											</label>
											{attachment ? (
												<span
													className={cn(
														'file-chip',
														attachmentTooLarge && 'file-chip--danger',
													)}
												>
													<FileText className="size-4" />
													<span className="file-chip__text">
														<span className="file-chip__name">
															{attachment.name}
														</span>
														<span className="file-chip__meta">
															{formatBytes(attachment.size)}
														</span>
													</span>
													<button
														type="button"
														aria-label={t('home.form.remove_file')}
														onClick={() => {
															setAttachment(null);
															if (attachmentInputRef.current) {
																attachmentInputRef.current.value = '';
															}
														}}
													>
														<X className="size-4" />
													</button>
												</span>
											) : null}
										</div>
										<div className="secret-editor-footer__meta">
											<span
												className={cn(
													'editor-count',
													isNearMaxLength && 'editor-count--warn',
													isAtMaxLength && 'editor-count--max',
												)}
											>
												{content.length}/{MAX_SECRET_LENGTH}{' '}
												{t('home.form.characters')}
											</span>
										</div>
										{attachmentTooLarge ? (
											<p className="secret-editor-footer__error">
												{t('home.form.file_too_large')}
											</p>
										) : null}
									</div>
								}
							/>
						</Suspense>
					</div>
					<aside
						className="side-rail"
						aria-label={t('home.form.options_summary')}
					>
						<SecretOptionsPanel
							password={password}
							onPasswordChange={setPassword}
							lifetime={lifetime}
							onLifetimeChange={setLifetime}
							isBurnable={isBurnable}
							onBurnableChange={setIsBurnable}
							summary={compactSummary}
						/>
						<SecretCreateAction
							apiStatus={apiStatus}
							hasPayload={hasPayload}
							isSubmitting={isSubmitting}
							submitPhase={submitPhase}
							attachmentTooLarge={attachmentTooLarge}
							hasSubmitError={hasSubmitError}
							summary={compactSummary}
							onRetryHealth={() => void checkHealth()}
							onRetrySubmit={submitBindings.onRetrySubmit}
						/>
					</aside>
				</div>
			</div>
		</form>
	);
}
