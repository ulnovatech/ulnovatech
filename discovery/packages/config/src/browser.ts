/** Tier 4 browser automation — off unless explicitly enabled (no Playwright required for dev). */
export function isBrowserAutomationEnabled(): boolean {
  return process.env.BROWSER_AUTOMATION_ENABLED === 'true';
}

export const BROWSER_SESSION_TIMEOUT_MS = 30_000;
