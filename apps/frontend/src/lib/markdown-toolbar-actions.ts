import type { MarkdownInsertKind } from './markdownInsert';

export const ALL_TOOLBAR_ACTIONS = [
	'bold',
	'italic',
	'strike',
	'code',
	'link',
	'h2',
	'bullet',
	'ordered',
	'quote',
	'fence',
] as const satisfies readonly MarkdownInsertKind[];

export const MOBILE_PRIMARY_ACTIONS = [
	'bold',
	'italic',
	'link',
	'bullet',
] as const satisfies readonly MarkdownInsertKind[];

export const MOBILE_OVERFLOW_ACTIONS = [
	'strike',
	'code',
	'h2',
	'ordered',
	'quote',
	'fence',
] as const satisfies readonly MarkdownInsertKind[];

export const DESKTOP_TOOLBAR_GROUPS: readonly (readonly MarkdownInsertKind[])[] =
	[
		['bold', 'italic', 'strike', 'code'],
		['link', 'h2'],
		['bullet', 'ordered'],
		['quote', 'fence'],
	];
