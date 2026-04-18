-- Notification SMS settings, job logs, and RingCentral OAuth token (server-only).
-- Recipient phones: vehicle_parking_spot joined to parking_spots where label matches spot_prefix.

CREATE TABLE notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT false,
  spot_prefix text NOT NULL DEFAULT 'B',
  message_template text NOT NULL DEFAULT 'Hi {{contact}}! Reminder from ParkSmart: your vehicle ({{license_plate}}) in spot {{spot}}. Second service starts soon. Thank you!',
  send_time time NOT NULL DEFAULT '10:45:00',
  timezone text NOT NULL DEFAULT 'America/New_York',
  days_of_week int[] NOT NULL DEFAULT ARRAY[0]::int[],
  recurrence_type text NOT NULL DEFAULT 'weekly' CHECK (recurrence_type IN ('daily', 'weekly', 'cron')),
  cron_expression text,
  ringcentral_from_number text,
  parking_lot_id uuid REFERENCES parking_lots(id) ON DELETE SET NULL,
  last_fired_at timestamptz,
  last_fired_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notification_job_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_setting_id uuid NOT NULL REFERENCES notification_settings(id) ON DELETE CASCADE,
  run_at timestamptz NOT NULL DEFAULT now(),
  recipient_phone text NOT NULL,
  spot_name text,
  status text NOT NULL CHECK (status IN ('success', 'error', 'skipped', 'dry_run')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_job_logs_setting_created
  ON notification_job_logs (notification_setting_id, created_at DESC);

-- OAuth refresh token storage; service role only (RLS enabled, no policies for authenticated).
CREATE TABLE ringcentral_token (
  id text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  refresh_token text,
  access_token text,
  expires_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ringcentral_token ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated read notification_settings"
  ON notification_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated insert notification_settings"
  ON notification_settings FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated update notification_settings"
  ON notification_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated delete notification_settings"
  ON notification_settings FOR DELETE TO authenticated USING (true);

CREATE POLICY "authenticated read notification_job_logs"
  ON notification_job_logs FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION set_updated_at_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at_notification_settings();

CREATE OR REPLACE FUNCTION set_updated_at_ringcentral_token()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_ringcentral_token_updated_at
  BEFORE UPDATE ON ringcentral_token
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at_ringcentral_token();

COMMENT ON TABLE ringcentral_token IS 'RingCentral OAuth tokens; rows written only via service role from Vercel API.';
