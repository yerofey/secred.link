/** Strip line and block comments so wrangler.jsonc can be parsed as JSON. */
export function stripJsoncComments(source: string): string {
	let out = '';
	let i = 0;
	while (i < source.length) {
		const ch = source[i];
		if (ch === '"') {
			out += ch;
			i += 1;
			while (i < source.length) {
				const c = source[i];
				out += c;
				i += 1;
				if (c === '\\' && i < source.length) {
					out += source[i];
					i += 1;
					continue;
				}
				if (c === '"') {
					break;
				}
			}
			continue;
		}
		if (ch === '/' && source[i + 1] === '/') {
			i += 2;
			while (i < source.length && source[i] !== '\n') {
				i += 1;
			}
			continue;
		}
		if (ch === '/' && source[i + 1] === '*') {
			i += 2;
			while (
				i < source.length &&
				!(source[i] === '*' && source[i + 1] === '/')
			) {
				i += 1;
			}
			i += 2;
			continue;
		}
		out += ch;
		i += 1;
	}
	return out;
}

export function parseWranglerJsonc(source: string): unknown {
	return JSON.parse(stripJsoncComments(source));
}
