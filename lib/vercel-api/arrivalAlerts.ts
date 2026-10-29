import type { SupabaseClient } from '@supabase/supabase-js';
import { DateTime } from 'luxon';
import { CHURCH_NOTIFICATION_TIMEZONE } from './churchNotification.js';
import { getRingCentralAccessToken } from './rcTokenStore.js';
import * as rc from './ringcentral.js';

export type ArrivalAlertResult = {
  status: 'sent' | 'not_flagged' | 'not_parked' | 'no_recipients';
  sent: number;
  skipped: number;
  failed: number;
};

type WelcomeTeamRecipient = { userId: string; phone: string };

function phoneKey(raw: string | null | undefined): string | null {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
  if (digits.length === 10) return digits;
  return null;
}

export function buildArrivalBody(params: {
  contact?: string | null;
  licensePlate: string;
  vehicleDescription: string;
  spotLabel?: string | null;
  parkedAt: DateTime;
  note?: string | null;
}): string {
  const { contact, licensePlate, vehicleDescription, spotLabel, parkedAt, note } = params;
  const who = contact?.trim() || 'A guest you asked to watch for';
  const where = spotLabel ? ` in spot ${spotLabel}` : '';
  const vehicle = [vehicleDescription, licensePlate].filter(Boolean).join(', ');
  const noteText = note?.trim() ? ` Note: ${note.trim()}` : '';
  return `ParkSmart welcome team: ${who} just parked${where} at ${parkedAt.toFormat('h:mm a')} (${vehicle}).${noteText}`;
}

async function loadWelcomeTeam(admin: SupabaseClient): Promise<WelcomeTeamRecipient[]> {
  const { data, error } = await admin.from('users').select('id, phone_number').eq('is_welcome_team', true);
  if (error) throw error;

  const seen = new Set<string>();
  const recipients: WelcomeTeamRecipient[] = [];
  for (const row of data || []) {
    const phone = phoneKey(row.phone_number as string | null);
    if (!phone || seen.has(phone)) continue;
    seen.add(phone);
    recipients.push({ userId: row.id as string, phone });
  }
  return recipients;
}

/**
 * Texts every welcome-team member that a flagged vehicle has parked.
 * Re-checks the flag and the parked row server-side so callers can't trigger texts for arbitrary plates.
 */
export async function sendArrivalAlerts(
  admin: SupabaseClient,
  licensePlate: string
): Promise<ArrivalAlertResult> {
  const result: ArrivalAlertResult = { status: 'sent', sent: 0, skipped: 0, failed: 0 };

  const { data: vehicle, error: vehicleErr } = await admin
    .from('vehicles')
    .select('id, license_plate, contact, make, model, color, notify_on_arrival, arrival_note')
    .eq('license_plate', licensePlate)
    .maybeSingle();
  if (vehicleErr) throw vehicleErr;
  if (!vehicle?.notify_on_arrival) return { ...result, status: 'not_flagged' };

  const { data: parked, error: parkedErr } = await admin
    .from('vehicle_parking_spot')
    .select('parking_spot_id, time_parked')
    .eq('license_plate', licensePlate)
    .order('time_parked', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (parkedErr) throw parkedErr;
  if (!parked) return { ...result, status: 'not_parked' };

  const { data: spot, error: spotErr } = await admin
    .from('parking_spots')
    .select('label')
    .eq('id', parked.parking_spot_id)
    .maybeSingle();
  if (spotErr) throw spotErr;

  const recipients = await loadWelcomeTeam(admin);
  if (!recipients.length) return { ...result, status: 'no_recipients' };

  const fromNum = process.env.RINGCENTRAL_SMS_FROM_NUMBER?.trim();
  if (!fromNum) throw new Error('RINGCENTRAL_SMS_FROM_NUMBER is not configured');

  const parkedAt = DateTime.fromISO(parked.time_parked as string).setZone(CHURCH_NOTIFICATION_TIMEZONE);
  const localDate = DateTime.now().setZone(CHURCH_NOTIFICATION_TIMEZONE).toISODate();
  const spotLabel = (spot?.label as string | undefined) ?? null;
  const text = buildArrivalBody({
    contact: vehicle.contact as string | null,
    licensePlate: vehicle.license_plate as string,
    vehicleDescription: [vehicle.color, vehicle.make, vehicle.model].filter(Boolean).join(' '),
    spotLabel,
    parkedAt,
    note: vehicle.arrival_note as string | null,
  });

  let accessToken: string | null = null;

  for (const recipient of recipients) {
    // The unique index on (license_plate, recipient_phone, local_date) is the once-per-day guard.
    const { data: claimed, error: claimErr } = await admin
      .from('arrival_alert_logs')
      .insert({
        vehicle_id: vehicle.id,
        license_plate: vehicle.license_plate,
        user_id: recipient.userId,
        recipient_phone: recipient.phone,
        spot_label: spotLabel,
        local_date: localDate,
        status: 'pending',
      })
      .select('id')
      .single();

    if (claimErr) {
      if (claimErr.code === '23505') {
        result.skipped += 1;
        continue;
      }
      throw claimErr;
    }

    try {
      accessToken ??= await getRingCentralAccessToken();
      await rc.sendSms({ accessToken, fromNumber: fromNum, toNumber: recipient.phone, text });
      await admin.from('arrival_alert_logs').update({ status: 'success' }).eq('id', claimed.id);
      result.sent += 1;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error('[arrival-alerts] SMS failed:', message);
      await admin
        .from('arrival_alert_logs')
        .update({ status: 'error', error_message: message.slice(0, 500) })
        .eq('id', claimed.id);
      result.failed += 1;
    }
  }

  return result;
}
