const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  const { AZURE_AD_TENANT_ID, AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET } = process.env;

  if (!AZURE_AD_TENANT_ID || !AZURE_AD_CLIENT_ID || !AZURE_AD_CLIENT_SECRET) {
    return null;
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }

  const res = await fetch(`https://login.microsoftonline.com/${AZURE_AD_TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: AZURE_AD_CLIENT_ID,
      client_secret: AZURE_AD_CLIENT_SECRET,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    }),
  });

  if (!res.ok) {
    console.error('[mail] failed to acquire Graph access token:', res.status, await res.text());
    return null;
  }

  const data = await res.json();
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.token;
}

export async function sendMail(opts: { to: string; subject: string; text: string }) {
  const sender = process.env.MAIL_SENDER;

  if (!sender) {
    console.warn(`[mail] MAIL_SENDER not configured; skipped email to ${opts.to}: "${opts.subject}"`);
    return;
  }

  const token = await getAccessToken();
  if (!token) {
    console.warn(`[mail] Azure AD credentials not configured; skipped email to ${opts.to}: "${opts.subject}"`);
    return;
  }

  try {
    const res = await fetch(`${GRAPH_BASE}/users/${encodeURIComponent(sender)}/sendMail`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          subject: opts.subject,
          body: { contentType: 'Text', content: opts.text },
          toRecipients: [{ emailAddress: { address: opts.to } }],
        },
        saveToSentItems: false,
      }),
    });

    if (!res.ok) {
      console.error('[mail] Graph sendMail failed:', res.status, await res.text());
    }
  } catch (error) {
    console.error('[mail] failed to send email:', error);
  }
}
