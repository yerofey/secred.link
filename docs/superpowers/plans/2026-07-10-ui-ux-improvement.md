# Secred.link UI/UX Improvement Implementation Plan

> **Required implementation skill:** Use `superpowers:subagent-driven-development` for same-session execution, or `superpowers:executing-plans` for inline execution. Follow `superpowers:test-driven-development` for every behavior change and `superpowers:verification-before-completion` before reporting success.

**Goal:** Implement the approved composition-first UI/UX direction while preserving all browser-side encryption, API, Worker, key, fragment URL, and storage behavior.

**Architecture:** Keep `Home` as the only owner of form data and the existing submit pipeline. Extract deterministic presentation logic into small pure modules that Bun can test, and move options/action rendering into presentational components. Make `Layout` route-aware, keep secondary pages narrow, and use CSS breakpoints at 640 px and 1,152 px for the approved mobile/tablet/desktop composition.

**Tech stack:** React 19, React Router 7, TypeScript, Tailwind CSS 4 utilities plus `apps/frontend/src/styles.css`, TipTap, Bun tests, Biome, Vite, Cloudflare Wrangler.

**Approved design:** `docs/superpowers/specs/2026-07-10-ui-ux-improvement-design.md`

**Security invariants:** Do not edit `packages/shared`, `apps/backend`, `wrangler.jsonc`, request schemas, crypto helpers, key derivation, fragment routing, or persistence formats. Do not put secret text, passwords, filenames, access keys, manage keys, or ciphertext into alerts, status regions, logs, analytics, or error messages.

---

## Task 1: Add tested route metadata and an accessible shell

**Files:**

- Create: `apps/frontend/src/lib/document-meta.ts`
- Create: `tests/frontend-document-meta.test.ts`
- Modify: `apps/frontend/src/components/Layout.tsx`
- Modify: `apps/frontend/src/locales/en.json`
- Modify: `apps/frontend/src/locales/ru.json`
- Modify: `apps/frontend/src/styles.css`

### Step 1: Write the failing metadata tests

Create `tests/frontend-document-meta.test.ts`:

```ts
import { describe, expect, test } from 'bun:test';
import {
	getRouteTitleKey,
	syncDocumentMeta,
} from '../apps/frontend/src/lib/document-meta';

describe('document metadata', () => {
	test('maps known and unknown routes to translated title keys', () => {
		expect(getRouteTitleKey('/')).toBe('meta.home_title');
		expect(getRouteTitleKey('/manage')).toBe('meta.manage_title');
		expect(getRouteTitleKey('/storage')).toBe('meta.storage_title');
		expect(getRouteTitleKey('/view')).toBe('meta.view_title');
		expect(getRouteTitleKey('/missing')).toBe('meta.not_found_title');
	});

	test('synchronizes the translated title and html language', () => {
		const target = { title: '', documentElement: { lang: 'en' } };
		syncDocumentMeta(target, '/storage', 'ru', (key) => `translated:${key}`);
		expect(target.title).toBe('translated:meta.storage_title');
		expect(target.documentElement.lang).toBe('ru');
	});
});
```

Run:

```bash
bun test tests/frontend-document-meta.test.ts
```

Expected: FAIL because `apps/frontend/src/lib/document-meta.ts` does not exist.

### Step 2: Implement the pure metadata helper

Create `apps/frontend/src/lib/document-meta.ts` with:

```ts
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
	return ROUTE_TITLE_KEYS[pathname] ?? 'meta.not_found_title';
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
```

### Step 3: Connect metadata, route-aware width, translations, and the skip link

In `apps/frontend/src/components/Layout.tsx`:

- Import `useEffect`, `useLocation`, `syncDocumentMeta`, and `cn`.
- Read `locale` from `useI18n()` and `pathname` from `useLocation()`.
- Run `syncDocumentMeta(document, pathname, locale, t)` in an effect.
- Insert a translated skip link as the first child of `.app-shell`:

```tsx
<a className="skip-link" href="#main-content">
	{t('common.skip_to_content')}
</a>
```

- Give `<main>` `id="main-content"` and `tabIndex={-1}`.
- Use `max-w-[76rem]` only when `pathname === '/'`; keep `max-w-5xl` on all other routes:

