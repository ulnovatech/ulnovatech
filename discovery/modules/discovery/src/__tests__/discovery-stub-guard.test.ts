import fs from 'fs';
import path from 'path';

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

const srcRoot = path.join(process.cwd(), 'src');
const plannedPath = path.join(srcRoot, 'providers', 'planned.ts');

assert(!fs.existsSync(plannedPath), 'planned.ts stub removed');

function walkTsFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkTsFiles(full));
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) files.push(full);
  }
  return files;
}

const forbidden = ['not implemented yet', 'PlannedProvider', 'PLANNED_PROVIDERS'];
for (const file of walkTsFiles(srcRoot)) {
  const text = fs.readFileSync(file, 'utf-8');
  for (const phrase of forbidden) {
    assert(!text.includes(phrase), `${path.relative(srcRoot, file)} has no "${phrase}"`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`\n${passed} passed`);
