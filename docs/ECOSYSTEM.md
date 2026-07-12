# UlnoVaTech Ecosystem

UlnoVaTech is a **unified monorepo**: primary operator hub (marketing, CRM, portfolio) plus **Discovery Intelligence** (Demand Capture) for outbound lead research.

## Primary hub — ulndash (this repo)

| Surface | Path | Role |
|---------|------|------|
| CRM dashboard | `/dash/` (prod) or `:5174/ulndash/` (dev) | Daily workspace |
| Marketing site | `/` | Public lead capture |
| Admin mobile | Capacitor APK | Inbound lead alerts |
| PHP APIs | `/api/*`, `/php/*` | Forms, CRM backend |

**Stack:** React + Vite, PHP + MySQL.

## Discovery Intelligence — Demand Capture (`discovery/`)

| Surface | Default URL | Role |
|---------|-------------|------|
| Discovery app | `http://localhost:3000` (dev) | Outbound lead research |
| Production | `https://discovery.ulnovatech.store` | GCE VM (Docker) |

**Path in repo:** [`discovery/`](discovery/) (pnpm Turborepo, Next.js 14, PostgreSQL)

See [`discovery/MONOREPO.md`](discovery/MONOREPO.md) for commands.

### Division of labor

- **Discovery Intelligence** — find and qualify cold prospects (geo/industry runs, demand inbox, scoring).
- **ulndash Prospects** — canonical outreach queue after you decide to pursue.
- **ulndash Requests** — warm inbound leads from the marketing site.

Do not run two parallel CRM workflows. Use Discovery for research; import winners into Prospects.

### Navigation

The ulndash sidebar **Apps → Discovery Intelligence** link is driven by `VITE_DISCOVERY_URL` in:

- `ulndash/frontend/.env.development`
- `ulndash/frontend/.env.production`

See [DISCOVERY_INTELLIGENCE.md](./DISCOVERY_INTELLIGENCE.md) for the operator handoff playbook.

## Other federated apps (sidebar)

| App | Env variable |
|-----|----------------|
| Home Site | `VITE_HOME_SITE_URL` |
| Blog | `VITE_BLOG_URL` |
| Portfolio | `VITE_PORTFOLIO_URL` |
| Discovery Intelligence | `VITE_DISCOVERY_URL` |

Configured in `ulndash/frontend/src/site.config.js`.

## Deploy model (target)

| Component | Host |
|-----------|------|
| ulnovatech (marketing, dash, php, portfolio) | Google Compute Engine VM — Docker |
| Discovery Intelligence | Same VM — Docker (Postgres + worker) |
| DNS / TLS edge | Cloudflare (free, Flexible while origin is HTTP) |

### Production build

| Platform | Command |
|----------|---------|
| Windows (local) | `npm run build` → [`scripts/build-production.ps1`](scripts/build-production.ps1) |
| Linux / CI / GCE | `npm run build:linux` → [`scripts/build-production.sh`](scripts/build-production.sh) |

Both scripts assemble `public_html/` for deploy. The shell script runs `npm ci` per app (when `package-lock.json` exists) and `composer install --no-dev` in `ulndash/backend`.

### HTTP routing (GCE / Docker)

nginx configs in [`infra/nginx/`](../infra/nginx/) replace Apache `.htaccess`. Wired in [`infra/docker-compose.yml`](../infra/docker-compose.yml).

```bash
npm run build:linux
npm run docker:ulnovatech
npm run docker:smoke:full
```

See [`infra/README.md`](../infra/README.md) for env vars and production overrides.

**Production:** [DEPLOY_GCLOUD.md](./DEPLOY_GCLOUD.md) · [CLOUDFLARE_DNS.md](./CLOUDFLARE_DNS.md) · [infra/env/README.md](../infra/env/README.md)

Legacy Oracle: [DEPLOY_ORACLE.md](./DEPLOY_ORACLE.md).

No shared database between ulndash (MySQL) and Discovery (Postgres).
