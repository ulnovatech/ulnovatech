# Cloudflare DNS — UlnoVaTech production

Point **ulnovatech.store** and **discovery.ulnovatech.store** at your **Google Compute Engine** static public IP. Cloudflare free plan is sufficient.

Primary runbook: [`DEPLOY_GCLOUD.md`](./DEPLOY_GCLOUD.md).

## Prerequisites

- GCE VM with a **static public IPv4** (reserved address recommended)
- [`infra/gcloud/bootstrap.sh`](../infra/gcloud/bootstrap.sh) completed; nginx listening on **port 80** (Compose prod publishes `80:80`)
- GCE VPC firewall + UFW allow **22**, **80**, **443**
- Cloudflare account with **ulnovatech.store** added as a site

## DNS records

Replace `YOUR_VM_PUBLIC_IP` with the GCE static IP.

| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| **A** | `@` | `YOUR_VM_PUBLIC_IP` | Proxied (orange cloud) | Auto |
| **CNAME** | `www` | `ulnovatech.store` | Proxied | Auto |
| **A** | `discovery` | `YOUR_VM_PUBLIC_IP` | Proxied | Auto |

### Notes

- **Root (`@`)** — serves `https://ulnovatech.store` (marketing, `/dash/`, PHP APIs).
- **www** — CNAME to apex; nginx already accepts `www.ulnovatech.store`.
- **discovery** — serves `https://discovery.ulnovatech.store` (Discovery Intelligence via nginx `discovery.conf`).

Optional (email, not required for app deploy):

| Type | Name | Content |
|------|------|---------|
| MX | `@` | Your mail provider |
| TXT | `@` | SPF / verification records |

## SSL/TLS (Flexible — current origin)

nginx production configs listen on **HTTP `:80` only** (see [`infra/nginx/`](../infra/nginx/) and [`infra/docker-compose.prod.yml`](../infra/docker-compose.prod.yml)). Cloudflare terminates HTTPS at the edge; traffic to the origin is HTTP.

### Edge mode (cutover)

| Setting | Value |
|---------|-------|
| SSL/TLS encryption mode | **Flexible** |
| Always Use HTTPS | On |
| Minimum TLS Version | 1.2 |
| Automatic HTTPS Rewrites | On |

**Flexible** matches an HTTP-only origin. Do **not** set Full / Full (strict) until nginx serves HTTPS with a valid origin certificate (Cloudflare Origin Certificate or Let's Encrypt) — that is a later hardening step.

### Future: Full (strict)

When ready:

1. Cloudflare → **SSL/TLS** → **Origin Server** → **Create Certificate** for `ulnovatech.store`, `*.ulnovatech.store`
2. Install cert on the VM and add `listen 443 ssl` (see [`infra/nginx/README.md`](../infra/nginx/README.md))
3. Switch Cloudflare to **Full (strict)**

## Verification

After DNS propagates (usually minutes with Cloudflare):

```bash
dig +short ulnovatech.store
dig +short discovery.ulnovatech.store

curl -sI https://ulnovatech.store/
curl -sI https://discovery.ulnovatech.store/
```

Production smoke from any machine:

```bash
DISCOVERY_URL=https://discovery.ulnovatech.store \
  bash infra/scripts/smoke-full.sh https://ulnovatech.store
```

## GitHub Actions / deploy

No Cloudflare API token is required for the default GCE SSH deploy workflow. Manage DNS manually in the Cloudflare dashboard.

See [`DEPLOY_GCLOUD.md`](./DEPLOY_GCLOUD.md) for the full operator runbook.
