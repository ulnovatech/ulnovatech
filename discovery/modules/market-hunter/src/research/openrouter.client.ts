import { logger } from '@agency/config';
import { platformSettings } from '@agency/settings';
import type { MarketHunterSpendGuard } from '../budget.guard';
import type { MhSpendProvider } from '../types';
import {
  getComplaintsModel,
  getCostEstimates,
  getResearchModel,
  resolveComplaintsApiKey,
  resolveResearchApiKey,
} from './llm.config';

const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_TIMEOUT_MS = 90_000;

export class OpenRouterError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

export type OpenRouterCallContext = {
  scanId?: string;
  spendGuard?: MarketHunterSpendGuard;
  operation: string;
  estimatedCostUsd?: number;
  spendProvider?: MhSpendProvider;
};

export type OpenRouterClientDeps = {
  fetchFn?: typeof fetch;
  getApiKey?: () => string | undefined;
  getModel?: () => string;
};

function extractOpenRouterText(data: unknown): string {
  if (typeof data !== 'object' || data == null) {
    throw new OpenRouterError('OpenRouter response is not an object');
  }
  const choices = (data as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new OpenRouterError('OpenRouter response missing choices');
  }
  const message = (choices[0] as { message?: { content?: unknown } })?.message;
  const content = message?.content;
  if (typeof content === 'string' && content.trim()) return content;
  if (Array.isArray(content)) {
    const text = content
      .map((part) => {
        if (typeof part === 'object' && part != null && 'text' in part) {
          return String((part as { text?: unknown }).text ?? '');
        }
        return '';
      })
      .join('')
      .trim();
    if (text) return text;
  }
  throw new OpenRouterError('OpenRouter response missing message content');
}

async function assertCanSpend(
  ctx: OpenRouterCallContext | undefined,
  estimatedCostUsd: number,
): Promise<void> {
  if (!ctx?.spendGuard) return;
  const ok = await ctx.spendGuard.canSpend(estimatedCostUsd);
  if (!ok) {
    throw new OpenRouterError(
      `Market Hunter scan budget exhausted before OpenRouter ${ctx.operation}`,
    );
  }
}

async function recordOpenRouterSpend(
  ctx: OpenRouterCallContext | undefined,
  actualCostUsd: number,
): Promise<void> {
  if (!ctx?.spendGuard) return;
  await ctx.spendGuard.recordSpend({
    provider: ctx.spendProvider ?? 'openrouter',
    operation: ctx.operation,
    costUsd: actualCostUsd,
  });
}

export async function callOpenRouterChat(
  input: {
    prompt: string;
    system?: string;
    temperature?: number;
    mode: 'research' | 'complaints';
  },
  ctx?: OpenRouterCallContext,
  deps: OpenRouterClientDeps = {},
): Promise<string> {
  await platformSettings.ensureLoaded();

  const apiKey =
    deps.getApiKey?.() ??
    (input.mode === 'research' ? resolveResearchApiKey() : resolveComplaintsApiKey());
  if (!apiKey) {
    throw new OpenRouterError('OpenRouter API key is not configured');
  }

  const model =
    deps.getModel?.() ?? (input.mode === 'research' ? getResearchModel() : getComplaintsModel());
  const estimates = getCostEstimates();
  const estimated =
    ctx?.estimatedCostUsd ??
    (input.mode === 'research'
      ? estimates.researchListingCallUsd
      : estimates.complaintAnalysisCallUsd);

  await assertCanSpend(ctx, estimated);

  const messages: Array<{ role: string; content: string }> = [];
  if (input.system?.trim()) {
    messages.push({ role: 'system', content: input.system.trim() });
  }
  messages.push({ role: 'user', content: input.prompt });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);

  try {
    const res = await (deps.fetchFn ?? fetch)(OPENROUTER_CHAT_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lead-discover.local',
        'X-Title': 'Live Market Hunter',
      },
      body: JSON.stringify({
        model,
        temperature: input.temperature ?? 0.1,
        messages,
      }),
    });

    const bodyText = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(bodyText);
    } catch {
      throw new OpenRouterError('OpenRouter API returned non-JSON body', res.status);
    }

    if (!res.ok) {
      const errMsg =
        typeof data === 'object' &&
        data != null &&
        'error' in data &&
        typeof (data as { error?: { message?: string } }).error?.message === 'string'
          ? (data as { error: { message: string } }).error.message
          : bodyText.slice(0, 400);
      throw new OpenRouterError(`OpenRouter API error: ${errMsg}`, res.status, data);
    }

    const text = extractOpenRouterText(data);
    await recordOpenRouterSpend(ctx, estimated);
    return text;
  } catch (err) {
    if (err instanceof OpenRouterError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new OpenRouterError('OpenRouter API request timed out', 408, err);
    }
    logger.warn('OpenRouter API call failed', { operation: ctx?.operation, error: String(err) });
    throw new OpenRouterError('OpenRouter API request failed', undefined, err);
  } finally {
    clearTimeout(timeout);
  }
}
