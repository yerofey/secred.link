/** Dev-only Performance API timings for secret submit. */
export async function devMeasureAsync<T>(
	name: string,
	run: () => Promise<T>,
): Promise<T> {
	if (!import.meta.env.DEV) {
		return run();
	}
	const start = `${name}:start`;
	const end = `${name}:end`;
	performance.mark(start);
	try {
		return await run();
	} finally {
		performance.mark(end);
		performance.measure(name, start, end);
		const [measure] = performance.getEntriesByName(name);
		if (measure && 'duration' in measure) {
			console.debug(`[secred] ${name}: ${measure.duration.toFixed(0)} ms`);
		}
		performance.clearMarks(start);
		performance.clearMarks(end);
		performance.clearMeasures(name);
	}
}
