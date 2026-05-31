import { Bookmark, Moon, Sun } from 'lucide-react';
import { Suspense } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { LocaleSelect } from '@/components/LocaleSelect';
import { RoutePageFallback } from '@/components/RoutePageFallback';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/lib/i18n';

export function Layout() {
	const { theme, setTheme } = useTheme();
	const { t } = useI18n();

	return (
		<TooltipProvider delayDuration={350}>
			<div className="app-shell flex min-h-dvh flex-col">
				<header className="px-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] sm:px-6 sm:pt-[calc(1.5rem+env(safe-area-inset-top,0px))]">
					<div className="editorial-surface mx-auto flex w-full max-w-5xl items-center justify-between rounded-[1.75rem] px-3 py-2.5 sm:px-5 sm:py-3">
						<div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
							<Link
								to="/"
								className="flex min-w-0 items-center gap-2.5 rounded-full pr-1.5 transition-opacity hover:opacity-90 sm:gap-3 sm:pr-2"
							>
								<img
									src="/img/icons/secred-note.svg"
									alt=""
									className="h-9 w-9 shrink-0 rounded-[0.85rem] shadow-[0_10px_24px_hsl(var(--primary)/0.24)]"
								/>
								<div className="grid min-w-0 gap-0.5">
									<span className="text-lg font-bold tracking-[-0.03em] text-foreground">
										Secred
									</span>
									<span className="hidden text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground sm:block">
										{t('home.form.create')}
									</span>
								</div>
							</Link>
							<button
								type="button"
								className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-border/70 bg-surface/80 text-muted-foreground shadow-sm transition-colors hover:bg-accent/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								aria-label="Toggle theme"
								onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
							>
								{theme === 'dark' ? (
									<Sun className="size-4 shrink-0" />
								) : (
									<Moon className="size-4 shrink-0" />
								)}
							</button>
						</div>
						<div className="flex items-center gap-2">
							<LocaleSelect />
							<Button
								asChild
								variant="outline"
								size="icon"
								aria-label="Saved secrets"
							>
								<Link to="/storage" className="rounded-full">
									<Bookmark />
								</Link>
							</Button>
						</div>
					</div>
				</header>
				<main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
					<Suspense fallback={<RoutePageFallback />}>
						<Outlet />
					</Suspense>
				</main>
				<footer className="px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
					<div className="editorial-surface mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-4 rounded-[1.5rem] px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:px-5">
						<div className="text-center sm:text-left">
							<p className="font-medium text-foreground">Secred</p>
							<p className="text-sm text-muted-foreground">
								{t('home.subtitle')}
							</p>
						</div>
						<a
							className="inline-flex min-h-11 min-w-[2.75rem] items-center justify-center rounded-full px-4 py-2 transition-colors hover:bg-accent/60 hover:text-foreground"
							href="https://github.com/yerofey/secred.link"
						>
							GitHub
						</a>
					</div>
				</footer>
			</div>
		</TooltipProvider>
	);
}
