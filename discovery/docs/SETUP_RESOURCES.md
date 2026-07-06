# Setup resources — step-by-step guide

This platform uses **real APIs and real data only**. Mock/demo providers have been removed. Follow these steps in order to run discovery successfully.

See also: [P5_DISCOVERY_CHARTER.md](P5_DISCOVERY_CHARTER.md) · [ACQUISITION_TIERS.md](ACQUISITION_TIERS.md)

### Environment file (one place only)

| What | Where |
|------|--------|
| **Infrastructure** (database, auth, caps, feature flags) | Single `.env` at **project root** — copy from `.env.example` |
| **API keys** (Places, CSE, Bing, Meta, etc.) | **Settings → API credentials** in the dashboard (preferred) |

Do **not** duplicate env into `apps/dashboard/.env.local`. The app, worker, and `pnpm db:migrate` all load the root `.env` automatically.

Optional env vars for API keys exist only as **CI/production fallbacks** when Settings has no value.

---

## Step 1: PostgreSQL (required)

You already have PostgreSQL 18 installed.

1. Ensure database exists: `agency_platform`
2. In project root `.env` only (see `.env.example`):

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/agency_platform
```

Do not copy this into `apps/dashboard/.env.local`.

3. Run migrations:

```powershell
cd "c:\xampp\htdocs\lead discover - ulntech"
pnpm db:migrate
```

---

## Step 2: Google Places API (primary discovery — standard/boost)

In **standard** and **boost** run profiles, Places Text Search is the **primary** discovery source (`google_maps`). It fans out by industry + city with pagination.

### 2.1 Create a Google Cloud project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click **Select a project** → **New Project**
4. Name it e.g. `demand-capture-platform` → **Create**

### 2.2 Enable billing

Places API requires a billing account (Google gives **$200/month free credit** on Maps Platform for most new accounts).

1. In Cloud Console: **Billing** → link a billing account
2. You will not be charged until you exceed free credits (monitor usage in console)

### 2.3 Enable Places API (New)

1. Go to **APIs & Services** → **Library**
2. Search **Places API (New)** (not the legacy Places API only)
3. Click **Enable**

Also enable if prompted:

- **Places API**

### 2.4 Create an API key

1. **APIs & Services** → **Credentials**
2. **Create credentials** → **API key**
3. Copy the key
4. **Restrict key** (recommended):
   - Application restrictions: **IP addresses** (your server IP) or none for local dev
   - API restrictions: restrict to **Places API (New)** and **Places API**

### 2.5 Add key in Settings UI (preferred)

Open **Settings → API credentials** → **Google Places API Key** → paste your key → **Save**.

Env var `GOOGLE_PLACES_API_KEY` is optional (CI fallback only when Settings is empty).

### 2.6 Restart the app

```powershell
pnpm dev
```

Open **Discovery Runs** → **Sources** — you should see **Google Maps / Business listings (primary) — ready** when using standard/boost mode.

### 2.7 Test a run

1. Start the worker: `pnpm jobs:worker`
2. On Discovery, choose profile **standard** (not micro)
3. Example: Country **Uganda**, City **Kampala**, Industry **Restaurant**
4. Click **Run Discovery**

Results should include structured businesses: name, phone, website, city, Maps link, rating, review count — with `source=google_maps` on Places-backed rows.

---

## Step 2b: Google Custom Search (supplemental — required for micro/economy)

Public search supplements Places in standard/boost. In **micro** / `ACQUISITION_MODE=economy`, Places discovery is disabled (0 API calls) — use CSE/Bing + CSV.

1. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/controlpanel/create)
2. Create a search engine (search the entire web)
3. Copy the **Search engine ID** → `GOOGLE_CSE_CX`
4. Enable **Custom Search API** in [Google Cloud Console](https://console.cloud.google.com/apis/library/customsearch.googleapis.com)
5. Create an API key → `GOOGLE_CSE_API_KEY`
6. In **Settings → API credentials**, enter **Google CSE API Key** and **Google CSE CX** → Save

Optional env fallbacks (only if Settings empty):

```
GOOGLE_CSE_API_KEY=your_key
GOOGLE_CSE_CX=your_cx_id
```

For economy-only operation add `ACQUISITION_MODE=economy`.

Free tier: **100 search queries/day** (tracked in budget governor as `google_cse`).

Optional fallback: [Bing Web Search API](https://www.microsoft.com/en-us/bing/apis/bing-web-search-api) → `BING_SEARCH_KEY`

---

## Step 3: Optional CSV import (no API)

Upload on **Discovery → CSV lead file** or edit the file at the configured path (`storage/imports/businesses.csv` by default).

1. **Template columns** (download from Discovery page or `/api/discovery/csv?template=1`):

```
name,industry,website,phone,email,city,country,source_url,google_maps_url,facebook_url,instagram_url
```

2. Parser handles quoted fields and header aliases (`business`, `company`, `url`, etc.)
3. Rows are filtered by country, city, and industry on each run (loose industry match)
4. CSV provider shows as **ready** when a valid file is uploaded (name column required)

**Limits:** 5MB · 10,000 data rows

---

## Step 3a: Meta Graph API (Facebook + Instagram discovery)

Optional supplemental discovery via Meta Graph API page and place search.

1. Create a [Meta Developer](https://developers.facebook.com/) app
2. Add **Facebook Login** or use a **System User** token with Page search permissions
3. Generate a long-lived access token with `pages_read_engagement` (and related Page permissions per your app review status)
4. **Settings → API credentials** → **Meta Graph API Token** → Save

Optional env fallback: `META_GRAPH_API_TOKEN`

**Endpoints used:** `GET /search?type=page` and `GET /search?type=place` on Graph API v21.0.

Without a token, the Meta provider is omitted from the registry (not shown as ready). Auth or rate-limit errors are logged; other discovery sources continue.

---

## Step 3b: Reddit demand (optional — not discovery fan-out)

Tier 5 custom scrape ingests **demand signals only** (not bulk business accounts).

```
CUSTOM_SCRAPE_ENABLED=true
```

Poll via **Add demand** or `pnpm custom-scrape:poll`. Shown on Discovery → Sources as **Reddit demand**.

---

## Wired sources (Discovery → Sources panel)

Only **implemented** providers appear here. Missing credentials = not shown as ready.

| Source | Role | Profile / mode | Credentials |
|--------|------|----------------|-------------|
| **Google Maps** | Primary discovery + verify | standard, boost | Settings → Google Places API Key |
| **Public search** | Supplemental discovery | all (when configured) | Settings → CSE and/or Bing keys |
| **Meta Graph** | Facebook + Instagram business discovery | all (when configured) | Settings → Meta Graph API Token |
| **Social search** | TikTok / LinkedIn / X / YouTube profiles | all (when CSE/Bing configured) | Same keys as public search |
| **CSV import** | Operator list | all (when valid file uploaded) | Upload on Discovery or `storage/imports/businesses.csv` |
| **Reddit demand** | Demand signals | opt-in | `CUSTOM_SCRAPE_ENABLED=true` |

**Discover stage order (standard/boost):** Places → public search → Meta Graph → social search → CSV.

---

## Phase 5 upcoming (not in UI until implemented)

These are on the [P5 roadmap](P5_DISCOVERY_CHARTER.md) — **no stub providers** in code until each ships:

| Source | Planned chunk |
|--------|----------------|
| Job boards / LinkedIn jobs API | Post-v1 |
| New-openings monitors | Post-v1 |

Facebook/Instagram **URLs** from crawl, CSV, or public search are stored on accounts today — that is not the same as Meta Graph discovery.

---

## Partial capabilities

| Capability | Status |
|------------|--------|
| Places ratings on discovery rows | Implemented |
| Places review text on top scorers | Implemented (`places_enrich` stage) |
| Review pain-keyword mining | Implemented (P5-D12 — BI `businessSignals` + `review_pain` signals post `places_enrich`) |

---

## Step 4: Deploy to production (later)

| Service | Purpose | Where to get it |
|---------|---------|-----------------|
| **Neon** | PostgreSQL | [neon.tech](https://neon.tech) — connection string → `DATABASE_URL` |
| **Vercel** | Host Next.js | [vercel.com](https://vercel.com) — connect repo |
| **Cloudflare R2** | File storage | [cloudflare.com](https://www.cloudflare.com/products/r2/) (optional) |

Set on Vercel:

- `DATABASE_URL`
- `GOOGLE_PLACES_API_KEY`
- `ALLOW_DEV_AUTH=false`
- Clerk keys when you add auth (Phase 9)

---

## Step 5: Troubleshooting

| Error | Fix |
|-------|-----|
| No discovery sources configured | Add `GOOGLE_PLACES_API_KEY`, CSE/Bing keys, or CSV file |
| Run stuck on pending | Start `pnpm jobs:worker` |
| Google Places API error 403 | Enable Places API (New), check billing, check key restrictions |
| Google Places API error 429 | Quota exceeded — wait or increase quota in Cloud Console |
| Zero businesses returned | Try broader industry, specific city, or standard profile (not micro) |
| Only search results, no Maps rows | Use **standard** profile; micro/economy disables Places discovery |

---

## Step 6: Cost control tips

1. Restrict API key to Places APIs only
2. Set **budget alerts** in Google Cloud Billing
3. Use **specific city** instead of **All cities** during testing (fewer API calls)
4. “All cities” runs one Places query per known city in `packages/geo` for that country
5. Use **micro** profile to test search/CSV without Places spend

---

## Quick checklist

- [ ] PostgreSQL running, `pnpm db:migrate` succeeded
- [ ] Root `.env` has `DATABASE_URL` (single file — no `apps/dashboard/.env.local`)
- [ ] Places API (New) enabled in Google Cloud
- [ ] Billing linked on Google Cloud
- [ ] **Settings → API credentials** — Places key saved
- [ ] `pnpm jobs:worker` running
- [ ] Discovery → Sources shows Google Maps **ready** (standard mode)
- [ ] Test **standard** run returns Places-backed businesses with Maps links

When all boxes are checked, the system is running on **real discovery data**.
