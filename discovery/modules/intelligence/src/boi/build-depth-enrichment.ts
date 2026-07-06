import { detectTechStack } from '../crawl/tech-stack-detect';
import type { BusinessIntelligenceProfile } from '../bi/types';
import { buildSentimentSummary } from './build-sentiment-summary';
import { estimateProjectValue } from './estimate-project-value';
import type {
  BoIPageSpeedSnapshot,
  BoIProjectValueEstimate,
  BoISentimentSummary,
  BoITechStack,
} from './types';
import type { BoIDigitalGap } from './types';

export type BoIDepthEnrichment = {
  sentimentSummary: BoISentimentSummary | null;
  techStack: BoITechStack | null;
  projectValue: BoIProjectValueEstimate | null;
  pageSpeed: BoIPageSpeedSnapshot | null;
};

/**
 * Chunk 9 depth modules — sentiment, tech stack, project value bands, optional PageSpeed.
 */
export function buildDepthEnrichment(input: {
  profile: BusinessIntelligenceProfile;
  digitalGaps: BoIDigitalGap[];
  pageSpeed?: BoIPageSpeedSnapshot | null;
}): BoIDepthEnrichment {
  return {
    sentimentSummary: buildSentimentSummary(input.profile),
    techStack: detectTechStack(input.profile),
    projectValue: estimateProjectValue(input.profile, input.digitalGaps),
    pageSpeed: input.pageSpeed ?? null,
  };
}
