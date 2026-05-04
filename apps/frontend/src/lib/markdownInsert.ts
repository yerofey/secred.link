/** Insert or wrap markdown at the given selection. Returns new value + selection to restore. */

export type MarkdownInsertKind =
	| 'bold'
	| 'italic'
	| 'strike'
	| 'code'
	| 'link'
	| 'h2'
	| 'bullet'
	| 'ordered'
	| 'quote'
	| 'fence';

function lineStart(value: string, index: number): number {
	return value.lastIndexOf('\n', index - 1) + 1;
}

function blockRange(
	value: string,
	start: number,
	end: number,
): { bStart: number; bEnd: number } {
	const bStart = value.lastIndexOf('\n', start - 1) + 1;
	let bEnd = end;
	if (bEnd < value.length && value[bEnd] !== '\n') {
		const n = value.indexOf('\n', bEnd);
		bEnd = n === -1 ? value.length : n;
	}
	return { bStart, bEnd };
}

function prefixEachLine(
	value: string,
	start: number,
	end: number,
	prefix: string,
): { next: string; selStart: number; selEnd: number } {
	const { bStart, bEnd } = blockRange(value, start, end);
	const block = value.slice(bStart, bEnd);
	const lines = block.split('\n');
	const nextBlock = lines.map((line) => prefix + line).join('\n');
	const next = value.slice(0, bStart) + nextBlock + value.slice(bEnd);
	const delta = nextBlock.length - block.length;
	return {
		next,
		selStart: start,
		selEnd: end + delta,
	};
}

export function applyMarkdownInsert(
	value: string,
	start: number,
	end: number,
	kind: MarkdownInsertKind,
): { next: string; selStart: number; selEnd: number } {
	const sel = value.slice(start, end);

	switch (kind) {
		case 'bold': {
			const inner = sel || 'bold';
			const wrap = `**${inner}**`;
			const next = value.slice(0, start) + wrap + value.slice(end);
			if (!sel) {
				const mid = start + 2;
				return { next, selStart: mid, selEnd: mid + inner.length };
			}
			return {
				next,
				selStart: start + wrap.length,
				selEnd: start + wrap.length,
			};
		}
		case 'italic': {
			const inner = sel || 'italic';
			const wrap = `*${inner}*`;
			const next = value.slice(0, start) + wrap + value.slice(end);
			if (!sel) {
				const mid = start + 1;
				return { next, selStart: mid, selEnd: mid + inner.length };
			}
			return {
				next,
				selStart: start + wrap.length,
				selEnd: start + wrap.length,
			};
		}
		case 'strike': {
			const inner = sel || 'text';
			const wrap = `~~${inner}~~`;
			const next = value.slice(0, start) + wrap + value.slice(end);
			if (!sel) {
				const mid = start + 2;
				return { next, selStart: mid, selEnd: mid + inner.length };
			}
			return {
				next,
				selStart: start + wrap.length,
				selEnd: start + wrap.length,
			};
		}
		case 'code': {
			const inner = sel || 'code';
			const wrap = `\`${inner}\``;
			const next = value.slice(0, start) + wrap + value.slice(end);
			if (!sel) {
				const mid = start + 1;
				return { next, selStart: mid, selEnd: mid + inner.length };
			}
			return {
				next,
				selStart: start + wrap.length,
				selEnd: start + wrap.length,
			};
		}
		case 'link': {
			const text = sel || 'link text';
			const insert = `[${text}](https://)`;
			const next = value.slice(0, start) + insert + value.slice(end);
			const urlStart = start + text.length + 3;
			const urlEnd = urlStart + 'https://'.length;
			return { next, selStart: urlStart, selEnd: urlEnd };
		}
		case 'h2': {
			const ls = lineStart(value, start);
			const nl = value.indexOf('\n', ls);
			const lineEnd = nl === -1 ? value.length : nl;
			const line = value.slice(ls, lineEnd);
			if (line.startsWith('## ')) {
				const stripped = line.slice(3);
				const next = value.slice(0, ls) + stripped + value.slice(lineEnd);
				return { next, selStart: ls, selEnd: ls + stripped.length };
			}
			const insert = '## ';
			const next = value.slice(0, ls) + insert + value.slice(ls);
			const cursor = ls + insert.length + (start - ls);
			return { next, selStart: cursor, selEnd: cursor };
		}
		case 'bullet':
			return prefixEachLine(value, start, end, '- ');
		case 'ordered':
			return prefixEachLine(value, start, end, '1. ');
		case 'quote':
			return prefixEachLine(value, start, end, '> ');
		case 'fence': {
			if (sel) {
				const wrap = `\`\`\`\n${sel}\n\`\`\``;
				const next = value.slice(0, start) + wrap + value.slice(end);
				return {
					next,
					selStart: start + wrap.length,
					selEnd: start + wrap.length,
				};
			}
			const wrap = '```\ncode\n```';
			const next = value.slice(0, start) + wrap + value.slice(end);
			const mid = start + 4;
			const word = 'code';
			return { next, selStart: mid, selEnd: mid + word.length };
		}
	}
}
