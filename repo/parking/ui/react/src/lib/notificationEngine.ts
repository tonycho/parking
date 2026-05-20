/**
 * Browser-side notification run engine.
 *
 * Replaces the Vercel serverless functions:
 *   /api/notifications/run       → executeNotificationJob()
 *   /api/notifications/preview   → previewRecipients()
 *   /api/send-reminder           → sendReminderToPhone()
 *
 * All RingCentral calls go directly from the browser.
 * All Supabase writes (logs, last_fired_at) use the anon client with the user's session.
 */

import { supabase } from './supabase';
import * as rc from './ringcentral';
import { loadSmsRecipients, renderTemplate } from './recipients';

export type NotificationSetting = {
  id: string;
  enabled: boolean;
  spot_prefix: string;
  message_template: string;
  ringcentral_from_number: string | null;
  parking_lot_id: string | null;
  last_fired_key: string | null;
};

export type RunResult = {
  id: string;
  recipients: number;
  sent: number;
  failed: number;
  dryRun: boolean;
  error?: string;
};

/** Preview: count how many recipients would receive notifications. */
export async function previewRecipients(
  spotPrefix: string,
  parkingLotId: string | null | undefined
): Promise<number> {
  const recipients = await loadSmsRecipients(spotPrefix, parkingLotId);
  return recipients.length;
}

/**
 * Run the notification job for a single setting.
 * dryRun: writes log rows with status='dry_run' but never calls RingCentral.
 */
export async function executeNotificationJob(
  setting: NotificationSetting,
  opts: { dryRun: boolean }
): Promise<RunResult> {
  const { dryRun } = opts;

  try {
    // Resolve from number (may throw if not configured)
    let resolvedFromNum: string;
    try {
      resolvedFromNum = setting.ringcentral_from_number?.trim() || rc.smsFromNumber();
    } catch (e) {
      return {
        id: setting.id,
        recipients: 0,
        sent: 0,
        failed: 0,
        dryRun,
        error: e instanceof Error ? e.message : 'Missing from number',
      };
    }

    const recipients = await loadSmsRecipients(setting.spot_prefix, setting.parking_lot_id);

    let sent = 0;
    let failed = 0;

    for (const r of recipients) {
      const text = renderTemplate(setting.message_template, {
        contact: r.contact,
        license_plate: r.license_plate,
        spot: r.spot_label,
      });

      if (dryRun) {
        await supabase.from('notification_job_logs').insert({
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
          fromNumber: resolvedFromNum,
          toNumber: r.phone_number,
          text,
        });
        await supabase.from('notification_job_logs').insert({
          notification_setting_id: setting.id,
          recipient_phone: r.phone_number,
          spot_name: r.spot_label,
          status: 'success',
          error_message: null,
        });
        sent++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await supabase.from('notification_job_logs').insert({
          notification_setting_id: setting.id,
          recipient_phone: r.phone_number,
          spot_name: r.spot_label,
          status: 'error',
          error_message: msg,
        });
        failed++;
      }
    }

    if (!dryRun && recipients.length > 0) {
      await supabase
        .from('notification_settings')
        .update({
          last_fired_at: new Date().toISOString(),
          last_fired_key: `manual|${new Date().toISOString()}`,
        })
        .eq('id', setting.id);
    }

    return { id: setting.id, recipients: recipients.length, sent, failed, dryRun };
  } catch (e) {
    return {
      id: setting.id,
      recipients: 0,
      sent: 0,
      failed: 0,
      dryRun,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Send a single ad-hoc reminder SMS to a specific phone number. */
export async function sendReminderToPhone(params: {
  phoneNumber: string;
  contact?: string;
  licensePlate?: string;
  spotLabel?: string;
  messageTemplate?: string;
}): Promise<rc.SendSmsResult> {
  const { phoneNumber, contact, licensePlate, spotLabel, messageTemplate } = params;
  const fromNumber = rc.smsFromNumber();
  const text = rc.buildReminderBody({ contact, licensePlate, spotLabel, messageTemplate });
  return rc.sendSms({ fromNumber, toNumber: phoneNumber, text });
}
