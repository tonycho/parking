import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../../lib/vercel-api/supabaseAdmin.js';
import { executeNotificationJob, type NotificationSetting } from '../../lib/vercel-api/notificationRunEngine.js';

/**
 * Vercel Cron invokes this route with GET when configured in vercel.json.
 * Set CRON_SECRET in Vercel env; Vercel sends Authorization: Bearer <CRON_SECRET> for cron jobs.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const admin = getSupabaseAdmin();
  const { data: settings, error: loadErr } = await admin
    .from('notification_settings')
    .select('*')
    .eq('enabled', true);

  if (loadErr) {
    console.error(loadErr);
    return res.status(500).json({ error: loadErr.message });
  }

  const list = (settings || []) as NotificationSetting[];
  if (!list.length) {
    return res.status(200).json({ message: 'No enabled notification settings', processed: 0 });
  }

  const out = await executeNotificationJob(admin, list, {
    isCron: true,
    dryRun: false,
    runNow: false,
    force: false,
  });
  return res.status(200).json(out);
}
