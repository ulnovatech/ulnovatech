import { loadRootEnv } from '@agency/config/load-env';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let client: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sql: ReturnType<typeof postgres> | null = null;

function poolMax(): number {
  const raw = process.env.DATABASE_POOL_MAX?.trim();
  const n = raw ? parseInt(raw, 10) : 5;
  return Number.isFinite(n) && n > 0 ? Math.min(n, 20) : 5;
}

export function getDb() {
  if (!client) {
    loadRootEnv();
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is required');
    sql = postgres(url, {
      max: poolMax(),
      idle_timeout: 20,
      max_lifetime: 60 * 10,
    });
    client = drizzle(sql, { schema });
  }
  return client;
}

export async function pingDb(): Promise<boolean> {
  try {
    if (!sql) getDb();
    if (!sql) return false;
    await sql`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function closeDb() {
  if (sql) {
    await sql.end();
    sql = null;
    client = null;
  }
}
