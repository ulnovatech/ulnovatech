# Operating Model

How a 1–2 person web/digital agency uses Demand Capture for opportunity discovery, triage, pursuit, and revenue tracking. Read this before changing caps, run profiles, or outreach habits.

**Product scope:** [V1_CHARTER.md](V1_CHARTER.md) — Path A (web agency v1, razor-sharp results first).

Related docs: [ARCHITECTURE.md](ARCHITECTURE.md) · [ACQUISITION_TIERS.md](ACQUISITION_TIERS.md) · [DEPLOYMENT.md](DEPLOYMENT.md) · [SETUP_RESOURCES.md](SETUP_RESOURCES.md)

---

## Principles

1. **Validate before outreach** — Do not export or contact leads without a contact path (email or phone) unless you have manually verified the business.
2. **Budget is law** — Paid API calls stay under caps. Raise caps only after reviewing spend in Discovery → Sources.
3. **Honest outreach** — The platform records what you sent externally; it does not auto-send email.
4. **One account, one active pursuit** — Duplicate outreach to the same business wastes reputation and time.
5. **Worker required** — Discovery runs finish in the background job worker, not in the browser request.

---

## Run profiles

| Profile | Mode | Places API | Typical use |
|---------|------|------------|-------------|
| **micro** | economy | 0 calls | Testing a new geo/industry; search + CSV only; lowest cost |
| **standard** | standard | Primary discovery + ≤10 verify/run | Daily prospecting in one city/industry |
| **boost** | boost | Higher discover + ≤50 verify/run | Campaign push; optional browser enrich when enabled |

**When to use micro:** New market research, quota conservation, or when Places key is not configured.

**When to use standard:** Default daily operation after credentials are set.

**When to use boost:** You have budget headroom and need more verified accounts in one run. Enable browser automation only if crawl frequently returns `blocked` on high-score targets.

---

## Per-lead acquisition cascade

For each account, the system tries tiers in order (see [ACQUISITION_TIERS.md](ACQUISITION_TIERS.md)):

1. **Cache** — Skip Places if account was enriched within TTL (default 90 days).
2. **CSV / public search** — Supplemental candidates when Places is off (micro) or after Places fan-out.
3. **Google Places primary** — Text Search fan-out in standard/boost (`GooglePlacesDiscoveryProvider`).
4. **Website crawl** — Extract email, phone, social links from HTML.
5. **Places verify/enrich** — Fill gaps for search/CSV candidates when budget allows.
6. **Browser (opt-in)** — Surgical fallback for blocked high-value sites (boost only).
7. **Custom scrape (opt-in)** — Demand signals (e.g. Reddit); parallel track, not bulk accounts.

**Phase 5 pipeline additions (standard/boost):**

- **`bi_enrich`** — builds Business Intelligence profile (footprint, infrastructure audit, completeness) before scoring signals
- **`places_enrich`** — fetches Google review text for top scorers; patches BI `businessSignals` and emits `review_pain` intent signals post-score (reviews are not available earlier in the pipeline)
- **Meta Graph + social search** — secondary discover providers after Places and public search (share CSE/Bing and Meta daily caps)

---

## Daily operator cadence

### Start of day (15 min)

1. Open **Today** (Ops) — KPIs, demand backlog, opportunities queue, pursuit funnel.
2. Open **Settings** → confirm acquisition mode and review **V1 KPI targets** (read-only).
3. Check **Discovery → Sources** for budget remaining (Places monthly, CSE/Bing daily).
4. Ensure **job worker** is running locally or on your worker host:
   ```bash
   pnpm jobs:worker
   ```
5. Glance at **Follow-ups** for overdue CONTACTED pursuits.

### Acquisition block (30–60 min)

1. Process **Demand inbox** first — match or create prospects from hot signals.
2. Start a **standard** discovery run (or **micro** if conserving quota).
3. Wait for run to complete (progress on Discovery run detail page). Pipeline stages: discover → accounts → crawl → **BI enrich** → signals → score → **Places details** (reviews on top scorers).
4. Poll **Add demand** — paste, RSS, or Reddit as needed.
5. Open **Work queue** — hot demand first, then verified opportunities; dismiss junk; reject clear non-fits.

### Outreach block (30–60 min)

