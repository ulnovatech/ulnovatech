import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseClaudeJsonContent,
  validateComplaintAnalysis,
} from '../research/claude.parser';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(
  readFileSync(join(here, 'fixtures', 'claude-complaints.json'), 'utf8'),
);

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

const wrapped = `\`\`\`json\n${JSON.stringify(fixture)}\n\`\`\``;
const parsed = parseClaudeJsonContent(wrapped);
const analysis = validateComplaintAnalysis(parsed);

assert(analysis.topComplaints.length === 2, 'two complaint signals');
assert(analysis.buildableFixes.length === 2, 'two buildable fixes');
assert(analysis.estimatedFixTimeDays === 10, 'estimatedFixTimeDays parsed');
assert(analysis.confidenceScore === 78, 'confidenceScore parsed');

try {
  validateComplaintAnalysis({ topComplaints: [], buildableFixes: [] });
  assert(false, 'incomplete object should throw');
} catch {
  assert(true, 'incomplete object throws');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
