import { BudgetGovernor } from '@agency/acquisition';
import { logger } from '@agency/config';
import { platformSettings } from '@agency/settings';
import type { BusinessIntelligenceProfile } from '../bi/types';
import type { BoIOpportunityIntelligence, BoISalesBrief } from './types';

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
const NARRATIVE_TIMEOUT_MS = 25_000;
const MAX_SUMMARY_CHARS = 900;

export type LlmNarrativeContext = {
  profile: BusinessIntelligenceProfile;
  boi: BoIOpportunityIntelligence;
  runId?: string;
  accountId?: string;
  boiNarrativeRequested: boolean;
};

export type LlmNarrativeDeps = {
  fetchFn?: typeof fetch;
  canSpend?: (units?: number) => Promise<boolean>;
  recordSpend?: (input: {
    runId?: string;
    accountId?: string;
  }) => Promise<void>;
};

type OpenAiNarrativeJson = {
  executiveSummary?: unknown;
  evidenceIds?: unknown;
};

export function validateLlmNarrativePatch(
  patch: OpenAiNarrativeJson,
  validEvidenceIds: Set<string>,
): { executiveSummary: string; evidenceIds: string[] } | null {
  const summary =
    typeof patch.executiveSummary === 'string' ? patch.executiveSummary.trim() : '';
  if (!summary || summary.length > MAX_SUMMARY_CHARS) return null;

  if (!Array.isArray(patch.evidenceIds)) return null;

  const evidenceIds: string[] = [];
  for (const raw of patch.evidenceIds) {
    if (typeof raw !== 'string') return null;
    const id = raw.trim();
    if (!id || !validEvidenceIds.has(id)) return null;
    if (!evidenceIds.includes(id)) evidenceIds.push(id);
    if (evidenceIds.length >= 8) break;
  }

  if (evidenceIds.length === 0) return null;

  return { executiveSummary: summary, evidenceIds };
}

function buildNarrativePrompt(
  profile: BusinessIntelligenceProfile,
  boi: BoIOpportunityIntelligence,
): string {
  const brief = boi.salesBrief;
  const evidenceCatalog = boi.evidence.map((e) => ({
    id: e.id,
    label: e.label,
    excerpt: e.excerpt ?? null,
    source: e.source,
  }));

  return JSON.stringify(
    {
      business: {
        name: profile.identity.name,
        city: profile.identity.city,
        industry: profile.identity.industry,
      },
      rulesSummary: brief?.executiveSummary ?? null,
      pitchAngle: brief?.pitchAngle ?? null,
      opportunityType: brief?.opportunityType ?? null,
      recommendedServices: brief?.recommendedServices ?? [],
      pains: boi.pains.slice(0, 6).map((p) => ({ id: p.id, label: p.label })),
      digitalGaps: boi.digitalGaps.slice(0, 6).map((g) => ({
        id: g.id,
        label: g.label,
        severity: g.severity,
      })),
      purchaseReadiness: boi.purchaseReadiness,
      evidenceCatalog,
      instructions: [
        'Write a concise 2-3 sentence executive summary for a web agency sales brief.',
        'Ground every claim in the supplied evidence catalog only.',
        'Return JSON with executiveSummary (string) and evidenceIds (array of ids from evidenceCatalog).',
        'Do not invent facts, metrics, or evidence ids.',
      ],
    },
    null,
    0,
  );
}

async function callOpenAiForBoiNarrative(
  input: {
    apiKey: string;
    model: string;
    prompt: string;
    validEvidenceIds: Set<string>;
  },
  fetchFn: typeof fetch,
): Promise<{ executiveSummary: string; evidenceIds: string[] } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NARRATIVE_TIMEOUT_MS);

  try {
    const res = await fetchFn(OPENAI_CHAT_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: input.model,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You produce evidence-grounded B2B sales briefs for web agencies. Respond with valid JSON only.',
          },
          {
            role: 'user',
            content: input.prompt,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.warn('OpenAI BOI narrative request failed', {
        status: res.status,
        err: errText.slice(0, 300),
      });
      return null;
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    let parsed: OpenAiNarrativeJson;
    try {
      parsed = JSON.parse(content) as OpenAiNarrativeJson;
    } catch {
      logger.warn('OpenAI BOI narrative returned non-JSON content');
      return null;
    }

    return validateLlmNarrativePatch(parsed, input.validEvidenceIds);
  } catch (err) {
    logger.warn('OpenAI BOI narrative call failed', { error: String(err) });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function mergeLlmIntoSalesBrief(
  salesBrief: BoISalesBrief | null,
  patch: { executiveSummary: string; evidenceIds: string[] },
): BoISalesBrief {
  return {
    executiveSummary: patch.executiveSummary,
    narrativeSource: 'llm',
    pitchAngle: salesBrief?.pitchAngle ?? null,
    recommendedServices: salesBrief?.recommendedServices ?? [],
    topPainIds: salesBrief?.topPainIds,
    gapIds: salesBrief?.gapIds,
    evidenceIds: patch.evidenceIds,
    opportunityType: salesBrief?.opportunityType ?? null,
  };
}

/**
 * Optionally replace rules executive summary with an LLM narrative when enabled,
 * credentialed, budgeted, and requested on the discovery run.
 */
export async function maybeEnhanceBoiNarrative(
  input: LlmNarrativeContext,
  deps: LlmNarrativeDeps = {},
): Promise<BoIOpportunityIntelligence> {
  if (!input.boiNarrativeRequested || !input.boi.salesBrief) {
    return input.boi;
  }

  await platformSettings.ensureLoaded();
  const settings = platformSettings.getSync();
  if (!settings.boi.llmNarrativeEnabled) {
    return input.boi;
  }

  const apiKey = platformSettings.getCredential('openai_api_key');
  if (!apiKey) {
    return input.boi;
  }

  const canSpend =
    deps.canSpend ??
    (async (units = 1) => {
      const governor = new BudgetGovernor();
      return governor.canSpend('llm_narrative', units);
    });

  if (!(await canSpend(1))) {
    logger.warn('BOI LLM narrative skipped — daily budget exhausted', {
      runId: input.runId,
      businessId: input.profile.businessId,
    });
    return input.boi;
  }

  const validEvidenceIds = new Set(input.boi.evidence.map((e) => e.id));
  const patch = await callOpenAiForBoiNarrative(
    {
      apiKey,
      model: settings.boi.llmModel,
      prompt: buildNarrativePrompt(input.profile, input.boi),
      validEvidenceIds,
    },
    deps.fetchFn ?? fetch,
  );

  if (!patch) {
    return input.boi;
  }

  const recordSpend =
    deps.recordSpend ??
    (async (spendInput) => {
      const governor = new BudgetGovernor();
      await governor.recordSpend({
        provider: 'llm_narrative',
        operation: 'boi_executive_summary',
        units: 1,
        runId: spendInput.runId,
        accountId: spendInput.accountId,
      });
    });

  await recordSpend({ runId: input.runId, accountId: input.accountId });

  return {
    ...input.boi,
    salesBrief: mergeLlmIntoSalesBrief(input.boi.salesBrief, patch),
  };
}
