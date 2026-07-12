# Temporary public access (no custom domain)

InfinityFree / `ulnovatech.store` names are **abandoned**. Production origin is GCE **`34.66.94.12`**.

Until a new domain is purchased, use **IP + [nip.io](https://nip.io)** hostnames (DNS that resolves any `*.A.B.C.D.nip.io` to `A.B.C.D`).

| Surface | URL |
|---------|-----|
| Hub (marketing, `/dash`, PHP APIs) | http://34.66.94.12/ |
| Hub (named) | http://hub.34.66.94.12.nip.io/ |
| Hub health | http://hub.34.66.94.12.nip.io/health |
| Discovery UI / API | http://discovery.34.66.94.12.nip.io/ |
| Discovery health | http://discovery.34.66.94.12.nip.io/api/health |

nginx: hub is `default_server` (bare IP → hub). Discovery only matches `discovery.34.66.94.12.nip.io`.

## Env on the VM

`/opt/ulnovatech/env/docker.ulnovatech.env`:

```env
BASE_URL=http://hub.34.66.94.12.nip.io
ALLOWED_ORIGINS=http://hub.34.66.94.12.nip.io,http://34.66.94.12,http://discovery.34.66.94.12.nip.io
```

`/opt/ulnovatech/env/docker.discovery.env`:

```env
NEXT_PUBLIC_APP_URL=http://discovery.34.66.94.12.nip.io
```

After changing Discovery `NEXT_PUBLIC_*`, rebuild `discovery-web` (baked at image build time).

## Smoke

```bash
curl -sI http://hub.34.66.94.12.nip.io/health
curl -sI http://34.66.94.12/health
curl -s http://discovery.34.66.94.12.nip.io/api/health
```

On the VM (localhost):

```bash
SMOKE_HOST=hub.34.66.94.12.nip.io bash infra/scripts/smoke-ulnovatech.sh http://127.0.0.1
```

## Later: real domain

1. Buy a domain; create A records → `34.66.94.12` for apex + `discovery` (or path-based split).
2. Update nginx `server_name`, env `BASE_URL` / `NEXT_PUBLIC_APP_URL` / `ALLOWED_ORIGINS`.
3. Optional: Cloudflare Free + Flexible SSL while origin stays HTTP `:80`.

See [`DEPLOY_GCLOUD.md`](./DEPLOY_GCLOUD.md). Legacy InfinityFree notes are obsolete for production cutover.
