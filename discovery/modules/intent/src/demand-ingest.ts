import { logger } from '@agency/config';
import { matchBusinessForDemand } from './demand-match';
import { IntentRepository } from './repository';
import type { PasteDemandInput } from './types';

const DEFAULT_STRENGTH: Record<string, number> = {
  help_request: 85,
  public_request: 80,
  hiring: 75,
  job_post: 72,
  pain_signal: 65,
  other: 60,
};

export class DemandIngestService {
  private repo = new IntentRepository();

  async ingestPaste(input: PasteDemandInput) {
    const sourceUrl = input.sourceUrl.trim();
    if (!sourceUrl) throw new Error('sourceUrl is required');

    const businessId = await matchBusinessForDemand({
      sourceUrl,
      title: input.title,
      city: input.city,
      country: input.country,
      businessId: input.businessId,
    });

    const strength = input.signalStrength ?? DEFAULT_STRENGTH[input.signalType] ?? 70;

    const result = await this.repo.createDemandUnique({
      businessId: businessId ?? undefined,
      source: 'paste_inbox',
      signalType: input.signalType,
      signalStrength: strength,
      title: input.title.trim(),
      snippet: input.snippet?.trim(),
      sourceUrl,
    });

    logger.info('Demand paste ingested', {
      sourceUrl,
      created: result.created,
      businessId: businessId ?? null,
    });

    return {
      ...result,
      matchedBusinessId: businessId,
    };
  }
}
