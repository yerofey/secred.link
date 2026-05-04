import type { LocalSecret } from '@secred/shared';
import { Clock3, Inbox, Lock, Paperclip, Trash2, Unlock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { secretStorage } from '@/lib/storage';
import { relativeTime } from '@/lib/time';

export function Storage() {
	const { t } = useI18n();
	const [items, setItems] = useState<LocalSecret[]>([]);

	const refresh = () => {
		const values = Object.values(
			secretStorage().getAllItems<LocalSecret>('secret_'),
		).sort((a, b) => b.timestamp - a.timestamp);
		setItems(values);
	};

	useEffect(() => {
		refresh();
	}, []);

	const clear = () => {
		secretStorage().removeAllItems('secret_');
		refresh();
	};

	return (
		<div className="page-shell mx-auto max-w-5xl">
			<div className="page-intro mx-auto max-w-2xl pt-2 sm:pt-6">
				<span className="page-kicker">Secred</span>
				<h1 className="page-title">{t('storage.title')}</h1>
				<p className="page-subtitle">{t('storage.on_device')}.</p>
			</div>
			{items.length > 0 ? (
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{items.map((item) => (
						<Link
							key={item.sid}
							to={{ pathname: '/view', hash: item.keys.accessKey }}
						>
							<Card className="h-full rounded-[1.8rem] transition-transform duration-200 hover:-translate-y-1 hover:bg-accent/15">
								<CardHeader className="gap-4">
									<div className="flex items-start justify-between gap-4">
										<div className="grid gap-2">
											<span className="section-label">
												{t('common.secret')}
											</span>
											<CardTitle className="text-xl">
												{t('common.secret')}
											</CardTitle>
										</div>
										<div className="flex size-11 items-center justify-center rounded-2xl bg-surface-muted/70">
											{item.hasPassword ? (
												<Lock className="size-4" />
											) : (
												<Unlock className="size-4" />
											)}
										</div>
									</div>
								</CardHeader>
								<CardContent className="grid gap-4 text-sm text-muted-foreground">
									<div className="flex items-center gap-2">
										{item.hasPassword ? (
											<Lock className="size-4" />
										) : (
											<Unlock className="size-4" />
										)}
										<span>
											{item.hasPassword
												? t('storage.protected')
												: t('storage.not_protected')}
										</span>
									</div>
									<div className="flex items-center gap-2">
										<Clock3 className="size-4" />
										<span>{relativeTime(item.timestamp)}</span>
									</div>
									{item.attachmentCount && item.attachmentCount > 0 ? (
										<div className="flex items-center gap-2">
											<Paperclip className="size-4" />
											<span>
												{item.attachmentCount}{' '}
												{item.attachmentCount === 1
													? t('storage.attachment')
													: t('storage.attachments')}
											</span>
										</div>
									) : null}
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			) : (
				<div className="mx-auto grid w-full max-w-3xl gap-5">
					<Card className="rounded-[2rem] border-dashed border-muted-foreground/25 bg-surface/70">
						<CardContent className="flex flex-col items-center gap-5 px-6 py-14 text-center">
							<div className="flex size-16 items-center justify-center rounded-[1.6rem] bg-muted/75">
								<Inbox
									className="size-7 text-muted-foreground"
									strokeWidth={1.5}
									aria-hidden
								/>
							</div>
							<div className="grid max-w-sm gap-2">
								<p className="text-base font-medium text-foreground">
									{t('storage.empty')}
								</p>
								<p className="text-sm leading-relaxed text-muted-foreground">
									{t('storage.empty_hint')}
								</p>
							</div>
							<Button asChild size="sm">
								<Link to="/">{t('storage.empty_cta')}</Link>
							</Button>
						</CardContent>
					</Card>
					<p className="text-center text-sm text-muted-foreground">
						{t('storage.on_device')}.
					</p>
				</div>
			)}
			{items.length > 0 ? (
				<p className="text-center text-sm text-muted-foreground">
					{t('storage.on_device')}.
				</p>
			) : null}
			{items.length > 0 ? (
				<div className="flex justify-center">
					<Button type="button" variant="outline" size="sm" onClick={clear}>
						<Trash2 />
						{t('storage.clean')}
					</Button>
				</div>
			) : null}
		</div>
	);
}
