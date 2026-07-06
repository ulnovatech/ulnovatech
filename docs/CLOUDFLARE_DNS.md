# Cloudflare DNS — UlnoVaTech production

Point **ulnovatech.store** and **discovery.ulnovatech.store** at your Oracle Cloud VM public IP. Cloudflare free plan is sufficient.

## Prerequisites

- Oracle VM with a **static public IPv4** (reserved/elastic IP recommended)
- `bootstrap.sh` completed; nginx listening on ports 80/443
- Cloudflare account with **ulnovatech.store** added as a site

## DNS records

Replace `YOUR_VM_PUBLIC_IP` with the Oracle instance public IP.

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

## SSL/TLS (Full strict)

Cloudflare terminates TLS at the edge; origin (Oracle VM) must present a valid certificate.

### Recommended: Cloudflare Origin Certificate

1. Cloudflare dashboard → **SSL/TLS** → **Origin Server** → **Create Certificate**.
2. Hostnames: `ulnovatech.store`, `*.ulnovatech.store`.
3. Save certificate + key on the VM (e.g. `/opt/ulnovatech/secrets/cloudflare-origin.pem`).
4. Mount into nginx and set `ssl_certificate` / `ssl_certificate_key` in server blocks (see `infra/nginx/README.md` when TLS snippets are added).

Until origin TLS is configured, use **Full** (not strict) only for initial smoke tests, then move to **Full (strict)** before production cutover.

### Edge mode

| Setting | Value |
|---------|-------|
| SSL/TLS encryption mode | **Full (strict)** |
| Always Use HTTPS | On |
| Minimum TLS Version | 1.2 |
| Automatic HTTPS Rewrites | On |

## Verification

After DNS propagates (usually minutes with Cloudflare):

```bash
dig +short ulnovatech.store
dig +short discovery.ulnovatech.store

curl -sI https://ulnovatech.store/health
curl -sI https://discovery.ulnovatech.store/
```

Production smoke from any machine:

```bash
BASE_URL=https://ulnovatech.store DISCOVERY_URL=https://discovery.ulnovatech.store \
  bash infra/scripts/smoke-full.sh https://ulnovatech.store
```

## GitHub Actions / deploy

No Cloudflare API token is required for the default Oracle SSH deploy workflow. Manage DNS manually in the Cloudflare dashboard (or add a separate workflow later if you automate record updates).

See [`DEPLOY_ORACLE.md`](./DEPLOY_ORACLE.md) for the full operator runbook.
