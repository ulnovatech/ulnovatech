/** Reject when a promise does not settle within `ms`. */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label = 'operation',
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)),
          ms,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function discoverProviderTimeoutMs(): number {
  const raw = process.env.DISCOVER_PROVIDER_TIMEOUT_MS?.trim();
  const n = raw ? parseInt(raw, 10) : 180_000;
  return Number.isFinite(n) && n > 0 ? n : 180_000;
}

export function inlinePipelineStaleJobMinutes(): number {
  const raw = process.env.INLINE_PIPELINE_STALE_JOB_MINUTES?.trim();
  const n = raw ? parseInt(raw, 10) : 2;
  return Number.isFinite(n) && n > 0 ? n : 2;
}
