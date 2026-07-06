import fs from 'fs';
import path from 'path';
import { config as loadDotenv } from 'dotenv';

let loaded = false;

function findMonorepoRoot(start = process.cwd()): string {
  let dir = path.resolve(start);
  for (let depth = 0; depth < 12; depth++) {
    if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return dir;
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { name?: string };
        if (pkg.name === 'demand-capture-agency-platform') return dir;
      } catch {
        // ignore malformed package.json
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(start);
}

/** Load the single root `.env` once (does not override variables already set in the process). */
export function loadRootEnv(): void {
  if (loaded) return;
  loaded = true;
  const envPath = path.join(findMonorepoRoot(), '.env');
  if (fs.existsSync(envPath)) {
    loadDotenv({ path: envPath, override: false });
  }
}

export function getMonorepoRoot(): string {
  return findMonorepoRoot();
}