```tsx
<main
	id="main-content"
	tabIndex={-1}
	className={cn(
		'mx-auto w-full flex-1 px-4 py-8 sm:px-6 sm:py-10',
		pathname === '/' ? 'max-w-[76rem]' : 'max-w-5xl',
	)}
>
```

- Replace the hard-coded theme and saved-secret accessible names with `t('common.toggle_theme')` and `t('common.saved_secrets')`.

Keep locale detection/storage in `apps/frontend/src/lib/i18n.tsx` unchanged; metadata synchronization belongs in `Layout`, where route and locale are both available.

Add these English keys:

```json
"skip_to_content": "Skip to main content",
"toggle_theme": "Toggle theme",
"saved_secrets": "Saved secrets"
```

Add the equivalent Russian keys:

```json
"skip_to_content": "Перейти к основному содержимому",
"toggle_theme": "Переключить тему",
"saved_secrets": "Сохранённые секреты"
```

Add a top-level `meta` object to each locale. English values must be:

```json
"meta": {
	"home_title": "Create a secret — Secred",
	"manage_title": "Manage secret — Secred",
	"storage_title": "Saved secrets — Secred",
	"view_title": "View secret — Secred",
	"not_found_title": "Page not found — Secred"
}
```

Russian values must be faithful translations while retaining `Secred`.

Add `.skip-link` CSS that is visually off-screen by default, appears at the top-left on `:focus-visible`, uses a 44 px minimum height, sits above the header, and has the existing ring/primary colors. Add `scroll-margin-top` to `#main-content` and preserve its focus outline only for keyboard focus.

### Step 4: Run the focused test and checks

```bash
bun test tests/frontend-document-meta.test.ts
bun run typecheck
bun run lint
```

Expected: PASS.

### Step 5: Commit

```bash
git add apps/frontend/src/lib/document-meta.ts tests/frontend-document-meta.test.ts apps/frontend/src/components/Layout.tsx apps/frontend/src/locales/en.json apps/frontend/src/locales/ru.json apps/frontend/src/styles.css
git commit -m "feat(shell): add accessible route metadata"
```

---

## Task 2: Make formatting actions discoverable on mobile

**Files:**

- Create: `apps/frontend/src/lib/markdown-toolbar-actions.ts`
- Create: `tests/frontend-toolbar-actions.test.ts`
- Modify: `apps/frontend/src/components/MarkdownEditorToolbar.tsx`
- Modify: `apps/frontend/src/components/HomeEditorField.tsx`
- Modify: `apps/frontend/src/locales/en.json`
- Modify: `apps/frontend/src/locales/ru.json`
- Modify: `apps/frontend/src/styles.css`

### Step 1: Write the failing toolbar partition test

Create `tests/frontend-toolbar-actions.test.ts`:

```ts
import { describe, expect, test } from 'bun:test';
import {
	ALL_TOOLBAR_ACTIONS,
	MOBILE_OVERFLOW_ACTIONS,
	MOBILE_PRIMARY_ACTIONS,
} from '../apps/frontend/src/lib/markdown-toolbar-actions';

describe('mobile formatting actions', () => {
	test('keeps the four core actions visible', () => {
		expect(MOBILE_PRIMARY_ACTIONS).toEqual([
			'bold',
			'italic',
			'link',
			'bullet',
		]);
	});

	test('places every remaining action in More exactly once', () => {
		expect(MOBILE_OVERFLOW_ACTIONS).toEqual([
			'strike',
			'code',
			'h2',
			'ordered',
			'quote',
			'fence',
		]);
		expect(
			new Set([...MOBILE_PRIMARY_ACTIONS, ...MOBILE_OVERFLOW_ACTIONS]),
		).toEqual(new Set(ALL_TOOLBAR_ACTIONS));
	});
});
```

Run `bun test tests/frontend-toolbar-actions.test.ts` and confirm it fails because the module is missing.

### Step 2: Add the action configuration

Create `apps/frontend/src/lib/markdown-toolbar-actions.ts`:

