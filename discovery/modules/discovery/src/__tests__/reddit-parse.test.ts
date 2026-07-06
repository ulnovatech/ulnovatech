import { parseRedditListing } from '../providers/custom/reddit-intent-provider';

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

const sample = {
  data: {
    children: [
      {
        data: {
          title: 'Need a website for my restaurant',
          selftext: 'Looking for a developer in Kampala',
          permalink: '/r/forhire/comments/abc123/need_site/',
        },
      },
    ],
  },
};

const items = parseRedditListing(sample);
assert(items.length === 1, 'parses one post');
assert(items[0].sourceUrl.includes('reddit.com/r/forhire'), 'builds canonical source_url');
assert(items[0].signalType === 'help_request', 'infers help_request');
assert(items[0].title.includes('website'), 'keeps title');

const dupe = parseRedditListing({ data: { children: [{ data: { title: 'x', permalink: '/r/a/b' } }] } });
assert(dupe[0].sourceUrl === 'https://www.reddit.com/r/a/b', 'prefixes reddit host');

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
