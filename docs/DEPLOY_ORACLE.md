# Deploy UlnoVaTech to Oracle Cloud (Docker)

Operator runbook for production on an **Oracle Cloud ARM64 VM** (Ubuntu 22.04/24.04) with **Cloudflare DNS** and **GitHub Actions** deploy.

## Architecture

| Component | Runtime |
|-----------|---------|
| Marketing, blog, dash, portfolio, PHP APIs | nginx + php-fpm + MySQL |
| Discovery Intelligence | postgres + discovery-web + discovery-worker |
| TLS edge | Cloudflare (proxied A records) |
| CI/CD | GitHub Actions → SSH/rsync → `docker compose` |

Server layout: [`infra/env/README.md`](../infra/env/README.md).

## 1. Provision Oracle VM

1. Create an **Ampere A1** (ARM64) instance — Ubuntu 22.04 or 24.04, ≥ 2 OCPU / 12 GB RAM recommended for full stack.
2. Attach a **reserved public IP**.
3. Security list / NSG: allow inbound **22**, **80**, **443** (UFW on the host mirrors this).
4. Note the public IP for Cloudflare DNS ([`CLOUDFLARE_DNS.md`](./CLOUDFLARE_DNS.md)).

## 2. Bootstrap the host

SSH as `ubuntu` (or default OCI user), then:

```bash
# From a fresh git clone on the VM, or pipe from your repo:
sudo bash infra/oracle/bootstrap.sh
```

Creates:

- Docker Engine + Compose plugin
- UFW rules: 22, 80, 443
- User `deploy` in `docker` group
- `/opt/ulnovatech/{secrets,env,public_html,repo}`

Add your SSH key for GitHub Actions and operators:

```bash
sudo mkdir -p /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
# paste public key into authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh
```

## 3. Cloudflare DNS

Configure A/CNAME records per [`CLOUDFLARE_DNS.md`](./CLOUDFLARE_DNS.md) before cutting over production traffic.

## 4. Clone repo and environment

```bash
sudo -u deploy git clone https://github.com/YOUR_ORG/ulnovatech.git /opt/ulnovatech/repo
cd /opt/ulnovatech/repo

cp infra/env/docker.ulnovatech.env.example /opt/ulnovatech/env/docker.ulnovatech.env
cp infra/env/docker.discovery.env.example /opt/ulnovatech/env/docker.discovery.env
chmod 600 /opt/ulnovatech/env/*.env
```

Edit `/opt/ulnovatech/env/docker.ulnovatech.env`:

- `BASE_URL=https://ulnovatech.store`
- `APP_DEBUG=false`
- `ALLOWED_ORIGINS=https://ulnovatech.store,https://www.ulnovatech.store`
- `DASH_ADMIN_PASS_HASH` (bcrypt) — unset `DASH_ADMIN_PASS`
- `MOBILE_JWT_SECRET` — `openssl rand -hex 32`
- Strong `DB_PASS` (must match `MYSQL_PASSWORD` in compose or `.env`)

Edit `/opt/ulnovatech/env/docker.discovery.env`:

- `NEXT_PUBLIC_APP_URL=https://discovery.ulnovatech.store`
- `ALLOW_DEV_AUTH=false`
- Clerk keys, strong Postgres password, `CRON_SECRET`

Place GCP/Firebase credentials:

```bash
install -m 600 /path/to/service-account.json /opt/ulnovatech/secrets/service-account.json
```

## 5. First manual deploy (before CI)

On your workstation (Linux or WSL):

```bash
npm ci
npm run build:linux
```

On the VM as `deploy`:

```bash
# Copy build output (from workstation — example)
rsync -avz public_html/ deploy@VM:/opt/ulnovatech/public_html/

# Sync secrets into backend path (FCM/GA read relative to ulndash/backend)
cp /opt/ulnovatech/secrets/service-account.json \
   /opt/ulnovatech/public_html/ulndash/backend/service-account.json
chmod 600 /opt/ulnovatech/public_html/ulndash/backend/service-account.json

cd /opt/ulnovatech/repo
export PUBLIC_HTML_PATH=/opt/ulnovatech/public_html
export ULNOVATECH_ENV_FILE=/opt/ulnovatech/env/docker.ulnovatech.env
export DISCOVERY_ENV_FILE=/opt/ulnovatech/env/docker.discovery.env

docker compose -f infra/docker-compose.full.yml -f infra/docker-compose.prod.yml up -d --build
```

