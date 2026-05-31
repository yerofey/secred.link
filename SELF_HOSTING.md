# Self-hosting secred.link on Cloudflare Workers

Run your own instance in **your Cloudflare account**. The app is a single Worker with static assets, two SQLite-backed Durable Objects, one R2 bucket for attachments, and a Workers Rate Limiting binding. There is **no Docker** path—the runtime is Cloudflare’s edge.

## Prerequisites

- [Bun](https://bun.sh) and [Wrangler](https://developers.cloudflare.com/workers/wrangler/) (included as a devDependency; use `bunx wrangler`)
- Cloudflare account with:
  - **Workers** (Paid recommended for Durable Objects at scale)
  - **R2** (attachment storage)
  - **Durable Objects** with SQLite storage
  - **Workers Rate Limiting** binding support ([docs](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/))

## Quick checklist

| Step | Action |
|------|--------|
| 1 | `wrangler login` |
| 2 | Create **two** R2 buckets (production + preview for local dev) |
| 3 | Edit `wrangler.jsonc`: `name`, R2 names, `ratelimits[].namespace_id`, `vars` |
| 4 | `bun run selfhost:check` |
| 5 | `bun install` → `bun run build` → `wrangler deploy` |
| 6 | Open `https://<your-worker>.<account>.workers.dev` and `GET /api/health` |

See [wrangler.selfhost.jsonc.example](./wrangler.selfhost.jsonc.example) for placeholder fields.

## 1. Clone and install

```bash
git clone <your-fork-url>
cd secred.link
bun install
```

## 2. Cloudflare account

```bash
bunx wrangler login
bunx wrangler whoami   # note Account ID if you need it elsewhere
```

To deploy on every push, connect the repo in the [Cloudflare dashboard](https://developers.cloudflare.com/workers/ci-cd/builds/) (Workers → your project → **Settings** → **Builds**) instead of maintaining a separate GitHub Actions workflow.

## 3. Create R2 buckets

Pick **unique** bucket names (do not reuse `secred-attachments` from this repo unless you own that bucket in your account):

```bash
bunx wrangler r2 bucket create YOUR_ATTACHMENTS_BUCKET
bunx wrangler r2 bucket create YOUR_ATTACHMENTS_PREVIEW_BUCKET
```

Update **both** the top-level `r2_buckets` block and `env.development.r2_buckets` in `wrangler.jsonc`. Wrangler does **not** inherit bindings into `env.*`, so local `bun run dev` needs the duplicated block.

## 4. Rate limiting namespace

Each account needs its **own** `ratelimits[].namespace_id` values. **Do not copy** `1001` / `1002` from this repository—they are placeholders for the upstream deployment.

Set `simple.period` to **60** and keep it aligned with `API_RATE_LIMIT_PERIOD_SEC` in `apps/backend/src/rate-limit.ts` (and `Retry-After` on 429 responses).

If deploy fails because rate limiting is unavailable on your plan, see [Troubleshooting](#troubleshooting).

## 5. Worker name and vars

In `wrangler.jsonc`:

| Field | Purpose |
|-------|---------|
| `name` | Worker script name in your account (must be unique to you) |
| `vars.APP_URL` | Set to your public origin (`https://…`). Reserved for future use; the SPA is same-origin today |
| `vars.ENVIRONMENT` | e.g. `production` |
| `vars.VERSION_PREFIX` | Access-key prefix for new secrets (`1` = current) |
| `vars.TEST_STRING` | Must stay **`w4KPFgvgr4`** unless you change `DEFAULT_TEST_STRING` in `packages/shared` and rebuild the frontend |

## 6. Secrets (optional)

Not stored in `wrangler.jsonc`:

```bash
bunx wrangler secret put METRICS_TOKEN    # enables GET/POST /api/metrics
bunx wrangler secret put MIGRATION_TOKEN  # migration/import API
```

For local dev, use `.dev.vars` (gitignored).

## 7. Preflight

Static checks only (no Cloudflare API calls):

```bash
bun run selfhost:check
```

This verifies you changed upstream worker/R2/namespace placeholders, that rate-limit periods match code, and that `TEST_STRING` matches `packages/shared`.

**Upstream secred.link maintainers** validating the stock config:

```bash
ALLOW_PROD_NAMES=1 bun run selfhost:check
```

## 8. Build and deploy

```bash
bun run build
bunx wrangler deploy
```

(`bun run deploy` builds the frontend and deploys the default environment.)

**First deploy** applies Durable Object migrations (`migrations` in `wrangler.jsonc`). Do not copy another account’s DO/SQLite state.

After changing bindings in `wrangler.jsonc`:

```bash
bun run cf:typegen
```

## 9. Smoke test

1. Visit `https://<worker-name>.<subdomain>.workers.dev`
2. `curl -sS "https://<host>/api/health" | jq`
3. Create a test secret in the UI and open the share link

### Custom domain (optional)

Add a route or custom domain in the Cloudflare dashboard (Workers → your script → Settings → Domains). Point DNS to Cloudflare. Update `vars.APP_URL` to match your public URL.

## Configuration reference

| Binding / setting | Used for |
|-------------------|----------|
| `ASSETS` | SPA from `apps/frontend/dist` |
| `SECRETS` | `SecretObject` Durable Object (ciphertext metadata) |
| `METRICS` | `MetricsObject` counters |
| `ATTACHMENTS` | R2 encrypted attachment blobs |
| `API_RATE_LIMITER` | Per-IP limit on `/api/*` (required at runtime) |

Cosmetic branding (optional): footer GitHub link in `apps/frontend/src/components/Layout.tsx`.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| Deploy error on `ratelimits` | Account/plan without Rate Limiting binding | Confirm [Workers Rate Limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) on your account; adjust or remove binding only with a code change to make the limiter optional |
| DO migration “already exists” / 409 | Migration tag conflict | Use a fresh worker name or follow [DO migrations](https://developers.cloudflare.com/durable-objects/reference/data-migration/)—never reuse another account’s migration history |
| R2 403 / missing object | Wrong bucket name or bucket not created | `wrangler r2 bucket list`; align names in `wrangler.jsonc` |
| `selfhost:check` fails on names | Still using upstream placeholders | Rename worker, buckets, and `namespace_id`; see `wrangler.selfhost.jsonc.example` |
| Local dev attachment errors | Preview bucket missing | Create `preview_bucket_name` and duplicate `r2_buckets` under `env.development` |
| CORS errors | API on different origin than SPA | Not applicable by default (same Worker serves `/` and `/api/*`) |

## Maintainer workflow

After editing `wrangler.jsonc`:

```bash
bun run cf:typegen
ALLOW_PROD_NAMES=1 bun run selfhost:check
bun run dev
```

Optional before production deploy: `bunx wrangler deploy --dry-run` (requires login).
