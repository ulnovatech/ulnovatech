# Deploy UlnoVaTech to Google Compute Engine (Docker)

Operator runbook for production on a **single GCE VM** (Ubuntu 22.04/24.04 AMD64) with **Cloudflare Free** DNS/TLS edge and **GitHub Actions** deploy.

Primary production target. Legacy Oracle runbook: [`DEPLOY_ORACLE.md`](./DEPLOY_ORACLE.md).

## Architecture

| Component | Runtime |
|-----------|---------|
| Marketing, blog, dash, portfolio, PHP APIs | nginx + php-fpm + MySQL |
| Discovery Intelligence | postgres + discovery-web + discovery-worker |
| TLS edge | Cloudflare (proxied A records, **Flexible** while origin is HTTP `:80`) |
| CI/CD | GitHub Actions → SSH/rsync → `docker compose` |

Server layout: [`infra/env/README.md`](../infra/env/README.md).

## Budget note ($300 trial)

| Item | Guidance |
|------|----------|
| Recommended shape | `e2-standard-2` (2 vCPU / 8 GB) — bump to `e2-standard-4` if OOM |
| Disk | 50–80 GB balanced persistent disk |
| Rough all-in | ~$50–110/mo (VM + disk + egress) |
| Trial | ~$300 / 90 days — plan paid continue or shrink before credit ends |
| Always Free `e2-micro` | Too small for full stack; do not use as prod target |

Google Places / CSE / Clerk costs are **outside** GCE compute credit.

## Current production instance

| Field | Value |
|-------|-------|
| Project | `cedar-network-468517-e9` |
| Name | `ulnovatech-prod` |
| Zone | `us-central1-a` |
| Machine type | `e2-medium` (1 vCPU / 4 GB) — **temporary** until global CPU quota allows `e2-standard-2` |
| Static IP | `34.66.94.12` (`ulnovatech-ip-usc1`) |
| Network tag | `ulnovatech-web` |
| Firewall | `ulnovatech-allow-web` (tcp 22/80/443) |
| Disk | 60 GB pd-balanced |
| Hub status (Chunk 4) | HTTP 200 for `/health`, `/`, `/dash/` with `Host: ulnovatech.store` |
| Discovery status | Containers up; **needs Clerk keys** in `docker.discovery.env` (empty keys → 500 from middleware) |

**Compose `.env` location:** put `MYSQL_*` / `POSTGRES_PASSWORD` in **`infra/.env`** (directory of the first `-f` file), not only repo-root `.env`.

**Quota note:** project `CPUS_ALL_REGIONS` was 11/12 when provisioning (other VMs: `videoos-media-ai`, `videoos-worker`, `instance-20260708-015724`). Free ≥1 more vCPU (stop or resize another instance), then:

```bash
gcloud compute instances stop ulnovatech-prod --zone=us-central1-a
gcloud compute instances set-machine-type ulnovatech-prod --zone=us-central1-a --machine-type=e2-standard-2
gcloud compute instances start ulnovatech-prod --zone=us-central1-a
```

## 1. Provision GCE VM

```bash
# Example — adjust PROJECT, ZONE, and SSH key path
export PROJECT=YOUR_GCP_PROJECT
export ZONE=us-central1-a
export NAME=ulnovatech-prod

gcloud config set project "$PROJECT"

# Firewall (once per project)
gcloud compute firewall-rules create ulnovatech-allow-web \
  --allow=tcp:22,tcp:80,tcp:443 \
  --target-tags=ulnovatech-web \
  --description="UlnoVaTech SSH + HTTP + HTTPS" \
  --direction=INGRESS || true

# Static IP
gcloud compute addresses create ulnovatech-ip --region=us-central1
STATIC_IP=$(gcloud compute addresses describe ulnovatech-ip --region=us-central1 --format='get(address)')

# VM
gcloud compute instances create "$NAME" \
  --zone="$ZONE" \
  --machine-type=e2-standard-2 \
  --image-family=ubuntu-2404-lts-amd64 \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=60GB \
  --boot-disk-type=pd-balanced \
  --tags=ulnovatech-web \
  --address=ulnovatech-ip \
  --metadata=enable-oslogin=FALSE
```

Note `$STATIC_IP` for Cloudflare ([`CLOUDFLARE_DNS.md`](./CLOUDFLARE_DNS.md)).

SSH as the default Ubuntu user (or OS Login user), then bootstrap.

## 2. Bootstrap the host

