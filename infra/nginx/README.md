# Nginx routing for UlnoVaTech (Oracle / Docker)

Replaces Apache `.htaccess` rules with nginx `server` blocks.

## Files

| File | Purpose |
|------|---------|
| [`nginx.conf`](nginx.conf) | Global nginx config |
| [`snippets/fastcgi-php.conf`](snippets/fastcgi-php.conf) | Shared PHP-FPM params |
| [`conf.d/ulnovatech.conf`](conf.d/ulnovatech.conf) | Main site (`ulnovatech.store`) |
| [`conf.d/discovery.conf`](conf.d/discovery.conf) | Discovery subdomain → Next.js |

## Apache → nginx mapping

| Apache source | nginx location |
|-------------|----------------|
| [`.htaccess`](../../.htaccess) `/api/*` → `ulndash/backend/` | `location /api/` → `api.php` via FastCGI |
| [`.htaccess`](../../.htaccess) marketing SPA fallback | `location /` → `try_files … /index.html` |
| [`scripts/htaccess/blog.htaccess`](../../scripts/htaccess/blog.htaccess) | `location ^~ /blog/` |
| [`scripts/htaccess/dash.htaccess`](../../scripts/htaccess/dash.htaccess) | `location ^~ /dash/` |
| [`scripts/htaccess/portfolio-app.htaccess`](../../scripts/htaccess/portfolio-app.htaccess) | `location ^~ /portfolio-app/` |
| `/php/*.php` | `location ^~ /php/` |
| `/portfolio/api/*.php` | `location ^~ /portfolio/api/` |

## Docker document root

```
/var/www/public_html   ← output of npm run build:linux
```

`php-fpm` and `nginx` both mount the same `public_html` volume (see `infra/docker-compose.yml` in Chunk 3).

## Discovery subdomain (Chunk 4)

When using `docker-compose.discovery.yml` or `docker-compose.full.yml`, nginx loads [`conf.d/discovery.conf`](conf.d/discovery.conf) and proxies `discovery.ulnovatech.store` to `discovery-web:3000`.

Local test with Host header:

```bash
curl -s -o /dev/null -w "%{http_code}" -H "Host: discovery.ulnovatech.store" http://localhost:8080/
```

Or open http://localhost:3000 (discovery-web published directly).

## Local verification (after Chunk 3)

```bash
docker compose -f infra/docker-compose.yml up -d
curl -s http://localhost:8080/health
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/dash/
curl -s -X POST http://localhost:8080/api/auth/mobile/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"changeme"}'
```

## Cloudflare / TLS

Terminate SSL at Cloudflare (Full strict) or add a `listen 443 ssl` server block with origin certificates on the VM. These configs listen on port 80 for origin-behind-Cloudflare.

## CRM API note

`api.php` reads `$_SERVER['REQUEST_URI']` and expects paths like `/api/auth/login`. nginx passes the original `$request_uri` via `fastcgi_params` — do not strip the `/api` prefix in rewrite rules.
