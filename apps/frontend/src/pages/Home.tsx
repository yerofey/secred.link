import {
	DEFAULT_SECRET_LIFETIME_SECONDS,
	DEFAULT_TEST_STRING,
	DEFAULT_VERSION_PREFIX,
	EXPIRATION_OPTIONS,
	MAX_ATTACHMENT_BYTES,
	MAX_PASSWORD_LENGTH,
	MAX_SECRET_LENGTH,
} from '@secred/shared';
import type { Editor } from '@tiptap/core';
import {
	ChevronDown,
	FileText,
	Flame,
	KeyRound,
	LockKeyhole,
	Paperclip,
	PlusCircle,
	X,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExpirationSelect } from '@/components/ExpirationSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMediaQuery } from '@/hooks/use-media-query';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { getPasswordStrength } from '@/lib/passwordStrength';
import { buildCreateSecretPayloadForSubmit } from '@/lib/secret-create-payload';
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
	const [apiStatus, setApiStatus] = useState<'pending' | 'ok' | 'error'>(
		'pending',
	);
	const [rawEditing, setRawEditing] = useState(false);
	const [content, setContent] = useState('');
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [password, setPassword] = useState('');
	const [lifetime, setLifetime] = useState(DEFAULT_SECRET_LIFETIME_SECONDS);
	const [isBurnable, setIsBurnable] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitPhase, setSubmitPhase] = useState<
		'idle' | 'encrypt' | 'save' | 'file'
	>('idle');
	const submitInFlightRef = useRef(false);
	const [attachment, setAttachment] = useState<File | null>(null);
	const [optionalSettingsOpen, setOptionalSettingsOpen] = useState(false);
	const [richEditor, setRichEditor] = useState<Editor | null>(null);
	const attachmentInputRef = useRef<HTMLInputElement>(null);
	const isWideHomeLayout = useMediaQuery('(min-width: 1280px)');

	useEffect(() => {
		api
			.health()
			.then(() => setApiStatus('ok'))
			.catch(() => setApiStatus('error'));
	}, []);

	const submit = async () => {
		if (submitInFlightRef.current) {
			return;
		}
		const hasText = content.trim().length > 0;
		if ((!hasText && !attachment) || apiStatus === 'error') {
			return;
		}
		if (attachment && attachment.size > MAX_ATTACHMENT_BYTES) {
			return;
		}

		submitInFlightRef.current = true;
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
	const disabled =
		!hasPayload || isSubmitting || apiStatus === 'error' || attachmentTooLarge;

	const isAtMaxLength = content.length >= MAX_SECRET_LENGTH;
	const isNearMaxLength = content.length >= Math.floor(MAX_SECRET_LENGTH * 0.9);
	const selectedLifetime = EXPIRATION_OPTIONS.find(
		(option) => option.value === lifetime,
	);
	const expirationLabel = selectedLifetime
		? `${selectedLifetime.count} ${timeUnit(
				selectedLifetime.unit,
				selectedLifetime.count,
			)}`
		: t('home.rail.none');
	const passwordEnabled = password.length > 0;
	const submitActionLabel = !isSubmitting
		? t('home.form.create')
		: submitPhase === 'encrypt'
			? `${t('home.form.phase_encrypting')}…`
			: submitPhase === 'save'
				? `${t('home.form.phase_saving')}…`
				: submitPhase === 'file'
					? `${t('home.form.phase_uploading_file')}…`
					: `${t('home.form.creating')}…`;

	const submitHint = (() => {
		if (apiStatus === 'error') {
			return t('home.form.submit_api_unavailable');
		}
		if (attachmentTooLarge) {
			return t('home.form.submit_file_too_large');
		}
		if (!hasPayload) {
			return t('home.form.submit_empty');
		}
		return t('home.form.submit_ready');
	})();
	const compactSummary = [
		expirationLabel,
		passwordEnabled ? t('home.rail.protected_short') : undefined,
		isBurnable ? t('home.rail.on') : undefined,
		attachment ? formatBytes(attachment.size) : undefined,
	]
		.filter(Boolean)
		.join(' · ');

	return (
		<form
			className="page-shell mx-auto max-w-5xl pb-6 max-lg:pb-10 2xl:max-w-7xl"
			onSubmit={(event) => {
				event.preventDefault();
				void submit();
			}}
		>
			<div className="page-intro mx-auto max-w-3xl pt-2 sm:pt-6">
				<span className="page-kicker">Secred</span>
				<h1 className="page-title">{t('home.title')}</h1>
			</div>
			<div className="home-form-surface mx-auto w-full max-w-5xl 2xl:max-w-7xl">
				<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(17.5rem,18.75rem)] xl:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] xl:gap-8">
					<div className="grid gap-5">
						{apiStatus === 'error' ? (
							<div className="status-banner" data-tone="danger">
								<strong>{t('common.error')}</strong>
								<p className="text-sm leading-6 text-destructive">
									{t('home.api.unavailable')}
								</p>
							</div>
						) : null}
						<div className="grid gap-3">
							<Suspense
								fallback={
									<div
										className="min-h-[min(24rem,64dvh)] animate-pulse rounded-[1.6rem] border border-input/40 bg-surface-muted/40"
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
									apiDisabled={apiStatus === 'error'}
									t={t}
									footer={
										<div className="secret-editor-footer">
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
					</div>
					<div className="side-rail lg:sticky lg:top-6 lg:self-start xl:top-8">
						<div className="rail-card xl:p-5">
							{isWideHomeLayout ? (
								<div className="mb-4 flex items-center gap-3 border-b border-border/45 pb-3">
									<LockKeyhole
										className="size-4 shrink-0 text-primary"
										aria-hidden
									/>
									<h2
										id="optional-settings-heading"
										className="section-label m-0 flex-1 text-left"
									>
										{t('home.form.optional')}
									</h2>
								</div>
							) : (
								<button
									type="button"
									className={cn(
										'rail-card-toggle',
										optionalSettingsOpen && 'rail-card-toggle--open',
									)}
									onClick={() => setOptionalSettingsOpen((open) => !open)}
									aria-expanded={optionalSettingsOpen}
									aria-controls="optional-settings-panel"
								>
									<LockKeyhole
										className="size-4 shrink-0 text-primary"
										aria-hidden
									/>
									<span
										id="optional-settings-heading"
										className="section-label min-w-0 flex-1 text-left"
									>
										{t('home.form.optional')}
									</span>
									<ChevronDown
										className={cn(
											'size-5 shrink-0 text-muted-foreground transition-transform duration-200',
											optionalSettingsOpen && 'rotate-180',
										)}
										aria-hidden
									/>
								</button>
							)}
							<section
								id="optional-settings-panel"
								className="setup-controls"
								aria-labelledby="optional-settings-heading"
								hidden={!optionalSettingsOpen && !isWideHomeLayout}
							>
								<div className="setup-field">
									<div className="setup-field-label-row">
										<KeyRound className="size-4 shrink-0" aria-hidden />
										<Label
											htmlFor="password"
											className="text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-muted-foreground"
										>
											{t('home.form.password')}
										</Label>
									</div>
									<Input
										id="password"
										type="text"
										placeholder={t('home.form.passphrase')}
										autoComplete="off"
										maxLength={MAX_PASSWORD_LENGTH}
										value={password}
										onChange={(event) => setPassword(event.target.value)}
										aria-describedby={
											password ? 'password-strength-hint' : undefined
										}
									/>
									{(() => {
										const tier = getPasswordStrength(password);
										if (!tier) {
											return null;
										}
										const hint =
											tier === 'weak'
												? t('home.form.password_strength_weak')
												: tier === 'fair'
													? t('home.form.password_strength_fair')
													: t('home.form.password_strength_strong');
										return (
											<p
												id="password-strength-hint"
												className={cn(
													'text-xs leading-relaxed text-muted-foreground',
													tier === 'weak' &&
														'text-amber-700 dark:text-amber-400',
												)}
											>
												{hint}
											</p>
										);
									})()}
								</div>
								<ExpirationSelect
									value={lifetime}
									disabled={apiStatus === 'error'}
									onChange={setLifetime}
								/>
								<label
									className="setup-field setup-field--switch"
									htmlFor="burnable"
								>
									<span className="setup-switch-main">
										<Flame className="size-4 shrink-0" aria-hidden />
										<span>{t('home.form.burnable')}</span>
									</span>
									<input
										id="burnable"
										type="checkbox"
										className="switch-control"
										checked={isBurnable}
										onChange={(event) =>
											setIsBurnable(event.currentTarget.checked)
										}
									/>
								</label>
							</section>
						</div>
						<Button
							type="submit"
							size="default"
							className="w-full"
							disabled={disabled}
						>
							<PlusCircle />
							{submitActionLabel}
						</Button>
						<p
							className={cn(
								'form-submit-note',
								attachmentTooLarge && 'form-submit-note--danger',
							)}
						>
							{submitHint}
							{hasPayload && !attachmentTooLarge && compactSummary
								? ` · ${compactSummary}`
								: ''}
						</p>
					</div>
				</div>
			</div>
		</form>
	);
}
