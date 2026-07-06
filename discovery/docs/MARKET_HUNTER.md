# Live Market Hunter

Product gap intelligence module — discovers **what digital product to build** from marketplace data. Isolated from agency lead discovery (`/leads`, BOI, discovery pipeline).

## Operator flow

1. Enable **Market Hunter** in Settings → Live Market Hunter panel
2. Configure **OpenRouter API key** (recommended) or direct xAI / Anthropic keys
3. Choose LLM providers and models (OpenRouter slugs or direct model ids)
4. Toggle platforms, edit hunt categories, set spend cap and cost estimates
5. Open **`/hunter`** → Start new scan (setup card guides missing config)
6. Run **`pnpm hunter:worker`** (or set `INLINE_HUNTER=true` in dev)
7. Review ranked action cards → Approve one build → Dismiss noise

## UI-configurable settings

All operator-tunable values live in **Settings → Live Market Hunter** (single save):

| Setting | Notes |
|---------|--------|
| Enable / spend cap / listing limit | Per-scan budget guard |
| LLM research provider | `openrouter` (default) or `xai` direct |
| LLM research model | e.g. `perplexity/sonar`, `x-ai/grok-3` |
| LLM complaints provider | `openrouter` (default) or `anthropic` direct |
| LLM complaints model | e.g. `anthropic/claude-sonnet-4` |
| API keys | OpenRouter, xAI, Anthropic (inline in hunter panel) |
| Platform toggles | CodeCanyon, Getly, Gumroad, Product Hunt, G2, Reddit |
| Categories per platform | One per line; reset restores built-in defaults |
| Cost estimates | USD per listing/review/complaint call for budget guard |
| Payment path | Shown on action cards |
| Schedule cron | Reference + scheduled endpoint URL |

Built-in platform mechanics and gap scoring thresholds remain code-defined.

## Architecture

| Layer | Location |
|-------|----------|
| Module | `modules/market-hunter` |
| DB tables | `mh_scans`, `mh_scan_jobs`, `mh_listings`, `mh_action_cards`, `mh_spend_ledger` |
| Worker | `apps/dashboard/src/lib/hunter-worker.ts` (separate from `job-worker.ts`) |
| UI | `/hunter/*` amber/slate shell |

## Gap types

- **Type 2** — Proven sales + fixable complaints (primary action cards)
- **Type 3** — Proven sales + stale product, no major complaints
- **Type 1** — Reddit/G2 demand signals stored in `scan.stats.type1Flags` only — never auto-ranked above Type 2

## Environment variables

```env
MARKET_HUNTER_ENABLED=true
MARKET_HUNTER_MAX_SPEND_PER_RUN_USD=0.50
MARKET_HUNTER_DEFAULT_LISTING_LIMIT=20
MARKET_HUNTER_SCHEDULE_CRON=0 9 * * 1
# LLM (UI overrides; env sets first-boot defaults)
MARKET_HUNTER_RESEARCH_PROVIDER=openrouter   # or xai
MARKET_HUNTER_RESEARCH_MODEL=perplexity/sonar
MARKET_HUNTER_COMPLAINTS_PROVIDER=openrouter # or anthropic
MARKET_HUNTER_COMPLAINTS_MODEL=anthropic/claude-sonnet-4
MARKET_HUNTER_COST_LISTING_USD=0.002
MARKET_HUNTER_COST_REVIEWS_USD=0.001
MARKET_HUNTER_COST_COMPLAINTS_USD=0.003
MARKET_HUNTER_PAYMENT_PATH=Payoneer → Binance P2P → MTN/Airtel Mobile Money
# Credentials (Settings UI or env)
OPENROUTER_API_KEY=...
XAI_GROK_API_KEY=...
ANTHROPIC_API_KEY=...
INLINE_HUNTER=true          # dev: run scans inline from API
CRON_SECRET=...             # for scheduled scans
```

## API routes

| Route | Purpose |
|-------|---------|
| `POST /api/market-hunter/scans` | Start scan |
| `GET /api/market-hunter/scans` | List scans |
| `GET /api/market-hunter/scans/[id]` | Scan detail |
| `GET /api/market-hunter/scans/[id]/cards` | Action cards |
| `POST /api/market-hunter/cards/[id]/approve` | Approve card |
| `POST /api/market-hunter/cards/[id]/dismiss` | Dismiss card |
| `GET /api/market-hunter/budget` | Spend summary |
| `GET /api/market-hunter/health` | Readiness check |
| `POST /api/market-hunter/scans/scheduled` | Cron scan (CRON_SECRET) |

## Platforms

| Platform | Adapter | Action cards |
|----------|---------|--------------|
| CodeCanyon | Grok / OpenRouter research | Yes |
| Getly | Grok / OpenRouter research | Yes |
| Gumroad | Grok / OpenRouter research | Yes (visibility HIGH — usually excluded) |
| Product Hunt | Grok / OpenRouter research | Yes |
| G2 | Grok / OpenRouter review signals | Type-1 stats only |
| Reddit | Grok / OpenRouter demand threads | Type-1 stats only |

## Scheduled scans

Point your scheduler (Vercel Cron, GCP Cloud Scheduler, etc.) at:

```
POST /api/market-hunter/scans/scheduled
Authorization: Bearer $CRON_SECRET
```

Respects `marketHunter.enabled` and per-scan spend cap.
