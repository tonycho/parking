-- Welcome team arrival alerts.
-- Vehicles flagged with notify_on_arrival trigger an SMS to every user on the welcome team
-- when they are parked (at most once per vehicle, per recipient, per Pacific day).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS is_welcome_team boolean NOT NULL DEFAULT false;

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS notify_on_arrival boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS arrival_note text;

-- The Users page lists and edits every user; previously users could only read their own row.
DROP POLICY IF EXISTS "Authenticated users can view all users" ON users;
CREATE POLICY "Authenticated users can view all users"
  ON users FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can update users" ON users;
CREATE POLICY "Authenticated users can update users"
  ON users FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS arrival_alert_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  license_plate text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  recipient_phone text NOT NULL,
  spot_label text,
  local_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'success', 'error')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_arrival_alert_logs_once_per_day
  ON arrival_alert_logs (license_plate, recipient_phone, local_date);

CREATE INDEX IF NOT EXISTS idx_arrival_alert_logs_created
  ON arrival_alert_logs (created_at DESC);

-- Rows are written only by the API (service role); signed-in users can read the history.
ALTER TABLE arrival_alert_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read arrival_alert_logs" ON arrival_alert_logs;
CREATE POLICY "authenticated read arrival_alert_logs"
  ON arrival_alert_logs FOR SELECT TO authenticated USING (true);