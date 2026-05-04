# Plan: CLI utility for secred.link secrets

**Generated**: 2026-05-04  
**Estimated complexity**: Medium

## Overview

Add a small **Bun-based CLI** (new workspace package) that reuses `@secred/shared` for **client-side encryption** and the same **HTTP API** as the web app (`POST/GET/DELETE` under `/api`, attachment `PUT`/`GET`). The server never sees passwords or raw access/manage keys—only hashes and ciphertext—so the CLI mirrors the browser model: **derive keys locally**, **upload ciphertext**, **fetch and decrypt** with the user’s password.

**Approach**: introduce `packages/cli` (or `apps/cli`) with a single entry (`secred` / `secred-link` binary via `package.json` `"bin"`), thin HTTP helpers wrapping `apiUrl` + `HttpHeader` from shared, and commands that call existing primitives: `buildCreateSecretPayload`, `decryptSecretPayload`, `decryptAttachmentBytes`, plus attachment upload/download aligned with `apps/frontend/src/lib/api.ts`.

## Prerequisites

- **Runtime**: **Bun** (already used for `bun test`; `SubtleCrypto` available—same as tests in `tests/crypto.test.ts`).
- **API base URL**: configurable (`--base-url` or `SECRED_API_URL`); default **`https://secred.link`** unless overridden (document in `--help`).
- **No new server features** for MVP unless explicitly scoped—CLI is a **client** of the existing Worker API (`apps/backend/src/api/handler.ts`).
- **Scope assumptions** (confirm or adjust before coding):
  - MVP targets **text + optional attachment** create, **fetch/decrypt** (open), **delete** with manage key, **health** check.
  - **Installation**: start **repo-local** (`bun run --cwd packages/cli` or root script); add **npm publish** or **GitHub Releases** only if product asks for it.

### Suggested defaults (unblock Sprint 1)

| Decision | Default |
|----------|---------|
| Binary / package name | `secred` (npm package name can be `@secred/cli` or `secred-cli` to avoid global collisions) |
| Default `--base-url` / `SECRED_API_URL` | `https://secred.link` (override for dev/staging) |
| `open` vs `delete` inputs | `open` uses **access** URL/fragment only; `delete` requires **manage** URL/fragment or explicit manage key material—mirror web UX |
| `bin` entry for npm | Document **Bun** as primary (`bun / path/to/main.ts`); if publishing for Node users, add a **prebuilt `dist/index.js`** story in Sprint 1 research |

**Link parsing early**: Implement **parse share + manage URL/fragment** in **Sprint 1** so `create` output can be **validated** with the same code path as `open` / `delete`, avoiding URL drift.

## Sprint 1: Package skeleton, link parsing, and API plumbing

**Goal**: Runnable CLI that calls `GET /api/health` and prints JSON or status; establishes config parsing, base URL, **share/manage link parsing (Task 1.5)**, and shared imports.

**Demo / validation**:

- `bun run --cwd packages/cli dev` (or global `secred health`) against local `wrangler dev` and production returns ok.
- Unit test: mock `fetch` or use local worker in CI optional—at minimum **pure URL builder** test using `apiUrl.health()`.

### Task 1.1: Create workspace package

- **Location**: `package.json` (root workspaces already include `packages/*`), new `packages/cli/package.json`, `packages/cli/tsconfig.json`, `packages/cli/src/main.ts`.
- **Description**: Add `packages/cli` with dependency on `@secred/shared` (workspace protocol), `"type": "module"`. **Decide and document the `bin` story** in the same task: **Bun-run TypeScript entry** (e.g. `bun run src/main.ts`) for contributors vs **compiled `dist/`** for `npm i -g` consumers—do not leave ambiguous through Sprint 4.
- **Complexity**: 3
- **Dependencies**: None
- **Acceptance criteria**:
  - Root `bun install` links the package.
  - `bun run typecheck` includes the new package (extend root `typecheck` script or add to existing `tsc` projects).
  - Root **`biome check`** includes `packages/cli` (extend `biome.json` scope if needed).
