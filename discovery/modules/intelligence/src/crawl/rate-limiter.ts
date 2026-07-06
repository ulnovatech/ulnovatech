export class DomainRateLimiter {
  private lastFetchByDomain = new Map<string, number>();

  constructor(private minIntervalMs: number) {}

  async waitForDomain(url: string): Promise<void> {
    let hostname: string;
    try {
      hostname = new URL(url).hostname;
    } catch {
      return;
    }

    const now = Date.now();
    const last = this.lastFetchByDomain.get(hostname) ?? 0;
    const elapsed = now - last;
    if (elapsed < this.minIntervalMs) {
      await new Promise((r) => setTimeout(r, this.minIntervalMs - elapsed));
    }
    this.lastFetchByDomain.set(hostname, Date.now());
  }
}
