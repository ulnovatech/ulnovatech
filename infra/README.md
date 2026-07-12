# UlnoVaTech infrastructure (GCE VM / Docker)

## Quick start (local)

From repo root:

```bash
# 1. Build static output
npm run build:linux

# 2. (Optional) Copy env template and edit secrets
cp infra/env/docker.ulnovatech.env.example infra/env/docker.ulnovatech.env

# 3. Start stack
docker compose -f infra/docker-compose.yml up -d --build

# 4. Smoke test
npm run docker:smoke
```

Site: **http://localhost:8080** (override with `HTTP_PORT`).

## Full stack (ulnovatech + Discovery)

From repo root:

```bash
# 1. Build static output for the main site
npm run build:linux

# 2. (Optional) Copy env templates and edit secrets
cp infra/env/docker.ulnovatech.env.example infra/env/docker.ulnovatech.env
cp infra/env/docker.discovery.env.example infra/env/docker.discovery.env

# 3. Start everything (mysql + php-fpm + nginx + postgres + discovery-web + worker)
npm run docker:full

# Or explicitly:
docker compose -f infra/docker-compose.full.yml up -d --build
```

| Endpoint | URL |
|----------|-----|
| Main site | http://localhost:8080 |
| Discovery UI (direct) | http://localhost:3000 |
| Discovery via nginx | http://discovery.34.66.94.12.nip.io (prod) or hosts-file override for local |

Run migrations manually if needed:

```bash
docker compose -f infra/docker-compose.full.yml run --rm discovery-migrate
```

Stop full stack:

```bash
npm run docker:full:down
```

Smoke tests:

```bash
npm run docker:smoke              # ulnovatech only
npm run docker:smoke:discovery    # discovery only
npm run docker:smoke:full         # both
```

### Discovery-only overlay

Add Discovery to an already-running ulnovatech stack:

```bash
npm run docker:discovery
```

## Production (Google Compute Engine)

| Step | Doc / script |
|------|----------------|
| Host bootstrap (Docker, UFW, `/opt/ulnovatech`) | [`gcloud/bootstrap.sh`](./gcloud/bootstrap.sh) |
| Env templates + server layout | [`env/README.md`](./env/README.md) |
| Cloudflare DNS | [`docs/CLOUDFLARE_DNS.md`](../docs/CLOUDFLARE_DNS.md) |
| Operator runbook | [`docs/DEPLOY_GCLOUD.md`](../docs/DEPLOY_GCLOUD.md) |
| CI / deploy | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml), [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) |
| Legacy Oracle | [`oracle/bootstrap.sh`](./oracle/bootstrap.sh), [`docs/DEPLOY_ORACLE.md`](../docs/DEPLOY_ORACLE.md) |

Production compose (full stack, port 80):

```bash
export PUBLIC_HTML_PATH=/opt/ulnovatech/public_html
export ULNOVATECH_ENV_FILE=/opt/ulnovatech/env/docker.ulnovatech.env
export DISCOVERY_ENV_FILE=/opt/ulnovatech/env/docker.discovery.env

docker compose -f infra/docker-compose.full.yml -f infra/docker-compose.prod.yml up -d --build
```

Ulnovatech-only production:

```bash
docker compose -f infra/docker-compose.yml -f infra/docker-compose.prod.yml up -d
```

## Services

| Service | Image | Role |
|---------|-------|------|
| `nginx` | nginx:1.27-alpine | Serves `public_html`, proxies PHP to FPM, proxies Discovery subdomain |
| `php-fpm` | `infra/php/Dockerfile` | PHP 8.2 + mysqli, pdo_mysql, mbstring |
| `mysql` | mysql:8.0 | Database `ulnovatech` |
| `postgres` | postgres:16-alpine | Discovery Intelligence database `agency_platform` |
| `discovery-web` | `discovery/Dockerfile` (target `web`) | Next.js dashboard on port 3000 |
| `discovery-worker` | `discovery/Dockerfile` (target `worker`) | Background job queue worker |
| `discovery-migrate` | `discovery/Dockerfile` (target `worker`) | One-shot Drizzle migrations on startup |

## Environment

See [`env/README.md`](./env/README.md) for production checklists and `/opt/ulnovatech` layout.

| Variable | Default | Purpose |
|----------|---------|---------|
| `PUBLIC_HTML_PATH` | `../public_html` | Build output (relative to `infra/`) |
| `ULNOVATECH_ENV_FILE` | `./env/docker.ulnovatech.env.example` | Mounted as `php/.env` + `ulndash/backend/.env` |
| `DISCOVERY_ENV_FILE` | `./env/docker.discovery.env.example` | Env for discovery-web, worker, migrate |
| `HTTP_PORT` | `8080` | Host port for nginx |
| `DISCOVERY_HTTP_PORT` | `3000` | Host port for discovery-web (direct access) |
| `MYSQL_ROOT_PASSWORD` | `root_dev_change_me` | MySQL root |
| `MYSQL_PASSWORD` | `ulnovatech_dev_change_me` | App user password (must match `DB_PASS` in env file) |
| `POSTGRES_PASSWORD` | `discovery_dev_change_me` | Discovery Postgres (must match `DATABASE_URL`) |

## Database

First boot runs `infra/mysql/init/01-init.sql`. Import your schema dump as `02-schema.sql`, or run CRM migrations after start:

```bash
docker compose -f infra/docker-compose.yml exec php-fpm \
  php /var/www/public_html/ulndash/backend/scripts/apply_admin_mobile_migrations.php
```

## Layout

```
infra/
├── docker-compose.yml            # nginx + php-fpm + mysql
├── docker-compose.discovery.yml  # postgres + discovery-web + worker (+ nginx discovery.conf)
├── docker-compose.full.yml       # includes ulnovatech + discovery
├── docker-compose.prod.yml       # port 80, restart always
├── env/
│   ├── README.md
│   ├── docker.ulnovatech.env.example
│   ├── docker.discovery.env.example
│   └── ulnovatech.env.example    # naming alias doc
├── gcloud/
│   └── bootstrap.sh              # Ubuntu AMD64 host prep (primary)
├── oracle/
│   └── bootstrap.sh              # Legacy Oracle ARM64/AMD64 host prep
├── mysql/init/
├── nginx/                        # see nginx/README.md
├── php/Dockerfile
└── scripts/
    ├── smoke-ulnovatech.sh
    ├── smoke-discovery.sh
    ├── smoke-full.sh
    └── wait-for-db.sh

discovery/
└── Dockerfile                    # multi-stage: web | worker (migrate uses worker)
```
