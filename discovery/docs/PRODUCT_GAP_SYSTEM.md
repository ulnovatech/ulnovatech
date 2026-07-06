# Product Gap Detection System — Architectural Document
> Built for Cursor. No fluff. Direct build guide.

---

## 1. What This System Does

Automatically scans digital product marketplaces, scores existing products against a defined gap formula, and outputs direct action cards telling you exactly what to build, why, and at what price. 

It does NOT produce category reports or trend summaries. Every output is a specific product build order with confidence score attached.

---

## 2. Core Definitions

**Product Gap (Type 2 — Primary Target)**
An existing product with proven sales AND documented, fixable complaints in reviews. Demand is already confirmed by real transactions. Your job is to fix what buyers are already complaining about.

**Product Gap (Type 3 — Secondary Target)**
An existing product with proven sales, no major complaints, but technically stale (last updated 12+ months ago, deprecated framework/SDK). Weaker signal than Type 2 but valid secondary target.

**Ghost Listing**
A product that exists on a platform but is functionally invisible. Long published, near-zero sales, not appearing in first 3 pages of relevant search. Excluded from all gap scoring — cannot be used as demand proof.

**Platform Reverse Engineering**
Understanding the specific algorithm/mechanics of each marketplace that control whether a new listing gets seen at all. Every platform is different. This is mapped per platform before any product is built.

---

## 3. System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   SCHEDULER (GCP Cloud Scheduler)        │
│                   Runs weekly or on-demand               │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                ORCHESTRATOR (GCP Cloud Run)              │
│         Coordinates all layers, manages budget caps      │
└──────┬──────────────────┬──────────────────┬────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌──────────────┐  ┌───────────────┐  ┌──────────────────┐
│ PLATFORM     │  │  GROK API     │  │  LLM API         │
│ ADAPTERS     │  │  Live web     │  │  Complaint       │
│ (per market) │  │  research     │  │  extraction      │
└──────┬───────┘  └───────┬───────┘  └────────┬─────────┘
       │                  │                   │
       └──────────────────┴───────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   SCORING ENGINE                         │
│      Gap detection, ghost filtering, visibility check    │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              ACTION CARD GENERATOR                       │
│    Ranked list of build-ready product opportunities      │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              DASHBOARD (Simple Web UI)                   │
│         View, approve, or dismiss action cards           │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Runtime | Node.js (TypeScript) | Consistent with existing skills |
| Hosting | GCP Cloud Run | Serverless, scales to zero, covered by $300 credit |
| Scheduler | GCP Cloud Scheduler | Weekly automated runs |
| Database | Firestore | Store listings, scores, historical scans |
| Live research | xAI Grok API | Real-time web access, bypasses scraping risk |
| Complaint analysis | Claude API (claude-sonnet-4-6) | Structured complaint extraction from reviews |
| Dashboard | Next.js or plain HTML + Tailwind | Simple, fast, no overhead |
| Budget cap | Firestore counter + Cloud Run env vars | Hard stop on API spend per run |

---

## 5. Project File Structure

```
/product-gap-system
  ├── /src
  │   ├── /platforms
  │   │   ├── base.adapter.ts        ← Interface every platform must implement
  │   │   ├── codecanyon.adapter.ts
  │   │   ├── getly.adapter.ts
  │   │   ├── gumroad.adapter.ts
  │   │   └── producthunt.adapter.ts
  │   │
  │   ├── /research
  │   │   ├── grok.client.ts         ← xAI Grok API wrapper
  │   │   └── claude.client.ts       ← Claude API complaint extractor
  │   │
  │   ├── /scoring
  │   │   ├── gap.scorer.ts          ← Type 2 + Type 3 gap scoring
  │   │   ├── ghost.filter.ts        ← Ghost listing detection and removal
  │   │   └── visibility.checker.ts  ← Platform algorithm mechanics check
  │   │
  │   ├── /output
  │   │   ├── action.card.ts         ← Action card generator
  │   │   └── dashboard.ts           ← Dashboard data layer
  │   │
  │   ├── orchestrator.ts            ← Main run coordinator
  │   └── budget.guard.ts            ← Hard cap on API costs per run
  │
  ├── /dashboard                     ← Frontend (minimal)
  ├── /config
  │   └── platforms.config.ts        ← Platform on/off switches + settings
  ├── .env
  └── README.md
```