```ts
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

export const DESKTOP_TOOLBAR_GROUPS: readonly (
	readonly MarkdownInsertKind[]
)[] = [
	['bold', 'italic', 'strike', 'code'],
	['link', 'h2'],
	['bullet', 'ordered'],
	['quote', 'fence'],
];
```

### Step 3: Render primary, More, and full-width groups through one command function

In `MarkdownEditorToolbar.tsx`:

- Import `Ellipsis`, `useRef`, and the new action arrays.
- Delete the local `TOOLBAR_GROUPS` constant.
- Keep `applyRichEditor`, `ACTION_MAP`, active state, and markdown insertion logic unchanged.
- Extract one `renderAction(kind, options?)` function so primary, overflow, and desktop controls call the same `apply(kind)` path.
- Change the container semantics from `role="toolbar"` to `role="group"` so normal Tab navigation remains correct without claiming arrow-key toolbar behavior.
- Render `.markdown-toolbar__compact` below 640 px with the four primary buttons and a native `<details>` More disclosure.
- Render `.markdown-toolbar__full` from 640 px upward using `DESKTOP_TOOLBAR_GROUPS`.
- The More summary uses `t('home.form.toolbar_more')`, has a 44 px target, and exposes `aria-label`. Its menu buttons keep their translated labels and 36 px targets.
- After an overflow action executes, close the `<details>` ref and explicitly focus its `<summary>` so focus never remains inside hidden menu content.

Do not copy any command switch or editor mutation logic into the More menu.

In `HomeEditorField.tsx`:

- Remove `AlignLeft` and `PenLine` icons.
- Render visible text inside both mode buttons: `t('home.form.mode_visual')` and `t('home.form.mode_plain')`.
- Keep `aria-pressed` and the sliding indicator.
- Keep `apiDisabled` temporarily in the prop type because `Home` still passes it until Task 4, but stop destructuring or using it. Remove API-health disabling from the toolbar, mode buttons, and `RichSecretEditor`. API health must never disable editing, and Task 4 removes the compatibility prop from both caller and component.

Update English `mode_plain` from `Plain text` to `Text`, add `toolbar_more: "More formatting"`, and add the Russian equivalent `toolbar_more: "Ещё форматирование"`.

### Step 4: Update toolbar and mode CSS

In `styles.css`:

- Remove horizontal scrolling and the fade mask from `.secret-editor-field__toolbar`.
- Make embedded formatting buttons exactly 2.25rem square (36 px) at every breakpoint.
- Show `.markdown-toolbar__compact` below 640 px and `.markdown-toolbar__full` at 640 px and above.
- Position the More menu below its summary, align it to the start edge, use a contained surface with a visible border/shadow, and lay six actions in a compact two-column grid.
- Give the More summary a 2.75rem (44 px) minimum size and the same focus ring as buttons.
- Keep the editor chrome in one row where it fits; use `minmax(0, 1fr) auto` so the explicit mode labels remain visible without document overflow.
- Give mode buttons a 44 px minimum height, readable horizontal padding, and no icon-dependent sizing.

### Step 5: Run tests and commit

```bash
bun test tests/frontend-toolbar-actions.test.ts
bun run typecheck
bun run lint
git add apps/frontend/src/lib/markdown-toolbar-actions.ts tests/frontend-toolbar-actions.test.ts apps/frontend/src/components/MarkdownEditorToolbar.tsx apps/frontend/src/components/HomeEditorField.tsx apps/frontend/src/locales/en.json apps/frontend/src/locales/ru.json apps/frontend/src/styles.css
git commit -m "feat(editor): expose compact formatting actions"
```

---

## Task 3: Add a tested create-state model and presentational composer controls

**Files:**

- Create: `apps/frontend/src/lib/secret-create-view-state.ts`
- Create: `tests/frontend-secret-create-view-state.test.ts`
- Create: `apps/frontend/src/components/SecretOptionsPanel.tsx`
- Create: `apps/frontend/src/components/SecretCreateAction.tsx`
- Modify: `apps/frontend/src/locales/en.json`
- Modify: `apps/frontend/src/locales/ru.json`

### Step 1: Write the failing create-state tests

Create `tests/frontend-secret-create-view-state.test.ts`:

