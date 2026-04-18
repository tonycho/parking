export interface Vehicle {
  id: string;
  contact: string;
  phoneNumber: string;
  licensePlate: string;
  make: string;
  model: string;
  color: string;
  parkingSpotId: string;
  timeParked: string;
}

export interface ParkingSpot {
  id: string;
  label: string; 
  status: 'available' | 'occupied';
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  rotation?: number;
  vehicleId?: string;
  priority: number;
  order: number;
}

export interface ParkingLot {
  id: string;
  name: string;
  spots: ParkingSpot[];
}

export type RecurrenceType = 'weekly' | 'daily' | 'cron';

/** Row shape for `notification_settings` (Supabase). */
export interface NotificationSettingsRow {
  id: string;
  enabled: boolean;
  spot_prefix: string;
  message_template: string;
  send_time: string;
  timezone: string;
  days_of_week: number[];
  recurrence_type: RecurrenceType;
  cron_expression: string | null;
  ringcentral_from_number: string | null;
  parking_lot_id: string | null;
  last_fired_at: string | null;
  last_fired_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationJobLogRow {
  id: string;
  notification_setting_id: string;
  run_at: string;
  recipient_phone: string;
  spot_name: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}