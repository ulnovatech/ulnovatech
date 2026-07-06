export class PlacesApiError extends Error {
  readonly status: number;
  readonly reason?: string;

  constructor(status: number, message: string, reason?: string) {
    super(formatPlacesApiMessage(status, message, reason));
    this.name = 'PlacesApiError';
    this.status = status;
    this.reason = reason;
  }
}

function formatPlacesApiMessage(status: number, message: string, reason?: string): string {
  if (reason === 'API_KEY_SERVICE_BLOCKED' || /places\.v1\.Places\.SearchText are blocked/i.test(message)) {
    return (
      'Google Places API (New) is not enabled for your API key. In Google Cloud Console, enable ' +
      '"Places API (New)" on the same project as your key, ensure billing is active, and confirm the key ' +
      'is allowed to call Places API (New). Original: ' +
      message
    );
  }
  if (status === 403) {
    return `Google Places API denied the request (403): ${message}`;
  }
  if (status === 401) {
    return `Google Places API key is invalid or unauthorized (401): ${message}`;
  }
  return `Google Places API error (${status}): ${message}`;
}

export function parsePlacesApiErrorBody(
  errText: string,
): { message: string; reason?: string } {
  try {
    const parsed = JSON.parse(errText) as {
      error?: { message?: string; details?: Array<{ reason?: string }> };
    };
    const message = parsed.error?.message?.trim() || errText.slice(0, 300);
    const reason = parsed.error?.details?.find((d) => d.reason)?.reason;
    return { message, reason };
  } catch {
    return { message: errText.slice(0, 300) };
  }
}