- **Validation**: `bunx biome check packages/cli`, `tsc --noEmit -p packages/cli/tsconfig.json`.

### Task 1.2: CLI framework and global options

- **Location**: `packages/cli/src/main.ts`, optional `packages/cli/src/cli.ts`.
- **Description**: Parse argv with a minimal dependency-free parser or a small library (e.g. `cac` / `commander`—keep bundle small; add the dep only under `packages/cli`). Support `--base-url`, `-h`, version, and **global `--json`** (machine-readable success output for scripting when applicable). Define a **small exit-code table** and use it consistently: e.g. **0** = success, **1** = runtime/API failure, **2** = usage/parse/invalid input.
- **Complexity**: 4
- **Dependencies**: Task 1.1
- **Acceptance criteria**:
  - Unknown flags produce clear errors (exit **2**).
  - Base URL normalized (no trailing slash issues).
- **Validation**: Manual `--help` snapshot or small parser test; document exit codes in `--help`.

### Task 1.3: HTTP client module

- **Location**: `packages/cli/src/http.ts`
- **Description**: Wrap `fetch` with JSON helpers for `CreateSecretResponse`, `GetSecretResponse`, `DeleteSecretResponse`, `HealthResponse` using types from `@secred/shared` and paths from `apiUrl`. Reuse `HttpHeader` for attachment upload token. Map **Worker validation errors** using shared **`api-errors`** / messages where applicable so CLI output is stable (not only “non-JSON body”). Optional: **429** from `API_RATE_LIMITER` → **one retry with backoff** or clear “rate limited” message (document for CI users).
- **Complexity**: 4
- **Dependencies**: Task 1.1
- **Acceptance criteria**:
  - Centralized error handling (non-JSON body, 4xx/5xx, structured validation messages when present).
- **Validation**: Bun test with mocked `globalThis.fetch` (include 429 and 400 with JSON body).

### Task 1.4: `health` command

- **Location**: `packages/cli/src/commands/health.ts`, wired from `main.ts`.
- **Description**: `GET` `apiUrl.health()` relative to base URL; print `status`, `environment`, `version`, `timestamp`.
- **Complexity**: 2
- **Dependencies**: Tasks 1.2, 1.3
- **Acceptance criteria**:
  - Exit code non-zero on network/HTTP failure.
- **Validation**: Run against real endpoint once; mock in tests.

### Task 1.5: Parse share and manage links (access + manage)

- **Location**: `packages/cli/src/parse-link.ts`
- **Description**: Accept full HTTPS URL with fragment (`#…`), or raw fragment string. Extract **access** key material for `GET`/`DELETE` paths and **manage** key material where needed for delete—same rules as **apps/frontend** (router + hash conventions). Map to `accessKeyHash` / `manageKeyHash` for `apiUrl.secret`, `apiUrl.deleteSecret` (see `getAccessKeyHashes`, `getManageKeyHash`, local-storage types). **Use this module to validate `create` printed URLs** in tests (round-trip or snapshot).
- **Complexity**: 6
- **Dependencies**: Task 1.1
- **Acceptance criteria**:
  - Invalid input: clear error, exit code **2**.
  - **Manage** URL parsing has tests with equal rigor to access parsing.
- **Validation**: Unit tests with fixtures aligned with frontend behavior.

## Sprint 2: Create secret (text, optional attachment)

**Goal**: `secred create` reads password (prompt or flag), body text and options, runs `buildCreateSecretPayload`, `POST /api/secrets`, optional `PUT` attachment; prints **share URL** and **manage URL** fragments as the web app does (sid in hash).

**Demo / validation**:

- Create a secret on development Worker; open link in browser and decrypt.
- Create with `--attachment` file ≤ `MAX_ATTACHMENT_BYTES`; verify download in browser or Sprint 3 CLI.

### Task 2.1: Password input helper

