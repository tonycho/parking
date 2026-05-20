/**
 * Browser-side RingCentral REST API helpers.
 *
 * Credentials are read from Vite env vars (VITE_RINGCENTRAL_*).
 * This replaces the Vercel serverless functions that previously handled:
 *   /api/ringcentral/status
 *   /api/notifications/validate-ringcentral
 *   /api/notifications/test-sms
 *   /api/send-reminder
 *
 * Auth strategy: JWT assertion → access token (+ cached in memory).
 * The JWT credential string comes from VITE_RINGCENTRAL_JWT.
 */

export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
};

export type SendSmsResult = {
  id?: string;
  messageStatus?: string;
};

export type ValidateResult =
  | { ok: true }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// In-memory token cache (survives within a page session)
// ---------------------------------------------------------------------------
let _cachedToken: { accessToken: string; expiresAt: number } | null = null;

function serverBase(): string {
  const s = import.meta.env.VITE_RINGCENTRAL_SERVER_URL?.replace(/\/$/, '');
  if (!s) throw new Error('Missing VITE_RINGCENTRAL_SERVER_URL');
  return s;
}

function clientId(): string {
  const id = import.meta.env.VITE_RINGCENTRAL_CLIENT_ID?.trim();
  if (!id) throw new Error('Missing VITE_RINGCENTRAL_CLIENT_ID');
  return id;
}

function clientSecret(): string {
  const sec = import.meta.env.VITE_RINGCENTRAL_CLIENT_SECRET?.trim();
  if (!sec) throw new Error('Missing VITE_RINGCENTRAL_CLIENT_SECRET');
  return sec;
}

function basicAuthHeader(): string {
  return 'Basic ' + btoa(`${clientId()}:${clientSecret()}`);
}

function jwtFromEnv(): string | undefined {
  const raw = import.meta.env.VITE_RINGCENTRAL_JWT?.trim();
  if (!raw) return undefined;
  return raw.replace(/^["']+|["']+$/g, '');
}

export function smsFromNumber(): string {
  const n = import.meta.env.VITE_RINGCENTRAL_SMS_FROM_NUMBER?.trim();
  if (!n) throw new Error('Missing VITE_RINGCENTRAL_SMS_FROM_NUMBER');
  return n;
}

/** Returns true if the minimum config (client id/secret + server url + JWT) is present. */
export function isRingCentralConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_RINGCENTRAL_CLIENT_ID?.trim() &&
    import.meta.env.VITE_RINGCENTRAL_CLIENT_SECRET?.trim() &&
    import.meta.env.VITE_RINGCENTRAL_SERVER_URL?.trim() &&
    jwtFromEnv()
  );
}

// ---------------------------------------------------------------------------
// Token acquisition
// ---------------------------------------------------------------------------

type RcErrorJson = {
  error?: string;
  error_description?: string;
  message?: string;
};

async function postToken(body: URLSearchParams): Promise<TokenResponse> {
  const res = await fetch(`${serverBase()}/restapi/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  const json = (await res.json()) as TokenResponse & RcErrorJson;
  if (!res.ok) {
    throw new Error(
      json.error_description || json.message || json.error || `Token request failed (${res.status})`
    );
  }
  return json;
}

async function exchangeJwt(jwt: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwt,
  });
  return postToken(body);
}

/**
 * Returns a valid access token. Uses the in-memory cache first,
 * then exchanges the JWT assertion if expired or absent.
 */
export async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (_cachedToken && _cachedToken.expiresAt > now + 60_000) {
    return _cachedToken.accessToken;
  }

  const jwt = jwtFromEnv();
  if (!jwt) {
    throw new Error(
      'RingCentral is not configured: set VITE_RINGCENTRAL_JWT in your credentials/.env file.'
    );
  }

  const t = await exchangeJwt(jwt);
  _cachedToken = {
    accessToken: t.access_token,
    expiresAt: now + t.expires_in * 1000,
  };
  return t.access_token;
}

// ---------------------------------------------------------------------------
// SMS helpers
// ---------------------------------------------------------------------------

export function toE164US(digits: string): string {
  const d = digits.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) return `+${d}`;
  if (d.length === 10) return `+1${d}`;
  if (digits.startsWith('+')) return digits;
  return `+${d}`;
}

export function buildReminderBody(params: {
  contact?: string;
  licensePlate?: string;
  spotLabel?: string;
  messageTemplate?: string;
}): string {
  const { contact, licensePlate, spotLabel, messageTemplate } = params;
  if (messageTemplate) {
    return messageTemplate
      .replace(/\{\{\s*contact\s*\}\}/gi, contact || '')
      .replace(/\{\{\s*license_plate\s*\}\}/gi, licensePlate || '')
      .replace(/\{\{\s*spot\s*\}\}/gi, spotLabel || '');
  }
  return (
    `Hi${contact ? ` ${contact}` : ''}! This is a reminder from ParkSmart that your vehicle` +
    `${licensePlate ? ` (${licensePlate})` : ''}${spotLabel ? ` in spot ${spotLabel}` : ''} needs to be moved. Thank you!`
  );
}

type RcApiErrorJson = {
  message?: string;
  errorCode?: string;
  errors?: { message?: string; errorCode?: string }[];
};

function formatApiError(j: RcApiErrorJson, status: number): string {
  const fromErrors = j.errors?.map((e) => e.message).filter(Boolean).join('; ');
  return j.message || fromErrors || j.errorCode || `HTTP ${status}`;
}

function hintForSmsFromExtension(message: string): string {
  if (!/doesn't belong to extension|does not belong to extension|not belong to extension/i.test(message)) return '';
  return (
    ' Fix: The from number must be a voice/SMS number assigned to the same RingCentral user (extension) as your JWT credential. ' +
    'In RingCentral Admin: Users → open that user → Phone numbers / Numbers and use a listed number. ' +
    'Set VITE_RINGCENTRAL_SMS_FROM_NUMBER in credentials/.env (E.164, e.g. +15551234567).'
  );
}

function hintForPermission(message: string): string {
  if (!/readaccounts|permission|not authorized to/i.test(message)) return '';
  return (
    ' Fix: RingCentral Developer Portal → your JWT app → Settings → enable ReadAccounts and SMS, save, then refresh.'
  );
}

export async function sendSms(params: {
  fromNumber: string;
  toNumber: string;
  text: string;
}): Promise<SendSmsResult> {
  const accessToken = await getAccessToken();
  const { fromNumber, toNumber, text } = params;

  const res = await fetch(`${serverBase()}/restapi/v1.0/account/~/extension/~/sms`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: { phoneNumber: toE164US(fromNumber) },
      to: [{ phoneNumber: toE164US(toNumber) }],
      text,
    }),
  });

  const json = (await res.json()) as RcApiErrorJson & { id?: string; messageStatus?: string };
  if (!res.ok) {
    const base = formatApiError(json, res.status);
    throw new Error(base + hintForSmsFromExtension(base));
  }
  return { id: json.id, messageStatus: json.messageStatus };
}

export async function validateAccess(): Promise<ValidateResult> {
  try {
    const accessToken = await getAccessToken();
    const res = await fetch(`${serverBase()}/restapi/v1.0/account/~/extension/~`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as RcApiErrorJson;
      const base = formatApiError(j, res.status);
      return { ok: false, error: base + hintForPermission(base) };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
