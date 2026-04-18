import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthUserFromBearer, sendAuthUnauthorized } from '../lib/auth';
import { getSupabaseAdmin } from '../lib/supabaseAdmin';
import { loadSmsRecipients, sanitizePrefix } from '../lib/recipients';

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
    const prefix = sanitizePrefix((body?.spotPrefix as string) || 'B');
    const parkingLotId = (body?.parkingLotId as string | null | undefined) || null;

    const admin = getSupabaseAdmin();
    const recipients = await loadSmsRecipients(admin, prefix, parkingLotId);
    const sample = recipients.slice(0, 5).map((r) => {
      const d = String(r.phone_number).replace(/\D/g, '');
      const phone =
        d.length > 4 ? `${'*'.repeat(Math.min(d.length - 4, 6))}${d.slice(-4)}` : '****';
      return {
        spot: r.spot_label,
        contact: r.contact,
        license_plate: r.license_plate,
        phone,
      };
    });

    return res.status(200).json({ count: recipients.length, sample });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Preview failed' });
  }
}
