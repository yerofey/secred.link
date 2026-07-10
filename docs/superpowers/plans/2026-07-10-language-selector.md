# Compact Language Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ambiguous globe-only language control with a fixed 44 by 44 pixel native selector that visibly shows the active `EN` or `RU` locale code.

**Architecture:** Add one typed locale-display mapping as the shared frontend source for locale codes, option-label keys, language tags, and supported-locale iteration. Keep persistence and translation behavior in the existing i18n provider, and keep the native `select` as the full interaction surface inside `LocaleSelect`.

**Tech Stack:** Bun tests, TypeScript, React 19, React DOM server rendering, Tailwind utility classes, Vite, Google Chrome.

## Global Constraints

- Work directly on the current `ui-improvement` branch; do not create a worktree unless the user explicitly changes this instruction.
- Keep the selector circular and exactly 44 by 44 pixels at every breakpoint.
- Show only the active `EN` or `RU` code; do not add flags, full language names, a segmented control, a custom popover, or breakpoint-dependent widths.
- Preserve the native `select`, translated accessible name, keyboard behavior, OS picker behavior, focus ring, locale persistence, document title updates, and `<html lang>` updates.
- Use language autonyms consistently: `English` and `Русский`.
- Do not add dependencies.
- Do not modify routing, crypto, API, storage, backend, Worker, Wrangler, key, fragment, request-contract, or persistence behavior.
- Do not put secret content, passwords, filenames, keys, or ciphertext into labels, logs, tests, or browser evidence.
- Use Google Chrome for browser verification.
- After the final frontend source change and final production build, explicitly stop the existing dev server and restart it with `bun run dev`; leave the restarted server running.

---

### Task 1: Define typed locale display metadata

**Files:**

- Create: `apps/frontend/src/lib/locale-display.ts`
- Modify: `apps/frontend/src/lib/i18n.tsx:1-31`
- Modify: `apps/frontend/src/locales/en.json:9-11`
- Verify unchanged autonym: `apps/frontend/src/locales/ru.json:9-11`
- Test: `tests/frontend-locale-display.test.ts`

**Interfaces:**

- Consumes: `Locale` from `@secred/shared` and the existing `common.locale_en` / `common.locale_ru` dictionary keys.
- Produces: `LocaleDisplay`, `localeDisplay: Record<Locale, LocaleDisplay>`, and `supportedLocales: Locale[]` for the i18n provider and `LocaleSelect`.

- [ ] **Step 1: Write the failing metadata and autonym test**

Create `tests/frontend-locale-display.test.ts`:

```ts
import { describe, expect, test } from 'bun:test';
import {
	localeDisplay,
	supportedLocales,
} from '../apps/frontend/src/lib/locale-display';
import en from '../apps/frontend/src/locales/en.json';
import ru from '../apps/frontend/src/locales/ru.json';

describe('locale display metadata', () => {
	test('defines the compact code, label key, and language tag for every locale', () => {
		expect(supportedLocales).toEqual(['en', 'ru']);
		expect(localeDisplay.en).toEqual({
			code: 'EN',
			labelKey: 'common.locale_en',
			lang: 'en',
		});
		expect(localeDisplay.ru).toEqual({
			code: 'RU',
			labelKey: 'common.locale_ru',
			lang: 'ru',
		});
	});

	test('uses language autonyms in both dictionaries', () => {
		expect(en.common.locale_en).toBe('English');
		expect(en.common.locale_ru).toBe('Русский');
		expect(ru.common.locale_en).toBe('English');
		expect(ru.common.locale_ru).toBe('Русский');
	});
});
```

- [ ] **Step 2: Run the focused test to verify RED**

Run:

```bash
bun test tests/frontend-locale-display.test.ts
```

Expected: FAIL because `apps/frontend/src/lib/locale-display.ts` does not exist. After that module is introduced but before the English dictionary is corrected, the autonym assertion must still fail with `Russian` instead of `Русский`.

- [ ] **Step 3: Add the typed locale-display source**

Create `apps/frontend/src/lib/locale-display.ts`:

