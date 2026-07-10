export type ResolvedManageState<T> = {
	sid: string;
	secret: T | null;
};

export function getCurrentManageSecret<T>(
	currentSid: string,
	resolvedState: ResolvedManageState<T> | null,
) {
	return resolvedState?.sid === currentSid ? resolvedState.secret : undefined;
}

export function getManageIntroKeys(hasSecret: boolean) {
	return hasSecret
		? { titleKey: 'manage.headline', subtitleKey: 'manage.subtitle' }
		: {
				titleKey: 'manage.not_found_headline',
				subtitleKey: 'manage.not_found',
			};
}
