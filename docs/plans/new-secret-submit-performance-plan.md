# Plan: New secret submit performance

**Generated**: 2026-05-04  
**Estimated Complexity**: Medium

## Overview

Submitting a secret is dominated by **client-side key derivation** (PBKDF2 at 310,000 iterations, once for the main payload and **again** for file attachments), plus **one Durable Object round trip** for `POST /api/secrets` and, with attachments, a **second request** uploading ciphertext. The Worker path is comparatively light (Zod validation, DO `get` → `put` → `setAlarm`, metrics via `waitUntil`). Improving perceived and wall-clock time needs **measurement first**, then targeted changes: optional **single-derivation / shared-salt** protocol (larger change), **Web Worker** offloading for UI responsiveness, **network** tuning, and **UX** (progress, idempotency). (A separate “health check” fetch is not on the critical path for submit unless measurements show it contends with the main request; skip unless profiled.)

**Open source & “encryption strings”:** Constants such as `DEFAULT_TEST_STRING`, `PBKDF2_ITERATIONS`, and format prefixes are **not secret material**. They describe algorithms and a **fixed plaintext canary** used to verify the password after decryption. Real secrecy comes from the **user password**, **random per-secret salt**, **access/manage keys** (never sent raw to the server), and **ciphertext**. Publishing the test string does not give attackers the key; offline guessing is still limited by password strength and PBKDF2 cost. Ensure **production secrets** (`MIGRATION_TOKEN`, `METRICS_TOKEN`, etc.) stay out of the repo (env-only).

## Prerequisites

- Ability to run the app locally (`bun run dev`) and/or staging Worker.
- Browser DevTools (Performance, Network) for client-side breakdown.
- Optional: Cloudflare dashboard analytics / Workers traces for server latency.

## Sprint 1: Baseline & bottleneck identification

**Goal**: Quantify where time goes (crypto vs network vs DO vs rate limiter) before changing behavior.

**Demo/Validation**:

- Document median timings for: no attachment, with attachment (small/large), cold vs warm tab.
- Confirm whether slowness is CPU-bound on main thread (long tasks) vs waiting on network.

### Task 1.0: Skim server path (lightweight, optional but quick)

- **Location**: `apps/backend/src/api/handler.ts`, `durable-objects.ts`, `rate-limit.ts`
- **Description**: Confirm body parsing, DO `get`/`put`/`setAlarm`, and rate limiter are unlikely to dominate latency vs client PBKDF2; note JSON/body size limits. Can run **alongside** Task 1.1–1.2 so you do not over-invest in protocol work if the server is already noise.
- **Complexity**: 2
- **Dependencies**: None
- **Acceptance Criteria**: One-paragraph “server is / is not the bottleneck” note.
- **Validation**: `bun run test`, optional `wrangler dev` single request.

### Task 1.1: Client instrumentation (dev-only or feature-flagged)

- **Location**: `apps/frontend/src/pages/Home.tsx` (submit path), optionally `packages/shared/src/crypto.ts` (wrap `buildCreateSecretPayload`)
- **Description**: Add `performance.mark` / `measure` (or simple `console.time`) around: `buildCreateSecretPayload` total, and if feasible sub-parts (attachment encrypt vs `encryptSecretPayload`); measure `api.createSecret` and `uploadSecretAttachment` separately.
- **Complexity**: 3
- **Dependencies**: None
- **Acceptance Criteria**:
  - One place logs or surfaces timings for a single submit flow.
- **Validation**: Manual submit; compare text-only vs with attachment.

### Task 1.2: Network + Worker timing notes

- **Location**: Browser Network tab; optional Wrangler / `wrangler tail` for Worker
- **Description**: Record TTFB and total time for `POST /api/secrets` and `PUT` attachment; note `enforceApiRateLimit` hop and DO latency. Can run **in parallel** with Task 1.1 to finish the baseline sprint faster.
- **Complexity**: 2
- **Dependencies**: None (informal handoff with 1.1 is enough)
- **Acceptance Criteria**:
  - Short written note: % of total time on client crypto vs API.
- **Validation**: Repeat 5 runs; ignore first-run cold start outliers if present.

