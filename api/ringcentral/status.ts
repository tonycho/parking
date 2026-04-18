import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthUserFromBearer, sendAuthUnauthorized } from '../lib/auth.js';
import { isRingCentralConnected, ringcentralJwtFromEnv } from '../lib/rcTokenStore.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getAuthUserFromBearer(req.headers.authorization);
  if (!user) {
    return sendAuthUnauthorized(res);
  }

  try {
    const connected = await isRingCentralConnected();
    const usingJwtEnv = Boolean(ringcentralJwtFromEnv());
    return res.status(200).json({ connected, usingJwtEnv });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Failed' });
  }
}
