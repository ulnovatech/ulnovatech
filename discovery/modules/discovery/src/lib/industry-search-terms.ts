/** Negative keywords appended to prospect/general web queries to reduce noise. */
export const SEARCH_NEGATIVE_KEYWORDS = '-jobs -vacancy -course -training -wikipedia';

/**
 * Alternate search phrasing per platform industry label.
 * Keys match {@link DEFAULT_INDUSTRIES} in @agency/settings — extend when industries change.
 */
export const INDUSTRY_SEARCH_TERMS: Record<string, string[]> = {
  Accounting: ['accountant', 'accounting firm', 'bookkeeping', 'tax preparation', 'CPA firm'],
  Automotive: ['auto repair', 'car dealership', 'auto shop', 'mechanic', 'garage'],
  Construction: ['contractor', 'building company', 'construction company', 'home builder'],
  Dental: ['dentist', 'dental clinic', 'dental practice', 'orthodontist'],
  'E-commerce': ['online store', 'ecommerce shop', 'online retailer', 'web store'],
  Education: ['school', 'training center', 'tutoring', 'academy', 'college'],
  'Fitness & Gym': ['gym', 'fitness center', 'personal trainer', 'crossfit', 'yoga studio'],
  Healthcare: ['clinic', 'medical practice', 'doctor', 'health center', 'hospital'],
  Hospitality: ['hotel', 'guest house', 'lodging', 'boutique hotel', 'resort'],
  Legal: ['law firm', 'attorney', 'lawyer', 'legal practice', 'solicitor'],
  'Marketing Agency': ['marketing agency', 'digital agency', 'advertising agency', 'SEO agency'],
  'Non-profit': ['nonprofit', 'charity', 'NGO', 'community organization'],
  'Real Estate': ['real estate agency', 'realtor', 'property agent', 'estate agent'],
  Restaurant: ['restaurant', 'cafe', 'dining', 'eatery', 'bistro'],
  Retail: ['retail store', 'shop', 'boutique', 'storefront', 'retailer'],
  'Salon & Spa': ['hair salon', 'beauty salon', 'nail salon', 'spa', 'barbershop'],
  Technology: ['IT company', 'software company', 'tech startup', 'computer repair'],
  Travel: ['travel agency', 'tour operator', 'travel company', 'tours'],
  Veterinary: ['veterinarian', 'vet clinic', 'animal hospital', 'pet clinic'],
  'Web Development': ['web design', 'web developer', 'website design', 'digital studio'],
};

const MAX_SYNONYM_TERMS = 4;

/**
 * Returns the primary industry label plus up to `maxTerms - 1` synonym phrases.
 * Unknown industries return only the trimmed label.
 */
export function expandIndustryTerms(industry: string, maxTerms = 2): string[] {
  const primary = industry.trim();
  if (!primary) return [];

  const cap = Math.max(1, Math.min(maxTerms, MAX_SYNONYM_TERMS));
  const synonyms = INDUSTRY_SEARCH_TERMS[primary] ?? [];
  const seen = new Set<string>();
  const terms: string[] = [];

  const add = (term: string) => {
    const key = term.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    terms.push(term.trim());
  };

  add(primary);
  for (const synonym of synonyms) {
    if (terms.length >= cap) break;
    add(synonym);
  }

  return terms;
}

/** Lookup synonyms without the primary label (for tests / UI). */
export function industrySynonymsFor(industry: string): string[] {
  return [...(INDUSTRY_SEARCH_TERMS[industry.trim()] ?? [])];
}
