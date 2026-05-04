import { useI18n } from '@/lib/i18n';

/** Skeleton shown while a lazy route chunk loads — keeps Layout chrome; replaces main `<Outlet />` only. */
export function RoutePageFallback() {
	const { t } = useI18n();
	return (
		<div className="page-shell mx-auto w-full max-w-5xl" aria-busy="true">
			<span className="sr-only">{t('common.loading')}</span>
			<div className="page-intro mx-auto max-w-2xl pt-2 sm:pt-6">
				<span className="page-kicker">Secred</span>
				<div className="skeleton-line mx-auto h-12 w-48 sm:h-14" />
				<div className="skeleton-line mx-auto mt-2 h-5 w-56" />
			</div>
			<div className="editorial-surface mt-6 rounded-[2rem] border border-border/60 p-5 sm:p-7">
				<div className="grid gap-3">
					<div className="skeleton-line h-4 w-24" />
					<div className="skeleton-line h-4 w-full max-w-2xl" />
					<div className="skeleton-line h-4 w-full max-w-xl" />
					<div className="skeleton-line h-4 w-2/3" />
					<div className="skeleton-line h-4 w-4/5" />
				</div>
			</div>
		</div>
	);
}
