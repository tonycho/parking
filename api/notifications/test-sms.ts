import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthUserFromBearer, sendAuthUnauthorized } from '../../lib/vercel-api/auth.js';
import { getRingCentralAccessToken } from '../../lib/vercel-api/rcTokenStore.js';
import * as rc from '../../lib/vercel-api/ringcentral.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getAuthUserFromBearer(req.headers.authorization);
  if (!user) {
    return sendAuthUnauthorized(res);
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const to = body?.to as string | undefined;
    const message = (body?.message as string | undefined)?.trim() || 'ParkSmart test SMS from Notification Settings.';
    if (!to) {
      return res.status(400).json({ error: 'Missing "to" phone number' });
    }

    const access = await getRingCentralAccessToken();
    const fromNum = process.env.RINGCENTRAL_SMS_FROM_NUMBER;
    if (!fromNum) {
      return res.status(500).json({ error: 'RINGCENTRAL_SMS_FROM_NUMBER is not configured' });
    }

    const result = await rc.sendSms({
      accessToken: access,
      fromNumber: fromNum,
      toNumber: to,
      text: message,
    });

    return res.status(200).json({
      success: true,
      id: result.id,
      messageStatus: result.messageStatus ?? null,
      toE164: rc.toE164US(to),
    });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to send' });
  }
}
