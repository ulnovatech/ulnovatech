import { buildBusinessIntelligenceProfile } from '../bi/build-profile';
import {
  maybeEnhanceBoiNarrative,
  validateLlmNarrativePatch,
} from '../boi/llm-narrative';
import { synthesizeOpportunityIntelligence } from '../boi/synthesize-opportunity-intelligence';
import { platformSettings } from '@agency/settings';

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) {
    passed++;
    console.log(`ok ${name}`);
  } else {
    failed++;
    console.error(`fail ${name}`);
  }
}

function socialOnlyProfile() {
  return buildBusinessIntelligenceProfile({
    account: {
      id: 'acc-llm',
      canonicalName: 'Glow Salon',
      city: 'Kampala',
      country: 'Uganda',
      industry: 'salon',
      phone: '+256 700 000001',
      facebookUrl: 'https://facebook.com/glowsalon',
      crawlStatus: 'no_website',
    },
    business: {
      id: 'biz-llm',
      name: 'Glow Salon',
      source: 'google_maps',
      city: 'Kampala',
      country: 'Uganda',
      industry: 'salon',
      metadata: {
        reviews: [{ text: 'Hard to book online.', rating: 3 }],
      },
    },
    analysis: { hasWebsite: false },
  });
}

const profile = socialOnlyProfile();
const rulesBoi = synthesizeOpportunityIntelligence({ profile });

assert(rulesBoi.salesBrief?.narrativeSource === 'rules', 'baseline synthesis is rules-first');

async function runAsyncTests() {
  const unchanged = await maybeEnhanceBoiNarrative({
    profile,
    boi: rulesBoi,
    boiNarrativeRequested: false,
  });
  assert(
    unchanged.salesBrief?.narrativeSource === 'rules',
    'LLM skipped when run toggle off',
  );

  const validIds = new Set(rulesBoi.evidence.map((e) => e.id));
  const firstId = rulesBoi.evidence[0]?.id;
  assert(!!firstId, 'fixture has evidence ids');

  const validPatch = validateLlmNarrativePatch(
    {
      executiveSummary: 'Glow Salon lacks online booking despite active social presence.',
      evidenceIds: [firstId!],
    },
    validIds,
  );
  assert(validPatch != null, 'valid LLM patch accepted');

  const invalidPatch = validateLlmNarrativePatch(
    {
      executiveSummary: 'Invented claim without grounding.',
      evidenceIds: ['evidence-does-not-exist'],
    },
    validIds,
  );
  assert(invalidPatch === null, 'invalid evidence ids rejected');

  const originalGetCredential = platformSettings.getCredential.bind(platformSettings);
  const originalGetSync = platformSettings.getSync.bind(platformSettings);

  platformSettings.getCredential = ((key: string) => {
    if (key === 'openai_api_key') return 'test-openai-key';
    return originalGetCredential(key as never);
  }) as typeof platformSettings.getCredential;

  platformSettings.getSync = (() => {
    const snap = originalGetSync();
    return {
      ...snap,
      boi: {
        ...snap.boi,
        llmNarrativeEnabled: true,
        llmModel: 'gpt-4o-mini',
      },
    };
  }) as typeof platformSettings.getSync;

  const mockSummary =
    'Glow Salon shows strong social traction but no website — a high-fit greenfield web opportunity.';
  const mockFetch: typeof fetch = async () =>
    ({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                executiveSummary: mockSummary,
                evidenceIds: [firstId],
              }),
            },
          },
        ],
      }),
    }) as Response;

  let spendRecorded = false;
  const enhanced = await maybeEnhanceBoiNarrative(
    {
      profile,
      boi: rulesBoi,
      boiNarrativeRequested: true,
      runId: 'run-llm-test',
      accountId: profile.accountId,
    },
    {
      fetchFn: mockFetch,
      canSpend: async () => true,
      recordSpend: async () => {
        spendRecorded = true;
      },
    },
  );

  assert(enhanced.salesBrief?.narrativeSource === 'llm', 'mock LLM success sets narrativeSource llm');
  assert(enhanced.salesBrief?.executiveSummary === mockSummary, 'mock LLM summary applied');
  assert(
    enhanced.salesBrief?.evidenceIds?.every((id) => validIds.has(id)) ?? false,
    'LLM evidence ids stay within registry',
  );
  assert(spendRecorded, 'LLM spend recorded on success');

  const rejected = await maybeEnhanceBoiNarrative(
    {
      profile,
      boi: rulesBoi,
      boiNarrativeRequested: true,
    },
    {
      fetchFn: async () =>
        ({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    executiveSummary: 'Bad grounding.',
                    evidenceIds: ['bogus-id'],
                  }),
                },
              },
            ],
          }),
        }) as Response,
      canSpend: async () => true,
      recordSpend: async () => {
        throw new Error('should not record spend when patch invalid');
      },
    },
  );
  assert(
    rejected.salesBrief?.narrativeSource === 'rules',
    'invalid LLM output keeps rules fallback',
  );

  platformSettings.getCredential = originalGetCredential;
  platformSettings.getSync = originalGetSync;
}

runAsyncTests()
  .then(() => {
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
