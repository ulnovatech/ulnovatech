import type { BusinessIntelligenceProfile, InfrastructureSignal } from '../bi/types';
import type { BoITechStack, BoITechStackItem } from '../boi/types';

type CmsPattern = {
  vendor: string;
  label: string;
  confidence: BoITechStackItem['confidence'];
  match: RegExp;
};

const CMS_PATTERNS: CmsPattern[] = [
  {
    vendor: 'wordpress',
    label: 'WordPress',
    confidence: 'high',
    match: /wp-content|wp-includes|wordpress/i,
  },
  {
    vendor: 'wix',
    label: 'Wix',
    confidence: 'high',
    match: /wix\.com|wixsite\.com|static\.wixstatic\.com/i,
  },
  {
    vendor: 'squarespace',
    label: 'Squarespace',
    confidence: 'high',
    match: /squarespace\.com|static1\.squarespace/i,
  },
  {
    vendor: 'webflow',
    label: 'Webflow',
    confidence: 'high',
    match: /webflow\.com|assets\.website-files\.com/i,
  },
  {
    vendor: 'shopify',
    label: 'Shopify (storefront)',
    confidence: 'high',
    match: /cdn\.shopify\.com|myshopify\.com/i,
  },
  {
    vendor: 'weebly',
    label: 'Weebly',
    confidence: 'medium',
    match: /weebly\.com/i,
  },
  {
    vendor: 'joomla',
    label: 'Joomla',
    confidence: 'medium',
    match: /\/media\/jui\/|joomla/i,
  },
  {
    vendor: 'drupal',
    label: 'Drupal',
    confidence: 'medium',
    match: /drupal|sites\/default\/files/i,
  },
  {
    vendor: 'ghost',
    label: 'Ghost',
    confidence: 'medium',
    match: /ghost\.io|\/ghost\//i,
  },
];

const VENDOR_LABELS: Record<string, string> = {
  calendly: 'Calendly',
  acuity: 'Acuity Scheduling',
  booksy: 'Booksy',
  square_appointments: 'Square Appointments',
  setmore: 'Setmore',
  fresha: 'Fresha',
  mindbody: 'Mindbody',
  shopify: 'Shopify',
  woocommerce: 'WooCommerce',
  bigcommerce: 'BigCommerce',
  mailchimp: 'Mailchimp',
  klaviyo: 'Klaviyo',
  hubspot_forms: 'HubSpot Forms',
  google_analytics: 'Google Analytics',
  meta_pixel: 'Meta Pixel',
  hotjar: 'Hotjar',
  microsoft_clarity: 'Microsoft Clarity',
  html_email_form: 'HTML email capture form',
};

function infrastructureToTechItems(
  signals: InfrastructureSignal[],
  category: BoITechStackItem['category'],
): BoITechStackItem[] {
  return signals.map((signal) => ({
    category,
    vendor: signal.vendor,
    label: VENDOR_LABELS[signal.vendor] ?? signal.evidence,
    confidence: signal.confidence,
  }));
}

function detectCmsFromCorpus(corpus: string): BoITechStackItem[] {
  const hits: BoITechStackItem[] = [];
  const seen = new Set<string>();

  for (const pattern of CMS_PATTERNS) {
    if (!pattern.match.test(corpus)) continue;
    if (seen.has(pattern.vendor)) continue;
    seen.add(pattern.vendor);
    hits.push({
      category: 'cms',
      vendor: pattern.vendor,
      label: pattern.label,
      confidence: pattern.confidence,
    });
  }

  return hits;
}

function buildDetectionCorpus(profile: BusinessIntelligenceProfile): string {
  const parts: string[] = [];
  if (profile.websiteIntel.title) parts.push(profile.websiteIntel.title);
  if (profile.websiteIntel.metaDescription) parts.push(profile.websiteIntel.metaDescription);
  if (profile.contact.website) parts.push(profile.contact.website);
  for (const url of profile.websiteIntel.pageUrls ?? []) {
    parts.push(url);
  }
  return parts.join('\n');
}

/**
 * Surface detected website technologies from crawl infrastructure audit and URL/HTML cues.
 */
export function detectTechStack(profile: BusinessIntelligenceProfile): BoITechStack | null {
  const infra = profile.infrastructure;
  const items: BoITechStackItem[] = [];
  const seen = new Set<string>();

  const push = (item: BoITechStackItem) => {
    const key = `${item.category}:${item.vendor}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push(item);
  };

  for (const item of infrastructureToTechItems(infra.booking, 'booking')) push(item);
  for (const item of infrastructureToTechItems(infra.ecommerce, 'ecommerce')) push(item);
  for (const item of infrastructureToTechItems(infra.emailCapture, 'email_capture')) push(item);
  for (const item of infrastructureToTechItems(infra.analytics, 'analytics')) push(item);

  const crawled =
    profile.websiteIntel.crawlStatus === 'ok' ||
    (profile.websiteIntel.pagesFetched ?? 0) > 0 ||
    (profile.websiteIntel.pageUrls?.length ?? 0) > 0;

  if (crawled) {
    for (const cms of detectCmsFromCorpus(buildDetectionCorpus(profile))) {
      push(cms);
    }
  }

  if (items.length === 0) return null;

  return {
    detected: items,
    source: crawled ? 'website_crawl' : 'bi_profile',
  };
}
