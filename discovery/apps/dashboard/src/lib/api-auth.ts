import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

/**
 * Defense-in-depth auth for API route handlers.
 *
 * Call at the top of POST/PATCH/DELETE handlers (and sensitive GETs with PII):
 *
 * ```ts
 * const operator = await requireOperator();
 * if (operator instanceof NextResponse) return operator;
 * ```
 *
 * Middleware already blocks unauthenticated access when Clerk is configured;
 * this ensures mutators return 401 even if middleware is bypassed in dev.
 *
 * Exceptions: `/api/health`, `/api/auth/status`, cron poll routes (`CRON_SECRET`).
 */
export async function requireOperator(): Promise<string | NextResponse> {
  try {
    return await requireAuth();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