---

## 6. Platform Adapter Interface

Every platform must implement this exact interface. Adding a new platform = one new file. Nothing else changes.

```typescript
// base.adapter.ts

export interface Listing {
  id: string;
  title: string;
  price: number;
  salesCount: number;
  lastUpdatedDate: Date;
  publishedDate: Date;
  tags: string[];
  reviewCount: number;
  averageRating: number;
  sellerName: string;
  category: string;
  url: string;
  rawReviewText?: string[]; // pulled if available
}

export interface PlatformAdapter {
  platformName: string;
  isEnabled: boolean;

  // Fetch top listings in a category, sorted by sales
  fetchListings(category: string, limit: number): Promise<Listing[]>;

  // Get raw review/comment text for a specific listing
  getReviews(listingId: string): Promise<string[]>;

  // Return platform-specific visibility mechanics
  getVisibilityMechanics(): PlatformMechanics;
}

export interface PlatformMechanics {
  hasNewListingBoost: boolean;
  newListingBoostDurationDays: number;
  defaultSortOrder: 'best_selling' | 'newest' | 'relevance' | 'trending';
  trendingRequiresVelocity: boolean;
  velocityWindowDays?: number; // how many days matter for trending
  keywordsAffectRanking: boolean;
  minimumSalesForVisibility: number;
}
```

---

## 7. Platform Configurations

```typescript
// platforms.config.ts

export const PLATFORM_CONFIG = {
  codecanyon: {
    enabled: true,
    baseUrl: 'https://codecanyon.net',
    categories: [
      'mobile/react-native',
      'mobile/flutter',
      'javascript',
      'php-scripts',
    ],
    mechanics: {
      hasNewListingBoost: true,
      newListingBoostDurationDays: 7,
      defaultSortOrder: 'best_selling',
      trendingRequiresVelocity: true,
      velocityWindowDays: 30,
      keywordsAffectRanking: true,
      minimumSalesForVisibility: 0, // new items surface immediately in Newest
    }
  },
  getly: {
    enabled: true,
    baseUrl: 'https://getly.store',
    categories: [
      'developer-tools',
      'templates',
      'design-assets',
    ],
    mechanics: {
      hasNewListingBoost: true,
      newListingBoostDurationDays: 14,
      defaultSortOrder: 'newest',
      trendingRequiresVelocity: false,
      keywordsAffectRanking: true,
      minimumSalesForVisibility: 0,
    }
  },
  gumroad: {
    enabled: true,
    baseUrl: 'https://gumroad.com',
    categories: [
      'software',
      'templates',
      'design',
    ],
    mechanics: {
      hasNewListingBoost: false, // Gumroad is storefront only, no internal discovery
      newListingBoostDurationDays: 0,
      defaultSortOrder: 'relevance',
      trendingRequiresVelocity: false,
      keywordsAffectRanking: false, // buyer must bring their own traffic
      minimumSalesForVisibility: 0,
    }
  },
  producthunt: {
    enabled: true,
    baseUrl: 'https://producthunt.com',
    categories: [
      'developer-tools',
      'productivity',
      'design-tools',
    ],
    mechanics: {
      hasNewListingBoost: true,
      newListingBoostDurationDays: 1, // launch day is the window
      defaultSortOrder: 'newest',
      trendingRequiresVelocity: true,
      velocityWindowDays: 1,
      keywordsAffectRanking: false,
      minimumSalesForVisibility: 0,
    }
  }
  // Adding new platform: duplicate any block above, implement the adapter file
}
```

---

## 8. Grok Client — Live Research Layer

Grok replaces direct scraping. Your system never hits marketplaces directly at scale.

