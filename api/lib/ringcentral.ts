/**
 * RingCentral REST: JWT bearer OAuth (RFC 7523) + refresh token, and SMS.
 * Env: RINGCENTRAL_CLIENT_ID, RINGCENTRAL_CLIENT_SECRET, RINGCENTRAL_SERVER_URL,
 * RINGCENTRAL_JWT (Developer Console JWT credential string),
 * optional RINGCENTRAL_SMS_FROM_NUMBER.
 */

function serverBase(): string {
  const s = process.env.RINGCENTRAL_SERVER_URL?.replace(/\/$/, '');
  if (!s) throw new Error('Missing RINGCENTRAL_SERVER_URL');
  return s;
}

function clientId(): string {
  const id = process.env.RINGCENTRAL_CLIENT_ID?.trim();
  if (!id) throw new Error('Missing RINGCENTRAL_CLIENT_ID');
  return id;
}

function clientSecret(): string {
  const sec = process.env.RINGCENTRAL_CLIENT_SECRET?.trim();
  if (!sec) throw new Error('Missing RINGCENTRAL_CLIENT_SECRET');
  return sec;
}

function basicAuthHeader(): string {
  return 'Basic ' + Buffer.from(`${clientId()}:${clientSecret()}`).toString('base64');
}

export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
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
  const json = (await res.json()) as TokenResponse & { error?: string; error_description?: string; message?: string };
  if (!res.ok) {
    throw new Error(json.error_description || json.message || json.error || `Token request failed (${res.status})`);
  }
  return json;
}

/** Exchange a JWT credential (from RingCentral Developer Console → Credentials) for access + refresh tokens. */
export async function exchangeJwtAssertion(jwtAssertion: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwtAssertion.trim(),
  });
  return postToken(body);
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
  return postToken(body);
}

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
}): string {
  const { contact, licensePlate, spotLabel } = params;
  return `Hi${contact ? ` ${contact}` : ''}! This is a reminder from ParkSmart that your vehicle${licensePlate ? ` (${licensePlate})` : ''}${spotLabel ? ` in spot ${spotLabel}` : ''} needs to be moved. Thank you!`;
}

type RingCentralErrorJson = {
  message?: string;
  errorCode?: string;
  errors?: { message?: string; errorCode?: string }[];
};

function formatRingCentralApiError(j: RingCentralErrorJson, fallbackStatus: number): string {
  const fromErrors = j.errors?.map((e) => e.message).filter(Boolean).join('; ');
  return j.message || fromErrors || j.errorCode || `HTTP ${fallbackStatus}`;
}

function hintForPermissionError(message: string): string {
  if (!/readaccounts|permission|not authorized to/i.test(message)) return '';
  return (
    ' Fix: RingCentral Developer Portal → your **JWT** app → **Settings** (or **Credentials** linked to the app) → ' +
    'enable **ReadAccounts** and **SMS** for this app, save, then restart the API and validate again.'
  );
}

function hintForSmsFromExtensionError(message: string): string {
  if (!/doesn't belong to extension|does not belong to extension|not belong to extension/i.test(message)) return '';
  return (
    ' Fix: The **from** number must be a voice/SMS number **assigned to the same RingCentral user (extension)** as your JWT credential. ' +
    'In RingCentral Admin: **Users** → open that user → **Phone numbers** / **Numbers** and use a listed number (often the direct line or company SMS-enabled number). ' +
    'Set **RINGCENTRAL_SMS_FROM_NUMBER** in server env (E.164, e.g. +15551234567).'
  );
}

export type SendSmsResult = {
  id?: string;
  /** RingCentral state right after create, e.g. Queued, Sent (handset delivery is tracked separately). */
  messageStatus?: string;
};

export async function sendSms(params: {
  accessToken: string;
  fromNumber: string;
  toNumber: string;
  text: string;
}): Promise<SendSmsResult> {
  const { accessToken, fromNumber, toNumber, text } = params;
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
  const json = (await res.json()) as RingCentralErrorJson & { id?: string; messageStatus?: string };
  if (!res.ok) {
    const base = formatRingCentralApiError(json, res.status);
    throw new Error(base + hintForSmsFromExtensionError(base));
  }
  return { id: json.id, messageStatus: json.messageStatus };
}

export async function validateRingCentralAccess(accessToken: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${serverBase()}/restapi/v1.0/account/~/extension/~`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as RingCentralErrorJson;
      const base = formatRingCentralApiError(j, res.status);
      return { ok: false, error: base + hintForPermissionError(base) };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