```bash
# From a fresh git clone on the VM, or pipe from your repo:
sudo bash infra/gcloud/bootstrap.sh
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

Configure A/CNAME records per [`CLOUDFLARE_DNS.md`](./CLOUDFLARE_DNS.md) **after** the stack is healthy on the VM (or point early for cutover). SSL mode: **Flexible** while nginx listens on HTTP `:80` only.

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

Place GCP/Firebase credentials (optional):

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
rsync -avz public_html/ deploy@VM:/opt/ulnovatech/public_html/

cp /opt/ulnovatech/secrets/service-account.json \
  /opt/ulnovatech/public_html/ulndash/backend/service-account.json
chmod 600 /opt/ulnovatech/public_html/ulndash/backend/service-account.json

cd /opt/ulnovatech/repo
export PUBLIC_HTML_PATH=/opt/ulnovatech/public_html
export ULNOVATECH_ENV_FILE=/opt/ulnovatech/env/docker.ulnovatech.env
export DISCOVERY_ENV_FILE=/opt/ulnovatech/env/docker.discovery.env

docker compose -f infra/docker-compose.full.yml -f infra/docker-compose.prod.yml up -d --build
```

Migrations:

```bash
docker compose -f infra/docker-compose.full.yml run --rm discovery-migrate
docker compose -f infra/docker-compose.full.yml exec php-fpm \
  php /var/www/public_html/ulndash/backend/scripts/apply_admin_mobile_migrations.php
```

Import MySQL schema if this is a fresh database (add `02-schema.sql` under `infra/mysql/init/` before first `mysql` boot, or import manually).

## 6. Smoke tests

On the VM (HTTP):

```bash
cd /opt/ulnovatech/repo
bash infra/scripts/smoke-full.sh http://127.0.0.1
```

After DNS + Cloudflare HTTPS:

```bash
DISCOVERY_URL=https://discovery.ulnovatech.store \
  bash infra/scripts/smoke-full.sh https://ulnovatech.store
```

## 7. GitHub Actions deploy (ongoing)

### Repository secrets

| Secret | Description |
|--------|-------------|
| `GCE_SSH_HOST` | VM public IP (`34.66.94.12`) |
| `GCE_SSH_USER` | `deploy` |
| `GCE_SSH_PRIVATE_KEY` | PEM/ed25519 private key matching `deploy` `authorized_keys` |

These are configured on the GitHub repo. Workflow: [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) (retargeted from OCI).


### Workflow

Push to `main` / `workflow_dispatch` triggers [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml):

1. Build `public_html` (`npm run build:linux`)
2. Verify Discovery builds (`pnpm build` in `discovery/`)
3. Rsync `public_html/`, `infra/`, `discovery/` to `/opt/ulnovatech/`
4. SSH: `docker compose … up -d --build`
5. Run Discovery + CRM migrations

## 8. Backups

### MySQL

```bash
cd /opt/ulnovatech/repo
docker compose -f infra/docker-compose.full.yml exec -T mysql \
  mysqldump -u root -p"${MYSQL_ROOT_PASSWORD}" ulnovatech \
  > ~/backup-ulnovatech-$(date +%F).sql
```

Schedule with `cron`; copy dumps off-box (GCS bucket optional).

### Postgres (Discovery)

```bash
docker compose -f infra/docker-compose.full.yml exec -T postgres \
  pg_dump -U postgres agency_platform \
  > ~/backup-discovery-$(date +%F).sql
```

### Volumes

Docker named volumes: `mysql_data`, `postgres_data`, `discovery_storage`. Snapshot the GCE disk for disaster recovery.

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

Env file paths must be exported on every manual compose invocation.

## 10. Troubleshooting

| Symptom | Check |
|---------|-------|
| 502 on `/api/` | `docker compose ps`, php-fpm logs, `DB_*` in env file |
| Discovery 502 | `discovery-web` health, `DATABASE_URL`, migrate logs |
| Mobile login fails | `DASH_ADMIN_PASS_HASH`, not plain `DASH_ADMIN_PASS` |
| FCM push silent | `service-account.json` in `ulndash/backend/`, `FCM_PROJECT_ID` |
| Cloudflare 521/522 | GCE firewall + UFW allow 80; instance running |
| Cloudflare SSL errors | Use **Flexible** while origin is HTTP-only (`listen 80`) |

## Related docs

- [`infra/README.md`](../infra/README.md) — compose services and local dev
- [`CLOUDFLARE_DNS.md`](./CLOUDFLARE_DNS.md) — DNS + SSL
- [`ECOSYSTEM.md`](./ECOSYSTEM.md) — product map
- [`DISCOVERY_INTELLIGENCE.md`](./DISCOVERY_INTELLIGENCE.md) — operator handoff
