# Plan: Simplify self-hosting secred.link

**Generated**: 2026-05-04  
**Estimated complexity**: Medium

## Overview

Today the app is **deployed as one Cloudflare Worker** with **static assets**, **two SQLite-backed Durable Objects**, **one R2 bucket** for attachments, and an optional **rate-limit** binding (`wrangler.jsonc`). Self-hosters must duplicate several **account-specific** settings (worker name, R2 bucket names, rate-limit namespace id, `vars.APP_URL`) and fight **Wrangler’s rule that `env.*` blocks do not inherit bindings**—so `development` repeats most of the default config. There is **no Docker path**; “self-hosting” in scope means **your own Cloudflare account** running the same architecture.

**Approach**: (1) **audit** hard-coded operational assumptions and dead config; (2) **reduce friction** via a dedicated **self-host checklist**, optional **`wrangler` env template** / naming placeholders, and a small **preflight script**; (3) **document** prerequisites (R2, DO migrations, rate-limit SKU), **deploy**, and **troubleshooting**; (4) optionally add **CI/deploy templates** that take hostname and bucket names as inputs.

**Explicitly out of scope** for this plan unless later expanded: **non-Cloudflare hosting** (would require replacing DO/R2/ratelimit—a different product), **Kubernetes/Docker** packaging for the Worker runtime, and **managed SaaS** offerings.

## Prerequisites

- Target operators already have or can create a **Cloudflare account** with **Workers Paid** or features needed for **Durable Objects + R2** (and **Rate Limiting** if the binding is kept).
- **Bun** + **Wrangler** (as in root `README.md`).
- Willingness to run **`wrangler deploy`** and create **R2 buckets** / **Durable Object migrations** in that account.

### Suggested defaults (unblock work)

| Decision | Default |
|----------|---------|
| Primary audience | Operators deploying **to their own Cloudflare zone** |
| **Canonical self-host doc path** | Decide in **Task 1.4** (pick **one**: repo-root **`SELF_HOSTING.md`** **or** **`docs/self-hosting.md`**)—Sprint 2 expands that file only; **no duplicate guides** |
| Config delivery | Same canonical doc + optional **`wrangler.selfhost.jsonc.example`** fragment |
| Rate limiting | **Keep** binding; document **fallback** if account cannot create ratelimit namespace (see Risks); **`namespace_id` is not portable**—never copy upstream literals |
| Branding / GitHub link | **Optional** follow-up: env-driven footer link—**not** MVP unless audit shows high traffic to hardcoded URL |
| New markdown vs **AGENTS.md** | **`AGENTS.md`** asks agents not to add unsolicited docs—implementers should treat the canonical self-host doc as an **explicit product-approved exception** so reviews stay aligned |

## Sprint 1: Audit and configuration inventory

**Goal**: Written inventory of every value a self-hoster must change, and removal or clarification of **misleading unused config** (e.g. `APP_URL` today appears **unused** in Worker logic—verify during audit). Confirm whether **`API_RATE_LIMITER` is mandatory at runtime** (today `enforceApiRateLimit` always calls it—**removing the binding requires code changes**, not doc-only).

**Demo / validation**:

- A short **internal table** listing: **Wrangler field**, **purpose**, **example**, **must be unique / optional**.
- Confirmed list of **grep targets** for production hostname (`secred.link`) outside docs.
- **Secrets table**: **`wrangler secret put`** names (`METRICS_TOKEN`, `MIGRATION_TOKEN`), required vs optional, **not** stored in JSONC.

### Task 1.1: Inventory `wrangler.jsonc` and binding usage

- **Location**: `wrangler.jsonc`, `apps/backend/src/**/*.ts`, `apps/backend/src/env.ts`
- **Description**: Document every binding: `name`, `main`, `assets`, `r2_buckets`, `durable_objects`, `migrations`, `ratelimits`, `vars`. Map each to **runtime usage** (`fetch-handler`, `durable-objects`, R2 attachment paths). Confirm **`API_RATE_LIMITER`** is **required** at runtime given current `rate-limit.ts`; flag **vars never read** (e.g. `APP_URL`). Document that **`ratelimits[].namespace_id`** must be **allocated per account**—**not copy-paste** from this repo.
- **Complexity**: 4
- **Dependencies**: None
- **Acceptance criteria**:
  - Table or checklist suitable for pasting into self-host docs.