```typescript
// grok.client.ts

import Anthropic from '@anthropic-ai/sdk'; // or xAI SDK when available

const GROK_API_KEY = process.env.XAI_GROK_API_KEY;
const GROK_BASE_URL = 'https://api.x.ai/v1';

export async function researchPlatformListings(
  platform: string,
  category: string,
  limit: number = 20
): Promise<RawGrokResult> {
  
  const query = `
    Search ${platform} marketplace for the top ${limit} best-selling products 
    in the "${category}" category right now.
    
    For each product return ONLY this JSON structure:
    {
      "title": string,
      "price": number,
      "salesCount": number,
      "lastUpdated": "YYYY-MM-DD",
      "publishedDate": "YYYY-MM-DD",
      "tags": string[],
      "reviewCount": number,
      "averageRating": number,
      "url": string,
      "topComplaints": string[] // top 5 recurring complaints from reviews
    }
    
    Return a JSON array only. No explanation. No markdown.
    Sort by salesCount descending.
  `;

  const response = await fetch(`${GROK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-3',
      messages: [{ role: 'user', content: query }],
      search: true, // enable live web search
      temperature: 0.1, // low temp for structured output
    })
  });

  const data = await response.json();
  
  try {
    const clean = data.choices[0].message.content
      .replace(/```json|```/g, '')
      .trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error('Grok parse error:', err);
    return [];
  }
}
```

---

## 9. Claude Client — Complaint Extraction Layer

Takes raw review text and extracts structured, actionable complaint signals.

```typescript
// claude.client.ts

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;

export interface ComplaintAnalysis {
  topComplaints: ComplaintSignal[];
  buildableFixes: string[];       // what you can specifically fix
  estimatedFixTimedays: number;   // rough build time for the fixes
  confidenceScore: number;        // 0-100
}

export interface ComplaintSignal {
  complaint: string;
  frequency: number;              // how many reviews mention it
  isTechnical: boolean;           // can a dev fix this
  fixDifficulty: 'LOW' | 'MEDIUM' | 'HIGH';
}

export async function extractComplaints(
  productTitle: string,
  reviews: string[],
): Promise<ComplaintAnalysis> {

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: `You are a product gap analyst. 
               Extract actionable complaint signals from product reviews. 
               Return ONLY valid JSON. No explanation. No markdown.`,
      messages: [{
        role: 'user',
        content: `
          Product: "${productTitle}"
          Reviews: ${JSON.stringify(reviews)}
          
          Return this exact JSON:
          {
            "topComplaints": [
              {
                "complaint": "specific complaint text",
                "frequency": number_of_reviews_mentioning_this,
                "isTechnical": true/false,
                "fixDifficulty": "LOW/MEDIUM/HIGH"
              }
            ],
            "buildableFixes": ["fix 1", "fix 2"],
            "estimatedFixTimeDays": number,
            "confidenceScore": 0-100
          }
          
          Only include complaints mentioned by 3+ reviewers.
          Only include buildableFixes that a solo developer can implement.
        `
      }]
    })
  });

  const data = await response.json();
  
  try {
    const text = data.content[0].text.replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch (err) {
    return {
      topComplaints: [],
      buildableFixes: [],
      estimatedFixTimedays: 0,
      confidenceScore: 0,
    };
  }
}
```

---

## 10. Ghost Filter — Runs Before Any Scoring

Ghost listings must be eliminated before their sales data contaminates gap scores.

```typescript
// ghost.filter.ts

export interface GhostVerdict {
  isGhost: boolean;
  reasons: string[];
}

export function detectGhost(listing: Listing): GhostVerdict {
  const reasons: string[] = [];
  const monthsSincePublished = monthsBetween(listing.publishedDate, new Date());
  const monthsSinceUpdated = monthsBetween(listing.lastUpdatedDate, new Date());

  // Ghost signal 1: Old listing, no traction
  if (monthsSincePublished > 6 && listing.salesCount < 3) {
    reasons.push('Published 6+ months ago with under 3 sales — buried not unwanted');
  }

  // Ghost signal 2: Sales but zero reviews (no return validation)
  if (listing.salesCount > 5 && listing.reviewCount === 0) {
    reasons.push('Sales with zero reviews — weak product-market signal, possibly refunded or abandoned');
  }

  // Ghost signal 3: Abandoned by seller (no updates, dark)
  if (monthsSinceUpdated > 24 && listing.salesCount < 10) {
    reasons.push('No update in 2+ years and low sales — functionally abandoned');
  }

  // Ghost signal 4: Stale tech with zero velocity
  // (This is checked separately in staleness scorer — not a ghost alone)

  return {
    isGhost: reasons.length > 0,
    reasons,
  };
}
```

---

## 11. Gap Scorer — Core Intelligence

Runs only on non-ghost listings.

```typescript
// gap.scorer.ts

