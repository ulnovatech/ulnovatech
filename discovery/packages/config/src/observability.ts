/// <reference path="./sentry-shim.d.ts" />
import { logger } from './logger';

type SentryLike = {
  init: (opts: { dsn: string; environment?: string; tracesSampleRate?: number }) => void;
  captureException: (error: unknown, context?: { extra?: Record<string, unknown> }) => void;
};

let sentryReady = false;

/** Eager Sentry init for Next.js instrumentation and worker startup. */
export async function initObservability(): Promise<void> {
  await ensureSentry();
}

async function ensureSentry(): Promise<SentryLike | null> {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return null;

  try {
    const mod = (await import(/* webpackIgnore: true */ '@sentry/node')) as SentryLike;
    if (!sentryReady) {
      mod.init({
        dsn,
        environment: process.env.NODE_ENV ?? 'development',
        tracesSampleRate: 0.1,
      });
      sentryReady = true;
    }
    return mod;
  } catch {
    return null;
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  logger.error('Exception captured', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
  });

  void ensureSentry().then((sentry) => {
    if (!sentry) return;
    const tags: Record<string, string> = {};
    if (context?.runId != null) tags.runId = String(context.runId);
    if (context?.stage != null) tags.stage = String(context.stage);
    if (context?.jobId != null) tags.jobId = String(context.jobId);
    sentry.captureException(error, {
      extra: context,
      ...(Object.keys(tags).length > 0 && { tags }),
    } as { extra?: Record<string, unknown>; tags?: Record<string, string> });
  });
}

export function recordMetric(name: string, value: number, tags?: Record<string, string>) {
  logger.info('Metric', { name, value, ...tags });
}
