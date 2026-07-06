import { logger } from '@agency/config';
import { platformSettings } from '@agency/settings';
import type { MarketHunterSpendGuard } from '../budget.guard';
import {
  getComplaintsModel,
  getComplaintsProvider,
  getCostEstimates,
} from './llm.config';
import { callOpenRouterChat } from './openrouter.client';
import type { ComplaintAnalysis } from '../scoring/types';
import {
  ClaudeParseError,
  extractClaudeResponseText,
  parseClaudeJsonContent,
  validateComplaintAnalysis,
} from './claude.parser';

const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_TIMEOUT_MS = 60_000;

export class ClaudeExtractionError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ClaudeExtractionError';
  }
}

export type ClaudeExtractionContext = {
  scanId?: string;
  spendGuard?: MarketHunterSpendGuard;
  operation?: string;
};

export type ClaudeClientDeps = {
  fetchFn?: typeof fetch;
  getApiKey?: () => string | undefined;
  getModel?: () => string;
};

function resolveApiKey(getApiKey?: () => string | undefined): string {
  const fromFn = getApiKey?.();
  if (fromFn) return fromFn;
  const fromSettings = platformSettings.getCredential('anthropic_api_key');
  if (fromSettings) return fromSettings;
  throw new ClaudeExtractionError('Anthropic API key is not configured');
}

function resolveModel(getModel?: () => string): string {
  return getModel?.() ?? getComplaintsModel();
}

function buildComplaintPrompt(productTitle: string, reviews: string[]): string {
  return `Product: "${productTitle}"
Reviews: ${JSON.stringify(reviews)}

Return this exact JSON only (no markdown, no explanation):
{
  "topComplaints": [
    {
      "complaint": "specific complaint text",
      "frequency": number_of_reviews_mentioning_this,
      "isTechnical": true,
      "fixDifficulty": "LOW"
    }
  ],
  "buildableFixes": ["fix 1", "fix 2"],
  "estimatedFixTimeDays": number,
  "confidenceScore": 0
}

Rules:
- Only include complaints mentioned by 3+ reviewers when frequency data supports it.
- Only include buildableFixes a solo developer can implement.
- confidenceScore is 0-100.`;
}

export async function extractComplaints(
  productTitle: string,
  reviews: string[],
  ctx: ClaudeExtractionContext = {},
  deps: ClaudeClientDeps = {},
): Promise<ComplaintAnalysis> {
  if (!reviews.length) {
    throw new ClaudeExtractionError('extractComplaints requires at least one review string');
  }

  await platformSettings.ensureLoaded();
  const estimates = getCostEstimates();
  const estimated = estimates.complaintAnalysisCallUsd;
  const operation = ctx.operation ?? `claude_complaints_${productTitle.slice(0, 40)}`;

  if (getComplaintsProvider() === 'openrouter') {
    if (ctx.spendGuard) {
      const ok = await ctx.spendGuard.canSpend(estimated);
      if (!ok) {
        throw new ClaudeExtractionError(
          'Market Hunter scan budget exhausted before complaint extraction',
        );
      }
    }

    const text = await callOpenRouterChat(
      {
        prompt: buildComplaintPrompt(productTitle, reviews),
        system:
          'You are a product gap analyst. Extract actionable complaint signals from product reviews. Return ONLY valid JSON.',
        temperature: 0.1,
        mode: 'complaints',
      },
      {
        ...ctx,
        operation,
        estimatedCostUsd: estimated,
        spendProvider: 'openrouter',
      },
      deps,
    );

    let parsed: unknown;
    try {
      parsed = parseClaudeJsonContent(text);
    } catch (err) {
      throw new ClaudeExtractionError(
        err instanceof ClaudeParseError ? err.message : 'Failed to parse complaint JSON',
        undefined,
        err,
      );
    }

    try {
      return validateComplaintAnalysis(parsed);
    } catch (err) {
      throw new ClaudeExtractionError(
        err instanceof ClaudeParseError ? err.message : 'Invalid complaint analysis payload',
        undefined,
        err,
      );
    }
  }

  const apiKey = resolveApiKey(deps.getApiKey);
  const model = resolveModel(deps.getModel);

  if (ctx.spendGuard) {
    const ok = await ctx.spendGuard.canSpend(estimated);
    if (!ok) {
      throw new ClaudeExtractionError('Market Hunter scan budget exhausted before Claude extraction');
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CLAUDE_TIMEOUT_MS);

  try {
    const res = await (deps.fetchFn ?? fetch)(ANTHROPIC_MESSAGES_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1200,
        temperature: 0.1,
        system:
          'You are a product gap analyst. Extract actionable complaint signals from product reviews. Return ONLY valid JSON.',
        messages: [
          {
            role: 'user',
            content: buildComplaintPrompt(productTitle, reviews),
          },
        ],
      }),
    });

    const bodyText = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(bodyText);
    } catch {
      throw new ClaudeExtractionError('Claude API returned non-JSON body', res.status);
    }

    if (!res.ok) {
      const errMsg =
        typeof data === 'object' &&
        data != null &&
        'error' in data &&
        typeof (data as { error?: { message?: string } }).error?.message === 'string'
          ? (data as { error: { message: string } }).error.message
          : bodyText.slice(0, 400);
      throw new ClaudeExtractionError(`Claude API error: ${errMsg}`, res.status, data);
    }

    const text = extractClaudeResponseText(data);
    let parsed: unknown;
    try {
      parsed = parseClaudeJsonContent(text);
    } catch (err) {
      throw new ClaudeExtractionError(
        err instanceof ClaudeParseError ? err.message : 'Failed to parse Claude JSON',
        undefined,
        err,
      );
    }

    let analysis: ComplaintAnalysis;
    try {
      analysis = validateComplaintAnalysis(parsed);
    } catch (err) {
      throw new ClaudeExtractionError(
        err instanceof ClaudeParseError ? err.message : 'Invalid complaint analysis payload',
        undefined,
        err,
      );
    }

    if (ctx.spendGuard) {
      await ctx.spendGuard.recordSpend({
        provider: 'anthropic',
        operation,
        costUsd: estimated,
      });
    }

    return analysis;
  } catch (err) {
    if (err instanceof ClaudeExtractionError || err instanceof ClaudeParseError) {
      throw err;
    }
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ClaudeExtractionError('Claude API request timed out', 408, err);
    }
    logger.warn('Claude complaint extraction failed', {
      scanId: ctx.scanId,
      productTitle,
      error: String(err),
    });
    throw new ClaudeExtractionError('Claude API request failed', undefined, err);
  } finally {
    clearTimeout(timeout);
  }
}
