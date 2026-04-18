import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthUserFromBearer, sendAuthUnauthorized } from '../lib/auth.js';
import { getRingCentralAccessToken } from '../lib/rcTokenStore.js';
import * as rc from '../lib/ringcentral.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getAuthUserFromBearer(req.headers.authorization);
  if (!user) {
    return sendAuthUnauthorized(res);
  }

  try {
    const access = await getRingCentralAccessToken();
    const v = await rc.validateRingCentralAccess(access);
    if (v.ok === false) {
      return res.status(200).json({ ok: false, error: v.error });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(200).json({ ok: false, error: e instanceof Error ? e.message : 'Validation failed' });
  }
}