- **Location**: `packages/cli/src/prompt.ts`
- **Description**: Read password from TTY with **no echo** (Bun `node:readline` or `prompt`); support `--password-file` or env **only if documented** (weaker security—prefer stdin prompt). Optional `--password` for automation with warning in `--help`.
- **Complexity**: 4
- **Dependencies**: Sprint 1
- **Acceptance criteria**:
  - Password never logged; stderr for prompts.
- **Validation**: Manual test; optional integration test with piped input.

### Task 2.2: `create` command — text-only path

- **Location**: `packages/cli/src/commands/create.ts`
- **Description**: Flags: `--lifetime` (seconds, aligned with `EXPIRATION_OPTIONS` or raw seconds), `--burn`, `--text` / stdin for content. Call `buildCreateSecretPayload` with `DEFAULT_VERSION_PREFIX` / `DEFAULT_TEST_STRING` same as frontend defaults. `POST` body from `payload.request`. Print share URL: origin + path convention used by frontend (verify exact route in `apps/frontend` router); print manage hash fragment (`payload.sid` / keys—mirror `Home.tsx` navigate target).
- **Complexity**: 6
- **Dependencies**: Tasks 2.1, 1.3, 1.5
- **Acceptance criteria**:
  - Output matches web-created secret URL structure for same inputs; **Task 1.5** parser accepts CLI-printed URLs without modification.
- **Validation**: Compare URL with one created from UI for same lifetime/password (manual); crypto covered by existing `tests/crypto.test.ts`.

### Task 2.3: `create` — attachment upload

- **Location**: `packages/cli/src/commands/create.ts` (extend)
- **Description**: If attachment path provided, after successful `POST`, `PUT` to `apiUrl.attachment(accessKeyHash)` with `HttpHeader.UploadToken` and body from `payload.attachmentCipher` (same as `apps/frontend/src/lib/api.ts` `uploadSecretAttachment`).
- **Complexity**: 5
- **Dependencies**: Task 2.2
- **Acceptance criteria**:
  - Large files stream or read into `Uint8Array` with size check vs `MAX_ATTACHMENT_BYTES`.
  - Failure after POST leaves ciphertext on server—**document** that the printed **manage link** is the user’s **cleanup** path (`delete`); no separate orphan API in MVP.
- **Validation**: Integration test with mock server or dev Worker.

## Sprint 3: Open (fetch + decrypt) and delete

**Goal**: `secred open <url-or-access-fragment>` fetches ciphertext, prompts password, decrypts text to stdout; optionally downloads attachment to file using `attachmentBurnToken` from `GetSecretResponse` when present. `secred delete` calls `DELETE` with access + manage key hashes (inputs parsed via **Task 1.5**).

**Demo / validation**:

- Round-trip: `create` → `open` shows original text; burn-after-read: second open fails as expected.
- `delete` removes secret (404 on subsequent get).
- **Burn + attachment**: automated test that **GET JSON → then attachment GET with `attachmentBurnToken`** matches order used in the web app (see `apps/frontend` consume path).

### Task 3.1: `open` command

- **Location**: `packages/cli/src/commands/open.ts`
- **Description**: `GET` secret JSON; `decryptSecretPayload` with password and `accessKey` recovered via **Task 1.5**. Use **`DEFAULT_TEST_STRING`** identically to frontend (fixed canary for password verification—not a user secret). Print markdown/text to stdout; if stderr is TTY and stdout is pipe, consider warnings for binary. For attachments: `GET` `apiUrl.attachment(accessKeyHash, burnToken)` only after JSON response; decrypt with `decryptAttachmentBytes`; write to `--output` path; handle burn metadata per `GetSecretResponse`.
- **Complexity**: 7
- **Dependencies**: Tasks 1.5, 2.1, 1.3
- **Acceptance criteria**:
  - Burn-after-read: user sees burn warning if `isBurned` in response.
  - Wrong password: clean error (no stack trace in production build).
- **Validation**: Golden-path test with payload from `buildCreateSecretPayload` + mock HTTP; add **burn + attachment** flow test mirroring frontend order.

### Task 3.2: `delete` command

