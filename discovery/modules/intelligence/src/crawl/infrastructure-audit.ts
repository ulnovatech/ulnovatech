import type {
  InfrastructureAudit,
  InfrastructureCategory,
  InfrastructureConfidence,
  InfrastructureSignal,
} from '../bi/types';

export type {
  InfrastructureAudit,
  InfrastructureCategory,
  InfrastructureConfidence,
  InfrastructureSignal,
  InfrastructureFlags,
} from '../bi/types';

type VendorPattern = {
  vendor: string;
  pattern: RegExp;
  confidence: InfrastructureConfidence;
  evidence: string;
};

const BOOKING_PATTERNS: VendorPattern[] = [
  { vendor: 'calendly', pattern: /calendly\.com/i, confidence: 'high', evidence: 'Calendly embed or link' },
  { vendor: 'acuity', pattern: /acuityscheduling\.com/i, confidence: 'high', evidence: 'Acuity Scheduling' },
  { vendor: 'booksy', pattern: /booksy\.com/i, confidence: 'high', evidence: 'Booksy booking' },
  { vendor: 'square_appointments', pattern: /squareup\.com\/appointments|square\.site/i, confidence: 'high', evidence: 'Square appointments' },
  { vendor: 'setmore', pattern: /setmore\.com/i, confidence: 'high', evidence: 'Setmore booking' },
  { vendor: 'fresha', pattern: /fresha\.com/i, confidence: 'high', evidence: 'Fresha booking' },
  { vendor: 'mindbody', pattern: /mindbodyonline\.com|mindbody\.io/i, confidence: 'high', evidence: 'Mindbody booking' },
  { vendor: 'simplybook', pattern: /simplybook\.(me|it)/i, confidence: 'high', evidence: 'SimplyBook' },
  { vendor: 'vagaro', pattern: /vagaro\.com/i, confidence: 'high', evidence: 'Vagaro booking' },
  { vendor: 'schedulicity', pattern: /schedulicity\.com/i, confidence: 'medium', evidence: 'Schedulicity booking' },
];

const ECOMMERCE_PATTERNS: VendorPattern[] = [
  { vendor: 'shopify', pattern: /cdn\.shopify\.com|myshopify\.com|shopify\.com\/shop/i, confidence: 'high', evidence: 'Shopify storefront' },
  { vendor: 'woocommerce', pattern: /woocommerce|wp-content\/plugins\/woocommerce/i, confidence: 'high', evidence: 'WooCommerce' },
  { vendor: 'bigcommerce', pattern: /bigcommerce\.com/i, confidence: 'high', evidence: 'BigCommerce' },
  { vendor: 'square_store', pattern: /square\.site|squareup\.com\/store/i, confidence: 'medium', evidence: 'Square Online store' },
  { vendor: 'ecwid', pattern: /ecwid\.com|x-ecwid/i, confidence: 'high', evidence: 'Ecwid cart' },
  { vendor: 'snipcart', pattern: /snipcart\.com/i, confidence: 'high', evidence: 'Snipcart' },
  { vendor: 'shop_pay', pattern: /shop\.app|shopify-buy/i, confidence: 'medium', evidence: 'Shop Pay / buy button' },
];

const EMAIL_CAPTURE_PATTERNS: VendorPattern[] = [
  { vendor: 'mailchimp', pattern: /list-manage\.com|mailchimp\.com/i, confidence: 'high', evidence: 'Mailchimp signup' },
  { vendor: 'klaviyo', pattern: /klaviyo\.com|static\.klaviyo\.com/i, confidence: 'high', evidence: 'Klaviyo forms' },
  { vendor: 'constant_contact', pattern: /constantcontact\.com/i, confidence: 'high', evidence: 'Constant Contact' },
  { vendor: 'convertkit', pattern: /convertkit\.com|ck\.page/i, confidence: 'high', evidence: 'ConvertKit' },
  { vendor: 'hubspot_forms', pattern: /hsforms\.com|hbspt\.forms|hubspot\.com/i, confidence: 'high', evidence: 'HubSpot forms' },
  { vendor: 'mailerlite', pattern: /mailerlite\.com/i, confidence: 'high', evidence: 'MailerLite' },
];

