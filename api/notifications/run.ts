import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthUserFromBearer, sendAuthUnauthorized } from '../lib/auth';
import { getSupabaseAdmin } from '../lib/supabaseAdmin';
import { executeNotificationJob, type NotificationSetting } from '../lib/notificationRunEngine';

function authorizeCron(req: VercelRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.authorization;
  return auth === `Bearer ${secret}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const dryRun = Boolean(body.dryRun);
  const runNow = Boolean(body.runNow);
  const force = Boolean(body.force);

  const isCron = authorizeCron(req);
  const user = isCron ? { id: 'cron' } : await getAuthUserFromBearer(req.headers.authorization);

  if (!isCron && !user) {
    return sendAuthUnauthorized(res);
  }

  const admin = getSupabaseAdmin();

  let list: NotificationSetting[] = [];

  if (isCron) {
    let q = admin.from('notification_settings').select('*');
    if (!force) q = q.eq('enabled', true);
    const { data: settings, error: loadErr } = await q;
    if (loadErr) {
      console.error(loadErr);
      return res.status(500).json({ error: loadErr.message });
    }
    list = (settings || []) as NotificationSetting[];
  } else {
    if (!runNow && !dryRun) {
      return res.status(400).json({ error: 'Set runNow: true and/or dryRun: true for manual runs' });
    }
    const settingId = body.settingId as string | undefined;
    if (settingId) {
      const { data: one, error: oneErr } = await admin
        .from('notification_settings')
        .select('*')
        .eq('id', settingId)
        .maybeSingle();
      if (oneErr) return res.status(500).json({ error: oneErr.message });
      if (one) list = [one as NotificationSetting];
    } else {
      const { data: latest, error: latestErr } = await admin
        .from('notification_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);
      if (latestErr) return res.status(500).json({ error: latestErr.message });
      list = (latest || []) as NotificationSetting[];
    }
  }

  if (!list.length) {
    return res.status(200).json({ message: 'No notification settings rows', processed: 0 });
  }

  const out = await executeNotificationJob(admin, list, { isCron, dryRun, runNow, force });
  return res.status(200).json(out);
}