```ts
import { describe, expect, test } from 'bun:test';
import { getSecretCreateViewState } from '../apps/frontend/src/lib/secret-create-view-state';

const readyInput = {
	apiStatus: 'ok' as const,
	hasPayload: true,
	isSubmitting: false,
	attachmentTooLarge: false,
	hasSubmitError: false,
};

describe('secret create view state', () => {
	test('waits for the health check without blocking editing', () => {
		expect(
			getSecretCreateViewState({ ...readyInput, apiStatus: 'pending' }),
		).toMatchObject({ disabled: true, hintKey: 'home.form.checking_service' });
	});

	test('offers health recovery when the API is unavailable', () => {
		expect(
			getSecretCreateViewState({ ...readyInput, apiStatus: 'error' }),
		).toMatchObject({
			disabled: true,
			hintKey: 'home.form.submit_api_unavailable',
			showHealthRetry: true,
		});
	});

	test('explains empty and oversized payloads', () => {
		expect(
			getSecretCreateViewState({ ...readyInput, hasPayload: false }).hintKey,
		).toBe('home.form.submit_empty');
		expect(
			getSecretCreateViewState({
				...readyInput,
				attachmentTooLarge: true,
			}).hintKey,
		).toBe('home.form.submit_file_too_large');
	});

	test('enables valid content and exposes retry after a failed submit', () => {
		expect(getSecretCreateViewState(readyInput)).toMatchObject({
			disabled: false,
			hintKey: 'home.form.submit_ready',
		});
		expect(
			getSecretCreateViewState({ ...readyInput, hasSubmitError: true }),
		).toMatchObject({ disabled: false, showSubmitRetry: true });
	});
});
```

Run the focused test and confirm the missing-module failure.

### Step 2: Implement deterministic create presentation

Create `apps/frontend/src/lib/secret-create-view-state.ts`:

```ts
export type ApiStatus = 'pending' | 'ok' | 'error';
export type SubmitPhase = 'idle' | 'encrypt' | 'save' | 'file';

type Input = {
	apiStatus: ApiStatus;
	hasPayload: boolean;
	isSubmitting: boolean;
	attachmentTooLarge: boolean;
	hasSubmitError: boolean;
};

export function getSecretCreateViewState(input: Input) {
	const disabled =
		input.apiStatus !== 'ok' ||
		!input.hasPayload ||
		input.isSubmitting ||
		input.attachmentTooLarge;

	if (input.apiStatus === 'pending') {
		return {
			disabled,
			hintKey: 'home.form.checking_service',
			showHealthRetry: false,
			showSubmitRetry: false,
		};
	}
	if (input.apiStatus === 'error') {
		return {
			disabled,
			hintKey: 'home.form.submit_api_unavailable',
			showHealthRetry: true,
			showSubmitRetry: false,
		};
	}
	if (input.attachmentTooLarge) {
		return {
			disabled,
			hintKey: 'home.form.submit_file_too_large',
			showHealthRetry: false,
			showSubmitRetry: false,
		};
	}
	if (!input.hasPayload) {
		return {
			disabled,
			hintKey: 'home.form.submit_empty',
			showHealthRetry: false,
			showSubmitRetry: false,
		};
	}
	return {
		disabled,
		hintKey: 'home.form.submit_ready',
		showHealthRetry: false,
		showSubmitRetry: input.hasSubmitError && !input.isSubmitting,
	};
}
```

### Step 3: Build `SecretOptionsPanel`

Create `apps/frontend/src/components/SecretOptionsPanel.tsx` as a presentational component with these props:

```ts
type SecretOptionsPanelProps = {
	password: string;
	onPasswordChange: (value: string) => void;
	lifetime: number;
	onLifetimeChange: (value: number) => void;
	isBurnable: boolean;
	onBurnableChange: (value: boolean) => void;
	summary: string;
};
```

Implementation requirements:

