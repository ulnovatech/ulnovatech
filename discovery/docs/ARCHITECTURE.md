# Architecture

Modular monolith: `apps/dashboard` exposes UI and `/api/*` routes. Business logic lives in `modules/*`. Shared infrastructure in `packages/*`.

**V1 charter:** [docs/V1_CHARTER.md](V1_CHARTER.md) — web agency ICP, operator language, non-goals.

**Operator guide:** [docs/OPERATING_MODEL.md](OPERATING_MODEL.md) — daily cadence, run profiles, KPI targets, validation rules.

## V1 product language (Phase 4 R0)

Operator-facing labels (routes unchanged):

| Route | Label | Role |
|-------|-------|------|
| `/ops` | Today | Daily start — KPIs and backlog |
| `/review` | Work queue | Unified triage — demand first, then opportunities |
| `/leads` | Pursuits | Active sales motions |
| `/intent/inbox` | Demand inbox | Hot demand signals |
| `/intent` | Add demand | Paste / poll demand |

Copy source: `apps/dashboard/src/lib/product-copy.ts` · Charter: [V1_CHARTER.md](V1_CHARTER.md)

## Opportunity cards (Phase 4 R1)

Review queue (`/review` → Opportunities) returns enriched items from `QualificationService.getReviewQueue`:

- `opportunityType` / `opportunityTypeLabel` — rule-based classification (`demand_response`, `greenfield`, `redesign`, `modernize`, `general`)
- `pitchAngle` — one-line outreach hook from scoring factors + demand count
- `positiveFactors` / `blockers` — human-readable factor chips

Logic: `@agency/scoring` (`deriveOpportunityBrief`). UI: `OpportunityCard` component.

## Work queue (Phase 4 R2)

`GET /api/qualification/work-queue` merges orphan demand + discovery opportunities into one priority-sorted list.

| Tier | Priority base | Source |
|------|---------------|--------|
| Hot demand | 10_000 + signal strength | Orphan `intent_signals` |
| Verified opportunity | 5_000 + score + reachability bonus | Review queue |
| Unverified opportunity | 1_000 + score | Review queue |

UI: `/review` (Work queue) — `DemandWorkCard` + `OpportunityCard`. Ops dashboard links here as daily triage entry.

## Website opportunity brief (Phase 4 R3)

`GET /api/qualification/opportunity-brief/[businessId]` and pursuit hub (`/leads/[id]`) return `buildWebsiteOpportunityBrief`:

- Website gaps (no site, HTTPS, mobile, crawl status)
- Outreach hook (rule-based pitch angle)
- Linked demand signal snippets
- Scoring factors and reachability

UI: `OpportunityBriefPanel` on pursuit hub (always visible) + expandable on work queue opportunity cards.

## Revenue ops metrics (Phase 4 R4)

`OpsMetricsService.getMetrics()` includes `revenue` from `loadRevenueMetrics`:

| Metric | Source |
|--------|--------|
| MTD / all-time revenue | `revenue_records` |
| Pipeline value | `proposals` where lead `PROPOSAL_SENT` + status `sent` |
| Win rate | `CLOSED_WON` / (`CLOSED_WON` + `CLOSED_LOST`) |
| Avg deal size | `AVG(revenue_records.amount)` |
| Revenue by discovery run | `businesses.discovery_run_id` join |
| Revenue from demand | `businesses.source = demand_inbox` |
| Top loss reasons | `lead_activities` type `closed_lost` |

UI: **Today** (`/ops`) — Revenue proof section above acquisition KPIs.

## Outreach by opportunity type (Phase 4 R5)

`outreach_templates.opportunity_type` maps templates to scoring opportunity types (`demand_response`, `greenfield`, `redesign`, `modernize`, `general`).

- Default templates auto-seed on `GET /api/outreach/templates` (idempotent)
- `GET /api/outreach/templates/recommended?leadId=` — picks template from `QualificationService.getOpportunityBrief`
- `OutreachCompose` auto-selects recommended template + shows pitch angle

## Win/loss summary (Phase 4 R6)

`loadRevenueMetrics` also returns:

| Metric | Source |
|--------|--------|
| Win rate by source | `CLOSED_WON` / `CLOSED_LOST` grouped by `demand_inbox` vs discovery |
| Recent losses | Last 5 `closed_lost` activities with pursuit link + reason |
| Top loss reasons | Aggregated close-lost notes (from R4) |

UI: **Today** (`/ops`) — Win/loss summary section between Revenue proof and Acquisition KPIs.

## Places primary discovery (Phase 5 D1)

