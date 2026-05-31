# Agent notes (secred.link)

Concise context for automated assistants working in this repo.

## What this is

Browser-first secret sharing: plaintext is encrypted **before** upload. Cloudflare Workers + Durable Objects store ciphertext and metadata only; raw access/manage keys never appear on the server (only SHA-256-derived identifiers).

## Repo layout

| Path | Role |
|------|------|
| `apps/frontend` | Vite + React + React Router UI |
| `apps/backend` | Worker entry, `SecretObject` / `MetricsObject` DOs, HTTP handler (`src/api/handler.ts`) |
| `packages/shared` | Crypto, Zod schemas, API routes/helpers, types — **single source** for client + Worker |
| `tests` | Bun tests (`crypto`, `routes`, `local-storage`) |

Wrangler root config: `wrangler.jsonc`. Worker main: `apps/backend/src/index.ts` (re-exports DO classes + default fetch).

## Commands (run from repo root)

- `bun install` — deps
- `bun run dev` — build frontend, then `wrangler dev --env development`
- `bun run build` — production frontend build + `typecheck`
- `bun run test` — Bun tests
- `bun run lint` — Biome
- `bun run cf:typegen` — refresh `apps/backend/src/worker-configuration.d.ts` after binding changes

## Conventions

- **Crypto / API shapes**: edit `packages/shared` first; keep Worker and frontend aligned via shared exports.
- **Paths & validation**: `packages/shared/src/routes.ts`, `validation.ts`, `api-errors.ts`.
- **Worker routing**: `apps/backend/src/api/handler.ts`; durable object logic in `durable-objects.ts`.
- **Lint/format**: Biome (`biome.json`). Prefer matching existing patterns over drive-by refactors.
- **Docs**: do not add unsolicited markdown files unless the user asks.

## Secrets / env (production)

- Optional: `MIGRATION_TOKEN`, `METRICS_TOKEN` — see root `README.md`.

## Self-hosting

Operators deploy to their own Cloudflare account (Worker + DO + R2 + rate limits). Guide: **`SELF_HOSTING.md`**. Config template: `wrangler.selfhost.jsonc.example`. Static preflight: `bun run selfhost:check` (upstream maintainers: `ALLOW_PROD_NAMES=1`).

## Pitfalls

- **Secret create latency**: End-to-end submit time is usually dominated by **browser PBKDF2** (`packages/shared` → `PBKDF2_ITERATIONS`). **With an attachment**, new creates use **v4** (`v4.j.` + `v4.f.`) — **one** PBKDF2 + HKDF subkeys; standalone `encryptAttachmentBytes` / old secrets may still be **v3** (separate `v3.f.`). The Worker API path is comparatively small; metrics use `waitUntil` and do not block the HTTP response.
- Access keys in share URLs use fragment `#…`; encryption uses prefix `1` (current) vs legacy `0`; decrypt supports legacy CryptoJS blobs and modern `v3.j.` / `v3.f.` envelopes.
- Changing API JSON field names requires updating Zod schemas and Worker handler together.
- **`/api/*` rate limits**: enforced in `fetch-handler.ts` via `API_RATE_LIMITER` (`wrangler.jsonc` → `ratelimits`). Tuning requires editing both Wrangler config and `API_RATE_LIMIT_PERIOD_SEC` in `apps/backend/src/rate-limit.ts`.
