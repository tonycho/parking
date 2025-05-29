-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own vehicles" ON vehicles;

-- Create temporary table to store data
CREATE TABLE temp_vehicle_parking_spot AS SELECT * FROM vehicles;

-- Drop original table
DROP TABLE vehicles CASCADE;

-- Create new table with desired name
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

-- Copy data back with explicit column mapping
INSERT INTO vehicle_parking_spot (
  id, contact, phone_number, license_plate, make, model, color,
  parking_spot_id, time_parked, created_at, user_id
)
SELECT 
  id, contact, phone_number, license_plate, make, model, color,
  parking_spot_id, time_parked, created_at, user_id
FROM temp_vehicle_parking_spot;

-- Drop temporary table
DROP TABLE temp_vehicle_parking_spot;

-- Enable RLS
ALTER TABLE vehicle_parking_spot ENABLE ROW LEVEL SECURITY;

-- Create new policy
CREATE POLICY "Users can manage their own vehicle parking spots"
  ON vehicle_parking_spot
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);