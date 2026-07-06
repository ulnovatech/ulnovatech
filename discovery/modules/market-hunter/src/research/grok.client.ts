import { logger } from '@agency/config';
import { platformSettings } from '@agency/settings';
import type { MarketplaceListing } from '../platforms/base.adapter';
import type { MarketHunterSpendGuard } from '../budget.guard';
import { getCostEstimates, getResearchModel, getResearchProvider } from './llm.config';
import { callOpenRouterChat } from './openrouter.client';
import {
  extractGrokResponseText,
  GrokParseError,
  normalizeGrokListing,
  parseGrokJsonContent,
  validateGrokListingsPayload,
  validateGrokReviewTexts,
} from './grok.parser';
import type { GrokResearchRequest, GrokReviewsRequest } from './grok.types';
import type { MarketHunterPlatformKey } from '../types';

const XAI_RESPONSES_URL = 'https://api.x.ai/v1/responses';
const GROK_TIMEOUT_MS = 90_000;

export class GrokResearchError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'GrokResearchError';
  }
}

export type GrokCallContext = {
  scanId?: string;
  spendGuard?: MarketHunterSpendGuard;
  operation: string;
  estimatedCostUsd?: number;
};

export type GrokClientDeps = {
  fetchFn?: typeof fetch;
  getApiKey?: () => string | undefined;
  getModel?: () => string;
};

function resolveApiKey(getApiKey?: () => string | undefined): string {
  const fromFn = getApiKey?.();
  if (fromFn) return fromFn;
  const fromSettings = platformSettings.getCredential('xai_grok_api_key');
  if (fromSettings) return fromSettings;
  throw new GrokResearchError('xAI Grok API key is not configured');
}

function resolveModel(getModel?: () => string): string {
  return getModel?.() ?? getResearchModel();
}

async function assertCanSpend(
  ctx: GrokCallContext | undefined,
  estimatedCostUsd: number,
): Promise<void> {
  if (!ctx?.spendGuard) return;
  const ok = await ctx.spendGuard.canSpend(estimatedCostUsd);
  if (!ok) {
    throw new GrokResearchError(
      `Market Hunter scan budget exhausted before Grok ${ctx.operation}`,
    );
  }
}

async function recordGrokSpend(
  ctx: GrokCallContext | undefined,
  actualCostUsd: number,
): Promise<void> {
  if (!ctx?.spendGuard) return;
  await ctx.spendGuard.recordSpend({
    provider: 'grok',
    operation: ctx.operation,
    costUsd: actualCostUsd,
  });
}

async function callGrok(
  input: {
    prompt: string;
    allowedDomain?: string;
    temperature?: number;
    costKind?: 'listing' | 'reviews';
  },
  ctx: GrokCallContext | undefined,
  deps: GrokClientDeps,
): Promise<string> {
  await platformSettings.ensureLoaded();

  const estimates = getCostEstimates();
  const costKind = input.costKind ?? 'listing';
  const estimated =
    ctx?.estimatedCostUsd ??
    (costKind === 'reviews'
      ? estimates.researchReviewsCallUsd
      : estimates.researchListingCallUsd);

  if (getResearchProvider() === 'openrouter') {
    const domainHint = input.allowedDomain
      ? `\n\nRestrict sources to ${input.allowedDomain} when possible.`
      : '';
    return callOpenRouterChat(
      {
        prompt: `${input.prompt}${domainHint}`,
        temperature: input.temperature ?? 0.1,
        mode: 'research',
      },
      {
        ...ctx,
        operation: ctx?.operation ?? 'openrouter_research',
        estimatedCostUsd: estimated,
        spendProvider: 'openrouter',
      },
      { fetchFn: deps.fetchFn, getApiKey: deps.getApiKey, getModel: deps.getModel },
    );
  }

  const apiKey = resolveApiKey(deps.getApiKey);
  const model = resolveModel(deps.getModel);

  await assertCanSpend(ctx, estimated);

  const webSearchTool: Record<string, unknown> = { type: 'web_search' };
  if (input.allowedDomain) {
    webSearchTool.filters = { allowed_domains: [input.allowedDomain] };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GROK_TIMEOUT_MS);

  try {
    const res = await (deps.fetchFn ?? fetch)(XAI_RESPONSES_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: input.temperature ?? 0.1,
        input: [{ role: 'user', content: input.prompt }],
        tools: [webSearchTool],
      }),
    });

    const bodyText = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(bodyText);
    } catch {
      throw new GrokResearchError('Grok API returned non-JSON body', res.status);
    }

    if (!res.ok) {
      const errMsg =
        typeof data === 'object' &&
        data != null &&
        'error' in data &&
        typeof (data as { error?: unknown }).error === 'object' &&
        (data as { error?: { message?: string } }).error?.message
          ? String((data as { error: { message: string } }).error.message)
          : bodyText.slice(0, 400);
      throw new GrokResearchError(`Grok API error: ${errMsg}`, res.status, data);
    }

    const text = extractGrokResponseText(data);
    await recordGrokSpend(ctx, estimated);
    return text;
  } catch (err) {
    if (err instanceof GrokResearchError || err instanceof GrokParseError) {
      throw err;
    }
    if (err instanceof Error && err.name === 'AbortError') {
      throw new GrokResearchError('Grok API request timed out', 408, err);
    }
    logger.warn('Grok API call failed', { operation: ctx?.operation, error: String(err) });
    throw new GrokResearchError('Grok API request failed', undefined, err);
  } finally {
    clearTimeout(timeout);
  }
}

