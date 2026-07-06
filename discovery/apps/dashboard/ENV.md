# Environment variables

Use the **single** `.env` file at the **repository root** (`lead discover - ulntech/.env`).

Do not create `apps/dashboard/.env.local` — it is redundant. Next.js, the job worker, and migrations all load the root file automatically.

**API keys** → **Settings → API credentials** in the dashboard (stored in Postgres).
