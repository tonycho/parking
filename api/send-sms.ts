import type { VercelRequest, VercelResponse } from '@vercel/node';

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

  // Get Twilio credentials from environment variables
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioPhoneNumber) {
    return res.status(500).json({ error: 'Twilio credentials not configured' });
  }

  // Format phone number to E.164 format (US numbers)
  const formattedPhone = phoneNumber.startsWith('+1') 
    ? phoneNumber 
    : `+1${phoneNumber.replace(/\D/g, '')}`;

  // Create the reminder message
  const message = `Hi${contact ? ` ${contact}` : ''}! This is a reminder from ParkSmart that your vehicle${licensePlate ? ` (${licensePlate})` : ''}${spotLabel ? ` in spot ${spotLabel}` : ''} needs to be moved. Thank you!`;

  try {
    // Use Twilio REST API directly
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: formattedPhone,
        From: twilioPhoneNumber,
        Body: message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Twilio error:', data);
      return res.status(400).json({ 
        error: data.message || 'Failed to send SMS',
        code: data.code 
      });
    }

    return res.status(200).json({ 
      success: true, 
      messageId: data.sid,
      message: 'SMS reminder sent successfully' 
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to send SMS' 
    });
  }
}
