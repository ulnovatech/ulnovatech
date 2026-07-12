# Deploy Discovery Intelligence (Demand Capture)

Discovery Intelligence lives at [`discovery/`](../discovery/) in this monorepo.

**Production target:** Google Compute Engine VM (Docker) alongside ulnovatech — see [DEPLOY_GCLOUD.md](./DEPLOY_GCLOUD.md).

This document covers **local setup** and **sidebar wiring**. For legacy Vercel/Neon hosting, see [`discovery/docs/DEPLOYMENT.md`](../discovery/docs/DEPLOYMENT.md).

---

## Local setup

```powershell
cd C:\xampp\htdocs\ulnovatech\discovery
pnpm install
copy .env.example .env
# Edit DATABASE_URL for local PostgreSQL
pnpm db:migrate
pnpm dev
```

Worker (required for discovery runs):

```powershell
pnpm jobs:worker
```

From repo root:

```powershell
npm run discovery:db:migrate
npm run dev:discovery
npm run discovery:jobs:worker
```

---

## Wire ulndash sidebar

Edit `ulndash/frontend/.env.production`:

```env
VITE_DISCOVERY_URL=https://discovery.ulnovatech.store
```

Rebuild ulndash:

```powershell
cd C:\xampp\htdocs\ulnovatech
npm run build
```

---

## Verify integration

1. Log into ulndash → **Apps → Discovery Intelligence** opens Demand Capture.
2. Sign in on Discovery (Clerk in production; dev auth locally).
3. Run a small discovery test; confirm worker processes jobs.
4. Export outreach CSV → import in ulndash **Prospects → Import**.

See [DISCOVERY_INTELLIGENCE.md](./DISCOVERY_INTELLIGENCE.md) for the full operator workflow.