function buildListingsPrompt(req: GrokResearchRequest): string {
  return `Search the ${req.platform} marketplace (${req.platformBaseUrl}) for the top ${req.limit} best-selling products in the "${req.category}" category right now.

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
  "sellerName": string
}

Return a JSON array only. No explanation. No markdown.
Sort by salesCount descending.
Use real product URLs on ${req.platformBaseUrl}.`;
}

function buildReviewsPrompt(req: GrokReviewsRequest): string {
  const title = req.listingTitle ? ` titled "${req.listingTitle}"` : '';
  const limit = req.limit ?? 10;
  return `Find up to ${limit} recent buyer review texts for this ${req.platform} product${title}:
${req.listingUrl}

Return a JSON array of review strings only (full review text, not summaries). No explanation. No markdown.`;
}

export async function researchPlatformListings(
  platformKey: MarketHunterPlatformKey,
  req: GrokResearchRequest,
  ctx?: GrokCallContext,
  deps: GrokClientDeps = {},
): Promise<MarketplaceListing[]> {
  const prompt = buildListingsPrompt(req);
  const estimates = getCostEstimates();
  const callCtx: GrokCallContext = {
    ...ctx,
    operation: ctx?.operation ?? `grok_listings_${platformKey}_${req.category}`,
    estimatedCostUsd: ctx?.estimatedCostUsd ?? estimates.researchListingCallUsd,
  };

  const text = await callGrok(
    { prompt, allowedDomain: req.allowedDomain, temperature: 0.1, costKind: 'listing' },
    callCtx,
    deps,
  );

  let parsed: unknown;
  try {
    parsed = parseGrokJsonContent(text);
  } catch (err) {
    throw new GrokResearchError(
      err instanceof GrokParseError ? err.message : 'Failed to parse Grok listings JSON',
      undefined,
      err,
    );
  }

  let rawListings;
  try {
    rawListings = validateGrokListingsPayload(parsed);
  } catch (err) {
    throw new GrokResearchError(
      err instanceof GrokParseError ? err.message : 'Invalid Grok listings payload',
      undefined,
      err,
    );
  }

  return rawListings
    .slice(0, req.limit)
    .map((raw) => normalizeGrokListing(raw, platformKey, req.category));
}

export async function researchListingReviews(
  req: GrokReviewsRequest,
  ctx?: GrokCallContext,
  deps: GrokClientDeps = {},
): Promise<string[]> {
  const prompt = buildReviewsPrompt(req);
  const estimates = getCostEstimates();
  const callCtx: GrokCallContext = {
    ...ctx,
    operation: ctx?.operation ?? 'grok_reviews',
    estimatedCostUsd: ctx?.estimatedCostUsd ?? estimates.researchReviewsCallUsd,
  };

  const text = await callGrok({ prompt, temperature: 0.2, costKind: 'reviews' }, callCtx, deps);

  let parsed: unknown;
  try {
    parsed = parseGrokJsonContent(text);
  } catch (err) {
    throw new GrokResearchError(
      err instanceof GrokParseError ? err.message : 'Failed to parse Grok reviews JSON',
      undefined,
      err,
    );
  }

  try {
    return validateGrokReviewTexts(parsed);
  } catch (err) {
    throw new GrokResearchError(
      err instanceof GrokParseError ? err.message : 'Invalid Grok reviews payload',
      undefined,
      err,
    );
  }
}
