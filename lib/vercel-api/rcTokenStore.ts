import { getSupabaseAdmin } from './supabaseAdmin.js';
import * as rc from './ringcentral.js';

/** JWT credential string from RingCentral Developer Console (Credentials → Create JWT). */
export function ringcentralJwtFromEnv(): string | undefined {
  const keys = ['RINGCENTRAL_JWT', 'RINGCENTRAL_USER_JWT', 'RC_USER_JWT'] as const;
  for (const k of keys) {
    const raw = process.env[k];
    if (!raw) continue;
    const j = raw.trim().replace(/^["']+|["']+$/g, '');
    if (j) return j;
  }
  return undefined;
}

/** Returns a valid access token, using refresh and/or JWT assertion as needed. */
export async function getRingCentralAccessToken(): Promise<string> {
  const admin = getSupabaseAdmin();
  const jwtEnv = ringcentralJwtFromEnv();
  const { data, error } = await admin
    .from('ringcentral_token')
    .select('refresh_token, access_token, expires_at')
    .eq('id', 'default')
    .maybeSingle();

  if (error) throw error;

  const expMs = data?.expires_at ? new Date(data.expires_at).getTime() : 0;
  if (data?.access_token && expMs > Date.now() + 60_000) {
    return data.access_token;
  }

  if (data?.refresh_token) {
    try {
      const t = await rc.refreshAccessToken(data.refresh_token);
      const newRefresh = t.refresh_token || data.refresh_token;
      const expiresAt = new Date(Date.now() + t.expires_in * 1000).toISOString();
      const { error: upErr } = await admin.from('ringcentral_token').upsert(
        {
          id: 'default',
          refresh_token: newRefresh,
          access_token: t.access_token,
          expires_at: expiresAt,
        },
        { onConflict: 'id' }
      );
      if (upErr) throw upErr;
      return t.access_token;
    } catch (e) {
      if (!jwtEnv) throw e;
      console.warn('[ringcentral] refresh failed, exchanging JWT again:', e);
    }
  }

  if (jwtEnv) {
    const t = await rc.exchangeJwtAssertion(jwtEnv);
    const newRefresh = t.refresh_token || data?.refresh_token || null;
    const expiresAt = new Date(Date.now() + t.expires_in * 1000).toISOString();
    const { error: upErr } = await admin.from('ringcentral_token').upsert(
      {
        id: 'default',
        refresh_token: newRefresh,
        access_token: t.access_token,
        expires_at: expiresAt,
      },
      { onConflict: 'id' }
    );
    if (upErr) throw upErr;
    return t.access_token;
  }

  throw new Error(
    'RingCentral is not configured: the API found no JWT (RINGCENTRAL_JWT, or alias RINGCENTRAL_USER_JWT / RC_USER_JWT) and no stored refresh token in the database. Put the JWT in .env.local next to SUPABASE_* (not VITE_* only), add RINGCENTRAL_CLIENT_ID and RINGCENTRAL_CLIENT_SECRET for the same JWT-auth app, then restart npm run dev. JWT: Developer Console → your name → Credentials → Create JWT.'
  );
}

export async function isRingCentralConnected(): Promise<boolean> {
  if (ringcentralJwtFromEnv()) return true;
  const admin = getSupabaseAdmin();
  const { data } = await admin.from('ringcentral_token').select('refresh_token').eq('id', 'default').maybeSingle();
  return Boolean(data?.refresh_token);
}