export interface GapScore {
  type: 'TYPE_2' | 'TYPE_3' | 'NONE';
  score: number;               // 0-100
  staleness: number;           // months since last update
  salesProof: number;          // total sales count
  complaintDensity: number;    // number of fixable complaints
  recentVelocity: boolean;     // is it still selling now
  verdict: string;             // human-readable summary
}

export function scoreListing(
  listing: Listing,
  complaints: ComplaintAnalysis,
  mechanics: PlatformMechanics,
): GapScore {

  const staleness = monthsBetween(listing.lastUpdatedDate, new Date());
  const hasComplaints = complaints.topComplaints.length >= 2;
  const hasProvenSales = listing.salesCount > 30;
  const hasBuildableComplaints = complaints.buildableFixes.length > 0;
  const isStale = staleness > 12;

  // TYPE 2 — Proven demand + fixable documented complaint
  if (hasProvenSales && hasComplaints && hasBuildableComplaints) {
    const score = Math.min(100, (
      (listing.salesCount * 0.4) +
      (staleness * 2 * 0.3) +              // older = bigger opening
      (complaints.topComplaints.length * 5 * 0.2) +
      (complaints.confidenceScore * 0.1)
    ));

    return {
      type: 'TYPE_2',
      score,
      staleness,
      salesProof: listing.salesCount,
      complaintDensity: complaints.topComplaints.length,
      recentVelocity: listing.salesCount > 0,
      verdict: `${listing.salesCount} proven buyers. ${complaints.buildableFixes.length} buildable fixes identified.`
    };
  }

  // TYPE 3 — Proven demand + stale, no major complaints
  if (hasProvenSales && isStale && !hasComplaints) {
    const score = Math.min(70, (
      (listing.salesCount * 0.5) +
      (staleness * 1.5 * 0.5)
    ));

    return {
      type: 'TYPE_3',
      score,
      staleness,
      salesProof: listing.salesCount,
      complaintDensity: 0,
      recentVelocity: true,
      verdict: `${listing.salesCount} proven buyers. Product stale by ${staleness} months. Fresher version viable.`
    };
  }

  return {
    type: 'NONE',
    score: 0,
    staleness,
    salesProof: listing.salesCount,
    complaintDensity: 0,
    recentVelocity: false,
    verdict: 'No actionable gap detected.'
  };
}
```

---

## 12. Visibility Checker

Runs after gap scoring. A high-scoring gap means nothing if the platform won't surface it.

```typescript
// visibility.checker.ts

export interface VisibilityVerdict {
  willSurface: boolean;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
  exploitableWindow: string | null;
}

export function checkVisibility(
  platform: string,
  mechanics: PlatformMechanics,
  categoryListingCount: number,
): VisibilityVerdict {

  // Platform has no discovery mechanic at all (e.g. Gumroad)
  if (!mechanics.hasNewListingBoost && !mechanics.keywordsAffectRanking) {
    return {
      willSurface: false,
      risk: 'HIGH',
      recommendation: 'Platform provides zero organic discovery for new listings. Requires external traffic. Skip unless you have an audience.',
      exploitableWindow: null,
    };
  }

  // Category is too saturated for new item boost to matter
  if (categoryListingCount > 1000 && mechanics.hasNewListingBoost) {
    return {
      willSurface: true,
      risk: 'MEDIUM',
      recommendation: `New listing boost exists but ${categoryListingCount} competitors means keyword precision is critical. Tags must match exact buyer search terms.`,
      exploitableWindow: `${mechanics.newListingBoostDurationDays} day new listing window`,
    };
  }

  // Good conditions
  if (mechanics.hasNewListingBoost && categoryListingCount < 500) {
    return {
      willSurface: true,
      risk: 'LOW',
      recommendation: 'Platform will surface new listing automatically. Optimise tags before publishing.',
      exploitableWindow: `${mechanics.newListingBoostDurationDays} day new listing window — maximise early sales velocity during this window`,
    };
  }

  return {
    willSurface: true,
    risk: 'MEDIUM',
    recommendation: 'Moderate discovery conditions. Keyword optimisation required.',
    exploitableWindow: null,
  };
}
```

---

## 13. Action Card Generator

Only called when gap type is TYPE_2 or TYPE_3 AND visibility risk is not HIGH.

```typescript
// action.card.ts

