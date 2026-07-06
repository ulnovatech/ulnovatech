# Production deployment

Target stack: **Vercel Hobby** (dashboard) + **Neon free tier** (Postgres).

**Daily operations:** [docs/OPERATING_MODEL.md](OPERATING_MODEL.md) — worker requirement, cadence, KPI targets, outreach rules.

## Prerequisites

- Neon project with connection string (`DATABASE_URL`)
- Vercel project linked to `apps/dashboard`
- Clerk application (production instance)
- Optional: Sentry project for error tracking

## Environment variables

### Required (production)

| Variable | Example | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `postgresql://...@neon.tech/agency_platform?sslmode=require` | Neon connection string |
| `NODE_ENV` | `production` | |
| `ALLOW_DEV_AUTH` | `false` | **Must be false in production** |
| `CLERK_SECRET_KEY` | `sk_live_...` | Clerk dashboard |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` | Clerk dashboard |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | Hosted sign-in page in dashboard |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` | Optional operator signup |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/ops` | Post-login landing |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | |
| `CRON_SECRET` | long random string | Required for scheduled RSS/custom-scrape HTTP polls |

### Acquisition budget caps (required for cost control)

| Variable | Default | Notes |
|----------|---------|-------|
| `PLACES_MONTHLY_CAP` | `150` | Alert when approaching limit |
| `CSE_DAILY_CAP` | `100` | |
| `BING_DAILY_CAP` | `50` | |
| `META_GRAPH_DAILY_CAP` | `50` | Meta Graph page/place search (Phase 5) |
| `BROWSER_DAILY_CAP` | `10` | Tier 4 |
| `CUSTOM_SCRAPE_DAILY_CAP` | `50` | Tier 5 |

Set `ACQUISITION_MODE=standard` or `economy` for survival mode.

### Optional tiers

| Variable | When |
|----------|------|
| `BROWSER_AUTOMATION_ENABLED=true` | Tier 4 Playwright (install playwright in intelligence) |
| `CUSTOM_SCRAPE_ENABLED=true` | Tier 5 Reddit demand scrape |
| `SENTRY_DSN` | Server + worker error tracking (pipeline failures, API) |
| `NEXT_PUBLIC_SENTRY_DSN` | Same DSN for client-side React errors (optional; can match `SENTRY_DSN`) |

### API credentials

Configure via **Settings → API credentials** in the dashboard (stored in DB).

Use the **single** root `.env` for infrastructure only (`DATABASE_URL`, Clerk, caps, feature flags). Optional env vars for API keys are CI/production fallbacks when Settings has no value — see `.env.example`.

Do not create `apps/dashboard/.env.local`.

**Phase 5 discovery credentials (recommended for standard/boost):**

| Credential | Purpose |
|------------|---------|
| Google Places API key | Primary discovery + verify + top-N details |
| Google CSE and/or Bing | Public search + social `site:` queries |
| Meta Graph API token | Facebook page/place + Instagram discovery (optional) |

## Post-deploy checklist (Phase 5)

After migrate + env vars on Vercel and worker host:

1. `pnpm db:migrate` and `pnpm db:seed-settings` (if fresh DB)
2. **Settings** — enter Places key, CSE/Bing, optional Meta token; confirm acquisition mode
3. Start background worker: `pnpm jobs:worker` (same `DATABASE_URL` as dashboard)
4. Run acceptance harness:
   ```bash
   pnpm discovery:acceptance
   ```
5. Smoke test: start one **micro** discovery run (no Places spend), confirm run completes on Discovery detail page
6. Promote to **standard** run in a known city/industry; verify yield stats and review queue populate
7. Confirm **Discovery → Sources** budget panel shows remaining quota for Places, CSE/Bing, Meta Graph

Without step 3, runs stay `pending`/`running` indefinitely. Without step 4, stub or pipeline regressions may reach production undetected.

## Deploy steps

1. **Database**
   ```bash
   pnpm db:migrate
   pnpm db:seed-settings
   ```

2. **Vercel**
   - Root directory: `apps/dashboard`
   - Build command: `cd ../.. && pnpm install && pnpm build`
   - Set all env vars above in Vercel project settings

3. **Background worker** (discovery pipeline) — **required**
   - Run `pnpm jobs:worker` on a separate process (Railway free tier, VPS, or local long-running process)
   - Same `DATABASE_URL` and env as the dashboard (including `SENTRY_DSN` when using Sentry)
   - Discovery runs do not complete reliably without this worker (see OPERATING_MODEL.md)

### Sentry (optional)

1. Create a Sentry project (Next.js).
2. **Vercel** — set `SENTRY_DSN` for server/API errors (`@sentry/nextjs` via `instrumentation.ts`). Set `NEXT_PUBLIC_SENTRY_DSN` to the same value for client-side React errors.
3. **Worker host** — set `SENTRY_DSN` on the process running `pnpm jobs:worker`. Pipeline failures use `@agency/config/observability` and are tagged with `runId`, `stage`, and `jobId`.
4. Failed jobs appear on **Ops → Failed jobs (7d)** without Sentry; Sentry adds stack traces and alerting for production debugging.
5. Optional: `SENTRY_AUTH_TOKEN` enables source map upload during `pnpm build`.

### Gmail reply suggestions (optional)

1. Create a Google Cloud OAuth client (Web application).
2. Add redirect URI: `https://your-app.vercel.app/api/integrations/gmail/callback`
3. Enable Gmail API; request scope `https://www.googleapis.com/auth/gmail.readonly` only.
4. Set `GMAIL_OAUTH_CLIENT_ID` and `GMAIL_OAUTH_CLIENT_SECRET` in Vercel (or Settings → API credentials).
5. In **Settings → Gmail reply suggestions**, click **Connect Gmail**.
6. Use **Sync replies now** or `POST /api/integrations/gmail/sync-replies` on a schedule.
7. Operators confirm suggestions on the lead hub — no auto-transition to REPLIED.