`GooglePlacesDiscoveryProvider` runs first in the `discover` stage when Places is configured and run profile is standard/boost:

- Text Search fan-out by industry + city (or all cities in country)
- Pagination via `nextPageToken` (up to `discoverPageSize` per page, default 20)
- Budget: `standardDiscoverMaxPerRun` / `boostDiscoverMaxPerRun` API calls per run
- Candidates use `source: google_maps`, `externalId: places/{id}`
- `resolve_accounts` still verifies search/CSV candidates that lack Places data

See [P5_DISCOVERY_CHARTER.md](P5_DISCOVERY_CHARTER.md).

## Doc truth + stub cleanup (Phase 5 D2)

- Removed `planned.ts` (`PlannedProvider` stubs for Facebook/Instagram)
- [SETUP_RESOURCES.md](SETUP_RESOURCES.md) distinguishes **wired sources** vs **Phase 5 upcoming**
- Discovery sources API lists only implemented providers + Reddit demand health
- `discovery-stub-guard.test.ts` fails CI if stub patterns reappear in `@agency/discovery`

## Public search hardening (Phase 5 D3)

`PublicSearchProvider` improvements:

- **CSE/Bing pagination** — up to 2 pages/query (standard), 3 (boost), 1 (economy); 10 results/page
- **Result classifier** — drops directories, listicles, articles; keeps business pages + social profiles
- **Social site: queries** — `buildSocialSearchQueries` (Facebook, Instagram, TikTok, LinkedIn company, YouTube)
- **Extended parsing** — TikTok/LinkedIn/YouTube/Twitter URLs in `metadata`; cleaner title stripping

Exports: `buildSocialSearchQueries`, `classifySearchResult`, `getSearchPagesPerQuery`.

## Run yield metrics (Phase 5 D4)

`discovery_runs.stats` (jsonb) stores per-run funnel metrics computed by `computeRunYieldStats`:

- **Discover funnel:** `candidatesDiscovered`, `discoverBySource`, `suppressedSkipped`
- **Saved accounts:** `accountsSaved`, `savedBySource`, contact fields (`withEmail`, `withPhone`, `contactable`, `withWebsite`)
- **Pipeline depth:** `crawled`, `scored`, `scoredAtOrAboveMin`, `reachabilityMediumOrHigh`
- **Rates:** `contactablePct`, `websitePct`, `scoredPct`

Populated by the job worker after `resolve_accounts` and `score`, and on run completion/failure via `refreshRunYieldStats`. Dashboard run detail shows a **Run yield** panel; the discovery list shows saved count + contactable % when stats exist.

Exports: `computeRunYieldStats`, `refreshRunYieldStats`, `DiscoveryRunStats`.

## CSV upload + robust parser (Phase 5 D5)

Operator lead lists via **CSV import** (`CsvImportProvider`):

- **RFC 4180 parser** — quoted fields, escaped quotes, commas in values, UTF-8 BOM (`parseCsvContent`)
- **Header aliases** — `name` / `business` / `company`, `website` / `url`, social URL columns, etc.
- **Upload API** — `POST /api/discovery/csv/upload` (multipart or JSON body); saves atomically to `discovery.csvImportPath`
- **Status API** — `GET /api/discovery/csv`; template download via `?template=1`
- **Discovery UI** — drag-and-drop upload panel; sources panel shows row count when ready
- Limits: 5MB, 10,000 data rows

Exports: `parseCsvContent`, `mapCsvRowsToCandidates`, `getCsvImportFileInfo`, `saveCsvImportFile`, `getCsvTemplateContent`.

## Meta Graph discovery (Phase 5 D9)

Facebook + Instagram business discovery via Meta Graph API (`MetaGraphDiscoveryProvider`):

- **Credential:** `META_GRAPH_API_TOKEN` / Settings → Meta Graph API Token
- **Endpoints:** `GET /search?type=page` and `GET /search?type=place` (Graph API v21.0)
- **Discover order:** after public search, before CSV
- **Mapping:** `source: facebook` for pages/places; linked `instagram_business_account` also emits `source: instagram` row
- **Budget:** `meta_graph` daily cap (`META_GRAPH_DAILY_CAP`); per-run query limits via `metaGraphLimits` in acquisition settings
- **Errors:** auth/rate-limit logged; run continues with other sources

Exports: `MetaGraphDiscoveryProvider`, `MetaGraphClient`, `buildMetaSearchQueries`.

## Social search discovery (Phase 5 D10)

TikTok, LinkedIn, X, and YouTube profile discovery via CSE/Bing `site:` queries (`SocialSearchProvider`):