export interface ActionCard {
  rank: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  platform: string;
  originalProduct: string;
  originalUrl: string;
  originalPrice: number;
  originalSales: number;
  gapType: 'TYPE_2' | 'TYPE_3';
  buildSpec: {
    coreScope: string;
    differentiators: string[];
    estimatedBuildDays: number;
    recommendedPrice: number;
  };
  visibilityPlan: {
    exploitableWindow: string;
    keywordSuggestions: string[];
    risk: string;
  };
  paymentPath: string;
  approvedForBuild: boolean; // manual gate — you approve before building
}

export function generateActionCard(
  listing: Listing,
  gapScore: GapScore,
  complaints: ComplaintAnalysis,
  visibility: VisibilityVerdict,
  platform: string,
  rank: number,
): ActionCard {

  const confidence =
    gapScore.score > 70 ? 'HIGH' :
    gapScore.score > 40 ? 'MEDIUM' : 'LOW';

  return {
    rank,
    confidence,
    platform,
    originalProduct: listing.title,
    originalUrl: listing.url,
    originalPrice: listing.price,
    originalSales: listing.salesCount,
    gapType: gapScore.type,
    buildSpec: {
      coreScope: `Rebuild of "${listing.title}" scope`,
      differentiators: complaints.buildableFixes,
      estimatedBuildDays: complaints.estimatedFixTimedays || 3,
      recommendedPrice: listing.price, // match proven price point
    },
    visibilityPlan: {
      exploitableWindow: visibility.exploitableWindow || 'No automatic window',
      keywordSuggestions: listing.tags, // same tags as proven seller
      risk: visibility.risk,
    },
    paymentPath: 'Payoneer → Binance P2P → MTN/Airtel Mobile Money',
    approvedForBuild: false, // you manually flip this to true
  };
}
```

---

## 14. Budget Guard

Every run must respect a hard API cost cap. Claude and Grok both cost per call.

```typescript
// budget.guard.ts

const MAX_SPEND_PER_RUN_USD = 0.50; // hard cap, adjust as needed
let currentRunSpend = 0;

export function trackSpend(costUSD: number): void {
  currentRunSpend += costUSD;
}

export function canContinue(): boolean {
  if (currentRunSpend >= MAX_SPEND_PER_RUN_USD) {
    console.warn(`Budget cap hit at $${currentRunSpend}. Stopping run.`);
    return false;
  }
  return true;
}

export function resetForNewRun(): void {
  currentRunSpend = 0;
}

// Estimated costs per call (adjust as real usage data comes in)
export const COST_ESTIMATES = {
  grokSearchCall: 0.002,      // per platform + category query
  claudeAnalysisCall: 0.003,  // per product complaint extraction
};
```

---

## 15. Orchestrator — Main Run Logic

```typescript
// orchestrator.ts

import { PLATFORM_CONFIG } from './config/platforms.config';
import { researchPlatformListings } from './research/grok.client';
import { extractComplaints } from './research/claude.client';
import { detectGhost } from './scoring/ghost.filter';
import { scoreListing } from './scoring/gap.scorer';
import { checkVisibility } from './scoring/visibility.checker';
import { generateActionCard } from './output/action.card';
import { canContinue, trackSpend, resetForNewRun, COST_ESTIMATES } from './budget.guard';

