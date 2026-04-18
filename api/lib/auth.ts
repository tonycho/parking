import { getSupabaseAnon } from './supabaseAdmin';

type JsonResponder = { status: (code: number) => { json: (body: unknown) => unknown } };

/** Use when JWT / session validation failed (not for cron secret failures). */
export function sendAuthUnauthorized(res: JsonResponder) {
  return res.status(401).json({
    error: 'Unauthorized',
    hint:
      'Sign in first. In .env.local set SUPABASE_URL and SUPABASE_ANON_KEY to the same project as VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart `npm run dev`.',
  });
}

export async function getAuthUserFromBearer(authHeader: string | undefined) {
  if (!authHeader?.startsWith('Bearer ')) {
    console.warn('[auth] Missing Authorization: Bearer <access_token> (is the user signed in?)');
    return null;
  }
  const jwt = authHeader.slice(7);
  if (!jwt.trim()) {
    console.warn('[auth] Empty bearer token');
    return null;
  }
  try {
    const sb = getSupabaseAnon();
    const {
      data: { user },
      error,
    } = await sb.auth.getUser(jwt);
    if (error) {
      console.warn('[auth] supabase.auth.getUser failed:', error.message);
      return null;
    }
    if (!user) return null;
    return user;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn('[auth] Unexpected error (check SUPABASE_URL / SUPABASE_ANON_KEY in .env.local):', msg);
    return null;
  }
}