- Own only `isOpen` disclosure state and a `useId()` for `aria-controls`.
- Render a 44 px mobile summary button with `aria-expanded`, `aria-controls`, `ShieldCheck`, the translated optional-settings label, the compact summary, and a rotating chevron.
- Render a non-interactive section heading with the same title and summary for tablet/desktop; CSS swaps the mobile control for this heading at 640 px.
- Render the existing `PasswordInput`, password-strength hint, `ExpirationSelect`, and burn switch unchanged in meaning.
- Do not accept API health or submission state; settings remain editable.
- Use the existing `MAX_PASSWORD_LENGTH`, `getPasswordStrength`, and translated strings.
- Add `data-open={isOpen}` to the wrapper. CSS hides the body only below 640 px when `data-open="false"`; from 640 px upward the body is always displayed.

### Step 4: Build `SecretCreateAction`

Create `apps/frontend/src/components/SecretCreateAction.tsx` with props for `apiStatus`, `hasPayload`, `isSubmitting`, `submitPhase`, `attachmentTooLarge`, `hasSubmitError`, `summary`, `onRetryHealth`, and `onRetrySubmit`.

The component must:

- Call `getSecretCreateViewState` and derive the translated hint.
- Render health failure as `role="alert"` with a translated Retry service button.
- Render submit failure as a separate `role="alert"` with a translated message and Try again button.
- Render checking/progress/hint text in one `role="status" aria-live="polite"` region.
- Render the submit button with the existing phase labels and no sensitive data.
- Append the compact summary only when a valid payload exists and the attachment is not oversized.
- Keep all retry controls `type="button"`; the primary action remains `type="submit"`.

Add English and Russian translations for:

- `home.form.checking_service`
- `home.form.retry_service`
- `home.form.submit_failed`
- `home.form.retry_submit`
- `home.form.options_summary`

Use concise English copy: “Checking service”, “Retry service”, “We could not create the secret. Your input is still here.”, “Try again”, and “Protection settings”. Translate faithfully into Russian.

### Step 5: Run tests and commit

```bash
bun test tests/frontend-secret-create-view-state.test.ts
bun run typecheck
bun run lint
git add apps/frontend/src/lib/secret-create-view-state.ts tests/frontend-secret-create-view-state.test.ts apps/frontend/src/components/SecretOptionsPanel.tsx apps/frontend/src/components/SecretCreateAction.tsx apps/frontend/src/locales/en.json apps/frontend/src/locales/ru.json
git commit -m "feat(home): add resilient create controls"
```

---

## Task 4: Refactor Home around the responsive composer and recovery flow

**Files:**

- Modify: `apps/frontend/src/pages/Home.tsx`
- Modify: `apps/frontend/src/components/HomeEditorField.tsx`
- Modify: `apps/frontend/src/components/RichSecretEditor.tsx`
- Modify: `apps/frontend/src/locales/en.json`
- Modify: `apps/frontend/src/locales/ru.json`

### Step 1: Preserve submission behavior while adding explicit recovery

In `Home.tsx`:

- Import `useCallback`, `SecretOptionsPanel`, `SecretCreateAction`, and the shared `ApiStatus`/`SubmitPhase` types.
- Add `const [hasSubmitError, setHasSubmitError] = useState(false);`.
- Replace the one-shot health effect with:

```ts
const checkHealth = useCallback(async () => {
	setApiStatus('pending');
	try {
		await api.health();
		setApiStatus('ok');
	} catch {
		setApiStatus('error');
	}
}, []);

useEffect(() => {
	void checkHealth();
}, [checkHealth]);
```

- At the beginning of every valid submit, call `setHasSubmitError(false)` before encryption.
- Guard submit when `apiStatus !== 'ok'`, when empty, oversized, or already in flight.
- Keep this exact successful order: read optional attachment bytes, call `buildCreateSecretPayloadForSubmit`, call `api.createSecret`, optionally call `api.uploadSecretAttachment`, call `saveLocalSecret`, navigate to `/manage#sid`.
- Add `catch { setHasSubmitError(true); }` before the existing `finally`.
- Do not retain the failed payload object. Clicking Try again calls `submit()` and therefore rebuilds a new payload with fresh identifiers.
- Keep `submitInFlightRef`; do not add parallel or automatic retries.
- Never clear `content`, `password`, `lifetime`, `isBurnable`, or `attachment` on failure.

### Step 2: Replace inline rail UI with the presentational components

