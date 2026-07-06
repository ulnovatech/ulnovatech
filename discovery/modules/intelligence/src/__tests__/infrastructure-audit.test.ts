import {
  auditInfrastructureHtml,
  deriveOpportunityFlags,
  mergeInfrastructureAudits,
} from '../crawl/infrastructure-audit';

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

const calendlyHtml = '<a href="https://calendly.com/acme">Book</a>';
const calendlyAudit = auditInfrastructureHtml(calendlyHtml);
assert(calendlyAudit.flags.hasOnlineBooking, 'detects calendly booking');
assert(calendlyAudit.booking[0]?.vendor === 'calendly', 'calendly vendor id');

const shopifyHtml = '<script src="https://cdn.shopify.com/s/files/1/theme.js"></script>';
const shopAudit = auditInfrastructureHtml(shopifyHtml);
assert(shopAudit.flags.hasEcommerce, 'detects shopify ecommerce');

const mailchimpHtml =
  '<form action="https://list-manage.com/subscribe"><input type="email" name="EMAIL"></form>';
const emailAudit = auditInfrastructureHtml(mailchimpHtml);
assert(emailAudit.flags.hasEmailCapture, 'detects mailchimp');

const genericNewsletterHtml =
  '<h2>Subscribe to our newsletter</h2><input type="email" placeholder="Email">';
assert(
  auditInfrastructureHtml(genericNewsletterHtml).flags.hasEmailCapture,
  'detects generic newsletter form',
);

const analyticsHtml =
  '<script async src="https://www.googletagmanager.com/gtag/js?id=G-ABCDEF12"></script>';
const analyticsAudit = auditInfrastructureHtml(analyticsHtml);
assert(analyticsAudit.flags.hasAnalytics, 'detects google analytics');

const merged = mergeInfrastructureAudits([calendlyAudit, shopAudit, analyticsAudit]);
assert(
  merged.flags.hasOnlineBooking && merged.flags.hasEcommerce && merged.flags.hasAnalytics,
  'merges audits across pages',
);

const opportunities = deriveOpportunityFlags(
  { hasOnlineBooking: false, hasEcommerce: false, hasEmailCapture: false, hasAnalytics: false },
  { crawled: true, crawlStatus: 'ok', hasWebsite: true },
);
assert(opportunities.includes('missing_analytics'), 'flags missing analytics opportunity');
assert(opportunities.includes('missing_email_capture'), 'flags missing email capture');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