- **Location**: `packages/cli/src/commands/delete.ts`
- **Description**: Accept **manage** URL/fragment or explicit hash pair via **Task 1.5**; `DELETE` `apiUrl.deleteSecret(accessKeyHash, manageKeyHash)`.
- **Complexity**: 4
- **Dependencies**: Task 1.5
- **Acceptance criteria**:
  - 404 handled as “already deleted or not found”.
- **Validation**: Mock fetch test.

## Sprint 4: Quality, docs, release options

**Goal**: Tests, lint, CI, and user-facing documentation for install and safety.

**Demo / validation**:

- `bun run test` and `bun run lint` pass at repo root.
- README section or `packages/cli/README.md` with examples (user asked for plan only—**implementation** adds doc when approved).

### Task 4.1: Integration tests (optional network)

- **Location**: `packages/cli/test/*.test.ts` or `tests/cli.test.ts`
- **Description**: Prefer **mocked fetch**; one optional **live** test behind `SECRED_CLI_LIVE=1` hitting staging/dev.
- **Complexity**: 5
- **Dependencies**: Sprints 1–3
- **Acceptance criteria**: CI runs without network by default.
- **Validation**: `bun test`.

### Task 4.2: Wire root scripts and publishing metadata

- **Location**: Root `package.json`, `packages/cli/package.json`
- **Description**: Add `cli` script alias if useful (`"cli": "bun run --cwd packages/cli …"`). If publishing: `"files"`, `repository` field, semver—**only if** product decision is public npm.
- **Complexity**: 3
- **Dependencies**: Prior sprints
- **Acceptance criteria**: Single command documented for contributors.
- **Validation**: Fresh clone install smoke test.

### Task 4.3: Security UX review

- **Location**: `packages/cli/README.md` (when implementing)
- **Description**: Document threat model: passwords in shell history if `--password` used; encourage TTY prompt; HTTPS-only base URL validation optional warning.
- **Complexity**: 2
- **Dependencies**: Sprints 1–3
- **Acceptance criteria**: No secrets printed in verbose logs.
- **Validation**: Manual grep for `console.log` of keys/password.

## Testing strategy

| Layer | What |
|--------|------|
| Unit | URL parsing, HTTP wrapper error paths, optional argv parsing |
| Crypto | Rely on `tests/crypto.test.ts`—do not duplicate KDF tests |
| Integration | Mock `fetch` full flows; optional live dev Worker |
| Burn + attachment | Explicit test: JSON GET then attachment GET with `attachmentBurnToken` (match frontend) |
| Manual | Round-trip with browser for URL compatibility |

## Potential risks and gotchas

- **PBKDF2 cost**: `PBKDF2_ITERATIONS` (310k) makes `create`/`open` slow—expected; UX = **spinner and/or elapsed-time message** on stderr (there are no fine-grained progress hooks in shared crypto unless added later).
- **API rate limits**: `fetch-handler.ts` / `API_RATE_LIMITER` may throttle scripted creates—retry/backoff or document for CI.
- **Attachment orphan**: POST succeeds but PUT fails—user sees partial state; document; optional future `delete` if manage key was printed.
- **Burn vs attachment**: Second fetch for attachment must use `attachmentBurnToken` from JSON response—order of operations must match frontend.
- **URL / hash parsing**: Bugs here leak “wrong password” vs “bad link”—invest extra tests in **Task 1.5**.
- **Windows**: TTY password and paths—lower priority unless explicitly supported; call out in README.

## Rollback plan

- Remove `packages/cli` and workspace reference; revert root `typecheck`/scripts/Biome scope changes.
- If the MVP **never edits `packages/shared`**, rollback stops there. If any shared export or crypto helper was added **for the CLI**, rollback must also revert those commits or maintain compatibility.

---

## Phase 4 (plan review): Additional pitfalls captured above

- Shared package must stay **unchanged** for MVP unless a CLI-specific export is truly needed—prefer importing existing symbols only.
- If `packages/cli` uses a CLI parser dependency, keep it **scoped to cli package.json**—do not inflate root `dependencies` unless required.