- Remove inline password, expiration, burn, API banner, submit button, and submit-note rendering.
- Remove imports made obsolete by those deletions.
- Pass current values/callbacks and `compactSummary` to `SecretOptionsPanel`.
- Pass health/payload/submission/error state to `SecretCreateAction`.
- Wire `onRetryHealth={() => void checkHealth()}` and `onRetrySubmit={() => void submit()}`.
- Stop passing any API-disabled prop to `HomeEditorField`.

### Step 3: Apply the approved Home content and semantic layout

Use this intro structure:

```tsx
<div className="page-intro home-page-intro mx-auto max-w-3xl pt-2 sm:pt-4">
	<h1 className="page-title">{t('home.title')}</h1>
	<p className="page-subtitle">{t('home.reassurance')}</p>
</div>
```

Change the English strings to exactly:

```json
"title": "Share a secret securely.",
"reassurance": "Encrypted in your browser. The server only stores ciphertext."
```

Add faithful Russian translations. Keep the existing footer subtitle key unchanged.

Use semantic class names instead of the current `lg`/`xl` grid utilities. The form class is exactly `page-shell home-page pb-6`; its `home-form-surface mx-auto w-full` child contains `home-composer-grid`, which contains `home-editor-column` first and a `side-rail` `<aside>` second. Set the aside accessible name with `t('home.form.options_summary')`, and render `SecretOptionsPanel` before `SecretCreateAction` inside it.

### Step 4: Make the editor a complete fixed-height field

In `HomeEditorField.tsx`, remove the old viewport-dependent `min-h-[min(...)]` classes from the field and textarea. Use `min-h-0 flex-1 resize-none` for the textarea so the complete field height is controlled by CSS.

Remove the temporary `apiDisabled` compatibility prop from `HomeEditorFieldProps` and stop passing it from `Home` now that both files change in the same task.

In `RichSecretEditor.tsx`, replace viewport-dependent minimum-height classes on the editor wrapper/fallback with `min-h-0 flex-1 overflow-y-auto`. Preserve TipTap setup, Markdown conversion, length enforcement, and update behavior.

The editor must remain resizable only through the approved responsive breakpoints, not by a textarea drag handle that can break the rail alignment.

### Step 5: Run checks and commit

```bash
bun test tests/frontend-secret-create-view-state.test.ts
bun run typecheck
bun run lint
git add apps/frontend/src/pages/Home.tsx apps/frontend/src/components/HomeEditorField.tsx apps/frontend/src/components/RichSecretEditor.tsx apps/frontend/src/locales/en.json apps/frontend/src/locales/ru.json
git commit -m "feat(home): build responsive secret composer"
```

---

## Task 5: Make secondary-route states truthful and add a catch-all page

**Files:**

- Create: `apps/frontend/src/lib/manage-page-state.ts`
- Create: `tests/frontend-manage-page-state.test.ts`
- Create: `apps/frontend/src/pages/NotFound.tsx`
- Modify: `apps/frontend/src/pages/ManageSecret.tsx`
- Modify: `apps/frontend/src/pages/Storage.tsx`
- Modify: `apps/frontend/src/App.tsx`
- Modify: `apps/frontend/src/locales/en.json`
- Modify: `apps/frontend/src/locales/ru.json`

### Step 1: Write the failing Manage state test

Create `tests/frontend-manage-page-state.test.ts`:

```ts
import { describe, expect, test } from 'bun:test';
import { getManageIntroKeys } from '../apps/frontend/src/lib/manage-page-state';

describe('manage page presentation', () => {
	test('uses success framing only when a local secret exists', () => {
		expect(getManageIntroKeys(true)).toEqual({
			titleKey: 'manage.headline',
			subtitleKey: 'manage.subtitle',
		});
		expect(getManageIntroKeys(false)).toEqual({
			titleKey: 'manage.not_found_headline',
			subtitleKey: 'manage.not_found',
		});
	});
});
```

Run the test and confirm it fails because the helper is missing.

### Step 2: Implement state-specific Manage framing

Create `apps/frontend/src/lib/manage-page-state.ts`:

```ts
export function getManageIntroKeys(hasSecret: boolean) {
	return hasSecret
		? { titleKey: 'manage.headline', subtitleKey: 'manage.subtitle' }
		: {
				titleKey: 'manage.not_found_headline',
				subtitleKey: 'manage.not_found',
			};
}
```

