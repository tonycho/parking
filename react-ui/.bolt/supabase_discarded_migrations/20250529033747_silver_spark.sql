-- Drop policies that depend on user_id
DROP POLICY IF EXISTS "Users can view spots in their lots" ON parking_spots;
DROP POLICY IF EXISTS "Users can manage their own parking lots" ON parking_lots;
DROP POLICY IF EXISTS "Users can manage spots in their lots" ON parking_spots;
DROP POLICY IF EXISTS "Users can create parking lots" ON parking_lots;
DROP POLICY IF EXISTS "Users can manage own parking lots" ON parking_lots;
DROP POLICY IF EXISTS "Users can manage their own vehicle parking spots" ON vehicle_parking_spot;

-- Remove user_id from parking_lots
ALTER TABLE parking_lots
DROP COLUMN user_id;

-- Remove user_id from vehicle_parking_spot
ALTER TABLE vehicle_parking_spot
DROP COLUMN user_id;

-- Remove user_id from vehicles
ALTER TABLE vehicles
DROP COLUMN user_id;

-- Update unique constraint on vehicles to only use license_plate
ALTER TABLE vehicles
DROP CONSTRAINT IF EXISTS vehicles_license_plate_user_id_key;

ALTER TABLE vehicles
ADD CONSTRAINT vehicles_license_plate_key UNIQUE (license_plate);

-- Create new policies without user_id dependency
CREATE POLICY "Public can view spots" ON parking_spots
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Public can manage spots" ON parking_spots
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can manage parking lots" ON parking_lots
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can manage vehicle parking spots" ON vehicle_parking_spot
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);