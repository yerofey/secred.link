type Locale = 'en' | 'ru';

type DocumentMetaTarget = {
	title: string;
	documentElement: { lang: string };
};

const ROUTE_TITLE_KEYS: Record<string, string> = {
	'/': 'meta.home_title',
	'/manage': 'meta.manage_title',
	'/storage': 'meta.storage_title',
	'/view': 'meta.view_title',
};

export function getRouteTitleKey(pathname: string): string {
	const normalizedPathname = pathname.replace(/\/+$/, '') || '/';
	return ROUTE_TITLE_KEYS[normalizedPathname] ?? 'meta.not_found_title';
}

export function syncDocumentMeta(
	target: DocumentMetaTarget,
	pathname: string,
	locale: Locale,
	t: (key: string) => string,
): void {
	target.title = t(getRouteTitleKey(pathname));
	target.documentElement.lang = locale;
}