4. **Scheduled jobs** (optional cron)

   **Option A — HTTP cron (Vercel Cron, etc.)**

   Set `CRON_SECRET` in the dashboard environment. Each request must send either:
   - `Authorization: Bearer <CRON_SECRET>`, or
   - `X-Cron-Secret: <CRON_SECRET>`

   | Endpoint | Schedule suggestion |
   |----------|---------------------|
   | `POST /api/intent/rss/poll` | Daily demand RSS |
   | `POST /api/intent/custom-scrape/poll` | Daily Reddit scrape (if enabled) |

   **Option B — CLI on worker host** (same `DATABASE_URL` as dashboard)

   - `pnpm intent:rss-poll` — calls IntentService directly (no HTTP auth)
   - `pnpm custom-scrape:poll` — custom scrape poll CLI

## Budget alerts (required operational practice)

Monitor daily via **Discovery → Sources** budget panel and `/api/acquisition/budget`:

- **Google Places** monthly cap — primary cost driver
- **CSE / Bing** daily caps — search tier
- **browser_automation** / **custom_scrape** — surgical tiers

When `remaining === 0`, discovery degrades gracefully (economy fallbacks, CSV import). Do not raise caps without reviewing spend.

## Auth modes

| Mode | When |
|------|------|
| **Clerk** | Production — `ALLOW_DEV_AUTH=false` + Clerk keys |
| **Dev bypass** | Local only — `ALLOW_DEV_AUTH=true`, send `X-Dev-User` header on mutating API calls |

When Clerk is configured and `ALLOW_DEV_AUTH=false`, middleware protects **all app routes** (`/ops`, `/leads`, `/review`, etc.) and API routes except `/api/health` and `/api/auth/status`. Cron poll endpoints accept `CRON_SECRET` without a Clerk session.

Lead `owner` is set from Clerk `userId` (or dev header) when creating leads from the review queue.

### Clerk + Next.js version note

The dashboard uses **Next.js 14** with **`@clerk/nextjs` v7**. npm may warn about peer dependency mismatch. This is documented for deploy planning; upgrade to Next 15 or pin Clerk v5 only if your host blocks the install. Auth middleware and `requireAuth()` work with the current pairing.

## Health checks

- `GET /api/health` — database ping (public, no auth)
- `GET /api/auth/status` — auth mode diagnostic (public)

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs `db:migrate`, `typecheck`, `test`, and `build` on every push/PR against a **Postgres 16 service container**.

Integration tests (`integration.test.ts`) exercise budget caps and account dedup when `DATABASE_URL` is set (always in CI after migrate).

Discovery acceptance (`pnpm discovery:acceptance`) validates Phase 5 pipeline order, provider registry, stub policy, and (with DB) job enqueue — run in CI before the full test suite.
