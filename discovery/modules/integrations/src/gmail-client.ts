import { GMAIL_READONLY_SCOPE } from './gmail-config';

export type GmailMessageSummary = {
  id: string;
  threadId: string | null;
  from: string;
  subject: string;
  snippet: string;
  receivedAt: Date | null;
};

function headerValue(headers: Array<{ name: string; value: string }>, name: string) {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

export async function refreshGmailAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    throw new Error(`Gmail token refresh failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error('Gmail token refresh returned no access_token');
  return data.access_token;
}

export async function exchangeGmailAuthCode(
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string,
): Promise<{ refreshToken: string; accessToken: string }> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) {
    throw new Error(`Gmail OAuth exchange failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { refresh_token?: string; access_token?: string };
  if (!data.refresh_token || !data.access_token) {
    throw new Error('Gmail OAuth exchange missing refresh_token (use prompt=consent)');
  }
  return { refreshToken: data.refresh_token, accessToken: data.access_token };
}

export function buildGmailAuthUrl(clientId: string, redirectUri: string, state: string) {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', GMAIL_READONLY_SCOPE);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', state);
  return url.toString();
}

export async function listInboxMessageIds(
  accessToken: string,
  newerThanDays = 7,
  maxResults = 50,
): Promise<string[]> {
  const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
  url.searchParams.set('q', `newer_than:${newerThanDays}d in:inbox`);
  url.searchParams.set('maxResults', String(maxResults));

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Gmail list messages failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { messages?: Array<{ id: string }> };
  return (data.messages ?? []).map((m) => m.id);
}

export async function getGmailMessage(
  accessToken: string,
  messageId: string,
): Promise<GmailMessageSummary> {
  const url = new URL(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
  );
  url.searchParams.set('format', 'metadata');
  for (const h of ['From', 'Subject', 'Date']) {
    url.searchParams.append('metadataHeaders', h);
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Gmail get message failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as {
    id: string;
    threadId?: string;
    snippet?: string;
    payload?: { headers?: Array<{ name: string; value: string }> };
  };
  const headers = data.payload?.headers ?? [];
  const dateRaw = headerValue(headers, 'Date');
  const receivedAt = dateRaw ? new Date(dateRaw) : null;

  return {
    id: data.id,
    threadId: data.threadId ?? null,
    from: headerValue(headers, 'From'),
    subject: headerValue(headers, 'Subject'),
    snippet: data.snippet ?? '',
    receivedAt: receivedAt && !Number.isNaN(receivedAt.getTime()) ? receivedAt : null,
  };
}
