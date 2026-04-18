import type { SupabaseClient } from '@supabase/supabase-js';
import { DateTime } from 'luxon';
import { CronExpressionParser } from 'cron-parser';
import { CHURCH_NOTIFICATION_TIMEZONE } from './churchNotification.js';
import { getRingCentralAccessToken } from './rcTokenStore.js';
import * as rc from './ringcentral.js';
import { loadSmsRecipients, renderTemplate } from './recipients.js';

export type NotificationSetting = {
  id: string;
  enabled: boolean;
  spot_prefix: string;
  message_template: string;
  send_time: string;
  timezone: string;
  days_of_week: number[] | null;
  recurrence_type: string;
  cron_expression: string | null;
  ringcentral_from_number: string | null;
  parking_lot_id: string | null;
  last_fired_at: string | null;
  last_fired_key: string | null;
};

const WINDOW_MINUTES = 4;
const CRON_WINDOW_MS = 6 * 60 * 1000;

function parseCron(setting: NotificationSetting) {
  if (!setting.cron_expression) return null;
  return CronExpressionParser.parse(setting.cron_expression, {
    currentDate: new Date(),
    tz: 'UTC',
  });
}

function isCronDue(setting: NotificationSetting): boolean {
  try {
    const it = parseCron(setting);
    if (!it) return false;
    const prev = it.prev().toDate();
    const diff = Date.now() - prev.getTime();
    return diff >= 0 && diff < CRON_WINDOW_MS;
  } catch (e) {
    console.warn('Invalid cron expression', e);
    return false;
  }
}

function cronSlotKey(setting: NotificationSetting): string | null {
  try {
    const it = parseCron(setting);
    if (!it) return null;
    return `cron|${it.prev().toDate().toISOString()}`;
  } catch {
    return null;
  }
}

function isWeeklyDailyDue(setting: NotificationSetting): boolean {
  const dt = DateTime.now().setZone(CHURCH_NOTIFICATION_TIMEZONE);
  const parts = setting.send_time.split(':');
  const hh = parseInt(parts[0] || '0', 10);
  const mm = parseInt(parts[1] || '0', 10);
  const ss = parseInt(parts[2] || '0', 10);
  const target = dt.set({ hour: hh, minute: mm, second: ss, millisecond: 0 });
  const diffMin = Math.abs(dt.diff(target, 'minutes').minutes);
  if (diffMin > WINDOW_MINUTES) return false;

  if (setting.recurrence_type === 'daily') return true;

  const sun0 = dt.weekday === 7 ? 0 : dt.weekday;
  const days = setting.days_of_week || [];
  return days.includes(sun0);
}

function weeklyDailySlotKey(setting: NotificationSetting): string {
  const dt = DateTime.now().setZone(CHURCH_NOTIFICATION_TIMEZONE);
  return `${setting.recurrence_type}|${dt.toISODate()}|${setting.send_time}|${CHURCH_NOTIFICATION_TIMEZONE}`;
}

function isScheduleDue(setting: NotificationSetting): boolean {
  if (setting.recurrence_type === 'cron') return isCronDue(setting);
  return isWeeklyDailyDue(setting);
}

function slotKey(setting: NotificationSetting): string {
  if (setting.recurrence_type === 'cron') return cronSlotKey(setting) || 'cron|invalid';
  return weeklyDailySlotKey(setting);
}

export async function executeNotificationJob(
  admin: SupabaseClient,
  list: NotificationSetting[],
  opts: { isCron: boolean; dryRun: boolean; runNow: boolean; force: boolean }
): Promise<{ processed: number; results: Record<string, unknown>[] }> {
  const { isCron, dryRun, runNow, force } = opts;
  const results: Record<string, unknown>[] = [];

  for (const setting of list) {
    try {
      if (isCron && !setting.enabled && !force) {
        results.push({ id: setting.id, skipped: true, reason: 'disabled' });
        continue;
      }

      const skipDue = runNow || force || !isCron;
      if (!skipDue && !isScheduleDue(setting)) {
        results.push({ id: setting.id, skipped: true, reason: 'not_due' });
        continue;
      }

      const key = slotKey(setting);
      if (!skipDue && setting.last_fired_key === key) {
        results.push({ id: setting.id, skipped: true, reason: 'already_fired_slot' });
        continue;
      }

      const recipients = await loadSmsRecipients(admin, setting.spot_prefix, setting.parking_lot_id);
      const fromNum =
        setting.ringcentral_from_number?.trim() || process.env.RINGCENTRAL_SMS_FROM_NUMBER?.trim();
      if (!fromNum && !dryRun) {
        results.push({ id: setting.id, error: 'Missing from number (setting or RINGCENTRAL_SMS_FROM_NUMBER)' });
        continue;
      }

      let accessToken: string | null = null;
      if (!dryRun) {
        accessToken = await getRingCentralAccessToken();
      }

      let sent = 0;
      let failed = 0;

      for (const r of recipients) {
        const text = renderTemplate(setting.message_template, {
          contact: r.contact,
          license_plate: r.license_plate,
          spot: r.spot_label,
        });
        if (dryRun) {
          await admin.from('notification_job_logs').insert({
            notification_setting_id: setting.id,
            recipient_phone: r.phone_number,
            spot_name: r.spot_label,
            status: 'dry_run',
            error_message: null,
          });
          sent++;
          continue;
        }
        try {
          await rc.sendSms({
            accessToken: accessToken!,
            fromNumber: fromNum!,
            toNumber: r.phone_number,
            text,
          });
          await admin.from('notification_job_logs').insert({
            notification_setting_id: setting.id,
            recipient_phone: r.phone_number,
            spot_name: r.spot_label,
            status: 'success',
            error_message: null,
          });
          sent++;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          await admin.from('notification_job_logs').insert({
            notification_setting_id: setting.id,
            recipient_phone: r.phone_number,
            spot_name: r.spot_label,
            status: 'error',
            error_message: msg,
          });
          failed++;
        }
      }

      if (!dryRun && (recipients.length === 0 || sent + failed === recipients.length)) {
        await admin
          .from('notification_settings')
          .update({
            last_fired_at: new Date().toISOString(),
            last_fired_key: key,
          })
          .eq('id', setting.id);
      }

      results.push({
        id: setting.id,
        recipients: recipients.length,
        sent,
        failed,
        dryRun,
      });
    } catch (e) {
      console.error(e);
      results.push({ id: setting.id, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return { processed: list.length, results };
}
