# Database setup (no Docker)

The app uses **PostgreSQL** directly via `DATABASE_URL`. Install and run Postgres on your machine (or use a hosted URL such as Neon).

## Windows (local Postgres)

1. Install PostgreSQL from https://www.postgresql.org/download/windows/ (or use an existing install).
2. Open **pgAdmin** or `psql` and create a database:

```sql
CREATE DATABASE agency_platform;
```

3. Copy `.env.example` to `.env` and set your connection string, for example:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/agency_platform
```

Use the **repo root** `.env` only — not `apps/dashboard/.env.local`.

4. From the project root:

```powershell
pnpm install
pnpm db:migrate
pnpm dev
```

## Optional: run setup script

```powershell
powershell -File scripts/setup-db.ps1
```

Pass a custom URL if needed:

```powershell
powershell -File scripts/setup-db.ps1 -DatabaseUrl "postgresql://postgres:secret@localhost:5432/agency_platform"
```

## Hosted Postgres (no local install)

Use [Neon](https://neon.tech) or similar, paste the connection string into `.env` as `DATABASE_URL`, then run `pnpm db:migrate`.

## Verify

With the dev server running, open:

http://localhost:3000/api/health

You should see `"database": "connected"` when Postgres is reachable.
