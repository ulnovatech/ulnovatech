import type { BiCompleteness, BusinessIntelligenceProfile } from './types';

type CompletenessField = {
  key: string;
  weight: number;
  filled: (profile: BusinessIntelligenceProfile) => boolean;
};

const FIELDS: CompletenessField[] = [
  { key: 'identity.name', weight: 10, filled: (p) => !!p.identity.name?.trim() },
  { key: 'identity.industry', weight: 10, filled: (p) => !!p.identity.industry?.trim() },
  { key: 'identity.city', weight: 5, filled: (p) => !!p.identity.city?.trim() },
  { key: 'identity.country', weight: 5, filled: (p) => !!p.identity.country?.trim() },
  { key: 'contact.email', weight: 15, filled: (p) => !!p.contact.email?.trim() },
  { key: 'contact.phone', weight: 15, filled: (p) => !!p.contact.phone?.trim() },
  { key: 'contact.website', weight: 10, filled: (p) => !!p.contact.website?.trim() },
  {
    key: 'presence.websiteAnalysis',
    weight: 5,
    filled: (p) => p.presence.hasWebsite === false || p.presence.mobileFriendly != null,
  },
  {
    key: 'presence.mobileFriendly',
    weight: 5,
    filled: (p) => p.presence.mobileFriendly === true,
  },
  {
    key: 'presence.googleMapsUrl',
    weight: 5,
    filled: (p) => !!p.presence.googleMapsUrl?.trim(),
  },
  {
    key: 'digitalFootprint.socialLinks',
    weight: 10,
    filled: (p) => p.digitalFootprint.socialLinks.length > 0,
  },
  {
    key: 'websiteIntel.titleOrMeta',
    weight: 10,
    filled: (p) =>
      !!p.websiteIntel.title?.trim() || !!p.websiteIntel.metaDescription?.trim(),
  },
  {
    key: 'businessSignals.reviewSnippets',
    weight: 5,
    filled: (p) => p.businessSignals.reviewSnippets.length > 0,
  },
  {
    key: 'websiteIntel.crawlStatus',
    weight: 5,
    filled: (p) => !!p.websiteIntel.crawlStatus?.trim(),
  },
];

export function computeBiCompleteness(
  profile: Omit<BusinessIntelligenceProfile, 'completeness'>,
): BiCompleteness {
  let score = 0;
  const filledFields: string[] = [];
  const missingFields: string[] = [];

  for (const field of FIELDS) {
    if (field.filled(profile as BusinessIntelligenceProfile)) {
      score += field.weight;
      filledFields.push(field.key);
    } else {
      missingFields.push(field.key);
    }
  }

  return {
    score: Math.min(100, score),
    filledFields,
    missingFields,
  };
}
