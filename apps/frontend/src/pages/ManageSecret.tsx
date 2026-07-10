import type { LocalSecret } from '@secred/shared';
import {
	Check,
	Clipboard,
	Flame,
	Link2,
	LockKeyhole,
	Paperclip,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/lib/i18n';
import {
	getCurrentManageSecret,
	getManageIntroKeys,
	type ResolvedManageState,
} from '@/lib/manage-page-state';
import { readLocalSecret } from '@/lib/storage';
import { cn } from '@/lib/utils';

export function ManageSecret() {
	const { t } = useI18n();
	const location = useLocation();
	const sid = location.hash.slice(1);
	const [resolvedState, setResolvedState] =
		useState<ResolvedManageState<LocalSecret> | null>(null);
	const [isCopied, setIsCopied] = useState(false);

	useEffect(() => {
		setResolvedState({
			sid,
			secret: sid ? readLocalSecret(sid) : null,
		});
		setIsCopied(false);
	}, [sid]);

	const secret = getCurrentManageSecret(sid, resolvedState);

	const shareLink = secret?.keys.accessKey
		? `${window.location.origin}/view#${secret.keys.accessKey}`
		: '';

	useEffect(() => {
		if (!isCopied) {
			return;
		}
		const timer = window.setTimeout(() => setIsCopied(false), 2600);
		return () => window.clearTimeout(timer);
	}, [isCopied]);

	const copy = async () => {
		await navigator.clipboard.writeText(shareLink);
		setIsCopied(true);
	};

	if (secret === undefined) {
		return (
			<div className="page-shell mx-auto max-w-3xl pt-10 text-center text-sm text-muted-foreground">
				{t('common.loading')}...
			</div>
		);
	}

	const introKeys = getManageIntroKeys(secret !== null);

	return (
		<div className="page-shell mx-auto max-w-3xl pb-10">
			<div className="page-intro mx-auto max-w-xl pt-2 sm:pt-6">
				<span className="page-kicker">Secred</span>
				<h1 className="page-title">{t(introKeys.titleKey)}</h1>
				<p className="page-subtitle">{t(introKeys.subtitleKey)}</p>
			</div>
			{secret ? (
				<Card
					className={cn(
						'mx-auto w-full overflow-hidden rounded-[1.75rem] border-border/80',
						'shadow-[0_22px_48px_hsl(var(--shadow-color)/0.09)]',
					)}
				>
					<div
						className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary/70"
						aria-hidden
					/>
					<CardContent className="grid gap-6 p-6 sm:p-8">
						<div className="flex flex-wrap items-center gap-2">
							<span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
								<Link2 className="size-5" strokeWidth={2} />
							</span>
							<div className="flex min-w-0 flex-1 flex-wrap gap-2">
								{secret.hasPassword ? (
									<span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
										<LockKeyhole className="size-3.5" aria-hidden />
										{t('manage.badge_password')}
									</span>
								) : null}
								{secret.isBurnable ? (
									<span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
										<Flame className="size-3.5" aria-hidden />
										{t('manage.badge_burn')}
									</span>
								) : null}
								{(secret.attachmentCount ?? 0) > 0 ? (
									<span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
										<Paperclip className="size-3.5" aria-hidden />
										{t('manage.badge_attachment')}
									</span>
								) : null}
							</div>
						</div>

						<div className="grid gap-3">
							<Label
								htmlFor="share-link"
								className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
							>
								{t('manage.share_link')}
							</Label>
							<div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
								<Input
									id="share-link"
									readOnly
									value={shareLink}
									onFocus={(event) => event.currentTarget.select()}
									className="h-12 min-h-12 min-w-0 flex-1 font-mono text-[0.8125rem] leading-normal text-foreground"
								/>
								<Button
									type="button"
									variant={isCopied ? 'secondary' : 'default'}
									className="h-12 shrink-0 px-6 font-semibold sm:min-w-[10.5rem]"
									onClick={() => void copy()}
									aria-label={t('manage.copy_aria')}
								>
									{isCopied ? (
										<>
											<Check className="mr-2 size-4" aria-hidden />
											{t('manage.copied')}
										</>
									) : (
										<>
											<Clipboard className="mr-2 size-4" aria-hidden />
											{t('manage.copy_link')}
										</>
									)}
								</Button>
							</div>
							<p className="text-sm leading-relaxed text-muted-foreground">
								{t('manage.hint')}
							</p>
						</div>

						<div className="flex flex-wrap gap-3 border-t border-border/60 pt-6">
							<Button variant="outline" className="rounded-xl" asChild>
								<Link to="/">{t('manage.create_another')}</Link>
							</Button>
							<Button
								variant="ghost"
								className="rounded-xl text-muted-foreground"
								asChild
							>
								<Link to="/storage">{t('storage.title')}</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			) : (
				<Card className="mx-auto w-full max-w-xl rounded-[1.75rem] border-dashed">
					<CardContent className="grid gap-6 py-12 text-center">
						<div className="flex flex-wrap justify-center gap-3">
							<Button asChild>
								<Link to="/">{t('manage.not_found_cta')}</Link>
							</Button>
							<Button variant="outline" asChild>
								<Link to="/storage">{t('storage.title')}</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
