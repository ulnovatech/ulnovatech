import type { BoIDigitalGap, BoISolution, BoISolutionBenefit, BoIStructuredPain } from './types';

type SolutionRule = {
  id: string;
  service: string;
  matchPainIds: string[];
  matchGapIds: string[];
  benefits: BoISolutionBenefit[];
};

const SOLUTION_RULES: SolutionRule[] = [
  {
    id: 'solution:corporate_website',
    service: 'Corporate Website',
    matchPainIds: ['pain:no_web_presence', 'pain:review:no_website', 'pain:review:online_presence'],
    matchGapIds: ['no_website', 'social_only', 'link_in_bio_only'],
    benefits: [
      { label: 'Owned web presence beyond social platforms' },
      { label: 'SEO discoverability for local search' },
      { label: 'Professional credibility for first-time visitors' },
    ],
  },
  {
    id: 'solution:whatsapp_integration',
    service: 'WhatsApp Business Integration',
    matchPainIds: ['pain:review:contact'],
    matchGapIds: ['social_only'],
    benefits: [
      { label: 'Direct booking and inquiry path from social traffic' },
      { label: 'Faster response loop for mobile-first customers' },
    ],
  },
  {
    id: 'solution:online_booking',
    service: 'Online Booking System',
    matchPainIds: ['pain:review:hard_to_book', 'pain:booking_gap'],
    matchGapIds: ['missing_online_booking'],
    benefits: [
      { label: 'Self-serve appointment scheduling' },
      { label: 'Fewer missed bookings from phone-only flow' },
    ],
  },
  {
    id: 'solution:lead_capture',
    service: 'Lead Capture & Newsletter Forms',
    matchPainIds: ['pain:lead_capture_gap'],
    matchGapIds: ['missing_email_capture'],
    benefits: [
      { label: 'Build an owned audience list' },
      { label: 'Follow-up campaigns for repeat visits' },
    ],
  },
  {
    id: 'solution:analytics',
    service: 'Analytics & Conversion Tracking',
    matchPainIds: ['pain:measurement_gap'],
    matchGapIds: ['missing_analytics'],
    benefits: [
      { label: 'Measure marketing ROI' },
      { label: 'Identify high-intent pages and drop-off points' },
    ],
  },
  {
    id: 'solution:ecommerce',
    service: 'E-commerce Setup',
    matchPainIds: ['pain:commerce_gap'],
    matchGapIds: ['missing_ecommerce'],
    benefits: [
      { label: 'Sell products or vouchers online' },
      { label: 'Extend revenue beyond walk-in traffic' },
    ],
  },
  {
    id: 'solution:mobile_redesign',
    service: 'Mobile-Responsive Redesign',
    matchPainIds: ['pain:review:outdated', 'pain:website_quality'],
    matchGapIds: ['not_mobile_friendly'],
    benefits: [
      { label: 'Better mobile conversion rates' },
      { label: 'Modern layout aligned with current brand' },
    ],
  },
  {
    id: 'solution:https_modernize',
    service: 'HTTPS & Site Security Upgrade',
    matchPainIds: ['pain:website_quality'],
    matchGapIds: ['no_https', 'website_unreachable', 'crawl_blocked'],
    benefits: [
      { label: 'Browser trust indicators for visitors' },
      { label: 'SEO and security baseline compliance' },
    ],
  },
  {
    id: 'solution:local_seo',
    service: 'Local SEO & Google Maps Optimization',
    matchPainIds: ['pain:review:cant_find'],
    matchGapIds: [],
    benefits: [
      { label: 'Easier discovery in local search' },
      { label: 'Stronger maps-to-website conversion path' },
    ],
  },
];

/**
 * Maps structured pains and digital gaps to recommended agency services.
 */
export function mapPainsToSolutions(input: {
  pains: BoIStructuredPain[];
  digitalGaps: BoIDigitalGap[];
}): BoISolution[] {
  const gapIds = new Set(input.digitalGaps.map((g) => g.id));
  const solutions: BoISolution[] = [];

  for (const rule of SOLUTION_RULES) {
    const matchedPainIds = input.pains
      .filter((p) => rule.matchPainIds.includes(p.id))
      .map((p) => p.id);
    const matchedGapIds = rule.matchGapIds.filter((g) => gapIds.has(g));

    if (matchedPainIds.length === 0 && matchedGapIds.length === 0) continue;

    const painIds = [
      ...matchedPainIds,
      ...matchedGapIds.map((g) => `gap:${g}`),
    ];

    solutions.push({
      id: rule.id,
      service: rule.service,
      painIds: [...new Set(painIds)],
      benefits: rule.benefits,
    });
  }

  return solutions;
}
