import { createClient, SupabaseClient } from '@supabase/supabase-js';

function trimEnv(v: string | undefined): string | undefined {
  return v?.trim().replace(/^['"]|['"]$/g, '');
}

function supabaseUrl(): string {
  const url = trimEnv(process.env.SUPABASE_URL) || trimEnv(process.env.VITE_SUPABASE_URL);
  if (!url) {
    throw new Error(
      'Missing SUPABASE_URL (or VITE_SUPABASE_URL). Add SUPABASE_URL to .env.local for the local API server.'
    );
  }
  return url;
}

export function getSupabaseAdmin(): SupabaseClient {
  const key = trimEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!key) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. In Supabase: Project Settings → API → copy the "service_role" secret. ' +
        'Add SUPABASE_SERVICE_ROLE_KEY=... to .env.local (same file as VITE_*). Never use this key in the browser.'
    );
  }
  return createClient(supabaseUrl(), key);
}

export function getSupabaseAnon(): SupabaseClient {
  const key =
    trimEnv(process.env.SUPABASE_ANON_KEY) || trimEnv(process.env.VITE_SUPABASE_ANON_KEY);
  if (!key) {
    throw new Error(
      'Missing SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY. Add SUPABASE_ANON_KEY to .env.local or set VITE_SUPABASE_ANON_KEY.'
    );
  }
  return createClient(supabaseUrl(), key);
}