Migrations run automatically via `discovery-migrate` on startup. Re-run if needed:

```bash
docker compose -f infra/docker-compose.full.yml run --rm discovery-migrate
docker compose -f infra/docker-compose.full.yml exec php-fpm \
  php /var/www/public_html/ulndash/backend/scripts/apply_admin_mobile_migrations.php
```

Import MySQL schema if this is a fresh database (add `02-schema.sql` under `infra/mysql/init/` before first `mysql` boot, or import manually).

## 6. Smoke tests

On the VM (HTTP, before Cloudflare strict TLS):

```bash
cd /opt/ulnovatech/repo
bash infra/scripts/smoke-full.sh http://localhost
```

After DNS + HTTPS:

```bash
DISCOVERY_URL=https://discovery.ulnovatech.store \
  bash infra/scripts/smoke-full.sh https://ulnovatech.store
```

From repo root via npm:

```bash
npm run docker:smoke:full
```

## 7. GitHub Actions deploy (ongoing)

### Repository secrets

| Secret | Description |
|--------|-------------|
| `OCI_SSH_HOST` | VM public IP or hostname |
| `OCI_SSH_USER` | `deploy` |
| `OCI_SSH_PRIVATE_KEY` | PEM private key matching `authorized_keys` |

### Workflow

Push to `main` triggers [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml):

1. Build `public_html` (`npm run build:linux`)
2. Verify Discovery image builds (`pnpm build` in `discovery/`)
3. Rsync `public_html/`, `infra/`, `discovery/` to `/opt/ulnovatech/`
4. SSH: `docker compose … up -d --build`
5. Run Discovery + CRM migrations

Monitor: **Actions** tab in GitHub.

## 8. Backups

### MySQL

```bash
cd /opt/ulnovatech/repo
docker compose -f infra/docker-compose.full.yml exec -T mysql \
  mysqldump -u root -p"${MYSQL_ROOT_PASSWORD}" ulnovatech \
  > ~/backup-ulnovatech-$(date +%F).sql
```

Schedule with `cron` on the VM; copy dumps off-box (OCI Object Storage, S3, etc.).

### Postgres (Discovery)

```bash
docker compose -f infra/docker-compose.full.yml exec -T postgres \
  pg_dump -U postgres agency_platform \
  > ~/backup-discovery-$(date +%F).sql
```

### Volumes

Docker named volumes: `mysql_data`, `postgres_data`, `discovery_storage`. Snapshot the VM or export volume data for disaster recovery.

### Secrets

Keep `/opt/ulnovatech/secrets/` and `/opt/ulnovatech/env/*.env` in a password manager or encrypted backup — not in git.

## 9. Operations cheat sheet

| Task | Command |
|------|---------|
| Logs (nginx) | `docker compose -f infra/docker-compose.full.yml logs -f nginx` |
| Logs (discovery worker) | `… logs -f discovery-worker` |
| Restart stack | `… up -d` |
| Stop stack | `docker compose -f infra/docker-compose.full.yml down` |
| Shell in PHP | `… exec php-fpm bash` |

Env file paths must be exported on every manual compose invocation (or add a small `deploy.sh` wrapper on the server).

## 10. Troubleshooting

| Symptom | Check |
|---------|-------|
| 502 on `/api/` | `docker compose ps`, php-fpm logs, `DB_*` in env file |
| Discovery 502 | `discovery-web` health, `DATABASE_URL`, migrate logs |
| Mobile login fails | `DASH_ADMIN_PASS_HASH`, not plain `DASH_ADMIN_PASS` |
| FCM push silent | `service-account.json` in `ulndash/backend/`, `FCM_PROJECT_ID` |
| Cloudflare 525 | Origin TLS — use Origin Certificate or temporarily Full (not strict) |

## Related docs

- [`infra/README.md`](../infra/README.md) — compose services and local dev
- [`CLOUDFLARE_DNS.md`](./CLOUDFLARE_DNS.md) — DNS + SSL
- [`ECOSYSTEM.md`](./ECOSYSTEM.md) — product map
- [`DISCOVERY_INTELLIGENCE.md`](./DISCOVERY_INTELLIGENCE.md) — operator handoff
