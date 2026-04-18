import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthUserFromBearer, sendAuthUnauthorized } from './lib/auth';
import { getRingCentralAccessToken } from './lib/rcTokenStore';
import * as rc from './lib/ringcentral';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getAuthUserFromBearer(req.headers.authorization);
  if (!user) {
    return sendAuthUnauthorized(res);
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { phoneNumber, contact, licensePlate, spotLabel } = body;

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const fromNum = process.env.RINGCENTRAL_SMS_FROM_NUMBER?.trim();
  if (!fromNum) {
    return res.status(500).json({ error: 'RINGCENTRAL_SMS_FROM_NUMBER is not configured' });
  }

  const message = rc.buildReminderBody({ contact, licensePlate, spotLabel });

  try {
    const access = await getRingCentralAccessToken();
    const result = await rc.sendSms({
      accessToken: access,
      fromNumber: fromNum,
      toNumber: phoneNumber,
      text: message,
    });

    return res.status(200).json({
      success: true,
      id: result.id,
      message: 'SMS reminder sent successfully',
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to send SMS',
    });
  }
}
