# Demand Capture in the UlnoVaTech monorepo

This directory is **Discovery Intelligence** (Demand Capture), merged into the main `ulnovatech` repository for unified Oracle Cloud deployment.

## Location

```
ulnovatech/discovery/    ← you are here (formerly `lead discover - ulntech`)
```

## Toolchain

- **Package manager:** pnpm 9+ (not npm — use commands from this directory or root `npm run dev:discovery`)
- **Node:** 20+
- **Database:** PostgreSQL (`agency_platform`)

## Commands from repo root

```bash
npm run dev:discovery          # Next.js dev server :3000
npm run build:discovery        # Production build
npm run discovery:db:migrate   # Drizzle migrations
npm run discovery:jobs:worker  # Background discovery pipeline
```

## Commands from this directory

```bash
pnpm install
cp .env.example .env   # required for build and dev — set DATABASE_URL
pnpm db:migrate
pnpm dev               # http://localhost:3000
pnpm jobs:worker       # required for discovery runs (second terminal)
pnpm build             # production Next.js build
```

**Build note:** Copy `.env.example` → `.env` before `pnpm build` (CI sets `DATABASE_URL` via secrets). PostgreSQL is required at runtime; the build itself compiles without a live DB connection.

## Docs

- Operator handoff with ulndash: [`../docs/DISCOVERY_INTELLIGENCE.md`](../docs/DISCOVERY_INTELLIGENCE.md)
- Oracle deploy (in progress): [`../docs/DEPLOY_ORACLE.md`](../docs/DEPLOY_ORACLE.md) (Chunk 6+)
- App-specific docs: [`docs/`](docs/) in this folder

## Production target

Oracle Cloud VM (Docker Compose) alongside ulnovatech — not Vercel/Neon. Legacy Vercel docs in `docs/DEPLOYMENT.md` remain as reference until `infra/` is complete.
