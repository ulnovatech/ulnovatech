# DNS — UlnoVaTech production (GCE)

Point **ulnovatech.store** and **discovery.ulnovatech.store** at the GCE static IP **`34.66.94.12`**.

## Current DNS reality (as of cutover)

Nameservers for `ulnovatech.store` are **InfinityFree / byet.org** (`ns1.byet.org` … `ns5.byet.org`), not Cloudflare. Apex currently resolves to InfinityFree (`185.27.134.113`).

Until nameservers move to Cloudflare, update **A records in the InfinityFree / byet control panel** (or wherever those NS are managed).

| Type | Name | Content | Notes |
|------|------|---------|-------|
| **A** | `@` / `ulnovatech.store` | `34.66.94.12` | Hub |
| **A** | `www` | `34.66.94.12` | Or CNAME → apex if panel allows |
| **A** | `discovery` | `34.66.94.12` | Discovery Intelligence |

### Optional later: Cloudflare Free edge

1. Add site in Cloudflare and change registrar NS to Cloudflare.
2. Create the same A records (proxied / orange cloud).
3. SSL/TLS mode **Flexible** while origin nginx is HTTP `:80` only.
4. See [`DEPLOY_GCLOUD.md`](./DEPLOY_GCLOUD.md).

## Prerequisites

- GCE VM `ulnovatech-prod` with static IP `34.66.94.12`
- [`infra/gcloud/bootstrap.sh`](../infra/gcloud/bootstrap.sh) completed; nginx on port 80
- GCE firewall + UFW allow 22/80/443

## SSL while on InfinityFree DNS

Without Cloudflare, browsers hit the VM on **HTTP** unless you add origin TLS (certbot) later. For a first cutover, confirm:

```bash
curl -sI -H "Host: ulnovatech.store" http://34.66.94.12/health
```

After A records propagate:

```bash
curl -sI http://ulnovatech.store/health
curl -sI -H "Host: discovery.ulnovatech.store" http://discovery.ulnovatech.store/
```

## Cloudflare path (when NS moved)

| Setting | Value |
|---------|-------|
| SSL/TLS encryption mode | **Flexible** (HTTP origin) |
| Always Use HTTPS | On |
| Minimum TLS Version | 1.2 |

**Full (strict)** only after nginx serves HTTPS with a valid origin certificate.

## Verification

```bash
nslookup ulnovatech.store
nslookup discovery.ulnovatech.store

curl -sI http://ulnovatech.store/health
curl -sI http://discovery.ulnovatech.store/
```

## GitHub Actions / deploy

No DNS API token is required for the GCE SSH deploy workflow. Manage DNS in InfinityFree/byet (or Cloudflare after NS cutover).

See [`DEPLOY_GCLOUD.md`](./DEPLOY_GCLOUD.md) for the full operator runbook.
