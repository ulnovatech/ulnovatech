import { requireOperator } from '@/lib/api-auth';
import { getGmailRedirectUri } from '@/lib/gmail-oauth';
import { buildGmailAuthUrl } from '@agency/integrations';
import { platformSettings } from '@agency/settings';
import { NextResponse } from 'next/server';

export async function GET() {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    await platformSettings.ensureLoaded();
    const clientId = platformSettings.getCredential('gmail_oauth_client_id');
    const clientSecret = platformSettings.getCredential('gmail_oauth_client_secret');
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Set Gmail OAuth client ID and secret in Settings first' },
        { status: 400 },
      );
    }

    const url = buildGmailAuthUrl(clientId, getGmailRedirectUri(), 'gmail-connect');
    return NextResponse.redirect(url);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
