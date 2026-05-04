# secred.link

Secure, expiring secret sharing: you write content (Markdown or rich text), optionally attach a file and protect it with a passphrase, then share a link. The **server never sees plaintext**. Encryption runs in the browser; the Cloudflare Worker stores only ciphertext, verification blobs, hashed keys, and TTL metadata.

---

## Features

- **Client-side encryption** — Payloads use modern envelopes (`v3.j.` JSON + AES-GCM with PBKDF2); older links may still use legacy CryptoJS ciphertext (decrypt-only path).
- **Password-protected secrets** — Offline guessing cost is dominated by PBKDF2 iterations; users should pick strong passphrases (the UI shows rough strength hints).
- **Optional burn-after-read** — Supported for text-only flows; attachments use a separate burn-token window where configured.
- **Manage link** — After creating a secret, owners get a manage URL (stored briefly in `localStorage`) to copy the viewer link or delete the secret server-side.
- **i18n** — English and Russian (`apps/frontend/src/locales`).

---

## Architecture

```text
Browser (React/Vite)
    │  HTTPS
    ▼
Cloudflare Worker (apps/backend)
    ├── Static assets ─ apps/frontend/dist (SPA)
    └── /api/*        → HTTP handler → Durable Objects
                            ├── SECRETS → SQLite-backed SecretObject (+ R2 attachment refs)
                            └── METRICS → MetricsObject (counters)
```

Shared logic (`packages/shared`) includes:

- Cryptographic primitives and legacy compatibility  
- Zod request validation  
- API route paths, URL builders, and stable error strings  
- Types for requests/responses and stored rows  

---

## Monorepo layout

```text
apps/frontend     React SPA (Vite, Tailwind, shadcn-style UI)
apps/backend      Worker entrypoint + Durable Objects + api/handler.ts
packages/shared   Types, crypto, validation, routes, api-errors
tests             Bun unit tests
wrangler.jsonc    Workers config (assets, DOs, R2, env vars)
```

---

## Prerequisites

- [Bun](https://bun.sh) (package manager and test runner)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) (installed via project devDependencies; use `bunx wrangler` or `npx wrangler` if needed)

---

## Development

Install dependencies:

```bash
bun install
```

Run the full stack locally (builds the frontend, then starts the Worker with the `development` env from `wrangler.jsonc`):

```bash
bun run dev
```

Useful scripts:

| Script | Purpose |
|--------|---------|
| `bun run build` | Production build of the frontend + TypeScript check all packages |
| `bun run build:frontend` | Vite build only (`apps/frontend/dist`) |
| `bun run typecheck` | `tsc --noEmit` for shared, backend, frontend |
| `bun run test` | Bun tests in `tests/` |
| `bun run lint` | Biome check |
| `bun run format` | Biome format write |
| `bun run cf:typegen` | Regenerate `apps/backend/src/worker-configuration.d.ts` after Wrangler binding changes |

Preview with local persistence behavior:

```bash
bun run preview
```

---

## HTTP API (Worker)

All JSON routes live under `/api`. The frontend uses helpers from `packages/shared` (`apiUrl`, etc.) so paths stay consistent with `apps/backend/src/api/handler.ts`.

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/health` | Liveness + version info |
| POST | `/api/secrets` | Create secret; body includes `ciphertext`, `testCiphertext`, hashed keys |
| GET | `/api/secrets/:accessKeyHash` | Fetch ciphertext bundle (64-char hex id) |
| DELETE | `/api/secrets/:accessKeyHash/:manageKeyHash` | Owner delete |
| PUT | `/api/secrets/:accessKeyHash/attachment` | Upload encrypted attachment (`X-Upload-Token`) |
| GET | `/api/secrets/:accessKeyHash/attachment` | Download (optional `burnToken` query) |
| GET | `/api/metrics` | **Disabled until** `METRICS_TOKEN` is set; then requires `Authorization: Bearer …` |

Plaintext never appears in these payloads.

### Rate limiting (`/api/*`)

The Worker uses Cloudflare’s **[Rate Limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)** before the HTTP API handler. Limits are applied **per client IP** (`CF-Connecting-IP`, then `X-Forwarded-For`, else a shared `unknown` bucket in dev).

Default policy (see `ratelimits` in `wrangler.jsonc`): **120 requests per 60 seconds** per IP per namespace. Excess traffic receives **429** with JSON `{ "error": "Too many requests" }` and a `Retry-After` header (60 seconds). Static assets are not rate limited. If `wrangler deploy` errors on the ratelimit binding, confirm your Cloudflare account supports [Workers Rate Limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).

Production and `development` env each declare their own `ratelimits` block (Wrangler does not inherit this section). Adjust `simple.limit` / `simple.period` (allowed periods are **10** or **60** seconds) and keep `API_RATE_LIMIT_PERIOD_SEC` in `apps/backend/src/rate-limit.ts` aligned with `period` for `Retry-After`.

---

## Cloudflare configuration

`wrangler.jsonc` defines:

- Worker entry: `apps/backend/src/index.ts`
- Static assets directory: `apps/frontend/dist`
- R2 bucket binding for attachments
- Durable Object namespaces `SECRETS` and `METRICS`
- **`ratelimits`** binding `API_RATE_LIMITER` for `/api/*` (see above)
- Non-secret `vars` (`APP_URL`, `ENVIRONMENT`, `VERSION_PREFIX`, …)

### Secrets (Wrangler)

```bash
# Optional: metrics endpoint bearer token
wrangler secret put METRICS_TOKEN

# Optional: authenticated migration/import endpoint
wrangler secret put MIGRATION_TOKEN
```

For local development you can put the same keys in a `.dev.vars` file (not committed).

### Deploy

```bash
bun run build
wrangler deploy
```

(`bun run deploy` runs a frontend build then `wrangler deploy` with the default environment.)

---

## Security model (short)

- Viewer links carry the raw **access key** in the URL fragment; anyone with the link can request ciphertext from the API. **Passphrase-protected** secrets depend on password strength for confidentiality.
- The Worker stores **double-hashed** access/manage identifiers; it cannot derive raw keys from stored rows.
- Additional hardening: dashboard **WAF / bot rules** on your hostname, dependency updates, and CSP in `apps/frontend/index.html`.

---

## AI / editor assistants

Repository-specific hints for tools and agents live in **AGENTS.md** (layout, commands, conventions).

## License / project

Private project (`"private": true` in `package.json`). Adjust this section if you open-source the repo.
