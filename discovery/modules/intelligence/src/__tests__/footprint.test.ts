import {
  extractSocialUrlsFromHtml,
  isLinkInBioHost,
  isLinkInBioUrl,
} from '../crawl/extract-social-links';
import { parseLinkInBioHtml } from '../bi/link-in-bio';
import { buildRelationshipGraph, graphSummary } from '../bi/build-relationship-graph';
import { buildBusinessIntelligenceProfile } from '../bi/build-profile';

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

const html = `
<html><body>
<a href="https://instagram.com/acme">IG</a>
<a href="https://tiktok.com/@acme">TikTok</a>
<a href="https://linktr.ee/acme">Bio</a>
<a href="https://acme.test">Site</a>
</body></html>`;

const extracted = extractSocialUrlsFromHtml(html, 'https://example.com');
assert(extracted.socialUrls.length === 2, 'extracts instagram and tiktok');
assert(extracted.linkInBioUrls.length === 1, 'detects link-in-bio url');
assert(isLinkInBioHost('linktr.ee'), 'linktr host recognized');
assert(isLinkInBioUrl('https://bio.link/acme'), 'bio.link url recognized');

const libHtml = `
<a href="https://facebook.com/frombio">FB</a>
<a href="https://acme-co.example">Website</a>`;
const libParsed = parseLinkInBioHtml(libHtml, 'https://linktr.ee/acme');
assert(libParsed.socialUrls.length === 1, 'parses link-in-bio outbound social');
assert(libParsed.websiteUrl === 'https://acme-co.example', 'parses link-in-bio website');

const profile = buildBusinessIntelligenceProfile({
  account: { id: 'acc-1', canonicalName: 'Acme', website: 'https://acme.test' },
  business: {
    id: 'biz-1',
    name: 'Acme',
    source: 'google_maps',
    facebookUrl: 'https://facebook.com/acme',
  },
  analysis: { hasWebsite: true },
  footprint: {
    socialLinks: [
      {
        platform: 'facebook',
        url: 'https://facebook.com/acme',
        discoveredVia: 'business',
      },
    ],
    linkInBioPages: [
      {
        url: 'https://linktr.ee/acme',
        resolvedAt: new Date().toISOString(),
        outboundLinks: [
          {
            platform: 'instagram',
            url: 'https://instagram.com/acme',
            discoveredVia: 'link_in_bio',
          },
        ],
        fetchStatus: 'ok',
      },
    ],
    relationshipGraph: { nodes: [], edges: [] },
  },
});

const graph = buildRelationshipGraph({
  profile,
  linkInBioPages: profile.digitalFootprint.linkInBioPages,
});
const summary = graphSummary(graph);
assert(summary.nodeCount >= 3, 'graph has business website and social nodes');
assert(summary.linkInBioCount === 1, 'graph includes link-in-bio node');
assert(graph.edges.some((e) => e.relation === 'resolves_to'), 'graph has resolves_to edges');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