In `ManageSecret.tsx`, derive keys after loading and use them in the page intro. Keep the success card only inside the existing truthy `secret` branch. In the missing card, remove the repeated missing paragraph and retain the Create and Saved Secrets actions.

Add exact English `manage.not_found_headline`: “Secret unavailable on this device”. Add a faithful Russian translation.

### Step 3: Remove duplicated Storage privacy copy

In `Storage.tsx`:

- When items exist, show `storage.on_device` once in the page intro.
- When empty, omit that intro subtitle and show `storage.on_device` once inside the empty card below `storage.empty`.
- Keep `storage.empty_hint` as the concise explanation of what will appear there.
- Delete both trailing `storage.on_device` paragraphs after the content.
- Keep clear-cache behavior unchanged.

### Step 4: Add the catch-all route

Create `NotFound.tsx` using the existing page intro/Card/Button language. It must show translated “Page not found”, a concise explanation, and a primary Link to `/` labeled “Create a secret”.

In `App.tsx`, lazy-load `NotFound` and add `{ path: '*', element: <NotFound /> }` as the final child route.

Add English/Russian keys under a new `not_found_page` locale section. The English strings are:

```json
"not_found_page": {
	"title": "Page not found",
	"description": "That address does not point to a page in Secred.",
	"cta": "Create a secret"
}
```

### Step 5: Run tests and commit

```bash
bun test tests/frontend-manage-page-state.test.ts tests/frontend-document-meta.test.ts
bun run typecheck
bun run lint
git add apps/frontend/src/lib/manage-page-state.ts tests/frontend-manage-page-state.test.ts apps/frontend/src/pages/NotFound.tsx apps/frontend/src/pages/ManageSecret.tsx apps/frontend/src/pages/Storage.tsx apps/frontend/src/App.tsx apps/frontend/src/locales/en.json apps/frontend/src/locales/ru.json
git commit -m "fix(routes): use truthful empty states"
```

---

## Task 6: Implement the responsive layout and visual hierarchy

**Files:**

- Modify: `apps/frontend/src/styles.css`
- Modify if class alignment requires it: `apps/frontend/src/components/SecretOptionsPanel.tsx`
- Modify if class alignment requires it: `apps/frontend/src/components/SecretCreateAction.tsx`

This task is verified through production compilation and Chrome viewport checks because the repository has no browser component-test or screenshot-test harness. Do not introduce a new test framework for this scoped UI change.

### Step 1: Set the approved composer breakpoints

In `styles.css`:

- Base/mobile `<640px`: one column, 22rem complete `.secret-editor-field`, collapsed options body, action immediately after summary, compact gaps.
- Tablet `640px–1151px`: one stacked composer column, 24rem editor, options body always visible, one settings column at 640–767 px and two columns at 768–1151 px, full-width Create below options.
- Desktop `>=1152px`: `.home-composer-grid { grid-template-columns: minmax(0, 1fr) 22rem; gap: 2rem; }`, 26rem editor, sticky 22rem rail with `top: 2rem`, and no route width above 76rem.

Use `@media (min-width: 1152px)` explicitly; do not reuse Tailwind's 1024 px `lg` breakpoint for the rail.

### Step 2: Contain every control

- Apply `min-width: 0`, `width: 100%`, and `max-width: 100%` to the rail, options panel, settings grid, and expiration group.
- Keep expiration at four equal `minmax(0, 1fr)` columns.
- Allow expiration labels to wrap/balance instead of forcing `white-space: nowrap`; use a 44 px minimum segment height.
- Keep the sliding indicator clipped inside the rounded expiration group.
- Ensure file chips use ellipsis and never set document width.
- Ensure the More menu can flip/alignment-safe within the editor at 375 px.

### Step 3: Refine hierarchy and light-theme contrast

- Keep the existing blue primary, rounded surfaces, DM Sans, and restrained dark theme.
- Remove the redundant Home kicker through the Task 4 markup; do not add a replacement badge.
- Make the reassurance quieter than the headline but readable in both themes.
- Slightly strengthen light-mode `--muted-foreground`, `--border`, `--input`, and `--surface-muted` contrast without changing the hue family or dark variables.
- Keep status danger surfaces visibly distinct but calm.
- Add CSS for option disclosure, status/retry rows, and the catch-all card using existing tokens; do not add gradients beyond existing surface treatments or any image assets.