- **Credential:** same as public search (`GOOGLE_CSE_API_KEY` + `GOOGLE_CSE_CX` and/or `BING_SEARCH_KEY`)
- **Queries:** `build-social-search-queries.ts` — `site:tiktok.com`, `site:linkedin.com/company`, `site:youtube.com`, `site:twitter.com`, `site:x.com`
- **Discover order:** after Meta Graph, before CSV
- **Parser:** `parse-social-search-result.ts` — social profiles only; rejects Facebook/Instagram (Meta Graph)
- **Budget:** shares `google_cse` / `bing_search` daily caps; skips gracefully when exhausted
- **Source:** `social_search` on candidates with `metadata.primaryPlatform` and platform URL fields

Exports: `SocialSearchProvider`, `parseSocialSearchResultItem`, `buildSocialSearchQueries`.

## BI profile scoring wiring (Phase 5 D11)

After `bi_enrich`, qualification and intent consume `BusinessIntelligenceProfile`:

- **Signals** (`derive-signals.ts`) — infrastructure `opportunityFlags`, link-in-bio-only, multi-social footprint
- **Scoring** (`@agency/scoring` `bi-scoring.ts`) — factors: `socialOnlyPresence`, `linktreeOnly`, `noBooking`, `missingEmailCapture`, `missingAnalytics`
- **Opportunity brief** — pitch angles and gaps from BI hints; footprint chips on work queue cards
- **Outreach** — `opportunityType` still drives template selection via `resolveTemplateForOpportunityType`

Exports: `biScoringInputFromProfile`, `deriveBiScoringHints`, `applyBiScoringFactors`, `footprintChipLabels`.

## BI profile core (Phase 5 D6)

`business_intelligence_profiles` stores a structured **BusinessIntelligenceProfile** per account (jsonb), built after website crawl:

- **Pipeline stage:** `bi_enrich` runs after `crawl`, before `derive_signals`
- **Identity / contact / presence** — merged from business + account + `website_analyses`
- **Digital footprint** — social links from account, business, discovery metadata, crawl
- **Website intel** — crawl title, meta, status, pages from `account.metadata.crawl`
- **Completeness score** — 0–100 field coverage for triage (wired into scoring in P5-D11)

Exports (`@agency/intelligence`): `BiProfileService`, `BusinessIntelligenceProfile`, `buildBusinessIntelligenceProfile`.

API: `GET /api/intelligence/bi-profile/[businessId]`.

## Digital footprint + relationship graph (Phase 5 D7)

Extends BI enrichment during `bi_enrich`:

- **Crawl social extraction** — all platforms (TikTok, LinkedIn, YouTube, X, etc.) + link-in-bio URLs stored in `account.metadata.crawl`
- **Link-in-bio resolver** — fetches Linktree / bio.link / beacons / taplink pages (max 2/account) and extracts outbound social + website
- **Relationship graph** — nodes (business, website, social, link-in-bio, Maps) and edges (`has_profile`, `links_to`, `resolves_to`) on `digitalFootprint.relationshipGraph`

Exports: `extractSocialUrlsFromHtml`, `enrichDigitalFootprint`, `buildRelationshipGraph`, `isLinkInBioUrl`.

## Infrastructure audit heuristics (Phase 5 D8)

Website crawl scans HTML for SMB infrastructure signals, stored in `account.metadata.crawl.infrastructureAudit` and on `BusinessIntelligenceProfile.infrastructure`:

| Category | Examples detected |
|----------|-------------------|
| **Booking** | Calendly, Acuity, Booksy, Square appointments, Mindbody, Fresha |
| **Ecommerce** | Shopify, WooCommerce, BigCommerce, Ecwid, Snipcart |
| **Email capture** | Mailchimp, Klaviyo, HubSpot forms, generic newsletter forms |
| **Analytics** | Google Analytics/GTM, Meta Pixel, Hotjar, Clarity, Plausible |

Each signal includes vendor, evidence, and confidence. `opportunityFlags` highlight gaps (`missing_analytics`, `missing_email_capture`, `missing_online_booking`, etc.) for agency outreach.

Exports: `auditInfrastructureHtml`, `mergeInfrastructureAudits`, `InfrastructureAudit`.

## Operating model (Phase 2 R0)

- Run profiles: `micro` (economy), `standard`, `boost` — see OPERATING_MODEL
- V1 KPI targets defined in doc + read-only table on Settings UI (`OPERATING_KPI_TARGETS` in `@agency/settings`)
- Live KPI metrics: Ops dashboard (Phase 2 R7)

## Data ownership

