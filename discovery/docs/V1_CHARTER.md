# V1 Product Charter

**Demand Capture** for web and digital agencies — find website opportunities and active demand, pursue honestly, close and measure revenue.

Related: [OPERATING_MODEL.md](OPERATING_MODEL.md) · [ARCHITECTURE.md](ARCHITECTURE.md)

---

## Strategic choice (locked)

**Path A — vertical operator tool for web/dev agencies on v1.**

- One ICP: small web, digital, or marketing agencies (1–2 operators) hunting local business clients.
- Optimize for **razor-sharp results** before breadth, packaging, or multi-tenant SaaS.
- **Not** horizontal revenue intelligence, tender platforms, or public SaaS on v1.

---

## What we are building

The platform is **more than a lead list**. The value chain:

| Stage | Operator concept | System entity |
|-------|------------------|---------------|
| **Find** | Hunt prospects and hot demand | Discovery runs, demand inbox, intent ingest |
| **Triage** | Decide who is worth pursuing | Opportunities (review queue) |
| **Pursue** | Outreach, follow-up, qualification | Pursuits (leads), outreach messages |
| **Close** | Proposals and revenue | Proposals, revenue records |

Full pipeline (see [ARCHITECTURE.md](ARCHITECTURE.md)):

**Discovery → Intent → Intelligence → Qualification → CRM → Outreach → Proposal → Revenue**

---

## ICP definition (web agency)

**Ideal customer profile** — businesses we sell web work to:

- Local SMBs in chosen geo + industry verticals.
- **Website opportunity signals:** no website, poor HTTPS, not mobile-friendly, outdated presence.
- **Demand signals:** public requests for web help (paste, RSS, Reddit) weighted above cold enrichment.
- **Reachability required** before export or outreach — email, phone, or verified Places data.

Configured via Settings → ICP (`requireWebsiteOpportunity`, `demandWeightMultiplier`, `minReachabilityForExport`).

---

## Dual ingress (both matter)

1. **Proactive discovery** — geo/industry runs → crawl → score → opportunities queue.
2. **Reactive demand** — paste, RSS, Reddit → demand inbox → match or create prospect → opportunities.

Daily work prioritizes **demand first**, then **verified high-score opportunities**. See [OPERATING_MODEL.md](OPERATING_MODEL.md) cadence.

---

## North-star metrics

Acquisition KPIs (7-day window) are defined in OPERATING_MODEL. v1 success also requires **revenue proof**:

- At least one **PROPOSAL_SENT** or **CLOSED_WON** with amount logged per month.
- Ability to name which **discovery run** or **demand source** produced the best pursuits.

Phase 4+ will add revenue attribution on the Ops dashboard.

---

## Non-goals (v1)

Do **not** build or position toward:

| Non-goal | Why |
|----------|-----|
| Tender / procurement intelligence | Different wedge, different data moat |
| Multi-tenant public SaaS | Dilutes ICP before results are proven |
| API / MCP marketplace | Infrastructure before product-market fit |
| Automated mass email | Honest outreach only; external ESP for sends |
| Enterprise CRM replacement | Scoped to acquisition → first deal |
| Generic “any industry” lead gen | Breaks web-agency scoring and pitch angles |

---

## Operator language (UI)

| Old term | v1 term | Meaning |
|----------|---------|---------|
| Review queue | **Work queue** | Unified triage — demand + pre-pursuit accounts |
| Lead | **Pursuit** | Active sales motion on an account |
| Intent ingest | **Add demand** | Paste or poll demand signals |
| Ops | **Today** | Daily start — KPIs, backlog, funnel |

Routes unchanged (`/review`, `/leads`, etc.); labels reflect the mental model.

---

## Phase 4 roadmap (reference)

| Chunk | Focus |
|-------|--------|
| **P4-R0** | Charter + nav copy (this doc) — done |
| **P4-R1** | Opportunity cards — factors + pitch angle — done |
| **P4-R2** | Unified work queue (demand + discovery) — done |
| **P4-R3** | Website opportunity brief on account / pursuit — done |
| **P4-R4** | Revenue ops metrics + attribution — done |
| **P4-R5** | Outreach templates by opportunity type — done |
| **P4-R6** | Win/loss summary on Ops — done |

---

## Phase 5 roadmap (discovery hardening)

See [P5_DISCOVERY_CHARTER.md](P5_DISCOVERY_CHARTER.md) for full source manifest and stub policy.

| Chunk | Focus |
|-------|--------|
| **P5-D0** | Discovery charter + scope lock — done |
| **P5-D1** | Google Places primary discovery — done |
| **P5-D2** | Doc truth + stub cleanup — done |
| **P5-D3** | Public search hardening — done |
| **P5-D4–D13** | Run yield, BI profile, Meta/social ingress, review pain, acceptance — done |

---

## Decision filter for new work

Before adding a feature, ask:

1. Does it help a **web agency operator** find or close **website work** faster?
2. Does it improve **sharpness** (better triage, contact path, or revenue proof)?
3. Can we defer it without blocking **Path A**?

If any answer is “no” or “only for other industries,” defer to post-v1 or a separate product line.
