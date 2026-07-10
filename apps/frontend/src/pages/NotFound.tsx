import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';

export function NotFound() {
	const { t } = useI18n();

	return (
		<div className="page-shell mx-auto max-w-lg pb-12 pt-2 sm:pt-6">
			<div className="page-intro mx-auto max-w-md">
				<span className="page-kicker">Secred</span>
				<h1 className="page-title">{t('not_found_page.title')}</h1>
				<p className="page-subtitle">{t('not_found_page.description')}</p>
			</div>
			<Card className="not-found-card mx-auto mt-8 w-full rounded-[1.75rem] border-dashed">
				<CardContent className="flex justify-center px-6 py-12">
					<Button className="rounded-xl" asChild>
						<Link to="/">{t('not_found_page.cta')}</Link>
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
