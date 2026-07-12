# Environment files (GCE VM / Docker)

Secrets and runtime configuration live **outside git**. Copy the `.example` templates on the server, then edit values for production.

## Server layout

```
/opt/ulnovatech/
├── secrets/                    # Never commit — chmod 600
│   └── service-account.json    # GCP/Firebase (GA + FCM)
├── env/                        # chmod 600 on *.env files
│   ├── docker.ulnovatech.env     # MySQL CRM + PHP (from docker.ulnovatech.env.example)
│   └── docker.discovery.env      # Postgres + Discovery (from docker.discovery.env.example)
├── public_html/                # Built static output (rsync from CI or local build)
└── repo/                       # Git checkout (infra/, discovery/, scripts/)
```

Compose is run from `repo/` with paths pointing at the layout above. **Important:** Docker Compose loads variable substitution from `.env` next to the *first* `-f` compose file (`infra/.env`), not only from the repo root. Copy compose DB passwords there:

```bash
# On the VM — keep in sync with /opt/ulnovatech/env/*.env DB passwords
cp /opt/ulnovatech/repo/.env /opt/ulnovatech/repo/infra/.env   # or write MYSQL_* / POSTGRES_* into infra/.env
chmod 600 /opt/ulnovatech/repo/infra/.env
```

```bash
cd /opt/ulnovatech/repo
export PUBLIC_HTML_PATH=/opt/ulnovatech/public_html
export ULNOVATECH_ENV_FILE=/opt/ulnovatech/env/docker.ulnovatech.env
export DISCOVERY_ENV_FILE=/opt/ulnovatech/env/docker.discovery.env

docker compose -f infra/docker-compose.full.yml -f infra/docker-compose.prod.yml up -d --build
```

## Templates

| Template | Live file (gitignored) | Used by |
|----------|------------------------|---------|
| `docker.ulnovatech.env.example` | `docker.ulnovatech.env` | `mysql`, `php-fpm`, `nginx` (via mounted `.env`) |
| `docker.discovery.env.example` | `docker.discovery.env` | `postgres`, `discovery-web`, `discovery-worker`, `discovery-migrate` |

See also [`ulnovatech.env.example`](./ulnovatech.env.example) — naming alias for the ulnovatech template.

## Production checklist (ulnovatech)

1. `BASE_URL=https://ulnovatech.store`
2. `APP_DEBUG=false`
3. `ALLOWED_ORIGINS` — production domains only
4. `DASH_ADMIN_PASS_HASH` — bcrypt hash; **unset** `DASH_ADMIN_PASS`
5. `MOBILE_JWT_SECRET` — `openssl rand -hex 32`
6. `DB_PASS` / `MYSQL_PASSWORD` — strong password, must match in compose env
7. Copy `secrets/service-account.json` → `public_html/ulndash/backend/service-account.json` (or mount via volume)
8. Set `FCM_PROJECT_ID` when using admin mobile push

## Production checklist (discovery)

1. `NEXT_PUBLIC_APP_URL=https://discovery.ulnovatech.store`
2. `ALLOW_DEV_AUTH=false`
3. `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
4. `POSTGRES_PASSWORD` / `DATABASE_URL` — strong credentials
5. `CRON_SECRET` — random string for scheduled HTTP jobs

## First-time setup on VM

```bash
sudo mkdir -p /opt/ulnovatech/{secrets,env,public_html,repo}
sudo chown -R deploy:deploy /opt/ulnovatech

cp /opt/ulnovatech/repo/infra/env/docker.ulnovatech.env.example /opt/ulnovatech/env/docker.ulnovatech.env
cp /opt/ulnovatech/repo/infra/env/docker.discovery.env.example /opt/ulnovatech/env/docker.discovery.env
chmod 600 /opt/ulnovatech/env/*.env /opt/ulnovatech/secrets/*
```

Full operator steps: [`docs/DEPLOY_GCLOUD.md`](../../docs/DEPLOY_GCLOUD.md). Legacy Oracle: [`docs/DEPLOY_ORACLE.md`](../../docs/DEPLOY_ORACLE.md).