```ts
import type { Locale } from '@secred/shared';

type LocaleLabelKey = 'common.locale_en' | 'common.locale_ru';

export type LocaleDisplay = {
	code: string;
	labelKey: LocaleLabelKey;
	lang: Locale;
};

export const localeDisplay = {
	en: {
		code: 'EN',
		labelKey: 'common.locale_en',
		lang: 'en',
	},
	ru: {
		code: 'RU',
		labelKey: 'common.locale_ru',
		lang: 'ru',
	},
} as const satisfies Record<Locale, LocaleDisplay>;

export const supportedLocales = Object.keys(localeDisplay) as Locale[];
```

The `satisfies Record<Locale, LocaleDisplay>` clause is required: adding a supported `Locale` without display metadata must become a TypeScript error.

- [ ] **Step 4: Reuse the supported-locale list in the i18n provider**

In `apps/frontend/src/lib/i18n.tsx`, add the import:

```ts
import { supportedLocales } from '@/lib/locale-display';
```

Remove:

```ts
const locales: Locale[] = ['en', 'ru'];
```

Replace the browser-locale return expression with:

```ts
	return supportedLocales.includes(browser as Locale)
		? (browser as Locale)
		: 'en';
```

Do not change the saved-locale guard, `setLocale`, `localStorage` key, dictionary fallback, or pluralization logic.

- [ ] **Step 5: Make picker labels consistent autonyms**

In `apps/frontend/src/locales/en.json`, replace:

```json
"locale_ru": "Russian"
```

with:

```json
"locale_ru": "Русский"
```

Leave `apps/frontend/src/locales/ru.json` as `English` and `Русский`.

- [ ] **Step 6: Run focused and static checks to verify GREEN**

Run:

```bash
bun test tests/frontend-locale-display.test.ts
bun run typecheck
bunx biome check apps/frontend/src/lib/locale-display.ts apps/frontend/src/lib/i18n.tsx apps/frontend/src/locales/en.json apps/frontend/src/locales/ru.json tests/frontend-locale-display.test.ts
git diff --check
```

Expected:

- focused test: 2 pass, 0 fail;
- typecheck: exit 0;
- scoped Biome: exit 0, apart from the existing informational schema-version notice;
- diff check: exit 0.

- [ ] **Step 7: Review and commit Task 1**

Review:

```bash
git diff -- apps/frontend/src/lib/locale-display.ts apps/frontend/src/lib/i18n.tsx apps/frontend/src/locales/en.json apps/frontend/src/locales/ru.json tests/frontend-locale-display.test.ts
```

Confirm there are no changes to persistence or locale fallback order, then commit:

```bash
git add apps/frontend/src/lib/locale-display.ts apps/frontend/src/lib/i18n.tsx apps/frontend/src/locales/en.json tests/frontend-locale-display.test.ts
git commit -m "feat(i18n): define locale display metadata"
```

---

### Task 2: Render the selected locale code in the native selector

**Files:**

- Modify: `apps/frontend/src/components/LocaleSelect.tsx:1-28`
- Test: `tests/frontend-locale-select.test.tsx`

**Interfaces:**

- Consumes: `localeDisplay` and `supportedLocales` from Task 1, plus the existing `locale`, `setLocale`, and `t` values from `useI18n()`.
- Produces: a fixed 44 by 44 pixel `LocaleSelect` that visibly renders the active code and retains the native select as its complete hit surface.

- [ ] **Step 1: Write the failing component-render test**

Create `tests/frontend-locale-select.test.tsx`:

