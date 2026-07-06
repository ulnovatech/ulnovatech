export type DailyPollRecord = {
  date: string;
  attempted: boolean;
  success: boolean;
};

export type CustomScrapeHealthState = {
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  lastError: string | null;
  recentDays: DailyPollRecord[];
};

export function emptyHealthState(): CustomScrapeHealthState {
  return {
    lastSuccessAt: null,
    lastAttemptAt: null,
    lastError: null,
    recentDays: [],
  };
}

export function isoDate(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Degraded when the last 3 calendar days with attempts all failed. */
export function isCustomScrapeDegraded(health: CustomScrapeHealthState): boolean {
  const attempted = health.recentDays.filter((d) => d.attempted);
  if (attempted.length < 3) return false;
  const lastThree = attempted.slice(-3);
  return lastThree.every((d) => !d.success);
}

export function recordPollOutcome(
  health: CustomScrapeHealthState,
  success: boolean,
  error?: string | null,
): CustomScrapeHealthState {
  const today = isoDate();
  const now = new Date().toISOString();
  const recentDays = [...health.recentDays.filter((d) => d.date !== today)];
  recentDays.push({ date: today, attempted: true, success });
  while (recentDays.length > 14) recentDays.shift();

  return {
    lastSuccessAt: success ? now : health.lastSuccessAt,
    lastAttemptAt: now,
    lastError: success ? null : (error ?? health.lastError),
    recentDays,
  };
}
