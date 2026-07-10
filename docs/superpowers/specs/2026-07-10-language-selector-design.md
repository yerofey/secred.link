# Compact Language Selector Design

Date: 2026-07-10
Status: Approved in conversation
Branch: `ui-improvement`

## Goal

Make the active interface language visible before interaction while preserving the compact, accessible header and the existing locale behavior.

## Current problem

`LocaleSelect` renders a 44 by 44 pixel circular control with a language icon and an invisible native `select` covering it. The control has a translated accessible name, native keyboard behavior, and an adequate touch target, but the selected locale is not visible. Users must open the picker or infer the language from surrounding page copy.

The header is already space-constrained at narrow mobile widths. At 320 pixels, a permanently wider selector would crowd the brand, theme, and saved-secret controls. The design therefore keeps the current footprint.

## Selected direction

Use a fixed compact native selector at every breakpoint:

- Keep the circular 44 by 44 pixel shell.
- Replace the generic language icon with the active locale code: `EN` or `RU`.
- Do not add a flag, full language name, segmented control, or breakpoint-dependent width.
- Preserve the existing border, surface, shadow, hover treatment, and visible focus ring.
- Keep the native `select` as the full-control interaction surface.

The visible code is the control's selected-state indicator. The native picker remains the selection interface.

## Component boundaries

### `LocaleSelect`

`LocaleSelect` remains the only header component responsible for displaying and changing the locale. It receives the active locale and setter through the existing i18n context.

The component renders:

1. the existing circular label shell;
2. a visible `EN` or `RU` code derived from locale metadata;
3. the native `select` positioned across the complete control.

The component must not own persistence, document metadata, routing behavior, or translation dictionaries.

### Locale display metadata

Define a small typed locale-display mapping near the frontend i18n layer or selector. Each supported locale provides:

- locale value;
- visible uppercase code;
- translation key for the native language name;
- language tag for option pronunciation.

For the current locales:

| Locale | Code | Picker label key | Rendered label | Language tag |
| --- | --- | --- | --- | --- |
| `en` | `EN` | `common.locale_en` | `English` | `en` |
| `ru` | `RU` | `common.locale_ru` | `Русский` | `ru` |

`LocaleSelect` resolves the label key through the existing translator, keeping the dictionaries as the single source of picker copy. Both dictionaries use these autonyms consistently. In particular, the English dictionary changes the Russian picker label from `Russian` to `Русский`.

## Behavior and data flow

1. The i18n provider detects the saved locale, then browser locale, then falls back to English, exactly as it does today.
2. `LocaleSelect` reads the active locale and displays its mapped code.
3. Activating the native `select` opens the browser or operating-system picker.
4. A selection calls the existing `setLocale` function.
5. The existing provider persists the value in `localStorage` and rerenders translated content.
6. The existing layout effect updates the document title and `document.documentElement.lang` immediately.

No additional component state, custom menu state, or animation state is introduced.

## Accessibility

- Preserve the translated `aria-label` on the native `select`.
- Preserve native combobox semantics and keyboard behavior.
- Ensure the invisible `select` covers the complete 44 by 44 pixel target.
- Preserve the shell's `focus-within` ring so keyboard focus is visible.
- Set `lang="en"` and `lang="ru"` on the matching option labels so assistive technology can pronounce each autonym correctly where supported.
- Keep the visible code out of the accessible name if the native select already announces its selected option, avoiding duplicate announcements.
- Do not use flags because languages are not equivalent to countries.

## Visual details

- The locale code is centered in the existing circular utility control.
- Use foreground text rather than primary-blue fill so the selector stays subordinate to the main create action.
- Use a compact bold weight and modest letter spacing that remains legible in light and dark themes.
- The header dimensions and the 8 pixel utility gap remain unchanged.
- The control must not cause horizontal page overflow at 320 pixels or wider.

## Error and fallback behavior

The feature introduces no new network or asynchronous failure path. Invalid or missing saved locale values continue through the current detection fallback. The typed locale mapping must cover every supported `Locale`; TypeScript should fail when a supported locale lacks display metadata.

## Testing and verification

Add focused tests for locale display metadata:

- `en` maps to `EN`, `common.locale_en`, and `en`;
- `ru` maps to `RU`, `common.locale_ru`, and `ru`;
- both dictionaries resolve those keys to `English` and `Русский`;
- the mapping covers the supported locale type.

Run the full automated gate:

```bash
bun test
bun run typecheck
bun run build:frontend
bun run build
bun run lint
git diff --check
```

Verify in Google Chrome:

- `EN` and `RU` match the active locale before interaction;
- the picker options are `English` and `Русский`;
- Tab focus produces the visible ring;
- native keyboard selection works;
- selection immediately updates page copy, title, and `<html lang>`;
- reload preserves the selected locale;
- the complete pointer target is at least 44 by 44 pixels;
- light and dark themes remain legible;
- no horizontal overflow occurs at 320, 375, 768, and 1440 pixels.

## Non-goals

- Adding more locales.
- Replacing the native select with a custom popover.
- Adding flags, search, or a locale-management page.
- Restructuring the header or changing its other controls.
- Changing routing, crypto, API, storage, or backend behavior.