```tsx
import { afterAll, describe, expect, test } from 'bun:test';
import type { Locale } from '@secred/shared';
import { renderToStaticMarkup } from 'react-dom/server';
import { LocaleSelect } from '../apps/frontend/src/components/LocaleSelect';
import { I18nProvider } from '../apps/frontend/src/lib/i18n';

const originalLocalStorage = Object.getOwnPropertyDescriptor(
	globalThis,
	'localStorage',
);

function renderLocaleSelect(locale: Locale): string {
	Object.defineProperty(globalThis, 'localStorage', {
		configurable: true,
		value: {
			getItem: () => locale,
			setItem: () => undefined,
		},
	});

	return renderToStaticMarkup(
		<I18nProvider>
			<LocaleSelect />
		</I18nProvider>,
	);
}

afterAll(() => {
	if (originalLocalStorage) {
		Object.defineProperty(globalThis, 'localStorage', originalLocalStorage);
	} else {
		Reflect.deleteProperty(globalThis, 'localStorage');
	}
});

describe('LocaleSelect', () => {
	test('shows the active English code and native-name options', () => {
		const markup = renderLocaleSelect('en');

		expect(markup).toContain('>EN</span>');
		expect(markup).toContain('aria-label="Language"');
		expect(markup).toMatch(
			/<option[^>]*value="en"[^>]*lang="en"[^>]*>English<\/option>/,
		);
		expect(markup).toMatch(
			/<option[^>]*value="ru"[^>]*lang="ru"[^>]*>Русский<\/option>/,
		);
	});

	test('shows the active Russian code and translated accessible name', () => {
		const markup = renderLocaleSelect('ru');

		expect(markup).toContain('>RU</span>');
		expect(markup).toContain('aria-label="Язык"');
	});
});
```

- [ ] **Step 2: Run the component test to verify RED**

Run:

```bash
bun test tests/frontend-locale-select.test.tsx
```

Expected: FAIL because the current component renders the `Languages` icon instead of `EN` / `RU`, and its option elements do not have language tags.

- [ ] **Step 3: Replace the globe icon with the visible locale code**

Replace `apps/frontend/src/components/LocaleSelect.tsx` with:

```tsx
import type { Locale } from '@secred/shared';
import { useI18n } from '@/lib/i18n';
import { localeDisplay, supportedLocales } from '@/lib/locale-display';
import { cn } from '@/lib/utils';

export function LocaleSelect({ className }: { className?: string }) {
	const { locale, setLocale, t } = useI18n();
	const currentLocale = localeDisplay[locale];

	return (
		<label
			className={cn(
				'locale-switch relative inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-border/70 bg-surface/80 text-foreground shadow-sm transition-colors hover:bg-accent/70 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring',
				className,
			)}
		>
			<span
				className="pointer-events-none text-[0.7rem] font-extrabold tracking-[0.08em]"
				aria-hidden
			>
				{currentLocale.code}
			</span>
			<select
				className="absolute inset-0 size-full cursor-pointer opacity-0"
				aria-label={t('common.language')}
				value={locale}
				onChange={(event) => setLocale(event.target.value as Locale)}
			>
				{supportedLocales.map((optionLocale) => {
					const option = localeDisplay[optionLocale];
					return (
						<option
							key={optionLocale}
							value={optionLocale}
							lang={option.lang}
						>
							{t(option.labelKey)}
						</option>
					);
				})}
			</select>
		</label>
	);
}
```

Required details:

- `size-11` sets an explicit 2.75rem / 44 pixel square.
- The code is visible but `aria-hidden`; the native select supplies the accessible name, role, value, and options.
- `inset-0 size-full` makes the native control cover the complete shell.
- Do not add a chevron, globe, flag, full language name, custom menu, or component state.

- [ ] **Step 4: Run focused tests and static checks to verify GREEN**

Run:

```bash
bun test tests/frontend-locale-display.test.ts tests/frontend-locale-select.test.tsx tests/frontend-document-meta.test.ts
bun run typecheck
bunx biome check apps/frontend/src/components/LocaleSelect.tsx tests/frontend-locale-select.test.tsx
git diff --check
```

Expected:

- focused tests: 7 pass, 0 fail;
- typecheck: exit 0;
- scoped Biome: exit 0, apart from the existing informational schema-version notice;
- diff check: exit 0.

If React's static markup serializes the selected option with an additional `selected` attribute, keep the regex assertions attribute-order tolerant. Do not weaken the assertions for visible codes, option values, language tags, or autonyms.

- [ ] **Step 5: Review and commit Task 2**

Review:

