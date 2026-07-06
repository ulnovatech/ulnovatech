import type { ComplaintAnalysis, ComplaintSignal } from '../scoring/types';

export class ClaudeParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClaudeParseError';
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function asString(v: unknown, field: string): string {
  if (typeof v !== 'string' || !v.trim()) {
    throw new ClaudeParseError(`missing or invalid ${field}`);
  }
  return v.trim();
}

function asNumber(v: unknown, field: string): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  if (!Number.isFinite(n)) {
    throw new ClaudeParseError(`missing or invalid ${field}`);
  }
  return n;
}

function asFixDifficulty(v: unknown): ComplaintSignal['fixDifficulty'] {
  if (v === 'LOW' || v === 'MEDIUM' || v === 'HIGH') return v;
  throw new ClaudeParseError('invalid fixDifficulty');
}

export function parseClaudeJsonContent(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new ClaudeParseError('empty Claude content');
  }

  const withoutFences = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(withoutFences);
  } catch {
    const start = withoutFences.indexOf('{');
    const end = withoutFences.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(withoutFences.slice(start, end + 1));
      } catch {
        // fall through
      }
    }
    throw new ClaudeParseError('Claude content is not valid JSON');
  }
}

export function validateComplaintSignal(raw: unknown, index: number): ComplaintSignal {
  if (!isRecord(raw)) {
    throw new ClaudeParseError(`topComplaints[${index}] must be an object`);
  }

  return {
    complaint: asString(raw.complaint, `topComplaints[${index}].complaint`),
    frequency: asNumber(raw.frequency, `topComplaints[${index}].frequency`),
    isTechnical: raw.isTechnical === true,
    fixDifficulty: asFixDifficulty(raw.fixDifficulty),
  };
}

export function validateComplaintAnalysis(data: unknown): ComplaintAnalysis {
  if (!isRecord(data)) {
    throw new ClaudeParseError('expected complaint analysis object');
  }

  if (!Array.isArray(data.topComplaints)) {
    throw new ClaudeParseError('topComplaints must be an array');
  }

  const topComplaints = data.topComplaints.map((item, i) => validateComplaintSignal(item, i));

  if (!Array.isArray(data.buildableFixes)) {
    throw new ClaudeParseError('buildableFixes must be an array');
  }

  const buildableFixes = data.buildableFixes.map((item, i) => {
    if (typeof item !== 'string' || !item.trim()) {
      throw new ClaudeParseError(`buildableFixes[${i}] must be a non-empty string`);
    }
    return item.trim();
  });

  const estimatedFixTimeDays = asNumber(
    data.estimatedFixTimeDays ?? data.estimatedFixTimedays,
    'estimatedFixTimeDays',
  );

  const confidenceScore = asNumber(data.confidenceScore, 'confidenceScore');
  if (confidenceScore < 0 || confidenceScore > 100) {
    throw new ClaudeParseError('confidenceScore must be 0-100');
  }

  return {
    topComplaints,
    buildableFixes,
    estimatedFixTimeDays,
    confidenceScore,
  };
}

/** Extract assistant text from Anthropic messages API body. */
export function extractClaudeResponseText(data: unknown): string {
  if (!isRecord(data)) {
    throw new ClaudeParseError('empty Claude API response');
  }

  const content = data.content;
  if (!Array.isArray(content)) {
    throw new ClaudeParseError('no content in Claude API response');
  }

  const parts: string[] = [];
  for (const block of content) {
    if (isRecord(block) && block.type === 'text' && typeof block.text === 'string') {
      parts.push(block.text);
    }
  }

  const joined = parts.join('\n').trim();
  if (!joined) {
    throw new ClaudeParseError('no text content in Claude API response');
  }

  return joined;
}
