import { parseRssXml } from '../parse-rss';

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

const rss = `<?xml version="1.0"?>
<rss><channel>
<item><title>Need web designer</title><link>https://example.com/post/1</link><description>Looking for help</description></item>
</channel></rss>`;

const items = parseRssXml(rss);
assert(items.length === 1, 'parses rss item');
assert(items[0].title === 'Need web designer', 'rss title');
assert(items[0].link.includes('example.com'), 'rss link');

const atom = `<feed xmlns="http://www.w3.org/2005/Atom">
<entry><title>Hiring developer</title><link href="https://jobs.test/2"/><summary>Remote role</summary></entry>
</feed>`;

const atomItems = parseRssXml(atom);
assert(atomItems.length === 1, 'parses atom entry');
assert(atomItems[0].link === 'https://jobs.test/2', 'atom link href');

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