export async function runPipelineOneTime(): Promise<ActionCard[]> {
  resetForNewRun();
  const actionCards: ActionCard[] = [];

  for (const [platformKey, config] of Object.entries(PLATFORM_CONFIG)) {
    if (!config.enabled) continue;

    for (const category of config.categories) {
      if (!canContinue()) break;

      // Step 1 — Research via Grok
      const listings = await researchPlatformListings(platformKey, category, 20);
      trackSpend(COST_ESTIMATES.grokSearchCall);

      for (const listing of listings) {
        if (!canContinue()) break;

        // Step 2 — Ghost filter
        const ghostVerdict = detectGhost(listing);
        if (ghostVerdict.isGhost) continue; // skip ghosts entirely

        // Step 3 — Complaint extraction via Claude
        const complaints = await extractComplaints(listing.title, listing.rawReviewText || []);
        trackSpend(COST_ESTIMATES.claudeAnalysisCall);

        // Step 4 — Gap scoring
        const gapScore = scoreListing(listing, complaints, config.mechanics);
        if (gapScore.type === 'NONE') continue;

        // Step 5 — Visibility check
        const visibility = checkVisibility(platformKey, config.mechanics, 500);
        if (visibility.risk === 'HIGH') continue; // skip no-discovery platforms

        // Step 6 — Generate action card
        const card = generateActionCard(
          listing,
          gapScore,
          complaints,
          visibility,
          platformKey,
          actionCards.length + 1,
        );

        actionCards.push(card);
      }
    }
  }

  // Sort by gap score descending
  return actionCards.sort((a, b) =>
    (b.confidence === 'HIGH' ? 2 : b.confidence === 'MEDIUM' ? 1 : 0) -
    (a.confidence === 'HIGH' ? 2 : a.confidence === 'MEDIUM' ? 1 : 0)
  );
}
```

---

## 16. Dashboard — Action Card UI

Simple. You see ranked cards. You approve or dismiss. Nothing auto-builds.

```
┌─────────────────────────────────────────────────────────┐
│  ACTION CARD #1 — HIGH CONFIDENCE          [APPROVE] [X] │
├─────────────────────────────────────────────────────────┤
│  Platform:     CodeCanyon                               │
│  Original:     React Native Booking App — 860 sales     │
│  Price:        $39                                      │
│  Gap type:     TYPE 2 (proven sales + fixable flaws)    │
│                                                         │
│  BUILD SPEC                                             │
│  Core:         Same booking app scope                   │
│  Fix 1:        iOS build broken since Expo SDK 50       │
│  Fix 2:        No dark mode (8 complaints)              │
│  Fix 3:        Abandoned support (5 complaints)         │
│  Est. time:    2-3 days                                 │
│  Your price:   $39                                      │
│                                                         │
│  VISIBILITY                                             │
│  Window:       7-day new listing boost                  │
│  Keyword risk: LOW                                      │
│  Tags to use:  react native, expo, booking, sdk52       │
│                                                         │
│  PAYMENT PATH                                           │
│  Payoneer → Binance P2P → Mobile Money                 │
└─────────────────────────────────────────────────────────┘
```

---

## 17. Environment Variables

```env
XAI_GROK_API_KEY=your_grok_key
ANTHROPIC_API_KEY=your_claude_key
GCP_PROJECT_ID=your_project
FIRESTORE_COLLECTION=gap_scans
MAX_SPEND_PER_RUN_USD=0.50
RUN_SCHEDULE=0 9 * * 1  # Every Monday 9am
```

---

## 18. Deployment on GCP

```bash
# Build and deploy to Cloud Run
gcloud run deploy product-gap-system \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars-from-file .env

# Set up weekly scheduler
gcloud scheduler jobs create http gap-weekly-run \
  --schedule="0 9 * * 1" \
  --uri="https://your-cloud-run-url/run" \
  --http-method=POST
```

---

## 19. Build Order for Cursor

Build in this exact sequence. Don't skip ahead.

```
Day 1:  base.adapter.ts + platforms.config.ts + budget.guard.ts
Day 2:  grok.client.ts + codecanyon.adapter.ts (first platform)
Day 3:  ghost.filter.ts + gap.scorer.ts
Day 4:  claude.client.ts + visibility.checker.ts
Day 5:  action.card.ts + orchestrator.ts
Day 6:  Dashboard UI + GCP deployment
Day 7:  Add remaining platform adapters (getly, gumroad, producthunt)
```

---

## 20. What This System Deliberately Does NOT Do

- Does not auto-build anything — human approves every action card
- Does not scrape directly at scale — Grok handles live research
- Does not score categories — only specific products
- Does not output trend reports — only build orders
- Does not run continuously — scheduled weekly to respect API budgets
- Does not guarantee sales — removes guesswork, not market risk

---

*End of architectural document.*
