import { describe, expect, test } from 'bun:test';

const styles = await Bun.file(
	new URL('../apps/frontend/src/styles.css', import.meta.url),
).text();

const reducedMotionStyles = styles.slice(
	styles.indexOf('@media (prefers-reduced-motion: reduce)'),
);

describe('reduced-motion CSS', () => {
	test('preserves layout transforms while cancelling decorative movement', () => {
		const transformNoneSelectors = Array.from(
			reducedMotionStyles.matchAll(
				/([^{}]+)\{[^{}]*transform:\s*none;[^{}]*\}/g,
			),
			(match) => match[1] ?? '',
		).join('\n');

		expect(transformNoneSelectors).not.toContain('.app-shell button');
		expect(transformNoneSelectors).not.toContain('.app-shell a');
		expect(reducedMotionStyles).toMatch(
			/\.app-shell button:hover,[\s\S]*?translate:\s*none;\s*scale:\s*none;/,
		);
		expect(reducedMotionStyles).toContain(
			'.app-shell .editorial-surface:hover',
		);
	});
});