- **Validation**: Peer review in PR.

### Task 1.2: Scan repo for operator-facing hardcoding

- **Location**: `apps/frontend` (including **`vite.config.ts`**, **`import.meta.env`** usage, build-time constants), `Layout.tsx`, `README.md`, `package.json` name field (informational only), `docs/`
- **Description**: List URLs and brand strings self-hosters may want to change; classify **must change** vs **cosmetic**. Grep for anything that must stay aligned with Worker **`vars.TEST_STRING`** / shared crypto defaults when building the SPA.
- **Complexity**: 3
- **Dependencies**: None
- **Acceptance criteria**:
  - No false promises (“zero config”) if R2/DO are still required.
- **Validation**: Checklist reviewed against grep results.

### Task 1.3: Decide fate of `APP_URL` (and `TEST_STRING`)

- **Location**: `apps/backend/src/env.ts`, call sites (if any after 1.1)
- **Description**: Either **use** `APP_URL` for something operator-visible (e.g. future absolute redirects, `Link` headers—only if product agrees) or **remove from `Env`** and `wrangler.jsonc` to reduce confusion; **`TEST_STRING`** must stay aligned with `packages/shared` / frontend crypto—document that it **must match** the value used when building the SPA if ever split.
- **Complexity**: 5
- **Dependencies**: Task 1.1
- **Acceptance criteria**:
  - Single story in README: either “set APP_URL to your public origin” with code use, or “removed; use same-origin only.”
- **Validation**: `bun run typecheck`; no dangling `env.APP_URL` references.

### Task 1.4: Choose canonical self-host doc filename

- **Location**: Repo root vs `docs/` (decision only)
- **Description**: Pick **one** path (`SELF_HOSTING.md` **or** `docs/self-hosting.md`) before Sprint 2 writes prose; document choice in Task 2.1 and link once from `README.md`.
- **Complexity**: 1
- **Dependencies**: None
- **Acceptance criteria**: No parallel filenames with diverging content.
- **Validation**: Single source of truth listed in Sprint 2 Task 2.1 header.

## Sprint 2: Ergonomic configuration for operators

**Goal**: A self-hoster can follow **one path**: copy template → replace placeholders → run preflight → deploy—without reading the entire monorepo.

**Demo / validation**:

- New contributor can create buckets and deploy using **only** the new doc + template (dry-run on fresh CF account optional).
- Preflight script exits **0** when bindings and vars are consistent.

### Task 2.1: Add canonical self-host guide (outline first)

- **Location**: Path chosen in **Task 1.4**; link from `README.md`
- **Description**: Sections: **Prerequisites** (CF products); **Account**: `wrangler login`, **Account ID** (dashboard / `wrangler whoami`), where it goes for CI; **1. Fork / clone**, **2. Create R2 buckets** (`wrangler r2 bucket create …` with **placeholder names**), **3. Rate limiting namespace** (create binding in account before deploy—**do not reuse upstream `namespace_id`**), **4. Durable Object migrations** (first deploy), **5. Set vars** (`APP_URL`, `ENVIRONMENT`, `VERSION_PREFIX`), **6. Secrets** (`wrangler secret put` for `METRICS_TOKEN`, `MIGRATION_TOKEN`—optional; **not** in JSONC), **7. `bun run build` + `wrangler deploy`**, **8. First URL**: default **workers.dev** hostname smoke test, **then** optional **custom domain / routes** + DNS, **9. Troubleshooting** (409 DO migration, 429 deploy on ratelimits, preview buckets). After any **`wrangler.jsonc` / binding change**, run **`bun run cf:typegen`** (`AGENTS.md`) so `apps/backend/src/worker-configuration.d.ts` stays aligned.
- **Complexity**: 5
- **Dependencies**: Sprint 1 inventory, **Task 1.4** (doc path)
- **Acceptance criteria**:
  - Each step names **exact Wrangler / bun commands**; no dead links to missing scripts.
- **Validation**: Another engineer follows the doc on a **non-production** account.

### Task 2.2: Template fragment for production vars