## Sprint 2: Low-risk improvements (perceived + incremental wall-clock)

**Goal**: Improve responsiveness and trim avoidable overhead without a new crypto version.

**Demo/Validation**:

- UI remains interactive during heavy crypto; no regression in create/upload success.
- Optional: small reduction in main-thread long-task duration.

### Task 2.1: Offload crypto to a Web Worker (optional but high UX impact)

- **Location**: New worker module under `apps/frontend/src/`; call site from `Home.tsx` or a small `submitSecret` helper
- **Description**: Run `buildCreateSecretPayload` (or the async crypto parts) in a dedicated Worker so the main thread is not blocked; use `Comlink` or plain `postMessage` with structured cloning. Prefer **transferable** `ArrayBuffer` / buffer views for large attachments to avoid extra copies. Test on **Safari** and low-end devices (`SubtleCrypto` in workers can differ in edge cases). Watch bundle size if shared + worker both pull large deps.
- **Complexity**: 6
- **Dependencies**: Sprint 1 confirms main-thread blocking is a problem
- **Acceptance Criteria**:
  - Submit still works; attachment + text paths covered.
- **Validation**: Manual + existing `bun run test` if any shared code paths change.

### Task 2.2: Upload path optimizations

- **Location**: `apps/frontend/src/lib/api.ts` (`uploadSecretAttachment`)
- **Description**: Profile before changing: avoid unnecessary buffer copies only if the profiler shows cost; `fetch` body semantics vary—**measure**, then remove copies if justified. Ensure connection reuse (same origin; default keep-alive). Document max payload behavior.
- **Complexity**: 2
- **Dependencies**: Task 1.1 (profiler evidence)
- **Acceptance Criteria**:
  - Copy removal only when validated; otherwise leave as-is.
- **Validation**: Large attachment upload still completes.

### Task 2.3: Submit UX

- **Location**: `apps/frontend/src/pages/Home.tsx`, related components
- **Description**: If crypto runs long, show deterministic progress (e.g. “Encrypting…” → “Uploading…”) based on known phases; **disable double-submit** and align with **rate limits** (`/api/*`) so retries during slow crypto do not burn the client’s quota.
- **Complexity**: 3
- **Dependencies**: Task 1.1 (phases clear)
- **Acceptance Criteria**:
  - User sees which phase is slow during debugging / normal use.
- **Validation**: Manual.

## Sprint 3: Protocol / crypto efficiency (higher impact, higher risk)

**Status (implemented)**: `buildCreateSecretPayload` with an attachment now uses **`v4.j.` + `v4.f.`** — one PBKDF2, then HKDF subkeys (`secred.v4.kdf.test` / `body` / `file`) and three AES-GCM blobs. Text-only flow remains **`v3.j.`**. **Decrypt** accepts `v4` and all older formats. Standalone `encryptAttachmentBytes` still produces **v3.f.** (tests / legacy callers).

**Goal**: Reduce duplicate PBKDF2 work when attachments are present (today: **two** full 310k-iteration derivations with independent salts in `buildCreateSecretPayload`).

**Demo/Validation**:

- New envelope version (e.g. v4) or extended v3 that uses **one salt, one `deriveKey`, multiple AES-GCM blobs** for test + body + optional file.
- Backward compatibility: existing secrets still decrypt; new creates use optimized path.

### Task 3.1: Design one-derivation envelope

- **Location**: `packages/shared/src/crypto.ts`, `constants.ts`, `validation.ts`, tests `tests/crypto.test.ts`
- **Description**: Specify format: single PBKDF2, same key for encrypting `testString`, JSON/plain body, and file bytes (**distinct IVs per ciphertext**). Spell out **domain separation** beyond IV uniqueness—e.g. HKDF-expand or explicit labeled subkeys per purpose—so multi-blob reuse cannot be mis-analyzed later. Align with `decryptSecretPayload` / attachment decrypt entry points.
- **Complexity**: 7
- **Dependencies**: Sprint 1 data shows dual PBKDF2 is material for attachment users
- **Acceptance Criteria**:
  - Written envelope spec + test vectors.
- **Validation**: Unit tests for encrypt/decrypt round-trip.

