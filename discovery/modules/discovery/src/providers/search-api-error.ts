export class SearchApiError extends Error {
  readonly status: number;
  readonly engine: 'google_cse' | 'bing_search';
  readonly reason?: string;

  constructor(
    engine: 'google_cse' | 'bing_search',
    status: number,
    message: string,
    reason?: string,
  ) {
    super(formatSearchApiMessage(engine, status, message, reason));
    this.name = 'SearchApiError';
    this.engine = engine;
    this.status = status;
    this.reason = reason;
  }
}

export class SearchBudgetExhaustedError extends Error {
  readonly provider: 'google_cse' | 'bing_search';

  constructor(provider: 'google_cse' | 'bing_search') {
    super(
      provider === 'google_cse'
        ? 'Google Custom Search daily budget is exhausted. Raise CSE_DAILY_CAP in Settings or retry tomorrow.'
        : 'Bing Search daily budget is exhausted. Raise BING_DAILY_CAP in Settings or retry tomorrow.',
    );
    this.name = 'SearchBudgetExhaustedError';
    this.provider = provider;
  }
}

function formatSearchApiMessage(
  engine: 'google_cse' | 'bing_search',
  status: number,
  message: string,
  reason?: string,
): string {
  const label = engine === 'google_cse' ? 'Google Custom Search' : 'Bing Search';

  if (
    engine === 'google_cse' &&
    (reason === 'dailyLimitExceeded' ||
      /daily limit|quota exceeded|rate limit/i.test(message))
  ) {
    return `${label} quota exceeded. Check CSE billing/limits in Google Cloud Console. Original: ${message}`;
  }

  if (status === 403) {
    return `${label} denied the request (403). Verify API key, Custom Search Engine ID (cx), and that the Custom Search API is enabled. Original: ${message}`;
  }
  if (status === 401) {
    return `${label} key is invalid or unauthorized (401): ${message}`;
  }
  if (status === 429) {
    return `${label} rate limited (429). Retry later or add another key. Original: ${message}`;
  }
  return `${label} error (${status}): ${message}`;
}

export function parseGoogleSearchErrorBody(errText: string): { message: string; reason?: string } {
  try {
    const parsed = JSON.parse(errText) as {
      error?: {
        message?: string;
        errors?: Array<{ reason?: string; message?: string }>;
        status?: string;
      };
    };
    const message =
      parsed.error?.message?.trim() ||
      parsed.error?.errors?.[0]?.message?.trim() ||
      errText.slice(0, 300);
    const reason = parsed.error?.errors?.[0]?.reason ?? parsed.error?.status;
    return { message, reason };
  } catch {
    return { message: errText.slice(0, 300) };
  }
}

export function parseBingSearchErrorBody(errText: string): { message: string; reason?: string } {
  try {
    const parsed = JSON.parse(errText) as {
      error?: { code?: string; message?: string };
      message?: string;
    };
    const message = parsed.error?.message?.trim() || parsed.message?.trim() || errText.slice(0, 300);
    const reason = parsed.error?.code;
    return { message, reason };
  } catch {
    return { message: errText.slice(0, 300) };
  }
}
