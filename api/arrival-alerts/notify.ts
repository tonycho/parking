import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthUserFromBearer, sendAuthUnauthorized } from '../../lib/vercel-api/auth.js';
import { sendArrivalAlerts } from '../../lib/vercel-api/arrivalAlerts.js';
import { getSupabaseAdmin } from '../../lib/vercel-api/supabaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getAuthUserFromBearer(req.headers.authorization);
  if (!user) {
    return sendAuthUnauthorized(res);
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const licensePlate = (body?.licensePlate as string | undefined)?.trim();
  if (!licensePlate) {
    return res.status(400).json({ error: 'licensePlate is required' });
  }

  try {
    const result = await sendArrivalAlerts(getSupabaseAdmin(), licensePlate);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error sending arrival alerts:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to send arrival alerts',
    });
  }
}
