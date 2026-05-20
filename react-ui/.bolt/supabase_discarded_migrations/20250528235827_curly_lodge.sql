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

-- Update RLS policies for vehicles (formerly vehicle_history)
DROP POLICY IF EXISTS "Users can manage their own vehicle history" ON vehicles;
DROP POLICY IF EXISTS "Users can view their own vehicle history" ON vehicles;

CREATE POLICY "Users can manage their own vehicles"
  ON vehicles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update RLS policies for vehicle_parking_spot (formerly vehicles)
DROP POLICY IF EXISTS "Users can manage their own vehicles" ON vehicle_parking_spot;

CREATE POLICY "Users can manage their own vehicle parking spots"
  ON vehicle_parking_spot
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);