- **Location**: e.g. `wrangler.selfhost.jsonc.example` or commented block in the **canonical self-host doc** (Task 1.4)
- **Description**: Provide **copy-paste** replacements for: worker `name`, `r2_buckets[].bucket_name`, `ratelimits[].namespace_id` (explain **must be unique string** per Cloudflare docs), and `vars.APP_URL` / `ENVIRONMENT`. Explain **why `development` in `wrangler.jsonc` duplicates bindings** (Wrangler limitation) and that self-hosters may **only edit default** env if they never use `--env development`.
- **Complexity**: 4
- **Dependencies**: Task 2.1
- **Acceptance criteria**:
  - No committed secrets; placeholders clearly marked `YOUR_*`.
- **Validation**: Grep repo for accidental real bucket names if copying from prod.

### Task 2.3: Preflight script `scripts/selfhost-preflight.ts` (or similar)

- **Location**: `scripts/selfhost-preflight.ts`, root `package.json` script `"selfhost:check"`
- **Description**: **Scope honesty**: **static file checks only** by default—cannot prove R2/DO/ratelimit resources **exist** in Cloudflare. Optional advanced step: document **`wrangler deploy --dry-run`** when authenticated. Prefer **manual checklist fallback as default UX** until **comment-aware JSONC** parsing is proven; if parsing ships, use a safe parser (comments strip). Validate: **non-empty** `name`; **R2** bucket names don’t match upstream production literals unless `ALLOW_PROD_NAMES=1`; **`ratelimits[].namespace_id`** not equal to upstream repo literals (same class of bug as bucket names); **`API_RATE_LIMIT_PERIOD_SEC`** matches `ratelimits[].simple.period`; **`TEST_STRING`** matches shared constant. Ship **tests in the same PR** as the script (avoid rewriting for testability later).
- **Complexity**: 6
- **Dependencies**: Tasks 1.1, 2.2
- **Acceptance criteria**:
  - `bun run selfhost:check` runs in CI **without** CF credentials for static checks.
- **Validation**: Unit tests with fixture JSONC snippets in **same change** as script.

### Task 2.4 (optional): Minimal `env` alias for production deploys

- **Location**: `wrangler.jsonc`
- **Description**: If useful, add **`env.selfhosted`** that **only overrides `vars`** and relies on top-level bindings—**only if** Wrangler version in repo supports reducing duplication for this case; **do not** break `wrangler dev --env development`. If Wrangler cannot reduce duplication, **skip** and document why.
- **Complexity**: 5
- **Dependencies**: Task 1.1, consult current Wrangler inheritance behavior
- **Acceptance criteria**:
  - `bun run dev` and `wrangler deploy` unchanged for existing maintainers.
- **Validation**: `wrangler deploy --dry-run` for default env.

## Sprint 3: Operator UX polish and optional automation

**Goal**: Fewer support questions: troubleshooting index, optional GitHub Actions workflow template, and clear **first-deploy migration** story.

**Demo / validation**:

- Troubleshooting section covers **top 3** failures from inventory (ratelimit deploy, DO migration, R2 missing).
- Optional workflow is **disabled by default** or lives under `docs/examples/`.

### Task 3.1: Troubleshooting appendix

- **Location**: `SELF_HOSTING.md` (extend)
- **Description**: **Symptom → cause → fix** for: rate limit binding deploy failure; DO migration “already exists”; R2 403 / missing bucket; `APP_URL` mismatch **if still present**; CORS/CSP **only if** API hosted on different origin (today SPA is same-origin—state “not applicable by default”).
- **Complexity**: 4
- **Dependencies**: Sprint 2
- **Acceptance criteria**:
  - Cross-links to Cloudflare docs for ratelimits and DO SQLite.
- **Validation**: Spot-check against real error messages.

### Task 3.2: Optional GitHub Actions deploy template

- **Location**: e.g. `.github/workflows/deploy-worker.example.yml` or `docs/examples/github-actions-deploy.yml`
- **Description**: Workflow that runs `bun install`, `bun run build`, `wrangler deploy`, using **repository secrets** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. Document **least-privilege** token scopes. **Do not** enable without operator copying and configuring.
- **Complexity**: 5
- **Dependencies**: Task 2.1
- **Acceptance criteria**:
  - Example file clearly labeled **example**; not wired to production repo secrets by default.
