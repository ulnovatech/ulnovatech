import { platformSettings } from '@agency/settings';

export const GMAIL_READONLY_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

export type GmailOAuthConfig = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
};

export async function getGmailOAuthConfig(): Promise<GmailOAuthConfig | null> {
  await platformSettings.ensureLoaded();
  const clientId = platformSettings.getCredential('gmail_oauth_client_id');
  const clientSecret = platformSettings.getCredential('gmail_oauth_client_secret');
  const refreshToken = platformSettings.getCredential('gmail_oauth_refresh_token');
  if (!clientId || !clientSecret || !refreshToken) return null;
  return { clientId, clientSecret, refreshToken };
}

export async function isGmailConnected(): Promise<boolean> {
  return (await getGmailOAuthConfig()) != null;
}
