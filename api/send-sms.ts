import type { VercelRequest, VercelResponse } from '@vercel/node';

// RingCentral OAuth token cache (in production, use a proper cache like Redis)
let tokenCache: { accessToken: string; expiresAt: number } | null = null;

async function getRingCentralToken(): Promise<string> {
  // Check if we have a valid cached token
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }

  const clientId = process.env.RINGCENTRAL_CLIENT_ID;
  const clientSecret = process.env.RINGCENTRAL_CLIENT_SECRET;
  const jwtToken = process.env.RINGCENTRAL_JWT_TOKEN;

  if (!clientId || !clientSecret || !jwtToken) {
    throw new Error('RingCentral credentials not configured');
  }

  // Use JWT auth flow (recommended for server-to-server)
  const tokenUrl = 'https://platform.ringcentral.com/restapi/oauth/token';

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwtToken,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('RingCentral auth error:', data);
    throw new Error(data.error_description || 'Failed to authenticate with RingCentral');
  }

  // Cache the token (expires_in is in seconds, subtract 60s for safety margin)
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phoneNumber, contact, licensePlate, spotLabel } = req.body;

  // Validate required fields
  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const ringCentralPhoneNumber = process.env.RINGCENTRAL_PHONE_NUMBER;

  if (!ringCentralPhoneNumber) {
    return res.status(500).json({ error: 'RingCentral phone number not configured' });
  }

  // Format phone number to E.164 format (US numbers)
  const formattedPhone = phoneNumber.startsWith('+1') 
    ? phoneNumber 
    : `+1${phoneNumber.replace(/\D/g, '')}`;

  // Create the reminder message
  const message = `Hi${contact ? ` ${contact}` : ''}! This is a reminder from ParkSmart that your vehicle${licensePlate ? ` (${licensePlate})` : ''}${spotLabel ? ` in spot ${spotLabel}` : ''} needs to be moved. Thank you!`;

  try {
    // Get OAuth access token
    const accessToken = await getRingCentralToken();

    // Send SMS via RingCentral API
    const smsUrl = 'https://platform.ringcentral.com/restapi/v1.0/account/~/extension/~/sms';
    
    const response = await fetch(smsUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: { phoneNumber: ringCentralPhoneNumber },
        to: [{ phoneNumber: formattedPhone }],
        text: message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('RingCentral SMS error:', data);
      return res.status(400).json({ 
        error: data.message || 'Failed to send SMS',
        code: data.errorCode 
      });
    }

    return res.status(200).json({ 
      success: true, 
      messageId: data.id,
      message: 'SMS reminder sent successfully' 
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to send SMS' 
    });
  }
}
