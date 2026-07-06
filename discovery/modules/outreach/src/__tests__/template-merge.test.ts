import { buildMergeContext, mergeTemplate } from '../template-merge';

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

const ctx = buildMergeContext({
  businessName: "Joe's Pizza Kampala",
  canonicalName: "Joe's Pizza",
  city: 'Kampala',
  website: 'https://joes.example',
  email: 'joe@example.com',
  phone: '+256700',
  googleMapsUrl: 'https://maps.google.com/joes',
});

assert(ctx.name === "Joe's", 'name is first token of business');
assert(ctx.business === "Joe's Pizza", 'business uses canonical name');

const body = mergeTemplate(
  'Hi {{name}}, I saw {{business}} in {{city}}. Site: {{website}}',
  ctx,
);
assert(body.includes("Hi Joe's,"), 'substitutes name');
assert(body.includes("Joe's Pizza in Kampala"), 'substitutes business and city');
assert(body.includes('https://joes.example'), 'substitutes website');

const subject = mergeTemplate('Quick idea for {{business}}', ctx);
assert(subject === "Quick idea for Joe's Pizza", 'substitutes subject');

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
