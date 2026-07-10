# Secred.link UI/UX Improvement Design

Status: Approved on 2026-07-10

## Objective

Improve task completion, responsiveness, trust, and recovery without changing the browser-first encryption model, shared API contracts, Worker behavior, or URL key handling. The interface should feel like a quiet, trustworthy instrument: restrained, precise, and focused on creating a secret quickly.

## Evidence from the current interface

- At 375 x 812, the document is 1,203 px tall and the Create action begins near 901 px, separating completion from composition.
- The mobile formatting toolbar has a 248 px viewport for 307 px of controls, hiding actions behind an unlabeled horizontal scroll.
- At 1,024 px, the expiration control expands beyond its 300 px rail and pushes the document about 40 px past the viewport.
- At 1,920 px, the main content remains capped at 1,024 px, so Home cannot use its intended wider composition.
- Submission failures retain no visible explanation or recovery action.
- The Manage page uses success framing even when no local secret can be found.
- The Storage empty state repeats the same on-device privacy message.

## Design principles

1. Composition comes first. Writing or attaching content is the primary task; optional protection settings must support it without pushing completion out of sight.
2. Trust comes from truthful state. Success, missing, loading, unavailable, and failed states must never share contradictory framing.
3. Responsive changes follow available space rather than device labels. The side rail appears only when the editor, gap, and controls fit without overflow.
4. Failures preserve user work. Error messages never include or announce secret or password content.
5. Existing security behavior is invariant. Crypto helpers, request schemas, access/manage keys, fragment URLs, and Worker persistence stay unchanged.

## Visual direction

Preserve the existing blue accent, rounded surfaces, DM Sans typography, light/dark themes, and compact header utilities. Refine hierarchy rather than replacing the visual language:

- Remove redundant branding from the Home intro and use the headline “Share a secret securely.”
- Add the reassurance “Encrypted in your browser. The server only stores ciphertext.”
- Reduce empty vertical space on mobile and tablet while retaining a calm desktop composition.
- Keep motion limited to existing segmented indicators, disclosure transitions, and concise status changes. Respect `prefers-reduced-motion`.
- Do not add illustration, photography, decorative gradients, or new bitmap assets.

## Responsive composer

### Mobile, below 640 px

- Use a 22 rem complete editor field instead of the current roughly 436 px field.
- Show Bold, Italic, Link, and Bulleted list as primary formatting actions. Put Strikethrough, Inline code, Heading, Numbered list, Quote, and Code block in an explicit More menu.
- Show readable Visual and Text labels in the editor mode control.
- Keep Attach and the character count on one footer row until an attachment or error requires wrapping.
- Collapse protection settings into a disclosure whose always-visible summary states expiry, password state, burn state, and attachment size when present.
- Place the Create action and its status immediately after the settings summary. It is not viewport-fixed, avoiding virtual-keyboard and safe-area conflicts.

### Tablet, 640-1,151 px

- Keep the composer stacked.
- Use a 24 rem complete editor field.
- Keep settings expanded. Use one column from 640-767 px and two columns from 768-1,151 px.
- Place the full-width Create action directly beneath the settings.

### Desktop, 1,152 px and above

- Use a 26 rem complete editor field plus a contained 22 rem sticky settings rail.
- Give Home a 76 rem route-specific maximum width with a 2 rem column gap.
- Keep secondary pages at their existing narrower reading width.
- Constrain segmented controls and indicators to their rail with `min-width: 0`, `max-width: 100%`, and responsive labels so the 1,024 px overflow cannot recur.

## Component boundaries

- `Home` remains the state owner and submission orchestrator so the sensitive pipeline is not moved during a visual change.
- Add a presentational options component for password, expiration, burn-after-read, and the compact summary. It receives values and callbacks only.
- Add a presentational create-status component for the action, summary, progress, error, and retry affordances.
- Update the editor toolbar to expose primary and overflow action groups without duplicating command logic.
- Give `Layout` a route-aware main-width modifier, skip link, and translated accessibility labels.
- Keep `HomeEditorField`, `ExpirationSelect`, and the existing shared UI primitives as the implementation base.

## State and data flow

1. The editor remains usable while the health request is pending or failed.
2. Health failure disables Create, shows a non-destructive service-unavailable message, and provides a health retry action.
3. Create validates content and attachment constraints, then uses the existing payload builder, API create call, optional attachment upload, local save, and Manage navigation in the current order.
4. Progress exposes only phase names: encrypting, saving, and uploading. It never exposes content, filenames to assistive status announcements, passwords, or keys.
5. A failed submission preserves all form input and shows a concise error with a retry action. Retry starts a fresh payload with new identifiers instead of reusing a potentially partially accepted request. Any unreachable partial ciphertext remains server-side only until its configured expiry.
6. The in-flight guard continues preventing concurrent submissions.

## Secondary routes and shell

- Manage renders success framing only after a local secret exists. Missing local state uses the heading “Secret unavailable on this device” and the existing create/storage actions.
- Storage keeps one on-device privacy explanation inside the empty state and removes the duplicate line.
- View keeps its current coherent missing-secret state.
- Locale changes update `document.documentElement.lang`.
- Route titles are “Create a secret — Secred,” “Manage secret — Secred,” “Saved secrets — Secred,” and “View secret — Secred.”
- Add a keyboard skip link and a “Page not found” catch-all route with a Create a secret action.

## Error handling and accessibility

- Use `role="alert"` for actionable failures and a polite `role="status"` region for health and submission phases.
- Keep focus visible on disclosures, More, retry, settings, and Create.
- Touch targets are at least 44 px outside the formatting toolbar. Formatting commands are at least 36 px, and the More control is 44 px.
- Do not disable editing because the API is unavailable.
- Preserve entered content after encryption, request, or attachment failures.
- Translate all new visible and accessible copy in English and Russian.

## Verification

- Add focused tests for state-specific Manage messaging, locale-to-document-language synchronization, and any extracted pure view-state helpers.
- Run the existing Bun tests, frontend and workspace typechecks, production build, and Biome checks.
- Restart `bun run dev` after frontend changes, as required.
- Recheck Home at 375 x 812, 768 x 1,024, 1,024 x 900, 1,440 x 900, and 1,920 x 1,080 in Chrome.
- Verify no horizontal overflow, light/dark parity, English/Russian text, keyboard focus, reduced motion, toolbar overflow, settings disclosure, file add/remove, password visibility, burn toggle, disabled/ready Create states, health retry, submission errors, and the Manage/Storage/View empty states.

## Out of scope

- Crypto, schema, API, Durable Object, R2, rate-limit, and deployment changes.
- A multi-step creation wizard.
- New authentication, accounts, sharing channels, analytics, or server-side plaintext handling.
- A new component library, frontend framework, font family, or image asset set.