### Task 3.2: Wire create flow to new format behind version flag

- **Location**: `buildCreateSecretPayload`, Worker unchanged if ciphertext stays opaque
- **Description**: Emit new format when `versionPrefix`/feature allows; keep legacy path for older clients if needed. **Rollout**: If non-web consumers (forks, API clients, cached old JS) must read secrets, document upgrade expectations or keep decrypt backward-compatible indefinitely for stored ciphertexts.
- **Complexity**: 6
- **Dependencies**: Task 3.1
- **Acceptance Criteria**:
  - Attachment submits perform one PBKDF2 for the new path.
- **Validation**: E2E manual + crypto tests + **golden fixture** of production-shaped JSON/ciphertext for the new envelope so integration tests catch prefix/version bugs.

### Task 3.3: Iteration count policy (only if product accepts tradeoff)

- **Status**: Not changed — `PBKDF2_ITERATIONS` remains 310_000; a short comment in `constants.ts` notes that changing it requires envelope / decrypt migration. Revisit with explicit security/product approval if UX still warrants it.
- **Location**: `packages/shared/src/constants.ts` (`PBKDF2_ITERATIONS`)
- **Description**: Evaluate lowering iterations with OWASP 2024 guidance; must balance UX vs threat model (secrets are short-lived). Any change should be versioned in envelope (`i` field) for migration. **Scope note**: changing KDF family (e.g. away from PBKDF2) may hit Web Crypto availability—document whether only iteration count is in scope unless you add a fallback implementation.
- **Complexity**: 5
- **Dependencies**: Security review
- **Acceptance Criteria**:
  - Documented rationale and migration story.
- **Validation**: Benchmark before/after on mid-tier mobile.

## Sprint 4: Server-side sanity (optional polish)

**Goal**: Confirm Worker path is not accidentally heavy (much of this overlaps **Task 1.0**—do not duplicate; treat Sprint 4 as follow-up only if 1.0 found issues).

**Demo/Validation**:

- No regression in API behavior; metrics still increment.

### Task 4.1: Handler micro-review

- **Location**: `apps/backend/src/api/handler.ts`, `durable-objects.ts`
- **Description**: Confirm `request.json()` body size is acceptable; `incrementMetric` stays non-blocking (`waitUntil`). Consider whether `create()` could batch storage ops (usually marginal vs client PBKDF2).
- **Complexity**: 2
- **Dependencies**: Task 1.0 if server time is non-trivial
- **Acceptance Criteria**:
  - Notes or tiny safe tweaks only if measurements justify.
- **Validation**: `bun run test`, manual create.

## Testing Strategy

- **Unit**: `packages/shared` crypto round-trips after any envelope change.
- **Integration**: Existing `tests/routes.test.ts` and handler tests for API shape.
- **Golden vectors**: After any new envelope, add a fixture that mirrors production JSON/ciphertext shape (not only internal round-trips).
- **Manual**: Text-only, password-protected, burnable, with/without attachment, slow 3G throttling in DevTools.

## Potential Risks & Gotchas

- **Lowering PBKDF2 iterations** weakens offline guessing; mitigated by strong passwords and short secret TTL, but needs explicit product/security sign-off.
- **Single-derivation redesign** must not leak key reuse across contexts (separate IVs per plaintext; HKDF/labels per purpose—see Task 3.1).
- **Large attachments**: Even with faster crypto, peak **RAM** holds plaintext and ciphertext; perf work may not fix OOM on huge files within `MAX_ATTACHMENT_BYTES`.
- **Web Workers**: Bundler must include shared crypto in worker chunk; watch for duplicate CryptoJS or large bundles.
- **Durable Objects**: First request to a new DO can pay cold-start cost; rare per secret but visible; not fixed by app code alone.
- **Double-submit / rate limits**: Slow encrypt + user double-click can trigger duplicate creates or 429s; tie UX (Task 2.3) to rate-limit behavior.

## Rollback Plan

- Feature-flag Web Worker path and new envelope version; revert to previous `buildCreateSecretPayload` behavior via version prefix or compile-time flag.
- Git revert of iteration-count changes if benchmarks show unexpected security/compat issues.
