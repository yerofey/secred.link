export const formatDateTime = (value: string) =>
	new Intl.DateTimeFormat(undefined, {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	}).format(new Date(value));

export const relativeTime = (timestamp: number) => {
	const diffSeconds = Math.round((timestamp - Date.now()) / 1000);
	const abs = Math.abs(diffSeconds);
	const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
		['year', 31536000],
		['month', 2592000],
		['week', 604800],
		['day', 86400],
		['hour', 3600],
		['minute', 60],
		['second', 1],
	];
	const [unit, seconds] = units.find(
		([, unitSeconds]) => abs >= unitSeconds,
	) ?? ['second', 1];
	return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(
		Math.round(diffSeconds / seconds),
		unit,
	);
};
