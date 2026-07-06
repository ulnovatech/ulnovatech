import { isInlineHunterEnabled } from '@/lib/hunter-worker';

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

const prevInlineHunter = process.env.INLINE_HUNTER;
const prevInlinePipeline = process.env.INLINE_PIPELINE;

process.env.INLINE_HUNTER = 'true';
assert(isInlineHunterEnabled('development'), 'inline hunter when INLINE_HUNTER=true in dev');

process.env.INLINE_HUNTER = 'false';
process.env.INLINE_PIPELINE = 'true';
assert(isInlineHunterEnabled('development'), 'inline hunter when INLINE_PIPELINE=true in dev');

assert(!isInlineHunterEnabled('production'), 'inline hunter disabled in production');

if (prevInlineHunter === undefined) delete process.env.INLINE_HUNTER;
else process.env.INLINE_HUNTER = prevInlineHunter;
if (prevInlinePipeline === undefined) delete process.env.INLINE_PIPELINE;
else process.env.INLINE_PIPELINE = prevInlinePipeline;

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