const ANALYTICS_PATTERNS: VendorPattern[] = [
  { vendor: 'google_analytics', pattern: /google-analytics\.com|googletagmanager\.com|gtag\(|G-[A-Z0-9]{6,}|UA-\d+-\d+/i, confidence: 'high', evidence: 'Google Analytics / GTM' },
  { vendor: 'meta_pixel', pattern: /connect\.facebook\.net\/.*fbevents|fbq\(/i, confidence: 'high', evidence: 'Meta Pixel' },
  { vendor: 'hotjar', pattern: /hotjar\.com|static\.hotjar\.com/i, confidence: 'high', evidence: 'Hotjar' },
  { vendor: 'microsoft_clarity', pattern: /clarity\.ms/i, confidence: 'high', evidence: 'Microsoft Clarity' },
  { vendor: 'plausible', pattern: /plausible\.io/i, confidence: 'medium', evidence: 'Plausible Analytics' },
  { vendor: 'segment', pattern: /cdn\.segment\.com|analytics\.js/i, confidence: 'medium', evidence: 'Segment' },
  { vendor: 'mixpanel', pattern: /mixpanel\.com/i, confidence: 'medium', evidence: 'Mixpanel' },
];

function matchPatterns(
  category: InfrastructureCategory,
  html: string,
  patterns: VendorPattern[],
): InfrastructureSignal[] {
  const hits: InfrastructureSignal[] = [];
  const seen = new Set<string>();

  for (const item of patterns) {
    if (!item.pattern.test(html)) continue;
    const key = `${category}:${item.vendor}`;
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push({
      category,
      vendor: item.vendor,
      evidence: item.evidence,
      confidence: item.confidence,
    });
  }

  return hits;
}

function detectGenericEmailCapture(html: string): InfrastructureSignal[] {
  const lower = html.toLowerCase();
  const hasEmailInput = /<input[^>]+type=["']email["']/i.test(html);
  const newsletterCue =
    /newsletter|subscribe|sign\s*up|join\s*our\s*list|get\s*updates|mailing\s*list/i.test(lower);

  if (!hasEmailInput || !newsletterCue) return [];

  return [
    {
      category: 'email_capture',
      vendor: 'html_email_form',
      evidence: 'Email input with newsletter/subscribe cues',
      confidence: 'medium',
    },
  ];
}

function dedupeSignals(signals: InfrastructureSignal[]): InfrastructureSignal[] {
  const seen = new Set<string>();
  const out: InfrastructureSignal[] = [];
  for (const signal of signals) {
    const key = `${signal.category}:${signal.vendor}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(signal);
  }
  return out;
}

export function emptyInfrastructureAudit(): InfrastructureAudit {
  return {
    booking: [],
    ecommerce: [],
    emailCapture: [],
    analytics: [],
    flags: {
      hasOnlineBooking: false,
      hasEcommerce: false,
      hasEmailCapture: false,
      hasAnalytics: false,
    },
    opportunityFlags: [],
  };
}

export function deriveInfrastructureFlags(
  audit: Pick<InfrastructureAudit, 'booking' | 'ecommerce' | 'emailCapture' | 'analytics'>,
): InfrastructureAudit['flags'] {
  return {
    hasOnlineBooking: audit.booking.length > 0,
    hasEcommerce: audit.ecommerce.length > 0,
    hasEmailCapture: audit.emailCapture.length > 0,
    hasAnalytics: audit.analytics.length > 0,
  };
}

export function deriveOpportunityFlags(
  flags: InfrastructureAudit['flags'],
  context: { crawled: boolean; crawlStatus?: string | null; hasWebsite: boolean },
): string[] {
  const opportunities: string[] = [];

  if (!context.hasWebsite) {
    opportunities.push('no_website');
    return opportunities;
  }

  if (context.crawlStatus === 'blocked') {
    opportunities.push('crawl_blocked');
    return opportunities;
  }

  if (context.crawlStatus === 'unreachable') {
    opportunities.push('website_unreachable');
    return opportunities;
  }

  if (!context.crawled) return opportunities;

  if (!flags.hasAnalytics) opportunities.push('missing_analytics');
  if (!flags.hasEmailCapture) opportunities.push('missing_email_capture');
  if (!flags.hasOnlineBooking) opportunities.push('missing_online_booking');
  if (!flags.hasEcommerce) opportunities.push('missing_ecommerce');

  return opportunities;
}

export function auditInfrastructureHtml(html: string, _pageUrl?: string): InfrastructureAudit {
  const booking = matchPatterns('booking', html, BOOKING_PATTERNS);
  const ecommerce = matchPatterns('ecommerce', html, ECOMMERCE_PATTERNS);
  const emailCapture = [
    ...matchPatterns('email_capture', html, EMAIL_CAPTURE_PATTERNS),
    ...detectGenericEmailCapture(html),
  ];
  const analytics = matchPatterns('analytics', html, ANALYTICS_PATTERNS);

  const partial = {
    booking: dedupeSignals(booking),
    ecommerce: dedupeSignals(ecommerce),
    emailCapture: dedupeSignals(emailCapture),
    analytics: dedupeSignals(analytics),
  };

  const flags = deriveInfrastructureFlags(partial);
  return {
    ...partial,
    flags,
    opportunityFlags: deriveOpportunityFlags(flags, { crawled: true, hasWebsite: true }),
  };
}

export function mergeInfrastructureAudits(audits: InfrastructureAudit[]): InfrastructureAudit {
  if (audits.length === 0) return emptyInfrastructureAudit();

  const booking = dedupeSignals(audits.flatMap((a) => a.booking));
  const ecommerce = dedupeSignals(audits.flatMap((a) => a.ecommerce));
  const emailCapture = dedupeSignals(audits.flatMap((a) => a.emailCapture));
  const analytics = dedupeSignals(audits.flatMap((a) => a.analytics));

  const partial = { booking, ecommerce, emailCapture, analytics };
  const flags = deriveInfrastructureFlags(partial);

  return {
    ...partial,
    flags,
    opportunityFlags: deriveOpportunityFlags(flags, { crawled: true, hasWebsite: true }),
  };
}

export function finalizeInfrastructureAudit(
  audit: InfrastructureAudit,
  context: { crawled: boolean; crawlStatus?: string | null; hasWebsite: boolean },
): InfrastructureAudit {
  return {
    ...audit,
    opportunityFlags: deriveOpportunityFlags(audit.flags, context),
  };
}
