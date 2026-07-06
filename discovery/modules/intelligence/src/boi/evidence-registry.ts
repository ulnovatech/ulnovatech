import type { BoIEvidence, BoIEvidenceSource } from './types';

export class BoIEvidenceRegistry {
  private items: BoIEvidence[] = [];
  private seen = new Set<string>();

  add(id: string, entry: Omit<BoIEvidence, 'id'>): string {
    if (this.seen.has(id)) return id;
    this.seen.add(id);
    this.items.push({ id, ...entry });
    return id;
  }

  has(id: string): boolean {
    return this.seen.has(id);
  }

  all(): BoIEvidence[] {
    return [...this.items];
  }
}

export function mapSignalSourceToEvidenceSource(
  source: string,
  signalType?: string,
): BoIEvidenceSource {
  if (signalType === 'review_pain' || source === 'google_places') return 'google_places_review';
  if (source === 'intelligence' || signalType === 'crawl_note') return 'website_crawl';
  if (source === 'bi_profile') return 'bi_profile';
  if (source === 'discovery' || source === 'google_maps' || source === 'public_search') {
    return 'discovery';
  }
  return 'intent_signal';
}