| Entity | Module |
|--------|--------|
| accounts, suppression_list | accounts |
| discovery_runs, businesses | discovery |
| intent_signals | intent |
| website_analyses | intelligence |
| business_intelligence_profiles | intelligence |
| lead_scores | qualification |
| leads (per account), notes, activities | crm |
| outreach_* | outreach |
| proposals | proposal |
| clients, revenue_records | revenue |
| mh_scans, mh_scan_jobs, mh_listings, mh_action_cards, mh_spend_ledger | market-hunter (`modules/market-hunter`) |

## Live Market Hunter (product gap system)

Isolated from agency lead discovery — separate UI (`/hunter`), worker (`pnpm hunter:worker`), and Postgres tables (`mh_*`).

| Concern | Location |
|---------|----------|
| Module | `modules/market-hunter` |
| UI | `apps/dashboard/src/app/hunter/*` |
| API | `/api/market-hunter/*` |
| Worker | `apps/dashboard/src/lib/hunter-worker.ts` (not `job-worker.ts`) |
| Docs | [docs/MARKET_HUNTER.md](MARKET_HUNTER.md) |

Pipeline: Grok marketplace research → ghost filter → Claude complaints → gap score → visibility check → action cards. Reddit/G2 feed Type-1 flags in `scan.stats.type1Flags` only.

## Pipeline

Discovery (Places primary → Public Search → Meta Graph → Social search → CSV by mode) → Intent → Intelligence → Qualification → CRM → Outreach → Proposal → Revenue

Lead status changes only via `modules/crm`.

## Acquisition control (Chunk C1)

| Entity | Module |
|--------|--------|
| acquisition_jobs, budget_ledger, acquisition_settings | acquisition (`modules/acquisition`) |

- **BudgetGovernor** — quota tracking for paid/limited providers (Places, CSE, Bing, browser, custom scrape)
- **JobQueue** — Postgres-backed job staging for async pipeline
- APIs: `GET /api/acquisition/budget`, `GET /api/acquisition/jobs/[runId]`

## Async pipeline (Chunk C6)

`POST /api/discovery/runs` creates a pending run, enqueues stages, and returns immediately.

| Stage | Action |
|-------|--------|
| discover | **Places primary** (standard/boost) + public search + Meta Graph + social search + CSV |
| resolve_accounts | Places verify for non-Places candidates + canonical accounts |
| crawl | Website intelligence |
| bi_enrich | Business intelligence profile (identity, footprint, completeness) |
| derive_signals | Intent derivation |
| score | Lead qualification |
| places_enrich | Top-N Places details; patches BI `businessSignals` from reviews; emits `review_pain` intent signals |
| browser_enrich | Boost-only browser crawl (when enabled) |

- **Run profiles:** `micro` (0 Places), `standard`, `boost` — stored on `discovery_runs.run_profile`
- **Worker:** `pnpm jobs:worker` (required in production) — reclaims stale jobs, writes heartbeat
- **Dev only:** `INLINE_PIPELINE=true` drains runs inside the API process (not for Vercel)

## Intent signals (Chunk C7)

| Class | Source examples |
|-------|-----------------|
| `enrichment` | Discovery pipeline (no website, HTTPS, mobile, ratings, BI gaps, Google review pain) |
| `demand` | Paste inbox, RSS feeds |

- **Paste:** `POST /api/intent/paste` + UI at `/intent`
- **RSS:** up to 3 feeds in settings; `POST /api/intent/rss/poll` or `pnpm intent:rss-poll`
- **Dedup:** unique `source_url` per signal
- **Scoring:** demand signals weighted higher than enrichment in `@agency/scoring`

## Review queue v2 (Chunk C8)

- **Reachability:** `high | medium | low | none` on `lead_scores` — email/phone/demand driven
- **Queue:** account-level dedup, SQL `LIMIT/OFFSET`, filters (`minScore`, `reachability`, `runId`)
- **Dismiss:** `POST /api/qualification/review-queue/[accountId]/dismiss` — snooze 30 days
- **Reject:** `POST /api/qualification/review-queue/[accountId]/reject` — suppress account

## CRM funnel (Chunk C9)

Valid transitions enforced in `modules/crm/state-machine.ts`. Key paths:

- `NEW` → `REVIEWED` | `CONTACTED` (outreach records contact from NEW/REVIEWED)
- Happy path: `NEW` → `CONTACTED` → `REPLIED` → `QUALIFIED` → `PROPOSAL_SENT` → `CLOSED_WON`
- Loss path: `REPLIED` | `QUALIFIED` | `PROPOSAL_SENT` → `CLOSED_LOST` (with reason note)