1. Start pursuits from qualified opportunities (**REVIEWED** or **CONTACTED** after outreach).
2. **Outreach** → pick template → preview merged fields.
3. Export CSV or copy messages; send via your external tool (Gmail, etc.).
4. **Record outreach** in the app so status moves to CONTACTED and follow-up is scheduled.

### End of week

1. Advance funnel: REPLIED → QUALIFIED → proposal → revenue as appropriate.
2. Close dead opportunities as **CLOSED_LOST** with a reason (do not leave CONTACTED leads orphaned).
3. Compare live metrics (Ops dashboard, Phase 2 R7) against KPI targets below.

---

## Manual validation rules

| Rule | Why |
|------|-----|
| Do not export leads without email **or** phone | Avoids wasted sends and list decay |
| Prefer **verified** review queue (contact or Places-verified) | Reduces CSE/parser false positives |
| Do not raise API caps without checking `budget_ledger` trend | Prevents bill shock |
| Record outreach after every external send | Funnel and follow-ups stay truthful |
| Snooze or suppress bad fits | Keeps queue trustworthy for tomorrow |

---

## Revenue proof (Today dashboard)

North-star metrics on **Today** (`/ops`) — close the loop beyond lead count:

| Metric | v1 target (30-day) |
|--------|-------------------|
| MTD revenue | ≥ 1 closed deal logged |
| Pipeline value | Track open `PROPOSAL_SENT` pursuits |
| Win rate | Learn from `CLOSED_WON` vs `CLOSED_LOST` |
| Revenue by source | Know if discovery or demand inbox produces wins |

## V1 KPI targets

Initial targets for a solo operator or pair running ~3–5 discovery runs per week. Adjust after 30 days of data.

| KPI | Target | How measured |
|-----|--------|----------------|
| Reachable leads promoted / week | ≥ 15 | Leads created from review with reachability medium+ or verified contact |
| Review → contacted conversion | ≥ 40% | CONTACTED / (REVIEWED + NEW promoted that week) |
| Duplicate outreach rate | &lt; 2% | Same account contacted twice in 30 days (should be blocked by dedup) |
| Google Places spend / month | ≤ cap (default 150) | `GET /api/acquisition/budget` → `google_places` |
| Discovery run success rate | ≥ 90% | Runs `completed` / runs started (7-day window) |
| Demand signals actioned / week | ≥ 5 | Inbox items matched, prospect-created, or dismissed (not ignored) |

Live values for these KPIs will appear on the **Ops** dashboard (Phase 2 R7). Until then, use Settings → **V1 KPI targets** as the reference table.

---

## Survival mode ($0 cash)

1. Set `ACQUISITION_MODE=economy` or use **micro** run profile.
2. Rely on CSV import + Google CSE free tier (100 queries/day).
3. Disable `BROWSER_AUTOMATION_ENABLED` and `CUSTOM_SCRAPE_ENABLED`.
4. Crawl remains on — no direct cash cost; respect rate limits.

---

## Roles (1–2 operators)

| Role | Responsibility |
|------|----------------|
| **Operator A** | Discovery runs, review queue, demand inbox |
| **Operator B** | Outreach export, record sends, follow-ups, proposals |

With Clerk auth (production), each operator's leads should filter by `owner` (Phase 2 R5). In dev, use `X-Dev-User` header for mutating API calls.

---

## What this platform is not

- Not a mass-email sender (use external ESP with compliance).
- Not a CRM replacement for enterprise teams (scoped to acquisition → first deal).
- Not guaranteed accurate business data without operator triage.

---

## Phase 2 alignment

| Phase 2 chunk | Operating impact |
|---------------|------------------|
| R1 Pipeline | Worker + stale job recovery — runs must complete reliably |
| R2 Discovery gates | Verified vs unverified review buckets |
| R3 Demand inbox | Orphan demand signals become actionable |
| R5 Outreach safety | Export defaults exclude unreviewed NEW leads |
| R7 Ops metrics | KPI table above goes live on dashboard |

---

## Phase 5 go-live verification

Before relying on discovery for daily prospecting:

```bash
pnpm discovery:acceptance
```

Expect all static checks to pass; with a local or CI database, seven pipeline jobs enqueue per run. After deploy, run one **micro** smoke run, then switch to **standard** for production prospecting. Review queue items with BI footprint chips and infrastructure gaps reflect `bi_enrich`; review pain keywords appear after `places_enrich` on scored businesses with Google reviews.
