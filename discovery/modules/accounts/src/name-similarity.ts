const SOFT_NAME_MATCH_THRESHOLD = 0.85;

export function normalizeNameForMatch(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function bigrams(value: string): Set<string> {
  const grams = new Set<string>();
  if (value.length < 2) {
    if (value) grams.add(value);
    return grams;
  }
  for (let i = 0; i < value.length - 1; i++) {
    grams.add(value.slice(i, i + 2));
  }
  return grams;
}

/** Bigram Jaccard similarity in [0, 1]. */
export function nameSimilarity(a: string, b: string): number {
  const left = normalizeNameForMatch(a);
  const right = normalizeNameForMatch(b);
  if (!left || !right) return 0;
  if (left === right) return 1;

  const leftGrams = bigrams(left);
  const rightGrams = bigrams(right);
  let intersection = 0;
  for (const gram of leftGrams) {
    if (rightGrams.has(gram)) intersection++;
  }
  const union = leftGrams.size + rightGrams.size - intersection;
  const jaccard = union === 0 ? 0 : intersection / union;

  const shorter = left.length <= right.length ? left : right;
  const longer = left.length > right.length ? left : right;
  if (longer.startsWith(shorter) && shorter.length >= 4 && shorter.includes(' ')) {
    return Math.max(jaccard, SOFT_NAME_MATCH_THRESHOLD);
  }

  return jaccard;
}

export function isSoftNameMatch(a: string, b: string, threshold = SOFT_NAME_MATCH_THRESHOLD): boolean {
  return nameSimilarity(a, b) >= threshold;
}

export { SOFT_NAME_MATCH_THRESHOLD };
