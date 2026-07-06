# Demand Capture — Web Agency Platform

> **UlnoVaTech monorepo:** this app lives at `ulnovatech/discovery/`. See [MONOREPO.md](MONOREPO.md) and [../docs/DISCOVERY_INTELLIGENCE.md](../docs/DISCOVERY_INTELLIGENCE.md).

Production-ready modular monolith for web/digital agencies: find website opportunities and demand, triage, pursue honestly, and track revenue.

**V1 scope:** [docs/V1_CHARTER.md](docs/V1_CHARTER.md) — Path A, razor-sharp results for one ICP before public SaaS.

## Stack

- **Monorepo:** Turborepo + pnpm
- **App:** Next.js 14 (dashboard + API routes)
- **Database:** PostgreSQL + Drizzle ORM (direct connection, no Docker)
- **Deploy:** Vercel + Neon + Cloudflare R2 (optional)

## Quick start

### 1. PostgreSQL (local or hosted)

Install PostgreSQL on your machine, or use a hosted URL (e.g. Neon). Full steps: **[docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md)**

Create the database once:

```sql
CREATE DATABASE agency_platform;
```

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env` — set `DATABASE_URL` to your Postgres instance, for example:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/agency_platform
```

### 3. Install and migrate

```bash
pnpm install
pnpm db:migrate
```

On Windows:

```powershell
powershell -File scripts/setup-db.ps1
```

### 4. Run dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Discovery (real data)

Discovery uses **live APIs** — no mock data. You must configure sources first:

**[docs/SETUP_RESOURCES.md](docs/SETUP_RESOURCES.md)** — step-by-step: Google Cloud, Places API key, billing, `.env` setup.

Minimum for discovery: `GOOGLE_PLACES_API_KEY` in `.env`.

## Dev authentication

Until Clerk is configured, set `ALLOW_DEV_AUTH=true` in `.env`. API requests from the UI send `X-Dev-User: operator` automatically.

**Never enable `ALLOW_DEV_AUTH` in production.**

## Production auth

Set on Vercel:

- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `ALLOW_DEV_AUTH=false`
- `DATABASE_URL` (e.g. Neon connection string)

## Project structure

```
apps/dashboard/     Next.js UI + /api
packages/           database, config, types, validation, scoring
modules/            discovery, intent, intelligence, qualification, crm, outreach, proposal, revenue
infrastructure/     deployment configs (Vercel)
docs/               architecture and database setup
scripts/            migrations helper, sample SQL
```

## Workflow

1. **Today (Ops)** — KPIs, demand backlog, opportunities queue, pursuit funnel
2. **Discovery runs** — country, city, industry → pipeline (intent, intelligence, scoring)
3. **Demand inbox** — hot signals (RSS, Reddit, paste) → match or create prospect
4. **Opportunities** — triage high-score accounts; promote to pursuit
5. **Pursuits** — state machine, notes, outreach, proposals
6. **Revenue** — close deals → `CLOSED_WON`

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dashboard |
| `pnpm build` | Production build |
| `pnpm db:migrate` | Run migrations |
| `pnpm test` | Run unit tests |

## Health check

`GET /api/health` — database connectivity and version.