### Step 4: Respect reduced motion and touch targets

- Keep the existing `useMediaQuery('(prefers-reduced-motion: reduce)')` behavior for segmented indicators.
- Add a CSS reduced-motion block that disables decorative hover transforms and menu/disclosure transitions without hiding state changes.
- Keep all non-formatting controls at least 44 px high, formatting buttons at least 36 px, and More at 44 px.

### Step 5: Compile, inspect the diff, and commit

```bash
bun run build
bun run lint
git diff --check
git diff -- apps/frontend/src/styles.css apps/frontend/src/components/SecretOptionsPanel.tsx apps/frontend/src/components/SecretCreateAction.tsx
git add apps/frontend/src/styles.css apps/frontend/src/components/SecretOptionsPanel.tsx apps/frontend/src/components/SecretCreateAction.tsx
git commit -m "style(frontend): refine responsive composer layout"
```

Expected: no TypeScript, Vite, Biome, or whitespace errors.

---

## Task 7: Full verification, required server restart, and Chrome QA

**Files:**

- Modify only if verification exposes a defect in the approved scope.

### Step 1: Run the full automated suite

```bash
bun test
bun run typecheck
bun run build:frontend
bun run build
bun run lint
git diff --check
```

All commands must exit 0. If a command fails, use `superpowers:systematic-debugging`; do not weaken or delete tests.

### Step 2: Restart the dev server after all frontend changes

The user explicitly requires a restart. Stop the existing `bun run dev` process gracefully with Ctrl-C (or terminate only that recorded process if the session is no longer attached). Then run from the repository root:

```bash
bun run dev
```

Wait for Wrangler to report `http://localhost:8787`. This restart must happen after the final frontend build so the Worker serves the new frontend bundle.

### Step 3: Verify in Google Chrome

Use the configured Google Chrome application and open `http://localhost:8787/`. Check these exact viewports:

- 375 x 812
- 768 x 1024
- 1024 x 900
- 1440 x 900
- 1920 x 1080

At every viewport, evaluate `document.documentElement.scrollWidth === document.documentElement.clientWidth` and confirm no horizontal overflow.

Verify:

- Mobile: four core formatting actions, explicit More with six actions, visible Visual/Text mode labels, 22rem complete editor, compact attachment/count footer, collapsed settings summary, nearby Create action.
- Tablet: stacked 24rem editor, expanded one/two-column settings, Create directly below.
- Desktop: 26rem editor plus 22rem sticky rail starting only at 1152 px; Home expands toward 76rem at 1920 px.
- English and Russian copy; `<html lang>` and route titles update immediately.
- Keyboard: skip link, visible focus, More disclosure, settings disclosure, mode buttons, expiration, password toggle, burn toggle, file remove, retry controls, and Create.
- Light/dark parity and reduced-motion preference.
- Content-only, attachment-only, add/remove attachment, oversized attachment, password visibility/strength, burn toggle, empty/ready Create states.
- Simulated/offline health failure keeps editing available, disables Create, shows Retry service, and recovers after reconnect.
- Simulated create failure keeps all input and shows Try again; retry generates a new request through the normal payload builder.
- `/manage` without a local key never shows success wording.
- `/storage` empty state contains the on-device privacy copy once.
- `/view` missing state remains coherent.
- Unknown route shows Page not found and a working Create action.

Capture fresh desktop, tablet, and mobile screenshots for comparison with the baseline images in `/tmp` if those files still exist.

### Step 4: Review repository state

```bash
git status --short --branch
git log --oneline -8
```

If verification required fixes, add the smallest focused test where possible, rerun the relevant focused check and the full suite, and use a scoped commit subject that describes the verified regression. Leave the restarted dev server running for the user unless they ask otherwise.

### Step 5: Request final code review

Use `superpowers:requesting-code-review` against the completed branch. Address only findings that are in the approved UI/UX scope, then repeat Task 7 automated and Chrome verification before reporting completion.