- `GET /api/crm/follow-ups` — CONTACTED leads with `nextFollowUpAt <= now`
- `POST /api/crm/leads/[id]/close-lost` — close with loss reason
- Lead hub: `/leads/[id]` tabs (outreach, proposals, signals, analysis) + filtered status dropdown

## Operator outreach (Chunk C10)

Honest outreach — merge, copy, record, export. No SMTP or automated sending.

- Template tokens: `{{name}}`, `{{business}}`, `{{city}}`, `{{website}}` (from account + business)
- `GET /api/outreach/preview?leadId=&templateId=` — merged subject/body preview
- `POST /api/outreach/messages` — records message + `markContacted` (transitions NEW/REVIEWED → CONTACTED)
- `GET /api/outreach/export?templateId=&date=today` — CSV: business, email, phone, subject, body, maps_url
- UI: `/outreach` — template picker, status filter, copy + "Record outreach (sent externally)"
- Lead hub outreach tab: inline compose via shared `OutreachCompose` component

## Proposal + revenue integrity (Chunk C11)

CRM funnel gates proposal and revenue actions:

- **Create proposal:** lead must be `QUALIFIED`, or `REPLIED` with `autoQualify` (transitions to QUALIFIED)
- **Send proposal:** `POST /api/proposals/[id]/send` — lead must be `QUALIFIED` → moves to `PROPOSAL_SENT`
- **Close deal:** `POST /api/revenue` — lead must be `PROPOSAL_SENT` → `CLOSED_WON`; links `proposalId`, marks proposal `accepted`
- **Close lost:** `POST /api/crm/leads/[id]/close-lost` — from `REPLIED` | `QUALIFIED` | `PROPOSAL_SENT`

Happy path: `NEW` → `CONTACTED` → `REPLIED` → `QUALIFIED` → `PROPOSAL_SENT` → `CLOSED_WON`

- `GET /api/revenue/closeable` — PROPOSAL_SENT leads with sent proposal for revenue UI
- Proposals list includes business name + lead link; revenue UI shows proposal amount

## Tier 4 browser automation (Chunk C12)

Surgical Playwright fallback for high-value blocked crawls only. Off by default.

- Enable: `BROWSER_AUTOMATION_ENABLED=true` in env; optional `playwright` in `@agency/intelligence`
- Daily cap: `BROWSER_DAILY_CAP` (default 10) via `browser_automation` budget provider
- Session timeout: 30s (`BROWSER_SESSION_TIMEOUT_MS`)
- Pipeline: `browser_enrich` stage inserted after `score` for **boost** runs only (when enabled)
- Eligibility: `crawl_status=blocked`, `reachability=none`, score ≥ `detailsMinScore`, has website
- `BrowserCrawlService` — headless Chromium, homepage + one contact page, extracts email/phone
- Updates account + business contact fields on success; graceful skip if Playwright missing/disabled
- Not run on bulk micro/standard queues — boost profile + surgical filters only

## Tier 5 custom scrape (Chunk C13)

One high-yield custom source — Reddit public JSON for **demand signals only**.

- `RedditIntentProvider` — `r/{subreddit}/new.json`, rate-limited, budget-governed
- `CustomScrapeService` — ingests via `createDemandUnique` (no bulk accounts)
- Enable: `CUSTOM_SCRAPE_ENABLED=true`; cap: `CUSTOM_SCRAPE_DAILY_CAP` (default 50)
- Health: degraded after 3 consecutive failed poll days; shown in Discovery sources panel
- `POST /api/intent/custom-scrape/poll` · `GET /api/intent/custom-scrape/health`
- See [docs/ACQUISITION_TIERS.md](ACQUISITION_TIERS.md) for URL/selector notes

## Auth, observability, hardening (Chunk C14)

Production deploy readiness:

- **Clerk** — `middleware.ts` uses `clerkMiddleware`; `ClerkProvider` wraps app when publishable key set
- **Dev bypass** — `ALLOW_DEV_AUTH=true` (non-production only) + `X-Dev-User` header
- **Lead owner** — `POST /api/crm/leads` sets `owner` from Clerk `userId` or dev header
- **Sentry** — `captureException()` in `@agency/config` when `SENTRY_DSN` set; job worker reports failed pipeline stages
- **Sources panel** — only wired providers (`getDiscoveryProviderStatus` + Reddit demand health); no stub entries
- **Integration tests** — `apps/dashboard/src/__tests__/integration.test.ts` (funnel, dedup, budget cap)
- **Deploy guide** — [docs/DEPLOYMENT.md](DEPLOYMENT.md) (Neon + Vercel + budget alerts)
