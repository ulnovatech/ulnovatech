import { classifySearchResult, isKeepableSearchResult, isLocalDirectoryHost } from '../providers/search-result-classifier';
import {
  extractBusinessNameFromDirectoryTitle,
  extractDirectoryCandidate,
  parseSearchResultItem,
} from '../providers/parse-search-results';
import { buildSocialSearchQueries } from '../lib/build-social-search-queries';
import { buildPublicSearchQueries } from '../lib/build-public-search-queries';
import { getSearchPagesPerQuery } from '../lib/run-profile';

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

const params = { country: 'Uganda', city: 'Kampala', industry: 'Restaurant' };

// Classifier — drop directories and articles
const yelp = classifySearchResult(
  'https://www.yelp.com/search?find_desc=restaurants&find_loc=Kampala',
  'Best Restaurants in Kampala',
);
assert(yelp.kind === 'directory', 'yelp search classified as directory');
assert(!isKeepableSearchResult(yelp), 'directory not keepable');

const listicle = classifySearchResult(
  'https://example.com/top-10-restaurants-kampala',
  'Top 10 Restaurants in Kampala',
);
assert(listicle.kind === 'directory', 'listicle path classified as directory');

const wiki = classifySearchResult('https://en.wikipedia.org/wiki/Restaurant', 'Restaurant - Wikipedia');
assert(wiki.kind === 'blocked', 'wikipedia blocked');

const article = classifySearchResult(
  'https://medium.com/@user/how-to-open-a-restaurant',
  'How to open a restaurant',
  'blog post about restaurants',
);
assert(article.kind === 'article', 'medium blog classified as article');

// Social profiles
const tiktok = classifySearchResult(
  'https://www.tiktok.com/@kampalaeats',
  'Kampala Eats on TikTok',
);
assert(tiktok.kind === 'social_profile' && tiktok.platform === 'tiktok', 'tiktok profile detected');

const linkedin = classifySearchResult(
  'https://www.linkedin.com/company/kampala-eats',
  'Kampala Eats | LinkedIn',
);
assert(linkedin.kind === 'social_profile' && linkedin.platform === 'linkedin', 'linkedin company detected');

const linkedinPersonal = classifySearchResult(
  'https://www.linkedin.com/in/johndoe',
  'John Doe | LinkedIn',
);
assert(linkedinPersonal.kind === 'business_page' || linkedinPersonal.kind === 'article', 'linkedin /in/ not social company');

// Parser
const facebook = parseSearchResultItem(
  {
    title: "Joe's Kitchen - Kampala | Facebook",
    link: 'https://www.facebook.com/joeskitchen',
    snippet: 'Local restaurant',
  },
  params,
  'site:facebook.com Restaurant Kampala',
);
assert(facebook?.facebookUrl?.includes('facebook.com') === true, 'facebook parsed');
assert(facebook?.metadata?.resultKind === 'social_profile', 'facebook result kind');

const tiktokParsed = parseSearchResultItem(
  {
    title: 'Kampala Eats (@kampalaeats) | TikTok',
    link: 'https://www.tiktok.com/@kampalaeats',
    snippet: 'Local food',
  },
  params,
  'site:tiktok.com Restaurant Kampala',
);
assert(tiktokParsed?.metadata?.tiktokUrl?.includes('tiktok.com') === true, 'tiktok url in metadata');
assert(tiktokParsed?.metadata?.primaryPlatform === 'tiktok', 'tiktok primary platform');

const droppedYelp = parseSearchResultItem(
  {
    title: 'THE 10 BEST Restaurants in Kampala',
    link: 'https://www.yelp.com/search?find_desc=Restaurants&find_loc=Kampala',
  },
  params,
  'q',
);
assert(droppedYelp === null, 'yelp listing dropped');

const yelpBiz = parseSearchResultItem(
  {
    title: "Joe's Kitchen - Kampala | Yelp",
    link: 'https://www.yelp.com/biz/joes-kitchen-kampala',
    snippet: 'Salon in Kampala · Phone +256 700 123456',
  },
  params,
  'q',
);
assert(yelpBiz?.name.includes('Joe') === true, 'yelp single biz page extracted');
assert(yelpBiz?.metadata?.extractedFromDirectory === true, 'yelp biz marked directory extract');
assert(yelpBiz?.metadata?.resultKind === 'directory', 'yelp biz result kind directory');

const ugListing = parseSearchResultItem(
  {
    title: 'Glow Beauty Spa - Kampala | Yellow Pages Uganda',
    link: 'https://www.yellowpages.ug/places/glow-beauty-spa-kampala-12345',
    snippet: 'Visit https://glowbeauty.co.ug for appointments',
  },
  params,
  'Salon Kampala',
);
assert(ugListing?.name.toLowerCase().includes('glow') === true, 'uganda yellow pages listing kept');
assert(isLocalDirectoryHost('www.yellowpages.ug'), 'yellowpages.ug is local directory host');
assert(ugListing?.website?.includes('glowbeauty.co.ug') === true, 'website pulled from snippet');

const brabys = parseSearchResultItem(
  {
    title: 'Serenity Salon & Spa, Sandton',
    link: 'https://www.brabys.com/business/serenity-salon-spa-sandton-123456',
    snippet: 'Hair and beauty salon',
  },
  { country: 'South Africa', city: 'Sandton', industry: 'Salon & Spa' },
  'q',
);
assert(brabys?.name.toLowerCase().includes('serenity') === true, 'brabys single listing extracted');

const listicleDropped = parseSearchResultItem(
  {
    title: 'Top 10 Salons in Kampala',
    link: 'https://www.yellowpages.ug/top-10-salons-kampala',
  },
  params,
  'q',
);
assert(listicleDropped === null, 'directory listicle still dropped');

assert(
  extractBusinessNameFromDirectoryTitle('Glow Spa - Kampala | Yellow Pages Uganda', 'yellowpages.ug') ===
    'Glow Spa',
  'directory title cleaned',
);

const businessSite = parseSearchResultItem(
  {
    title: 'Joe Kitchen — Official Site',
    link: 'https://joekitchen.co.ug',
    snippet: 'Welcome to Joe Kitchen',
  },
  params,
  'Restaurant Kampala',
);
assert(businessSite?.website === 'https://joekitchen.co.ug', 'business website kept');
assert(businessSite?.metadata?.resultKind === 'business_page', 'business page kind');

// Query builders
const social = buildSocialSearchQueries(params, 5);
assert(social.some((q) => q.includes('site:tiktok.com')), 'social queries include tiktok');
assert(social.some((q) => q.includes('linkedin.com/company')), 'social queries include linkedin');
assert(!social.some((q) => q.includes('facebook.com')), 'social queries exclude facebook');

const combined = buildPublicSearchQueries(params, 15);
assert(combined.some((q) => q.includes('site:facebook.com')), 'public search includes prospect facebook queries');
assert(combined.some((q) => q.includes('Restaurant')), 'public search still has industry queries');

assert(getSearchPagesPerQuery('standard') === 2, 'standard gets 2 search pages per query');
assert(getSearchPagesPerQuery('boost') === 3, 'boost gets 3 search pages per query');
assert(getSearchPagesPerQuery('economy') === 1, 'economy gets 1 search page per query');

if (failed > 0) {
  console.error(`\n${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`\n${passed} passed`);
