import { supabase } from './supabase';

export type ApiFetchInit = Omit<RequestInit, 'body'> & {
  body?: RequestInit['body'] | Record<string, unknown>;
};

/** Attach Supabase session Bearer token for Vercel `/api/*` routes. */
export async function apiFetch(input: string, init: ApiFetchInit = {}): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let accessToken = session?.access_token;
  if (!accessToken) {
    const { data, error } = await supabase.auth.refreshSession();
    if (!error && data.session?.access_token) {
      accessToken = data.session.access_token;
    }
  }

  const headers = new Headers(init.headers);

  let body: BodyInit | null | undefined = init.body as BodyInit | undefined;
  if (
    body &&
    typeof body === 'object' &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer)
  ) {
    body = JSON.stringify(body);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  } else if (body && typeof body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return fetch(input, { ...init, headers, body });
}

/**
 * Parse JSON from an API response. Fails with a clear message if Vite served TS/JS
 * (happens when `/api` is not proxied to `vercel dev`).
 */
export async function apiFetchJson<T = Record<string, unknown>>(
  path: string,
  init?: ApiFetchInit
): Promise<T> {
  const r = await apiFetch(path, init);
  const text = await r.text();
  const snippet = text.slice(0, 160).replace(/\s+/g, ' ');
  if (!text.trim()) {
    if (!r.ok) throw new Error(`API error ${r.status} (empty body)`);
    return {} as T;
  }
  const trimmed = text.trim();
  if (trimmed.startsWith('<')) {
    throw new Error(
      `API returned HTML (${r.status}) for ${path}. Run \`npm run dev\` (starts API on port 3000 + Vite), or \`npm run dev:api\` in another terminal with \`npm run dev:vite\`. Vite proxies /api to port 3000.`
    );
  }
  if (trimmed.startsWith('import') || trimmed.startsWith('export ')) {
    throw new Error(
      `API returned JavaScript instead of JSON for ${path}. Run \`npm run dev:api\` on port 3000 so /api hits the local API server, not Vite.`
    );
  }
  let parsed: T;
  try {
    parsed = JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON from API (${r.status}): ${snippet}`);
  }
  if (!r.ok) {
    const p = parsed as { error?: string; hint?: string };
    const err = p.error || `HTTP ${r.status}`;
    const hint = p.hint;
    throw new Error(hint ? `${err} — ${hint}` : err);
  }
  return parsed;
}
