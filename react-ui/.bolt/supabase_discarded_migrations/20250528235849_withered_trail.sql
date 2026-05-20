-- Drop existing policies first
DROP POLICY IF EXISTS "Users can manage their own vehicle history" ON vehicle_history;
DROP POLICY IF EXISTS "Users can view their own vehicle history" ON vehicle_history;
DROP POLICY IF EXISTS "Users can manage their own vehicles" ON vehicles;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS vehicle_parking_spot;
DROP TABLE IF EXISTS vehicles;

-- Rename tables
ALTER TABLE vehicle_history RENAME TO vehicles;
ALTER TABLE vehicles RENAME TO vehicle_parking_spot;

-- Update foreign key references
ALTER TABLE vehicle_parking_spot 
  RENAME CONSTRAINT vehicles_parking_spot_id_fkey TO vehicle_parking_spot_parking_spot_id_fkey;
ALTER TABLE vehicle_parking_spot 
  RENAME CONSTRAINT vehicles_user_id_fkey TO vehicle_parking_spot_user_id_fkey;

-- Update indexes and constraints
ALTER INDEX vehicles_pkey RENAME TO vehicle_parking_spot_pkey;
ALTER INDEX vehicle_history_license_plate_user_id_idx RENAME TO vehicles_license_plate_user_id_idx;
ALTER INDEX vehicle_history_pkey RENAME TO vehicles_pkey;

-- Create new RLS policies for vehicles (formerly vehicle_history)
CREATE POLICY "Users can manage their own vehicles"
  ON vehicles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create new RLS policy for vehicle_parking_spot (formerly vehicles)
CREATE POLICY "Users can manage their own vehicle parking spots"
  ON vehicle_parking_spot
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);