```bash
git diff -- apps/frontend/src/components/LocaleSelect.tsx tests/frontend-locale-select.test.tsx
```

Confirm the diff preserves the native select, existing setter, and translated `aria-label`, then commit:

```bash
git add apps/frontend/src/components/LocaleSelect.tsx tests/frontend-locale-select.test.tsx
git commit -m "feat(header): show active locale code"
```

---

### Task 3: Full verification, explicit server restart, and Chrome QA

**Files:**

- Modify only if verification exposes a defect in the approved language-selector scope.

**Interfaces:**

- Consumes: the completed Task 1 metadata and Task 2 selector.
- Produces: a fully verified branch and a fresh dev server running the final production frontend bundle.

- [ ] **Step 1: Run the complete automated gate**

Run from the repository root:

```bash
bun test
bun run typecheck
bun run build:frontend
bun run build
bun run lint
git diff --check
```

Expected:

- all tests pass, including the new metadata and component-render suites;
- all typechecks and builds exit 0;
- Biome exits 0, allowing only the existing informational schema-version notice;
- diff check exits 0.

If any command fails, use `superpowers:systematic-debugging`; do not weaken or delete tests.

- [ ] **Step 2: Explicitly restart the actual dev-server process tree**

Identify the process listening on port 8787:

```bash
lsof -nP -iTCP:8787 -sTCP:LISTEN
ps -axo pid,ppid,lstart,command | rg 'bun run dev|wrangler dev|workerd'
```

Gracefully stop the recorded unified session with Ctrl-C when available. If that session is no longer attached, send `TERM` only to the discovered `bun run dev` process tree. Confirm the port is free:

```bash
lsof -nP -iTCP:8787 -sTCP:LISTEN
```

Expected: no listener.

Start the final server after the production build:

```bash
bun run dev
```

Wait for `Ready on http://localhost:8787`. Record the new Bun, Wrangler, and workerd PIDs/start times, and leave this process running.

- [ ] **Step 3: Verify the selector in Google Chrome**

Use the mandated Chrome control surface and open `http://localhost:8787/`. Check exact viewport widths 320, 375, 768, and 1440 pixels.

At every viewport, record:

```js
document.documentElement.scrollWidth ===
	document.documentElement.clientWidth
```

Expected: `true` at every width.

Verify:

- the selector shell is exactly 44 by 44 pixels;
- the invisible select covers that complete rectangle;
- `EN` is visible when English is selected;
- `RU` is visible when Russian is selected;
- options are `English` and `Русский`;
- the option elements expose `lang="en"` and `lang="ru"`;
- Tab places focus on the select and the shell shows the existing focus ring;
- native keyboard selection changes the locale without a custom menu;
- page copy, document title, and `<html lang>` update immediately;
- reload preserves the selected locale;
- light and dark themes keep the code, border, hover, and focus treatment legible;
- header height, brand spacing, theme control, and saved-secret control remain unchanged;
- Chrome console has no new warnings or errors.

Capture fresh 320 pixel mobile, 375 pixel mobile, and 1440 pixel desktop screenshots.

- [ ] **Step 4: Review final repository and runtime state**

Run:

```bash
git status --short --branch
git log --oneline -8
curl -fsS http://localhost:8787/api/health
```

Expected:

- tracked working tree is clean;
- health response has `"status":"ok"`;
- the final server process start time is after the last frontend source change and production build.

If Chrome QA required a fix, add the smallest focused regression test, rerun the complete automated gate, commit with a scoped subject, and repeat the explicit server restart and Chrome checks. Do not create an empty verification commit.

- [ ] **Step 5: Request final review**

Use `superpowers:requesting-code-review` against the branch delta beginning at the plan commit. The reviewer must confirm:

- fixed 44 pixel footprint and visible active code;
- native-select semantics and complete hit target;
- locale metadata and autonym correctness;
- persistence/title/`html lang` behavior unchanged;
- no header overflow or unrelated security-boundary changes.

Address in-scope findings test-first, repeat the automated gate, and restart the dev server again after any frontend fix.