- **Validation**: Dry-run `wrangler deploy` locally with same steps.

### Task 3.3: Link from `README.md` and `AGENTS.md`

- **Location**: `README.md`, `AGENTS.md`
- **Description**: One paragraph under **Deploy** pointing to **SELF_HOSTING** doc; agent notes: where bindings live, that self-host is CF-only.
- **Complexity**: 2
- **Dependencies**: Task 2.1
- **Acceptance criteria**:
  - Discoverability without duplicating full procedure in README.
- **Validation**: Manually open links.

## Sprint 4: Regression guardrails and maintainer workflow

**Goal**: Changes don’t break existing dev/prod flows.

**Demo / validation**:

- `bun run test`, `bun run lint`, `bun run typecheck` pass.
- Preflight tests land with the script (Task 2.3).

### Task 4.1: Extend preflight tests (if not fully covered in Task 2.3)

- **Location**: `tests/selfhost-preflight.test.ts` or colocated with script
- **Description**: Only if Task 2.3 did not ship full coverage: add fixtures for **invalid** period mismatch; **warn** prod bucket / copied **`namespace_id`**.
- **Complexity**: 3
- **Dependencies**: Task 2.3
- **Acceptance criteria**: CI runs without network.
- **Validation**: `bun test`.

### Task 4.2: Smoke checklist for maintainers

- **Location**: Canonical self-host doc or `CONTRIBUTING` snippet
- **Description**: After editing `wrangler.jsonc`, run: **`bun run cf:typegen`**, `bun run selfhost:check`, `bun run dev` (local), optional `wrangler deploy --dry-run` before merge.
- **Complexity**: 2
- **Dependencies**: Task 2.3
- **Acceptance criteria**: Short bullet list; no new mandatory CI gate unless team wants it.

## Testing strategy

| Layer | What |
|--------|------|
| Unit | Preflight JSONC fixtures; any new pure helpers from Task 1.3 |
| Manual | Follow `SELF_HOSTING.md` on a throwaway CF account |
| Regression | Existing `bun test` + typecheck after `wrangler.jsonc` / `env` edits |

## Potential risks and gotchas

- **Rate Limiting binding**: Some accounts or plans may **fail `wrangler deploy`** when `ratelimits` is present—README already hints; mitigation: documented **temporary removal** of `ratelimits` + code path that makes `API_RATE_LIMITER` optional (**larger change**—only if product approves; otherwise doc-only workaround).
- **Wrangler env inheritance**: Duplication between top-level and `env.development` may **remain**; avoid false expectations of YAML-style DRY.
- **Durable Object migrations**: First-time deploy order matters; wrong migration tags **damage** production—doc must say **never reuse** another account’s SQLite DO state.
- **R2 preview vs production bucket**: Clarify **preview_bucket_name** for `wrangler dev` vs deploy.
- **Security**: Self-hosters must still configure **WAF**, **TLS**, and **secrets rotation**—out of code scope but mention in doc.

## Rollback plan

- Documentation and example files: revert commits.
- If `APP_URL` removed or `env` types change: revert Task 1.3 and restore **`worker-configuration.d.ts`** via **`bun run cf:typegen`** after restoring `wrangler.jsonc`.
- Preflight script: delete script and package script entry.

---

## Plan notes (lifecycle / ambiguities)

- **“Simplify”** means **operator ergonomics**, not removing Cloudflare primitives.
- **`APP_URL`**: Resolved in Sprint 1 Task 1.3 to avoid zombie config.
- **Branding**: GitHub link in `Layout.tsx` is **cosmetic**; optional later env—call out in Sprint 1.2.
- **Rate-limit optional code path**: Product decision—see Risks; **not** doc-only removal while `enforceApiRateLimit` requires the binding.

---

## External review (incorporated)

Subagent feedback merged into Tasks **1.1–1.4**, **2.1**, **2.3**, **4.2**, and Risks: account login / Account ID, workers.dev before custom domain, **`cf:typegen`** in workflow, frontend/Vite audit breadth, **`wrangler secret`** inventory, non-portable **`namespace_id`**, static vs authenticated preflight expectations, Phase/Sprint naming separation (this section vs Sprint 4).
