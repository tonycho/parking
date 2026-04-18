import type { SupabaseClient } from '@supabase/supabase-js';

export type RecipientRow = {
  phone_number: string;
  contact: string;
  license_plate: string;
  spot_label: string;
};

/** Alphanumeric spot prefix only (e.g. B, BC). */
export function sanitizePrefix(prefix: string): string {
  return prefix.replace(/[^A-Za-z0-9]/g, '').slice(0, 8) || 'B';
}

export async function loadSmsRecipients(
  admin: SupabaseClient,
  spotPrefix: string,
  parkingLotId: string | null | undefined
): Promise<RecipientRow[]> {
  const prefix = sanitizePrefix(spotPrefix);
  let spotsQuery = admin.from('parking_spots').select('id, label').like('label', `${prefix}%`);
  if (parkingLotId) {
    spotsQuery = spotsQuery.eq('parking_lot_id', parkingLotId);
  }
  const { data: spots, error: spotsErr } = await spotsQuery;
  if (spotsErr) throw spotsErr;
  if (!spots?.length) return [];

  const spotIds = spots.map((s) => s.id);
  const labelById = new Map(spots.map((s) => [s.id, s.label as string]));

  const { data: vps, error: vpsErr } = await admin
    .from('vehicle_parking_spot')
    .select('phone_number, contact, license_plate, parking_spot_id')
    .in('parking_spot_id', spotIds);
  if (vpsErr) throw vpsErr;

  const rows: RecipientRow[] = [];
  const seenPhones = new Set<string>();
  for (const v of vps || []) {
    const digits = String(v.phone_number || '').replace(/\D/g, '');
    if (digits.length < 10) continue;
    const key = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits.slice(-10);
    if (seenPhones.has(key)) continue;
    seenPhones.add(key);
    rows.push({
      phone_number: v.phone_number,
      contact: v.contact,
      license_plate: v.license_plate,
      spot_label: labelById.get(v.parking_spot_id) || '',
    });
  }
  return rows;
}

export function renderTemplate(
  template: string,
  vars: { contact: string; license_plate: string; spot: string }
): string {
  return template
    .replace(/\{\{\s*contact\s*\}\}/gi, vars.contact || '')
    .replace(/\{\{\s*license_plate\s*\}\}/gi, vars.license_plate || '')
    .replace(/\{\{\s*spot\s*\}\}/gi, vars.spot || '');
}
