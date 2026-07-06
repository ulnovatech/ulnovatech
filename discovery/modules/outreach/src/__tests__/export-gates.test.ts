import {
  DEFAULT_EXPORT_STATUSES,
  hasContactPath,
  resolveExportStatuses,
} from '../export-gates';

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

assert(
  resolveExportStatuses(false).join(',') === DEFAULT_EXPORT_STATUSES.join(','),
  'default export excludes NEW',
);
assert(resolveExportStatuses(true).includes('NEW'), 'includeUnreviewed adds NEW');
assert(!resolveExportStatuses(false).includes('NEW'), 'default export has no NEW');

assert(hasContactPath('a@b.com', null) === true, 'email counts as contact');
assert(hasContactPath(null, '+1555') === true, 'phone counts as contact');
assert(hasContactPath('  ', '  ') === false, 'blank contact blocked');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
