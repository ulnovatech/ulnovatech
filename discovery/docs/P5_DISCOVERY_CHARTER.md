# Phase 5 — Discovery Hardening Charter

**Path A (locked):** web/dev agency operator tool — systematic local SMB sourcing, honest outreach, revenue proof.

Related: [V1_CHARTER.md](V1_CHARTER.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [ACQUISITION_TIERS.md](ACQUISITION_TIERS.md) · [OPERATING_MODEL.md](OPERATING_MODEL.md)

---

## Problem statement

Discovery runs must produce **structured, contactable local businesses** — not noisy web search titles. Phase 5 makes Google Places the **primary** fan-out in standard/boost profiles, hardens secondary sources, adds BI enrichment, and eliminates discovery stubs.

---

## v1 source manifest (7 paths — all real, no placeholders)

| # | Source | Role | Free method | Paid / fallback |
|---|--------|------|-------------|-----------------|
| 1 | **Google Maps** | Primary proactive discovery | Places Text Search fan-out (standard/boost) | Monthly cap via BudgetGovernor |
| 2 | **Public search** | Secondary seed + social URL discovery | CSE / Bing queries | Bing when CSE daily cap exhausted |
| 3 | **CSV import** | Operator lists | File on disk / upload | — |
| 4 | **Meta Facebook / Instagram** | Business page discovery | Graph API (P5-D9) | — |
| 5 | **TikTok / LinkedIn / X / YouTube** | Social footprint discovery | `site:` public search + crawl (P5-D10) | Browser tier for blocked bios |
| 6 | **Reddit** | Demand signals only | Public JSON poll (Tier 5) | — |
| 7 | **Manual / demand inbox** | Hot demand + paste | Paste, RSS, prospect create | — |

**Non-goals (unchanged):** automated mass email, tender intelligence, multi-tenant SaaS, mock/stub providers.

---

## Discover stage order (standard / boost)

1. **Google Places** — primary fan-out (`GooglePlacesDiscoveryProvider`)
2. **Public search** — supplemental candidates
3. **Meta Graph** — Facebook page/place + linked Instagram (`MetaGraphDiscoveryProvider`)
4. **Social search** — TikTok / LinkedIn / X / YouTube via `site:` queries (`SocialSearchProvider`)
5. **CSV import** — operator file

**Micro / economy:** Places discovery disabled (0 API calls); search + CSV only.

---

## Stub policy

Per [.cursor/rules/no-placeholders.mdc](../.cursor/rules/no-placeholders.mdc):

- No `PlannedProvider`, `throw new Error('not implemented')`, or UI labels for unwired sources.
- A source appears in docs and UI **only** when `discover()` performs real retrieval.
- Missing credentials → provider omitted from registry (not shown as ready).

---

## Phase 5 chunk map

| Chunk | Focus | Status |
|-------|--------|--------|
| **P5-D0** | This charter + V1 charter update | done |
| **P5-D1** | Places primary discovery provider | done |
| **P5-D2** | Doc truth + delete `planned.ts` | done |
| **P5-D3** | Public search hardening | done |
| **P5-D4** | Run yield metrics + UI | done |
| **P5-D5** | CSV upload + robust parser | done |
| **P5-D6** | BI profile core + `bi_enrich` stage | done |
| **P5-D7** | Digital footprint + relationship graph | done |
| **P5-D8** | Infrastructure audit heuristics | done |
| **P5-D9** | Meta Graph provider | done |
| **P5-D10** | Social search provider (TikTok/LinkedIn/etc.) | done |
| **P5-D11** | Scoring wired to BI profile | done |
| **P5-D12** | Places review pain signals | done |
| **P5-D13** | Acceptance tests + deploy checklist | done |

---

## P5-D13 acceptance criteria

Run before production cutover or after discovery-related changes:

```bash
pnpm discovery:acceptance
```

**Static (always):**

- No discovery stubs (`planned.ts`, `PlannedProvider`, etc.)
- Pipeline order: `discover → resolve_accounts → crawl → bi_enrich → derive_signals → score → places_enrich` (+ optional `browser_enrich` on boost)
- Discover registry order: Places → public search → Meta Graph → social search → CSV
- `places_enrich` worker patches BI review signals and emits `review_pain` intent signals
- Budget defaults include `meta_graph` cap

**With `DATABASE_URL` (CI + local):**

- Provider status API lists all five discover sources
- Full pipeline enqueues seven jobs in correct order

See [DEPLOYMENT.md](DEPLOYMENT.md) post-deploy checklist and [OPERATING_MODEL.md](OPERATING_MODEL.md) Phase 5 notes.

---

## Decision filter (Phase 5)

Before adding a discovery source or BI field:

1. Does it improve **find → triage → outreach** for web agency clients?
2. Is it backed by a **real API or crawl path** today?
3. Does it respect **budget caps** and honest outreach?

If any answer is no → defer or exclude from types/docs.

---

## Budget defaults (Places discovery)

| Setting | Standard | Boost |
|---------|----------|-------|
| Max Text Search API calls / run (discover) | 15 | 40 |
| Results per page | 20 | 20 |
| Verify cap (non-Places candidates) | 10 | 50 |

Override via platform settings `acquisition.places` or env `PLACES_DISCOVER_STANDARD_MAX`, `PLACES_DISCOVER_BOOST_MAX`.
