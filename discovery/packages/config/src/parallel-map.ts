/** Run async work over items with bounded concurrency. */
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const limit = Math.max(1, Math.min(concurrency, items.length));
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    for (;;) {
      const i = nextIndex++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}

export function pipelineConcurrency(): number {
  const raw = process.env.PIPELINE_PARALLEL_CONCURRENCY?.trim();
  const n = raw ? parseInt(raw, 10) : 6;
  return Number.isFinite(n) && n > 0 ? Math.min(n, 16) : 6;
}
