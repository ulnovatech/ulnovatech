import { getGmailRedirectUri } from '@/lib/gmail-oauth';
import { exchangeGmailAuthCode } from '@agency/integrations';
import { platformSettings } from '@agency/settings';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

    if (error) {
      return NextResponse.redirect(`${appUrl}/settings?gmail=error`);
    }
    if (!code) {
      return NextResponse.json({ error: 'Missing OAuth code' }, { status: 400 });
    }

    await platformSettings.ensureLoaded();
    const clientId = platformSettings.getCredential('gmail_oauth_client_id');
    const clientSecret = platformSettings.getCredential('gmail_oauth_client_secret');
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${appUrl}/settings?gmail=missing_config`);
    }

    const { refreshToken } = await exchangeGmailAuthCode(
      clientId,
      clientSecret,
      code,
      getGmailRedirectUri(),
    );
    await platformSettings.updateCredentials({ gmail_oauth_refresh_token: refreshToken });

    return NextResponse.redirect(`${appUrl}/settings?gmail=connected`);
  } catch (e) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';
    return NextResponse.redirect(`${appUrl}/settings?gmail=error&msg=${encodeURIComponent(String(e))}`);
  }
}
