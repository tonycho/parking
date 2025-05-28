-- First, backup the data
CREATE TABLE temp_vehicles AS SELECT * FROM vehicles;
CREATE TABLE temp_vehicle_history AS SELECT * FROM vehicle_history;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own vehicle history" ON vehicle_history;
DROP POLICY IF EXISTS "Users can view their own vehicle history" ON vehicle_history;
DROP POLICY IF EXISTS "Users can manage their own vehicles" ON vehicles;

-- Drop existing tables
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS vehicle_history CASCADE;

-- Recreate tables with new names
CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact text NOT NULL,
  phone_number text NOT NULL,
  license_plate text NOT NULL,
  make text NOT NULL,
  model text,
  color text NOT NULL,
  user_id uuid REFERENCES users(id) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vehicle_parking_spot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact text NOT NULL,
  phone_number text NOT NULL,
  license_plate text NOT NULL,
  make text NOT NULL,
  model text,
  color text NOT NULL,
  parking_spot_id uuid REFERENCES parking_spots(id) NOT NULL,
  time_parked timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES users(id) NOT NULL
);

-- Create indexes
CREATE UNIQUE INDEX vehicles_license_plate_user_id_idx ON vehicles (license_plate, user_id);

-- Restore data
INSERT INTO vehicles 
SELECT id, contact, phone_number, license_plate, make, model, color, user_id, created_at 
FROM temp_vehicle_history;

INSERT INTO vehicle_parking_spot 
SELECT id, contact, phone_number, license_plate, make, model, color, parking_spot_id, time_parked, created_at, user_id 
FROM temp_vehicles;

-- Drop temporary tables
DROP TABLE temp_vehicles;
DROP TABLE temp_vehicle_history;

-- Enable RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_parking_spot ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own vehicles"
  ON vehicles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own vehicle parking spots"
  ON vehicle_parking_spot
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);